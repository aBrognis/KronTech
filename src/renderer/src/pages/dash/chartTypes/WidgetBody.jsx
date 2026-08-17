// Dispatcher central: monta o "contexto" comum e despacha para o renderer do tipo
import * as basic from './basic'
import * as flow from './flow'
import * as matrix from './matrix'
import * as statistical from './statistical'
import { ComparisonBadge, computeAggregateDelta } from '../echartsHelpers'

const RENDERERS = { ...basic, ...flow, ...matrix, ...statistical }

// Tipos onde uma segunda série/overlay não faz sentido visualmente, recebem
// em vez disso um badge no canto com o delta agregado da 1ª coluna numérica.
const NO_OVERLAY_TYPES = new Set([
  'pie','funnel','treemap','sunburst','heatmap','calendar_heatmap',
  'scatter','radar','graph','tree','sankey','theme_river','boxplot',
  'candlestick','parallel','grid','gauge',
])

export function WidgetBody({ widget, rows, fields, prevRows, prevFields, fillHeight = false }) {
  const color   = widget.cor || '#FF6B2B'
  const labels  = rows.map(r => String(r[fields?.[0]] ?? ''))
  const valKeys = fields?.slice(1) ?? []

  const chartStyle = fillHeight
    ? { position:'absolute', top:0, left:0, right:0, bottom:0 }
    : { width:'100%', height: 220 }

  const anim = { animation:true, animationDuration:700, animationEasing:'cubicOut' }

  const hasComparison = !!(widget.comparar_anterior && prevRows?.length)

  const fn = RENDERERS[widget.tipo]
  if (!fn) return null
  const body = fn({ widget, rows, fields, labels, valKeys, color, chartStyle, anim, fillHeight, prevRows, prevFields, hasComparison })

  if (hasComparison && NO_OVERLAY_TYPES.has(widget.tipo)) {
    const delta = computeAggregateDelta(rows, fields, prevRows, prevFields)
    return (
      <div style={{ position:'relative', height: fillHeight ? '100%' : 'auto' }}>
        {body}
        <ComparisonBadge {...delta} corner />
      </div>
    )
  }
  return body
}
