// Solucoes.jsx
import { useState } from 'react'
import '../App.css'

const SOLUCOES = [
  {
    cat: 'PostgreSQL', catCss: 'rgba(96,165,250,.1)', catCor: '#60A5FA', fav: true,
    problema: 'Trigger não dispara no login real do sistema mas funciona no DBeaver',
    causa: 'Função com definição cacheada / stale no PostgreSQL',
    solucao: 'Executar DROP FUNCTION ... CASCADE antes de recriar. DDL pelo DBeaver com conexão direta — não pelo sistema que bloqueia via tabela LOG.',
    tags: ['trigger', 'plpgsql', 'dbeaver']
  },
  {
    cat: 'Fiscal / SEFAZ', catCss: 'rgba(251,210,76,.1)', catCor: '#FBD24C', fav: false,
    problema: 'Rejeição 531 — Total dos produtos diferente do somatório dos itens',
    causa: 'Item com indTot=0 somando indevidamente no total da NF',
    solucao: 'Verificar natureza fiscal dos itens de remessa/amostra. Configurar indTot=0 nas operações que não devem compor o total. Conferir regra fiscal e operação fiscal no cadastro.',
    tags: ['rejeição 531', 'indTot', 'nfe']
  },
  {
    cat: 'FR3', catCss: 'rgba(74,222,128,.1)', catCor: '#4ADE80', fav: false,
    problema: 'Imagem não carrega no relatório — campo TfrPictureView vazio',
    causa: 'Caminho relativo ou arquivo inexistente sem fallback configurado',
    solucao: 'Verificar caminho absoluto C:\\SISTEMA\\FOTO\\MATERIAL\\. Implementar fallback para SEM_IMAGEM.JPG com FileExists() no Pascal Script antes de atribuir ao Picture.',
    tags: ['imagem', 'fr3', 'pascal']
  },
]

const FILTROS = ['Todas', 'PostgreSQL', 'FR3', 'Fiscal / SEFAZ', 'Electron']

export default function Solucoes() {
  const [filtro, setFiltro] = useState('Todas')
  return (
    <>
      <input className="search-input" placeholder="🔍  Buscar problema, causa ou solução..." />
      <div className="filters">
        {FILTROS.map(f => (
          <button key={f} className={`filter-btn${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)}>{f}</button>
        ))}
      </div>
      {SOLUCOES.map(s => (
        <div key={s.problema} className="sect" style={{ cursor: 'pointer', transition: 'var(--tr)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--or)'; e.currentTarget.style.background = 'var(--s3)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd)';  e.currentTarget.style.background = 'var(--s2)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 8, letterSpacing: 2, padding: '3px 8px', borderRadius: 4, fontWeight: 700, background: s.catCss, color: s.catCor }}>{s.cat}</span>
            <span style={{ color: s.fav ? 'var(--or)' : 'var(--t3)', fontSize: 14 }}>{s.fav ? '★' : '☆'}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--t1)', fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>{s.problema}</div>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 3 }}>
            <strong style={{ color: '#FBD24C' }}>Causa:</strong> {s.causa}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t2)', lineHeight: 1.5, borderLeft: '2px solid var(--or)', paddingLeft: 8, marginTop: 8 }}>
            {s.solucao}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--bd)' }}>
            {s.tags.map(t => <span key={t} style={{ fontSize: 9, color: 'var(--t3)', background: 'var(--bd)', padding: '2px 7px', borderRadius: 3 }}>{t}</span>)}
          </div>
        </div>
      ))}
    </>
  )
}
