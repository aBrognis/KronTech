// Tipos "básicos" (família cartesiana + card/gauge/tabela)
import EChart from '../EChart'
import { fmtNum, isNumCol, isStatusCol, corStatusValor } from '../format'
import { cssVar, TT, AX, NoData, SqlErr, ComparisonBadge, corSerie, useCountUp } from '../echartsHelpers'
import { PALETA } from '../constants'

// Séries "(anterior)" acopladas ao final do array, index-aligned com a linha atual.
function prevSeries(prevRows, prevFields, valKeys, type, extra = {}) {
  if (!prevRows?.length) return []
  const pValKeys = prevFields?.slice(1) ?? valKeys
  return pValKeys.map((k, i) => ({
    name: `${valKeys[i] ?? k} (anterior)`, type,
    data: prevRows.map(r => Number(r[k]) || 0),
    itemStyle: { color: cssVar('--t3'), opacity: 0.35 },
    lineStyle: { color: cssVar('--t3'), opacity: 0.5, type: 'dashed', width: 2 },
    silent: true, z: 1,
    ...extra,
  }))
}

function KpiValue({ raw, formato, style, glow = false }) {
  const num = Number(raw)
  const animated = useCountUp(Number.isFinite(num) ? num : 0)
  const glowClass = glow ? ' dash-kpi-glow' : ''
  return <div className={`dash-num${glowClass}`} style={style}>{Number.isFinite(num) ? fmtNum(animated, formato) : String(raw ?? '')}</div>
}

