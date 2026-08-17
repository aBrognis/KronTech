export function registerDashboardHandlers({ ipcMain, wrap, query, queryOne }) {

  ipcMain.handle('dash:getAll', wrap(async () => {
    return query('SELECT * FROM dash_001 ORDER BY grid_y, grid_x, id')
  }))

  ipcMain.handle('dash:create', wrap(async (_, d) => {
    return queryOne(
      `INSERT INTO dash_001
         (titulo, tipo, sql_query, icone, icone_lucide, cor, tamanho, intervalo, posicao,
          grid_x, grid_y, grid_w, grid_h, comparar_anterior, sql_query_anterior, formato)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [d.titulo, d.tipo, d.sql_query, d.icone ?? 'bar-chart', d.icone_lucide ?? null,
       d.cor ?? '#FF6B2B', d.tamanho ?? 'pequeno', d.intervalo ?? 0,
       d.posicao ?? 0, d.grid_x ?? 0, d.grid_y ?? 0, d.grid_w ?? 3, d.grid_h ?? 4,
       d.comparar_anterior ?? false, d.sql_query_anterior ?? null, d.formato ?? 'numero']
    )
  }))

  ipcMain.handle('dash:update', wrap(async (_, d) => {
    return queryOne(
      `UPDATE dash_001 SET titulo=$1, tipo=$2, sql_query=$3, icone=$4, icone_lucide=$5, cor=$6,
         tamanho=$7, intervalo=$8, posicao=$9, grid_x=$10, grid_y=$11, grid_w=$12, grid_h=$13,
         comparar_anterior=$14, sql_query_anterior=$15, formato=$16
       WHERE id=$17 RETURNING *`,
      [d.titulo, d.tipo, d.sql_query, d.icone ?? 'bar-chart', d.icone_lucide ?? null,
       d.cor ?? '#FF6B2B', d.tamanho ?? 'pequeno', d.intervalo ?? 0,
       d.posicao ?? 0, d.grid_x ?? 0, d.grid_y ?? 0, d.grid_w ?? 3, d.grid_h ?? 4,
       d.comparar_anterior ?? false, d.sql_query_anterior ?? null, d.formato ?? 'numero', d.id]
    )
  }))

  ipcMain.handle('dash:updateLayout', wrap(async (_, layouts) => {
    for (const item of layouts) {
      await query(
        `UPDATE dash_001 SET grid_x=$1, grid_y=$2, grid_w=$3, grid_h=$4 WHERE id=$5`,
        [item.x, item.y, item.w, item.h, item.i]
      )
    }
  }))

  ipcMain.handle('dash:delete', wrap(async (_, id) => {
    await query('DELETE FROM dash_001 WHERE id=$1', [id])
  }))
}
