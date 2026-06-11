import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Plus, Trash2, Save, Play, ChevronDown, ChevronRight,
         Check, X, Search, AlertCircle, Copy, RefreshCw } from 'lucide-react'
import { getAllIcons, LucideIcon, WidgetBody,
         TIPOS, PALETA, INTERVALOS, SQL_HINTS, SQL_GUIDE } from './dashShared'

function nextPos(widgets) {
  if (!widgets.length) return { x: 0, y: 0 }
  const ys = widgets.map(w => (w.grid_y || 0) + (w.grid_h || 4))
  return { x: 0, y: Math.max(...ys) }
}

function emptyForm() {
  return { titulo: '', tipo: 'card', sql_query: '', cor: '#FF6B2B', intervalo: 0, icone_lucide: '' }
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
  const [searchIcon,    setSearchIcon]    = useState('')
  const [showGuide,     setShowGuide]     = useState(false)
  const [iconOpen,      setIconOpen]      = useState(false)
  const iconRef  = useRef(null)
  const allIcons = getAllIcons()

  useEffect(() => {
    window.api.dash.getAll()
      .then(list => { setWidgets(list || []); setLoading(false) })
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

  function openNew() {
    setSelected('new')
    setForm(emptyForm())
    resetPreview()
    setShowGuide(false)
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
    })
    resetPreview()
    setShowGuide(false)
  }

  function resetPreview() { setPreviewRows(null); setPreviewFields([]); setPreviewErr(null) }

  function f(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
    if (key === 'tipo') { resetPreview(); setShowGuide(false) }
  }

  async function handleSave() {
    if (!form.titulo.trim()) return
    setSaving(true)
    try {
      if (selected === 'new') {
        const pos  = nextPos(widgets)
        const meta = TIPOS.find(t => t.value === form.tipo) || TIPOS[0]
        const payload = { ...form, grid_x: pos.x, grid_y: pos.y, grid_w: meta.defW, grid_h: meta.defH }
        const created = await window.api.dash.create(payload)
        const newW = { ...payload, id: created.id }
        setWidgets(prev => [...prev, newW])
        setSelected(created.id)
      } else {
        await window.api.dash.update({ id: selected, ...form })
        setWidgets(prev => prev.map(w => w.id === selected ? { ...w, ...form } : w))
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
    } finally {
      setDeleting(null)
    }
  }

  async function handleTestSql() {
    const sql = form.sql_query.trim()
    if (!sql) return
    setTesting(true); resetPreview()
    try {
      const res = await window.api.sql.execute(sql)
      if (res.error) { setPreviewErr(res.error.split('\n')[0]) }
      else { setPreviewRows(res.rows || []); setPreviewFields(res.fields?.map(f => f.name) || []) }
    } catch(e) { setPreviewErr(String(e)) }
    finally     { setTesting(false) }
  }

  const iconFiltered = searchIcon
    ? allIcons.filter(n => n.includes(searchIcon.toLowerCase().replace(/\s+/g, '-')))
    : allIcons

  const guide   = SQL_GUIDE[form.tipo]
  const sqlHint = SQL_HINTS[form.tipo]

  return (
    <div className="dash-wrapper" style={{ display:'flex', flexDirection:'row' }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div style={{ width:260, flexShrink:0, display:'flex', flexDirection:'column', borderRight:'1px solid var(--bd)', overflow:'hidden', background:'var(--bg)' }}>

        <div style={{ padding:'14px 12px 10px', borderBottom:'1px solid var(--bd)', background:'var(--s2)' }}>
          <button
            onClick={() => onNavigate?.('dashboard')}
            style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--t3)', background:'none', border:'none', cursor:'pointer', padding:0, marginBottom:10 }}
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
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'6px 8px' }}>
          {loading ? (
            [...Array(4)].map((_,i) => <div key={i} className="skel" style={{ height:44, borderRadius:7, marginBottom:6 }} />)
          ) : widgets.length === 0 ? (
            <div style={{ textAlign:'center', color:'var(--t3)', fontSize:11, padding:'32px 12px' }}>
              Nenhum widget ainda.<br/>Clique em "Novo Widget".
            </div>
          ) : widgets.map(w => {
            const meta  = TIPOS.find(t => t.value === w.tipo)
            const isSel = selected === w.id
            return (
              <div
                key={w.id}
                onClick={() => openEdit(w)}
                style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'8px 10px', marginBottom:3, borderRadius:8,
                  cursor:'pointer', transition:'background .1s',
                  background: isSel ? 'var(--s3)' : 'transparent',
                  border: isSel ? '1px solid var(--bd2)' : '1px solid transparent',
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background='var(--s2)' }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background='transparent' }}
              >
                <LucideIcon name={w.icone_lucide || meta?.icon || 'bar-chart-2'} size={14} color={w.cor || '#FF6B2B'} />
                <span style={{ flex:1, fontSize:12, fontWeight:500, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {w.titulo || '(sem título)'}
                </span>
                <span style={{ fontSize:9, color:'var(--t3)', background:'var(--s3)', borderRadius:8, padding:'1px 6px', flexShrink:0 }}>
                  {meta?.label || w.tipo}
                </span>
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
      </div>

      {/* ── RIGHT PANEL (editor) ───────────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', padding:'28px 32px' }}>
        {!selected ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:14, color:'var(--t3)' }}>
            <LucideIcon name="layout-dashboard" size={48} />
            <div style={{ fontSize:13, textAlign:'center', lineHeight:1.8 }}>
              Selecione um widget para editar<br/>ou clique em <strong style={{ color:'var(--t2)' }}>Novo Widget</strong>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth:680 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--t1)', marginBottom:24, letterSpacing:-.3 }}>
              {selected === 'new' ? 'Novo Widget' : 'Editar Widget'}
            </div>

            {/* ── Tipo ── */}
            <Label>Tipo de visualização</Label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:20 }}>
              {TIPOS.map(t => {
                const active = form.tipo === t.value
                return (
                  <button
                    key={t.value}
                    onClick={() => f('tipo', t.value)}
                    title={t.desc}
                    style={{
                      display:'flex', alignItems:'center', gap:6, padding:'7px 13px',
                      borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:500, transition:'all .12s',
                      border: active ? '1.5px solid var(--pri)' : '1.5px solid var(--bd)',
                      background: active ? 'var(--pri)20' : 'var(--s2)',
                      color: active ? 'var(--pri)' : 'var(--t2)',
                    }}
                  >
                    <LucideIcon name={t.icon} size={12} color={active ? undefined : undefined} />
                    {t.label}
                  </button>
                )
              })}
            </div>

            {/* ── Título + Ícone ── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 210px', gap:14, marginBottom:16 }}>
              <div>
                <Label>Título</Label>
                <input
                  className="form-input"
                  value={form.titulo}
                  onChange={e => f('titulo', e.target.value)}
                  placeholder="Ex: Total de O.S. abertas"
                  style={{ width:'100%' }}
                />
              </div>
              <div style={{ position:'relative' }} ref={iconRef}>
                <Label>Ícone Lucide</Label>
                <div
                  onClick={() => setIconOpen(v => !v)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', border:'1px solid var(--bd)', borderRadius:7, cursor:'pointer', background:'var(--s2)', userSelect:'none' }}
                >
                  <LucideIcon name={form.icone_lucide || 'image-off'} size={14} color={form.cor || '#FF6B2B'} />
                  <span style={{ flex:1, fontSize:11, color: form.icone_lucide ? 'var(--t1)' : 'var(--t3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {form.icone_lucide || 'Selecionar...'}
                  </span>
                  <ChevronDown size={11} style={{ color:'var(--t3)', transition:'transform .15s', transform: iconOpen ? 'rotate(180deg)' : 'none' }} />
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
            </div>

            {/* ── Cor + Intervalo ── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
              <div>
                <Label>Cor de destaque</Label>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
                  {PALETA.map(c => (
                    <button
                      key={c}
                      onClick={() => f('cor', c)}
                      style={{ width:22, height:22, borderRadius:'50%', background:c, border: form.cor===c ? '2.5px solid var(--t1)' : '2px solid transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'transform .1s', transform: form.cor===c ? 'scale(1.18)' : 'scale(1)' }}
                    >
                      {form.cor === c && <Check size={10} color="#fff" strokeWidth={3} />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={form.cor}
                    onChange={e => f('cor', e.target.value)}
                    title="Cor personalizada"
                    style={{ width:22, height:22, borderRadius:'50%', border:'none', cursor:'pointer', padding:0, background:'none' }}
                  />
                </div>
              </div>
              <div>
                <Label>Auto-atualização</Label>
                <select className="form-select" value={form.intervalo} onChange={e => f('intervalo', Number(e.target.value))} style={{ width:'100%', height:37 }}>
                  {INTERVALOS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* ── SQL ── */}
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                <Label style={{ marginBottom:0 }}>Query SQL</Label>
                <div style={{ display:'flex', gap:10 }}>
                  {!form.sql_query && sqlHint && (
                    <button
                      onClick={() => f('sql_query', sqlHint)}
                      style={{ fontSize:10, color:'var(--pri)', background:'none', border:'none', cursor:'pointer' }}
                    >
                      Inserir exemplo
                    </button>
                  )}
                  <button
                    onClick={() => setShowGuide(v => !v)}
                    style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, color:'var(--t3)', background:'none', border:'none', cursor:'pointer' }}
                  >
                    {showGuide ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    Guia SQL
                  </button>
                </div>
              </div>

              {showGuide && guide && (
                <div style={{ marginBottom:8, padding:'12px 14px', background:'var(--s2)', borderRadius:8, border:'1px solid var(--bd)', fontSize:11 }}>
                  <div style={{ color:'var(--t2)', marginBottom:10, fontWeight:500, lineHeight:1.5 }}>{guide.regra}</div>
                  {guide.exemplos.map((ex, i) => (
                    <div key={i} style={{ marginBottom: i < guide.exemplos.length-1 ? 10 : 0 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:10, fontWeight:600, color:'var(--t3)', textTransform:'uppercase', letterSpacing:.5 }}>{ex.label}</span>
                        <button
                          onClick={() => { f('sql_query', ex.sql); setShowGuide(false) }}
                          style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'var(--pri)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}
                        >
                          <Copy size={9} />Usar este
                        </button>
                      </div>
                      <pre style={{ margin:0, padding:'7px 10px', background:'var(--s3)', borderRadius:5, fontSize:10, color:'var(--t2)', overflowX:'auto', whiteSpace:'pre-wrap', wordBreak:'break-all', fontFamily:'monospace', lineHeight:1.6 }}>{ex.sql}</pre>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                className="form-textarea"
                value={form.sql_query}
                onChange={e => { f('sql_query', e.target.value); resetPreview() }}
                placeholder={sqlHint || 'SELECT ...'}
                spellCheck={false}
                style={{ width:'100%', height:120, fontFamily:'monospace', fontSize:11, resize:'vertical', lineHeight:1.65 }}
              />

              <div style={{ display:'flex', gap:8, marginTop:7, alignItems:'center' }}>
                <button
                  onClick={handleTestSql}
                  disabled={testing || !form.sql_query.trim()}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 13px', borderRadius:7, border:'1px solid var(--bd)', background:'var(--s2)', color:'var(--t1)', cursor: testing||!form.sql_query.trim() ? 'not-allowed' : 'pointer', fontSize:11, fontWeight:500, opacity: !form.sql_query.trim() ? .5 : 1 }}
                >
                  {testing
                    ? <RefreshCw size={11} style={{ animation:'spin .7s linear infinite' }} />
                    : <Play size={11} />
                  }
                  Testar SQL
                </button>
                {previewRows && (
                  <span style={{ fontSize:10, color:'var(--t3)' }}>
                    {previewRows.length} linha{previewRows.length!==1?'s':''} · {previewFields.length} coluna{previewFields.length!==1?'s':''}
                  </span>
                )}
                {previewErr && (
                  <div style={{ display:'flex', alignItems:'center', gap:4, color:'#F87171', fontSize:10, flex:1, overflow:'hidden' }}>
                    <AlertCircle size={11} style={{ flexShrink:0 }} />
                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{previewErr}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Preview ── */}
            {previewRows && previewRows.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <Label>Pré-visualização</Label>
                <div style={{ background:'var(--s2)', borderRadius:10, border:'1px solid var(--bd)', padding:'14px 16px', minHeight:90, position:'relative' }}>
                  <WidgetBody
                    widget={form}
                    rows={previewRows}
                    fields={previewFields}
                    fillHeight={false}
                  />
                </div>
              </div>
            )}

            {/* ── Actions ── */}
            <div style={{ display:'flex', gap:10, paddingTop:18, borderTop:'1px solid var(--bd)', marginTop:6 }}>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !form.titulo.trim()}
                style={{ display:'flex', alignItems:'center', gap:6 }}
              >
                {saving
                  ? <RefreshCw size={12} style={{ animation:'spin .7s linear infinite' }} />
                  : <Save size={12} />
                }
                {selected === 'new' ? 'Criar Widget' : 'Salvar Alterações'}
              </button>

              {selected !== 'new' && (
                <button
                  onClick={() => handleDelete(selected)}
                  disabled={!!deleting}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid #EF444466', background:'transparent', color:'#F87171', cursor:'pointer', fontSize:12, fontWeight:500 }}
                >
                  <Trash2 size={12} />
                  Excluir Widget
                </button>
              )}

              <button
                onClick={() => { setSelected(null); setForm(emptyForm()); resetPreview() }}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:8, border:'1px solid var(--bd)', background:'transparent', color:'var(--t3)', cursor:'pointer', fontSize:12 }}
              >
                <X size={12} />
                Cancelar
              </button>
            </div>

          </div>
        )}
      </div>

    </div>
  )
}

function Label({ children, style }) {
  return (
    <div style={{ fontSize:10, fontWeight:600, letterSpacing:1, color:'var(--t3)', textTransform:'uppercase', marginBottom:6, ...style }}>
      {children}
    </div>
  )
}
