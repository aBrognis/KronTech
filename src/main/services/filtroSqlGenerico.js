import { col } from './sqlHelpers'

// Montagem de WHERE a partir dos filtros por coluna da aba Acesso.
// Compartilhado por todas as telas nativas (Entidade, Bancos, Naturezas
// Juridicas, Condicoes de Pagamento...). O FormBuilder tem a sua propria
// versao acoplada ao objeto `campo` (formBuilderService.buildFiltroSQL);
// esta e a versao generica, dirigida por um mapa simples de tipo.
//
// filtros: objeto { <chave_coluna>: { op, valor, valor2 } | null }
//   op:  'contains' (texto) | 'between' (numero/data) | 'eq' (exato) | 'bool'
// tiposPorColuna: { <chave_coluna>: 'texto'|'numero'|'data'|'exato'|'booleano' }
//
// Devolve { where: 'AND (...) AND (...)', params: [...] } — `where` ja comeca
// com AND (ou vazio se nao houver filtro), para concatenar num SELECT que ja
// tem um WHERE base.

const FAMILIAS = new Set(['texto', 'numero', 'data', 'exato', 'booleano'])

export function montarFiltro(filtros = {}, tiposPorColuna = {}, { alias = '' } = {}) {
  const params = []
  const conds = []
  const pref = alias ? `${alias}.` : ''

  for (const [chave, f] of Object.entries(filtros || {})) {
    if (!f) continue
    const tipo = tiposPorColuna[chave]
    if (!FAMILIAS.has(tipo)) continue
    const c = `${pref}${col(chave)}`
    const push = (v) => { params.push(v); return params.length }

    if (tipo === 'texto') {
      if (!f.valor) continue
      conds.push(`CAST(${c} AS TEXT) ILIKE $${push(`%${f.valor}%`)}`)
    } else if (tipo === 'numero') {
      const parts = []
      if (f.valor != null && f.valor !== '') parts.push(`${c} >= $${push(Number(f.valor))}`)
      if (f.valor2 != null && f.valor2 !== '') parts.push(`${c} <= $${push(Number(f.valor2))}`)
      if (parts.length) conds.push(`(${parts.join(' AND ')})`)
    } else if (tipo === 'data') {
      const parts = []
      if (f.valor) parts.push(`${c} >= $${push(f.valor)}`)
      if (f.valor2) parts.push(`${c} <= $${push(f.valor2)}`)
      if (parts.length) conds.push(`(${parts.join(' AND ')})`)
    } else if (tipo === 'booleano') {
      if (f.valor !== true && f.valor !== false) continue
      conds.push(`${c} = $${push(f.valor)}`)
    } else if (tipo === 'exato') {
      if (f.valor == null || f.valor === '' || f.valor === '__todos__') continue
      conds.push(`${c} = $${push(f.valor)}`)
    }
  }

  return {
    where: conds.length ? ' AND ' + conds.join(' AND ') : '',
    params,
  }
}

// Busca geral: ILIKE em varias colunas de texto ao mesmo tempo.
export function montarBuscaGeral(termo, colunasTexto = [], startIndex = 0, { alias = '' } = {}) {
  const t = String(termo || '').trim()
  if (!t || !colunasTexto.length) return { where: '', params: [] }
  const pref = alias ? `${alias}.` : ''
  const params = [`%${t}%`]
  const idx = startIndex + 1
  const ors = colunasTexto.map((k) => `CAST(${pref}${col(k)} AS TEXT) ILIKE $${idx}`)
  return { where: ` AND (${ors.join(' OR ')})`, params }
}
