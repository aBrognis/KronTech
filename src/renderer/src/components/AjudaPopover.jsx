import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { HelpCircle } from 'lucide-react'

// Botao "?" generico com popover de ajuda. O popover e renderizado num
// PORTAL no body e posicionado por coordenadas do botao — nao e clipado
// pelo overflow de um modal e nunca sai da tela.
//
// Uso: <AjudaPopover>conteudo JSX aqui</AjudaPopover>
export function AjudaPopover({ children, largura = 320 }) {
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const popRef = useRef(null)

  useLayoutEffect(() => {
    if (!aberto || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const margem = 8
    let left = r.left
    if (left + largura > window.innerWidth - margem) left = window.innerWidth - margem - largura
    if (left < margem) left = margem

    // Abre pra baixo por padrao; se o espaco abaixo for pequeno E houver
    // mais espaco acima, ancora pela base do botao e cresce pra cima. Em
    // qualquer caso a altura e limitada ao espaco disponivel (rola dentro).
    const espacoAbaixo = window.innerHeight - r.bottom - margem
    const espacoAcima = r.top - margem
    const paraCima = espacoAbaixo < 260 && espacoAcima > espacoAbaixo
    setPos({
      left,
      ...(paraCima
        ? { bottom: window.innerHeight - r.top + 6, maxHeight: espacoAcima - 6 }
        : { top: r.bottom + 6, maxHeight: espacoAbaixo - 6 }),
    })
  }, [aberto, largura])

  useEffect(() => {
    if (!aberto) return
    const fora = e => {
      if (btnRef.current?.contains(e.target)) return
      if (popRef.current?.contains(e.target)) return
      setAberto(false)
    }
    const esc = e => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc) }
  }, [aberto])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setAberto(v => !v)}
        title="Ajuda"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 14, height: 14, padding: 0, borderRadius: '50%', flexShrink: 0,
          border: 'none', background: 'transparent', cursor: 'pointer',
          color: aberto ? 'var(--or)' : 'var(--t3)', verticalAlign: 'middle',
        }}
      >
        <HelpCircle size={12} />
      </button>
      {aberto && pos && createPortal(
        <div
          ref={popRef}
          style={{
            position: 'fixed', left: pos.left,
            ...(pos.top != null ? { top: pos.top } : { bottom: pos.bottom }),
            zIndex: 3000, width: largura, maxWidth: 'calc(100vw - 16px)',
            maxHeight: pos.maxHeight ? Math.max(120, pos.maxHeight) : undefined,
            overflowY: 'auto',
            background: 'var(--s1)', border: '1px solid var(--bd2)', borderRadius: 10,
            boxShadow: 'var(--sh-lg)', padding: '12px 14px',
            fontSize: 12, lineHeight: 1.55, color: 'var(--t1)', fontWeight: 400,
            textTransform: 'none', letterSpacing: 0, textAlign: 'left', whiteSpace: 'normal',
          }}
        >
          {children}
        </div>,
        document.body,
      )}
    </>
  )
}

// Label de formulario com o "?" logo apos o texto.
// Uso: <LabelComAjuda ajuda={<>...</>}>Nome do campo</LabelComAjuda>
export function LabelComAjuda({ children, ajuda, larguraAjuda }) {
  return (
    <label className="form-label" style={{ display: 'block', lineHeight: 1.3 }}>
      {children}
      {ajuda && <>{' '}<AjudaPopover largura={larguraAjuda}>{ajuda}</AjudaPopover></>}
    </label>
  )
}
