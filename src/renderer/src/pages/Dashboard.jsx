import { Settings2, LayoutDashboard } from 'lucide-react'
import { WidgetCard, WidgetGrid, useDashboardWidgets } from './dash'

export default function Dashboard({ onNavigate }) {
  const {
    widgets, layout, loading, loadingIds, errorMap,
    containerRef, containerW, refreshOne, handleLayoutChange,
  } = useDashboardWidgets()

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
          <WidgetGrid layout={layout} width={containerW} onLayoutChange={handleLayoutChange}>
            {widgets.map(w => (
              <div key={String(w.id)}>
                <WidgetCard
                  widget={w}
                  loading={loadingIds.has(w.id)}
                  error={errorMap[w.id]}
                  onRefresh={refreshOne}
                />
              </div>
            ))}
          </WidgetGrid>
        )}
      </div>

      <button
        onClick={() => onNavigate?.('dashboard-designer')}
        title="Configurar Dashboard"
        style={{
          position:'fixed', right:22, bottom:22, zIndex:100,
          display:'flex', alignItems:'center', gap:7,
          padding:'9px 18px', borderRadius:24,
          background:'var(--or)', color:'#fff',
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
