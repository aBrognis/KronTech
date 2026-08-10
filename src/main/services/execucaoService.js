import { Notification, BrowserWindow } from 'electron'
import { query, queryOne } from '../db'

// Substitui {campo} pelo valor correspondente em contexto.
export function interpolar(texto, contexto = {}) {
  return String(texto ?? '').replace(/\{(\w+)\}/g, (_, k) => contexto[k] ?? '')
}

export function interpolarSQL(texto, contexto = {}) {
  return String(texto ?? '').replace(/\{(\w+)\}/g, (_, k) => {
    const v = contexto[k]
    if (v == null) return 'NULL'
    return `'${String(v).replace(/'/g, "''")}'`
  })
}

function broadcast(channel, data) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, data)
  }
}

export async function logExecucao(origemTipo, origemId, sucesso, mensagem, duracaoMs) {
  await query(
    `INSERT INTO kr_execucoes_log (origem_tipo, origem_id, sucesso, mensagem, duracao_ms) VALUES ($1,$2,$3,$4,$5)`,
    [origemTipo, origemId, sucesso, mensagem || '', duracaoMs || null]
  ).catch(e => console.warn('[execucaoService] logExecucao:', e.message))
}

export async function executarScript(scriptId) {
  const s = await queryOne('SELECT * FROM kr_scripts WHERE id=$1 AND ativo=TRUE', [scriptId])
  if (!s) throw new Error('Script não encontrado ou inativo.')
  return query(s.sql_texto)
}

export async function executarIntegracao(integracaoId, contexto = {}) {
  const i = await queryOne('SELECT * FROM kr_integracoes WHERE id=$1 AND ativo=TRUE', [integracaoId])
  if (!i) throw new Error('Integração não encontrada ou inativa.')
  return executarIntegracaoAdHoc(i, contexto)
}

// Compartilhado por integrações salvas e por etapas "api" de Fluxos (que não
// têm uma integração salva por trás, só os campos definidos na própria etapa).
export async function executarIntegracaoAdHoc(cfg, contexto = {}) {
  const headers = { 'Content-Type': 'application/json', ...(cfg.headers || {}) }
  if (cfg.auth_tipo === 'bearer' && cfg.auth_token) headers.Authorization = `Bearer ${cfg.auth_token}`
  if (cfg.auth_tipo === 'basic' && cfg.auth_token) headers.Authorization = `Basic ${Buffer.from(cfg.auth_token).toString('base64')}`
  if (cfg.auth_tipo === 'apikey' && cfg.auth_token) headers[cfg.auth_key_header || 'X-API-Key'] = cfg.auth_token
  const metodo = cfg.metodo || 'GET'
  const body = interpolar(cfg.body, contexto)
  const res = await fetch(cfg.url, {
    method: metodo,
    headers,
    body: ['POST', 'PUT', 'PATCH'].includes(metodo) ? body : undefined
  })
  const text = await res.text()
  let data = text
  try { data = JSON.parse(text) } catch {}
  return { ok: res.ok, status: res.status, data }
}

export async function enviarNotificacao(notificacaoId, contexto = {}) {
  const n = await queryOne('SELECT * FROM kr_notificacoes WHERE id=$1 AND ativo=TRUE', [notificacaoId])
  if (!n) throw new Error('Notificação não encontrada ou inativa.')
  return enviarNotificacaoAdHoc(n, contexto)
}

export async function enviarNotificacaoAdHoc(cfg, contexto = {}) {
  const msg = interpolar(cfg.mensagem, contexto)
  const titulo = interpolar(cfg.titulo, contexto) || 'KronTech'
  if (cfg.tipo === 'desktop') {
    new Notification({ title: titulo, body: msg }).show()
  } else if (cfg.tipo === 'webhook') {
    await fetch(cfg.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, mensagem: msg })
    })
  } else {
    broadcast('funcoes:toast', { titulo, mensagem: msg, tipo: cfg.tipo_toast || 'info' })
  }
}
