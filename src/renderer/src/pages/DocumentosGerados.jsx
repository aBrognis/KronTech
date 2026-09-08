import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Bot, ImagePlus, SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw, Search, FileDown, Settings, Mail, Copy, History } from 'lucide-react'
import '../App.css'
import FormToolbar from '../components/FormToolbar'
import SeletorBusca from '../components/SeletorBusca'
import SeletorEntidade from '../components/SeletorEntidade'
import PesquisaPadraoModal from '../components/PesquisaPadraoModal.jsx'
import PaginacaoBar from '../components/PaginacaoBar.jsx'
import { notificar } from '../components/Notificacao'
import ComposerModal from './email/ComposerModal'
import MenuContextoGrid from '../components/MenuContextoGrid'
import { SecaoHeader } from '../components/SecaoForm.jsx'

const CAMPOS_CLIENTE = [{ nome_campo: 'nome', label: 'Nome' }]
const CAMPOS_BUSCA_DOCUMENTO = [
  { nome_campo: 'titulo',       label: 'Título'  },
  { nome_campo: 'cliente_nome', label: 'Cliente' },
  { nome_campo: 'autor',        label: 'Autor'   },
]
const FILTROS_VAZIOS = { cliente: '', documentoTipoId: '', status: '' }

const EMPTY_FORM = {
  id: null, codigo: '', documentoTipoId: null, titulo: '', status: '',
  nomeReferencia: '', clienteId: '', clienteNome: '', autor: '',
  participantes: [{ nome: '', setor: '' }], textoBruto: '',
}

// Mesmo padrão de controle documental de despesa_001 (Viagens) — fluxo
// linear de rascunho até enviado, com badges e botões pra pular pra
// qualquer status seguinte a partir da consulta.
const STATUS_META = {
  rascunho:     { label: 'Rascunho',      classe: 'badge-orange' },
  nao_impresso: { label: 'Não Impresso',  classe: 'badge-yellow' },
  impresso:     { label: 'Impresso',      classe: 'badge-blue'   },
  assinado:     { label: 'Assinado',      classe: 'badge-purple' },
  enviado:      { label: 'Enviado',       classe: 'badge-green'  },
}
const STATUS_ORDEM = ['rascunho', 'nao_impresso', 'impresso', 'assinado', 'enviado']

