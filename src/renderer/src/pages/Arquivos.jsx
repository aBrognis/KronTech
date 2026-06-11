import { useState, useEffect, useRef } from 'react'
import {
  Star, Search, FolderOpen, File, FileText, FileImage, FileCode,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  Plus, Save, X, Trash2, Edit2, RotateCcw, ExternalLink, Upload,
  Settings, FolderInput, CheckCircle2, XCircle, Loader2,
  Download, Clipboard, Check,
} from 'lucide-react'
import '../App.css'

// ── Constantes ────────────────────────────────────────────────────────────────
const CATEGORIAS = ['Contrato', 'Manual', 'Financeiro', 'Relatório', 'Script', 'Imagem', 'Apresentação', 'Outro']

const MODOS_BUSCA = [
  { val: 'contendo',  label: 'Contém'  },
  { val: 'iniciando', label: 'Inicia'  },
  { val: 'igual',     label: 'Igual'   },
]

const CAMPOS_BUSCA = [
  { val: 'codigo',    label: 'Código'    },
  { val: 'nome',      label: 'Nome'      },
  { val: 'categoria', label: 'Categoria' },
  { val: 'pasta',     label: 'Pasta'     },
  { val: 'tags',      label: 'Tags'      },
  { val: 'arquivo_ext', label: 'Extensão' },
]

const MODOS_MODAL = [
  { val: 'iniciando', label: 'Iniciando'               },
  { val: 'contendo',  label: 'Contendo a(s) Palavra(s)' },
  { val: 'igual',     label: 'Igual'                   },
]

// extensões que abrimos com preview interno
const PREVIEW_IMG = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg']
const PREVIEW_PDF = ['pdf']

const EMPTY = {
  nome: '', categoria: 'Outro', tags: '', pasta: '', descricao: '', favorito: false,
  arquivo_nome: '', arquivo_path: '', arquivo_ext: '', arquivo_tamanho: 0, codigo: '',
}

function filtrarStr(val = '', busca, modo) {
  if (!busca.trim()) return true
  const v = val.toLowerCase(), q = busca.toLowerCase().trim()
  if (modo === 'iniciando') return v.startsWith(q)
  if (modo === 'igual')     return v === q
  return v.includes(q)
}

function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3)  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

