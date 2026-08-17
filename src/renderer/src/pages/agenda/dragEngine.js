// Motor de drag-and-drop imperativo (sem React state): enquanto arrasta,
// um CLONE do card (fora da árvore do React) segue o mouse via style.left/
// top em requestAnimationFrame; o card original nunca é tocado/movido
// diretamente, só recebe uma classe CSS (.agenda-dragging-source) pra ficar
// visualmente oculto. Isso evita mexer em qualquer propriedade que o React
// controla via style={{...}} no card real: tentar "desfazer" manipulações
// nesse nó depois (mesmo com removeProperty) dessincroniza a árvore de
// reconciliação do React do DOM real, e foi a causa do evento sumir
// permanentemente ao arrastar nas views Dia/Semana. Só o mouseup volta a
// tocar em React (via onDrop).
const THRESHOLD_PX = 4

export function createDragEngine({ onDrop }) {
  let pending = null // { ev, el, startX, startY }
  let dragging = null // { ev, sourceEl, clone, offsetX, offsetY, lastTarget, rafId }

  function start(ev, mouseEvent) {
    const el = mouseEvent.currentTarget
    mouseEvent.preventDefault()
    pending = { ev, el, startX: mouseEvent.clientX, startY: mouseEvent.clientY }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function beginDrag(mouseEvent) {
    const { ev, el } = pending
    pending = null
    const rect = el.getBoundingClientRect()

    const clone = el.cloneNode(true)
    clone.classList.add('agenda-drag-clone')
    clone.style.position = 'fixed'
    clone.style.zIndex = '1500'
    clone.style.left = rect.left + 'px'
    clone.style.top = rect.top + 'px'
    clone.style.width = rect.width + 'px'
    clone.style.height = rect.height + 'px'
    clone.style.margin = '0'
    clone.style.cursor = 'grabbing'
    clone.style.boxShadow = '0 8px 24px rgba(0,0,0,.35)'
    clone.style.pointerEvents = 'none'
    document.body.appendChild(clone)

    el.classList.add('agenda-dragging-source')

    dragging = {
      ev, sourceEl: el, clone,
      offsetX: mouseEvent.clientX - rect.left,
      offsetY: mouseEvent.clientY - rect.top,
      lastTarget: null,
      rafId: null,
    }
  }

  function onMove(e) {
    if (!dragging && pending) {
      const moved = Math.abs(e.clientX - pending.startX) > THRESHOLD_PX
        || Math.abs(e.clientY - pending.startY) > THRESHOLD_PX
      if (!moved) return
      beginDrag(e)
    }
    if (!dragging) return
    if (dragging.rafId) return
    dragging.rafId = requestAnimationFrame(() => {
      if (!dragging) return
      dragging.rafId = null
      dragging.clone.style.left = (e.clientX - dragging.offsetX) + 'px'
      dragging.clone.style.top  = (e.clientY - dragging.offsetY) + 'px'

      const under = document.elementFromPoint(e.clientX, e.clientY)
      const cell = under?.closest('[data-agenda-slot]') || null
      if (cell !== dragging.lastTarget) {
        dragging.lastTarget?.classList.remove('agenda-drop-target')
        cell?.classList.add('agenda-drop-target')
        dragging.lastTarget = cell
      }
    })
  }

  function onUp(e) {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    pending = null
    if (!dragging) return
    const { ev, sourceEl, clone, lastTarget, rafId } = dragging
    dragging = null
    if (rafId) cancelAnimationFrame(rafId)

    lastTarget?.classList.remove('agenda-drop-target')
    clone.remove()
    sourceEl.classList.remove('agenda-dragging-source')

    const iso = lastTarget?.getAttribute('data-agenda-slot') ?? null
    const horaAttr = lastTarget?.getAttribute('data-agenda-hora')
    const hora = horaAttr == null ? null : Number(horaAttr)
    onDrop(ev, iso, hora)
  }

  return { start }
}
