import { query, queryOne } from '../db'
import { montarFiltro } from './filtroSqlGenerico'
import { SCHEMAS_POR_LAYOUT, schemaComLegendas } from './documentoTemplates/schemas'
import { obterPromptPorCodigo } from './promptIaService'
import { gerarEstruturado } from './iaService'

export const STATUS_VALIDOS = ['rascunho', 'nao_impresso', 'impresso', 'assinado', 'enviado']

// Monta o título formal do documento a partir do tipo e do nome
// informado pelo usuário — mesmo padrão dos exemplos reais (ex: "PROCESSO
// DE CADASTRO DE ORDEM DE PRODUÇÃO", "ATA DE TREINAMENTO - FINANCEIRO").
function montarTitulo(codigoTipo, nomeReferencia) {
  if (codigoTipo === 'analise_aderencia') return `PROCESSO DE ${nomeReferencia.toUpperCase()}`
  if (codigoTipo === 'ata_treinamento') return `ATA DE TREINAMENTO - ${nomeReferencia.toUpperCase()}`
  return nomeReferencia.toUpperCase()
}

// Só chama a IA e devolve o conteúdo estruturado — NÃO grava nada no
// banco. Usado pelo botão "Gerar" da aba Cadastro: o usuário pode gerar
// de novo quantas vezes quiser antes de confirmar, sem acumular
// rascunhos órfãos a cada tentativa.
export async function gerarConteudo({ documentoTipoId, nomeReferencia, textoBruto, imagens, qtdImagensPdf = 0, onProgresso }) {
  const emitir = (fase, extra = {}) => onProgresso?.({ fase, ...extra })

  const tipo = await queryOne('SELECT * FROM documento_tipo_001 WHERE id = $1 AND ativo = true', [documentoTipoId])
  if (!tipo) throw new Error('Tipo de documento inválido ou inativo.')

  // Se ha imagens que vao pro PDF, o schema ganha o campo `legendas`
  // (a IA descreve cada uma). qtdImagensPdf conta so as marcadas "sai no
  // documento" — as de mera referencia nao geram legenda.
  const schema = schemaComLegendas(tipo.layout_renderer, qtdImagensPdf)
  if (!schema) throw new Error(`Nenhum schema de reformulação definido para o layout "${tipo.layout_renderer}".`)

  // Prompt e provedor de IA vem da tabela editavel prompt_ia_001, pelo
  // codigo ligado ao tipo de documento (prompt_ia_codigo). Se nao houver,
  // erro amigavel apontando pra tela de Prompts de IA.
  const promptIa = tipo.prompt_ia_codigo ? await obterPromptPorCodigo(tipo.prompt_ia_codigo) : null
  if (!promptIa) {
    throw new Error(
      `Nenhum prompt de IA configurado para "${tipo.nome}". Cadastre um prompt com o código "${tipo.prompt_ia_codigo || '(defina no tipo de documento)'}" em Configurações > Prompts de IA e ligue-o a um provedor.`
    )
  }

  emitir('enviando')
  const conteudoEstruturado = await gerarEstruturado({
    provedorId: promptIa.ia_provedor_id,
    promptSistema: promptIa.prompt_sistema,
    textoUsuario: textoBruto,
    schema,
    nomeFerramenta: 'preencher_documento',
    imagens,
  })

  emitir('estruturando')
  const titulo = montarTitulo(tipo.codigo, nomeReferencia)

  emitir('pronto')
  return { titulo, conteudoEstruturado }
}

