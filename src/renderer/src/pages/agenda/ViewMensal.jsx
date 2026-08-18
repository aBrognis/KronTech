import { Plus } from 'lucide-react'
import EventoChip from './EventBadge'
import { DIAS_SEMANA_CURTO, buildGrid, eventosDodia } from './utils'

export default function ViewMensal({ year, month, today, events, selectedDay, onSelectDay, onOpenNew, onOpenEdit, onDragStart }) {
  const grid = buildGrid(year, month)
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
      {/* Cabeçalho dias semana */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid var(--bd)', flexShrink:0 }}>
        {DIAS_SEMANA_CURTO.map((d,i) => (
          <div key={d} style={{
            padding:'8px 0', textAlign:'center', fontSize:10, fontWeight:700, letterSpacing:.8,
            color: i===0||i===6 ? 'var(--cal-weekend-color)' : 'var(--t3)',
            background: i===0||i===6 ? 'var(--cal-weekend-head-bg)' : 'transparent',
          }}>{d}</div>
        ))}
      </div>
      {/* Grade */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(7,1fr)', gridAutoRows:'1fr', minHeight:0, overflow:'auto' }}>
        {grid.map((day, idx) => {
          if (!day) return (
            <div key={idx} style={{ borderRight:'1px solid var(--bd)', borderBottom:'1px solid var(--bd)', background:'var(--s2)', opacity:.4 }}/>
          )
          const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const isToday = day===today.getDate() && month===today.getMonth() && year===today.getFullYear()
          const isSel   = day===selectedDay
          const dow     = new Date(year,month,day).getDay()
          const isWeekend = dow===0||dow===6
          const dayEvs  = eventosDodia(events, iso)
          return (
            <div key={idx} onClick={() => onSelectDay(day)}
              data-agenda-slot={iso}
              style={{
                borderRight:'1px solid var(--bd)', borderBottom:'1px solid var(--bd)',
                padding:'5px 5px 3px', cursor:'pointer', minHeight:90,
                background: isSel ? 'var(--or3)' : isWeekend ? 'var(--cal-weekend-bg)' : 'transparent',
                outline: isSel ? '2px solid var(--or)' : 'none', outlineOffset:'-2px',
              }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                <span style={{
                  fontSize:12, fontWeight: isToday ? 700 : 400,
                  color: isToday ? '#fff' : isWeekend ? 'var(--cal-weekend-color)' : 'var(--t2)',
                  background: isToday ? 'var(--or)' : 'transparent',
                  borderRadius:'50%', width:22, height:22,
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                }}>{day}</span>
                {isSel && (
                  <span onClick={e => { e.stopPropagation(); onOpenNew(iso) }}
                    style={{ color:'var(--or)', cursor:'pointer', display:'flex', padding:2, borderRadius:4 }}
                    title="Novo evento">
                    <Plus size={13} strokeWidth={2.5}/>
                  </span>
                )}
              </div>
              {dayEvs.slice(0,3).map(ev => (
                <EventoChip key={ev.id} ev={ev} onClick={onOpenEdit} small onMouseDown={onDragStart}/>
              ))}
              {dayEvs.length>3 && (
                <div style={{ fontSize:9, color:'var(--t3)', paddingLeft:4 }}>+{dayEvs.length-3} mais</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
