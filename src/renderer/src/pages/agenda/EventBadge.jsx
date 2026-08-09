import { AlertTriangle } from 'lucide-react'
import { fmtHora, corEvento } from './utils'

export default function EventoChip({ ev, onClick, small, conflito, onMouseDown }) {
  const cor = corEvento(ev)
  return (
    <div onClick={e => { e.stopPropagation(); onClick(ev) }}
      onMouseDown={onMouseDown ? e => { e.stopPropagation(); onMouseDown(ev, e) } : undefined}
      style={{
        background: cor+'22', borderLeft:`2.5px solid ${cor}`,
        outline: conflito ? '1px dashed var(--red)' : 'none', outlineOffset:-1,
        borderRadius:'0 4px 4px 0', padding: small ? '1px 4px' : '2px 6px',
        fontSize: small ? 9 : 10, color: cor, marginBottom:2,
        overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis',
        cursor: onMouseDown ? 'grab' : 'pointer', userSelect:'none',
        transition:'background .12s',
        display:'flex', alignItems:'center', gap:3,
      }}
      onMouseEnter={e => e.currentTarget.style.background = cor+'44'}
      onMouseLeave={e => e.currentTarget.style.background = cor+'22'}
    >
      {conflito && <AlertTriangle size={small?8:9} color="var(--red)" style={{ flexShrink:0 }}/>}
      <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>
        {ev.hr_inicio && !ev.dia_todo ? `${fmtHora(ev.hr_inicio)} ` : ''}{ev.titulo}
      </span>
    </div>
  )
}

export function StatusBadge({ ev, style }) {
  const cor = corStatusOf(ev)
  return (
    <span style={{ fontSize:9, fontWeight:700, color:cor, border:`1px solid ${cor}44`, borderRadius:4, padding:'1px 6px', ...style }}>
      {ev.status_nome || '—'}
    </span>
  )
}

function corStatusOf(ev) {
  return ev.status_cor || '#94A3B8'
}