export function card({ widget, rows, fields, color, prevRows, prevFields, hasComparison, formato }) {
  if (!rows.length) return <NoData />
  const row  = rows[0]
  const cols = fields?.length ? fields : Object.keys(row)
  const [main, ...secs] = cols
  const prevVal = hasComparison && prevRows[0] ? Number(prevRows[0][prevFields?.[0] ?? main]) : null
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', justifyContent:'center' }}>
      <KpiValue raw={row[main]} formato={formato} glow style={{ fontSize:46, fontWeight:800, lineHeight:1, color, letterSpacing:'-.02em' }} />
      {hasComparison ? (
        <ComparisonBadge current={Number(row[main]) || 0} previous={prevVal} label="vs. período anterior" />
      ) : (
        <div className="dash-widget-label" style={{ fontSize:11.5, marginTop:8 }}>{main.replace(/_/g,' ')}</div>
      )}
      {secs.length > 0 && (
        <div style={{ display:'flex', gap:24, flexWrap:'wrap', marginTop:18, paddingTop:14, borderTop:'1px solid var(--bd)' }}>
          {secs.map(c => (
            <div key={c}>
              <KpiValue raw={row[c]} formato={formato} style={{ fontSize:18, fontWeight:700, color, lineHeight:1 }} />
              <div className="dash-widget-label" style={{ fontSize:10, marginTop:5 }}>{c.replace(/_/g,' ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function bar({ rows, fields, labels, valKeys, color, coresSeries, chartStyle, anim, prevRows, prevFields, hasComparison, formato }) {
  if (!valKeys.length) return <SqlErr />
  const rotate = labels.some(l => l.length > 6)
  return (
    <EChart style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', ...anim,
      grid:{ top:valKeys.length>1||hasComparison?32:12, right:12, bottom:rotate?58:28, left:8, containLabel:true },
      xAxis:{ type:'category', data:labels, boundaryGap:true, ...AX(), splitLine:{show:false}, axisLabel:{ color:cssVar('--t3'), fontSize:10, rotate:rotate?28:0, interval:0, overflow:'truncate', width:64 } },
      yAxis:{ type:'value', ...AX(), axisLine:{show:false}, splitNumber:4, axisLabel:{ ...AX().axisLabel, formatter:v=>fmtNum(v, formato) } },
      tooltip:{ trigger:'axis', ...TT(), axisPointer:{ type:'shadow', shadowStyle:{ color:'rgba(255,255,255,.03)' } }, valueFormatter:v=>fmtNum(v, formato) },
      legend: valKeys.length>1||hasComparison ? { textStyle:{ color:cssVar('--t3'), fontSize:10 }, itemWidth:12, itemHeight:8, bottom:0, left:'center' } : { show:false },
      series: [
        ...valKeys.map((k,i) => {
          const c = corSerie(k, i, color, coresSeries, PALETA)
          // Valor no topo de cada barra — só quando poucas categorias, senão
          // os rótulos colidem e poluem em vez de reforçar o dado.
          const showLabel = valKeys.length === 1 && labels.length <= 8
          // Item 3 (valores literais): border-radius 6px topo; gradiente
          // linear vertical, base 100% opacidade → topo 60% opacidade;
          // drop-shadow(0 4px 6px rgba(accent,.35)) — via shadowOffsetY:4,
          // shadowBlur:6, shadowColor com alpha .35 (equivalente ECharts).
          return { name:k, type:'bar', data:rows.map(r=>Number(r[k])||0), barMaxWidth:80, barMinHeight:2,
            itemStyle:{
              borderRadius:[6,6,0,0],
              // y2:0 (base→topo, direção "to top"): offset 0 = base = 100%,
              // offset 1 = topo = 60% opacidade (hex 99 ≈ 60%).
              color:{ type:'linear', x:0,y:1,x2:0,y2:0, colorStops:[{ offset:0, color:c },{ offset:1, color:c+'99' }] },
              shadowColor:c+'59', shadowBlur:6, shadowOffsetY:4,
            },
            emphasis:{ itemStyle:{ color:c, shadowBlur:16, shadowColor:c+'80' } },
            label: showLabel ? { show:true, position:'top', color:cssVar('--t1'), fontSize:11, fontWeight:700, formatter:p=>fmtNum(p.value, formato) } : undefined }
        }),
        ...(hasComparison ? prevSeries(prevRows, prevFields, valKeys, 'bar', { barMaxWidth:52 }) : []),
      ],
    }} />
  )
}

export function bar_stacked({ rows, labels, valKeys, color, coresSeries, chartStyle, anim, prevRows, prevFields, hasComparison, formato }) {
  if (!valKeys.length) return <SqlErr />
  const rotate = labels.some(l => l.length > 6)
  return (
    <EChart style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', ...anim,
      grid:{ top:valKeys.length>1||hasComparison?32:12, right:12, bottom:rotate?58:28, left:8, containLabel:true },
      xAxis:{ type:'category', data:labels, boundaryGap:true, ...AX(), splitLine:{show:false}, axisLabel:{ color:cssVar('--t3'), fontSize:10, rotate:rotate?28:0, interval:0, overflow:'truncate', width:64 } },
      yAxis:{ type:'value', ...AX(), axisLine:{show:false}, splitNumber:4, axisLabel:{ ...AX().axisLabel, formatter:v=>fmtNum(v, formato) } },
      tooltip:{ trigger:'axis', ...TT(), axisPointer:{ type:'shadow', shadowStyle:{ color:'rgba(255,255,255,.03)' } }, valueFormatter:v=>fmtNum(v, formato) },
      legend: valKeys.length>1||hasComparison ? { textStyle:{ color:cssVar('--t3'), fontSize:10 }, itemWidth:12, itemHeight:8, bottom:0, left:'center' } : { show:false },
      series: [
        ...valKeys.map((k,i) => {
          const c = corSerie(k, i, color, coresSeries, PALETA)
          return { name:k, type:'bar', stack:'total', data:rows.map(r=>Number(r[k])||0), barMaxWidth:80,
            itemStyle:{
              color:{ type:'linear', x:0,y:1,x2:0,y2:0, colorStops:[{ offset:0, color:c },{ offset:1, color:c+'99' }] },
              shadowColor:c+'59', shadowBlur:6, shadowOffsetY:4,
            },
            emphasis:{ itemStyle:{ color:c, shadowBlur:14, shadowColor:c+'80' } } }
        }),
        ...(hasComparison ? prevSeries(prevRows, prevFields, valKeys, 'bar', { stack:'anterior', barMaxWidth:52 }) : []),
      ],
    }} />
  )
}

export function bar_h({ rows, labels, valKeys, color, coresSeries, chartStyle, anim, prevRows, prevFields, hasComparison, formato }) {
  if (!valKeys.length) return <SqlErr />
  return (
    <EChart style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', ...anim,
      grid:{ top:hasComparison?24:8, right:20, bottom:8, left:8, containLabel:true },
      xAxis:{ type:'value', ...AX(), axisLine:{show:false}, splitNumber:4, axisLabel:{ ...AX().axisLabel, formatter:v=>fmtNum(v, formato) } },
      yAxis:{ type:'category', data:[...labels].reverse(), boundaryGap:true, ...AX(), splitLine:{show:false}, axisLabel:{ color:cssVar('--t3'), fontSize:10, width:110, overflow:'truncate' } },
      tooltip:{ trigger:'axis', ...TT(), axisPointer:{ type:'shadow' }, valueFormatter:v=>fmtNum(v, formato) },
      legend: hasComparison ? { textStyle:{ color:cssVar('--t3'), fontSize:10 }, itemWidth:12, itemHeight:8, top:0, left:'center' } : { show:false },
      series: [
        ...valKeys.map((k,i) => {
          const c = corSerie(k, i, color, coresSeries, PALETA)
          const showLabel = valKeys.length === 1 && labels.length <= 10
          // Barra horizontal: equivalente do gradiente vertical — base
          // (esquerda) 100% opacidade, ponta (direita) 60%.
          return { name:k, type:'bar', data:[...rows].reverse().map(r=>Number(r[k])||0), barMaxWidth:32, barMinHeight:2,
            itemStyle:{
              borderRadius:[0,6,6,0],
              color:{ type:'linear', x:0,y:0,x2:1,y2:0, colorStops:[{ offset:0, color:c },{ offset:1, color:c+'99' }] },
              shadowColor:c+'59', shadowBlur:6,
            },
            emphasis:{ itemStyle:{ color:c, shadowBlur:16, shadowColor:c+'80' } },
            label: showLabel ? { show:true, position:'right', color:cssVar('--t1'), fontSize:11, fontWeight:700, formatter:p=>fmtNum(p.value, formato) } : undefined }
        }),
        ...(hasComparison ? prevSeries([...(prevRows||[])].reverse(), prevFields, valKeys, 'bar', { barMaxWidth:32 }) : []),
      ],
    }} />
  )
}

function renderLine({ rows, labels, valKeys, color, coresSeries, chartStyle, anim, prevRows, prevFields, hasComparison, formato }, areaOpacity = '38') {
  if (!valKeys.length) return <SqlErr />
  return (
    <EChart style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', ...anim, animationDuration:900,
      grid:{ top:valKeys.length>1||hasComparison?32:12, right:12, bottom:28, left:8, containLabel:true },
      xAxis:{ type:'category', data:labels, boundaryGap:false, ...AX(), splitLine:{show:false} },
      yAxis:{ type:'value', ...AX(), axisLine:{show:false}, splitNumber:4, axisLabel:{ ...AX().axisLabel, formatter:v=>fmtNum(v, formato) } },
      tooltip:{ trigger:'axis', ...TT(), axisPointer:{ lineStyle:{ color:cssVar('--bd2'), width:1.5, type:'dashed' } }, valueFormatter:v=>fmtNum(v, formato) },
      legend: valKeys.length>1||hasComparison ? { textStyle:{ color:cssVar('--t3'), fontSize:10 }, itemWidth:20, itemHeight:3, bottom:0 } : { show:false },
      series: [
        ...valKeys.map((k,i) => {
          const c = corSerie(k, i, color, coresSeries, PALETA)
          return { name:k, type:'line', smooth:0.4, data:rows.map(r=>Number(r[k])||0),
            lineStyle:{ color:c, width:2.5 },
            itemStyle:{ color:c },
            symbol:'circle', symbolSize:5,
            areaStyle:{ color:{ type:'linear', x:0,y:0,x2:0,y2:1, colorStops:[{ offset:0, color:c+areaOpacity },{ offset:1, color:c+'05' }] } } }
        }),
        ...(hasComparison ? prevSeries(prevRows, prevFields, valKeys, 'line', { smooth:0.4, symbol:'none' }) : []),
      ],
    }} />
  )
}

