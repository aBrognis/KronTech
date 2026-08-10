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
import PesquisaPadraoModal from '../components/PesquisaPadraoModal'
import {
  exportarCSV, copiarTexto, mostrarAlerta,
  abrirTela, abrirEmNovaAba, voltarTela, limparFormulario, exportarPDF,
} from '../lib/funcoes/index.js'
import { useFormBuilderArquivos } from './formBuilderView/hooks/useFormBuilderArquivos.js'
import { useAutoFillCnpjCep } from './formBuilderView/hooks/useAutoFillCnpjCep.js'
import { useLookupModal } from './formBuilderView/hooks/useLookupModal.js'
import { useConsultaModal } from './formBuilderView/hooks/useConsultaModal.js'
import { useFormBuilderAcesso } from './formBuilderView/hooks/useFormBuilderAcesso.js'
import AbaAcesso from './formBuilderView/AbaAcesso.jsx'
import {
  InputFavorito, InputTimestamps, InputBooleano, InputTextoLongo, InputSelect, InputRadio,
  InputCodigoAuto, InputFlags, InputAvaliacao, InputProgresso, InputCor, InputPercentual, InputCalculo,
} from './formBuilderView/inputs/InputBasico.jsx'
import { InputCPF, InputCNPJ, InputCEP, InputDocumento } from './formBuilderView/inputs/InputMascarado.jsx'
import { InputArquivoCampo, InputImagem } from './formBuilderView/inputs/InputArquivo.jsx'
import { InputLookup } from './formBuilderView/inputs/InputLookup.jsx'
import { InputSubGrid } from './formBuilderView/inputs/InputSubGrid.jsx'
import {
  InputPasta, InputDataHora, InputHora, InputUrl, InputLogin, InputSenha, InputPadrao,
} from './formBuilderView/inputs/InputEspecial.jsx'
import { maskCPF, maskCNPJ, maskCEP, maskCPFStr, maskCNPJStr, maskCEPStr } from '../lib/utils/masks.js'
import '../App.css'

const POR_PAG = 50

