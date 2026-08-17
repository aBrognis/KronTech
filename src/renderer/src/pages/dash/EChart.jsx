// Wrapper fino sobre ReactECharts que corrige o redimensionamento: o
// react-grid-layout redimensiona o card arrastando o handle, sem disparar
// nenhum evento "resize" na window — e o ECharts só reajusta o canvas
// automaticamente nesse evento. Sem isso, o gráfico fica "preso" no
// tamanho do primeiro render e o card cresce/encolhe em volta dele.
import { useRef, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'

export default function EChart({ style, ...rest }) {
  const wrapRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(() => {
      chartRef.current?.getEchartsInstance()?.resize()
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={wrapRef} style={style}>
      <ReactECharts ref={chartRef} style={{ width: '100%', height: '100%' }} {...rest} />
    </div>
  )
}
