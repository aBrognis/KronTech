import nodemailer from 'nodemailer'
import { existsSync, mkdirSync, renameSync, copyFileSync, statSync } from 'fs'
import { join } from 'path'
import { query, queryOne } from '../db'
import { getConfig, resolverBaseAnexos } from '../config'
import { authSmtp } from './emailAuth'

// ── Envio + Caixa de Saida ──────────────────────────────────────────────
// Fluxo novo (nao perde e-mail):
//  1. Grava SEMPRE o registro local (origem='enviado', envio_status='fila')
//     e move os anexos antes de tentar o SMTP.
//  2. Tenta enviar:
//       ok                      -> envio_status='enviado' + smtp_response
//       falha de conexao/servidor -> continua 'fila', agenda nova tentativa
//       falha permanente (auth,
//       destinatario invalido)  -> envio_status='erro' (precisa de acao)
//  3. tentarFilaSaida() (chamado pelo worker de sync) reprocessa a 'fila'
//     com backoff exponencial.

const MAX_TENTATIVAS = 5
// backoff: 1min, 5min, 15min, 30min, 60min
const BACKOFF_MIN = [1, 5, 15, 30, 60]

// Erros que NAO adianta reenviar (o problema e o dado, nao a rede).
function ehFalhaPermanente(cod) {
  return cod === 'EAUTH' || cod === 'EENVELOPE' || cod === 'EMESSAGE'
}

function mensagemErroAmigavel(err, conta) {
  const cod = err.code || ''
  if (cod === 'ETIMEDOUT' || cod === 'ESOCKET' || cod === 'ECONNECTION') {
    return `Sem conexão com o servidor de envio (${conta.smtp_host}:${conta.smtp_porta}).`
  }
  if (cod === 'EAUTH') return 'O servidor de envio recusou o login. Confira o usuário e a senha de app da conta.'
  if (cod === 'EENVELOPE' || cod === 'EMESSAGE') return `O servidor recusou a mensagem: ${err.response || err.message}`
  return `Falha ao enviar: ${err.response || err.message}`
}

// Faz SO a parte SMTP: monta o transporte, envia, devolve o `info` do
// nodemailer. Lanca com err.code preservado.
async function despacharSmtp(conta, { para, cc, cco, assunto, corpoHtml, corpoTexto, emReplyA, anexos }) {
  const transporter = nodemailer.createTransport({
    host: conta.smtp_host,
    port: conta.smtp_porta,
    secure: conta.smtp_seguranca === 'tls',
    requireTLS: conta.smtp_seguranca === 'starttls',
    connectionTimeout: 30_000,
    greetingTimeout: 30_000,
    socketTimeout: 60_000,
    auth: await authSmtp(conta),
  })
  return transporter.sendMail({
    from: conta.email,
    to: para,
    cc: cc || undefined,
    bcc: cco || undefined,
    replyTo: conta.reply_to || undefined,
    subject: assunto,
    html: corpoHtml,
    text: corpoTexto,
    inReplyTo: emReplyA || undefined,
    attachments: (anexos || []).map(a => ({ filename: a.nome || a.nome_original, path: a.caminho })),
  })
}

// Aplica o resultado de um envio bem-sucedido no registro ja gravado.
async function marcarEnviado(registroId, info, mensagemOrigemId, rascunhoId) {
  const smtpResposta = info.response || (info.accepted?.length ? 'aceito pelo servidor' : null)
  await query(
    `UPDATE email_mensagem_001
     SET envio_status='enviado', envio_erro=NULL, envio_proxima_tentativa=NULL,
         message_id = COALESCE(message_id, $2), smtp_response=$3, smtp_rejeitados=$4,
         data_envio = NOW()
     WHERE id=$1`,
    [registroId, info.messageId || null, smtpResposta, JSON.stringify(info.rejected || [])]
  )
  if (mensagemOrigemId) {
    await query('UPDATE email_mensagem_001 SET respondida = true WHERE id = $1', [mensagemOrigemId])
  }
  if (rascunhoId) {
    await query('DELETE FROM email_mensagem_001 WHERE id = $1 AND rascunho = true', [rascunhoId])
  }
}

// Agenda nova tentativa (fica na 'fila') ou marca 'erro' se esgotou.
async function agendarRetry(registroId, tentativasFeitas, msgErro, permanente) {
  if (permanente || tentativasFeitas >= MAX_TENTATIVAS) {
    await query(
      `UPDATE email_mensagem_001 SET envio_status='erro', envio_erro=$2, envio_proxima_tentativa=NULL WHERE id=$1`,
      [registroId, msgErro]
    )
    return { estado: 'erro', erro: msgErro }
  }
  const min = BACKOFF_MIN[Math.min(tentativasFeitas, BACKOFF_MIN.length - 1)]
  await query(
    `UPDATE email_mensagem_001
     SET envio_status='fila', envio_erro=$2, envio_proxima_tentativa = NOW() + ($3 || ' minutes')::interval
     WHERE id=$1`,
    [registroId, msgErro, String(min)]
  )
  return { estado: 'fila', erro: msgErro, proximaEmMin: min }
}

