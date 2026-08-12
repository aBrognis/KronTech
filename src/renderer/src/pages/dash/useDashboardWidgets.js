import { useState, useEffect, useRef, useCallback } from 'react'
import { runWidgetQuery } from './runWidgetQuery'

// Encapsula toda a lógica de dados/layout do Dashboard: carregar widgets,
// rodar o SQL de cada um, timers de auto-refresh, e persistência de posição
// via drag-and-drop (debounced). Usado tanto por Dashboard.jsx (apresentação)
// quanto por DashboardDesigner.jsx (painel de preview ao vivo, com
// autoRefresh:false — os timers de intervalo não devem disparar durante edição).
export function useDashboardWidgets({ autoRefresh = true } = {}) {
  const [widgets,    setWidgets]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [loadingIds, setLoadingIds] = useState(new Set())
  const [errorMap,   setErrorMap]   = useState({})
  const [containerW, setContainerW] = useState(800)
  const [layout,     setLayout]     = useState([])
  const containerRef = useRef(null)
  const timersRef    = useRef({})
  const layoutDebRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width
      if (w) setContainerW(w)
    })
    ro.observe(containerRef.current)
    // Login/maximização da janela terminam depois deste mount — o container pode
    // reportar uma largura desatualizada na primeira medição do ResizeObserver.
    // Reafirma a largura real em seguida (raf + timeout) para não depender só
    // de um evento de resize físico que talvez nunca chegue a disparar de novo.
    const raf = requestAnimationFrame(() => {
      if (containerRef.current) setContainerW(containerRef.current.getBoundingClientRect().width)
    })
    const t = setTimeout(() => {
      if (containerRef.current) setContainerW(containerRef.current.getBoundingClientRect().width)
    }, 300)
    return () => { ro.disconnect(); cancelAnimationFrame(raf); clearTimeout(t) }
  }, [])

  const loadWidget = useCallback(async (w) => {
    setLoadingIds(s => new Set([...s, w.id]))
    setErrorMap(m => { const n = { ...m }; delete n[w.id]; return n })
    try {
      const { rows, fields, prevRows, prevFields, erro } = await runWidgetQuery(w)
      if (erro) {
        setErrorMap(m => ({ ...m, [w.id]: erro }))
        return { ...w, _rows: [], _fields: [] }
      }
      return { ...w, _rows: rows, _fields: fields, _prevRows: prevRows, _prevFields: prevFields }
    } catch (e) {
      setErrorMap(m => ({ ...m, [w.id]: String(e).slice(0, 80) }))
      return { ...w, _rows: [], _fields: [] }
    } finally {
      setLoadingIds(s => { const n = new Set(s); n.delete(w.id); return n })
    }
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.api.dash.getAll()
      const filled = await Promise.all((res.ok ? res.data : []).map(loadWidget))
      setWidgets(filled)
      setLayout(filled.map(w => ({
        i: String(w.id),
        x: w.grid_x ?? 0, y: w.grid_y ?? 0,
        w: w.grid_w ?? 3,  h: w.grid_h ?? 2,
        minW: 2, minH: 2,
      })))
    } finally {
      setLoading(false)
    }
  }, [loadWidget])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    window.addEventListener('dash:widgets-changed', loadAll)
    return () => window.removeEventListener('dash:widgets-changed', loadAll)
  }, [loadAll])

  // auto-refresh timers
  useEffect(() => {
    if (!autoRefresh) return
    Object.values(timersRef.current).forEach(clearInterval)
    timersRef.current = {}
    widgets.forEach(w => {
      if (w.intervalo > 0) {
        timersRef.current[w.id] = setInterval(async () => {
          const updated = await loadWidget(w)
          setWidgets(prev => prev.map(x => x.id === w.id ? updated : x))
        }, w.intervalo * 1000)
      }
    })
    return () => Object.values(timersRef.current).forEach(clearInterval)
  }, [widgets, loadWidget, autoRefresh])

  const refreshOne = useCallback(async (id) => {
    const w = widgets.find(x => x.id === id)
    if (!w) return
    const updated = await loadWidget(w)
    setWidgets(prev => prev.map(x => x.id === id ? updated : x))
  }, [widgets, loadWidget])

  function handleLayoutChange(newLayout) {
    setLayout(newLayout)
    if (layoutDebRef.current) clearTimeout(layoutDebRef.current)
    layoutDebRef.current = setTimeout(() => {
      const persistiveis = newLayout.filter(item => /^\d+$/.test(item.i))
      if (!persistiveis.length) return
      window.api.dash.updateLayout(
        persistiveis.map(item => ({ i: Number(item.i), x: item.x, y: item.y, w: item.w, h: item.h }))
      ).catch(() => {})
    }, 600)
  }

  return {
    widgets, layout, loading, loadingIds, errorMap,
    containerRef, containerW,
    loadAll, refreshOne, handleLayoutChange, setWidgets, setLayout,
  }
}
