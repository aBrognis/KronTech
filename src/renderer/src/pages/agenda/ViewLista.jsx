import { useState } from 'react'
import { Plus, Search, Clock, MapPin } from 'lucide-react'
import { DIAS_SEMANA_LONGO, MESES, toISO, dtToISO, corEvento, corStatus, nomeCategoria, nomeStatus, nomeCliente } from './utils'

export default function ViewLista({ events, onOpenEdit, onOpenNew }) {
  const [busca, setBusca] = useState('')
  const today = new Date()

  const filtered = events
    .filter(e => !busca || e.titulo.toLowerCase().includes(busca.toLowerCase()))
    .sort((a,b) => dtToISO(a.dt_evento).localeCompare(dtToISO(b.dt_evento)) || (a.hr_inicio||'').localeCompare(b.hr_inicio||''))

  // Agrupar por data
  const grupos = {}
  filtered.forEach(ev => {
    const iso = dtToISO(ev.dt_evento) || 'sem-data'
    if (!grupos[iso]) grupos[iso] = []
    grupos[iso].push(ev)
  })

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
      <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--bd)', flexShrink:0, display:'flex', gap:10, alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:8, padding:'0 10px', flex:1, height:32 }}>
          <Search size={12} color="var(--t3)"/>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar eventos..."
            style={{ border:'none', background:'transparent', outline:'none', fontSize:12, color:'var(--t1)', width:'100%' }}/>
        </div>
        <button className="btn btn-primary" style={{ height:32, fontSize:11 }} onClick={() => onOpenNew(toISO(today))}>
          <Plus size={13}/> Novo
        </button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
        {Object.keys(grupos).sort().map(iso => {
          const date = iso==='sem-data' ? null : new Date(iso+'T12:00:00')
          const isPast = date && date < today && toISO(date)!==toISO(today)
          return (
            <div key={iso}>
              <div style={{ padding:'6px 16px 4px', fontSize:10, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:.8, position:'sticky', top:0, background:'var(--s1)', zIndex:1 }}>
                {date ? `${DIAS_SEMANA_LONGO[date.getDay()]}, ${date.getDate()} de ${MESES[date.getMonth()]} ${date.getFullYear()}` : 'Sem data'}
                {date && toISO(date)===toISO(today) && <span style={{ marginLeft:8, color:'var(--or)', fontSize:9 }}>HOJE</span>}
              </div>
              {grupos[iso].map(ev => {
                const cor = corEvento(ev)
                const stCor = corStatus(ev)
                return (
                  <div key={ev.id} onClick={()=>onOpenEdit(ev)}
                    style={{ margin:'2px 12px', padding:'10px 12px', borderRadius:8, cursor:'pointer', display:'flex', gap:12, alignItems:'flex-start', opacity: isPast?.6:1, background:'var(--s2)', border:'1px solid var(--bd)', borderLeft:`4px solid ${cor}`, marginBottom:4 }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--s3)'}
                    onMouseLeave={e=>e.currentTarget.style.background='var(--s2)'}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'var(--t1)', marginBottom:3 }}>{ev.titulo}</div>
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                        {(ev.hr_inicio||ev.hr_fim) && (
                          <span style={{ fontSize:10, color:'var(--t3)', display:'flex', alignItems:'center', gap:3 }}>
                            <Clock size={10}/>{ev.hr_inicio?.slice(0,5)}{ev.hr_fim?` às ${ev.hr_fim.slice(0,5)}`:''}
                          </span>
                        )}
                        {ev.local && <span style={{ fontSize:10, color:'var(--t3)', display:'flex', alignItems:'center', gap:3 }}><MapPin size={10}/>{ev.local}</span>}
                        <span style={{ fontSize:10, color:cor }}>{nomeCategoria(ev)}</span>
                        {ev.cliente_id && <span style={{ fontSize:10, color:'var(--t3)' }}>{nomeCliente(ev)}</span>}
                      </div>
                    </div>
                    <span style={{ fontSize:9, fontWeight:700, color:stCor, border:`1px solid ${stCor}44`, borderRadius:4, padding:'2px 7px', whiteSpace:'nowrap', flexShrink:0 }}>
                      {nomeStatus(ev)}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })}
        {filtered.length===0 && (
          <div style={{ padding:40, textAlign:'center', color:'var(--t3)', fontSize:13 }}>
            {busca ? 'Nenhum evento encontrado.' : 'Nenhum evento neste período.'}
          </div>
        )}
      </div>
    </div>
  )
}
