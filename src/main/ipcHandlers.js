import { ipcMain, BrowserWindow, dialog, app, shell, clipboard } from 'electron'
import { getConfig, saveConfig, saveSectionConfig, getConfigForFrontend, INI_PATH, getDecryptedBancoConfig } from './config'
import { readFileSync, writeFileSync, copyFileSync, unlinkSync, existsSync, mkdirSync, statSync, readdirSync } from 'fs'
import { join, extname, basename, dirname, relative } from 'path'

import { query, queryOne, getPool } from './db'
import { checkForUpdates, downloadUpdate, installUpdate } from './updater'
import * as fb from './formBuilderService'

let _designerWin = null

function createDesignerWindow() {
  if (_designerWin && !_designerWin.isDestroyed()) {
    _designerWin.focus()
    return
  }
  _designerWin = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1000, minHeight: 700,
    show: false, frame: false, titleBarStyle: 'hidden',
    backgroundColor: '#0A0A0A',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false, contextIsolation: true,
    },
  })
  _designerWin.on('ready-to-show', () => { _designerWin.show(); _designerWin.maximize() })
  _designerWin.on('closed', () => { _designerWin = null })
  _designerWin.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })
  _designerWin.webContents.on('before-input-event', (_ev, input) => {
    if (input.type === 'keyDown' && input.code === 'F12') {
      _designerWin.webContents.isDevToolsOpened()
        ? _designerWin.webContents.closeDevTools()
        : _designerWin.webContents.openDevTools({ mode: 'undocked' })
    }
  })
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    _designerWin.loadURL(process.env['ELECTRON_RENDERER_URL'] + '?mode=designer')
  } else {
    _designerWin.loadFile(join(__dirname, '../renderer/index.html'), { query: { mode: 'designer' } })
  }
}