export async function enviarEmail({ contaId, para, cc, cco, assunto, corpoHtml, corpoTexto, anexos = [], emReplyA, mensagemOrigemId, rascunhoId }) {
  const conta = await queryOne('SELECT * FROM email_conta_001 WHERE id = $1', [contaId])
  if (!conta) throw new Error('Conta de e-mail não encontrada.')

  const uidSintetico = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const destinatarios = String(para).split(',').map(e => ({ nome: '', email: e.trim() })).filter(d => d.email)
  const copia = cc ? String(cc).split(',').map(e => ({ nome: '', email: e.trim() })).filter(d => d.email) : []
  const copiaOculta = cco ? String(cco).split(',').map(e => ({ nome: '', email: e.trim() })).filter(d => d.email) : []

  let threadId = null
  if (mensagemOrigemId) {
    const origem = await queryOne('SELECT thread_id, message_id FROM email_mensagem_001 WHERE id = $1', [mensagemOrigemId])
    threadId = origem?.thread_id || origem?.message_id || emReplyA || null
  }

  // 1) Grava o registro ANTES de tentar o SMTP — assim, se a rede cair, o
  //    e-mail fica na Caixa de Saida em vez de sumir. Comeca como 'fila'.
  const registro = await queryOne(
    `INSERT INTO email_mensagem_001
       (conta_id, uid_imap, pasta_imap, message_id, in_reply_to, thread_id,
        remetente_nome, remetente_email, destinatarios, copia, copia_oculta, assunto,
        corpo_texto, corpo_html, data_envio, tem_anexo, origem, envio_status)
     VALUES ($1,$2,'SENT',NULL,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),$13,'enviado','fila')
     RETURNING *`,
    [
      contaId, uidSintetico, emReplyA || null, threadId,
      conta.nome, conta.email, JSON.stringify(destinatarios), JSON.stringify(copia), JSON.stringify(copiaOculta),
      assunto, corpoTexto || '', corpoHtml || '', anexos.length > 0,
    ]
  )
  if (anexos.length) {
    await gravarAnexosDaMensagemEnviada(contaId, registro.id, anexos)
  }

  // 2) Tenta enviar agora.
  const anexosDoRegistro = await query('SELECT nome_original, caminho FROM email_anexo_001 WHERE mensagem_id = $1', [registro.id])
  try {
    const info = await despacharSmtp(conta, { para, cc, cco, assunto, corpoHtml, corpoTexto, emReplyA, anexos: anexosDoRegistro })

    if (info.rejected?.length) {
      // Destinatario recusado = falha permanente (nao adianta reenviar).
      await agendarRetry(registro.id, MAX_TENTATIVAS, `Destinatário(s) recusado(s): ${info.rejected.join(', ')}`, true)
      const e = new Error(`O servidor recusou ${info.rejected.length} destinatário(s): ${info.rejected.join(', ')}. A mensagem ficou na Caixa de Saída como erro.`)
      e.filaSaida = true
      throw e
    }

    await marcarEnviado(registro.id, info, mensagemOrigemId, rascunhoId)
    return { ...registro, envio_status: 'enviado', smtp_response: info.response || null }
  } catch (err) {
    if (err.filaSaida) throw err // ja tratado acima
    const permanente = ehFalhaPermanente(err.code || '')
    const msg = mensagemErroAmigavel(err, conta)
    const r = await agendarRetry(registro.id, 1, msg, permanente)
    // Rascunho NAO e apagado quando o envio falhou permanente (usuario pode
    // querer corrigir e reenviar). Quando foi so a rede, apaga: a mensagem
    // ja esta na Caixa de Saida e vai sozinha.
    if (r.estado === 'fila' && rascunhoId) {
      await query('DELETE FROM email_mensagem_001 WHERE id = $1 AND rascunho = true', [rascunhoId])
    }
    const e = new Error(
      r.estado === 'erro'
        ? `${msg} A mensagem ficou na Caixa de Saída como erro.`
        : `${msg} A mensagem foi para a Caixa de Saída e será reenviada automaticamente.`
    )
    e.filaSaida = true
    throw e
  }
}

