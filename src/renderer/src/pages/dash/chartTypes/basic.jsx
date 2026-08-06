// Tipos "básicos" (família cartesiana + card/gauge/tabela)
import ReactECharts from 'echarts-for-react'
import { fmtNum, isNumCol } from '../format'
import { grad, TT, AX, NoData, SqlErr, ComparisonBadge } from '../echartsHelpers'
import { PALETA } from '../constants'

// Séries "(anterior)" acopladas ao final do array, index-aligned com a linha atual.
function prevSeries(prevRows, prevFields, valKeys, type, extra = {}) {
  if (!prevRows?.length) return []
  const pValKeys = prevFields?.slice(1) ?? valKeys
  return pValKeys.map((k, i) => ({
    name: `${valKeys[i] ?? k} (anterior)`, type,
    data: prevRows.map(r => Number(r[k]) || 0),
    itemStyle: { color: 'var(--t3)', opacity: 0.35 },
    lineStyle: { color: 'var(--t3)', opacity: 0.5, type: 'dashed', width: 2 },
    silent: true, z: 1,
    ...extra,
  }))
}

export function card({ widget, rows, fields, color, prevRows, prevFields, hasComparison }) {
  if (!rows.length) return <NoData />
  const row  = rows[0]
  const cols = fields?.length ? fields : Object.keys(row)
  const [main, ...secs] = cols
  const prevVal = hasComparison && prevRows[0] ? Number(prevRows[0][prevFields?.[0] ?? main]) : null
  return (
    <div style={{ display:'flex', overflow:'hidden' }}>
      <div style={{ width:3, flexShrink:0, background:color, borderRadius:3, marginRight:14, alignSelf:'stretch' }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:46, fontWeight:800, lineHeight:1, letterSpacing:-2, fontVariantNumeric:'tabular-nums', color }}>
          {fmtNum(row[main])}
        </div>
        <div style={{ fontSize:10, color:'var(--t3)', marginTop:4, letterSpacing:1.5, textTransform:'uppercase', fontWeight:600 }}>{main}</div>
        {hasComparison && (
          <ComparisonBadge current={Number(row[main]) || 0} previous={prevVal} label="vs. período anterior" />
        )}
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

export function bar({ rows, fields, labels, valKeys, color, chartStyle, anim, prevRows, prevFields, hasComparison }) {
  if (!valKeys.length) return <SqlErr />
  const rotate = labels.some(l => l.length > 6)
  return (
    <ReactECharts style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', ...anim,
      grid:{ top:valKeys.length>1||hasComparison?32:12, right:12, bottom:rotate?58:28, left:8, containLabel:true },
      xAxis:{ type:'category', data:labels, boundaryGap:true, ...AX, splitLine:{show:false}, axisLabel:{ color:'var(--t3)', fontSize:10, rotate:rotate?28:0, interval:0 } },
      yAxis:{ type:'value', ...AX, axisLine:{show:false}, splitNumber:4 },
      tooltip:{ trigger:'axis', ...TT, axisPointer:{ type:'shadow', shadowStyle:{ color:'rgba(255,255,255,.03)' } } },
      legend: valKeys.length>1||hasComparison ? { textStyle:{ color:'var(--t3)', fontSize:10 }, itemWidth:12, itemHeight:8, bottom:0, left:'center' } : { show:false },
      series: [
        ...valKeys.map((k,i) => {
          const c = i===0 ? color : PALETA[i % PALETA.length]
          return { name:k, type:'bar', data:rows.map(r=>Number(r[k])||0), barMaxWidth:52, barMinHeight:2, itemStyle:{ borderRadius:[5,5,0,0], color:grad(c) }, emphasis:{ itemStyle:{ color:c } } }
        }),
        ...(hasComparison ? prevSeries(prevRows, prevFields, valKeys, 'bar', { barMaxWidth:52 }) : []),
      ],
    }} />
  )
}

