import { existsSync, rmSync, readFileSync } from 'fs'
import { join, extname } from 'path'
import { query, queryOne } from '../db'
import { getConfig, resolverBaseAnexos } from '../config'
import { atualizarBadgeNaoLidas, marcarLidaNoServidor } from './emailSyncService'

// O corpo_html guarda `kmail://anexo/<id>` (leve). O <iframe srcdoc> do
// leitor NAO carrega protocolo custom (origem opaca). Entao, so na hora de
// entregar a mensagem pro renderer, troca cada kmail://anexo/<id> pelo
// data: da imagem lida do disco. Isso NAO e gravado no banco — o banco
// continua com o ponteiro leve. E o modelo "lazy": armazena ponteiro,
// hidrata na leitura.
const MIME_EXT = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp', '.svg': 'image/svg+xml' }

async function hidratarCorpoHtml(corpoHtml) {
  if (!corpoHtml || !corpoHtml.includes('kmail://anexo/')) return corpoHtml
  const ids = [...new Set([...corpoHtml.matchAll(/kmail:\/\/anexo\/(\d+)/g)].map(m => Number(m[1])))]
  if (!ids.length) return corpoHtml
  const rows = await query(
    'SELECT id, caminho, content_type FROM email_anexo_001 WHERE id = ANY($1::int[])',
    [ids]
  )
  let out = corpoHtml
  for (const r of rows) {
    try {
      if (!r.caminho || !existsSync(r.caminho)) continue
      const buf = readFileSync(r.caminho)
      const mime = r.content_type || MIME_EXT[extname(r.caminho).toLowerCase()] || 'image/png'
      const dataUri = `data:${mime};base64,${buf.toString('base64')}`
      out = out.split(`kmail://anexo/${r.id}`).join(dataUri)
    } catch { /* imagem ausente: deixa o kmail:// (some pela regra de CSS) */ }
  }
  return out
}

// Busca ignora maiúsculas/minúsculas (ILIKE) e acentuação (unaccent) dos
// dois lados da comparação — "relatorio" encontra "Relatório",
// "Relatorios", "relatórios" etc., independente de como foi digitado.
function condicaoBusca(busca, params) {
  params.push(`%${busca}%`)
  const p = params.length
  return `(unaccent(assunto) ILIKE unaccent($${p}) OR unaccent(remetente_email) ILIKE unaccent($${p}) OR unaccent(remetente_nome) ILIKE unaccent($${p}))`
}

// Filtro de remetente exato — diferente de condicaoBusca (texto livre no
// assunto/remetente juntos), aqui é sempre e-mail específico digitado
// pelo usuário na busca avançada.
function condicaoRemetente(remetente, params) {
  params.push(`%${remetente}%`)
  const p = params.length
  return `unaccent(remetente_email) ILIKE unaccent($${p})`
}

// Filtrar por uma etiqueta traz tambem os e-mails das suas subetiquetas
// (heranca de leitura): clicar em "SISPLAN" mostra o que esta em "SISPLAN"
// e em "SISPLAN/TI". O WITH RECURSIVE desce a arvore a partir do alvo;
// limite de profundidade evita loop se os dados ficarem inconsistentes.
function condicaoEtiqueta(etiquetaId, params) {
  params.push(etiquetaId)
  const p = params.length
  return `EXISTS (
    SELECT 1 FROM email_mensagem_etiqueta_001 me
    WHERE me.mensagem_id = email_mensagem_001.id
      AND me.etiqueta_id IN (
        WITH RECURSIVE descendentes AS (
          SELECT id, 0 AS nivel FROM email_etiqueta_001 WHERE id = $${p}
          UNION ALL
          SELECT e.id, d.nivel + 1
            FROM email_etiqueta_001 e
            JOIN descendentes d ON e.parent_id = d.id
           WHERE d.nivel < 20
        )
        SELECT id FROM descendentes
      )
  )`
}

