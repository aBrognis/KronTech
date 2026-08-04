import { useState } from 'react'

// Encapsula a aba "Acesso": filtros dinamicos por campo, busca textual e
// listagem de todos os registros da tela, carregados sob demanda.
export function useFormBuilderAcesso({ nomeTabela, tela, registros, allItems, setAllItems, tiposSistema, filtrarStr, carregarForm, carregar, setCurrentIdx, setMode, setActiveTab }) {
  const [fConsultando, setFConsultando] = useState(false)
  const [fFiltros,    setFFiltros]    = useState({})   // { nome_campo: valor_selecionado }
  const [fBusca,      setFBusca]      = useState('')
  const [fResultados, setFResultados] = useState(null) // null = aguardando, [] = consultado
  const [allLoading,  setAllLoading]  = useState(false)

  async function loadAllAcesso() {
    setAllLoading(true)
    try {
      const res = await window.api.formBuilder.getAllRegistros(nomeTabela)
      if (!res.ok) throw new Error(res.erro)
      setAllItems(res.data.registros)
      return res.data.registros
    } catch {
      return []
    } finally {
      setAllLoading(false)
    }
  }

  function executarConsultaAcesso(srcItems) {
    const src = Array.isArray(srcItems) ? srcItems : allItems
    const q = fBusca.toLowerCase().trim()
    const camposData = (tela?.campos?.filter(c => c.ativo) || []).filter(c => !tiposSistema.includes(c.tipo))
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

  return {
    fConsultando, fFiltros, setFFiltros, fBusca, setFBusca, fResultados, allLoading,
    handleConsultarAcesso, limparFiltrosAcesso, selecionarDaAcesso,
  }
}
