import { query } from '../db.js'

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function addMonths(date, n) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

function stepFor(recorrencia) {
  if (recorrencia === 'diaria')  return (x) => addDays(x, 1)
  if (recorrencia === 'semanal') return (x) => addDays(x, 7)
  return (x) => addMonths(x, 1) // mensal
}

export async function generateRecurringInstances({ parentEvent, recorrencia, windowMonths = 6 }) {
  const dates = []
  const start = new Date(parentEvent.dt_evento)
  const end = addMonths(start, windowMonths)
  const step = stepFor(recorrencia)
  let d = step(start)
  while (d <= end) {
    dates.push(new Date(d))
    d = step(d)
  }
  return dates
}

export async function extendRecurringSeries() {
  const parents = await query(`
    SELECT e.id, e.dt_evento, e.recorrencia, e.titulo, e.categoria_id, e.status_id,
           e.cliente_id, e.hr_inicio, e.hr_fim, e.dia_todo, e.local, e.descricao,
           e.lembrete, e.min_lembrete
    FROM agenda_eventos_001 e
    WHERE e.id = e.recorrencia_grupo_id
      AND e.recorrencia <> 'nenhuma'
      AND e.ativo = TRUE
  `)

  for (const parent of parents) {
    const ultima = await query(`
      SELECT MAX(dt_evento) AS max_dt FROM agenda_eventos_001 WHERE recorrencia_grupo_id=$1
    `, [parent.id])
    const maxDt = ultima[0]?.max_dt ? new Date(ultima[0].max_dt) : new Date(parent.dt_evento)

    const cinco_meses = addMonths(new Date(), 5)
    if (maxDt >= cinco_meses) continue

    const step = stepFor(parent.recorrencia)
    const end = addMonths(new Date(), 6)
    let d = step(maxDt)
    while (d <= end) {
      const seq = await query(`SELECT nextval('agenda_eventos_001_codigo_seq') AS next`)
      const codigo = String(seq[0].next).padStart(5, '0')
      await query(`
        INSERT INTO agenda_eventos_001
          (titulo, categoria_id, status_id, cliente_id, dt_evento, hr_inicio, hr_fim, dia_todo, local, descricao, lembrete, min_lembrete, recorrencia, codigo, recorrencia_grupo_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      `, [parent.titulo, parent.categoria_id, parent.status_id, parent.cliente_id,
          d.toISOString().slice(0, 10), parent.hr_inicio, parent.hr_fim, parent.dia_todo,
          parent.local, parent.descricao, parent.lembrete, parent.min_lembrete,
          parent.recorrencia, codigo, parent.id])
      d = step(d)
    }
  }
}
