// Helpers de estilo compartilhados entre os renderers ECharts + estados vazio/erro
import { AlertCircle, ArrowUp, ArrowDown, Sparkles } from 'lucide-react'

export function grad(color, op = '55') {
  return { type:'linear', x:0, y:0, x2:0, y2:1, colorStops:[{ offset:0, color }, { offset:1, color: color + op }] }
}
export const TT = {
  backgroundColor:'var(--s2)', borderColor:'var(--bd2)', borderWidth:1,
  textStyle:{ color:'var(--t1)', fontSize:11 }, padding:[8,12],
  extraCssText:'box-shadow:0 8px 24px rgba(0,0,0,.35);border-radius:8px;',
}
export const AX = {
  axisLine:  { lineStyle:{ color:'var(--bd)' } },
  axisTick:  { show:false },
  axisLabel: { color:'var(--t3)', fontSize:10 },
  splitLine: { lineStyle:{ color:'var(--bd)', type:'dashed', opacity:.6 } },
}

export function NoData() { return <div style={{ color:'var(--t3)', fontSize:11, padding:'8px 0' }}>Sem dados</div> }
export function SqlErr({ msg = 'SQL precisa de pelo menos 2 colunas.' }) {
  return <div style={{ fontSize:10, color:'#F87171', display:'flex', gap:5, alignItems:'center' }}><AlertCircle size={11} />{msg}</div>
}

// current/previous: números já extraídos pelo chamador. Se previous for 0/null, mostra "novo".
export function ComparisonBadge({ current, previous, corner = false, label }) {
  const hasPrev = previous != null && previous !== 0
  const pct = hasPrev ? ((current - previous) / Math.abs(previous)) * 100 : null
  const up = pct != null && pct >= 0
  const Icon = pct == null ? Sparkles : (up ? ArrowUp : ArrowDown)
  const color = pct == null ? 'var(--t3)' : (up ? '#4ADE80' : '#F87171')
  const texto = pct == null ? 'novo' : `${Math.abs(pct).toFixed(1)}%`
  const style = corner
    ? { position:'absolute', top:8, right:8, zIndex:2 }
    : { marginTop:6 }
  return (
    <div style={{ ...style, display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, color, background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:20, padding:'2px 8px' }}>
      <Icon size={10} />
      {texto}
      {label && <span style={{ color:'var(--t3)', fontWeight:500 }}>{label}</span>}
    </div>
  )
}

// Soma a primeira coluna numérica de cada dataset e retorna {current, previous} para o badge.
export function computeAggregateDelta(rows, fields, prevRows, prevFields) {
  const sumFirstNumeric = (rws, flds) => {
    const cols = flds?.length ? flds : (rws[0] ? Object.keys(rws[0]) : [])
    const col = cols.find(c => rws.every(r => r[c] == null || !isNaN(Number(r[c]))))
    if (!col) return 0
    return rws.reduce((s, r) => s + (Number(r[col]) || 0), 0)
  }
  return {
    current: sumFirstNumeric(rows, fields),
    previous: prevRows?.length ? sumFirstNumeric(prevRows, prevFields) : null,
  }
}
