import { Plus, X, Clock, MapPin, Clock3 } from 'lucide-react'
import { DIAS_SEMANA_LONGO, MESES_CURTO, eventosDodia, corEvento, corStatus, corStatusAuto, nomeCategoria, nomeStatus, nomeCliente } from './utils'

export default function PainelDia({ year, month, day, events, onOpenNew, onOpenEdit, onClose }) {
  const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  const date = new Date(year, month, day)
  const dayEvs = eventosDodia(events, iso)

  return (
    <div style={{ width:280, flexShrink:0, borderLeft:'1px solid var(--bd)', display:'flex', flexDirection:'column', background:'var(--s1)' }}>
      <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--bd)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:10, color:'var(--t3)', fontWeight:600, textTransform:'uppercase', letterSpacing:.6 }}>{DIAS_SEMANA_LONGO[date.getDay()]}</div>
          <div style={{ fontSize:18, fontWeight:700, color:'var(--t1)' }}>{day} <span style={{ fontSize:12, color:'var(--t3)' }}>{MESES_CURTO[month]}</span></div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button className="btn btn-primary" style={{ height:28, fontSize:10, padding:'0 10px' }} onClick={()=>onOpenNew(iso)}>
            <Plus size={11}/> Novo
          </button>
          <button className="btn btn-ghost" style={{ height:28, width:28, padding:0, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
            <X size={13}/>
          </button>
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'8px 10px', display:'flex', flexDirection:'column', gap:6 }}>
        {dayEvs.length===0 ? (
          <div style={{ fontSize:11, color:'var(--t3)', textAlign:'center', padding:20, fontStyle:'italic' }}>Nenhum evento.</div>
        ) : dayEvs.map(ev => {
          const cor = corEvento(ev)
          const stCor = corStatus(ev)
          const corAuto = corStatusAuto(ev)
          const atrasado = ev.status_auto === 'atrasado'
          return (
            <div key={ev.id} onClick={()=>onOpenEdit(ev)}
              style={{
                background:'var(--s2)', border:`1px solid var(--bd)`, borderLeft:`3px solid ${cor}`,
                outline: corAuto ? `2px ${atrasado?'dashed':'solid'} ${corAuto}` : 'none', outlineOffset:-1,
                borderRadius:7, padding:'8px 10px', cursor:'pointer',
              }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--s3)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--s2)'}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--t1)', marginBottom:3, display:'flex', alignItems:'center', gap:5 }}>
                {corAuto && <Clock3 size={11} color={corAuto} style={{ flexShrink:0 }}/>}
                {ev.titulo}
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                {ev.hr_inicio && <span style={{ fontSize:10, color:'var(--t3)', display:'flex', alignItems:'center', gap:2 }}><Clock size={9}/>{ev.hr_inicio.slice(0,5)}{ev.hr_fim?` – ${ev.hr_fim.slice(0,5)}`:''}</span>}
                {ev.local && <span style={{ fontSize:10, color:'var(--t3)', display:'flex', alignItems:'center', gap:2 }}><MapPin size={9}/>{ev.local}</span>}
                <span style={{ fontSize:9, color:cor }}>{nomeCategoria(ev)}</span>
                {ev.cliente_id && <span style={{ fontSize:9, color:'var(--t3)' }}>{nomeCliente(ev)}</span>}
              </div>
              <div style={{ marginTop:4 }}>
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
}
