import { useState } from 'react'
import { SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw, Search } from 'lucide-react'
import ColumnFilter from './filters/ColumnFilter.jsx'

// Painel de filtros avançados: um campo de filtro por coluna, em grade
// responsiva, numa área retrátil acima da grade — em vez de embutido no
// cabeçalho da tabela. Filtros só aplicam ao clicar em "Buscar".
export default function PainelFiltros({ camposData, fFiltros, setFiltroCampo, fBusca, setFBusca, pastasSugest, lookupOpcoes, limparFiltrosAcesso, onBuscar, fLoading }) {
  const [aberto, setAberto] = useState(true)
  const camposFiltraveis = camposData.filter(c => !['senha', 'divisor', 'botao', 'copiar'].includes(c.tipo))
  const qtdAtivos = Object.values(fFiltros).filter(Boolean).length

  return (
    <div style={{ border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', boxShadow: 'var(--sh-xs)', marginBottom: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setAberto(a => !a)}>
        <SlidersHorizontal size={13} color="var(--t2)" />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Filtros</span>
        {qtdAtivos > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: 'var(--or3)', color: 'var(--or)' }}>
            {qtdAtivos} ativo{qtdAtivos !== 1 ? 's' : ''}
          </span>
        )}
        <div style={{ flex: 1 }} />
        {qtdAtivos > 0 && (
          <button type="button" className="btn btn-ghost" style={{ height: 24, padding: '0 8px', fontSize: 11 }}
            onClick={e => { e.stopPropagation(); limparFiltrosAcesso() }}>
            <RotateCcw size={11} /> Limpar
          </button>
        )}
        {aberto ? <ChevronUp size={13} color="var(--t3)" /> : <ChevronDown size={13} color="var(--t3)" />}
      </div>

      {aberto && (
        <div style={{ padding: '4px 14px 14px', borderTop: '1px solid var(--bd)', paddingTop: 12 }}
          onKeyDown={e => e.key === 'Enter' && onBuscar()}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
            <div style={{ minWidth: 0 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .4, display: 'block', marginBottom: 4 }}>
                Busca geral
              </label>
              <input className="form-input" style={{ height: 32, fontSize: 12, padding: '0 8px', width: '100%' }}
                value={fBusca} onChange={e => setFBusca(e.target.value)}
                placeholder="buscar em todos os campos..." />
            </div>
            {camposFiltraveis.map(c => (
              <div key={c.id} style={{ minWidth: 0 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .4, display: 'block', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  title={c.label}>
                  {c.label}
                </label>
                <ColumnFilter campo={c} value={fFiltros[c.nome_campo]}
                  onChange={f => setFiltroCampo(c.nome_campo, f)}
                  pastasSugest={pastasSugest} lookupOpcoes={lookupOpcoes} />
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-primary" style={{ height: 32, padding: '0 16px' }}
            onClick={onBuscar} disabled={fLoading}>
            <Search size={13} /> {fLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      )}
    </div>
  )
}
