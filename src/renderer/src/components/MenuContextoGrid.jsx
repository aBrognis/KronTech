import { useEffect } from 'react'
import { createPortal } from 'react-dom'

// Menu de contexto (botao direito) para grids. Usado nas abas Acesso de
// Despesas de Viagem e Documentos Gerados pra "Alterar status" em massa.
//
// Props:
//   pos    : { x, y } | null  — posicao do clique; null = fechado
//   onFechar()
//   titulo : string opcional no topo (ex: "3 selecionados")
//   itens  : [{ label, onClick, disabled?, danger?, separadorAntes? }]
//
// Fecha no primeiro clique fora ou Esc. Renderizado via portal pra escapar
// de qualquer overflow:hidden do grid.
export default function MenuContextoGrid({ pos, onFechar, titulo, itens = [] }) {
  useEffect(() => {
    if (!pos) return
    const fechar = () => onFechar()
    const onKey = (e) => { if (e.key === 'Escape') onFechar() }
    // setTimeout pra nao pegar o mesmo evento que abriu o menu.
    const t = setTimeout(() => {
      window.addEventListener('click', fechar, { once: true })
      window.addEventListener('contextmenu', fechar, { once: true })
      window.addEventListener('keydown', onKey)
    }, 0)
    return () => {
      clearTimeout(t)
      window.removeEventListener('click', fechar)
      window.removeEventListener('contextmenu', fechar)
      window.removeEventListener('keydown', onKey)
    }
  }, [pos, onFechar])

  if (!pos) return null

  // Nao deixa o menu sair da tela.
  const largura = 200
  const x = Math.min(pos.x, window.innerWidth - largura - 8)
  const y = Math.min(pos.y, window.innerHeight - (itens.length * 34 + 40))

  return createPortal(
    <div
      onClick={e => e.stopPropagation()}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation() }}
      style={{
        position: 'fixed', left: x, top: y, zIndex: 9999, minWidth: largura,
        background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 10,
        boxShadow: 'var(--sh-lg)', padding: '6px 0', fontSize: 12.5,
      }}>
      {titulo && (
        <div style={{ padding: '4px 14px 6px', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--t3)' }}>
          {titulo}
        </div>
      )}
      {itens.map((it, i) => (
        <div key={i}>
          {it.separadorAntes && <div style={{ height: 1, background: 'var(--bd)', margin: '4px 0' }} />}
          <button
            type="button"
            disabled={it.disabled}
            onClick={() => { if (!it.disabled) { it.onClick?.(); onFechar() } }}
            style={{
              display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent',
              padding: '7px 14px', fontSize: 12.5, cursor: it.disabled ? 'default' : 'pointer',
              color: it.disabled ? 'var(--t3)' : it.danger ? 'var(--red)' : 'var(--t1)',
            }}
            onMouseEnter={e => { if (!it.disabled) e.currentTarget.style.background = 'var(--s3, var(--s1))' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            {it.label}
          </button>
        </div>
      ))}
    </div>,
    document.body
  )
}
