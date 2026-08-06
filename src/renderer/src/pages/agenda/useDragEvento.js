import { useRef, useState, useCallback, useEffect } from 'react'

// Drag-and-drop nativo (sem lib), mesmo padrão de refs + listeners globais
// de mouse já usado no Designer do FormBuilder. O alvo do drop é resolvido
// por elementFromPoint no mouseup (via atributos data-agenda-slot/-hora),
// em vez de handlers de hover por célula — mais barato numa grade com
// dezenas/centenas de células (mês: até 42, semana/dia: até 168).
export function useDragEvento({ onDrop }) {
  const [draggingId, setDraggingId] = useState(null)
  const [draggingEvento, setDraggingEvento] = useState(null)
  const [mousePos, setMousePos] = useState(null)
  const dragState = useRef(null)

  const startDrag = useCallback((ev, e) => {
    e.preventDefault()
    dragState.current = { evento: ev, startX: e.clientX, startY: e.clientY, moved: false }
    setDraggingId(ev.id)
  }, [])

  useEffect(() => {
    if (!draggingId) return

    function onMove(e) {
      const st = dragState.current
      if (!st) return
      if (!st.moved && (Math.abs(e.clientX - st.startX) > 4 || Math.abs(e.clientY - st.startY) > 4)) {
        st.moved = true
        document.body.style.cursor = 'none' // cursor nativo escalado fica borrado em telas de alto DPI; usa DragGhost/DragCursor em HTML no lugar
        setDraggingEvento(st.evento)
      }
      if (st.moved) setMousePos({ x: e.clientX, y: e.clientY })
    }

    function onUp(e) {
      const st = dragState.current
      dragState.current = null
      setDraggingId(null)
      setDraggingEvento(null)
      setMousePos(null)
      document.body.style.cursor = 'auto'
      if (!st?.moved) return // clique simples sem arrastar — não interfere no onClick de abrir o modal
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const target = el?.closest('[data-agenda-slot]')
      if (!target) return
      const iso = target.getAttribute('data-agenda-slot')
      const horaAttr = target.getAttribute('data-agenda-hora')
      const hora = horaAttr === null ? null : Number(horaAttr)
      onDrop(st.evento, iso, hora)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = 'auto'
    }
  }, [draggingId, onDrop])

  return { draggingId, draggingEvento, mousePos, startDrag }
}
