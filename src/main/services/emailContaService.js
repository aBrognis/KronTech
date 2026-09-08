import { ImapFlow } from 'imapflow'
import nodemailer from 'nodemailer'
import { existsSync, rmSync } from 'fs'
import { join } from 'path'
import { query, queryOne } from '../db'
import { encryptCofre, decryptCofre, getConfig, resolverBaseAnexos } from '../config'
import { authImap, authSmtp } from './emailAuth'

// Ordenacao da barra lateral: agrupa por provedor, e dentro do grupo
// respeita a ordem manual (coluna `ordem`), desempatando por nome. A UI
// exibe os grupos numa ordem fixa (gmail, outlook, imap_generico); aqui so
// garantimos que contas do mesmo provedor saem na sequencia certa.
export async function listarContas() {
  return query('SELECT * FROM email_conta_001 ORDER BY provedor, ordem, nome')
}

// Reordena as contas de UM provedor. Recebe a lista completa de ids desse
// provedor na nova ordem e regrava `ordem` = posicao (1..N). So mexe nas
// contas passadas — contas de outros provedores ficam intactas.
export async function reordenarContas(idsNaOrdem) {
  if (!Array.isArray(idsNaOrdem) || !idsNaOrdem.length) return { ok: true }
  const values = idsNaOrdem.map((id, i) => `(${Number(id)}, ${i + 1})`).join(', ')
  await query(
    `UPDATE email_conta_001 AS c
     SET ordem = v.ord, atualizado_em = NOW()
     FROM (VALUES ${values}) AS v(id, ord)
     WHERE c.id = v.id`
  )
  return { ok: true }
}

export async function obterConta(contaId) {
  return queryOne('SELECT * FROM email_conta_001 WHERE id = $1', [contaId])
}

export async function criarConta(dados) {
  const codRow = await queryOne(`SELECT nextval('email_conta_001_codigo_seq') AS next`)
  const codigo = String(codRow.next).padStart(4, '0')
  // Outlook autentica por OAuth: guarda o refresh_token cifrado e o
  // client_id (nao-segredo). Demais provedores usam senha de app.
  const ehOauth = dados.authTipo === 'oauth_outlook'
  return queryOne(
    `INSERT INTO email_conta_001
       (codigo, nome, email, provedor, auth_tipo, imap_host, imap_porta, imap_seguranca,
        smtp_host, smtp_porta, smtp_seguranca, usuario_login, senha_app_cifrada,
        oauth_refresh_token_cifrado, oauth_client_id, sincronizar_desde, reply_to, avatar_cor)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING *`,
    [
      codigo, dados.nome, dados.email, dados.provedor, dados.authTipo || 'senha_app',
      dados.imapHost, dados.imapPorta, dados.imapSeguranca,
      dados.smtpHost, dados.smtpPorta, dados.smtpSeguranca,
      dados.usuarioLogin,
      ehOauth ? null : (dados.senhaApp ? encryptCofre(dados.senhaApp) : null),
      ehOauth && dados.oauthRefreshToken ? encryptCofre(dados.oauthRefreshToken) : null,
      ehOauth ? ((dados.oauthClientId || '').trim() || null) : null,
      dados.sincronizarDesde, dados.replyTo || null, dados.avatarCor || null,
    ]
  )
}

export async function atualizarConta(contaId, dados) {
  // Senha só é sobrescrita se o usuário digitou uma nova — o campo nunca
  // volta em claro pro frontend, então "deixar em branco" significa "manter
  // a senha atual", não "apagar a senha".
  const registro = dados.senhaApp
    ? await queryOne(
        `UPDATE email_conta_001
         SET nome=$2, provedor=$3, imap_host=$4, imap_porta=$5, imap_seguranca=$6,
             smtp_host=$7, smtp_porta=$8, smtp_seguranca=$9, usuario_login=$10,
             senha_app_cifrada=$11, ativa=$12, reply_to=$13, avatar_cor=$14, atualizado_em=NOW()
         WHERE id=$1 RETURNING *`,
        [contaId, dados.nome, dados.provedor, dados.imapHost, dados.imapPorta, dados.imapSeguranca,
         dados.smtpHost, dados.smtpPorta, dados.smtpSeguranca, dados.usuarioLogin,
         encryptCofre(dados.senhaApp), dados.ativa !== false, dados.replyTo || null, dados.avatarCor || null]
      )
    : await queryOne(
        `UPDATE email_conta_001
         SET nome=$2, provedor=$3, imap_host=$4, imap_porta=$5, imap_seguranca=$6,
             smtp_host=$7, smtp_porta=$8, smtp_seguranca=$9, usuario_login=$10,
             ativa=$11, reply_to=$12, avatar_cor=$13, atualizado_em=NOW()
         WHERE id=$1 RETURNING *`,
        [contaId, dados.nome, dados.provedor, dados.imapHost, dados.imapPorta, dados.imapSeguranca,
         dados.smtpHost, dados.smtpPorta, dados.smtpSeguranca, dados.usuarioLogin, dados.ativa !== false, dados.replyTo || null, dados.avatarCor || null]
      )
  if (!registro) throw new Error('Conta de e-mail não encontrada.')
  return registro
}

