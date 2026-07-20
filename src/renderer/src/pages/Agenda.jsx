import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, X, Bell, Clock, Trash2,
  Calendar, CalendarDays, List, AlignJustify, Search, MapPin,
  RefreshCw, Check,
} from 'lucide-react'
import '../App.css'

// ── Constantes ────────────────────────────────────────────────────────────────

const DIAS_SEMANA_LONGO = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
const DIAS_SEMANA_CURTO = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MESES_CURTO = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const RECORRENCIAS = [
  { value:'nenhuma', label:'Não repete' },
  { value:'diaria',  label:'Todo dia' },
  { value:'semanal', label:'Toda semana' },
  { value:'mensal',  label:'Todo mês' },
]

const MIN_OPTIONS = [
  { label:'5 minutos antes',  value:5 },
  { label:'15 minutos antes', value:15 },
  { label:'30 minutos antes', value:30 },
  { label:'1 hora antes',     value:60 },
  { label:'2 horas antes',    value:120 },
  { label:'1 dia antes',      value:1440 },
]

const COR_FALLBACK = '#6366F1'

const EMPTY_FORM = {
  titulo:'', categoria_id:'', status_id:'', cliente_id:'',
  dt_evento:'', hr_inicio:'', hr_fim:'', dia_todo:false,
  local:'', descricao:'', lembrete:false, min_lembrete:30, recorrencia:'nenhuma',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth()+1).padStart(2,'0')
  const d = String(date.getDate()).padStart(2,'0')
  return `${y}-${m}-${d}`
}

function fmtHora(t) { return t ? String(t).slice(0,5) : '' }

function dtToISO(val) {
  if (!val) return ''
  if (val instanceof Date) return val.toISOString().slice(0,10)
  return String(val).slice(0,10)
}

function buildGrid(year, month) {
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function getWeekDays(date) {
  const dow = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - dow)
  return Array.from({length:7}, (_,i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate()+i)
    return d
  })
}

function eventosDodia(events, isoDate) {
  return events.filter(e => dtToISO(e.dt_evento) === isoDate)
    .sort((a,b) => (a.hr_inicio||'99:99').localeCompare(b.hr_inicio||'99:99'))
}

function corEvento(ev, categorias) {
  const cat = categorias.find(c => String(c.id) === String(ev.categoria_id))
  return cat?.cor || COR_FALLBACK
}

function corStatus(ev, statuses) {
  const st = statuses.find(s => String(s.id) === String(ev.status_id))
  return st?.cor || '#94A3B8'
}

function nomeCategoria(ev, categorias) {
  return categorias.find(c => String(c.id) === String(ev.categoria_id))?.nome || ev.categoria || '—'
}

function nomeStatus(ev, statuses) {
  return statuses.find(s => String(s.id) === String(ev.status_id))?.nome || ev.status || '—'
}

function nomeCliente(ev, clientes) {
  return clientes.find(c => String(c.id) === String(ev.cliente_id))?.nome || '—'
}

// ── Chip de evento (usado no mensal e semanal) ────────────────────────────────

