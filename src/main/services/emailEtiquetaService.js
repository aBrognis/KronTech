import { query, queryOne } from '../db'

// Lista plana (com parent_id) — a árvore é montada no frontend a partir
// daqui, reaproveitada tanto pelo dropdown de aplicar quanto pela sublista
// de navegação da coluna de contas, sem duplicar a lógica de agrupamento.
export async function listarEtiquetas() {
  return query('SELECT * FROM email_etiqueta_001 ORDER BY ordem, nome')
}

export async function criarEtiqueta({ nome, cor, parentId }) {
  return queryOne(
    'INSERT INTO email_etiqueta_001 (nome, cor, parent_id) VALUES ($1,$2,$3) RETURNING *',
    [nome, cor || '#94a3b8', parentId || null]
  )
}

export async function atualizarEtiqueta(id, { nome, cor, parentId }) {
  const registro = await queryOne(
    'UPDATE email_etiqueta_001 SET nome=$2, cor=$3, parent_id=$4 WHERE id=$1 RETURNING *',
    [id, nome, cor, parentId || null]
  )
  if (!registro) throw new Error('Etiqueta não encontrada.')
  return registro
}

// Bloqueia a exclusão quando há mensagens vinculadas ou subetiquetas —
// o cascade da FK apagaria os vínculos/filhos em silêncio, escondendo do
// usuário que e-mails perderam a etiqueta sem aviso nenhum.
export async function excluirEtiqueta(id) {
  const [{ total: totalMensagens }] = await query(
    'SELECT COUNT(*)::int AS total FROM email_mensagem_etiqueta_001 WHERE etiqueta_id = $1', [id])
  if (totalMensagens > 0) {
    throw new Error(`Esta etiqueta está aplicada a ${totalMensagens} mensagem(ns). Remova a etiqueta dessas mensagens antes de excluí-la.`)
  }
  const [{ total: totalFilhas }] = await query(
    'SELECT COUNT(*)::int AS total FROM email_etiqueta_001 WHERE parent_id = $1', [id])
  if (totalFilhas > 0) {
    throw new Error(`Esta etiqueta tem ${totalFilhas} subetiqueta(s). Exclua ou mova as subetiquetas antes de excluí-la.`)
  }
  await query('DELETE FROM email_etiqueta_001 WHERE id=$1', [id])
}

export async function etiquetasDaMensagem(mensagemId) {
  return query(
    `SELECT e.* FROM email_etiqueta_001 e
     JOIN email_mensagem_etiqueta_001 me ON me.etiqueta_id = e.id
     WHERE me.mensagem_id = $1 ORDER BY e.ordem, e.nome`,
    [mensagemId]
  )
}

// Agrupado por mensagem_id — evita N+1 ao popular chips na lista de
// mensagens (uma query para toda a página, não uma por item).
export async function etiquetasPorMensagens(mensagemIds) {
  if (!mensagemIds?.length) return {}
  const rows = await query(
    `SELECT me.mensagem_id, e.id, e.nome, e.cor
     FROM email_mensagem_etiqueta_001 me
     JOIN email_etiqueta_001 e ON e.id = me.etiqueta_id
     WHERE me.mensagem_id = ANY($1::int[])
     ORDER BY e.ordem, e.nome`,
    [mensagemIds]
  )
  const porMensagem = {}
  for (const r of rows) {
    if (!porMensagem[r.mensagem_id]) porMensagem[r.mensagem_id] = []
    porMensagem[r.mensagem_id].push({ id: r.id, nome: r.nome, cor: r.cor })
  }
  return porMensagem
}

// Aplica UMA etiqueta ao lote. A hierarquia funciona por heranca de leitura,
// nao de gravacao: soltar um e-mail em "TI" (filha de "SISPLAN") grava so
// "TI". O e-mail aparece na visao "TI" e tambem na visao "SISPLAN", porque a
// listagem de uma etiqueta-pai inclui as descendentes (ver
// idsEtiquetaComDescendentes em emailMensagemService). Mesma logica de
// pastas do Windows/Outlook: por o arquivo em Documentos\Contratos nao o
// coloca em Documentos, mas abrir Documentos mostra o que esta em Contratos.
export async function aplicarEtiquetaLote(mensagemIds, etiquetaId) {
  if (!mensagemIds?.length) return { aplicadas: 0 }
  const rows = await query(
    `INSERT INTO email_mensagem_etiqueta_001 (mensagem_id, etiqueta_id)
     SELECT unnest($1::int[]), $2
     ON CONFLICT (mensagem_id, etiqueta_id) DO NOTHING RETURNING mensagem_id`,
    [mensagemIds, etiquetaId]
  )
  return { aplicadas: rows.length }
}

export async function removerEtiquetaLote(mensagemIds, etiquetaId) {
  if (!mensagemIds?.length) return { removidas: 0 }
  const rows = await query(
    'DELETE FROM email_mensagem_etiqueta_001 WHERE etiqueta_id=$1 AND mensagem_id = ANY($2::int[]) RETURNING mensagem_id',
    [etiquetaId, mensagemIds]
  )
  return { removidas: rows.length }
}
