import { fmtHora, corEvento } from './utils'

// Chip flutuante que acompanha o cursor enquanto um evento é arrastado —
// dá o feedback visual "fluido" de arrastar (o card original só troca de
// posição de fato quando o drop é confirmado no mouseup).
export default function DragGhost({ evento, mousePos }) {
  if (!evento || !mousePos) return null
  const cor = corEvento(evento)
  return (
    <div style={{
      position:'fixed',
      left: Math.round(mousePos.x + 14), top: Math.round(mousePos.y + 10),
      zIndex:2000, pointerEvents:'none',
      background: 'var(--s2)', border:`1.5px solid ${cor}`, borderLeft:`4px solid ${cor}`,
      borderRadius:6, padding:'6px 12px', boxShadow:'0 4px 16px rgba(0,0,0,.35)',
      fontSize:12, fontWeight:600, color:'var(--t1)', maxWidth:220,
      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
    }}>
      {evento.hr_inicio && !evento.dia_todo ? `${fmtHora(evento.hr_inicio)} ` : ''}{evento.titulo}
    </div>
  )
}
