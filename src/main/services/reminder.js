import { Notification, nativeImage } from 'electron'
import { join } from 'path'
import { query } from '../db'
import { extendRecurringSeries } from './recurrence'
import { checkStatusAutomatico } from './statusAutomatico'
import { checkAgendamentos } from './agendamentoService'

const notified = new Set()
const icon = nativeImage.createFromPath(join(__dirname, '../../resources/icon.ico'))

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
  setInterval(() => {
    check()
    topUpRecurringSeries()
    checkStatusAutomatico()
    checkAgendamentos()
  }, 60_000)
}