// Grava o documento definitivamente — chamado pela aba "Documento Gerado"
// ao confirmar (não pela IA, o conteúdo já veio pronto de gerarConteudo).
// Código sequencial mesmo padrão de despesa_001 (nextval + padStart 4
// dígitos), gerado só aqui — nunca na fase de "Gerar" (que pode rodar
// várias vezes antes de gravar, sem consumir código à toa).
export async function confirmarDocumento({ documentoTipoId, titulo, nomeReferencia, clienteId, clienteNome, autor, participantes, textoBruto, conteudoEstruturado, imagens = [] }) {
  const codRow = await queryOne(`SELECT nextval('documento_gerado_001_codigo_seq') AS next`)
  const codigo = String(codRow.next).padStart(4, '0')
  return queryOne(
    `INSERT INTO documento_gerado_001
       (codigo, documento_tipo_id, titulo, nome_referencia, cliente_id, cliente_nome, autor, texto_bruto, conteudo_estruturado, participantes, imagens, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'rascunho')
     RETURNING *`,
    [codigo, documentoTipoId, titulo, nomeReferencia, clienteId || null, clienteNome, autor, textoBruto, JSON.stringify(conteudoEstruturado), JSON.stringify(participantes || []), JSON.stringify(imagens || [])]
  )
}

// Atualiza o conteúdo estruturado de um documento já gravado — usado
// tanto para editar a revisão antes de confirmar quanto para alterar um
// documento já existente. Antes de sobrescrever, empilha a versão atual
// no histórico (só quando o conteúdo realmente mudou).
export async function salvarRevisao(documentoId, { conteudoEstruturado, participantes, titulo, nomeReferencia, clienteId, clienteNome, autor, imagens, origemHistorico = 'edicao_manual' }) {
  const atual = await queryOne('SELECT conteudo_estruturado, texto_bruto FROM documento_gerado_001 WHERE id = $1', [documentoId])
  if (atual && JSON.stringify(atual.conteudo_estruturado) !== JSON.stringify(conteudoEstruturado)) {
    await query(
      `INSERT INTO documento_gerado_historico_001 (documento_id, texto_bruto, conteudo_estruturado, origem)
       VALUES ($1, $2, $3, $4)`,
      [documentoId, atual.texto_bruto || null, JSON.stringify(atual.conteudo_estruturado), origemHistorico]
    )
  }
  // imagens undefined = nao mexe (edicao que so tocou texto). Array = grava.
  const setImagens = imagens !== undefined ? ', imagens = $9' : ''
  const params = [documentoId, JSON.stringify(conteudoEstruturado), JSON.stringify(participantes || []), titulo, nomeReferencia, clienteId || null, clienteNome, autor]
  if (imagens !== undefined) params.push(JSON.stringify(imagens || []))
  const registro = await queryOne(
    `UPDATE documento_gerado_001
     SET conteudo_estruturado = $2, participantes = $3, titulo = $4, nome_referencia = $5, cliente_id = $6, cliente_nome = $7, autor = $8${setImagens}, atualizado_em = NOW()
     WHERE id = $1
     RETURNING *`,
    params
  )
  if (!registro) throw new Error('Documento não encontrado.')
  return registro
}

// Histórico de gerações/edições do conteúdo de um documento, mais recente
// primeiro. Usado pelo painel "Histórico" da aba Documento Gerado.
export async function listarHistoricoDocumento(documentoId) {
  return query(
    `SELECT id, texto_bruto, conteudo_estruturado, origem, criado_em
     FROM documento_gerado_historico_001
     WHERE documento_id = $1
     ORDER BY criado_em DESC, id DESC`,
    [documentoId]
  )
}

export async function mudarStatus(documentoId, status) {
  if (!STATUS_VALIDOS.includes(status)) throw new Error(`Status inválido: ${status}`)
  const registro = await queryOne(
    `UPDATE documento_gerado_001 SET status = $2, atualizado_em = NOW() WHERE id = $1 RETURNING *`,
    [documentoId, status]
  )
  if (!registro) throw new Error('Documento não encontrado.')
  return registro
}

// Troca o status de varios documentos de uma vez (usado pelo botao
// "E-mail": depois de enviar, tudo vira 'enviado').
export async function mudarStatusLote(ids, status) {
  if (!STATUS_VALIDOS.includes(status)) throw new Error(`Status inválido: ${status}`)
  if (!Array.isArray(ids) || !ids.length) return { atualizadas: 0 }
  const rows = await query(
    `UPDATE documento_gerado_001 SET status = $2, atualizado_em = NOW() WHERE id = ANY($1::int[]) RETURNING id`,
    [ids, status]
  )
  return { atualizadas: rows.length }
}

