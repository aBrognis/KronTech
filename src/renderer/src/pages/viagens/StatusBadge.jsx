import { STATUS_META } from './utils'

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.rascunho
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
      background: meta.cor + '1c', color: meta.cor, border: `1px solid ${meta.cor}44`,
      textTransform: 'uppercase', letterSpacing: .3,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.cor }} />
      {meta.label}
    </span>
  )
}
