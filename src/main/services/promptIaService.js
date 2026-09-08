import { query, queryOne } from '../db'

// CRUD dos prompts de IA editaveis (Configuracoes > Prompts de IA).
// Cada prompt tem um `codigo` estavel que o resto do sistema referencia.

export async function listarPrompts() {
  return query('SELECT * FROM prompt_ia_001 ORDER BY nome')
}

export async function obterPromptPorCodigo(codigo) {
  return queryOne('SELECT * FROM prompt_ia_001 WHERE codigo = $1 AND ativo = true', [codigo])
}

export async function atualizarPrompt(id, { nome, descricao, promptSistema, ativo }) {
  const reg = await queryOne(
    `UPDATE prompt_ia_001
     SET nome = COALESCE($2, nome),
         descricao = $3,
         prompt_sistema = COALESCE($4, prompt_sistema),
         ativo = COALESCE($5, ativo),
         atualizado_em = now()
     WHERE id = $1 RETURNING *`,
    [id, nome ?? null, descricao ?? null, promptSistema ?? null, ativo ?? null]
  )
  if (!reg) throw new Error('Prompt não encontrado.')
  return reg
}

// Cria um prompt novo. `codigo` deve ser unico (usado pelo sistema para
// referenciar o prompt). `iaProvedorId` = qual provedor de IA usa.
export async function criarPrompt({ codigo, nome, categoria, descricao, promptSistema, iaProvedorId }) {
  if (!codigo?.trim() || !nome?.trim() || !promptSistema?.trim()) {
    throw new Error('Código, nome e prompt são obrigatórios.')
  }
  if (!/^[a-z0-9_]+$/.test(codigo.trim())) {
    throw new Error('Código deve conter apenas letras minúsculas, números e underline.')
  }
  const jaExiste = await queryOne('SELECT id FROM prompt_ia_001 WHERE codigo = $1', [codigo.trim()])
  if (jaExiste) throw new Error(`Já existe um prompt com o código "${codigo.trim()}".`)
  return queryOne(
    `INSERT INTO prompt_ia_001 (codigo, nome, categoria, descricao, prompt_sistema, ia_provedor_id)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [codigo.trim(), nome.trim(), (categoria || 'geral').trim(), descricao?.trim() || null, promptSistema, iaProvedorId || null]
  )
}

// Atualiza nome/categoria/descricao/prompt/provedor de um prompt existente.
// O codigo NAO muda (o sistema depende dele).
export async function editarPrompt(id, { nome, categoria, descricao, promptSistema, iaProvedorId }) {
  const reg = await queryOne(
    `UPDATE prompt_ia_001
     SET nome = COALESCE($2, nome),
         categoria = COALESCE($3, categoria),
         descricao = $4,
         prompt_sistema = COALESCE($5, prompt_sistema),
         ia_provedor_id = $6,
         atualizado_em = now()
     WHERE id = $1 RETURNING *`,
    [id, nome ?? null, categoria ?? null, descricao ?? null, promptSistema ?? null, iaProvedorId ?? null]
  )
  if (!reg) throw new Error('Prompt não encontrado.')
  return reg
}

export async function excluirPrompt(id) {
  const rows = await query('DELETE FROM prompt_ia_001 WHERE id = $1 RETURNING id', [id])
  if (!rows.length) throw new Error('Prompt não encontrado.')
}