function ExtIcon({ ext, size = 16 }) {
  if (PREVIEW_IMG.includes(ext)) return <FileImage size={size} />
  if (PREVIEW_PDF.includes(ext)) return <FileText   size={size} />
  if (['sql', 'fr3', 'pas', 'js', 'ts', 'jsx', 'tsx', 'py', 'txt', 'ini', 'css', 'html'].includes(ext))
    return <FileCode size={size} />
  return <File size={size} />
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Arquivos({ newTrigger }) {
  const [items, setItems]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState('cadastro')
  const [mode, setMode]             = useState('view')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [form, setForm]             = useState(EMPTY)
  const [saving, setSaving]         = useState(false)
  const [erro, setErro]             = useState(null)
  const [pastas, setPastas]         = useState([])

  // Preview
  const [preview, setPreview]       = useState(null) // { tipo: 'img'|'pdf', path, nome }

  // Modal Pesquisa Padrão
  const [showConsulta, setShowConsulta] = useState(false)
  const [mCampo,       setMCampo]       = useState('nome')
  const [mOrdem,       setMOrdem]       = useState('asc')
  const [mModo,        setMModo]        = useState('contendo')
  const [mBusca,       setMBusca]       = useState('')
  const [mResultados,  setMResultados]  = useState([])
  const [mSelId,       setMSelId]       = useState(null)
  const mBuscaRef = useRef(null)

  // Filtros aba Acesso
  const [fCategoria, setFCategoria] = useState('Todos')
  const [fPasta,     setFPasta]     = useState('Todos')
  const [fBusca,     setFBusca]     = useState('')
  const [resultados, setResultados] = useState(null)

  const [pastaAtual,  setPastaAtual]  = useState('')

  // Import em massa
  const [importando,   setImportando]   = useState(false)
  const [importProg,   setImportProg]   = useState({ fase: '', atual: 0, total: 0, arquivo: '', inseridos: 0, ignorados: 0 })

  const prevTrigger = useRef(0)

  useEffect(() => {
    loadAll()
    window.api.config.get().then(cfg => setPastaAtual(cfg?.Caminhos?.arquivos || ''))
  }, [])
  useEffect(() => {
    if (newTrigger > prevTrigger.current) {
      prevTrigger.current = newTrigger
      handleIncluir()
    }
  }, [newTrigger])

  async function loadAll() {
    setLoading(true)
    try {
      const [data, ps] = await Promise.all([
        window.api.arquivos.getAll(),
        window.api.arquivos.getPastas(),
      ])
      setItems(data)
      setPastas(ps)
      if (data.length > 0) { setCurrentIdx(0); loadForm(data[0]) }
    } catch (err) { setErro('Erro ao carregar: ' + (err?.message ?? String(err))) }
    finally { setLoading(false) }
  }

  function loadForm(item) {
    setForm({
      nome:            item.nome            ?? '',
      categoria:       item.categoria       ?? 'Outro',
      tags:            item.tags            ?? '',
      pasta:           item.pasta           ?? '',
      descricao:       item.descricao       ?? '',
      favorito:        item.favorito        ?? false,
      arquivo_nome:    item.arquivo_nome    ?? '',
      arquivo_path:    item.arquivo_path    ?? '',
      arquivo_ext:     item.arquivo_ext     ?? '',
      arquivo_tamanho: item.arquivo_tamanho ?? 0,
      codigo:          item.codigo          ?? '',
    })
  }

  function navTo(idx) {
    if (items.length === 0) return
    const c = Math.max(0, Math.min(items.length - 1, idx))
    setCurrentIdx(c); loadForm(items[c]); setErro(null)
  }

  function previewNextCodigo() {
    const max = items.reduce((m, i) => Math.max(m, parseInt(i.codigo || '0', 10)), 0)
    return String(max + 1).padStart(3, '0')
  }

  // ── Ações ─────────────────────────────────────────────────────────────────
  function handleIncluir() {
    setForm({ ...EMPTY, codigo: previewNextCodigo() })
    setMode('new'); setActiveTab('cadastro'); setErro(null)
  }

  function handleAlterar() {
    if (items.length === 0) return
    loadForm(items[currentIdx])
    setMode('edit'); setActiveTab('cadastro'); setErro(null)
  }

  async function handleExcluir() {
    if (items.length === 0) return
    const item = items[currentIdx]
    if (!confirm(`Excluir "${item.nome}"?\nO arquivo em disco também será removido.`)) return
    await window.api.arquivos.delete(item.id)
    const updated = items.filter(i => i.id !== item.id)
    setItems(updated)
    if (updated.length > 0) {
      const ni = Math.min(currentIdx, updated.length - 1)
      setCurrentIdx(ni); loadForm(updated[ni])
    } else { setCurrentIdx(0); setForm({ ...EMPTY }) }
    setMode('view')
  }

  async function handleSelecionarArquivo() {
    const info = await window.api.arquivos.selecionar()
    if (!info) return
    setForm(f => ({
      ...f,
      arquivo_nome:    info.nome,
      arquivo_path:    info.path,
      arquivo_ext:     info.ext,
      arquivo_tamanho: info.tamanho,
      nome: f.nome || info.nome,
    }))
  }

  async function handleGravar() {
    if (!form.nome.trim())         { setErro('Nome é obrigatório.'); return }
    if (mode === 'new' && !form.arquivo_path) { setErro('Selecione um arquivo.'); return }
    setSaving(true); setErro(null)
    try {
      if (mode === 'new') {
        const created = await window.api.arquivos.create({
          ...form,
          arquivo_path_origem: form.arquivo_path,
        })
        const updated = [created, ...items]
        setItems(updated); setCurrentIdx(0); loadForm(created)
        setPastas(await window.api.arquivos.getPastas())
      } else {
        const item = items[currentIdx]
        const upd  = await window.api.arquivos.update({ id: item.id, ...form })
        const updated = items.map(i => i.id === item.id ? upd : i)
        setItems(updated); loadForm(upd)
      }
      setMode('view')
    } catch (err) { setErro('Erro ao salvar: ' + (err?.message ?? String(err))) }
    finally { setSaving(false) }
  }

  function handleDesistir() {
    if (items.length > 0 && currentIdx < items.length) loadForm(items[currentIdx])
    else setForm({ ...EMPTY })
    setMode('view'); setErro(null)
  }

  async function handleAbrir(item) {
    const r = await window.api.arquivos.abrir(item.arquivo_path)
    if (!r.ok) setErro(r.erro || 'Não foi possível abrir o arquivo.')
  }

  function handlePreview(item) {
    const ext = item.arquivo_ext?.toLowerCase()
    if (PREVIEW_IMG.includes(ext)) setPreview({ tipo: 'img', path: item.arquivo_path, nome: item.nome })
    else if (PREVIEW_PDF.includes(ext)) setPreview({ tipo: 'pdf', path: item.arquivo_path, nome: item.nome })
    else handleAbrir(item)
  }

  // ── Consulta Acesso ───────────────────────────────────────────────────────
  function executarConsulta() {
    const q = fBusca.toLowerCase().trim()
    let list = [...items]
    if (fCategoria !== 'Todos') list = list.filter(i => i.categoria === fCategoria)
    if (fPasta     !== 'Todos') list = list.filter(i => i.pasta     === fPasta)
    if (q) list = list.filter(i => filtrarStr(i.nome, q, 'contendo') || filtrarStr(i.tags, q, 'contendo'))
    setResultados(list)
  }

  function limparFiltros() {
    setFCategoria('Todos'); setFPasta('Todos'); setFBusca(''); setResultados(null)
  }

  function selecionarDaConsulta(item) {
    const idx = items.findIndex(i => i.id === item.id)
    if (idx >= 0) { setCurrentIdx(idx); loadForm(item); setMode('view'); setActiveTab('cadastro') }
    setShowConsulta(false)
  }

  // ── Modal Pesquisa Padrão ─────────────────────────────────────────────────
  function rodarConsultaModal(campo, ordem, modo, busca) {
    let list = [...items]
    if (busca.trim()) list = list.filter(i => filtrarStr(String(i[campo] ?? ''), busca, modo))
    list.sort((a, b) => {
      const va = String(a[campo] ?? '').toLowerCase()
      const vb = String(b[campo] ?? '').toLowerCase()
      return ordem === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
    setMResultados(list)
    const curId = items[currentIdx]?.id
    setMSelId(list.find(i => i.id === curId) ? curId : (list[0]?.id ?? null))
  }

  function abrirConsulta() {
    const campo = 'nome', ordem = 'asc', modo = 'contendo', busca = ''
    setMCampo(campo); setMOrdem(ordem); setMModo(modo); setMBusca(busca)
    rodarConsultaModal(campo, ordem, modo, busca)
    setShowConsulta(true)
    setTimeout(() => mBuscaRef.current?.focus(), 60)
  }

  async function handleImportarPasta() {
    setImportando(true)
    setImportProg({ fase: 'escaneando', atual: 0, total: 0, arquivo: 'Iniciando...', inseridos: 0, ignorados: 0 })
    const unsub = window.api.arquivos.onProgresso(prog => {
      setImportProg(prog)
      if (prog.fase === 'concluido' || prog.fase === 'cancelado' || prog.fase === 'erro') {
        unsub()
      }
    })
    const res = await window.api.arquivos.importarPasta()
    if (res?.cancelado || !res?.ok) { unsub(); if (!res?.ok && res?.erro) setErro(res.erro) }
    if (res?.ok && res?.fase !== 'cancelado') await loadAll()
  }

  async function handleConfigurarPasta() {
    const nova = await window.api.config.selecionarPasta()
    if (nova) { setPastaAtual(nova); alert(`Pasta atualizada:\n${nova}\n\nO sistema usará este caminho para novos arquivos importados.`) }
  }

  const [copiado, setCopiado] = useState(null) // 'local' | 'clip' | null

  async function handleCopiarLocal(item) {
    const r = await window.api.arquivos.copiarLocal(item.arquivo_path, item.arquivo_nome)
    if (!r.ok) { setErro(r.erro || 'Não foi possível copiar o arquivo.'); return }
    setCopiado('local')
    setTimeout(() => setCopiado(null), 3000)
    // mostra onde foi copiado — abre a pasta temp
    if (confirm(`Arquivo copiado para:\n${r.destino}\n\nAbrir a pasta?`)) {
      const pasta = r.destino.substring(0, r.destino.lastIndexOf('\\'))
      await window.api.arquivos.abrirPasta(pasta)
    }
  }

  async function handleCopiarClipboard(item) {
    const r = await window.api.arquivos.copiarClipboard(item.arquivo_path)
    if (!r.ok) { setErro(r.erro || 'Não foi possível copiar.'); return }
    setCopiado('clip')
    setTimeout(() => setCopiado(null), 2000)
  }

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const isRO       = mode === 'view'
  const currentItem = items[currentIdx]

  // estilos de tabela
  const thS = { padding: '7px 12px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1.2, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)', background: 'var(--s1)', textAlign: 'left', whiteSpace: 'nowrap' }
  const tdS = { padding: '7px 12px', fontSize: 11.5, color: 'var(--t2)', borderBottom: '1px solid var(--bd)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 220 }

  return (
    <div className="page-with-footer">

      {/* ── Tab bar ── */}
      <div className="page-tabs">
        <button className={`page-tab${activeTab === 'acesso'   ? ' active' : ''}`} onClick={() => setActiveTab('acesso')}>Acesso</button>
        <button className={`page-tab${activeTab === 'cadastro' ? ' active' : ''}`} onClick={() => setActiveTab('cadastro')}>Cadastro</button>
        {currentItem && isRO && activeTab === 'cadastro' && (
          <span className="page-tab-info">{currentItem.nome}</span>
        )}
        {mode !== 'view' && (
          <span className="page-tab-info" style={{ color: 'var(--or)' }}>
            {mode === 'new' ? '● Novo registro' : '● Editando'}
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="btn btn-ghost" onClick={handleImportarPasta}
            style={{ height: 28, fontSize: 11, padding: '0 10px' }}>
            <FolderInput size={12} /> Importar Pasta
          </button>
          <button className="btn btn-ghost" onClick={handleConfigurarPasta}
            title={`Pasta atual: ${pastaAtual}`}
            style={{ height: 28, fontSize: 11, padding: '0 10px' }}>
            <Settings size={12} />
            {pastaAtual
              ? <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{pastaAtual}</span>
              : 'Pasta'}
          </button>
        </div>
      </div>

      <div className="page-content">

        {/* ════ ABA ACESSO ════ */}
        {activeTab === 'acesso' && (
          <>
            {/* Barra de filtros + botão Consultar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', pointerEvents: 'none' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 30, height: 34 }}
                  placeholder="Buscar por nome ou tags..."
                  value={fBusca}
                  onChange={e => setFBusca(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && executarConsulta()}
                  autoFocus
                />
              </div>
              <select className="form-select" style={{ width: 150, height: 34 }} value={fCategoria} onChange={e => setFCategoria(e.target.value)}>
                <option value="Todos">Todas categorias</option>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
              <select className="form-select" style={{ width: 130, height: 34 }} value={fPasta} onChange={e => setFPasta(e.target.value)}>
                <option value="Todos">Todas as pastas</option>
                {pastas.map(p => <option key={p}>{p}</option>)}
              </select>
              <button className="btn btn-primary" style={{ height: 34, padding: '0 14px', flexShrink: 0 }} onClick={executarConsulta}>
                <Search size={13} /> Consultar
              </button>
              <button className="btn btn-ghost" style={{ height: 34, padding: '0 10px', flexShrink: 0 }} onClick={limparFiltros} title="Limpar">
                <RotateCcw size={13} />
              </button>
            </div>

            {/* Estado inicial — aguardando consulta */}
            {resultados === null && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)' }}>
                <FolderOpen size={32} strokeWidth={1.25} style={{ marginBottom: 10, opacity: .4 }} />
                <div style={{ fontSize: 13 }}>Configure os filtros e clique em Consultar</div>
              </div>
            )}

            {/* Tabela de resultados */}
            {resultados !== null && (
              <div style={{ border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--sh-xs)' }}>
                <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 270px)', minHeight: 100 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th style={{ ...thS, width: 18, padding: '7px 0 7px 8px' }}></th>
                        <th style={{ ...thS, textAlign: 'center', width: 36 }}>#</th>
                        <th style={{ ...thS, textAlign: 'center', width: 60 }}>Código</th>
                        <th style={{ ...thS, width: '33%' }}>Nome</th>
                        <th style={thS}>Categoria</th>
                        <th style={thS}>Pasta</th>
                        <th style={{ ...thS, textAlign: 'center' }}>Ext.</th>
                        <th style={thS}>Tamanho</th>
                        <th style={{ ...thS, textAlign: 'center' }}>Fav.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultados.map((r, ri) => {
                        const isCur = items[currentIdx]?.id === r.id
                        return (
                          <tr key={r.id}
                            onDoubleClick={() => selecionarDaConsulta(r)}
                            onClick={() => { const idx = items.findIndex(i => i.id === r.id); if (idx >= 0) { setCurrentIdx(idx); loadForm(r) } }}
                            style={{ cursor: 'pointer', background: isCur ? 'rgba(255,107,43,.06)' : ri % 2 !== 0 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                            onMouseEnter={e => { if (!isCur) e.currentTarget.style.background = 'var(--s3)' }}
                            onMouseLeave={e => { if (!isCur) e.currentTarget.style.background = ri % 2 !== 0 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                          >
                            <td style={{ padding: '7px 0 7px 8px', width: 18, color: 'var(--or)', fontSize: 13, fontWeight: 700 }}>
                              {isCur ? '›' : ''}
                            </td>
                            <td style={{ ...tdS, textAlign: 'center', color: 'var(--t3)', fontSize: 10, width: 36 }}>{ri + 1}</td>
                            <td style={{ ...tdS, textAlign: 'center', fontFamily: 'monospace', fontWeight: 600, fontSize: 11, width: 60 }}>{r.codigo || '—'}</td>
                            <td style={{ ...tdS, color: 'var(--t1)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <ExtIcon ext={r.arquivo_ext} size={13} />{r.nome}
                            </td>
                            <td style={tdS}>{r.categoria || '—'}</td>
                            <td style={tdS}>{r.pasta || '—'}</td>
                            <td style={{ ...tdS, textAlign: 'center', fontFamily: 'monospace', fontSize: 11, textTransform: 'uppercase' }}>{r.arquivo_ext || '—'}</td>
                            <td style={tdS}>{fmtSize(r.arquivo_tamanho)}</td>
                            <td style={{ ...tdS, textAlign: 'center' }}>
                              {r.favorito ? <Star size={12} fill="var(--or)" color="var(--or)" /> : <span style={{ color: 'var(--bd2)' }}>—</span>}
                            </td>
                          </tr>
                        )
                      })}
                      {resultados.length === 0 && (
                        <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)', fontSize: 11, fontStyle: 'italic' }}>Nenhum arquivo encontrado</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '6px 12px', borderTop: '1px solid var(--bd)', background: 'var(--s1)', fontSize: 10, color: 'var(--t3)' }}>
                  Total: <strong style={{ color: 'var(--t2)' }}>{resultados.length}</strong>
                </div>
              </div>
            )}
          </>
        )}

        {/* ════ ABA CADASTRO ════ */}
        {activeTab === 'cadastro' && (
          <>
            {erro && (
              <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(239,68,68,.4)', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#F87171' }}>{erro}</div>
            )}
            {loading && <div style={{ color: 'var(--t3)', fontSize: 12, padding: '40px 0', textAlign: 'center' }}>Carregando...</div>}

            {!loading && items.length === 0 && isRO && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)' }}>
                <FolderOpen size={40} strokeWidth={1.25} style={{ marginBottom: 12, opacity: .5 }} />
                <div style={{ fontSize: 13, marginBottom: 8 }}>Nenhum arquivo cadastrado</div>
                <div style={{ fontSize: 11 }}>Clique em Incluir no rodapé para adicionar.</div>
              </div>
            )}

            {!loading && (items.length > 0 || !isRO) && (
              <div className="script-form-layout">

                {/* ── Coluna esquerda ── */}
                <div className="script-form-left">

                  {/* Linha 1: Código + Categoria */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Código</label>
                      <div className="form-input" style={{ width: 80, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 37, cursor: 'default', color: form.codigo ? 'var(--or)' : 'var(--t3)', fontFamily: 'monospace' }}>
                        {form.codigo || '—'}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Categoria</label>
                      <select className="form-select" value={form.categoria} onChange={e => setField('categoria', e.target.value)} disabled={isRO}>
                        {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pasta Virtual</label>
                      {isRO
                        ? <input className="form-input" value={form.pasta || '—'} disabled />
                        : <input className="form-input" placeholder="ex: Contratos, Manuais..." value={form.pasta} onChange={e => setField('pasta', e.target.value)} list="pastas-list" />
                      }
                      <datalist id="pastas-list">{pastas.map(p => <option key={p} value={p} />)}</datalist>
                    </div>
                  </div>

                  {/* Nome */}
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label">Nome *</label>
                    <input className="form-input" placeholder="Nome descritivo do arquivo..." value={form.nome} onChange={e => setField('nome', e.target.value)} disabled={isRO} autoFocus={!isRO} />
                  </div>

                  {/* Arquivo */}
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label">Arquivo</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div className="form-input" style={{ flex: 1, height: 37, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s1)', cursor: 'default', fontSize: 12, color: form.arquivo_nome ? 'var(--t1)' : 'var(--t3)' }}>
                        <ExtIcon ext={form.arquivo_ext} size={14} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {form.arquivo_nome || 'Nenhum arquivo selecionado'}
                        </span>
                        {form.arquivo_tamanho > 0 && (
                          <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>{fmtSize(form.arquivo_tamanho)}</span>
                        )}
                      </div>
                      {!isRO && mode === 'new' && (
                        <button className="btn btn-ghost" style={{ flexShrink: 0 }} onClick={handleSelecionarArquivo}>
                          <Upload size={13} /> Selecionar
                        </button>
                      )}
                      {isRO && form.arquivo_path && (
                        <>
                          <button className="btn btn-ghost" style={{ flexShrink: 0 }} onClick={() => handlePreview(currentItem)} title="Abrir arquivo">
                            <ExternalLink size={13} /> Abrir
                          </button>
                          <button className="btn btn-ghost" style={{ flexShrink: 0 }} onClick={() => handleCopiarLocal(currentItem)} title="Copia para C:\KronTech\temp">
                            <Download size={13} /> Copiar Local
                          </button>
                          <button className="btn btn-ghost" style={{ flexShrink: 0 }} onClick={() => handleCopiarClipboard(currentItem)} title="Copiar arquivo para área de transferência (Ctrl+C)">
                            {copiado === 'clip' ? <Check size={13} color="var(--green)" /> : <Clipboard size={13} />}
                            {copiado === 'clip' ? 'Copiado!' : 'Copiar'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label">Tags <span style={{ color: 'var(--t3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(vírgula)</span></label>
                    <input className="form-input" placeholder="contrato, 2024, cliente-x" value={form.tags} onChange={e => setField('tags', e.target.value)} disabled={isRO} />
                  </div>

                  {/* Favorito */}
                  <div style={{ marginBottom: 14 }}>
                    <label className="fav-check" style={{ pointerEvents: isRO ? 'none' : 'auto' }}>
                      <input type="checkbox" checked={form.favorito} onChange={e => setField('favorito', e.target.checked)} disabled={isRO} />
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>Marcar como favorito <Star size={12} /></span>
                    </label>
                  </div>
                </div>

                {/* ── Coluna direita ── */}
                <div className="script-form-right">
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label">Descrição / Observações</label>
                    <textarea className="form-textarea" rows={6} placeholder="Notas sobre o arquivo..." value={form.descricao} onChange={e => setField('descricao', e.target.value)} disabled={isRO} style={{ resize: isRO ? 'none' : 'vertical' }} />
                  </div>

                  {/* Info do arquivo */}
                  {form.arquivo_nome && (
                    <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Informações do Arquivo</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {[
                          ['Nome original', form.arquivo_nome],
                          ['Extensão',      form.arquivo_ext?.toUpperCase() || '—'],
                          ['Tamanho',       fmtSize(form.arquivo_tamanho)],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                            <span style={{ color: 'var(--t3)' }}>{k}</span>
                            <span style={{ color: 'var(--t1)', fontWeight: 500, fontFamily: k === 'Extensão' ? 'monospace' : 'inherit' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}


                  {currentItem && isRO && (
                    <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 14 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className="form-group">
                          <label className="form-label">Criado em</label>
                          <div className="form-input" style={{ fontSize: 11, display: 'flex', alignItems: 'center', height: 37, background: 'var(--s1)', cursor: 'default' }}>{fmtDate(currentItem.dt_criacao)}</div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Atualizado em</label>
                          <div className="form-input" style={{ fontSize: 11, display: 'flex', alignItems: 'center', height: 37, background: 'var(--s1)', cursor: 'default' }}>{fmtDate(currentItem.dt_atualizacao)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal Importação em Massa ── */}
      {importando && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14, boxShadow: 'var(--sh-lg)', width: 520, maxWidth: '94vw', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Título */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {importProg.fase === 'concluido'
                ? <CheckCircle2 size={22} color="var(--green)" />
                : importProg.fase === 'cancelado'
                  ? <XCircle size={22} color="var(--red)" />
                  : importProg.fase === 'erro'
                    ? <XCircle size={22} color="var(--red)" />
                    : <Loader2 size={22} color="var(--or)" style={{ animation: 'spin 1s linear infinite' }} />
              }
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>
                  {importProg.fase === 'escaneando' && 'Escaneando arquivos...'}
                  {importProg.fase === 'importando' && 'Importando arquivos...'}
                  {importProg.fase === 'concluido'  && 'Importação concluída!'}
                  {importProg.fase === 'cancelado'  && 'Importação cancelada'}
                  {importProg.fase === 'erro'       && 'Erro na importação'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                  {importProg.total > 0 ? `${importProg.total.toLocaleString('pt-BR')} arquivos encontrados` : 'Aguarde...'}
                </div>
              </div>
            </div>

            {/* Barra de progresso */}
            {importProg.total > 0 && (
              <div>
                <div style={{ height: 8, background: 'var(--s3)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, (importProg.atual / importProg.total) * 100)}%`,
                    background: importProg.fase === 'concluido' ? 'var(--green)' : importProg.fase === 'cancelado' ? 'var(--red)' : 'var(--or)',
                    borderRadius: 99,
                    transition: 'width .2s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: 'var(--t3)' }}>
                  <span>{importProg.atual.toLocaleString('pt-BR')} de {importProg.total.toLocaleString('pt-BR')}</span>
                  <span>{Math.round((importProg.atual / importProg.total) * 100)}%</span>
                </div>
              </div>
            )}

            {/* Arquivo atual */}
            {importProg.arquivo && importProg.fase === 'importando' && (
              <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {importProg.arquivo}
              </div>
            )}

            {/* Counters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Inseridos',  val: importProg.inseridos,  cor: 'var(--green)' },
                { label: 'Ignorados',  val: importProg.ignorados,  cor: 'var(--t3)'    },
              ].map(({ label, val, cor }) => (
                <div key={label} style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: cor, fontVariantNumeric: 'tabular-nums' }}>
                    {(val || 0).toLocaleString('pt-BR')}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: .8 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {(importProg.fase === 'importando' || importProg.fase === 'escaneando') && (
                <button className="btn btn-danger" onClick={() => window.api.arquivos.cancelarImport()}>
                  <X size={13} /> Cancelar
                </button>
              )}
              {(importProg.fase === 'concluido' || importProg.fase === 'cancelado' || importProg.fase === 'erro') && (
                <button className="btn btn-primary" onClick={() => { setImportando(false); loadAll() }}>
                  <CheckCircle2 size={13} /> Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Pesquisa Padrão ── */}
      {showConsulta && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)' }}>
          <div
            style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14, boxShadow: 'var(--sh-lg)', width: 860, maxWidth: '96vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onKeyDown={e => {
              if (e.key === 'Escape') setShowConsulta(false)
              if (e.key === 'Enter') { const item = mResultados.find(i => i.id === mSelId); if (item) selecionarDaConsulta(item) }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', background: 'var(--s2)', borderBottom: '1px solid var(--bd)', boxShadow: 'var(--hi)' }}>
              <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--t1)' }}>Pesquisa Padrão — ARQ_001</span>
              <button onClick={() => setShowConsulta(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 2 }}><X size={15} /></button>
            </div>

            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bd)', background: 'var(--s3)', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t2)', whiteSpace: 'nowrap', minWidth: 26 }}>Por:</label>
                  <select className="form-select" style={{ flex: 1, height: 30, fontSize: 12 }} value={mCampo} onChange={e => { const v = e.target.value; setMCampo(v); rodarConsultaModal(v, mOrdem, mModo, mBusca) }}>
                    {CAMPOS_BUSCA.map(c => <option key={c.val} value={c.val}>{c.label}</option>)}
                  </select>
                  <select className="form-select" style={{ width: 124, height: 30, fontSize: 12 }} value={mOrdem} onChange={e => { const v = e.target.value; setMOrdem(v); rodarConsultaModal(mCampo, v, mModo, mBusca) }}>
                    <option value="asc">Crescente</option>
                    <option value="desc">Decrescente</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t2)', whiteSpace: 'nowrap', minWidth: 46 }}>Buscar:</label>
                  <input ref={mBuscaRef} className="form-input" style={{ flex: 1, height: 30, fontSize: 12 }} value={mBusca}
                    onChange={e => { const v = e.target.value; setMBusca(v); rodarConsultaModal(mCampo, mOrdem, mModo, v) }}
                    placeholder="Digite para filtrar..." />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ border: '1px solid var(--bd)', borderRadius: 10, padding: '8px 14px', background: 'var(--s1)', boxShadow: 'var(--sh-xs)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>Buscar</div>
                  {MODOS_MODAL.map(m => (
                    <label key={m.val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11.5, color: mModo === m.val ? 'var(--t1)' : 'var(--t3)', fontWeight: mModo === m.val ? 600 : 400, userSelect: 'none', marginBottom: 3 }}>
                      <input type="radio" checked={mModo === m.val} onChange={() => { setMModo(m.val); rodarConsultaModal(mCampo, mOrdem, m.val, mBusca) }} style={{ accentColor: 'var(--or)', cursor: 'pointer' }} />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ ...thS, width: 18, padding: '7px 0 7px 8px' }}></th>
                    <th style={{ ...thS, textAlign: 'center', width: 36 }}>#</th>
                    <th style={{ ...thS, textAlign: 'center', width: 60 }}>Código</th>
                    <th style={{ ...thS, width: '34%' }}>Nome</th>
                    <th style={thS}>Categoria</th>
                    <th style={thS}>Pasta</th>
                    <th style={{ ...thS, textAlign: 'center' }}>Ext.</th>
                    <th style={thS}>Tamanho</th>
                    <th style={{ ...thS, textAlign: 'center' }}>Fav.</th>
                  </tr>
                </thead>
                <tbody>
                  {mResultados.map((r, ri) => {
                    const isSel = mSelId === r.id
                    return (
                      <tr key={r.id} onClick={() => setMSelId(r.id)} onDoubleClick={() => selecionarDaConsulta(r)}
                        style={{ cursor: 'pointer', background: isSel ? 'rgba(255,107,43,.06)' : ri % 2 !== 0 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--s3)' }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = ri % 2 !== 0 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                      >
                        <td style={{ padding: '7px 0 7px 8px', width: 18, color: 'var(--or)', fontSize: 13, fontWeight: 700 }}>
                          {isSel ? '›' : ''}
                        </td>
                        <td style={{ ...tdS, textAlign: 'center', color: 'var(--t3)', fontSize: 10, width: 36 }}>{ri + 1}</td>
                        <td style={{ ...tdS, textAlign: 'center', fontFamily: 'monospace', fontWeight: 600, fontSize: 11, width: 60 }}>{r.codigo || '—'}</td>
                        <td style={{ ...tdS, color: 'var(--t1)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}><ExtIcon ext={r.arquivo_ext} size={12} />{r.nome}</td>
                        <td style={tdS}>{r.categoria || '—'}</td>
                        <td style={tdS}>{r.pasta || '—'}</td>
                        <td style={{ ...tdS, textAlign: 'center', fontFamily: 'monospace', fontSize: 11, textTransform: 'uppercase' }}>{r.arquivo_ext || '—'}</td>
                        <td style={tdS}>{fmtSize(r.arquivo_tamanho)}</td>
                        <td style={{ ...tdS, textAlign: 'center' }}>
                          {r.favorito ? <Star size={12} fill="var(--or)" color="var(--or)" /> : <span style={{ color: 'var(--bd2)' }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                  {mResultados.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)', fontSize: 11, fontStyle: 'italic' }}>Nenhum registro encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderTop: '1px solid var(--bd)', background: 'var(--s3)' }}>
              <button className="btn btn-primary" onClick={() => { const item = mResultados.find(i => i.id === mSelId); if (item) selecionarDaConsulta(item) }} disabled={!mSelId}><Search size={13} /> Confirmar</button>
              <button className="btn btn-ghost"   onClick={() => setShowConsulta(false)}><X size={13} /> Fechar</button>
              <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 4 }}>
                {mResultados.length} arquivo{mResultados.length !== 1 ? 's' : ''}
                {mSelId ? ' — Enter ou duplo clique para abrir' : ' — selecione uma linha'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Preview ── */}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setPreview(null) }}>
          <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14, boxShadow: 'var(--sh-lg)', width: '90vw', height: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', background: 'var(--s2)', borderBottom: '1px solid var(--bd)', flexShrink: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview.nome}</span>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button className="btn btn-ghost" onClick={() => handleAbrir({ arquivo_path: preview.path })}><ExternalLink size={13} /> Abrir externamente</button>
                <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 2 }}><X size={15} /></button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 8 }}>
              {preview.tipo === 'img' && (
                <img src={`file://${preview.path}`} alt={preview.nome} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
              )}
              {preview.tipo === 'pdf' && (
                <iframe src={`file://${preview.path}`} style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }} title={preview.nome} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Rodapé ── */}
      <div className="page-footer">
        <div className="page-footer-nav">
          <button className="page-footer-nav-btn" onClick={() => navTo(0)} disabled={currentIdx <= 0 || items.length === 0} title="Primeiro"><ChevronsLeft size={13} /></button>
          <button className="page-footer-nav-btn" onClick={() => navTo(currentIdx - 1)} disabled={currentIdx <= 0} title="Anterior"><ChevronLeft size={13} /></button>
          <span className="page-footer-counter">{items.length > 0 ? `${currentIdx + 1} / ${items.length}` : '0 / 0'}</span>
          <button className="page-footer-nav-btn" onClick={() => navTo(currentIdx + 1)} disabled={currentIdx >= items.length - 1} title="Próximo"><ChevronRight size={13} /></button>
          <button className="page-footer-nav-btn" onClick={() => navTo(items.length - 1)} disabled={currentIdx >= items.length - 1 || items.length === 0} title="Último"><ChevronsRight size={13} /></button>
        </div>

        <div style={{ width: 1, height: 22, background: 'var(--bd)', flexShrink: 0 }} />

        <div className="page-footer-actions">
          {activeTab === 'cadastro' && (
            isRO ? (
              <>
                <button className="btn btn-primary" onClick={handleIncluir}><Plus size={13} /> Incluir</button>
                <button className="btn btn-ghost"   onClick={handleAlterar} disabled={items.length === 0}><Edit2 size={13} /> Alterar</button>
                <button className="btn btn-danger"  onClick={handleExcluir} disabled={items.length === 0}><Trash2 size={13} /> Excluir</button>
                <button className="btn btn-ghost"   onClick={abrirConsulta}><Search size={13} /> Consultar</button>
              </>
            ) : (
              <>
                <button className="btn btn-primary" onClick={handleGravar} disabled={saving}><Save size={13} /> {saving ? 'Salvando...' : 'Gravar'}</button>
                <button className="btn btn-ghost"   onClick={handleDesistir}><X size={13} /> Desistir</button>
              </>
            )
          )}
        </div>
      </div>
    </div>
  )
}
