import { useRef, useEffect } from 'react'
import EventoChip from './EventBadge'
import { DIAS_SEMANA_CURTO, toISO, eventosDodia } from './utils'

export default function ViewSemanal({ weekDays, today, events, onOpenNew, onOpenEdit }) {
  const HORAS = Array.from({length:24},(_,i)=>i)
  const scrollRef = useRef(null)
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * 48
  }, [])

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
      {/* Grade horária */}
      <div ref={scrollRef} style={{ flex:1, overflowY:'auto', position:'relative' }}>
        <div style={{ display:'grid', gridTemplateColumns:'52px repeat(7,1fr)' }}>
          {HORAS.map(h => (
            <>
              <div key={`h${h}`} style={{ height:48, borderBottom:'1px solid var(--bd)', padding:'2px 6px 0 0', textAlign:'right', fontSize:9, color:'var(--t3)', flexShrink:0, position:'relative', top:-7 }}>
                {h===0?'':String(h).padStart(2,'0')+':00'}
              </div>
              {weekDays.map((d,di) => {
                const iso = toISO(d)
                const isToday = iso === toISO(today)
                const dayEvs = eventosDodia(events, iso).filter(e => {
                  if (!e.hr_inicio) return false
                  const evH = parseInt(e.hr_inicio.slice(0,2))
                  return evH === h
                })
                return (
                  <div key={`${h}-${di}`} onClick={() => onOpenNew(iso)}
                    style={{
                      height:48, borderLeft:'1px solid var(--bd)', borderBottom:'1px solid var(--bd)',
                      padding:'1px 2px', cursor:'pointer', position:'relative',
                      background: isToday ? 'rgba(255,107,43,.03)' : 'transparent',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--s3)'}
                    onMouseLeave={e => e.currentTarget.style.background=isToday?'rgba(255,107,43,.03)':'transparent'}
                  >
                    {dayEvs.map(ev => (
                      <EventoChip key={ev.id} ev={ev} onClick={onOpenEdit} small/>
                    ))}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}
