import { useState, useEffect, useRef, useMemo } from 'react'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { Trash2, Play, ChevronDown, ChevronUp, ChevronRight,
         Check, X, AlertCircle, Copy, RefreshCw, Database,
         LayoutGrid, Palette, Clock3, RotateCcw, SlidersHorizontal, ExternalLink } from 'lucide-react'
import { LucideIcon, WidgetBody,
         TIPOS, PALETA, INTERVALOS, SQL_HINTS, SQL_GUIDE } from './dash'
import FormToolbar from '../components/FormToolbar.jsx'
import PesquisaPadraoModal from '../components/PesquisaPadraoModal.jsx'
import PaginacaoBar from '../pages/formBuilderView/PaginacaoBar.jsx'
import { thS, tdS } from './formBuilderView/gridStyles.js'
import { notificar } from '../components/Notificacao'

const CAMPOS_BUSCA_DASH = [
  { nome_campo: 'codigo', label: 'Código' },
  { nome_campo: 'titulo', label: 'Título' },
  { nome_campo: 'tipo',   label: 'Tipo'   },
]

function nextPos(widgets) {
  if (!widgets.length) return { x: 0, y: 0 }
  const ys = widgets.map(w => (w.grid_y || 0) + (w.grid_h || 4))
  return { x: 0, y: Math.max(...ys) }
}

function emptyForm() {
  return { codigo: '', titulo: '', tipo: 'card', sql_query: '', cor: '#FF6B2B', intervalo: 0, icone_lucide: '', grid_x: 0, grid_y: 0, grid_w: 3, grid_h: 2, comparar_anterior: false, sql_query_anterior: '', formato: 'numero', cores_series: {} }
}

// Tipos onde cada linha (não coluna) vira uma série/fatia colorível — pizza,
// funil, treemap etc. usam a 1ª coluna como o "nome" a mapear cor, diferente
// dos gráficos cartesianos (barra/linha) que colorem por COLUNA numérica.
const TIPOS_COR_POR_LINHA = new Set(['pie', 'funnel', 'treemap', 'sunburst', 'pictorial_bar', 'theme_river'])

