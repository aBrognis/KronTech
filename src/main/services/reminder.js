import { Notification, nativeImage, app } from 'electron'
import { join } from 'path'
import { query } from '../db'
import { extendRecurringSeries } from './recurrence'
import { checkStatusAutomatico } from './statusAutomatico'
import { checkAgendamentos } from './agendamentoService'

const notified = new Set()
// Em produção, os .ico são copiados via extraResources (package.json) pra
// dentro de process.resourcesPath/resources. Em dev, __dirname fica dentro
// de out/main — se out/ for uma junction (movida pra fora do OneDrive),
// '../../resources' resolveria para o destino físico da junction, não a
// raiz real do projeto; app.getAppPath() não tem esse problema.
const iconBase = app.isPackaged ? join(process.resourcesPath, 'resources') : join(app.getAppPath(), 'resources')
const icon = nativeImage.createFromPath(join(iconBase, 'icon.ico'))

async function check() {
  try {
    const rows = await query(`
      SELECT e.id AS evento_id, e.titulo, e.hr_inicio, l.id AS lembrete_id, l.min_antes
      FROM agenda_eventos_001 e
      JOIN agenda_lembretes_001 l ON l.evento_id = e.id
      WHERE e.ativo = true
        AND e.dt_evento = CURRENT_DATE
        AND e.hr_inicio IS NOT NULL
    `)

    const now = new Date()
    const nowMin = now.getHours() * 60 + now.getMinutes()

    for (const r of rows) {
      const chave = `${r.evento_id}:${r.lembrete_id}`
      if (notified.has(chave)) continue
      const [h, m] = String(r.hr_inicio).split(':').map(Number)
      const eventMin   = h * 60 + m
      const triggerMin = eventMin - (r.min_antes ?? 30)
      // Dispara se já passou do horário de aviso E o evento ainda não começou —
      // corrige a perda de lembrete quando o app fica fechado durante a janela.
      if (nowMin >= triggerMin && nowMin < eventMin) {
        notified.add(chave)
        new Notification({
          title: 'KronTech — Lembrete',
          body:  `${r.titulo} começa em ${Math.max(0, eventMin - nowMin)} minuto(s)`,
          icon,
        }).show()
      }
    }
  } catch {}
}

// Documentos de entidade vencendo (IE, certidoes, contrato social...).
// Roda 1x por dia (na 1a checagem apos meia-noite). Notifica so uma vez
// por documento por dia.
let ultimoAlertaDocs = null
async function checkDocumentosEntidade() {
  const hoje = new Date().toISOString().slice(0, 10)
  if (ultimoAlertaDocs === hoje) return
  ultimoAlertaDocs = hoje
  try {
    const rows = await query(`
      SELECT d.tipo, d.validade, e.nome AS entidade_nome, e.codigo AS entidade_codigo
      FROM entidade_documento_001 d
      JOIN entidade_001 e ON e.id = d.entidade_id
      WHERE d.validade IS NOT NULL
        AND d.validade BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
      ORDER BY d.validade ASC
    `)
    if (!rows.length) return
    const linhas = rows.slice(0, 5).map(r => {
      const dias = Math.ceil((new Date(String(r.validade).slice(0, 10)) - new Date()) / 86400000)
      return `${r.entidade_nome}: ${r.tipo} vence em ${dias}d`
    })
    const extra = rows.length > 5 ? `\n+${rows.length - 5} outros` : ''
    new Notification({
      title: `KronTech — ${rows.length} documento(s) de entidade vencendo`,
      body: linhas.join('\n') + extra,
      icon,
    }).show()
  } catch (e) {
    // tabela pode nao existir ainda em bancos que nao rodaram a migration
    if (!/relation .* does not exist/i.test(e.message || '')) {
      console.warn('[reminder] checkDocumentosEntidade:', e.message)
    }
  }
}

let lastTopUpDate = null
async function topUpRecurringSeries() {
  const today = new Date().toISOString().slice(0, 10)
  if (lastTopUpDate === today) return
  lastTopUpDate = today
  try {
    await extendRecurringSeries()
  } catch (e) {
    console.warn('[reminder] topUpRecurringSeries:', e.message)
  }
}

export function startReminderCheck() {
  check()
  topUpRecurringSeries()
  checkStatusAutomatico()
  checkAgendamentos()
  checkDocumentosEntidade()
  setInterval(() => {
    check()
    topUpRecurringSeries()
    checkStatusAutomatico()
    checkAgendamentos()
    checkDocumentosEntidade()
  }, 60_000)
}
