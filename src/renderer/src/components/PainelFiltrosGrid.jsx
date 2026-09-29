import { useState, useMemo, useRef, useEffect } from 'react'
import { SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw, Search, Plus } from 'lucide-react'
import FilterTexto from '../pages/formBuilderView/filters/FilterTexto.jsx'
import FilterNumero from '../pages/formBuilderView/filters/FilterNumero.jsx'
import FilterData from '../pages/formBuilderView/filters/FilterData.jsx'
import FilterExato from '../pages/formBuilderView/filters/FilterExato.jsx'
import FilterBooleano from '../pages/formBuilderView/filters/FilterBooleano.jsx'
import FilterLookup from './filtros/FilterLookup.jsx'
import FilterExatoMulti from './filtros/FilterExatoMulti.jsx'

// Painel de filtros da aba Acesso das TELAS NATIVAS.
//
// Toda tela nativa com aba Acesso usa este componente. O usuario pode
// filtrar por QUALQUER coluna consultavel (regra CLAUDE.md §4), mas o painel
// nao despeja os 30+ filtros de uma vez:
//  - sempre visiveis: os filtros de DATA / FK (lookup) / escolha-fixa multi,
//    mais os que o usuario adicionou e os que ja tem valor;
//  - "+ Adicionar filtro" (na barra do titulo) abre a lista das demais
//    colunas. Um filtro adicionado some sozinho quando fica sem valor.
//
// props:
//   colunas: [{ chave, label, tipo, opcoes?, multi?, tabela?, campoLabel?, camposBusca? }]
//     tipo: 'texto' | 'numero' | 'data' | 'booleano' | 'exato' | 'lookup'
//     opcoes (tipo 'exato'): [{ valor, label }]. multi:true -> checkboxes.
//     tipo 'lookup': tabela, campoValor?, campoLabel, camposBusca[] -> lupa.
//   Regra CLAUDE.md §4: toda FK (_id) e 'lookup'; toda escolha fixa e multi.
//   valores: { <chave>: { op, valor, valor2 } | null }
//   onChange(chave, filtroOuNull)
//   onBuscar()  onLimpar()  fLoading
export default function PainelFiltrosGrid({
  colunas = [], valores = {}, onChange, onBuscar, onLimpar, fLoading,
}) {
  const [aberto, setAberto] = useState(true)
  const [adicionados, setAdicionados] = useState(() => new Set())

  const comValor = useMemo(
    () => new Set(Object.entries(valores).filter(([, v]) => v).map(([k]) => k)),
    [valores]
  )
  // Fixos (sempre no painel): datas e lookups (FK) - os filtros que o usuario
  // quase sempre quer. Os checkboxes de escolha fixa (Papel, Status, UF...)
  // sao muitos e ocupam muito espaco, entao entram por "Adicionar filtro" ou
  // quando ja tem valor. `fixo: true` na coluna forca a exibicao.
  const fixo = (c) => c.fixo === true || c.tipo === 'data' || c.tipo === 'lookup'
  const visiveis = colunas.filter((c) => fixo(c) || adicionados.has(c.chave) || comValor.has(c.chave))
  const disponiveis = colunas.filter((c) => !fixo(c) && !adicionados.has(c.chave) && !comValor.has(c.chave))

  const qtdAtivos = comValor.size

  const [menuAberto, setMenuAberto] = useState(false)
  const [menuBusca, setMenuBusca] = useState('')
  const menuRef = useRef(null)
  useEffect(() => {
    if (!menuAberto) return
    const fora = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAberto(false) }
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [menuAberto])

  function adicionar(chave) {
    setAdicionados((prev) => new Set(prev).add(chave))
    setMenuAberto(false); setMenuBusca('')
  }
  function limparTudo() {
    setAdicionados(new Set())
    onLimpar()
  }

  const renderFiltro = (c) => {
    const v = valores[c.chave]
    const set = (f) => onChange(c.chave, f)
    switch (c.tipo) {
      case 'numero':   return <FilterNumero value={v} onChange={set} />
      case 'data':     return <FilterData campo={{ tipo: 'data' }} value={v} onChange={set} />
      case 'booleano': return <FilterBooleano value={v} onChange={set} />
      case 'lookup':
        return (
          <FilterLookup
            tabela={c.tabela}
            campoValor={c.campoValor || 'id'}
            campoLabel={c.campoLabel || 'nome'}
            camposBusca={c.camposBusca || []}
            titulo={c.tituloModal || `Consultar ${c.label}`}
            placeholder={c.placeholder || 'Todos'}
            value={v}
            onChange={set}
          />
        )
      case 'exato':
        return c.multi
          ? <FilterExatoMulti opcoes={c.opcoes || []} value={v} onChange={set} compacto={(c.opcoes || []).length > 12} />
          : <FilterExato campo={{ tipo: 'select', nome_campo: c.chave, opcoes: c.opcoes || [] }} value={v} onChange={set} />
      default:         return <FilterTexto value={v} onChange={set} />
    }
  }

  // Filtros largos ocupam 2 colunas da grade.
  const spanDe = (c) =>
    c.tipo === 'lookup' || (c.tipo === 'exato' && c.multi && (c.opcoes || []).length > 3) ? 'span 2' : undefined

  const menuFiltrado = menuBusca.trim()
    ? disponiveis.filter((c) => c.label.toLowerCase().includes(menuBusca.trim().toLowerCase()))
    : disponiveis

  return (
    <div style={{ border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', boxShadow: 'var(--sh-xs)', overflow: 'visible' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', userSelect: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, minWidth: 0 }}
          onClick={() => setAberto((a) => !a)}>
          <SlidersHorizontal size={13} color="var(--t2)" />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Filtros</span>
          {qtdAtivos > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: 'var(--or3)', color: 'var(--or)' }}>
              {qtdAtivos} ativo{qtdAtivos !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {aberto && disponiveis.length > 0 && (
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button type="button" className="btn btn-ghost" style={{ height: 24, padding: '0 8px', fontSize: 11 }}
              onClick={() => setMenuAberto((a) => !a)}>
              <Plus size={11} /> Adicionar filtro
            </button>
            {menuAberto && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4,
                minWidth: 240, maxWidth: 300, maxHeight: 340, overflowY: 'auto',
                background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8, boxShadow: 'var(--sh-lg)',
              }}>
                <div style={{ padding: 6, borderBottom: '1px solid var(--bd)', position: 'sticky', top: 0, background: 'var(--s1)' }}>
                  <input className="form-input form-input-sm" autoFocus placeholder="Buscar campo..."
                    value={menuBusca} onChange={(e) => setMenuBusca(e.target.value)} />
                </div>
                {menuFiltrado.map((c) => (
                  <button key={c.chave} type="button" onClick={() => adicionar(c.chave)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 12px', fontSize: 12, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--t1)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    {c.label}
                  </button>
                ))}
                {menuFiltrado.length === 0 && (
                  <div style={{ padding: '10px 12px', fontSize: 11.5, color: 'var(--t3)', fontStyle: 'italic' }}>Nenhum campo</div>
                )}
              </div>
            )}
          </div>
        )}

        {(qtdAtivos > 0 || adicionados.size > 0) && (
          <button type="button" className="btn btn-ghost" style={{ height: 24, padding: '0 8px', fontSize: 11 }}
            onClick={limparTudo}>
            <RotateCcw size={11} /> Limpar
          </button>
        )}
        <button type="button" style={{ display: 'flex', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--t3)', padding: 0 }}
          onClick={() => setAberto((a) => !a)}>
          {aberto ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {aberto && (
        <div style={{ padding: '14px', borderTop: '1px solid var(--bd)' }}
          onKeyDown={(e) => e.key === 'Enter' && onBuscar()}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '14px 16px', marginBottom: 16, alignItems: 'start' }}>
            {visiveis.map((c) => (
              <div key={c.chave} className="form-group" style={{ margin: 0, minWidth: 0, gridColumn: spanDe(c) }}>
                <label className="form-label" title={c.label}
                  style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 5 }}>
                  {c.label}
                </label>
                {renderFiltro(c)}
              </div>
            ))}
          </div>

          <button type="button" className="btn btn-primary" style={{ height: 34, padding: '0 20px' }}
            onClick={onBuscar} disabled={fLoading}>
            <Search size={13} /> {fLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      )}
    </div>
  )
}
