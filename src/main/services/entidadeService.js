import { existsSync, rmSync, mkdirSync, copyFileSync, statSync } from 'fs'
import { join, extname } from 'path'
import { query, queryOne, getPool } from '../db'
import { resolverBaseAnexos } from '../config'

// CRUD da Entidade completa (nivel ERP) + grids-filho.
// entidade_001 mantem o nome. Ver docs/PLANO_ENTIDADE_COMPLETA.md.

const COLS_ENTIDADE = [
  'nome', 'apelido', 'tipo_pessoa', 'cnpj', 'ie_rg', 'status', 'papeis',
  'telefone', 'celular', 'email', 'site',
  'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf',
  'foto', 'tags', 'observacoes',
  'data_nascimento', 'data_fundacao', 'porte', 'situacao_cadastral', 'natureza_juridica_id',
  'inscricao_estadual', 'inscricao_municipal', 'cnae',
  'regime_tributario', 'contribuinte_icms', 'optante_simples',
  'retem_iss', 'retem_irrf', 'retem_csll', 'retem_pis', 'retem_cofins',
  'condicao_pagamento_id', 'limite_credito', 'dia_vencimento',
  'banco_id', 'agencia', 'conta_corrente', 'pix_tipo', 'pix_chave',
  // CRM
  'origem', 'segmento', 'grupo_economico', 'data_primeiro_contato',
]
const COLS_CONTATO = ['nome', 'cargo', 'setor', 'telefone', 'celular', 'email', 'data_nascimento', 'principal', 'observacoes', 'ativo']
const COLS_ENDERECO = ['tipo', 'descricao', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'municipio_ibge', 'ponto_referencia', 'principal', 'ativo']
const COLS_MEIO = ['contato_id', 'tipo', 'valor', 'ramal', 'observacao', 'principal']
const COLS_COMERCIAL = ['vendedor_id', 'comprador_id', 'tabela_preco', 'desconto_maximo_perc', 'transportadora_id', 'frete_padrao', 'prazo_entrega_dias', 'pedido_minimo', 'regiao', 'rota_entrega', 'observacao_comercial']
const COLS_CREDITO = ['score_risco', 'status_credito', 'limite_credito', 'limite_utilizado', 'data_ultima_analise', 'analista_id', 'atraso_medio_dias', 'observacao_credito']
const COLS_VINCULO = ['entidade_rel_id', 'tipo', 'observacao']
const COLS_DOCUMENTO = ['tipo', 'numero', 'emissao', 'validade', 'anexo_id', 'observacao']

// Campos que NAO devem virar maiuscula na normalizacao. `papeis` e uma lista
// de codigos internos (cliente,fornecedor,...) e precisa bater com PAPEIS do
// front, que usa minusculo — uppercase aqui quebrava a marcacao ao reabrir.
const MINUSC = new Set(['email', 'site', 'pix_chave', 'valor', 'papeis', 'pix_tipo', 'regime_tributario'])
const MAXLEN = {
  uf: 2, cnpj: 18, ie_rg: 30, inscricao_estadual: 30, inscricao_municipal: 30,
  cnae: 120, pix_tipo: 15, numero: 20, agencia: 30, conta_corrente: 40,
  telefone: 30, celular: 30, email: 150, site: 100, cep: 100,
  porte: 80, situacao_cadastral: 120, regime_tributario: 30,
  tipo_pessoa: 20, status: 20, papeis: 255,
  apelido: 200, nome: 300, logradouro: 200, complemento: 100, bairro: 100, cidade: 100,
  origem: 40, segmento: 60, grupo_economico: 80,
  frete_padrao: 12, tabela_preco: 60, regiao: 60, rota_entrega: 60,
  score_risco: 1, status_credito: 12, descricao: 100, ponto_referencia: 150,
  ramal: 10, observacao: 200, tipo: 24,
}
const norm = (obj) => {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    let val = (typeof v === 'string' && v && !MINUSC.has(k)) ? v.toUpperCase() : v
    if (typeof val === 'string' && MAXLEN[k]) val = val.slice(0, MAXLEN[k])
    out[k] = val
  }
  return out
}
const nula = (v) => (v === '' || v === undefined ? null : v)

