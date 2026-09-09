import bcrypt from 'bcrypt'
import { query, queryOne } from '../db'
import { montarFiltro } from './filtroSqlGenerico'

// CRUD nativo da tela de Usuário (usuario_001). Tabela unica, sem
// grids-filho — bem mais simples que entidadeService. Mesmo padrao de
// service proprio + handlers via wrap().
//
// A tela FormBuilder de usuario_001 continua existindo em kr_telas_001
// (inacessivel pela navegacao, igual a Entidade), so pra nao quebrar nada
// que ainda dependa dela. O login (auth.js) e a lupa de consultores
// (viagens.js) foram desacoplados: referenciam as colunas login/senha
// direto, que sao fixas no schema.

const COLS = [
  'nome', 'status', 'foto', 'login', 'email', 'senha',
  'telefone', 'setor', 'cargo',
  'perm_cadastros', 'perm_financeiro', 'perm_relatorios', 'perm_config',
  'observacoes', 'ativo', 'favorito',
]

// Campos que NAO viram maiuscula. login e email vao pra minusculo
// explicitamente (tratado abaixo); senha e hash.
const MINUSC = new Set(['login', 'email', 'senha', 'foto'])
const MAXLEN = {
  nome: 200, status: 200, foto: 100, login: 100, email: 150,
  telefone: 30, setor: 100, cargo: 100,
  perm_cadastros: 100, perm_financeiro: 100, perm_relatorios: 100, perm_config: 100,
}

const nula = (v) => (v === '' || v === undefined ? null : v)

function norm(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    let val = (typeof v === 'string' && v && !MINUSC.has(k)) ? v.toUpperCase() : v
    if (k === 'login' && typeof val === 'string') val = val.toLowerCase().trim()
    if (k === 'email' && typeof val === 'string') val = val.toLowerCase().trim()
    if (typeof val === 'string' && MAXLEN[k]) val = val.slice(0, MAXLEN[k])
    out[k] = val
  }
  return out
}

// ── LISTAR (aba Acesso) ────────────────────────────────────────────────
const TIPOS_FILTRO_USUARIO = {
  codigo: 'texto', nome: 'texto', login: 'texto', email: 'texto',
  telefone: 'texto', setor: 'texto', cargo: 'texto',
  status: 'exato', ativo: 'booleano', favorito: 'booleano',
  criado_em: 'data', alterado_em: 'data',
}

export async function listar({ busca, filtros } = {}) {
  const cond = []
  const params = []
  // "so ativos" e o default; sai quando o usuario filtra por status/ativo.
  const filtrouStatus = filtros && (filtros.status || filtros.ativo)
  if (!filtrouStatus) cond.push('u.ativo IS DISTINCT FROM false')

  if (busca && String(busca).trim()) {
    params.push(`%${busca.trim()}%`)
    cond.push(`(u.nome ILIKE $${params.length} OR u.login ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.setor ILIKE $${params.length} OR u.cargo ILIKE $${params.length})`)
  }

  if (filtros && Object.keys(filtros).length) {
    const r = montarFiltro(filtros, TIPOS_FILTRO_USUARIO, { alias: 'u' })
    if (r.where) {
      const base = params.length
      cond.push(r.where.replace(/^ AND /, '').replace(/\$(\d+)/g, (_, n) => `$${base + Number(n)}`))
      params.push(...r.params)
    }
  }

  // Nunca devolve o hash da senha — so a flag de que existe uma.
  return query(
    `SELECT u.id, u.codigo, u.nome, u.status, u.foto, u.login, u.email,
            u.telefone, u.setor, u.cargo,
            u.perm_cadastros, u.perm_financeiro, u.perm_relatorios, u.perm_config,
            u.observacoes, u.ativo, u.favorito, u.criado_em, u.alterado_em,
            (u.senha IS NOT NULL AND u.senha <> '') AS tem_senha
     FROM usuario_001 u
     ${cond.length ? 'WHERE ' + cond.join(' AND ') : ''}
     ORDER BY u.nome ASC
     LIMIT 2000`,
    params
  )
}

// ── OBTER ─────────────────────────────────────────────────────────────
export async function obter(id) {
  const u = await queryOne(
    `SELECT id, codigo, nome, status, foto, login, email,
            telefone, setor, cargo,
            perm_cadastros, perm_financeiro, perm_relatorios, perm_config,
            observacoes, ativo, favorito, criado_em, alterado_em,
            (senha IS NOT NULL AND senha <> '') AS tem_senha
     FROM usuario_001 WHERE id = $1`,
    [id]
  )
  return u || null
}

