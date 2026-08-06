// Diagramas de fluxo/relação: funil, sankey, grafo, árvore, rio temático
import ReactECharts from 'echarts-for-react'
import { TT } from '../echartsHelpers'
import { PALETA } from '../constants'
import { SqlErr } from '../echartsHelpers'

export function funnel({ rows, fields, color, chartStyle }) {
  if (fields.length < 2) return <SqlErr msg="SQL precisa de: etapa, valor." />
  const values = rows.map(r => Number(r[fields[1]]) || 0)
  return (
    <ReactECharts style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', animation:true, animationDuration:800,
      tooltip:{ trigger:'item', ...TT, formatter:'{b}: {c} ({d}%)' },
      series:[{
        type:'funnel', left:'10%', top:20, bottom:20, width:'80%', min:0, max: Math.max(...values, 1),
        sort:'descending', gap:2,
        label:{ show:true, position:'inside', color:'#fff', fontSize:11, formatter:'{b}\n{c}' },
        itemStyle:{ borderColor:'var(--bg)', borderWidth:1 },
        data: rows.map((r,i)=>({ name:String(r[fields[0]]), value:Number(r[fields[1]])||0,
          itemStyle:{ color: i===0?color:PALETA[i%PALETA.length] } })),
      }],
    }} />
  )
}

function buildEdgeSets(rows, fields) {
  const nodeSet = new Set()
  rows.forEach(r => { nodeSet.add(String(r[fields[0]])); nodeSet.add(String(r[fields[1]])) })
  return nodeSet
}

export function graph({ rows, fields, color, chartStyle }) {
  if (fields.length < 2) return <SqlErr msg="SQL precisa de: nó origem, nó destino, peso (opcional)." />
  const nodeSet = buildEdgeSets(rows, fields)
  const nodes = [...nodeSet].map(name => ({ name, symbolSize: 26, itemStyle:{ color } }))
  const links = rows.map(r => ({ source:String(r[fields[0]]), target:String(r[fields[1]]),
    value: fields[2] ? Number(r[fields[2]])||1 : 1 }))
  return (
    <ReactECharts style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', animation:true,
      tooltip:{ ...TT },
      series:[{ type:'graph', layout:'force', roam:true, draggable:true,
        data: nodes, links,
        force:{ repulsion:120, edgeLength:70 },
        label:{ show:true, color:'var(--t1)', fontSize:9, position:'right' },
        lineStyle:{ color:'var(--bd2)', curveness:0.15, width:1.5 },
        emphasis:{ focus:'adjacency' },
      }],
    }} />
  )
}

function buildTreeData(rows, fields) {
  const byName = {}
  rows.forEach(r => { byName[String(r[fields[0]])] = { name:String(r[fields[0]]), children:[] } })
  let root = null
  rows.forEach(r => {
    const node = byName[String(r[fields[0]])]
    const parent = fields[1] ? r[fields[1]] : null
    if (parent && byName[String(parent)]) byName[String(parent)].children.push(node)
    else root = root || node
  })
  return root || { name:'raiz', children: Object.values(byName) }
}

export function tree({ rows, fields, chartStyle }) {
  if (!fields.length) return <SqlErr msg="SQL precisa de: nome do nó, nome do pai (vazio = raiz)." />
  return (
    <ReactECharts style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', animation:true, animationDuration:550,
      tooltip:{ ...TT },
      series:[{ type:'tree', data:[buildTreeData(rows, fields)], layout:'orthogonal', orient:'LR',
        top:'4%', left:'8%', bottom:'4%', right:'20%',
        symbol:'circle', symbolSize:8, label:{ position:'left', color:'var(--t2)', fontSize:10, align:'right' },
        leaves:{ label:{ position:'right', align:'left' } },
        lineStyle:{ color:'var(--bd2)' }, expandAndCollapse:true, animationDuration:550,
      }],
    }} />
  )
}

export function sankey({ rows, fields, color, chartStyle }) {
  if (fields.length < 3) return <SqlErr msg="SQL precisa de: origem, destino, valor do fluxo." />
  const nodeSet = buildEdgeSets(rows, fields)
  const nodes = [...nodeSet].map(name => ({ name }))
  const links = rows.map(r => ({ source:String(r[fields[0]]), target:String(r[fields[1]]), value:Number(r[fields[2]])||1 }))
  return (
    <ReactECharts style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', animation:true,
      tooltip:{ ...TT },
      series:[{ type:'sankey', data:nodes, links, emphasis:{ focus:'adjacency' },
        lineStyle:{ color:'gradient', curveness:0.5, opacity:0.35 },
        itemStyle:{ color, borderColor:'var(--bg)' },
        label:{ color:'var(--t2)', fontSize:10 },
        nodeGap:14, nodeWidth:16,
      }],
    }} />
  )
}

export function theme_river({ rows, fields, color, chartStyle }) {
  if (fields.length < 3) return <SqlErr msg="SQL precisa de: data, categoria/série, valor." />
  const data = rows.map(r => [String(r[fields[0]]).slice(0,10), Number(r[fields[2]])||0, String(r[fields[1]])])
  const cats = [...new Set(rows.map(r => String(r[fields[1]])))]
  return (
    <ReactECharts style={chartStyle} opts={{ renderer:'canvas' }} option={{
      backgroundColor:'transparent', animation:true,
      tooltip:{ trigger:'axis', ...TT },
      legend:{ top:0, textStyle:{ color:'var(--t3)', fontSize:10 } },
      singleAxis:{ top:36, bottom:20, left:8, right:16, type:'time',
        axisLabel:{ color:'var(--t3)', fontSize:9 }, axisLine:{ lineStyle:{ color:'var(--bd)' } } },
      series:[{ type:'themeRiver', data,
        color: cats.map((_,i)=>i===0?color:PALETA[i%PALETA.length]),
        label:{ color:'var(--t2)', fontSize:9 },
        emphasis:{ itemStyle:{ shadowBlur:20 } } }],
    }} />
  )
}
