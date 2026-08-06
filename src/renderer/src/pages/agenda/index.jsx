import { useState, useEffect, useRef } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, Calendar, CalendarDays, List, AlignJustify,
  RefreshCw, Settings2,
} from 'lucide-react'
import '../../App.css'
import ViewMensal from './ViewMensal'
import ViewSemanal from './ViewSemanal'
import ViewDiaria from './ViewDiaria'
import ViewLista from './ViewLista'
import EventoModal from './EventoModal'
import PainelDia from './PainelDia'
import GerenciarCategoriasModal from './GerenciarCategoriasModal'
import ConfirmModal from './ConfirmModal'
import { EMPTY_FORM, MESES, MESES_CURTO, DIAS_SEMANA_LONGO, toISO, dtToISO, fmtHora, getWeekDays } from './utils'

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
  const [lookupErro, setLookupErro] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [modal, setModal]         = useState(null)
  const [gerenciarAberto, setGerenciarAberto] = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [erro, setErro]           = useState(null)
  const [confirmState, setConfirmState] = useState(null)
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
    setLookupErro(null)
    try {
      const [cats, sts, clts] = await Promise.allSettled([
        window.api.agenda.listarCategorias(),
        window.api.agenda.listarStatus(),
        window.api.form.query('SELECT id, nome FROM entidade_001 WHERE ativo IS DISTINCT FROM false ORDER BY nome LIMIT 500'),
      ])
      if (cats.status==='fulfilled' && cats.value.ok) setCategorias(cats.value.data||[])
      else setLookupErro('Não foi possível carregar categorias/status.')
      if (sts.status==='fulfilled'  && sts.value.ok)  setStatuses(sts.value.data||[])
      else setLookupErro('Não foi possível carregar categorias/status.')
      if (clts.status==='fulfilled' && clts.value.ok) setClientes(clts.value.data||[])
    } catch {
      setLookupErro('Não foi possível carregar categorias/status.')
    }
  }

  async function loadEvents() {
    setLoading(true)
    try {
      let res
      if (view==='semanal') {
        res = await window.api.agenda.getByRange({ inicio: toISO(weekDays[0]), fim: toISO(weekDays[6]) })
      } else if (view==='diaria') {
        const iso = toISO(currentDate)
        res = await window.api.agenda.getByRange({ inicio: iso, fim: iso })
      } else if (view==='lista') {
        const ini = new Date(year, month, 1)
        const fim = new Date(year, month+7, 0)
        res = await window.api.agenda.getByRange({ inicio: toISO(ini), fim: toISO(fim) })
      } else {
        res = await window.api.agenda.getByMonth({ mes: month+1, ano: year })
      }
      setEvents(res.ok ? res.data||[] : [])
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
    setErro(null)
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
    setErro(null)
    setModal(ev)
  }

  async function handleSave() {
    if (!form.titulo.trim()) return
    setSaving(true)
    setErro(null)
    try {
      const payload = {
        ...form,
        categoria_id: form.categoria_id||null,
        status_id:    form.status_id||null,
        cliente_id:   form.cliente_id||null,
        hr_inicio:    form.hr_inicio||null,
        hr_fim:       form.hr_fim||null,
      }
      const res = modal==='new'
        ? await window.api.agenda.create(payload)
        : await window.api.agenda.update({id:modal.id, ...payload})
      if (!res.ok) { setErro(res.erro); return }
      setModal(null)
      await loadEvents()
    } finally { setSaving(false) }
  }

  function handleDelete() {
    if (!modal?.id) return
    const isRecorrente = !!modal.recorrencia_grupo_id && modal.recorrencia !== 'nenhuma'
    if (isRecorrente) {
      setConfirmState({
        titulo: 'Excluir evento recorrente',
        mensagem: `"${modal.titulo}" faz parte de uma série recorrente. O que deseja excluir?`,
        options: [
          { label:'Cancelar', value:'cancelar' },
          { label:'Somente este', value:'este' },
          { label:'Este e os futuros', value:'serie', primary:true, danger:true },
        ],
        onChoose: async (choice) => {
          setConfirmState(null)
          if (choice === 'cancelar') return
          const res = choice === 'serie'
            ? await window.api.agenda.deleteSerieFutura(modal.id)
            : await window.api.agenda.delete(modal.id)
          if (!res.ok) { setErro(res.erro); return }
          setModal(null)
          await loadEvents()
        },
      })
      return
    }
    setConfirmState({
      titulo: 'Excluir evento',
      mensagem: `Excluir o evento "${modal.titulo}"?`,
      onChoose: async (ok) => {
        setConfirmState(null)
        if (!ok) return
        const res = await window.api.agenda.delete(modal.id)
        if (!res.ok) { setErro(res.erro); return }
        setModal(null)
        await loadEvents()
      },
    })
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

        {/* Gerenciar categorias/status */}
        <button className="btn btn-ghost" style={{ height:32, fontSize:11 }} onClick={()=>setGerenciarAberto(true)}>
          <Settings2 size={13}/> Categorias/Status
        </button>

        {/* Novo evento */}
        <button className="btn btn-primary" style={{ height:32, fontSize:11 }}
          onClick={()=>openNew(view==='diaria'?toISO(currentDate):toISO(today))}>
          <Plus size={13}/> Novo evento
        </button>
      </div>

      {lookupErro && (
        <div style={{ marginBottom:10, background:'rgba(248,113,113,.1)', border:'1px solid rgba(239,68,68,.4)', borderRadius:8, padding:'8px 14px', fontSize:12, color:'var(--red)', flexShrink:0 }}>
          {lookupErro}
        </div>
      )}

      {/* ── Conteúdo ── */}
      <div style={{ flex:1, display:'flex', minHeight:0, border:'1px solid var(--bd)', borderRadius:10, overflow:'hidden', background:'var(--s1)' }}>

        {view==='mensal' && (
          <>
            <ViewMensal
              year={year} month={month} today={today} events={events}
              selectedDay={selectedDay}
              onSelectDay={day => setSelectedDay(d => d===day?null:day)}
              onOpenNew={openNew} onOpenEdit={openEdit}
            />
            {selectedDay && (
              <PainelDia
                year={year} month={month} day={selectedDay}
                events={events}
                onOpenNew={openNew} onOpenEdit={openEdit}
                onClose={()=>setSelectedDay(null)}
              />
            )}
          </>
        )}

        {view==='semanal' && (
          <ViewSemanal
            weekDays={weekDays} today={today} events={events}
            onOpenNew={openNew} onOpenEdit={openEdit}
          />
        )}

        {view==='diaria' && (
          <ViewDiaria
            date={currentDate} today={today} events={events}
            onOpenNew={openNew} onOpenEdit={openEdit}
          />
        )}

        {view==='lista' && (
          <ViewLista
            events={events}
            onOpenNew={openNew} onOpenEdit={openEdit}
          />
        )}
      </div>

      {/* ── Modal ── */}
      {modal && (
        <EventoModal
          modal={modal} form={form} setForm={setForm}
          categorias={categorias} statuses={statuses} clientes={clientes}
          saving={saving} erro={erro} onSave={handleSave} onDelete={handleDelete} onClose={()=>setModal(null)}
        />
      )}

      {gerenciarAberto && (
        <GerenciarCategoriasModal
          categorias={categorias} statuses={statuses}
          onClose={()=>setGerenciarAberto(false)}
          onReload={loadLookups}
        />
      )}

      {confirmState && (
        <ConfirmModal
          titulo={confirmState.titulo}
          mensagem={confirmState.mensagem}
          options={confirmState.options}
          onChoose={confirmState.onChoose}
          onClose={()=>setConfirmState(null)}
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
