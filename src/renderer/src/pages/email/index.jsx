import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Plus, RefreshCw, ChevronLeft, ChevronDown, ChevronRight, ChevronUp, Tag, Settings, Archive, Trash2, Inbox, Send, AlertOctagon, Mails, Star, FileEdit, Loader2 } from 'lucide-react'
import '../../App.css'
import './Email.css'
import ListaMensagens from './ListaMensagens'
import LeitorMensagem from './LeitorMensagem'
import ComposerModal from './ComposerModal'
import ContaFormModal from './ContaFormModal'
import EtiquetaFormModal from './EtiquetaFormModal'
import BuscaAvancadaModal from './BuscaAvancadaModal'
import { notificar } from '../../components/Notificacao'
import useAtalhosTeclado from '../../hooks/useAtalhosTeclado'
import { STATUS_SYNC_META, iniciais, achatarEtiquetasEmArvore, corAvatar } from './utils'

// Ícone por special_use — mesmo padrão visual de identificação rápida do
// Gmail/Outlook (inbox, envelope de envio, arquivo, lixeira, alerta).
const ICONE_POR_SPECIAL_USE = {
  '\\Sent': Send,
  '\\Archive': Archive,
  '\\Trash': Trash2,
  '\\Junk': AlertOctagon,
}

// Grupos de provedor na barra lateral, em ordem fixa de exibição. A conta
// pode ter `provedor` fora dessa lista (dado antigo) — cai em "Outros".
const GRUPOS_PROVEDOR = [
  { id: 'gmail',         rotulo: 'Gmail' },
  { id: 'outlook',       rotulo: 'Outlook / Microsoft 365' },
  { id: 'imap_generico', rotulo: 'IMAP genérico' },
]
const ROTULO_GRUPO_OUTROS = 'Outros'

// Agrupa as contas (ja vem ordenadas por provedor, ordem, nome do backend)
// em [{ id, rotulo, contas: [...] }], mantendo a ordem fixa dos grupos
// conhecidos e jogando provedores desconhecidos num grupo "Outros" no fim.
// Grupos vazios sao omitidos.
function agruparContasPorProvedor(contas) {
  const grupos = []
  for (const g of GRUPOS_PROVEDOR) {
    const doGrupo = contas.filter(c => c.provedor === g.id)
    if (doGrupo.length) grupos.push({ id: g.id, rotulo: g.rotulo, contas: doGrupo })
  }
  const conhecidos = new Set(GRUPOS_PROVEDOR.map(g => g.id))
  const outros = contas.filter(c => !conhecidos.has(c.provedor))
  if (outros.length) grupos.push({ id: '__outros__', rotulo: ROTULO_GRUPO_OUTROS, contas: outros })
  return grupos
}

