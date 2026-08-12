// Roda o(s) SQL de um widget e devolve os dados prontos para o WidgetBody —
// função pura, sem estado de loading/erro (isso fica por conta de quem chama,
// ver useDashboardWidgets.js e o preview ao vivo do Designer).
export async function runWidgetQuery(w) {
  const sql = (w.sql_query || '').trim()
  if (!sql) return { rows: [], fields: [], erro: null }
  const sqlAnterior = w.comparar_anterior ? (w.sql_query_anterior || '').trim() : ''
  const [res, resPrev] = await Promise.all([
    window.api.sql.execute(sql),
    sqlAnterior ? window.api.sql.execute(sqlAnterior).catch(() => null) : Promise.resolve(null),
  ])
  if (!res.ok) {
    return { rows: [], fields: [], erro: res.erro.split('\n')[0].slice(0, 80) }
  }
  const prevOk = resPrev && resPrev.ok
  return {
    rows: res.data.rows || [], fields: res.data.fields || [],
    prevRows: prevOk ? (resPrev.data.rows || []) : undefined,
    prevFields: prevOk ? (resPrev.data.fields || []) : undefined,
    erro: null,
  }
}
