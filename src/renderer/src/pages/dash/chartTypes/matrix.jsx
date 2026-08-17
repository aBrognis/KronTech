// Tipos de matriz/hierarquia espacial: heatmap, calendário, treemap, sunburst, coordenadas paralelas
import EChart from '../EChart'
import { isNumCol } from '../format'
import { cssVar, TT, AX, SqlErr } from '../echartsHelpers'

export function heatmap({ rows, fields, color, chartStyle }) {
  if (fields.length < 3) return <SqlErr msg="SQL precisa de: categoria X, categoria Y, valor." />
  const xs = [...new Set(rows.map(r => String(r[fields[0]])))]
  const ys = [...new Set(rows.map(r => String(r[fields[1]])))]
  const data = rows.map(r => [xs.indexOf(String(r[fields[0]])), ys.indexOf(String(r[fields[1]])), Number(r[fields[2]])||0])
  return (
    <EChart style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', animation:true,
      grid:{ top:20, right:20, bottom:60, left:100, containLabel:true },
      xAxis:{ type:'category', data:xs, splitArea:{ show:true }, axisLabel:{ ...AX().axisLabel, rotate:30 } },
      yAxis:{ type:'category', data:ys, splitArea:{ show:true }, axisLabel:AX().axisLabel },
      tooltip:{ ...TT() },
      visualMap:{ min:0, max:Math.max(...data.map(d=>d[2]),1), calculable:true, orient:'horizontal',
        left:'center', bottom:0, textStyle:{ color:cssVar('--t3') }, inRange:{ color:[cssVar('--s3'),color] } },
      series:[{ type:'heatmap', data, label:{ show:true, color:cssVar('--t1'), fontSize:9 },
        itemStyle:{ borderColor:cssVar('--bg'), borderWidth:1 } }],
    }} />
  )
}

export function calendar_heatmap({ rows, fields, color, chartStyle }) {
  if (fields.length < 2) return <SqlErr msg="SQL precisa de: data, valor." />
  const data = rows.map(r => [String(r[fields[0]]).slice(0,10), Number(r[fields[1]])||0])
  const year = data.length ? new Date(data[0][0]).getFullYear() : new Date().getFullYear()
  return (
    <EChart style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', animation:true,
      tooltip:{ ...TT(), formatter:p=>`${p.data[0]}: <b>${p.data[1]}</b>` },
      visualMap:{ min:0, max:Math.max(...data.map(d=>d[1]),1), calculable:false, show:false,
        inRange:{ color:[cssVar('--s3'), color] } },
      calendar:{ range:year, cellSize:['auto',14], top:24, left:36, right:12,
        itemStyle:{ borderWidth:2, borderColor:cssVar('--bg') },
        dayLabel:{ color:cssVar('--t3'), fontSize:9 }, monthLabel:{ color:cssVar('--t3'), fontSize:9 },
        yearLabel:{ show:false }, splitLine:{ lineStyle:{ color:cssVar('--bd') } } },
      series:[{ type:'heatmap', coordinateSystem:'calendar', data }],
    }} />
  )
}

function buildGroupedData(rows, fields) {
  if (fields.length < 3) return rows.map(r => ({ name:String(r[fields[0]]), value:Number(r[fields[1]])||0 }))
  const groups = {}
  rows.forEach(r => {
    const g = String(r[fields[2]])
    ;(groups[g] ??= []).push({ name:String(r[fields[0]]), value:Number(r[fields[1]])||0 })
  })
  return Object.entries(groups).map(([name,children]) => ({ name, children }))
}

export function treemap({ rows, fields, chartStyle }) {
  if (!fields.length) return <SqlErr msg="SQL precisa de: nome, valor." />
  return (
    <EChart style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', animation:true,
      tooltip:{ ...TT() },
      series:[{ type:'treemap', data: buildGroupedData(rows, fields), roam:false,
        breadcrumb:{ show:false }, label:{ color:'#fff', fontSize:10 },
        itemStyle:{ borderColor:cssVar('--bg'), borderWidth:1, gapWidth:1 },
        levels:[{}, { itemStyle:{ borderColorSaturation:0.6, gapWidth:1 } }],
        colorMappingBy:'index',
      }],
    }} />
  )
}

export function sunburst({ rows, fields, chartStyle }) {
  if (!fields.length) return <SqlErr msg="SQL precisa de: nome, valor, grupo pai (opcional)." />
  return (
    <EChart style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', animation:true,
      tooltip:{ ...TT() },
      series:[{ type:'sunburst', data: buildGroupedData(rows, fields), radius:[0,'85%'],
        label:{ color:'#fff', fontSize:9, minAngle:8 },
        itemStyle:{ borderColor:cssVar('--bg'), borderWidth:1.5 },
        levels:[{}, { r0:'15%', r:'55%' }, { r0:'55%', r:'85%' }],
      }],
    }} />
  )
}

export function parallel({ rows, fields, color, chartStyle }) {
  const numericFields = fields.filter(f => isNumCol(rows, f))
  if (numericFields.length < 2) return <SqlErr msg="SQL precisa de pelo menos 2 colunas numéricas." />
  const dims = numericFields.map((f,i) => ({ dim:i, name:f }))
  const parallelData = rows.map(r => numericFields.map(f => Number(r[f])||0))
  return (
    <EChart style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', animation:true,
      tooltip:{ ...TT() },
      parallelAxis: dims.map((d) => ({ dim:d.dim, name:d.name, nameTextStyle:{ color:cssVar('--t3'), fontSize:9 },
        axisLine:{ lineStyle:{ color:cssVar('--bd') } }, axisLabel:{ color:cssVar('--t3'), fontSize:9 } })),
      parallel:{ top:36, left:'6%', right:'6%', bottom:12, parallelAxisDefault:{ type:'value' } },
      series:[{ type:'parallel', lineStyle:{ color, opacity:0.35, width:1.5 }, data: parallelData }],
    }} />
  )
}