// Tela de caixa de entrada — decisão explícita: não usa o esqueleto
// Acesso/Cadastro + FormToolbar (ver plano de implementação, seção 4).
// Não existe "Incluir/Alterar/Excluir/Gravar/Desistir" um e-mail recebido;
// a ação análoga a "Incluir" é Compor, tratada como ação assíncrona
// própria, não uma gravação de formulário.
export default function Email({ newTrigger }) {
  const [contas, setContas] = useState([])
  const contasPorId = useMemo(() => Object.fromEntries(contas.map(c => [c.id, c])), [contas])
  const [contaAtivaId, setContaAtivaId] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [totalMensagens, setTotalMensagens] = useState(0)
  const [mensagemAtivaId, setMensagemAtivaId] = useState(null)
  const [mensagemAtiva, setMensagemAtiva] = useState(null)
  // Token de recarga: incrementa a cada carregarMensagens. selecionarMensagem
  // guarda o valor no inicio e desiste de aplicar o resultado se outra
  // recarga (ou clique) aconteceu no meio — corrige a corrida que abria a
  // mensagem errada ao clicar rapido durante um recarregamento da lista.
  const recargaToken = useRef(0)
  const [busca, setBusca] = useState('')
  const [apenasNaoLidas, setApenasNaoLidas] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(25)
  const [loadingLista, setLoadingLista] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)

  const [composerAberto, setComposerAberto] = useState(false)
  const [composerModo, setComposerModo] = useState('novo') // novo | responder | encaminhar
  const [rascunhoEditando, setRascunhoEditando] = useState(null) // registro completo do rascunho, quando reabrindo um existente
  const [contaFormAberta, setContaFormAberta] = useState(false)
  const [contaEditando, setContaEditando] = useState(null)
  const [contasRecolhidas, setContasRecolhidas] = useState(false)
  const [listaRecolhida, setListaRecolhida] = useState(false)

  // Seleção em massa — Set de IDs, independente de mensagemAtivaId (que
  // controla o leitor). ultimoClicadoId é a âncora do shift-click.
  const [selecionados, setSelecionados] = useState(new Set())
  const [ultimoClicadoId, setUltimoClicadoId] = useState(null)
  const [processandoLote, setProcessandoLote] = useState(false)

  // Agrupar por conversa — preferência de UI (não dado), persistida por
  // dispositivo. Alternável porque muda a semântica da paginação (25
  // conversas ≠ 25 mensagens), então o padrão preserva o comportamento atual.
  const [agrupado, setAgrupado] = useState(() => localStorage.getItem('kt-email-agrupado') !== '0')
  const [threadsExpandidas, setThreadsExpandidas] = useState({}) // { [grupo]: mensagem[] }
  useEffect(() => { localStorage.setItem('kt-email-agrupado', agrupado ? '1' : '0') }, [agrupado])

  // Etiquetas internas do KronTech (independentes de pasta/servidor).
  const [etiquetas, setEtiquetas] = useState([])
  const [etiquetaAtivaId, setEtiquetaAtivaId] = useState(null)
  const [etiquetasPorMensagem, setEtiquetasPorMensagem] = useState({}) // { [mensagemId]: [{id,nome,cor}] }
  const [etiquetaFormAberta, setEtiquetaFormAberta] = useState(null) // { mensagemId } quando é popover de aplicar; true quando é o gerenciador
  const [etiquetaAlvoDrop, setEtiquetaAlvoDrop] = useState(null) // id da etiqueta sob o cursor durante drag de e-mail
  // Seção "Etiquetas" da navegação lateral recolhível (a lista inteira, como
  // pastas de arquivo) + cada pasta individualmente recolhível (não mostra
  // as subetiquetas por padrão) — evita que uma árvore grande empurre o
  // resto do menu lateral pra baixo.
  const [secaoContasRecolhida, setSecaoContasRecolhida] = useState(() => localStorage.getItem('kt-email-secao-contas-recolhida') === '1')
  useEffect(() => { localStorage.setItem('kt-email-secao-contas-recolhida', secaoContasRecolhida ? '1' : '0') }, [secaoContasRecolhida])

  const [secaoEtiquetasRecolhida, setSecaoEtiquetasRecolhida] = useState(() => localStorage.getItem('kt-email-secao-etiquetas-recolhida') === '1')
  const [etiquetasRecolhidas, setEtiquetasRecolhidas] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('kt-email-etiquetas-recolhidas') || '[]')) } catch { return new Set() }
  })
  useEffect(() => { localStorage.setItem('kt-email-secao-etiquetas-recolhida', secaoEtiquetasRecolhida ? '1' : '0') }, [secaoEtiquetasRecolhida])
  useEffect(() => { localStorage.setItem('kt-email-etiquetas-recolhidas', JSON.stringify([...etiquetasRecolhidas])) }, [etiquetasRecolhidas])

  function toggleEtiquetaRecolhida(id) {
    setEtiquetasRecolhidas(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const carregarEtiquetas = useCallback(async () => {
    const res = await window.api.email.listarEtiquetas()
    setEtiquetas(res.ok ? res.data || [] : [])
  }, [])
  useEffect(() => { carregarEtiquetas() }, [carregarEtiquetas])

  // Pastas reais do servidor IMAP (Caixa de entrada, Enviados, Arquivo,
  // Lixeira, Spam) — descobertas no sync via SPECIAL-USE, uma sublista por
  // conta, não uma coluna própria (mantém a hierarquia visual natural
  // conta → pasta e evita mais um nível de recolhimento na tela).
  const [pastasPorConta, setPastasPorConta] = useState({}) // { [contaId]: pasta[] }
  const [pastaAtivaId, setPastaAtivaId] = useState(null)
  // Sempre começa recolhido — não persiste entre sessões (ao contrário das
  // outras preferências de UI da tela), pra tela abrir enxuta toda vez.
  const [contasExpandidas, setContasExpandidas] = useState(() => new Set())

  // Grupos de provedor recolhidos na barra lateral. Persiste por
  // dispositivo — abrir a tela mantem o que o usuario deixou. Set de ids
  // de grupo ('gmail', 'outlook', ...).
  const [gruposRecolhidos, setGruposRecolhidos] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('email-grupos-provedor-recolhidos') || '[]')) }
    catch { return new Set() }
  })
  const toggleGrupoRecolhido = (grupoId) => {
    setGruposRecolhidos(prev => {
      const next = new Set(prev)
      if (next.has(grupoId)) next.delete(grupoId); else next.add(grupoId)
      try { localStorage.setItem('email-grupos-provedor-recolhidos', JSON.stringify([...next])) } catch { /* ignora */ }
      return next
    })
  }

  const gruposDeContas = useMemo(() => agruparContasPorProvedor(contas), [contas])

  // Move uma conta uma posicao pra cima/baixo DENTRO do seu grupo de
  // provedor e persiste a nova ordem (otimista: atualiza a UI na hora,
  // grava em segundo plano). direcao: -1 (sobe) | +1 (desce).
  const moverConta = useCallback(async (contaId, direcao) => {
    const conta = contas.find(c => c.id === contaId)
    if (!conta) return
    const irmas = contas.filter(c => c.provedor === conta.provedor)
    const idx = irmas.findIndex(c => c.id === contaId)
    const alvo = idx + direcao
    if (alvo < 0 || alvo >= irmas.length) return
    const novaOrdemIrmas = [...irmas]
    ;[novaOrdemIrmas[idx], novaOrdemIrmas[alvo]] = [novaOrdemIrmas[alvo], novaOrdemIrmas[idx]]
    // Reconstroi a lista completa preservando a posicao relativa dos
    // outros grupos (a lista vem agrupada por provedor do backend).
    const idsNovaOrdem = novaOrdemIrmas.map(c => c.id)
    let ptr = 0
    const listaNova = contas.map(c =>
      c.provedor === conta.provedor ? novaOrdemIrmas[ptr++] : c
    )
    setContas(listaNova)
    const res = await window.api.email.reordenarContas(idsNovaOrdem)
    if (!res.ok) {
      notificar.erro('Não foi possível salvar a nova ordem.')
      const recarregar = await window.api.email.listarContas()
      if (recarregar.ok) setContas(recarregar.data || [])
    }
  }, [contas])

  const [processandoPasta, setProcessandoPasta] = useState(false)

  // Sinalização (⭐) e busca avançada (remetente/período/anexo).
  const [apenasSinalizadas, setApenasSinalizadas] = useState(false)
  const [buscaAvancadaAberta, setBuscaAvancadaAberta] = useState(false)
  const [filtrosAvancados, setFiltrosAvancados] = useState({}) // { remetente, dataInicio, dataFim, comAnexo }

  // Rascunhos — pasta virtual client-side (não vem de email_pasta_001,
  // que só cataloga pastas reais do servidor). '__rascunhos__' é um
  // pseudo-pastaAtivaId reconhecido só no frontend.
  const RASCUNHOS_ID = '__rascunhos__'
  const SAIDA_ID = '__saida__'
  // "Todas as mensagens" de uma conta (todas as pastas). Pseudo-pasta
  // explicita: clicar na CONTA mostra so a Caixa de Entrada; so este item
  // traz Lixeira/Arquivo/Enviados/Spam junto.
  const TODAS_MSGS_ID = '__todas__'
  const [saidaPorConta, setSaidaPorConta] = useState({}) // { [contaId]: qtd na fila/erro }

  const [descobrindoPastas, setDescobrindoPastas] = useState({}) // { [contaId]: true }
  const [erroPastasPorConta, setErroPastasPorConta] = useState({}) // { [contaId]: mensagem }

  async function carregarPastas(contaId) {
    const res = await window.api.email.listarPastas(contaId)
    const pastas = res.ok ? res.data || [] : []
    setErroPastasPorConta(prev => ({ ...prev, [contaId]: null }))
    // Conta expandida pela primeira vez (ou depois de reiniciar o app) ainda
    // não tem pastas catalogadas — descobrirPastas só rodava dentro do sync
    // completo de mensagens (a cada 5min ou clicando "Sincronizar"), então
    // a lista ficava vazia até o usuário sincronizar manualmente. Dispara
    // a descoberta na hora, sem esperar o próximo ciclo de sync — e só
    // grava pastasPorConta[contaId] DEPOIS de resolvida, pra não marcar
    // "[]" como resultado final prematuramente (isso fazia o toggle achar
    // que já tinha carregado e não tentar de novo até recolher/expandir).
    if (!pastas.length) {
      setDescobrindoPastas(prev => ({ ...prev, [contaId]: true }))
      try {
        const resDesc = await window.api.email.descobrirPastasAgora(contaId)
        if (resDesc.ok) {
          setPastasPorConta(prev => ({ ...prev, [contaId]: resDesc.data || [] }))
        } else {
          // Erro real (conexão IMAP falhou) não pode virar "[]" silencioso
          // — isso escondia a falha atrás de "Nenhuma pasta encontrada",
          // indistinguível de uma conta que legitimamente não tem pastas.
          setErroPastasPorConta(prev => ({ ...prev, [contaId]: resDesc.erro }))
        }
      } finally {
        setDescobrindoPastas(prev => ({ ...prev, [contaId]: false }))
      }
    } else {
      setPastasPorConta(prev => ({ ...prev, [contaId]: pastas }))
    }
  }

  function toggleContaExpandida(contaId) {
    setContasExpandidas(prev => {
      const next = new Set(prev)
      if (next.has(contaId)) { next.delete(contaId) }
      else { next.add(contaId); if (!pastasPorConta[contaId]?.length) carregarPastas(contaId) }
      return next
    })
  }

  // contasExpandidas é restaurado do localStorage já com contas marcadas
  // como expandidas (sessão anterior) — a sublista de pastas aparece aberta
  // na hora, mas carregarPastas() só era disparado por clique explícito no
  // toggle. Sem isso, a tela mostrava a seção expandida vazia até o usuário
  // recolher e expandir de novo pra disparar o carregamento manualmente.
  useEffect(() => {
    if (!contas.length) return
    for (const contaId of contasExpandidas) {
      if (!pastasPorConta[contaId]?.length) carregarPastas(contaId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contas.length])

  const [naoLidasPorConta, setNaoLidasPorConta] = useState({}) // { [contaId]: n }
  // { [contaId]: { INBOX: n, [pastaId]: n } } — badge por pasta na navegacao
  const [naoLidasPorPasta, setNaoLidasPorPasta] = useState({})

  const carregarContas = useCallback(async () => {
    const res = await window.api.email.listarContas()
    const lista = res.ok ? res.data || [] : []
    setContas(lista)
    // Sem seleção automática de conta — contaAtivaId=null é a visão "Todas
    // as contas" (padrão sempre que a tela abre), unificando as caixas de
    // entrada de todas as contas cadastradas. Clicar numa conta filtra.
    const [contagens, porPasta, saida] = await Promise.all([
      Promise.all(lista.map(c => window.api.email.contarNaoLidas(c.id))),
      Promise.all(lista.map(c => window.api.email.contarNaoLidasPorPasta(c.id))),
      Promise.all(lista.map(c => window.api.email.contarMensagens({ contaId: c.id, caixaSaida: true }))),
    ])
    setNaoLidasPorConta(Object.fromEntries(lista.map((c, i) => [c.id, contagens[i].ok ? contagens[i].data : 0])))
    setNaoLidasPorPasta(Object.fromEntries(lista.map((c, i) => [c.id, porPasta[i].ok ? porPasta[i].data || {} : {}])))
    setSaidaPorConta(Object.fromEntries(lista.map((c, i) => [c.id, saida[i].ok ? saida[i].data : 0])))
    return lista
  }, [])

  // Ajusta a contagem local de nao lidas (por conta E por pasta) de um
  // conjunto de mensagens, sem esperar o servidor. `delta` = -1 ao marcar
  // como lida, +1 ao marcar como nao lida. Usado no clique, no lote e no
  // atalho — antes cada um fazia (ou esquecia) esse ajuste por conta
  // propria, deixando o badge da pasta "preso".
  const ajustarNaoLidasLocal = useCallback((msgs, delta) => {
    const porConta = {}
    const porPasta = {}
    for (const m of msgs) {
      const cid = m.conta_id
      const chave = m.pasta_id != null && m.pasta_imap !== 'INBOX' ? String(m.pasta_id) : 'INBOX'
      porConta[cid] = (porConta[cid] || 0) + delta
      porPasta[cid] = porPasta[cid] || {}
      porPasta[cid][chave] = (porPasta[cid][chave] || 0) + delta
    }
    setNaoLidasPorConta(prev => {
      const next = { ...prev }
      for (const cid in porConta) next[cid] = Math.max(0, (next[cid] || 0) + porConta[cid])
      return next
    })
    setNaoLidasPorPasta(prev => {
      const next = { ...prev }
      for (const cid in porPasta) {
        next[cid] = { ...(next[cid] || {}) }
        for (const chave in porPasta[cid]) {
          next[cid][chave] = Math.max(0, (next[cid][chave] || 0) + porPasta[cid][chave])
        }
      }
      return next
    })
  }, [])

  const carregarMensagens = useCallback(async () => {
    if (!contas.length) { setMensagens([]); setTotalMensagens(0); return }
    const tokenAtual = ++recargaToken.current
    setLoadingLista(true)
    setThreadsExpandidas({})
    try {
      // Rascunhos são uma pseudo-pasta client-side (não vêm de
      // email_pasta_001) — fluxo próprio, sem paginação/agrupamento/etiqueta.
      if (pastaAtivaId === RASCUNHOS_ID) {
        const res = await window.api.email.listarRascunhos(contaAtivaId || undefined)
        const lista = (res.ok ? res.data || [] : []).map(r => ({
          ...r, remetente_nome: '(rascunho)', remetente_email: r.destinatarios?.[0]?.email || '', lida: true, rascunho: true,
        }))
        setMensagens(lista)
        setTotalMensagens(lista.length)
        return
      }

      const ehSaida = pastaAtivaId === SAIDA_ID
      const ehTodas = pastaAtivaId === TODAS_MSGS_ID
      // Pseudo-pastas nao vao como pastaId de verdade pro backend.
      const pastaReal = (pastaAtivaId && ![SAIDA_ID, TODAS_MSGS_ID, RASCUNHOS_ID].includes(pastaAtivaId)) ? pastaAtivaId : undefined
      const filtros = {
        contaId: contaAtivaId || undefined, busca: busca.trim() || undefined, apenasNaoLidas,
        etiquetaId: (ehSaida || ehTodas) ? undefined : (etiquetaAtivaId || undefined),
        pastaId: pastaReal,
        caixaSaida: ehSaida || undefined,
        // Traz de TODAS as pastas so quando o usuario escolhe explicitamente
        // "Todas as mensagens" da conta. Clicar so na conta = Caixa de
        // Entrada (special_use NULL), como Gmail/Outlook.
        todasAsPastas: (ehTodas && !!contaAtivaId) || undefined,
        sinalizada: apenasSinalizadas || undefined,
        remetente: filtrosAvancados.remetente || undefined,
        dataInicio: filtrosAvancados.dataInicio || undefined,
        dataFim: filtrosAvancados.dataFim || undefined,
        comAnexo: filtrosAvancados.comAnexo || undefined,
        limite: porPagina, offset: (pagina - 1) * porPagina,
      }
      const [resLista, resTotal] = await Promise.all([
        agrupado ? window.api.email.listarMensagensAgrupadas(filtros) : window.api.email.listarMensagens(filtros),
        agrupado ? window.api.email.contarThreads(filtros) : window.api.email.contarMensagens(filtros),
      ])
      const lista = resLista.ok ? resLista.data || [] : []
      setMensagens(lista)
      setTotalMensagens(resTotal.ok ? resTotal.data : 0)
      // Equivalente a "carrega o último registro em modo view": ao trocar
      // de conta ou lista recarregar, mostra a mensagem mais recente. So
      // se ninguem selecionou nada nesse meio-tempo (token nao mudou).
      if (lista.length && !mensagemAtivaId && recargaToken.current === tokenAtual) {
        selecionarMensagem(lista[0].id)
      }
      if (lista.length) {
        const resEtq = await window.api.email.etiquetasPorMensagens(lista.map(m => m.id))
        setEtiquetasPorMensagem(resEtq.ok ? resEtq.data || {} : {})
      } else {
        setEtiquetasPorMensagem({})
      }
    } finally {
      setLoadingLista(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contaAtivaId, busca, apenasNaoLidas, pagina, porPagina, agrupado, etiquetaAtivaId, pastaAtivaId, contas.length, apenasSinalizadas, filtrosAvancados])

  useEffect(() => { carregarContas() }, [carregarContas])
  useEffect(() => { setPagina(1); setMensagemAtivaId(null); setMensagemAtiva(null); setSelecionados(new Set()); setPastaAtivaId(null) }, [contaAtivaId])
  useEffect(() => { setPagina(1); setSelecionados(new Set()) }, [apenasSinalizadas, filtrosAvancados])
  useEffect(() => { setPagina(1); setSelecionados(new Set()) }, [etiquetaAtivaId])
  useEffect(() => { setPagina(1); setSelecionados(new Set()) }, [pastaAtivaId])
  useEffect(() => { setSelecionados(new Set()) }, [pagina])
  useEffect(() => { carregarMensagens() }, [carregarMensagens])

  // Nunca abre o composer automaticamente ao montar — só via newTrigger
  // (atalho global "Novo") ou clique explícito no botão "Novo e-mail".
  useEffect(() => {
    if (newTrigger) abrirComposerNovo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTrigger])

  useEffect(() => {
    const unsub = window.api.email.onNovaMensagem(({ contaId }) => {
      carregarContas()
      // Recarrega a lista se a mensagem nova PODE aparecer na visao atual:
      //  - "Todas as contas" (contaAtivaId null) na Inbox / "todas as
      //    pastas", ou
      //  - a conta ativa e a que recebeu, e nao estou numa pasta especifica
      //    que nao seja a Inbox, nem filtrando por etiqueta/rascunho.
      // Visao onde uma msg nova de INBOX aparece: Caixa de Entrada
      // (pastaAtivaId null), ou "Todas as mensagens" da conta.
      const visaoRecebeInbox = !pastaAtivaId || pastaAtivaId === TODAS_MSGS_ID
      const semFiltroEspecial = !etiquetaAtivaId && ![RASCUNHOS_ID, SAIDA_ID].includes(pastaAtivaId)
      const contaCombina = !contaAtivaId || contaId === contaAtivaId
      if (contaCombina && semFiltroEspecial && visaoRecebeInbox) {
        carregarMensagens()
      }
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contaAtivaId, pastaAtivaId, etiquetaAtivaId])

  // Fila de saida reenviou algo sozinha (worker de sync) — atualiza contagens
  // e, se estou olhando a Caixa de Saida, a lista.
  useEffect(() => {
    const unsub = window.api.email.onFilaSaida(({ enviados }) => {
      carregarContas()
      if (pastaAtivaId === SAIDA_ID) carregarMensagens()
      if (enviados > 0) notificar.sucesso(`${enviados} e-mail(s) da Caixa de Saída enviado(s).`)
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastaAtivaId])

  async function reenviarSaida() {
    if (processandoLote) return
    setProcessandoLote(true)
    try {
      const res = await window.api.email.reenviarFilaSaida(null)
      await Promise.all([carregarMensagens(), carregarContas()])
      if (res.ok) {
        const { enviados, processados } = res.data
        if (enviados > 0) notificar.sucesso(`${enviados} de ${processados} e-mail(s) enviado(s).`)
        else notificar.aviso('Nenhum e-mail pôde ser enviado agora. Continua na fila.')
      } else {
        notificar.erro(res.erro || 'Falha ao reprocessar a Caixa de Saída.')
      }
    } finally {
      setProcessandoLote(false)
    }
  }

  async function selecionarMensagem(id) {
    // Rascunho: clicar reabre o composer de onde parou, não o leitor.
    if (pastaAtivaId === RASCUNHOS_ID) {
      const res = await window.api.email.obterMensagem(id)
      if (res.ok) {
        setRascunhoEditando(res.data)
        setComposerModo('novo')
        setComposerAberto(true)
      }
      return
    }
    // Marca a intencao imediatamente e captura o token: se a lista
    // recarregar ou o usuario clicar noutra mensagem antes do obterMensagem
    // voltar, descarta este resultado (nao troca o leitor pra mensagem
    // "velha").
    setMensagemAtivaId(id)
    const tokenClique = ++recargaToken.current
    const res = await window.api.email.obterMensagem(id)
    if (recargaToken.current !== tokenClique) return
    if (res.ok) {
      setMensagemAtiva(res.data)
      if (!res.data.lida) {
        await window.api.email.marcarLida(id, true)
        setMensagens(prev => prev.map(m => m.id === id ? { ...m, lida: true } : m))
        ajustarNaoLidasLocal([res.data], -1)
        carregarContas()
      }
    }
  }

  // Clique no checkbox — nunca chama selecionarMensagem, então nunca marca
  // como lida como side-effect (esse é o comportamento exclusivo do clique
  // no corpo do item, ver ListaMensagens.jsx).
  function toggleSelecao(id, { shift, ctrl } = {}) {
    setSelecionados(prev => {
      const next = new Set(prev)
      if (shift && ultimoClicadoId != null) {
        const idsPagina = mensagens.map(m => m.id)
        const a = idsPagina.indexOf(ultimoClicadoId)
        const b = idsPagina.indexOf(id)
        if (a !== -1 && b !== -1) {
          const [ini, fim] = a < b ? [a, b] : [b, a]
          for (let i = ini; i <= fim; i++) next.add(idsPagina[i])
        } else {
          next.has(id) ? next.delete(id) : next.add(id)
        }
      } else {
        next.has(id) ? next.delete(id) : next.add(id)
      }
      return next
    })
    setUltimoClicadoId(id)
  }

  // Expansão lazy: só busca as mensagens da thread na primeira vez que o
  // usuário abre a conversa, evita N chamadas de rede antecipadas.
  async function toggleThread(grupo) {
    setThreadsExpandidas(prev => {
      if (prev[grupo]) {
        const { [grupo]: _omit, ...resto } = prev
        return resto
      }
      return prev
    })
    if (threadsExpandidas[grupo]) return
    const res = await window.api.email.listarMensagensDaThread(grupo)
    if (res.ok) {
      setThreadsExpandidas(prev => ({ ...prev, [grupo]: res.data || [] }))
    }
  }

  async function handleSinalizar(id, sinalizada) {
    await window.api.email.sinalizar(id, sinalizada)
    setMensagens(prev => prev.map(m => m.id === id ? { ...m, sinalizada } : m))
    if (mensagemAtivaId === id) setMensagemAtiva(prev => prev ? { ...prev, sinalizada } : prev)
  }

  function selecionarTodosVisiveis() {
    setSelecionados(new Set(mensagens.map(m => m.id)))
  }

  function limparSelecao() {
    setSelecionados(new Set())
  }

  async function handleMarcarLidaLote(lida) {
    const ids = Array.from(selecionados)
    if (!ids.length || processandoLote) return
    setProcessandoLote(true)
    try {
      await window.api.email.marcarLidaLote(ids, lida)
      // So conta as que REALMENTE mudaram de estado (marcar lido 3 msgs em
      // que 1 ja estava lida = delta -2, nao -3).
      const mudaram = mensagens.filter(m => ids.includes(m.id) && !!m.lida !== lida)
      ajustarNaoLidasLocal(mudaram, lida ? -1 : 1)
      setMensagens(prev => prev.map(m => ids.includes(m.id) ? { ...m, lida } : m))
      if (mensagemAtivaId && ids.includes(mensagemAtivaId)) {
        setMensagemAtiva(prev => prev ? { ...prev, lida } : prev)
      }
      limparSelecao()
      carregarContas() // reconcilia com o servidor
    } finally {
      setProcessandoLote(false)
    }
  }

  async function handleAplicarEtiquetaLote(etiquetaId) {
    const ids = Array.from(selecionados)
    if (!ids.length || processandoLote) return
    setProcessandoLote(true)
    try {
      await window.api.email.aplicarEtiquetaLote(ids, etiquetaId)
      const resEtq = await window.api.email.etiquetasPorMensagens(mensagens.map(m => m.id))
      setEtiquetasPorMensagem(resEtq.ok ? resEtq.data || {} : {})
      limparSelecao()
    } finally {
      setProcessandoLote(false)
    }
  }

  // Arrastar e-mail(s) da lista e soltar sobre uma etiqueta na navegacao.
  // Se o e-mail arrastado faz parte da selecao atual, move a selecao inteira;
  // caso contrario, move so aquele. Comportamento estilo Outlook "mover para
  // pasta": aplica APENAS a etiqueta alvo (a hierarquia funciona por heranca
  // de leitura, nao de gravacao) E arquiva a mensagem, tirando-a da Caixa de
  // Entrada. A mensagem continua acessivel pela etiqueta (e pelo pai dela,
  // que mostra as filhas) e pela pasta Arquivo.
  async function handleSoltarEmailNaEtiqueta(etiquetaId, mensagemIds) {
    const ids = (mensagemIds || []).filter(Boolean)
    if (!ids.length || processandoLote || processandoPasta) return
    setProcessandoLote(true)
    setProcessandoPasta(true)
    try {
      const res = await window.api.email.aplicarEtiquetaLote(ids, etiquetaId)
      if (!res.ok) { notificar.erro(res.erro); return }

      // Acao silenciosa (etiqueta + arquiva + some da lista), sem toast de
      // sucesso — so avisa quando algo falha ao arquivar.
      const resArq = await window.api.email.arquivarLote(ids)
      if (resArq.ok && resArq.data.falhas?.length) {
        notificar.aviso(
          `${resArq.data.sucesso}/${resArq.data.total} sairam da Caixa de Entrada.\n${resArq.data.falhas.join('\n')}`
        )
      } else if (!resArq.ok) {
        notificar.aviso(`Etiqueta aplicada, mas nao foi possivel arquivar: ${resArq.erro}`)
      }

      if (selecionados.size) limparSelecao()
      if (mensagemAtiva && ids.includes(mensagemAtiva.id)) setMensagemAtiva(null)
      await recarregarAposMoverLote()
      carregarContas()
    } finally {
      setProcessandoLote(false)
      setProcessandoPasta(false)
    }
  }

  async function handleAplicarEtiquetaMensagemAtiva(etiquetaId) {
    if (!mensagemAtiva) return
    await window.api.email.aplicarEtiquetaLote([mensagemAtiva.id], etiquetaId)
    const etq = etiquetas.find(e => e.id === etiquetaId)
    if (etq) setMensagemAtiva(prev => prev ? { ...prev, etiquetas: [...(prev.etiquetas || []), etq] } : prev)
    const resEtq = await window.api.email.etiquetasPorMensagens(mensagens.map(m => m.id))
    setEtiquetasPorMensagem(resEtq.ok ? resEtq.data || {} : {})
  }

  async function handleRemoverEtiquetaMensagemAtiva(etiquetaId) {
    if (!mensagemAtiva) return
    await window.api.email.removerEtiquetaLote([mensagemAtiva.id], etiquetaId)
    const restantes = (mensagemAtiva.etiquetas || []).filter(e => e.id !== etiquetaId)
    setMensagemAtiva(prev => prev ? { ...prev, etiquetas: restantes } : prev)
    const resEtq = await window.api.email.etiquetasPorMensagens(mensagens.map(m => m.id))
    setEtiquetasPorMensagem(resEtq.ok ? resEtq.data || {} : {})

    // Arrastar pra uma etiqueta arquiva o e-mail (tira da Caixa de Entrada).
    // Remover a ULTIMA etiqueta faz o inverso: devolve pra Caixa de Entrada,
    // "esse e-mail nao pertence a lugar nenhum agora, volta pro inbox".
    // Se ainda restam etiquetas, permanece arquivado.
    if (restantes.length === 0) {
      const res = await window.api.email.moverParaInboxLote([mensagemAtiva.id])
      if (res.ok && res.data.falhas?.length) {
        notificar.aviso(`Etiqueta removida.\n${res.data.falhas.join('\n')}`)
      } else if (res.ok) {
        notificar.sucesso('E-mail devolvido para a Caixa de Entrada.')
      }
      await carregarMensagens()
      carregarContas()
      for (const cId of contasExpandidas) await carregarPastas(cId)
    }
  }

  async function recarregarAposMoverLote() {
    limparSelecao()
    await carregarMensagens()
    // Pastas visíveis podem ter perdido/ganhado contagem — recarrega as já
    // abertas pra manter o contador de "sincronizada" implícito coerente.
    for (const contaId of contasExpandidas) await carregarPastas(contaId)
  }

  async function handleArquivarLote() {
    const ids = Array.from(selecionados)
    if (!ids.length || processandoPasta) return
    setProcessandoPasta(true)
    try {
      const res = await window.api.email.arquivarLote(ids)
      if (res.ok) {
        if (res.data.falhas?.length) {
          notificar.aviso(`${res.data.sucesso}/${res.data.total} arquivada(s).\n${res.data.falhas.join('\n')}`)
        } else {
          notificar.sucesso(`${res.data.sucesso} mensagem(ns) arquivada(s).`)
        }
      } else {
        notificar.erro(res.erro)
      }
      await recarregarAposMoverLote()
    } finally {
      setProcessandoPasta(false)
    }
  }

  // special_use da pasta ativa (null p/ Inbox, undefined p/ pseudo-pastas).
  function specialUsePastaAtiva() {
    if (!pastaAtivaId || [RASCUNHOS_ID, SAIDA_ID, TODAS_MSGS_ID].includes(pastaAtivaId)) return undefined
    for (const lista of Object.values(pastasPorConta)) {
      const p = lista.find(x => x.id === pastaAtivaId)
      if (p) return p.special_use
    }
    return undefined
  }

  // permanente: force (Shift+Excluir) OU ja estou dentro da Lixeira.
  async function handleExcluirLote(permanente = false) {
    const ids = Array.from(selecionados)
    if (!ids.length || processandoPasta) return

    const ehRascunhos = pastaAtivaId === RASCUNHOS_ID
    const naLixeira = specialUsePastaAtiva() === '\\Trash'
    const apagarDeVez = permanente || naLixeira || ehRascunhos

    const ok = await notificar.confirmar(
      apagarDeVez
        ? `Apagar ${ids.length} mensagem(ns) DEFINITIVAMENTE? Esta ação não pode ser desfeita.`
        : `Mover ${ids.length} mensagem(ns) para a lixeira?`,
      { titulo: apagarDeVez ? 'Apagar definitivamente' : 'Mover para a lixeira', confirmarLabel: apagarDeVez ? 'Apagar' : 'Mover', perigo: true }
    )
    if (!ok) return
    setProcessandoPasta(true)
    try {
      if (ehRascunhos) {
        const results = await Promise.all(ids.map(id => window.api.email.excluirRascunho(id)))
        const falhas = results.filter(r => !r.ok).length
        if (falhas) notificar.aviso(`${ids.length - falhas}/${ids.length} rascunho(s) excluido(s).`)
        else notificar.sucesso(`${ids.length} rascunho(s) excluido(s).`)
      } else if (apagarDeVez) {
        const res = await window.api.email.excluirPermanenteLote(ids)
        if (res.ok) {
          if (res.data.falhas?.length) {
            notificar.aviso(`${res.data.sucesso}/${res.data.total} apagada(s).\n${res.data.falhas.join('\n')}`)
          } else {
            notificar.sucesso(`${res.data.sucesso} mensagem(ns) apagada(s) definitivamente.`)
          }
        } else notificar.erro(res.erro)
      } else {
        const res = await window.api.email.excluirLote(ids)
        if (res.ok) {
          if (res.data.falhas?.length) {
            notificar.aviso(`${res.data.sucesso}/${res.data.total} movida(s) para a lixeira.\n${res.data.falhas.join('\n')}`)
          } else {
            notificar.sucesso(`${res.data.sucesso} mensagem(ns) movida(s) para a lixeira.`)
          }
        } else notificar.erro(res.erro)
      }
      await recarregarAposMoverLote()
    } finally {
      setProcessandoPasta(false)
    }
  }

  async function handleEsvaziarLixeira() {
    const ok = await notificar.confirmar(
      `Esvaziar a Lixeira de ${contaAtivaId ? 'esta conta' : 'todas as contas'}? Todas as mensagens da lixeira serão apagadas definitivamente.`,
      { titulo: 'Esvaziar lixeira', confirmarLabel: 'Esvaziar', perigo: true }
    )
    if (!ok) return
    setProcessandoPasta(true)
    try {
      const res = await window.api.email.esvaziarLixeira(contaAtivaId || null)
      if (res.ok) {
        if (res.data.total === 0) notificar.info('A Lixeira já está vazia.')
        else notificar.sucesso(`Lixeira esvaziada: ${res.data.sucesso} mensagem(ns) apagada(s).`)
      } else notificar.erro(res.erro)
      await recarregarAposMoverLote()
    } finally {
      setProcessandoPasta(false)
    }
  }


  async function handleSincronizarAgora() {
    if (sincronizando || !contas.length) return
    setSincronizando(true)
    try {
      // Sem conta selecionada (visão "Todas as contas"), sincroniza todas —
      // botão continua útil na visão unificada, não só quando filtrado.
      const ids = contaAtivaId ? [contaAtivaId] : contas.map(c => c.id)
      const falhas = []
      let totalNovas = 0
      for (const id of ids) {
        const res = await window.api.email.sincronizarAgora(id)
        if (res?.ok) totalNovas += (res.data?.novas || 0)
        else falhas.push(contasPorId[id]?.nome || `Conta ${id}`)
      }
      await Promise.all([carregarMensagens(), carregarContas()])
      // Feedback: antes o botao so parava de girar e nada era dito, mesmo
      // quando a conta caiu.
      if (falhas.length && falhas.length === ids.length) {
        notificar.erro(`Não foi possível sincronizar: ${falhas.join(', ')}.`)
      } else if (falhas.length) {
        notificar.aviso(`Algumas contas falharam ao sincronizar: ${falhas.join(', ')}.`)
      } else if (totalNovas > 0) {
        notificar.sucesso(`${totalNovas} mensagem(ns) nova(s).`)
      } else {
        notificar.info('Tudo sincronizado. Nenhuma mensagem nova.')
      }
    } finally {
      setSincronizando(false)
    }
  }

  function abrirComposerNovo() {
    setRascunhoEditando(null)
    setComposerModo('novo')
    setComposerAberto(true)
  }
  function abrirComposerResponder() {
    if (!mensagemAtiva) return
    setRascunhoEditando(null)
    setComposerModo('responder')
    setComposerAberto(true)
  }
  function abrirComposerResponderTodos() {
    if (!mensagemAtiva) return
    setRascunhoEditando(null)
    setComposerModo('responder-todos')
    setComposerAberto(true)
  }
  function abrirComposerEncaminhar() {
    if (!mensagemAtiva) return
    setRascunhoEditando(null)
    setComposerModo('encaminhar')
    setComposerAberto(true)
  }

  function abrirNovaConta() {
    setContaEditando(null)
    setContaFormAberta(true)
  }

  async function aoSalvarConta() {
    setContaFormAberta(false)
    const lista = await carregarContas()
    if (!contaAtivaId && lista.length) setContaAtivaId(lista[lista.length - 1].id)
  }

  async function aoEnviarEmail() {
    setComposerAberto(false)
    setRascunhoEditando(null)
    if (composerModo === 'responder' && mensagemAtiva) {
      setMensagemAtiva(prev => ({ ...prev, respondida: true }))
    }
    await carregarMensagens()
  }

  const totalPaginas = Math.max(1, Math.ceil(totalMensagens / porPagina))

  // Navega dentro da lista atual (não atravessa página) — mesma limitação
  // documentada no plano original, aceitável: atalho de navegação rápida
  // dentro do que já está carregado, não substitui a paginação.
  function navegarMensagem(delta) {
    if (!mensagens.length) return
    const idx = mensagens.findIndex(m => m.id === mensagemAtivaId)
    const proximo = idx === -1 ? 0 : Math.min(Math.max(idx + delta, 0), mensagens.length - 1)
    selecionarMensagem(mensagens[proximo].id)
  }

  async function handleArquivarAtual() {
    if (!mensagemAtiva) return
    const idAtual = mensagemAtiva.id
    setSelecionados(new Set([idAtual]))
    await handleArquivarLote()
    navegarMensagem(1)
  }

  // Desligado por completo quando qualquer modal está aberto (composer,
  // cadastro de conta, etiquetas, busca avançada) — cinto de segurança além
  // da checagem de "está digitando" já feita dentro do hook.
  const atalhosAtivos = !composerAberto && !contaFormAberta && !etiquetaFormAberta && !buscaAvancadaAberta
  useAtalhosTeclado({
    j: () => navegarMensagem(1),
    k: () => navegarMensagem(-1),
    c: () => abrirComposerNovo(),
    r: () => abrirComposerResponder(),
    a: () => abrirComposerResponderTodos(),
    f: () => abrirComposerEncaminhar(),
    e: () => handleArquivarAtual(),
    ' ': () => { if (mensagemAtiva) handleToggleLidaAtual() },
  }, atalhosAtivos)

  async function handleToggleLidaAtual() {
    const novoEstado = !mensagemAtiva.lida
    await window.api.email.marcarLida(mensagemAtiva.id, novoEstado)
    ajustarNaoLidasLocal([mensagemAtiva], novoEstado ? -1 : 1)
    setMensagemAtiva(prev => ({ ...prev, lida: novoEstado }))
    setMensagens(prev => prev.map(m => m.id === mensagemAtiva.id ? { ...m, lida: novoEstado } : m))
    carregarContas()
  }

  return (
    <div className="page-with-footer">
      <div className="page-content" style={{ padding: 0, gap: 0, overflow: 'visible', minHeight: 0 }}>
      <div className="email-shell">

        {/* Coluna esquerda: contas — recolhível, mesmo padrão do menu lateral */}
        <div className={`email-contas${contasRecolhidas ? ' collapsed' : ''}`}>
          <button className={`email-contas-toggle toggle-recolher${contasRecolhidas ? ' is-recolhido' : ''}`} onClick={() => setContasRecolhidas(v => !v)} title={contasRecolhidas ? 'Expandir' : 'Recolher'}>
            <span className="toggle-recolher-icon"><ChevronLeft size={11} strokeWidth={2.5} /></span>
          </button>

          <div className="email-contas-header">
            {contasRecolhidas ? (
              <span className="email-contas-header-label">Contas</span>
            ) : (
              <button
                className="email-secao-titulo"
                onClick={() => setSecaoContasRecolhida(v => !v)}
                title={secaoContasRecolhida ? 'Expandir contas' : 'Recolher contas'}
              >
                {secaoContasRecolhida ? <ChevronRight size={11} color="var(--t3)" /> : <ChevronDown size={11} color="var(--t3)" />}
                <span>Contas</span>
              </button>
            )}
            {!contasRecolhidas && (
              <button className="btn btn-primary" style={{ height: 28, fontSize: 11, padding: '0 12px', flexShrink: 0 }} onClick={abrirNovaConta} title="Nova conta">
                <Plus size={12} /> Nova conta
              </button>
            )}
          </div>
          <div className="email-contas-scroll">
            {(contasRecolhidas || !secaoContasRecolhida) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {contas.length > 0 && (
                  <button
                    className={`email-conta-item${!contaAtivaId ? ' ativo' : ''}`}
                    onClick={() => setContaAtivaId(null)}
                    title="Ver mensagens de todas as contas juntas"
                  >
                    <span className="email-conta-item-icone"><Mails size={15} /></span>
                    <span className="email-conta-item-nome">Todas as contas</span>
                  </button>
                )}
                {(contasRecolhidas
                  ? [{ id: '__flat__', rotulo: null, contas }]
                  : gruposDeContas
                ).map(grupo => {
                  const grupoRecolhido = !contasRecolhidas && gruposRecolhidos.has(grupo.id)
                  return (
                  <div key={grupo.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Cabecalho do grupo de provedor — so quando expandido e
                        havendo mais de um grupo (um grupo so nao precisa de
                        titulo). Recolhe/expande o grupo inteiro. */}
                    {grupo.rotulo && gruposDeContas.length > 1 && (
                      <button
                        className="email-grupo-provedor"
                        onClick={() => toggleGrupoRecolhido(grupo.id)}
                        title={grupoRecolhido ? 'Expandir grupo' : 'Recolher grupo'}
                      >
                        {grupoRecolhido ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                        <span>{grupo.rotulo}</span>
                        <span className="email-grupo-provedor-count">{grupo.contas.length}</span>
                      </button>
                    )}
                    {!grupoRecolhido && grupo.contas.map((c, idxNoGrupo) => {
                  const expandida = contasExpandidas.has(c.id)
                  const pastas = pastasPorConta[c.id] || []
                  const podeSubir = !contasRecolhidas && idxNoGrupo > 0
                  const podeDescer = !contasRecolhidas && idxNoGrupo < grupo.contas.length - 1
                  return (
                    <div key={c.id} className="email-conta-linha">
                      <div style={{ display: 'flex', alignItems: 'stretch', gap: 2 }}>
                        {!contasRecolhidas && (
                          <button
                            onClick={() => toggleContaExpandida(c.id)}
                            style={{ display: 'flex', alignItems: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--t3)', padding: '0 2px', flexShrink: 0 }}
                            title={expandida ? 'Recolher pastas' : 'Mostrar pastas'}
                          >
                            {expandida ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </button>
                        )}
                        <button
                          className={`email-conta-item${c.id === contaAtivaId ? ' ativo' : ''}`}
                          onClick={() => setContaAtivaId(c.id)}
                          style={{ flex: 1 }}
                          title={contasRecolhidas ? c.nome : 'Duplo clique para editar'}
                          onDoubleClick={() => { setContaEditando(c); setContaFormAberta(true) }}
                        >
                          <span style={{ position: 'relative', flexShrink: 0 }}>
                            <span
                              className="email-conta-item-avatar"
                              style={{ color: c.avatar_cor || corAvatar(c.nome, c.email) }}
                            >
                              {iniciais(c.nome, c.email)}
                            </span>
                            <span
                              style={{
                                position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%',
                                background: c.sync_status === 'erro' ? 'var(--red)' : 'var(--green)',
                                border: '2px solid var(--s1)',
                              }}
                              title={STATUS_SYNC_META[c.sync_status]?.label || c.sync_status}
                            />
                            {/* Badge de nao lidas no avatar — no estado recolhido e o
                                unico jeito de ver que a conta tem e-mail novo. */}
                            {contasRecolhidas && naoLidasPorConta[c.id] > 0 && (
                              <span
                                style={{
                                  position: 'absolute', top: -5, right: -6, minWidth: 15, height: 15, padding: '0 3px',
                                  borderRadius: 999, background: 'var(--or)', color: '#fff',
                                  fontSize: 9, fontWeight: 800, lineHeight: '15px', textAlign: 'center',
                                  border: '2px solid var(--s1)', fontVariantNumeric: 'tabular-nums',
                                }}
                                title={`${naoLidasPorConta[c.id]} nao lida(s)`}
                              >
                                {naoLidasPorConta[c.id] > 99 ? '99+' : naoLidasPorConta[c.id]}
                              </span>
                            )}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                            <span className="email-conta-item-nome">{c.nome}</span>
                            {naoLidasPorConta[c.id] > 0 && (
                              <span className="email-badge-contagem">{naoLidasPorConta[c.id]}</span>
                            )}
                          </span>
                        </button>
                        {/* Setas de reordenacao — aparecem no hover da linha
                            (CSS .email-conta-linha:hover). So dentro do grupo
                            de provedor; nas pontas a seta correspondente
                            fica desabilitada. */}
                        {!contasRecolhidas && grupo.contas.length > 1 && (
                          <span className="email-conta-ordenar">
                            <button
                              type="button"
                              disabled={!podeSubir}
                              onClick={e => { e.stopPropagation(); moverConta(c.id, -1) }}
                              title="Mover para cima"
                            >
                              <ChevronUp size={11} />
                            </button>
                            <button
                              type="button"
                              disabled={!podeDescer}
                              onClick={e => { e.stopPropagation(); moverConta(c.id, 1) }}
                              title="Mover para baixo"
                            >
                              <ChevronDown size={11} />
                            </button>
                          </span>
                        )}
                      </div>
                      {!contasRecolhidas && expandida && (() => {
                        const naoLidas = naoLidasPorPasta[c.id] || {}
                        const totalConta = Object.values(naoLidas).reduce((s, n) => s + n, 0)
                        return (
                        <div className="email-sublista">
                          <button
                            className={`email-sublista-item${c.id === contaAtivaId && pastaAtivaId === TODAS_MSGS_ID ? ' ativo' : ''}`}
                            onClick={() => { setContaAtivaId(c.id); setPastaAtivaId(TODAS_MSGS_ID) }}
                          >
                            <Mails size={13} style={{ flexShrink: 0 }} />
                            <span>Todas as mensagens</span>
                            {totalConta > 0 && <span className="email-badge-contagem">{totalConta}</span>}
                          </button>
                          <button
                            className={`email-sublista-item${c.id === contaAtivaId && pastaAtivaId === RASCUNHOS_ID ? ' ativo' : ''}`}
                            onClick={() => { setContaAtivaId(c.id); setPastaAtivaId(RASCUNHOS_ID) }}
                          >
                            <FileEdit size={13} style={{ flexShrink: 0 }} />
                            <span>Rascunhos</span>
                          </button>
                          {saidaPorConta[c.id] > 0 && (
                            <button
                              className={`email-sublista-item${c.id === contaAtivaId && pastaAtivaId === SAIDA_ID ? ' ativo' : ''}`}
                              onClick={() => { setContaAtivaId(c.id); setPastaAtivaId(SAIDA_ID) }}
                            >
                              <Send size={13} style={{ flexShrink: 0, color: 'var(--yellow)' }} />
                              <span>Caixa de Saída</span>
                              <span className="email-badge-contagem" style={{ background: 'var(--yellow)' }}>{saidaPorConta[c.id]}</span>
                            </button>
                          )}
                          {pastas.map(p => {
                            const Icone = p.special_use === null ? Inbox : (ICONE_POR_SPECIAL_USE[p.special_use] || Inbox)
                            const ativa = c.id === contaAtivaId && pastaAtivaId === p.id
                            const n = p.special_use === null ? (naoLidas.INBOX || 0) : (naoLidas[String(p.id)] || 0)
                            return (
                              <button
                                key={p.id}
                                className={`email-sublista-item${ativa ? ' ativo' : ''}`}
                                onClick={() => { setContaAtivaId(c.id); setPastaAtivaId(p.id) }}
                              >
                                <Icone size={13} style={{ flexShrink: 0 }} />
                                <span>{p.nome_exibicao}</span>
                                {n > 0 && <span className="email-badge-contagem">{n}</span>}
                              </button>
                            )
                          })}
                          {!pastas.length && (
                            <span style={{ fontSize: 10.5, color: erroPastasPorConta[c.id] ? 'var(--red)' : 'var(--t3)', padding: '6px 9px' }}>
                              {descobrindoPastas[c.id]
                                ? 'Buscando pastas...'
                                : erroPastasPorConta[c.id]
                                  ? `Falha ao buscar pastas: ${erroPastasPorConta[c.id]}`
                                  : 'Nenhuma pasta encontrada.'}
                            </span>
                          )}
                        </div>
                        )
                      })()}
                    </div>
                  )
                    })}
                  </div>
                  )
                })}
                {!contas.length && !contasRecolhidas && (
                  <div style={{ padding: '24px 10px', textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>
                    Nenhuma conta cadastrada.
                    <div style={{ marginTop: 12 }}>
                      <button className="btn btn-primary" style={{ height: 32, fontSize: 11.5 }} onClick={abrirNovaConta}>
                        <Plus size={13} /> Nova conta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!contasRecolhidas && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px' }}>
                  <button
                    className="email-secao-titulo"
                    onClick={() => setSecaoEtiquetasRecolhida(v => !v)}
                    title={secaoEtiquetasRecolhida ? 'Expandir etiquetas' : 'Recolher etiquetas'}
                  >
                    {secaoEtiquetasRecolhida ? <ChevronRight size={11} color="var(--t3)" /> : <ChevronDown size={11} color="var(--t3)" />}
                    <span>Etiquetas</span>
                  </button>
                  <button className="btn btn-ghost" style={{ height: 22, width: 22, padding: 0 }} onClick={() => setEtiquetaFormAberta(true)} title="Gerenciar etiquetas">
                    <Settings size={11} />
                  </button>
                </div>
                {!secaoEtiquetasRecolhida && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button
                      className={`email-conta-item${!etiquetaAtivaId ? ' ativo' : ''}`}
                      onClick={() => setEtiquetaAtivaId(null)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                    >
                      <Tag size={12} color="var(--t3)" />
                      <span className="email-conta-item-nome" style={{ width: 'auto' }}>Todas</span>
                    </button>
                    {achatarEtiquetasEmArvore(etiquetas, null, 0, etiquetasRecolhidas).map(etq => (
                      <div key={etq.id} style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                          className={`email-conta-item${etiquetaAtivaId === etq.id ? ' ativo' : ''}${etiquetaAlvoDrop === etq.id ? ' drop-alvo' : ''}`}
                          onClick={() => setEtiquetaAtivaId(etq.id)}
                          onDragOver={e => {
                            if (!e.dataTransfer.types.includes('application/x-email-ids')) return
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'link'
                            if (etiquetaAlvoDrop !== etq.id) setEtiquetaAlvoDrop(etq.id)
                          }}
                          onDragLeave={() => setEtiquetaAlvoDrop(a => (a === etq.id ? null : a))}
                          onDrop={e => {
                            const raw = e.dataTransfer.getData('application/x-email-ids')
                            setEtiquetaAlvoDrop(null)
                            if (!raw) return
                            e.preventDefault()
                            const ids = raw.split(',').map(Number).filter(Boolean)
                            handleSoltarEmailNaEtiqueta(etq.id, ids)
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 10 + etq.nivel * 14, flex: 1 }}
                        >
                          {etq.temFilhos ? (
                            <span
                              onClick={e => { e.stopPropagation(); toggleEtiquetaRecolhida(etq.id) }}
                              style={{ display: 'flex', flexShrink: 0 }}
                            >
                              {etiquetasRecolhidas.has(etq.id) ? <ChevronRight size={11} color="var(--t3)" /> : <ChevronDown size={11} color="var(--t3)" />}
                            </span>
                          ) : (
                            <span style={{ width: 11, flexShrink: 0 }} />
                          )}
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: etq.cor, flexShrink: 0 }} />
                          <span className="email-conta-item-nome" style={{ width: 'auto' }}>{etq.nome}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Coluna central: lista de mensagens — recolhível, mesmo padrão */}
        <div className={`email-lista${listaRecolhida ? ' collapsed' : ''}`}>
          <button className={`email-lista-toggle toggle-recolher${listaRecolhida ? ' is-recolhido' : ''}`} onClick={() => setListaRecolhida(v => !v)} title={listaRecolhida ? 'Expandir' : 'Recolher'}>
            <span className="toggle-recolher-icon"><ChevronLeft size={11} strokeWidth={2.5} /></span>
          </button>

          {!listaRecolhida && pastaAtivaId === SAIDA_ID && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--bd)', background: 'rgba(234,179,8,.06)' }}>
              <Send size={14} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--t2)', flex: 1 }}>
                E-mails aguardando envio. O sistema tenta sozinho a cada ciclo.
              </span>
              <button className="btn btn-primary" style={{ height: 28, fontSize: 11.5 }} onClick={reenviarSaida} disabled={processandoLote}>
                {processandoLote ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={12} />}
                Reenviar agora
              </button>
            </div>
          )}
          {!listaRecolhida && specialUsePastaAtiva() === '\\Trash' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--bd)', background: 'rgba(248,113,113,.06)' }}>
              <Trash2 size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--t2)', flex: 1 }}>
                Excluir aqui apaga definitivamente (sem passar de novo pela lixeira).
              </span>
              <button className="btn btn-ghost" style={{ height: 28, fontSize: 11.5, color: 'var(--red)' }} onClick={handleEsvaziarLixeira} disabled={processandoPasta}>
                {processandoPasta ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />}
                Esvaziar Lixeira
              </button>
            </div>
          )}
          {!listaRecolhida && (
            <ListaMensagens
              mensagens={mensagens}
              mensagemAtivaId={mensagemAtivaId}
              onSelecionar={selecionarMensagem}
              busca={busca}
              onBusca={v => { setBusca(v); setPagina(1) }}
              apenasNaoLidas={apenasNaoLidas}
              onApenasNaoLidas={v => { setApenasNaoLidas(v); setPagina(1) }}
              loading={loadingLista}
              pagina={pagina}
              totalPaginas={totalPaginas}
              total={totalMensagens}
              porPagina={porPagina}
              onPagina={setPagina}
              onPorPagina={n => { setPorPagina(n); setPagina(1) }}
              selecionados={selecionados}
              onToggleSelecao={toggleSelecao}
              onSelecionarTodosVisiveis={selecionarTodosVisiveis}
              onLimparSelecao={limparSelecao}
              onMarcarLidaLote={handleMarcarLidaLote}
              processandoLote={processandoLote}
              agrupado={agrupado}
              onToggleAgrupado={() => setAgrupado(v => !v)}
              threadsExpandidas={threadsExpandidas}
              onToggleThread={toggleThread}
              etiquetas={etiquetas}
              etiquetasPorMensagem={etiquetasPorMensagem}
              onAplicarEtiquetaLote={handleAplicarEtiquetaLote}
              onArquivarLote={handleArquivarLote}
              onExcluirLote={handleExcluirLote}
              processandoPasta={processandoPasta}
              mostrarConta={!contaAtivaId}
              contasPorId={contasPorId}
              onSinalizar={handleSinalizar}
              apenasSinalizadas={apenasSinalizadas}
              onApenasSinalizadas={v => { setApenasSinalizadas(v); setPagina(1) }}
              onBuscaAvancada={() => setBuscaAvancadaAberta(true)}
              filtrosAvancados={filtrosAvancados}
            />
          )}
        </div>

        {/* Coluna direita: leitor */}
        <div className="email-leitor">
          <LeitorMensagem
            mensagem={mensagemAtiva}
            etiquetasDisponiveis={etiquetas}
            onAplicarEtiqueta={handleAplicarEtiquetaMensagemAtiva}
            onRemoverEtiqueta={handleRemoverEtiquetaMensagemAtiva}
            onSinalizar={handleSinalizar}
            onResponder={abrirComposerResponder}
            onResponderTodos={abrirComposerResponderTodos}
            onEncaminhar={abrirComposerEncaminhar}
          />
        </div>
      </div>
      </div>

      <div className="page-footer">
        <div className="page-footer-actions">
          <button className="btn btn-primary" onClick={abrirComposerNovo} disabled={!contas.length}>
            <Plus size={13} /> Novo e-mail
          </button>
          <button className="btn btn-ghost" onClick={handleSincronizarAgora} disabled={!contas.length || sincronizando}>
            <RefreshCw size={13} style={{ animation: sincronizando ? 'spin 0.8s linear infinite' : 'none' }} />
            {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
      </div>

      {composerAberto && (
        <ComposerModal
          modo={composerModo}
          contas={contas}
          contaAtivaId={contaAtivaId}
          mensagemOrigem={composerModo !== 'novo' ? mensagemAtiva : null}
          rascunho={rascunhoEditando}
          onFechar={async () => { setComposerAberto(false); setRascunhoEditando(null); await carregarMensagens() }}
          onEnviado={aoEnviarEmail}
        />
      )}

      {contaFormAberta && (
        <ContaFormModal
          conta={contaEditando}
          onFechar={() => setContaFormAberta(false)}
          onSalvo={aoSalvarConta}
        />
      )}

      {etiquetaFormAberta && (
        <EtiquetaFormModal
          onFechar={() => setEtiquetaFormAberta(false)}
          onAlterado={carregarEtiquetas}
        />
      )}

      {buscaAvancadaAberta && (
        <BuscaAvancadaModal
          filtros={filtrosAvancados}
          onAplicar={f => { setFiltrosAvancados(f); setBuscaAvancadaAberta(false) }}
          onFechar={() => setBuscaAvancadaAberta(false)}
        />
      )}
    </div>
  )
}
