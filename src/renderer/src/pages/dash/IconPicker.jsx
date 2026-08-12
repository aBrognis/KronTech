import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { LucideIcon, getAllIcons } from './icons'

// Seletor de ícone Lucide usado no formulário de widget do Designer —
// dropdown com busca, grid de resultados, fecha ao clicar fora.
export function IconPicker({ value, onChange, color }) {
  const [open,       setOpen]       = useState(false)
  const [searchIcon, setSearchIcon] = useState('')
  const ref = useRef(null)
  const allIcons = getAllIcons()

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const iconFiltered = searchIcon
    ? allIcons.filter(n => n.includes(searchIcon.toLowerCase().replace(/\s+/g, '-')))
    : allIcons

  return (
    <div style={{ position:'relative' }} ref={ref}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', border:'1px solid var(--bd)', borderRadius:7, cursor:'pointer', background:'var(--s2)', userSelect:'none' }}
      >
        <LucideIcon name={value || 'image-off'} size={14} color={color || '#FF6B2B'} />
        <span style={{ flex:1, fontSize:11, color: value ? 'var(--t1)' : 'var(--t3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {value || 'Selecionar...'}
        </span>
        <ChevronDown size={11} style={{ color:'var(--t3)', transition:'transform .15s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </div>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:300, background:'var(--bg)', border:'1px solid var(--bd)', borderRadius:9, boxShadow:'0 8px 28px rgba(0,0,0,.35)', padding:8, minWidth:220 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 8px', background:'var(--s2)', borderRadius:6, marginBottom:6 }}>
            <Search size={11} style={{ color:'var(--t3)', flexShrink:0 }} />
            <input
              autoFocus
              value={searchIcon}
              onChange={e => setSearchIcon(e.target.value)}
              placeholder="Buscar ícone..."
              style={{ background:'none', border:'none', outline:'none', fontSize:11, color:'var(--t1)', width:'100%' }}
            />
            {searchIcon && (
              <button onClick={() => setSearchIcon('')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--t3)', padding:0, lineHeight:1 }}>
                <X size={11} />
              </button>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, maxHeight:200, overflowY:'auto' }}>
            {iconFiltered.slice(0, 210).map(name => (
              <button
                key={name}
                title={name}
                onClick={() => { onChange(name); setOpen(false); setSearchIcon('') }}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', padding:6,
                  borderRadius:5, border:'none', cursor:'pointer',
                  background: value === name ? (color || '#FF6B2B') + '25' : 'transparent',
                  transition:'background .1s',
                }}
                onMouseEnter={e => { if (value !== name) e.currentTarget.style.background = 'var(--s3)' }}
                onMouseLeave={e => { if (value !== name) e.currentTarget.style.background = 'transparent' }}
              >
                <LucideIcon name={name} size={14} color={value === name ? (color || '#FF6B2B') : undefined} />
              </button>
            ))}
          </div>
          {iconFiltered.length > 210 && (
            <div style={{ fontSize:9, color:'var(--t3)', textAlign:'center', marginTop:4, padding:2 }}>
              +{iconFiltered.length - 210} ícones · refine a busca
            </div>
          )}
        </div>
      )}
    </div>
  )
}