// Reprocessa a Caixa de Saida. Chamado pelo worker de sync (a cada ciclo)
// e pelo botao "Reenviar agora" (forcar = ignora o horario agendado).
export async function tentarFilaSaida({ forcar = false, mensagemId = null } = {}) {
  const cond = forcar
    ? `envio_status IN ('fila','erro')`
    : `envio_status = 'fila' AND (envio_proxima_tentativa IS NULL OR envio_proxima_tentativa <= NOW())`
  const params = []
  let filtroMsg = ''
  if (mensagemId) { params.push(mensagemId); filtroMsg = ` AND m.id = $${params.length}` }

  const pendentes = await query(
    `SELECT m.*, c.smtp_host, c.smtp_porta, c.smtp_seguranca, c.reply_to, c.email AS conta_email,
            c.usuario_login, c.senha_app_cifrada, c.auth_tipo, c.oauth_refresh_token_cifrado, c.oauth_client_id, c.nome AS conta_nome
     FROM email_mensagem_001 m
     JOIN email_conta_001 c ON c.id = m.conta_id AND c.ativa = true
     WHERE m.origem = 'enviado' AND ${cond}${filtroMsg}
     ORDER BY m.criado_em ASC
     LIMIT 20`,
    params
  )
  let enviados = 0
  for (const m of pendentes) {
    // trava reentrancia
    const trava = await queryOne(
      `UPDATE email_mensagem_001 SET envio_status='enviando'
       WHERE id=$1 AND envio_status IN ('fila','erro') RETURNING id`,
      [m.id]
    )
    if (!trava) continue

    const anexos = await query('SELECT nome_original, caminho FROM email_anexo_001 WHERE mensagem_id = $1', [m.id])
    const conta = {
      smtp_host: m.smtp_host, smtp_porta: m.smtp_porta, smtp_seguranca: m.smtp_seguranca,
      reply_to: m.reply_to, email: m.conta_email, usuario_login: m.usuario_login,
      senha_app_cifrada: m.senha_app_cifrada, auth_tipo: m.auth_tipo,
      oauth_refresh_token_cifrado: m.oauth_refresh_token_cifrado, oauth_client_id: m.oauth_client_id,
      nome: m.conta_nome, id: m.conta_id,
    }
    const para = (m.destinatarios || []).map(d => d.email).join(', ')
    const cc = (m.copia || []).map(d => d.email).join(', ')
    const cco = (m.copia_oculta || []).map(d => d.email).join(', ')
    try {
      const info = await despacharSmtp(conta, {
        para, cc, cco, assunto: m.assunto, corpoHtml: m.corpo_html, corpoTexto: m.corpo_texto,
        emReplyA: m.in_reply_to, anexos,
      })
      if (info.rejected?.length) {
        await agendarRetry(m.id, MAX_TENTATIVAS, `Destinatário(s) recusado(s): ${info.rejected.join(', ')}`, true)
      } else {
        await marcarEnviado(m.id, info, null, null)
        enviados++
      }
    } catch (err) {
      const permanente = ehFalhaPermanente(err.code || '')
      await agendarRetry(m.id, (m.envio_tentativas || 0) + 1, mensagemErroAmigavel(err, conta), permanente)
    }
    // conta a tentativa
    await query('UPDATE email_mensagem_001 SET envio_tentativas = envio_tentativas + 1 WHERE id = $1', [m.id])
  }
  return { processados: pendentes.length, enviados }
}

// Cada anexo chega marcado com origem: 'novo' (arquivo temporário em
// email/rascunhos/, via arquivos:selecionarECopiar — move pra pasta
// definitiva) ou 'existente' (arquivo já definitivo de outra mensagem,
// reaproveitado ao encaminhar — copia, nunca move, pra não quebrar a
// mensagem original que ainda referencia esse mesmo arquivo).
async function gravarAnexosDaMensagemEnviada(contaId, mensagemId, anexos) {
  const base = resolverBaseAnexos('arquivosEmail')
  if (!base) return

  const pastaDestino = join(base, 'email', String(contaId), String(mensagemId))
  if (!existsSync(pastaDestino)) mkdirSync(pastaDestino, { recursive: true })

  for (const anexo of anexos) {
    const destino = join(pastaDestino, anexo.nome)
    try {
      if (anexo.origem === 'existente') copyFileSync(anexo.caminho, destino)
      else renameSync(anexo.caminho, destino)
    } catch {
      continue // arquivo já não existe mais (melhor esforço, não interrompe o envio já concluído)
    }
    const tamanho = statSync(destino).size
    await query(
      `INSERT INTO email_anexo_001 (mensagem_id, nome_original, caminho, tamanho_bytes)
       VALUES ($1,$2,$3,$4)`,
      [mensagemId, anexo.nome, destino, tamanho]
    )
  }
}