export function registerHandlers() {

  // ── Controles da janela ──────────────────────────────────────────────────
  ipcMain.handle('win:minimize',    (e) => BrowserWindow.fromWebContents(e.sender)?.minimize())
  ipcMain.handle('designer:open',   () => createDesignerWindow())
  ipcMain.handle('win:maximize',    (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    win?.isMaximized() ? win.unmaximize() : win.maximize()
  })
  ipcMain.handle('win:close',       (e) => BrowserWindow.fromWebContents(e.sender)?.close())
  ipcMain.handle('win:isMaximized', (e) => BrowserWindow.fromWebContents(e.sender)?.isMaximized() ?? false)

  // ── Editor SQL ───────────────────────────────────────────────────────────
  ipcMain.handle('sql:execute', async (_, sql) => {
    const t0 = Date.now()
    try {
      const result = await getPool().query(sql)
      return {
        ok:       true,
        rows:     result.rows,
        fields:   (result.fields || []).map(f => f.name),
        rowCount: result.rowCount,
        command:  result.command,
        ms:       Date.now() - t0,
      }
    } catch (err) {
      return { ok: false, error: err.message, ms: Date.now() - t0 }
    }
  })

  ipcMain.handle('sql:getTables', async () => {
    return query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_type DESC, table_name
    `)
  })

  ipcMain.handle('sql:getColumns', async (_, table) => {
    return query(`
      SELECT column_name, data_type, character_maximum_length AS tamanho, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [table])
  })

  ipcMain.handle('sql:openFile', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Abrir arquivo SQL',
      filters: [
        { name: 'SQL', extensions: ['sql', 'txt'] },
        { name: 'Todos os arquivos', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })
    if (canceled || !filePaths.length) return null
    const filePath = filePaths[0]
    const content = readFileSync(filePath, 'utf-8')
    return { path: filePath, content }
  })

  ipcMain.handle('sql:saveFile', async (e, { path: filePath, content }) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    let savePath = filePath
    if (!savePath) {
      const { canceled, filePath: fp } = await dialog.showSaveDialog(win, {
        title: 'Salvar arquivo SQL',
        defaultPath: 'query.sql',
        filters: [
          { name: 'SQL', extensions: ['sql'] },
          { name: 'Todos os arquivos', extensions: ['*'] },
        ],
      })
      if (canceled || !fp) return null
      savePath = fp
    }
    writeFileSync(savePath, content, 'utf-8')
    return savePath
  })

  ipcMain.handle('sql:getIndexes', async (_, table) => {
    return query(`
      SELECT
        i.relname                           AS indexname,
        ix.indisunique                      AS unico,
        ix.indisprimary                     AS primario,
        string_agg(a.attname, ', ' ORDER BY a.attnum) AS colunas
      FROM pg_index ix
      JOIN pg_class t  ON t.oid = ix.indrelid
      JOIN pg_class i  ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public' AND t.relname = $1
      GROUP BY i.relname, ix.indisunique, ix.indisprimary
      ORDER BY ix.indisprimary DESC, i.relname
    `, [table])
  })

  // ── Agenda ────────────────────────────────────────────────────────────────
  ipcMain.handle('agenda:getByMonth', async (_, { mes, ano }) => {
    return query(`
      SELECT a.*
      FROM age_001 a
      WHERE EXTRACT(MONTH FROM a.dt_evento) = $1
        AND EXTRACT(YEAR  FROM a.dt_evento) = $2
      ORDER BY a.dt_evento, a.hr_inicio NULLS LAST
    `, [mes, ano])
  })

  ipcMain.handle('agenda:create', async (_, d) => {
    const row = await queryOne(`SELECT nextval('age_001_codigo_seq') AS next`)
    const codigo = String(row.next).padStart(3, '0')
    return queryOne(`
      INSERT INTO age_001 (titulo, categoria, dt_evento, hr_inicio, hr_fim, descricao, status, lembrete, min_lembrete, codigo)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [d.titulo, d.categoria ?? 'Tarefa', d.dt_evento ?? null, d.hr_inicio || null, d.hr_fim || null,
        d.descricao ?? '', d.status ?? 'Pendente', d.lembrete ?? false, d.min_lembrete ?? 30, codigo])
  })

  ipcMain.handle('agenda:update', async (_, d) => {
    return queryOne(`
      UPDATE age_001
      SET titulo=$1, categoria=$2, dt_evento=$3, hr_inicio=$4, hr_fim=$5,
          descricao=$6, status=$7, lembrete=$8, min_lembrete=$9
      WHERE id=$10 RETURNING *
    `, [d.titulo, d.categoria, d.dt_evento ?? null, d.hr_inicio || null, d.hr_fim || null,
        d.descricao ?? '', d.status, d.lembrete ?? false, d.min_lembrete ?? 30, d.id])
  })

  ipcMain.handle('agenda:delete', async (_, id) => {
    await query('DELETE FROM age_001 WHERE id=$1', [id])
    return { ok: true }
  })

  // ── Dashboard Widgets ─────────────────────────────────────────────────────
  ipcMain.handle('dash:getAll', async () => {
    return query('SELECT * FROM dash_001 ORDER BY grid_y, grid_x, id')
  })

  ipcMain.handle('dash:create', async (_, d) => {
    return queryOne(
      `INSERT INTO dash_001 (titulo, tipo, sql_query, icone, icone_lucide, cor, tamanho, intervalo, posicao, grid_x, grid_y, grid_w, grid_h)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [d.titulo, d.tipo, d.sql_query, d.icone ?? 'bar-chart', d.icone_lucide ?? null,
       d.cor ?? '#FF6B2B', d.tamanho ?? 'pequeno', d.intervalo ?? 0,
       d.posicao ?? 0, d.grid_x ?? 0, d.grid_y ?? 0, d.grid_w ?? 3, d.grid_h ?? 4]
    )
  })

  ipcMain.handle('dash:update', async (_, d) => {
    return queryOne(
      `UPDATE dash_001 SET titulo=$1, tipo=$2, sql_query=$3, icone=$4, icone_lucide=$5, cor=$6,
         tamanho=$7, intervalo=$8, posicao=$9, grid_x=$10, grid_y=$11, grid_w=$12, grid_h=$13
       WHERE id=$14 RETURNING *`,
      [d.titulo, d.tipo, d.sql_query, d.icone ?? 'bar-chart', d.icone_lucide ?? null,
       d.cor ?? '#FF6B2B', d.tamanho ?? 'pequeno', d.intervalo ?? 0,
       d.posicao ?? 0, d.grid_x ?? 0, d.grid_y ?? 0, d.grid_w ?? 3, d.grid_h ?? 4, d.id]
    )
  })

  ipcMain.handle('dash:updateLayout', async (_, layouts) => {
    for (const item of layouts) {
      await query(
        `UPDATE dash_001 SET grid_x=$1, grid_y=$2, grid_w=$3, grid_h=$4 WHERE id=$5`,
        [item.x, item.y, item.w, item.h, item.i]
      )
    }
    return { ok: true }
  })

  ipcMain.handle('dash:delete', async (_, id) => {
    await query('DELETE FROM dash_001 WHERE id=$1', [id])
    return { ok: true }
  })


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
  const importCancelFlags = new Map()

  function categoriaByExt(ext) {
    const map = {
      fr3: 'Relatório',  rpt: 'Relatório',
      pdf: 'Contrato',
      doc: 'Manual',     docx: 'Manual',    odt: 'Manual',
      xls: 'Financeiro', xlsx: 'Financeiro', csv: 'Financeiro',
      jpg: 'Imagem',     jpeg: 'Imagem',     png: 'Imagem',
      gif: 'Imagem',     bmp: 'Imagem',      webp: 'Imagem',
      sql: 'Script',     pas: 'Script',      dpr: 'Script',
      txt: 'Script',     ini: 'Script',
      ppt: 'Apresentação', pptx: 'Apresentação',
    }
    return map[ext.toLowerCase()] || 'Outro'
  }

  function scanDir(dir) {
    const files = []
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue
        const full = join(dir, entry.name)
        try {
          if (entry.isDirectory()) files.push(...scanDir(full))
          else if (entry.isFile()) files.push(full)
        } catch { /* sem permissão — pula */ }
      }
    } catch { /* sem permissão — pula */ }
    return files
  }

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
  ipcMain.handle('fb:inserirRegistro',  (_, tbl, dados) => fb.inserirRegistro(tbl, dados))
  ipcMain.handle('fb:atualizarRegistro',(_, tbl, id, d, hasTs) => fb.atualizarRegistro(tbl, id, d, hasTs))
  ipcMain.handle('fb:reordenarTelas',   (_, items)      => fb.reordenarTelas(items))
  ipcMain.handle('fb:inativarRegistro', (_, tbl, id, hasTs)     => fb.inativarRegistro(tbl, id, hasTs))
  ipcMain.handle('fb:proximoCodigo',    (_, tbl, campo, padrao, seqChars) => fb.proximoCodigo(tbl, campo, padrao, seqChars))
  ipcMain.handle('fb:toggleFavorito',      (_, tbl, id, hasTs)         => fb.toggleFavorito(tbl, id, hasTs))
  ipcMain.handle('fb:listarOpcoesLookup',  (_, tbl, exibir, codigo)    => fb.listarOpcoesLookup(tbl, exibir, codigo))
  ipcMain.handle('fb:listarColunasTabela', (_, tbl)                    => fb.listarColunasTabela(tbl))
  ipcMain.handle('fb:valoresDistintos',   async (_, tbl, coluna) => {
    const rows = await query(`SELECT DISTINCT ${coluna} FROM ${tbl} WHERE ${coluna} IS NOT NULL AND ${coluna} <> '' ORDER BY ${coluna}`)
    return rows.map(r => r[coluna])
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

  // ── Clipboard ────────────────────────────────────────────────────────────────
  ipcMain.handle('clipboard:write', (_e, texto) => {
    clipboard.writeText(String(texto ?? ''))
    return true
  })
  ipcMain.handle('clipboard:read', () => clipboard.readText())

  // ── Entidade — consulta CNPJ e CEP ───────────────────────────────────────
  ipcMain.handle('entidade:buscarCnpj', async (_e, cnpj) => {
    const digits = String(cnpj ?? '').replace(/\D/g, '')
    if (digits.length !== 14) return { ok: false, erro: 'CNPJ deve ter 14 dígitos.' }
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
      if (!res.ok) return { ok: false, erro: res.status === 404 ? 'CNPJ não encontrado na Receita Federal.' : `Erro ${res.status}` }
      const data = await res.json()
      return { ok: true, data }
    } catch (e) {
      return { ok: false, erro: 'Sem conexão ou serviço indisponível.' }
    }
  })

  ipcMain.handle('entidade:buscarCep', async (_e, cep) => {
    const digits = String(cep ?? '').replace(/\D/g, '')
    if (digits.length !== 8) return { ok: false, erro: 'CEP deve ter 8 dígitos.' }
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      if (!res.ok) return { ok: false, erro: `Erro ${res.status}` }
      const data = await res.json()
      if (data.erro) return { ok: false, erro: 'CEP não encontrado.' }
      return { ok: true, data }
    } catch (e) {
      return { ok: false, erro: 'Sem conexão ou serviço indisponível.' }
    }
  })

  // ── Autenticação ─────────────────────────────────────────────────────────
  ipcMain.handle('auth:login', async (_, usuario, senha) => {
    try {
      const row = await queryOne(
        `SELECT id, usuario, nome, perfil, senha_hash FROM kr_usuarios WHERE usuario=$1 AND ativo=TRUE`,
        [String(usuario).toLowerCase().trim()]
      )
      if (!row) return { ok: false, erro: 'Usuário não encontrado ou inativo.' }
      if (String(senha) !== String(row.senha_hash)) return { ok: false, erro: 'Senha incorreta.' }
      return {
        ok: true,
        user: { id: row.id, usuario: row.usuario, nome: row.nome, perfil: row.perfil },
      }
    } catch (e) {
      return { ok: false, erro: 'Erro interno: ' + e.message }
    }
  })

}