function montarCondicoes({ contaId, busca, apenasNaoLidas, etiquetaId, pastaId, todasAsPastas, sinalizada, remetente, dataInicio, dataFim, comAnexo, incluirRascunhos, caixaSaida }, params, condicoes) {
  if (contaId) { params.push(contaId); condicoes.push(`conta_id = $${params.length}`) }
  // Caixa de Saida: mensagens enviadas que estao na fila ou deram erro
  // (nao saiu de verdade). Ignora todos os outros filtros de pasta.
  if (caixaSaida) {
    condicoes.push(`origem = 'enviado' AND envio_status IN ('fila','enviando','erro')`)
    condicoes.push('rascunho = false')
    return
  }
  if (apenasNaoLidas) condicoes.push('lida = false')
  if (busca) condicoes.push(condicaoBusca(busca, params))
  if (etiquetaId) condicoes.push(condicaoEtiqueta(etiquetaId, params))
  // Fora da Caixa de Saida, mensagens presas na fila NAO aparecem na lista
  // normal de Enviados (so quando de fato sairam).
  condicoes.push(`(origem <> 'enviado' OR envio_status = 'enviado')`)
  const buscandoGlobal = !!(busca || remetente || dataInicio || dataFim || comAnexo || sinalizada)
  if (pastaId) {
    params.push(pastaId); condicoes.push(`pasta_id = $${params.length}`)
  } else if (!etiquetaId && !buscandoGlobal && !todasAsPastas) {
    // Sem pasta, sem etiqueta, sem busca e sem pedido explicito de "todas as
    // pastas" = visao "Caixa de entrada" (inclusive na visao "Todas as
    // contas" da raiz). Como Gmail/Outlook: so mostra o que esta na Inbox de
    // cada conta, nao Arquivo/Lixeira/Enviados/Spam.
    // - todasAsPastas=true (botao "Todas as mensagens" de uma conta): traz
    //   tudo daquela conta, de qualquer pasta.
    // - Busca e filtros avancados: globais, varrem todas as pastas.
    condicoes.push(
      `(pasta_id IN (SELECT id FROM email_pasta_001 WHERE special_use IS NULL) OR (pasta_id IS NULL AND pasta_imap = 'INBOX'))`
    )
  }
  // Rascunho nunca aparece fora da pseudo-pasta Rascunhos; "todas as
  // mensagens" tambem nao mostra rascunho (isso e tratado por
  // incluirRascunhos mais abaixo).
  if (sinalizada) condicoes.push('sinalizada = true')
  if (remetente) condicoes.push(condicaoRemetente(remetente, params))
  if (dataInicio) { params.push(dataInicio); condicoes.push(`data_envio >= $${params.length}`) }
  if (dataFim) { params.push(dataFim); condicoes.push(`data_envio < ($${params.length}::date + interval '1 day')`) }
  if (comAnexo) condicoes.push('tem_anexo = true')
  // Rascunhos ficam fora de toda listagem normal por padrão — só aparecem
  // explicitamente na pasta "Rascunhos" (listarRascunhos), senão poluiriam
  // a caixa de entrada e "Todas as contas" com e-mails nunca enviados.
  if (!incluirRascunhos) condicoes.push('rascunho = false')
}