// ── LISTAR (aba Acesso) ─────────────────────────────────────────────────
export async function listar({ busca, papel, status, uf } = {}) {
  const cond = ['e.ativo IS DISTINCT FROM false']
  const params = []
  if (busca && String(busca).trim()) {
    params.push(`%${busca.trim()}%`)
    cond.push(`(e.nome ILIKE $${params.length} OR e.apelido ILIKE $${params.length} OR e.cnpj ILIKE $${params.length} OR e.cidade ILIKE $${params.length})`)
  }
  if (papel)  { params.push(`%${papel}%`); cond.push(`e.papeis ILIKE $${params.length}`) }
  if (status) { params.push(status);       cond.push(`e.status = $${params.length}`) }
  if (uf)     { params.push(uf);           cond.push(`e.uf = $${params.length}`) }
  return query(
    `SELECT e.*,
       (SELECT count(*) FROM entidade_contato_001 c WHERE c.entidade_id = e.id) AS qtd_contatos
     FROM entidade_001 e
     WHERE ${cond.join(' AND ')}
     ORDER BY e.nome ASC LIMIT 2000`,
    params
  )
}

// ── OBTER (tudo aninhado) ───────────────────────────────────────────────
export async function obter(id) {
  const ent = await queryOne('SELECT * FROM entidade_001 WHERE id = $1', [id])
  if (!ent) return null
  const [
    contatos, meios, enderecos, anexos, comercial, credito,
    creditoHist, interacoes, vinculos, documentos, log,
  ] = await Promise.all([
    query('SELECT * FROM entidade_contato_001 WHERE entidade_id = $1 ORDER BY principal DESC, nome', [id]),
    query('SELECT * FROM entidade_contato_meio_001 WHERE entidade_id = $1 ORDER BY contato_id NULLS FIRST, principal DESC, id', [id]),
    query('SELECT * FROM entidade_endereco_001 WHERE entidade_id = $1 ORDER BY principal DESC, tipo', [id]),
    query('SELECT * FROM entidade_anexo_001 WHERE entidade_id = $1 ORDER BY criado_em DESC', [id]),
    queryOne('SELECT * FROM entidade_comercial_001 WHERE entidade_id = $1', [id]),
    queryOne('SELECT * FROM entidade_credito_001 WHERE entidade_id = $1', [id]),
    query('SELECT * FROM entidade_credito_hist_001 WHERE entidade_id = $1 ORDER BY data DESC LIMIT 50', [id]),
    query('SELECT * FROM entidade_interacao_001 WHERE entidade_id = $1 ORDER BY data_hora DESC LIMIT 50', [id]),
    query(`SELECT v.*, r.nome AS rel_nome, r.codigo AS rel_codigo
           FROM entidade_vinculo_001 v
           LEFT JOIN entidade_001 r ON r.id = v.entidade_rel_id
           WHERE v.entidade_id = $1 ORDER BY v.tipo`, [id]),
    query('SELECT * FROM entidade_documento_001 WHERE entidade_id = $1 ORDER BY validade NULLS LAST, tipo', [id]),
    query('SELECT * FROM entidade_log_001 WHERE entidade_id = $1 ORDER BY data_hora DESC LIMIT 100', [id]),
  ])
  return {
    ...ent,
    contatos, meios, enderecos, anexos,
    comercial: comercial || {}, credito: credito || {},
    creditoHist, interacoes, vinculos, documentos, log,
  }
}

