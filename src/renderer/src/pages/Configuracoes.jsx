import { useState, useEffect, useRef } from 'react'
import { Palette, User, Save, RotateCcw, Pencil, Check, X, LayoutDashboard, Bell, Search, DatabaseZap, FolderOpen, Loader2, ChevronDown, KeyRound, Copy as CopyIcon, Rocket, Bot, Plus } from 'lucide-react'
import { notificar } from '../components/Notificacao'
import { LabelComAjuda } from '../components/AjudaPopover'
import ImportarBancoModal from '../components/ImportarBancoModal'
import LancarVersaoModal from '../components/LancarVersaoModal'

const CORES = [
  { nome: 'KronTech',  hex: '#D95218' },
  { nome: 'Âmbar',    hex: '#F59E0B' },
  { nome: 'Lima',     hex: '#84CC16' },
  { nome: 'Verde',    hex: '#10B981' },
  { nome: 'Ciano',    hex: '#06B6D4' },
  { nome: 'Azul',     hex: '#3B82F6' },
  { nome: 'Índigo',   hex: '#6366F1' },
  { nome: 'Roxo',     hex: '#8B5CF6' },
  { nome: 'Rosa',     hex: '#EC4899' },
  { nome: 'Vermelho', hex: '#EF4444' },
]

const VAZIO = {
  cor: '#D95218', nomeSistema: 'KronTech',
  nomeUsuario: 'Anderson', cargoUsuario: 'Administrador',
}

export function aplicarCorSistema(hex) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const L = (n, a) => Math.min(255, n + a)
  const D = (n, a) => Math.max(0,   n - a)
  const r2 = Math.round(r * .87), g2 = Math.round(g * .87), b2 = Math.round(b * .87)

  let el = document.getElementById('kron-color-override')
  if (!el) {
    el = document.createElement('style')
    el.id = 'kron-color-override'
    document.head.appendChild(el)
  }
  el.textContent = `
    :root, html.light {
      --or:  ${hex} !important;
      --or2: rgb(${r2},${g2},${b2}) !important;
      --or3: rgba(${r},${g},${b},.12) !important;
      --or4: rgba(${r},${g},${b},.06) !important;
    }
    .btn-primary {
      background: linear-gradient(180deg,
        rgb(${L(r,18)},${L(g,18)},${L(b,18)}) 0%,
        ${hex} 55%,
        rgb(${r2},${g2},${b2}) 100%) !important;
      box-shadow:
        0 1px 0 rgba(255,255,255,.18) inset,
        0 -1px 0 rgba(0,0,0,.12) inset,
        0 2px 6px rgba(${r},${g},${b},.4),
        0 1px 2px rgba(0,0,0,.2) !important;
    }
    .btn-primary:hover {
      background: linear-gradient(180deg,
        rgb(${L(r,28)},${L(g,28)},${L(b,28)}) 0%,
        rgb(${L(r,14)},${L(g,14)},${L(b,14)}) 55%,
        rgb(${L(r,4)},${L(g,4)},${L(b,4)}) 100%) !important;
      box-shadow:
        0 1px 0 rgba(255,255,255,.18) inset,
        0 -1px 0 rgba(0,0,0,.12) inset,
        0 0 22px rgba(${r},${g},${b},.55),
        0 4px 16px rgba(${r},${g},${b},.35),
        0 2px 4px rgba(0,0,0,.2) !important;
    }
    .btn-primary:active {
      background: linear-gradient(180deg,
        rgb(${D(r,18)},${D(g,18)},${D(b,18)}) 0%,
        rgb(${D(r,28)},${D(g,28)},${D(b,28)}) 100%) !important;
    }
    .form-input:focus,
    .form-select:focus,
    .form-textarea:focus,
    .search-input:focus {
      box-shadow: 0 0 0 3.5px rgba(${r},${g},${b},.14), var(--sh-xs) !important;
    }
    .btn-outline {
      color: var(--or) !important;
      border-color: rgba(${r},${g},${b},.3) !important;
    }
    .btn-outline:hover {
      background: rgba(${r},${g},${b},.07) !important;
      border-color: rgba(${r},${g},${b},.5) !important;
      box-shadow: 0 4px 12px rgba(${r},${g},${b},.15) !important;
    }
    .sb-av {
      box-shadow: 0 0 12px rgba(${r},${g},${b},.4) !important;
    }
    .sb::before {
      background: radial-gradient(ellipse at 50% 0%, rgba(${r},${g},${b},.1) 0%, transparent 70%) !important;
    }
    html.light .sb::before {
      background: radial-gradient(ellipse at 50% 0%, rgba(${r},${g},${b},.07) 0%, transparent 70%) !important;
    }
    .sb-logo-icon {
      filter: drop-shadow(0 0 10px rgba(${r},${g},${b},.35)) !important;
    }
    .sb-logo-icon:hover {
      filter: drop-shadow(0 0 16px rgba(${r},${g},${b},.6)) !important;
    }
    .ni.active {
      background: linear-gradient(90deg,
        rgba(${r},${g},${b},.11) 0%,
        rgba(${r},${g},${b},.03) 60%,
        transparent 100%) !important;
    }
    .ni.active::before {
      background: linear-gradient(180deg,
        rgb(${L(r,25)},${L(g,25)},${L(b,25)}),
        ${hex},
        rgb(${r2},${g2},${b2})) !important;
      box-shadow: 2px 0 10px rgba(${r},${g},${b},.5) !important;
    }
    .ni.active .ni-icon {
      filter: drop-shadow(0 0 6px rgba(${r},${g},${b},.7)) !important;
    }
    .email-conta-item.ativo,
    .email-sublista-item.ativo,
    .email-item-linha.ativa,
    .email-item-linha.selecionada {
      background: linear-gradient(90deg,
        rgba(${r},${g},${b},.11) 0%,
        rgba(${r},${g},${b},.03) 60%,
        transparent 100%) !important;
    }
    .email-conta-item.ativo::before,
    .email-sublista-item.ativo::before,
    .email-item-linha.ativa::before {
      background: linear-gradient(180deg,
        rgb(${L(r,25)},${L(g,25)},${L(b,25)}),
        ${hex},
        rgb(${r2},${g2},${b2})) !important;
      box-shadow: 2px 0 10px rgba(${r},${g},${b},.5) !important;
    }
    .email-conta-item.ativo .email-conta-item-icone {
      color: ${hex} !important;
      filter: drop-shadow(0 0 6px rgba(${r},${g},${b},.7)) !important;
    }
    .email-conta-item.drop-alvo {
      background: linear-gradient(90deg,
        rgba(${r},${g},${b},.16) 0%,
        rgba(${r},${g},${b},.05) 70%,
        transparent 100%) !important;
      box-shadow: inset 0 0 0 1px ${hex} !important;
    }
    .email-drag-fantasma { background: ${hex} !important; }
    .email-drag-fantasma .email-drag-fantasma-badge { color: ${hex} !important; }
    .tab-item.active {
      background: linear-gradient(180deg, rgba(${r},${g},${b},.11) 0%, rgba(${r},${g},${b},.03) 60%, transparent 100%) !important;
      border-color: rgba(${r},${g},${b},.2) !important;
    }
    .tab-item.active::after {
      background: linear-gradient(90deg, rgb(${L(r,20)},${L(g,20)},${L(b,20)}), ${hex}, rgb(${D(r,10)},${D(g,10)},${D(b,10)})) !important;
    }
    .tab-item.active .tab-icon {
      filter: drop-shadow(0 0 4px rgba(${r},${g},${b},.5)) !important;
    }
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 12px rgba(${r},${g},${b},0.3); }
      50%       { box-shadow: 0 0 24px rgba(${r},${g},${b},0.5), 0 0 48px rgba(${r},${g},${b},0.15); }
    }
  `
}

