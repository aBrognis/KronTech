import bcrypt from 'bcrypt'
import { query, queryOne, getPool } from '../db'
import { montarFiltro } from './filtroSqlGenerico'

// CRUD nativo da tela de Usuário (usuario_001). Tabela unica + historico de
// senhas (usuario_senha_hist_001). Mesmo padrao de service proprio +
// handlers via wrap().
//
// A tela FormBuilder de usuario_001 continua existindo em kr_telas_001
// (inacessivel pela navegacao, igual a Entidade). O login (auth.js) e a
// lupa de consultores (viagens.js) referenciam as colunas login/senha
// direto — nao dependem mais da definicao da tela.

const COLS = [
  // identificacao
  'nome', 'apelido', 'documento', 'matricula', 'status', 'foto',
  // acesso
  'login', 'senha', 'perfil',
  'dt_expiracao', 'forcar_troca_senha', 'dois_fatores',
  // contato
  'email', 'telefone', 'ramal', 'whatsapp',
  // RH
  'setor', 'cargo', 'centro_custo', 'admissao', 'desligamento', 'gestor_id',
  // preferencias / complemento
  'tema', 'idioma', 'observacoes', 'ativo', 'favorito',
]

// login/email/senha/foto nao viram maiuscula. documento tem mascara propria.
const MINUSC = new Set(['login', 'email', 'senha', 'foto', 'tema', 'idioma', 'documento'])
const MAXLEN = {
  nome: 200, apelido: 60, documento: 18, matricula: 30, status: 20, foto: 100,
  login: 100, perfil: 20,
  email: 150, telefone: 30, ramal: 10, whatsapp: 30,
  setor: 100, cargo: 100, centro_custo: 60,
  tema: 10, idioma: 8,
}

const nula = (v) => (v === '' || v === undefined ? null : v)
const boolCols = new Set(['forcar_troca_senha', 'dois_fatores', 'ativo', 'favorito'])
const intCols = new Set(['gestor_id'])

function coerce(k, v) {
  if (boolCols.has(k)) return v === true || v === 'true' || v === 1
  if (intCols.has(k)) return v === '' || v == null ? null : Number(v)
  return nula(v)
}

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
  codigo: 'texto', nome: 'texto', apelido: 'texto', documento: 'texto', matricula: 'texto',
  login: 'texto', email: 'texto', telefone: 'texto', ramal: 'texto', whatsapp: 'texto',
  setor: 'texto', cargo: 'texto', centro_custo: 'texto',
  status: 'exato', perfil: 'exato',
  ativo: 'booleano', favorito: 'booleano', dois_fatores: 'booleano', forcar_troca_senha: 'booleano',
  gestor_id: 'exato',
  admissao: 'data', desligamento: 'data', dt_expiracao: 'data',
  dt_ultimo_acesso: 'data', criado_em: 'data', alterado_em: 'data',
}

export async function listar({ busca, filtros } = {}) {
  const cond = []
  const params = []
  const filtrouStatus = filtros && (filtros.status || filtros.ativo)
  if (!filtrouStatus) cond.push('u.ativo IS DISTINCT FROM false')

  if (busca && String(busca).trim()) {
    params.push(`%${busca.trim()}%`)
    const p = params.length
    cond.push(`(u.nome ILIKE $${p} OR u.apelido ILIKE $${p} OR u.login ILIKE $${p} OR u.email ILIKE $${p} OR u.setor ILIKE $${p} OR u.cargo ILIKE $${p} OR u.matricula ILIKE $${p})`)
  }

  if (filtros && Object.keys(filtros).length) {
    const r = montarFiltro(filtros, TIPOS_FILTRO_USUARIO, { alias: 'u' })
    if (r.where) {
      const base = params.length
      cond.push(r.where.replace(/^ AND /, '').replace(/\$(\d+)/g, (_, n) => `$${base + Number(n)}`))
      params.push(...r.params)
    }
  }

  // Traz tambem o nome do gestor (FK) e a flag de senha — nunca o hash.
  return query(
    `SELECT u.id, u.codigo, u.nome, u.apelido, u.documento, u.matricula, u.status, u.foto,
            u.login, u.perfil, u.dt_expiracao, u.dt_ultimo_acesso,
            u.forcar_troca_senha, u.dois_fatores, u.senha_alterada_em, u.bloqueado_ate,
            u.email, u.telefone, u.ramal, u.whatsapp,
            u.setor, u.cargo, u.centro_custo, u.admissao, u.desligamento, u.gestor_id,
            g.nome AS gestor_nome,
            u.tema, u.idioma, u.observacoes, u.ativo, u.favorito, u.criado_em, u.alterado_em,
            (u.senha IS NOT NULL AND u.senha <> '') AS tem_senha,
            (u.dt_expiracao IS NOT NULL AND u.dt_expiracao < CURRENT_DATE) AS acesso_expirado
     FROM usuario_001 u
     LEFT JOIN usuario_001 g ON g.id = u.gestor_id
     ${cond.length ? 'WHERE ' + cond.join(' AND ') : ''}
     ORDER BY u.nome ASC
     LIMIT 2000`,
    params
  )
}

