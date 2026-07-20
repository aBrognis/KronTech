import { ipcMain, BrowserWindow, dialog, app, shell } from 'electron'
import { getConfig, saveConfig, saveSectionConfig, getConfigForFrontend, INI_PATH, getDecryptedBancoConfig } from './config'
import { readFileSync, writeFileSync, copyFileSync, unlinkSync, existsSync, mkdirSync, statSync } from 'fs'
import { join, extname, basename, dirname, relative } from 'path'

import { query, queryOne, getPool } from './db'
import { checkForUpdates, downloadUpdate, installUpdate } from './services/updater'
import * as fb from './services/formBuilderService'
import { wrap, importLog, importCancelFlags, categoriaByExt, scanDir, hashCamposSenha } from './handlers/_shared'
import { registerJanelaHandlers } from './handlers/janela'
import { registerSqlHandlers } from './handlers/sql'
import { registerAgendaHandlers } from './handlers/agenda'
import { registerDashboardHandlers } from './handlers/dashboard'
import { registerClipboardHandlers } from './handlers/clipboard'
import { registerEntidadeHandlers } from './handlers/entidade'
import { registerAuthHandlers } from './handlers/auth'

export function registerHandlers() {
  registerJanelaHandlers({ ipcMain, wrap })
  registerSqlHandlers({ ipcMain, wrap, query, queryOne, getPool })
  registerAgendaHandlers({ ipcMain, wrap, query, queryOne })
  registerDashboardHandlers({ ipcMain, wrap, query, queryOne })
  registerClipboardHandlers({ ipcMain, wrap })
  registerEntidadeHandlers({ ipcMain })
  registerAuthHandlers({ ipcMain, query, queryOne })

  // ── Arquivos ──────────────────────────────────────────────────────────────
  ipcMain.handle('arquivos:getAll', async () => {
    return query('SELECT * FROM arq_001 ORDER BY favorito DESC, dt_criacao DESC')
  })

  ipcMain.handle('arquivos:getPastas', async () => {
    const rows = await query(`SELECT DISTINCT pasta FROM arq_001 WHERE pasta <> '' ORDER BY pasta`)
    return rows.map(r => r.pasta)
  })

  ipcMain.handle('arquivos:selecionar', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Selecionar arquivo',
      properties: ['openFile'],
    })
    if (canceled || !filePaths.length) return null
    const src = filePaths[0]
    const stat = statSync(src)
    return {
      path:     src,
      nome:     basename(src),
      ext:      extname(src).toLowerCase().replace('.', ''),
      tamanho:  stat.size,
    }
  })

  ipcMain.handle('arquivos:create', async (_, d) => {
    const cfg = getConfig()
    const baseDir = cfg.Caminhos.arquivos
    const pasta   = (d.pasta || '').trim()
    const destDir = pasta ? join(baseDir, pasta) : baseDir
    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true })

    // mantém nome original; se já existir adiciona (2), (3)... igual ao Windows
    const origName = basename(d.arquivo_path_origem)
    const origExt  = extname(origName)
    const origBase = basename(origName, origExt)
    let destName   = origName
    let destPath   = join(destDir, destName)
    let counter    = 2
    while (existsSync(destPath)) {
      destName = `${origBase} (${counter})${origExt}`
      destPath = join(destDir, destName)
      counter++
    }
    copyFileSync(d.arquivo_path_origem, destPath)

    const stat = statSync(destPath)
    const row  = await queryOne(`SELECT nextval('arq_001_codigo_seq') AS next`)
    const codigo = String(row.next).padStart(3, '0')

    return queryOne(
      `INSERT INTO arq_001
         (codigo, nome, categoria, tags, pasta, arquivo_nome, arquivo_path, arquivo_ext, arquivo_tamanho, descricao, favorito)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [codigo, d.nome, d.categoria ?? '', d.tags ?? '', pasta,
       origName, destPath, extname(origName).toLowerCase().replace('.', ''),
       stat.size, d.descricao ?? '', d.favorito ?? false]
    )
  })

  ipcMain.handle('arquivos:update', async (_, d) => {
    return queryOne(
      `UPDATE arq_001
       SET nome=$1, categoria=$2, tags=$3, pasta=$4, descricao=$5, favorito=$6, dt_atualizacao=NOW()
       WHERE id=$7 RETURNING *`,
      [d.nome, d.categoria ?? '', d.tags ?? '', d.pasta ?? '', d.descricao ?? '', d.favorito ?? false, d.id]
    )
  })

  ipcMain.handle('arquivos:delete', async (_, id) => {
    const item = await queryOne('SELECT arquivo_path FROM arq_001 WHERE id=$1', [id])
    if (item?.arquivo_path && existsSync(item.arquivo_path)) {
      unlinkSync(item.arquivo_path)
    }
    await query('DELETE FROM arq_001 WHERE id=$1', [id])
    return { ok: true }
  })

  ipcMain.handle('arquivos:abrir', async (_, caminho) => {
    if (!existsSync(caminho)) return { ok: false, erro: 'Arquivo não encontrado' }
    const err = await shell.openPath(caminho)
    return err ? { ok: false, erro: err } : { ok: true }
  })

  ipcMain.handle('arquivos:toggleFav', async (_, id) => {
    return queryOne('UPDATE arq_001 SET favorito = NOT favorito WHERE id=$1 RETURNING *', [id])
  })

  // ── Importação em massa ───────────────────────────────────────────────────
  ipcMain.handle('arquivos:importarPasta', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Selecionar pasta para importar arquivos',
      properties: ['openDirectory'],
    })
    if (canceled || !filePaths.length) return { ok: false, cancelado: true }
    const pastaRaiz = filePaths[0]
    const winId = win.id
    importCancelFlags.set(winId, false)

    const send = (data) => { try { win.webContents.send('arquivos:progresso', data) } catch {} }

    try {
      send({ fase: 'escaneando', atual: 0, total: 0, arquivo: 'Escaneando arquivos...' })

      const allFiles = scanDir(pastaRaiz)
      const total    = allFiles.length

      send({ fase: 'escaneando', atual: total, total, arquivo: `${total.toLocaleString('pt-BR')} arquivos encontrados` })
      if (total === 0) { send({ fase: 'concluido', atual: 0, total: 0, inseridos: 0, ignorados: 0 }); return { ok: true, inseridos: 0, ignorados: 0 } }

      const BATCH     = 500
      let   inseridos = 0
      let   ignorados = 0

      for (let i = 0; i < allFiles.length; i += BATCH) {
        if (importCancelFlags.get(winId)) {
          send({ fase: 'cancelado', atual: i, total, inseridos, ignorados })
          return { ok: true, inseridos, ignorados, cancelado: true }
        }

        const batch = allFiles.slice(i, i + BATCH)

        // Quais caminhos já existem no banco?
        const existentes = await query('SELECT arquivo_path FROM arq_001 WHERE arquivo_path = ANY($1)', [batch])
        const existSet   = new Set(existentes.map(r => r.arquivo_path))
        const novos      = batch.filter(p => !existSet.has(p))
        ignorados += batch.length - novos.length

        if (novos.length > 0) {
          // Gera N códigos sequenciais de uma vez
          const codesRows = await query(
            `SELECT LPAD(nextval('arq_001_codigo_seq')::text, 3, '0') AS cod FROM generate_series(1, $1)`,
            [novos.length]
          )
          const codes = codesRows.map(r => r.cod)

          // Monta INSERT em lote
          const placeholders = []
          const params        = []
          novos.forEach((filePath, idx) => {
            const base    = idx * 8
            const origExt = extname(filePath).toLowerCase().replace('.', '')
            const relDir  = relative(pastaRaiz, dirname(filePath))
            const pasta   = relDir.replace(/\\/g, '/') || ''
            const nome    = basename(filePath, extname(filePath))
            let   tam     = 0
            try { tam = statSync(filePath).size } catch {}

            placeholders.push(`($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8})`)
            params.push(codes[idx], nome, pasta, basename(filePath), filePath, origExt, tam, categoriaByExt(origExt))
          })

          await query(
            `INSERT INTO arq_001 (codigo,nome,pasta,arquivo_nome,arquivo_path,arquivo_ext,arquivo_tamanho,categoria)
             VALUES ${placeholders.join(',')} ON CONFLICT DO NOTHING`,
            params
          )
          inseridos += novos.length
        }

        send({
          fase: 'importando',
          atual: Math.min(i + BATCH, total),
          total,
          arquivo: basename(batch[batch.length - 1]),
          inseridos,
          ignorados,
        })
      }

      send({ fase: 'concluido', atual: total, total, inseridos, ignorados })
      return { ok: true, inseridos, ignorados }

    } catch (err) {
      send({ fase: 'erro', erro: err.message })
      return { ok: false, erro: err.message }
    } finally {
      importCancelFlags.delete(winId)
    }
  })

  ipcMain.handle('arquivos:cancelarImport', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    importCancelFlags.set(win.id, true)
    return { ok: true }
  })

  ipcMain.handle('arquivos:lerTexto', async (_, caminho) => {
    if (!caminho || !existsSync(caminho)) return { ok: false, erro: 'Arquivo não encontrado' }
    try {
      const conteudo = readFileSync(caminho, 'utf-8')
      return { ok: true, conteudo }
    } catch (err) {
      return { ok: false, erro: err.message }
    }
  })

  // ── Criador de Telas ──────────────────────────────────────────────────────
  ipcMain.handle('fb:listarModulos',    ()              => fb.listarModulos())
  ipcMain.handle('fb:criarModulo',      (_, payload)    => fb.criarModulo(payload))
  ipcMain.handle('fb:editarModulo',     (_, id, payload)=> fb.editarModulo(id, payload))
  ipcMain.handle('fb:excluirModulo',    (_, id)         => fb.excluirModulo(id))
  ipcMain.handle('fb:listarTelas',      (_, ativas)     => fb.listarTelas(ativas))
  ipcMain.handle('fb:buscarTela',       (_, id)         => fb.buscarTela(id))
  ipcMain.handle('fb:getTelaPorSlug',   (_, slug)       => fb.getTelaPorSlug(slug))
  ipcMain.handle('fb:criarTela',        (_, payload)    => fb.criarTela(payload))
  ipcMain.handle('fb:editarTela',       (_, id, payload)=> fb.editarTela(id, payload))
  ipcMain.handle('fb:excluirTela',      (_, id)         => fb.excluirTela(id))
  ipcMain.handle('fb:inativarTela',     (_, id)         => fb.inativarTela(id))
  ipcMain.handle('fb:reativarTela',     (_, id)         => fb.reativarTela(id))
  ipcMain.handle('fb:listarRegistros',  (_, tbl, opts)  => fb.listarRegistros(tbl, opts))
  ipcMain.handle('fb:getAllRegistros',   (_, tbl)        => fb.getAllRegistros(tbl))
  ipcMain.handle('fb:inserirRegistro',  async (_, tbl, dados) => {
    const dadosHash = await hashCamposSenha(tbl, dados)
    return fb.inserirRegistro(tbl, dadosHash)
  })
  ipcMain.handle('fb:atualizarRegistro', async (_, tbl, id, d, hasTs) => {
    const dadosHash = await hashCamposSenha(tbl, d)
    return fb.atualizarRegistro(tbl, id, dadosHash, hasTs)
  })
  ipcMain.handle('fb:reordenarTelas',   (_, items)      => fb.reordenarTelas(items))
  ipcMain.handle('fb:inativarRegistro', (_, tbl, id, hasTs)     => fb.inativarRegistro(tbl, id, hasTs))
  ipcMain.handle('fb:excluirRegistro',  (_, tbl, id)            => fb.excluirRegistro(tbl, id))
  ipcMain.handle('fb:proximoCodigo',    (_, tbl, campo, padrao, seqChars) => fb.proximoCodigo(tbl, campo, padrao, seqChars))
  ipcMain.handle('fb:toggleFavorito',      (_, tbl, id, hasTs)         => fb.toggleFavorito(tbl, id, hasTs))
  ipcMain.handle('fb:listarOpcoesLookup',  (_, tbl, exibir, codigo)    => fb.listarOpcoesLookup(tbl, exibir, codigo))
  ipcMain.handle('fb:listarColunasTabela', (_, tbl)                    => fb.listarColunasTabela(tbl))
  ipcMain.handle('fb:valoresDistintos',   async (_, tbl, coluna) => {
    const rows = await query(`SELECT DISTINCT ${coluna} FROM ${tbl} WHERE ${coluna} IS NOT NULL AND ${coluna} <> '' ORDER BY ${coluna}`)
    return rows.map(r => r[coluna])
  })

  // Importação em massa para tabela do FormBuilder — sem cópia de arquivo, INSERT em lote
  ipcMain.handle('fb:importarPasta', async (e, { tbl, mapeamento, hasTs = false, seqChars = 3 }) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Selecionar pasta para importar arquivos',
      properties: ['openDirectory'],
    })
    if (canceled || !filePaths.length) return { ok: false, cancelado: true }
    const pastaRaiz = filePaths[0]
    const winId = win.id
    importCancelFlags.set(winId, false)

    const send = (data) => { try { win.webContents.send('arquivos:progresso', data) } catch {} }

    try {
      send({ fase: 'escaneando', atual: 0, total: 0, arquivo: 'Escaneando arquivos...', inseridos: 0, ignorados: 0 })

      const allFiles = scanDir(pastaRaiz)
      const total    = allFiles.length
      importLog(`scanDir encontrou ${total} arquivos em: ${pastaRaiz}`)

      send({ fase: 'escaneando', atual: total, total, arquivo: `${total.toLocaleString('pt-BR')} arquivos encontrados`, inseridos: 0, ignorados: 0 })
      if (total === 0) {
        send({ fase: 'concluido', atual: 0, total: 0, inseridos: 0, ignorados: 0 })
        return { ok: true, inseridos: 0, ignorados: 0 }
      }

      // Descobre colunas reais da tabela uma única vez
      const tblClean   = tbl.replace(/"/g, '')
      const colInfos   = await query(`SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`, [tblClean])
      const colsTabela = new Set(colInfos.map(r => r.column_name))

      importLog(`TABELA=${tbl} colunas=(${[...colsTabela].join(',')}) mapeamento=${JSON.stringify(mapeamento)}`)

      if (colsTabela.size === 0) {
        send({ fase: 'erro', atual: 0, total, inseridos: 0, ignorados: 0, erro: `Tabela "${tblClean}" não encontrada no banco. Crie a tela primeiro clicando em "Criar Tela".` })
        return { ok: false, erro: `Tabela "${tblClean}" não encontrada.` }
      }

      const colArquivo      = mapeamento.arquivo       || null
      const colNome         = mapeamento.nome          || null
      const colNomeGenerico = mapeamento.nomeGenerico  || null  // campo "nome" título — recebe basename sem ext
      const colExt          = mapeamento.ext           || null
      const colTamanho      = mapeamento.tamanho       || null
      const colPath         = mapeamento.path          || null
      const colPasta        = mapeamento.pasta         || null
      const colCodigo       = mapeamento.codigo        || null

      // Colunas que serão inseridas (filtradas pelas que existem na tabela)
      const colsUsar = [colArquivo, colNome, colNomeGenerico, colExt, colTamanho, colPath, colPasta, colCodigo]
        .filter(c => c && colsTabela.has(c))
      const tsColsUsar = hasTs ? [...colsUsar, 'criado_em', 'alterado_em'] : colsUsar

      // Sequência de código: pega o último número uma vez antes do loop
      let ultimoCodigo = 0
      if (colCodigo && colsTabela.has(colCodigo)) {
        try {
          const r = await query(`SELECT ${colCodigo} FROM ${tbl} WHERE ${colCodigo} IS NOT NULL ORDER BY id DESC LIMIT 1`)
          ultimoCodigo = r.length ? (parseInt(r[0][colCodigo]) || 0) : 0
        } catch {}
      }

      const BATCH    = 500
      let   inseridos = 0
      let   ignorados = 0

      for (let i = 0; i < allFiles.length; i += BATCH) {
        if (importCancelFlags.get(winId)) {
          send({ fase: 'cancelado', atual: i, total, inseridos, ignorados })
          return { ok: true, inseridos, ignorados, cancelado: true }
        }

        const batch = allFiles.slice(i, i + BATCH)

        // Deduplicação por nome+pasta — mesmo arquivo na mesma pasta = duplicata
        // arquivos com mesmo nome em pastas diferentes = registros distintos
        let existSet = new Set()
        if (colNome && colsTabela.has(colNome) && colPasta && colsTabela.has(colPasta)) {
          const pares = batch.map(f => `${basename(f)}||${relative(pastaRaiz, dirname(f)).replace(/\\/g, '/')}`)
          const rows  = await query(
            `SELECT ${colNome} || '||' || COALESCE(${colPasta},'') AS chave FROM ${tbl} WHERE ${colNome} = ANY($1)`,
            [batch.map(f => basename(f))]
          )
          existSet = new Set(rows.map(r => r.chave))
          var novos = batch.filter(f => !existSet.has(`${basename(f)}||${relative(pastaRaiz, dirname(f)).replace(/\\/g, '/')}`))
        } else if (colPath && colsTabela.has(colPath)) {
          const rows = await query(`SELECT ${colPath} FROM ${tbl} WHERE ${colPath} = ANY($1)`, [batch])
          existSet = new Set(rows.map(r => r[colPath]))
          var novos = batch.filter(f => !existSet.has(f))
        } else {
          var novos = batch
        }
        ignorados += batch.length - novos.length
        if (!novos.length) {
          send({ fase: 'importando', atual: Math.min(i + BATCH, total), total, arquivo: basename(batch[batch.length - 1]), inseridos, ignorados })
          continue
        }

        // Monta INSERT em lote (sem copiar arquivos — salva o path original)
        // Colunas fixas determinadas uma vez por batch
        const insertCols = [
          colArquivo      && colsTabela.has(colArquivo)      ? colArquivo      : null,
          colNome         && colsTabela.has(colNome)         ? colNome         : null,
          colNomeGenerico && colsTabela.has(colNomeGenerico) ? colNomeGenerico : null,
          colExt          && colsTabela.has(colExt)          ? colExt          : null,
          colTamanho      && colsTabela.has(colTamanho)      ? colTamanho      : null,
          colPath         && colsTabela.has(colPath)         ? colPath         : null,
          colPasta        && colsTabela.has(colPasta)        ? colPasta        : null,
          colCodigo       && colsTabela.has(colCodigo)       ? colCodigo       : null,
        ].filter(Boolean)
        const nCols = insertCols.length
        if (!nCols) { ignorados += novos.length; continue }

        const placeholders = []
        const params       = []

        for (const filePath of novos) {
          const origName    = basename(filePath)
          const origNameNoExt = origName.replace(/\.[^/.]+$/, '')  // sem extensão para campo título
          const origExt     = extname(origName).toLowerCase().replace('.', '')
          const relDir      = relative(pastaRaiz, dirname(filePath)).replace(/\\/g, '/') || ''
          let   tam         = 0
          try { tam = statSync(filePath).size } catch {}
          if (colCodigo && colsTabela.has(colCodigo)) ultimoCodigo++

          const vals = []
          if (colArquivo      && colsTabela.has(colArquivo))      vals.push(JSON.stringify({ path: filePath, nome: origName, ext: origExt, tamanho: tam }))
          if (colNome         && colsTabela.has(colNome))         vals.push(origName)
          if (colNomeGenerico && colsTabela.has(colNomeGenerico)) vals.push(origNameNoExt)
          if (colExt          && colsTabela.has(colExt))          vals.push(origExt)
          if (colTamanho      && colsTabela.has(colTamanho))      vals.push(tam)
          if (colPath         && colsTabela.has(colPath))         vals.push(filePath)
          if (colPasta        && colsTabela.has(colPasta))        vals.push(relDir)
          if (colCodigo       && colsTabela.has(colCodigo))       vals.push(String(ultimoCodigo).padStart(seqChars, '0'))

          const base = params.length
          placeholders.push(`(${vals.map((_, k) => `$${base + k + 1}`).join(', ')})`)
          params.push(...vals)
        }

        if (placeholders.length) {
          try {
            await query(
              `INSERT INTO ${tbl} (${insertCols.join(', ')}) VALUES ${placeholders.join(', ')}
               ON CONFLICT DO NOTHING`,
              params
            )
            inseridos += placeholders.length
          } catch (batchErr) {
            importLog(`BATCH ERRO em i=${i}: ${batchErr.message}`)
            importLog(`  insertCols: ${insertCols.join(', ')}`)
            importLog(`  primeiro arquivo do batch: ${novos[0]}`)
            // batch falhou — tenta arquivo por arquivo para salvar o máximo
            for (let j = 0; j < novos.length; j++) {
              try {
                const singleParams  = params.slice(j * nCols, (j + 1) * nCols)
                const singlePh      = `(${singleParams.map((_, k) => `$${k + 1}`).join(', ')})`
                await query(
                  `INSERT INTO ${tbl} (${insertCols.join(', ')}) VALUES ${singlePh} ON CONFLICT DO NOTHING`,
                  singleParams
                )
                inseridos++
              } catch (singleErr) {
                importLog(`  ARQUIVO ERRO: ${novos[j]} — ${singleErr.message}`)
                ignorados++
              }
            }
          }
        }

        send({ fase: 'importando', atual: Math.min(i + BATCH, total), total, arquivo: basename(batch[batch.length - 1]), inseridos, ignorados })
      }

      importLog(`CONCLUIDO: inseridos=${inseridos} ignorados=${ignorados} total=${total}`)
      send({ fase: 'concluido', atual: total, total, inseridos, ignorados })
      return { ok: true, inseridos, ignorados }

    } catch (err) {
      importLog(`ERRO GERAL: ${err.message}\n${err.stack}`)
      send({ fase: 'erro', erro: err.message })
      return { ok: false, erro: err.message }
    } finally {
      importCancelFlags.delete(winId)
    }
  })

  // ── Configuração (krontech.ini) ───────────────────────────────────────────
  ipcMain.handle('config:get',          ()          => getConfigForFrontend())
  ipcMain.handle('config:set',          (_, { section, key, value }) => saveConfig(section, key, value))
  ipcMain.handle('config:setSection',   (_, { section, kvs })        => saveSectionConfig(section, kvs))
  ipcMain.handle('config:getIniPath',   ()          => INI_PATH)

  ipcMain.handle('config:selecionarPasta', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Selecionar pasta de arquivos',
      properties: ['openDirectory', 'createDirectory'],
    })
    if (canceled || !filePaths.length) return null
    const pasta = filePaths[0]
    saveConfig('Caminhos', 'arquivos', pasta)
    if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true })
    return pasta
  })

  ipcMain.handle('arquivos:copiarLocal', async (_, { caminhoOrigem, nomeArquivo }) => {
    const cfg     = getConfig()
    const tempDir = cfg.Caminhos.temp || join('C:\\KronTech', 'temp')
    if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true })
    const destino = join(tempDir, nomeArquivo)
    try {
      copyFileSync(caminhoOrigem, destino)
      return { ok: true, destino }   // apenas copia, não abre
    } catch (err) {
      return { ok: false, erro: err.message }
    }
  })

  ipcMain.handle('arquivos:abrirPasta', async (_, caminhoPasta) => {
    const err = await shell.openPath(caminhoPasta)
    return err ? { ok: false, erro: err } : { ok: true }
  })

  ipcMain.handle('arquivos:lerBase64', (_e, filePath) => {
    try {
      const buf = readFileSync(filePath)
      const ext = extname(filePath).toLowerCase().replace('.', '')
      const mime = { jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', gif:'image/gif', webp:'image/webp', svg:'image/svg+xml', bmp:'image/bmp' }[ext] || 'image/jpeg'
      return { ok: true, dataUrl: `data:${mime};base64,${buf.toString('base64')}` }
    } catch (e) {
      return { ok: false, erro: e.message }
    }
  })

  // Seleção + cópia genérica para uso no FormBuilder (sem gravar no banco)
  ipcMain.handle('arquivos:selecionarECopiar', async (e, { subpasta = 'anexos', filtros = [] } = {}) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Selecionar arquivo',
      properties: ['openFile'],
      filters: filtros.length ? filtros : undefined,
    })
    if (canceled || !filePaths.length) return null
    const src     = filePaths[0]
    const stat    = statSync(src)
    const cfg     = getConfig()
    const baseDir = cfg.Caminhos?.arquivos || join(app.getPath('userData'), 'arquivos')
    const destDir = join(baseDir, subpasta)
    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true })
    const origName = basename(src)
    const origExt  = extname(origName)
    const origBase = basename(origName, origExt)
    let destName = origName
    let destPath = join(destDir, destName)
    let counter  = 1
    while (existsSync(destPath)) {
      destName = `${origBase} (${counter++})${origExt}`
      destPath = join(destDir, destName)
    }
    try {
      copyFileSync(src, destPath)
    } catch (err) {
      return { ok: false, erro: err.message }
    }
    return {
      ok:      true,
      path:    destPath,
      nome:    destName,
      ext:     origExt.toLowerCase().replace('.', ''),
      tamanho: stat.size,
    }
  })

  ipcMain.handle('arquivos:copiarClipboard', (_, caminhoArquivo) => {
    // Copia o arquivo para a área de transferência do Windows (equivalente Ctrl+C no Explorer)
    const { execSync } = require('child_process')
    const safe = caminhoArquivo.replace(/'/g, "''")
    try {
      execSync(
        `powershell -sta -NonInteractive -Command "` +
        `Add-Type -AssemblyName System.Windows.Forms; ` +
        `$col = New-Object System.Collections.Specialized.StringCollection; ` +
        `$col.Add('${safe}'); ` +
        `[System.Windows.Forms.Clipboard]::SetFileDropList($col)"`,
        { timeout: 5000 }
      )
      return { ok: true }
    } catch (err) {
      return { ok: false, erro: err.message }
    }
  })

  // ── Atualizador ──────────────────────────────────────────────────────────
  ipcMain.handle('update:check',    () => checkForUpdates().catch(e => ({ error: e.message })))
  ipcMain.handle('update:download', () => downloadUpdate().catch(e => ({ error: e.message })))
  ipcMain.handle('update:install',  () => installUpdate())
  ipcMain.handle('update:version',  () => app.getVersion())

}

