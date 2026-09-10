import { useState, useMemo, useRef, useEffect } from 'react'
import { SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw, Search, Plus } from 'lucide-react'
import ColumnFilter from './filters/ColumnFilter.jsx'

// Painel de filtros avançados da aba Acesso do FormBuilder. Mesmo conceito
// do components/PainelFiltrosGrid.jsx: nao despeja todos os campos de uma
// vez.
//  - sempre visiveis: a busca geral + os campos de data + os adicionados +
//    os que ja tem valor;
//  - "+ Adicionar filtro" (na barra do titulo) abre a lista das demais.
const TIPOS_DATA = new Set(['data', 'data_hora', 'hora'])
// Filtros "de peso" do ERP: datas, FK (lookup) e escolha fixa (select/radio)
// ficam sempre no painel; select/radio so quando tem opcoes.
function ehFixo(c) {
  if (TIPOS_DATA.has(c.tipo)) return true
  if (c.tipo === 'lookup') return true
  if ((c.tipo === 'select' || c.tipo === 'radio') && Array.isArray(c.opcoes) && c.opcoes.length) return true
  return false
}
function ehLargo(c) {
  if (c.tipo === 'lookup') return true
  const n = Array.isArray(c.opcoes) ? c.opcoes.length : 0
  if ((c.tipo === 'select' || c.tipo === 'radio') && n > 3) return true
  return false
}

export default function PainelFiltros({ camposData, fFiltros, setFiltroCampo, fBusca, setFBusca, pastasSugest, lookupOpcoes, limparFiltrosAcesso, onBuscar, fLoading }) {
  const [aberto, setAberto] = useState(true)
  const camposFiltraveis = useMemo(
    () => camposData.filter(c => !['senha', 'divisor', 'botao', 'copiar'].includes(c.tipo)),
    [camposData]
  )
  const qtdAtivos = Object.values(fFiltros).filter(Boolean).length

  const [adicionados, setAdicionados] = useState(() => new Set())
  const comValor = useMemo(
    () => new Set(Object.entries(fFiltros).filter(([, v]) => v).map(([k]) => k)),
    [fFiltros]
  )
  const fixo = ehFixo
  const visiveis = camposFiltraveis.filter(c => fixo(c) || adicionados.has(c.nome_campo) || comValor.has(c.nome_campo))
  const disponiveis = camposFiltraveis.filter(c => !fixo(c) && !adicionados.has(c.nome_campo) && !comValor.has(c.nome_campo))

  const [menuAberto, setMenuAberto] = useState(false)
  const [menuBusca, setMenuBusca] = useState('')
  const menuRef = useRef(null)
  useEffect(() => {
    if (!menuAberto) return
    const fora = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAberto(false) }
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [menuAberto])

  function adicionar(nomeCampo) {
    setAdicionados(prev => new Set(prev).add(nomeCampo))
    setMenuAberto(false); setMenuBusca('')
  }
  function limparTudo() {
    setAdicionados(new Set())
    limparFiltrosAcesso()
  }

  const menuFiltrado = menuBusca.trim()
    ? disponiveis.filter(c => (c.label || '').toLowerCase().includes(menuBusca.trim().toLowerCase()))
    : disponiveis

  return (
    <div style={{ border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', boxShadow: 'var(--sh-xs)', marginBottom: 10, overflow: 'visible' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', userSelect: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, minWidth: 0 }}
          onClick={() => setAberto(a => !a)}>
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
              onClick={() => setMenuAberto(a => !a)}>
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
                    value={menuBusca} onChange={e => setMenuBusca(e.target.value)} />
                </div>
                {menuFiltrado.map(c => (
                  <button key={c.id} type="button" onClick={() => adicionar(c.nome_campo)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 12px', fontSize: 12, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--t1)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--s2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
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
          onClick={() => setAberto(a => !a)}>
          {aberto ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {aberto && (
        <div style={{ padding: '4px 14px 14px', borderTop: '1px solid var(--bd)', paddingTop: 12 }}
          onKeyDown={e => e.key === 'Enter' && onBuscar()}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 12, alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
              <label className="form-label">Busca geral</label>
              <input className="form-input form-input-sm"
                value={fBusca} onChange={e => setFBusca(e.target.value)}
                placeholder="buscar em todos os campos..." />
            </div>

            {visiveis.map(c => (
              <div key={c.id} className="form-group" style={{ margin: 0, minWidth: 0, gridColumn: ehLargo(c) ? 'span 2' : undefined }}>
                <label className="form-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
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
