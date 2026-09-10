import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, FileDown, FileX, Settings, Paperclip, Mail, LayoutGrid, Table as TableIcon } from 'lucide-react'
import '../../App.css'
import FormToolbar from '../../components/FormToolbar'
import SeletorBusca from '../../components/SeletorBusca'
import SeletorEntidade from '../../components/SeletorEntidade'
import PesquisaPadraoModal from '../../components/PesquisaPadraoModal.jsx'
import PainelFiltrosGrid from '../../components/PainelFiltrosGrid'
import TabelaResultados from '../../components/TabelaResultados'
import InputData from '../../components/InputData'
import { notificar } from '../../components/Notificacao'
import PaginacaoBar from '../../components/PaginacaoBar.jsx'
import ComposerModal from '../email/ComposerModal'
import MenuContextoGrid from '../../components/MenuContextoGrid'
import { SecaoHeader } from '../../components/SecaoForm.jsx'
import InputCidade from '../../components/InputCidade.jsx'
import { EMPTY_FORM, STATUS_ORDEM, STATUS_META, MEIOS_TRANSPORTE, diaDaSemana, fmtDataBR, fmtMoeda, novoItem } from './utils'

const CAMPOS_CONSULTOR = [{ nome_campo: 'nome', label: 'Nome' }]
const CAMPOS_BUSCA_DESPESA = [
  { nome_campo: 'codigo',         label: 'Código'    },
  { nome_campo: 'consultor_nome', label: 'Consultor' },
  { nome_campo: 'cliente_nome',   label: 'Cliente'   },
  { nome_campo: 'status',         label: 'Status'    },
]

const STATUS_OPCOES = STATUS_ORDEM.map((s) => ({ valor: s, label: STATUS_META[s].label }))
const MEIOS_OPCOES = MEIOS_TRANSPORTE.map((m) => ({ valor: m, label: m }))

// Aba de Acesso — consulta completa (docs CLAUDE.md §4). Um filtro por
// coluna consultável de despesa_001.
const COLUNAS_FILTRO = [
  { chave: 'codigo', label: 'Código', tipo: 'texto' },
  { chave: 'cliente_id', label: 'Cliente', tipo: 'lookup', tabela: 'entidade_001', campoLabel: 'nome',
    camposBusca: [{ nome_campo: 'nome', label: 'Nome' }, { nome_campo: 'apelido', label: 'Apelido' }, { nome_campo: 'cnpj', label: 'CNPJ' }] },
  { chave: 'consultor_id', label: 'Consultor', tipo: 'lookup', tabela: 'kr_usuarios_001', campoLabel: 'nome',
    camposBusca: [{ nome_campo: 'nome', label: 'Nome' }, { nome_campo: 'usuario', label: 'Usuário' }] },
  { chave: 'local_partida', label: 'Local de partida', tipo: 'texto' },
  { chave: 'local_destino', label: 'Local de destino', tipo: 'texto' },
  { chave: 'meio_transporte', label: 'Meio de transporte', tipo: 'exato', multi: true, opcoes: MEIOS_OPCOES },
  { chave: 'veiculo_numero', label: 'Nº do veículo', tipo: 'texto' },
  { chave: 'veiculo_placa', label: 'Placa', tipo: 'texto' },
  { chave: 'observacoes', label: 'Observações', tipo: 'texto' },
  { chave: 'status', label: 'Status', tipo: 'exato', multi: true, opcoes: STATUS_OPCOES },
  { chave: 'total_despesas', label: 'Total (R$)', tipo: 'numero' },
  { chave: 'data_inicio', label: 'Período de', tipo: 'data' },
  { chave: 'data_fim', label: 'Período até', tipo: 'data' },
  { chave: 'criado_em', label: 'Criado em', tipo: 'data' },
  { chave: 'alterado_em', label: 'Alterado em', tipo: 'data' },
]

