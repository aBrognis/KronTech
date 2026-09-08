import { useEffect } from 'react'

// Atalhos de teclado globais pra uma tela — J/K navega, C compõe, R
// responde, E arquiva, espaço marca lido/não lido, padrão Gmail. Ignora
// digitação normal (input/textarea/contentEditable) e desliga inteiro
// quando `ativo` é false (modal aberto etc.) como cinto de segurança além
// da checagem de foco.
export default function useAtalhosTeclado(mapa, ativo = true) {
  useEffect(() => {
    if (!ativo) return

    function handleKeyDown(e) {
      // Atalhos de UMA tecla so — nunca intercepta combinacoes com Ctrl /
      // Alt / Meta (Ctrl+C, Ctrl+V, Ctrl+A, atalhos do SO). Sem isso, a
      // tecla "c" mapeada pra "compor" engolia o Ctrl+C do usuario.
      if (e.ctrlKey || e.altKey || e.metaKey) return

      const alvo = e.target
      const digitando = alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable
        || alvo.closest?.('[contenteditable="true"]')
      if (digitando) return

      // Ha texto selecionado na pagina (o usuario quer copiar, nao acionar
      // atalho). getSelection vazio = sem selecao.
      const selecao = window.getSelection?.()
      if (selecao && !selecao.isCollapsed && String(selecao).trim()) return

      const tecla = e.key.toLowerCase()
      const acao = mapa[tecla]
      if (!acao) return
      e.preventDefault()
      acao(e)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mapa, ativo])
}