export async function excluirConta(contaId) {
  await query('DELETE FROM email_conta_001 WHERE id = $1', [contaId])
  // Remove a pasta inteira de anexos/imagens inline da conta (o CASCADE do
  // banco nao toca em disco).
  const base = resolverBaseAnexos('arquivosEmail')
  if (base) {
    const pasta = join(base, 'email', String(contaId))
    if (existsSync(pasta)) { try { rmSync(pasta, { recursive: true, force: true }) } catch { /* em uso */ } }
  }
}

// Separado de atualizarConta() porque é editado num fluxo próprio (aba de
// assinatura no modal da conta), não precisa das validações de credencial/
// teste de conexão do formulário principal.
export async function atualizarAssinatura(contaId, { assinaturaHtml, assinaturaAtiva }) {
  const registro = await queryOne(
    `UPDATE email_conta_001 SET assinatura_html=$2, assinatura_ativa=$3, atualizado_em=NOW() WHERE id=$1 RETURNING *`,
    [contaId, assinaturaHtml || null, assinaturaAtiva !== false]
  )
  if (!registro) throw new Error('Conta de e-mail não encontrada.')
  return registro
}

// Testa IMAP + SMTP com um objeto `auth` já montado (basic ou XOAUTH2), sem
// persistir nada. `authImap`/`authSmtp` diferem só no formato do OAuth
// (nodemailer quer { type: 'OAuth2', ... }).
async function testarComAuth({ imapHost, imapPorta, imapSeguranca, smtpHost, smtpPorta, smtpSeguranca, authImapObj, authSmtpObj }) {
  const client = new ImapFlow({
    host: imapHost,
    port: imapPorta,
    secure: imapSeguranca === 'tls',
    auth: authImapObj,
    logger: false,
  })
  try {
    await client.connect()
    await client.noop()
  } finally {
    try { await client.logout() } catch { /* melhor esforço */ }
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPorta,
    secure: smtpSeguranca === 'tls',
    auth: authSmtpObj,
  })
  await transporter.verify()

  return { ok: true }
}

// Testa com dados do formulário (senha de app), sem persistir — botão
// "Testar conexão" do modal, provedores não-Outlook.
export async function testarConexao({ imapHost, imapPorta, imapSeguranca, smtpHost, smtpPorta, smtpSeguranca, usuarioLogin, senhaApp }) {
  return testarComAuth({
    imapHost, imapPorta, imapSeguranca, smtpHost, smtpPorta, smtpSeguranca,
    authImapObj: { user: usuarioLogin, pass: senhaApp },
    authSmtpObj: { user: usuarioLogin, pass: senhaApp },
  })
}

// Testa a conexão de uma conta já salva usando a senha cifrada do banco —
// decifrada só aqui no backend, nunca enviada ao frontend. Usado quando o
// usuário edita a conta (nome, data de sincronização etc.) sem trocar a
// senha: sem isso ele seria obrigado a redigitar a senha de app toda vez
// só para poder testar a conexão de novo.
export async function testarConexaoConta(contaId) {
  const conta = await queryOne('SELECT * FROM email_conta_001 WHERE id = $1', [contaId])
  if (!conta) throw new Error('Conta de e-mail não encontrada.')

  if (conta.auth_tipo === 'oauth_outlook') {
    if (!conta.oauth_refresh_token_cifrado) {
      throw new Error('Esta conta ainda não fez login com a Microsoft. Edite a conta e clique em "Entrar com a Microsoft".')
    }
    return testarComAuth({
      imapHost: conta.imap_host, imapPorta: conta.imap_porta, imapSeguranca: conta.imap_seguranca,
      smtpHost: conta.smtp_host, smtpPorta: conta.smtp_porta, smtpSeguranca: conta.smtp_seguranca,
      authImapObj: await authImap(conta),
      authSmtpObj: await authSmtp(conta),
    })
  }

  if (!conta.senha_app_cifrada) throw new Error('Esta conta não tem senha salva, digite a senha de app para testar.')
  return testarConexao({
    imapHost: conta.imap_host, imapPorta: conta.imap_porta, imapSeguranca: conta.imap_seguranca,
    smtpHost: conta.smtp_host, smtpPorta: conta.smtp_porta, smtpSeguranca: conta.smtp_seguranca,
    usuarioLogin: conta.usuario_login, senhaApp: decryptCofre(conta.senha_app_cifrada),
  })
}
