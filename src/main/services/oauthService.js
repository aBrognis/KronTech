import { BrowserWindow } from 'electron'
import { createHash, randomBytes } from 'crypto'
import { query, queryOne } from '../db'
import { encryptCofre, decryptCofre, getOutlookClientId } from '../config'

// Login OAuth2 (Authorization Code + PKCE) para contas Outlook / Microsoft
// 365. A Microsoft desativou basic-auth (senha de app) no IMAP/SMTP, entao
// contas 'outlook' autenticam com XOAUTH2:
//   1. iniciarLoginOutlook() abre uma janela na tela de login da Microsoft;
//   2. o usuario entra (com 2FA se tiver), a Microsoft redireciona pro
//      redirect_uri com ?code=...;
//   3. troca o code por access_token + refresh_token (PKCE, sem client
//      secret — e um app publico/desktop);
//   4. guarda so o refresh_token cifrado no banco (oauth_refresh_token_cifrado);
//   5. obterAccessTokenOutlook() usa esse refresh_token pra pegar um
//      access_token novo quando precisar (cache em memoria ate expirar).

const AUTORIZE_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
const TOKEN_URL    = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
const REDIRECT_URI = 'http://localhost'
// IMAP + SMTP como usuario + refresh token offline. Sem os prefixos de
// recurso a Microsoft devolve token sem escopo de mailbox.
const SCOPES = [
  'https://outlook.office.com/IMAP.AccessAsUser.All',
  'https://outlook.office.com/SMTP.Send',
  'offline_access',
].join(' ')

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function gerarPkce() {
  const verifier = base64url(randomBytes(32))
  const challenge = base64url(createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

// Resolve o client_id na ordem: o da conta (se informado) > o global do
// .ini / Configuracoes. Sem nenhum, o login nao tem como acontecer.
function resolverClientId(clientIdConta) {
  const id = (clientIdConta || '').trim() || getOutlookClientId()
  if (!id) {
    throw new Error(
      'Nenhum Client ID do Azure configurado. Cadastre em Configurações > E-mail (Client ID do Outlook) antes de entrar com a Microsoft.'
    )
  }
  return id
}

async function trocarCodePorTokens({ clientId, code, verifier }) {
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
    scope: SCOPES,
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`Falha ao concluir o login Microsoft: ${data.error_description || data.error || res.status}`)
  }
  return data // { access_token, refresh_token, expires_in, ... }
}

// Abre a janela de login e resolve com { refreshToken, accessToken, expiresIn }.
// Rejeita se o usuario fechar a janela ou a Microsoft devolver erro.
export function iniciarLoginOutlook({ clientId, loginHint } = {}) {
  const idApp = resolverClientId(clientId)
  const { verifier, challenge } = gerarPkce()
  const state = base64url(randomBytes(12))

  const params = new URLSearchParams({
    client_id: idApp,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    response_mode: 'query',
    scope: SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  })
  if (loginHint) params.set('login_hint', loginHint)

  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      width: 520,
      height: 680,
      title: 'Entrar com a Microsoft',
      autoHideMenuBar: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true, partition: 'oauth-outlook' },
    })

    let finalizado = false
    const encerrar = (fn) => {
      if (finalizado) return
      finalizado = true
      try { win.removeAllListeners('closed') } catch { /* noop */ }
      try { win.close() } catch { /* noop */ }
      fn()
    }

    const tratarUrl = async (url) => {
      if (!url.startsWith(REDIRECT_URI)) return
      let parsed
      try { parsed = new URL(url) } catch { return }
      const err = parsed.searchParams.get('error')
      if (err) {
        encerrar(() => reject(new Error(parsed.searchParams.get('error_description') || err)))
        return
      }
      const code = parsed.searchParams.get('code')
      const st = parsed.searchParams.get('state')
      if (!code) return
      if (st !== state) {
        encerrar(() => reject(new Error('Resposta de login inválida (state divergente).')))
        return
      }
      try {
        const tokens = await trocarCodePorTokens({ clientId: idApp, code, verifier })
        if (!tokens.refresh_token) {
          throw new Error('A Microsoft não retornou refresh_token. Verifique se o escopo offline_access está liberado no app do Azure.')
        }
        encerrar(() => resolve({
          refreshToken: tokens.refresh_token,
          accessToken: tokens.access_token,
          expiresIn: tokens.expires_in || 3600,
        }))
      } catch (e) {
        encerrar(() => reject(e))
      }
    }

    // will-redirect cobre o 302 pro localhost antes de ele tentar carregar
    // (nao existe servidor em localhost, carregaria erro de conexao).
    win.webContents.on('will-redirect', (_e, url) => { tratarUrl(url) })
    win.webContents.on('will-navigate', (_e, url) => { tratarUrl(url) })
    win.on('closed', () => encerrar(() => reject(new Error('Login cancelado.'))))

    win.loadURL(`${AUTORIZE_URL}?${params.toString()}`)
  })
}

// ── Access token para uso no IMAP/SMTP ────────────────────────────────────
// Cache em memoria por conta: { token, expiraEm (epoch ms) }.
const cacheAccessToken = new Map()

async function renovarComRefreshToken({ clientId, refreshToken }) {
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`Sessão da conta Microsoft expirou (${data.error || res.status}). Entre com a Microsoft novamente.`)
  }
  return data // { access_token, expires_in, refresh_token? }
}

// Devolve um access_token valido pra `conta` (linha de email_conta_001).
// Usa cache; renova via refresh_token quando falta < 2 min pro fim.
// Se a Microsoft rotacionar o refresh_token, regrava o novo cifrado.
export async function obterAccessTokenOutlook(conta) {
  const cache = cacheAccessToken.get(conta.id)
  if (cache && cache.expiraEm - Date.now() > 120_000) return cache.token

  if (!conta.oauth_refresh_token_cifrado) {
    throw new Error(`A conta "${conta.nome}" não tem login Microsoft ativo. Edite a conta e entre com a Microsoft.`)
  }
  const clientId = resolverClientId(conta.oauth_client_id)
  const refreshToken = decryptCofre(conta.oauth_refresh_token_cifrado)
  const data = await renovarComRefreshToken({ clientId, refreshToken })

  if (data.refresh_token && data.refresh_token !== refreshToken) {
    await query(
      'UPDATE email_conta_001 SET oauth_refresh_token_cifrado = $2, atualizado_em = NOW() WHERE id = $1',
      [conta.id, encryptCofre(data.refresh_token)]
    )
  }
  const token = data.access_token
  cacheAccessToken.set(conta.id, { token, expiraEm: Date.now() + (data.expires_in || 3600) * 1000 })
  return token
}

export function limparCacheOAuth(contaId) {
  cacheAccessToken.delete(contaId)
}

// Persiste o resultado de iniciarLoginOutlook numa conta ja existente
// (fluxo "editar conta e reconectar") ou devolve os campos prontos pro
// INSERT (fluxo "nova conta").
export async function salvarLoginOutlookNaConta(contaId, { refreshToken, clientId }) {
  const registro = await queryOne(
    `UPDATE email_conta_001
     SET auth_tipo = 'oauth_outlook',
         oauth_refresh_token_cifrado = $2,
         oauth_client_id = $3,
         senha_app_cifrada = NULL,
         sync_status = 'nunca_sincronizada',
         sync_erro_msg = NULL,
         atualizado_em = NOW()
     WHERE id = $1
     RETURNING *`,
    [contaId, encryptCofre(refreshToken), (clientId || '').trim() || null]
  )
  if (!registro) throw new Error('Conta de e-mail não encontrada.')
  limparCacheOAuth(contaId)
  return registro
}
