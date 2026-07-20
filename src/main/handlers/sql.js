import { BrowserWindow, dialog } from 'electron'
import { readFileSync, writeFileSync } from 'fs'

const SQL_PALAVRAS_PROIBIDAS = /\b(drop|delete|update|insert|alter|truncate|grant|revoke)\b/i

export function registerSqlHandlers({ ipcMain, wrap, query, queryOne, getPool }) {

  // ── Editor SQL ───────────────────────────────────────────────────────────
  ipcMain.handle('sql:execute', async (_, sql) => {
    const t0 = Date.now()
    try {
      const result = await getPool().query(sql)
      return {
        ok: true,
        data: {
          rows:     result.rows,
          fields:   (result.fields || []).map(f => f.name),
          rowCount: result.rowCount,
          command:  result.command,
        },
        ms: Date.now() - t0,
      }
    } catch (err) {
      return { ok: false, erro: err.message, ms: Date.now() - t0 }
    }
  })

  ipcMain.handle('sql:getTables', wrap(async () => {
    return query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_type DESC, table_name
    `)
  }))

  ipcMain.handle('sql:getColumns', wrap(async (_, table) => {
    return query(`
      SELECT column_name, data_type, character_maximum_length AS tamanho, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [table])
  }))

  ipcMain.handle('sql:openFile', wrap(async (e) => {
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
  }))

  ipcMain.handle('sql:saveFile', wrap(async (e, { path: filePath, content }) => {
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
  }))

  ipcMain.handle('sql:getIndexes', wrap(async (_, table) => {
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
  }))

  // ── Query genérica segura (somente SELECT) ───────────────────────────────
  ipcMain.handle('form:query', wrap(async (_, { sql, params }) => {
    const semComentarios = (sql || '').replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    const trimmed = semComentarios.trim().toLowerCase()
    if (!trimmed.startsWith('select')) throw new Error('Apenas SELECT é permitido em form:query')
    if (semComentarios.trim().replace(/;\s*$/, '').includes(';')) throw new Error('Apenas um único comando é permitido em form:query')
    if (SQL_PALAVRAS_PROIBIDAS.test(semComentarios)) throw new Error('Comando não permitido em form:query')
    return query(sql, params || [])
  }))

  // ── Exec genérico (INSERT/UPDATE/DELETE via TelaDupla) ───────────────────
  ipcMain.handle('form:exec', wrap(async (_, { sql, params }) => {
    const trimmed = (sql || '').trim().toLowerCase()
    if (trimmed.startsWith('select')) throw new Error('Use form:query para SELECT')
    return queryOne(sql, params || [])
  }))
}