export async function listarMensagens({ contaId, busca, apenasNaoLidas, etiquetaId, pastaId, todasAsPastas, sinalizada, remetente, dataInicio, dataFim, comAnexo, caixaSaida, limite = 50, offset = 0 } = {}) {
  const condicoes = []
  const params = []
  montarCondicoes({ contaId, busca, apenasNaoLidas, etiquetaId, pastaId, todasAsPastas, sinalizada, remetente, dataInicio, dataFim, comAnexo, caixaSaida }, params, condicoes)
  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : ''
  params.push(limite, offset)
  return query(
    `SELECT id, conta_id, remetente_nome, remetente_email, destinatarios, assunto, data_envio, lida, respondida, encaminhada, tem_anexo, origem, sinalizada,
            envio_status, envio_erro, envio_tentativas, envio_proxima_tentativa
     FROM email_mensagem_001
     ${where}
     ORDER BY data_envio DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )
}

export async function contarMensagens({ contaId, busca, apenasNaoLidas, etiquetaId, pastaId, todasAsPastas, sinalizada, remetente, dataInicio, dataFim, comAnexo, caixaSaida } = {}) {
  const condicoes = []
  const params = []
  montarCondicoes({ contaId, busca, apenasNaoLidas, etiquetaId, pastaId, todasAsPastas, sinalizada, remetente, dataInicio, dataFim, comAnexo, caixaSaida }, params, condicoes)
  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : ''
  const row = await queryOne(`SELECT COUNT(*) AS total FROM email_mensagem_001 ${where}`, params)
  return Number(row.total)
}

// Agrupa mensagens por thread_id (COALESCE pra 'msg-<id>' quando nula,
// senao mensagens sem thread_id colapsariam todas numa unica linha) e
// retorna so a mais recente de cada conversa, com contagem e flag de nao
// lida agregada — usado pelo modo "agrupar por conversa" da lista.
export async function listarMensagensAgrupadas({ contaId, busca, apenasNaoLidas, etiquetaId, pastaId, todasAsPastas, sinalizada, remetente, dataInicio, dataFim, comAnexo, caixaSaida, limite = 50, offset = 0 } = {}) {
  const condicoes = []
  const params = []
  montarCondicoes({ contaId, busca, apenasNaoLidas, etiquetaId, pastaId, todasAsPastas, sinalizada, remetente, dataInicio, dataFim, comAnexo, caixaSaida }, params, condicoes)
  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : ''
  params.push(limite, offset)
  return query(
    `WITH threads AS (
       SELECT COALESCE(thread_id, 'msg-' || id::text) AS grupo,
              MAX(data_envio) AS ultima_data,
              COUNT(*) AS total,
              BOOL_OR(NOT lida) AS tem_nao_lida,
              (ARRAY_AGG(id ORDER BY data_envio DESC))[1] AS mensagem_mais_recente_id
       FROM email_mensagem_001
       ${where}
       GROUP BY grupo
     )
     SELECT m.id, m.conta_id, m.remetente_nome, m.remetente_email, m.destinatarios, m.assunto, m.data_envio,
            m.lida, m.respondida, m.encaminhada, m.tem_anexo, m.origem, m.sinalizada,
            m.envio_status, m.envio_erro, m.envio_tentativas, m.envio_proxima_tentativa,
            t.grupo AS thread_grupo, t.total AS thread_total, t.tem_nao_lida AS thread_tem_nao_lida
     FROM threads t
     JOIN email_mensagem_001 m ON m.id = t.mensagem_mais_recente_id
     ORDER BY t.ultima_data DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )
}

export async function contarThreads({ contaId, busca, apenasNaoLidas, etiquetaId, pastaId, todasAsPastas, sinalizada, remetente, dataInicio, dataFim, comAnexo, caixaSaida } = {}) {
  const condicoes = []
  const params = []
  montarCondicoes({ contaId, busca, apenasNaoLidas, etiquetaId, pastaId, todasAsPastas, sinalizada, remetente, dataInicio, dataFim, comAnexo, caixaSaida }, params, condicoes)
  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : ''
  const row = await queryOne(
    `SELECT COUNT(DISTINCT COALESCE(thread_id, 'msg-' || id::text)) AS total FROM email_mensagem_001 ${where}`,
    params
  )
  return Number(row.total)
}

// Mensagens de uma thread especifica, para expandir a conversa inline.
// grupo e o mesmo valor de thread_grupo devolvido por listarMensagensAgrupadas
// (thread_id real, ou 'msg-<id>' sintetico pra mensagens sem thread_id).
export async function listarMensagensDaThread(grupo) {
  if (grupo?.startsWith('msg-')) {
    const id = Number(grupo.slice(4))
    return query(
      `SELECT id, conta_id, remetente_nome, remetente_email, assunto, data_envio, lida, respondida, encaminhada, tem_anexo, origem
       FROM email_mensagem_001 WHERE id = $1`, [id])
  }
  return query(
    `SELECT id, conta_id, remetente_nome, remetente_email, assunto, data_envio, lida, respondida, encaminhada, tem_anexo, origem
     FROM email_mensagem_001 WHERE thread_id = $1 ORDER BY data_envio ASC`, [grupo])
}

