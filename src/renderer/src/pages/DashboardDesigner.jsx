import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ArrowUp, ArrowDown, Plus, Trash2, Save, Play, ChevronDown, ChevronRight,
         Check, X, Search, AlertCircle, Copy, RefreshCw, Database,
         LayoutGrid, Sliders, Palette, Clock3, Table2, ListOrdered } from 'lucide-react'
import { getAllIcons, LucideIcon, WidgetBody,
         TIPOS, PALETA, INTERVALOS, SQL_HINTS, SQL_GUIDE } from './dash'

const PALETA_FIXA = PALETA.slice(0, 11)

function nextPos(widgets) {
  if (!widgets.length) return { x: 0, y: 0 }
  const ys = widgets.map(w => (w.grid_y || 0) + (w.grid_h || 4))
  return { x: 0, y: Math.max(...ys) }
}

function emptyForm() {
  return { titulo: '', tipo: 'card', sql_query: '', cor: '#FF6B2B', intervalo: 0, icone_lucide: '', grid_x: 0, grid_y: 0, grid_w: 3, grid_h: 2, comparar_anterior: false, sql_query_anterior: '', formato: 'numero' }
}

export default function DashboardDesigner({ newTrigger, onNavigate }) {
  const [widgets,       setWidgets]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [selected,      setSelected]      = useState(null)
  const [form,          setForm]          = useState(emptyForm())
  const [saving,        setSaving]        = useState(false)
  const [deleting,      setDeleting]      = useState(null)
  const [testing,       setTesting]       = useState(false)
  const [previewRows,   setPreviewRows]   = useState(null)
  const [previewFields, setPreviewFields] = useState([])
  const [previewErr,    setPreviewErr]    = useState(null)
  const [testingPrev,       setTestingPrev]       = useState(false)
  const [prevPreviewRows,   setPrevPreviewRows]   = useState(null)
  const [prevPreviewFields, setPrevPreviewFields] = useState([])
  const [prevPreviewErr,    setPrevPreviewErr]    = useState(null)
  const [searchIcon,    setSearchIcon]    = useState('')
  const [showGuide,     setShowGuide]     = useState(false)
  const [iconOpen,      setIconOpen]      = useState(false)
  const [typeOpen,      setTypeOpen]      = useState(false)
  const [seeding,       setSeeding]       = useState(false)
  const [clearingDemo,  setClearingDemo]  = useState(false)
  const [demoMsg,       setDemoMsg]       = useState(null)
  const [searchWidget,  setSearchWidget]  = useState('')
  const [openGroups,    setOpenGroups]    = useState(() => new Set())
  const [tab,           setTab]           = useState('geral')
  const iconRef  = useRef(null)
  const typeRef  = useRef(null)
  const colorPickerRef = useRef(null)
  const allIcons = getAllIcons()

  async function handleSeedDemo() {
    setSeeding(true); setDemoMsg(null)
    try {
      const res = await window.api.dash.seedDemo()
      setDemoMsg(res.ok ? { ok:true, texto:`${res.data.inserted} linhas geradas` } : { ok:false, texto: res.erro })
    } catch (e) {
      setDemoMsg({ ok:false, texto: String(e) })
    } finally {
      setSeeding(false)
    }
  }

  async function handleClearDemo() {
    setClearingDemo(true); setDemoMsg(null)
    try {
      const res = await window.api.dash.clearDemo()
      setDemoMsg(res.ok ? { ok:true, texto:'Dados demo removidos' } : { ok:false, texto: res.erro })
    } catch (e) {
      setDemoMsg({ ok:false, texto: String(e) })
    } finally {
      setClearingDemo(false)
    }
  }

  useEffect(() => {
    window.api.dash.getAll()
      .then(res => { setWidgets(res.ok ? res.data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (newTrigger > 0) openNew()
  }, [newTrigger])

  useEffect(() => {
    if (!iconOpen) return
    function handler(e) {
      if (iconRef.current && !iconRef.current.contains(e.target)) setIconOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [iconOpen])

  useEffect(() => {
    if (!typeOpen) return
    function handler(e) {
      if (typeRef.current && !typeRef.current.contains(e.target)) setTypeOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [typeOpen])

  // abre automaticamente o grupo do tipo do widget selecionado
  useEffect(() => {
    if (selected && selected !== 'new') {
      const w = widgets.find(x => x.id === selected)
      if (w) setOpenGroups(prev => new Set(prev).add(w.tipo))
    }
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps

  function openNew() {
    setSelected('new')
    setForm(emptyForm())
    resetPreview()
    setShowGuide(false)
    setTab('geral')
  }

  function openEdit(w) {
    setSelected(w.id)
    setForm({
      titulo:       w.titulo       || '',
      tipo:         w.tipo         || 'card',
      sql_query:    w.sql_query    || '',
      cor:          w.cor          || '#FF6B2B',
      intervalo:    w.intervalo    || 0,
      icone_lucide: w.icone_lucide || '',
      grid_x:       w.grid_x       ?? 0,
      grid_y:       w.grid_y       ?? 0,
      grid_w:       w.grid_w       || 3,
      grid_h:       w.grid_h       || 2,
      comparar_anterior:  w.comparar_anterior  || false,
      sql_query_anterior: w.sql_query_anterior || '',
      formato:            w.formato            || 'numero',
    })
    resetPreview()
    setShowGuide(false)
    setTab('geral')
  }

  function resetPreview() {
    setPreviewRows(null); setPreviewFields([]); setPreviewErr(null)
    setPrevPreviewRows(null); setPrevPreviewFields([]); setPrevPreviewErr(null)
  }

  function f(key, val) {
    if (key === 'tipo') {
      const meta = TIPOS.find(t => t.value === val)
      setForm(prev => ({ ...prev, tipo: val, grid_w: meta?.defW ?? prev.grid_w, grid_h: meta?.defH ?? prev.grid_h }))
      resetPreview(); setShowGuide(false)
      return
    }
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSave() {
    if (!form.titulo.trim()) return
    setSaving(true)
    try {
      if (selected === 'new') {
        const pos = nextPos(widgets)
        const payload = { ...form, grid_x: pos.x, grid_y: pos.y }
        const res = await window.api.dash.create(payload)
        if (!res.ok) return
        setSelected(res.data.id)
      } else {
        await window.api.dash.update({ id: selected, ...form })
      }
      // O backend reempilha (recalcula grid_x/grid_y de TODOS os widgets)
      // sempre que largura/altura muda — sem recarregar do banco aqui, o
      // Designer continuava mostrando posições antigas em memória mesmo
      // com o banco já correto, dando a impressão de "não aceita"/travado.
      const res = await window.api.dash.getAll()
      if (res.ok) setWidgets(res.data)
      window.dispatchEvent(new Event('dash:widgets-changed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleReorder(direcao) {
    if (selected === 'new' || saving) return
    setSaving(true)
    try {
      const res = await window.api.dash.reorder(selected, direcao)
      if (res.ok) {
        setWidgets(res.data)
        window.dispatchEvent(new Event('dash:widgets-changed'))
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (deleting) return
    setDeleting(id)
    try {
      await window.api.dash.delete(id)
      setWidgets(prev => prev.filter(w => w.id !== id))
      if (selected === id) { setSelected(null); setForm(emptyForm()); resetPreview() }
      window.dispatchEvent(new Event('dash:widgets-changed'))
    } finally {
      setDeleting(null)
    }
  }

  async function handleTestSql() {
    const sql = form.sql_query.trim()
    if (!sql) return
    setTesting(true)
    setPreviewRows(null); setPreviewFields([]); setPreviewErr(null)
    try {
      const res = await window.api.sql.execute(sql)
      if (!res.ok) { setPreviewErr(res.erro.split('\n')[0]) }
      else { setPreviewRows(res.data.rows || []); setPreviewFields(res.data.fields || []) }
    } catch(e) { setPreviewErr(String(e)) }
    finally     { setTesting(false); setTab('resultado') }
  }

  async function handleTestSqlAnterior() {
    const sql = form.sql_query_anterior.trim()
    if (!sql) return
    setTestingPrev(true)
    setPrevPreviewRows(null); setPrevPreviewFields([]); setPrevPreviewErr(null)
    try {
      const res = await window.api.sql.execute(sql)
      if (!res.ok) { setPrevPreviewErr(res.erro.split('\n')[0]) }
      else { setPrevPreviewRows(res.data.rows || []); setPrevPreviewFields(res.data.fields || []) }
    } catch(e) { setPrevPreviewErr(String(e)) }
    finally     { setTestingPrev(false) }
  }

  function toggleGroup(tipo) {
    setOpenGroups(prev => {
      const next = new Set(prev)
      next.has(tipo) ? next.delete(tipo) : next.add(tipo)
      return next
    })
  }

  const iconFiltered = searchIcon
    ? allIcons.filter(n => n.includes(searchIcon.toLowerCase().replace(/\s+/g, '-')))
    : allIcons

  const guide     = SQL_GUIDE[form.tipo]
  const sqlHint    = SQL_HINTS[form.tipo]
  const tipoAtual  = TIPOS.find(t => t.value === form.tipo)

  // agrupa widgets por tipo para a lista lateral
  const widgetsFiltrados = searchWidget
    ? widgets.filter(w => (w.titulo || '').toLowerCase().includes(searchWidget.toLowerCase()))
    : widgets
  const grupos = {}
  for (const w of widgetsFiltrados) {
    const key = w.tipo || 'card'
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(w)
  }
  const gruposOrdenados = Object.keys(grupos).sort((a, b) => grupos[b].length - grupos[a].length)
  const tiposCount = gruposOrdenados.length

  return (
    <div className="dash-wrapper" style={{ display:'flex', flexDirection:'row' }}>

      {/* LEFT RAIL ────────────────────────────────────────────────────── */}
      <div style={{ width:280, flexShrink:0, display:'flex', flexDirection:'column', borderRight:'1px solid var(--bd)', overflow:'hidden', background:'var(--s1)' }}>

        <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10, borderBottom:'1px solid var(--bd)' }}>
          <button
            onClick={() => onNavigate?.('dashboard')}
            style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--t3)', background:'none', border:'none', cursor:'pointer', padding:0, marginBottom:2, alignSelf:'flex-start' }}
          >
            <ArrowLeft size={12} />
            Ir ao Dashboard
          </button>
          <button
            className="btn btn-primary"
            style={{ width:'100%', justifyContent:'center', gap:6, display:'flex', alignItems:'center' }}
            onClick={openNew}
          >
            <Plus size={13} />
            Novo Widget
          </button>

          <div style={{ display:'flex', gap:6 }}>
            <button
              onClick={handleSeedDemo}
              disabled={seeding || clearingDemo}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'6px 8px', borderRadius:7, border:'1px solid var(--bd)', background:'var(--s2)', color:'var(--t2)', cursor: seeding||clearingDemo ? 'not-allowed' : 'pointer', fontSize:10.5, fontWeight:500, opacity: clearingDemo ? .5 : 1 }}
            >
              {seeding
                ? <RefreshCw size={11} style={{ animation:'spin .7s linear infinite' }} />
                : <Database size={11} />
              }
              Popular demo
            </button>
            <button
              onClick={handleClearDemo}
              disabled={seeding || clearingDemo}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'6px 8px', borderRadius:7, border:'1px solid var(--bd)', background:'var(--s2)', color:'var(--t2)', cursor: seeding||clearingDemo ? 'not-allowed' : 'pointer', fontSize:10.5, fontWeight:500, opacity: seeding ? .5 : 1 }}
            >
              {clearingDemo
                ? <RefreshCw size={11} style={{ animation:'spin .7s linear infinite' }} />
                : <Trash2 size={11} />
              }
              Limpar demo
            </button>
          </div>
          {demoMsg && (
            <div style={{ fontSize:10, color: demoMsg.ok ? 'var(--t3)' : '#F87171' }}>
              {demoMsg.texto}
            </div>
          )}
        </div>

        {widgets.length > 0 && (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--s2)', border:'1px solid var(--bd2)', borderRadius:8, padding:'8px 10px', margin:'12px 16px 4px' }}>
              <Search size={13} style={{ color:'var(--t3)', flexShrink:0 }} />
              <input
                value={searchWidget}
                onChange={e => setSearchWidget(e.target.value)}
                placeholder="Buscar widget..."
                style={{ background:'none', border:'none', outline:'none', color:'var(--t1)', fontSize:12, width:'100%' }}
              />
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'2px 16px 10px', fontSize:11, color:'var(--t3)' }}>
              <span>{widgets.length} widget{widgets.length !== 1 ? 's' : ''} no dashboard</span>
              <b style={{ color:'var(--t2)' }}>{tiposCount} tipo{tiposCount !== 1 ? 's' : ''}</b>
            </div>
          </>
        )}

        <div style={{ flex:1, overflowY:'auto', padding:'4px 10px 12px' }}>
          {loading ? (
            [...Array(4)].map((_,i) => <div key={i} className="skel" style={{ height:44, borderRadius:7, marginBottom:6 }} />)
          ) : widgets.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, textAlign:'center', color:'var(--t3)', fontSize:11, padding:'32px 16px' }}>
              <LayoutGrid size={26} style={{ opacity:.4 }} />
              Nenhum widget ainda.<br/>Clique em "Novo Widget".
            </div>
          ) : widgetsFiltrados.length === 0 ? (
            <div style={{ textAlign:'center', color:'var(--t3)', fontSize:11, padding:'24px 16px' }}>
              Nenhum widget encontrado.
            </div>
          ) : gruposOrdenados.map(tipoKey => {
            const meta = TIPOS.find(t => t.value === tipoKey)
            const lista = grupos[tipoKey]
            const open = openGroups.has(tipoKey)
            return (
              <div key={tipoKey} style={{ marginBottom:2 }}>
                <div
                  onClick={() => toggleGroup(tipoKey)}
                  style={{
                    display:'flex', alignItems:'center', gap:7, padding:'9px 8px', cursor:'pointer',
                    color:'var(--t3)', fontSize:10.5, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase',
                    borderRadius:6, userSelect:'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--s2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <ChevronRight size={11} style={{ flexShrink:0, color:'var(--t3)', transition:'transform .16s ease', transform: open ? 'rotate(90deg)' : 'none' }} />
                  {meta?.label || tipoKey}
                  <span style={{
                    marginLeft:'auto', background: open ? 'var(--or4)' : 'var(--s3)', color: open ? 'var(--or)' : 'var(--t3)',
                    fontSize:10, fontWeight:700, padding:'1.5px 7px', borderRadius:20,
                  }}>
                    {lista.length}
                  </span>
                </div>

                {open && (
                  <div style={{ display:'flex', flexDirection:'column', gap:2, padding:'2px 0 8px 4px', borderLeft:'1px solid var(--bd)', marginLeft:13 }}>
                    {lista.map(w => {
                      const isSel = selected === w.id
                      return (
                        <div
                          key={w.id}
                          onClick={() => openEdit(w)}
                          style={{
                            display:'flex', alignItems:'center', gap:9, padding:'8px 9px', borderRadius:8,
                            cursor:'pointer', marginLeft:6, position:'relative',
                            background: isSel ? 'var(--or4)' : 'transparent',
                            border: isSel ? '1px solid rgba(217,82,24,.35)' : '1px solid transparent',
                            boxShadow: isSel ? 'var(--sh-sm)' : 'none',
                          }}
                          onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--s2)' }}
                          onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
                        >
                          <div style={{
                            width:26, height:26, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center',
                            flexShrink:0, background: (w.cor || '#FF6B2B') + '26',
                          }}>
                            <LucideIcon name={w.icone_lucide || meta?.icon || 'bar-chart-2'} size={13} color={w.cor || '#FF6B2B'} />
                          </div>
                          <div style={{ minWidth:0, flex:1 }}>
                            <div style={{
                              fontSize:12.5, fontWeight:600, color: isSel ? 'var(--or)' : 'var(--t1)',
                              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', lineHeight:1.35,
                            }}>
                              {w.titulo || '(sem título)'}
                            </div>
                            <div style={{ fontSize:10.5, color:'var(--t3)', fontVariantNumeric:'tabular-nums' }}>
                              {w.grid_w || 3}×{w.grid_h || 2}
                            </div>
                          </div>
                          <button
                            className="icon-btn"
                            onClick={e => { e.stopPropagation(); handleDelete(w.id) }}
                            disabled={deleting === w.id}
                            title="Excluir"
                            style={{ opacity: deleting===w.id ? .3 : .55, flexShrink:0 }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT PANEL (editor) ─────────────────────────────────────────── */}
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {!selected ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:14, color:'var(--t3)' }}>
            <LucideIcon name="layout-dashboard" size={48} />
            <div style={{ fontSize:13, textAlign:'center', lineHeight:1.8 }}>
              Selecione um widget para editar<br/>ou clique em <strong style={{ color:'var(--t2)' }}>Novo Widget</strong>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding:'18px 30px 0', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, flexShrink:0 }}>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:10.5, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:'var(--t3)', marginBottom:6 }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'var(--or4)', color:'var(--or)', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>
                    <LucideIcon name={tipoAtual?.icon || 'hash'} size={11} />
                    {tipoAtual?.label || form.tipo}
                  </span>
                  {selected === 'new' ? 'novo widget' : 'editando widget'}
                </div>
                <input
                  value={form.titulo}
                  onChange={e => f('titulo', e.target.value)}
                  placeholder="Título do widget"
                  style={{
                    fontSize:20, fontWeight:700, background:'transparent', border:'none', color:'var(--t1)',
                    outline:'none', width:'100%', padding:'2px 0', borderBottom:'1px solid transparent', letterSpacing:'-.01em',
                  }}
                  onFocus={e => e.target.style.borderBottomColor = 'var(--or)'}
                  onBlur={e => e.target.style.borderBottomColor = 'transparent'}
                />
              </div>
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <button
                  onClick={() => { setSelected(null); setForm(emptyForm()); resetPreview() }}
                  className="btn btn-ghost"
                  style={{ fontSize:12.5, padding:'8px 14px' }}
                >
                  Cancelar
                </button>
                {selected !== 'new' && (
                  <button
                    onClick={() => handleDelete(selected)}
                    disabled={!!deleting}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid rgba(248,113,113,.28)', background:'transparent', color:'#F87171', cursor:'pointer', fontSize:12.5, fontWeight:600 }}
                  >
                    <Trash2 size={13} />
                    Excluir
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving || !form.titulo.trim()}
                  style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, padding:'8px 14px' }}
                >
                  {saving
                    ? <RefreshCw size={13} style={{ animation:'spin .7s linear infinite' }} />
                    : <Save size={13} />
                  }
                  {selected === 'new' ? 'Criar Widget' : 'Salvar'}
                </button>
              </div>
            </div>

            {/* Tab bar */}
            <div style={{ display:'flex', padding:'0 30px', borderBottom:'1px solid var(--bd)', flexShrink:0, marginTop:16 }}>
              {[
                { id:'geral',     label:'Geral',      Icon: Sliders },
                { id:'query',     label:'Query SQL',  Icon: Table2 },
                { id:'resultado', label:'Resultado',  Icon: LayoutGrid, count: previewRows?.length },
              ].map(({ id, label, Icon, count }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{
                    display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer',
                    padding:'10px 4px', marginRight:24, fontSize:12.5,
                    color: tab === id ? 'var(--or)' : 'var(--t3)',
                    borderBottom: `2px solid ${tab === id ? 'var(--or)' : 'transparent'}`,
                    marginBottom:-1, fontWeight: tab === id ? 700 : 400,
                  }}
                >
                  <Icon size={13} />
                  {label}
                  {count != null && (
                    <span style={{
                      background: tab === id ? 'var(--or4)' : 'var(--s3)', color: tab === id ? 'var(--or)' : 'var(--t3)',
                      fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:20, fontVariantNumeric:'tabular-nums',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            <div style={{ flex:1, minHeight:0, overflowY:'auto' }}>

              {/* GERAL */}
              {tab === 'geral' && (
                <div style={{ padding:'24px 30px 48px', display:'flex', flexDirection:'column', gap:22, maxWidth:1000 }}>

                  <SecCard icon={<LayoutGrid size={14} />} title="Tipo de visualização">
                    <div style={{ position:'relative' }} ref={typeRef}>
                      <div
                        onClick={() => setTypeOpen(v => !v)}
                        style={{
                          display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
                          padding:'9px 12px', cursor:'pointer', userSelect:'none',
                          background:'var(--s3)', border:'1px solid var(--bd2)',
                          borderRadius: typeOpen ? '8px 8px 0 0' : 8,
                        }}
                      >
                        <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                          <span style={{ width:30, height:30, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:(form.cor||'#FF6B2B')+'26', color: form.cor || '#FF6B2B' }}>
                            <LucideIcon name={tipoAtual?.icon || 'hash'} size={15} />
                          </span>
                          <div>
                            <div style={{ fontSize:13.5, fontWeight:600, color:'var(--t1)', lineHeight:1.3 }}>{tipoAtual?.label}</div>
                            <div style={{ fontSize:11, color:'var(--t3)', lineHeight:1.3 }}>{tipoAtual?.desc}</div>
                          </div>
                        </div>
                        <ChevronDown size={15} style={{ color:'var(--t3)', flexShrink:0, transition:'transform .15s', transform: typeOpen ? 'rotate(180deg)' : 'none' }} />
                      </div>

                      {typeOpen && (
                        <div style={{ maxHeight:360, overflowY:'auto', padding:6, background:'var(--s1)', border:'1px solid var(--bd)', borderTop:'none', borderRadius:'0 0 8px 8px' }}>
                          {TIPOS.map(t => {
                            const active = form.tipo === t.value
                            return (
                              <div
                                key={t.value}
                                onClick={() => { f('tipo', t.value); setTypeOpen(false) }}
                                style={{
                                  display:'flex', alignItems:'center', gap:10, padding:'8px 9px', borderRadius:8, cursor:'pointer',
                                  background: active ? 'var(--or4)' : 'transparent',
                                }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--s3)' }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                              >
                                <span style={{ width:30, height:30, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: active ? 'rgba(217,82,24,.18)' : 'var(--s3)', color: active ? 'var(--or)' : 'var(--t2)' }}>
                                  <LucideIcon name={t.icon} size={15} />
                                </span>
                                <div style={{ flex:1 }}>
                                  <div style={{ fontSize:13.5, fontWeight:600, color: active ? 'var(--or)' : 'var(--t1)', lineHeight:1.3 }}>{t.label}</div>
                                  <div style={{ fontSize:11, color:'var(--t3)', lineHeight:1.3 }}>{t.desc}</div>
                                </div>
                                {active && <Check size={15} style={{ color:'var(--or)', flexShrink:0 }} />}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </SecCard>

                  {selected !== 'new' && (
                    <SecCard icon={<ListOrdered size={14} />} title="Ordem, sequência e linha">
                      {(() => {
                        const ordenados = [...widgets].sort((a, b) => (a.posicao ?? 0) - (b.posicao ?? 0))
                        const idx = ordenados.findIndex(w => w.id === selected)
                        const total = ordenados.length
                        // Calcula em que "linha" visual este widget cai, simulando o
                        // mesmo flow-layout usado pelo Dashboard real (dash:autoLayout):
                        // entra na linha atual se couber (largura acumulada ≤ 12
                        // colunas), senão quebra pra próxima linha.
                        let cursorX = 0, linha = 1, minhaLinha = 1
                        for (let i = 0; i < ordenados.length; i++) {
                          const w = i === idx ? form.grid_w : (ordenados[i].grid_w || 3)
                          if (cursorX > 0 && cursorX + w > 12) { cursorX = 0; linha++ }
                          if (i === idx) minhaLinha = linha
                          cursorX += w
                        }
                        return (
                          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                              <div style={{ display:'flex', gap:6 }}>
                                <button
                                  onClick={() => handleReorder('up')}
                                  disabled={saving || idx <= 0}
                                  title="Subir posição"
                                  style={{
                                    display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34,
                                    borderRadius:8, border:'1px solid var(--bd2)', background:'var(--s3)',
                                    color: idx <= 0 ? 'var(--t3)' : 'var(--t1)',
                                    cursor: (saving || idx <= 0) ? 'not-allowed' : 'pointer', opacity: idx <= 0 ? .45 : 1,
                                  }}
                                >
                                  <ArrowUp size={15} />
                                </button>
                                <button
                                  onClick={() => handleReorder('down')}
                                  disabled={saving || idx < 0 || idx >= total - 1}
                                  title="Descer posição"
                                  style={{
                                    display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34,
                                    borderRadius:8, border:'1px solid var(--bd2)', background:'var(--s3)',
                                    color: (idx < 0 || idx >= total - 1) ? 'var(--t3)' : 'var(--t1)',
                                    cursor: (saving || idx < 0 || idx >= total - 1) ? 'not-allowed' : 'pointer',
                                    opacity: (idx < 0 || idx >= total - 1) ? .45 : 1,
                                  }}
                                >
                                  <ArrowDown size={15} />
                                </button>
                              </div>
                              <div style={{ fontSize:12, color:'var(--t3)' }}>
                                Sequência <b style={{ color:'var(--t1)' }}>{idx + 1}</b> de {total} · cai na <b style={{ color:'var(--t1)' }}>linha {minhaLinha}</b> do Dashboard.
                              </div>
                            </div>

                            <div style={{ display:'flex', gap:26 }}>
                              <div style={{ flex:1 }}>
                                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--t2)', marginBottom:9 }}>
                                  Largura <b style={{ color:'var(--t1)', fontVariantNumeric:'tabular-nums', fontWeight:700 }}>{form.grid_w}/12</b>
                                </div>
                                <input
                                  type="range" min={2} max={12} step={1}
                                  value={form.grid_w}
                                  onChange={e => f('grid_w', Number(e.target.value))}
                                  style={{ width:'100%' }}
                                />
                              </div>
                              <div style={{ flex:1 }}>
                                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--t2)', marginBottom:9 }}>
                                  Altura <b style={{ color:'var(--t1)', fontVariantNumeric:'tabular-nums', fontWeight:700 }}>{form.grid_h} lin.</b>
                                </div>
                                <input
                                  type="range" min={1} max={8} step={1}
                                  value={form.grid_h}
                                  onChange={e => f('grid_h', Number(e.target.value))}
                                  style={{ width:'100%' }}
                                />
                              </div>
                            </div>
                            <div style={{ fontSize:10.5, color:'var(--t3)' }}>
                              Dois widgets de largura 6 cabem lado a lado na mesma linha (6+6=12); mude a largura pra controlar quantos ficam por linha.
                            </div>
                          </div>
                        )
                      })()}
                    </SecCard>
                  )}

                  <SecCard icon={<Clock3 size={14} />} title="Identidade e atualização">
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
                      <div style={{ position:'relative' }} ref={iconRef}>
                        <FieldLabel>Ícone</FieldLabel>
                        <div
                          onClick={() => setIconOpen(v => !v)}
                          style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 11px', border:'1px solid var(--bd2)', borderRadius:8, cursor:'pointer', background:'var(--s3)', userSelect:'none' }}
                        >
                          <LucideIcon name={form.icone_lucide || 'image-off'} size={14} color={form.cor || '#FF6B2B'} />
                          <span style={{ flex:1, fontSize:12.5, color: form.icone_lucide ? 'var(--t1)' : 'var(--t3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {form.icone_lucide || 'Selecionar...'}
                          </span>
                          <ChevronDown size={12} style={{ color:'var(--t3)', transition:'transform .15s', transform: iconOpen ? 'rotate(180deg)' : 'none' }} />
                        </div>

                        {iconOpen && (
                          <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:300, background:'var(--bg)', border:'1px solid var(--bd)', borderRadius:9, boxShadow:'0 8px 28px rgba(0,0,0,.35)', padding:8, minWidth:220 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 8px', background:'var(--s2)', borderRadius:6, marginBottom:6 }}>
                              <Search size={11} style={{ color:'var(--t3)', flexShrink:0 }} />
                              <input
                                autoFocus
                                value={searchIcon}
                                onChange={e => setSearchIcon(e.target.value)}
                                placeholder="Buscar ícone..."
                                style={{ background:'none', border:'none', outline:'none', fontSize:11, color:'var(--t1)', width:'100%' }}
                              />
                              {searchIcon && (
                                <button onClick={() => setSearchIcon('')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--t3)', padding:0, lineHeight:1 }}>
                                  <X size={11} />
                                </button>
                              )}
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, maxHeight:200, overflowY:'auto' }}>
                              {iconFiltered.slice(0, 210).map(name => (
                                <button
                                  key={name}
                                  title={name}
                                  onClick={() => { f('icone_lucide', name); setIconOpen(false); setSearchIcon('') }}
                                  style={{
                                    display:'flex', alignItems:'center', justifyContent:'center', padding:6,
                                    borderRadius:5, border:'none', cursor:'pointer',
                                    background: form.icone_lucide === name ? (form.cor || '#FF6B2B') + '25' : 'transparent',
                                    transition:'background .1s',
                                  }}
                                  onMouseEnter={e => { if (form.icone_lucide !== name) e.currentTarget.style.background = 'var(--s3)' }}
                                  onMouseLeave={e => { if (form.icone_lucide !== name) e.currentTarget.style.background = 'transparent' }}
                                >
                                  <LucideIcon name={name} size={14} color={form.icone_lucide === name ? (form.cor || '#FF6B2B') : undefined} />
                                </button>
                              ))}
                            </div>
                            {iconFiltered.length > 210 && (
                              <div style={{ fontSize:9, color:'var(--t3)', textAlign:'center', marginTop:4, padding:2 }}>
                                +{iconFiltered.length - 210} ícones · refine a busca
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <FieldLabel>Auto-atualização</FieldLabel>
                        <select
                          className="form-select"
                          value={form.intervalo}
                          onChange={e => f('intervalo', Number(e.target.value))}
                          style={{ width:'100%', height:37, background:'var(--s3)', border:'1px solid var(--bd2)' }}
                        >
                          {INTERVALOS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>

                      <div>
                        <FieldLabel>Formato dos valores</FieldLabel>
                        <select
                          className="form-select"
                          value={form.formato || 'numero'}
                          onChange={e => f('formato', e.target.value)}
                          style={{ width:'100%', height:37, background:'var(--s3)', border:'1px solid var(--bd2)' }}
                        >
                          <option value="numero">Número</option>
                          <option value="moeda">Moeda (R$)</option>
                          <option value="percentual">Percentual (%)</option>
                        </select>
                      </div>
                    </div>
                  </SecCard>

                  <SecCard icon={<Palette size={14} />} title="Aparência">
                    <FieldLabel>Cor de destaque</FieldLabel>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap:6 }}>
                      {PALETA_FIXA.map(c => {
                        const active = form.cor?.toLowerCase() === c.toLowerCase()
                        return (
                          <button
                            key={c}
                            onClick={() => f('cor', c)}
                            style={{
                              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6,
                              padding:'10px 2px', borderRadius:8, cursor:'pointer',
                              background: active ? `${c}1F` : 'var(--s3)',
                              border: `1px solid ${active ? c : 'var(--bd2)'}`,
                            }}
                          >
                            <span style={{
                              width:17, height:17, borderRadius:5, background:c, flexShrink:0,
                              boxShadow: active ? `0 0 0 2px ${c}4D` : '0 1px 2px rgba(0,0,0,.3)',
                            }} />
                          </button>
                        )
                      })}
                      <div style={{ position:'relative' }}>
                        <button
                          onClick={() => colorPickerRef.current?.click()}
                          title="Escolher cor personalizada"
                          style={{
                            width:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6,
                            padding:'10px 2px', borderRadius:8, cursor:'pointer',
                            background: !PALETA_FIXA.some(c => c.toLowerCase() === form.cor?.toLowerCase()) ? `${form.cor}1F` : 'var(--s3)',
                            border: `1px solid ${!PALETA_FIXA.some(c => c.toLowerCase() === form.cor?.toLowerCase()) ? form.cor : 'var(--bd2)'}`,
                          }}
                        >
                          <span style={{
                            width:17, height:17, borderRadius:5, flexShrink:0,
                            background: !PALETA_FIXA.some(c => c.toLowerCase() === form.cor?.toLowerCase())
                              ? form.cor
                              : 'conic-gradient(from 180deg, #FF6B2B, #FBD24C, #4ADE80, #22D3EE, #A78BFA, #F472B6, #FF6B2B)',
                          }} />
                        </button>
                        <input
                          ref={colorPickerRef}
                          type="color"
                          value={form.cor}
                          onChange={e => f('cor', e.target.value)}
                          style={{ position:'absolute', opacity:0, width:0, height:0, pointerEvents:'none' }}
                          tabIndex={-1}
                        />
                      </div>
                    </div>
                  </SecCard>


                  <label style={{
                    display:'flex', alignItems:'center', gap:10, color:'var(--t2)', fontSize:13, cursor:'pointer',
                    background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:8, padding:'12px 14px',
                  }}>
                    <input
                      type="checkbox"
                      checked={form.comparar_anterior}
                      onChange={e => f('comparar_anterior', e.target.checked)}
                      style={{ width:16, height:16, cursor:'pointer', flexShrink:0, accentColor:'var(--or)' }}
                    />
                    <div>
                      <div>Comparar com período anterior</div>
                      <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>
                        Mostra a variação percentual em relação ao período anterior equivalente
                      </div>
                    </div>
                  </label>
                </div>
              )}

              {/* QUERY SQL */}
              {tab === 'query' && (
                <div style={{ padding:'24px 30px 48px', display:'flex', flexDirection:'column', gap:22, maxWidth:1000 }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:9 }}>
                      <FieldLabel style={{ marginBottom:0 }}>Query SQL</FieldLabel>
                      <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                        {!form.sql_query && sqlHint && (
                          <button
                            onClick={() => f('sql_query', sqlHint)}
                            style={{ fontSize:11, color:'var(--or)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}
                          >
                            Inserir exemplo
                          </button>
                        )}
                        <button
                          onClick={() => setShowGuide(v => !v)}
                          style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--or)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}
                        >
                          Guia SQL
                          <ChevronRight size={11} style={{ transition:'transform .15s', transform: showGuide ? 'rotate(90deg)' : 'none' }} />
                        </button>
                      </div>
                    </div>

                    {showGuide && guide && (
                      <div style={{ marginBottom:10, padding:'12px 14px', background:'var(--s2)', borderRadius:8, border:'1px solid var(--bd)', fontSize:11 }}>
                        <div style={{ color:'var(--t2)', marginBottom:10, fontWeight:500, lineHeight:1.5 }}>{guide.regra}</div>
                        {guide.exemplos.map((ex, i) => (
                          <div key={i} style={{ marginBottom: i < guide.exemplos.length-1 ? 10 : 0 }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                              <span style={{ fontSize:10, fontWeight:600, color:'var(--t3)', textTransform:'uppercase', letterSpacing:.5 }}>{ex.label}</span>
                              <button
                                onClick={() => { f('sql_query', ex.sql); setShowGuide(false) }}
                                style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'var(--or)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}
                              >
                                <Copy size={9} />Usar este
                              </button>
                            </div>
                            <pre style={{ margin:0, padding:'7px 10px', background:'var(--s3)', borderRadius:5, fontSize:10, color:'var(--t2)', overflowX:'auto', whiteSpace:'pre-wrap', wordBreak:'break-all', fontFamily:'monospace', lineHeight:1.6 }}>{ex.sql}</pre>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ border:'1px solid var(--bd2)', borderRadius:10, overflow:'hidden', background:'var(--s3)', boxShadow:'var(--sh-sm)' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--bd)', background:'var(--s2)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:9, color:'var(--t2)', fontSize:11.5, fontWeight:600 }}>
                          <span style={{ width:6, height:6, borderRadius:'50%', background: previewErr ? '#F87171' : 'var(--green,#4ADE80)', boxShadow:'0 0 0 3px rgba(74,222,128,.15)' }} />
                          {previewErr ? 'Erro na última execução' : 'Pronto para testar'}
                        </div>
                      </div>
                      <textarea
                        className="form-textarea"
                        value={form.sql_query}
                        onChange={e => { f('sql_query', e.target.value); setPreviewRows(null); setPreviewFields([]); setPreviewErr(null) }}
                        placeholder={sqlHint || 'SELECT ...'}
                        spellCheck={false}
                        style={{ width:'100%', minHeight:320, fontFamily:'Cascadia Code, Consolas, monospace', fontSize:13, resize:'vertical', lineHeight:1.7, background:'transparent', border:'none', padding:18 }}
                      />
                      <div style={{ display:'flex', gap:12, alignItems:'center', padding:'12px 14px', borderTop:'1px solid var(--bd)', background:'var(--s2)' }}>
                        <button
                          className="btn btn-primary"
                          onClick={handleTestSql}
                          disabled={testing || !form.sql_query.trim()}
                          style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, padding:'8px 14px', opacity: !form.sql_query.trim() ? .5 : 1 }}
                        >
                          {testing
                            ? <RefreshCw size={13} style={{ animation:'spin .7s linear infinite' }} />
                            : <Play size={13} />
                          }
                          Testar SQL
                        </button>
                        <span style={{ fontSize:11.5, color:'var(--t3)' }}>Abre o resultado na aba "Resultado"</span>
                        {previewErr && (
                          <div style={{ display:'flex', alignItems:'center', gap:4, color:'#F87171', fontSize:11, flex:1, overflow:'hidden', justifyContent:'flex-end' }}>
                            <AlertCircle size={12} style={{ flexShrink:0 }} />
                            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{previewErr}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comparação com período anterior */}
                  <div style={{ padding:'12px 14px', border:'1px solid var(--bd)', borderRadius:10, background:'var(--s2)' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:12, fontWeight:600, color:'var(--t1)' }}>
                      <input
                        type="checkbox"
                        checked={form.comparar_anterior}
                        onChange={e => f('comparar_anterior', e.target.checked)}
                        style={{ width:14, height:14, cursor:'pointer', accentColor:'var(--or)' }}
                      />
                      Comparar com período anterior
                    </label>
                    {form.comparar_anterior && (
                      <div style={{ marginTop:10 }}>
                        <div style={{ fontSize:10, color:'var(--t3)', marginBottom:6, lineHeight:1.5 }}>
                          Escreva uma query que retorne o mesmo formato de colunas, referente ao período anterior.
                          Para gráficos, as categorias devem estar na mesma ordem da query principal.
                        </div>
                        <textarea
                          className="form-textarea"
                          value={form.sql_query_anterior}
                          onChange={e => { f('sql_query_anterior', e.target.value); setPrevPreviewRows(null); setPrevPreviewFields([]); setPrevPreviewErr(null) }}
                          placeholder="SELECT ... (mesmo formato, período anterior)"
                          spellCheck={false}
                          style={{ width:'100%', height:90, fontFamily:'monospace', fontSize:11, resize:'vertical', lineHeight:1.65 }}
                        />
                        <div style={{ display:'flex', gap:8, marginTop:7, alignItems:'center' }}>
                          <button
                            type="button"
                            onClick={handleTestSqlAnterior}
                            disabled={testingPrev || !form.sql_query_anterior.trim()}
                            style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 13px', borderRadius:7, border:'1px solid var(--bd)', background:'var(--s3)', color:'var(--t1)', cursor: testingPrev||!form.sql_query_anterior.trim() ? 'not-allowed' : 'pointer', fontSize:11, fontWeight:500, opacity: !form.sql_query_anterior.trim() ? .5 : 1 }}
                          >
                            {testingPrev
                              ? <RefreshCw size={11} style={{ animation:'spin .7s linear infinite' }} />
                              : <Play size={11} />
                            }
                            Testar SQL
                          </button>
                          {prevPreviewRows && (
                            <span style={{ fontSize:10, color:'var(--t3)' }}>
                              {prevPreviewRows.length} linha{prevPreviewRows.length!==1?'s':''} · {prevPreviewFields.length} coluna{prevPreviewFields.length!==1?'s':''}
                            </span>
                          )}
                          {prevPreviewErr && (
                            <div style={{ display:'flex', alignItems:'center', gap:4, color:'#F87171', fontSize:10, flex:1, overflow:'hidden' }}>
                              <AlertCircle size={11} style={{ flexShrink:0 }} />
                              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{prevPreviewErr}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* RESULTADO */}
              {tab === 'resultado' && (
                <div style={{ padding:'24px 30px 48px', display:'flex', flexDirection:'column', gap:22, maxWidth:1000 }}>
                  {!previewRows ? (
                    <div style={{
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12,
                      padding:'70px 20px', color:'var(--t3)', textAlign:'center',
                      background:'var(--s2)', border:'1px dashed var(--bd2)', borderRadius:10,
                    }}>
                      <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--s3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <LayoutGrid size={24} />
                      </div>
                      <div style={{ fontSize:13.5, fontWeight:700, color:'var(--t2)' }}>Nenhum teste executado ainda</div>
                      <div style={{ fontSize:12, maxWidth:320, lineHeight:1.5 }}>
                        Vá até a aba "Query SQL" e clique em "Testar SQL" para ver o resultado da consulta aqui.
                      </div>
                    </div>
                  ) : previewErr ? (
                    <div style={{ display:'flex', alignItems:'center', gap:8, color:'#F87171', fontSize:12.5, padding:'16px 18px', background:'rgba(248,113,113,.08)', border:'1px solid rgba(248,113,113,.25)', borderRadius:10 }}>
                      <AlertCircle size={16} style={{ flexShrink:0 }} />
                      {previewErr}
                    </div>
                  ) : (
                    <>
                      <div style={{ display:'flex', alignItems:'center', gap:16, color:'var(--t2)', fontSize:12, background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:8, padding:'10px 14px' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ADE80', boxShadow:'0 0 0 3px rgba(74,222,128,.15)' }} />
                          Sucesso
                        </span>
                        <span style={{ width:1, height:12, background:'var(--bd2)' }} />
                        <span><b style={{ color:'var(--t1)', fontVariantNumeric:'tabular-nums' }}>{previewRows.length}</b> linhas</span>
                        <span style={{ width:1, height:12, background:'var(--bd2)' }} />
                        <span><b style={{ color:'var(--t1)', fontVariantNumeric:'tabular-nums' }}>{previewFields.length}</b> colunas</span>
                      </div>

                      <div style={{ border:'1px solid var(--bd)', borderRadius:10, overflow:'hidden', background:'var(--s2)' }}>
                        <div style={{ overflowX:'auto' }}>
                          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
                            <thead>
                              <tr>
                                {previewFields.map(fld => (
                                  <th key={fld} style={{ textAlign:'left', padding:'10px 14px', color:'var(--t2)', fontWeight:700, fontSize:10.5, textTransform:'uppercase', letterSpacing:'.04em', borderBottom:'2px solid var(--or)', background:'var(--s3)' }}>
                                    {fld}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {previewRows.slice(0, 100).map((row, i) => (
                                <tr key={i}>
                                  {previewFields.map(fld => (
                                    <td key={fld} style={{ padding:'10px 14px', borderBottom:'1px solid var(--bd)', color:'var(--t1)', fontVariantNumeric:'tabular-nums' }}>
                                      {row[fld] == null ? <span style={{ color:'var(--t3)' }}></span> : String(row[fld])}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {previewRows.length > 100 && (
                          <div style={{ padding:'8px 14px', fontSize:11, color:'var(--t3)', borderTop:'1px solid var(--bd)' }}>
                            Mostrando 100 de {previewRows.length} linhas
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, fontSize:12, color:'var(--t2)', fontWeight:700 }}>
                          <Check size={14} />
                          Assim vai aparecer no card do Dashboard
                        </div>
                        <div className="dash-hud dash-widget-card" style={{ border:'1px solid var(--bd)', borderRadius:10, overflow:'hidden', background:'var(--s1)', boxShadow:'var(--sh-md)', maxWidth:460 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 14px', borderBottom:'1px solid var(--bd)', background:'var(--s2)' }}>
                            <span style={{ width:24, height:24, borderRadius:6, background:(form.cor||'#FF6B2B')+'26', color:form.cor||'#FF6B2B', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              <LucideIcon name={form.icone_lucide || tipoAtual?.icon || 'hash'} size={13} />
                            </span>
                            <span style={{ fontSize:12.5, fontWeight:700 }}>{form.titulo || '(sem título)'}</span>
                          </div>
                          <div style={{ padding:'14px 16px', position:'relative' }}>
                            <WidgetBody
                              widget={form}
                              rows={previewRows}
                              fields={previewFields}
                              prevRows={prevPreviewRows}
                              prevFields={prevPreviewFields}
                              fillHeight={false}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  )
}

function SecCard({ icon, title, children }) {
  return (
    <div style={{ background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:10, padding:'18px 20px' }}>
      <div style={{ fontSize:12, fontWeight:700, color:'var(--t1)', marginBottom:14, display:'flex', alignItems:'center', gap:7 }}>
        <span style={{ color:'var(--t3)', display:'flex' }}>{icon}</span>
        {title}
      </div>
      {children}
    </div>
  )
}

function FieldLabel({ children, style }) {
  return (
    <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.05em', color:'var(--t3)', textTransform:'uppercase', marginBottom:9, ...style }}>
      {children}
    </div>
  )
}
