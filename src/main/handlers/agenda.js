import { getPool } from '../db.js'
import { generateRecurringInstances } from '../services/recurrence.js'

function normalizarLembretes(lembretes) {
  if (!Array.isArray(lembretes)) return []
  return [...new Set(lembretes.map(Number).filter(n => Number.isFinite(n) && n > 0))]
}

async function gravarLembretes(client, eventoId, lembretes) {
  await client.query('DELETE FROM agenda_lembretes WHERE evento_id=$1', [eventoId])
  for (const min of lembretes) {
    await client.query('INSERT INTO agenda_lembretes (evento_id, min_antes) VALUES ($1,$2)', [eventoId, min])
  }
}

export function registerAgendaHandlers({ ipcMain, wrap, query, queryOne }) {

  // ── Categorias ─────────────────────────────────────────────────────────
  ipcMain.handle('agenda:listarCategorias', wrap(async () => {
    return query(`SELECT * FROM agenda_categorias WHERE ativo=TRUE ORDER BY nome`)
  }))

  ipcMain.handle('agenda:criarCategoria', wrap(async (_, d) => {
    if (!d.nome?.trim()) throw new Error('Nome é obrigatório.')
    return queryOne(`
      INSERT INTO agenda_categorias (codigo, nome, cor, icone, descricao)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [d.codigo || '', d.nome.trim(), d.cor || '#6366F1', d.icone || '', d.descricao || ''])
  }))

  ipcMain.handle('agenda:atualizarCategoria', wrap(async (_, d) => {
    if (!d.nome?.trim()) throw new Error('Nome é obrigatório.')
    const row = await queryOne(`
      UPDATE agenda_categorias
      SET codigo=$1, nome=$2, cor=$3, icone=$4, descricao=$5, alterado_em=NOW()
      WHERE id=$6 RETURNING *
    `, [d.codigo || '', d.nome.trim(), d.cor || '#6366F1', d.icone || '', d.descricao || '', d.id])
    if (!row) throw new Error(`Categoria #${d.id} não encontrada.`)
    return row
  }))

  ipcMain.handle('agenda:excluirCategoria', wrap(async (_, id) => {
    const uso = await queryOne(
      `SELECT COUNT(*)::int AS n FROM agenda_eventos WHERE categoria_id=$1 AND ativo=true`, [id])
    if (uso.n > 0) throw new Error(`Categoria em uso por ${uso.n} evento(s). Não é possível excluir.`)
    await query('DELETE FROM agenda_categorias WHERE id=$1', [id])
  }))

  // ── Status ─────────────────────────────────────────────────────────────
  ipcMain.handle('agenda:listarStatus', wrap(async () => {
    return query(`SELECT * FROM agenda_status WHERE ativo=TRUE ORDER BY ordem, nome`)
  }))

  ipcMain.handle('agenda:criarStatus', wrap(async (_, d) => {
    if (!d.nome?.trim()) throw new Error('Nome é obrigatório.')
    return queryOne(`
      INSERT INTO agenda_status (codigo, nome, cor, ordem, icone)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [d.codigo || '', d.nome.trim(), d.cor || '#94A3B8', d.ordem ?? 99, d.icone || ''])
  }))

  ipcMain.handle('agenda:atualizarStatus', wrap(async (_, d) => {
    if (!d.nome?.trim()) throw new Error('Nome é obrigatório.')
    const row = await queryOne(`
      UPDATE agenda_status
      SET codigo=$1, nome=$2, cor=$3, ordem=$4, icone=$5, alterado_em=NOW()
      WHERE id=$6 RETURNING *
    `, [d.codigo || '', d.nome.trim(), d.cor || '#94A3B8', d.ordem ?? 99, d.icone || '', d.id])
    if (!row) throw new Error(`Status #${d.id} não encontrado.`)
    return row
  }))

  ipcMain.handle('agenda:excluirStatus', wrap(async (_, id) => {
    const uso = await queryOne(
      `SELECT COUNT(*)::int AS n FROM agenda_eventos WHERE status_id=$1 AND ativo=true`, [id])
    if (uso.n > 0) throw new Error(`Status em uso por ${uso.n} evento(s). Não é possível excluir.`)
    await query('DELETE FROM agenda_status WHERE id=$1', [id])
  }))

  // ── Eventos ────────────────────────────────────────────────────────────
  const SELECT_EVENTOS = `
    SELECT e.*,
           c.nome AS categoria_nome, c.cor AS categoria_cor,
           s.nome AS status_nome,    s.cor AS status_cor,
           cl.nome AS cliente_nome,
           COALESCE(lb.lembretes, '{}') AS lembretes
    FROM agenda_eventos e
    LEFT JOIN agenda_categorias c ON c.id = e.categoria_id
    LEFT JOIN agenda_status     s ON s.id = e.status_id
    LEFT JOIN entidade_001     cl ON cl.id = e.cliente_id
    LEFT JOIN LATERAL (
      SELECT array_agg(min_antes ORDER BY min_antes) AS lembretes
      FROM agenda_lembretes WHERE evento_id = e.id
    ) lb ON true
  `

  ipcMain.handle('agenda:getByMonth', wrap(async (_, { mes, ano }) => {
    return query(`
      ${SELECT_EVENTOS}
      WHERE e.ativo=TRUE
        AND EXTRACT(MONTH FROM e.dt_evento) = $1
        AND EXTRACT(YEAR  FROM e.dt_evento) = $2
      ORDER BY e.dt_evento, e.hr_inicio NULLS LAST
    `, [mes, ano])
  }))

  ipcMain.handle('agenda:getByRange', wrap(async (_, { inicio, fim }) => {
    return query(`
      ${SELECT_EVENTOS}
      WHERE e.ativo=TRUE AND e.dt_evento BETWEEN $1 AND $2
      ORDER BY e.dt_evento, e.hr_inicio NULLS LAST
    `, [inicio, fim])
  }))

  ipcMain.handle('agenda:create', wrap(async (_, d) => {
    if (!d.titulo?.trim()) throw new Error('Título é obrigatório.')
    if (!d.dt_evento)      throw new Error('Data do evento é obrigatória.')

    const lembretes = normalizarLembretes(d.lembretes)
    const temLembrete = lembretes.length > 0
    const minLembrete = temLembrete ? Math.min(...lembretes) : (d.min_lembrete ?? 30)

    const client = await getPool().connect()
    try {
      await client.query('BEGIN')
      const seq = await client.query(`SELECT nextval('agenda_eventos_codigo_seq') AS next`)
      const codigo = String(seq.rows[0].next).padStart(5, '0')
      const ins = await client.query(`
        INSERT INTO agenda_eventos
          (titulo, categoria_id, status_id, cliente_id, dt_evento, hr_inicio, hr_fim, dia_todo, local, descricao, lembrete, min_lembrete, recorrencia, codigo)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *
      `, [d.titulo, d.categoria_id||null, d.status_id||null, d.cliente_id||null,
          d.dt_evento, d.hr_inicio||null, d.hr_fim||null, d.dia_todo??false,
          d.local||'', d.descricao||'', temLembrete, minLembrete,
          d.recorrencia||'nenhuma', codigo])
      const parent = ins.rows[0]
      await gravarLembretes(client, parent.id, lembretes)

      if (d.recorrencia && d.recorrencia !== 'nenhuma') {
        await client.query(`UPDATE agenda_eventos SET recorrencia_grupo_id=$1 WHERE id=$1`, [parent.id])
        parent.recorrencia_grupo_id = parent.id

        const datas = await generateRecurringInstances({ parentEvent: parent, recorrencia: d.recorrencia })
        for (const data of datas) {
          const seqN = await client.query(`SELECT nextval('agenda_eventos_codigo_seq') AS next`)
          const codigoN = String(seqN.rows[0].next).padStart(5, '0')
          const insN = await client.query(`
            INSERT INTO agenda_eventos
              (titulo, categoria_id, status_id, cliente_id, dt_evento, hr_inicio, hr_fim, dia_todo, local, descricao, lembrete, min_lembrete, recorrencia, codigo, recorrencia_grupo_id)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id
          `, [parent.titulo, parent.categoria_id, parent.status_id, parent.cliente_id,
              data.toISOString().slice(0, 10), parent.hr_inicio, parent.hr_fim, parent.dia_todo,
              parent.local, parent.descricao, parent.lembrete, parent.min_lembrete,
              parent.recorrencia, codigoN, parent.id])
          await gravarLembretes(client, insN.rows[0].id, lembretes)
        }
      }
      await client.query('COMMIT')
      parent.lembretes = lembretes
      return parent
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }))

  ipcMain.handle('agenda:update', wrap(async (_, d) => {
    if (!d.titulo?.trim()) throw new Error('Título é obrigatório.')
    if (!d.dt_evento)      throw new Error('Data do evento é obrigatória.')

    const lembretes = normalizarLembretes(d.lembretes)
    const temLembrete = lembretes.length > 0
    const minLembrete = temLembrete ? Math.min(...lembretes) : (d.min_lembrete ?? 30)

    const client = await getPool().connect()
    try {
      await client.query('BEGIN')
      const upd = await client.query(`
        UPDATE agenda_eventos
        SET titulo=$1, categoria_id=$2, status_id=$3, cliente_id=$4,
            dt_evento=$5, hr_inicio=$6, hr_fim=$7, dia_todo=$8,
            local=$9, descricao=$10, lembrete=$11, min_lembrete=$12, recorrencia=$13,
            alterado_em=NOW()
        WHERE id=$14 RETURNING *
      `, [d.titulo, d.categoria_id||null, d.status_id||null, d.cliente_id||null,
          d.dt_evento, d.hr_inicio||null, d.hr_fim||null, d.dia_todo??false,
          d.local||'', d.descricao||'', temLembrete, minLembrete,
          d.recorrencia||'nenhuma', d.id])
      const row = upd.rows[0]
      if (!row) throw new Error(`Evento #${d.id} não encontrado.`)
      await gravarLembretes(client, row.id, lembretes)
      await client.query('COMMIT')
      row.lembretes = lembretes
      return row
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }))

  ipcMain.handle('agenda:delete', wrap(async (_, id) => {
    const row = await queryOne('SELECT id FROM agenda_eventos WHERE id=$1', [id])
    if (!row) throw new Error(`Evento #${id} não encontrado.`)
    await query('DELETE FROM agenda_eventos WHERE id=$1', [id])
  }))

  // Exclui este evento e todas as ocorrências futuras da mesma série
  // (mesmo recorrencia_grupo_id, dt_evento >= dt_evento do evento clicado).
  ipcMain.handle('agenda:deleteSerieFutura', wrap(async (_, id) => {
    const row = await queryOne('SELECT id, dt_evento::text AS dt_evento, recorrencia_grupo_id FROM agenda_eventos WHERE id=$1', [id])
    if (!row) throw new Error(`Evento #${id} não encontrado.`)
    if (!row.recorrencia_grupo_id) {
      await query('DELETE FROM agenda_eventos WHERE id=$1', [id])
      return { removidos: 1 }
    }
    const del = await query(
      `DELETE FROM agenda_eventos WHERE recorrencia_grupo_id=$1 AND dt_evento>=$2::date RETURNING id`,
      [row.recorrencia_grupo_id, row.dt_evento]
    )
    return { removidos: del.length }
  }))
}
