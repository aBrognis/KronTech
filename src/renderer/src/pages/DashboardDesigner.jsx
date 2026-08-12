import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, RefreshCw, Database, Lock, Unlock, LayoutGrid } from 'lucide-react'
import { LucideIcon, TIPOS, WidgetForm, WidgetCard, WidgetGrid, useDashboardWidgets } from './dash'

function nextPos(widgets) {
  if (!widgets.length) return { x: 0, y: 0 }
  const ys = widgets.map(w => (w.grid_y || 0) + (w.grid_h || 4))
  return { x: 0, y: Math.max(...ys) }
}

function emptyForm() {
  return { titulo: '', tipo: 'card', sql_query: '', cor: '#FF6B2B', intervalo: 0, icone_lucide: '', grid_x: 0, grid_y: 0, grid_w: 3, grid_h: 2, comparar_anterior: false, sql_query_anterior: '' }
}

export default function DashboardDesigner({ newTrigger, onNavigate }) {
  const {
    widgets, layout, loading, loadingIds, errorMap,
    containerRef, containerW, refreshOne, handleLayoutChange, loadAll,
  } = useDashboardWidgets({ autoRefresh: false })

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
  const [seeding,       setSeeding]       = useState(false)
  const [clearingDemo,  setClearingDemo]  = useState(false)
  const [demoMsg,       setDemoMsg]       = useState(null)
  const [layoutLocked,  setLayoutLocked]  = useState(false)

  async function handleSeedDemo() {
    setSeeding(true); setDemoMsg(null)
    try {
      const res = await window.api.dash.seedDemo()
      setDemoMsg(res.ok ? { ok:true, texto:`${res.data.inserted} linhas geradas` } : { ok:false, texto: res.erro })
      if (res.ok) loadAll()
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
      if (res.ok) loadAll()
    } catch (e) {
      setDemoMsg({ ok:false, texto: String(e) })
    } finally {
      setClearingDemo(false)
    }
  }

  useEffect(() => {
    if (newTrigger > 0) openNew()
  }, [newTrigger])

  function openNew() {
    setSelected('new')
    setForm(emptyForm())
    resetPreview()
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
    })
    resetPreview()
  }

  function resetPreview() {
    setPreviewRows(null); setPreviewFields([]); setPreviewErr(null)
    setPrevPreviewRows(null); setPrevPreviewFields([]); setPrevPreviewErr(null)
  }

  function f(key, val) {
    if (key === 'tipo') {
      const meta = TIPOS.find(t => t.value === val)
      setForm(prev => ({ ...prev, tipo: val, grid_w: meta?.defW ?? prev.grid_w, grid_h: meta?.defH ?? prev.grid_h }))
      resetPreview()
      return
    }
    if (key === 'sql_query' || key === 'sql_query_anterior') {
      setForm(prev => ({ ...prev, [key]: val }))
      if (key === 'sql_query') { setPreviewRows(null); setPreviewFields([]); setPreviewErr(null) }
      else { setPrevPreviewRows(null); setPrevPreviewFields([]); setPrevPreviewErr(null) }
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
      await loadAll()
      window.dispatchEvent(new Event('dash:widgets-changed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (deleting) return
    setDeleting(id)
    try {
      await window.api.dash.delete(id)
      if (selected === id) { setSelected(null); setForm(emptyForm()); resetPreview() }
      await loadAll()
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
    finally     { setTesting(false) }
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

  return (
    <div className="dash-wrapper" style={{ display:'flex', flexDirection:'row' }}>

      {/* ── PAINEL 1: lista de widgets ─────────────────────────────────────── */}
      <div style={{ width:240, flexShrink:0, display:'flex', flexDirection:'column', borderRight:'1px solid var(--bd)', overflow:'hidden', background:'var(--bg)' }}>

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

          <div style={{ display:'flex', gap:6, marginTop:8 }}>
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
            <div style={{ marginTop:6, fontSize:10, color: demoMsg.ok ? 'var(--t3)' : '#F87171' }}>
              {demoMsg.texto}
            </div>
          )}
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

      {/* ── PAINEL 2: formulário ───────────────────────────────────────────── */}
      <div style={{ width:'clamp(380px, 32%, 520px)', flexShrink:0, overflowY:'auto', padding:'28px 26px', borderRight:'1px solid var(--bd)' }}>
        {!selected ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:14, color:'var(--t3)' }}>
            <LucideIcon name="layout-dashboard" size={48} />
            <div style={{ fontSize:13, textAlign:'center', lineHeight:1.8 }}>
              Selecione um widget para editar<br/>ou clique em <strong style={{ color:'var(--t2)' }}>Novo Widget</strong>
            </div>
          </div>
        ) : (
          <WidgetForm
            selected={selected}
            form={form}
            f={f}
            previewRows={previewRows}
            previewFields={previewFields}
            previewErr={previewErr}
            testing={testing}
            onTestSql={handleTestSql}
            testingPrev={testingPrev}
            prevPreviewRows={prevPreviewRows}
            prevPreviewFields={prevPreviewFields}
            prevPreviewErr={prevPreviewErr}
            onTestSqlAnterior={handleTestSqlAnterior}
            saving={saving}
            deleting={deleting}
            onSave={handleSave}
            onDelete={() => handleDelete(selected)}
            onCancel={() => { setSelected(null); setForm(emptyForm()); resetPreview() }}
          />
        )}
      </div>

      {/* ── PAINEL 3: dashboard ao vivo ─────────────────────────────────────── */}
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderBottom:'1px solid var(--bd)', background:'var(--s2)', flexShrink:0 }}>
          <LayoutGrid size={13} color="var(--t3)" />
          <span style={{ fontSize:11, fontWeight:600, color:'var(--t2)' }}>Dashboard ao vivo</span>
          <span style={{ fontSize:10, color:'var(--t3)' }}>
            {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setLayoutLocked(v => !v)}
            title={layoutLocked ? 'Destravar layout (arrastar/redimensionar)' : 'Travar layout'}
            style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:7, border:'1px solid var(--bd)', background: layoutLocked ? 'var(--s3)' : 'transparent', color:'var(--t2)', cursor:'pointer', fontSize:10.5, fontWeight:500 }}
          >
            {layoutLocked ? <Lock size={11} /> : <Unlock size={11} />}
            {layoutLocked ? 'Layout travado' : 'Layout livre'}
          </button>
        </div>

        <div ref={containerRef} style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
              {[...Array(4)].map((_,i) => <div key={i} className="skel" style={{ height:150, borderRadius:10 }} />)}
            </div>
          ) : widgets.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:10, color:'var(--t3)' }}>
              <LayoutGrid size={40} style={{ opacity:.3 }} />
              <div style={{ fontSize:12 }}>Nenhum widget ainda — crie um pelo painel ao lado.</div>
            </div>
          ) : (
            <WidgetGrid
              layout={layout}
              width={containerW}
              onLayoutChange={handleLayoutChange}
              isDraggable={!layoutLocked}
              isResizable={!layoutLocked}
            >
              {widgets.map(w => (
                <div key={String(w.id)}>
                  <WidgetCard
                    widget={w}
                    loading={loadingIds.has(w.id)}
                    error={errorMap[w.id]}
                    onRefresh={refreshOne}
                    selected={selected === w.id}
                    onSelect={() => openEdit(w)}
                  />
                </div>
              ))}
            </WidgetGrid>
          )}
        </div>
      </div>

    </div>
  )
}
