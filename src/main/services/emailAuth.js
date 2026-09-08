import { decryptCofre } from '../config'
import { obterAccessTokenOutlook } from './oauthService'

// Monta o objeto `auth` que o imapflow e o nodemailer esperam, escolhendo
// entre senha de app (basic-auth) e XOAUTH2 (OAuth2) conforme conta.auth_tipo.
// Centralizado aqui pra que TODOS os pontos de conexao (sync, IDLE, pastas,
// envio, teste) usem exatamente a mesma logica.

// imapflow: aceita { user, pass } OU { user, accessToken }.
export async function authImap(conta) {
  if (conta.auth_tipo === 'oauth_outlook') {
    return { user: conta.usuario_login || conta.email, accessToken: await obterAccessTokenOutlook(conta) }
  }
  return { user: conta.usuario_login, pass: decryptCofre(conta.senha_app_cifrada) }
}

// nodemailer: { user, pass } OU { type: 'OAuth2', user, accessToken }.
export async function authSmtp(conta) {
  if (conta.auth_tipo === 'oauth_outlook') {
    return { type: 'OAuth2', user: conta.usuario_login || conta.email, accessToken: await obterAccessTokenOutlook(conta) }
  }
  return { user: conta.usuario_login, pass: decryptCofre(conta.senha_app_cifrada) }
}
