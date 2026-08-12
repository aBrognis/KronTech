import { RefreshCw, AlertTriangle } from 'lucide-react'
import { LucideIcon } from './icons'
import { WidgetBody } from './chartTypes/WidgetBody'
import { fmtInterval } from './format'
import { isFillHeight } from './constants'

// Card de widget — usado tanto no Dashboard (apresentação) quanto no
// Designer (grid ao vivo, painel 3). Props novas (selected/ghost/onSelect/
// badge) são todas opcionais e default-off, sem efeito no uso do Dashboard.
export function WidgetCard({ widget, onRefresh, loading, error, selected = false, ghost = false, onSelect, badge }) {
  const isFillH = isFillHeight(widget.tipo)
  return (
    <div
      className="dash-widget-card"
      onClick={onSelect}
      style={{
        display:'flex', flexDirection:'column', height:'100%', overflow:'hidden',
        cursor: onSelect ? 'pointer' : 'default',
        opacity: ghost ? 0.55 : 1, transition:'opacity .15s, box-shadow .15s',
        outline: selected ? '2px solid var(--or)' : 'none', outlineOffset: -1,
        boxShadow: selected ? '0 0 0 4px rgba(255,107,43,.12)' : 'none',
        borderRadius: 8,
      }}
    >
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
        {badge && (
          <span style={{ fontSize:9, color:'var(--or)', background:'var(--or3)', borderRadius:10, padding:'1px 6px', letterSpacing:.5, fontWeight:700, textTransform:'uppercase' }}>
            {badge}
          </span>
        )}
        {widget.intervalo > 0 && (
          <span style={{ fontSize:9, color:'var(--t3)', background:'var(--s3)', borderRadius:10, padding:'1px 6px', letterSpacing:.5 }}>
            {fmtInterval(widget.intervalo)}
          </span>
        )}
        {onRefresh && (
          <button
            className="icon-btn"
            onClick={e => { e.stopPropagation(); onRefresh(widget.id) }}
            disabled={loading}
            style={{ opacity: loading ? .5 : 1 }}
            title="Atualizar dados"
          >
            <RefreshCw size={11} style={{ animation: loading ? 'spin .8s linear infinite' : 'none' }} />
          </button>
        )}
      </div>

      <div className="dash-widget-card-body" style={{ flex:1, position:'relative', overflow:'hidden', padding: isFillH ? 0 : '12px 14px' }}>
        {loading && <div className="skel" style={{ position:'absolute', inset:0, zIndex:2, borderRadius: isFillH ? 0 : 6 }} />}
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
}