// ── Helpers de sync (diff generico de grid-filho) ──────────────────────
async function syncGrid(client, tabela, fk, entidadeId, colunas, lista, { upper } = {}) {
  const enviados = Array.isArray(lista) ? lista : []
  const idsEnviados = enviados.filter((x) => x.id).map((x) => x.id)
  if (idsEnviados.length) {
    await client.query(`DELETE FROM ${tabela} WHERE ${fk} = $1 AND id <> ALL($2::int[])`, [entidadeId, idsEnviados])
  } else {
    await client.query(`DELETE FROM ${tabela} WHERE ${fk} = $1`, [entidadeId])
  }
  const temAlterado = colunas.length >= 0 // todas as tabelas de grid tem alterado_em? nem todas
  for (const item of enviados) {
    const d = { ...item }
    if (upper) for (const k of upper) if (typeof d[k] === 'string') d[k] = d[k].toUpperCase()
    const cols = colunas.filter((k) => d[k] !== undefined)
    if (!cols.length && !item.id) continue
    if (item.id) {
      if (!cols.length) continue
      const sets = cols.map((k, i) => `${k} = $${i + 3}`)
      const setAlt = await colTemAlterado(client, tabela) ? ', alterado_em = NOW()' : ''
      await client.query(
        `UPDATE ${tabela} SET ${sets.join(', ')}${setAlt} WHERE id = $1 AND ${fk} = $2`,
        [item.id, entidadeId, ...cols.map((k) => nula(d[k]))]
      )
    } else {
      const ph = cols.map((_, i) => `$${i + 2}`)
      await client.query(
        `INSERT INTO ${tabela} (${fk}, ${cols.join(', ')}) VALUES ($1, ${ph.join(', ')})`,
        [entidadeId, ...cols.map((k) => nula(d[k]))]
      )
    }
  }
}
const _colAltCache = new Map()
async function colTemAlterado(client, tabela) {
  if (_colAltCache.has(tabela)) return _colAltCache.get(tabela)
  const r = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'alterado_em'`,
    [tabela]
  )
  const tem = r.rows.length > 0
  _colAltCache.set(tabela, tem)
  return tem
}

// upsert 1:1 por entidade_id
async function upsert1x1(client, tabela, entidadeId, colunas, dados) {
  if (!dados || typeof dados !== 'object') return
  const d = dados
  const cols = colunas.filter((k) => d[k] !== undefined)
  if (!cols.length) return
  const existe = await client.query(`SELECT id FROM ${tabela} WHERE entidade_id = $1`, [entidadeId])
  if (existe.rows.length) {
    const sets = cols.map((k, i) => `${k} = $${i + 2}`)
    await client.query(`UPDATE ${tabela} SET ${sets.join(', ')}, alterado_em = NOW() WHERE entidade_id = $1`, [entidadeId, ...cols.map((k) => nula(d[k]))])
  } else {
    const ph = cols.map((_, i) => `$${i + 2}`)
    await client.query(`INSERT INTO ${tabela} (entidade_id, ${cols.join(', ')}) VALUES ($1, ${ph.join(', ')})`, [entidadeId, ...cols.map((k) => nula(d[k]))])
  }
}

async function syncContatos(client, entidadeId, lista) {
  await syncGrid(client, 'entidade_contato_001', 'entidade_id', entidadeId, COLS_CONTATO, lista, { upper: ['nome'] })
}

// ── Auditoria ──────────────────────────────────────────────────────────
async function gravarLog(client, entidadeId, ctx, acao, campo, de, para) {
  await client.query(
    `INSERT INTO entidade_log_001 (entidade_id, usuario_id, usuario_nome, acao, campo, valor_de, valor_para)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [entidadeId, ctx?.usuarioId || null, ctx?.usuarioNome || null, acao, campo || null,
     de == null ? null : String(de), para == null ? null : String(para)]
  )
}
// diff dos campos escalares de entidade_001 (nao dos grids)
async function auditarCamposEntidade(client, entidadeId, antes, depois, ctx) {
  const IGNORAR = new Set(['id', 'codigo', 'criado_em', 'alterado_em', 'foto'])
  for (const k of Object.keys(depois)) {
    if (IGNORAR.has(k)) continue
    if (antes[k] === undefined) continue
    const a = antes[k] == null ? '' : String(antes[k])
    const b = depois[k] == null ? '' : String(depois[k])
    if (a !== b) {
      const acao = k === 'status' ? 'status' : k === 'limite_credito' ? 'limite' : 'alterou'
      await gravarLog(client, entidadeId, ctx, acao, k, a, b)
    }
  }
}

