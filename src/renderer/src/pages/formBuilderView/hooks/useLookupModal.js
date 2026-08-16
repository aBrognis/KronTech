import { useState } from 'react'

// Encapsula o modal de seleção de lookup (busca opções da tabela referenciada,
// permite buscar/selecionar/confirmar/limpar).
export function useLookupModal({ form, setField }) {
  const [lkpModalOpen,    setLkpModalOpen]    = useState(false)
  const [lkpModalCampo,   setLkpModalCampo]   = useState(null)
  const [lkpModalTodos,   setLkpModalTodos]   = useState([])
  const [lkpModalBusca,   setLkpModalBusca]   = useState('')
  const [lkpModalLoading, setLkpModalLoading] = useState(false)
  const [lkpModalSelId,   setLkpModalSelId]   = useState(null)

  async function openLookupModal(campo) {
    const cfg = campo.opcoes || {}
    setLkpModalCampo(campo)
    setLkpModalOpen(true)
    setLkpModalLoading(true)
    setLkpModalBusca('')
    setLkpModalSelId(form[campo.nome_campo] ? Number(form[campo.nome_campo]) : null)
    try {
      if (cfg.lookupPesquisa) {
        // Origem "pesquisa customizada" (Monta Pesquisa): junta as colunas
        // exibidas configuradas para montar o label de cada opção.
        const res = await window.api.pesquisa.executar(cfg.lookupPesquisa, {})
        if (!res.ok) throw new Error(res.erro)
        const cols = (res.data.colunasExibidas || []).map(c => c.nome_campo)
        const opcoes = (res.data.registros || []).map(r => ({
          id: r.id,
          label: cols.length ? cols.map(c => r[c]).filter(Boolean).join(' — ') : `#${r.id}`,
        }))
        setLkpModalTodos(opcoes)
      } else {
        const res = await window.api.formBuilder.listarOpcoesLookup(cfg.lookupTabela, cfg.lookupExibir, cfg.lookupCodigo || '', cfg.lookupFiltro)
        if (!res.ok) throw new Error(res.erro)
        setLkpModalTodos(res.data)
      }
    } catch { setLkpModalTodos([]) }
    finally { setLkpModalLoading(false) }
  }

  function confirmarLookupModal() {
    if (lkpModalCampo) setField(lkpModalCampo.nome_campo, lkpModalSelId || null)
    setLkpModalOpen(false)
  }

  return {
    lkpModalOpen, setLkpModalOpen, lkpModalCampo, lkpModalTodos,
    lkpModalBusca, setLkpModalBusca, lkpModalLoading, lkpModalSelId, setLkpModalSelId,
    openLookupModal, confirmarLookupModal,
  }
}
