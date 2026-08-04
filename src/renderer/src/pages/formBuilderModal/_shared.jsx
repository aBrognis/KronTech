import * as LucideIcons from 'lucide-react'
import { TIPOS } from './constants.js'

export function lucideName(str) {
  return str.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
}

export function IconPreview({ name, size = 18 }) {
  const Icon = LucideIcons[lucideName(name || '')]
  if (!Icon) return <span style={{ fontSize: 10, color: 'var(--t3)', fontStyle: 'italic' }}>?</span>
  return <Icon size={size} />
}

export function TipoCampoInfo({ tipo }) {
  const info = TIPOS.find(t => t.valor === tipo)
  if (!info) return null
  return (
    <div style={{ marginTop: 4, padding: '7px 10px', background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8, boxShadow: 'var(--sh-sm)', fontSize: 11, lineHeight: 1.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontWeight: 700, color: 'var(--t1)' }}>{info.label}</span>
        <code style={{ fontFamily: 'monospace', fontSize: 10, background: 'var(--s3)', padding: '1px 6px', borderRadius: 4, color: 'var(--or)' }}>{info.pg}</code>
      </div>
      <div style={{ color: 'var(--t2)', marginBottom: 2 }}>{info.desc}</div>
      <div style={{ color: 'var(--t3)', fontSize: 10 }}><span style={{ fontWeight: 600 }}>Ex: </span>{info.ex}</div>
    </div>
  )
}

export function Sec({ title, children }) {
  return (
    <div style={{ borderBottom: '1px solid var(--bd)' }}>
      <div style={{ padding: '6px 12px', background: 'var(--s2)', fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8 }}>{title}</div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  )
}

export function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 24 }}>
      <span style={{ fontSize: 11, color: 'var(--t2)', flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{children}</div>
    </div>
  )
}
