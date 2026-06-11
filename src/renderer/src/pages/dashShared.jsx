// Utilitários e componentes compartilhados entre Dashboard e DashboardDesigner
import * as LucideIcons from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import ReactECharts from 'echarts-for-react'

// ── Conversão de nomes ────────────────────────────────────────────────────────

export function toPascal(s) {
  return (s || '').split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
}
export function toKebab(s) {
  return s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

// ── Ícone Lucide genérico ─────────────────────────────────────────────────────

export function LucideIcon({ name, size = 16, color, strokeWidth = 1.75 }) {
  if (!name) return null
  // Sempre converter para PascalCase (bug fix: 'gauge' → 'Gauge')
  const pascal = toPascal(name)
  const Icon = LucideIcons[pascal]
  if (Icon) return <Icon size={size} color={color} strokeWidth={strokeWidth} />
  // Fallback emoji
  if (name.length <= 2) return <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>{name}</span>
  return <span style={{ fontSize: size * 0.65, fontWeight: 700, color: color || 'currentColor' }}>{name.charAt(0).toUpperCase()}</span>
}

// Retorna todos os nomes de ícones Lucide disponíveis (kebab-case)
export function getAllIcons() {
  return Object.entries(LucideIcons)
    .filter(([k, v]) => v && /^[A-Z]/.test(k) && k !== 'createLucideIcon')
    .map(([k]) => toKebab(k))
    .sort()
}

// ── Formatação ────────────────────────────────────────────────────────────────

export function fmtNum(val) {
  if (val == null || val === '') return '—'
  const n = Number(String(val).trim())
  if (!isNaN(n)) {
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'M'
    if (Number.isInteger(n)) return n.toLocaleString('pt-BR')
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return String(val)
}

export function isNumCol(rows, col) {
  return rows.every(r => r[col] == null || r[col] === '' || !isNaN(Number(r[col])))
}

export function fmtInterval(s) {
  if (!s) return 'Manual'
  if (s < 60) return `${s}s`
  if (s < 3600) return `${s / 60}min`
  return `${s / 3600}h`
}

// ── Constantes ────────────────────────────────────────────────────────────────

export const TIPOS = [
  { value: 'card',    icon: 'hash',          label: 'Card KPI',      desc: 'Valor único em destaque',      defW: 3, defH: 3 },
  { value: 'bar',     icon: 'bar-chart-2',   label: 'Barras',        desc: 'Comparação por categoria',     defW: 4, defH: 5 },
  { value: 'bar_h',   icon: 'align-left',    label: 'Barras horiz.', desc: 'Rankings com labels longos',   defW: 4, defH: 5 },
  { value: 'line',    icon: 'trending-up',   label: 'Linhas',        desc: 'Evolução no tempo',            defW: 6, defH: 5 },
  { value: 'pie',     icon: 'pie-chart',     label: 'Donut',         desc: 'Distribuição percentual',      defW: 4, defH: 5 },
  { value: 'gauge',   icon: 'gauge',         label: 'Gauge',         desc: 'Velocímetro / progresso',      defW: 3, defH: 4 },
  { value: 'scatter', icon: 'crosshair',     label: 'Dispersão',     desc: 'Correlação X × Y',             defW: 5, defH: 5 },
  { value: 'radar',   icon: 'activity',      label: 'Radar',         desc: 'Multi-eixo / teia',            defW: 4, defH: 5 },
  { value: 'grid',    icon: 'table-2',       label: 'Tabela',        desc: 'Lista de dados',               defW: 6, defH: 5 },
]

export const PALETA = ['#FF6B2B','#60A5FA','#4ADE80','#FBD24C','#A78BFA','#F472B6','#34D399','#FB923C','#E879F9','#22D3EE','#F43F5E','#84CC16']

export const INTERVALOS = [
  { label: 'Sem auto-atualização', value: 0    },
  { label: '15 segundos',          value: 15   },
  { label: '30 segundos',          value: 30   },
  { label: '1 minuto',             value: 60   },
  { label: '5 minutos',            value: 300  },
  { label: '15 minutos',           value: 900  },
  { label: '1 hora',               value: 3600 },
]

export const SQL_HINTS = {
  card:    `SELECT COUNT(*) AS total FROM tabela`,
  bar:     `SELECT categoria, COUNT(*) AS total\nFROM tabela\nGROUP BY categoria\nORDER BY total DESC`,
  bar_h:   `SELECT nome AS label, valor\nFROM tabela\nORDER BY valor DESC\nLIMIT 10`,
  line:    `SELECT DATE(criado_em) AS dia, COUNT(*) AS total\nFROM tabela\nGROUP BY dia\nORDER BY dia`,
  pie:     `SELECT categoria, COUNT(*) AS total\nFROM tabela\nGROUP BY categoria`,
  gauge:   `SELECT 73 AS atual, 100 AS maximo`,
  scatter: `SELECT x_col AS x, y_col AS y\nFROM tabela\nLIMIT 200`,
  radar:   `SELECT 'Qualidade' AS eixo, 8 AS valor, 10 AS maximo\nUNION ALL\nSELECT 'Prazo', 6, 10\nUNION ALL\nSELECT 'Custo', 9, 10`,
  grid:    `SELECT * FROM tabela\nORDER BY id DESC\nLIMIT 20`,
}

export const SQL_GUIDE = {
  card:    { regra: 'Retorne 1 linha. Cada coluna vira um valor. Primeira coluna = valor principal (grande).', exemplos: [{ label: 'Total simples', sql: `SELECT COUNT(*) AS total FROM tabela` }, { label: 'KPI composto', sql: `SELECT\n  COUNT(*) AS total,\n  SUM(CASE WHEN status='Aberta' THEN 1 ELSE 0 END) AS abertas,\n  SUM(CASE WHEN status='Concluída' THEN 1 ELSE 0 END) AS concluidas\nFROM os_001` }] },
  bar:     { regra: 'Col 1 = rótulo eixo X. Colunas seguintes = valores (uma série cada).', exemplos: [{ label: 'Por categoria', sql: `SELECT status AS categoria, COUNT(*) AS total\nFROM os_001\nGROUP BY status\nORDER BY total DESC` }, { label: 'Top 10', sql: `SELECT cliente_nome, COUNT(*) AS os\nFROM os_001\nGROUP BY cliente_nome\nORDER BY os DESC\nLIMIT 10` }] },
  bar_h:   { regra: 'Igual ao de Barras, mas na horizontal. Ideal para labels longos.', exemplos: [{ label: 'Ranking', sql: `SELECT nome AS label, valor\nFROM tabela\nORDER BY valor DESC\nLIMIT 10` }] },
  line:    { regra: 'Col 1 = eixo X (tempo/categoria). Colunas seguintes = linhas.', exemplos: [{ label: 'Por dia', sql: `SELECT DATE(criado_em) AS dia, COUNT(*) AS total\nFROM os_001\nGROUP BY dia\nORDER BY dia\nLIMIT 30` }, { label: 'Série dupla', sql: `SELECT TO_CHAR(criado_em,'MM/YYYY') AS mes,\n  SUM(CASE WHEN status='Aberta' THEN 1 ELSE 0 END) AS abertas,\n  SUM(CASE WHEN status='Concluída' THEN 1 ELSE 0 END) AS concluidas\nFROM os_001\nGROUP BY TO_CHAR(criado_em,'MM/YYYY'), DATE_TRUNC('month',criado_em)\nORDER BY DATE_TRUNC('month',criado_em)` }] },
  pie:     { regra: 'Col 1 = nome da fatia. Col 2 = valor numérico.', exemplos: [{ label: 'Por status', sql: `SELECT status AS fatia, COUNT(*) AS total\nFROM os_001\nGROUP BY status` }] },
  gauge:   { regra: 'Retorne 1 linha. Col 1 = valor atual, Col 2 (opcional) = máximo.', exemplos: [{ label: 'Percentual', sql: `SELECT 73 AS atual, 100 AS maximo` }, { label: 'Meta', sql: `SELECT COUNT(*) AS concluidas, 500 AS meta\nFROM os_001\nWHERE status='Concluída'` }] },
  scatter: { regra: 'Col 1 = X, Col 2 = Y. Col 3 (opcional) = tooltip.', exemplos: [{ label: 'Correlação', sql: `SELECT horas AS x, valor AS y\nFROM tabela\nLIMIT 200` }] },
  radar:   { regra: '3 colunas: eixo (nome), valor, máximo. Cada linha = 1 eixo.', exemplos: [{ label: 'Avaliação', sql: `SELECT 'Qualidade' AS eixo, 8 AS valor, 10 AS maximo\nUNION ALL SELECT 'Prazo', 6, 10\nUNION ALL SELECT 'Custo', 9, 10\nUNION ALL SELECT 'Suporte', 7, 10` }] },
  grid:    { regra: 'Qualquer SELECT. Todas as colunas viram cabeçalhos.', exemplos: [{ label: 'Últimos registros', sql: `SELECT * FROM tabela\nORDER BY id DESC\nLIMIT 20` }] },
}

// ── ECharts helpers ───────────────────────────────────────────────────────────

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

// ── WidgetBody ────────────────────────────────────────────────────────────────

export function WidgetBody({ widget, rows, fields, fillHeight = false }) {
  const color   = widget.cor || '#FF6B2B'
  const labels  = rows.map(r => String(r[fields?.[0]] ?? ''))
  const valKeys = fields?.slice(1) ?? []

  const chartStyle = fillHeight
    ? { position:'absolute', top:0, left:0, right:0, bottom:0 }
    : { width:'100%', height: 220 }

  const anim = { animation:true, animationDuration:700, animationEasing:'cubicOut' }

  if (widget.tipo === 'card') {
    if (!rows.length) return <NoData />
    const row  = rows[0]
    const cols = fields?.length ? fields : Object.keys(row)
    const [main, ...secs] = cols
    return (
      <div style={{ display:'flex', overflow:'hidden' }}>
        <div style={{ width:3, flexShrink:0, background:color, borderRadius:3, marginRight:14, alignSelf:'stretch' }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:46, fontWeight:800, lineHeight:1, letterSpacing:-2, fontVariantNumeric:'tabular-nums', color }}>
            {fmtNum(row[main])}
          </div>
          <div style={{ fontSize:10, color:'var(--t3)', marginTop:4, letterSpacing:1.5, textTransform:'uppercase', fontWeight:600 }}>{main}</div>
          {secs.length > 0 && (
            <div style={{ display:'flex', gap:20, flexWrap:'wrap', marginTop:12, paddingTop:10, borderTop:'1px solid var(--bd)' }}>
              {secs.map(c => (
                <div key={c}>
                  <div style={{ fontSize:20, fontWeight:700, color:'var(--t1)', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{fmtNum(row[c])}</div>
                  <div style={{ fontSize:9, color:'var(--t3)', marginTop:3, letterSpacing:1, textTransform:'uppercase' }}>{c}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'50%', background:`radial-gradient(ellipse at 100% 50%, ${color}10, transparent 70%)`, pointerEvents:'none' }} />
      </div>
    )
  }

  if (widget.tipo === 'bar') {
    if (!valKeys.length) return <SqlErr />
    const rotate = labels.some(l => l.length > 6)
    return (
      <ReactECharts style={chartStyle} opts={{ renderer:'canvas' }} option={{
        backgroundColor:'transparent', ...anim,
        grid:{ top:valKeys.length>1?32:12, right:12, bottom:rotate?58:28, left:8, containLabel:true },
        xAxis:{ type:'category', data:labels, boundaryGap:true, ...AX, splitLine:{show:false}, axisLabel:{ color:'var(--t3)', fontSize:10, rotate:rotate?28:0, interval:0 } },
        yAxis:{ type:'value', ...AX, axisLine:{show:false}, splitNumber:4 },
        tooltip:{ trigger:'axis', ...TT, axisPointer:{ type:'shadow', shadowStyle:{ color:'rgba(255,255,255,.03)' } } },
        legend: valKeys.length>1 ? { textStyle:{ color:'var(--t3)', fontSize:10 }, itemWidth:12, itemHeight:8, bottom:0, left:'center' } : { show:false },
        series: valKeys.map((k,i) => {
          const c = i===0 ? color : PALETA[i % PALETA.length]
          return { name:k, type:'bar', data:rows.map(r=>Number(r[k])||0), barMaxWidth:52, barMinHeight:2, itemStyle:{ borderRadius:[5,5,0,0], color:grad(c) }, emphasis:{ itemStyle:{ color:c } } }
        }),
      }} />
    )
  }

  if (widget.tipo === 'bar_h') {
    if (!valKeys.length) return <SqlErr />
    return (
      <ReactECharts style={chartStyle} opts={{ renderer:'canvas' }} option={{
        backgroundColor:'transparent', ...anim,
        grid:{ top:8, right:20, bottom:8, left:8, containLabel:true },
        xAxis:{ type:'value', ...AX, axisLine:{show:false}, splitNumber:4 },
        yAxis:{ type:'category', data:[...labels].reverse(), boundaryGap:true, ...AX, splitLine:{show:false}, axisLabel:{ color:'var(--t3)', fontSize:10, width:110, overflow:'truncate' } },
        tooltip:{ trigger:'axis', ...TT, axisPointer:{ type:'shadow' } },
        series: valKeys.map((k,i) => {
          const c = i===0 ? color : PALETA[i % PALETA.length]
          return { name:k, type:'bar', data:[...rows].reverse().map(r=>Number(r[k])||0), barMaxWidth:32, barMinHeight:2, itemStyle:{ borderRadius:[0,5,5,0], color:grad(c,'66') }, emphasis:{ itemStyle:{ color:c } } }
        }),
      }} />
    )
  }

  if (widget.tipo === 'line') {
    if (!valKeys.length) return <SqlErr />
    return (
      <ReactECharts style={chartStyle} opts={{ renderer:'canvas' }} option={{
        backgroundColor:'transparent', ...anim, animationDuration:900,
        grid:{ top:valKeys.length>1?32:12, right:12, bottom:28, left:8, containLabel:true },
        xAxis:{ type:'category', data:labels, boundaryGap:false, ...AX, splitLine:{show:false} },
        yAxis:{ type:'value', ...AX, axisLine:{show:false}, splitNumber:4 },
        tooltip:{ trigger:'axis', ...TT, axisPointer:{ lineStyle:{ color:'var(--bd2)', width:1.5, type:'dashed' } } },
        legend: valKeys.length>1 ? { textStyle:{ color:'var(--t3)', fontSize:10 }, itemWidth:20, itemHeight:3, bottom:0 } : { show:false },
        series: valKeys.map((k,i) => {
          const c = i===0 ? color : PALETA[i % PALETA.length]
          return { name:k, type:'line', smooth:0.4, data:rows.map(r=>Number(r[k])||0), lineStyle:{ color:c, width:2.5 }, itemStyle:{ color:c, borderWidth:2.5, borderColor:'var(--bg)' }, symbol:'circle', symbolSize:6, areaStyle:{ color:{ type:'linear', x:0,y:0,x2:0,y2:1, colorStops:[{ offset:0, color:c+'38' },{ offset:1, color:c+'05' }] } } }
        }),
      }} />
    )
  }

  if (widget.tipo === 'pie') {
    if (!rows.length) return <NoData />
    if (!valKeys.length) return <SqlErr msg="SQL precisa de 2 colunas: label e valor." />
    const total   = rows.reduce((s,r) => s + (Number(r[fields[1]])||0), 0)
    const pieData = rows.map((r,i) => ({ name:String(r[fields[0]]??''), value:Number(r[fields[1]])||0, itemStyle:{ color:i===0?color:PALETA[i%PALETA.length], borderColor:'var(--bg)', borderWidth:2 } }))
    return (
      <ReactECharts style={chartStyle} opts={{ renderer:'canvas' }} option={{
        backgroundColor:'transparent', animation:true, animationDuration:800,
        tooltip:{ trigger:'item', ...TT, formatter:'{b}<br/><b>{c}</b> ({d}%)' },
        legend:{ orient:'vertical', right:8, top:'middle', textStyle:{ color:'var(--t3)', fontSize:10 }, itemWidth:10, itemHeight:10, itemGap:10, formatter:n=>n.length>16?n.slice(0,15)+'…':n },
        graphic:[
          { type:'text', left:'30%', top:'42%', style:{ text:fmtNum(total), textAlign:'center', fill:'var(--t1)', fontSize:20, fontWeight:700 } },
          { type:'text', left:'30%', top:'57%', style:{ text:'total', textAlign:'center', fill:'var(--t3)', fontSize:10 } },
        ],
        series:[{ type:'pie', center:['31%','50%'], radius:['48%','74%'], data:pieData, label:{show:false}, emphasis:{ scale:true, scaleSize:5, itemStyle:{ shadowBlur:14, shadowColor:'rgba(0,0,0,.5)' } }, animationType:'scale', animationEasing:'elasticOut' }],
      }} />
    )
  }

  if (widget.tipo === 'gauge') {
    if (!rows.length) return <NoData />
    const row  = rows[0]
    const keys = fields?.length ? fields : Object.keys(row)
    const val  = Number(row[keys[0]]) || 0
    const max  = keys[1] ? Number(row[keys[1]]) || 100 : 100
    const pct  = Math.min(100, Math.round((val/max)*100))
    return (
      <ReactECharts style={chartStyle} opts={{ renderer:'canvas' }} option={{
        backgroundColor:'transparent', animation:true, animationDuration:1200, animationEasing:'cubicOut',
        series:[{ type:'gauge', startAngle:210, endAngle:-30, min:0, max, radius:'84%', center:['50%','58%'],
          progress:{ show:true, width:14, itemStyle:{ color } },
          pointer:{ show:false },
          axisLine:{ lineStyle:{ width:14, color:[[1,'var(--s3)']] } },
          axisTick:{show:false}, splitLine:{show:false}, axisLabel:{show:false}, anchor:{show:false},
          title:{ show:true, offsetCenter:[0,'26%'], fontSize:10, color:'var(--t3)', formatter:keys[0] },
          detail:{ valueAnimation:true, fontSize:28, fontWeight:800, color:'var(--t1)', offsetCenter:[0,'-6%'], formatter:v=>fmtNum(v) },
          data:[{ value:val, name:keys[0] }],
        }],
        graphic:[{ type:'text', left:'center', top:'76%', style:{ text:`${pct}%`, textAlign:'center', fill:color, fontSize:11, fontWeight:700 } }],
      }} />
    )
  }

  if (widget.tipo === 'scatter') {
    if (fields.length < 2) return <SqlErr msg="SQL precisa de pelo menos 2 colunas: X e Y." />
    const data = rows.map(r => [Number(r[fields[0]])||0, Number(r[fields[1]])||0, fields[2]?r[fields[2]]:null])
    return (
      <ReactECharts style={chartStyle} opts={{ renderer:'canvas' }} option={{
        backgroundColor:'transparent', ...anim,
        grid:{ top:12, right:14, bottom:28, left:8, containLabel:true },
        xAxis:{ type:'value', ...AX, axisLine:{show:false}, name:fields[0], nameTextStyle:{ color:'var(--t3)', fontSize:9 } },
        yAxis:{ type:'value', ...AX, axisLine:{show:false}, name:fields[1], nameTextStyle:{ color:'var(--t3)', fontSize:9 } },
        tooltip:{ trigger:'item', ...TT, formatter:p=>`${fields[2]?p.data[2]+'<br/>':''}X: <b>${p.data[0]}</b><br/>Y: <b>${p.data[1]}</b>` },
        series:[{ type:'scatter', data, symbolSize:8, itemStyle:{ color, opacity:0.75, borderColor:color, borderWidth:1 } }],
      }} />
    )
  }

  if (widget.tipo === 'radar') {
    if (fields.length < 2) return <SqlErr msg="SQL precisa de: eixo, valor, máximo (opcional)." />
    const indicators = rows.map(r => ({ name:String(r[fields[0]]??''), max:fields[2]?Number(r[fields[2]])||100:100 }))
    const values     = rows.map(r => Number(r[fields[1]])||0)
    return (
      <ReactECharts style={chartStyle} opts={{ renderer:'canvas' }} option={{
        backgroundColor:'transparent', animation:true, animationDuration:900,
        tooltip:{ ...TT },
        radar:{ shape:'circle', center:['50%','52%'], radius:'70%', indicator:indicators, axisLine:{ lineStyle:{ color:'var(--bd)' } }, splitLine:{ lineStyle:{ color:'var(--bd)' } }, splitArea:{ areaStyle:{ color:['var(--s3)','var(--s2)'] } }, name:{ textStyle:{ color:'var(--t3)', fontSize:10 } } },
        series:[{ type:'radar', data:[{ value:values, areaStyle:{ color:color+'22' }, lineStyle:{ color, width:2 }, itemStyle:{ color } }] }],
      }} />
    )
  }

  if (widget.tipo === 'grid') {
    if (!rows.length) return <NoData />
    const cols    = fields?.length ? fields : Object.keys(rows[0])
    const numCols = new Set(cols.filter(c => isNumCol(rows, c)))
    const tableContent = (
      <table className="dash-table">
        <thead>
          <tr>{cols.map(c => <th key={c} className={numCols.has(c)?'num':''}>{c.replace(/_/g,' ')}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>{cols.map(c => <td key={c} className={numCols.has(c)?'num':''}>{row[c]!=null?(numCols.has(c)?fmtNum(row[c]):String(row[c])):'—'}</td>)}</tr>
          ))}
        </tbody>
      </table>
    )
    if (fillHeight) return (
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, overflowX:'auto', overflowY:'auto', border:'1px solid var(--bd)', borderRadius:6 }}>
        {tableContent}
      </div>
    )
    return (
      <div style={{ overflowX:'auto', maxHeight:200, overflowY:'auto', border:'1px solid var(--bd)', borderRadius:6 }}>
        {tableContent}
      </div>
    )
  }

  return null
}

function NoData() { return <div style={{ color:'var(--t3)', fontSize:11, padding:'8px 0' }}>Sem dados</div> }
function SqlErr({ msg = 'SQL precisa de pelo menos 2 colunas.' }) {
  return <div style={{ fontSize:10, color:'#F87171', display:'flex', gap:5, alignItems:'center' }}><AlertCircle size={11} />{msg}</div>
}
