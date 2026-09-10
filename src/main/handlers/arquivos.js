import { BrowserWindow, dialog, app, shell } from 'electron'
import { readFileSync, copyFileSync, unlinkSync, existsSync, mkdirSync, statSync } from 'fs'
import { join, extname, basename, dirname, relative } from 'path'
import { execSync } from 'child_process'
import { resolverBaseAnexos } from '../config'
import { montarFiltro } from '../services/filtroSqlGenerico'

// Filtros por coluna da aba Acesso (docs CLAUDE.md §4). Sem alias (query
// numa tabela só).
const TIPOS_FILTRO_ARQ = {
  codigo: 'texto', nome: 'texto', categoria: 'texto', pasta: 'texto',
  tags: 'texto', descricao: 'texto', arquivo_nome: 'texto', arquivo_path: 'texto',
  arquivo_ext: 'exato',
  arquivo_tamanho: 'numero',
  favorito: 'booleano',
  dt_criacao: 'data', dt_atualizacao: 'data',
}

// Copia UM arquivo de origem pra baseDir/subpasta, resolvendo colisao de
// nome com sufixo (1), (2)... Devolve { ok, path, nome, ext, tamanho }.
function copiarParaAnexos(src, destDir) {
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
    tamanho: statSync(destPath).size,
  }
}

// Seleção + cópia física genérica (dialog nativo → copia pra
// baseDir/subpasta, resolve colisão de nome, não grava nada no banco — o
// chamador decide onde persistir o path retornado). Extraída para função
// exportável reaproveitada por outros módulos (ex.: anexos do Cofre de
// Senhas), mantendo o handler `arquivos:selecionarECopiar` como wrapper.
//
// `multiplos: true` liga a multiseleção no dialog e devolve um ARRAY de
// resultados (um por arquivo). Sem ele, comportamento antigo: um objeto só
// (ou null se cancelou).
export async function selecionarECopiarArquivo({ subpasta = 'anexos', filtros = [], chaveCaminho = 'arquivos', multiplos = false } = {}, win, getConfig) {
  const props = ['openFile']
  if (multiplos) props.push('multiSelections')
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: multiplos ? 'Selecionar arquivos' : 'Selecionar arquivo',
    properties: props,
    filters: filtros.length ? filtros : undefined,
  })
  if (canceled || !filePaths.length) return multiplos ? [] : null

  // Pasta-base especifica da tela (chaveCaminho) com fallback pra generica.
  const baseDir = resolverBaseAnexos(chaveCaminho)
  const destDir = join(baseDir, subpasta)
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true })

  if (multiplos) {
    return filePaths.map((src) => copiarParaAnexos(src, destDir)).filter((r) => r.ok)
  }
  return copiarParaAnexos(filePaths[0], destDir)
}

