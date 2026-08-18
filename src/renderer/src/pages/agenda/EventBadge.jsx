import { AlertTriangle, Clock3 } from 'lucide-react'
import { fmtHora, corEvento, corStatusAuto, corLegivel } from './utils'

function isTemaEscuro() {
  return !document.documentElement.classList.contains('light')
}

export default function EventoChip({ ev, onClick, small, conflito, onMouseDown }) {
  const cor = corEvento(ev)
  // Cor crua (escolhida livremente pelo usuário) usada no fundo/borda
  // (baixa opacidade, sempre funciona); o TEXTO usa uma versão ajustada
  // pra garantir contraste contra o fundo real da página (--s1/--bg no
  // dark, --s1 claro no light) — sem isso, cores escuras de categoria
  // ficavam ilegíveis sobre fundo escuro ("azul sobre azul escuro").
  const corTexto = corLegivel(cor, isTemaEscuro())
  const corAuto = corStatusAuto(ev) // null quando status_auto='agendado' (sem destaque)
  const atrasado = ev.status_auto === 'atrasado'
  return (
    <div onClick={e => { e.stopPropagation(); onClick(ev) }}
      onMouseDown={onMouseDown ? e => { e.stopPropagation(); onMouseDown(ev, e) } : undefined}
      style={{
        background: cor+'22', borderLeft:`2.5px solid ${cor}`,
        outline: corAuto ? `1.5px ${atrasado?'dashed':'solid'} ${corAuto}` : conflito ? '1px dashed var(--red)' : 'none', outlineOffset:-1,
        borderRadius:'0 4px 4px 0', padding: small ? '1px 4px' : '2px 6px',
        fontSize: small ? 9 : 10, color: corTexto, marginBottom:2,
        overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis',
        cursor: onMouseDown ? 'grab' : 'pointer', userSelect:'none',
        transition:'background .12s',
        display:'flex', alignItems:'center', gap:3,
      }}
      onMouseEnter={e => e.currentTarget.style.background = cor+'44'}
      onMouseLeave={e => e.currentTarget.style.background = cor+'22'}
    >
      {corAuto
        ? <Clock3 size={small?8:9} color={corAuto} style={{ flexShrink:0 }}/>
        : conflito && <AlertTriangle size={small?8:9} color="var(--red)" style={{ flexShrink:0 }}/>}
      <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>
        {ev.hr_inicio && !ev.dia_todo ? `${fmtHora(ev.hr_inicio)} ` : ''}{ev.titulo}
      </span>
    </div>
  )
}

export function StatusBadge({ ev, style }) {
  const cor = corStatusOf(ev)
  const corTexto = corLegivel(cor, isTemaEscuro())
  return (
    <span style={{ fontSize:9, fontWeight:700, color:corTexto, border:`1px solid ${cor}44`, borderRadius:4, padding:'1px 6px', ...style }}>
      {ev.status_nome || 'Sem status'}
    </span>
  )
}

function corStatusOf(ev) {
  return ev.status_cor || '#94A3B8'
}
