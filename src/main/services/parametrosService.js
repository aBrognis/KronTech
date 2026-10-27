import { query, queryOne } from '../db'

// Catalogo de flags de comportamento do sistema (tabela kr_parametros_001),
// editadas pela tela nativa de Parametros (menu Ferramentas).
//
// Fronteira com config.js (krontech.ini): o .ini e config de MAQUINA/
// INSTALACAO (conexao do banco, caminhos de disco, segredos cifrados por
// instalacao - nunca tocar em deploy, ver CLAUDE.md). Isto aqui e dado de
// PRODUTO, no Postgres, compartilhado por todos os usuarios daquele
// cliente. As duas coisas nao se misturam.
//
// Cache em memoria (mesmo precedente de oauthService.js `cacheAccessToken`):
// evita bater no banco a cada obter() - telas que consultam um parametro
// (ex: Agenda checando 'agenda.meet_grava_automatico') podem fazer isso com
// frequencia. Invalidado por chave a cada atualizar().
const cache = new Map() // chave -> valor tipado

function normalizarValor(tipo, valorCru) {
  if (valorCru == null) return tipo === 'booleano' ? false : valorCru
  switch (tipo) {
    case 'booleano': return valorCru === 'S' || valorCru === 'true' || valorCru === '1'
    case 'numero':   return valorCru === '' ? null : Number(valorCru)
    default:         return valorCru // texto, exato
  }
}

export async function listar({ categoria, busca } = {}) {
  const cond = ['ativo = true']
  const params = []
  if (categoria) { params.push(categoria); cond.push(`categoria = $${params.length}`) }
  if (busca && busca.trim()) {
    params.push(`%${busca.trim()}%`)
    cond.push(`(rotulo ILIKE $${params.length} OR descricao ILIKE $${params.length} OR chave ILIKE $${params.length})`)
  }
  const rows = await query(
    `SELECT * FROM kr_parametros_001 WHERE ${cond.join(' AND ')} ORDER BY categoria, id`,
    params
  )
  return rows.map((r) => ({ ...r, valor_tipado: normalizarValor(r.tipo, r.valor) }))
}

export async function listarCategorias() {
  const rows = await query(
    `SELECT DISTINCT categoria FROM kr_parametros_001 WHERE ativo = true ORDER BY categoria`
  )
  return rows.map((r) => r.categoria)
}

// Valor ja tipado (boolean/number/string), pronto pra uso direto no codigo.
// Usa o cache; se a chave nao existir ainda la, busca no banco e popula.
export async function obter(chave) {
  if (cache.has(chave)) return cache.get(chave)
  const row = await queryOne('SELECT tipo, valor FROM kr_parametros_001 WHERE chave = $1 AND ativo = true', [chave])
  const valor = row ? normalizarValor(row.tipo, row.valor) : null
  cache.set(chave, valor)
  return valor
}

export async function atualizar(id, { valor }) {
  const row = await queryOne(
    `UPDATE kr_parametros_001 SET valor = $2, alterado_em = NOW() WHERE id = $1 RETURNING *`,
    [id, valor == null ? null : String(valor)]
  )
  if (!row) throw new Error('Parâmetro não encontrado.')
  cache.delete(row.chave)
  return { ...row, valor_tipado: normalizarValor(row.tipo, row.valor) }
}
