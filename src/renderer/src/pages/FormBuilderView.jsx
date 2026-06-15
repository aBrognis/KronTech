import { useState, useEffect, useRef } from 'react'
import {
  Plus, Save, X, Trash2, Edit2, Search,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  Download, Copy, Check, Star, ExternalLink, RotateCcw,
  CheckCircle2, XCircle, Loader2, Building2, MapPin, CheckSquare, Square, Globe,
  Paperclip, ImageIcon, Palette, Link, Timer, Calculator, CalendarClock, Gauge, Percent,
  FolderInput, Settings, Clipboard, Upload, Eye, EyeOff,
} from 'lucide-react'
import { CANVAS_W, CANVAS_H_MIN } from '../components/FormDesigner'
import {
  exportarCSV, copiarTexto, mostrarAlerta,
  abrirTela, abrirEmNovaAba, voltarTela, limparFormulario, exportarPDF,
} from '../lib/funcoes/index.js'
import '../App.css'

const POR_PAG = 50

const MODOS_MODAL = [
  { val: 'iniciando', label: 'Iniciando'  },
  { val: 'contendo',  label: 'Contendo'   },
  { val: 'igual',     label: 'Igual'      },
]

function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 ** 2)   return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3)   return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const EXT_ICONS = {
  pdf:  { bg: '#fee2e2', color: '#dc2626', label: 'PDF' },
  doc:  { bg: '#dbeafe', color: '#2563eb', label: 'DOC' },
  docx: { bg: '#dbeafe', color: '#2563eb', label: 'DOC' },
  xls:  { bg: '#dcfce7', color: '#16a34a', label: 'XLS' },
  xlsx: { bg: '#dcfce7', color: '#16a34a', label: 'XLS' },
  csv:  { bg: '#dcfce7', color: '#16a34a', label: 'CSV' },
  ppt:  { bg: '#ffedd5', color: '#ea580c', label: 'PPT' },
  pptx: { bg: '#ffedd5', color: '#ea580c', label: 'PPT' },
  zip:  { bg: '#fef9c3', color: '#ca8a04', label: 'ZIP' },
  rar:  { bg: '#fef9c3', color: '#ca8a04', label: 'RAR' },
  txt:  { bg: '#f1f5f9', color: '#64748b', label: 'TXT' },
  jpg:  { bg: '#fdf4ff', color: '#a21caf', label: 'IMG' },
  jpeg: { bg: '#fdf4ff', color: '#a21caf', label: 'IMG' },
  png:  { bg: '#fdf4ff', color: '#a21caf', label: 'IMG' },
  gif:  { bg: '#fdf4ff', color: '#a21caf', label: 'GIF' },
  mp4:  { bg: '#ede9fe', color: '#7c3aed', label: 'MP4' },
  mp3:  { bg: '#ede9fe', color: '#7c3aed', label: 'MP3' },
}
function ExtIcon({ ext }) {
  const e = (ext || '').toLowerCase()
  const cfg = EXT_ICONS[e] || { bg: 'var(--s3)', color: 'var(--t3)', label: e.toUpperCase().slice(0,4) || 'ARQ' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: cfg.bg, color: cfg.color, borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 800, fontFamily: 'monospace', letterSpacing: .5, flexShrink: 0 }}>
      {cfg.label}
    </span>
  )
}

function filtrarStr(val = '', busca, modo) {
  if (!busca.trim()) return true
  const v = String(val).toLowerCase(), q = busca.toLowerCase().trim()
  if (modo === 'iniciando') return v.startsWith(q)
  if (modo === 'igual')     return v === q
  return v.includes(q)
}

