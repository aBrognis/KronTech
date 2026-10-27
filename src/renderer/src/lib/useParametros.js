import { useEffect, useState } from 'react'

// Hook pras telas consultarem uma flag de comportamento (kr_parametros_001)
// sem bater no IPC toda vez. Unico hook/estado "global" real do projeto -
// nao ha Context/Provider em lugar nenhum do renderer; o mecanismo de
// propagacao de mudanca e o mesmo CustomEvent leve ja usado por
// krontech:config-changed / krontech:telas-updated (ver Sidebar.jsx /
// Configuracoes.jsx), NAO um Context novo.
//
// Uso: const { valor, carregando } = useParametro('agenda.meet_grava_automatico')
//      if (valor) { ...dispara a integracao... }
//
// Quem edita o parametro (pages/Parametros.jsx) dispara
// window.dispatchEvent(new CustomEvent('krontech:parametros-changed')) ao
// salvar - este hook escuta e rebusca.
export function useParametro(chave) {
  const [valor, setValor] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let vivo = true
    async function carregar() {
      setCarregando(true)
      try {
        const res = await window.api.parametros.obter(chave)
        if (vivo) setValor(res.ok ? res.data : null)
      } finally {
        if (vivo) setCarregando(false)
      }
    }
    carregar()
    window.addEventListener('krontech:parametros-changed', carregar)
    return () => { vivo = false; window.removeEventListener('krontech:parametros-changed', carregar) }
  }, [chave])

  return { valor, carregando }
}