export function line(ctx) { return renderLine(ctx, '38') }
export function line_area(ctx) { return renderLine(ctx, '70') }

// Centro do donut compartilhado entre o series.center do ECharts e o
// overlay HTML do total — único ponto de ajuste, elimina o "número mágico"
// duplicado que causava o bug de centralização (graphic.left/top do ECharts
// é relativo à área de plotagem, não ao centro visual do donut).
const PIE_CENTER = { x: '31%', y: '50%' }

export function pie({ rows, fields, color, coresSeries, chartStyle, formato }) {
  if (!rows.length) return <NoData />
  if (fields.length < 2) return <SqlErr msg="SQL precisa de 2 colunas: label e valor." />
  const total   = rows.reduce((s,r) => s + (Number(r[fields[1]])||0), 0)
  const pieData = rows.map((r,i) => {
    const nome = String(r[fields[0]] ?? '')
    return { name:nome, value:Number(r[fields[1]])||0, itemStyle:{ color:corSerie(nome, i, color, coresSeries, PALETA), borderColor:cssVar('--bg'), borderWidth:2 } }
  })
  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      <EChart style={chartStyle} opts={{ renderer:'canvas' }} option={{
        backgroundColor:'transparent', animation:true, animationDuration:800,
        tooltip:{ trigger:'item', ...TT(), formatter:p=>`${p.name}<br/><b>${fmtNum(p.value, formato)}</b> (${p.percent}%)` },
        legend:{ orient:'vertical', right:8, top:'middle', textStyle:{ color:cssVar('--t3'), fontSize:10 }, itemWidth:10, itemHeight:10, itemGap:10, formatter:n=>n.length>16?n.slice(0,15)+'…':n },
        series:[{ type:'pie', center:[PIE_CENTER.x, PIE_CENTER.y], radius:['52%','78%'], data:pieData, label:{show:false}, emphasis:{ scale:true, scaleSize:5, itemStyle:{ shadowBlur:14, shadowColor:'rgba(0,0,0,.5)' } }, animationType:'scale', animationEasing:'elasticOut' }],
      }} />
      <div style={{
        position:'absolute', left:PIE_CENTER.x, top:PIE_CENTER.y, transform:'translate(-50%,-50%)',
        pointerEvents:'none', textAlign:'center',
      }}>
        <KpiValue raw={total} formato={formato} style={{ fontSize:24, fontWeight:800, color, lineHeight:1 }} />
        <div className="dash-widget-label" style={{ fontSize:10, marginTop:4 }}>total</div>
      </div>
    </div>
  )
}

