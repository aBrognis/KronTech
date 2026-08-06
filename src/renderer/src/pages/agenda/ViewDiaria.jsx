import { useRef, useEffect, useMemo } from 'react'
import { Plus, Clock, MapPin, AlertTriangle } from 'lucide-react'
import { DIAS_SEMANA_LONGO, MESES, toISO, eventosDodia, layoutEventosComHora, corEvento, corStatus, nomeStatus } from './utils'

const PX_HORA = 64

export default function ViewDiaria({ date, today, events, onOpenNew, onOpenEdit, draggingId, onDragStart }) {
  const iso = toISO(date)
  const dayEvs = eventosDodia(events, iso)
  const layout = useMemo(() => layoutEventosComHora(events, iso, PX_HORA), [events, iso])
  const HORAS = Array.from({length:24},(_,i)=>i)
  const scrollRef = useRef(null)
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 7*PX_HORA }, [])

  const semHora  = dayEvs.filter(e => !e.hr_inicio)
  const isToday  = iso === toISO(today)
  const isWeekend = date.getDay()===0||date.getDay()===6

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
      {/* Header do dia */}
      <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--bd)', flexShrink:0, display:'flex', alignItems:'center', gap:16 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:600, color: isWeekend?'#F87171':'var(--t3)', textTransform:'uppercase', letterSpacing:.8 }}>
            {DIAS_SEMANA_LONGO[date.getDay()]}
          </div>
          <div style={{ fontSize:28, fontWeight:700, color: isToday?'var(--or)': isWeekend?'#F87171':'var(--t1)', lineHeight:1 }}>
            {date.getDate()} <span style={{ fontSize:16, color:'var(--t3)' }}>{MESES[date.getMonth()]} {date.getFullYear()}</span>
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginLeft:'auto', height:32, fontSize:11 }} onClick={() => onOpenNew(iso)}>
          <Plus size={13}/> Novo evento
        </button>
      </div>

      {/* Eventos sem hora */}
      {semHora.length > 0 && (
        <div style={{ padding:'8px 20px', borderBottom:'1px solid var(--bd)', flexShrink:0, display:'flex', flexWrap:'wrap', gap:6 }}>
          {semHora.map(ev => {
            const cor = corEvento(ev)
            return (
              <div key={ev.id} onClick={() => onOpenEdit(ev)}
                style={{ background:cor+'22', border:`1px solid ${cor}44`, borderRadius:6, padding:'4px 10px', fontSize:11, color:cor, cursor:'pointer' }}>
                {ev.titulo}
              </div>
            )
          })}
        </div>
      )}

      {/* Grade horária contínua, eventos posicionados por minuto */}
      <div ref={scrollRef} style={{ flex:1, overflowY:'auto', position:'relative' }}>
        <div style={{ position:'relative', height: 24*PX_HORA }}>
          {HORAS.map(h => (
            <div key={h} onClick={() => onOpenNew(iso)}
              data-agenda-slot={iso} data-agenda-hora={h}
              style={{
                position:'absolute', left:0, right:0, top: h*PX_HORA, height:PX_HORA,
                display:'flex', borderBottom:'1px solid var(--bd)', cursor:'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background='var(--s3)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <div style={{ width:56, flexShrink:0, padding:'4px 8px 0 0', textAlign:'right', fontSize:10, color: isToday&&h===today.getHours()?'var(--or)':'var(--t3)', fontWeight: isToday&&h===today.getHours()?700:400 }}>
                {String(h).padStart(2,'0')}:00
              </div>
              <div style={{ flex:1, borderLeft:'1px solid var(--bd)' }}/>
            </div>
          ))}

          {isToday && (
            <div style={{ position:'absolute', left:56, right:0, top: (today.getHours() + today.getMinutes()/60) * PX_HORA, height:2, background:'var(--or)', zIndex:3, pointerEvents:'none' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--or)', marginTop:-3, marginLeft:-4 }}/>
            </div>
          )}

          {/* Eventos com hora, posicionados absolutamente lado a lado quando conflitam */}
          <div style={{ position:'absolute', left:56, right:8, top:0, bottom:0 }}>
            {layout.map(({ ev, top, height, col, cols }) => {
              const cor = corEvento(ev)
              const stCor = corStatus(ev)
              const conflito = cols > 1
              const larguraPct = 100 / cols
              return (
                <div key={ev.id}
                  onClick={e => { e.stopPropagation(); onOpenEdit(ev) }}
                  onMouseDown={onDragStart ? e => { e.stopPropagation(); onDragStart(ev, e) } : undefined}
                  style={{
                    position:'absolute', top, height: height-2,
                    left: `calc(${larguraPct * col}% + ${col>0?3:0}px)`,
                    width: `calc(${larguraPct}% - ${col<cols-1?6:3}px)`,
                    background:cor+'18', border:`1.5px solid ${cor}55`, borderLeft:`4px solid ${cor}`,
                    outline: conflito ? '1px dashed var(--red)' : 'none', outlineOffset:-1,
                    borderRadius:6, padding: height>40 ? '6px 8px' : '2px 8px',
                    cursor: onDragStart ? 'grab' : 'pointer',
                    opacity: draggingId===ev.id ? 0.4 : 1,
                    overflow:'hidden', zIndex:1,
                  }}>
                  <div style={{ fontSize: height>40?12:11, fontWeight:700, color:cor, display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {conflito && <AlertTriangle size={10} color="var(--red)" style={{ flexShrink:0 }}/>}
                    <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{ev.titulo}</span>
                  </div>
                  {height > 34 && (
                    <div style={{ display:'flex', gap:8, marginTop:2, flexWrap:'wrap', overflow:'hidden' }}>
                      {(ev.hr_inicio||ev.hr_fim) && (
                        <span style={{ fontSize:9, color:'var(--t3)', display:'flex', alignItems:'center', gap:2, whiteSpace:'nowrap' }}>
                          <Clock size={9}/>{ev.hr_inicio?.slice(0,5)}{ev.hr_fim?` – ${ev.hr_fim.slice(0,5)}`:''}
                        </span>
                      )}
                      {height > 56 && ev.local && <span style={{ fontSize:9, color:'var(--t3)', display:'flex', alignItems:'center', gap:2 }}><MapPin size={9}/>{ev.local}</span>}
                      {height > 56 && (
                        <span style={{ fontSize:8, fontWeight:700, color:stCor, border:`1px solid ${stCor}44`, borderRadius:4, padding:'0 5px' }}>
                          {nomeStatus(ev)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
