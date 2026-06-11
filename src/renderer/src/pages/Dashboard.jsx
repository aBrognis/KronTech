import { useState, useEffect, useRef, useCallback } from 'react'
import { RefreshCw, Settings2, AlertTriangle, LayoutDashboard } from 'lucide-react'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { LucideIcon, WidgetBody, fmtInterval } from './dashShared'

// ── Widget card ───────────────────────────────────────────────────────────────

function Widget({ widget, onRefresh, loading, error }) {
  const isFillH = ['line','bar','bar_h','pie','scatter','radar'].includes(widget.tipo)
  return (
    <div className="dash-panel" style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', cursor:'default' }}>
      <div
        className="widget-drag-handle"
        style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 12px 8px', cursor:'grab', flexShrink:0, borderBottom:'1px solid var(--bd)', background:'var(--s2)', borderRadius:'8px 8px 0 0' }}
      >
        {widget.icone_lucide && (
          <LucideIcon name={widget.icone_lucide} size={13} color={widget.cor || '#FF6B2B'} />
        )}
        <span style={{ flex:1, fontSize:11, fontWeight:600, letterSpacing:.4, color:'var(--t2)', textTransform:'uppercase', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {widget.titulo}
        </span>
        {widget.intervalo > 0 && (
          <span style={{ fontSize:9, color:'var(--t3)', background:'var(--s3)', borderRadius:10, padding:'1px 6px', letterSpacing:.5 }}>
            {fmtInterval(widget.intervalo)}
          </span>
        )}
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

      <div className="dash-panel-body" style={{ flex:1, position:'relative', overflow:'hidden', padding: isFillH ? 0 : '12px 14px' }}>
        {loading && <div className="skel" style={{ position:'absolute', inset:0, zIndex:2, borderRadius: isFillH ? 0 : 6 }} />}
        {error ? (
          <div style={{ display:'flex', alignItems:'center', gap:6, color:'#F87171', fontSize:11, padding: isFillH ? 12 : 0 }}>
            <AlertTriangle size={13} />{error}
          </div>
        ) : widget._rows ? (
          <WidgetBody widget={widget} rows={widget._rows} fields={widget._fields} fillHeight={isFillH} />
        ) : null}
      </div>
    </div>
  )
}

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
    return () => ro.disconnect()
  }, [])

  const loadWidget = useCallback(async (w) => {
    setLoadingIds(s => new Set([...s, w.id]))
    setErrorMap(m => { const n = { ...m }; delete n[w.id]; return n })
    try {
      const sql = (w.sql_query || '').trim()
      if (!sql) return { ...w, _rows: [], _fields: [] }
      const res = await window.api.sql.execute(sql)
      if (res.error) {
        setErrorMap(m => ({ ...m, [w.id]: res.error.split('\n')[0].slice(0, 80) }))
        return { ...w, _rows: [], _fields: [] }
      }
      return { ...w, _rows: res.rows || [], _fields: res.fields?.map(f => f.name) || [] }
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
      const list = await window.api.dash.getAll()
      const filled = await Promise.all((list || []).map(loadWidget))
      setWidgets(filled)
      setLayout(filled.map(w => ({
        i: String(w.id),
        x: w.grid_x ?? 0, y: w.grid_y ?? 0,
        w: w.grid_w ?? 3,  h: w.grid_h ?? 4,
        minW: 2, minH: 2,
      })))
    } finally {
      setLoading(false)
    }
  }, [loadWidget])

  useEffect(() => { loadAll() }, [loadAll])

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

  async function handleRefresh(id) {
    const w = widgets.find(x => x.id === id)
    if (!w) return
    const updated = await loadWidget(w)
    setWidgets(prev => prev.map(x => x.id === id ? updated : x))
  }

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
      <div className="dash-wrapper" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <LayoutDashboard size={52} style={{ color:'var(--t3)', opacity:.35 }} />
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:15, fontWeight:600, color:'var(--t2)', marginBottom:6 }}>Nenhum widget cadastrado</div>
          <div style={{ fontSize:12, color:'var(--t3)', marginBottom:20 }}>Crie widgets para visualizar seus dados aqui</div>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate?.('dashboard-designer')}>
          <Settings2 size={13} style={{ marginRight:6 }} />
          Configurar Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="dash-wrapper" style={{ display:'flex', flexDirection:'column' }}>
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

      <button
        onClick={() => onNavigate?.('dashboard-designer')}
        title="Configurar Dashboard"
        style={{
          position:'fixed', right:22, bottom:22, zIndex:100,
          display:'flex', alignItems:'center', gap:7,
          padding:'9px 18px', borderRadius:24,
          background:'var(--pri)', color:'#fff',
          border:'none', cursor:'pointer',
          fontSize:12, fontWeight:600, letterSpacing:.3,
          boxShadow:'0 4px 20px rgba(0,0,0,.4)',
          transition:'opacity .15s',
        }}
      >
        <Settings2 size={14} />
        Configurar Dashboard
      </button>
    </div>
  )
}