export default function FormBuilderView({ nomeTabela, onTituloChange }) {
  const [tela,       setTela]       = useState(null)
  const [registros,  setRegistros]  = useState([])
  const [total,      setTotal]      = useState(0)
  const [pagina,     setPagina]     = useState(1)
  const [loading,    setLoading]    = useState(true)
  const [mode,       setMode]       = useState('view')
  const [activeTab,  setActiveTab]  = useState('cadastro')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [form,       setForm]       = useState({})
  const [busca,      setBusca]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [erro,       setErro]       = useState(null)
  const [copied,     setCopied]     = useState(null)
  const [copiado,    setCopiado]    = useState(null)   // 'local' | 'clip' | null
  const [pastaConfig, setPastaConfig] = useState('')
  const [importando,  setImportando]  = useState(false)
  const [importProg,  setImportProg]  = useState({ fase: '', atual: 0, total: 0, arquivo: '', inseridos: 0, ignorados: 0 })
  const [pastasSugest, setPastasSugest] = useState({}) // { nome_campo: ['val1','val2',...] }

  // CPF / CNPJ / CEP — busca automática
  const [docLoading, setDocLoading] = useState({}) // { nome_campo: true/false }
  const [docErro,    setDocErro]    = useState({}) // { nome_campo: 'mensagem' }

  // Lookup
  const [lookupOpcoes,    setLookupOpcoes]    = useState({}) // { nome_campo: [{id, label}] }
  const [lkpModalOpen,    setLkpModalOpen]    = useState(false)
  const [lkpModalCampo,   setLkpModalCampo]   = useState(null)
  const [lkpModalTodos,   setLkpModalTodos]   = useState([])
  const [lkpModalBusca,   setLkpModalBusca]   = useState('')
  const [lkpModalLoading, setLkpModalLoading] = useState(false)
  const [lkpModalSelId,   setLkpModalSelId]   = useState(null)
  const [lkpPopover,      setLkpPopover]      = useState(null) // { label, x, y }

  // Filtros aba Acesso
  const [fFiltros,    setFFiltros]    = useState({})   // { nome_campo: valor_selecionado }
  const [fBusca,      setFBusca]      = useState('')
  const [fResultados, setFResultados] = useState(null) // null = aguardando, [] = consultado
  const [allItems,    setAllItems]    = useState([])   // todos os registros, carregado uma vez
  const [allLoading,  setAllLoading]  = useState(false)

  // Redefinir senha
  const [redefinirOpen,    setRedefinirOpen]    = useState(false)
  const [redefinirCampo,   setRedefinirCampo]   = useState(null)
  const [redefinirNova,    setRedefinirNova]    = useState('')
  const [redefinirConf,    setRedefinirConf]    = useState('')
  const [redefinirErro,    setRedefinirErro]    = useState('')
  const [redefinirSaving,  setRedefinirSaving]  = useState(false)
  const [redefinirMostrar, setRedefinirMostrar] = useState(false)

  // Preview de arquivo/imagem
  const [preview, setPreview] = useState(null) // { path, nome, ext }

  // Modal Pesquisa Padrão
  const [showConsulta,  setShowConsulta]  = useState(false)
  const [mTodos,        setMTodos]        = useState([])
  const [mLoading,      setMLoading]      = useState(false)
  const [mCampo,        setMCampo]        = useState('')
  const [mOrdem,        setMOrdem]        = useState('asc')
  const [mModo,         setMModo]         = useState('contendo')
  const [mBusca,        setMBusca]        = useState('')
  const [mResultados,   setMResultados]   = useState([])
  const [mSelId,        setMSelId]        = useState(null)
  const mBuscaRef    = useRef(null)
  const contentRef   = useRef(null)
  const cnpjBuscando = useRef(false)

  useEffect(() => { init() }, [nomeTabela])

  useEffect(() => {
    function onTelasUpdated() { init() }
    window.addEventListener('krontech:telas-updated', onTelasUpdated)
    return () => window.removeEventListener('krontech:telas-updated', onTelasUpdated)
  }, [nomeTabela])

  async function init() {
    setLoading(true); setErro(null); setImportando(false)
    try {
      const todas = await window.api.formBuilder.listarTelas(true)
      const found = todas.find(t => t.nome_tabela === nomeTabela)
      if (!found) throw new Error(`Tela "${nomeTabela}" não encontrada.`)
      const t = await window.api.formBuilder.buscarTela(found.id)
      setTela(t)
      onTituloChange?.(t.nome_tela, t.nome_tabela)
      // Carrega pasta configurada se a tela tiver campo arquivo
      if ((t.campos || []).some(c => c.tipo === 'arquivo')) {
        window.api.config.get().then(cfg => setPastaConfig(cfg?.Caminhos?.arquivos || ''))
      }
      // Pré-carrega sugestões para campos do tipo pasta
      const camposPasta = (t.campos || []).filter(c => c.tipo === 'pasta' && c.nome_campo)
      if (camposPasta.length) {
        const map = {}
        await Promise.all(camposPasta.map(async c => {
          try { map[c.nome_campo] = await window.api.formBuilder.valoresDistintos(nomeTabela, c.nome_campo) }
          catch { map[c.nome_campo] = [] }
        }))
        setPastasSugest(map)
      }
      // Carrega a última página para posicionar no último registro
      const primeiros = await window.api.formBuilder.listarRegistros(nomeTabela, { pagina: 1, porPagina: POR_PAG })
      const totalReg = primeiros.total
      const ultimaPag = Math.max(1, Math.ceil(totalReg / POR_PAG))
      await carregar(t, ultimaPag, '')
      // Carrega opções de campos lookup
      const lookupCampos = (t.campos || []).filter(c => c.tipo === 'lookup' && c.opcoes?.lookupTabela)
      if (lookupCampos.length) {
        const map = {}
        await Promise.all(lookupCampos.map(async c => {
          const cfg = c.opcoes
          map[c.nome_campo] = await window.api.formBuilder.listarOpcoesLookup(cfg.lookupTabela, cfg.lookupExibir, cfg.lookupCodigo || '')
        }))
        setLookupOpcoes(map)
      }
    } catch(e) { setErro(e.message) }
    finally    { setLoading(false) }
  }

  async function handleAbrirArquivo(meta) {
    const r = await window.api.arquivos.abrir(meta.path)
    if (!r.ok) setErro(r.erro || 'Não foi possível abrir o arquivo.')
  }

  async function handleCopiarLocal(meta) {
    const r = await window.api.arquivos.copiarLocal(meta.path, meta.nome)
    if (!r.ok) { setErro(r.erro || 'Não foi possível copiar.'); return }
    setCopiado('local')
    setTimeout(() => setCopiado(null), 2500)
    if (confirm(`Arquivo copiado para:\n${r.destino}\n\nAbrir a pasta?`)) {
      const pasta = r.destino.substring(0, r.destino.lastIndexOf('\\'))
      await window.api.arquivos.abrirPasta(pasta)
    }
  }

  async function handleCopiarClipboard(meta) {
    const r = await window.api.arquivos.copiarClipboard(meta.path)
    if (!r.ok) { setErro(r.erro || 'Não foi possível copiar.'); return }
    setCopiado('clip')
    setTimeout(() => setCopiado(null), 2000)
  }

  async function handleImportarPasta() {
    setImportando(true)
    setImportProg({ fase: 'escaneando', atual: 0, total: 0, arquivo: 'Iniciando...', inseridos: 0, ignorados: 0 })

    let unsubFn = null
    function finalizar(prog) {
      if (unsubFn) { unsubFn(); unsubFn = null }
      setImportando(false)
      if (prog?.fase === 'concluido') { carregar(tela, pagina, busca, null); setAllItems([]) }
      if (prog?.erro) setErro(prog.erro)
    }

    unsubFn = window.api.arquivos.onProgresso(prog => {
      setImportProg(prog)
      if (['concluido', 'cancelado', 'erro'].includes(prog.fase)) finalizar(prog)
    })

    try {
      const camposAtivos = tela?.campos?.filter(c => c.ativo) || []
      const campoArq = camposAtivos.find(c => c.tipo === 'arquivo')
      const hasTs    = tela?.col_timestamps !== false

      if (!campoArq) { finalizar({ fase: 'erro', erro: 'Nenhum campo do tipo arquivo nesta tela.' }); return }

      const pref = campoArq.nome_campo
      const mapeamento = { arquivo: pref }
      if (camposAtivos.find(c => c.nome_campo === pref + '_nome'))    mapeamento.nome    = pref + '_nome'
      if (camposAtivos.find(c => c.nome_campo === pref + '_ext'))     mapeamento.ext     = pref + '_ext'
      if (camposAtivos.find(c => c.nome_campo === pref + '_tamanho')) mapeamento.tamanho = pref + '_tamanho'
      if (camposAtivos.find(c => c.nome_campo === pref + '_path'))    mapeamento.path    = pref + '_path'
      // campo "nome" genérico — recebe o basename sem extensão como título
      // sempre mapeado independente de arquivo_nome existir (são colunas separadas)
      if (camposAtivos.find(c => c.nome_campo === 'nome' && c.tipo === 'texto'))
        mapeamento.nomeGenerico = 'nome'
      const campoPasta = camposAtivos.find(c => c.tipo === 'pasta')
      if (campoPasta) mapeamento.pasta = campoPasta.nome_campo
      const campoCod = camposAtivos.find(c => c.tipo === 'codigo_auto' || c.sequencial)
      const seqChars = campoCod?.opcoes?.seqChars || 3
      if (campoCod) mapeamento.codigo = campoCod.nome_campo

      if (typeof window.api.formBuilder.importarPasta !== 'function') {
        finalizar({ fase: 'erro', erro: 'Função não disponível — reinicie o aplicativo.' })
        return
      }
      const res = await window.api.formBuilder.importarPasta({ tbl: nomeTabela, mapeamento, hasTs, seqChars })
      if (!res?.ok || res?.cancelado) finalizar(res?.cancelado ? { fase: 'cancelado' } : { fase: 'erro', erro: res?.erro })
    } catch (e) {
      finalizar({ fase: 'erro', erro: e.message })
    }
  }

  // Preenche campos satélites de arquivo: {nome}_nome, {nome}_ext, {nome}_tamanho, {nome}_path
  function setArquivoComSatellites(nomeCampo, meta) {
    setForm(f => {
      const up = { ...f }
      if (meta) {
        up[nomeCampo] = JSON.stringify({ path: meta.path, nome: meta.nome, ext: meta.ext, tamanho: meta.tamanho })
        // preenche campos satélites se existirem na tela
        if (tela?.campos.find(c => c.nome_campo === nomeCampo + '_nome'))     up[nomeCampo + '_nome']     = meta.nome
        if (tela?.campos.find(c => c.nome_campo === nomeCampo + '_ext'))      up[nomeCampo + '_ext']      = meta.ext || ''
        if (tela?.campos.find(c => c.nome_campo === nomeCampo + '_tamanho'))  up[nomeCampo + '_tamanho']  = meta.tamanho || 0
        if (tela?.campos.find(c => c.nome_campo === nomeCampo + '_path'))     up[nomeCampo + '_path']     = meta.path
      } else {
        up[nomeCampo] = ''
        if (tela?.campos.find(c => c.nome_campo === nomeCampo + '_nome'))     up[nomeCampo + '_nome']     = ''
        if (tela?.campos.find(c => c.nome_campo === nomeCampo + '_ext'))      up[nomeCampo + '_ext']      = ''
        if (tela?.campos.find(c => c.nome_campo === nomeCampo + '_tamanho'))  up[nomeCampo + '_tamanho']  = 0
        if (tela?.campos.find(c => c.nome_campo === nomeCampo + '_path'))     up[nomeCampo + '_path']     = ''
      }
      return up
    })
  }

  async function handleConfigurarPasta() {
    const nova = await window.api.config.selecionarPasta()
    if (nova) setPastaConfig(nova)
  }

  async function carregar(t = tela, pag = pagina, buscaVal = busca, manterIdReg = null) {
    if (!t) return
    const res = await window.api.formBuilder.listarRegistros(nomeTabela, {
      pagina: pag, porPagina: POR_PAG, busca: buscaVal || undefined
    })
    setRegistros(res.registros)
    setTotal(res.total)
    setPagina(pag)
    if (res.registros.length > 0) {
      let idx = res.registros.length - 1
      if (manterIdReg != null) {
        const found = res.registros.findIndex(r => r.id === manterIdReg)
        if (found >= 0) idx = found
      }
      setCurrentIdx(idx)
      carregarForm(t, res.registros[idx])
    } else {
      setCurrentIdx(0)
      setForm({})
    }
  }

  const TIPOS_SISTEMA = ['divisor', 'botao', 'favorito', 'timestamps', 'copiar', 'calculo']

  function carregarForm(t, reg) {
    if (!t || !reg) return
    const f = {}
    t.campos.filter(c => c.ativo && !TIPOS_SISTEMA.includes(c.tipo)).forEach(c => {
      let v = reg[c.nome_campo] ?? ''
      // Aplica máscara nos campos de documento ao carregar do banco
      if (c.tipo === 'cnpj') v = maskCNPJStr(String(v))
      else if (c.tipo === 'cpf') v = maskCPFStr(String(v))
      else if (c.tipo === 'cep') v = maskCEPStr(String(v))
      // flags sempre string
      else if (c.tipo === 'flags') v = String(v || '')
      f[c.nome_campo] = v
    })
    if (t.col_favorito !== false) f.favorito = reg.favorito ?? false
    setForm(f)
  }

  // Máscaras puras (sem depender de estado, usadas no carregarForm antes das funções internas)
  function maskCNPJStr(v) {
    return v.replace(/\D/g,'').slice(0,14)
      .replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2')
      .replace(/(\d{3})(\d)/,'$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2')
  }
  function maskCPFStr(v) {
    return v.replace(/\D/g,'').slice(0,11)
      .replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2')
      .replace(/(\d{3})(\d{1,2})$/,'$1-$2')
  }
  function maskCEPStr(v) {
    return v.replace(/\D/g,'').slice(0,8).replace(/(\d{5})(\d{1,3})$/,'$1-$2')
  }

  function navTo(idx) {
    const c = Math.max(0, Math.min(registros.length - 1, idx))
    setCurrentIdx(c); carregarForm(tela, registros[c]); setErro(null)
  }

  async function handleIncluir() {
    const f = {}
    tela.campos.filter(c => c.ativo && !c.sequencial && !TIPOS_SISTEMA.includes(c.tipo)).forEach(c => {
      // flags sempre iniciam vazias — valor_padrao não se aplica a flags
      f[c.nome_campo] = c.tipo === 'flags' ? '' : (c.valor_padrao ?? '')
    })
    for (const c of tela.campos.filter(c => c.ativo && c.sequencial)) {
      try { f[c.nome_campo] = await window.api.formBuilder.proximoCodigo(nomeTabela, c.nome_campo, c.valor_padrao, c.opcoes?.seqChars) }
      catch { f[c.nome_campo] = c.valor_padrao || String(1).padStart(c.opcoes?.seqChars || 3, '0') }
    }
    if (tela.col_favorito !== false) f.favorito = false
    setForm(f); setMode('new'); setActiveTab('cadastro'); setErro(null)
  }

  function handleAlterar() {
    if (!registros.length) return
    carregarForm(tela, registros[currentIdx]); setMode('edit'); setErro(null)
  }

  async function handleGravar() {
    setErro(null)
    for (const c of tela.campos.filter(c => c.ativo && c.obrigatorio && !c.sequencial)) {
      if (!form[c.nome_campo]?.toString().trim()) { setErro(`"${c.label}" é obrigatório.`); return }
    }
    setSaving(true)
    try {
      const dados = {}
      tela.campos.filter(c => c.ativo && !c.sequencial && !TIPOS_SISTEMA.includes(c.tipo)).forEach(c => {
        dados[c.nome_campo] = form[c.nome_campo] ?? null
      })
      if (tela.col_favorito !== false) dados.favorito = form.favorito ?? false
      if (mode === 'new') {
        for (const c of tela.campos.filter(c => c.ativo && c.sequencial)) {
          dados[c.nome_campo] = await window.api.formBuilder.proximoCodigo(nomeTabela, c.nome_campo, c.valor_padrao, c.opcoes?.seqChars)
        }
        const novoReg = await window.api.formBuilder.inserirRegistro(nomeTabela, dados)
        const totalPosInsercao = total + 1
        const ultimaPag = Math.max(1, Math.ceil(totalPosInsercao / POR_PAG))
        await carregar(tela, ultimaPag, busca, novoReg?.id ?? null)
      } else {
        const idAtual = registros[currentIdx]?.id
        await window.api.formBuilder.atualizarRegistro(nomeTabela, idAtual, dados, tela.col_timestamps !== false)
        await carregar(tela, pagina, busca, idAtual)
      }
      setMode('view')
    } catch(e) { setErro(e.message) }
    finally    { setSaving(false) }
  }

  async function handleExcluir() {
    if (!registros.length) return
    if (!confirm('Excluir este registro?')) return
    await window.api.formBuilder.inativarRegistro(nomeTabela, registros[currentIdx].id, tela.col_timestamps !== false)
    await carregar(tela, pagina, busca, null)
  }

  function handleDesistir() {
    if (registros.length) carregarForm(tela, registros[currentIdx])
    setMode('view'); setErro(null)
  }

  async function handleToggleFav() {
    if (!registros.length) return
    try {
      const upd = await window.api.formBuilder.toggleFavorito(nomeTabela, registros[currentIdx].id, tela.col_timestamps !== false)
      setRegistros(rs => rs.map((r, i) => i === currentIdx ? { ...r, favorito: upd.favorito } : r))
    } catch(e) { console.error('toggleFavorito:', e) }
  }


  // ── Aba Acesso — filtros dinâmicos ────────────────────────────────────────
  const [fConsultando, setFConsultando] = useState(false)

  async function loadAllAcesso() {
    setAllLoading(true)
    try {
      const res = await window.api.formBuilder.getAllRegistros(nomeTabela)
      setAllItems(res.registros)
      return res.registros
    } catch {
      return []
    } finally {
      setAllLoading(false)
    }
  }

  function executarConsultaAcesso(srcItems) {
    const src = Array.isArray(srcItems) ? srcItems : allItems
    const q = fBusca.toLowerCase().trim()
    const camposBusca = camposData.filter(c => c.campo_busca).map(c => c.nome_campo)
    let list = [...src]
    if (q) {
      if (camposBusca.length) {
        list = list.filter(r => camposBusca.some(nc => filtrarStr(String(r[nc] ?? ''), q, 'contendo')))
      } else {
        list = list.filter(r => Object.values(r).some(v => filtrarStr(String(v ?? ''), q, 'contendo')))
      }
    }
    for (const [nomeCampo, val] of Object.entries(fFiltros)) {
      if (val && val !== '__todos__') list = list.filter(r => String(r[nomeCampo] ?? '') === val)
    }
    setFResultados(list)
  }

  async function handleConsultarAcesso() {
    let src = allItems
    if (!src.length) {
      setFConsultando(true)
      src = await loadAllAcesso()
      setFConsultando(false)
    }
    executarConsultaAcesso(src)
  }

  function limparFiltrosAcesso() {
    setFFiltros({}); setFBusca(''); setFResultados(null)
  }

  function selecionarDaAcesso(r) {
    const idx = registros.findIndex(reg => reg.id === r.id)
    if (idx >= 0) { setCurrentIdx(idx); carregarForm(tela, registros[idx]) }
    else { carregar(tela, 1, '').then(() => {}) }
    setMode('view'); setActiveTab('cadastro')
  }

  // ── Pesquisa Padrão ────────────────────────────────────────────────────────

  function rodarModal(campo, ordem, modo, busca, todos) {
    const src = todos ?? mTodos
    let list = [...src]
    if (busca.trim()) list = list.filter(r => filtrarStr(r[campo] ?? '', busca, modo))
    list.sort((a, b) => {
      const va = String(a[campo] ?? '').toLowerCase()
      const vb = String(b[campo] ?? '').toLowerCase()
      return ordem === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
    setMResultados(list)
    const curId = registros[currentIdx]?.id
    setMSelId(list.find(r => r.id === curId) ? curId : (list[0]?.id ?? null))
  }

  async function abrirConsulta() {
    const camposVisiveis = tela?.campos.filter(c => c.ativo && c.tipo !== 'divisor' && c.tipo !== 'botao') || []
    const campoInicial = camposVisiveis[0]?.nome_campo || 'id'
    setMCampo(campoInicial); setMOrdem('asc'); setMModo('contendo'); setMBusca('')
    setShowConsulta(true)
    setMLoading(true)
    try {
      let src = allItems
      if (!src.length) {
        const res = await window.api.formBuilder.getAllRegistros(nomeTabela)
        src = res.registros
        setAllItems(src)
      }
      setMTodos(src)
      rodarModal(campoInicial, 'asc', 'contendo', '', src)
    } catch { setMTodos([]); setMResultados([]) }
    finally { setMLoading(false); setTimeout(() => mBuscaRef.current?.focus(), 60) }
  }

  function selecionarDaConsulta(r) {
    const idx = registros.findIndex(reg => reg.id === r.id)
    if (idx >= 0) {
      setCurrentIdx(idx); carregarForm(tela, registros[idx])
    } else {
      carregar(tela, 1, '').then(() => {})
    }
    setMode('view'); setActiveTab('cadastro')
    setShowConsulta(false)
  }

  function setField(nome, val) { setForm(f => ({ ...f, [nome]: val })) }

  // ── Máscaras CPF / CNPJ / CEP ───────────────────────────────────────────
  function maskCPF(v) {
    return v.replace(/\D/g,'').slice(0,11)
      .replace(/(\d{3})(\d)/,'$1.$2')
      .replace(/(\d{3})(\d)/,'$1.$2')
      .replace(/(\d{3})(\d{1,2})$/,'$1-$2')
  }
  function maskCNPJ(v) {
    return v.replace(/\D/g,'').slice(0,14)
      .replace(/(\d{2})(\d)/,'$1.$2')
      .replace(/(\d{3})(\d)/,'$1.$2')
      .replace(/(\d{3})(\d)/,'$1/$2')
      .replace(/(\d{4})(\d{1,2})$/,'$1-$2')
  }
  function maskCEP(v) {
    return v.replace(/\D/g,'').slice(0,8).replace(/(\d{5})(\d)/,'$1-$2')
  }

  function validarCPF(cpf) {
    const d = cpf.replace(/\D/g,'')
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
    let s = 0
    for (let i = 0; i < 9; i++) s += Number(d[i]) * (10 - i)
    let r = (s * 10) % 11; if (r >= 10) r = 0
    if (r !== Number(d[9])) return false
    s = 0
    for (let i = 0; i < 10; i++) s += Number(d[i]) * (11 - i)
    r = (s * 10) % 11; if (r >= 10) r = 0
    return r === Number(d[10])
  }
  function validarCNPJ(cnpj) {
    const d = cnpj.replace(/\D/g,'')
    if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false
    const calc = (l) => {
      let s = 0, p = l - 7
      for (let i = 0; i < l; i++) { s += Number(d[i]) * p--; if (p < 2) p = 9 }
      const r = s % 11
      return r < 2 ? 0 : 11 - r
    }
    return calc(12) === Number(d[12]) && calc(13) === Number(d[13])
  }

  // Mapeamento direto: nome_campo → valor extraído da API
  function buildCnpjUpdates(data, formKeys) {
    const set = new Set(formKeys)
    const up = {}
    const try_ = (campo, val) => { if (set.has(campo) && val != null && val !== '') up[campo] = String(val) }
    // nome principal (razão social)
    try_('nome',         data.razao_social)
    try_('razao_social', data.razao_social)
    // nome fantasia / apelido
    try_('apelido',      data.nome_fantasia || data.razao_social)
    try_('nome_fantasia',data.nome_fantasia || data.razao_social)
    // endereço
    try_('logradouro',   data.logradouro)
    try_('numero',       data.numero)
    try_('complemento',  data.complemento)
    try_('bairro',       data.bairro)
    try_('municipio',    data.municipio)
    try_('cidade',       data.municipio)
    try_('uf',           data.uf)
    try_('cep',          maskCEPStr(data.cep || ''))
    // contato
    try_('telefone',     data.ddd_telefone_1)
    try_('fone',         data.ddd_telefone_1)
    try_('celular',      data.ddd_telefone_2)
    try_('email',        data.email)
    // outros
    try_('situacao',     data.descricao_situacao_cadastral)
    try_('cnae',         data.cnae_fiscal_descricao)
    try_('natureza',     data.natureza_juridica)
    try_('natureza_juridica', data.natureza_juridica)
    try_('porte',        data.porte)
    // ie/rg limpa ao buscar PJ
    try_('ie_rg',        '')
    try_('ie',           '')
    return up
  }

  function buildCepUpdates(data, formKeys) {
    const set = new Set(formKeys)
    const up = {}
    const try_ = (campo, val) => { if (set.has(campo) && val != null && val !== '') up[campo] = String(val) }
    try_('logradouro',  data.logradouro)
    try_('endereco',    data.logradouro)
    try_('rua',         data.logradouro)
    try_('complemento', data.complemento)
    try_('bairro',      data.bairro)
    try_('municipio',   data.localidade)
    try_('cidade',      data.localidade)
    try_('uf',          data.uf)
    try_('ibge',        data.ibge)
    try_('ddd',         data.ddd)
    return up
  }

  function autoFill(data, buildFn) {
    setForm(f => ({ ...f, ...buildFn(data, Object.keys(f)) }))
  }

  async function buscarCNPJ(campo, valOverride) {
    const val = valOverride ?? form[campo.nome_campo] ?? ''
    const digits = val.replace(/\D/g,'')
    if (digits.length !== 14) return
    if (!validarCNPJ(val)) {
      setDocErro(e => ({ ...e, [campo.nome_campo]: 'CNPJ inválido.' }))
      return
    }
    setDocErro(e => ({ ...e, [campo.nome_campo]: null }))
    setDocLoading(l => ({ ...l, [campo.nome_campo]: true }))
    try {
      const res = await window.api.entidade.buscarCnpj(digits)
      if (!res.ok) { setDocErro(e => ({ ...e, [campo.nome_campo]: res.erro })); return }
      setForm(f => ({ ...f, ...buildCnpjUpdates(res.data, Object.keys(f)) }))
    } finally {
      setDocLoading(l => ({ ...l, [campo.nome_campo]: false }))
    }
  }

  async function buscarCEP(campo) {
    const val = form[campo.nome_campo] || ''
    const digits = val.replace(/\D/g,'')
    if (digits.length !== 8) return
    setDocErro(e => ({ ...e, [campo.nome_campo]: null }))
    setDocLoading(l => ({ ...l, [campo.nome_campo]: true }))
    try {
      const res = await window.api.entidade.buscarCep(digits)
      if (!res.ok) { setDocErro(e => ({ ...e, [campo.nome_campo]: res.erro })); return }
      autoFill(res.data, buildCepUpdates)
    } finally {
      setDocLoading(l => ({ ...l, [campo.nome_campo]: false }))
    }
  }

  async function openLookupModal(campo) {
    const cfg = campo.opcoes || {}
    setLkpModalCampo(campo)
    setLkpModalOpen(true)
    setLkpModalLoading(true)
    setLkpModalBusca('')
    setLkpModalSelId(form[campo.nome_campo] ? Number(form[campo.nome_campo]) : null)
    try {
      const opts = await window.api.formBuilder.listarOpcoesLookup(cfg.lookupTabela, cfg.lookupExibir, cfg.lookupCodigo || '')
      setLkpModalTodos(opts)
    } catch { setLkpModalTodos([]) }
    finally { setLkpModalLoading(false) }
  }

  function confirmarLookupModal() {
    if (lkpModalCampo) setField(lkpModalCampo.nome_campo, lkpModalSelId || null)
    setLkpModalOpen(false)
  }

  // ── Renderiza input ────────────────────────────────────────────────────────
  function renderInput(campo, compact = false) {
    if (!campo.nome_campo) return null
    const val  = form[campo.nome_campo] ?? ''
    const isRO = mode === 'view' || campo.sequencial
    const ops  = campo.opcoes || []
    // Se campo tem tamanho explícito no designer e está no canvas, adapta fonte proporcionalmente
    const autoFontSize = compact && campo.h_px && !campo.input_font_size
      ? Math.max(9, Math.min(18, Math.round(campo.h_px * 0.22)))
      : undefined
    const inputStyle = {
      fontWeight: campo.input_negrito ? 700 : undefined,
      fontSize: campo.input_font_size ? `${campo.input_font_size}px` : autoFontSize ? `${autoFontSize}px` : undefined,
      textAlign: campo.input_align || undefined,
      color: campo.input_cor || undefined,
      background: campo.input_bg || undefined,
      borderRadius: campo.border_radius != null ? `${campo.border_radius}px` : undefined,
      borderWidth: campo.border_width != null ? `${campo.border_width}px` : undefined,
      borderColor: campo.border_color || undefined,
      borderStyle: campo.border_width != null ? 'solid' : undefined,
    }

    // Detecta se é campo satélite de arquivo (preenchido automaticamente)
    const ARQ_SUFFIXES = ['_nome', '_ext', '_tamanho', '_path']
    const arqSuffix = ARQ_SUFFIXES.find(s => campo.nome_campo.endsWith(s))
    if (arqSuffix) {
      const prefixo = campo.nome_campo.slice(0, -arqSuffix.length)
      const campoArqPai = tela?.campos.find(c => c.nome_campo === prefixo && c.tipo === 'arquivo')
      if (campoArqPai) {
        let exibe = '—'
        if (val) {
          if (arqSuffix === '_tamanho') exibe = fmtSize(Number(val)) || '—'
          else if (arqSuffix === '_ext') exibe = String(val).toUpperCase()
          else exibe = String(val)
        }
        return (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', padding: '0 2px', gap: 8 }}>
            <span style={{ fontSize: 11, color: val ? 'var(--t1)' : 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'right', fontWeight: val ? 500 : 400 }}>
              {exibe}
            </span>
          </div>
        )
      }
    }

    if (campo.tipo === 'favorito') {
      const favVal = form.favorito ?? false
      return (
        <label className="fav-check" style={{ height: '100%', display: 'flex', alignItems: 'center', pointerEvents: isRO ? 'none' : 'auto', cursor: isRO ? 'default' : 'pointer' }}
          onClick={() => !isRO && !saving && setField('favorito', !favVal)}>
          <span style={{
            width: 14, height: 14, borderRadius: 3, flexShrink: 0,
            border: `2px solid ${favVal ? 'var(--or)' : 'var(--bd2)'}`,
            background: favVal ? 'var(--or)' : 'transparent',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s',
          }}>
            {favVal && <span style={{ width: 7, height: 5, borderLeft: '2px solid #fff', borderBottom: '2px solid #fff', transform: 'rotate(-45deg) translateY(-1px)', display: 'block' }} />}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            Marcar como favorito
            <Star size={13} fill={favVal ? 'var(--or)' : 'none'} color={favVal ? 'var(--or)' : 'currentColor'} />
          </span>
        </label>
      )
    }

    if (campo.tipo === 'timestamps') {
      const placeholder = isRO ? '—' : 'preenchido ao salvar'
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, height: '100%', alignContent: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 10, textAlign: 'center' }}>Criado em</label>
            <div className="form-input" style={{ fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 32, background: 'var(--s1)', cursor: 'default', color: isRO ? 'var(--t1)' : 'var(--t3)', fontStyle: isRO ? 'normal' : 'italic', textAlign: 'center' }}>
              {isRO ? fmtDate(curReg?.criado_em) : placeholder}
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 10, textAlign: 'center' }}>Atualizado em</label>
            <div className="form-input" style={{ fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 32, background: 'var(--s1)', cursor: 'default', color: isRO ? 'var(--t1)' : 'var(--t3)', fontStyle: isRO ? 'normal' : 'italic', textAlign: 'center' }}>
              {isRO ? fmtDate(curReg?.alterado_em) : placeholder}
            </div>
          </div>
        </div>
      )
    }

    if (campo.tipo === 'copiar') {
      const campoAlvo = campo.valor_padrao || ''
      const copKey    = '_cpy_' + campo.nome_campo
      const isCopied  = copied === copKey
      if (!campoAlvo) return null
      if (!isRO) return (
        <button disabled style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, cursor: 'not-allowed', background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 6, color: 'var(--t3)', opacity: .5 }}>
          <Copy size={11} /> {campo.label || 'Copiar'}
        </button>
      )
      return (
        <button
          style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, cursor: 'pointer', background: 'var(--s3)', border: '1px solid var(--bd)', borderRadius: 6, color: isCopied ? 'var(--green)' : 'var(--t3)', transition: 'color .2s' }}
          onClick={async () => {
            const val = String(form[campoAlvo] ?? '')
            if (!val) return
            try {
              await window.api.clipboard.write(val)
              setCopied(copKey)
              setTimeout(() => setCopied(null), 1500)
            } catch(e) { console.error('copiar:', e) }
          }}
        >
          {isCopied ? <Check size={11} /> : <Copy size={11} />}
          {isCopied ? 'Copiado!' : (campo.label || 'Copiar')}
        </button>
      )
    }

    if (campo.tipo === 'botao') {
      let cfg = {}
      try { cfg = JSON.parse(campo.valor_padrao || '{}') } catch {}
      const { fn = 'copiarTexto', param = '', variant = 'ghost' } = cfg
      async function executarBotao() {
        const p = param.replace(/\{(\w+)\}/g, (_, k) => form[k] ?? '')
        // Resolve meta de arquivo a partir do nome do campo configurado
        function resolverArqMeta(nomeCampo) {
          const v = form[nomeCampo || param] ?? ''
          try { return v ? JSON.parse(v) : null } catch { return null }
        }
        // Resolve campo pelo nome para busca de documento
        function resolverCampo(nomeCampo) {
          return tela?.campos?.find(c => c.nome_campo === (nomeCampo || param)) ?? null
        }
        const acoes = {
          // Geral
          copiarTexto:           () => copiarTexto(p),
          mostrarAlerta:         () => mostrarAlerta(p || campo.label, 'info'),
          mostrarSucesso:        () => mostrarAlerta(p || campo.label, 'sucesso'),
          mostrarErro:           () => mostrarAlerta(p || campo.label, 'erro'),
          mostrarAviso:          () => mostrarAlerta(p || campo.label, 'aviso'),
          abrirTela:             () => abrirTela(p),
          voltarTela:            () => voltarTela(),
          abrirEmNovaAba:        () => abrirEmNovaAba(p),
          limparFormulario:      () => limparFormulario(p || undefined),
          exportarPDF:           () => exportarPDF(p || 'kron-form-canvas', campo.label),
          // Arquivo
          abrirArquivo: async () => {
            const meta = resolverArqMeta(param)
            if (!meta?.path) return mostrarAlerta('Nenhum arquivo vinculado.', 'aviso')
            const r = await window.api.arquivos.abrir(meta.path)
            if (!r.ok) mostrarAlerta(r.erro || 'Não foi possível abrir o arquivo.', 'erro')
          },
          previewArquivo: () => {
            const meta = resolverArqMeta(param)
            if (!meta?.path) return mostrarAlerta('Nenhum arquivo vinculado.', 'aviso')
            setPreview(meta)
          },
          copiarArquivoLocal: async () => {
            const meta = resolverArqMeta(param)
            if (!meta?.path) return mostrarAlerta('Nenhum arquivo vinculado.', 'aviso')
            const r = await window.api.arquivos.copiarLocal(meta.path, meta.nome)
            if (!r.ok) return mostrarAlerta(r.erro || 'Não foi possível copiar.', 'erro')
            mostrarAlerta('Arquivo copiado para pasta temp.', 'sucesso')
            if (confirm(`Arquivo copiado para:\n${r.destino}\n\nAbrir a pasta?`))
              await window.api.arquivos.abrirPasta(r.destino.substring(0, r.destino.lastIndexOf('\\')))
          },
          copiarArquivoClipboard: async () => {
            const meta = resolverArqMeta(param)
            if (!meta?.path) return mostrarAlerta('Nenhum arquivo vinculado.', 'aviso')
            const r = await window.api.arquivos.copiarClipboard(meta.path)
            if (!r.ok) return mostrarAlerta(r.erro || 'Não foi possível copiar.', 'erro')
            mostrarAlerta('Arquivo copiado para a área de transferência.', 'sucesso')
          },
          // Registro
          excluirRegistro: async () => {
            const msg = p || 'Excluir este registro?'
            if (!confirm(msg)) return
            try {
              await window.api.formBuilder.inativarRegistro(nomeTabela, registros[currentIdx].id, tela.col_timestamps !== false)
              await carregar(tela, pagina, busca, null)
              mostrarAlerta('Registro excluído.', 'sucesso')
            } catch(e) { mostrarAlerta(e.message, 'erro') }
          },
          // Consultas externas
          buscarCNPJ: async () => {
            const campoAlvo = resolverCampo(param)
            if (!campoAlvo) return mostrarAlerta(`Campo "${param}" não encontrado.`, 'aviso')
            await buscarCNPJ(campoAlvo)
          },
          buscarCEP: async () => {
            const campoAlvo = resolverCampo(param)
            if (!campoAlvo) return mostrarAlerta(`Campo "${param}" não encontrado.`, 'aviso')
            await buscarCEP(campoAlvo)
          },
        }
        const acao = acoes[fn]
        if (acao) await acao()
        else mostrarAlerta(`Função "${fn}" não encontrada`, 'aviso')
      }
      return (
        <button className={`btn btn-${variant}`} onClick={executarBotao} style={{ width: '100%', height: '100%' }}>
          {campo.label || 'Ação'}
        </button>
      )
    }

    if (campo.tipo === 'booleano') return (
      <label className="fav-check" style={{ height: '100%', display: 'flex', alignItems: 'center', pointerEvents: isRO ? 'none' : 'auto' }}>
        <input type="checkbox" checked={!!val}
          onChange={e => setField(campo.nome_campo, e.target.checked)}
          disabled={isRO || saving} />
        <span>{campo.label}</span>
      </label>
    )

    if (campo.tipo === 'texto_longo') return (
      <textarea className="form-textarea" value={val}
        onChange={e => setField(campo.nome_campo, e.target.value)}
        disabled={isRO || saving}
        style={{ fontFamily: "'Cascadia Code','Courier New',monospace", fontSize: 12.5, lineHeight: 1.7, height: '100%', minHeight: 'unset', resize: (isRO || compact) ? 'none' : 'vertical', ...inputStyle }} />
    )

    if (campo.tipo === 'select') return (
      <select className="form-select" value={val}
        onChange={e => setField(campo.nome_campo, e.target.value)}
        disabled={isRO || saving} style={{ height: '100%' }}>
        <option value="">— selecione —</option>
        {ops.map((o, i) => <option key={i} value={o.valor}>{o.label}</option>)}
      </select>
    )

    if (campo.tipo === 'radio') {
      const isColuna = (campo.opcoes_layout || 'linha') === 'coluna'
      return (
        <div style={{ display: 'flex', flexDirection: isColuna ? 'column' : 'row', alignItems: isColuna ? 'flex-start' : 'center', gap: isColuna ? 8 : 14, height: '100%', padding: isColuna ? '8px 12px' : '0 12px', background: 'var(--s1)', border: '1.5px solid var(--bd)', borderRadius: 10, boxShadow: 'var(--sh-xs)', flexWrap: isColuna ? 'nowrap' : 'wrap', boxSizing: 'border-box', width: '100%', overflowY: isColuna ? 'auto' : 'visible' }}>
          {ops.map((o, i) => {
            const checked = val != null && o.valor != null && String(val).trim().toLowerCase() === String(o.valor).trim().toLowerCase()
            const cor = o.cor || 'var(--or)'
            return (
              <label key={i} onClick={() => !isRO && !saving && setField(campo.nome_campo, o.valor)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: isRO ? 'default' : 'pointer', fontSize: 11.5, color: checked ? cor : 'var(--t3)', fontWeight: checked ? 600 : 400, userSelect: 'none', transition: 'color .15s' }}>
                <span style={{
                  width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${checked ? cor : 'var(--bd2)'}`,
                  background: checked ? cor : 'transparent',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .15s',
                }}>
                  {checked && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'block' }} />}
                </span>
                {o.label}
              </label>
            )
          })}
          {ops.length === 0 && <span style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>Sem opções</span>}
        </div>
      )
    }

    if (campo.tipo === 'codigo_auto') return (
      <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: val ? 'var(--or)' : 'var(--t3)', letterSpacing: 2, height: '100%', cursor: 'default' }}>
        {val || '—'}
      </div>
    )

    if (campo.tipo === 'lookup') {
      const cfg = (campo.opcoes && !Array.isArray(campo.opcoes)) ? campo.opcoes : {}
      const opts = lookupOpcoes[campo.nome_campo] || []
      const modoLkp = cfg.lookupModo || 'select'
      const numVal = val ? Number(val) : null
      const displayLabel = opts.find(o => o.id === numVal)?.label || (val ? `#${val}` : '')

      if (modoLkp === 'select') return (
        <select className="form-select" value={numVal ?? ''} style={{ height: '100%' }}
          onChange={e => setField(campo.nome_campo, e.target.value ? Number(e.target.value) : null)}
          disabled={isRO || saving}>
          <option value="">— nenhum —</option>
          {opts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      )

      // Modo modal
      return (
        <div style={{ display: 'flex', gap: 4, height: '100%' }}>
          <div className="form-input" style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', cursor: (!isRO && !saving) ? 'pointer' : 'default', fontSize: 12 }}
            onClick={() => !isRO && !saving && openLookupModal(campo)}>
            {displayLabel || <span style={{ color: 'var(--t3)', fontStyle: 'italic' }}>— nenhum —</span>}
          </div>
          <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 8px', height: '100%' }}
            onClick={() => openLookupModal(campo)} disabled={saving || isRO} title="Buscar">
            <Search size={13} />
          </button>
          {numVal && !isRO && (
            <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 8px', height: '100%' }}
              onClick={() => setField(campo.nome_campo, null)} disabled={saving} title="Limpar">
              <X size={13} />
            </button>
          )}
          {isRO && numVal && displayLabel && (
            <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 6px', height: '100%' }}
              onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setLkpPopover({ label: displayLabel, x: r.left, y: r.bottom + 6 }) }}
              title="Ver registro relacionado">
              <ExternalLink size={12} />
            </button>
          )}
        </div>
      )
    }

    if (campo.tipo === 'cpf') {
      const cpfVal = String(val || '')
      const cpfOk  = cpfVal.replace(/\D/g, '').length === 11 ? validarCPF(cpfVal) : null
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: '100%' }}>
          <input className="form-input" value={cpfVal}
            onChange={e => setField(campo.nome_campo, maskCPF(e.target.value))}
            disabled={isRO || saving}
            placeholder="000.000.000-00"
            maxLength={14}
            style={{ height: '100%', flex: 1 }} />
          {cpfVal.replace(/\D/g, '').length === 11 && (
            cpfOk
              ? <CheckCircle2 size={16} style={{ color: 'var(--green, #22c55e)', flexShrink: 0 }} />
              : <XCircle      size={16} style={{ color: 'var(--red,   #ef4444)', flexShrink: 0 }} />
          )}
        </div>
      )
    }

    if (campo.tipo === 'cnpj') {
      const cnpjVal  = String(val || '')
      const cnpjDig  = cnpjVal.replace(/\D/g, '')
      const cnpjOk   = cnpjDig.length === 14 ? validarCNPJ(cnpjVal) : null
      const isLoading = docLoading[campo.nome_campo]
      const errMsg    = docErro[campo.nome_campo]
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minHeight: 0 }}>
            <input className="form-input" value={cnpjVal}
              onChange={e => setField(campo.nome_campo, maskCNPJ(e.target.value))}
              disabled={isRO || saving}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              style={{ flex: 1, height: '100%', ...inputStyle }} />
            {cnpjDig.length === 14 && (
              cnpjOk
                ? <CheckCircle2 size={16} style={{ color: 'var(--green, #22c55e)', flexShrink: 0 }} />
                : <XCircle      size={16} style={{ color: 'var(--red,   #ef4444)', flexShrink: 0 }} />
            )}
            <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 8px', gap: 4, fontSize: 12, whiteSpace: 'nowrap', height: '100%' }}
              onClick={() => buscarCNPJ(campo, cnpjVal)} disabled={saving || isLoading || isRO} title={campo.label || 'Buscar CNPJ'}>
              {isLoading
                ? <Loader2   size={13} style={{ animation: 'spin 1s linear infinite' }} />
                : <Building2 size={13} />}
              {!compact && (campo.label || 'Buscar')}
            </button>
          </div>
          {errMsg && <span style={{ fontSize: 11, color: 'var(--red, #ef4444)', flexShrink: 0 }}>{errMsg}</span>}
        </div>
      )
    }

    if (campo.tipo === 'cep') {
      const cepVal    = String(val || '')
      const cepDig    = cepVal.replace(/\D/g, '')
      const isLoading = docLoading[campo.nome_campo]
      const errMsg    = docErro[campo.nome_campo]
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minHeight: 0 }}>
            <input className="form-input" value={cepVal}
              onChange={e => setField(campo.nome_campo, maskCEP(e.target.value))}
              onBlur={() => buscarCEP(campo)}
              disabled={isRO || saving}
              placeholder="00000-000"
              maxLength={9}
              style={{ flex: 1, height: '100%', ...inputStyle }} />
            <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 8px', gap: 4, fontSize: 12, whiteSpace: 'nowrap', height: '100%' }}
              onClick={() => buscarCEP(campo)} disabled={saving || isLoading || isRO || cepDig.length < 8} title={campo.label || 'Buscar CEP'}>
              {isLoading
                ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                : <MapPin  size={13} />}
              {!compact && (campo.label || 'Buscar')}
            </button>
          </div>
          {errMsg && <span style={{ fontSize: 11, color: 'var(--red, #ef4444)', flexShrink: 0 }}>{errMsg}</span>}
        </div>
      )
    }

    if (campo.tipo === 'documento') {
      const docVal    = String(val || '')
      const docDig    = docVal.replace(/\D/g, '')
      const tipoKey   = campo.opcoes?.tipoRef || `__doc_tipo_${campo.nome_campo}`
      const tipoRadio = String(form[tipoKey] || '').toUpperCase()
      // Se radio definido, usa ele; senão detecta pelo número de dígitos já digitados
      // Quando campo vazio e sem radio, mantém ambíguo (aceita ambos)
      const tipoDoc   = tipoRadio === 'J' ? 'J'
                      : tipoRadio === 'F' ? 'F'
                      : (docDig.length > 11 ? 'J' : docDig.length === 11 ? 'F' : null)
      const isFisica  = tipoDoc === 'F'
      const isJuridica = tipoDoc === 'J'
      const isLoading = docLoading[campo.nome_campo]
      const errMsg    = docErro[campo.nome_campo]

      const docOk = isFisica  ? (docDig.length === 11 ? validarCPF(docVal)  : null)
                  : isJuridica ? (docDig.length === 14 ? validarCNPJ(docVal) : null)
                  : null

      function handleDocChange(e) {
        const raw = e.target.value.replace(/\D/g, '')
        // Aplica máscara conforme tamanho: até 11 dígitos → CPF, mais → CNPJ
        const masked = raw.length > 11 ? maskCNPJ(e.target.value) : maskCPF(e.target.value)
        setField(campo.nome_campo, masked)
        // Sincroniza o campo radio se existir e ainda estiver vazio
        if (tipoKey && !tipoRadio) {
          if (raw.length === 11) setField(tipoKey, 'F')
          else if (raw.length === 14) setField(tipoKey, 'J')
        }
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%' }}>
          {/* Input + validação + botão consultar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minHeight: 0 }}>
            <input className="form-input" value={docVal}
              onChange={handleDocChange}
              disabled={isRO || saving}
              placeholder={isFisica ? '000.000.000-00' : isJuridica ? '00.000.000/0000-00' : 'CPF ou CNPJ'}
              maxLength={isFisica ? 14 : 18}
              style={{ flex: 1, height: '100%', ...inputStyle }} />
            {docOk !== null && (
              docOk
                ? <CheckCircle2 size={16} style={{ color: 'var(--green, #22c55e)', flexShrink: 0 }} />
                : <XCircle      size={16} style={{ color: 'var(--red,   #ef4444)', flexShrink: 0 }} />
            )}
            {isJuridica && (
              <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 9px', height: '100%' }}
                onClick={() => buscarCNPJ(campo, docVal)} disabled={saving || isLoading || isRO} title="Consultar CNPJ na Receita Federal">
                {isLoading
                  ? <Loader2    size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Globe size={15} />}
              </button>
            )}
          </div>
          {errMsg && <span style={{ fontSize: 11, color: 'var(--red, #ef4444)', flexShrink: 0 }}>{errMsg}</span>}
        </div>
      )
    }

    if (campo.tipo === 'flags') {
      const opcoes    = Array.isArray(campo.opcoes) ? campo.opcoes : []
      const current   = String(val || '')
      const multiChar = opcoes.some(o => (o.valor || '').length > 1)
      const activeSet = new Set(
        multiChar
          ? current.split(',').map(s => s.trim()).filter(Boolean)
          : current.split('').filter(Boolean)
      )
      function handleFlagChange(codigo, checked) {
        const set = new Set(activeSet)
        if (checked) set.add(codigo)
        else set.delete(codigo)
        const novo = multiChar
          ? opcoes.map(o => o.valor).filter(v => v && set.has(v)).join(',')
          : opcoes.map(o => o.valor).filter(v => v && set.has(v)).join('')
        setField(campo.nome_campo, novo)
      }
      const isColuna = (campo.opcoes_layout || 'linha') === 'coluna'
      return (
        <div style={{ display: 'flex', flexDirection: isColuna ? 'column' : 'row', flexWrap: isColuna ? 'nowrap' : 'wrap', gap: isColuna ? 6 : '6px 20px', padding: '6px 10px', background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 6 }}>
          {opcoes.map((op, oi) => {
            if (!op.valor) return null
            const checked = activeSet.has(op.valor)
            return (
              <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: isRO ? 'default' : 'pointer', userSelect: 'none', fontSize: 13, color: checked ? 'var(--or)' : 'var(--t1)', fontWeight: checked ? 600 : 400 }}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isRO || saving}
                  onChange={e => handleFlagChange(op.valor, e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: 'var(--or)', cursor: isRO ? 'default' : 'pointer', flexShrink: 0 }}
                />
                {op.label || op.valor}
              </label>
            )
          })}
        </div>
      )
    }

    if (campo.tipo === 'pasta') {
      const listId = `datalist_${campo.nome_campo}`
      const sugest = pastasSugest[campo.nome_campo] || []
      return (
        <div style={{ position: 'relative', height: '100%' }}>
          <input
            className="form-input"
            list={listId}
            value={val}
            onChange={e => {
              setField(campo.nome_campo, e.target.value)
              // Recarrega sugestões ao digitar se ainda não carregado
              if (!pastasSugest[campo.nome_campo]) {
                window.api.formBuilder.valoresDistintos(nomeTabela, campo.nome_campo)
                  .then(v => setPastasSugest(p => ({ ...p, [campo.nome_campo]: v })))
                  .catch(() => {})
              }
            }}
            disabled={isRO || saving}
            placeholder={campo.valor_padrao || 'ex: Contratos'}
            style={{ height: '100%', width: '100%', ...inputStyle }}
          />
          <datalist id={listId}>
            {sugest.map((s, i) => <option key={i} value={s} />)}
          </datalist>
        </div>
      )
    }

    if (campo.tipo === 'data_hora') return (
      <input className="form-input" value={val}
        onChange={e => setField(campo.nome_campo, e.target.value)}
        disabled={isRO || saving}
        type="datetime-local"
        style={{ height: '100%', ...inputStyle }} />
    )

    if (campo.tipo === 'hora') return (
      <input className="form-input" value={val}
        onChange={e => setField(campo.nome_campo, e.target.value)}
        disabled={isRO || saving}
        type="time"
        style={{ height: '100%', ...inputStyle }} />
    )

    if (campo.tipo === 'url') return (
      <div style={{ display: 'flex', gap: 4, height: '100%' }}>
        <input className="form-input" value={val}
          onChange={e => setField(campo.nome_campo, e.target.value)}
          disabled={isRO || saving}
          placeholder="https://"
          type="url"
          style={{ flex: 1, height: '100%', ...inputStyle }} />
        {val && (
          <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 8px', height: '100%' }}
            onClick={() => window.api?.shell?.openExternal?.(val)}
            title="Abrir link">
            <Link size={13} />
          </button>
        )}
      </div>
    )

    if (campo.tipo === 'arquivo') {
      let arqMeta = null
      try { arqMeta = val ? JSON.parse(val) : null } catch { arqMeta = null }
      const subpasta = tela?.nome_tabela || 'anexos'
      if (compact) {
        // Layout designer: tudo dentro do container (espaço é fixo pelo usuário)
        return (
          <div className="form-input" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--s1)', cursor: 'default', fontSize: 12, color: arqMeta ? 'var(--t1)' : 'var(--t3)', overflow: 'hidden' }}>
            <Paperclip size={13} style={{ flexShrink: 0, color: arqMeta ? 'var(--or)' : 'var(--t3)' }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {arqMeta ? arqMeta.nome : (!isRO ? 'Selecionar arquivo...' : 'Sem arquivo')}
            </span>
            {arqMeta && <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>{fmtSize(arqMeta.tamanho)}</span>}
            {arqMeta && <button className="btn btn-ghost" style={{ flexShrink: 0, height: 24, fontSize: 11, padding: '0 6px' }} onClick={() => handleAbrirArquivo(arqMeta)}><ExternalLink size={11} /></button>}
            {!isRO && arqMeta && <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 2, flexShrink: 0 }} onClick={() => setArquivoComSatellites(campo.nome_campo, null)} title="Remover"><X size={12} /></button>}
            {!isRO && !arqMeta && <button className="btn btn-ghost" style={{ flexShrink: 0, height: 24, fontSize: 11, padding: '0 6px' }} onClick={async () => { const res = await window.api.arquivos.selecionarECopiar({ subpasta }); if (res?.ok) setArquivoComSatellites(campo.nome_campo, res) }} disabled={saving}><Upload size={11} /></button>}
          </div>
        )
      }
      // Layout grade: padrão idêntico ao Arquivos.jsx
      return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
          <div className="form-input" style={{ flex: 1, height: 37, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s1)', cursor: 'default', fontSize: 12, color: arqMeta ? 'var(--t1)' : 'var(--t3)' }}>
            <Paperclip size={14} style={{ flexShrink: 0, color: arqMeta ? 'var(--or)' : 'var(--t3)' }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {arqMeta ? arqMeta.nome : 'Nenhum arquivo selecionado'}
            </span>
            {arqMeta && (
              <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>{fmtSize(arqMeta.tamanho)}</span>
            )}
          </div>
          {!isRO && !arqMeta && (
            <button className="btn btn-ghost" style={{ flexShrink: 0 }}
              onClick={async () => {
                const res = await window.api.arquivos.selecionarECopiar({ subpasta })
                if (res?.ok) setArquivoComSatellites(campo.nome_campo, res)
              }}
              disabled={saving}>
              <Upload size={13} /> Selecionar
            </button>
          )}
          {arqMeta && (
            <>
              <button className="btn btn-ghost" style={{ flexShrink: 0 }} onClick={() => handleAbrirArquivo(arqMeta)}>
                <ExternalLink size={13} /> Abrir
              </button>
              <button className="btn btn-ghost" style={{ flexShrink: 0 }} onClick={() => handleCopiarLocal(arqMeta)}>
                <Download size={13} /> Copiar Local
              </button>
              <button className="btn btn-ghost" style={{ flexShrink: 0 }} onClick={() => handleCopiarClipboard(arqMeta)}>
                {copiado === 'clip' ? <Check size={13} color="var(--green)" /> : <Clipboard size={13} />}
                {copiado === 'clip' ? 'Copiado!' : 'Copiar'}
              </button>
              {!isRO && (
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 4, flexShrink: 0 }}
                  onClick={() => setArquivoComSatellites(campo.nome_campo, null)} title="Remover arquivo">
                  <X size={13} />
                </button>
              )}
            </>
          )}
        </div>
      )
    }

    if (campo.tipo === 'imagem') {
      const subpasta = tela?.nome_tabela || 'anexos'
      const FILTROS_IMG = [{ name: 'Imagens', extensions: ['jpg','jpeg','png','gif','webp','svg','bmp'] }]
      function ImagemCampo({ path, isRO, saving, onSelect, onClear }) {
        const [dataUrl, setDataUrl] = useState(null)
        useEffect(() => {
          if (!path) { setDataUrl(null); return }
          window.api.arquivos.lerBase64(path).then(r => r?.ok ? setDataUrl(r.dataUrl) : setDataUrl(null))
        }, [path])
        if (path && dataUrl) return (
          <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 80 }}>
            <img src={dataUrl} alt="imagem" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6, border: '1px solid var(--bd)' }} />
            {!isRO && (
              <>
                <button style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,.55)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', padding: '2px 6px', fontSize: 10 }} onClick={onClear}><X size={11} /></button>
                <button style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,.55)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', padding: '2px 6px', fontSize: 10 }} onClick={onSelect}><ImageIcon size={11} /></button>
              </>
            )}
          </div>
        )
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 80, background: 'var(--s2)', border: '1.5px dashed var(--bd)', borderRadius: 8, gap: 6, cursor: isRO ? 'default' : 'pointer' }}
            onClick={isRO || saving ? undefined : onSelect}>
            <ImageIcon size={24} style={{ color: 'var(--bd2)' }} />
            {!isRO && <span style={{ fontSize: 10, color: 'var(--t3)' }}>Clique para enviar imagem</span>}
          </div>
        )
      }
      const onSelect = async () => {
        const res = await window.api.arquivos.selecionarECopiar({ subpasta, filtros: FILTROS_IMG })
        if (res?.ok) setField(campo.nome_campo, res.path)
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', height: '100%' }}>
          <ImagemCampo path={val} isRO={isRO} saving={saving} onSelect={onSelect} onClear={() => setField(campo.nome_campo, '')} />
        </div>
      )
    }

    if (campo.tipo === 'avaliacao') {
      const max = Number(campo.opcoes?.max || campo.valor_padrao) || 5
      const nota = Number(val) || 0
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: '100%', padding: '0 4px' }}>
          {Array.from({ length: max }, (_, i) => (
            <Star key={i} size={18}
              style={{ color: i < nota ? '#FBBF24' : 'var(--bd2)', fill: i < nota ? '#FBBF24' : 'transparent', cursor: isRO ? 'default' : 'pointer', transition: 'color .15s' }}
              onClick={() => !isRO && !saving && setField(campo.nome_campo, i + 1 === nota ? 0 : i + 1)}
            />
          ))}
          {nota > 0 && <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 4 }}>{nota}/{max}</span>}
        </div>
      )
    }

    if (campo.tipo === 'progresso') {
      const pct = Math.max(0, Math.min(100, Number(val) || 0))
      return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, height: '100%', width: '100%', boxSizing: 'border-box', padding: '0 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t2)', marginBottom: 2 }}>
            <span>Progresso</span><span>{pct}%</span>
          </div>
          <div style={{ height: 8, background: 'var(--s3)', borderRadius: 4, overflow: 'hidden', width: '100%' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct < 40 ? '#22c55e' : pct < 70 ? '#eab308' : '#ef4444', borderRadius: 4, transition: 'width .3s' }} />
          </div>
          {!isRO && (
            <input type="range" min="0" max="100" value={pct}
              onChange={e => setField(campo.nome_campo, Number(e.target.value))}
              disabled={saving}
              style={{ width: '100%', accentColor: 'var(--or)', cursor: 'pointer' }} />
          )}
        </div>
      )
    }

    if (campo.tipo === 'cor') return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: '100%' }}>
        <input type="color" value={val || '#3B82F6'}
          onChange={e => setField(campo.nome_campo, e.target.value)}
          disabled={isRO || saving}
          style={{ width: 36, height: 36, borderRadius: 6, border: '2px solid var(--bd)', cursor: isRO ? 'default' : 'pointer', flexShrink: 0, padding: 2, background: 'none' }} />
        <input className="form-input" value={val || ''}
          onChange={e => setField(campo.nome_campo, e.target.value)}
          disabled={isRO || saving}
          placeholder="#3B82F6"
          maxLength={9}
          style={{ flex: 1, height: '100%', fontFamily: 'monospace', ...inputStyle }} />
      </div>
    )

    if (campo.tipo === 'percentual') return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: '100%' }}>
        <input className="form-input" value={val}
          onChange={e => setField(campo.nome_campo, e.target.value)}
          disabled={isRO || saving}
          type="number"
          min="0" max="100" step="0.01"
          placeholder="0"
          style={{ flex: 1, height: '100%', borderRadius: '8px 0 0 8px', ...inputStyle }} />
        <div style={{ padding: '0 10px', height: '100%', display: 'flex', alignItems: 'center', background: 'var(--s3)', border: '1px solid var(--bd)', borderLeft: 'none', borderRadius: '0 8px 8px 0', fontSize: 13, fontWeight: 700, color: 'var(--t2)', flexShrink: 0 }}>%</div>
      </div>
    )

    if (campo.tipo === 'calculo') {
      const opcCalc = campo.opcoes && !Array.isArray(campo.opcoes) ? campo.opcoes : {}
      const formula = opcCalc.formula || ''
      let resultado = ''
      if (formula) {
        try {
          const expr = formula.replace(/\{(\w+)\}/g, (_, k) => {
            const v = form[k]
            return (v !== undefined && v !== '' && !isNaN(Number(v))) ? Number(v) : 0
          })
          // eslint-disable-next-line no-new-func
          resultado = String(Math.round(new Function(`return (${expr})`)() * 100) / 100)
        } catch { resultado = 'Erro' }
      }
      return (
        <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: 6, height: '100%', cursor: 'default', background: 'rgba(255,107,43,.04)', borderColor: 'rgba(255,107,43,.3)' }}>
          <Calculator size={12} style={{ color: 'var(--or)', flexShrink: 0 }} />
          <span style={{ fontWeight: 700, color: 'var(--t1)', fontSize: 13 }}>{resultado || '—'}</span>
          {formula && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--t3)', fontFamily: 'monospace' }}>{formula}</span>}
        </div>
      )
    }

    if (campo.tipo === 'login') return (
      <div style={{ position: 'relative', height: '100%' }}>
        <input className="form-input" value={val}
          onChange={e => setField(campo.nome_campo, e.target.value)}
          disabled={isRO || saving}
          placeholder="usuario.login"
          type="text"
          autoComplete="username"
          style={{ height: '100%', paddingLeft: 32, ...inputStyle }} />
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--t3)', pointerEvents: 'none' }}>👤</span>
      </div>
    )

    if (campo.tipo === 'senha') {
      const registroId = form[tela?.campos?.find(c => c.tipo === 'codigo_auto')?.nome_campo || 'id']
      return (
        <div style={{ display: 'flex', gap: 4, height: '100%' }}>
          <div className="form-input" style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', color: 'var(--t3)', letterSpacing: 3, fontSize: 16 }}>
            {val ? '••••••••' : <span style={{ fontSize: 11, letterSpacing: 0, fontStyle: 'italic' }}>Sem senha definida</span>}
          </div>
          <button className="btn btn-ghost" disabled={isRO || saving || !registroId}
            style={{ flexShrink: 0, padding: '0 10px', height: '100%', fontSize: 11, whiteSpace: 'nowrap' }}
            onClick={() => { setRedefinirCampo(campo.nome_campo); setRedefinirNova(''); setRedefinirConf(''); setRedefinirErro(''); setRedefinirOpen(true) }}>
            Redefinir
          </button>
        </div>
      )
    }

    return (
      <input className="form-input" value={val}
        onChange={e => setField(campo.nome_campo, e.target.value)}
        disabled={isRO || saving}
        placeholder={campo.valor_padrao || ''}
        type={campo.tipo === 'data' ? 'date' : ['numero','moeda'].includes(campo.tipo) ? 'number' : campo.tipo === 'email' ? 'email' : 'text'}
        style={{ height: '100%', ...inputStyle }} />
    )
  }

  function renderLabel(campo, compact = false) {
    const semNegrito = campo.sem_negrito
    return (
      <label
        className={`form-label${semNegrito ? ' form-label--normal' : ''}`}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2, fontSize: campo.font_size ? `${campo.font_size}px` : '10px', color: campo.label_cor || undefined }}
      >
        <span>
          {campo.label}
          {campo.obrigatorio && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
        </span>
      </label>
    )
  }

  // ── Derivados ──────────────────────────────────────────────────────────────
  const isRO        = mode === 'view'
  const campos      = tela?.campos?.filter(c => c.ativo) || []
  const camposData  = campos.filter(c => !TIPOS_SISTEMA.includes(c.tipo))
  const camposModal = campos.filter(c => !TIPOS_SISTEMA.includes(c.tipo))
  const curReg      = registros[currentIdx]

  const temLayout = campos.some(c => c.x_pos > 0 || c.y_pos > 0 || c.w_px !== 280)
  const cfgW = temLayout
    ? Math.max(tela?.canvas_w || CANVAS_W, ...campos.map(c => (c.x_pos || 0) + (c.w_px || 280) + 16))
    : (tela?.canvas_w || CANVAS_W)
  const cfgH = tela?.canvas_h || CANVAS_H_MIN
  const canvasH = temLayout
    ? Math.max(cfgH, ...campos.map(c => (c.y_pos || 0) + (c.h_px || 60) + 40))
    : 'auto'

  const temFavCampo = campos.some(c => c.tipo === 'favorito')
  const temTsCampo  = campos.some(c => c.tipo === 'timestamps')
  const metaShowFav = !temFavCampo && tela?.col_favorito !== false
  const metaShowTs  = !temTsCampo  && tela?.col_timestamps !== false
  const mostrarMeta = curReg && isRO && (metaShowFav || metaShowTs)

  const campoCodigo = campos.find(c => c.nome_campo === 'codigo')
  const campoTitulo = campos.find(c => ['titulo', 'nome', 'descricao'].includes(c.nome_campo))
    ?? campos.filter(c => !TIPOS_SISTEMA.includes(c.tipo) && c.tipo === 'texto')[1]
  const tabLabel = curReg && isRO
    ? ([campoCodigo && String(curReg[campoCodigo.nome_campo] ?? ''), campoTitulo && String(curReg[campoTitulo.nome_campo] ?? '')].filter(Boolean).join(' · ') || `#${curReg.id}`)
    : null

  const thS = { padding: '7px 12px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1.2, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)', background: 'var(--s1)', textAlign: 'left' }
  const tdS = { padding: '7px 12px', fontSize: 11.5, color: 'var(--t2)', borderBottom: '1px solid var(--bd)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 180 }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--t3)', fontSize: 13 }}>Carregando...</div>
  if (erro && !tela) return <div style={{ padding: 32, color: 'var(--red)', fontSize: 13 }}>{erro}</div>

  return (
    <div className="page-with-footer">

      {/* Tab bar */}
      <div className="page-tabs">
        <button className={`page-tab${activeTab === 'acesso'   ? ' active' : ''}`} onClick={() => setActiveTab('acesso')}>Acesso</button>
        <button className={`page-tab${activeTab === 'cadastro' ? ' active' : ''}`} onClick={() => setActiveTab('cadastro')}>Cadastro</button>
        {mode !== 'view' && <span className="page-tab-info" style={{ color: 'var(--or)' }}>{mode === 'new' ? '● Novo registro' : '● Editando'}</span>}
        {tabLabel && activeTab === 'cadastro' && (
          <span className="page-tab-info">{tabLabel}</span>
        )}
        {/* Botões contextuais de arquivo */}
        {campos.some(c => c.tipo === 'arquivo') && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="btn btn-ghost" style={{ height: 28, fontSize: 11, gap: 5 }}
              onClick={handleImportarPasta} disabled={importando} title="Importar todos os arquivos de uma pasta">
              <FolderInput size={13} /> Importar Pasta
            </button>
            <button className="btn btn-ghost" style={{ height: 28, fontSize: 11, gap: 5, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              onClick={handleConfigurarPasta} title="Clique para alterar a pasta de arquivos">
              <Settings size={13} />
              <span style={{ fontFamily: 'monospace', fontSize: 10, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pastaConfig || 'Configurar pasta...'}
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="page-content" ref={contentRef}>
        {erro && <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(239,68,68,.4)', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: 'var(--red)', marginBottom: 4 }}>{erro}</div>}

        {/* ── Aba Acesso ── */}
        {activeTab === 'acesso' && (() => {
          const camposFiltro = camposData.filter(c => ['select','radio','pasta'].includes(c.tipo))
          const listaExibir  = fResultados ?? []
          const renderCell   = (c, reg) => {
            const v   = reg[c.nome_campo]
            const ops = Array.isArray(c.opcoes) ? c.opcoes : []
            if (c.tipo === 'booleano') return v ? '✓' : '—'
            if (c.tipo === 'radio' || c.tipo === 'select') {
              const op = ops.find(o => o.valor === v)
              return op ? <span style={{ color: op.cor||'var(--t2)', fontWeight: 600 }}>{op.label}</span> : String(v ?? '—')
            }
            if (c.tipo === 'lookup') {
              const lbl = (lookupOpcoes[c.nome_campo] || []).find(o => o.id === Number(v))?.label
              return lbl || (v ? `#${v}` : '—')
            }
            if (c.tipo === 'arquivo') {
              let meta = null; try { meta = v ? JSON.parse(v) : null } catch {}
              if (!meta) return '—'
              return <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ExtIcon ext={meta.ext} size={12} /><span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{meta.nome}</span><span style={{ fontSize:9.5, color:'var(--t3)', flexShrink:0 }}>{fmtSize(meta.tamanho)}</span></span>
            }
            if (c.tipo === 'avaliacao') {
              const nota = Number(v)||0, max = Number(c.opcoes?.max)||5
              return nota ? <span style={{ color:'#FBBF24' }}>{'★'.repeat(nota)}{'☆'.repeat(Math.max(0,max-nota))}</span> : '—'
            }
            if (c.tipo === 'cor') return v ? <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><span style={{ width:11, height:11, borderRadius:3, background:v, border:'1px solid var(--bd)', display:'inline-block' }}/>{v}</span> : '—'
            if (c.tipo === 'progresso') {
              const pct = Math.max(0,Math.min(100,Number(v)||0))
              return <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:50, height:5, background:'var(--s3)', borderRadius:3, overflow:'hidden', display:'inline-block' }}><span style={{ display:'block', height:'100%', width:`${pct}%`, background: pct<40?'#22c55e':pct<70?'#eab308':'#ef4444', borderRadius:3 }}/></span>{pct}%</span>
            }
            return String(v ?? '—')
          }
          return (
            <>
              {/* Barra de filtros */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', pointerEvents: 'none' }} />
                  <input className="form-input" style={{ paddingLeft: 30, height: 34 }}
                    placeholder={`Buscar${camposData.filter(c=>c.campo_busca).length ? ' (' + camposData.filter(c=>c.campo_busca).map(c=>c.label).join(', ') + ')' : '...'}...`}
                    value={fBusca} onChange={e => setFBusca(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleConsultarAcesso()} autoFocus />
                </div>
                {camposFiltro.map(c => {
                  const vals = pastasSugest[c.nome_campo] || []
                  const ops  = Array.isArray(c.opcoes) ? c.opcoes : []
                  return (
                    <select key={c.id} className="form-select" style={{ height: 34, minWidth: 130, maxWidth: 180 }}
                      value={fFiltros[c.nome_campo] || '__todos__'}
                      onChange={e => setFFiltros(f => ({ ...f, [c.nome_campo]: e.target.value }))}>
                      <option value="__todos__">Todos — {c.label}</option>
                      {ops.length
                        ? ops.map(o => <option key={o.valor} value={o.valor}>{o.label}</option>)
                        : vals.map(v => <option key={v} value={v}>{v || '(vazio)'}</option>)
                      }
                    </select>
                  )
                })}
                <button className="btn btn-primary" style={{ height: 34, padding: '0 14px', flexShrink: 0 }} onClick={handleConsultarAcesso} disabled={fConsultando || allLoading}>
                  {(fConsultando || allLoading) ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={13} />} {(fConsultando || allLoading) ? 'Carregando...' : 'Consultar'}
                </button>
                <button className="btn btn-ghost" style={{ height: 34, padding: '0 10px', flexShrink: 0 }} onClick={limparFiltrosAcesso} title="Limpar filtros">
                  <RotateCcw size={13} />
                </button>
                <button className="btn btn-ghost" style={{ height: 34, padding: '0 10px', flexShrink: 0, marginLeft: 'auto' }}
                  disabled={!fResultados?.length}
                  onClick={() => {
                    const dados = listaExibir.map(reg => {
                      const obj = {}
                      camposData.forEach(c => { obj[c.label] = reg[c.nome_campo] ?? '' })
                      return obj
                    })
                    exportarCSV(dados, `${tela?.nome_tela || 'dados'}.csv`)
                  }}>
                  <Download size={13} /> Exportar CSV
                </button>
              </div>

              {/* Estado inicial */}
              {fResultados === null && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)' }}>
                  <Search size={32} strokeWidth={1.25} style={{ marginBottom: 10, opacity: .4 }} />
                  <div style={{ fontSize: 13 }}>Configure os filtros e clique em Consultar</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>{total.toLocaleString('pt-BR')} registro{total !== 1 ? 's' : ''} no total</div>
                </div>
              )}

              {/* Tabela de resultados */}
              {fResultados !== null && (
                <div style={{ border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--sh-xs)' }}>
                  <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 270px)', minHeight: 100 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          <th style={{ ...thS, width: 18, padding: '7px 0 7px 8px' }}></th>
                          <th style={{ ...thS, textAlign: 'center', width: 36 }}>#</th>
                          {camposData.map(c => <th key={c.id} style={thS}>{c.label}</th>)}
                          {tela.col_favorito !== false && <th style={{ ...thS, textAlign: 'center' }}>Fav.</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {listaExibir.map((reg, ri) => {
                          const isCur = registros[currentIdx]?.id === reg.id
                          return (
                            <tr key={reg.id}
                              onClick={() => { const idx = registros.findIndex(r => r.id === reg.id); if (idx >= 0) { setCurrentIdx(idx); carregarForm(tela, registros[idx]) } }}
                              onDoubleClick={() => selecionarDaAcesso(reg)}
                              style={{ cursor: 'pointer', background: isCur ? 'rgba(255,107,43,.06)' : ri % 2 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                              onMouseEnter={e => { if (!isCur) e.currentTarget.style.background = 'var(--s3)' }}
                              onMouseLeave={e => { if (!isCur) e.currentTarget.style.background = ri % 2 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                            >
                              <td style={{ padding: '7px 0 7px 8px', width: 18, color: 'var(--or)', fontSize: 13, fontWeight: 700 }}>{isCur ? '›' : ''}</td>
                              <td style={{ ...tdS, textAlign: 'center', color: 'var(--t3)', fontSize: 10 }}>{ri + 1}</td>
                              {camposData.map(c => (
                                <td key={c.id} style={tdS}>{renderCell(c, reg)}</td>
                              ))}
                              {tela.col_favorito !== false && (
                                <td style={{ ...tdS, textAlign: 'center' }}>
                                  {reg.favorito ? <Star size={12} fill="var(--or)" color="var(--or)" /> : <span style={{ color: 'var(--bd2)' }}>—</span>}
                                </td>
                              )}
                            </tr>
                          )
                        })}
                        {listaExibir.length === 0 && (
                          <tr><td colSpan={camposData.length + 2} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)', fontSize: 11, fontStyle: 'italic' }}>Nenhum registro encontrado</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding: '6px 12px', borderTop: '1px solid var(--bd)', background: 'var(--s1)', fontSize: 10, color: 'var(--t3)' }}>
                    Total: <strong style={{ color: 'var(--t2)' }}>{listaExibir.length}</strong>
                    {listaExibir.length !== total && <span> (de {total.toLocaleString('pt-BR')} carregados)</span>}
                  </div>
                </div>
              )}
            </>
          )
        })()}

        {/* ── Aba Cadastro ── */}
        {activeTab === 'cadastro' && (
          <>
            {temLayout ? (
              /* Layout Designer (posicionamento absoluto) */
              <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'row', gap: 16, minHeight: 0, alignItems: 'flex-start' }}>
                <div style={{ position: 'relative', width: cfgW, minWidth: cfgW, minHeight: canvasH, flexShrink: 0, overflow: 'visible' }}>
                  {campos.map(campo => {
                    const x = campo.x_pos || 0
                    const y = campo.y_pos || 0
                    const w = campo.w_px  || 280
                    const h = campo.h_px  || 60

                    if (campo.tipo === 'divisor') {
                      const isVert = campo.valor_padrao === 'vertical'
                      const wS = Math.max(w, 16), hS = Math.max(h, 16)
                      return (
                        <div key={campo.id} style={{ position: 'absolute', left: x, top: y, width: wS, height: hS }}>
                          {isVert
                            ? <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, transform: 'translateX(-50%)', background: 'var(--bd2)' }} />
                            : <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, transform: 'translateY(-50%)', background: 'var(--bd2)' }} />}
                          {campo.label && (
                            <span style={{ position: 'absolute', top: isVert ? 4 : '50%', left: isVert ? '50%' : 6, transform: isVert ? 'translateX(-50%)' : 'translateY(-50%)', fontSize: 9, fontWeight: 700, color: 'var(--t3)', background: 'var(--bg)', padding: '0 4px', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', zIndex: 1 }}>
                              {campo.label}
                            </span>
                          )}
                        </div>
                      )
                    }

                    const SKIP_LABEL = ['booleano', 'botao', 'favorito', 'timestamps']
                    const NO_WRAPPER = ['botao', 'favorito', 'timestamps', 'copiar']

                    // Satélites de arquivo: renderizar como linha label/valor sem borda de input
                    const ARQ_SUFFIXES_W = ['_nome', '_ext', '_tamanho', '_path']
                    const arqSuffixW = ARQ_SUFFIXES_W.find(s => campo.nome_campo.endsWith(s))
                    if (arqSuffixW) {
                      const prefixoW = campo.nome_campo.slice(0, -arqSuffixW.length)
                      const isPaiArq = tela?.campos.find(c => c.nome_campo === prefixoW && c.tipo === 'arquivo')
                      if (isPaiArq) {
                        const valW = form[campo.nome_campo] ?? ''
                        let exibeW = '—'
                        if (valW) {
                          if (arqSuffixW === '_tamanho') exibeW = fmtSize(Number(valW)) || '—'
                          else if (arqSuffixW === '_ext') exibeW = String(valW).toUpperCase()
                          else exibeW = String(valW)
                        }
                        return (
                          <div key={campo.id} style={{ position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box', padding: '0 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                            <span style={{ fontSize: 11, color: 'var(--t3)', flexShrink: 0 }}>{campo.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: valW ? 'var(--t1)' : 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{exibeW}</span>
                          </div>
                        )
                      }
                    }

                    if (NO_WRAPPER.includes(campo.tipo)) {
                      return (
                        <div key={campo.id} style={{ position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box' }}>
                          {renderInput(campo, true)}
                        </div>
                      )
                    }
                    return (
                      <div key={campo.id} className="form-group" style={{ position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box', padding: '0 2px', display: 'flex', flexDirection: 'column', overflow: 'hidden', marginBottom: 0 }}>
                        {!SKIP_LABEL.includes(campo.tipo) && renderLabel(campo, true)}
                        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                          {renderInput(campo, true)}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {mostrarMeta && (
                  <MetaDados reg={curReg} onToggleFav={handleToggleFav} showFav={metaShowFav} showTs={metaShowTs} />
                )}
                {/* Sidebar de infos do arquivo */}
                {(() => {
                  const camposArq = campos.filter(c => c.tipo === 'arquivo')
                  const metas = camposArq.map(c => { try { return form[c.nome_campo] ? JSON.parse(form[c.nome_campo]) : null } catch { return null } }).filter(Boolean)
                  if (!metas.length) return null
                  return (
                    <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 2 }}>
                      {metas.map((meta, i) => (
                        <div key={i} style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 10, padding: '12px 14px' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Informações do Arquivo</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {[
                              ['Nome original', meta.nome],
                              ['Extensão',      meta.ext?.toUpperCase() || '—'],
                              ['Tamanho',       fmtSize(meta.tamanho)],
                            ].map(([k, v]) => (
                              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                <span style={{ color: 'var(--t3)' }}>{k}</span>
                                <span style={{ color: 'var(--t1)', fontWeight: 500, fontFamily: k === 'Extensão' ? 'monospace' : 'inherit' }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            ) : (
              /* Layout grade */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                {campos.map(campo => {
                  if (campo.tipo === 'divisor') return (
                    <div key={campo.id} style={{ gridColumn: '1 / -1', position: 'relative', height: 20, margin: '4px 0' }}>
                      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, transform: 'translateY(-50%)', background: 'var(--bd2)' }} />
                      {campo.label && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontWeight: 700, color: 'var(--t3)', background: 'var(--s1)', paddingRight: 8, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{campo.label}</span>}
                    </div>
                  )
                  if (campo.tipo === 'favorito') return (
                    <div key={campo.id} style={{ display: 'flex', alignItems: 'center', minHeight: 44 }}>
                      {renderInput(campo)}
                    </div>
                  )
                  if (campo.tipo === 'timestamps') return (
                    <div key={campo.id} style={{ gridColumn: '1 / -1' }}>
                      {renderInput(campo)}
                    </div>
                  )
                  if (campo.tipo === 'botao' || campo.tipo === 'copiar') return (
                    <div key={campo.id}
                      style={{ gridColumn: campo.largura >= 100 ? '1 / -1' : campo.largura >= 66 ? 'span 2' : 'span 1', display: 'flex', alignItems: 'center', minHeight: 37 }}>
                      {renderInput(campo)}
                    </div>
                  )
                  return (
                    <div key={campo.id} className="form-group"
                      style={{ gridColumn: campo.largura >= 100 ? '1 / -1' : campo.largura >= 66 ? 'span 2' : 'span 1' }}>
                      {campo.tipo !== 'booleano' && renderLabel(campo)}
                      <div style={{ height: ['texto_longo','radio','arquivo','flags','documento','cep'].includes(campo.tipo) ? 'auto' : 36 }}>
                        {renderInput(campo)}
                      </div>
                    </div>
                  )
                })}
                {mostrarMeta && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <MetaDados reg={curReg} onToggleFav={handleToggleFav} showFav={metaShowFav} showTs={metaShowTs} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal Pesquisa Padrão ── */}
      {showConsulta && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)' }}>
          <div
            style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14, boxShadow: 'var(--sh-lg)', width: 920, maxWidth: '96vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onKeyDown={e => {
              if (e.key === 'Escape') setShowConsulta(false)
              if (e.key === 'Enter') { const r = mResultados.find(r => r.id === mSelId); if (r) selecionarDaConsulta(r) }
            }}
          >
            {/* cabeçalho */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', background: 'var(--s2)', borderBottom: '1px solid var(--bd)' }}>
              <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--t1)' }}>Pesquisa Padrão — {tela?.nome_tela}</span>
              <button onClick={() => setShowConsulta(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 2 }}><X size={15} /></button>
            </div>

            {/* controles */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bd)', background: 'var(--s3)', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t2)', whiteSpace: 'nowrap', minWidth: 26 }}>Por:</label>
                  <select className="form-select" style={{ flex: 1, height: 30, fontSize: 12 }} value={mCampo}
                    onChange={e => { const v = e.target.value; setMCampo(v); rodarModal(v, mOrdem, mModo, mBusca) }}>
                    {camposModal.map(c => <option key={c.id} value={c.nome_campo}>{c.label}</option>)}
                  </select>
                  <select className="form-select" style={{ width: 124, height: 30, fontSize: 12 }} value={mOrdem}
                    onChange={e => { const v = e.target.value; setMOrdem(v); rodarModal(mCampo, v, mModo, mBusca) }}>
                    <option value="asc">Crescente</option>
                    <option value="desc">Decrescente</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t2)', whiteSpace: 'nowrap', minWidth: 46 }}>Buscar:</label>
                  <input ref={mBuscaRef} className="form-input" style={{ flex: 1, height: 30, fontSize: 12 }} value={mBusca}
                    onChange={e => { const v = e.target.value; setMBusca(v); rodarModal(mCampo, mOrdem, mModo, v) }}
                    placeholder="Digite para filtrar..." />
                </div>
              </div>
              <div style={{ border: '1px solid var(--bd)', borderRadius: 10, padding: '8px 14px', background: 'var(--s1)', boxShadow: 'var(--sh-xs)', flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>Buscar</div>
                {MODOS_MODAL.map(m => (
                  <label key={m.val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11.5, color: mModo === m.val ? 'var(--t1)' : 'var(--t3)', fontWeight: mModo === m.val ? 600 : 400, userSelect: 'none', marginBottom: 3 }}>
                    <input type="radio" checked={mModo === m.val}
                      onChange={() => { setMModo(m.val); rodarModal(mCampo, mOrdem, m.val, mBusca) }}
                      style={{ accentColor: 'var(--or)', cursor: 'pointer' }} />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>

            {/* grid de resultados */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {mLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--t3)', fontSize: 12 }}>Carregando registros...</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={{ ...thS, width: 20, padding: '7px 4px' }}></th>
                      <th style={{ ...thS, textAlign: 'center' }}>ID</th>
                      {camposModal.slice(0, 5).map(c => <th key={c.id} style={thS}>{c.label}</th>)}
                      {tela.col_favorito !== false && <th style={{ ...thS, textAlign: 'center' }}>Fav.</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {mResultados.map((r, ri) => {
                      const isSel = mSelId === r.id
                      return (
                        <tr key={r.id}
                          onClick={() => setMSelId(r.id)}
                          onDoubleClick={() => selecionarDaConsulta(r)}
                          style={{ cursor: 'pointer', background: ri % 2 !== 0 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--s3)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = ri % 2 !== 0 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                        >
                          <td style={{ padding: '7px 4px', width: 20, textAlign: 'center', color: 'var(--or)' }}>
                            {isSel ? <ChevronRight size={12} strokeWidth={2.5} /> : null}
                          </td>
                          <td style={{ ...tdS, textAlign: 'center', color: 'var(--t3)', fontSize: 11, fontFamily: 'monospace' }}>{r.id}</td>
                          {camposModal.slice(0, 5).map((c, ci) => {
                            const v = r[c.nome_campo]
                            let display = String(v ?? '—')
                            if (c.tipo === 'lookup') {
                              const lbl = (lookupOpcoes[c.nome_campo] || []).find(o => o.id === Number(v))?.label
                              display = lbl || (v ? `#${v}` : '—')
                            }
                            return (
                              <td key={c.id} style={{ ...tdS, color: ci === 0 ? 'var(--t1)' : 'var(--t2)', fontWeight: ci === 0 ? 500 : 400 }}>
                                {display}
                              </td>
                            )
                          })}
                          {tela.col_favorito !== false && (
                            <td style={{ ...tdS, textAlign: 'center' }}>
                              {r.favorito ? <Star size={12} fill="var(--or)" color="var(--or)" /> : <span style={{ color: 'var(--bd2)' }}>—</span>}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                    {mResultados.length === 0 && (
                      <tr><td colSpan={camposModal.slice(0, 5).length + (tela.col_favorito !== false ? 3 : 2)} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)', fontSize: 11, fontStyle: 'italic' }}>Nenhum registro encontrado</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* rodapé modal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderTop: '1px solid var(--bd)', background: 'var(--s3)' }}>
              <button className="btn btn-primary"
                onClick={() => { const r = mResultados.find(r => r.id === mSelId); if (r) selecionarDaConsulta(r) }}
                disabled={!mSelId} title="Confirmar (Enter)">
                <Check size={13} /> Confirmar
              </button>
              <button className="btn btn-ghost" onClick={() => setShowConsulta(false)} title="Fechar (Esc)">
                <X size={13} /> Fechar
              </button>
              <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 4 }}>
                {mResultados.length} registro{mResultados.length !== 1 ? 's' : ''}
                {mSelId ? ' — Enter ou duplo clique para abrir' : ' — selecione uma linha'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Lookup ── */}
      {/* ── Modal Redefinir Senha ── */}
      {redefinirOpen && (() => {
        const match = redefinirNova.length > 0 && redefinirConf.length > 0 && redefinirNova === redefinirConf
        const mismatch = redefinirConf.length > 0 && redefinirNova !== redefinirConf
        const tipoInput = redefinirMostrar ? 'text' : 'password'
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.55)' }}
            onClick={e => { if (e.target === e.currentTarget) setRedefinirOpen(false) }}>
            <div style={{ width: 400, background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'var(--s2)', borderBottom: '1px solid var(--bd)' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)' }}>🔑 Redefinir Senha</span>
                <button onClick={() => setRedefinirOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 2 }}><X size={15} /></button>
              </div>
              <div style={{ padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Nova senha */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nova senha</label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" type={tipoInput} value={redefinirNova} autoFocus
                      onChange={e => { setRedefinirNova(e.target.value); setRedefinirErro('') }}
                      placeholder="••••••••" style={{ height: 36, paddingRight: 36 }} />
                    <button type="button" onClick={() => setRedefinirMostrar(v => !v)}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 2 }}>
                      {redefinirMostrar ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                {/* Confirmar senha */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Confirmar senha</label>
                    {match && <span style={{ fontSize: 10, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}><Check size={11} /> Senhas iguais</span>}
                    {mismatch && <span style={{ fontSize: 10, color: '#f87171', fontWeight: 600 }}>✗ Não coincidem</span>}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" type={tipoInput} value={redefinirConf}
                      onChange={e => { setRedefinirConf(e.target.value); setRedefinirErro('') }}
                      placeholder="••••••••"
                      style={{ height: 36, paddingRight: 36, borderColor: match ? '#4ade80' : mismatch ? '#f87171' : undefined, transition: 'border-color .2s' }} />
                    <button type="button" onClick={() => setRedefinirMostrar(v => !v)}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 2 }}>
                      {redefinirMostrar ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                {redefinirErro && <div style={{ fontSize: 11, color: '#f87171', background: 'rgba(248,113,113,.1)', borderRadius: 6, padding: '6px 10px' }}>{redefinirErro}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px' }}>
                <button className="btn btn-primary" disabled={redefinirSaving}
                  onClick={async () => {
                    if (!redefinirNova) { setRedefinirErro('Digite a nova senha.'); return }
                    if (redefinirNova.length < 4) { setRedefinirErro('Mínimo 4 caracteres.'); return }
                    if (redefinirNova !== redefinirConf) { setRedefinirErro('As senhas não coincidem.'); return }
                    setRedefinirSaving(true)
                    try {
                      const pkCampo = tela?.campos?.find(c => c.tipo === 'codigo_auto')?.nome_campo || 'id'
                      const r = await window.api.auth.redefinirSenha({ tabelaUsuario: tela.nome_tabela, campoCodigo: pkCampo, id: form[pkCampo], novaSenha: redefinirNova })
                      if (r.ok) { setRedefinirOpen(false); setField(redefinirCampo, '***') }
                      else setRedefinirErro(r.erro || 'Erro ao redefinir senha.')
                    } catch (e) { setRedefinirErro(e.message) }
                    finally { setRedefinirSaving(false) }
                  }}>
                  {redefinirSaving ? 'Salvando...' : '✓ Confirmar'}
                </button>
                <button className="btn btn-ghost" onClick={() => setRedefinirOpen(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )
      })()}

      {lkpModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)' }}
          onClick={e => { if (e.target === e.currentTarget) setLkpModalOpen(false) }}>
          <div style={{ width: 520, maxWidth: '92vw', maxHeight: '80vh', background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', background: 'var(--s2)', borderBottom: '1px solid var(--bd)' }}>
              <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--t1)' }}>Selecionar — {lkpModalCampo?.label}</span>
              <button onClick={() => setLkpModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 2 }}><X size={15} /></button>
            </div>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--bd)' }}>
              <input className="form-input" value={lkpModalBusca}
                onChange={e => setLkpModalBusca(e.target.value)}
                placeholder="Filtrar..." autoFocus style={{ height: 32, width: '100%' }} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {lkpModalLoading ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--t3)', fontSize: 12 }}>Carregando...</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {lkpModalTodos
                      .filter(o => !lkpModalBusca.trim() || o.label.toLowerCase().includes(lkpModalBusca.toLowerCase()))
                      .map((o, ri) => {
                        const isSel = lkpModalSelId === o.id
                        return (
                          <tr key={o.id}
                            onClick={() => setLkpModalSelId(o.id)}
                            onDoubleClick={() => { setLkpModalSelId(o.id); setField(lkpModalCampo.nome_campo, o.id); setLkpModalOpen(false) }}
                            style={{ cursor: 'pointer', background: ri % 2 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--s3)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = ri % 2 ? 'rgba(0,0,0,.015)' : 'transparent' }}>
                            <td style={{ padding: '7px 4px', width: 20, textAlign: 'center', color: 'var(--or)' }}>
                              {isSel ? <ChevronRight size={12} strokeWidth={2.5} /> : null}
                            </td>
                            <td style={{ padding: '7px 10px', fontSize: 12, color: 'var(--t1)' }}>{o.label}</td>
                          </tr>
                        )
                      })}
                    {lkpModalTodos.filter(o => !lkpModalBusca.trim() || o.label.toLowerCase().includes(lkpModalBusca.toLowerCase())).length === 0 && (
                      <tr><td colSpan={2} style={{ padding: 32, textAlign: 'center', color: 'var(--t3)', fontSize: 11, fontStyle: 'italic' }}>Nenhum resultado</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid var(--bd)', background: 'var(--s2)' }}>
              <button className="btn btn-primary" onClick={confirmarLookupModal} disabled={!lkpModalSelId}>✓ Confirmar</button>
              <button className="btn btn-ghost"   onClick={() => setLkpModalOpen(false)}>✕ Fechar</button>
              {lkpModalSelId && <button className="btn btn-ghost" onClick={() => { setField(lkpModalCampo?.nome_campo, null); setLkpModalOpen(false) }}>Limpar seleção</button>}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Importação em Massa ── */}
      {importando && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14, boxShadow: 'var(--sh-lg)', width: 520, maxWidth: '94vw', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {importProg.fase === 'concluido'
                ? <CheckCircle2 size={22} color="var(--green, #22c55e)" />
                : (importProg.fase === 'cancelado' || importProg.fase === 'erro')
                  ? <XCircle size={22} color="var(--red, #ef4444)" />
                  : <Loader2 size={22} color="var(--or)" style={{ animation: 'spin 1s linear infinite' }} />}
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
            {importProg.total > 0 && (
              <div>
                <div style={{ height: 8, background: 'var(--s3)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, (importProg.atual / importProg.total) * 100)}%`,
                    background: importProg.fase === 'concluido' ? 'var(--green, #22c55e)' : importProg.fase === 'cancelado' ? 'var(--red, #ef4444)' : 'var(--or)',
                    borderRadius: 99, transition: 'width .2s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: 'var(--t3)' }}>
                  <span>{importProg.atual.toLocaleString('pt-BR')} de {importProg.total.toLocaleString('pt-BR')}</span>
                  <span>{Math.round((importProg.atual / importProg.total) * 100)}%</span>
                </div>
              </div>
            )}
            {importProg.arquivo && importProg.fase === 'importando' && (
              <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {importProg.arquivo}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Inseridos', val: importProg.inseridos, cor: 'var(--green, #22c55e)' },
                { label: 'Ignorados', val: importProg.ignorados, cor: 'var(--t3)'             },
              ].map(({ label, val, cor }) => (
                <div key={label} style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: cor, fontVariantNumeric: 'tabular-nums' }}>{(val || 0).toLocaleString('pt-BR')}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: .8 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {(importProg.fase === 'importando' || importProg.fase === 'escaneando') && (
                <button className="btn btn-danger" onClick={() => window.api.arquivos.cancelarImport()}>
                  <X size={13} /> Cancelar
                </button>
              )}
              {(importProg.fase === 'concluido' || importProg.fase === 'cancelado' || importProg.fase === 'erro') && (
                <button className="btn btn-primary" onClick={() => setImportando(false)}>
                  <CheckCircle2 size={13} /> Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Popover "ver registro relacionado" ── */}
      {lkpPopover && (
        <div style={{ position: 'fixed', left: lkpPopover.x, top: lkpPopover.y, zIndex: 1200, background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 10, boxShadow: 'var(--sh-lg)', padding: '10px 14px', minWidth: 200, maxWidth: 320 }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--t1)', fontWeight: 600, wordBreak: 'break-word' }}>{lkpPopover.label}</span>
            <button onClick={() => setLkpPopover(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', flexShrink: 0 }}><X size={13} /></button>
          </div>
        </div>
      )}
      {lkpPopover && <div style={{ position: 'fixed', inset: 0, zIndex: 1199 }} onClick={() => setLkpPopover(null)} />}

      {/* Modal Preview de arquivo */}
      {preview && (() => {
        const ext = (preview.ext || '').toLowerCase()
        const PREVIEW_IMG = ['png','jpg','jpeg','gif','bmp','webp','svg']
        const PREVIEW_PDF = ['pdf']
        const tipo = PREVIEW_IMG.includes(ext) ? 'img' : PREVIEW_PDF.includes(ext) ? 'pdf' : null
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) setPreview(null) }}>
            <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14, boxShadow: 'var(--sh-lg)', width: '90vw', height: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', background: 'var(--s2)', borderBottom: '1px solid var(--bd)', flexShrink: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview.nome}</span>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button className="btn btn-ghost" onClick={() => handleAbrirArquivo(preview)}><ExternalLink size={13} /> Abrir externamente</button>
                  <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 2 }}><X size={15} /></button>
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 8 }}>
                {tipo === 'img' && <img src={`file://${preview.path}`} alt={preview.nome} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />}
                {tipo === 'pdf' && <iframe src={`file://${preview.path}`} style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }} title={preview.nome} />}
                {!tipo && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--t3)' }}>
                    <Paperclip size={40} strokeWidth={1} />
                    <span style={{ fontSize: 13 }}>Preview não disponível para arquivos <strong style={{ color: 'var(--t1)' }}>.{ext.toUpperCase()}</strong></span>
                    <button className="btn btn-ghost" onClick={() => handleAbrirArquivo(preview)}><ExternalLink size={13} /> Abrir com aplicativo padrão</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Rodapé */}
      <div className="page-footer">
        <div className="page-footer-nav">
          <button className="page-footer-nav-btn" onClick={() => navTo(0)} disabled={currentIdx <= 0}><ChevronsLeft size={13} /></button>
          <button className="page-footer-nav-btn" onClick={() => navTo(currentIdx - 1)} disabled={currentIdx <= 0}><ChevronLeft size={13} /></button>
          <span className="page-footer-counter">{registros.length > 0 ? `${currentIdx + 1} / ${total}` : '0 / 0'}</span>
          <button className="page-footer-nav-btn" onClick={() => navTo(currentIdx + 1)} disabled={currentIdx >= registros.length - 1}><ChevronRight size={13} /></button>
          <button className="page-footer-nav-btn" onClick={() => navTo(registros.length - 1)} disabled={currentIdx >= registros.length - 1}><ChevronsRight size={13} /></button>
        </div>

        <div style={{ width: 1, height: 22, background: 'var(--bd)', flexShrink: 0 }} />

        <div className="page-footer-actions">
          {activeTab === 'cadastro' && (
            isRO ? (
              <>
                <button className="btn btn-primary"  onClick={handleIncluir}><Plus size={13} /> Incluir</button>
                <button className="btn btn-ghost"    onClick={handleAlterar} disabled={!registros.length}><Edit2 size={13} /> Alterar</button>
                <button className="btn btn-danger"   onClick={handleExcluir} disabled={!registros.length}><Trash2 size={13} /> Excluir</button>
                <button className="btn btn-ghost"    onClick={abrirConsulta}><Search size={13} /> Consultar</button>
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

// ── Metadados do registro (Criado em / Atualizado em / Favorito) ──────────────
function MetaDados({ reg, onToggleFav, showFav = true, showTs = true }) {
  if (!showFav && !showTs) return null
  return (
    <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 14, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        {showFav && (
          <label
            className="fav-check"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={e => { e.preventDefault(); onToggleFav() }}
          >
            <input type="checkbox" checked={!!reg.favorito} readOnly style={{ pointerEvents: 'none' }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              Marcar como favorito
              <Star size={12}
                fill={reg.favorito ? 'var(--or)' : 'none'}
                color={reg.favorito ? 'var(--or)' : 'currentColor'} />
            </span>
          </label>
        )}

        {showTs && (
          <>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'center' }}>Criado em</label>
                <div className="form-input" style={{ fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 37, background: 'var(--s1)', cursor: 'default', textAlign: 'center' }}>
                  {fmtDate(reg.criado_em)}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'center' }}>Atualizado em</label>
                <div className="form-input" style={{ fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 37, background: 'var(--s1)', cursor: 'default', textAlign: 'center' }}>
                  {fmtDate(reg.alterado_em)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
