// Tipos "básicos" (família cartesiana + card/gauge/tabela)
import EChart from '../EChart'
import { fmtNum, isNumCol, isStatusCol, corStatusValor } from '../format'
import { cssVar, TT, AX, NoData, SqlErr, ComparisonBadge } from '../echartsHelpers'
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

export function card({ widget, rows, fields, color, prevRows, prevFields, hasComparison, formato }) {
  if (!rows.length) return <NoData />
  const row  = rows[0]
  const cols = fields?.length ? fields : Object.keys(row)
  const [main, ...secs] = cols
  const prevVal = hasComparison && prevRows[0] ? Number(prevRows[0][prevFields?.[0] ?? main]) : null
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', justifyContent:'center' }}>
      <div className="dash-num" style={{ fontSize:32, fontWeight:700, lineHeight:1, color:'var(--t1)' }}>
        {fmtNum(row[main], formato)}
      </div>
      {hasComparison ? (
        <ComparisonBadge current={Number(row[main]) || 0} previous={prevVal} label="vs. período anterior" />
      ) : (
        <div style={{ fontSize:11, color:'var(--t3)', marginTop:6 }}>{main.replace(/_/g,' ')}</div>
      )}
      {secs.length > 0 && (
        <div style={{ display:'flex', gap:24, flexWrap:'wrap', marginTop:16, paddingTop:12, borderTop:'1px solid var(--bd)' }}>
          {secs.map(c => (
            <div key={c}>
              <div className="dash-num" style={{ fontSize:16, fontWeight:600, color:'var(--t1)', lineHeight:1 }}>{fmtNum(row[c], formato)}</div>
              <div style={{ fontSize:10, color:'var(--t3)', marginTop:4 }}>{c.replace(/_/g,' ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function bar({ rows, fields, labels, valKeys, color, chartStyle, anim, prevRows, prevFields, hasComparison, formato }) {
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
          const c = i===0 ? color : PALETA[i % PALETA.length]
          return { name:k, type:'bar', data:rows.map(r=>Number(r[k])||0), barMaxWidth:52, barMinHeight:2, itemStyle:{ borderRadius:[3,3,0,0], color:c }, emphasis:{ itemStyle:{ color:c } } }
        }),
        ...(hasComparison ? prevSeries(prevRows, prevFields, valKeys, 'bar', { barMaxWidth:52 }) : []),
      ],
    }} />
  )
}

export function bar_stacked({ rows, labels, valKeys, color, chartStyle, anim, prevRows, prevFields, hasComparison, formato }) {
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
          const c = i===0 ? color : PALETA[i % PALETA.length]
          return { name:k, type:'bar', stack:'total', data:rows.map(r=>Number(r[k])||0), barMaxWidth:52, itemStyle:{ color:c }, emphasis:{ itemStyle:{ color:c } } }
        }),
        ...(hasComparison ? prevSeries(prevRows, prevFields, valKeys, 'bar', { stack:'anterior', barMaxWidth:52 }) : []),
      ],
    }} />
  )
}

export function bar_h({ rows, labels, valKeys, color, chartStyle, anim, prevRows, prevFields, hasComparison, formato }) {
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
          const c = i===0 ? color : PALETA[i % PALETA.length]
          return { name:k, type:'bar', data:[...rows].reverse().map(r=>Number(r[k])||0), barMaxWidth:32, barMinHeight:2, itemStyle:{ borderRadius:[0,3,3,0], color:c }, emphasis:{ itemStyle:{ color:c } } }
        }),
        ...(hasComparison ? prevSeries([...(prevRows||[])].reverse(), prevFields, valKeys, 'bar', { barMaxWidth:32 }) : []),
      ],
    }} />
  )
}

function renderLine({ rows, labels, valKeys, color, chartStyle, anim, prevRows, prevFields, hasComparison, formato }, areaOpacity = '38') {
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
          const c = i===0 ? color : PALETA[i % PALETA.length]
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

export function pie({ rows, fields, color, chartStyle, formato }) {
  if (!rows.length) return <NoData />
  if (fields.length < 2) return <SqlErr msg="SQL precisa de 2 colunas: label e valor." />
  const total   = rows.reduce((s,r) => s + (Number(r[fields[1]])||0), 0)
  const pieData = rows.map((r,i) => ({ name:String(r[fields[0]]??''), value:Number(r[fields[1]])||0, itemStyle:{ color:i===0?color:PALETA[i%PALETA.length], borderColor:cssVar('--bg'), borderWidth:2 } }))
  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      <EChart style={chartStyle} opts={{ renderer:'canvas' }} option={{
        backgroundColor:'transparent', animation:true, animationDuration:800,
        tooltip:{ trigger:'item', ...TT(), formatter:p=>`${p.name}<br/><b>${fmtNum(p.value, formato)}</b> (${p.percent}%)` },
        legend:{ orient:'vertical', right:8, top:'middle', textStyle:{ color:cssVar('--t3'), fontSize:10 }, itemWidth:10, itemHeight:10, itemGap:10, formatter:n=>n.length>16?n.slice(0,15)+'…':n },
        series:[{ type:'pie', center:[PIE_CENTER.x, PIE_CENTER.y], radius:['48%','74%'], data:pieData, label:{show:false}, emphasis:{ scale:true, scaleSize:5, itemStyle:{ shadowBlur:14, shadowColor:'rgba(0,0,0,.5)' } }, animationType:'scale', animationEasing:'elasticOut' }],
      }} />
      <div style={{
        position:'absolute', left:PIE_CENTER.x, top:PIE_CENTER.y, transform:'translate(-50%,-50%)',
        pointerEvents:'none', textAlign:'center',
      }}>
        <div className="dash-num" style={{ fontSize:20, fontWeight:700, color:'var(--t1)', lineHeight:1 }}>{fmtNum(total, formato)}</div>
        <div style={{ fontSize:10, color:'var(--t3)', marginTop:3 }}>total</div>
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
        detail:{ valueAnimation:true, fontSize:28, fontWeight:800, color:cssVar('--t1'), offsetCenter:[0,'-6%'], formatter:v=>fmtNum(v, formato) },
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

export function grid({ rows, fields, fillHeight }) {
  if (!rows.length) return <NoData />
  const cols       = fields?.length ? fields : Object.keys(rows[0])
  const numCols    = new Set(cols.filter(c => isNumCol(rows, c)))
  const statusCols = new Set(cols.filter(c => !numCols.has(c) && isStatusCol(rows, c)))
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
