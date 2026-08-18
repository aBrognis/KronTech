export function registerDashboardHandlers({ ipcMain, wrap, query, queryOne }) {

  ipcMain.handle('dash:getAll', wrap(async () => {
    return query('SELECT * FROM dash_001 ORDER BY grid_y, grid_x, id')
  }))

  ipcMain.handle('dash:create', wrap(async (_, d) => {
    // Posição é o que o usuário escolheu arrastando no grid livre (aba
    // "Layout" do Designer, ou já direto na aba Dashboard) — grid_x/grid_y
    // são a única fonte de verdade de posição, sem recálculo automático
    // por cima que descartaria o que foi arrastado.
    const criado = await queryOne(
      `INSERT INTO dash_001
         (titulo, tipo, sql_query, icone, icone_lucide, cor, tamanho, intervalo,
          grid_x, grid_y, grid_w, grid_h, comparar_anterior, sql_query_anterior, formato)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [d.titulo, d.tipo, d.sql_query, d.icone ?? 'bar-chart', d.icone_lucide ?? null,
       d.cor ?? '#FF6B2B', d.tamanho ?? 'pequeno', d.intervalo ?? 0,
       d.grid_x ?? 0, d.grid_y ?? 0, d.grid_w ?? 3, d.grid_h ?? 4,
       d.comparar_anterior ?? false, d.sql_query_anterior ?? null, d.formato ?? 'numero']
    )
    return criado
  }))

  ipcMain.handle('dash:update', wrap(async (_, d) => {
    return queryOne(
      `UPDATE dash_001 SET titulo=$1, tipo=$2, sql_query=$3, icone=$4, icone_lucide=$5, cor=$6,
         tamanho=$7, intervalo=$8, grid_x=$9, grid_y=$10, grid_w=$11, grid_h=$12,
         comparar_anterior=$13, sql_query_anterior=$14, formato=$15
       WHERE id=$16 RETURNING *`,
      [d.titulo, d.tipo, d.sql_query, d.icone ?? 'bar-chart', d.icone_lucide ?? null,
       d.cor ?? '#FF6B2B', d.tamanho ?? 'pequeno', d.intervalo ?? 0,
       d.grid_x ?? 0, d.grid_y ?? 0, d.grid_w ?? 3, d.grid_h ?? 4,
       d.comparar_anterior ?? false, d.sql_query_anterior ?? null, d.formato ?? 'numero', d.id]
    )
  }))

  // Reflui grid_x/grid_y de todos os widgets em flow-layout (cada widget
  // entra na linha atual se ainda couber — soma de larguras ≤ 12 colunas —
  // senão quebra pra próxima linha), respeitando a ordem visual atual
  // (grid_y, grid_x, id). Ação manual e opcional — botão "Reorganizar" no
  // Dashboard — nunca roda sozinho em create/update, pra não descartar
  // posições que o usuário escolheu arrastando.
  const COLS = 12
  async function reempilhar() {
    const todos = await query('SELECT id, grid_w, grid_h FROM dash_001 ORDER BY grid_y, grid_x, id')
    let cursorX = 0, cursorY = 0, alturaLinha = 0
    for (const w of todos) {
      const largura = w.grid_w || 3
      const altura  = w.grid_h || 4
      if (cursorX > 0 && cursorX + largura > COLS) {
        cursorX = 0
        cursorY += alturaLinha
        alturaLinha = 0
      }
      await query('UPDATE dash_001 SET grid_x=$1, grid_y=$2 WHERE id=$3', [cursorX, cursorY, w.id])
      cursorX += largura
      alturaLinha = Math.max(alturaLinha, altura)
    }
  }

  ipcMain.handle('dash:autoLayout', wrap(async () => {
    await reempilhar()
    return query('SELECT * FROM dash_001 ORDER BY grid_y, grid_x, id')
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