export function registerArquivosHandlers({ ipcMain, wrap, query, queryOne, getConfig, importLog, importCancelFlags, categoriaByExt, scanDir }) {

  ipcMain.handle('arquivos:getAll', wrap(async () => {
    return query('SELECT * FROM arq_001 ORDER BY favorito DESC, dt_criacao DESC')
  }))

  ipcMain.handle('arquivos:getPastas', wrap(async () => {
    const rows = await query(`SELECT DISTINCT pasta FROM arq_001 WHERE pasta <> '' ORDER BY pasta`)
    return rows.map(r => r.pasta)
  }))

  // Listagem filtrada + paginada da aba Acesso — não roda automaticamente,
  // só quando o usuário clica "Buscar" (schema fixo, não precisa do motor
  // dinâmico do FormBuilder). Também serve o modal "Pesquisa Padrão" (botão
  // Consultar), que passa campo+modo em vez dos filtros fixos de nome/
  // categoria/pasta/tags — quando campo vem preenchido, os filtros fixos são
  // ignorados e a condição é montada dinamicamente sobre a coluna escolhida.
  ipcMain.handle('arquivos:listarFiltrado', wrap(async (_, {
    nome = '', categoria = '', pasta = '', tags = '', ext = '',
    campo = '', modo = 'contendo', busca = '', filtros = null,
    pagina = 1, porPagina = 50, ordenar = 'dt_criacao', direcao = 'DESC',
  } = {}) => {
    const COLS_ORDENAVEIS = new Set(['codigo', 'nome', 'categoria', 'pasta', 'arquivo_ext', 'arquivo_tamanho', 'dt_criacao', 'dt_atualizacao'])
    const params = []
    const conds = []

    if (campo && COLS_ORDENAVEIS.has(campo) && busca.trim()) {
      // Caminho do modal "Pesquisa Padrão" (campo + modo sobre uma coluna).
      if (modo === 'iniciando')  { params.push(`${busca.trim()}%`);  conds.push(`CAST(${campo} AS TEXT) ILIKE $${params.length}`) }
      else if (modo === 'igual') { params.push(busca.trim());        conds.push(`CAST(${campo} AS TEXT) = $${params.length}`) }
      else /* contendo */        { params.push(`%${busca.trim()}%`); conds.push(`CAST(${campo} AS TEXT) ILIKE $${params.length}`) }
    } else {
      // Busca geral da aba Acesso (varre os campos de texto).
      if (!campo && busca.trim()) {
        params.push(`%${busca.trim()}%`)
        const p = params.length
        conds.push(`(nome ILIKE $${p} OR codigo ILIKE $${p} OR categoria ILIKE $${p} OR pasta ILIKE $${p} OR tags ILIKE $${p} OR descricao ILIKE $${p} OR arquivo_nome ILIKE $${p})`)
      }
      // Filtros diretos antigos (compat).
      if (nome.trim())      { params.push(`%${nome.trim()}%`);      conds.push(`nome ILIKE $${params.length}`) }
      if (categoria)         { params.push(categoria);               conds.push(`categoria = $${params.length}`) }
      if (pasta)              { params.push(pasta);                    conds.push(`pasta = $${params.length}`) }
      if (tags.trim())      { params.push(`%${tags.trim()}%`);      conds.push(`tags ILIKE $${params.length}`) }
      if (ext)                { params.push(ext);                      conds.push(`arquivo_ext = $${params.length}`) }
      // Filtros por coluna (painel novo) — docs CLAUDE.md §4.
      if (filtros && Object.keys(filtros).length) {
        const r = montarFiltro(filtros, TIPOS_FILTRO_ARQ)
        if (r.where) {
          const base = params.length
          conds.push(r.where.replace(/^ AND /, '').replace(/\$(\d+)/g, (_m, n) => `$${base + Number(n)}`))
          params.push(...r.params)
        }
      }
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
    const pag = Math.max(1, pagina)
    const porPag = Math.min(1000, Math.max(1, porPagina))
    const offset = (pag - 1) * porPag
    const colOrdem = COLS_ORDENAVEIS.has(ordenar) ? ordenar : 'dt_criacao'
    const dir = direcao === 'ASC' ? 'ASC' : 'DESC'

    const countParams = [...params]
    params.push(porPag, offset)
    const pL = params.length - 1, pO = params.length

    const [registros, total] = await Promise.all([
      query(`SELECT * FROM arq_001 ${where} ORDER BY favorito DESC, ${colOrdem} ${dir} LIMIT $${pL} OFFSET $${pO}`, params),
      queryOne(`SELECT COUNT(*) AS n FROM arq_001 ${where}`, countParams),
    ])
    const totalN = parseInt(total.n)
    return { registros, total: totalN, pagina: pag, porPagina: porPag, totalPaginas: Math.ceil(totalN / porPag) || 1, limitado: totalN > porPag }
  }))

  ipcMain.handle('arquivos:selecionar', wrap(async (e) => {
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
  }))

  ipcMain.handle('arquivos:create', wrap(async (_, d) => {
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
  }))

  ipcMain.handle('arquivos:update', wrap(async (_, d) => {
    return queryOne(
      `UPDATE arq_001
       SET nome=$1, categoria=$2, tags=$3, pasta=$4, descricao=$5, favorito=$6, dt_atualizacao=NOW()
       WHERE id=$7 RETURNING *`,
      [d.nome, d.categoria ?? '', d.tags ?? '', d.pasta ?? '', d.descricao ?? '', d.favorito ?? false, d.id]
    )
  }))

  ipcMain.handle('arquivos:delete', wrap(async (_, id) => {
    const item = await queryOne('SELECT arquivo_path FROM arq_001 WHERE id=$1', [id])
    if (item?.arquivo_path && existsSync(item.arquivo_path)) {
      unlinkSync(item.arquivo_path)
    }
    await query('DELETE FROM arq_001 WHERE id=$1', [id])
  }))

  ipcMain.handle('arquivos:abrir', async (_, caminho) => {
    if (!existsSync(caminho)) return { ok: false, erro: 'Arquivo não encontrado' }
    const err = await shell.openPath(caminho)
    return err ? { ok: false, erro: err } : { ok: true }
  })

  ipcMain.handle('arquivos:toggleFav', wrap(async (_, id) => {
    return queryOne('UPDATE arq_001 SET favorito = NOT favorito WHERE id=$1 RETURNING *', [id])
  }))

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

  ipcMain.handle('arquivos:copiarLocal', async (_, { caminhoOrigem, nomeArquivo }) => {
    const cfg     = getConfig()
    const tempDir = cfg.Caminhos.temp
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

  // "Salvar como": abre o dialog nativo de salvar e copia o arquivo de origem
  // pro destino escolhido. Generico (anexo de e-mail, arquivo do FormBuilder,
  // etc). { caminhoOrigem, nomeSugerido }.
  ipcMain.handle('arquivos:salvarComo', async (e, { caminhoOrigem, nomeSugerido }) => {
    // fromWebContents pode devolver null quando o sender e um iframe filho
    // (o leitor de e-mail renderiza o corpo num iframe). Sem uma janela-pai
    // valida o dialog abre NAO-modal e pode ficar atras da janela. Cai pro
    // getFocusedWindow / primeira janela viva como garantia.
    const win = BrowserWindow.fromWebContents(e.sender)
      || BrowserWindow.getFocusedWindow()
      || BrowserWindow.getAllWindows().find(w => !w.isDestroyed())
    if (win) win.focus()
    if (!existsSync(caminhoOrigem)) {
      return { ok: false, erro: 'Arquivo de origem não encontrado.' }
    }
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      defaultPath: nomeSugerido || basename(caminhoOrigem),
      title: 'Salvar anexo',
    })
    if (canceled || !filePath) return { ok: false, cancelado: true }
    try {
      copyFileSync(caminhoOrigem, filePath)
      return { ok: true, destino: filePath }
    } catch (err) {
      return { ok: false, erro: err.message }
    }
  })

  // "Salvar todos": um unico dialog de pasta, copia cada anexo pra la
  // resolvendo colisao de nome com sufixo (2), (3)... Recebe uma lista
  // [{ caminhoOrigem, nome }].
  ipcMain.handle('arquivos:salvarVarios', async (e, { itens = [] } = {}) => {
    const win = BrowserWindow.fromWebContents(e.sender)
      || BrowserWindow.getFocusedWindow()
      || BrowserWindow.getAllWindows().find(w => !w.isDestroyed())
    if (win) win.focus()
    const validos = itens.filter(it => it?.caminhoOrigem && existsSync(it.caminhoOrigem))
    if (!validos.length) return { ok: false, erro: 'Nenhum anexo disponível para salvar.' }
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Escolher pasta para salvar os anexos',
      properties: ['openDirectory', 'createDirectory'],
    })
    if (canceled || !filePaths.length) return { ok: false, cancelado: true }
    const destDir = filePaths[0]
    let salvos = 0
    const erros = []
    for (const it of validos) {
      const nomeBase = it.nome || basename(it.caminhoOrigem)
      const ext = extname(nomeBase)
      const semExt = basename(nomeBase, ext)
      let destName = nomeBase
      let destPath = join(destDir, destName)
      let n = 2
      while (existsSync(destPath)) {
        destName = `${semExt} (${n++})${ext}`
        destPath = join(destDir, destName)
      }
      try {
        copyFileSync(it.caminhoOrigem, destPath)
        salvos++
      } catch (err) {
        erros.push(`${nomeBase}: ${err.message}`)
      }
    }
    return { ok: salvos > 0, salvos, total: validos.length, pasta: destDir, erros }
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
  ipcMain.handle('arquivos:selecionarECopiar', async (e, opts) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    return selecionarECopiarArquivo(opts, win, getConfig)
  })

  ipcMain.handle('arquivos:copiarClipboard', (_, caminhoArquivo) => {
    // Copia o arquivo para a área de transferência do Windows (equivalente Ctrl+C no Explorer)
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
}
