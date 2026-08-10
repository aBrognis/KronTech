import { useState, useEffect, useRef } from 'react'
import {
  Star, Search, FolderOpen, File, FileText, FileImage, FileCode,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  Plus, Save, X, Trash2, Edit2, RotateCcw, ExternalLink, Upload,
  Settings, FolderInput, CheckCircle2, XCircle, Loader2,
  Download, Clipboard, Check, SlidersHorizontal, ChevronDown, ChevronUp,
} from 'lucide-react'
import '../App.css'
import { thS, tdS } from './formBuilderView/gridStyles.js'
import PaginacaoBar from './formBuilderView/PaginacaoBar.jsx'
import PesquisaPadraoModal from '../components/PesquisaPadraoModal.jsx'

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

const COLUNAS_MODAL_ARQUIVOS = [
  { nome_campo: 'codigo',          label: 'Código'    },
  { nome_campo: 'nome',            label: 'Nome'       },
  { nome_campo: 'categoria',       label: 'Categoria'  },
  { nome_campo: 'pasta',           label: 'Pasta'      },
  { nome_campo: 'arquivo_ext',     label: 'Ext.'       },
  { nome_campo: 'arquivo_tamanho', label: 'Tamanho'    },
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

  // Filtros aba Acesso (server-side, paginado — só roda ao clicar Buscar)
  const [fCategoria,  setFCategoria]  = useState('')
  const [fPasta,      setFPasta]      = useState('')
  const [fNome,       setFNome]       = useState('')
  const [fTags,       setFTags]       = useState('')
  const [fPainelAberto, setFPainelAberto] = useState(true)
  const [fResultados, setFResultados] = useState(null) // { registros, total, totalPaginas } | null
  const [fLoading,    setFLoading]    = useState(false)
  const [fPagina,     setFPagina]     = useState(1)
  const [fPorPagina,  setFPorPagina]  = useState(50)
  const [fOrdenar,    setFOrdenar]    = useState('dt_criacao')
  const [fDirecao,    setFDirecao]    = useState('DESC')

  const [pastaAtual,  setPastaAtual]  = useState('')

  // Import em massa
  const [importando,   setImportando]   = useState(false)
  const [importProg,   setImportProg]   = useState({ fase: '', atual: 0, total: 0, arquivo: '', inseridos: 0, ignorados: 0 })

  const prevTrigger = useRef(0)

  useEffect(() => {
    loadAll()
    window.api.config.get().then(res => setPastaAtual((res.ok ? res.data?.Caminhos?.arquivos : '') || ''))
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
      const [resItems, resPastas] = await Promise.all([
        window.api.arquivos.getAll(),
        window.api.arquivos.getPastas(),
      ])
      if (!resItems.ok) throw new Error(resItems.erro)
      if (!resPastas.ok) throw new Error(resPastas.erro)
      const data = resItems.data
      setItems(data)
      setPastas(resPastas.data)
      if (data.length > 0) { const last = data.length - 1; setCurrentIdx(last); loadForm(data[last]) }
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
    const res = await window.api.arquivos.selecionar()
    const info = res.ok ? res.data : null
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
        const resCreate = await window.api.arquivos.create({
          ...form,
          arquivo_path_origem: form.arquivo_path,
        })
        if (!resCreate.ok) throw new Error(resCreate.erro)
        const created = resCreate.data
        const updated = [...items, created]
        setItems(updated); setCurrentIdx(updated.length - 1); loadForm(created)
        const resPastas = await window.api.arquivos.getPastas()
        if (resPastas.ok) setPastas(resPastas.data)
      } else {
        const item = items[currentIdx]
        const resUpdate = await window.api.arquivos.update({ id: item.id, ...form })
        if (!resUpdate.ok) throw new Error(resUpdate.erro)
        const upd = resUpdate.data
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

  // ── Consulta Acesso (server-side, paginado) ─────────────────────────────────
  async function executarConsultaAcesso(overrides = {}) {
    setFLoading(true)
    try {
      const res = await window.api.arquivos.listarFiltrado({
        nome: overrides.fNome ?? fNome,
        categoria: overrides.fCategoria ?? fCategoria,
        pasta: overrides.fPasta ?? fPasta,
        tags: overrides.fTags ?? fTags,
        pagina: overrides.fPagina ?? fPagina,
        porPagina: overrides.fPorPagina ?? fPorPagina,
        ordenar: overrides.fOrdenar !== undefined ? overrides.fOrdenar : fOrdenar,
        direcao: overrides.fDirecao ?? fDirecao,
      })
      if (!res.ok) throw new Error(res.erro)
      setFResultados(res.data)
    } catch {
      setFResultados({ registros: [], total: 0, pagina: 1, porPagina: fPorPagina, totalPaginas: 1 })
    } finally {
      setFLoading(false)
    }
  }

  function handleBuscarAcesso() {
    setFPagina(1)
    executarConsultaAcesso({ fPagina: 1 })
  }

  // Só limpa os campos — mantém os registros já exibidos, sem reconsultar.
  function limparFiltros() {
    setFCategoria(''); setFPasta(''); setFNome(''); setFTags('')
  }

  function irParaPaginaAcesso(p) {
    const max = fResultados?.totalPaginas || 1
    const alvo = Math.max(1, Math.min(max, p))
    setFPagina(alvo)
    executarConsultaAcesso({ fPagina: alvo })
  }

  function mudarPorPaginaAcesso(n) {
    setFPorPagina(n)
    setFPagina(1)
    executarConsultaAcesso({ fPorPagina: n, fPagina: 1 })
  }

  function setOrdenacaoAcesso(campo) {
    const novaDir = fOrdenar === campo && fDirecao === 'ASC' ? 'DESC' : 'ASC'
    setFOrdenar(campo)
    setFDirecao(novaDir)
    executarConsultaAcesso({ fOrdenar: campo, fDirecao: novaDir })
  }

  function selecionarDaConsulta(item) {
    const idx = items.findIndex(i => i.id === item.id)
    if (idx >= 0) { setCurrentIdx(idx); loadForm(item); setMode('view'); setActiveTab('cadastro') }
    setShowConsulta(false)
  }

  // ── Modal Pesquisa Padrão ─────────────────────────────────────────────────
  function abrirConsulta() {
    setShowConsulta(true)
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
    if (res?.ok && !res?.cancelado) await loadAll()
  }

  async function handleConfigurarPasta() {
    const res = await window.api.config.selecionarPasta()
    const nova = res.ok ? res.data : null
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
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 10 }}>
            {/* Painel de filtros, retrátil */}
            <div style={{ border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setFPainelAberto(a => !a)}>
                <SlidersHorizontal size={13} color="var(--t2)" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Filtros</span>
                {(fCategoria || fPasta || fNome || fTags) && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: 'var(--or3)', color: 'var(--or)' }}>ativo</span>
                )}
                <div style={{ flex: 1 }} />
                {(fCategoria || fPasta || fNome || fTags) && (
                  <button type="button" className="btn btn-ghost" style={{ height: 24, padding: '0 8px', fontSize: 11 }}
                    onClick={e => { e.stopPropagation(); limparFiltros() }}>
                    <RotateCcw size={11} /> Limpar
                  </button>
                )}
                {fPainelAberto ? <ChevronUp size={13} color="var(--t3)" /> : <ChevronDown size={13} color="var(--t3)" />}
              </div>

              {fPainelAberto && (
                <div style={{ padding: '4px 14px 14px', borderTop: '1px solid var(--bd)', paddingTop: 12 }}
                  onKeyDown={e => e.key === 'Enter' && handleBuscarAcesso()}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .4, display: 'block', marginBottom: 4 }}>Nome</label>
                      <input className="form-input" style={{ height: 32, fontSize: 12, padding: '0 8px', width: '100%' }}
                        value={fNome} onChange={e => setFNome(e.target.value)} placeholder="filtrar por nome..." autoFocus />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .4, display: 'block', marginBottom: 4 }}>Categoria</label>
                      <select className="form-select" style={{ height: 32, fontSize: 12, padding: '0 8px', width: '100%' }}
                        value={fCategoria} onChange={e => setFCategoria(e.target.value)}>
                        <option value="">Todas</option>
                        {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .4, display: 'block', marginBottom: 4 }}>Pasta</label>
                      <select className="form-select" style={{ height: 32, fontSize: 12, padding: '0 8px', width: '100%' }}
                        value={fPasta} onChange={e => setFPasta(e.target.value)}>
                        <option value="">Todas</option>
                        {pastas.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .4, display: 'block', marginBottom: 4 }}>Tags</label>
                      <input className="form-input" style={{ height: 32, fontSize: 12, padding: '0 8px', width: '100%' }}
                        value={fTags} onChange={e => setFTags(e.target.value)} placeholder="filtrar por tag..." />
                    </div>
                  </div>
                  <button type="button" className="btn btn-primary" style={{ height: 32, padding: '0 16px' }}
                    onClick={handleBuscarAcesso} disabled={fLoading}>
                    <Search size={13} /> {fLoading ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              )}
            </div>

            {/* Estado inicial — aguardando consulta */}
            {fResultados === null ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)', border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)' }}>
                <div style={{ fontSize: 13 }}>Configure os filtros (opcional) e clique em Buscar</div>
              </div>
            ) : (
              <div style={{ border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden', background: 'var(--s1)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1, minHeight: 100 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--s1)' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th style={{ ...thS, textAlign: 'center', width: 36 }}>#</th>
                        <th style={{ ...thS, textAlign: 'center', width: 60, cursor: 'pointer' }} onClick={() => setOrdenacaoAcesso('codigo')}>Código</th>
                        <th style={{ ...thS, width: '33%', cursor: 'pointer' }} onClick={() => setOrdenacaoAcesso('nome')}>Nome</th>
                        <th style={{ ...thS, cursor: 'pointer' }} onClick={() => setOrdenacaoAcesso('categoria')}>Categoria</th>
                        <th style={{ ...thS, cursor: 'pointer' }} onClick={() => setOrdenacaoAcesso('pasta')}>Pasta</th>
                        <th style={{ ...thS, textAlign: 'center', cursor: 'pointer' }} onClick={() => setOrdenacaoAcesso('arquivo_ext')}>Ext.</th>
                        <th style={{ ...thS, cursor: 'pointer' }} onClick={() => setOrdenacaoAcesso('arquivo_tamanho')}>Tamanho</th>
                        <th style={{ ...thS, textAlign: 'center' }}>Fav.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(fResultados.registros ?? []).map((r, ri) => {
                        return (
                          <tr key={r.id}
                            onDoubleClick={() => selecionarDaConsulta(r)}
                            onClick={() => { const idx = items.findIndex(i => i.id === r.id); if (idx >= 0) { setCurrentIdx(idx); loadForm(r) } }}
                            style={{ cursor: 'pointer', background: 'var(--s1)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--s2)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--s1)' }}
                          >
                            <td style={{ ...tdS, textAlign: 'center', color: 'var(--t3)', fontSize: 10, width: 36 }}>{(fPagina - 1) * fPorPagina + ri + 1}</td>
                            <td style={{ ...tdS, textAlign: 'center', fontFamily: 'monospace', fontWeight: 600, fontSize: 11, width: 60 }}>{r.codigo || '—'}</td>
                            <td style={{ ...tdS, color: 'var(--t1)' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <ExtIcon ext={r.arquivo_ext} size={13} />{r.nome}
                              </span>
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
                      {!fLoading && (fResultados.registros ?? []).length === 0 && (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)', fontSize: 11, fontStyle: 'italic' }}>Nenhum arquivo encontrado</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginacaoBar pagina={fPagina} totalPaginas={fResultados.totalPaginas} total={fResultados.total} porPagina={fPorPagina}
                  onPagina={irParaPaginaAcesso} onPorPagina={mudarPorPaginaAcesso} />
              </div>
            )}
          </div>
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
        <PesquisaPadraoModal
          titulo="Pesquisa Padrão — ARQ_001"
          campos={CAMPOS_BUSCA.map(c => ({ nome_campo: c.val, label: c.label }))}
          colunasExibidas={COLUNAS_MODAL_ARQUIVOS}
          campoInicial="nome"
          mostrarFavorito
          onBuscar={async (campo, modo, busca, ordenar, direcao) => {
            const res = await window.api.arquivos.listarFiltrado({ campo, modo, busca, ordenar, direcao, porPagina: 1000, pagina: 1 })
            if (!res.ok) throw new Error(res.erro)
            return res.data
          }}
          onSelecionar={selecionarDaConsulta}
          onFechar={() => setShowConsulta(false)}
          renderCelula={(r, c) => {
            if (c.nome_campo === 'nome') return <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ExtIcon ext={r.arquivo_ext} size={12} />{r.nome}</span>
            if (c.nome_campo === 'arquivo_ext') return <span style={{ textTransform: 'uppercase' }}>{r.arquivo_ext || '—'}</span>
            if (c.nome_campo === 'arquivo_tamanho') return fmtSize(r.arquivo_tamanho)
            return String(r[c.nome_campo] ?? '—')
          }}
        />
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

      {/* ── Rodapé (só na aba Cadastro) ── */}
      {activeTab === 'cadastro' && (
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
          {isRO ? (
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
          )}
        </div>
      </div>
      )}
    </div>
  )
}
