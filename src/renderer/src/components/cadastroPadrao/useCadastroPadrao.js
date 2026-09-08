import { useState, useEffect, useCallback, useMemo } from 'react'

// Hook que carrega TODA a logica CRUD de uma tela de cadastro simples do
// KronTech (uma tabela, sem abas, sem grid-filho). E o motor por tras do
// <TelaCadastroPadrao>. Cada tela de apoio (Bancos, Naturezas, Condicoes de
// Pagamento, CNAE...) so passa a `config` e ganha:
//   - aba Acesso: lista paginada + filtro de busca geral
//   - aba Cadastro: form com navegacao entre registros (« ‹ N/total › »)
//   - Incluir / Alterar / Excluir / Consultar / Gravar / Desistir
//   - selecao em massa (checkbox "Sel") pronta pra menu de contexto
//
// `config` (ver JSDoc no TelaCadastroPadrao):
//   api        -> objeto com listar/obter/criar/atualizar/excluir (window.api.<x>)
//   emptyForm  -> objeto do form vazio
//   paraForm   -> (registroDoBanco) => objetoDoForm       (default: identidade)
//   paraPayload-> (form) => payloadParaOBanco             (default: identidade)
//   validar    -> (form) => string|null (mensagem de erro ou null)
//   novoCodigo -> (registros) => string  (preview otimista; opcional)

export function useCadastroPadrao(config) {
  const {
    api,
    emptyForm,
    paraForm = (r) => r,
    paraPayload = (f) => f,
    validar = () => null,
    novoCodigo,
    porPaginaInicial = 25,
  } = config

  // ── Lista completa (fonte da navegacao no form) ──────────────────────
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(-1)

  // ── Form ────────────────────────────────────────────────────────────
  const [mode, setMode] = useState('view') // view | new | edit
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState(null)
  const [confirmExcluir, setConfirmExcluir] = useState(false)

  // ── Aba Acesso (busca independente, so roda ao clicar Buscar) ────────
  const [filtrosAbertos, setFiltrosAbertos] = useState(true)
  const [buscaGeral, setBuscaGeral] = useState('')
  const [fResultados, setFResultados] = useState(null)
  const [fLoading, setFLoading] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(porPaginaInicial)

  // ── Selecao em massa ────────────────────────────────────────────────
  const [selecionados, setSelecionados] = useState(() => new Set())

  const carregarForm = useCallback(async (reg) => {
    const res = await api.obter(reg.id)
    if (!res.ok) { setErro(res.erro); return }
    setForm(paraForm(res.data))
    setErro(null)
    setMode('view')
  }, [api, paraForm])

  const carregarTudo = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.listar({})
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
  }, [api, carregarForm])

  useEffect(() => { carregarTudo() }, [carregarTudo])

  const carregarAcesso = useCallback(async (b = buscaGeral) => {
    setFLoading(true)
    try {
      const params = b.trim() ? { busca: b.trim() } : {}
      const res = await api.listar(params)
      setFResultados(res.ok ? res.data || [] : [])
      setSelecionados(new Set())
      setPagina(1)
    } catch {
      setFResultados([])
    } finally {
      setFLoading(false)
    }
  }, [api, buscaGeral])

  // ── Navegacao no form ───────────────────────────────────────────────
  function navTo(idx) {
    if (idx < 0 || idx >= registros.length) return
    setCurrentIdx(idx)
    carregarForm(registros[idx])
  }

  function openNew() {
    setForm({
      ...emptyForm,
      ...(novoCodigo ? { codigo: novoCodigo(registros) } : {}),
    })
    setErro(null)
    setMode('new')
  }

  function handleDesistir() {
    if (currentIdx >= 0 && registros[currentIdx]) carregarForm(registros[currentIdx])
    else { setForm(emptyForm); setMode('view') }
    setErro(null)
  }

  async function handleGravar() {
    const msg = validar(form)
    if (msg) { setErro(msg); return }
    setSaving(true)
    setErro(null)
    try {
      const payload = paraPayload(form)
      const res = mode === 'new'
        ? await api.criar(payload)
        : await api.atualizar({ id: form.id, ...payload })
      if (!res.ok) { setErro(res.erro); return }
      setMode('view')
      const resLista = await api.listar({})
      const lista = resLista.ok ? resLista.data || [] : []
      setRegistros(lista)
      const idx = lista.findIndex(r => r.id === res.data.id)
      if (idx >= 0) setCurrentIdx(idx)
      await carregarForm(res.data)
      if (fResultados) await carregarAcesso()
    } finally {
      setSaving(false)
    }
  }

  async function confirmarExclusao() {
    setConfirmExcluir(false)
    const res = await api.excluir(form.id)
    if (!res.ok) { setErro(res.erro); return }
    const resLista = await api.listar({})
    const lista = resLista.ok ? resLista.data || [] : []
    setRegistros(lista)
    if (lista.length) {
      const ni = Math.min(currentIdx, lista.length - 1)
      setCurrentIdx(ni)
      await carregarForm(lista[ni])
    } else {
      setForm(emptyForm)
      setCurrentIdx(-1)
      setMode('view')
    }
    if (fResultados) await carregarAcesso()
  }

  // Seleciona uma linha da tabela da aba Acesso -> abre no form (aba Cadastro).
  function selecionarLinha(registroFiltrado) {
    const idx = registros.findIndex(r => r.id === registroFiltrado.id)
    if (idx < 0) return
    setCurrentIdx(idx)
    carregarForm(registros[idx])
  }

  // ── Selecao em massa ────────────────────────────────────────────────
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

  // ── Derivados de paginacao ──────────────────────────────────────────
  const totalFiltrado = fResultados?.length || 0
  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / porPagina))
  const registrosPagina = useMemo(
    () => (fResultados || []).slice((pagina - 1) * porPagina, pagina * porPagina),
    [fResultados, pagina, porPagina]
  )
  const isRO = mode === 'view'

  return {
    // dados
    registros, loading, currentIdx, mode, form, saving, erro, isRO,
    confirmExcluir,
    // aba acesso
    filtrosAbertos, setFiltrosAbertos, buscaGeral, setBuscaGeral,
    fResultados, fLoading, pagina, setPagina, porPagina, setPorPagina,
    totalFiltrado, totalPaginas, registrosPagina,
    // selecao
    selecionados, setSelecionados, toggleSelecionado,
    todosSelecionados, toggleSelecionarTodos,
    // acoes
    setForm, setErro, setMode, setConfirmExcluir,
    carregarTudo, carregarAcesso, carregarForm,
    navTo, openNew, handleDesistir, handleGravar, confirmarExclusao,
    selecionarLinha,
  }
}
