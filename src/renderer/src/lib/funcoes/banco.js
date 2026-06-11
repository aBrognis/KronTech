import { mostrarAlerta } from './ui.js'

// Escapa valores para SQL (uso interno neste app desktop pessoal)
function _esc(val) {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'number') return isFinite(val) ? String(val) : 'NULL'
  if (val instanceof Date) return `'${val.toISOString()}'`
  if (Array.isArray(val)) return `ARRAY[${val.map(_esc).join(',')}]`
  return `'${String(val).replace(/'/g, "''")}'`
}

function _buildWhere(filtros = {}) {
  const entries = Object.entries(filtros).filter(([, v]) => v !== undefined)
  if (!entries.length) return ''
  return 'WHERE ' + entries.map(([k, v]) => `${k} = ${_esc(v)}`).join(' AND ')
}

export async function executarSQL(sql) {
  const res = await window.api.sql.execute(sql)
  if (!res.ok) throw new Error(res.error ?? 'Erro desconhecido')
  return res
}

export async function buscar(tabela, filtros = {}) {
  try {
    const res = await executarSQL(`SELECT * FROM ${tabela} ${_buildWhere(filtros)}`)
    return res.rows ?? []
  } catch (err) {
    mostrarAlerta(`Erro ao buscar em ${tabela}: ${err.message}`, 'erro')
    return []
  }
}

export async function inserir(tabela, dados) {
  try {
    const cols = Object.keys(dados).join(', ')
    const vals = Object.values(dados).map(_esc).join(', ')
    const res = await executarSQL(`INSERT INTO ${tabela} (${cols}) VALUES (${vals}) RETURNING *`)
    return res.rows?.[0] ?? null
  } catch (err) {
    mostrarAlerta(`Erro ao inserir em ${tabela}: ${err.message}`, 'erro')
    return null
  }
}

export async function atualizar(tabela, dados, filtros = {}) {
  try {
    const set = Object.entries(dados).map(([k, v]) => `${k} = ${_esc(v)}`).join(', ')
    const res = await executarSQL(`UPDATE ${tabela} SET ${set} ${_buildWhere(filtros)} RETURNING *`)
    return res.rows ?? []
  } catch (err) {
    mostrarAlerta(`Erro ao atualizar ${tabela}: ${err.message}`, 'erro')
    return []
  }
}

export async function deletar(tabela, filtros = {}) {
  try {
    if (!Object.keys(filtros).length) throw new Error('deletar() requer ao menos um filtro')
    const res = await executarSQL(`DELETE FROM ${tabela} ${_buildWhere(filtros)}`)
    return res.rowCount ?? 0
  } catch (err) {
    mostrarAlerta(err.message, 'erro')
    return 0
  }
}
