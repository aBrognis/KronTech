import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { RefreshCw, AlertTriangle, LayoutDashboard } from 'lucide-react'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { LucideIcon, WidgetBody, fmtInterval } from './dash'

// ── Widget card ───────────────────────────────────────────────────────────────

// Memoizado: sem isso, o auto-refresh de QUALQUER widget (setWidgets cria
// array novo) re-renderizava TODOS os widgets da tela, inclusive os que não
// mudaram — no mapa isso reiniciava a animação de entrada de 27 estados a
// cada 15s (tick de qualquer widget vizinho), sensação de travamento
// constante. Com memo, só o widget cujo objeto realmente mudou re-renderiza.
const Widget = memo(function Widget({ widget, onRefresh, loading, error }) {
  const isFillH = ['line','bar','bar_h','pie','scatter','radar',
    'bar_stacked','line_area','funnel','heatmap','calendar_heatmap','treemap','sunburst',
    'boxplot','candlestick','graph','tree','sankey','theme_river','pictorial_bar','parallel',
    'mapa_br',
  ].includes(widget.tipo)

  const cor = widget.cor || '#FF6B2B'
  return (
    <div
      className={`dash-widget-card${loading ? ' dash-hud-syncing-frame' : ''}`}
      style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', cursor:'default', '--wc': cor }}
    >
      <div
        className="widget-drag-handle dash-widget-header"
        style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 12px 8px', cursor:'grab', flexShrink:0, borderRadius:'8px 8px 0 0' }}
      >
        {widget.icone_lucide && (
          <LucideIcon name={widget.icone_lucide} size={13} color={widget.cor || '#FF6B2B'}
            style={loading ? { filter:`drop-shadow(0 0 4px ${widget.cor || '#FF6B2B'})` } : undefined} />
        )}
        <span className="dash-widget-title" style={{ flex:1, fontSize:12.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {widget.titulo}
        </span>
        {widget.intervalo > 0 && (
          <span style={{ fontSize:9, color:'var(--t3)', background:'var(--s3)', borderRadius:10, padding:'1px 6px', letterSpacing:.5 }}>
            {fmtInterval(widget.intervalo)}
          </span>
        )}
        <span className="dash-hud-live" />
        <button
          className="icon-btn"
          onClick={e => { e.stopPropagation(); onRefresh(widget.id) }}
          disabled={loading}
          style={{ opacity: loading ? .5 : 1 }}
          title="Atualizar dados"
        >
          <RefreshCw size={11} style={{ animation: loading ? 'spin .8s linear infinite' : 'none' }} />
        </button>
      </div>

      <div className="dash-widget-card-body" style={{ flex:1, position:'relative', overflow:'hidden', padding: isFillH ? 0 : '16px 18px' }}>
        {error ? (
          <div style={{ display:'flex', alignItems:'center', gap:6, color:'#F87171', fontSize:11, padding: isFillH ? 12 : 0 }}>
            <AlertTriangle size={13} />{error}
          </div>
        ) : widget._rows ? (
          <WidgetBody widget={widget} rows={widget._rows} fields={widget._fields}
            prevRows={widget._prevRows} prevFields={widget._prevFields} fillHeight={isFillH} />
        ) : null}
      </div>
    </div>
  )
})

// ── Dashboard (apresentação) ──────────────────────────────────────────────────

export default function Dashboard({ onNavigate }) {
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
  // Login/maximização da janela terminam depois deste mount, o container pode
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
      const sql = (w.sql_query || '').trim()
      if (!sql) return { ...w, _rows: [], _fields: [] }
      const sqlAnterior = w.comparar_anterior ? (w.sql_query_anterior || '').trim() : ''
      const [res, resPrev] = await Promise.all([
        window.api.sql.execute(sql),
        sqlAnterior ? window.api.sql.execute(sqlAnterior).catch(() => null) : Promise.resolve(null),
      ])
      if (!res.ok) {
        setErrorMap(m => ({ ...m, [w.id]: res.erro.split('\n')[0].slice(0, 80) }))
        return { ...w, _rows: [], _fields: [] }
      }
      const prevOk = resPrev && resPrev.ok
      return {
        ...w, _rows: res.data.rows || [], _fields: res.data.fields || [],
        _prevRows: prevOk ? (resPrev.data.rows || []) : undefined,
        _prevFields: prevOk ? (resPrev.data.fields || []) : undefined,
      }
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
  }, [widgets, loadWidget])

  // useCallback: precisa de referência estável entre renders — Widget é
  // memo() agora, e uma prop de função recriada a cada render do Dashboard
  // (como era antes) invalidaria a memoização de TODOS os widgets.
  const handleRefresh = useCallback(async (id) => {
    setWidgets(prev => {
      const w = prev.find(x => x.id === id)
      if (!w) return prev
      loadWidget(w).then(updated => setWidgets(cur => cur.map(x => x.id === id ? updated : x)))
      return prev
    })
  }, [loadWidget])

  function handleLayoutChange(newLayout) {
    setLayout(newLayout)
    if (layoutDebRef.current) clearTimeout(layoutDebRef.current)
    layoutDebRef.current = setTimeout(() => {
      window.api.dash.updateLayout(
        newLayout.map(item => ({ i: Number(item.i), x: item.x, y: item.y, w: item.w, h: item.h }))
      ).catch(() => {})
    }, 600)
  }

  if (!loading && widgets.length === 0) {
    return (
      <div className="dash-wrapper dash-hud" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <LayoutDashboard size={52} style={{ color:'var(--t3)', opacity:.35 }} />
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:15, fontWeight:600, color:'var(--t2)', marginBottom:6 }}>Nenhum widget cadastrado</div>
          <div style={{ fontSize:12, color:'var(--t3)' }}>Acesse "Configurar Dashboard" no menu para criar seus widgets</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dash-wrapper dash-hud" style={{ display:'flex', flexDirection:'column' }}>
      <div ref={containerRef} className="dash-grid-area" style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            {[...Array(6)].map((_,i) => <div key={i} className="skel" style={{ height:180, borderRadius:10 }} />)}
          </div>
        ) : (
          <GridLayout
            layout={layout}
            cols={12}
            rowHeight={72}
            width={containerW}
            draggableHandle=".widget-drag-handle"
            resizeHandles={['se']}
            onLayoutChange={handleLayoutChange}
            margin={[14, 14]}
            containerPadding={[0, 0]}
          >
            {widgets.map(w => (
              <div key={String(w.id)}>
                <Widget
                  widget={w}
                  loading={loadingIds.has(w.id)}
                  error={errorMap[w.id]}
                  onRefresh={handleRefresh}
                />
              </div>
            ))}
          </GridLayout>
        )}
      </div>
    </div>
  )
}
