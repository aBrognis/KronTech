// Inicializado por App.jsx via _initNavegacao(handleNavigate)
let _navigate = null
const _history = []

export function _initNavegacao(navigateFn) {
  _navigate = navigateFn
}

export function abrirTela(nomeTela) {
  if (!_navigate) { console.warn('[navegacao] _initNavegacao não foi chamado'); return }
  _history.push(nomeTela)
  _navigate(nomeTela)
}

export function irPara(rota) {
  abrirTela(rota)
}

export function voltarTela() {
  if (!_navigate || _history.length < 2) return
  _history.pop()
  _navigate(_history[_history.length - 1])
}

export function abrirModal(idModal) {
  try {
    const el = document.getElementById(idModal)
    if (el) { el.style.display = 'flex'; el.setAttribute('aria-hidden', 'false') }
    else console.warn(`[navegacao] Modal #${idModal} não encontrado`)
  } catch (err) { console.error('abrirModal:', err) }
}

export function fecharModal(idModal) {
  try {
    const el = document.getElementById(idModal)
    if (el) { el.style.display = 'none'; el.setAttribute('aria-hidden', 'true') }
    else console.warn(`[navegacao] Modal #${idModal} não encontrado`)
  } catch (err) { console.error('fecharModal:', err) }
}

export function abrirEmNovaAba(url) {
  try {
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (err) { console.error('abrirEmNovaAba:', err) }
}
