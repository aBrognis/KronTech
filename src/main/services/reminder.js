import { Notification, nativeImage } from 'electron'
import { join } from 'path'
import { query } from '../db'
import { extendRecurringSeries } from './recurrence'

const notified = new Set()
const icon = nativeImage.createFromPath(join(__dirname, '../../resources/icon.ico'))

async function check() {
  try {
    const rows = await query(`
      SELECT id, titulo, hr_inicio, min_lembrete
      FROM agenda_eventos
      WHERE lembrete = true
        AND ativo = true
        AND dt_evento = CURRENT_DATE
        AND hr_inicio IS NOT NULL
    `)

    const now = new Date()
    const nowMin = now.getHours() * 60 + now.getMinutes()

    for (const r of rows) {
      if (notified.has(r.id)) continue
      const [h, m] = String(r.hr_inicio).split(':').map(Number)
      const eventMin   = h * 60 + m
      const triggerMin = eventMin - (r.min_lembrete ?? 30)
      // Dispara se já passou do horário de aviso E o evento ainda não começou —
      // corrige a perda de lembrete quando o app fica fechado durante a janela.
      if (nowMin >= triggerMin && nowMin < eventMin) {
        notified.add(r.id)
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
  setInterval(() => {
    check()
    topUpRecurringSeries()
  }, 60_000)
}