export default function DocumentosGerados() {
  const [activeTab, setActiveTab] = useState('cadastro') // acesso | cadastro | gerado

  const [tipos, setTipos] = useState([])
  const [registros, setRegistros]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [currentIdx, setCurrentIdx] = useState(-1)

  const [mode, setMode]     = useState('view') // 'view' | 'new' | 'edit'
  const [form, setForm]     = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [erro, setErro]     = useState(null)
  const [confirmExcluir, setConfirmExcluir] = useState(false)
  const [showConsulta, setShowConsulta] = useState(false)

  const [gerando, setGerando] = useState(false)
  const [progresso, setProgresso] = useState(null)
  // Resultado da IA (ou o que foi carregado de um documento gravado),
  // EDITAVEL na aba "Documento Gerado" antes de gravar. Gerar de novo
  // substitui, empurrando o anterior pro historico ao gravar.
  const [rascunhoGerado, setRascunhoGerado] = useState(null) // { titulo, conteudoEstruturado }
  // Historico de geracoes/edicoes (do banco), so quando o documento ja
  // existe. Painel recolhivel na aba Documento Gerado, com botao copiar.
  const [historico, setHistorico] = useState([])
  const [historicoAberto, setHistoricoAberto] = useState(false)
  // Imagens do documento. Cada uma serve de REFERÊNCIA pra IA e, se
  // `noPdf`, também SAI NO PDF (logo após a Introdução, com legenda gerada
  // pela IA). Item: { id?, nome, mime, base64?, arquivo?, legenda, noPdf }.
  //   - novo (colado/anexado): tem base64, sem arquivo
  //   - já salvo (carregado do banco): tem arquivo, sem base64
  const [imagens, setImagens] = useState([])

  const [filtrosAbertos, setFiltrosAbertos] = useState(true)
  const [filtros, setFiltros]         = useState(FILTROS_VAZIOS)
  const [fResultados, setFResultados] = useState(null)
  const [fLoading, setFLoading]       = useState(false)
  const [pagina, setPagina]     = useState(1)
  const [porPagina, setPorPagina] = useState(25)
  // Selecao em massa na aba Acesso: ids marcados no checkbox "Sel" +
  // menu de contexto (botao direito) pra trocar o status de todos de uma vez.
  const [selecionados, setSelecionados] = useState(() => new Set())
  const [menuCtx, setMenuCtx] = useState(null) // { x, y, alvoId } | null

  // Composer de e-mail (botao "E-mail"): pre-carregado com o PDF de cada
  // documento. `ids` = quais documentos terao o status virado 'enviado'.
  const [emailModal, setEmailModal] = useState(null) // { anexos, assunto, ids } | null
  const [emailContas, setEmailContas] = useState([])
  const [preparandoEmail, setPreparandoEmail] = useState(false)

  useEffect(() => {
    window.api.documentoGerado.listarTipos().then(res => { if (res.ok) setTipos(res.data) })
  }, [])

  const [pastaExportacoes, setPastaExportacoes] = useState('')
  useEffect(() => {
    window.api.config.get().then(res => {
      const cam = res.ok ? res.data?.Caminhos : null
      setPastaExportacoes(cam?.exportacoesDocumentos || cam?.exportacoes || '')
    })
  }, [])

  async function handleConfigurarPastaExportacoes() {
    const res = await window.api.config.selecionarPasta({ chave: 'exportacoesDocumentos', titulo: 'Selecionar pasta de exportações dos documentos' })
    const nova = res.ok ? res.data : null
    if (nova) {
      setPastaExportacoes(nova)
      notificar.sucesso(`Pasta de exportações atualizada:\n${nova}\n\nAs exportações passam a ser salvas automaticamente aqui, organizadas por Cliente/Tipo.`)
    }
  }

  const [exportando, setExportando] = useState(false)
  const [exportandoTodos, setExportandoTodos] = useState(false)

  async function handleExportar() {
    if (!form.id || exportando) return
    setExportando(true)
    try {
      const res = await window.api.documentoGerado.exportarPdf(form.id)
      if (!res?.ok && !res?.cancelado) { setErro(res?.erro || 'Falha ao exportar.'); return }
      if (res?.ok && res?.path) notificar.sucesso(`Exportado com sucesso:\n${res.path}`)
    } finally {
      setExportando(false)
    }
  }

  // Abre o e-mail ja com os PDFs anexados. `ids` = documentos a anexar
  // (e cujo status vira 'enviado' apos o envio).
  async function abrirEmailComAnexos(ids, assuntoBase) {
    if (!ids.length || preparandoEmail) return
    setPreparandoEmail(true)
    try {
      const [resContas, resAnexos] = await Promise.all([
        window.api.email.listarContas(),
        window.api.documentoGerado.anexosParaEmail({ ids }),
      ])
      const contas = resContas.ok ? resContas.data || [] : []
      if (!contas.length) {
        notificar.aviso('Nenhuma conta de e-mail cadastrada. Cadastre uma na tela de E-mail.')
        return
      }
      const anexos = resAnexos.ok ? resAnexos.data?.anexos || [] : []
      if (!anexos.length) {
        notificar.aviso('Não foi possível gerar o PDF dos documentos selecionados.')
        return
      }
      setEmailContas(contas)
      setEmailModal({ anexos, assunto: assuntoBase, ids })
    } finally {
      setPreparandoEmail(false)
    }
  }

  function handleEmailAcesso() {
    const ids = (fResultados || []).map(r => r.id)
    if (!ids.length) { notificar.aviso('Consulte os documentos antes de enviar por e-mail.'); return }
    abrirEmailComAnexos(ids, `Documentos (${ids.length})`)
  }

  function handleEmailCadastro() {
    if (!form.id) { notificar.aviso('Salve o documento antes de enviar por e-mail.'); return }
    abrirEmailComAnexos([form.id], form.titulo || 'Documento')
  }

  // Envio concluido -> status dos documentos vira 'enviado', fecha o modal
  // e recarrega.
  async function handleEmailEnviado() {
    const ids = emailModal?.ids || []
    setEmailModal(null)
    if (ids.length) {
      const res = await window.api.documentoGerado.mudarStatusLote({ ids, status: 'enviado' })
      if (res.ok) notificar.sucesso(`E-mail enviado. ${res.data.atualizadas} documento(s) marcado(s) como Enviado.`)
    }
    await carregarTudo()
    if (fResultados) await carregarAcesso()
  }

  async function handleExportarTodos() {
    if (!(fResultados?.length) || exportandoTodos) return
    setExportandoTodos(true)
    try {
      const res = await window.api.documentoGerado.exportarPdfLote(fResultados.map(r => r.id))
      if (!res?.ok) {
        if (!res?.cancelado) notificar.erro(res?.erro || 'Falha ao exportar.')
        return
      }
      if (res.falhas?.length) {
        notificar.aviso(`${res.sucesso} de ${res.total} exportados. Falharam: ${res.falhas.join(', ')}`)
      } else {
        notificar.sucesso(`${res.sucesso} documento${res.sucesso === 1 ? '' : 's'} exportado${res.sucesso === 1 ? '' : 's'} com sucesso.`)
      }
    } finally {
      setExportandoTodos(false)
    }
  }

  const carregarAcesso = useCallback(async (f = filtros) => {
    setFLoading(true)
    try {
      const params = {}
      if (f.cliente.trim())  params.cliente = f.cliente.trim()
      if (f.documentoTipoId) params.documentoTipoId = f.documentoTipoId
      if (f.status)          params.status = f.status
      const res = await window.api.documentoGerado.listar(params)
      setFResultados(res.ok ? res.data || [] : [])
      setSelecionados(new Set())
      setPagina(1)
    } catch { setFResultados([]) }
    finally { setFLoading(false) }
  }, [filtros])

  async function carregarForm(reg) {
    const res = await window.api.documentoGerado.obter(reg.id)
    if (!res.ok) { setErro(res.erro); return }
    const d = res.data
    setForm({
      id: d.id, codigo: d.codigo || '', documentoTipoId: d.documento_tipo_id, titulo: d.titulo, status: d.status,
      nomeReferencia: d.nome_referencia || '', clienteId: d.cliente_id ? String(d.cliente_id) : '', clienteNome: d.cliente_nome || '',
      autor: d.autor || '', participantes: (d.participantes && d.participantes.length) ? d.participantes : [{ nome: '', setor: '' }],
      textoBruto: d.texto_bruto || '',
    })
    setRascunhoGerado({ titulo: d.titulo, conteudoEstruturado: d.conteudo_estruturado })
    setErro(null)
    setMode('view')
    // Imagens ja salvas: carrega o base64 pra preview (o arquivo em disco
    // nao e acessivel direto pelo renderer).
    const imgs = Array.isArray(d.imagens) ? d.imagens : []
    const comPreview = await Promise.all(imgs.map(async im => {
      const r = await window.api.arquivos.lerBase64(im.arquivo)
      return { ...im, base64: null, dataUrl: r?.ok ? r.dataUrl : '' }
    }))
    setImagens(comPreview)
    // Carrega o historico do documento (painel na aba Documento Gerado).
    const rh = await window.api.documentoGerado.listarHistorico(d.id)
    setHistorico(rh.ok ? rh.data || [] : [])
  }

  // Padrão obrigatório de docs/PADRAO_TELAS.md seção 3.1: activeTab sempre
  // começa em 'cadastro', mostra o último registro em modo view — nunca
  // chama openNew() automaticamente, mesmo com a lista vazia.
  const carregarTudo = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.api.documentoGerado.listar({})
      const lista = res.ok ? res.data || [] : []
      setRegistros(lista)
      if (lista.length) {
        const ultimo = lista.length - 1
        setCurrentIdx(ultimo)
        await carregarForm(lista[ultimo])
      }
      // lista vazia: form fica no EMPTY_FORM inicial, ainda em modo view
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { carregarTudo() }, [carregarTudo])

  function limparFiltros() {
    setFiltros(FILTROS_VAZIOS)
  }

  const qtdFiltrosAtivos = Object.values(filtros).filter(Boolean).length
  const totalFiltrado = fResultados?.length || 0
  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / porPagina))
  const registrosPagina = (fResultados || []).slice((pagina - 1) * porPagina, pagina * porPagina)

  // ── Selecao em massa (aba Acesso) ────────────────────────────────────────
  function toggleSelecionado(id) {
    setSelecionados(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }
  const idsResultado = (fResultados || []).map(r => r.id)
  const todosSelecionados = idsResultado.length > 0 && idsResultado.every(id => selecionados.has(id))
  function toggleSelecionarTodos() {
    setSelecionados(todosSelecionados ? new Set() : new Set(idsResultado))
  }
  // Botao direito numa linha: se a linha nao estiver marcada, o menu age so
  // nela; se estiver, age em todas as marcadas.
  function abrirMenuLinha(e, id) {
    e.preventDefault()
    setMenuCtx({ x: e.clientX, y: e.clientY, alvoId: id })
  }
  function idsAlvoMenu() {
    if (!menuCtx) return []
    if (menuCtx.alvoId != null && !selecionados.has(menuCtx.alvoId)) return [menuCtx.alvoId]
    return [...selecionados]
  }
  async function alterarStatusEmMassa(status) {
    const ids = idsAlvoMenu()
    setMenuCtx(null)
    if (!ids.length) { notificar.aviso('Marque ao menos um documento (coluna Sel) ou clique com o botao direito sobre uma linha.'); return }
    const res = await window.api.documentoGerado.mudarStatusLote({ ids, status })
    if (res.ok) {
      notificar.sucesso(`${res.data.atualizadas} documento(s) para "${STATUS_META[status].label}".`)
      setSelecionados(new Set())
      await carregarAcesso()
      await carregarTudo()
    } else {
      notificar.erro(res.erro || 'Falha ao alterar status.')
    }
  }

  function selecionarLinha(registroFiltrado) {
    const idx = registros.findIndex(r => r.id === registroFiltrado.id)
    if (idx < 0) return
    setCurrentIdx(idx)
    carregarForm(registros[idx])
  }

  function navTo(idx) {
    if (idx < 0 || idx >= registros.length) return
    setCurrentIdx(idx)
    carregarForm(registros[idx])
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setRascunhoGerado(null)
    setHistorico([])
    setImagens([])
    setErro(null)
    setMode('new')
    setActiveTab('cadastro')
  }

  function novaImagem({ nome, mime, base64 }) {
    return { id: null, nome: nome || 'imagem', mime: mime || 'image/png', base64, arquivo: null, legenda: '', noPdf: false }
  }
  async function handleAdicionarImagens() {
    const sel = await window.api.documentoGerado.selecionarImagens()
    if (sel?.length) setImagens(prev => [...prev, ...sel.map(s => novaImagem({ nome: s.nome, mime: s.mediaType, base64: s.base64 }))])
  }
  function removerImagem(idx) {
    setImagens(prev => prev.filter((_, i) => i !== idx))
  }
  function setImagemProp(idx, patch) {
    setImagens(prev => prev.map((im, i) => i === idx ? { ...im, ...patch } : im))
  }
  // Ctrl+V de um print. Extrai imagem de qualquer forma que o clipboard
  // entregue: item image/*, arquivo colado, ou <img src="data:..."> dentro
  // de text/html. Retorna quantas imagens capturou.
  function extrairImagensDoClipboard(cd) {
    if (!cd) return 0
    let capturou = 0
    // 1) items image/* (print de tela do Windows, "copiar imagem" do browser)
    for (const it of Array.from(cd.items || [])) {
      if (it.kind === 'file' && it.type.startsWith('image/')) {
        const file = it.getAsFile()
        if (file) { lerArquivoImagem(file); capturou++ }
      }
    }
    if (capturou) return capturou
    // 2) files (alguns apps colam como File direto)
    for (const f of Array.from(cd.files || [])) {
      if (f.type.startsWith('image/')) { lerArquivoImagem(f); capturou++ }
    }
    if (capturou) return capturou
    // 3) text/html com <img src="data:image...">
    const html = cd.getData?.('text/html') || ''
    const m = html.match(/<img[^>]+src=["'](data:image\/[a-z0-9.+-]+;base64,[^"']+)["']/i)
    if (m) {
      const mm = m[1].match(/^data:(image\/[a-z0-9.+-]+);base64,(.*)$/i)
      if (mm) { setImagens(prev => [...prev, novaImagem({ nome: 'print.png', mime: mm[1], base64: mm[2] })]); capturou++ }
    }
    return capturou
  }
  function lerArquivoImagem(file) {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      const m = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.*)$/i)
      if (m) setImagens(prev => [...prev, novaImagem({ nome: file.name || 'print.png', mime: m[1], base64: m[2] })])
    }
    reader.readAsDataURL(file)
  }
  function aoColarImagem(e) {
    if (extrairImagensDoClipboard(e.clipboardData)) e.preventDefault()
  }
  // Listener global de paste enquanto a aba Cadastro esta em edicao: cobre
  // o caso de colar sem foco na area de imagens. Ignora se o alvo do paste
  // for um campo de texto (deixa colar texto normalmente). `mode` (nao
  // `isRO`, que so e declarado mais abaixo) pra evitar TDZ no useEffect.
  useEffect(() => {
    if (mode === 'view' || activeTab !== 'cadastro') return
    const handler = (e) => {
      const alvo = e.target
      const emCampo = alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable)
      // Se estiver num campo de texto e o clipboard tiver texto, nao mexe.
      if (emCampo && (e.clipboardData?.getData?.('text/plain') || '').trim()) return
      if (extrairImagensDoClipboard(e.clipboardData)) e.preventDefault()
    }
    window.addEventListener('paste', handler)
    return () => window.removeEventListener('paste', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, activeTab])
  function srcImagem(img) {
    if (img.base64) return `data:${img.mime};base64,${img.base64}`
    return img.dataUrl || '' // preenchido ao carregar o documento (via lerBase64)
  }
  function dataUrlParaBase64(dataUrl) {
    const m = String(dataUrl || '').match(/;base64,(.*)$/)
    return m ? m[1] : ''
  }

  function selecionarDaConsulta(item) {
    const idx = registros.findIndex(r => r.id === item.id)
    if (idx >= 0) { setCurrentIdx(idx); carregarForm(item) }
    setShowConsulta(false)
  }

  function handleDesistir() {
    if (currentIdx >= 0 && registros[currentIdx]) carregarForm(registros[currentIdx])
    else openNew()
    setMode('view')
  }

  // Botão "Gerar" da aba Cadastro — só chama a IA, não grava nada. Pode
  // ser clicado quantas vezes o usuário quiser antes de confirmar.
  async function handleGerar() {
    if (!form.documentoTipoId || !form.nomeReferencia.trim() || !form.clienteNome.trim() || !form.autor.trim() || !form.textoBruto.trim()) {
      setErro('Preencha tipo, nome de referência, cliente, autor e o texto bruto.')
      return
    }
    setErro(null)
    setGerando(true)
    const unsub = window.api.documentoGerado.onProgresso(p => setProgresso(p))
    try {
      // Todas as imagens vao como contexto multimodal pra IA. As marcadas
      // "sai no documento" (noPdf) tambem contam pra qtdImagensPdf: a IA
      // devolve `legendas` na mesma ordem dessas.
      const imgsCtx = imagens.map(im => ({
        mediaType: im.mime,
        base64: im.base64 || dataUrlParaBase64(im.dataUrl),
        noPdf: !!im.noPdf,
      })).filter(x => x.base64)
      const idxPdf = imagens.map((im, i) => im.noPdf ? i : -1).filter(i => i >= 0)

      const res = await window.api.documentoGerado.gerar({
        documentoTipoId: form.documentoTipoId,
        nomeReferencia: form.nomeReferencia.trim(),
        textoBruto: form.textoBruto.trim(),
        imagens: imgsCtx.map(({ mediaType, base64 }) => ({ mediaType, base64 })),
        qtdImagensPdf: idxPdf.length,
      })
      if (!res.ok) { setErro(res.erro); return }

      // Legendas geradas -> aplica nas imagens noPdf, na ordem.
      const legendas = res.data.conteudoEstruturado?.legendas
      if (Array.isArray(legendas) && idxPdf.length) {
        setImagens(prev => prev.map((im, i) => {
          const pos = idxPdf.indexOf(i)
          return pos >= 0 && legendas[pos] ? { ...im, legenda: legendas[pos] } : im
        }))
      }
      // `legendas` nao faz parte do conteudo do documento (nao vai pro PDF
      // como texto) — some do rascunho.
      if (res.data.conteudoEstruturado && 'legendas' in res.data.conteudoEstruturado) {
        const { legendas: _drop, ...resto } = res.data.conteudoEstruturado
        res.data.conteudoEstruturado = resto
      }
      // Documento JA gravado: empurra a versao atual pro historico do banco
      // ANTES de trocar (chama salvarRevisao com o mesmo conteudo antigo?
      // nao — salvarRevisao ja faz o diff. Aqui so gravamos direto o
      // historico da geracao). Documento novo: fica so em memoria ate
      // gravar (o primeiro Gravar nao gera historico; a partir do 2o
      // Gerar+Gravar, sim).
      if (form.id && rascunhoGerado?.conteudoEstruturado) {
        await window.api.documentoGerado.salvarRevisao(form.id, {
          conteudoEstruturado: res.data.conteudoEstruturado,
          participantes: form.participantes.filter(p => p.nome.trim()),
          titulo: res.data.titulo,
          nomeReferencia: form.nomeReferencia,
          clienteId: form.clienteId || null,
          clienteNome: form.clienteNome,
          autor: form.autor,
          origemHistorico: 'geracao',
        })
        const rh = await window.api.documentoGerado.listarHistorico(form.id)
        setHistorico(rh.ok ? rh.data || [] : [])
      }
      setRascunhoGerado(res.data)
      setActiveTab('gerado')
    } finally {
      setGerando(false)
      setProgresso(null)
      unsub()
    }
  }

  // Botão "Gravar" do FormToolbar — grava de fato (INSERT se for um
  // documento novo, UPDATE se já existia). Precisa ter passado por "Gerar"
  // pelo menos uma vez antes (é o texto bruto reformulado pela IA que vai
  // pro banco, não o texto bruto cru).
  async function handleConfirmar() {
    if (!rascunhoGerado) {
      setErro('Clique em "Gerar" antes de gravar — o documento precisa ser reformulado pela IA primeiro.')
      return
    }
    setSaving(true)
    setErro(null)
    try {
      const participantesValidos = form.participantes.filter(p => p.nome.trim())
      // Documento novo: grava primeiro (pra ter id), depois persiste as
      // imagens naquele id e faz um salvarRevisao so pra gravar o jsonb
      // imagens. Documento existente: persiste as imagens direto.
      let res = form.id
        ? await window.api.documentoGerado.salvarRevisao(form.id, {
            conteudoEstruturado: rascunhoGerado.conteudoEstruturado,
            participantes: participantesValidos,
            titulo: rascunhoGerado.titulo,
            nomeReferencia: form.nomeReferencia,
            clienteId: form.clienteId || null,
            clienteNome: form.clienteNome,
            autor: form.autor,
          })
        : await window.api.documentoGerado.confirmar({
            documentoTipoId: form.documentoTipoId,
            titulo: rascunhoGerado.titulo,
            nomeReferencia: form.nomeReferencia,
            clienteId: form.clienteId || null,
            clienteNome: form.clienteNome,
            autor: form.autor,
            participantes: participantesValidos,
            textoBruto: form.textoBruto,
            conteudoEstruturado: rascunhoGerado.conteudoEstruturado,
          })
      if (!res.ok) { setErro(res.erro); return }

      // Persiste as imagens (move base64 pra disco, limpa orfaos) e grava a
      // lista canonica no documento.
      const docId = res.data.id
      const paraPersistir = imagens.map(im => ({
        id: im.id, arquivo: im.arquivo || null, mime: im.mime,
        base64: im.base64 || dataUrlParaBase64(im.dataUrl),
        legenda: im.legenda || '', noPdf: !!im.noPdf,
      }))
      const rp = await window.api.documentoGerado.persistirImagens({ documentoId: docId, imagens: paraPersistir })
      if (rp.ok) {
        await window.api.documentoGerado.salvarRevisao(docId, {
          conteudoEstruturado: rascunhoGerado.conteudoEstruturado,
          participantes: participantesValidos,
          titulo: rascunhoGerado.titulo,
          nomeReferencia: form.nomeReferencia,
          clienteId: form.clienteId || null,
          clienteNome: form.clienteNome,
          autor: form.autor,
          imagens: rp.data,
        })
      }

      setMode('view')
      const resLista = await window.api.documentoGerado.listar({})
      const lista = resLista.ok ? resLista.data || [] : []
      setRegistros(lista)
      const idx = lista.findIndex(r => r.id === res.data.id)
      if (idx >= 0) setCurrentIdx(idx)
      await carregarForm(res.data)
    } finally {
      setSaving(false)
    }
  }

  async function handleMudarStatus(status) {
    if (!form.id) return
    const res = await window.api.documentoGerado.mudarStatus(form.id, status)
    if (res.ok) setForm(f => ({ ...f, status }))
  }

  async function confirmarExclusao() {
    setConfirmExcluir(false)
    const res = await window.api.documentoGerado.excluir(form.id)
    if (!res.ok) { setErro(res.erro); return }
    const resLista = await window.api.documentoGerado.listar({})
    const lista = resLista.ok ? resLista.data || [] : []
    setRegistros(lista)
    if (lista.length) {
      const ni = Math.min(currentIdx, lista.length - 1)
      setCurrentIdx(ni)
      await carregarForm(lista[ni])
    } else {
      openNew()
    }
  }

  function setParticipante(idx, patch) {
    setForm(prev => ({ ...prev, participantes: prev.participantes.map((p, i) => i === idx ? { ...p, ...patch } : p) }))
  }
  function addParticipante() {
    setForm(prev => ({ ...prev, participantes: [...prev.participantes, { nome: '', setor: '' }] }))
  }
  function removerParticipante(idx) {
    setForm(prev => ({ ...prev, participantes: prev.participantes.filter((_, i) => i !== idx) }))
  }

  async function buscarClientes(campo, modo, busca) {
    let sql = 'SELECT id, nome FROM entidade_001 WHERE ativo IS DISTINCT FROM false'
    const params = []
    if (busca) {
      const termo = modo === 'iniciando' ? `${busca}%` : modo === 'igual' ? busca : `%${busca}%`
      params.push(termo)
      sql += ` AND nome ILIKE $${params.length}`
    }
    sql += ' ORDER BY nome LIMIT 200'
    const res = await window.api.form.query(sql, params)
    return { registros: res.ok ? res.data : [], total: res.ok ? res.data.length : 0 }
  }

  const isRO = mode === 'view'
  const tipoAtual = tipos.find(t => t.id === form.documentoTipoId)
  const c = rascunhoGerado?.conteudoEstruturado

  // Edita um campo do conteudo gerado (string, array de string, ou um
  // campo de um item do array `processos`). Mantem `rascunhoGerado` como
  // fonte da verdade que vai pro banco no Gravar.
  function patchConteudo(patch) {
    setRascunhoGerado(rg => rg ? { ...rg, conteudoEstruturado: { ...rg.conteudoEstruturado, ...patch } } : rg)
  }
  function patchProcesso(idx, patch) {
    setRascunhoGerado(rg => {
      if (!rg) return rg
      const procs = [...(rg.conteudoEstruturado.processos || [])]
      procs[idx] = { ...procs[idx], ...patch }
      return { ...rg, conteudoEstruturado: { ...rg.conteudoEstruturado, processos: procs } }
    })
  }
  const gEdit = !isRO // pode editar o gerado sempre que o form estiver em edicao/novo

  async function copiarHistorico(item) {
    const txt = conteudoParaTexto(item.conteudo_estruturado)
    try {
      await navigator.clipboard.writeText(txt)
      notificar.sucesso('Versão copiada para a área de transferência.')
    } catch {
      notificar.erro('Não foi possível copiar.')
    }
  }
  function restaurarHistorico(item) {
    setRascunhoGerado(rg => rg ? { ...rg, conteudoEstruturado: item.conteudo_estruturado } : { titulo: form.titulo, conteudoEstruturado: item.conteudo_estruturado })
    if (isRO) setMode('edit')
    notificar.info('Versão carregada no editor. Revise e clique em Gravar para aplicar.')
  }

  return (
    <div className="page-with-footer">
      <div className="page-tabs">
        <button className={`page-tab${activeTab === 'acesso' ? ' active' : ''}`} onClick={() => setActiveTab('acesso')}>Acesso</button>
        <button className={`page-tab${activeTab === 'cadastro' ? ' active' : ''}`} onClick={() => setActiveTab('cadastro')}>Cadastro</button>
        {rascunhoGerado && (
          <button className={`page-tab${activeTab === 'gerado' ? ' active' : ''}`} onClick={() => setActiveTab('gerado')}>Documento Gerado</button>
        )}
        {form.id && <span className="page-tab-info">{form.titulo}</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          {activeTab === 'acesso' && (
            <>
              <button className="btn btn-ghost" onClick={handleExportarTodos} disabled={!(fResultados?.length) || exportandoTodos}
                title={fResultados?.length ? `Exportar os ${fResultados.length} documentos do filtro atual` : 'Nenhum registro para exportar'}
                style={{ height: 28, fontSize: 11, padding: '0 10px' }}>
                <FileDown size={12} />
                {exportandoTodos ? 'Exportando...' : `Exportar Todos${fResultados?.length ? ` (${fResultados.length})` : ''}`}
              </button>
              <button className="btn btn-ghost" onClick={handleEmailAcesso} disabled={!(fResultados?.length) || preparandoEmail}
                title={fResultados?.length ? `Enviar por e-mail os ${fResultados.length} documentos consultados (PDF de cada um)` : 'Consulte documentos primeiro'}
                style={{ height: 28, fontSize: 11, padding: '0 10px' }}>
                <Mail size={12} />
                {preparandoEmail ? 'Preparando...' : `E-mail${fResultados?.length ? ` (${fResultados.length})` : ''}`}
              </button>
            </>
          )}
          <button className="btn btn-ghost" onClick={handleConfigurarPastaExportacoes}
            title={pastaExportacoes ? `Pasta de exportações: ${pastaExportacoes}` : 'Nenhuma pasta configurada — exportações abrem "Salvar como"'}
            style={{ height: 28, fontSize: 11, padding: '0 10px' }}>
            <Settings size={12} />
            {pastaExportacoes
              ? <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{pastaExportacoes}</span>
              : 'Pasta de Exportações'}
          </button>
        </div>
      </div>

      <div className="page-content">
        {erro && (
          <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(239,68,68,.4)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--red)' }}>
            {erro}
          </div>
        )}

        {activeTab === 'acesso' && (
          <>
            <div style={{ border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', boxShadow: 'var(--sh-xs)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setFiltrosAbertos(a => !a)}>
                <SlidersHorizontal size={13} color="var(--t2)" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Filtros</span>
                {qtdFiltrosAtivos > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: 'var(--or3)', color: 'var(--or)' }}>
                    {qtdFiltrosAtivos} ativo{qtdFiltrosAtivos !== 1 ? 's' : ''}
                  </span>
                )}
                <div style={{ flex: 1 }} />
                {qtdFiltrosAtivos > 0 && (
                  <button type="button" className="btn btn-ghost" style={{ height: 24, padding: '0 8px', fontSize: 11 }}
                    onClick={e => { e.stopPropagation(); limparFiltros() }}>
                    <RotateCcw size={11} /> Limpar
                  </button>
                )}
                {filtrosAbertos ? <ChevronUp size={13} color="var(--t3)" /> : <ChevronDown size={13} color="var(--t3)" />}
              </div>

              {filtrosAbertos && (
                <div style={{ padding: '4px 14px 14px', borderTop: '1px solid var(--bd)', paddingTop: 12 }}
                  onKeyDown={e => e.key === 'Enter' && carregarAcesso()}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Cliente</label>
                      <input className="form-input form-input-sm"
                        value={filtros.cliente} onChange={e => setFiltros(f => ({ ...f, cliente: e.target.value }))}
                        placeholder="Nome do cliente" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Tipo de documento</label>
                      <select className="form-select form-input-sm"
                        value={filtros.documentoTipoId} onChange={e => setFiltros(f => ({ ...f, documentoTipoId: e.target.value }))}>
                        <option value="">Todos</option>
                        {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Status</label>
                      <select className="form-select form-input-sm"
                        value={filtros.status} onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))}>
                        <option value="">Todos</option>
                        {STATUS_ORDEM.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="button" className="btn btn-primary" style={{ height: 32, padding: '0 16px' }}
                    onClick={() => carregarAcesso()} disabled={fLoading}>
                    <Search size={13} /> {fLoading ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              )}
            </div>

            {fResultados === null ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)', border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)' }}>
                <div style={{ fontSize: 13 }}>Configure os filtros (opcional) e clique em Buscar</div>
              </div>
            ) : (
              <div style={{ border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden', background: 'var(--s1)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <Th style={{ width: 40, textAlign: 'center' }}>
                          <input type="checkbox" checked={todosSelecionados} onChange={toggleSelecionarTodos}
                            title="Selecionar todos" style={{ cursor: 'pointer' }} />
                        </Th>
                        <Th style={{ width: 70 }}>Código</Th>
                        <Th>Título</Th><Th>Tipo</Th><Th>Cliente</Th><Th>Autor</Th><Th>Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrosPagina.map(r => {
                        const marcado = selecionados.has(r.id)
                        return (
                          <tr key={r.id} onDoubleClick={() => { selecionarLinha(r); setActiveTab('cadastro') }}
                            onContextMenu={e => abrirMenuLinha(e, r.id)}
                            style={{ cursor: 'pointer', background: marcado ? 'var(--or4, var(--s2))' : 'transparent' }}
                            onMouseEnter={e => { if (!marcado) e.currentTarget.style.background = 'var(--s2)' }}
                            onMouseLeave={e => { if (!marcado) e.currentTarget.style.background = 'transparent' }}>
                            <Td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                              <input type="checkbox" checked={marcado} onChange={() => toggleSelecionado(r.id)}
                                style={{ cursor: 'pointer' }} />
                            </Td>
                            <Td style={{ fontFamily: 'monospace', color: 'var(--or)', fontWeight: 600 }}>{r.codigo}</Td>
                            <Td>{r.titulo}</Td>
                            <Td>{r.tipo_nome}</Td>
                            <Td>{r.cliente_nome}</Td>
                            <Td>{r.autor}</Td>
                            <Td><span className={`badge ${STATUS_META[r.status]?.classe}`}>{STATUS_META[r.status]?.label}</span></Td>
                          </tr>
                        )
                      })}
                      {!fLoading && registrosPagina.length === 0 && (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--t3)', fontSize: 11, fontStyle: 'italic' }}>
                          Nenhum registro encontrado
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {selecionados.size > 0 && (
                  <div style={{ padding: '6px 14px', borderTop: '1px solid var(--bd)', fontSize: 11.5, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{selecionados.size} selecionado{selecionados.size !== 1 ? 's' : ''}. Clique com o botao direito na lista para alterar o status.</span>
                    <button className="btn btn-ghost" style={{ height: 22, fontSize: 10.5, padding: '0 8px' }} onClick={() => setSelecionados(new Set())}>Limpar selecao</button>
                  </div>
                )}
                <PaginacaoBar pagina={pagina} totalPaginas={totalPaginas} total={totalFiltrado} porPagina={porPagina}
                  onPagina={p => setPagina(p)} onPorPagina={n => { setPorPagina(n); setPagina(1) }} />
              </div>
            )}

            <MenuContextoGrid
              pos={menuCtx}
              onFechar={() => setMenuCtx(null)}
              titulo={`Alterar status de ${idsAlvoMenu().length} documento${idsAlvoMenu().length !== 1 ? 's' : ''}`}
              itens={STATUS_ORDEM.map(s => ({ label: STATUS_META[s].label, onClick: () => alterarStatusEmMassa(s) }))}
            />
          </>
        )}

        {activeTab === 'cadastro' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(420px, 1.3fr)', gap: 16, flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.status && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge ${STATUS_META[form.status]?.classe}`}>{STATUS_META[form.status]?.label}</span>
                  {isRO && form.id && STATUS_ORDEM.map(s => s !== form.status && (
                    <button key={s} className="btn btn-ghost" style={{ height: 26, fontSize: 10.5 }}
                      onClick={() => handleMudarStatus(s)}>
                      {STATUS_META[s].label}
                    </button>
                  ))}
                </div>
              )}

              <SecaoHeader titulo="Documento" />
              <div className="form-group">
                <label className="form-label">Tipo de documento</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {tipos.map(t => (
                    <button key={t.id} type="button"
                      className={`btn ${form.documentoTipoId === t.id ? 'btn-primary' : 'btn-ghost'}`}
                      disabled={isRO}
                      onClick={() => setForm(f => ({ ...f, documentoTipoId: t.id }))}
                      style={{ flex: 1, height: 38 }}>
                      {t.nome}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: form.id ? 'auto 1fr' : '1fr', gap: 10 }}>
                {form.id && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Código</label>
                    <div className="form-input" style={{ width: 80, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', color: 'var(--or)', fontFamily: 'monospace' }}>
                      {form.codigo}
                    </div>
                  </div>
                )}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{tipoAtual?.codigo === 'ata_treinamento' ? 'Módulo do treinamento' : 'Nome da tela/cadastro'}</label>
                  <input className="form-input" value={form.nomeReferencia} disabled={isRO}
                    onChange={e => setForm(f => ({ ...f, nomeReferencia: e.target.value }))}
                    placeholder="Ex: Cadastro de Ordem de Produção" />
                </div>
              </div>

              <SeletorEntidade
                label="Cliente"
                placeholder="Nenhum"
                papel="cliente"
                value={form.clienteNome}
                disabled={isRO}
                onClear={() => setForm(f => ({ ...f, clienteId: '', clienteNome: '' }))}
                onSelect={r => setForm(f => ({ ...f, clienteId: String(r.id), clienteNome: r.nome }))}
              />

              <div className="form-group">
                <label className="form-label">Autor</label>
                <input className="form-input" value={form.autor} disabled={isRO}
                  onChange={e => setForm(f => ({ ...f, autor: e.target.value }))} placeholder="Seu nome" />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 8px' }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap' }}>Participantes</span>
                  <span style={{ flex: 1, height: 1, background: 'var(--bd2)' }} />
                  {!isRO && (
                    <button className="btn btn-ghost" style={{ height: 26, fontSize: 11, flexShrink: 0 }} onClick={addParticipante}>
                      <Plus size={13} /> Adicionar linha
                    </button>
                  )}
                </div>
                <div style={{ border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden', background: 'var(--s1)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--s1)' }}>
                        <Th>Nome</Th><Th>Setor</Th><Th style={{ width: 40 }}></Th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.participantes.length === 0 && (
                        <tr><td colSpan={3} style={{ padding: 16, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>Nenhum participante.</td></tr>
                      )}
                      {form.participantes.map((p, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid var(--bd)' }}>
                          <Td><input style={cellInputStyle(isRO)} value={p.nome} disabled={isRO}
                            onChange={e => setParticipante(idx, { nome: e.target.value })} placeholder="Nome" /></Td>
                          <Td><input style={cellInputStyle(isRO)} value={p.setor} disabled={isRO}
                            onChange={e => setParticipante(idx, { setor: e.target.value })} placeholder="Setor" /></Td>
                          <Td>
                            {!isRO && (
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <button title="Remover linha" style={iconBtnSmStyle(isRO)} onClick={() => removerParticipante(idx)}>
                                  <Trash2 size={13} color="var(--red)" />
                                </button>
                              </div>
                            )}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div style={{ border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', boxShadow: 'var(--sh-xs)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--bd)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Texto bruto</span>
              </div>
              <textarea
                value={form.textoBruto} disabled={isRO}
                onChange={e => setForm(f => ({ ...f, textoBruto: e.target.value }))}
                placeholder="Cole aqui as anotações da reunião..."
                style={{ flex: 1, border: 'none', outline: 'none', resize: 'none', padding: 14, fontFamily: 'inherit', fontSize: 13, lineHeight: 1.6, background: 'transparent', color: 'var(--t1)' }}
              />
              {!isRO && (
                <div style={{ borderTop: '1px solid var(--bd)', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}
                  onPaste={aoColarImagem}>
                  {imagens.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {imagens.map((img, idx) => (
                        <div key={img.id || idx} style={{ width: 132, border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ position: 'relative', height: 74, background: 'var(--s2)' }}>
                            <img src={srcImagem(img)} alt={img.nome} title={img.nome}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button title="Remover" onClick={() => removerImagem(idx)}
                              style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: 4, border: 'none', background: 'rgba(0,0,0,.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                              <Trash2 size={11} />
                            </button>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 7px', fontSize: 10.5, color: 'var(--t2)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={!!img.noPdf} onChange={e => setImagemProp(idx, { noPdf: e.target.checked })} />
                            Sai no documento
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="btn btn-ghost" onClick={handleAdicionarImagens} style={{ height: 32, fontSize: 11.5 }}
                      title="Anexar imagens, ou cole um print aqui com Ctrl+V">
                      <ImagePlus size={13} /> Adicionar imagem (ou cole com Ctrl+V)
                    </button>
                    <button className="btn btn-primary" onClick={handleGerar} disabled={gerando}>
                      <Bot size={13} /> {gerando ? 'Gerando...' : 'Gerar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'gerado' && (
          gerando ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '70px 0', color: 'var(--t2)' }}>
              <Bot size={26} color="var(--or)" style={{ animation: 'pulse 1.4s ease-in-out infinite' }} />
              <div style={{ fontSize: 13 }}>{TITULOS_PROGRESSO[progresso?.fase] || 'Processando...'}</div>
            </div>
          ) : !c ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)', fontSize: 13 }}>
              Nenhum conteúdo gerado ainda. Preencha o texto na aba Cadastro e clique em Gerar.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.5 }}>
                {gEdit
                  ? 'Conteúdo gerado pela IA. Ajuste o que precisar aqui, depois clique em Gravar. O PDF sai com este conteúdo.'
                  : 'Conteúdo do documento. Clique em Alterar para editar as seções.'}
              </div>

              {c.introducao !== undefined && (
                <SecaoRecolhivel titulo="Introdução">
                  <CampoTextoGerado valor={c.introducao} editavel={gEdit} multilinha
                    onChange={v => patchConteudo({ introducao: v })} />
                </SecaoRecolhivel>
              )}

              {/* Imagens que saem no PDF — logo apos a Introducao, com
                  legenda editavel. As "so referencia" nao aparecem aqui. */}
              {imagens.some(im => im.noPdf) && (
                <SecaoRecolhivel titulo={`Imagens do documento (${imagens.filter(im => im.noPdf).length})`}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {imagens.map((img, idx) => img.noPdf && (
                      <div key={img.id || idx} style={{ border: '1px solid var(--bd)', borderRadius: 8, padding: 10, display: 'flex', gap: 10 }}>
                        <img src={srcImagem(img)} alt={img.nome}
                          style={{ width: 160, maxHeight: 120, objectFit: 'contain', border: '1px solid var(--bd)', borderRadius: 4, background: 'var(--s2)', flexShrink: 0 }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--t3)' }}>Legenda</div>
                          <CampoTextoGerado valor={img.legenda} editavel={gEdit} multilinha
                            placeholder="Legenda que aparece abaixo da imagem no PDF"
                            onChange={v => setImagemProp(idx, { legenda: v })} />
                          {gEdit && (
                            <button className="btn btn-ghost" style={{ height: 26, fontSize: 11, alignSelf: 'flex-start', color: 'var(--red)' }}
                              onClick={() => setImagemProp(idx, { noPdf: false })}>
                              Tirar do documento
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </SecaoRecolhivel>
              )}

              {c.nomeTela !== undefined && (
                <SecaoRecolhivel titulo="Nome da tela">
                  <CampoTextoGerado valor={c.nomeTela} editavel={gEdit}
                    onChange={v => patchConteudo({ nomeTela: v })} />
                </SecaoRecolhivel>
              )}
              {c.objetivoTela !== undefined && (
                <SecaoRecolhivel titulo="Objetivo da tela">
                  <CampoTextoGerado valor={c.objetivoTela} editavel={gEdit} multilinha
                    onChange={v => patchConteudo({ objetivoTela: v })} />
                </SecaoRecolhivel>
              )}
              {Array.isArray(c.funcionalidades) && (
                <SecaoRecolhivel titulo="Funcionalidades">
                  <ListaEditavel itens={c.funcionalidades} editavel={gEdit}
                    onChange={arr => patchConteudo({ funcionalidades: arr })} />
                </SecaoRecolhivel>
              )}
              {c.integracoes !== undefined && (
                <SecaoRecolhivel titulo="Integrações">
                  <CampoTextoGerado valor={c.integracoes} editavel={gEdit} multilinha
                    onChange={v => patchConteudo({ integracoes: v })} />
                </SecaoRecolhivel>
              )}
              {Array.isArray(c.escopo) && (
                <SecaoRecolhivel titulo="Escopo do treinamento">
                  <ListaEditavel itens={c.escopo} editavel={gEdit}
                    onChange={arr => patchConteudo({ escopo: arr })} />
                </SecaoRecolhivel>
              )}
              {Array.isArray(c.processos) && (
                <SecaoRecolhivel titulo="Detalhamento dos processos">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {c.processos.map((proc, idx) => (
                      <div key={idx} style={{ border: '1px solid var(--bd)', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)' }}>{idx + 1}.</span>
                          <CampoTextoGerado valor={proc.titulo} editavel={gEdit}
                            onChange={v => patchProcesso(idx, { titulo: v })} placeholder="Título do processo" />
                          {gEdit && (
                            <button className="btn btn-ghost" style={{ height: 24, width: 24, padding: 0, color: 'var(--red)', flexShrink: 0 }}
                              title="Remover processo"
                              onClick={() => patchConteudo({ processos: c.processos.filter((_, i) => i !== idx) })}>
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                        <CampoTextoGerado valor={proc.descricao} editavel={gEdit} multilinha
                          onChange={v => patchProcesso(idx, { descricao: v })} placeholder="Descrição" />
                        <SubListaProcesso rotulo="Aplicações" itens={proc.aplicacoes} editavel={gEdit}
                          onChange={arr => patchProcesso(idx, { aplicacoes: arr })} />
                        <SubListaProcesso rotulo="Importância" itens={proc.importancia} editavel={gEdit}
                          onChange={arr => patchProcesso(idx, { importancia: arr })} />
                        <SubListaProcesso rotulo="Benefícios" itens={proc.beneficios} editavel={gEdit}
                          onChange={arr => patchProcesso(idx, { beneficios: arr })} />
                      </div>
                    ))}
                    {gEdit && (
                      <button className="btn btn-ghost" style={{ height: 30, fontSize: 11.5, alignSelf: 'flex-start' }}
                        onClick={() => patchConteudo({ processos: [...(c.processos || []), { titulo: '', descricao: '' }] })}>
                        <Plus size={12} /> Adicionar processo
                      </button>
                    )}
                  </div>
                </SecaoRecolhivel>
              )}

              {/* Historico de geracoes/edicoes — estilo Cofre de Senhas. */}
              {historico.length > 0 && (
                <div style={{ border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', boxShadow: 'var(--sh-xs)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setHistoricoAberto(a => !a)}>
                    <History size={13} color="var(--t3)" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', flex: 1 }}>
                      Histórico de versões ({historico.length})
                    </span>
                    {historicoAberto ? <ChevronUp size={13} color="var(--t3)" /> : <ChevronDown size={13} color="var(--t3)" />}
                  </div>
                  {historicoAberto && (
                    <div style={{ borderTop: '1px solid var(--bd)', maxHeight: 300, overflowY: 'auto' }}>
                      {historico.map(h => (
                        <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '1px solid var(--bd)' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: 'var(--t1)' }}>{fmtDataHoraHist(h.criado_em)}</div>
                            <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>{h.origem === 'geracao' ? 'Geração da IA' : 'Edição manual'}</div>
                          </div>
                          <button className="btn btn-ghost" style={{ height: 26, fontSize: 11 }} onClick={() => copiarHistorico(h)}>
                            <Copy size={12} /> Copiar
                          </button>
                          {gEdit && (
                            <button className="btn btn-ghost" style={{ height: 26, fontSize: 11 }} onClick={() => restaurarHistorico(h)}>
                              <RotateCcw size={12} /> Restaurar
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {(activeTab === 'cadastro' || activeTab === 'gerado') && (
        <FormToolbar
          mode={mode}
          nav={{ currentIdx, total: registros.length, onNav: navTo }}
          temRegistros={registros.length > 0}
          saving={saving}
          onIncluir={openNew}
          onAlterar={() => setMode('edit')}
          onExcluir={() => setConfirmExcluir(true)}
          onConsultar={() => setShowConsulta(true)}
          onGravar={handleConfirmar}
          onDesistir={handleDesistir}
          onExportar={mode === 'view' && form.id ? handleExportar : undefined}
          acoesExtras={mode === 'view' && form.id ? (
            <button className="btn btn-ghost" onClick={handleEmailCadastro} disabled={preparandoEmail}
              title="Enviar este documento por e-mail (PDF) e marcar como Enviado">
              <Mail size={13} /> {preparandoEmail ? 'Preparando...' : 'E-mail'}
            </button>
          ) : undefined}
        />
      )}

      {emailModal && (
        <ComposerModal
          modo="novo"
          contas={emailContas}
          contaAtivaId={emailContas[0]?.id}
          anexosIniciais={emailModal.anexos}
          assuntoInicial={emailModal.assunto}
          onFechar={() => setEmailModal(null)}
          onEnviado={handleEmailEnviado}
        />
      )}

      {showConsulta && (
        <PesquisaPadraoModal
          titulo="Pesquisa Padrão · documento_gerado_001"
          campos={CAMPOS_BUSCA_DOCUMENTO}
          colunasExibidas={CAMPOS_BUSCA_DOCUMENTO}
          campoInicial="titulo"
          onBuscar={async (campo, modo, busca) => {
            const res = await window.api.documentoGerado.listar({ cliente: busca })
            if (!res.ok) throw new Error(res.erro)
            return { registros: res.data, total: res.data.length }
          }}
          onSelecionar={selecionarDaConsulta}
          onFechar={() => setShowConsulta(false)}
          renderCelula={(r, col) => {
            if (col.nome_campo === 'status') return <span className={`badge ${STATUS_META[r.status]?.classe}`}>{STATUS_META[r.status]?.label}</span>
            return String(r[col.nome_campo] ?? '')
          }}
        />
      )}

      {confirmExcluir && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}>
          <div style={{ width: 380, background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px 10px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)' }}>Excluir documento</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 6 }}>Esta ação não pode ser desfeita.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '14px 22px 20px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmExcluir(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmarExclusao}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const TITULOS_PROGRESSO = {
  enviando:     'Enviando para o Claude...',
  estruturando: 'Estruturando conteúdo...',
  pronto:       'Documento pronto!',
}

function fmtDataHoraHist(iso) {
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
  } catch { return String(iso || '') }
}

// Serializa o conteudo estruturado em texto simples (pro botao Copiar do
// historico). So legibilidade, nao precisa reparsear.
function conteudoParaTexto(c) {
  if (!c || typeof c !== 'object') return ''
  const linhas = []
  const push = (rot, val) => {
    if (val == null || val === '') return
    if (Array.isArray(val)) {
      linhas.push(`${rot}:`)
      val.forEach(v => {
        if (v && typeof v === 'object') {
          linhas.push(`  - ${v.titulo || ''}`)
          if (v.descricao) linhas.push(`    ${v.descricao}`)
          for (const k of ['aplicacoes', 'importancia', 'beneficios']) {
            if (Array.isArray(v[k]) && v[k].length) linhas.push(`    ${k}: ${v[k].join(', ')}`)
          }
        } else {
          linhas.push(`  - ${v}`)
        }
      })
    } else {
      linhas.push(`${rot}: ${val}`)
    }
  }
  push('Introdução', c.introducao)
  push('Nome da tela', c.nomeTela)
  push('Objetivo da tela', c.objetivoTela)
  push('Funcionalidades', c.funcionalidades)
  push('Integrações', c.integracoes)
  push('Escopo do treinamento', c.escopo)
  push('Detalhamento dos processos', c.processos)
  return linhas.join('\n')
}

// Campo de texto do conteudo gerado: <div> em leitura, <input>/<textarea>
// em edicao. Mesma tipografia nos dois estados.
function CampoTextoGerado({ valor, editavel, multilinha, onChange, placeholder }) {
  if (!editavel) {
    return <div style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{valor || <span style={{ color: 'var(--t3)' }}>(vazio)</span>}</div>
  }
  const estilo = {
    width: '100%', boxSizing: 'border-box', border: '1px solid var(--bd)', borderRadius: 6,
    background: 'var(--s2)', color: 'var(--t1)', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.6, padding: '8px 10px',
  }
  if (!multilinha) {
    return <input value={valor || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={estilo} />
  }
  // Altura acompanha o conteudo: minimo 6 linhas, teto 24. Estima pelo
  // numero de quebras + wrap aproximado (1 linha a cada ~110 chars).
  const txt = String(valor || '')
  const linhasEstimadas = txt.split('\n').reduce((s, l) => s + Math.max(1, Math.ceil(l.length / 110)), 0)
  const rows = Math.min(24, Math.max(6, linhasEstimadas + 1))
  return <textarea value={valor || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} rows={rows} style={{ ...estilo, resize: 'vertical', minHeight: 120 }} />
}

// Lista de strings editavel (Funcionalidades, Escopo): um <input> por
// item + adicionar/remover. Em leitura vira <ol>.
function ListaEditavel({ itens, editavel, onChange }) {
  const lista = Array.isArray(itens) ? itens : []
  if (!editavel) {
    if (!lista.length) return <div style={{ fontSize: 13, color: 'var(--t3)' }}>(nenhum item)</div>
    return <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--t1)', lineHeight: 1.7 }}>{lista.map((x, i) => <li key={i}>{x}</li>)}</ol>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {lista.map((x, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--t3)', width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}.</span>
          <input value={x} onChange={e => { const arr = [...lista]; arr[i] = e.target.value; onChange(arr) }}
            style={{ flex: 1, border: '1px solid var(--bd)', borderRadius: 6, background: 'var(--s2)', color: 'var(--t1)', fontSize: 13, padding: '5px 8px' }} />
          <button className="btn btn-ghost" style={{ height: 24, width: 24, padding: 0, color: 'var(--red)', flexShrink: 0 }}
            title="Remover" onClick={() => onChange(lista.filter((_, j) => j !== i))}>
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button className="btn btn-ghost" style={{ height: 26, fontSize: 11, alignSelf: 'flex-start' }} onClick={() => onChange([...lista, ''])}>
        <Plus size={11} /> Adicionar item
      </button>
    </div>
  )
}

// Sub-lista opcional de um processo (aplicacoes/importancia/beneficios).
// Em leitura so mostra se tiver conteudo; em edicao sempre mostra pra
// permitir preencher.
function SubListaProcesso({ rotulo, itens, editavel, onChange }) {
  const lista = Array.isArray(itens) ? itens : []
  if (!editavel && !lista.length) return null
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 3 }}>{rotulo}</div>
      <ListaEditavel itens={lista} editavel={editavel} onChange={onChange} />
    </div>
  )
}

// Mesmo padrão visual do painel de Filtros da aba Acesso — header
// clicável com chevron, aberto por padrão. Usado pra cada seção do
// conteúdo gerado, evitando uma tela longa toda expandida de uma vez.
function SecaoRecolhivel({ titulo, children, abertoPorPadrao = true }) {
  const [aberto, setAberto] = useState(abertoPorPadrao)
  return (
    <div style={{ border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', boxShadow: 'var(--sh-xs)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setAberto(a => !a)}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', flex: 1 }}>{titulo}</span>
        {aberto ? <ChevronUp size={13} color="var(--t3)" /> : <ChevronDown size={13} color="var(--t3)" />}
      </div>
      {aberto && (
        <div style={{ padding: '4px 14px 14px', borderTop: '1px solid var(--bd)', paddingTop: 12 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Th({ children, style }) {
  return <th style={{ padding: '7px 12px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1.2, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)', background: 'var(--s1)', textAlign: 'left', ...style }}>{children}</th>
}
function Td({ children, style }) {
  return <td style={{ padding: '9px 12px', color: 'var(--t2)', borderBottom: '1px solid var(--bd)', fontSize: 12.5, ...style }}>{children}</td>
}

function cellInputStyle(isRO) {
  return {
    width: '100%', minWidth: 0, boxSizing: 'border-box',
    border: isRO ? '1px solid transparent' : '1px solid var(--bd)',
    background: 'transparent',
    fontSize: 12, padding: '4px 8px', borderRadius: 6, color: 'var(--t1)', height: 30,
  }
}
function iconBtnSmStyle(isRO) {
  return {
    background: 'transparent', border: isRO ? '1px solid transparent' : '1px solid var(--bd)',
    cursor: 'pointer', color: 'var(--t3)',
    width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6,
  }
}