// ── OBTER ─────────────────────────────────────────────────────────────
export async function obter(id) {
  const u = await queryOne(
    `SELECT u.id, u.codigo, u.nome, u.apelido, u.documento, u.matricula, u.status, u.foto,
            u.login, u.perfil, u.dt_expiracao, u.dt_ultimo_acesso,
            u.forcar_troca_senha, u.dois_fatores, u.senha_alterada_em, u.tentativas_login, u.bloqueado_ate,
            u.email, u.telefone, u.ramal, u.whatsapp,
            u.setor, u.cargo, u.centro_custo, u.admissao, u.desligamento, u.gestor_id,
            g.nome AS gestor_nome,
            u.tema, u.idioma, u.observacoes, u.ativo, u.favorito, u.criado_em, u.alterado_em,
            (u.senha IS NOT NULL AND u.senha <> '') AS tem_senha
     FROM usuario_001 u
     LEFT JOIN usuario_001 g ON g.id = u.gestor_id
     WHERE u.id = $1`,
    [id]
  )
  if (!u) return null
  const historicoSenha = await query(
    `SELECT id, trocada_em, trocada_por FROM usuario_senha_hist_001
     WHERE usuario_id = $1 ORDER BY trocada_em DESC LIMIT 20`,
    [id]
  )
  return { ...u, historicoSenha }
}

// Lista enxuta pra o seletor de gestor (evita puxar a si mesmo).
export async function listarParaGestor(excluirId) {
  return query(
    `SELECT id, nome, cargo FROM usuario_001
     WHERE ativo = TRUE AND id <> $1 ORDER BY nome`,
    [excluirId || 0]
  )
}

// Valores ja usados numa coluna de texto livre (setor, cargo, centro_custo)
// — alimenta o <datalist> dos campos, mantendo consistencia sem virar
// cadastro separado.
const CAMPOS_LIVRE = new Set(['setor', 'cargo', 'centro_custo'])
export async function valoresCampo(campo) {
  if (!CAMPOS_LIVRE.has(campo)) return []
  const rows = await query(
    `SELECT DISTINCT ${campo} AS v FROM usuario_001
     WHERE ${campo} IS NOT NULL AND ${campo} <> '' ORDER BY ${campo}`
  )
  return rows.map((r) => r.v)
}

// Ativar / bloquear / inativar um usuario (acao unica, nao select).
export async function definirSituacao(id, situacao) {
  if (!['ativo', 'inativo', 'bloqueado'].includes(situacao)) {
    throw new Error(`Situação inválida: ${situacao}`)
  }
  const row = await queryOne(
    `UPDATE usuario_001
     SET status = $2, ativo = ($2 = 'ativo'), alterado_em = NOW()
     WHERE id = $1 RETURNING id`,
    [id, situacao]
  )
  if (!row) throw new Error('Usuário não encontrado.')
  return { id, situacao }
}

// ── validacao / preparo comum ─────────────────────────────────────────
async function prepararCampos(dados, { idAtual = null } = {}) {
  const d = norm(dados)
  if (!d.nome || !String(d.nome).trim()) throw new Error('Informe o nome do usuário.')
  if (!d.login || !String(d.login).trim()) throw new Error('Informe o login do usuário.')

  const colisao = await queryOne(
    `SELECT id FROM usuario_001 WHERE LOWER(login) = $1 AND id <> $2`,
    [d.login, idAtual || 0]
  )
  if (colisao) throw new Error(`Já existe um usuário com o login "${d.login}".`)

  // gestor nao pode ser o proprio usuario
  if (idAtual && d.gestor_id && Number(d.gestor_id) === Number(idAtual)) {
    throw new Error('O usuário não pode ser gestor de si mesmo.')
  }

  let senhaHash
  if (d.senha && String(d.senha).trim()) {
    senhaHash = await bcrypt.hash(String(d.senha), 10)
  }

  // A ficha manda `ativo` (checkbox); o status espelha: ativo -> 'ativo',
  // desmarcado -> 'inativo'. 'bloqueado' so entra pela acao definirSituacao,
  // entao aqui um usuario bloqueado que for gravado com "Ativo" marcado
  // volta pra 'ativo' de propria vontade do editor.
  if (d.ativo === true) d.status = 'ativo'
  else if (d.ativo === false) d.status = d.status === 'bloqueado' ? 'bloqueado' : 'inativo'

  return { d, senhaHash }
}

