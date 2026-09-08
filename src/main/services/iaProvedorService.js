import { query, queryOne } from '../db'
import { encryptCofre, decryptCofre, getDecryptedAnthropicApiKey } from '../config'

// CRUD de provedores de IA (ia_provedor_001). A api_key vai cifrada no
// banco; nunca sai em claro para o frontend.

const TIPOS_API = ['anthropic', 'openai', 'gemini']

// Modelos padrao sugeridos por tipo (so pra pre-preencher o form).
export const MODELOS_SUGERIDOS = {
  anthropic: ['claude-sonnet-4-5', 'claude-opus-4-1', 'claude-haiku-4-5'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'o3-mini'],
  gemini: ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-1.5-pro'],
}

function mascarar(row) {
  if (!row) return row
  const { api_key_cifrada, ...resto } = row
  return { ...resto, tem_chave: !!api_key_cifrada }
}

export async function listarProvedores() {
  const rows = await query('SELECT * FROM ia_provedor_001 ORDER BY nome')
  return rows.map(mascarar)
}

// Uso interno (nunca exposto): devolve a chave decifrada de um provedor.
export async function obterProvedorComChave(id) {
  const row = await queryOne('SELECT * FROM ia_provedor_001 WHERE id = $1 AND ativo = true', [id])
  if (!row) return null
  return { ...row, api_key: row.api_key_cifrada ? decryptCofre(row.api_key_cifrada) : '' }
}

export async function criarProvedor({ codigo, nome, tipoApi, modelo, baseUrl, apiKey }) {
  if (!codigo?.trim() || !nome?.trim() || !modelo?.trim()) {
    throw new Error('Código, nome e modelo são obrigatórios.')
  }
  if (!/^[a-z0-9_]+$/.test(codigo.trim())) {
    throw new Error('Código deve conter apenas letras minúsculas, números e underline.')
  }
  if (!TIPOS_API.includes(tipoApi)) throw new Error('Tipo de API inválido.')
  if (!apiKey?.trim()) throw new Error('A chave de API é obrigatória.')
  const jaExiste = await queryOne('SELECT id FROM ia_provedor_001 WHERE codigo = $1', [codigo.trim()])
  if (jaExiste) throw new Error(`Já existe um provedor com o código "${codigo.trim()}".`)
  const reg = await queryOne(
    `INSERT INTO ia_provedor_001 (codigo, nome, tipo_api, modelo, base_url, api_key_cifrada)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [codigo.trim(), nome.trim(), tipoApi, modelo.trim(), baseUrl?.trim() || null, encryptCofre(apiKey.trim())]
  )
  return mascarar(reg)
}

// apiKey undefined = mantem a chave atual; string vazia nao e permitida.
export async function editarProvedor(id, { nome, tipoApi, modelo, baseUrl, apiKey, ativo }) {
  if (tipoApi != null && !TIPOS_API.includes(tipoApi)) throw new Error('Tipo de API inválido.')
  const chaveCifrada = apiKey === undefined
    ? undefined
    : (apiKey?.trim() ? encryptCofre(apiKey.trim()) : null)
  const reg = await queryOne(
    `UPDATE ia_provedor_001 SET
       nome = COALESCE($2, nome),
       tipo_api = COALESCE($3, tipo_api),
       modelo = COALESCE($4, modelo),
       base_url = $5,
       api_key_cifrada = COALESCE($6, api_key_cifrada),
       ativo = COALESCE($7, ativo),
       atualizado_em = now()
     WHERE id = $1 RETURNING *`,
    [id, nome ?? null, tipoApi ?? null, modelo ?? null, baseUrl?.trim() || null, chaveCifrada ?? null, ativo ?? null]
  )
  if (!reg) throw new Error('Provedor não encontrado.')
  return mascarar(reg)
}

export async function excluirProvedor(id) {
  const rows = await query('DELETE FROM ia_provedor_001 WHERE id = $1 RETURNING id', [id])
  if (!rows.length) throw new Error('Provedor não encontrado.')
}

// Chamado uma vez no boot: se ha uma chave Anthropic no krontech.ini e
// ainda nao existe nenhum provedor, cria "Claude (principal)" com ela e
// liga todos os prompts sem provedor a ele.
export async function migrarChaveAnthropicLegada() {
  try {
    const chave = getDecryptedAnthropicApiKey()
    if (!chave) return
    const [{ total }] = await query('SELECT COUNT(*)::int AS total FROM ia_provedor_001')
    if (total > 0) return

    const prov = await queryOne(
      `INSERT INTO ia_provedor_001 (codigo, nome, tipo_api, modelo, api_key_cifrada)
       VALUES ('claude_principal', 'Claude (principal)', 'anthropic', 'claude-sonnet-4-5', $1)
       RETURNING id`,
      [encryptCofre(chave)]
    )
    await query('UPDATE prompt_ia_001 SET ia_provedor_id = $1 WHERE ia_provedor_id IS NULL', [prov.id])
    console.log('[iaProvedor] chave Anthropic legada migrada para ia_provedor_001')
  } catch (err) {
    console.warn('[iaProvedor] falha ao migrar chave legada:', err.message)
  }
}
