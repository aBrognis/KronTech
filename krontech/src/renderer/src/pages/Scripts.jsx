import { useState } from 'react'
import '../App.css'

const SCRIPTS = [
  { tipo: 'SQL',          tipoCss: 'rgba(96,165,250,.1)',  tipoCor: '#60A5FA', titulo: 'Consulta financeiro por cliente com saldo devedor',   tags: ['financeiro','receber','postgresql'], code: 'SELECT E.NOME, SUM(R.VALOR2) AS VL_RECEBER FROM RECEBER_001 R...', fav: true },
  { tipo: 'Pascal / FR3', tipoCss: 'rgba(167,139,250,.1)', tipoCor: '#A78BFA', titulo: 'OnBeforePrint — totalização por grupo no GroupFooter', tags: ['fr3','pascal','totais'],             code: 'procedure GroupFooter1OnBeforePrint(Sender: TfrBand); begin Total :=...', fav: false },
  { tipo: 'FR3 · IIF',   tipoCss: 'rgba(74,222,128,.1)',  tipoCor: '#4ADE80', titulo: 'IIF status pagamento com cor condicional no memo',     tags: ['iif','fr3','financeiro'],            code: "IIF([STATUS]='PAGO','Pago',IIF([STATUS]='ATRASADO','Em atraso','Pendente'))", fav: true },
]

const FILTROS = ['Todos', 'SQL', 'Pascal', 'FR3', '⭐ Favoritos']

export default function Scripts() {
  const [filtro, setFiltro] = useState('Todos')
  return (
    <>
      <input className="search-input" placeholder="🔍  Buscar por título, tag ou conteúdo..." />
      <div className="filters">
        {FILTROS.map(f => (
          <button key={f} className={`filter-btn${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)}>{f}</button>
        ))}
      </div>
      {SCRIPTS.map(s => (
        <div key={s.titulo} className="sect" style={{ cursor: 'pointer', transition: 'var(--tr)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--or)'; e.currentTarget.style.background = 'var(--s3)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd)';  e.currentTarget.style.background = 'var(--s2)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 8, letterSpacing: 2, padding: '3px 8px', borderRadius: 4, fontWeight: 700, background: s.tipoCss, color: s.tipoCor }}>{s.tipo}</span>
            <span style={{ color: s.fav ? 'var(--or)' : 'var(--t3)', fontSize: 14 }}>{s.fav ? '★' : '☆'}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--t1)', fontWeight: 500, marginBottom: 6 }}>{s.titulo}</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {s.tags.map(t => <span key={t} style={{ fontSize: 9, color: 'var(--t3)', background: 'var(--bd)', padding: '2px 7px', borderRadius: 3 }}>{t}</span>)}
          </div>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: '#6BAA6B', background: '#070707', borderRadius: 6, padding: '8px 10px', borderLeft: '2px solid #4ADE80', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {s.code}
          </div>
        </div>
      ))}
    </>
  )
}