const COLUNAS_RESULTADO = [
  { chave: 'codigo', label: 'Código', largura: 70, sticky: true,
    render: (r) => <span style={{ fontFamily: 'monospace', color: 'var(--or)', fontWeight: 600 }}>{r.codigo || '-'}</span> },
  { chave: 'consultor_nome', label: 'Consultor', sticky: true },
  { chave: 'cliente_nome', label: 'Cliente', largura: 220, padrao: true, render: (r) => r.cliente_nome || 'Nenhum' },
  { chave: 'periodo', label: 'Período', largura: 180, padrao: true,
    render: (r) => `${fmtDataBR(r.data_inicio)} a ${fmtDataBR(r.data_fim)}` },
  { chave: 'dias_viagem', label: 'Dias', largura: 60, align: 'center', padrao: true, render: (r) => r.dias_viagem ?? '-' },
  { chave: 'status', label: 'Status', largura: 120, padrao: true,
    render: (r) => <span className={`badge ${(STATUS_META[r.status] || STATUS_META.rascunho).classe}`}>{(STATUS_META[r.status] || STATUS_META.rascunho).label}</span> },
  { chave: 'total_despesas', label: 'Total', largura: 110, align: 'right', padrao: true,
    render: (r) => <span style={{ fontWeight: 600 }}>{fmtMoeda(r.total_despesas)}</span> },
  { chave: 'qtd_itens', label: 'Itens', largura: 70, align: 'center', render: (r) => r.qtd_itens ?? 0 },
  { chave: 'qtd_comprovantes', label: 'Comprovantes', largura: 110, align: 'center', render: (r) => r.qtd_comprovantes ?? 0 },
  { chave: 'meio_transporte', label: 'Transporte', largura: 150, render: (r) => r.meio_transporte || '-' },
  { chave: 'veiculo_numero', label: 'Nº veículo', largura: 90, render: (r) => r.veiculo_numero || '-' },
  { chave: 'veiculo_placa', label: 'Placa', largura: 100, render: (r) => r.veiculo_placa || '-' },
  { chave: 'local_partida', label: 'Partida', largura: 160, render: (r) => r.local_partida || '-' },
  { chave: 'local_destino', label: 'Destino', largura: 160, render: (r) => r.local_destino || '-' },
  { chave: 'entidade_documento', label: 'CNPJ/CPF cliente', largura: 150, render: (r) => r.entidade_documento || '-' },
  { chave: 'entidade_email', label: 'E-mail cliente', largura: 200, render: (r) => r.entidade_email || '-' },
  { chave: 'entidade_cidade', label: 'Cidade cliente', largura: 150, render: (r) => r.entidade_cidade || '-' },
  { chave: 'entidade_uf', label: 'UF cliente', largura: 70, align: 'center', render: (r) => r.entidade_uf || '-' },
  { chave: 'observacoes', label: 'Observações', largura: 260, render: (r) => r.observacoes || '-' },
  { chave: 'criado_em', label: 'Criado em', largura: 140, render: (r) => fmtDataBR(r.criado_em) || '-' },
  { chave: 'alterado_em', label: 'Alterado em', largura: 140, render: (r) => fmtDataBR(r.alterado_em) || '-' },
]

