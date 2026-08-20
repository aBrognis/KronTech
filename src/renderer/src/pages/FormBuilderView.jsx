import { useState, useEffect, useRef } from 'react'
import {
  Plus, Save, X, Edit2, Search,
  ChevronsLeft, ChevronLeft, ChevronsRight,
  Download, Copy, Check, Star, RotateCcw,
  Building2, MapPin, CheckSquare, Square, Globe,
  ImageIcon, Palette, Link, Timer, Calculator, CalendarClock, Gauge, Percent,
  FolderInput, Settings, Clipboard, Upload,
} from 'lucide-react'
import { CANVAS_W, CANVAS_H_MIN } from '../components/FormDesigner'
import PesquisaPadraoModal from '../components/PesquisaPadraoModal'
import FormToolbar from '../components/FormToolbar'
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
import { InputSenhaCofre } from './formBuilderView/inputs/InputSenhaCofre.jsx'
import ModalRedefinirSenha from './formBuilderView/modais/ModalRedefinirSenha.jsx'
import ModalSelecaoLookup from './formBuilderView/modais/ModalSelecaoLookup.jsx'
import ModalImportacaoMassa from './formBuilderView/modais/ModalImportacaoMassa.jsx'
import ModalPreviewArquivo from './formBuilderView/modais/ModalPreviewArquivo.jsx'
import ModalConfirmarExclusao from './formBuilderView/modais/ModalConfirmarExclusao.jsx'
import { maskCPF, maskCNPJ, maskCEP, maskCPFStr, maskCNPJStr, maskCEPStr } from '../lib/utils/masks.js'
import { notificar } from '../components/Notificacao'
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
  if (!ts) return ''
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

// Tipos de campo que não usam o wrapper padrão de form-group (label + input) —
// compartilhado pelos dois motores de layout (absoluto e grade).
const SKIP_LABEL = ['booleano', 'botao', 'favorito', 'timestamps']
const NO_WRAPPER = ['botao', 'favorito', 'timestamps', 'copiar']
const ARQ_SUFFIXES = ['_nome', '_ext', '_tamanho', '_path']