export function gauge({ rows, fields, color, chartStyle, formato }) {
  if (!rows.length) return <NoData />
  const row  = rows[0]
  const keys = fields?.length ? fields : Object.keys(row)
  const val  = Number(row[keys[0]]) || 0
  const max  = keys[1] ? Number(row[keys[1]]) || 100 : 100
  const pct  = Math.min(100, Math.round((val/max)*100))
  return (
    <EChart style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', animation:true, animationDuration:1200, animationEasing:'cubicOut',
      series:[{ type:'gauge', startAngle:210, endAngle:-30, min:0, max, radius:'84%', center:['50%','58%'],
        progress:{ show:true, width:14, itemStyle:{ color } },
        pointer:{ show:false },
        axisLine:{ lineStyle:{ width:14, color:[[1,cssVar('--s3')]] } },
        axisTick:{show:false}, splitLine:{show:false}, axisLabel:{show:false}, anchor:{show:false},
        title:{ show:true, offsetCenter:[0,'26%'], fontSize:10, color:cssVar('--t3'), formatter:keys[0] },
        detail:{ valueAnimation:true, fontSize:28, fontWeight:800, color, offsetCenter:[0,'-6%'], formatter:v=>fmtNum(v, formato) },
        data:[{ value:val, name:keys[0] }],
      }],
      graphic:[{ type:'text', left:'center', top:'76%', style:{ text:`${pct}%`, textAlign:'center', fill:color, fontSize:11, fontWeight:700 } }],
    }} />
  )
}