export function bar_stacked({ rows, labels, valKeys, color, chartStyle, anim, prevRows, prevFields, hasComparison }) {
  if (!valKeys.length) return <SqlErr />
  const rotate = labels.some(l => l.length > 6)
  return (
    <ReactECharts style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', ...anim,
      grid:{ top:valKeys.length>1||hasComparison?32:12, right:12, bottom:rotate?58:28, left:8, containLabel:true },
      xAxis:{ type:'category', data:labels, boundaryGap:true, ...AX, splitLine:{show:false}, axisLabel:{ color:'var(--t3)', fontSize:10, rotate:rotate?28:0, interval:0 } },
      yAxis:{ type:'value', ...AX, axisLine:{show:false}, splitNumber:4 },
      tooltip:{ trigger:'axis', ...TT, axisPointer:{ type:'shadow', shadowStyle:{ color:'rgba(255,255,255,.03)' } } },
      legend: valKeys.length>1||hasComparison ? { textStyle:{ color:'var(--t3)', fontSize:10 }, itemWidth:12, itemHeight:8, bottom:0, left:'center' } : { show:false },
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

export function bar_h({ rows, labels, valKeys, color, chartStyle, anim, prevRows, prevFields, hasComparison }) {
  if (!valKeys.length) return <SqlErr />
  return (
    <ReactECharts style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', ...anim,
      grid:{ top:hasComparison?24:8, right:20, bottom:8, left:8, containLabel:true },
      xAxis:{ type:'value', ...AX, axisLine:{show:false}, splitNumber:4 },
      yAxis:{ type:'category', data:[...labels].reverse(), boundaryGap:true, ...AX, splitLine:{show:false}, axisLabel:{ color:'var(--t3)', fontSize:10, width:110, overflow:'truncate' } },
      tooltip:{ trigger:'axis', ...TT, axisPointer:{ type:'shadow' } },
      legend: hasComparison ? { textStyle:{ color:'var(--t3)', fontSize:10 }, itemWidth:12, itemHeight:8, top:0, left:'center' } : { show:false },
      series: [
        ...valKeys.map((k,i) => {
          const c = i===0 ? color : PALETA[i % PALETA.length]
          return { name:k, type:'bar', data:[...rows].reverse().map(r=>Number(r[k])||0), barMaxWidth:32, barMinHeight:2, itemStyle:{ borderRadius:[0,5,5,0], color:grad(c,'66') }, emphasis:{ itemStyle:{ color:c } } }
        }),
        ...(hasComparison ? prevSeries([...(prevRows||[])].reverse(), prevFields, valKeys, 'bar', { barMaxWidth:32 }) : []),
      ],
    }} />
  )
}

function renderLine({ rows, labels, valKeys, color, chartStyle, anim, prevRows, prevFields, hasComparison }, areaOpacity = '38') {
  if (!valKeys.length) return <SqlErr />
  return (
    <ReactECharts style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', ...anim, animationDuration:900,
      grid:{ top:valKeys.length>1||hasComparison?32:12, right:12, bottom:28, left:8, containLabel:true },
      xAxis:{ type:'category', data:labels, boundaryGap:false, ...AX, splitLine:{show:false} },
      yAxis:{ type:'value', ...AX, axisLine:{show:false}, splitNumber:4 },
      tooltip:{ trigger:'axis', ...TT, axisPointer:{ lineStyle:{ color:'var(--bd2)', width:1.5, type:'dashed' } } },
      legend: valKeys.length>1||hasComparison ? { textStyle:{ color:'var(--t3)', fontSize:10 }, itemWidth:20, itemHeight:3, bottom:0 } : { show:false },
      series: [
        ...valKeys.map((k,i) => {
          const c = i===0 ? color : PALETA[i % PALETA.length]
          return { name:k, type:'line', smooth:0.4, data:rows.map(r=>Number(r[k])||0), lineStyle:{ color:c, width:2.5 }, itemStyle:{ color:c, borderWidth:2.5, borderColor:'var(--bg)' }, symbol:'circle', symbolSize:6, areaStyle:{ color:{ type:'linear', x:0,y:0,x2:0,y2:1, colorStops:[{ offset:0, color:c+areaOpacity },{ offset:1, color:c+'05' }] } } }
        }),
        ...(hasComparison ? prevSeries(prevRows, prevFields, valKeys, 'line', { smooth:0.4, symbol:'none' }) : []),
      ],
    }} />
  )
}

export function line(ctx) { return renderLine(ctx, '38') }
export function line_area(ctx) { return renderLine(ctx, '70') }

export function pie({ rows, fields, color, chartStyle }) {
  if (!rows.length) return <NoData />
  if (fields.length < 2) return <SqlErr msg="SQL precisa de 2 colunas: label e valor." />
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

export function gauge({ rows, fields, color, chartStyle }) {
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

export function scatter({ rows, fields, color, chartStyle, anim }) {
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

export function radar({ rows, fields, color, chartStyle }) {
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

export function grid({ rows, fields, fillHeight }) {
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
