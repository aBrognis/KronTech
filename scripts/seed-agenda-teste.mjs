// Script utilitário: cria alguns compromissos de teste na Agenda para
// validar múltiplos lembretes, conflito de horário, drag-and-drop e status
// automático. Roda como Node puro (sem Electron) — em dev as credenciais do
// banco são fixas (ver src/main/config.js), então não precisa de safeStorage.
// Uso: node scripts/seed-agenda-teste.mjs
import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  host: 'localhost', port: 5432, database: 'krontech_dev',
  user: 'postgres', password: process.env.KRONTECH_DEV_DB_PASSWORD || 'postgres',
})

try {
  const cat = await pool.query(`SELECT id FROM agenda_categorias_001 ORDER BY id LIMIT 1`)
  const st  = await pool.query(`SELECT id FROM agenda_status_001 ORDER BY id LIMIT 1`)
  const categoriaId = cat.rows[0]?.id || null
  const statusId = st.rows[0]?.id || null

  const seqCodigo = async () => {
    const r = await pool.query(`SELECT nextval('agenda_eventos_001_codigo_seq') AS next`)
    return String(r.rows[0].next).padStart(5, '0')
  }

  const now = new Date()
  const hoje = now.toISOString().slice(0, 10)
  const pad = n => String(n).padStart(2, '0')
  const horaDaqui = (min) => {
    const d = new Date(now.getTime() + min * 60000)
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:00`
  }
  const horaAtras = (min) => {
    const d = new Date(now.getTime() - min * 60000)
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:00`
  }

  const eventos = [
    // 1) Já passou do horário, sem hr_fim informado -> deve virar 'atrasado'
    //    no próximo tick de 60s (status_auto continua 'agendado' até lá).
    { titulo: 'Teste atraso (sem hr_fim)', hr_inicio: horaAtras(90), hr_fim: null },

    // 2) Passou tanto de hr_inicio quanto de hr_fim -> também deve virar
    //    'atrasado' rapidamente (já ultrapassou o limite calculado).
    { titulo: 'Teste atraso (com hr_fim)', hr_inicio: horaAtras(60), hr_fim: horaAtras(30) },

    // 3) Início em ~1 minuto -> deve disparar a notificação com botões
    //    "Iniciar agora"/"Ainda não" no próximo tick.
    { titulo: 'Teste notificação (inicia já)', hr_inicio: horaDaqui(1), hr_fim: horaDaqui(31) },

    // 4-5) Par sobreposto no mesmo horário -> testa o layout lado a lado
    //    de conflito (Dia/Semana).
    { titulo: 'Conflito A (14:00-15:00)', hr_inicio: '14:00:00', hr_fim: '15:00:00' },
    { titulo: 'Conflito B (14:30-15:30)', hr_inicio: '14:30:00', hr_fim: '15:30:00' },

    // 6) Evento futuro simples, sem sobreposição -> bom para testar
    //    drag-and-drop sem interferência.
    { titulo: 'Evento livre p/ arrastar', hr_inicio: '16:00:00', hr_fim: '16:30:00' },
  ]

  const ids = []
  for (const ev of eventos) {
    const codigo = await seqCodigo()
    const r = await pool.query(`
      INSERT INTO agenda_eventos_001
        (titulo, categoria_id, status_id, dt_evento, hr_inicio, hr_fim, dia_todo, local, descricao, lembrete, min_lembrete, recorrencia, codigo, ativo)
      VALUES ($1,$2,$3,$4,$5,$6,false,'','',false,30,'nenhuma',$7,true)
      RETURNING id, titulo, hr_inicio, hr_fim
    `, [ev.titulo, categoriaId, statusId, hoje, ev.hr_inicio, ev.hr_fim, codigo])
    ids.push(r.rows[0])
  }

  // Lembretes de teste no evento de conflito A (múltiplos lembretes).
  const conflitoA = ids.find(e => e.titulo.startsWith('Conflito A'))
  if (conflitoA) {
    await pool.query(`INSERT INTO agenda_lembretes_001 (evento_id, min_antes) VALUES ($1,5),($1,30)`, [conflitoA.id])
  }

  console.log('Eventos de teste criados:')
  for (const e of ids) {
    console.log(`  #${e.id}  ${e.titulo}  ${e.hr_inicio?.toString().slice(0,5) || '(sem hora)'}${e.hr_fim ? ' - ' + e.hr_fim.toString().slice(0,5) : ''}`)
  }
} catch (err) {
  console.error('Erro ao criar eventos de teste:', err.message)
} finally {
  await pool.end()
}