// papeis: aceita string "cliente,fornecedor" ou array; devolve string limpa
// (minusculo, so valores validos, sem repeticao). Blindagem contra lixo
// legado ("CFP", "CLIENTE,cliente") que ja corrompeu registros.
const PAPEIS_VALIDOS = new Set(['cliente', 'fornecedor', 'transportadora', 'funcionario', 'representante'])
const MAPA_LETRA_PAPEL = { c: 'cliente', f: 'fornecedor', t: 'transportadora', p: 'representante', r: 'representante' }
function limparPapeis(bruto) {
  const tokens = Array.isArray(bruto) ? bruto : String(bruto || '').split(',')
  const out = []
  for (const raw of tokens) {
    const token = String(raw).trim()
    if (!token) continue
    const lower = token.toLowerCase()
    if (PAPEIS_VALIDOS.has(lower)) { out.push(lower); continue }
    if (/^[a-z]{1,6}$/i.test(token) && token === token.toUpperCase()) {
      for (const letra of lower) if (MAPA_LETRA_PAPEL[letra]) out.push(MAPA_LETRA_PAPEL[letra])
    }
  }
  return [...new Set(out)].join(',')
}

function montarUpsert(d) {
  const dd = norm(d)
  if (dd.papeis !== undefined) dd.papeis = limparPapeis(d.papeis)
  const cols = COLS_ENTIDADE.filter((k) => dd[k] !== undefined)
  const vals = cols.map((k) => nula(dd[k]))
  return { cols, vals, dd }
}

