import { useState } from 'react'

// ── Collapsible panel section ─────────────────────────────────────────────────
export function CollapseBox({ title, children, defaultOpen = true, noPad = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border:'1px solid var(--bd)', borderRadius:8, flexShrink:0 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'var(--s2)', border:'none', borderRadius: open ? '8px 8px 0 0' : 8,
        cursor:'pointer', padding:'6px 10px',
        fontSize:10, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:.6,
        fontFamily:'inherit',
      }}>
        {title}
        <span style={{ fontSize:10, color:'var(--t3)', transition:'transform .15s', display:'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </button>
      {open && <div style={noPad ? {} : { padding:'8px 10px', display:'flex', flexDirection:'column', gap:6 }}>{children}</div>}
    </div>
  )
}

// ── Context menu item ─────────────────────────────────────────────────────────
export function CtxItem({ icon: Icon, label, shortcut, onClick, danger, disabled }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: 'calc(100% - 8px)', margin: '1px 4px',
        border: 'none', background: hov ? 'var(--s3)' : 'none',
        borderRadius: 6, padding: '5px 10px', cursor: disabled ? 'default' : 'pointer',
        textAlign: 'left', fontSize: 12,
        color: disabled ? 'var(--t3)' : danger ? 'var(--red)' : 'var(--t1)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {Icon && <Icon size={12} style={{ flexShrink: 0 }} />}
      <span style={{ flex: 1 }}>{label}</span>
      {shortcut && <span style={{ fontSize: 10, color: 'var(--t3)' }}>{shortcut}</span>}
    </button>
  )
}

// ── Toolbar button ────────────────────────────────────────────────────────────
export function TbBtn({ children, title, onClick, active, danger, disabled }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        border: `1px solid ${active ? 'var(--or)' : 'var(--bd)'}`,
        borderRadius: 7, background: active ? 'rgba(255,107,43,.12)' : hov ? 'var(--s3)' : 'var(--s2)',
        cursor: disabled ? 'default' : 'pointer',
        padding: '4px 8px',
        color: danger ? 'var(--red)' : active ? 'var(--or)' : 'var(--t2)',
        fontSize: 11, fontFamily: 'inherit',
        opacity: disabled ? 0.4 : 1,
        transition: 'var(--tr)',
      }}
    >
      {children}
    </button>
  )
}
