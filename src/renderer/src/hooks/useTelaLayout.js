import { useState, useEffect } from 'react'

/**
 * Carrega o layout de uma tela de sistema do banco.
 * Retorna { campos, telaId, loading } onde `campos` é o array de
 * kr_tela_campos com x_pos, y_pos, w_px, h_px já resolvidos.
 *
 * Se a tela não existir no banco ainda, retorna campos = null
 * (o componente usa o layout hardcoded como fallback).
 */
export function useTelaLayout(slug) {
  const [campos,  setCampos]  = useState(null)
  const [telaId,  setTelaId]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) { setLoading(false); return }
    setLoading(true)
    window.api.formBuilder.getTelaPorSlug(slug)
      .then(tela => {
        if (tela?.campos?.length) {
          setTelaId(tela.id)
          setCampos(tela.campos.filter(c => c.ativo !== false))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  // Retorna mapa por nome_campo para acesso rápido
  const campoMap = campos
    ? Object.fromEntries(campos.map(c => [c.nome_campo, c]))
    : null

  return { campos, campoMap, telaId, loading }
}
