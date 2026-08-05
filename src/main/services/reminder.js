import { Notification, nativeImage } from 'electron'
import { join } from 'path'
import { query } from '../db'

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
      if (nowMin >= triggerMin && nowMin < triggerMin + 2) {
        notified.add(r.id)
        new Notification({
          title: 'KronTech — Lembrete',
          body:  `${r.titulo} começa em ${r.min_lembrete ?? 30} minuto(s)`,
          icon,
        }).show()
      }
    }
  } catch {}
}

export function startReminderCheck() {
  check()
  setInterval(check, 60_000)
}
