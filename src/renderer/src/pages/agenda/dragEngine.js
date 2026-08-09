// Motor de drag-and-drop imperativo (sem React state) — o card real do
// evento é movido diretamente via style.left/top em requestAnimationFrame,
// fora do ciclo de render, para não travar em grades grandes (Semana/Dia
// têm até 168 células). Só o mouseup volta a tocar em React (via onDrop).
const THRESHOLD_PX = 4

export function createDragEngine({ onDrop }) {
  let pending = null // { ev, el, startX, startY }
  let dragging = null // { ev, el, placeholder, offsetX, offsetY, lastTarget, rafId }

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
    const placeholder = el.cloneNode(false)
    placeholder.classList.add('agenda-drag-placeholder')
    placeholder.style.opacity = '0'
    el.parentNode.insertBefore(placeholder, el)

    el.style.position = 'fixed'
    el.style.zIndex = '1500'
    el.style.left = rect.left + 'px'
    el.style.top = rect.top + 'px'
    el.style.width = rect.width + 'px'
    el.style.cursor = 'grabbing'
    el.style.boxShadow = '0 8px 24px rgba(0,0,0,.35)'
    el.style.pointerEvents = 'none'

    dragging = {
      ev, el, placeholder,
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
      dragging.el.style.left = (e.clientX - dragging.offsetX) + 'px'
      dragging.el.style.top  = (e.clientY - dragging.offsetY) + 'px'

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
    const { ev, el, placeholder, lastTarget, rafId } = dragging
    dragging = null
    if (rafId) cancelAnimationFrame(rafId)

    lastTarget?.classList.remove('agenda-drop-target')
    // Não "limpar" o style inline manualmente aqui: nas views Dia/Semana o
    // React controla top/left/width via style={{...}} com base no layout
    // calculado, e como o card mantém a mesma key (ev.id), o React reaproveita
    // o mesmo nó DOM no próximo render — se o valor recalculado for igual ao
    // anterior, o reconciliador NÃO reescreve essas props, e um el.style.left=''
    // feito aqui ficaria "vazando" pra sempre (era o bug do compromisso sumindo
    // ao arrastar). Em vez disso, o nó inteiro é removido do DOM: o próximo
    // render do React (disparado por loadEvents logo abaixo) recria o card do
    // zero com o style correto, sem nenhum resquício da manipulação manual.
    el.remove()
    placeholder.remove()

    // Sempre chama onDrop, mesmo sem célula de destino válida (soltou fora
    // da grade): o card já foi removido do DOM acima, então o handler
    // SEMPRE precisa recarregar os eventos pra ele reaparecer — passar
    // iso/hora null sinaliza "sem mudança real" pro handler.
    const iso = lastTarget?.getAttribute('data-agenda-slot') ?? null
    const horaAttr = lastTarget?.getAttribute('data-agenda-hora')
    const hora = horaAttr == null ? null : Number(horaAttr)
    onDrop(ev, iso, hora)
  }

  return { start }
}