const VAZIO_BANCO_PROD = { host: '', port: '5432', database: '', usuario: '', senha: '', iniPath: '' }
const VAZIO_BANCO_DEV  = { host: '', port: '5432', database: '', usuario: '', senha: '' }

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState('personalizacao') // personalizacao | configuracoes
  const pickerRef  = useRef(null)
  const [editando, setEditando] = useState(false)
  const [saved,    setSaved]    = useState(VAZIO)
  const [form,     setForm]     = useState(VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [salvo,    setSalvo]    = useState(false)

  const [isDev, setIsDev] = useState(false)
  const [editandoBancoProd, setEditandoBancoProd] = useState(false)
  const [savedBancoProd, setSavedBancoProd] = useState(VAZIO_BANCO_PROD)
  const [bancoProd, setBancoProd] = useState(VAZIO_BANCO_PROD)
  const [salvandoBancoProd, setSalvandoBancoProd] = useState(false)
  const [salvoBancoProd, setSalvoBancoProd] = useState(false)
  const [testandoConexao, setTestandoConexao] = useState(false)
  const [resultadoTeste, setResultadoTeste] = useState(null) // { ok, mensagem }
  const [importBancoOpen, setImportBancoOpen] = useState(false)
  const [lancarVersaoOpen, setLancarVersaoOpen] = useState(false)

  const [editandoBancoDev, setEditandoBancoDev] = useState(false)
  const [savedBancoDev, setSavedBancoDev] = useState(VAZIO_BANCO_DEV)
  const [bancoDev, setBancoDev] = useState(VAZIO_BANCO_DEV)
  const [salvandoBancoDev, setSalvandoBancoDev] = useState(false)
  const [salvoBancoDev, setSalvoBancoDev] = useState(false)
  const [testandoConexaoDev, setTestandoConexaoDev] = useState(false)
  const [resultadoTesteDev, setResultadoTesteDev] = useState(null)

  const [gerandoToken, setGerandoToken] = useState(false)
  const [tokenGerado, setTokenGerado]   = useState(null) // { token, expira_em }
  const [escopoToken, setEscopoToken]   = useState('importacao')
  const [tokenCopiado, setTokenCopiado] = useState(false)

  const [githubToken, setGithubToken]         = useState('')
  const [salvandoGithubToken, setSalvandoGithubToken] = useState(false)
  const [salvoGithubToken, setSalvoGithubToken] = useState(false)

  const [anthropicApiKey, setAnthropicApiKey]         = useState('')
  const [salvandoAnthropicApiKey, setSalvandoAnthropicApiKey] = useState(false)
  const [salvoAnthropicApiKey, setSalvoAnthropicApiKey] = useState(false)

  const [cnpjaToken, setCnpjaToken] = useState('')
  const [salvandoCnpjaToken, setSalvandoCnpjaToken] = useState(false)
  const [salvoCnpjaToken, setSalvoCnpjaToken] = useState(false)
  async function salvarCnpjaTokenHandler() {
    if (!cnpjaToken.trim()) return
    setSalvandoCnpjaToken(true); setSalvoCnpjaToken(false)
    try {
      const res = await window.api.config.salvarCnpjaToken(cnpjaToken.trim())
      if (res?.ok !== false) { setSalvoCnpjaToken(true); setCnpjaToken(''); setTimeout(() => setSalvoCnpjaToken(false), 2500) }
    } finally { setSalvandoCnpjaToken(false) }
  }

  // Prompts de IA (prompt_ia_001) — CRUD via modal. A lista mostra todos;
  // Incluir/Alterar abrem o modal onde se define area, codigo, nome e texto.
  const [promptsIa, setPromptsIa] = useState([])
  const [promptModal, setPromptModal] = useState(null)
  const [salvandoPromptModal, setSalvandoPromptModal] = useState(false)
  const [erroPromptModal, setErroPromptModal] = useState(null)
  const [excluindoPromptId, setExcluindoPromptId] = useState(null)

  // Client ID do Azure para o login OAuth do Outlook (fallback global do
  // .ini; cada conta pode ter o seu). Nao e segredo (client publico PKCE).
  const [outlookClientId, setOutlookClientId] = useState('')
  const [salvandoOutlookClientId, setSalvandoOutlookClientId] = useState(false)
  const [salvoOutlookClientId, setSalvoOutlookClientId] = useState(false)

  useEffect(() => {
    window.api.email?.obterOutlookClientId?.()
      .then(r => setOutlookClientId(r?.data?.clientId || r?.clientId || ''))
      .catch(() => {})
  }, [])

  async function salvarOutlookClientIdHandler() {
    setSalvandoOutlookClientId(true)
    setSalvoOutlookClientId(false)
    try {
      const res = await window.api.email.salvarOutlookClientId(outlookClientId.trim())
      if (res?.ok !== false) { setSalvoOutlookClientId(true); setTimeout(() => setSalvoOutlookClientId(false), 2500) }
    } finally {
      setSalvandoOutlookClientId(false)
    }
  }

  // Provedores de IA (ia_provedor_001) — CRUD via modal.
  const [iaProvedores, setIaProvedores] = useState([])
  const [modelosSugeridos, setModelosSugeridos] = useState({})
  const [provModal, setProvModal] = useState(null) // { modo, id?, form }
  const [salvandoProvModal, setSalvandoProvModal] = useState(false)
  const [erroProvModal, setErroProvModal] = useState(null)
  const [excluindoProvId, setExcluindoProvId] = useState(null)

  const TIPOS_IA = [
    { valor: 'anthropic', label: 'Claude (Anthropic)' },
    { valor: 'openai', label: 'OpenAI / compatível' },
    { valor: 'gemini', label: 'Google Gemini' },
  ]
  const rotuloTipoIa = v => TIPOS_IA.find(t => t.valor === v)?.label || v

  function abrirProvNovo() {
    setErroProvModal(null)
    setProvModal({ modo: 'novo', form: { codigo: '', nome: '', tipoApi: 'anthropic', modelo: '', baseUrl: '', apiKey: '' } })
  }
  function abrirProvEditar(p) {
    setErroProvModal(null)
    setProvModal({ modo: 'editar', id: p.id, form: { codigo: p.codigo, nome: p.nome, tipoApi: p.tipo_api, modelo: p.modelo, baseUrl: p.base_url || '', apiKey: '' } })
  }
  function setProvForm(campo, valor) {
    setProvModal(m => m && ({ ...m, form: { ...m.form, [campo]: valor } }))
  }
  async function salvarProvModal() {
    if (!provModal || salvandoProvModal) return
    const f = provModal.form
    if (!f.nome.trim() || !f.modelo.trim() || (provModal.modo === 'novo' && (!f.codigo.trim() || !f.apiKey.trim()))) {
      setErroProvModal('Preencha nome, código, modelo e a chave de API.')
      return
    }
    setSalvandoProvModal(true)
    setErroProvModal(null)
    try {
      const payload = { nome: f.nome.trim(), tipoApi: f.tipoApi, modelo: f.modelo.trim(), baseUrl: f.baseUrl.trim() || undefined }
      const res = provModal.modo === 'novo'
        ? await window.api.iaProvedor.criar({ codigo: f.codigo.trim(), ...payload, apiKey: f.apiKey.trim() })
        : await window.api.iaProvedor.editar(provModal.id, { ...payload, apiKey: f.apiKey.trim() || undefined })
      if (!res.ok) { setErroProvModal(res.erro); return }
      const lista = await window.api.iaProvedor.listar()
      if (lista.ok) setIaProvedores(lista.data || [])
      setProvModal(null)
    } finally {
      setSalvandoProvModal(false)
    }
  }
  async function excluirProvIa(p) {
    if (excluindoProvId) return
    const ok = await notificar.confirmar(
      `Excluir o provedor "${p.nome}"? Os prompts que o usam ficarão sem provedor até você reconfigurá-los.`,
      { titulo: 'Excluir provedor de IA', confirmarLabel: 'Excluir', perigo: true }
    )
    if (!ok) return
    setExcluindoProvId(p.id)
    try {
      const res = await window.api.iaProvedor.excluir(p.id)
      if (res.ok) setIaProvedores(list => list.filter(x => x.id !== p.id))
      else notificar.erro(res.erro)
    } finally {
      setExcluindoProvId(null)
    }
  }

  const AREAS_PROMPT = [
    { valor: 'email', label: 'E-mail' },
    { valor: 'documento', label: 'Documentos' },
    { valor: 'geral', label: 'Geral' },
  ]
  const rotuloArea = v => AREAS_PROMPT.find(a => a.valor === v)?.label || v

  function abrirPromptNovo() {
    setErroPromptModal(null)
    setPromptModal({ modo: 'novo', form: { codigo: '', nome: '', categoria: 'email', descricao: '', promptSistema: '', iaProvedorId: iaProvedores[0]?.id ?? '' } })
  }
  function abrirPromptEditar(p) {
    setErroPromptModal(null)
    setPromptModal({ modo: 'editar', id: p.id, form: { codigo: p.codigo, nome: p.nome, categoria: p.categoria, descricao: p.descricao || '', promptSistema: p.prompt_sistema, iaProvedorId: p.ia_provedor_id ?? '' } })
  }
  function setPromptForm(campo, valor) {
    setPromptModal(m => m && ({ ...m, form: { ...m.form, [campo]: valor } }))
  }
  async function salvarPromptModal() {
    if (!promptModal || salvandoPromptModal) return
    const f = promptModal.form
    if (!f.nome.trim() || !f.promptSistema.trim() || (promptModal.modo === 'novo' && !f.codigo.trim())) {
      setErroPromptModal('Preencha nome, código e o texto do prompt.')
      return
    }
    setSalvandoPromptModal(true)
    setErroPromptModal(null)
    try {
      const iaProvedorId = f.iaProvedorId ? Number(f.iaProvedorId) : null
      const res = promptModal.modo === 'novo'
        ? await window.api.promptIa.criar({ codigo: f.codigo.trim(), nome: f.nome.trim(), categoria: f.categoria, descricao: f.descricao.trim() || undefined, promptSistema: f.promptSistema, iaProvedorId })
        : await window.api.promptIa.editar(promptModal.id, { nome: f.nome.trim(), categoria: f.categoria, descricao: f.descricao.trim() || null, promptSistema: f.promptSistema, iaProvedorId })
      if (!res.ok) { setErroPromptModal(res.erro); return }
      const lista = await window.api.promptIa.listar()
      if (lista.ok) setPromptsIa(lista.data || [])
      setPromptModal(null)
    } finally {
      setSalvandoPromptModal(false)
    }
  }
  async function excluirPromptIa(p) {
    if (excluindoPromptId) return
    const ok = await notificar.confirmar(
      `Excluir o prompt "${p.nome}"? Se alguma funcionalidade usa o código "${p.codigo}", ela deixará de funcionar.`,
      { titulo: 'Excluir prompt', confirmarLabel: 'Excluir', perigo: true }
    )
    if (!ok) return
    setExcluindoPromptId(p.id)
    try {
      const res = await window.api.promptIa.excluir(p.id)
      if (res.ok) setPromptsIa(list => list.filter(x => x.id !== p.id))
      else notificar.erro(res.erro)
    } finally {
      setExcluindoPromptId(null)
    }
  }

  // Dados institucionais impressos no cabeçalho/rodapé/capa dos PDFs
  // gerados pelo Documentos (Análises de Aderência / Atas de Treinamento).
  const VAZIO_DOCUMENTOS = { empresaNome: '', empresaCnpj: '', empresaIe: '', empresaEndereco: '', empresaTelefone: '', empresaSite: '', logoPath: '' }
  const [documentosCfg, setDocumentosCfg]         = useState(VAZIO_DOCUMENTOS)
  const [salvandoDocumentos, setSalvandoDocumentos] = useState(false)
  const [salvoDocumentos, setSalvoDocumentos]       = useState(false)

  useEffect(() => {
    window.api.config.get().then(res => {
      const p = (res.ok ? res.data?.Personalizacao : null) || {}
      const corSalva = p.cor_primaria === '#FF6B2B' ? '#D95218' : (p.cor_primaria || VAZIO.cor)
      const loaded = {
        cor:          corSalva,
        nomeSistema:  p.nome_sistema || VAZIO.nomeSistema,
        nomeUsuario:  p.nome_usuario || VAZIO.nomeUsuario,
        cargoUsuario: p.cargo_usuario || VAZIO.cargoUsuario,
      }
      setSaved(loaded)
      setForm(loaded)

      const bp = (res.ok ? res.data?.BancoProducao : null) || {}
      const bpLoaded = {
        host:     bp.host || '',
        port:     bp.port || '5432',
        database: bp.database || '',
        usuario:  bp.usuario || '',
        senha:    '', // nunca reexibida em claro
        iniPath:  bp.iniPath || '',
      }
      setSavedBancoProd(bpLoaded)
      setBancoProd(bpLoaded)

      const b = (res.ok ? res.data?.Banco : null) || {}
      const bLoaded = {
        host:     b.host || '',
        port:     b.port || '5432',
        database: b.database || '',
        usuario:  b.usuario || '',
        senha:    '', // nunca reexibida em claro
      }
      setSavedBancoDev(bLoaded)
      setBancoDev(bLoaded)

      const doc = (res.ok ? res.data?.Documentos : null) || {}
      setDocumentosCfg({
        empresaNome:     doc.empresaNome || '',
        empresaCnpj:     doc.empresaCnpj || '',
        empresaIe:       doc.empresaIe || '',
        empresaEndereco: doc.empresaEndereco || '',
        empresaTelefone: doc.empresaTelefone || '',
        empresaSite:     doc.empresaSite || '',
        logoPath:        doc.logoPath || '',
      })
    }).catch(() => {})
    window.api.importarBanco?.isDev().then(res => res.ok && setIsDev(res.data)).catch(() => {})
    window.api.promptIa?.listar().then(res => {
      if (res.ok) setPromptsIa(res.data || [])
    }).catch(() => {})
    window.api.iaProvedor?.listar().then(res => {
      if (res.ok) setIaProvedores(res.data || [])
    }).catch(() => {})
    window.api.iaProvedor?.modelosSugeridos().then(res => {
      if (res.ok) setModelosSugeridos(res.data || {})
    }).catch(() => {})
  }, [])

  function setBP(key, val) {
    setBancoProd(f => ({ ...f, [key]: val }))
    setResultadoTeste(null)
  }

  async function selecionarPastaIniProducao() {
    const res = await window.api.config.selecionarArquivoIni()
    if (res.ok && res.data) setBP('iniPath', res.data)
  }

  function cancelarBancoProd() {
    setBancoProd({ ...savedBancoProd, senha: '' })
    setEditandoBancoProd(false)
    setResultadoTeste(null)
  }

  async function salvarBancoProducao() {
    setSalvandoBancoProd(true)
    try {
      // Só envia campos preenchidos — evita que clicar "Salvar" logo após só
      // trocar a pasta do .ini (ou só um campo) apague os demais já salvos
      // com string vazia. Senha segue a mesma regra (nunca reexibida em
      // claro, só sobrescreve se o usuário digitou algo novo).
      const payload = {}
      if (bancoProd.host)     payload.host     = bancoProd.host
      if (bancoProd.port)     payload.port     = bancoProd.port
      if (bancoProd.database) payload.database = bancoProd.database
      if (bancoProd.usuario)  payload.usuario  = bancoProd.usuario
      if (bancoProd.senha)    payload.senha    = bancoProd.senha
      if (bancoProd.iniPath)  payload.iniPath  = bancoProd.iniPath
      await window.api.config.setSection('BancoProducao', payload)
      const novoSaved = { ...bancoProd, senha: '' }
      setSavedBancoProd(novoSaved)
      setBancoProd(novoSaved)
      setEditandoBancoProd(false)
      setSalvoBancoProd(true)
      setTimeout(() => setSalvoBancoProd(false), 2500)
    } catch (e) {
      notificar.erro('Erro ao salvar: ' + e.message)
    } finally {
      setSalvandoBancoProd(false)
    }
  }

  async function testarConexaoBancoProducao() {
    setTestandoConexao(true)
    setResultadoTeste(null)
    try {
      // Testa contra o que está salvo — pede pra salvar primeiro se houve edição.
      await salvarBancoProducao()
      const res = await window.api.importarBanco.testarConexaoProducao()
      setResultadoTeste(res.ok ? { ok: true, mensagem: 'Conexão bem-sucedida.' } : { ok: false, mensagem: res.erro })
    } catch (e) {
      setResultadoTeste({ ok: false, mensagem: e.message })
    } finally {
      setTestandoConexao(false)
    }
  }

  function setBD(key, val) {
    setBancoDev(f => ({ ...f, [key]: val }))
    setResultadoTesteDev(null)
  }

  function cancelarBancoDev() {
    setBancoDev({ ...savedBancoDev, senha: '' })
    setEditandoBancoDev(false)
    setResultadoTesteDev(null)
  }

  async function salvarBancoDev() {
    setSalvandoBancoDev(true)
    try {
      // Mesma regra de BancoProducao: só envia campos preenchidos, pra não
      // sobrescrever com vazio um valor já salvo (ex.: senha, que nunca é
      // reexibida em claro).
      const payload = {}
      if (bancoDev.host)     payload.host     = bancoDev.host
      if (bancoDev.port)     payload.port     = bancoDev.port
      if (bancoDev.database) payload.database = bancoDev.database
      if (bancoDev.usuario)  payload.usuario  = bancoDev.usuario
      if (bancoDev.senha)    payload.senha    = bancoDev.senha
      await window.api.config.setSection('Banco', payload)
      const novoSaved = { ...bancoDev, senha: '' }
      setSavedBancoDev(novoSaved)
      setBancoDev(novoSaved)
      setEditandoBancoDev(false)
      setSalvoBancoDev(true)
      setTimeout(() => setSalvoBancoDev(false), 2500)
    } catch (e) {
      notificar.erro('Erro ao salvar: ' + e.message)
    } finally {
      setSalvandoBancoDev(false)
    }
  }

  async function testarConexaoBancoDev() {
    setTestandoConexaoDev(true)
    setResultadoTesteDev(null)
    try {
      await salvarBancoDev()
      const res = await window.api.importarBanco.testarConexaoDev()
      setResultadoTesteDev(res.ok ? { ok: true, mensagem: 'Conexão bem-sucedida.' } : { ok: false, mensagem: res.erro })
    } catch (e) {
      setResultadoTesteDev({ ok: false, mensagem: e.message })
    } finally {
      setTestandoConexaoDev(false)
    }
  }

  async function gerarTokenImportacao() {
    setGerandoToken(true)
    setTokenGerado(null)
    setTokenCopiado(false)
    try {
      const res = await window.api.tokenImportacao.gerar(escopoToken)
      if (res.ok) setTokenGerado(res.data)
      else notificar.erro('Erro ao gerar token: ' + res.erro)
    } catch (e) {
      notificar.erro('Erro ao gerar token: ' + e.message)
    } finally {
      setGerandoToken(false)
    }
  }

  function copiarToken() {
    if (!tokenGerado) return
    window.api.clipboard.write(tokenGerado.token)
    setTokenCopiado(true)
    setTimeout(() => setTokenCopiado(false), 2000)
  }

  async function salvarGithubTokenHandler() {
    if (!githubToken.trim()) return
    setSalvandoGithubToken(true)
    try {
      const res = await window.api.config.salvarGithubToken(githubToken.trim())
      if (res.ok) {
        setSalvoGithubToken(true)
        setGithubToken('')
        setTimeout(() => setSalvoGithubToken(false), 2000)
      } else {
        notificar.erro('Erro ao salvar token: ' + res.erro)
      }
    } catch (e) {
      notificar.erro('Erro ao salvar token: ' + e.message)
    } finally {
      setSalvandoGithubToken(false)
    }
  }

  async function salvarAnthropicApiKeyHandler() {
    if (!anthropicApiKey.trim()) return
    setSalvandoAnthropicApiKey(true)
    try {
      const res = await window.api.config.salvarAnthropicApiKey(anthropicApiKey.trim())
      if (res.ok) {
        setSalvoAnthropicApiKey(true)
        setAnthropicApiKey('')
        setTimeout(() => setSalvoAnthropicApiKey(false), 2000)
      } else {
        notificar.erro('Erro ao salvar chave: ' + res.erro)
      }
    } catch (e) {
      notificar.erro('Erro ao salvar chave: ' + e.message)
    } finally {
      setSalvandoAnthropicApiKey(false)
    }
  }

  async function salvarDocumentosCfg() {
    setSalvandoDocumentos(true)
    try {
      const { logoPath, ...resto } = documentosCfg
      await window.api.config.setSection('Documentos', resto)
      setSalvoDocumentos(true)
      setTimeout(() => setSalvoDocumentos(false), 2000)
    } catch (e) {
      notificar.erro('Erro ao salvar dados institucionais: ' + e.message)
    } finally {
      setSalvandoDocumentos(false)
    }
  }

  async function selecionarLogoDocumentos() {
    const res = await window.api.config.selecionarLogoDocumentos()
    if (res.ok && res.data) setDocumentosCfg(f => ({ ...f, logoPath: res.data }))
  }

  // A cor só é aplicada ao sistema inteiro (sidebar, abas, badges) ao salvar
  // ou cancelar; enquanto em edição, só a pré-visualização à direita reflete
  // a escolha, para não mudar o app inteiro no meio de uma alteração ainda
  // não confirmada.
  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleCor(hex) {
    set('cor', hex)
  }

  function cancelar() {
    setForm({ ...saved })
    setEditando(false)
  }

  function reverter() {
    setForm({ ...VAZIO })
  }

  async function salvar() {
    setSalvando(true)
    try {
      await window.api.config.setSection('Personalizacao', {
        cor_primaria:  form.cor,
        nome_sistema:  form.nomeSistema,
        nome_usuario:  form.nomeUsuario,
        cargo_usuario: form.cargoUsuario,
      })
      setSaved({ ...form })
      setEditando(false)
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2500)
      aplicarCorSistema(form.cor)
      window.dispatchEvent(new CustomEvent('krontech:config-changed', {
        detail: { cor: form.cor, nomeSistema: form.nomeSistema, nomeUsuario: form.nomeUsuario, cargoUsuario: form.cargoUsuario }
      }))
    } catch (e) {
      notificar.erro('Erro ao salvar: ' + e.message)
    } finally {
      setSalvando(false)
    }
  }

  const nomeCorAtual = CORES.find(c => c.hex.toLowerCase() === form.cor.toLowerCase())?.nome

  return (
    <div className="page-with-footer">
      <div className="page-tabs">
        <button className={`page-tab${activeTab === 'personalizacao' ? ' active' : ''}`} onClick={() => setActiveTab('personalizacao')}>Personalização</button>
        <button className={`page-tab${activeTab === 'configuracoes' ? ' active' : ''}`} onClick={() => setActiveTab('configuracoes')}>Configurações</button>
      </div>

      <div className="page-content" style={{ height: '100%' }}>
      {activeTab === 'personalizacao' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>

      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0, alignItems: 'flex-start' }}>

        {/* ─ COLUNA ESQUERDA: controles ─ */}
        <div style={{ flex: '1 1 460px', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Aparência */}
          <SecCard icon={<Palette size={14} />} title="Aparência" subtitle="Cor de destaque usada em botões, ícones e realces">
            {!editando ? (
              <div className="form-input" style={{
                display: 'flex', alignItems: 'center', gap: 10,
                height: 'auto', padding: '10px 12px', cursor: 'default',
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: form.cor,
                  boxShadow: `0 0 0 1px rgba(0,0,0,.15)`,
                }} />
                <span style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 500 }}>
                  {nomeCorAtual ?? 'Personalizada'}
                </span>
                <code style={{
                  fontSize: 11, color: 'var(--t3)', fontFamily: 'monospace',
                  letterSpacing: 1, marginLeft: 2,
                }}>
                  {form.cor.toUpperCase()}
                </code>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8,
                }}>
                  {CORES.map(s => {
                    const sel = form.cor.toLowerCase() === s.hex.toLowerCase()
                    return (
                      <button
                        key={s.hex}
                        title={s.nome}
                        onClick={() => handleCor(s.hex)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                          padding: '10px 6px', borderRadius: 9, cursor: 'pointer',
                          background: sel ? `${s.hex}14` : 'var(--s1)',
                          border: `1.5px solid ${sel ? s.hex : 'var(--bd)'}`,
                        }}
                      >
                        <span style={{
                          width: 22, height: 22, borderRadius: 6,
                          background: s.hex, flexShrink: 0,
                          boxShadow: sel ? `0 0 0 3px ${s.hex}30` : 'none',
                        }} />
                        <span style={{ fontSize: 9.5, color: sel ? s.hex : 'var(--t3)', fontWeight: sel ? 700 : 500 }}>{s.nome}</span>
                      </button>
                    )
                  })}
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--s1)', border: '1.5px solid var(--bd)',
                  borderRadius: 10, padding: '9px 12px',
                }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      onClick={() => pickerRef.current?.click()}
                      title="Escolher cor personalizada"
                      style={{
                        width: 26, height: 26, borderRadius: 7, border: 'none',
                        background: form.cor, cursor: 'pointer',
                        boxShadow: `0 0 0 2px var(--s1), 0 0 0 3.5px ${form.cor}`,
                        flexShrink: 0,
                      }}
                    />
                    <input
                      ref={pickerRef}
                      type="color"
                      value={form.cor}
                      onChange={e => handleCor(e.target.value)}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                      tabIndex={-1}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--t2)' }}>Cor personalizada</span>
                  <code style={{
                    fontSize: 11, color: 'var(--t3)', fontFamily: 'monospace',
                    letterSpacing: 1, marginLeft: 'auto',
                  }}>
                    {form.cor.toUpperCase()}
                  </code>
                </div>
              </div>
            )}
          </SecCard>

          {/* Identidade */}
          <SecCard icon={<User size={14} />} title="Identidade" subtitle="Nome exibido no app">
            <Campo label="Nome do sistema" value={form.nomeSistema} onChange={v => set('nomeSistema', v)} placeholder="KronTech" disabled={!editando} />
          </SecCard>

          {/* Ações */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {!editando ? (
              <button
                className="btn btn-primary"
                onClick={() => setEditando(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 16px', height: 34 }}
              >
                <Pencil size={13} strokeWidth={2} />
                Alterar
              </button>
            ) : (
              <>
                <button
                  className="btn btn-ghost"
                  onClick={cancelar}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 16px', height: 34 }}
                >
                  <X size={13} strokeWidth={2} />
                  Cancelar
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={reverter}
                  title="Restaura os valores padrão de fábrica"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 16px', height: 34 }}
                >
                  <RotateCcw size={13} strokeWidth={2} />
                  Reverter ao padrão
                </button>
                <button
                  className="btn btn-primary"
                  onClick={salvar}
                  disabled={salvando}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 20px', height: 34 }}
                >
                  {salvo
                    ? <><Check size={13} strokeWidth={2.5} /> Salvo!</>
                    : <><Save  size={13} strokeWidth={2}   /> {salvando ? 'Salvando…' : 'Salvar'}</>
                  }
                </button>
              </>
            )}
          </div>
        </div>

        {/* ─ COLUNA DIREITA: preview ao vivo ─ */}
        <div style={{ flex: '1 1 420px', minWidth: 340, alignSelf: 'stretch', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            background: 'var(--s1)', border: '1px solid var(--bd)',
            borderRadius: 12, overflow: 'hidden',
            display: 'flex', flexDirection: 'column', flex: 1, minHeight: 440,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 14px', borderBottom: '1px solid var(--bd)',
              background: 'var(--s1)', flexShrink: 0,
            }}>
              <LayoutDashboard size={13} color="var(--or)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Pré-visualização</span>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>como o app fica com essas cores</span>
            </div>

            <div style={{ flex: 1, padding: 16, display: 'flex', gap: 12, minHeight: 0 }}>

              {/* Mini sidebar */}
              <div style={{
                width: 118, flexShrink: 0, background: 'var(--s2)', border: '1px solid var(--bd)',
                borderRadius: 10, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 2px' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 5, background: form.cor, flexShrink: 0,
                    boxShadow: `0 0 8px ${form.cor}60`,
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {form.nomeSistema || 'KronTech'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 6px', borderRadius: 6,
                    background: `${form.cor}1c`, borderLeft: `2px solid ${form.cor}`,
                  }}>
                    <LayoutDashboard size={9} color={form.cor} />
                    <div style={{ height: 6, flex: 1, borderRadius: 3, background: `${form.cor}55` }} />
                  </div>
                  {[0.55, 0.7, 0.4].map((w, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 6px' }}>
                      <div style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--s3)', flexShrink: 0 }} />
                      <div style={{ height: 6, width: `${w * 100}%`, borderRadius: 3, background: 'var(--s3)' }} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 4px', borderRadius: 7, background: 'var(--s3)' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: form.cor, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, fontWeight: 700, color: '#fff',
                  }}>US</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Usuário</div>
                    <div style={{ fontSize: 7.5, color: 'var(--t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Sessão ativa</div>
                  </div>
                </div>
              </div>

              {/* Mini conteúdo */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                {/* topbar */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                  background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, background: 'var(--s3)', borderRadius: 6, padding: '3px 7px' }}>
                    <Search size={9} color="var(--t3)" />
                    <div style={{ height: 5, width: '40%', borderRadius: 3, background: 'var(--bd2)' }} />
                  </div>
                  <Bell size={11} color="var(--t3)" />
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: form.cor, flexShrink: 0,
                  }} />
                </div>

                {/* cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[0, 1].map(i => (
                    <div key={i} style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ height: 6, width: '55%', borderRadius: 3, background: 'var(--bd2)' }} />
                      <div style={{ height: 14, width: '70%', borderRadius: 3, background: i === 0 ? form.cor : 'var(--t2)' }} />
                    </div>
                  ))}
                </div>

                {/* preview de componentes reais */}
                <div style={{
                  marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--s2)', border: '1px solid var(--bd)',
                }}>
                  <span style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Componentes
                  </span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button style={{
                      padding: '5px 12px', borderRadius: 6, border: 'none',
                      background: form.cor, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'default',
                    }}>Botão</button>
                    <button style={{
                      padding: '5px 12px', borderRadius: 6, border: `1.5px solid ${form.cor}`,
                      background: 'transparent', color: form.cor, fontSize: 11, cursor: 'default',
                    }}>Outline</button>
                    <span style={{
                      padding: '3px 9px', borderRadius: 20,
                      background: `${form.cor}20`, color: form.cor, fontSize: 10, fontWeight: 600,
                    }}>Badge</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 26, height: 14, borderRadius: 20, background: form.cor, position: 'relative' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, right: 2 }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      </div>
      )}

      {activeTab === 'configuracoes' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {!isDev && (
            <SecCard icon={<KeyRound size={14} />} title="Token de Autorização" subtitle="Autoriza ações sensíveis em ambiente de dev" collapsible>
              <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 14, lineHeight: 1.6 }}>
                Gere um token aqui e cole na tela correspondente do ambiente de desenvolvimento. Vale por 10 minutos e só pode ser usado uma vez, mesmo se a ação falhar.
              </div>

              <div className="form-group">
                <label className="form-label">Gerar token para</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className={`btn ${escopoToken === 'importacao' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setEscopoToken('importacao')}
                    style={{ flex: 1 }}
                  >
                    Importar Banco
                  </button>
                  <button
                    type="button"
                    className={`btn ${escopoToken === 'release' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setEscopoToken('release')}
                    style={{ flex: 1 }}
                  >
                    Lançar Versão
                  </button>
                </div>
              </div>

              {tokenGerado ? (
                <div className="form-group">
                  <label className="form-label">Token gerado</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="form-input" style={{
                      flex: 1, display: 'flex', alignItems: 'center',
                      height: 'auto', padding: '10px 12px', cursor: 'default', minWidth: 0,
                    }}>
                      <code style={{
                        fontSize: 12, fontFamily: 'monospace', color: 'var(--t1)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {tokenGerado.token}
                      </code>
                    </div>
                    <button className="btn btn-ghost" onClick={copiarToken} style={{ height: 38, flexShrink: 0 }}>
                      {tokenCopiado ? <Check size={13} /> : <CopyIcon size={13} />}
                      {tokenCopiado ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>
                    Expira às {new Date(tokenGerado.expira_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                <button className="btn btn-primary" onClick={gerarTokenImportacao} disabled={gerandoToken}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                  {gerandoToken ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <KeyRound size={12} />}
                  {gerandoToken ? 'Gerando...' : tokenGerado ? 'Gerar novo token' : 'Gerar token'}
                </button>
              </div>
            </SecCard>
          )}

          {/* Banco de Desenvolvimento — só em dev, mesma conexão que o app usa
              o tempo todo. Existe pra reconfigurar a senha aqui, sem precisar
              editar o .ini na mão, quando a senha do Postgres muda no servidor. */}
          {isDev && (
            <SecCard icon={<DatabaseZap size={14} />} title="Banco de Desenvolvimento" badge="Ativa agora" collapsible>
              <div style={{
                fontSize: 11.5, color: 'var(--t3)', marginBottom: 12, lineHeight: 1.5,
              }}>
                É esta conexão que a tela que você está vendo agora usa pra ler e salvar tudo: dados, telas, configurações. Se a senha do Postgres mudar, atualize aqui.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                  <Campo label="Host" value={bancoDev.host} onChange={v => setBD('host', v)} placeholder="localhost" disabled={!editandoBancoDev} />
                  <Campo label="Porta" value={bancoDev.port} onChange={v => setBD('port', v)} placeholder="5432" disabled={!editandoBancoDev} />
                </div>
                <Campo label="Banco de dados" value={bancoDev.database} onChange={v => setBD('database', v)} placeholder="krontech_dev" disabled={!editandoBancoDev} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Campo label="Usuário" value={bancoDev.usuario} onChange={v => setBD('usuario', v)} placeholder="postgres" disabled={!editandoBancoDev} />
                  <Campo label="Senha" type="password" value={bancoDev.senha} onChange={v => setBD('senha', v)} placeholder="••••••••" disabled={!editandoBancoDev} />
                </div>

                {resultadoTesteDev && (
                  <div style={{ fontSize: 11.5, color: resultadoTesteDev.ok ? 'var(--green)' : 'var(--red)' }}>
                    {resultadoTesteDev.mensagem}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  {!editandoBancoDev ? (
                    <button className="btn btn-primary" onClick={() => setEditandoBancoDev(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                      <Pencil size={12} /> Alterar
                    </button>
                  ) : (
                    <>
                      <button className="btn btn-ghost" onClick={cancelarBancoDev} disabled={salvandoBancoDev || testandoConexaoDev}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                        <X size={12} /> Cancelar
                      </button>
                      <button className="btn btn-ghost" onClick={testarConexaoBancoDev} disabled={testandoConexaoDev || salvandoBancoDev}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                        {testandoConexaoDev ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <DatabaseZap size={12} />}
                        {testandoConexaoDev ? 'Testando...' : 'Testar conexão'}
                      </button>
                      <button className="btn btn-primary" onClick={salvarBancoDev} disabled={salvandoBancoDev || testandoConexaoDev}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                        {salvoBancoDev ? <><Check size={12} /> Salvo!</> : <><Save size={12} /> {salvandoBancoDev ? 'Salvando...' : 'Salvar'}</>}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </SecCard>
          )}

          {/* Banco de Produção — só em dev, usado pela função "Importar Banco" do menu lateral */}
          {isDev && (
            <SecCard icon={<DatabaseZap size={14} />} title="Banco de Produção" muted collapsible>
              <div style={{
                fontSize: 11.5, color: 'var(--t3)', marginBottom: 12, lineHeight: 1.5,
              }}>
                Esta tela não usa esta conexão pra nada. É só uma credencial guardada para o botão <strong>Importar Banco</strong>, abaixo, que copia os dados de produção por cima do banco de desenvolvimento (acima).
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                  <Campo label="Host" value={bancoProd.host} onChange={v => setBP('host', v)} placeholder="192.168.0.10" disabled={!editandoBancoProd} />
                  <Campo label="Porta" value={bancoProd.port} onChange={v => setBP('port', v)} placeholder="5432" disabled={!editandoBancoProd} />
                </div>
                <Campo label="Banco de dados" value={bancoProd.database} onChange={v => setBP('database', v)} placeholder="krontech" disabled={!editandoBancoProd} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Campo label="Usuário" value={bancoProd.usuario} onChange={v => setBP('usuario', v)} placeholder="postgres" disabled={!editandoBancoProd} />
                  <Campo label="Senha" type="password" value={bancoProd.senha} onChange={v => setBP('senha', v)} placeholder="••••••••" disabled={!editandoBancoProd} />
                </div>

                <div className="form-group">
                  <label className="form-label">Arquivo krontech.ini de produção</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" value={bancoProd.iniPath} readOnly placeholder="Nenhum arquivo selecionado" style={{ flex: 1 }} disabled={!editandoBancoProd} />
                    <button className="btn btn-ghost" onClick={selecionarPastaIniProducao} disabled={!editandoBancoProd} style={{ height: 38, flexShrink: 0 }}>
                      <FolderOpen size={13} /> Selecionar
                    </button>
                  </div>
                </div>

                {resultadoTeste && (
                  <div style={{ fontSize: 11.5, color: resultadoTeste.ok ? 'var(--green)' : 'var(--red)' }}>
                    {resultadoTeste.mensagem}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  {!editandoBancoProd ? (
                    <>
                      <button className="btn btn-danger" onClick={() => setImportBancoOpen(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                        <DatabaseZap size={12} /> Importar Banco
                      </button>
                      <button className="btn btn-primary" onClick={() => setEditandoBancoProd(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                        <Pencil size={12} /> Alterar
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-ghost" onClick={cancelarBancoProd} disabled={salvandoBancoProd || testandoConexao}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                        <X size={12} /> Cancelar
                      </button>
                      <button className="btn btn-ghost" onClick={testarConexaoBancoProducao} disabled={testandoConexao || salvandoBancoProd}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                        {testandoConexao ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <DatabaseZap size={12} />}
                        {testandoConexao ? 'Testando...' : 'Testar conexão'}
                      </button>
                      <button className="btn btn-primary" onClick={salvarBancoProducao} disabled={salvandoBancoProd || testandoConexao}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                        {salvoBancoProd ? <><Check size={12} /> Salvo!</> : <><Save size={12} /> {salvandoBancoProd ? 'Salvando...' : 'Salvar'}</>}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </SecCard>
          )}

          {/* Token da CNPJá — usado na busca de CNPJ pra trazer a Inscrição
              Estadual (SINTEGRA), que as APIs públicas não retornam. Sem
              token, o CNPJ preenche tudo menos a IE. */}
          <SecCard icon={<KeyRound size={14} />} title="Consulta de CNPJ e Inscrição Estadual" muted collapsible>
            <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 12, lineHeight: 1.5 }}>
              A Inscrição Estadual vem do SINTEGRA e só é obtida pela <strong>CNPJá</strong> (cnpja.com). Crie uma conta gratuita, gere um token de API e cole aqui. Sem o token, a busca do CNPJ preenche todos os dados menos a Inscrição Estadual.
            </div>
            <div className="form-group">
              <label className="form-label">Token da CNPJá</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" type="password" value={cnpjaToken}
                  onChange={e => setCnpjaToken(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••" style={{ flex: 1 }} />
                <button className="btn btn-primary" onClick={salvarCnpjaTokenHandler}
                  disabled={salvandoCnpjaToken || !cnpjaToken.trim()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 38, flexShrink: 0 }}>
                  {salvoCnpjaToken ? <><Check size={12} /> Salvo!</> : <><Save size={12} /> {salvandoCnpjaToken ? 'Salvando...' : 'Salvar'}</>}
                </button>
              </div>
            </div>
          </SecCard>

          {/* Token do GitHub — só em dev, usado pelo botão "Lançar Versão"
              pra publicar a release via API REST, sem depender do gh CLI
              instalado na máquina. Cifrado com encryptCofre (config.js),
              nunca devolvido em texto puro pro frontend. */}
          {isDev && (
            <SecCard icon={<KeyRound size={14} />} title="Token do GitHub" muted collapsible>
              <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 12, lineHeight: 1.5 }}>
                Personal Access Token usado pelo botão <strong>Lançar Versão</strong> para publicar releases no GitHub. Cole aqui se precisar configurar ou trocar o token.
              </div>
              <div className="form-group">
                <label className="form-label">Token</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" type="password" value={githubToken}
                    onChange={e => setGithubToken(e.target.value)}
                    placeholder="ghp_••••••••••••••••••••••••••••••••••••" style={{ flex: 1 }} />
                  <button className="btn btn-primary" onClick={salvarGithubTokenHandler}
                    disabled={salvandoGithubToken || !githubToken.trim()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 38, flexShrink: 0 }}>
                    {salvoGithubToken ? <><Check size={12} /> Salvo!</> : <><Save size={12} /> {salvandoGithubToken ? 'Salvando...' : 'Salvar'}</>}
                  </button>
                </div>
              </div>
            </SecCard>
          )}

          {/* Lançar Versão — só em dev. Fluxo completo de publicação (build,
              empacotar, versionar, publicar release no GitHub), separado do
              card "Banco de Produção" por ser uma ação de outra natureza
              (não mexe no banco de dev). */}
          {isDev && (
            <SecCard icon={<Rocket size={14} />} title="Lançar Versão" muted collapsible>
              <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 12, lineHeight: 1.5 }}>
                Compila o app, gera o instalador, versiona (commit + push) e publica a release no GitHub, tudo em um único fluxo.
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-danger" onClick={() => setLancarVersaoOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                  <Rocket size={12} /> Lançar Versão
                </button>
              </div>
            </SecCard>
          )}

          {/* E-mail: Client ID do Azure para login OAuth do Outlook. Contas
              Microsoft nao aceitam mais senha de app; o app abre a tela de
              login da Microsoft usando este Client ID. Nao e segredo. */}
          <SecCard icon={<KeyRound size={14} />} title="E-mail: Outlook / Microsoft 365" muted collapsible>
            <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 12, lineHeight: 1.5 }}>
              Contas Microsoft usam login seguro (OAuth), não senha de app. Registre um aplicativo em portal.azure.com (Microsoft Entra ID, Registros de aplicativo), tipo "clientes públicos / dispositivo", com URI de redirecionamento http://localhost e as permissões IMAP.AccessAsUser.All, SMTP.Send e offline_access. Cole aqui o Client ID (ID do aplicativo). Cada conta pode sobrescrever esse valor.
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                <LabelComAjuda larguraAjuda={420} ajuda={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, lineHeight: 1.55 }}>
                    <p style={{ margin: 0 }}>
                      É o <b>ID do aplicativo (cliente)</b> de um registro de aplicativo no Azure. Não é um segredo: é um identificador público, pode ser versionado e compartilhado entre instalações.
                    </p>
                    <p style={{ margin: 0 }}>Como obter, uma vez só:</p>
                    <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <li>Acesse <b>portal.azure.com</b> e abra <b>Microsoft Entra ID</b>, depois <b>Registros de aplicativo</b>, e clique em <b>Novo registro</b>.</li>
                      <li>Dê um nome (ex: "KronTech E-mail") e em tipos de conta escolha <b>Contas em qualquer diretório organizacional e contas pessoais da Microsoft</b>.</li>
                      <li>Em <b>URI de redirecionamento</b>, escolha a plataforma <b>Cliente público/nativo (celular e desktop)</b> e informe <b>http://localhost</b>. Registre.</li>
                      <li>Abra <b>Permissões de API</b>, <b>Adicionar uma permissão</b>, aba <b>APIs que minha organização usa</b>, procure <b>Office 365 Exchange Online</b>, escolha <b>Permissões delegadas</b> e marque <b>IMAP.AccessAsUser.All</b> e <b>SMTP.Send</b>. Adicione também <b>offline_access</b> (em Microsoft Graph, permissões delegadas).</li>
                      <li>Na página <b>Visão geral</b> do registro, copie o valor de <b>ID do aplicativo (cliente)</b> e cole aqui.</li>
                    </ol>
                    <p style={{ margin: 0 }}>
                      Formato de GUID, por exemplo <code>11111111-2222-3333-4444-555555555555</code>. Cada conta de e-mail pode sobrescrever esse valor no próprio cadastro.
                    </p>
                  </div>
                }>
                  Client ID do Azure
                </LabelComAjuda>
                <input
                  className="form-input"
                  value={outlookClientId}
                  onChange={e => setOutlookClientId(e.target.value)}
                  placeholder="00000000-0000-0000-0000-000000000000"
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ height: 38, fontSize: 11.5, flexShrink: 0 }}
                onClick={salvarOutlookClientIdHandler}
                disabled={salvandoOutlookClientId}
              >
                {salvandoOutlookClientId
                  ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Save size={13} />}
                {salvandoOutlookClientId ? 'Salvando...' : 'Salvar'}
              </button>
              {salvoOutlookClientId && <span style={{ fontSize: 11.5, color: 'var(--green)', paddingBottom: 10 }}>Salvo.</span>}
            </div>
          </SecCard>

          {/* Provedores de IA (ia_provedor_001) — CRUD. Cada provedor tem
              nome, tipo de API (Claude / OpenAI / Gemini), modelo e a chave
              (cifrada no banco). Um prompt aponta pra um provedor. */}
          <SecCard icon={<KeyRound size={14} />} title="Provedores de IA" muted collapsible>
            <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 12, lineHeight: 1.5 }}>
              Contas de IA que o sistema pode usar (Claude, OpenAI, Gemini). Cada prompt aponta para um provedor. A chave é guardada cifrada e nunca reexibida.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="form-label" style={{ margin: 0 }}>Provedores cadastrados</span>
              <button className="btn btn-primary" style={{ height: 30, fontSize: 11.5 }} onClick={abrirProvNovo}>
                <Plus size={13} /> Incluir
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden' }}>
              {iaProvedores.length === 0 && (
                <div style={{ fontSize: 11.5, color: 'var(--t3)', padding: '12px 14px' }}>Nenhum provedor. Clique em Incluir para adicionar.</div>
              )}
              {iaProvedores.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    padding: '9px 12px', borderBottom: i < iaProvedores.length - 1 ? '1px solid var(--bd)' : 'none',
                    background: 'var(--s1)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--t1)' }}>{p.nome}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)' }}>
                      {rotuloTipoIa(p.tipo_api)} · {p.modelo} · {p.tem_chave ? 'chave ok' : 'sem chave'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }} onClick={() => abrirProvEditar(p)}>
                      <Pencil size={12} /> Alterar
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ height: 28, width: 28, padding: 0, color: 'var(--red)' }}
                      onClick={() => excluirProvIa(p)}
                      disabled={excluindoProvId === p.id}
                      title="Excluir"
                    >
                      {excluindoProvId === p.id
                        ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        : <X size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SecCard>

          {/* Prompts de IA (prompt_ia_001) — CRUD. Incluir/Alterar abrem o
              modal onde se define area, codigo, nome e o texto. */}
          <SecCard icon={<Bot size={14} />} title="Prompts de IA" muted collapsible>
            <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 12, lineHeight: 1.5 }}>
              Instruções que a IA segue ao gerar conteúdo. Usa a chave da Anthropic configurada acima.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="form-label" style={{ margin: 0 }}>Prompts cadastrados</span>
              <button className="btn btn-primary" style={{ height: 30, fontSize: 11.5 }} onClick={abrirPromptNovo}>
                <Plus size={13} /> Incluir
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden' }}>
              {promptsIa.length === 0 && (
                <div style={{ fontSize: 11.5, color: 'var(--t3)', padding: '12px 14px' }}>Nenhum prompt. Clique em Incluir para criar.</div>
              )}
              {promptsIa.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    padding: '9px 12px', borderBottom: i < promptsIa.length - 1 ? '1px solid var(--bd)' : 'none',
                    background: 'var(--s1)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--t1)' }}>{p.nome}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)' }}>{rotuloArea(p.categoria)} · {p.codigo}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }} onClick={() => abrirPromptEditar(p)}>
                      <Pencil size={12} /> Alterar
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ height: 28, width: 28, padding: 0, color: 'var(--red)' }}
                      onClick={() => excluirPromptIa(p)}
                      disabled={excluindoPromptId === p.id}
                      title="Excluir"
                    >
                      {excluindoPromptId === p.id
                        ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        : <X size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SecCard>

          {/* Dados institucionais para os PDFs do Documentos (Análises de
              Aderência / Atas de Treinamento) — cabeçalho, rodapé e capa
              usam esses campos + o logo. */}
          <SecCard icon={<FolderOpen size={14} />} title="Dados institucionais dos Documentos" muted collapsible>
            <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 12, lineHeight: 1.5 }}>
              Nome, CNPJ/IE, endereço, telefone e site exibidos no cabeçalho, rodapé e capa dos documentos exportados em PDF pelo Gerador de Documentos.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: 8, border: '1px solid var(--bd)', background: 'var(--s2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {documentosCfg.logoPath
                  ? <img src={`file://${documentosCfg.logoPath}`} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  : <span style={{ fontSize: 9, color: 'var(--t3)' }}>Sem logo</span>}
              </div>
              <button className="btn btn-ghost" onClick={selecionarLogoDocumentos} style={{ height: 32, fontSize: 11.5 }}>
                <FolderOpen size={13} /> {documentosCfg.logoPath ? 'Trocar logo' : 'Selecionar logo'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Nome da empresa</label>
                <input className="form-input" value={documentosCfg.empresaNome}
                  onChange={e => setDocumentosCfg(f => ({ ...f, empresaNome: e.target.value }))} placeholder="Nome da empresa" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Site</label>
                <input className="form-input" value={documentosCfg.empresaSite}
                  onChange={e => setDocumentosCfg(f => ({ ...f, empresaSite: e.target.value }))} placeholder="www.exemplo.com.br" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">CNPJ</label>
                <input className="form-input" value={documentosCfg.empresaCnpj}
                  onChange={e => setDocumentosCfg(f => ({ ...f, empresaCnpj: e.target.value }))} placeholder="00.000.000/0001-00" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Inscrição Estadual</label>
                <input className="form-input" value={documentosCfg.empresaIe}
                  onChange={e => setDocumentosCfg(f => ({ ...f, empresaIe: e.target.value }))} placeholder="000.000.000" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Telefone</label>
                <input className="form-input" value={documentosCfg.empresaTelefone}
                  onChange={e => setDocumentosCfg(f => ({ ...f, empresaTelefone: e.target.value }))} placeholder="(00) 0000-0000" />
              </div>
              <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                <label className="form-label">Endereço</label>
                <input className="form-input" value={documentosCfg.empresaEndereco}
                  onChange={e => setDocumentosCfg(f => ({ ...f, empresaEndereco: e.target.value }))} placeholder="Rua, número | Bairro | Cidade | UF | CEP" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={salvarDocumentosCfg} disabled={salvandoDocumentos}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                {salvoDocumentos ? <><Check size={12} /> Salvo!</> : <><Save size={12} /> {salvandoDocumentos ? 'Salvando...' : 'Salvar'}</>}
              </button>
            </div>
          </SecCard>

      </div>
      )}
      </div>

      <ImportarBancoModal open={importBancoOpen} onClose={() => setImportBancoOpen(false)} />
      <LancarVersaoModal open={lancarVersaoOpen} onClose={() => setLancarVersaoOpen(false)} />

      {/* Modal Incluir / Alterar prompt de IA */}
      {promptModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}
          onMouseDown={e => { if (e.target === e.currentTarget) setPromptModal(null) }}
        >
          <div style={{ width: 940, maxWidth: '94vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'flex', width: 32, height: 32, borderRadius: 9, background: 'var(--or4)', color: 'var(--or)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={17} />
                </span>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.2 }}>
                    {promptModal.modo === 'novo' ? 'Novo prompt de IA' : 'Alterar prompt de IA'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                    O texto abaixo é a instrução de sistema que a IA segue ao gerar o conteúdo.
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost" style={{ height: 28, width: 28, padding: 0, flexShrink: 0 }} onClick={() => setPromptModal(null)}><X size={14} /></button>
            </div>

            <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1, minHeight: 0 }}>
              {erroPromptModal && (
                <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(239,68,68,.4)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--red)' }}>
                  {erroPromptModal}
                </div>
              )}

              {/* Identificação */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>Identificação</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label className="form-label">Nome</label>
                    <input className="form-input" value={promptModal.form.nome} onChange={e => setPromptForm('nome', e.target.value)} placeholder="Ex: Redação de e-mail" />
                  </div>
                  <div className="form-group" style={{ margin: 0, flex: '0 0 170px' }}>
                    <label className="form-label">Onde é usado</label>
                    <select className="form-select" value={promptModal.form.categoria} onChange={e => setPromptForm('categoria', e.target.value)}>
                      {AREAS_PROMPT.map(a => <option key={a.valor} value={a.valor}>{a.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0, flex: '0 0 220px' }}>
                    <label className="form-label">
                      Código {promptModal.modo === 'editar' && <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)', textTransform: 'none', letterSpacing: 0 }}>(fixo)</span>}
                    </label>
                    <input
                      className="form-input"
                      value={promptModal.form.codigo}
                      onChange={e => setPromptForm('codigo', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder={promptModal.form.categoria === 'documento' ? 'documento_analise_aderencia' : 'email_redacao'}
                      disabled={promptModal.modo === 'editar'}
                    />
                  </div>
                </div>
                {promptModal.modo === 'novo' && promptModal.form.categoria === 'documento' && (
                  <div style={{ fontSize: 11, color: 'var(--t2)', lineHeight: 1.5, background: 'var(--or4)', border: '1px solid var(--or3)', borderRadius: 8, padding: '8px 12px', marginTop: 8, display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--or)', flexShrink: 0, marginTop: 1 }}>ℹ</span>
                    <span>
                      Para ligar a um tipo de documento existente, use um destes códigos:{' '}
                      <code>documento_analise_aderencia</code>, <code>documento_ata_treinamento</code> ou <code>documento_geral</code>.
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label className="form-label">Descrição <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)', textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
                    <input className="form-input" value={promptModal.form.descricao} onChange={e => setPromptForm('descricao', e.target.value)} placeholder="Aparece na lista, ajuda a identificar" />
                  </div>
                  <div className="form-group" style={{ margin: 0, flex: '0 0 280px' }}>
                    <label className="form-label">Provedor de IA</label>
                    <select className="form-select" value={promptModal.form.iaProvedorId} onChange={e => setPromptForm('iaProvedorId', e.target.value)}>
                      <option value="">(sem provedor)</option>
                      {iaProvedores.map(pv => <option key={pv.id} value={pv.id}>{pv.nome} ({pv.modelo})</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Conteúdo */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>Instruções de sistema</div>
                <textarea
                  className="form-input"
                  value={promptModal.form.promptSistema}
                  onChange={e => setPromptForm('promptSistema', e.target.value)}
                  placeholder="Cole ou escreva o prompt aqui..."
                  autoFocus
                  style={{ flex: 1, minHeight: 280, width: '100%', fontFamily: 'var(--fm, monospace)', fontSize: 12.5, lineHeight: 1.6, resize: 'none', borderColor: 'var(--bd)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, padding: '14px 24px 18px', justifyContent: 'flex-end', borderTop: '1px solid var(--bd)', flexShrink: 0 }}>
              <button className="btn btn-ghost" onClick={() => setPromptModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvarPromptModal} disabled={salvandoPromptModal}>
                {salvandoPromptModal
                  ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
                  : <><Save size={13} /> {promptModal.modo === 'novo' ? 'Criar prompt' : 'Salvar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Incluir / Alterar provedor de IA */}
      {provModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}
          onMouseDown={e => { if (e.target === e.currentTarget) setProvModal(null) }}
        >
          <div style={{ width: 760, maxWidth: '94vw', display: 'flex', flexDirection: 'column', background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'flex', width: 32, height: 32, borderRadius: 9, background: 'var(--or4)', color: 'var(--or)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <KeyRound size={17} />
                </span>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.2 }}>
                    {provModal.modo === 'novo' ? 'Novo provedor de IA' : 'Alterar provedor de IA'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                    Uma conta de IA (Claude, OpenAI ou Gemini) que os prompts podem usar.
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost" style={{ height: 28, width: 28, padding: 0, flexShrink: 0 }} onClick={() => setProvModal(null)}><X size={14} /></button>
            </div>

            <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {erroProvModal && (
                <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(239,68,68,.4)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--red)' }}>
                  {erroProvModal}
                </div>
              )}

              {/* Identificação */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>Identificação</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <LabelComAjuda ajuda={<p style={{ margin: 0 }}>Um nome para você identificar esta conta de IA na lista. Ex: "Claude (conta da empresa)", "OpenAI pessoal".</p>}>
                      Nome
                    </LabelComAjuda>
                    <input className="form-input" value={provModal.form.nome} onChange={e => setProvForm('nome', e.target.value)} placeholder="Ex: Claude (conta principal)" />
                  </div>
                  <div className="form-group" style={{ margin: 0, flex: '0 0 220px' }}>
                    <LabelComAjuda ajuda={
                      <p style={{ margin: 0 }}>
                        Identificador técnico usado internamente pelo sistema para referenciar este provedor. Só letras minúsculas, números e underline. <b>Não muda depois de criado.</b>
                      </p>
                    }>
                      Código {provModal.modo === 'editar' && <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)', textTransform: 'none', letterSpacing: 0 }}>(fixo)</span>}
                    </LabelComAjuda>
                    <input
                      className="form-input"
                      value={provModal.form.codigo}
                      onChange={e => setProvForm('codigo', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="claude_principal"
                      disabled={provModal.modo === 'editar'}
                    />
                  </div>
                </div>
              </div>

              {/* Conexão */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>Conexão</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ margin: 0, flex: '0 0 220px' }}>
                  <LabelComAjuda largura={360} ajuda={
                    <>
                      <p style={{ margin: 0 }}>O formato da API do provedor:</p>
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        <li><b>Claude (Anthropic):</b> api.anthropic.com. Chave começa com <code>sk-ant-</code>.</li>
                        <li><b>OpenAI / compatível:</b> OpenAI (GPT), e também qualquer serviço que usa o mesmo formato: Groq, DeepSeek, OpenRouter, Azure OpenAI, Ollama. Nesses casos preencha a URL base.</li>
                        <li><b>Google Gemini:</b> generativelanguage.googleapis.com. Chave começa com <code>AIza</code>.</li>
                      </ul>
                    </>
                  }>
                    Tipo de API
                  </LabelComAjuda>
                  <select
                    className="form-select"
                    value={provModal.form.tipoApi}
                    onChange={e => setProvForm('tipoApi', e.target.value)}
                  >
                    {TIPOS_IA.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0, flex: 1 }}>
                  <LabelComAjuda largura={340} ajuda={
                    <>
                      <p style={{ margin: 0 }}>Qual modelo de IA usar. Escolha na lista ou selecione "Outro (digitar)" para um modelo não listado.</p>
                      <p style={{ margin: '4px 0 0' }}>Modelos maiores (Opus, GPT-4o, Gemini Pro) geram melhor mas custam mais; modelos "mini/flash/haiku" são rápidos e baratos.</p>
                    </>
                  }>
                    Modelo
                  </LabelComAjuda>
                  {(() => {
                    const sugeridos = modelosSugeridos[provModal.form.tipoApi] || []
                    const naListado = provModal.form.modelo && !sugeridos.includes(provModal.form.modelo)
                    const usandoOutro = provModal.__outroModelo || naListado
                    return (
                      <>
                        <select
                          className="form-select"
                          value={usandoOutro ? '__outro__' : (provModal.form.modelo || '')}
                          onChange={e => {
                            if (e.target.value === '__outro__') {
                              setProvModal(m => ({ ...m, __outroModelo: true, form: { ...m.form, modelo: '' } }))
                            } else {
                              setProvModal(m => ({ ...m, __outroModelo: false, form: { ...m.form, modelo: e.target.value } }))
                            }
                          }}
                        >
                          <option value="">Selecione...</option>
                          {sugeridos.map(m => <option key={m} value={m}>{m}</option>)}
                          <option value="__outro__">Outro (digitar)</option>
                        </select>
                        {usandoOutro && (
                          <input
                            className="form-input"
                            style={{ marginTop: 6 }}
                            value={provModal.form.modelo}
                            onChange={e => setProvForm('modelo', e.target.value)}
                            placeholder="nome-exato-do-modelo"
                          />
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <LabelComAjuda largura={360} ajuda={
                  <>
                    <p style={{ margin: 0 }}>A chave secreta da sua conta no provedor. É guardada cifrada e nunca é reexibida.</p>
                    <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                      <li><b>Claude:</b> console.anthropic.com → Settings → API Keys.</li>
                      <li><b>OpenAI:</b> platform.openai.com → API keys.</li>
                      <li><b>Gemini:</b> aistudio.google.com/apikey.</li>
                    </ul>
                  </>
                }>
                  Chave de API {provModal.modo === 'editar' && <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)', textTransform: 'none', letterSpacing: 0 }}>(em branco = manter atual)</span>}
                </LabelComAjuda>
                <input
                  className="form-input"
                  type="password"
                  value={provModal.form.apiKey}
                  onChange={e => setProvForm('apiKey', e.target.value)}
                  placeholder={provModal.form.tipoApi === 'anthropic' ? 'sk-ant-...' : provModal.form.tipoApi === 'openai' ? 'sk-...' : 'AIza...'}
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <LabelComAjuda largura={360} ajuda={
                  <>
                    <p style={{ margin: 0 }}><b>Deixe em branco</b> para Claude, OpenAI ou Gemini oficiais.</p>
                    <p style={{ margin: '4px 0 0' }}>Preencha só para apontar a um endpoint alternativo com o mesmo formato de API: um proxy interno, Azure OpenAI, OpenRouter (<code>https://openrouter.ai/api/v1</code>), Groq (<code>https://api.groq.com/openai/v1</code>), Ollama local (<code>http://localhost:11434/v1</code>).</p>
                  </>
                }>
                  URL base <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)', textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
                </LabelComAjuda>
                <input
                  className="form-input"
                  value={provModal.form.baseUrl}
                  onChange={e => setProvForm('baseUrl', e.target.value)}
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, padding: '14px 24px 18px', justifyContent: 'flex-end', borderTop: '1px solid var(--bd)', flexShrink: 0 }}>
              <button className="btn btn-ghost" onClick={() => setProvModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvarProvModal} disabled={salvandoProvModal}>
                {salvandoProvModal
                  ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
                  : <><Save size={13} /> {provModal.modo === 'novo' ? 'Criar provedor' : 'Salvar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SecCard({ icon, title, subtitle, badge, muted, collapsible, children }) {
  const [aberto, setAberto] = useState(!collapsible)
  const Header = collapsible ? 'button' : 'div'

  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--bd)',
      borderRadius: 12, overflow: 'hidden',
      opacity: muted ? .82 : 1,
    }}>
      <Header
        onClick={collapsible ? () => setAberto(a => !a) : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '11px 16px', borderBottom: aberto ? '1px solid var(--bd)' : 'none',
          background: 'none', border: 'none', borderBottomWidth: aberto ? 1 : 0,
          borderBottomStyle: 'solid', borderBottomColor: 'var(--bd)',
          cursor: collapsible ? 'pointer' : 'default', textAlign: 'left', font: 'inherit',
        }}
      >
        <span style={{ color: muted ? 'var(--t3)' : 'var(--or)', display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>
          {title}
        </span>
        {badge && (
          <span style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: .4, textTransform: 'uppercase',
            color: 'var(--green)', background: 'rgba(52,199,89,.12)',
            border: '1px solid rgba(52,199,89,.3)', borderRadius: 99, padding: '2px 8px',
          }}>
            {badge}
          </span>
        )}
        {subtitle && <span style={{ fontSize: 11, color: 'var(--t3)' }}>{subtitle}</span>}
        {collapsible && (
          <ChevronDown size={14} style={{
            marginLeft: 'auto', color: 'var(--t3)', flexShrink: 0,
            transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease',
          }} />
        )}
      </Header>
      {aberto && (
        <div style={{ padding: '14px 16px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Campo({ label, value, onChange, placeholder, disabled, type = 'text' }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={type === 'password' ? 'new-password' : 'off'}
      />
    </div>
  )
}
