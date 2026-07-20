export function registerAgendaHandlers({ ipcMain, wrap, query, queryOne }) {

  ipcMain.handle('agenda:getByMonth', wrap(async (_, { mes, ano }) => {
    // Tenta agenda_eventos (nova estrutura). Se não existir, cai no age_001.
    try {
      return await query(`
        SELECT e.*,
               c.nome AS categoria_nome, c.cor AS categoria_cor,
               s.nome AS status_nome,    s.cor AS status_cor,
               cl.nome AS cliente_nome
        FROM agenda_eventos e
        LEFT JOIN agenda_categorias c ON c.id = e.categoria_id
        LEFT JOIN agenda_status     s ON s.id = e.status_id
        LEFT JOIN entidade_001     cl ON cl.id = e.cliente_id
        WHERE EXTRACT(MONTH FROM e.dt_evento) = $1
          AND EXTRACT(YEAR  FROM e.dt_evento) = $2
        ORDER BY e.dt_evento, e.hr_inicio NULLS LAST
      `, [mes, ano])
    } catch {
      return query(`SELECT * FROM age_001 WHERE EXTRACT(MONTH FROM dt_evento)=$1 AND EXTRACT(YEAR FROM dt_evento)=$2 ORDER BY dt_evento, hr_inicio NULLS LAST`, [mes, ano])
    }
  }))

  ipcMain.handle('agenda:create', wrap(async (_, d) => {
    try {
      const row = await queryOne(`SELECT nextval('agenda_eventos_codigo_seq') AS next`)
      const codigo = String(row.next).padStart(5, '0')
      return queryOne(`
        INSERT INTO agenda_eventos
          (titulo, categoria_id, status_id, cliente_id, dt_evento, hr_inicio, hr_fim, dia_todo, local, descricao, lembrete, min_lembrete, recorrencia, codigo)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *
      `, [d.titulo, d.categoria_id||null, d.status_id||null, d.cliente_id||null,
          d.dt_evento||null, d.hr_inicio||null, d.hr_fim||null, d.dia_todo??false,
          d.local||'', d.descricao||'', d.lembrete??false, d.min_lembrete??30,
          d.recorrencia||'nenhuma', codigo])
    } catch {
      const row = await queryOne(`SELECT nextval('age_001_codigo_seq') AS next`)
      const codigo = String(row.next).padStart(3,'0')
      return queryOne(`
        INSERT INTO age_001 (titulo, categoria, dt_evento, hr_inicio, hr_fim, descricao, status, lembrete, min_lembrete, codigo)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
      `, [d.titulo, 'Tarefa', d.dt_evento||null, d.hr_inicio||null, d.hr_fim||null, d.descricao||'', 'Pendente', d.lembrete??false, d.min_lembrete??30, codigo])
    }
  }))

  ipcMain.handle('agenda:update', wrap(async (_, d) => {
    try {
      return queryOne(`
        UPDATE agenda_eventos
        SET titulo=$1, categoria_id=$2, status_id=$3, cliente_id=$4,
            dt_evento=$5, hr_inicio=$6, hr_fim=$7, dia_todo=$8,
            local=$9, descricao=$10, lembrete=$11, min_lembrete=$12, recorrencia=$13
        WHERE id=$14 RETURNING *
      `, [d.titulo, d.categoria_id||null, d.status_id||null, d.cliente_id||null,
          d.dt_evento||null, d.hr_inicio||null, d.hr_fim||null, d.dia_todo??false,
          d.local||'', d.descricao||'', d.lembrete??false, d.min_lembrete??30,
          d.recorrencia||'nenhuma', d.id])
    } catch {
      return queryOne(`
        UPDATE age_001 SET titulo=$1, dt_evento=$2, hr_inicio=$3, hr_fim=$4, descricao=$5, lembrete=$6, min_lembrete=$7
        WHERE id=$8 RETURNING *
      `, [d.titulo, d.dt_evento||null, d.hr_inicio||null, d.hr_fim||null, d.descricao||'', d.lembrete??false, d.min_lembrete??30, d.id])
    }
  }))

  ipcMain.handle('agenda:delete', wrap(async (_, id) => {
    try { await query('DELETE FROM agenda_eventos WHERE id=$1', [id]) }
    catch { await query('DELETE FROM age_001 WHERE id=$1', [id]) }
  }))
}
