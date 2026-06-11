import { Notification } from 'electron'
import { query } from './db'

const notified = new Set()

async function check() {
  try {
    const rows = await query(`
      SELECT id, titulo, hr_inicio, min_lembrete
      FROM age_001
      WHERE lembrete = true
        AND status = 'Pendente'
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
      if (nowMin >= triggerMin && nowMin < triggerMin + 2) {
        notified.add(r.id)
        new Notification({
          title: `⏰ KronTech — Lembrete`,
          body:  `${r.titulo} começa em ${r.min_lembrete ?? 30} minuto(s)`,
        }).show()
      }
    }
  } catch {}
}

export function startReminderCheck() {
  check()
  setInterval(check, 60_000)
}
