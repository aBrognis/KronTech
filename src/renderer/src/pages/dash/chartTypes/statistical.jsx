// Tipos estatísticos/financeiros: boxplot, candlestick, barras pictóricas
import EChart from '../EChart'
import { cssVar, TT, AX, SqlErr } from '../echartsHelpers'

function computeBoxplotStats(rows, fields) {
  const groups = {}
  rows.forEach(r => { const k = String(r[fields[0]]); (groups[k] ??= []).push(Number(r[fields[1]])||0) })
  const cats = Object.keys(groups)
  const data = cats.map(k => {
    const vals = groups[k].sort((a,b) => a-b)
    const q = p => vals[Math.floor(p * (vals.length-1))]
    return [vals[0], q(0.25), q(0.5), q(0.75), vals[vals.length-1]]
  })
  return { cats, data }
}

export function boxplot({ rows, fields, color, chartStyle }) {
  if (fields.length < 2) return <SqlErr msg="SQL precisa de: categoria, valor numérico." />
  const { cats, data } = computeBoxplotStats(rows, fields)
  return (
    <EChart style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', animation:true,
      grid:{ top:20, right:20, bottom:40, left:8, containLabel:true },
      xAxis:{ type:'category', data:cats, ...AX(), splitLine:{ show:false } },
      yAxis:{ type:'value', ...AX(), axisLine:{ show:false } },
      tooltip:{ ...TT(), trigger:'item' },
      series:[{ type:'boxplot', data, itemStyle:{ color:color+'33', borderColor:color, borderWidth:1.5 } }],
    }} />
  )
}

export function candlestick({ rows, fields, chartStyle }) {
  if (fields.length < 5) return <SqlErr msg="SQL precisa de: rótulo, abertura, fechamento, mínima, máxima." />
  const dates = rows.map(r => String(r[fields[0]]))
  const data = rows.map(r => [Number(r[fields[1]])||0, Number(r[fields[2]])||0, Number(r[fields[3]])||0, Number(r[fields[4]])||0])
  return (
    <EChart style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', animation:true,
      grid:{ top:12, right:16, bottom:40, left:8, containLabel:true },
      xAxis:{ type:'category', data:dates, ...AX(), splitLine:{ show:false } },
      yAxis:{ type:'value', ...AX(), axisLine:{ show:false }, scale:true },
      tooltip:{ trigger:'axis', ...TT() },
      series:[{ type:'candlestick', data,
        itemStyle:{ color:'#4ADE80', color0:'#F87171', borderColor:'#4ADE80', borderColor0:'#F87171' } }],
    }} />
  )
}

export function pictorial_bar({ fields, labels, color, chartStyle, anim, rows, prevRows, prevFields, hasComparison }) {
  if (fields.length < 2) return <SqlErr />
  return (
    <EChart style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', ...anim,
      grid:{ top:hasComparison?28:12, right:12, bottom:28, left:8, containLabel:true },
      xAxis:{ type:'category', data:labels, boundaryGap:true, ...AX(), splitLine:{ show:false } },
      yAxis:{ type:'value', ...AX(), axisLine:{ show:false }, splitNumber:4 },
      tooltip:{ trigger:'axis', ...TT() },
      legend: hasComparison ? { textStyle:{ color:cssVar('--t3'), fontSize:10 }, top:0 } : { show:false },
      series: [
        { name:fields[1], type:'pictorialBar', data: rows.map(r=>Number(r[fields[1]])||0),
          symbol:'roundRect', symbolRepeat:true, symbolSize:['70%','62%'], symbolMargin:'20%',
          itemStyle:{ color }, z:10 },
        ...(hasComparison ? [{
          name:`${fields[1]} (anterior)`, type:'pictorialBar',
          data: prevRows.map(r => Number(r[prevFields?.[1] ?? fields[1]]) || 0),
          symbol:'roundRect', symbolRepeat:true, symbolSize:['70%','62%'], symbolMargin:'20%',
          itemStyle:{ color:cssVar('--t3'), opacity:0.35 }, z:9,
        }] : []),
      ],
    }} />
  )
}
