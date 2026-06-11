import '../App.css'

export default function Placeholder({ icon, title, desc, btn }) {
  return (
    <div className="sect" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, textAlign: 'center', gap: 12, flex: 1 }}>
      <div style={{ fontSize: 40 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--ft)', fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.7, maxWidth: 300 }}>{desc}</div>
      <button style={{
        padding: '8px 20px', borderRadius: 'var(--r3)', fontSize: 12, fontFamily: 'var(--fb)',
        cursor: 'pointer', background: 'rgba(255,107,43,.08)', border: '1px solid var(--or)',
        color: 'var(--or)', marginTop: 8, transition: 'var(--tr)'
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--or)'; e.currentTarget.style.color = '#fff' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,107,43,.08)'; e.currentTarget.style.color = 'var(--or)' }}
      >{btn}</button>
    </div>
  )
}
