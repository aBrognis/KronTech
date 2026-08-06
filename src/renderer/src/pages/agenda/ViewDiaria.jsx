import { useRef, useEffect, useMemo } from 'react'
import { Plus, Clock, MapPin, AlertTriangle } from 'lucide-react'
import { DIAS_SEMANA_LONGO, MESES, toISO, eventosDodia, eventosConflitantes, corEvento, corStatus, nomeStatus } from './utils'

export default function ViewDiaria({ date, today, events, onOpenNew, onOpenEdit, draggingId, onDragStart }) {
  const iso = toISO(date)
  const dayEvs = eventosDodia(events, iso)
  const conflitantes = useMemo(() => eventosConflitantes(events, iso), [events, iso])
  const HORAS = Array.from({length:24},(_,i)=>i)
  const scrollRef = useRef(null)
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 7*64 }, [])

  const comHora  = dayEvs.filter(e => e.hr_inicio)
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

      {/* Grade horária */}
      <div ref={scrollRef} style={{ flex:1, overflowY:'auto' }}>
        {HORAS.map(h => {
          const hEvs = comHora.filter(e => parseInt(e.hr_inicio.slice(0,2))===h)
          const nowH = today.getHours()
          const isNowH = isToday && h===nowH
          return (
            <div key={h} style={{ display:'flex', borderBottom:'1px solid var(--bd)', minHeight:64, position:'relative' }}>
              <div style={{ width:56, flexShrink:0, padding:'4px 8px 0 0', textAlign:'right', fontSize:10, color: isNowH?'var(--or)':'var(--t3)', fontWeight: isNowH?700:400 }}>
                {String(h).padStart(2,'0')}:00
              </div>
              <div onClick={() => onOpenNew(iso)}
                data-agenda-slot={iso} data-agenda-hora={h}
                style={{ flex:1, padding:'3px 8px', cursor:'pointer', borderLeft:'1px solid var(--bd)' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--s3)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                {isNowH && (
                  <div style={{ position:'absolute', left:56, right:0, top: `${(today.getMinutes()/60)*64}px`, height:2, background:'var(--or)', zIndex:2 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--or)', marginTop:-3, marginLeft:-4 }}/>
                  </div>
                )}
                {hEvs.map(ev => {
                  const cor = corEvento(ev)
                  const stCor = corStatus(ev)
                  const conflito = conflitantes.has(ev.id)
                  return (
                    <div key={ev.id} onClick={e => { e.stopPropagation(); onOpenEdit(ev) }}
                      onMouseDown={onDragStart ? e => { e.stopPropagation(); onDragStart(ev, e) } : undefined}
                      style={{
                        background:cor+'18', border:`1.5px solid ${cor}55`, borderLeft:`4px solid ${cor}`,
                        outline: conflito ? '1px dashed var(--red)' : 'none', outlineOffset:-1,
                        borderRadius:6, padding:'6px 10px', marginBottom:4, cursor:'pointer',
                        opacity: draggingId===ev.id ? 0.4 : 1,
                      }}>
                      <div style={{ fontSize:12, fontWeight:700, color:cor, display:'flex', alignItems:'center', gap:5 }}>
                        {conflito && <AlertTriangle size={11} color="var(--red)"/>}
                        {ev.titulo}
                      </div>
                      <div style={{ display:'flex', gap:10, marginTop:3, flexWrap:'wrap' }}>
                        {(ev.hr_inicio||ev.hr_fim) && (
                          <span style={{ fontSize:10, color:'var(--t3)', display:'flex', alignItems:'center', gap:3 }}>
                            <Clock size={10}/>{ev.hr_inicio?.slice(0,5)}{ev.hr_fim?` – ${ev.hr_fim.slice(0,5)}`:''}
                          </span>
                        )}
                        {ev.local && <span style={{ fontSize:10, color:'var(--t3)', display:'flex', alignItems:'center', gap:3 }}><MapPin size={10}/>{ev.local}</span>}
                        <span style={{ fontSize:9, fontWeight:700, color:stCor, border:`1px solid ${stCor}44`, borderRadius:4, padding:'1px 6px' }}>
                          {nomeStatus(ev)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
