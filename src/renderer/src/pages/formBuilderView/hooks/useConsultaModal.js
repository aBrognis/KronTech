import { useState } from 'react'

// Encapsula a abertura/seleção do modal "Pesquisa Padrão"; a busca em si
// agora é feita server-side pelo próprio PesquisaPadraoModal via onBuscar
// (window.api.formBuilder.pesquisarRegistros), não mais em memória aqui.
export function useConsultaModal({ tela, registros, currentIdx, carregarForm, carregar, setCurrentIdx, setMode, setActiveTab }) {
  const [showConsulta, setShowConsulta] = useState(false)
  const [campoInicial, setCampoInicial] = useState('id')

  function abrirConsulta() {
    const camposVisiveis = tela?.campos.filter(c => c.ativo && c.tipo !== 'divisor' && c.tipo !== 'botao') || []
    setCampoInicial(camposVisiveis[0]?.nome_campo || 'id')
    setShowConsulta(true)
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
    showConsulta, setShowConsulta, campoInicial,
    abrirConsulta, selecionarDaConsulta,
  }
}