export async function listarTipos() {
  return query('SELECT id, codigo, nome, layout_renderer, prompt_ia_codigo FROM documento_tipo_001 WHERE ativo = true ORDER BY nome')
}

// Filtros por coluna da aba Acesso (docs CLAUDE.md §4). alias 'dg'.
const TIPOS_FILTRO_DOC = {
  codigo: 'texto', titulo: 'texto', cliente_nome: 'texto', autor: 'texto',
  criado_por: 'texto', nome_referencia: 'texto', cliente_id: 'numero',
  status: { tipo: 'exato', multi: true }, documento_tipo_id: { tipo: 'lookup' },
  criado_em: 'data', atualizado_em: 'data',
}

export async function listarDocumentos({ cliente, documentoTipoId, status, busca, filtros, limite = 2000, offset = 0 } = {}) {
  const condicoes = []
  const params = []
  if (busca && String(busca).trim()) {
    params.push(`%${busca.trim()}%`)
    condicoes.push(`(dg.titulo ILIKE $${params.length} OR dg.cliente_nome ILIKE $${params.length} OR dg.autor ILIKE $${params.length} OR dg.codigo ILIKE $${params.length})`)
  }
  // compat: filtros diretos antigos
  if (cliente) { params.push(`%${cliente}%`); condicoes.push(`dg.cliente_nome ILIKE $${params.length}`) }
  if (documentoTipoId) { params.push(documentoTipoId); condicoes.push(`dg.documento_tipo_id = $${params.length}`) }
  if (status) { params.push(status); condicoes.push(`dg.status = $${params.length}`) }
  // filtros por coluna (painel novo)
  if (filtros && Object.keys(filtros).length) {
    const r = montarFiltro(filtros, TIPOS_FILTRO_DOC, { alias: 'dg' })
    if (r.where) {
      const base = params.length
      condicoes.push(r.where.replace(/^ AND /, '').replace(/\$(\d+)/g, (_, n) => `$${base + Number(n)}`))
      params.push(...r.params)
    }
  }
  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : ''
  params.push(limite, offset)
  return query(
    `SELECT dg.*, dt.nome AS tipo_nome, dt.codigo AS tipo_codigo, dt.layout_renderer,
       cli.nome     AS entidade_nome,
       cli.documento AS entidade_documento,
       cli.email    AS entidade_email,
       cli.cidade   AS entidade_cidade,
       cli.uf       AS entidade_uf,
       jsonb_array_length(COALESCE(dg.participantes, '[]'::jsonb)) AS qtd_participantes,
       jsonb_array_length(COALESCE(dg.imagens, '[]'::jsonb))       AS qtd_imagens,
       (dg.pdf_caminho IS NOT NULL AND dg.pdf_caminho <> '')       AS tem_pdf,
       (SELECT count(*) FROM documento_gerado_historico_001 h WHERE h.documento_id = dg.id) AS qtd_versoes
     FROM documento_gerado_001 dg
     JOIN documento_tipo_001 dt ON dt.id = dg.documento_tipo_id
     LEFT JOIN entidade_001 cli ON cli.id = dg.cliente_id
     ${where}
     ORDER BY dg.criado_em DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )
}

export async function obterDocumento(documentoId) {
  return queryOne(
    `SELECT dg.*, dt.codigo AS tipo_codigo, dt.layout_renderer
     FROM documento_gerado_001 dg
     JOIN documento_tipo_001 dt ON dt.id = dg.documento_tipo_id
     WHERE dg.id = $1`,
    [documentoId]
  )
}

export async function excluirDocumento(documentoId) {
  await query('DELETE FROM documento_gerado_001 WHERE id = $1', [documentoId])
}

// Só registra onde o PDF mais recente foi salvo — nunca mexe em status,
// que continua controlado manualmente pelos botões de Rascunho/Não
// Impresso/Impresso/Assinado/Enviado.
export async function salvarCaminhoPdf(documentoId, caminho) {
  await query('UPDATE documento_gerado_001 SET pdf_caminho = $2, atualizado_em = NOW() WHERE id = $1', [documentoId, caminho])
}
