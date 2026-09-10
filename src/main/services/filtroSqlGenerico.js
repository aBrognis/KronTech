import { col } from './sqlHelpers'

// Montagem de WHERE a partir dos filtros por coluna da aba Acesso.
// Compartilhado por todas as telas nativas (Entidade, Bancos, Naturezas
// Juridicas, Condicoes de Pagamento...). O FormBuilder tem a sua propria
// versao acoplada ao objeto `campo` (formBuilderService.buildFiltroSQL);
// esta e a versao generica, dirigida por um mapa simples de tipo.
//
// filtros: objeto { <chave_coluna>: filtro | null }
//   filtro:
//     texto        -> { op:'contains', valor }
//     numero/data  -> { op:'between',  valor, valor2 }
//     booleano     -> { op:'bool',     valor: true|false }
//     exato (1)    -> { op:'eq',       valor }
//     exato (multi)-> { op:'in',       valores: [...] }
//     lookup       -> { op:'in',       valores: [id, id, ...] }
//
// tiposPorColuna: { <chave>: 'texto'|'numero'|'data'|'exato'|'booleano'|'lookup'
//                            | { tipo, multi?, csv?, castArray? } }
//   forma string = tipo simples;
//   forma objeto = tipo + flags:
//     multi     -> aceita { op:'in', valores } (exato)
//     csv       -> a coluna e string com virgula (ex: papeis); usa
//                  (',' || col || ',') ILIKE '%,valor,%' por valor, com OR.
//     castArray -> 'int' (default p/ lookup) | 'text'
//
// Devolve { where: ' AND (...) AND (...)', params: [...] } — `where` ja comeca
// com AND (ou vazio), para concatenar num SELECT que ja tem um WHERE base.

const FAMILIAS = new Set(['texto', 'numero', 'data', 'exato', 'booleano', 'lookup'])

function normSpec(spec) {
  if (typeof spec === 'string') return { tipo: spec }
  return spec || {}
}

export function montarFiltro(filtros = {}, tiposPorColuna = {}, { alias = '' } = {}) {
  const params = []
  const conds = []
  const pref = alias ? `${alias}.` : ''

  for (const [chave, f] of Object.entries(filtros || {})) {
    if (!f) continue
    const spec = normSpec(tiposPorColuna[chave])
    if (!FAMILIAS.has(spec.tipo)) continue
    const c = `${pref}${col(chave)}`
    const push = (v) => { params.push(v); return params.length }

    if (spec.tipo === 'texto') {
      if (!f.valor) continue
      conds.push(`CAST(${c} AS TEXT) ILIKE $${push(`%${f.valor}%`)}`)

    } else if (spec.tipo === 'numero') {
      const parts = []
      if (f.valor != null && f.valor !== '') parts.push(`${c} >= $${push(Number(f.valor))}`)
      if (f.valor2 != null && f.valor2 !== '') parts.push(`${c} <= $${push(Number(f.valor2))}`)
      if (parts.length) conds.push(`(${parts.join(' AND ')})`)

    } else if (spec.tipo === 'data') {
      const parts = []
      if (f.valor) parts.push(`${c} >= $${push(f.valor)}`)
      if (f.valor2) parts.push(`${c} <= $${push(f.valor2)}`)
      if (parts.length) conds.push(`(${parts.join(' AND ')})`)

    } else if (spec.tipo === 'booleano') {
      if (f.valor !== true && f.valor !== false) continue
      conds.push(`${c} = $${push(f.valor)}`)

    } else if (spec.tipo === 'lookup') {
      const ids = Array.isArray(f.valores) ? f.valores.filter((v) => v != null && v !== '') : []
      if (!ids.length) continue
      const cast = spec.castArray === 'text' ? 'text' : 'int'
      const vals = cast === 'int' ? ids.map((v) => Number(v)) : ids.map((v) => String(v))
      conds.push(`${c} = ANY($${push(vals)}::${cast}[])`)

    } else if (spec.tipo === 'exato') {
      if (spec.multi) {
        const vals = Array.isArray(f.valores) ? f.valores.filter((v) => v != null && v !== '' && v !== '__todos__') : []
        if (!vals.length) continue
        if (spec.csv) {
          // coluna = string com virgula (ex: "cliente,fornecedor").
          // compara com virgulas nas pontas pra nao dar falso-positivo por
          // substring ("rep" pegaria "representante").
          const ors = vals.map((v) => `(',' || COALESCE(${c},'') || ',') ILIKE $${push(`%,${v},%`)}`)
          conds.push(`(${ors.join(' OR ')})`)
        } else {
          conds.push(`${c} = ANY($${push(vals.map(String))})`)
        }
      } else {
        if (f.valor == null || f.valor === '' || f.valor === '__todos__') continue
        conds.push(`${c} = $${push(f.valor)}`)
      }
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
