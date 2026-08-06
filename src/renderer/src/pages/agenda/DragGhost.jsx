import { fmtHora, corEvento } from './utils'

// Chip flutuante que acompanha o cursor enquanto um evento é arrastado —
// dá o feedback visual "fluido" de arrastar (o card original só troca de
// posição de fato quando o drop é confirmado no mouseup).
export default function DragGhost({ evento, mousePos }) {
  if (!evento || !mousePos) return null
  const cor = corEvento(evento)
  return (
    <div style={{
      position:'fixed', left:0, top:0,
      transform: `translate3d(${Math.round(mousePos.x + 14)}px, ${Math.round(mousePos.y + 10)}px, 0)`,
      zIndex:2000, pointerEvents:'none',
      background: 'var(--s2)', border:`1.5px solid ${cor}`, borderLeft:`4px solid ${cor}`,
      borderRadius:6, padding:'6px 12px', boxShadow:'0 4px 16px rgba(0,0,0,.35)',
      fontSize:12, fontWeight:600, color:'var(--t1)', maxWidth:220,
      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
      backfaceVisibility:'hidden', WebkitFontSmoothing:'antialiased',
    }}>
      {evento.hr_inicio && !evento.dia_todo ? `${fmtHora(evento.hr_inicio)} ` : ''}{evento.titulo}
    </div>
  )
}