// ── CRIAR ──────────────────────────────────────────────────────────────
export async function criar(dados, ctx) {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const { cols, vals } = montarUpsert(dados)
    const ph = cols.map((_, i) => `$${i + 1}`)
    const codRow = await client.query(`SELECT COALESCE(MAX(NULLIF(codigo,'')::int),0)+1 AS n FROM entidade_001`)
    const codigo = String(codRow.rows[0].n).padStart(4, '0')
    const ins = await client.query(
      `INSERT INTO entidade_001 (${cols.join(', ')}, codigo) VALUES (${ph.join(', ')}, $${cols.length + 1}) RETURNING id`,
      [...vals, codigo]
    )
    const id = ins.rows[0].id
    await syncContatos(client, id, dados.contatos)
    await syncGrid(client, 'entidade_endereco_001', 'entidade_id', id, COLS_ENDERECO, dados.enderecos, { upper: ['logradouro', 'bairro', 'complemento', 'cidade', 'descricao'] })
    await syncGrid(client, 'entidade_contato_meio_001', 'entidade_id', id, COLS_MEIO, dados.meios)
    await syncGrid(client, 'entidade_vinculo_001', 'entidade_id', id, COLS_VINCULO, dados.vinculos)
    await syncGrid(client, 'entidade_documento_001', 'entidade_id', id, COLS_DOCUMENTO, dados.documentos)
    await upsert1x1(client, 'entidade_comercial_001', id, COLS_COMERCIAL, dados.comercial)
    await upsert1x1(client, 'entidade_credito_001', id, COLS_CREDITO, dados.credito)
    await gravarLog(client, id, ctx, 'criou', null, null, codigo)
    await client.query('COMMIT')
    return obter(id)
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

// ── ATUALIZAR ──────────────────────────────────────────────────────────
export async function atualizar({ id, ...dados }, ctx) {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const antes = (await client.query('SELECT * FROM entidade_001 WHERE id = $1', [id])).rows[0] || {}
    const { cols, vals, dd } = montarUpsert(dados)
    if (cols.length) {
      const sets = cols.map((k, i) => `${k} = $${i + 2}`)
      await client.query(`UPDATE entidade_001 SET ${sets.join(', ')}, alterado_em = NOW() WHERE id = $1`, [id, ...vals])
      await auditarCamposEntidade(client, id, antes, dd, ctx)
    }
    await syncContatos(client, id, dados.contatos)
    await syncGrid(client, 'entidade_endereco_001', 'entidade_id', id, COLS_ENDERECO, dados.enderecos, { upper: ['logradouro', 'bairro', 'complemento', 'cidade', 'descricao'] })
    await syncGrid(client, 'entidade_contato_meio_001', 'entidade_id', id, COLS_MEIO, dados.meios)
    await syncGrid(client, 'entidade_vinculo_001', 'entidade_id', id, COLS_VINCULO, dados.vinculos)
    await syncGrid(client, 'entidade_documento_001', 'entidade_id', id, COLS_DOCUMENTO, dados.documentos)
    await upsert1x1(client, 'entidade_comercial_001', id, COLS_COMERCIAL, dados.comercial)
    await upsert1x1(client, 'entidade_credito_001', id, COLS_CREDITO, dados.credito)
    // limite_credito: fonte da verdade e entidade_credito_001; espelha em entidade_001
    if (dados.credito && dados.credito.limite_credito !== undefined) {
      await client.query('UPDATE entidade_001 SET limite_credito = $2 WHERE id = $1', [id, Number(dados.credito.limite_credito) || 0])
    }
    await client.query('COMMIT')
    return obter(id)
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

export async function excluir(id) {
  const base = resolverBaseAnexos('arquivos')
  if (base) {
    const pasta = join(base, 'entidade', String(id))
    if (existsSync(pasta)) { try { rmSync(pasta, { recursive: true, force: true }) } catch {} }
  }
  await query('DELETE FROM entidade_001 WHERE id = $1', [id])
  return { id }
}

export async function mudarStatusLote(ids, status, ctx) {
  if (!Array.isArray(ids) || !ids.length) return { atualizadas: 0 }
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const rows = await client.query('UPDATE entidade_001 SET status = $2, alterado_em = NOW() WHERE id = ANY($1::int[]) RETURNING id', [ids, status])
    for (const r of rows.rows) await gravarLog(client, r.id, ctx, 'status', 'status', null, status)
    await client.query('COMMIT')
    return { atualizadas: rows.rows.length }
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

// ── Interacao rapida (CRM) sem salvar a tela toda ──────────────────────
export async function registrarInteracao(entidadeId, dados, ctx) {
  const d = dados || {}
  const row = await queryOne(
    `INSERT INTO entidade_interacao_001
       (entidade_id, tipo, data_hora, titulo, descricao, usuario_id, contato_id, proximo_contato, resultado)
     VALUES ($1,$2, COALESCE($3, NOW()), $4,$5,$6,$7,$8,$9) RETURNING *`,
    [entidadeId, d.tipo || 'nota', d.data_hora || null, (d.titulo || '').slice(0, 150) || null,
     d.descricao || null, ctx?.usuarioId || null, d.contato_id || null, d.proximo_contato || null, d.resultado || null]
  )
  return row
}
export async function removerInteracao(id) {
  await query('DELETE FROM entidade_interacao_001 WHERE id = $1', [id])
  return { id }
}

// ── Alterar limite de credito (com historico) ─────────────────────────
export async function alterarLimite(entidadeId, { limite_novo, motivo }, ctx) {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const atual = (await client.query('SELECT limite_credito FROM entidade_credito_001 WHERE entidade_id = $1', [entidadeId])).rows[0]
    const anterior = atual ? Number(atual.limite_credito) : 0
    const novo = Number(limite_novo) || 0
    await upsert1x1(client, 'entidade_credito_001', entidadeId, ['limite_credito', 'data_ultima_analise', 'analista_id'], {
      limite_credito: novo,
      data_ultima_analise: new Date().toISOString().slice(0, 10),
      analista_id: ctx?.usuarioId || null,
    })
    await client.query('UPDATE entidade_001 SET limite_credito = $2 WHERE id = $1', [entidadeId, novo])
    await client.query(
      `INSERT INTO entidade_credito_hist_001 (entidade_id, limite_anterior, limite_novo, motivo, usuario_id)
       VALUES ($1,$2,$3,$4,$5)`,
      [entidadeId, anterior, novo, (motivo || '').slice(0, 200) || null, ctx?.usuarioId || null]
    )
    await gravarLog(client, entidadeId, ctx, 'limite', 'limite_credito', anterior, novo)
    await client.query('COMMIT')
    return obter(entidadeId)
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

// ── Documentos vencendo (dashboard / reminder) ────────────────────────
export async function documentosVencendo({ dias = 30 } = {}) {
  return query(
    `SELECT d.*, e.nome AS entidade_nome, e.codigo AS entidade_codigo
     FROM entidade_documento_001 d
     JOIN entidade_001 e ON e.id = d.entidade_id
     WHERE d.validade IS NOT NULL
       AND d.validade <= (CURRENT_DATE + ($1 || ' days')::interval)
     ORDER BY d.validade ASC`,
    [dias]
  )
}

// ── Anexos ──────────────────────────────────────────────────────────────
export async function adicionarAnexo(entidadeId, { origemPath, categoria, observacoes }) {
  const base = resolverBaseAnexos('arquivos')
  const pasta = join(base, 'entidade', String(entidadeId))
  if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true })
  const nomeOriginal = origemPath.split(/[\\/]/).pop()
  const destino = join(pasta, `${Date.now()}_${nomeOriginal}`)
  copyFileSync(origemPath, destino)
  const { size } = statSync(destino)
  const ext = extname(destino).toLowerCase().replace('.', '')
  const mime = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }[ext] || 'application/octet-stream'
  const row = await queryOne(
    `INSERT INTO entidade_anexo_001 (entidade_id, nome_original, caminho, content_type, tamanho_bytes, categoria, observacoes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [entidadeId, nomeOriginal, destino, mime, size, categoria || 'outro', observacoes || '']
  )
  return row
}

export async function removerAnexo(anexoId) {
  const row = await queryOne('SELECT caminho FROM entidade_anexo_001 WHERE id = $1', [anexoId])
  if (row?.caminho && existsSync(row.caminho)) { try { rmSync(row.caminho) } catch {} }
  await query('DELETE FROM entidade_anexo_001 WHERE id = $1', [anexoId])
  return { id: anexoId }
}

// ── Lupa unica de entidade (Viagens, Documentos, abas Comercial/Vinculos) ──
export async function buscarLookup({ busca, modo, papel } = {}) {
  const params = []
  const cond = ['ativo IS DISTINCT FROM false']
  if (busca && String(busca).trim()) {
    const b = busca.trim()
    const termo = modo === 'iniciando' ? `${b}%` : modo === 'igual' ? b : `%${b}%`
    params.push(termo)
    cond.push(`(nome ILIKE $${params.length} OR apelido ILIKE $${params.length} OR cnpj ILIKE $${params.length})`)
  }
  if (papel) { params.push(`%${papel}%`); cond.push(`papeis ILIKE $${params.length}`) }
  const rows = await query(
    `SELECT id, codigo, nome, apelido, cnpj, cidade, uf
     FROM entidade_001 WHERE ${cond.join(' AND ')} ORDER BY nome LIMIT 200`,
    params
  )
  return { registros: rows, total: rows.length }
}
