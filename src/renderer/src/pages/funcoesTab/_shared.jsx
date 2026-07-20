// ── Helpers de storage ────────────────────────────────────────────────────────
export function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

export async function carregarSecao(chave, fallback = []) {
  try { const res = await window.api.config.get(); return res.ok ? (res.data?.[chave] ?? fallback) : fallback }
  catch { return fallback }
}
export async function salvarSecao(chave, valor) {
  try { await window.api.config.setSection(chave, valor) } catch { /* sem config */ }
}

// ── Primitivos de UI ──────────────────────────────────────────────────────────
export function Btn({ children, variant = 'primary', size = 'md', disabled, onClick, title, style }) {
  const h = size === 'sm' ? 28 : 32
  const fs = size === 'sm' ? 11 : 12
  return (
    <button className={`btn btn-${variant}`} style={{ height: h, fontSize: fs, flexShrink: 0, ...style }}
      disabled={disabled} onClick={onClick} title={title}>
      {children}
    </button>
  )
}

export function FInput({ label, style, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 100, ...style }}>
      {label && <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', letterSpacing: .5 }}>{label}</label>}
      <input className="form-input" style={{ height: 32 }} {...props} />
    </div>
  )
}

export function FSelect({ label, style, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 110, ...style }}>
      {label && <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', letterSpacing: .5 }}>{label}</label>}
      <select className="form-select" style={{ height: 32 }} {...props}>{children}</select>
    </div>
  )
}

export function FTextarea({ label, style, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, ...style }}>
      {label && <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', letterSpacing: .5 }}>{label}</label>}
      <textarea className="form-input" style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, padding: '8px 10px', ...props.style }} {...props} />
    </div>
  )
}

export function Row({ children, gap = 8 }) {
  return <div style={{ display: 'flex', gap, alignItems: 'flex-end', flexWrap: 'wrap' }}>{children}</div>
}

export function SectionTitle({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 }}>{children}</div>
}

export function StatusBadge({ ativo }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, letterSpacing: .3,
      background: ativo ? 'rgba(74,222,128,.12)' : 'var(--s3)',
      color: ativo ? 'var(--green)' : 'var(--t3)',
      border: `1px solid ${ativo ? 'rgba(74,222,128,.25)' : 'var(--bd)'}` }}>
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  )
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: 'var(--t3)', textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--s2)', border: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} strokeWidth={1.25} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12 }}>{subtitle}</div>
      </div>
      {action}
    </div>
  )
}

export function Card({ children, style }) {
  return (
    <div style={{ background: 'var(--s1)', border: '1.5px solid var(--bd)', borderRadius: 12, padding: '14px 16px', boxShadow: 'var(--sh-xs)', ...style }}>
      {children}
    </div>
  )
}
