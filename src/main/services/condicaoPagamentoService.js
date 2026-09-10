import { query, queryOne } from '../db'
import { montarFiltro } from './filtroSqlGenerico'

// CRUD de Condicoes de Pagamento + grids-filho (parcelas, formas aceitas).

// Filtros por coluna da aba Acesso (docs CLAUDE.md §4). alias 'c'.
const TIPOS_FILTRO = {
  codigo: 'texto', descricao: 'texto',
  tipo: { tipo: 'exato', multi: true }, base_prazo: { tipo: 'exato', multi: true },
  dias_uteis: 'booleano', empurrar_dia_util: 'booleano', dia_fixo_mes: 'numero',
  multa_percentual: 'numero', juros_mes_percentual: 'numero',
  desconto_percentual: 'numero', desconto_ate_dias: 'numero',
  acrescimo_parcelamento_percentual: 'numero', valor_minimo: 'numero',
  max_parcelas: 'numero',
  papel_permitido: { tipo: 'exato', multi: true }, forma_padrao: { tipo: 'exato', multi: true },
  ativo: 'booleano', criado_em: 'data',
}

const COLS = [
  'descricao', 'tipo', 'base_prazo', 'dias_uteis', 'empurrar_dia_util', 'dia_fixo_mes',
  'multa_percentual', 'juros_mes_percentual', 'desconto_percentual', 'desconto_ate_dias',
  'acrescimo_parcelamento_percentual', 'valor_minimo', 'max_parcelas', 'papel_permitido',
  'forma_padrao', 'observacoes', 'ativo',
]
const FORMAS_VALIDAS = ['boleto', 'pix', 'cartao', 'transferencia', 'dinheiro', 'cheque']

function up(v) { return typeof v === 'string' ? v.trim().toUpperCase() : v }

export async function listar({ busca, filtros } = {}) {
  const cond = []
  const params = []
  if (!(filtros && filtros.ativo != null)) cond.push('c.ativo IS DISTINCT FROM false')

  if (busca && String(busca).trim()) {
    params.push(`%${busca.trim()}%`)
    cond.push(`(c.descricao ILIKE $${params.length} OR c.codigo ILIKE $${params.length})`)
  }

  if (filtros && Object.keys(filtros).length) {
    const r = montarFiltro(filtros, TIPOS_FILTRO, { alias: 'c' })
    if (r.where) {
      const base = params.length
      cond.push(r.where.replace(/^ AND /, '').replace(/\$(\d+)/g, (_, n) => `$${base + Number(n)}`))
      params.push(...r.params)
    }
  }

  return query(
    `SELECT c.*,
       (SELECT count(*) FROM condicao_parcela_001 p WHERE p.condicao_id = c.id) AS qtd_parcelas,
       (SELECT json_agg(f.forma) FROM condicao_forma_001 f WHERE f.condicao_id = c.id) AS formas
     FROM condicao_pagamento_001 c
     ${cond.length ? 'WHERE ' + cond.join(' AND ') : ''}
     ORDER BY codigo ASC LIMIT 2000`,
    params
  )
}

export async function obter(id) {
  const cond = await queryOne('SELECT * FROM condicao_pagamento_001 WHERE id = $1', [id])
  if (!cond) return null
  const parcelas = await query('SELECT * FROM condicao_parcela_001 WHERE condicao_id = $1 ORDER BY ordem, dias', [id])
  const formasRows = await query('SELECT forma FROM condicao_forma_001 WHERE condicao_id = $1', [id])
  return { ...cond, parcelas, formas: formasRows.map(r => r.forma) }
}

async function syncParcelas(condicaoId, lista) {
  await query('DELETE FROM condicao_parcela_001 WHERE condicao_id = $1', [condicaoId])
  const parcelas = Array.isArray(lista) ? lista : []
  for (let i = 0; i < parcelas.length; i++) {
    const p = parcelas[i]
    await query(
      `INSERT INTO condicao_parcela_001 (condicao_id, ordem, dias, percentual)
       VALUES ($1, $2, $3, $4)`,
      [condicaoId, i + 1, Number(p.dias) || 0, Number(p.percentual) || 0]
    )
  }
}

async function syncFormas(condicaoId, lista) {
  await query('DELETE FROM condicao_forma_001 WHERE condicao_id = $1', [condicaoId])
  const formas = (Array.isArray(lista) ? lista : []).filter(f => FORMAS_VALIDAS.includes(f))
  for (const f of formas) {
    await query('INSERT INTO condicao_forma_001 (condicao_id, forma) VALUES ($1, $2)', [condicaoId, f])
  }
}

export async function criar(dados) {
  const d = { ...dados, descricao: up(dados.descricao) }
  const cols = COLS.filter(c => d[c] !== undefined)
  const ph = cols.map((_, i) => `$${i + 1}`)
  const row = await queryOne(
    `INSERT INTO condicao_pagamento_001 (${cols.join(', ')}, codigo)
     VALUES (${ph.join(', ')}, LPAD(nextval('condicao_pagamento_001_codigo_seq')::text, 4, '0'))
     RETURNING *`,
    cols.map(c => d[c])
  )
  await syncParcelas(row.id, d.parcelas)
  await syncFormas(row.id, d.formas)
  return obter(row.id)
}

export async function atualizar({ id, ...dados }) {
  const d = { ...dados, descricao: up(dados.descricao) }
  const cols = COLS.filter(c => d[c] !== undefined)
  if (cols.length) {
    const sets = cols.map((c, i) => `${c} = $${i + 2}`)
    await query(`UPDATE condicao_pagamento_001 SET ${sets.join(', ')}, alterado_em = NOW() WHERE id = $1`, [id, ...cols.map(c => d[c])])
  }
  await syncParcelas(id, d.parcelas)
  await syncFormas(id, d.formas)
  return obter(id)
}

export async function excluir(id) {
  await query('DELETE FROM condicao_pagamento_001 WHERE id = $1', [id])
  return { id }
}

export async function mudarAtivoLote(ids, ativo) {
  if (!Array.isArray(ids) || !ids.length) return { atualizadas: 0 }
  const rows = await query('UPDATE condicao_pagamento_001 SET ativo = $2, alterado_em = NOW() WHERE id = ANY($1::int[]) RETURNING id', [ids, ativo])
  return { atualizadas: rows.length }
}