export default function DashboardDesigner({ newTrigger, onNavigate }) {
  const [widgets,       setWidgets]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [selected,      setSelected]      = useState(null)
  const [mode,          setMode]          = useState('view') // 'view' | 'new' | 'edit'
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
  const [showGuide,     setShowGuide]     = useState(false)
  const [typeOpen,      setTypeOpen]      = useState(false)
  const [seeding,       setSeeding]       = useState(false)
  const [clearingDemo,  setClearingDemo]  = useState(false)
  const [demoMsg,       setDemoMsg]       = useState(null)
  const [activeTab,     setActiveTab]     = useState('acesso')
  const [layoutW,       setLayoutW]       = useState(800)
  // Filtros e paginação da aba Acesso — client-side, os widgets já vêm
  // todos de dash.getAll() (lista tipicamente pequena, não precisa de
  // paginação server-side como as telas com milhares de registros).
  const [fTitulo,   setFTitulo]   = useState('')
  const [fTipo,     setFTipo]     = useState('')
  const [fPagina,   setFPagina]   = useState(1)
  const [fPorPagina, setFPorPagina] = useState(25)
  const [fPainelAberto, setFPainelAberto] = useState(true)
  const [showConsulta, setShowConsulta] = useState(false)
  const isRO = mode === 'view'
  const typeRef  = useRef(null)
  const colorPickerRef = useRef(null)
  const layoutContainerRef = useRef(null)

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
      .then(res => {
        const lista = res.ok ? res.data : []
        setWidgets(lista)
        setLoading(false)
        // Abre direto no último registro, em modo consulta — mesmo padrão
        // pedido para Despesas de Viagem (viagens/index.jsx), evita cair
        // sempre na aba Acesso vazia sem nada selecionado.
        if (lista.length > 0) {
          const ultimo = lista[lista.length - 1]
          setSelected(ultimo.id)
          setForm(formFromWidget(ultimo))
          setActiveTab('geral')
        }
      })
      .catch(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (newTrigger > 0) handleIncluir()
  }, [newTrigger])

  useEffect(() => {
    if (!typeOpen) return
    function handler(e) {
      if (typeRef.current && !typeRef.current.contains(e.target)) setTypeOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [typeOpen])

  function formFromWidget(w) {
    return {
      codigo:       w.codigo       || '',
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
      cores_series:       w.cores_series        || {},
    }
  }

  // Consulta (view): clicar num widget da lista só abre pra visualização,
  // campos bloqueados — padrão do resto do sistema (FormToolbar), não
  // edição direta.
  function openView(w) {
    setSelected(w.id)
    setMode('view')
    setForm(formFromWidget(w))
    resetPreview()
    setShowGuide(false)
    setActiveTab('geral')
  }

  // Navegação « ‹ N/total › » no rodapé — mesmo padrão de Arquivos.jsx/
  // viagens/index.jsx — percorre a lista completa de widgets (não a
  // filtrada da aba Acesso), ordem estável independente do filtro ativo.
  function navTo(idx) {
    if (idx < 0 || idx >= widgets.length) return
    openView(widgets[idx])
  }
  const currentIdx = selected && selected !== 'new' ? widgets.findIndex(w => w.id === selected) : -1

  // Modal Pesquisa Padrão — mesmo padrão de Arquivos.jsx: botão "Consultar"
  // do FormToolbar abre busca rápida sobre a lista completa, em vez de só
  // trocar para a aba Acesso.
  function abrirConsulta() {
    setShowConsulta(true)
  }
  function selecionarDaConsulta(w) {
    openView(w)
    setShowConsulta(false)
  }

  // Preview otimista do próximo código — mesmo padrão de Arquivos.jsx: só
  // feedback visual imediato, o valor real vem do backend via nextval() no
  // insert (dash:create).
  function previewNextCodigo() {
    const max = widgets.reduce((m, w) => Math.max(m, parseInt(w.codigo || '0', 10)), 0)
    return String(max + 1).padStart(4, '0')
  }

  function handleIncluir() {
    setSelected('new')
    setMode('new')
    const pos = nextPos(widgets)
    setForm({ ...emptyForm(), codigo: previewNextCodigo(), grid_x: pos.x, grid_y: pos.y })
    resetPreview()
    setShowGuide(false)
    setActiveTab('geral')
  }

  function handleAlterar() {
    if (selected === 'new' || !selected) return
    setMode('edit')
  }

  function resetPreview() {
    setPreviewRows(null); setPreviewFields([]); setPreviewErr(null)
    setPrevPreviewRows(null); setPrevPreviewFields([]); setPrevPreviewErr(null)
  }

  function f(key, val) {
    if (key === 'tipo') {
      const meta = TIPOS.find(t => t.value === val)
      setForm(prev => ({ ...prev, tipo: val, grid_w: meta?.defW ?? prev.grid_w, grid_h: meta?.defH ?? prev.grid_h, cores_series: {} }))
      resetPreview(); setShowGuide(false)
      return
    }
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleGravar() {
    if (!form.titulo.trim()) return
    setSaving(true)
    try {
      if (mode === 'new') {
        // form.grid_x/grid_y já refletem a posição escolhida pelo usuário na
        // aba "Layout" (ou a posição livre default, se ele nem abriu a aba).
        const res = await window.api.dash.create(form)
        if (!res.ok) return
        setSelected(res.data.id)
      } else {
        await window.api.dash.update({ id: selected, ...form })
      }
      const res = await window.api.dash.getAll()
      if (res.ok) setWidgets(res.data)
      window.dispatchEvent(new Event('dash:widgets-changed'))
      setMode('view')
    } finally {
      setSaving(false)
    }
  }

  function handleDesistir() {
    if (mode === 'new') {
      setSelected(null)
      setForm(emptyForm())
      setActiveTab('acesso')
    } else {
      const w = widgets.find(x => x.id === selected)
      if (w) setForm(formFromWidget(w))
    }
    resetPreview()
    setMode('view')
  }

  // Grid de layout arrastável (aba "Layout") — mesmo padrão da aba Dashboard:
  // usuário arrasta/redimensiona livremente, sem botões de +1/-1 posição.
  useEffect(() => {
    if (activeTab !== 'layout' || !layoutContainerRef.current) return
    const el = layoutContainerRef.current
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width
      if (w) setLayoutW(w)
    })
    ro.observe(el)
    setLayoutW(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [activeTab])

  const layoutItems = useMemo(() => {
    const items = widgets
      .filter(w => w.id !== selected)
      .map(w => ({ i: String(w.id), x: w.grid_x ?? 0, y: w.grid_y ?? 0, w: w.grid_w ?? 3, h: w.grid_h ?? 2, minW: 2, minH: 1 }))
    if (selected === 'new' || selected) {
      items.push({ i: selected === 'new' ? 'new' : String(selected), x: form.grid_x ?? 0, y: form.grid_y ?? 0, w: form.grid_w, h: form.grid_h, minW: 2, minH: 1 })
    }
    return items
  }, [widgets, selected, form.grid_x, form.grid_y, form.grid_w, form.grid_h])

  function handleLayoutChange(newLayout) {
    const mine = newLayout.find(it => it.i === (selected === 'new' ? 'new' : String(selected)))
    if (mine) {
      setForm(prev => ({ ...prev, grid_x: mine.x, grid_y: mine.y, grid_w: mine.w, grid_h: mine.h }))
    }
    // Widgets já salvos: persiste posição/tamanho na hora — igual à aba
    // Dashboard — sem exigir clicar em "Salvar" pra cada arrasto.
    const outros = newLayout.filter(it => it.i !== 'new' && it.i !== String(selected))
    if (outros.length) {
      window.api.dash.updateLayout(
        outros.map(it => ({ i: Number(it.i), x: it.x, y: it.y, w: it.w, h: it.h }))
      ).then(() => {
        setWidgets(prev => prev.map(w => {
          const found = outros.find(it => Number(it.i) === w.id)
          return found ? { ...w, grid_x: found.x, grid_y: found.y, grid_w: found.w, grid_h: found.h } : w
        }))
        window.dispatchEvent(new Event('dash:widgets-changed'))
      }).catch(() => {})
    }
  }

  async function handleExcluir() {
    if (selected === 'new' || !selected || deleting) return
    const w = widgets.find(x => x.id === selected)
    if (!w) return
    if (!(await notificar.confirmar(`Excluir o widget "${w.titulo || '(sem título)'}"?`, { titulo: 'Excluir widget', confirmarLabel: 'Excluir', perigo: true }))) return
    setDeleting(selected)
    try {
      await window.api.dash.delete(selected)
      setWidgets(prev => prev.filter(x => x.id !== selected))
      setSelected(null)
      setMode('view')
      setForm(emptyForm())
      resetPreview()
      setActiveTab('acesso')
      window.dispatchEvent(new Event('dash:widgets-changed'))
    } finally {
      setDeleting(null)
    }
  }

  // Excluir a partir do ícone de lixeira na lista lateral (não depende de
  // estar selecionado/em consulta) — continua fora do fluxo do FormToolbar.
  async function handleExcluirDaLista(id) {
    if (deleting) return
    const w = widgets.find(x => x.id === id)
    if (!w) return
    if (!(await notificar.confirmar(`Excluir o widget "${w.titulo || '(sem título)'}"?`, { titulo: 'Excluir widget', confirmarLabel: 'Excluir', perigo: true }))) return
    setDeleting(id)
    try {
      await window.api.dash.delete(id)
      setWidgets(prev => prev.filter(x => x.id !== id))
      if (selected === id) { setSelected(null); setMode('view'); setForm(emptyForm()); resetPreview() }
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
    finally     { setTesting(false); setActiveTab('resultado') }
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


  const guide     = SQL_GUIDE[form.tipo]
  const sqlHint    = SQL_HINTS[form.tipo]
  const tipoAtual  = TIPOS.find(t => t.value === form.tipo)

  function limparFiltros() {
    setFTitulo(''); setFTipo(''); setFPagina(1)
  }

  // Filtro/paginação client-side — widgets já vêm todos de dash.getAll(),
  // lista tipicamente pequena (dezenas, não milhares de registros).
  const widgetsFiltrados = widgets.filter(w => {
    if (fTitulo && !(w.titulo || '').toLowerCase().includes(fTitulo.toLowerCase())) return false
    if (fTipo && w.tipo !== fTipo) return false
    return true
  })
  const totalPaginas = Math.max(1, Math.ceil(widgetsFiltrados.length / fPorPagina))
  const paginaAtual = Math.min(fPagina, totalPaginas)
  const widgetsPagina = widgetsFiltrados.slice((paginaAtual - 1) * fPorPagina, paginaAtual * fPorPagina)

  return (
    <div className="page-with-footer">

      {/* Tab bar — mesmo padrão do resto do sistema, só que com mais abas:
          Acesso (lista/filtro/paginação) + as 4 abas do formulário do
          widget selecionado, todas irmãs (docs/PADRAO_TELAS.md). */}
      <div className="page-tabs">
        <button className={`page-tab${activeTab === 'acesso' ? ' active' : ''}`} onClick={() => setActiveTab('acesso')}>Acesso</button>
        <button className={`page-tab${activeTab === 'geral' ? ' active' : ''}`} onClick={() => selected && setActiveTab('geral')} disabled={!selected}>Cadastro</button>
        <button className={`page-tab${activeTab === 'resultado' ? ' active' : ''}`} onClick={() => selected && setActiveTab('resultado')} disabled={!selected}>Resultado</button>
        <button className={`page-tab${activeTab === 'layout' ? ' active' : ''}`} onClick={() => selected && setActiveTab('layout')} disabled={!selected}>Layout</button>
        {selected && selected !== 'new' && isRO && activeTab !== 'acesso' && (
          <span className="page-tab-info">{form.codigo || '----'} · {form.titulo || '(sem título)'}</span>
        )}
        {selected && mode !== 'view' && (
          <span className="page-tab-info" style={{ color:'var(--or)' }}>
            {mode === 'new' ? '● Novo widget' : '● Editando'}
          </span>
        )}
        <div style={{ marginLeft:'auto', display:'flex', gap:6, alignItems:'center' }}>
          <button className="btn btn-ghost" onClick={handleSeedDemo} disabled={seeding || clearingDemo}
            style={{ height:28, fontSize:11, padding:'0 10px' }}>
            {seeding ? <RefreshCw size={12} style={{ animation:'spin .7s linear infinite' }} /> : <Database size={12} />}
            Popular demo
          </button>
          <button className="btn btn-ghost" onClick={handleClearDemo} disabled={seeding || clearingDemo}
            style={{ height:28, fontSize:11, padding:'0 10px' }}>
            {clearingDemo ? <RefreshCw size={12} style={{ animation:'spin .7s linear infinite' }} /> : <Trash2 size={12} />}
            Limpar demo
          </button>
        </div>
      </div>

      <div className="page-content">

        {/* ════ ABA ACESSO ════ */}
        {activeTab === 'acesso' && (
          <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, gap:10 }}>
            {demoMsg && (
              <div style={{ fontSize:11, color: demoMsg.ok ? 'var(--t3)' : '#F87171' }}>{demoMsg.texto}</div>
            )}

            {/* Painel de filtros, retrátil — mesmo padrão de Arquivos.jsx/
                viagens/index.jsx (cabeçalho "Filtros" clicável + collapse). */}
            <div style={{ border:'1px solid var(--bd)', borderRadius:10, background:'var(--s1)', boxShadow:'var(--sh-xs)', overflow:'hidden', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', cursor:'pointer', userSelect:'none' }}
                onClick={() => setFPainelAberto(a => !a)}>
                <SlidersHorizontal size={13} color="var(--t2)" />
                <span style={{ fontSize:12, fontWeight:600, color:'var(--t1)' }}>Filtros</span>
                {(fTitulo || fTipo) && (
                  <span style={{ fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:10, background:'var(--or3)', color:'var(--or)' }}>ativo</span>
                )}
                <div style={{ flex:1 }} />
                {(fTitulo || fTipo) && (
                  <button type="button" className="btn btn-ghost" style={{ height:24, padding:'0 8px', fontSize:11 }}
                    onClick={e => { e.stopPropagation(); limparFiltros() }}>
                    <RotateCcw size={11} /> Limpar
                  </button>
                )}
                {fPainelAberto ? <ChevronUp size={13} color="var(--t3)" /> : <ChevronDown size={13} color="var(--t3)" />}
              </div>

              {fPainelAberto && (
                <div style={{ padding:'4px 14px 14px', borderTop:'1px solid var(--bd)', paddingTop:12 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10 }}>
                    <div>
                      <label style={{ fontSize:10, fontWeight:600, color:'var(--t3)', textTransform:'uppercase', letterSpacing:.4, display:'block', marginBottom:4 }}>Título</label>
                      <input className="form-input" style={{ height:32, fontSize:12, padding:'0 8px', width:'100%' }}
                        value={fTitulo} onChange={e => { setFTitulo(e.target.value); setFPagina(1) }} placeholder="filtrar por título..." autoFocus />
                    </div>
                    <div>
                      <label style={{ fontSize:10, fontWeight:600, color:'var(--t3)', textTransform:'uppercase', letterSpacing:.4, display:'block', marginBottom:4 }}>Tipo</label>
                      <select className="form-select" style={{ height:32, fontSize:12, padding:'0 8px', width:'100%' }}
                        value={fTipo} onChange={e => { setFTipo(e.target.value); setFPagina(1) }}>
                        <option value="">Todos</option>
                        {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[...Array(4)].map((_,i) => <div key={i} className="skel" style={{ height:44, borderRadius:7 }} />)}
              </div>
            ) : widgets.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'var(--t3)', border:'1px solid var(--bd)', borderRadius:10, background:'var(--s1)' }}>
                <LayoutGrid size={26} style={{ opacity:.4, marginBottom:8 }} />
                <div style={{ fontSize:13 }}>Nenhum widget ainda. Clique em "Incluir" para criar o primeiro.</div>
              </div>
            ) : (
              <div style={{ border:'1px solid var(--bd)', borderRadius:10, overflow:'hidden', background:'var(--s1)', display:'flex', flexDirection:'column', flex:1, minHeight:0 }}>
                <div style={{ overflowX:'auto', overflowY:'auto', flex:1, minHeight:100 }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', background:'var(--s1)' }}>
                    <thead style={{ position:'sticky', top:0, zIndex:1 }}>
                      <tr>
                        <th style={thS}>Widget</th>
                        <th style={thS}>Tipo</th>
                        <th style={{ ...thS, textAlign:'center' }}>Tamanho</th>
                        <th style={{ ...thS, textAlign:'center' }}>Auto-atualização</th>
                      </tr>
                    </thead>
                    <tbody>
                      {widgetsPagina.map(w => {
                        const meta = TIPOS.find(t => t.value === w.tipo)
                        return (
                          <tr key={w.id}
                            onClick={() => openView(w)}
                            style={{ cursor:'pointer', background: selected === w.id ? 'var(--or4)' : 'var(--s1)' }}
                            onMouseEnter={e => { if (selected !== w.id) e.currentTarget.style.background = 'var(--s2)' }}
                            onMouseLeave={e => { if (selected !== w.id) e.currentTarget.style.background = 'var(--s1)' }}
                          >
                            <td style={tdS}>
                              <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                                <span style={{ width:24, height:24, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:(w.cor||'#FF6B2B')+'26' }}>
                                  <LucideIcon name={w.icone_lucide || meta?.icon || 'bar-chart-2'} size={12} color={w.cor || '#FF6B2B'} />
                                </span>
                                <span style={{ color: selected === w.id ? 'var(--or)' : 'var(--t1)', fontWeight:600 }}>{w.titulo || '(sem título)'}</span>
                              </span>
                            </td>
                            <td style={tdS}>{meta?.label || w.tipo}</td>
                            <td style={{ ...tdS, textAlign:'center', fontVariantNumeric:'tabular-nums' }}>{w.grid_w || 3}×{w.grid_h || 2}</td>
                            <td style={{ ...tdS, textAlign:'center' }}>{w.intervalo > 0 ? `${w.intervalo}s` : '—'}</td>
                          </tr>
                        )
                      })}
                      {widgetsPagina.length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign:'center', padding:'32px', color:'var(--t3)', fontSize:11, fontStyle:'italic' }}>Nenhum widget encontrado.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginacaoBar pagina={paginaAtual} totalPaginas={totalPaginas} total={widgetsFiltrados.length} porPagina={fPorPagina}
                  onPagina={setFPagina} onPorPagina={n => { setFPorPagina(n); setFPagina(1) }} />
              </div>
            )}
          </div>
        )}

        {/* ════ ABAS DO FORMULÁRIO (Geral / Query SQL / Resultado / Layout) ════ */}
        {activeTab !== 'acesso' && !selected && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:14, color:'var(--t3)' }}>
            <LucideIcon name="layout-dashboard" size={48} />
            <div style={{ fontSize:13, textAlign:'center', lineHeight:1.8 }}>
              Selecione um widget na aba Acesso<br/>ou clique em <strong style={{ color:'var(--t2)' }}>Incluir</strong>
            </div>
          </div>
        )}
        {activeTab !== 'acesso' && selected && (
          <>
            {/* Painel do formulário — a navegação entre Geral/Query/Resultado/
                Layout já é feita pela page-tabs principal (activeTab); o
                breadcrumb "#id · título" já fica na própria tab bar. */}
            <div style={{ flex:1, minHeight:0, overflowY:'auto' }}>

              {/* GERAL (Cadastro) — grid de campos soltos, sem cards de seção,
                  mesmo padrão de FormBuilderView.jsx: repeat(auto-fill,
                  minmax(220px,1fr)), gap 14, label 10px, campo 36-38px. */}
              {activeTab === 'geral' && (
                <div style={{ paddingBottom:24, display:'flex', flexDirection:'column', gap:14 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:14 }}>
                    <div>
                      <FieldLabel>Código</FieldLabel>
                      <div className="form-input" style={{ width:80, fontSize:13, fontWeight:700, letterSpacing:1.5, display:'flex', alignItems:'center', justifyContent:'center', height:37, cursor:'default', color: form.codigo ? 'var(--or)' : 'var(--t3)', fontFamily:'monospace' }}>
                        {form.codigo || ''}
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Título</FieldLabel>
                      <input
                        className="form-input"
                        value={form.titulo}
                        onChange={e => f('titulo', e.target.value)}
                        placeholder="Título do widget"
                        disabled={isRO}
                      />
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:14 }}>
                    <div style={{ position:'relative', gridColumn:'span 2' }} ref={typeRef}>
                      <FieldLabel>Tipo de visualização</FieldLabel>
                      <div
                        onClick={() => { if (!isRO) setTypeOpen(v => !v) }}
                        className="form-input"
                        style={{
                          display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
                          cursor: isRO ? 'default' : 'pointer', userSelect:'none',
                          borderRadius: typeOpen ? '10px 10px 0 0' : undefined,
                        }}
                      >
                        <span style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                          <LucideIcon name={tipoAtual?.icon || 'hash'} size={13} color={form.cor || '#FF6B2B'} />
                          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tipoAtual?.label}</span>
                        </span>
                        {!isRO && <ChevronDown size={13} style={{ color:'var(--t3)', flexShrink:0, transition:'transform .15s', transform: typeOpen ? 'rotate(180deg)' : 'none' }} />}
                      </div>

                      {!isRO && typeOpen && (
                        <div style={{ position:'absolute', zIndex:300, left:0, right:0, maxHeight:320, overflowY:'auto', padding:6, background:'var(--s1)', border:'1px solid var(--bd)', borderTop:'none', borderRadius:'0 0 10px 10px', boxShadow:'0 8px 28px rgba(0,0,0,.35)' }}>
                          {TIPOS.map(t => {
                            const active = form.tipo === t.value
                            return (
                              <div
                                key={t.value}
                                onClick={() => { f('tipo', t.value); setTypeOpen(false) }}
                                style={{
                                  display:'flex', alignItems:'center', gap:9, padding:'7px 8px', borderRadius:7, cursor:'pointer',
                                  background: active ? 'var(--or4)' : 'transparent',
                                }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--s3)' }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                              >
                                <LucideIcon name={t.icon} size={13} color={active ? 'var(--or)' : 'var(--t2)'} />
                                <span style={{ fontSize:12, fontWeight:500, color: active ? 'var(--or)' : 'var(--t1)', flex:1 }}>{t.label}</span>
                                {active && <Check size={13} style={{ color:'var(--or)', flexShrink:0 }} />}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
                        <FieldLabel style={{ marginBottom:0 }}>Ícone (Lucide)</FieldLabel>
                        <a href="https://lucide.dev/icons/" target="_blank" rel="noreferrer"
                          style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, color:'var(--or)', textDecoration:'none', opacity:.8 }}>
                          <ExternalLink size={10} /> ver todos
                        </a>
                      </div>
                      <div style={{ display:'flex', gap:6 }}>
                        <div style={{ width:34, height:34, flexShrink:0, background:'var(--or3)', border:'1px solid rgba(255,107,43,.15)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <LucideIcon name={form.icone_lucide || 'image-off'} size={15} color={form.cor || '#FF6B2B'} />
                        </div>
                        <input
                          className="form-input"
                          value={form.icone_lucide || ''}
                          onChange={e => f('icone_lucide', e.target.value)}
                          placeholder="layout, bar-chart-2..."
                          disabled={isRO}
                          autoComplete="off"
                        />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Auto-atualização</FieldLabel>
                      <select
                        className="form-select"
                        value={form.intervalo}
                        onChange={e => f('intervalo', Number(e.target.value))}
                        disabled={isRO}
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
                        disabled={isRO}
                      >
                        <option value="numero">Número</option>
                        <option value="moeda">Moeda (R$)</option>
                        <option value="percentual">Percentual (%)</option>
                      </select>
                    </div>

                    <div style={{ gridColumn:'1 / -1' }}>
                      <FieldLabel>Cor de destaque</FieldLabel>
                      <div style={{ display:'flex', gap:6 }}>
                        {PALETA.slice(0, 35).map(c => {
                          const active = form.cor?.toLowerCase() === c.toLowerCase()
                          return (
                            <button
                              key={c}
                              onClick={() => f('cor', c)}
                              disabled={isRO}
                              title={c}
                              style={{
                                width:28, height:28, borderRadius:7, cursor: isRO ? 'default' : 'pointer',
                                background:c, flexShrink:0,
                                border: `2px solid ${active ? 'var(--t1)' : 'transparent'}`,
                                opacity: isRO && !active ? .5 : 1,
                              }}
                            />
                          )
                        })}
                        <div style={{ position:'relative' }}>
                          <button
                            onClick={() => { if (!isRO) colorPickerRef.current?.click() }}
                            disabled={isRO}
                            title="Escolher cor personalizada"
                            style={{
                              width:28, height:28, borderRadius:7, cursor: isRO ? 'default' : 'pointer', flexShrink:0,
                              border: `2px solid ${!PALETA.slice(0, 35).some(c => c.toLowerCase() === form.cor?.toLowerCase()) ? 'var(--t1)' : 'transparent'}`,
                              background: !PALETA.slice(0, 35).some(c => c.toLowerCase() === form.cor?.toLowerCase())
                                ? form.cor
                                : 'conic-gradient(from 180deg, #FF6B2B, #FBD24C, #4ADE80, #22D3EE, #A78BFA, #F472B6, #FF6B2B)',
                            }}
                          />
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
                    </div>
                  </div>

                  {/* Query SQL — migrada pra dentro de Cadastro (item pedido:
                      "aba ficou vazia demais separada"). */}
                  <div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:9 }}>
                      <FieldLabel style={{ marginBottom:0 }}>Query SQL</FieldLabel>
                      <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                        {!isRO && !form.sql_query && sqlHint && (
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
                              {!isRO && (
                                <button
                                  onClick={() => { f('sql_query', ex.sql); setShowGuide(false) }}
                                  style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'var(--or)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}
                                >
                                  <Copy size={9} />Usar este
                                </button>
                              )}
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
                        disabled={isRO}
                        style={{ width:'100%', height:'clamp(180px, calc(100vh - 620px), 320px)', fontFamily:'Cascadia Code, Consolas, monospace', fontSize:13, resize:'vertical', lineHeight:1.7, background:'transparent', border:'none', padding:18 }}
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

                  <label style={{
                    display:'flex', alignItems:'center', gap:10, color:'var(--t2)', fontSize:12, cursor: isRO ? 'default' : 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={form.comparar_anterior}
                      onChange={e => f('comparar_anterior', e.target.checked)}
                      disabled={isRO}
                      style={{ width:15, height:15, cursor: isRO ? 'default' : 'pointer', flexShrink:0, accentColor:'var(--or)' }}
                    />
                    Comparar com período anterior
                  </label>

                  {form.comparar_anterior && (
                    <div>
                      <FieldLabel>Query SQL — período anterior</FieldLabel>
                      <div style={{ fontSize:10, color:'var(--t3)', marginBottom:6, lineHeight:1.5 }}>
                        Mesmo formato de colunas da query principal, referente ao período anterior.
                      </div>
                      <textarea
                        className="form-textarea"
                        value={form.sql_query_anterior}
                        onChange={e => { f('sql_query_anterior', e.target.value); setPrevPreviewRows(null); setPrevPreviewFields([]); setPrevPreviewErr(null) }}
                        placeholder="SELECT ... (mesmo formato, período anterior)"
                        spellCheck={false}
                        disabled={isRO}
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
              )}

              {/* RESULTADO */}
              {activeTab === 'resultado' && (
                <div style={{ paddingBottom:24, display:'flex', flexDirection:'column', gap:16 }}>
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

                      {(() => {
                        // Barra/linha/etc: cada COLUNA (exceto a 1ª, que é o label do
                        // eixo) vira uma série. Pizza/funil/treemap: cada LINHA vira
                        // uma fatia, usando o valor da 1ª coluna como nome/chave — exceto
                        // "Rio temático", cuja categoria/série é a 2ª coluna, não a 1ª.
                        const porLinha = TIPOS_COR_POR_LINHA.has(form.tipo)
                        const colChave = form.tipo === 'theme_river' ? previewFields[1] : previewFields[0]
                        const chaves = porLinha
                          ? [...new Set(previewRows.map(r => String(r[colChave] ?? '')))]
                          : previewFields.slice(1)
                        if (chaves.length < 2) return null
                        return (
                          <SecCard icon={<Palette size={14} />} title="Cor por série">
                            <div style={{ fontSize:11, color:'var(--t3)', marginBottom:12 }}>
                              {porLinha
                                ? 'Cada valor vira uma fatia/item — escolha a cor de cada um.'
                                : 'Cada coluna extra vira uma série — a 1ª cor é a de "Aparência" acima; as demais podem ser personalizadas aqui.'}
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                              {chaves.map((k, i) => {
                                const atual = form.cores_series?.[k] || (i === 0 && !porLinha ? form.cor : PALETA[i % PALETA.length])
                                return (
                                  <div key={k} style={{ display:'flex', alignItems:'center', gap:10 }}>
                                    <label style={{ position:'relative', width:24, height:24, borderRadius:6, flexShrink:0, cursor: isRO ? 'default' : 'pointer', background:atual, border:'1px solid var(--bd2)' }}>
                                      <input
                                        type="color"
                                        value={atual}
                                        onChange={e => f('cores_series', { ...form.cores_series, [k]: e.target.value })}
                                        disabled={isRO}
                                        style={{ position:'absolute', opacity:0, width:'100%', height:'100%', cursor: isRO ? 'default' : 'pointer' }}
                                      />
                                    </label>
                                    <span style={{ fontSize:12.5, color:'var(--t1)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{k.replace(/_/g,' ')}</span>
                                    {!isRO && form.cores_series?.[k] && (
                                      <button
                                        onClick={() => { const n = { ...form.cores_series }; delete n[k]; f('cores_series', n) }}
                                        title="Restaurar cor padrão"
                                        style={{ background:'none', border:'none', color:'var(--t3)', cursor:'pointer', padding:2, display:'flex' }}
                                      >
                                        <X size={12} />
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </SecCard>
                        )
                      })()}

                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, fontSize:12, color:'var(--t2)', fontWeight:700 }}>
                          <Check size={14} />
                          Assim vai aparecer no card do Dashboard
                        </div>
                        <div className="dash-hud dash-widget-card" style={{ borderRadius:10, overflow:'hidden', maxWidth:460, '--wc': form.cor || '#FF6B2B' }}>
                          <div className="dash-widget-header" style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 14px' }}>
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

              {/* LAYOUT */}
              {activeTab === 'layout' && (
                <div style={{ paddingBottom:24, display:'flex', flexDirection:'column', gap:14 }}>
                  <div style={{ fontSize:12, color:'var(--t3)', lineHeight:1.6 }}>
                    Arraste pelo cabeçalho e redimensione pelo canto inferior direito — igual à aba Dashboard.
                    O card em destaque é o widget {selected === 'new' ? 'que está sendo criado' : 'selecionado'}.
                  </div>
                  <div ref={layoutContainerRef} style={{ background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:10, padding:14, minHeight:400 }}>
                    <GridLayout
                      layout={layoutItems}
                      cols={12}
                      rowHeight={56}
                      width={layoutW}
                      draggableHandle=".layout-drag-handle"
                      resizeHandles={['se']}
                      isDraggable={!isRO}
                      isResizable={!isRO}
                      onLayoutChange={handleLayoutChange}
                      margin={[10, 10]}
                      containerPadding={[0, 0]}
                    >
                      {layoutItems.map(item => {
                        const isNovo = item.i === 'new'
                        const isMine = isNovo || item.i === String(selected)
                        const w = isMine ? null : widgets.find(x => String(x.id) === item.i)
                        const tipo = isMine ? form.tipo : w?.tipo
                        const meta = TIPOS.find(t => t.value === tipo)
                        const titulo = isMine ? (form.titulo || (isNovo ? 'Novo widget' : '(sem título)')) : (w?.titulo || '(sem título)')
                        const cor = isMine ? form.cor : (w?.cor || '#FF6B2B')
                        return (
                          <div key={item.i} style={{
                            display:'flex', flexDirection:'column', height:'100%', overflow:'hidden',
                            borderRadius:8, border: isMine ? `1.5px solid ${cor}` : '1px solid var(--bd)',
                            background: isMine ? `${cor}14` : 'var(--s2)',
                            boxShadow: isMine ? `0 0 0 3px ${cor}22` : 'none',
                          }}>
                            <div className="layout-drag-handle" style={{
                              display:'flex', alignItems:'center', gap:7, padding:'8px 10px', cursor:'grab', flexShrink:0,
                              borderBottom:'1px solid var(--bd)', background: isMine ? 'transparent' : 'var(--s3)',
                            }}>
                              <LucideIcon name={meta?.icon || 'hash'} size={12} color={cor} />
                              <span style={{ flex:1, fontSize:11, fontWeight:600, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {titulo}
                              </span>
                              <span style={{ fontSize:9.5, color:'var(--t3)', fontVariantNumeric:'tabular-nums' }}>{item.w}×{item.h}</span>
                            </div>
                            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'var(--t3)' }}>
                              {meta?.label}
                            </div>
                          </div>
                        )
                      })}
                    </GridLayout>
                  </div>
                  {mode !== 'view' && (
                    <div style={{ fontSize:11, color:'var(--t3)' }}>
                      Posição escolhida é aplicada ao clicar em "Gravar".
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {activeTab !== 'acesso' && (
        <FormToolbar
          mode={mode}
          nav={{ currentIdx, total: widgets.length, onNav: navTo }}
          temRegistros={!!selected && selected !== 'new'}
          saving={saving}
          onIncluir={handleIncluir}
          onAlterar={selected && selected !== 'new' ? handleAlterar : undefined}
          onExcluir={selected && selected !== 'new' ? handleExcluir : undefined}
          onConsultar={abrirConsulta}
          onGravar={handleGravar}
          onDesistir={handleDesistir}
        />
      )}

      {/* Modal Pesquisa Padrão */}
      {showConsulta && (
        <PesquisaPadraoModal
          titulo="Pesquisa Padrão · dash_001"
          campos={CAMPOS_BUSCA_DASH}
          colunasExibidas={CAMPOS_BUSCA_DASH}
          campoInicial="titulo"
          onBuscar={async (campo, modo, busca) => {
            const q = (busca || '').toLowerCase().trim()
            const filtrar = v => !q || String(v ?? '').toLowerCase().includes(q)
            const registros = widgets.filter(w => filtrar(w.codigo) || filtrar(w.titulo) || filtrar(w.tipo))
            return { registros, total: registros.length }
          }}
          onSelecionar={selecionarDaConsulta}
          onFechar={() => setShowConsulta(false)}
          renderCelula={(r, c) => {
            if (c.nome_campo === 'tipo') return TIPOS.find(t => t.value === r.tipo)?.label || r.tipo
            return String(r[c.nome_campo] ?? '')
          }}
        />
      )}
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

// Mesmo padrão de renderLabel() em FormBuilderView.jsx — fonte pequena,
// pouco espaço abaixo, sem letterSpacing/uppercase agressivos.
function FieldLabel({ children, style }) {
  return (
    <label className="form-label" style={{ display:'block', marginBottom:2, fontSize:10, ...style }}>
      {children}
    </label>
  )
}
