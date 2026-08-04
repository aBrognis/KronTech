import { useState, useRef } from 'react'

// Encapsula o modal de "Pesquisa Padrão" (busca por campo/ordem/modo entre
// todos os registros da tela, com seleção via teclado ou duplo clique).
export function useConsultaModal({ tela, nomeTabela, registros, currentIdx, allItems, setAllItems, filtrarStr, carregarForm, carregar, setCurrentIdx, setMode, setActiveTab }) {
  const [showConsulta,  setShowConsulta]  = useState(false)
  const [mTodos,        setMTodos]        = useState([])
  const [mLoading,      setMLoading]      = useState(false)
  const [mCampo,        setMCampo]        = useState('')
  const [mOrdem,        setMOrdem]        = useState('asc')
  const [mModo,         setMModo]         = useState('contendo')
  const [mBusca,        setMBusca]        = useState('')
  const [mResultados,   setMResultados]   = useState([])
  const [mSelId,        setMSelId]        = useState(null)
  const mBuscaRef = useRef(null)

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
        if (!res.ok) throw new Error(res.erro)
        src = res.data.registros
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

  return {
    showConsulta, setShowConsulta, mTodos, mLoading, mCampo, setMCampo,
    mOrdem, setMOrdem, mModo, setMModo, mBusca, setMBusca, mResultados, mSelId, mBuscaRef,
    rodarModal, abrirConsulta, selecionarDaConsulta,
  }
}
