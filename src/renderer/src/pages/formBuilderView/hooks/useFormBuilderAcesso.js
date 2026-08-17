import { useState } from 'react'

// Encapsula a aba "Acesso": filtros por coluna (server-side, via
// fb:listarRegistrosFiltrado) e paginação real. Nenhuma consulta roda
// automaticamente, só ao clicar "Buscar" (tabelas grandes não devem ser
// carregadas por padrão ao abrir a aba). Paginação e ordenação, uma vez que
// já existe um resultado carregado, aplicam de imediato.
export function useFormBuilderAcesso({ nomeTabela, tela, registros, carregarForm, carregar, setCurrentIdx, setMode, setActiveTab }) {
  const [fFiltros,    setFFiltrosState] = useState({})   // { nome_campo: {op,valor,valor2} }
  const [fBusca,      setFBusca]      = useState('')
  const [fPagina,     setFPagina]     = useState(1)
  const [fPorPagina,  setFPorPagina]  = useState(50)
  const [fOrdenar,    setFOrdenar]    = useState(null)
  const [fDirecao,    setFDirecao]    = useState('ASC')
  const [fResultados, setFResultados] = useState(null) // { registros, total, totalPaginas } | null
  const [fLoading,    setFLoading]    = useState(false)

  function serializeFiltros(filtrosObj) {
    return Object.entries(filtrosObj)
      .filter(([, f]) => f)
      .map(([campo, f]) => ({ campo, ...f }))
  }

  async function executarConsulta(overrides = {}) {
    if (!nomeTabela) return
    setFLoading(true)
    try {
      const res = await window.api.formBuilder.listarRegistrosFiltrado(nomeTabela, {
        filtros: serializeFiltros(overrides.fFiltros ?? fFiltros),
        busca: overrides.fBusca ?? fBusca,
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

  // Filtro/busca só atualizam estado local; a query roda ao clicar "Buscar".
  function setFiltroCampo(nomeCampo, filtro) {
    setFFiltrosState(f => ({ ...f, [nomeCampo]: filtro }))
  }

  function limparFiltroCampo(nomeCampo) {
    setFiltroCampo(nomeCampo, null)
  }

  function handleBuscar() {
    setFPagina(1)
    executarConsulta({ fPagina: 1 })
  }

  function irParaPagina(p) {
    const max = fResultados?.totalPaginas || 1
    const alvo = Math.max(1, Math.min(max, p))
    setFPagina(alvo)
    executarConsulta({ fPagina: alvo })
  }

  function mudarPorPagina(n) {
    setFPorPagina(n)
    setFPagina(1)
    executarConsulta({ fPorPagina: n, fPagina: 1 })
  }

  function setOrdenacao(nomeCampo) {
    const novaDir = fOrdenar === nomeCampo && fDirecao === 'ASC' ? 'DESC' : 'ASC'
    setFOrdenar(nomeCampo)
    setFDirecao(novaDir)
    executarConsulta({ fOrdenar: nomeCampo, fDirecao: novaDir })
  }

  // Só limpa os campos de filtro, não reconsulta. Os registros já exibidos
  // permanecem na tela até o usuário clicar "Buscar" de novo.
  function limparFiltrosAcesso() {
    setFFiltrosState({})
    setFBusca('')
  }

  function selecionarDaAcesso(r) {
    const idx = registros.findIndex(reg => reg.id === r.id)
    if (idx >= 0) { setCurrentIdx(idx); carregarForm(tela, registros[idx]) }
    else { carregar(tela, 1, '').then(() => {}) }
    setMode('view'); setActiveTab('cadastro')
  }

  return {
    fFiltros, setFiltroCampo, limparFiltroCampo,
    fBusca, setFBusca,
    fResultados, fLoading,
    fPagina, fPorPagina, irParaPagina, mudarPorPagina,
    fOrdenar, fDirecao, setOrdenacao,
    limparFiltrosAcesso, selecionarDaAcesso, handleBuscar,
  }
}
