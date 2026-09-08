import { query } from '../db'

// Autocomplete de municipios (IBGE). Busca por prefixo do nome,
// case/acento-insensitive. Devolve ate 20, formato pronto pra exibir
// ("Gaspar - SC").

export function registerMunicipioHandlers({ ipcMain, wrap }) {
  ipcMain.handle('municipio:buscar', wrap(async (_e, termo) => {
    const t = String(termo || '').trim()
    if (t.length < 2) return []
    const rows = await query(
      `SELECT codigo_ibge, nome, uf, nome_uf
       FROM municipio_001
       WHERE lower(unaccent(nome)) LIKE lower(unaccent($1)) || '%'
       ORDER BY nome, uf
       LIMIT 20`,
      [t]
    )
    return rows
  }))
}