// ── validacao / preparo comum ─────────────────────────────────────────
async function prepararCampos(dados, { idAtual = null } = {}) {
  const d = norm(dados)
  if (!d.nome || !String(d.nome).trim()) throw new Error('Informe o nome do usuário.')
  if (!d.login || !String(d.login).trim()) throw new Error('Informe o login do usuário.')

  // login unico
  const colisao = await queryOne(
    `SELECT id FROM usuario_001 WHERE LOWER(login) = $1 AND id <> $2`,
    [d.login, idAtual || 0]
  )
  if (colisao) throw new Error(`Já existe um usuário com o login "${d.login}".`)

  // senha: so mexe quando vem preenchida. Vazio = mantem a atual.
  let senhaHash
  if (d.senha && String(d.senha).trim()) {
    senhaHash = await bcrypt.hash(String(d.senha), 10)
  }

  // ativo derivado do status quando nao vier explicito
  if (d.ativo === undefined && d.status) d.ativo = d.status !== 'inativo'

  return { d, senhaHash }
}

// ── CRIAR ─────────────────────────────────────────────────────────────
export async function criar(dados) {
  const { d, senhaHash } = await prepararCampos(dados)

  // Mesma largura (4 digitos) dos codigos ja existentes vindos da tela
  // antiga do FormBuilder.
  const codRow = await queryOne(`SELECT COALESCE(MAX(NULLIF(codigo,'')::int),0)+1 AS n FROM usuario_001`)
  const codigo = String(codRow.n).padStart(4, '0')

  const campos = COLS.filter((k) => k !== 'senha' && d[k] !== undefined)
  const valores = campos.map((k) => nula(d[k]))
  if (senhaHash !== undefined) { campos.push('senha'); valores.push(senhaHash) }
  campos.push('codigo'); valores.push(codigo)

  const ph = campos.map((_, i) => `$${i + 1}`)
  const ins = await queryOne(
    `INSERT INTO usuario_001 (${campos.join(', ')}) VALUES (${ph.join(', ')}) RETURNING id`,
    valores
  )
  return obter(ins.id)
}

// ── ATUALIZAR ─────────────────────────────────────────────────────────
export async function atualizar({ id, ...dados }) {
  const { d, senhaHash } = await prepararCampos(dados, { idAtual: id })

  const campos = COLS.filter((k) => k !== 'senha' && d[k] !== undefined)
  const valores = campos.map((k) => nula(d[k]))
  if (senhaHash !== undefined) { campos.push('senha'); valores.push(senhaHash) }
  if (!campos.length) return obter(id)

  const sets = campos.map((k, i) => `${k} = $${i + 2}`)
  await query(
    `UPDATE usuario_001 SET ${sets.join(', ')}, alterado_em = NOW() WHERE id = $1`,
    [id, ...valores]
  )
  return obter(id)
}

// ── EXCLUIR ───────────────────────────────────────────────────────────
export async function excluir(id) {
  // CASCADE limpa kr_usuario_grupo_001 / kr_usuario_permissoes_001.
  await query('DELETE FROM usuario_001 WHERE id = $1', [id])
  return { id }
}

// ── STATUS EM MASSA ───────────────────────────────────────────────────
export async function mudarStatusLote(ids, status) {
  if (!Array.isArray(ids) || !ids.length) return { atualizadas: 0 }
  const rows = await query(
    `UPDATE usuario_001
     SET status = $2, ativo = ($2 <> 'inativo'), alterado_em = NOW()
     WHERE id = ANY($1::int[]) RETURNING id`,
    [ids, status]
  )
  return { atualizadas: rows.length }
}

// ── REDEFINIR SENHA ──────────────────────────────────────────────────
export async function redefinirSenha(id, novaSenha) {
  const s = String(novaSenha || '')
  if (s.length < 4) throw new Error('A senha deve ter ao menos 4 caracteres.')
  const hash = await bcrypt.hash(s, 10)
  const row = await queryOne(
    'UPDATE usuario_001 SET senha = $2, alterado_em = NOW() WHERE id = $1 RETURNING id',
    [id, hash]
  )
  if (!row) throw new Error('Usuário não encontrado.')
  return { id }
}