// Nao lidas da CAIXA DE ENTRADA da conta (nao de todas as pastas) — bate
// com o que o usuario ve ao clicar na conta. rascunho=false: rascunho
// nunca conta como nao lido.
export async function contarNaoLidas(contaId) {
  const row = await queryOne(
    `SELECT COUNT(*) AS total FROM email_mensagem_001
     WHERE conta_id = $1 AND lida = false AND rascunho = false
       AND (pasta_id IN (SELECT id FROM email_pasta_001 WHERE special_use IS NULL)
            OR (pasta_id IS NULL AND pasta_imap = 'INBOX'))`,
    [contaId]
  )
  return Number(row.total)
}

// Nao lidas quebradas por pasta, para o badge em cada item de pasta da
// navegacao. A chave 'INBOX' agrega o que esta na Caixa de Entrada (pasta
// com special_use nulo, ou ainda sem pasta_id resolvido). rascunho=false:
// rascunho nunca conta como "nao lido".
export async function contarNaoLidasPorPasta(contaId) {
  const rows = await query(
    `SELECT
       CASE
         WHEN p.special_use IS NULL THEN 'INBOX'
         WHEN m.pasta_id IS NULL AND m.pasta_imap = 'INBOX' THEN 'INBOX'
         ELSE m.pasta_id::text
       END AS chave,
       COUNT(*)::int AS total
     FROM email_mensagem_001 m
     LEFT JOIN email_pasta_001 p ON p.id = m.pasta_id
     WHERE m.conta_id = $1 AND m.lida = false AND m.rascunho = false
     GROUP BY chave`,
    [contaId]
  )
  const porPasta = {}
  for (const r of rows) porPasta[r.chave] = (porPasta[r.chave] || 0) + r.total
  return porPasta
}

export async function obterMensagem(mensagemId) {
  const mensagem = await queryOne('SELECT * FROM email_mensagem_001 WHERE id = $1', [mensagemId])
  if (!mensagem) return null
  // mostrar_lista = false sao imagens inline de decoracao (logo/foto de
  // assinatura) — servidas ao corpo via kmail://, mas fora da barra "Anexos".
  const anexos = await query(
    'SELECT * FROM email_anexo_001 WHERE mensagem_id = $1 AND mostrar_lista = true ORDER BY id',
    [mensagemId]
  )
  const etiquetas = await query(
    `SELECT e.id, e.nome, e.cor FROM email_etiqueta_001 e
     JOIN email_mensagem_etiqueta_001 me ON me.etiqueta_id = e.id
     WHERE me.mensagem_id = $1 ORDER BY e.ordem, e.nome`,
    [mensagemId]
  )
  const corpo_html = await hidratarCorpoHtml(mensagem.corpo_html)
  return { ...mensagem, corpo_html, anexos, etiquetas }
}

export async function marcarLida(mensagemId, lida = true) {
  const registro = await queryOne('UPDATE email_mensagem_001 SET lida = $2 WHERE id = $1 RETURNING *', [mensagemId, lida])
  if (!registro) throw new Error('Mensagem não encontrada.')
  atualizarBadgeNaoLidas().catch(() => {})
  // Espelha no servidor (\Seen) em segundo plano - nunca atrasa nem falha a
  // resposta local por causa disso (rede fora, conta offline...).
  marcarLidaNoServidor([registro], lida).catch(() => {})
  return registro
}

// Em lote: mesmo espelhamento de marcarLida(), em segundo plano.
export async function marcarLidaLote(ids, lida = true) {
  if (!Array.isArray(ids) || !ids.length) return { atualizadas: 0 }
  const rows = await query(
    'UPDATE email_mensagem_001 SET lida = $1 WHERE id = ANY($2::int[]) RETURNING id, conta_id, pasta_imap, uid_imap',
    [lida, ids]
  )
  atualizarBadgeNaoLidas().catch(() => {})
  marcarLidaNoServidor(rows, lida).catch(() => {})
  return { atualizadas: rows.length }
}

export async function marcarRespondida(mensagemId) {
  await query('UPDATE email_mensagem_001 SET respondida = true WHERE id = $1', [mensagemId])
}

