import { useRef, useEffect, useMemo } from 'react'
import { AlertTriangle, Clock3 } from 'lucide-react'
import { DIAS_SEMANA_CURTO, toISO, layoutEventosComHora, corEvento, corStatusAuto, fmtHora } from './utils'

const PX_HORA = 48

export default function ViewSemanal({ weekDays, today, events, onOpenNew, onOpenEdit, onDragStart }) {
  const HORAS = Array.from({length:24},(_,i)=>i)
  const scrollRef = useRef(null)
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * PX_HORA
  }, [])

  const layoutPorDia = useMemo(() => {
    const map = {}
    weekDays.forEach(d => { map[toISO(d)] = layoutEventosComHora(events, toISO(d), PX_HORA) })
    return map
  }, [events, weekDays])

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
      {/* Header dias */}
      <div style={{ display:'grid', gridTemplateColumns:'52px repeat(7,1fr)', borderBottom:'1px solid var(--bd)', flexShrink:0, background:'var(--s1)' }}>
        <div/>
        {weekDays.map((d,i) => {
          const isToday = toISO(d) === toISO(today)
          const isWeekend = d.getDay()===0||d.getDay()===6
          return (
            <div key={i} style={{ padding:'8px 4px', textAlign:'center', borderLeft:'1px solid var(--bd)' }}>
              <div style={{ fontSize:9, fontWeight:600, color: isWeekend?'#F87171':'var(--t3)', letterSpacing:.8, textTransform:'uppercase' }}>
                {DIAS_SEMANA_CURTO[d.getDay()]}
              </div>
              <div style={{
                fontSize:16, fontWeight:700, marginTop:2,
                color: isToday?'#fff': isWeekend?'#F87171':'var(--t1)',
                background: isToday?'var(--or)':'transparent',
                borderRadius:'50%', width:28, height:28,
                display:'flex', alignItems:'center', justifyContent:'center', margin:'2px auto 0',
              }}>{d.getDate()}</div>
            </div>
          )
        })}
      </div>
      {/* Grade horária contínua, colunas de dia com posicionamento absoluto por minuto */}
      <div ref={scrollRef} style={{ flex:1, overflowY:'auto', position:'relative' }}>
        <div style={{ display:'grid', gridTemplateColumns:'52px repeat(7,1fr)', position:'relative', height: 24*PX_HORA }}>
          {/* Coluna de horas */}
          <div style={{ position:'relative' }}>
            {HORAS.map(h => (
              <div key={h} style={{ position:'absolute', top: h*PX_HORA - 7, right:6, fontSize:9, color:'var(--t3)' }}>
                {h===0?'':String(h).padStart(2,'0')+':00'}
              </div>
            ))}
          </div>

          {weekDays.map((d,di) => {
            const iso = toISO(d)
            const isToday = iso === toISO(today)
            const layout = layoutPorDia[iso]
            return (
              <div key={di} style={{ position:'relative', borderLeft:'1px solid var(--bd)', background: isToday ? 'rgba(255,107,43,.03)' : 'transparent' }}>
                {HORAS.map(h => (
                  <div key={h} onClick={() => onOpenNew(iso)}
                    data-agenda-slot={iso} data-agenda-hora={h}
                    style={{ position:'absolute', left:0, right:0, top:h*PX_HORA, height:PX_HORA, borderBottom:'1px solid var(--bd)', cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--s3)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  />
                ))}
                {layout.map(({ ev, top, height, col, cols }) => {
                  const cor = corEvento(ev)
                  const conflito = cols > 1
                  const atrasado = ev.status_auto === 'atrasado'
                  const corAtraso = corStatusAuto(ev)
                  const larguraPct = 100 / cols
                  return (
                    <div key={ev.id}
                      onClick={e => { e.stopPropagation(); onOpenEdit(ev) }}
                      onMouseDown={onDragStart ? e => { e.stopPropagation(); onDragStart(ev, e) } : undefined}
                      style={{
                        position:'absolute', top, height: Math.max(height-1, 14),
                        left: `calc(${larguraPct * col}% + ${col>0?2:1}px)`,
                        width: `calc(${larguraPct}% - ${col<cols-1?4:2}px)`,
                        background: cor+'22', borderLeft:`2.5px solid ${cor}`,
                        outline: atrasado ? `2px dashed ${corAtraso}` : conflito ? '1px dashed var(--red)' : 'none', outlineOffset:-1,
                        borderRadius:'0 4px 4px 0', padding:'1px 4px',
                        fontSize:9, color:cor, cursor: onDragStart ? 'grab' : 'pointer',
                        overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis',
                        display:'flex', alignItems:'center', gap:2, zIndex:1,
                      }}>
                      {atrasado
                        ? <Clock3 size={8} color={corAtraso} style={{ flexShrink:0 }}/>
                        : conflito && <AlertTriangle size={8} color="var(--red)" style={{ flexShrink:0 }}/>}
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>
                        {ev.hr_inicio && !ev.dia_todo ? `${fmtHora(ev.hr_inicio)} ` : ''}{ev.titulo}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
