import { useState } from 'react'
import { SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw, Search } from 'lucide-react'
import FilterTexto from '../pages/formBuilderView/filters/FilterTexto.jsx'
import FilterNumero from '../pages/formBuilderView/filters/FilterNumero.jsx'
import FilterData from '../pages/formBuilderView/filters/FilterData.jsx'
import FilterExato from '../pages/formBuilderView/filters/FilterExato.jsx'
import FilterBooleano from '../pages/formBuilderView/filters/FilterBooleano.jsx'

// Painel de filtros da aba Acesso das TELAS NATIVAS.
//
// Toda tela nativa com aba Acesso usa este componente: um filtro por coluna
// consultavel, tipado, em grade responsiva num painel retratil, mais uma
// busca geral. Filtros so aplicam ao clicar "Buscar" (ou Enter). Reusa os
// Filter* do FormBuilder, que ja sao genericos.
//
// Regra (docs/CLAUDE.md §4): NAO reduzir a aba Acesso a "so os filtros
// basicos". Se a tabela tem a coluna, o usuario tem que poder filtrar por
// ela aqui.
//
// props:
//   colunas: [{ chave, label, tipo, opcoes? }]
//     tipo: 'texto' | 'numero' | 'data' | 'booleano' | 'exato'
//     opcoes (so tipo 'exato'): [{ valor, label }]
//   valores: { <chave>: { op, valor, valor2 } | null }
//   onChange(chave, filtroOuNull)
//   onBuscar()  onLimpar()  fLoading
//   busca, onBusca  (a busca geral, string)
export default function PainelFiltrosGrid({
  colunas = [], valores = {}, onChange, onBuscar, onLimpar, fLoading,
  busca = '', onBusca,
}) {
  const [aberto, setAberto] = useState(true)
  const qtdAtivos = Object.values(valores).filter(Boolean).length + (busca.trim() ? 1 : 0)

  const renderFiltro = (c) => {
    const v = valores[c.chave]
    const set = (f) => onChange(c.chave, f)
    switch (c.tipo) {
      case 'numero':   return <FilterNumero value={v} onChange={set} />
      case 'data':     return <FilterData campo={{ tipo: 'data' }} value={v} onChange={set} />
      case 'booleano': return <FilterBooleano value={v} onChange={set} />
      case 'exato':    return <FilterExato campo={{ tipo: 'select', nome_campo: c.chave, opcoes: c.opcoes || [] }} value={v} onChange={set} />
      default:         return <FilterTexto value={v} onChange={set} />
    }
  }

  return (
    <div style={{ border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', boxShadow: 'var(--sh-xs)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setAberto((a) => !a)}>
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
            onClick={(e) => { e.stopPropagation(); onLimpar() }}>
            <RotateCcw size={11} /> Limpar
          </button>
        )}
        {aberto ? <ChevronUp size={13} color="var(--t3)" /> : <ChevronDown size={13} color="var(--t3)" />}
      </div>

      {aberto && (
        <div style={{ padding: '4px 14px 14px', borderTop: '1px solid var(--bd)', paddingTop: 12 }}
          onKeyDown={(e) => e.key === 'Enter' && onBuscar()}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10, marginBottom: 12 }}>
            <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
              <label className="form-label">Busca geral</label>
              <input className="form-input form-input-sm" value={busca}
                onChange={(e) => onBusca(e.target.value)}
                placeholder="buscar em todos os campos de texto..." />
            </div>
            {colunas.map((c) => (
              <div key={c.chave} className="form-group" style={{ margin: 0, minWidth: 0 }}>
                <label className="form-label" title={c.label}
                  style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.label}
                </label>
                {renderFiltro(c)}
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