export async function marcarEncaminhada(mensagemId) {
  await query('UPDATE email_mensagem_001 SET encaminhada = true WHERE id = $1', [mensagemId])
}

export async function sinalizar(mensagemId, sinalizada = true) {
  const registro = await queryOne('UPDATE email_mensagem_001 SET sinalizada = $2 WHERE id = $1 RETURNING *', [mensagemId, sinalizada])
  if (!registro) throw new Error('Mensagem não encontrada.')
  return registro
}

export async function sinalizarLote(ids, sinalizada = true) {
  if (!Array.isArray(ids) || !ids.length) return { atualizadas: 0 }
  const rows = await query(
    'UPDATE email_mensagem_001 SET sinalizada = $1 WHERE id = ANY($2::int[]) RETURNING id',
    [sinalizada, ids]
  )
  return { atualizadas: rows.length }
}

// ── Rascunhos ────────────────────────────────────────────────────────────
// Rascunhos vivem na mesma tabela (rascunho=true), sem pasta_imap/uid_imap
// reais — nunca passaram pelo servidor. pasta_imap='DRAFT' é um sentinela
// local, mesmo padrão do 'SENT' já usado por emailEnvioService.js pra
// cópias enviadas, com uid sintético pra respeitar a constraint de unicidade.
export async function listarRascunhos(contaId) {
  const condicoes = ['rascunho = true']
  const params = []
  if (contaId) { params.push(contaId); condicoes.push(`conta_id = $${params.length}`) }
  return query(
    `SELECT id, conta_id, destinatarios, copia, copia_oculta, assunto, data_envio
     FROM email_mensagem_001 WHERE ${condicoes.join(' AND ')} ORDER BY data_envio DESC`,
    params
  )
}

export async function salvarRascunho({ id, contaId, para, cc, cco, assunto, corpoTexto, corpoHtml }) {
  const destinatarios = String(para || '').split(',').map(e => ({ nome: '', email: e.trim() })).filter(d => d.email)
  const copia = cc ? String(cc).split(',').map(e => ({ nome: '', email: e.trim() })).filter(d => d.email) : []
  const copiaOculta = cco ? String(cco).split(',').map(e => ({ nome: '', email: e.trim() })).filter(d => d.email) : []

  if (id) {
    const registro = await queryOne(
      `UPDATE email_mensagem_001
       SET destinatarios=$2, copia=$3, copia_oculta=$4, assunto=$5, corpo_texto=$6, corpo_html=$7, data_envio=NOW()
       WHERE id=$1 AND rascunho=true RETURNING *`,
      [id, JSON.stringify(destinatarios), JSON.stringify(copia), JSON.stringify(copiaOculta), assunto || '', corpoTexto || '', corpoHtml || '']
    )
    if (!registro) throw new Error('Rascunho não encontrado.')
    return registro
  }

  const conta = await queryOne('SELECT nome, email FROM email_conta_001 WHERE id = $1', [contaId])
  if (!conta) throw new Error('Conta de e-mail não encontrada.')
  const uidSintetico = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return queryOne(
    `INSERT INTO email_mensagem_001
       (conta_id, uid_imap, pasta_imap, remetente_nome, remetente_email, destinatarios, copia, copia_oculta,
        assunto, corpo_texto, corpo_html, data_envio, origem, rascunho)
     VALUES ($1,$2,'DRAFT',$3,$4,$5,$6,$7,$8,$9,$10,NOW(),'enviado',true)
     RETURNING *`,
    [contaId, uidSintetico, conta.nome, conta.email, JSON.stringify(destinatarios), JSON.stringify(copia), JSON.stringify(copiaOculta),
      assunto || '', corpoTexto || '', corpoHtml || '']
  )
}