export default function Viagens({ sessao, newTrigger }) {
  const [activeTab, setActiveTab] = useState('cadastro')

  // Lista completa (não filtrada) — sempre carregada no mount, é a fonte
  // de verdade pra navegação (« ‹ N/total › ») e pro form, igual
  // Arquivos.jsx. A aba Acesso NÃO usa isto — usa fResultados (abaixo),
  // uma consulta filtrada e independente que só roda ao clicar "Buscar".
  const [registros, setRegistros]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [currentIdx, setCurrentIdx] = useState(-1)

  const [mode, setMode]     = useState('view') // 'view' | 'new' | 'edit'
  const [form, setForm]     = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [erro, setErro]     = useState(null)
  const [confirmExcluir, setConfirmExcluir] = useState(false)
  const [showConsulta, setShowConsulta] = useState(false)

  // Filtros da aba Acesso — resultado fica em fResultados, null até buscar
  // (mesmo padrão de Arquivos.jsx), nunca mexe em `registros`.
  const [buscaGeral, setBuscaGeral]   = useState('')
  const [filtrosCol, setFiltrosCol]   = useState({})
  const [fResultados, setFResultados] = useState(null)
  const [fLoading, setFLoading]       = useState(false)
  // Tabela é o padrão (consulta completa com seletor de colunas, docs
  // CLAUDE.md §4); cards são a alternativa de leitura rápida.
  const [modoVisao, setModoVisao]     = useState('tabela') // 'tabela' | 'cards'
  const [pagina, setPagina]     = useState(1)
  const [porPagina, setPorPagina] = useState(25)
  const [pastaExportacoes, setPastaExportacoes] = useState('')
  const [pastaAnexos, setPastaAnexos] = useState('')
  // Selecao em massa na aba Acesso: ids marcados no checkbox "Sel" + menu
  // de contexto (botao direito) pra trocar o status de varios de uma vez.
  const [selecionados, setSelecionados] = useState(() => new Set())
  const [menuCtx, setMenuCtx] = useState(null) // { x, y, alvoId } | null

  // Composer de e-mail (botao "E-mail"): pre-carregado com planilha +
  // comprovantes das despesas relevantes. `emailIds` = quais despesas
  // terao o status trocado pra 'enviado' depois do envio.
  const [emailModal, setEmailModal] = useState(null) // { anexos, assunto, ids } | null
  const [emailContas, setEmailContas] = useState([])
  const [preparandoEmail, setPreparandoEmail] = useState(false)

  const carregarAcesso = useCallback(async (b = buscaGeral, fc = filtrosCol) => {
    setFLoading(true)
    try {
      const params = {}
      if (b && b.trim()) params.busca = b.trim()
      const limpo = Object.fromEntries(Object.entries(fc || {}).filter(([, v]) => v != null))
      if (Object.keys(limpo).length) params.filtros = limpo
      const res = await window.api.viagens.listar(params)
      setFResultados(res.ok ? res.data || [] : [])
      setSelecionados(new Set())
      setPagina(1)
    } catch { setFResultados([]) }
    finally { setFLoading(false) }
  }, [buscaGeral, filtrosCol])

  const setFiltroCol = (chave, f) => setFiltrosCol((prev) => ({ ...prev, [chave]: f }))

  // Ao abrir a tela, carrega a lista completa e mostra o último registro em
  // modo consulta (view) — mesmo padrão de Arquivos.jsx. Nunca entra em modo
  // "novo" sozinho, mesmo com a lista vazia (form fica vazio, mas em view).
  const carregarTudo = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.api.viagens.listar({})
      const lista = res.ok ? res.data || [] : []
      setRegistros(lista)
      if (lista.length) {
        const ultimo = lista.length - 1
        setCurrentIdx(ultimo)
        await carregarForm(lista[ultimo])
      }
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { carregarTudo() }, [carregarTudo])

  useEffect(() => {
    if (newTrigger) openNew()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTrigger])

  useEffect(() => {
    window.api.config.get().then(res => {
      const cam = res.ok ? res.data?.Caminhos : null
      setPastaExportacoes(cam?.exportacoesViagens || cam?.exportacoes || '')
      // Fallback visual: se a chave da tela esta vazia, mostra a generica
      // (que e o que sera usado de fato).
      setPastaAnexos(cam?.arquivosViagens || cam?.arquivos || '')
    })
  }, [])


  async function handleConfigurarPastaExportacoes() {
    const res = await window.api.config.selecionarPasta({ chave: 'exportacoesViagens', titulo: 'Selecionar pasta de exportações das despesas' })
    const nova = res.ok ? res.data : null
    if (nova) {
      setPastaExportacoes(nova)
      notificar.sucesso(`Pasta de exportações atualizada:\n${nova}\n\nAs exportações passam a ser salvas automaticamente aqui, organizadas por Cliente/Ano/Mês.`)
    }
  }

  async function handleConfigurarPastaAnexos() {
    const res = await window.api.config.selecionarPasta({ chave: 'arquivosViagens', titulo: 'Selecionar pasta de anexos das despesas' })
    const nova = res.ok ? res.data : null
    if (nova) {
      setPastaAnexos(nova)
      notificar.sucesso(`Pasta de anexos das despesas atualizada:\n${nova}`)
    }
  }

  const [exportandoTodos, setExportandoTodos] = useState(false)

  // Abre o e-mail ja com os anexos. `ids` = despesas a anexar (e cujo
  // status vai virar 'enviado' apos o envio).
  async function abrirEmailComAnexos(ids, assuntoBase) {
    if (!ids.length || preparandoEmail) return
    setPreparandoEmail(true)
    try {
      const [resContas, resAnexos] = await Promise.all([
        window.api.email.listarContas(),
        window.api.viagens.anexosParaEmail({ ids }),
      ])
      const contas = resContas.ok ? resContas.data || [] : []
      if (!contas.length) {
        notificar.aviso('Nenhuma conta de e-mail cadastrada. Cadastre uma na tela de E-mail.')
        return
      }
      const anexos = resAnexos.ok ? resAnexos.data?.anexos || [] : []
      if (!anexos.length) {
        notificar.aviso('Nenhuma planilha ou comprovante para anexar nas despesas selecionadas.')
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
    if (!ids.length) { notificar.aviso('Consulte as despesas antes de enviar por e-mail.'); return }
    abrirEmailComAnexos(ids, `Despesas de viagem (${ids.length})`)
  }

  function handleEmailCadastro() {
    if (!form.id) { notificar.aviso('Salve a despesa antes de enviar por e-mail.'); return }
    const ref = [form.consultor_nome, fmtDataBR?.(form.data_inicio)].filter(Boolean).join(' - ')
    abrirEmailComAnexos([form.id], `Despesa de viagem${ref ? ' - ' + ref : ''}`)
  }

  // Envio concluido -> troca status das despesas pra 'enviado' (so as que
  // ainda nao estavam), fecha o modal e recarrega.
  async function handleEmailEnviado() {
    const ids = emailModal?.ids || []
    setEmailModal(null)
    if (ids.length) {
      const res = await window.api.viagens.mudarStatusLote({ ids, status: 'enviado' })
      if (res.ok) notificar.sucesso(`E-mail enviado. ${res.data.atualizadas} despesa(s) marcada(s) como Enviado.`)
    }
    await carregarTudo()
    if (fResultados) await carregarAcesso()
  }

  async function handleExportarTodos() {
    if (!(fResultados?.length) || exportandoTodos) return
    setExportandoTodos(true)
    try {
      const res = await window.api.viagens.exportarExcelLote(fResultados.map(r => r.id))
      if (!res?.ok) {
        if (!res?.cancelado) notificar.erro(res?.erro || 'Falha ao exportar.')
        return
      }
      if (res.falhas?.length) {
        notificar.aviso(`${res.sucesso} de ${res.total} exportadas. Falharam: ${res.falhas.join(', ')}`)
      } else {
        notificar.sucesso(`${res.sucesso} despesa${res.sucesso === 1 ? '' : 's'} exportada${res.sucesso === 1 ? '' : 's'} com sucesso.`)
      }
    } finally {
      setExportandoTodos(false)
    }
  }

  function limparFiltros() {
    setFiltrosCol({})
    setBuscaGeral('')
  }

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
    if (!ids.length) { notificar.aviso('Marque ao menos uma despesa (coluna Sel) ou clique com o botao direito sobre uma linha.'); return }
    const res = await window.api.viagens.mudarStatusLote({ ids, status })
    if (res.ok) {
      notificar.sucesso(`${res.data.atualizadas} despesa(s) para "${STATUS_META[status].label}".`)
      setSelecionados(new Set())
      await carregarAcesso()
      await carregarTudo()
    } else {
      notificar.erro(res.erro || 'Falha ao alterar status.')
    }
  }

  async function carregarForm(reg) {
    const res = await window.api.viagens.obter(reg.id)
    if (!res.ok) { setErro(res.erro); return }
    const d = res.data
    setForm({
      id: d.id, codigo: d.codigo || '', status: d.status,
      consultor_id: d.consultor_id, consultor_nome: d.consultor_nome,
      cliente_id: d.cliente_id ? String(d.cliente_id) : '', cliente_nome: d.cliente_nome || '',
      data_inicio: String(d.data_inicio).slice(0, 10), data_fim: String(d.data_fim).slice(0, 10),
      local_partida: d.local_partida || '', local_destino: d.local_destino || '',
      meio_transporte: d.meio_transporte || '',
      veiculo_numero: d.veiculo_numero || '', veiculo_placa: d.veiculo_placa || '',
      observacoes: d.observacoes || '',
      itens: (d.itens || []).map(it => ({
        _key: String(it.id), data: String(it.data).slice(0, 10), descricao: it.descricao || '',
        fornecedor: it.fornecedor || '', qtde: it.qtde, valor_unitario: it.valor_unitario,
        arquivo_path: it.arquivo_path, arquivo_nome: it.arquivo_nome, arquivo_ext: it.arquivo_ext,
      })),
    })
    setErro(null)
    setMode('view')
  }

  // Chamada a partir da tabela filtrada da aba Acesso — acha o índice do
  // registro na lista COMPLETA (registros), não na paginação filtrada.
  function selecionarLinha(registroFiltrado) {
    const idx = registros.findIndex(r => r.id === registroFiltrado.id)
    if (idx < 0) return
    setCurrentIdx(idx)
    carregarForm(registros[idx])
    setActiveTab('cadastro')
  }

  function navTo(idx) {
    if (idx < 0 || idx >= registros.length) return
    setCurrentIdx(idx)
    carregarForm(registros[idx])
  }

  // Preview otimista do próximo código — mesmo padrão de Arquivos.jsx: só
  // feedback visual imediato, o valor real vem do backend via nextval() no
  // insert (viagens:criar).
  function previewNextCodigo() {
    const max = registros.reduce((m, r) => Math.max(m, parseInt(r.codigo || '0', 10)), 0)
    return String(max + 1).padStart(4, '0')
  }

  function openNew() {
    setForm({
      ...EMPTY_FORM,
      codigo: previewNextCodigo(),
      consultor_id: sessao?.registro?.id ?? sessao?.id ?? null,
      consultor_nome: sessao?.registro?.nome ?? sessao?.nome ?? '',
      itens: [novoItem()],
    })
    setErro(null)
    setMode('new')
    setActiveTab('cadastro')
  }

  // Modal Pesquisa Padrão — mesmo padrão de Arquivos.jsx: botão "Consultar"
  // do FormToolbar abre busca rápida sobre a lista completa, em vez de só
  // trocar para a aba Acesso.
  function selecionarDaConsulta(item) {
    const idx = registros.findIndex(r => r.id === item.id)
    if (idx >= 0) { setCurrentIdx(idx); carregarForm(item); setActiveTab('cadastro') }
    setShowConsulta(false)
  }
  function abrirConsulta() {
    setShowConsulta(true)
  }

  function handleDesistir() {
    if (currentIdx >= 0 && registros[currentIdx]) carregarForm(registros[currentIdx])
    else setForm(EMPTY_FORM)
    setMode('view')
  }

  async function handleGravar() {
    if (!form.data_inicio || !form.data_fim) { setErro('Informe o período da viagem.'); return }
    setSaving(true)
    setErro(null)
    try {
      const payload = {
        ...form,
        cliente_id: form.cliente_id || null,
        itens: (form.itens || []).filter(it => it.data),
      }
      const res = mode === 'new'
        ? await window.api.viagens.criar(payload)
        : await window.api.viagens.atualizar({ id: form.id, ...payload })
      if (!res.ok) { setErro(res.erro); return }
      setMode('view')
      const resLista = await window.api.viagens.listar({})
      const lista = resLista.ok ? resLista.data || [] : []
      setRegistros(lista)
      const idx = lista.findIndex(r => r.id === res.data.id)
      if (idx >= 0) setCurrentIdx(idx)
      if (mode === 'new') await carregarForm(res.data)
    } finally { setSaving(false) }
  }

  async function confirmarExclusao() {
    setConfirmExcluir(false)
    const res = await window.api.viagens.excluir(form.id)
    if (!res.ok) { setErro(res.erro); return }
    const resLista = await window.api.viagens.listar({})
    const lista = resLista.ok ? resLista.data || [] : []
    setRegistros(lista)
    if (lista.length) {
      const ni = Math.min(currentIdx, lista.length - 1)
      setCurrentIdx(ni)
      await carregarForm(lista[ni])
    } else {
      setForm(EMPTY_FORM)
      setCurrentIdx(-1)
      setMode('view')
    }
  }

  async function handleMudarStatus(status) {
    if (!form.id) return
    const res = await window.api.viagens.mudarStatus({ id: form.id, status })
    if (res.ok) { setForm(f => ({ ...f, status })); await carregar() }
  }

  async function handleExportar() {
    if (!form.id) return
    const res = await window.api.viagens.exportarExcel(form.id)
    if (!res?.ok && !res?.cancelado) { setErro(res?.erro || 'Falha ao exportar.'); return }
    if (res?.ok && res?.path) notificar.sucesso(`Exportado com sucesso:\n${res.path}`)
  }

  // ── Itens (grid editável) ──────────────────────────────────────────────
  function setItem(key, patch) {
    setForm(prev => ({ ...prev, itens: prev.itens.map(it => it._key === key ? { ...it, ...patch } : it) }))
  }
  function addItem() {
    setForm(prev => ({ ...prev, itens: [...prev.itens, novoItem()] }))
  }
  function removerItem(key) {
    setForm(prev => ({ ...prev, itens: prev.itens.filter(it => it._key !== key) }))
  }
  async function anexarComprovante(key) {
    const res = await window.api.arquivos.selecionarECopiar({ subpasta: 'viagens', chaveCaminho: 'arquivosViagens' })
    if (!res?.ok) return
    setItem(key, { arquivo_path: res.path, arquivo_nome: res.nome, arquivo_ext: res.ext })
  }
  function abrirComprovante(path) {
    if (path) window.api.arquivos.abrir(path)
  }
  function removerComprovante(key) {
    setItem(key, { arquivo_path: null, arquivo_nome: null, arquivo_ext: null })
  }

  const totalItens = (form.itens || []).reduce((s, it) => s + (Number(it.qtde) || 0) * (Number(it.valor_unitario) || 0), 0)
  const isRO = mode === 'view'

  // ── Buscas para os SeletorBusca (lupa) ──────────────────────────────────
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
  async function buscarConsultores(campo, modo, busca) {
    const res = await window.api.viagens.listarConsultores()
    let lista = res.ok ? res.data : []
    if (busca) {
      const b = busca.toLowerCase()
      lista = lista.filter(c => modo === 'igual' ? c.nome.toLowerCase() === b
        : modo === 'iniciando' ? c.nome.toLowerCase().startsWith(b)
        : c.nome.toLowerCase().includes(b))
    }
    return { registros: lista, total: lista.length }
  }

  return (
    <div className="page-with-footer">
      <div className="page-tabs">
        <button className={`page-tab${activeTab === 'acesso' ? ' active' : ''}`} onClick={() => setActiveTab('acesso')}>Acesso</button>
        <button className={`page-tab${activeTab === 'cadastro' ? ' active' : ''}`} onClick={() => setActiveTab('cadastro')}>Cadastro</button>
        {form.id && <span className="page-tab-info">{form.codigo || '----'} · {form.cliente_nome || form.consultor_nome}</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          {activeTab === 'acesso' && (
            <>
              <button className="btn btn-ghost" onClick={handleExportarTodos} disabled={!(fResultados?.length) || exportandoTodos}
                title={fResultados?.length ? `Exportar as ${fResultados.length} despesas do filtro atual` : 'Nenhum registro para exportar'}
                style={{ height: 28, fontSize: 11, padding: '0 10px' }}>
                <FileDown size={12} />
                {exportandoTodos ? 'Exportando...' : `Exportar Todos${fResultados?.length ? ` (${fResultados.length})` : ''}`}
              </button>
              <button className="btn btn-ghost" onClick={handleEmailAcesso} disabled={!(fResultados?.length) || preparandoEmail}
                title={fResultados?.length ? `Enviar por e-mail as ${fResultados.length} despesas consultadas (planilha + comprovantes)` : 'Consulte despesas primeiro'}
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
          <button className="btn btn-ghost" onClick={handleConfigurarPastaAnexos}
            title={pastaAnexos ? `Pasta de anexos das despesas: ${pastaAnexos}` : 'Anexos das despesas usam a pasta padrão de arquivos'}
            style={{ height: 28, fontSize: 11, padding: '0 10px' }}>
            <Paperclip size={12} />
            {pastaAnexos
              ? <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{pastaAnexos}</span>
              : 'Pasta de Anexos'}
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
            <PainelFiltrosGrid
              colunas={COLUNAS_FILTRO}
              valores={filtrosCol}
              onChange={setFiltroCol}
              onBuscar={() => carregarAcesso()}
              onLimpar={limparFiltros}
              fLoading={fLoading}
              busca={buscaGeral}
              onBusca={setBuscaGeral}
            />

            {fResultados !== null && !fLoading && fResultados.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11.5, color: 'var(--t3)', flex: 1 }}>
                  {totalFiltrado} despesa{totalFiltrado !== 1 ? 's' : ''}
                </span>
                <div style={{ display: 'flex', border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden' }}>
                  <button type="button"
                    className={`btn ${modoVisao === 'tabela' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ height: 28, fontSize: 11, padding: '0 10px', borderRadius: 0 }}
                    onClick={() => setModoVisao('tabela')}>
                    <TableIcon size={12} /> Tabela
                  </button>
                  <button type="button"
                    className={`btn ${modoVisao === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ height: 28, fontSize: 11, padding: '0 10px', borderRadius: 0 }}
                    onClick={() => setModoVisao('cards')}>
                    <LayoutGrid size={12} /> Cards
                  </button>
                </div>
              </div>
            )}

            {fResultados === null ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)', border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)' }}>
                <div style={{ fontSize: 13 }}>Configure os filtros (opcional) e clique em Buscar</div>
              </div>
            ) : modoVisao === 'tabela' ? (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 8 }}>
                <TabelaResultados
                  colunas={COLUNAS_RESULTADO}
                  registros={registrosPagina}
                  prefKey="viagens-acesso"
                  selecao={{
                    has: (id) => selecionados.has(id),
                    toggle: toggleSelecionado,
                    todos: todosSelecionados,
                    toggleTodos: toggleSelecionarTodos,
                  }}
                  onLinhaDuploClique={selecionarLinha}
                  onLinhaMenu={abrirMenuLinha}
                  vazio={fLoading ? 'Buscando...' : 'Nenhum registro encontrado'}
                />
                {selecionados.size > 0 && (
                  <div style={{ padding: '6px 14px', border: '1px solid var(--bd)', borderRadius: 8, background: 'var(--s1)', fontSize: 11.5, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{selecionados.size} selecionada{selecionados.size !== 1 ? 's' : ''}. Clique com o botao direito na lista para alterar o status.</span>
                    <button className="btn btn-ghost" style={{ height: 22, fontSize: 10.5, padding: '0 8px' }} onClick={() => setSelecionados(new Set())}>Limpar selecao</button>
                  </div>
                )}
                <PaginacaoBar pagina={pagina} totalPaginas={totalPaginas} total={totalFiltrado} porPagina={porPagina}
                  onPagina={p => setPagina(p)} onPorPagina={n => { setPorPagina(n); setPagina(1) }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 }}>
                  {registrosPagina.map((r) => {
                    const meta = STATUS_META[r.status] || STATUS_META.rascunho
                    return (
                      <div key={r.id} onDoubleClick={() => selecionarLinha(r)}
                        onContextMenu={(e) => abrirMenuLinha(e, r.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          background: 'var(--s1)', border: '1.5px solid var(--bd)', borderRadius: 12,
                          padding: '12px 16px', boxShadow: 'var(--sh-xs)', cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--bd2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--bd)')}>
                        <div style={{ width: 44, textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: 'var(--or)', flexShrink: 0 }}>{r.codigo}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {r.consultor_nome}
                            </span>
                            <span className={`badge ${meta.classe}`}>{meta.label}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--t3)', flexWrap: 'wrap' }}>
                            <span>{r.cliente_nome || 'Nenhum'}</span>
                            <span>{fmtDataBR(r.data_inicio)} a {fmtDataBR(r.data_fim)}</span>
                            {r.meio_transporte && <span>{r.meio_transporte}</span>}
                            <span>{r.qtd_itens ?? 0} ite{(r.qtd_itens ?? 0) === 1 ? 'm' : 'ns'}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5 }}>Total</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{fmtMoeda(r.total_despesas)}</div>
                        </div>
                      </div>
                    )
                  })}
                  {!fLoading && registrosPagina.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 32, color: 'var(--t3)', fontSize: 11, fontStyle: 'italic' }}>
                      Nenhum registro encontrado
                    </div>
                  )}
                </div>
                <PaginacaoBar pagina={pagina} totalPaginas={totalPaginas} total={totalFiltrado} porPagina={porPagina}
                  onPagina={p => setPagina(p)} onPorPagina={n => { setPorPagina(n); setPagina(1) }} />
              </div>
            )}

            <MenuContextoGrid
              pos={menuCtx}
              onFechar={() => setMenuCtx(null)}
              titulo={`Alterar status de ${idsAlvoMenu().length} despesa${idsAlvoMenu().length !== 1 ? 's' : ''}`}
              itens={STATUS_ORDEM.map(s => ({ label: STATUS_META[s].label, onClick: () => alterarStatusEmMassa(s) }))}
            />
          </>
        )}

        {activeTab === 'cadastro' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {form.status && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge ${STATUS_META[form.status].classe}`}>{STATUS_META[form.status].label}</span>
                {isRO && form.id && STATUS_ORDEM.map(s => s !== form.status && (
                  <button key={s} className="btn btn-ghost" style={{ height: 26, fontSize: 10.5 }}
                    onClick={() => handleMudarStatus(s)}>
                    {STATUS_META[s].label}
                  </button>
                ))}
              </div>
            )}

            <div><SecaoHeader titulo="Identificação" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 10 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Código</label>
                <div className="form-input" style={{ width: 80, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', color: form.codigo ? 'var(--or)' : 'var(--t3)', fontFamily: 'monospace' }}>
                  {form.codigo || ''}
                </div>
              </div>
              <SeletorEntidade
                label="Cliente"
                placeholder="Nenhum"
                papel="cliente"
                value={form.cliente_nome}
                disabled={isRO}
                onClear={() => setForm(f => ({ ...f, cliente_id: '', cliente_nome: '' }))}
                onSelect={r => setForm(f => ({ ...f, cliente_id: String(r.id), cliente_nome: r.nome }))}
              />
              <SeletorBusca
                label="Consultor"
                placeholder="Nenhum"
                valorExibido={form.consultor_nome}
                disabled={isRO}
                titulo="Pesquisa Padrão · consultores"
                campos={CAMPOS_CONSULTOR}
                colunasExibidas={CAMPOS_CONSULTOR}
                campoInicial="nome"
                onBuscar={buscarConsultores}
                onSelecionar={r => setForm(f => ({ ...f, consultor_id: r.id, consultor_nome: r.nome }))}
              />
            </div>

            <div><SecaoHeader titulo="Trajeto e período" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Período de *</label>
                <InputData value={form.data_inicio} disabled={isRO}
                  onChange={v => setForm(f => ({ ...f, data_inicio: v }))}
                  onRange={(ini, fim) => setForm(f => ({ ...f, data_inicio: ini, data_fim: fim }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Período até *</label>
                <InputData value={form.data_fim} disabled={isRO}
                  onChange={v => setForm(f => ({ ...f, data_fim: v }))}
                  onRange={(ini, fim) => setForm(f => ({ ...f, data_inicio: ini, data_fim: fim }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Meio de Transporte</label>
                <select className="form-select" value={form.meio_transporte} disabled={isRO}
                  onChange={e => setForm(f => ({ ...f, meio_transporte: e.target.value }))}>
                  <option value="">Selecione</option>
                  {MEIOS_TRANSPORTE.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {form.meio_transporte === 'Carro da empresa' && (
              <div style={{ display: 'grid', gridTemplateColumns: '180px 180px', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Nº do carro</label>
                  <input className="form-input" value={form.veiculo_numero} disabled={isRO}
                    onChange={e => setForm(f => ({ ...f, veiculo_numero: e.target.value }))} placeholder="Ex: 07" />
                </div>
                <div className="form-group">
                  <label className="form-label">Placa</label>
                  <input className="form-input" value={form.veiculo_placa} disabled={isRO}
                    onChange={e => setForm(f => ({ ...f, veiculo_placa: e.target.value.toUpperCase() }))} placeholder="ABC1D23" maxLength={8} />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Local de Partida</label>
                <InputCidade value={form.local_partida} disabled={isRO}
                  onChange={v => setForm(f => ({ ...f, local_partida: v }))} placeholder="Ex: Gaspar - SC" />
              </div>
              <div className="form-group">
                <label className="form-label">Local de Destino</label>
                <InputCidade value={form.local_destino} disabled={isRO}
                  onChange={v => setForm(f => ({ ...f, local_destino: v }))} placeholder="Ex: Criciúma - SC" />
              </div>
            </div>

            {/* Grid de despesas: sem equivalente pronto no padrão (sub_grid nativo não suporta anexo por linha) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px' }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap' }}>Despesas</span>
                <span style={{ flex: 1, height: 1, background: 'var(--bd2)' }} />
                {!isRO && (
                  <button className="btn btn-ghost" style={{ height: 26, fontSize: 11, flexShrink: 0 }} onClick={addItem}>
                    <Plus size={13} /> Adicionar linha
                  </button>
                )}
              </div>
              <div style={{ border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden', background: 'var(--s1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--s1)' }}>
                      <Th style={{ width: 130 }}>Data</Th><Th style={{ width: 90 }}>Dia</Th><Th>Descrição</Th><Th>Fornecedor</Th>
                      <Th style={{ width: 70, textAlign: 'right' }}>Qtde</Th><Th style={{ width: 100, textAlign: 'right' }}>Vl. Unit.</Th>
                      <Th style={{ width: 90, textAlign: 'right' }}>Valor</Th><Th style={{ width: 96 }}></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.itens || []).length === 0 && (
                      <tr><td colSpan={8} style={{ padding: 16, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>Nenhuma despesa lançada.</td></tr>
                    )}
                    {(form.itens || []).map(it => {
                      const valor = (Number(it.qtde) || 0) * (Number(it.valor_unitario) || 0)
                      return (
                        <tr key={it._key} style={{ borderTop: '1px solid var(--bd)' }}>
                          <Td><InputData className={`form-input${isRO ? ' cell-date-ro' : ''}`} style={cellInputStyle(isRO)} value={it.data} disabled={isRO}
                            onChange={v => setItem(it._key, { data: v })} /></Td>
                          <Td><span style={{ color: 'var(--t3)', fontSize: 11, whiteSpace: 'nowrap' }}>{diaDaSemana(it.data)}</span></Td>
                          <Td><input style={cellInputStyle(isRO)} value={it.descricao} disabled={isRO}
                            onChange={e => setItem(it._key, { descricao: e.target.value })} placeholder="Ex: Refeição" /></Td>
                          <Td><input style={cellInputStyle(isRO)} value={it.fornecedor} disabled={isRO}
                            onChange={e => setItem(it._key, { fornecedor: e.target.value })} /></Td>
                          <Td style={{ padding: '9px 4px' }}><input type="number" step="1" min="0" style={{ ...cellInputStyle(isRO), textAlign: 'right' }} value={it.qtde} disabled={isRO}
                            onChange={e => setItem(it._key, { qtde: e.target.value })} /></Td>
                          <Td style={{ padding: '9px 4px' }}><input type="number" step="0.01" min="0" style={{ ...cellInputStyle(isRO), textAlign: 'right' }} value={it.valor_unitario} disabled={isRO}
                            onChange={e => setItem(it._key, { valor_unitario: e.target.value })} /></Td>
                          <Td style={{ textAlign: 'right' }}><span style={{ fontWeight: 600 }}>{fmtMoeda(valor)}</span></Td>
                          <Td>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                              {it.arquivo_path ? (
                                <>
                                  <button title={it.arquivo_nome} style={iconBtnSmStyle(isRO)} onClick={() => abrirComprovante(it.arquivo_path)}>
                                    <FileDown size={13} color="var(--or)" />
                                  </button>
                                  {!isRO && (
                                    <button title="Remover comprovante" style={iconBtnSmStyle(isRO)} onClick={() => removerComprovante(it._key)}>
                                      <FileX size={13} color="var(--red)" />
                                    </button>
                                  )}
                                </>
                              ) : !isRO && (
                                <button title="Anexar comprovante" style={iconBtnSmStyle(isRO)} onClick={() => anexarComprovante(it._key)}>
                                  <FileDown size={13} />
                                </button>
                              )}
                              {!isRO && (
                                <button title="Remover linha" style={iconBtnSmStyle(isRO)} onClick={() => removerItem(it._key)}>
                                  <Trash2 size={13} color="var(--red)" />
                                </button>
                              )}
                            </div>
                          </Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, padding: '10px 14px', background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5 }}>Total das Despesas</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>{fmtMoeda(totalItens)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5 }}>Valor a Reembolsar</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--or)' }}>{fmtMoeda(totalItens)}</div>
              </div>
            </div>

            <div><SecaoHeader titulo="Complemento" /></div>
            <div className="form-group">
              <label className="form-label">Observações</label>
              <textarea className="form-input" rows={2} value={form.observacoes} disabled={isRO}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
            </div>
          </div>
        )}
      </div>

      {activeTab === 'cadastro' && (
        <FormToolbar
          mode={mode}
          nav={{ currentIdx, total: registros.length, onNav: navTo }}
          temRegistros={registros.length > 0}
          saving={saving}
          onIncluir={openNew}
          onAlterar={() => setMode('edit')}
          onExcluir={() => setConfirmExcluir(true)}
          onConsultar={abrirConsulta}
          onExportar={mode === 'view' && form.id ? handleExportar : undefined}
          onGravar={handleGravar}
          onDesistir={handleDesistir}
          acoesExtras={mode === 'view' && form.id ? (
            <button className="btn btn-ghost" onClick={handleEmailCadastro} disabled={preparandoEmail}
              title="Enviar esta despesa por e-mail (planilha + comprovantes) e marcar como Enviado">
              <Mail size={13} /> {preparandoEmail ? 'Preparando...' : 'E-mail'}
            </button>
          ) : undefined}
        />
      )}

      {/* Modal Pesquisa Padrão */}
      {showConsulta && (
        <PesquisaPadraoModal
          titulo="Pesquisa Padrão · despesa_001"
          campos={CAMPOS_BUSCA_DESPESA}
          colunasExibidas={CAMPOS_BUSCA_DESPESA}
          campoInicial="codigo"
          onBuscar={async (campo, modo, busca) => {
            const res = await window.api.viagens.listar({ busca })
            if (!res.ok) throw new Error(res.erro)
            return { registros: res.data, total: res.data.length }
          }}
          onSelecionar={selecionarDaConsulta}
          onFechar={() => setShowConsulta(false)}
          renderCelula={(r, c) => {
            if (c.nome_campo === 'status') return <span className={`badge ${STATUS_META[r.status]?.classe}`}>{STATUS_META[r.status]?.label}</span>
            return String(r[c.nome_campo] ?? '')
          }}
        />
      )}

      {confirmExcluir && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}>
          <div style={{ width: 380, background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px 10px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)' }}>Excluir despesa de viagem</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 6 }}>Esta ação não pode ser desfeita.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '14px 22px 20px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmExcluir(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmarExclusao}>Excluir</button>
            </div>
          </div>
        </div>
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
    </div>
  )
}

function Th({ children, style }) {
  return <th style={{ padding: '7px 12px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1.2, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)', background: 'var(--s1)', textAlign: 'left', ...style }}>{children}</th>
}
function Td({ children, style }) {
  return <td style={{ padding: '9px 12px', color: 'var(--t2)', borderBottom: '1px solid var(--bd)', fontSize: 12.5, ...style }}>{children}</td>
}

// Fundo/borda só aparecem em modo edição (Incluir/Alterar) — em modo
// consulta a grade fica "limpa", só texto, sem parecer editável.
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
