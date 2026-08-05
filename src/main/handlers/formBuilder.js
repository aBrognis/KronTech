import { BrowserWindow, dialog } from 'electron'
import { extname, basename, dirname, relative } from 'path'
import { statSync } from 'fs'
import * as fb from '../services/formBuilderService'

export function registerFormBuilderHandlers({ ipcMain, wrap, query, hashCamposSenha, importLog, importCancelFlags, categoriaByExt, scanDir }) {

  // ── Módulos ───────────────────────────────────────────────────────────────
  ipcMain.handle('fb:listarModulos', wrap(()               => fb.listarModulos()))
  ipcMain.handle('fb:criarModulo',   wrap((_, payload)     => fb.criarModulo(payload)))
  ipcMain.handle('fb:editarModulo',  wrap((_, id, payload) => fb.editarModulo(id, payload)))
  ipcMain.handle('fb:excluirModulo', wrap((_, id)          => fb.excluirModulo(id)))

  // ── Telas ─────────────────────────────────────────────────────────────────
  ipcMain.handle('fb:listarTelas',    wrap((_, ativas)      => fb.listarTelas(ativas)))
  ipcMain.handle('fb:buscarTela',     wrap((_, id)          => fb.buscarTela(id)))
  ipcMain.handle('fb:getTelaPorSlug', wrap((_, slug)        => fb.getTelaPorSlug(slug)))
  ipcMain.handle('fb:criarTela',      wrap((_, payload)     => fb.criarTela(payload)))
  ipcMain.handle('fb:editarTela',     wrap((_, id, payload) => fb.editarTela(id, payload)))
  ipcMain.handle('fb:excluirTela',    wrap((_, id)          => fb.excluirTela(id)))
  ipcMain.handle('fb:inativarTela',   wrap((_, id)          => fb.inativarTela(id)))
  ipcMain.handle('fb:reativarTela',   wrap((_, id)          => fb.reativarTela(id)))
  ipcMain.handle('fb:reordenarTelas', wrap((_, items)       => fb.reordenarTelas(items)))

  // ── Registros ─────────────────────────────────────────────────────────────
  ipcMain.handle('fb:listarRegistros',  wrap((_, tbl, opts) => fb.listarRegistros(tbl, opts)))
  ipcMain.handle('fb:listarRegistrosFiltrado', wrap((_, tbl, opts) => fb.listarRegistrosFiltrado(tbl, opts)))
  ipcMain.handle('fb:getAllRegistros',  wrap((_, tbl)       => fb.getAllRegistros(tbl)))
  ipcMain.handle('fb:inserirRegistro',  wrap(async (_, tbl, dados) => {
    const dadosHash = await hashCamposSenha(tbl, dados)
    return fb.inserirRegistro(tbl, dadosHash)
  }))
  ipcMain.handle('fb:atualizarRegistro', wrap(async (_, tbl, id, d, hasTs) => {
    const dadosHash = await hashCamposSenha(tbl, d)
    return fb.atualizarRegistro(tbl, id, dadosHash, hasTs)
  }))
  ipcMain.handle('fb:inativarRegistro', wrap((_, tbl, id, hasTs) => fb.inativarRegistro(tbl, id, hasTs)))
  ipcMain.handle('fb:excluirRegistro',  wrap((_, tbl, id)        => fb.excluirRegistro(tbl, id)))
  ipcMain.handle('fb:proximoCodigo',    wrap((_, tbl, campo, padrao, seqChars) => fb.proximoCodigo(tbl, campo, padrao, seqChars)))
  ipcMain.handle('fb:toggleFavorito',      wrap((_, tbl, id, hasTs)      => fb.toggleFavorito(tbl, id, hasTs)))
  ipcMain.handle('fb:listarOpcoesLookup',  wrap((_, tbl, exibir, codigo) => fb.listarOpcoesLookup(tbl, exibir, codigo)))
  ipcMain.handle('fb:listarColunasTabela', wrap((_, tbl)                 => fb.listarColunasTabela(tbl)))
  ipcMain.handle('fb:valoresDistintos', wrap((_, tbl, coluna) => fb.valoresDistintos(tbl, coluna)))

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
}
