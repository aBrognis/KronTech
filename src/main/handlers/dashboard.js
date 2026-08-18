export function registerDashboardHandlers({ ipcMain, wrap, query, queryOne }) {

  ipcMain.handle('dash:getAll', wrap(async () => {
    return query('SELECT * FROM dash_001 ORDER BY posicao, id')
  }))

  ipcMain.handle('dash:create', wrap(async (_, d) => {
    const ultima = await queryOne('SELECT COALESCE(MAX(posicao), -1) AS max FROM dash_001')
    const criado = await queryOne(
      `INSERT INTO dash_001
         (titulo, tipo, sql_query, icone, icone_lucide, cor, tamanho, intervalo, posicao,
          grid_x, grid_y, grid_w, grid_h, comparar_anterior, sql_query_anterior, formato)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [d.titulo, d.tipo, d.sql_query, d.icone ?? 'bar-chart', d.icone_lucide ?? null,
       d.cor ?? '#FF6B2B', d.tamanho ?? 'pequeno', d.intervalo ?? 0,
       ultima.max + 1, d.grid_x ?? 0, d.grid_y ?? 0, d.grid_w ?? 3, d.grid_h ?? 4,
       d.comparar_anterior ?? false, d.sql_query_anterior ?? null, d.formato ?? 'numero']
    )
    // Widget novo nasce sempre em (0,0) — sem reempilhar, ficaria sobreposto
    // em cima do que já existe até alguém arrastar manualmente ou usar o
    // reordenar. Reempilha na hora pra já nascer na posição livre correta.
    await reempilhar()
    return queryOne('SELECT * FROM dash_001 WHERE id=$1', [criado.id])
  }))

  ipcMain.handle('dash:update', wrap(async (_, d) => {
    const anterior = await queryOne('SELECT grid_w, grid_h FROM dash_001 WHERE id=$1', [d.id])
    const atualizado = await queryOne(
      `UPDATE dash_001 SET titulo=$1, tipo=$2, sql_query=$3, icone=$4, icone_lucide=$5, cor=$6,
         tamanho=$7, intervalo=$8, posicao=$9, grid_x=$10, grid_y=$11, grid_w=$12, grid_h=$13,
         comparar_anterior=$14, sql_query_anterior=$15, formato=$16
       WHERE id=$17 RETURNING *`,
      [d.titulo, d.tipo, d.sql_query, d.icone ?? 'bar-chart', d.icone_lucide ?? null,
       d.cor ?? '#FF6B2B', d.tamanho ?? 'pequeno', d.intervalo ?? 0,
       d.posicao ?? 0, d.grid_x ?? 0, d.grid_y ?? 0, d.grid_w ?? 3, d.grid_h ?? 4,
       d.comparar_anterior ?? false, d.sql_query_anterior ?? null, d.formato ?? 'numero', d.id]
    )
    // Mudar largura/altura de um widget pode fazer ele deixar de caber na
    // linha em que estava (ou sobrar espaço) — reempilha os outros pra
    // acomodar, sem exigir que o usuário arraste manualmente depois.
    const tamanhoMudou = anterior && (anterior.grid_w !== atualizado.grid_w || anterior.grid_h !== atualizado.grid_h)
    if (tamanhoMudou) {
      await reempilhar()
      return queryOne('SELECT * FROM dash_001 WHERE id=$1', [d.id])
    }
    return atualizado
  }))

  // Reflui grid_x/grid_y de todos os widgets seguindo a ordem de `posicao`,
  // tipo "flow layout": cada widget entra na linha atual se ainda couber
  // (soma de larguras ≤ 12 colunas); quando não cabe mais, quebra pra
  // próxima linha. grid_w/grid_h nunca são alterados — tamanho é
  // propriedade exclusiva de cada widget, só a POSIÇÃO é recalculada.
  const COLS = 12
  async function reempilhar() {
    const todos = await query('SELECT id, grid_w, grid_h FROM dash_001 ORDER BY posicao, id')
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

  ipcMain.handle('dash:reorder', wrap(async (_, { id, direcao }) => {
    const atual = await queryOne('SELECT id, posicao FROM dash_001 WHERE id=$1', [id])
    if (!atual) throw new Error(`Widget #${id} não encontrado.`)

    const vizinho = direcao === 'up'
      ? await queryOne('SELECT id, posicao FROM dash_001 WHERE posicao < $1 ORDER BY posicao DESC, id DESC LIMIT 1', [atual.posicao])
      : await queryOne('SELECT id, posicao FROM dash_001 WHERE posicao > $1 ORDER BY posicao ASC, id ASC LIMIT 1', [atual.posicao])
    if (!vizinho) return query('SELECT * FROM dash_001 ORDER BY posicao, id')

    // Troca só a posicao (ordem) entre os dois — tamanho (grid_w/grid_h)
    // de cada widget nunca é tocado, é propriedade exclusiva dele.
    await query('UPDATE dash_001 SET posicao=$1 WHERE id=$2', [vizinho.posicao, atual.id])
    await query('UPDATE dash_001 SET posicao=$1 WHERE id=$2', [atual.posicao, vizinho.id])

    await reempilhar()
    return query('SELECT * FROM dash_001 ORDER BY posicao, id')
  }))

  // Reorganiza todo o Dashboard do zero, na ordem atual de `posicao`,
  // respeitando a largura/altura configurada em cada widget — é o botão
  // "Reorganizar" que o usuário pode acionar a qualquer momento pra
  // corrigir sobreposição sem precisar arrastar card por card.
  ipcMain.handle('dash:autoLayout', wrap(async () => {
    await reempilhar()
    return query('SELECT * FROM dash_001 ORDER BY posicao, id')
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