// Autocomplete de destinatarios no compositor. Junta duas fontes:
//  1. HISTORICO de e-mail: todo mundo que ja apareceu como remetente ou
//     destinatario/copia de qualquer mensagem (enviada ou recebida), com o
//     nome quando conhecido. Ranqueado por frequencia + recencia.
//  2. CONTATOS de Entidade: e-mails cadastrados em entidade_contato_001, com
//     o nome do contato e da entidade.
// Devolve no maximo `limite` sugestoes, deduplicadas por e-mail (a de maior
// peso vence), ja ordenadas.
export async function sugerirContatos(termo = '', limite = 8) {
  const t = String(termo || '').trim().toLowerCase()
  if (t.length < 1) return []
  const like = `%${t}%`

  // 1) historico — explode o jsonb de destinatarios/copia + o remetente
  const historico = await query(
    `WITH pessoas AS (
       SELECT remetente_email AS email, remetente_nome AS nome, data_envio AS quando
         FROM email_mensagem_001
        WHERE remetente_email IS NOT NULL AND remetente_email <> ''
       UNION ALL
       SELECT d->>'email' AS email, d->>'nome' AS nome, data_envio AS quando
         FROM email_mensagem_001, jsonb_array_elements(
                COALESCE(destinatarios,'[]'::jsonb) || COALESCE(copia,'[]'::jsonb) || COALESCE(copia_oculta,'[]'::jsonb)
              ) AS d
     )
     SELECT lower(email) AS email,
            (array_agg(nome ORDER BY quando DESC NULLS LAST) FILTER (WHERE nome IS NOT NULL AND nome <> ''))[1] AS nome,
            count(*) AS freq,
            max(quando) AS ultimo
       FROM pessoas
      WHERE email IS NOT NULL AND email <> '' AND position('@' in email) > 1
        AND (lower(email) LIKE $1 OR lower(coalesce(nome,'')) LIKE $1)
      GROUP BY lower(email)
      ORDER BY freq DESC, ultimo DESC NULLS LAST
      LIMIT 40`,
    [like]
  )

  // 2) contatos de Entidade
  const contatos = await query(
    `SELECT lower(c.email) AS email, c.nome AS nome, e.nome AS entidade
       FROM entidade_contato_001 c
       JOIN entidade_001 e ON e.id = c.entidade_id
      WHERE c.email IS NOT NULL AND c.email <> '' AND position('@' in c.email) > 1
        AND (lower(c.email) LIKE $1 OR lower(coalesce(c.nome,'')) LIKE $1 OR lower(coalesce(e.nome,'')) LIKE $1)
      LIMIT 40`,
    [like]
  ).catch(() => [])

  // nomes vindos de header MIME as vezes chegam entre aspas: 'Fulano' ou "Fulano"
  const limparNome = (n) => String(n || '').trim().replace(/^["']+|["']+$/g, '').trim()

  const mapa = new Map()
  for (const r of historico) {
    mapa.set(r.email, { email: r.email, nome: limparNome(r.nome), origem: 'historico', peso: Number(r.freq) || 1 })
  }
  for (const c of contatos) {
    const ex = mapa.get(c.email)
    const nome = limparNome(c.nome) || (ex && ex.nome) || ''
    const rotulo = c.entidade ? `${nome || c.email} · ${c.entidade}` : nome
    if (ex) {
      ex.nome = rotulo || ex.nome
      ex.origem = 'ambos'
      ex.peso += 100 // contato cadastrado ganha prioridade
    } else {
      mapa.set(c.email, { email: c.email, nome: rotulo, origem: 'entidade', peso: 100 })
    }
  }

  return [...mapa.values()]
    .sort((a, b) => b.peso - a.peso)
    .slice(0, limite)
}

export async function excluirRascunho(id) {
  const reg = await queryOne('SELECT conta_id FROM email_mensagem_001 WHERE id = $1 AND rascunho = true', [id])
  await query('DELETE FROM email_mensagem_001 WHERE id = $1 AND rascunho = true', [id])
  // Apaga tambem a pasta de anexos do rascunho (o CASCADE so limpa as
  // linhas de email_anexo_001, nao os arquivos em disco).
  if (reg) {
    const base = resolverBaseAnexos('arquivosEmail')
    if (base) {
      const pasta = join(base, 'email', String(reg.conta_id), String(id))
      if (existsSync(pasta)) { try { rmSync(pasta, { recursive: true, force: true }) } catch { /* em uso */ } }
    }
  }
}
