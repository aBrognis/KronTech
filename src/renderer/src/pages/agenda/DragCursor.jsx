// Substitui o cursor "grabbing" nativo do SO (que fica borrado em telas de
// alto DPI dentro do Electron) por um ícone desenhado em HTML/SVG, sempre
// nítido independente de escala do Windows.
export default function DragCursor({ mousePos }) {
  if (!mousePos) return null
  return (
    <svg
      width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="var(--t1)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{
        position:'fixed',
        left: Math.round(mousePos.x - 4), top: Math.round(mousePos.y - 4),
        zIndex:2001, pointerEvents:'none',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.5))',
      }}
    >
      <path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M11 11.5V5a1.5 1.5 0 0 1 3 0v7" />
      <path d="M14 10.5V6a1.5 1.5 0 0 1 3 0v8" />
      <path d="M17 9.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2a6 6 0 0 1-5.4-3.4l-2-4A1.5 1.5 0 1 1 7 13" fill="var(--s1)" />
    </svg>
  )
}