function EventoChip({ ev, cor, onClick, small }) {
  return (
    <div onClick={e => { e.stopPropagation(); onClick(ev) }}
      style={{
        background: cor+'22', borderLeft:`2.5px solid ${cor}`,
        borderRadius:'0 4px 4px 0', padding: small ? '1px 4px' : '2px 6px',
        fontSize: small ? 9 : 10, color: cor, marginBottom:2,
        overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis',
        cursor:'pointer', userSelect:'none',
        transition:'background .12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = cor+'44'}
      onMouseLeave={e => e.currentTarget.style.background = cor+'22'}
    >
      {ev.hr_inicio && !ev.dia_todo ? `${fmtHora(ev.hr_inicio)} ` : ''}{ev.titulo}
    </div>
  )
}

// ── VISUALIZAÇÃO MENSAL ───────────────────────────────────────────────────────

function ViewMensal({ year, month, today, events, categorias, statuses, selectedDay, onSelectDay, onOpenNew, onOpenEdit }) {
  const grid = buildGrid(year, month)
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
      {/* Cabeçalho dias semana */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid var(--bd)', flexShrink:0 }}>
        {DIAS_SEMANA_CURTO.map((d,i) => (
          <div key={d} style={{
            padding:'8px 0', textAlign:'center', fontSize:10, fontWeight:700, letterSpacing:.8,
            color: i===0||i===6 ? '#F87171' : 'var(--t3)',
            background: i===0||i===6 ? 'rgba(248,113,113,.04)' : 'transparent',
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
              style={{
                borderRight:'1px solid var(--bd)', borderBottom:'1px solid var(--bd)',
                padding:'5px 5px 3px', cursor:'pointer', minHeight:90,
                background: isSel ? 'rgba(255,107,43,.08)' : isWeekend ? 'rgba(248,113,113,.03)' : 'transparent',
                outline: isSel ? '2px solid var(--or)' : 'none', outlineOffset:'-2px',
              }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                <span style={{
                  fontSize:12, fontWeight: isToday ? 700 : 400,
                  color: isToday ? '#fff' : isWeekend ? '#F87171' : 'var(--t2)',
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
                <EventoChip key={ev.id} ev={ev} cor={corEvento(ev, categorias)} onClick={onOpenEdit} small/>
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

// ── VISUALIZAÇÃO SEMANAL ──────────────────────────────────────────────────────

function ViewSemanal({ weekDays, today, events, categorias, onOpenNew, onOpenEdit }) {
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
                      <EventoChip key={ev.id} ev={ev} cor={corEvento(ev,categorias)} onClick={onOpenEdit} small/>
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

// ── VISUALIZAÇÃO DIÁRIA ───────────────────────────────────────────────────────

function ViewDiaria({ date, today, events, categorias, statuses, clientes, onOpenNew, onOpenEdit }) {
  const iso = toISO(date)
  const dayEvs = eventosDodia(events, iso)
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
            const cor = corEvento(ev, categorias)
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
              <div onClick={() => onOpenNew(iso)} style={{ flex:1, padding:'3px 8px', cursor:'pointer', borderLeft:'1px solid var(--bd)' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--s3)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                {isNowH && (
                  <div style={{ position:'absolute', left:56, right:0, top: `${(today.getMinutes()/60)*64}px`, height:2, background:'var(--or)', zIndex:2 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--or)', marginTop:-3, marginLeft:-4 }}/>
                  </div>
                )}
                {hEvs.map(ev => {
                  const cor = corEvento(ev, categorias)
                  const stCor = corStatus(ev, statuses)
                  return (
                    <div key={ev.id} onClick={e => { e.stopPropagation(); onOpenEdit(ev) }}
                      style={{ background:cor+'18', border:`1.5px solid ${cor}55`, borderLeft:`4px solid ${cor}`, borderRadius:6, padding:'6px 10px', marginBottom:4, cursor:'pointer' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:cor }}>{ev.titulo}</div>
                      <div style={{ display:'flex', gap:10, marginTop:3, flexWrap:'wrap' }}>
                        {(ev.hr_inicio||ev.hr_fim) && (
                          <span style={{ fontSize:10, color:'var(--t3)', display:'flex', alignItems:'center', gap:3 }}>
                            <Clock size={10}/>{fmtHora(ev.hr_inicio)}{ev.hr_fim?` – ${fmtHora(ev.hr_fim)}`:''}
                          </span>
                        )}
                        {ev.local && <span style={{ fontSize:10, color:'var(--t3)', display:'flex', alignItems:'center', gap:3 }}><MapPin size={10}/>{ev.local}</span>}
                        <span style={{ fontSize:9, fontWeight:700, color:stCor, border:`1px solid ${stCor}44`, borderRadius:4, padding:'1px 6px' }}>
                          {nomeStatus(ev, statuses)}
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

// ── VISUALIZAÇÃO LISTA ────────────────────────────────────────────────────────

function ViewLista({ events, categorias, statuses, clientes, onOpenEdit, onOpenNew }) {
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
                {toISO(date)===toISO(today) && <span style={{ marginLeft:8, color:'var(--or)', fontSize:9 }}>HOJE</span>}
              </div>
              {grupos[iso].map(ev => {
                const cor = corEvento(ev, categorias)
                const stCor = corStatus(ev, statuses)
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
                            <Clock size={10}/>{fmtHora(ev.hr_inicio)}{ev.hr_fim?` – ${fmtHora(ev.hr_fim)}`:''}
                          </span>
                        )}
                        {ev.local && <span style={{ fontSize:10, color:'var(--t3)', display:'flex', alignItems:'center', gap:3 }}><MapPin size={10}/>{ev.local}</span>}
                        <span style={{ fontSize:10, color:cor }}>{nomeCategoria(ev,categorias)}</span>
                        {ev.cliente_id && <span style={{ fontSize:10, color:'var(--t3)' }}>{nomeCliente(ev,clientes)}</span>}
                      </div>
                    </div>
                    <span style={{ fontSize:9, fontWeight:700, color:stCor, border:`1px solid ${stCor}44`, borderRadius:4, padding:'2px 7px', whiteSpace:'nowrap', flexShrink:0 }}>
                      {nomeStatus(ev,statuses)}
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

// ── MODAL CRIAR / EDITAR ──────────────────────────────────────────────────────

function EventoModal({ modal, form, setForm, categorias, statuses, clientes, saving, onSave, onDelete, onClose }) {
  const isNew = modal === 'new'
  function set(k,v) { setForm(f=>({...f,[k]:v})) }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:600 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isNew ? 'Novo Evento' : 'Editar Evento'}</h2>
          <button className="modal-close" onClick={onClose}><X size={15}/></button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Título */}
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Título *</label>
            <input className="form-input" placeholder="Título do evento..." value={form.titulo} onChange={e=>set('titulo',e.target.value)} autoFocus/>
          </div>

          {/* Categoria + Status */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Categoria</label>
              <select className="form-select" value={form.categoria_id} onChange={e=>set('categoria_id',e.target.value)}>
                <option value="">— sem categoria —</option>
                {categorias.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status_id} onChange={e=>set('status_id',e.target.value)}>
                <option value="">— sem status —</option>
                {statuses.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
          </div>

          {/* Cliente */}
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Cliente</label>
            <select className="form-select" value={form.cliente_id} onChange={e=>set('cliente_id',e.target.value)}>
              <option value="">— sem cliente —</option>
              {clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          {/* Data + Horas + Dia todo */}
          <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap:12 }}>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Data</label>
              <input type="date" className="form-input" value={form.dt_evento} onChange={e=>set('dt_evento',e.target.value)}/>
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Início</label>
              <input type="time" className="form-input" value={form.hr_inicio} disabled={form.dia_todo} onChange={e=>set('hr_inicio',e.target.value)}/>
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Fim</label>
              <input type="time" className="form-input" value={form.hr_fim} disabled={form.dia_todo} onChange={e=>set('hr_fim',e.target.value)}/>
            </div>
          </div>

          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, cursor:'pointer', color:'var(--t2)', userSelect:'none' }}>
              <input type="checkbox" checked={form.dia_todo} onChange={e=>set('dia_todo',e.target.checked)} style={{ accentColor:'var(--or)' }}/>
              Dia todo
            </label>
            <div className="form-group" style={{ margin:0, minWidth:160 }}>
              <select className="form-select" value={form.recorrencia} onChange={e=>set('recorrencia',e.target.value)} style={{ height:28, fontSize:11 }}>
                {RECORRENCIAS.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          {/* Local */}
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Local</label>
            <input className="form-input" placeholder="Endereço, link ou local..." value={form.local} onChange={e=>set('local',e.target.value)}/>
          </div>

          {/* Descrição */}
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Descrição</label>
            <textarea className="form-textarea" rows={3} placeholder="Detalhes, pauta, observações..." value={form.descricao} onChange={e=>set('descricao',e.target.value)}/>
          </div>

          {/* Lembrete */}
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, cursor:'pointer', color:'var(--t2)', userSelect:'none' }}>
              <input type="checkbox" checked={form.lembrete} onChange={e=>set('lembrete',e.target.checked)} style={{ accentColor:'var(--or)' }}/>
              <Bell size={13}/> Lembrete
            </label>
            {form.lembrete && (
              <select className="form-select" style={{ width:'auto', height:28, fontSize:11 }} value={form.min_lembrete} onChange={e=>set('min_lembrete',Number(e.target.value))}>
                {MIN_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}
          </div>

        </div>
        <div className="modal-footer">
          {!isNew && <button className="btn btn-danger" onClick={onDelete} style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Trash2 size={13}/> Excluir</button>}
          <div style={{ flex:1 }}/>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving||!form.titulo.trim()}>
            {saving ? 'Salvando...' : isNew ? 'Criar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PAINEL DO DIA SELECIONADO (mensal) ───────────────────────────────────────

function PainelDia({ year, month, day, events, categorias, statuses, clientes, onOpenNew, onOpenEdit, onClose }) {
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
          const cor = corEvento(ev, categorias)
          const stCor = corStatus(ev, statuses)
          return (
            <div key={ev.id} onClick={()=>onOpenEdit(ev)}
              style={{ background:'var(--s2)', border:`1px solid var(--bd)`, borderLeft:`3px solid ${cor}`, borderRadius:7, padding:'8px 10px', cursor:'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--s3)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--s2)'}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--t1)', marginBottom:3 }}>{ev.titulo}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                {ev.hr_inicio && <span style={{ fontSize:10, color:'var(--t3)', display:'flex', alignItems:'center', gap:2 }}><Clock size={9}/>{fmtHora(ev.hr_inicio)}{ev.hr_fim?` – ${fmtHora(ev.hr_fim)}`:''}</span>}
                {ev.local && <span style={{ fontSize:10, color:'var(--t3)', display:'flex', alignItems:'center', gap:2 }}><MapPin size={9}/>{ev.local}</span>}
                <span style={{ fontSize:9, color:cor }}>{nomeCategoria(ev,categorias)}</span>
                {ev.cliente_id && <span style={{ fontSize:9, color:'var(--t3)' }}>{nomeCliente(ev,clientes)}</span>}
              </div>
              <div style={{ marginTop:4 }}>
                <span style={{ fontSize:9, fontWeight:700, color:stCor, border:`1px solid ${stCor}44`, borderRadius:4, padding:'1px 6px' }}>
                  {nomeStatus(ev,statuses)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────

export default function Agenda({ newTrigger }) {
  const today = new Date()
  const [view, setView]           = useState('mensal')   // mensal | semanal | diaria | lista
  const [year, setYear]           = useState(today.getFullYear())
  const [month, setMonth]         = useState(today.getMonth())
  const [currentDate, setCurrentDate] = useState(new Date(today))
  const [events, setEvents]       = useState([])
  const [categorias, setCategorias] = useState([])
  const [statuses, setStatuses]   = useState([])
  const [clientes, setClientes]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [modal, setModal]         = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const prevTrigger = useRef(0)

  const weekDays = getWeekDays(currentDate)

  // Carregar lookup tables uma vez
  useEffect(() => {
    loadLookups()
  }, [])

  // Carregar eventos quando muda mês/view
  useEffect(() => {
    loadEvents()
  }, [year, month, view, currentDate])

  useEffect(() => {
    if (newTrigger > prevTrigger.current) {
      prevTrigger.current = newTrigger
      openNew(toISO(today))
    }
  }, [newTrigger])

  async function loadLookups() {
    try {
      // Tenta carregar categorias e status das tabelas dinâmicas
      const [cats, sts, clts] = await Promise.allSettled([
        window.api.form.query('SELECT id, nome, cor FROM agenda_categorias WHERE ativo IS DISTINCT FROM false ORDER BY nome'),
        window.api.form.query('SELECT id, nome, cor FROM agenda_status ORDER BY ordem, nome'),
        window.api.form.query('SELECT id, nome FROM entidade_001 WHERE ativo IS DISTINCT FROM false ORDER BY nome LIMIT 500'),
      ])
      if (cats.status==='fulfilled') setCategorias(cats.value||[])
      if (sts.status==='fulfilled')  setStatuses(sts.value||[])
      if (clts.status==='fulfilled') setClientes(clts.value||[])
    } catch {}
  }

  async function loadEvents() {
    setLoading(true)
    try {
      let mes, ano
      if (view==='semanal') {
        mes = weekDays[0].getMonth()+1
        ano = weekDays[0].getFullYear()
      } else if (view==='diaria') {
        mes = currentDate.getMonth()+1
        ano = currentDate.getFullYear()
      } else {
        mes = month+1
        ano = year
      }
      const data = await window.api.agenda.getByMonth({ mes, ano })
      setEvents(data||[])
    } catch { setEvents([]) }
    finally { setLoading(false) }
  }

  function navPrev() {
    if (view==='mensal') {
      if (month===0) { setMonth(11); setYear(y=>y-1) } else setMonth(m=>m-1)
      setSelectedDay(null)
    } else if (view==='semanal') {
      const d = new Date(currentDate); d.setDate(d.getDate()-7); setCurrentDate(d)
    } else if (view==='diaria') {
      const d = new Date(currentDate); d.setDate(d.getDate()-1); setCurrentDate(d)
    } else {
      if (month===0) { setMonth(11); setYear(y=>y-1) } else setMonth(m=>m-1)
    }
  }

  function navNext() {
    if (view==='mensal') {
      if (month===11) { setMonth(0); setYear(y=>y+1) } else setMonth(m=>m+1)
      setSelectedDay(null)
    } else if (view==='semanal') {
      const d = new Date(currentDate); d.setDate(d.getDate()+7); setCurrentDate(d)
    } else if (view==='diaria') {
      const d = new Date(currentDate); d.setDate(d.getDate()+1); setCurrentDate(d)
    } else {
      if (month===11) { setMonth(0); setYear(y=>y+1) } else setMonth(m=>m+1)
    }
  }

  function goToday() {
    setYear(today.getFullYear()); setMonth(today.getMonth())
    setCurrentDate(new Date(today)); setSelectedDay(today.getDate())
  }

  function getNavLabel() {
    if (view==='mensal') return `${MESES[month]} ${year}`
    if (view==='semanal') {
      const ini = weekDays[0], fim = weekDays[6]
      if (ini.getMonth()===fim.getMonth()) return `${ini.getDate()} – ${fim.getDate()} ${MESES[fim.getMonth()]} ${fim.getFullYear()}`
      return `${ini.getDate()} ${MESES_CURTO[ini.getMonth()]} – ${fim.getDate()} ${MESES_CURTO[fim.getMonth()]} ${fim.getFullYear()}`
    }
    if (view==='diaria') return `${DIAS_SEMANA_LONGO[currentDate.getDay()]}, ${currentDate.getDate()} de ${MESES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    return `${MESES[month]} ${year}`
  }

  function openNew(dt) {
    setForm({...EMPTY_FORM, dt_evento: dt||''})
    setModal('new')
  }

  function openEdit(ev) {
    setForm({
      titulo:       ev.titulo||'',
      categoria_id: ev.categoria_id ? String(ev.categoria_id) : '',
      status_id:    ev.status_id    ? String(ev.status_id)    : '',
      cliente_id:   ev.cliente_id   ? String(ev.cliente_id)   : '',
      dt_evento:    dtToISO(ev.dt_evento),
      hr_inicio:    fmtHora(ev.hr_inicio),
      hr_fim:       fmtHora(ev.hr_fim),
      dia_todo:     ev.dia_todo||false,
      local:        ev.local||'',
      descricao:    ev.descricao||'',
      lembrete:     ev.lembrete||false,
      min_lembrete: ev.min_lembrete??30,
      recorrencia:  ev.recorrencia||'nenhuma',
    })
    setModal(ev)
  }

  async function handleSave() {
    if (!form.titulo.trim()) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        categoria_id: form.categoria_id||null,
        status_id:    form.status_id||null,
        cliente_id:   form.cliente_id||null,
        hr_inicio:    form.hr_inicio||null,
        hr_fim:       form.hr_fim||null,
      }
      if (modal==='new') await window.api.agenda.create(payload)
      else await window.api.agenda.update({id:modal.id, ...payload})
      setModal(null)
      await loadEvents()
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!modal?.id) return
    await window.api.agenda.delete(modal.id)
    setModal(null)
    await loadEvents()
  }

  const VIEWS = [
    { id:'mensal',  icon:<Calendar size={14}/>,     label:'Mês' },
    { id:'semanal', icon:<CalendarDays size={14}/>,  label:'Semana' },
    { id:'diaria',  icon:<AlignJustify size={14}/>,  label:'Dia' },
    { id:'lista',   icon:<List size={14}/>,           label:'Lista' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0 }}>

      {/* ── Toolbar ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, flexShrink:0, flexWrap:'wrap' }}>
        {/* Nav */}
        <button onClick={navPrev} style={NAV_BTN}><ChevronLeft size={15} strokeWidth={2}/></button>
        <button onClick={navNext} style={NAV_BTN}><ChevronRight size={15} strokeWidth={2}/></button>
        <button onClick={goToday} style={{ ...NAV_BTN, padding:'0 12px', fontSize:11, width:'auto' }}>Hoje</button>

        {/* Label */}
        <span style={{ fontSize:15, fontWeight:700, color:'var(--t1)', minWidth:240 }}>
          {getNavLabel()}
          {loading && <RefreshCw size={12} style={{ marginLeft:8, animation:'spin 1s linear infinite', color:'var(--t3)', display:'inline' }}/>}
        </span>

        <div style={{ flex:1 }}/>

        {/* Seletor de view */}
        <div style={{ display:'flex', background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:8, overflow:'hidden' }}>
          {VIEWS.map(v => (
            <button key={v.id} onClick={()=>setView(v.id)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', border:'none', cursor:'pointer', fontSize:11, fontWeight: view===v.id?700:400,
                background: view===v.id?'var(--or)':'transparent', color: view===v.id?'#fff':'var(--t2)', transition:'all .15s' }}>
              {v.icon}{v.label}
            </button>
          ))}
        </div>

        {/* Novo evento */}
        <button className="btn btn-primary" style={{ height:32, fontSize:11 }}
          onClick={()=>openNew(view==='diaria'?toISO(currentDate):toISO(today))}>
          <Plus size={13}/> Novo evento
        </button>
      </div>

      {/* ── Conteúdo ── */}
      <div style={{ flex:1, display:'flex', minHeight:0, border:'1px solid var(--bd)', borderRadius:10, overflow:'hidden', background:'var(--s1)' }}>

        {view==='mensal' && (
          <>
            <ViewMensal
              year={year} month={month} today={today} events={events}
              categorias={categorias} statuses={statuses}
              selectedDay={selectedDay}
              onSelectDay={day => setSelectedDay(d => d===day?null:day)}
              onOpenNew={openNew} onOpenEdit={openEdit}
            />
            {selectedDay && (
              <PainelDia
                year={year} month={month} day={selectedDay}
                events={events} categorias={categorias} statuses={statuses} clientes={clientes}
                onOpenNew={openNew} onOpenEdit={openEdit}
                onClose={()=>setSelectedDay(null)}
              />
            )}
          </>
        )}

        {view==='semanal' && (
          <ViewSemanal
            weekDays={weekDays} today={today} events={events}
            categorias={categorias}
            onOpenNew={openNew} onOpenEdit={openEdit}
          />
        )}

        {view==='diaria' && (
          <ViewDiaria
            date={currentDate} today={today} events={events}
            categorias={categorias} statuses={statuses} clientes={clientes}
            onOpenNew={openNew} onOpenEdit={openEdit}
          />
        )}

        {view==='lista' && (
          <ViewLista
            events={events} categorias={categorias} statuses={statuses} clientes={clientes}
            onOpenNew={openNew} onOpenEdit={openEdit}
          />
        )}
      </div>

      {/* ── Modal ── */}
      {modal && (
        <EventoModal
          modal={modal} form={form} setForm={setForm}
          categorias={categorias} statuses={statuses} clientes={clientes}
          saving={saving} onSave={handleSave} onDelete={handleDelete} onClose={()=>setModal(null)}
        />
      )}
    </div>
  )
}

const NAV_BTN = {
  background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:6,
  color:'var(--t2)', cursor:'pointer', width:30, height:30,
  display:'flex', alignItems:'center', justifyContent:'center', padding:0,
}
