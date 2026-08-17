import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, ChevronRight, Star } from 'lucide-react'

const MODOS_MODAL = [
  { val: 'iniciando', label: 'Iniciando' },
  { val: 'contendo',  label: 'Contendo'  },
  { val: 'igual',     label: 'Igual'     },
]

const thS = { padding: '7px 12px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1.2, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)', background: 'var(--s1)', textAlign: 'left' }
const tdS = { padding: '7px 12px', fontSize: 11.5, color: 'var(--t2)', borderBottom: '1px solid var(--bd)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 180 }

// Modal genérico "Pesquisa Padrão" (botão Consultar), compartilhado entre
// telas do FormBuilder e Arquivos. A busca real fica por conta de cada
// chamador via `onBuscar`; este componente só cuida de UI/estado de busca.
export default function PesquisaPadraoModal({
  titulo, campos, colunasExibidas, campoInicial, mostrarFavorito,
  onBuscar, onSelecionar, onFechar, renderCelula,
}) {
  const [campo, setCampo]           = useState(campoInicial)
  const [ordem, setOrdem]           = useState('asc')
  const [modo, setModo]             = useState('contendo')
  const [busca, setBusca]           = useState('')
  const [resultados, setResultados] = useState([])
  const [selId, setSelId]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [total, setTotal]           = useState(0)
  const [limitado, setLimitado]     = useState(false)
  const buscaRef = useRef(null)
  const debounceRef = useRef(null)

  const executarBusca = useCallback(async (c, o, m, b) => {
    setLoading(true)
    try {
      const res = await onBuscar(c, m, b, c, o)
      setResultados(res.registros || [])
      setTotal(res.total ?? (res.registros || []).length)
      setLimitado(!!res.limitado)
      setSelId(prev => (res.registros || []).find(r => r.id === prev) ? prev : (res.registros?.[0]?.id ?? null))
    } catch {
      setResultados([]); setTotal(0); setLimitado(false); setSelId(null)
    } finally {
      setLoading(false)
    }
  }, [onBuscar])

  // Carrega ao abrir e sempre que campo/ordem/modo mudam (sem debounce,
  // são trocas discretas de select/rádio, não digitação).
  useEffect(() => {
    executarBusca(campo, ordem, modo, busca)
    setTimeout(() => buscaRef.current?.focus(), 60)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campo, ordem, modo])

  function onChangeBusca(v) {
    setBusca(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => executarBusca(campo, ordem, modo, v), 250)
  }

  function confirmar() {
    const r = resultados.find(r => r.id === selId)
    if (r) onSelecionar(r)
  }

  const colunas = colunasExibidas || campos.slice(0, 5)

  // Renderizado via portal direto no body: telas que abrem este modal por
  // cima de outro modal (ex: EventoModal da Agenda) têm um ancestral com
  // backdrop-filter, que cria um containing block para position:fixed e
  // encolhe/confina o modal ao tamanho do pai. O portal escapa disso.
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }}>
      <div
        style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14, boxShadow: 'var(--sh-lg)', width: 920, maxWidth: '96vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onKeyDown={e => {
          if (e.key === 'Escape') onFechar()
          if (e.key === 'Enter') confirmar()
        }}
      >
        {/* cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', background: 'var(--s2)', borderBottom: '1px solid var(--bd)' }}>
          <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--t1)' }}>{titulo}</span>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 2 }}><X size={15} /></button>
        </div>

        {/* controles */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bd)', background: 'var(--s3)', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t2)', whiteSpace: 'nowrap', minWidth: 26 }}>Por:</label>
              <select className="form-select" style={{ flex: 1, height: 30, fontSize: 12 }} value={campo}
                onChange={e => setCampo(e.target.value)}>
                {campos.map(c => <option key={c.nome_campo} value={c.nome_campo}>{c.label}</option>)}
              </select>
              <select className="form-select" style={{ width: 124, height: 30, fontSize: 12 }} value={ordem}
                onChange={e => setOrdem(e.target.value)}>
                <option value="asc">Crescente</option>
                <option value="desc">Decrescente</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t2)', whiteSpace: 'nowrap', minWidth: 46 }}>Buscar:</label>
              <input ref={buscaRef} className="form-input" style={{ flex: 1, height: 30, fontSize: 12 }} value={busca}
                onChange={e => onChangeBusca(e.target.value)}
                placeholder="Digite para filtrar..." />
            </div>
            {limitado && (
              <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>
                Mostrando os primeiros {resultados.length} de {total} registros. Refine a busca para ver mais resultados.
              </div>
            )}
          </div>
          <div style={{ border: '1px solid var(--bd)', borderRadius: 10, padding: '8px 14px', background: 'var(--s1)', boxShadow: 'var(--sh-xs)', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>Buscar</div>
            {MODOS_MODAL.map(m => (
              <label key={m.val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11.5, color: modo === m.val ? 'var(--t1)' : 'var(--t3)', fontWeight: modo === m.val ? 600 : 400, userSelect: 'none', marginBottom: 3 }}>
                <input type="radio" checked={modo === m.val}
                  onChange={() => setModo(m.val)}
                  style={{ accentColor: 'var(--or)', cursor: 'pointer' }} />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        {/* grid de resultados */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--t3)', fontSize: 12 }}>Carregando registros...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={{ ...thS, width: 20, padding: '7px 4px' }}></th>
                  <th style={{ ...thS, textAlign: 'center' }}>ID</th>
                  {colunas.map(c => <th key={c.nome_campo} style={thS}>{c.label}</th>)}
                  {mostrarFavorito && <th style={{ ...thS, textAlign: 'center' }}>Fav.</th>}
                </tr>
              </thead>
              <tbody>
                {resultados.map((r, ri) => {
                  const isSel = selId === r.id
                  return (
                    <tr key={r.id}
                      onClick={() => setSelId(r.id)}
                      onDoubleClick={() => onSelecionar(r)}
                      style={{ cursor: 'pointer', background: isSel ? 'rgba(255,107,43,.06)' : ri % 2 !== 0 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--s3)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = isSel ? 'rgba(255,107,43,.06)' : ri % 2 !== 0 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                    >
                      <td style={{ padding: '7px 4px', width: 20, textAlign: 'center', color: 'var(--or)' }}>
                        {isSel ? <ChevronRight size={12} strokeWidth={2.5} /> : null}
                      </td>
                      <td style={{ ...tdS, textAlign: 'center', color: 'var(--t3)', fontSize: 11, fontFamily: 'monospace' }}>{r.id}</td>
                      {colunas.map((c, ci) => (
                        <td key={c.nome_campo} style={{ ...tdS, color: ci === 0 ? 'var(--t1)' : 'var(--t2)', fontWeight: ci === 0 ? 500 : 400 }}>
                          {renderCelula ? renderCelula(r, c) : String(r[c.nome_campo] ?? '')}
                        </td>
                      ))}
                      {mostrarFavorito && (
                        <td style={{ ...tdS, textAlign: 'center' }}>
                          {r.favorito ? <Star size={12} fill="var(--or)" color="var(--or)" /> : <span style={{ color: 'var(--bd2)' }}></span>}
                        </td>
                      )}
                    </tr>
                  )
                })}
                {resultados.length === 0 && (
                  <tr><td colSpan={colunas.length + (mostrarFavorito ? 3 : 2)} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)', fontSize: 11, fontStyle: 'italic' }}>Nenhum registro encontrado</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* rodapé */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderTop: '1px solid var(--bd)', background: 'var(--s3)' }}>
          <button className="btn btn-primary" onClick={confirmar} disabled={!selId} title="Confirmar (Enter)">
            <Check size={13} /> Confirmar
          </button>
          <button className="btn btn-ghost" onClick={onFechar} title="Fechar (Esc)">
            <X size={13} /> Fechar
          </button>
          <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 4 }}>
            {resultados.length} registro{resultados.length !== 1 ? 's' : ''}
            {selId ? '. Enter ou duplo clique para abrir' : '. Selecione uma linha'}
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}