const TIPOS_SISTEMA = ['divisor', 'botao', 'favorito', 'timestamps', 'copiar', 'calculo', 'sub_grid']

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
  const [pastaConfig, setPastaConfig] = useState('')
  const [pastasSugest, setPastasSugest] = useState({}) // { nome_campo: ['val1','val2',...] }

  const [confirmExcluir, setConfirmExcluir] = useState(false)

  // Lookup
  const [lookupOpcoes,    setLookupOpcoes]    = useState({}) // { nome_campo: [{id, label}] }
  const [lkpPopover,      setLkpPopover]      = useState(null) // { label, x, y }

  const [allItems, setAllItems] = useState([]) // todos os registros, carregado uma vez
  const [camposOcultos, setCamposOcultos] = useState(() => new Set())

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

  const contentRef   = useRef(null)
  const cnpjBuscando = useRef(false)

  const {
    copiado, importando, importProg, setImportando,
    handleAbrirArquivo, handleCopiarLocal, handleCopiarClipboard,
    handleImportarPasta, setArquivoComSatellites, handleConfigurarPasta,
  } = useFormBuilderArquivos({ tela, nomeTabela, form, setForm, setErro, pagina, busca, carregar, setAllItems, setPastaConfig })

  const { docLoading, docErro, buscarCNPJ, buscarCEP } = useAutoFillCnpjCep({ form, setForm })

  const {
    lkpModalOpen, setLkpModalOpen, lkpModalCampo, lkpModalTodos,
    lkpModalBusca, setLkpModalBusca, lkpModalLoading, lkpModalSelId, setLkpModalSelId,
    openLookupModal, confirmarLookupModal,
  } = useLookupModal({ form, setField })

  const {
    showConsulta, setShowConsulta, campoInicial,
    abrirConsulta, selecionarDaConsulta,
  } = useConsultaModal({ tela, registros, currentIdx, carregarForm, carregar, setCurrentIdx, setMode, setActiveTab })

  const {
    fFiltros, setFiltroCampo, fBusca, setFBusca, fResultados, fLoading,
    fPagina, fPorPagina, irParaPagina, mudarPorPagina,
    fOrdenar, fDirecao, setOrdenacao,
    limparFiltrosAcesso, selecionarDaAcesso, handleBuscar,
  } = useFormBuilderAcesso({ nomeTabela, tela, registros, carregarForm, carregar, setCurrentIdx, setMode, setActiveTab })

  useEffect(() => { init() }, [nomeTabela])
  useEffect(() => { dispararAutomacao('ao_abrir') }, [nomeTabela])

  // Gatilho campo_muda: dispara automação por campo alterado, com debounce
  // de "parar de digitar" (não a cada tecla, evita excesso de disparos).
  const formAnteriorRef = useRef(form)
  useEffect(() => {
    if (mode === 'view') { formAnteriorRef.current = form; return }
    const timer = setTimeout(() => {
      const anterior = formAnteriorRef.current
      for (const campo of Object.keys(form)) {
        if (form[campo] !== anterior[campo]) dispararAutomacao('campo_muda', campo)
      }
      formAnteriorRef.current = form
    }, 600)
    return () => clearTimeout(timer)
  }, [form, mode])

  useEffect(() => {
    function onTelasUpdated() { init() }
    window.addEventListener('krontech:telas-updated', onTelasUpdated)
    return () => window.removeEventListener('krontech:telas-updated', onTelasUpdated)
  }, [nomeTabela])

  async function init() {
    setLoading(true); setErro(null); setImportando(false)
    try {
      const resTelas = await window.api.formBuilder.listarTelas(true)
      if (!resTelas.ok) throw new Error(resTelas.erro)
      const found = resTelas.data.find(t => t.nome_tabela === nomeTabela)
      if (!found) throw new Error(`Tela "${nomeTabela}" não encontrada.`)
      const resTela = await window.api.formBuilder.buscarTela(found.id)
      if (!resTela.ok) throw new Error(resTela.erro)
      const t = resTela.data
      setTela(t)
      onTituloChange?.(t.nome_tela, t.nome_tabela)
      // Carrega pasta configurada se a tela tiver campo arquivo
      if ((t.campos || []).some(c => c.tipo === 'arquivo')) {
        window.api.config.get().then(res => setPastaConfig((res.ok ? res.data?.Caminhos?.arquivos : '') || ''))
      }
      // Pré-carrega sugestões para campos do tipo pasta
      const camposPasta = (t.campos || []).filter(c => c.tipo === 'pasta' && c.nome_campo)
      if (camposPasta.length) {
        const map = {}
        await Promise.all(camposPasta.map(async c => {
          try {
            const res = await window.api.formBuilder.valoresDistintos(nomeTabela, c.nome_campo)
            map[c.nome_campo] = res.ok ? res.data : []
          }
          catch { map[c.nome_campo] = [] }
        }))
        setPastasSugest(map)
      }
      // Carrega a última página para posicionar no último registro
      const resPrimeiros = await window.api.formBuilder.listarRegistros(nomeTabela, { pagina: 1, porPagina: POR_PAG })
      if (!resPrimeiros.ok) throw new Error(resPrimeiros.erro)
      const totalReg = resPrimeiros.data.total
      const ultimaPag = Math.max(1, Math.ceil(totalReg / POR_PAG))
      await carregar(t, ultimaPag, '')
      // Carrega opções de campos lookup
      const lookupCampos = (t.campos || []).filter(c => c.tipo === 'lookup' && c.opcoes?.lookupTabela)
      if (lookupCampos.length) {
        const map = {}
        await Promise.all(lookupCampos.map(async c => {
          const cfg = c.opcoes
          const res = await window.api.formBuilder.listarOpcoesLookup(cfg.lookupTabela, cfg.lookupExibir, cfg.lookupCodigo || '', cfg.lookupFiltro)
          map[c.nome_campo] = res.ok ? res.data : []
        }))
        setLookupOpcoes(map)
      }
    } catch(e) { setErro(e.message) }
    finally    { setLoading(false) }
  }

  async function carregar(t = tela, pag = pagina, buscaVal = busca, manterIdReg = null) {
    if (!t) return
    const resp = await window.api.formBuilder.listarRegistros(nomeTabela, {
      pagina: pag, porPagina: POR_PAG, busca: buscaVal || undefined
    })
    if (!resp.ok) { setErro(resp.erro); return }
    const res = resp.data
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

  async function carregarForm(t, reg) {
    if (!t || !reg) return
    const f = { _id: reg.id }
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
    const camposSubGrid = t.campos.filter(c => c.ativo && c.tipo === 'sub_grid' && c.opcoes?.subGridTabela)
    if (camposSubGrid.length) {
      await Promise.all(camposSubGrid.map(async c => {
        const res = await window.api.formBuilder.listarSubGrid(c.opcoes.subGridTabela, c.opcoes.subGridParentColuna, reg.id)
        f[c.nome_campo] = res.ok ? res.data : []
      }))
    }
    setForm(f)
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
    tela.campos.filter(c => c.ativo && c.tipo === 'sub_grid').forEach(c => { f[c.nome_campo] = [] })
    for (const c of tela.campos.filter(c => c.ativo && c.sequencial)) {
      try {
        const res = await window.api.formBuilder.proximoCodigo(nomeTabela, c.nome_campo, c.valor_padrao, c.opcoes?.seqChars)
        if (!res.ok) throw new Error(res.erro)
        f[c.nome_campo] = res.data
      }
      catch { f[c.nome_campo] = c.valor_padrao || String(1).padStart(c.opcoes?.seqChars || 3, '0') }
    }
    if (tela.col_favorito !== false) f.favorito = false
    setForm(f); setMode('new'); setActiveTab('cadastro'); setErro(null)
  }

  function handleAlterar() {
    if (!registros.length) return
    carregarForm(tela, registros[currentIdx]); setMode('edit'); setErro(null)
  }

  async function dispararAutomacao(triggerTipo, triggerCampo) {
    try {
      const res = await window.api.automacao.disparar({
        triggerTipo, triggerTabela: nomeTabela, triggerCampo: triggerCampo || '', dados: form,
      })
      if (!res.ok || !res.data?.length) return
      for (const efeito of res.data) {
        if (efeito.tipo === 'alerta') {
          mostrarAlerta(efeito.mensagem || '', efeito.tipoAlerta || 'info')
        } else if (efeito.tipo === 'definir_valor' && efeito.campo) {
          setField(efeito.campo, efeito.valor ?? '')
        } else if (efeito.tipo === 'mostrar_campo' && efeito.campo) {
          setCamposOcultos(prev => { const n = new Set(prev); n.delete(efeito.campo); return n })
        } else if (efeito.tipo === 'ocultar_campo' && efeito.campo) {
          setCamposOcultos(prev => new Set(prev).add(efeito.campo))
        } else if (efeito.tipo === 'navegar' && efeito.destino) {
          abrirTela(efeito.destino)
        } else if (efeito.tipo === 'exportar_csv' && registros.length) {
          exportarCSV(registros, `${nomeTabela}.csv`)
        }
      }
    } catch { /* automação não deve travar o fluxo principal */ }
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

      const camposSubGrid = tela.campos.filter(c => c.ativo && c.tipo === 'sub_grid' && c.opcoes?.subGridTabela)
      const subGrids = {}
      camposSubGrid.forEach(c => { subGrids[c.nome_campo] = form[c.nome_campo] || [] })
      const temSubGrid = camposSubGrid.length > 0
      const campoComHook = camposSubGrid.find(c => c.opcoes?.posSaveHook)
      // Quando há um hook (ex: status calculado pelo servidor a partir das
      // parcelas), o campo status não deve ser enviado como veio do form —
      // o hook é quem decide o valor real.
      if (campoComHook && 'status' in dados) delete dados.status

      if (mode === 'new') {
        for (const c of tela.campos.filter(c => c.ativo && c.sequencial)) {
          const resCod = await window.api.formBuilder.proximoCodigo(nomeTabela, c.nome_campo, c.valor_padrao, c.opcoes?.seqChars)
          if (!resCod.ok) throw new Error(resCod.erro)
          dados[c.nome_campo] = resCod.data
        }
        const resNovo = campoComHook
          ? await window.api.formBuilder.inserirComSubGridHook(campoComHook.opcoes.posSaveHook, nomeTabela, dados, campoComHook.nome_campo, subGrids[campoComHook.nome_campo])
          : temSubGrid
            ? await window.api.formBuilder.inserirRegistroComSubGrids(nomeTabela, dados, subGrids)
            : await window.api.formBuilder.inserirRegistro(nomeTabela, dados)
        if (!resNovo.ok) throw new Error(resNovo.erro)
        const totalPosInsercao = total + 1
        const ultimaPag = Math.max(1, Math.ceil(totalPosInsercao / POR_PAG))
        await carregar(tela, ultimaPag, busca, resNovo.data?.id ?? null)
      } else {
        const idAtual = registros[currentIdx]?.id
        const resUpd = campoComHook
          ? await window.api.formBuilder.atualizarComSubGridHook(campoComHook.opcoes.posSaveHook, nomeTabela, idAtual, dados, campoComHook.nome_campo, subGrids[campoComHook.nome_campo], tela.col_timestamps !== false)
          : temSubGrid
          ? await window.api.formBuilder.atualizarRegistroComSubGrids(nomeTabela, idAtual, dados, subGrids, tela.col_timestamps !== false)
          : await window.api.formBuilder.atualizarRegistro(nomeTabela, idAtual, dados, tela.col_timestamps !== false)
        if (!resUpd.ok) throw new Error(resUpd.erro)
        await carregar(tela, pagina, busca, idAtual)
      }
      setMode('view')
      dispararAutomacao('ao_salvar')
    } catch(e) { setErro(e.message) }
    finally    { setSaving(false) }
  }

  async function handleExcluir() {
    if (!registros.length) return
    setConfirmExcluir(true)
  }

  async function confirmarExcluir() {
    setConfirmExcluir(false)
    try {
      const res = await window.api.formBuilder.excluirRegistro(nomeTabela, registros[currentIdx].id)
      if (!res.ok) throw new Error(res.erro)
      await carregar(tela, pagina, busca, null)
    } catch (e) {
      alert('Erro ao excluir: ' + (e.message || e))
    }
  }

  function handleDesistir() {
    if (registros.length) carregarForm(tela, registros[currentIdx])
    setMode('view'); setErro(null)
  }

  async function handleToggleFav() {
    if (!registros.length) return
    try {
      const res = await window.api.formBuilder.toggleFavorito(nomeTabela, registros[currentIdx].id, tela.col_timestamps !== false)
      if (!res.ok) throw new Error(res.erro)
      setRegistros(rs => rs.map((r, i) => i === currentIdx ? { ...r, favorito: res.data.favorito } : r))
    } catch(e) { console.error('toggleFavorito:', e) }
  }


  function setField(nome, val) { setForm(f => ({ ...f, [nome]: val })) }

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
      return <InputFavorito form={form} isRO={isRO} saving={saving} setField={setField} />
    }

    if (campo.tipo === 'timestamps') {
      return <InputTimestamps isRO={isRO} curReg={curReg} fmtDate={fmtDate} />
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
              const res = await window.api.formBuilder.inativarRegistro(nomeTabela, registros[currentIdx].id, tela.col_timestamps !== false)
              if (!res.ok) throw new Error(res.erro)
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

    if (campo.tipo === 'booleano') return <InputBooleano campo={campo} val={val} isRO={isRO} saving={saving} setField={setField} />

    if (campo.tipo === 'texto_longo') return <InputTextoLongo campo={campo} val={val} isRO={isRO} saving={saving} compact={compact} inputStyle={inputStyle} setField={setField} />

    if (campo.tipo === 'select') return <InputSelect campo={campo} val={val} ops={ops} isRO={isRO} saving={saving} setField={setField} />

    if (campo.tipo === 'radio') return <InputRadio campo={campo} val={val} ops={ops} isRO={isRO} saving={saving} setField={setField} />

    if (campo.tipo === 'codigo_auto') return <InputCodigoAuto val={val} />

    if (campo.tipo === 'lookup') return (
      <InputLookup campo={campo} val={val} isRO={isRO} saving={saving} setField={setField}
        lookupOpcoes={lookupOpcoes} openLookupModal={openLookupModal} setLkpPopover={setLkpPopover} />
    )

    if (campo.tipo === 'cpf') return <InputCPF campo={campo} val={val} isRO={isRO} saving={saving} setField={setField} />

    if (campo.tipo === 'cnpj') return <InputCNPJ campo={campo} val={val} isRO={isRO} saving={saving} compact={compact} inputStyle={inputStyle} setField={setField} docLoading={docLoading} docErro={docErro} buscarCNPJ={buscarCNPJ} />

    if (campo.tipo === 'cep') return <InputCEP campo={campo} val={val} isRO={isRO} saving={saving} compact={compact} inputStyle={inputStyle} setField={setField} docLoading={docLoading} docErro={docErro} buscarCEP={buscarCEP} />

    if (campo.tipo === 'documento') return <InputDocumento campo={campo} val={val} form={form} isRO={isRO} saving={saving} inputStyle={inputStyle} setField={setField} docLoading={docLoading} docErro={docErro} buscarCNPJ={buscarCNPJ} />

    if (campo.tipo === 'flags') return <InputFlags campo={campo} val={val} isRO={isRO} saving={saving} setField={setField} />

    if (campo.tipo === 'pasta') return (
      <InputPasta campo={campo} val={val} isRO={isRO} saving={saving} inputStyle={inputStyle} setField={setField}
        nomeTabela={nomeTabela} pastasSugest={pastasSugest} setPastasSugest={setPastasSugest} />
    )

    if (campo.tipo === 'data_hora') return <InputDataHora campo={campo} val={val} isRO={isRO} saving={saving} inputStyle={inputStyle} setField={setField} />

    if (campo.tipo === 'hora') return <InputHora campo={campo} val={val} isRO={isRO} saving={saving} inputStyle={inputStyle} setField={setField} />

    if (campo.tipo === 'url') return <InputUrl campo={campo} val={val} isRO={isRO} saving={saving} inputStyle={inputStyle} setField={setField} />

    if (campo.tipo === 'arquivo') return (
      <InputArquivoCampo campo={campo} val={val} tela={tela} isRO={isRO} saving={saving} compact={compact}
        fmtSize={fmtSize} copiado={copiado} setArquivoComSatellites={setArquivoComSatellites}
        handleAbrirArquivo={handleAbrirArquivo} handleCopiarLocal={handleCopiarLocal} handleCopiarClipboard={handleCopiarClipboard} />
    )

    if (campo.tipo === 'imagem') return <InputImagem campo={campo} val={val} tela={tela} isRO={isRO} saving={saving} setField={setField} />

    if (campo.tipo === 'avaliacao') return <InputAvaliacao campo={campo} val={val} isRO={isRO} saving={saving} setField={setField} />

    if (campo.tipo === 'progresso') return <InputProgresso campo={campo} val={val} isRO={isRO} saving={saving} setField={setField} />

    if (campo.tipo === 'cor') return <InputCor campo={campo} val={val} isRO={isRO} saving={saving} inputStyle={inputStyle} setField={setField} />

    if (campo.tipo === 'percentual') return <InputPercentual campo={campo} val={val} isRO={isRO} saving={saving} inputStyle={inputStyle} setField={setField} />

    if (campo.tipo === 'calculo') return <InputCalculo campo={campo} form={form} />

    if (campo.tipo === 'sub_grid') return <InputSubGrid campo={campo} val={val} isRO={isRO} saving={saving} setField={setField} />

    if (campo.tipo === 'login') return <InputLogin campo={campo} val={val} isRO={isRO} saving={saving} inputStyle={inputStyle} setField={setField} />

    if (campo.tipo === 'senha') return (
      <InputSenha campo={campo} val={val} form={form} isRO={isRO} saving={saving}
        setRedefinirCampo={setRedefinirCampo} setRedefinirNova={setRedefinirNova}
        setRedefinirConf={setRedefinirConf} setRedefinirErro={setRedefinirErro} setRedefinirOpen={setRedefinirOpen} />
    )

    return <InputPadrao campo={campo} val={val} isRO={isRO} saving={saving} inputStyle={inputStyle} setField={setField} />
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
        {activeTab === 'acesso' && (
          <AbaAcesso
            tela={tela} camposData={camposData} nomeTabela={nomeTabela} total={total} registros={registros}
            currentIdx={currentIdx} setCurrentIdx={setCurrentIdx} carregarForm={carregarForm}
            lookupOpcoes={lookupOpcoes} pastasSugest={pastasSugest} fmtSize={fmtSize} ExtIcon={ExtIcon}
            fFiltros={fFiltros} setFiltroCampo={setFiltroCampo} fBusca={fBusca} setFBusca={setFBusca}
            fResultados={fResultados} fLoading={fLoading}
            fPagina={fPagina} fPorPagina={fPorPagina} irParaPagina={irParaPagina} mudarPorPagina={mudarPorPagina}
            fOrdenar={fOrdenar} fDirecao={fDirecao} setOrdenacao={setOrdenacao}
            limparFiltrosAcesso={limparFiltrosAcesso}
            selecionarDaAcesso={selecionarDaAcesso} handleBuscar={handleBuscar}
          />
        )}

        {/* ── Aba Cadastro ── */}
        {activeTab === 'cadastro' && (
          <>
            {temLayout ? (
              /* Layout Designer (posicionamento absoluto) */
              <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'row', gap: 16, minHeight: 0, alignItems: 'flex-start' }}>
                <div style={{ position: 'relative', width: cfgW, minWidth: cfgW, minHeight: canvasH, flexShrink: 0, overflow: 'visible' }}>
                  {campos.map(campo => {
                    if (camposOcultos.has(campo.nome_campo)) return null
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
                  if (camposOcultos.has(campo.nome_campo)) return null
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
        <PesquisaPadraoModal
          titulo={`Pesquisa Padrão — ${tela?.nome_tela}`}
          campos={camposModal}
          colunasExibidas={camposModal.slice(0, 5)}
          campoInicial={campoInicial}
          mostrarFavorito={tela.col_favorito !== false}
          onBuscar={async (campo, modo, busca, ordenar, direcao) => {
            const res = await window.api.formBuilder.pesquisarRegistros(nomeTabela, { campo, modo, busca, ordenar, direcao })
            if (!res.ok) throw new Error(res.erro)
            return res.data
          }}
          onSelecionar={selecionarDaConsulta}
          onFechar={() => setShowConsulta(false)}
          renderCelula={(r, c) => {
            const v = r[c.nome_campo]
            if (c.tipo === 'lookup') {
              const lbl = (lookupOpcoes[c.nome_campo] || []).find(o => o.id === Number(v))?.label
              return lbl || (v ? `#${v}` : '—')
            }
            return String(v ?? '—')
          }}
        />
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
                      const r = await window.api.auth.redefinirSenha({ tabelaUsuario: tela.nome_tabela, campoCodigo: 'id', id: form._id, novaSenha: redefinirNova })
                      if (r.ok) { setRedefinirOpen(false) }
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

      {/* Rodapé (só na aba Cadastro) */}
      {activeTab === 'cadastro' && (
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
          {isRO ? (
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
          )}
        </div>
      </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmExcluir && (
        <div style={{ position:'fixed', inset:0, zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,.45)' }}>
          <div style={{ width:380, background:'var(--s1)', borderRadius:14, boxShadow:'var(--sh-lg)', overflow:'hidden' }}>
            <div style={{ padding:'20px 22px 10px', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(220,38,38,.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Trash2 size={16} color="var(--red)"/>
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:'var(--t1)' }}>Excluir registro</div>
                <div style={{ fontSize:12, color:'var(--t3)', marginTop:2 }}>Esta ação não pode ser desfeita.</div>
              </div>
            </div>
            <div style={{ padding:'8px 22px 20px', display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button className="btn btn-ghost" style={{ height:34, fontSize:12 }} onClick={() => setConfirmExcluir(false)}>Cancelar</button>
              <button className="btn btn-danger" style={{ height:34, fontSize:12 }} onClick={confirmarExcluir}>Excluir</button>
            </div>
          </div>
        </div>
      )}
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