export function scatter({ rows, fields, color, chartStyle, anim }) {
  if (fields.length < 2) return <SqlErr msg="SQL precisa de pelo menos 2 colunas: X e Y." />
  const data = rows.map(r => [Number(r[fields[0]])||0, Number(r[fields[1]])||0, fields[2]?r[fields[2]]:null])
  return (
    <EChart style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', ...anim,
      grid:{ top:12, right:14, bottom:28, left:8, containLabel:true },
      xAxis:{ type:'value', ...AX(), axisLine:{show:false}, name:fields[0], nameTextStyle:{ color:cssVar('--t3'), fontSize:9 } },
      yAxis:{ type:'value', ...AX(), axisLine:{show:false}, name:fields[1], nameTextStyle:{ color:cssVar('--t3'), fontSize:9 } },
      tooltip:{ trigger:'item', ...TT(), formatter:p=>`${fields[2]?p.data[2]+'<br/>':''}X: <b>${p.data[0]}</b><br/>Y: <b>${p.data[1]}</b>` },
      series:[{ type:'scatter', data, symbolSize:8, itemStyle:{ color, opacity:0.75, borderColor:color, borderWidth:1 } }],
    }} />
  )
}

export function radar({ rows, fields, color, chartStyle }) {
  if (fields.length < 2) return <SqlErr msg="SQL precisa de: eixo, valor, máximo (opcional)." />
  const indicators = rows.map(r => ({ name:String(r[fields[0]]??''), max:fields[2]?Number(r[fields[2]])||100:100 }))
  const values     = rows.map(r => Number(r[fields[1]])||0)
  return (
    <EChart style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', animation:true, animationDuration:900,
      tooltip:{ ...TT() },
      radar:{ shape:'circle', center:['50%','52%'], radius:'70%', indicator:indicators, axisLine:{ lineStyle:{ color:cssVar('--bd') } }, splitLine:{ lineStyle:{ color:cssVar('--bd') } }, splitArea:{ areaStyle:{ color:[cssVar('--s3'),cssVar('--s2')] } }, name:{ textStyle:{ color:cssVar('--t3'), fontSize:10 } } },
      series:[{ type:'radar', data:[{ value:values, areaStyle:{ color:color+'22' }, lineStyle:{ color, width:2 }, itemStyle:{ color } }] }],
    }} />
  )
}

// Coluna que claramente representa uma % de contribuição/participação —
// vira barra de progresso na cor do widget, em vez de número cru, como nas
// referências ("% Contribuição" com barra preenchida).
const RE_COL_PCT = /percent|contribui|particip|^pct|_pct$/i

export function grid({ rows, fields, color, fillHeight }) {
  if (!rows.length) return <NoData />
  const cols       = fields?.length ? fields : Object.keys(rows[0])
  const numCols    = new Set(cols.filter(c => isNumCol(rows, c)))
  const statusCols = new Set(cols.filter(c => !numCols.has(c) && isStatusCol(rows, c)))
  const pctCol     = cols.find(c => numCols.has(c) && RE_COL_PCT.test(c))
  const maxPct     = pctCol ? Math.max(...rows.map(r => Number(r[pctCol]) || 0), 1) : 1
  const adaptiveHeight = rows.length > 6
  const tableContent = (
    <table className="dash-table dash-table-zebra">
      <thead>
        <tr>{cols.map(c => <th key={c} className={numCols.has(c)?'num':''}>{c.replace(/_/g,' ')}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {cols.map(c => {
              const val = row[c]
              if (c === pctCol && val != null) {
                const pct = Number(val) || 0
                return (
                  <td key={c} className="num">
                    <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end' }}>
                      <div className="dash-progress-track" style={{ width:52 }}>
                        <div className="dash-progress-fill" style={{ width:`${Math.min(100, (pct/maxPct)*100)}%`, background:color }} />
                      </div>
                      <span style={{ minWidth:38, textAlign:'right' }}>{fmtNum(pct, 'percentual')}</span>
                    </div>
                  </td>
                )
              }
              if (statusCols.has(c) && val != null) {
                const cor = corStatusValor(val)
                return (
                  <td key={c}>
                    {cor
                      ? <span className="dash-table-badge" style={{ background:cor.bg, color:cor.fg }}>{String(val)}</span>
                      : String(val)}
                  </td>
                )
              }
              return <td key={c} className={numCols.has(c)?'num':''}>{val!=null?(numCols.has(c)?fmtNum(val):String(val)):''}</td>
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
  if (fillHeight || adaptiveHeight) return (
    <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, overflowX:'auto', overflowY:'auto', border:'1px solid var(--bd)', borderRadius:6 }}>
      {tableContent}
    </div>
  )
  return (
    <div style={{ overflowX:'auto', border:'1px solid var(--bd)', borderRadius:6 }}>
      {tableContent}
    </div>
  )
}
