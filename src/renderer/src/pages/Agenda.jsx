import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Bell, Clock, Trash2 } from 'lucide-react'
import '../App.css'

// ── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIAS = ['Tarefa', 'Reunião/Visita', 'Prazo de Projeto', 'Treinamento', 'Outro']
const STATUS_OPT = ['Pendente', 'Concluído', 'Cancelado']
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const MIN_OPTIONS = [
  { label: '15 minutos antes', value: 15 },
  { label: '30 minutos antes', value: 30 },
  { label: '1 hora antes',     value: 60 },
  { label: '2 horas antes',    value: 120 },
  { label: '1 dia antes',      value: 1440 },
]

const CAT_COR = {
  'Tarefa':           '#60A5FA',
  'Reunião/Visita':   '#FF6B2B',
  'Prazo de Projeto': '#F87171',
  'Treinamento':      '#4ADE80',
  'Outro':            '#888888',
}

const STATUS_COR = {
  'Pendente':  '#FBD24C',
  'Concluído': '#4ADE80',
  'Cancelado': '#888888',
}

const EMPTY_FORM = {
  titulo: '', categoria: 'Tarefa', dt_evento: '', hr_inicio: '', hr_fim: '',
  descricao: '', status: 'Pendente', lembrete: false, min_lembrete: 30,
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fmtHora(t) {
  if (!t) return ''
  return String(t).slice(0, 5)
}

function buildGrid(year, month) {
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function dtToISO(val) {
  if (!val) return ''
  if (val instanceof Date) return val.toISOString().slice(0, 10)
  return String(val).slice(0, 10)
}

function eventsByDay(events, year, month, day) {
  const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return events.filter(e => dtToISO(e.dt_evento) === iso)
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function Agenda({ newTrigger }) {
  const today = new Date()
  const [year, setYear]         = useState(today.getFullYear())
  const [month, setMonth]       = useState(today.getMonth())
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [modal, setModal]       = useState(null)   // null | 'new' | evento
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const prevTrigger = useRef(0)

  useEffect(() => { loadMonth() }, [year, month])

  useEffect(() => {
    if (newTrigger > prevTrigger.current) {
      prevTrigger.current = newTrigger
      openNew(toISO(new Date()))
    }
  }, [newTrigger])

  async function loadMonth() {
    setLoading(true)
    try {
      const data = await window.api.agenda.getByMonth({ mes: month + 1, ano: year })
      setEvents(data)
    } finally {
      setLoading(false)
    }
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  function goToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
    setSelectedDay(today.getDate())
  }

  function openNew(dt) {
    setForm({ ...EMPTY_FORM, dt_evento: dt || '' })
    setModal('new')
  }

  function openEdit(ev) {
    setForm({
      titulo:       ev.titulo,
      categoria:    ev.categoria || 'Tarefa',
      dt_evento:    dtToISO(ev.dt_evento),
      hr_inicio:    fmtHora(ev.hr_inicio),
      hr_fim:       fmtHora(ev.hr_fim),
      descricao:    ev.descricao || '',
      status:       ev.status || 'Pendente',
      lembrete:     ev.lembrete || false,
      min_lembrete: ev.min_lembrete ?? 30,
    })
    setModal(ev)
  }

  function closeModal() { setModal(null) }

  async function handleSave() {
    if (!form.titulo.trim()) return
    setSaving(true)
    try {
      const payload = { ...form }
      if (modal === 'new') {
        await window.api.agenda.create(payload)
      } else {
        await window.api.agenda.update({ id: modal.id, ...payload })
      }
      closeModal()
      await loadMonth()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!modal?.id) return
    await window.api.agenda.delete(modal.id)
    closeModal()
    await loadMonth()
  }

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  // ── Dados do dia selecionado ──
  const selEvents  = selectedDay ? eventsByDay(events, year, month, selectedDay) : []
  const selDateStr = selectedDay
    ? new Date(year, month, selectedDay).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    : ''

  const grid = buildGrid(year, month)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Cabeçalho do calendário ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={prevMonth} style={navBtn}><ChevronLeft size={16} strokeWidth={2} /></button>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', minWidth: 180, textAlign: 'center' }}>
          {MESES[month]} {year}
        </span>
        <button onClick={nextMonth} style={navBtn}><ChevronRight size={16} strokeWidth={2} /></button>
        <button onClick={goToday} style={{ ...navBtn, padding: '4px 12px', fontSize: 11 }}>Hoje</button>
        <div style={{ flex: 1 }} />
        {loading && <span style={{ fontSize: 10, color: 'var(--t3)' }}>Carregando...</span>}
      </div>

      {/* ── Grade do calendário ── */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden' }}>
        {/* Dias da semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--bd)' }}>
          {DIAS_SEMANA.map((d, i) => (
            <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 10, fontWeight: 700, color: i === 0 || i === 6 ? 'var(--cal-weekend-color)' : 'var(--t3)', letterSpacing: 1, background: i === 0 || i === 6 ? 'var(--cal-weekend-head-bg)' : 'transparent' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Células dos dias */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {grid.map((day, idx) => {
            if (!day) return <div key={idx} style={{ minHeight: 90, borderRight: '1px solid var(--bd)', borderBottom: '1px solid var(--bd)', background: 'var(--cal-empty-bg)' }} />

            const isToday   = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const isSel     = day === selectedDay
            const dayEvents = eventsByDay(events, year, month, day)
            const dow       = (new Date(year, month, day).getDay())
            const isWeekend = dow === 0 || dow === 6

            return (
              <div
                key={idx}
                onClick={() => setSelectedDay(day)}
                style={{
                  minHeight: 90,
                  borderRight: '1px solid var(--bd)',
                  borderBottom: '1px solid var(--bd)',
                  padding: '6px 6px 4px',
                  cursor: 'pointer',
                  background: isSel ? 'var(--or4)' : isWeekend ? 'var(--cal-weekend-bg)' : 'transparent',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--s3)' }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isWeekend ? 'var(--cal-weekend-bg)' : 'transparent' }}
              >
                {/* Número do dia */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{
                    fontSize: 12, fontWeight: isToday ? 700 : 400,
                    color: isToday ? '#fff' : isWeekend ? 'var(--cal-weekend-color)' : 'var(--t2)',
                    background: isToday ? '#FF6B2B' : 'transparent',
                    borderRadius: '50%', width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {day}
                  </span>
                  {isSel && (
                    <span
                      onClick={e => { e.stopPropagation(); openNew(toISO(new Date(year, month, day))) }}
                      style={{ display: 'flex', color: 'var(--or)', cursor: 'pointer' }}
                      title="Novo compromisso"
                    ><Plus size={14} strokeWidth={2.5} /></span>
                  )}
                </div>

                {/* Chips de eventos */}
                {dayEvents.slice(0, 3).map(ev => (
                  <div
                    key={ev.id}
                    onClick={e => { e.stopPropagation(); openEdit(ev) }}
                    style={{
                      background: CAT_COR[ev.categoria] + '22',
                      borderLeft: `2px solid ${CAT_COR[ev.categoria] || '#888'}`,
                      borderRadius: '0 3px 3px 0',
                      padding: '1px 4px',
                      fontSize: 9,
                      color: CAT_COR[ev.categoria] || '#888',
                      marginBottom: 2,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      cursor: 'pointer',
                      opacity: ev.status === 'Cancelado' ? .45 : 1,
                      textDecoration: ev.status === 'Concluído' ? 'line-through' : 'none',
                    }}
                  >
                    {ev.hr_inicio ? `${fmtHora(ev.hr_inicio)} ` : ''}{ev.titulo}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: 9, color: 'var(--t3)', paddingLeft: 4 }}>+{dayEvents.length - 3} mais</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Painel do dia selecionado ── */}
      {selectedDay && (
        <div style={{ marginTop: 16, background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--bd)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', textTransform: 'capitalize' }}>{selDateStr}</span>
            <button
              className="btn btn-primary"
              style={{ fontSize: 10, padding: '4px 12px' }}
              onClick={() => openNew(toISO(new Date(year, month, selectedDay)))}
            >
              + Novo compromisso
            </button>
          </div>

          {selEvents.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>
              Nenhum compromisso neste dia.
            </div>
          ) : (
            <div>
              {selEvents.map(ev => (
                <div
                  key={ev.id}
                  onClick={() => openEdit(ev)}
                  className="sect sol-card"
                  style={{ margin: '8px 12px', cursor: 'pointer', borderLeft: `3px solid ${CAT_COR[ev.categoria] || '#888'}` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t1)', textDecoration: ev.status === 'Concluído' ? 'line-through' : 'none', opacity: ev.status === 'Cancelado' ? .5 : 1 }}>
                          {ev.titulo}
                        </span>
                        {ev.lembrete && <Bell size={11} color="var(--yellow)" title="Lembrete ativo" />}
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 9, color: CAT_COR[ev.categoria] || '#888', fontWeight: 600 }}>{ev.categoria}</span>
                        {(ev.hr_inicio || ev.hr_fim) && (
                          <span style={{ fontSize: 9, color: 'var(--t3)' }}>
                            <Clock size={10} style={{ display: 'inline', marginRight: 2 }} /> {fmtHora(ev.hr_inicio)}{ev.hr_fim ? ` – ${fmtHora(ev.hr_fim)}` : ''}
                          </span>
                        )}
                        {ev.descricao && <span style={{ fontSize: 9, color: 'var(--t3)', maxWidth: 300, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{ev.descricao}</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: 9, color: STATUS_COR[ev.status] || '#888', fontWeight: 700, border: `1px solid ${STATUS_COR[ev.status] || '#888'}33`, borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap' }}>
                      {ev.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal criar / editar ── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{modal === 'new' ? 'Novo Compromisso' : 'Editar Compromisso'}</h2>
              <button className="modal-close" onClick={closeModal}><X size={15} strokeWidth={2} /></button>
            </div>

            <div className="modal-body">
              {/* Título */}
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input className="form-input" placeholder="Descreva o compromisso..." value={form.titulo} onChange={e => setField('titulo', e.target.value)} />
              </div>

              {/* Categoria + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Categoria</label>
                  <select className="form-select" value={form.categoria} onChange={e => setField('categoria', e.target.value)}>
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}>
                    {STATUS_OPT.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Data + Horas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Data</label>
                  <input type="date" className="form-input" value={form.dt_evento} onChange={e => setField('dt_evento', e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Início</label>
                  <input type="time" className="form-input" value={form.hr_inicio} onChange={e => setField('hr_inicio', e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Fim</label>
                  <input type="time" className="form-input" value={form.hr_fim} onChange={e => setField('hr_fim', e.target.value)} />
                </div>
              </div>

              {/* Descrição */}
              <div className="form-group">
                <label className="form-label">Descrição / Observações</label>
                <textarea className="form-textarea" rows={3} placeholder="Detalhes, local, pauta..." value={form.descricao} onChange={e => setField('descricao', e.target.value)} />
              </div>

              {/* Lembrete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <label className="fav-check">
                  <input type="checkbox" checked={form.lembrete} onChange={e => setField('lembrete', e.target.checked)} />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Bell size={13} /> Ativar lembrete</span>
                </label>
                {form.lembrete && (
                  <select className="form-select" style={{ width: 'auto' }} value={form.min_lembrete} onChange={e => setField('min_lembrete', Number(e.target.value))}>
                    {MIN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {modal !== 'new' && <button className="btn btn-danger" onClick={handleDelete} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Trash2 size={13} /> Excluir</button>}
              <div style={{ flex: 1 }} />
              <button className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.titulo.trim()}>
                {saving ? 'Salvando...' : modal === 'new' ? 'Criar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const navBtn = {
  background: 'var(--s2)',
  border: '1px solid var(--bd)',
  borderRadius: 6,
  color: 'var(--t2)',
  cursor: 'pointer',
  fontSize: 18,
  width: 30,
  height: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}