function montarColsVals(d, senhaHash) {
  const campos = COLS.filter((k) => k !== 'senha' && d[k] !== undefined)
  const valores = campos.map((k) => coerce(k, d[k]))
  if (senhaHash !== undefined) { campos.push('senha'); valores.push(senhaHash) }
  return { campos, valores }
}

// ── CRIAR ─────────────────────────────────────────────────────────────
export async function criar(dados) {
  const { d, senhaHash } = await prepararCampos(dados)

  const codRow = await queryOne(`SELECT COALESCE(MAX(NULLIF(codigo,'')::int),0)+1 AS n FROM usuario_001`)
  const codigo = String(codRow.n).padStart(4, '0')

  const { campos, valores } = montarColsVals(d, senhaHash)
  if (senhaHash !== undefined) { campos.push('senha_alterada_em'); valores.push(new Date()) }
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

  const client = await getPool().connect()
  try {
    await client.query('BEGIN')

    // troca de senha pela ficha: arquiva a anterior no historico.
    if (senhaHash !== undefined) {
      const atual = await client.query('SELECT senha FROM usuario_001 WHERE id = $1', [id])
      const anterior = atual.rows[0]?.senha
      if (anterior) {
        await client.query(
          `INSERT INTO usuario_senha_hist_001 (usuario_id, senha_hash, trocada_por) VALUES ($1,$2,$3)`,
          [id, anterior, dados._alteradoPorNome || null]
        )
      }
    }

    const { campos, valores } = montarColsVals(d, senhaHash)
    if (senhaHash !== undefined) {
      campos.push('senha_alterada_em', 'forcar_troca_senha')
      valores.push(new Date(), false)
    }
    if (campos.length) {
      const sets = campos.map((k, i) => `${k} = $${i + 2}`)
      await client.query(
        `UPDATE usuario_001 SET ${sets.join(', ')}, alterado_em = NOW() WHERE id = $1`,
        [id, ...valores]
      )
    }

    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
  return obter(id)
}

// ── EXCLUIR ───────────────────────────────────────────────────────────
export async function excluir(id) {
  await query('DELETE FROM usuario_001 WHERE id = $1', [id])
  return { id }
}

// ── STATUS EM MASSA ───────────────────────────────────────────────────
export async function mudarStatusLote(ids, status) {
  if (!Array.isArray(ids) || !ids.length) return { atualizadas: 0 }
  // ativo = true so quando status = 'ativo' (bloqueado nao e "ativo").
  const rows = await query(
    `UPDATE usuario_001
     SET status = $2, ativo = ($2 = 'ativo'), alterado_em = NOW()
     WHERE id = ANY($1::int[]) RETURNING id`,
    [ids, status]
  )
  return { atualizadas: rows.length }
}

// ── REDEFINIR SENHA ──────────────────────────────────────────────────
export async function redefinirSenha(id, novaSenha, { porNome, forcarTroca = false } = {}) {
  const s = String(novaSenha || '')
  if (s.length < 4) throw new Error('A senha deve ter ao menos 4 caracteres.')
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const atual = await client.query('SELECT senha FROM usuario_001 WHERE id = $1', [id])
    if (!atual.rows.length) throw new Error('Usuário não encontrado.')
    if (atual.rows[0].senha) {
      await client.query(
        `INSERT INTO usuario_senha_hist_001 (usuario_id, senha_hash, trocada_por) VALUES ($1,$2,$3)`,
        [id, atual.rows[0].senha, porNome || null]
      )
    }
    const hash = await bcrypt.hash(s, 10)
    await client.query(
      `UPDATE usuario_001
       SET senha = $2, senha_alterada_em = NOW(), forcar_troca_senha = $3, alterado_em = NOW()
       WHERE id = $1`,
      [id, hash, !!forcarTroca]
    )
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
  return { id }
}

// Chamado pelo auth:login apos autenticar com sucesso.
export async function registrarAcesso(id) {
  await query('UPDATE usuario_001 SET dt_ultimo_acesso = NOW(), tentativas_login = 0 WHERE id = $1', [id]).catch(() => {})
}