// Campo satélite de arquivo (ex: "foto_nome", "foto_ext") é preenchido
// automaticamente a partir do campo "arquivo" pai — exibido como texto
// somente-leitura em vez de input. Retorna null se `campo` não for satélite.
function arquivoSatelliteInfo(campo, tela, val) {
  const suffix = ARQ_SUFFIXES.find(s => campo.nome_campo.endsWith(s))
  if (!suffix) return null
  const prefixo = campo.nome_campo.slice(0, -suffix.length)
  const campoArqPai = tela?.campos.find(c => c.nome_campo === prefixo && c.tipo === 'arquivo')
  if (!campoArqPai) return null
  let exibe = ''
  if (val) {
    if (suffix === '_tamanho') exibe = fmtSize(Number(val)) || ''
    else if (suffix === '_ext') exibe = String(val).toUpperCase()
    else exibe = String(val)
  }
  return { exibe }
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
    // Campos "senha_cofre" ficam salvos cifrados (AES) — descriptografa só
    // ao carregar o form em memória, nunca fica em texto puro no banco.
    const camposSenhaCofre = t.campos.filter(c => c.ativo && c.tipo === 'senha_cofre')
    if (camposSenhaCofre.length) {
      await Promise.all(camposSenhaCofre.map(async c => {
        if (!f[c.nome_campo]) return
        const res = await window.api.crypto.decrypt(f[c.nome_campo])
        f[c.nome_campo] = res.ok ? res.data : ''
      }))
    }
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
      // flags sempre iniciam vazias, valor_padrao não se aplica a flags
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

      // Campos "senha_cofre" só viajam cifrados (AES) — nunca em texto puro.
      const camposSenhaCofre = tela.campos.filter(c => c.ativo && c.tipo === 'senha_cofre')
      if (camposSenhaCofre.length) {
        await Promise.all(camposSenhaCofre.map(async c => {
          if (!dados[c.nome_campo]) return
          const res = await window.api.crypto.encrypt(dados[c.nome_campo])
          dados[c.nome_campo] = res.ok ? res.data : null
        }))
      }

      const camposSubGrid = tela.campos.filter(c => c.ativo && c.tipo === 'sub_grid' && c.opcoes?.subGridTabela)
      const subGrids = {}
      camposSubGrid.forEach(c => { subGrids[c.nome_campo] = form[c.nome_campo] || [] })
      const temSubGrid = camposSubGrid.length > 0
      const campoComHook = camposSubGrid.find(c => c.opcoes?.posSaveHook)
      // Quando há um hook (ex: status calculado pelo servidor a partir das
      // parcelas), o campo status não deve ser enviado como veio do form:
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
      notificar.erro('Erro ao excluir: ' + (e.message || e))
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

    // Campo satélite de arquivo (preenchido automaticamente)
    const satelite = arquivoSatelliteInfo(campo, tela, val)
    if (satelite) {
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', padding: '0 2px', gap: 8 }}>
          <span style={{ fontSize: 11, color: val ? 'var(--t1)' : 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'right', fontWeight: val ? 500 : 400 }}>
            {satelite.exibe}
          </span>
        </div>
      )
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
            if (await notificar.confirmar(`Arquivo copiado para:\n${r.destino}\n\nAbrir a pasta?`, { titulo: 'Arquivo copiado' }))
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
            if (!(await notificar.confirmar(msg, { titulo: 'Excluir registro', confirmarLabel: 'Excluir', perigo: true }))) return
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

    if (campo.tipo === 'senha_cofre') return <InputSenhaCofre campo={campo} val={val} tela={tela} isRO={isRO} saving={saving} setField={setField} />

    return <InputPadrao campo={campo} val={val} isRO={isRO} saving={saving} inputStyle={inputStyle} setField={setField} />
  }

  function renderLabel(campo, compact = false) {
    const semNegrito = campo.sem_negrito
    return (
      <label
        className={`form-label${semNegrito ? ' form-label--normal' : ''}`}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: campo.font_size ? `${campo.font_size}px` : '10px', color: campo.label_cor || undefined }}
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

        {/* Aba Acesso */}
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

        {/* Aba Cadastro */}
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

                    // Satélites de arquivo: renderizar como linha label/valor sem borda de input
                    const valW = form[campo.nome_campo] ?? ''
                    const sateliteW = arquivoSatelliteInfo(campo, tela, valW)
                    if (sateliteW) {
                      return (
                        <div key={campo.id} style={{ position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box', padding: '0 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                          <span style={{ fontSize: 11, color: 'var(--t3)', flexShrink: 0 }}>{campo.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: valW ? 'var(--t1)' : 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{sateliteW.exibe}</span>
                        </div>
                      )
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
                              ['Extensão',      meta.ext?.toUpperCase() || 'Desconhecida'],
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

      {/* Modal Pesquisa Padrão */}
      {showConsulta && (
        <PesquisaPadraoModal
          titulo={`Pesquisa Padrão · ${tela?.nome_tela}`}
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
              return lbl || (v ? `#${v}` : '')
            }
            return String(v ?? '')
          }}
        />
      )}

      {/* Modal Redefinir Senha */}
      {redefinirOpen && (
        <ModalRedefinirSenha
          tela={tela} formId={form._id}
          nova={redefinirNova} setNova={setRedefinirNova}
          conf={redefinirConf} setConf={setRedefinirConf}
          erro={redefinirErro} setErro={setRedefinirErro}
          saving={redefinirSaving} setSaving={setRedefinirSaving}
          mostrar={redefinirMostrar} setMostrar={setRedefinirMostrar}
          onFechar={() => setRedefinirOpen(false)}
          onSucesso={() => setRedefinirOpen(false)}
        />
      )}

      {/* Modal seleção lookup */}
      {lkpModalOpen && (
        <ModalSelecaoLookup
          campo={lkpModalCampo} todos={lkpModalTodos}
          busca={lkpModalBusca} setBusca={setLkpModalBusca}
          loading={lkpModalLoading} selId={lkpModalSelId} setSelId={setLkpModalSelId}
          onSelecionarCampo={setField}
          onConfirmar={confirmarLookupModal}
          onFechar={() => setLkpModalOpen(false)}
        />
      )}

      {/* Modal Importação em Massa */}
      {importando && (
        <ModalImportacaoMassa
          progresso={importProg}
          onCancelar={() => window.api.arquivos.cancelarImport()}
          onFechar={() => setImportando(false)}
        />
      )}

      {/* Popover "ver registro relacionado" */}
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
      {preview && (
        <ModalPreviewArquivo
          preview={preview}
          onAbrirExterno={handleAbrirArquivo}
          onFechar={() => setPreview(null)}
        />
      )}

      {/* Rodapé (só na aba Cadastro) */}
      {activeTab === 'cadastro' && (
        <FormToolbar
          mode={mode}
          nav={{ currentIdx, total: registros.length > 0 ? total : 0, onNav: navTo }}
          temRegistros={!!registros.length}
          saving={saving}
          onIncluir={handleIncluir}
          onAlterar={handleAlterar}
          onExcluir={handleExcluir}
          onConsultar={abrirConsulta}
          onGravar={handleGravar}
          onDesistir={handleDesistir}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmExcluir && (
        <ModalConfirmarExclusao
          onCancelar={() => setConfirmExcluir(false)}
          onConfirmar={confirmarExcluir}
        />
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
                <div className="form-input" style={{ fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--s1)', cursor: 'default', textAlign: 'center' }}>
                  {fmtDate(reg.criado_em)}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'center' }}>Atualizado em</label>
                <div className="form-input" style={{ fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--s1)', cursor: 'default', textAlign: 'center' }}>
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
