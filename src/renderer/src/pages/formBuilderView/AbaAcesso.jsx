import { Search, Loader2, RotateCcw, Download, Star } from 'lucide-react'
import { exportarCSV } from '../../lib/funcoes/index.js'

const thS = { padding: '7px 12px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1.2, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)', background: 'var(--s1)', textAlign: 'left' }
const tdS = { padding: '7px 12px', fontSize: 11.5, color: 'var(--t2)', borderBottom: '1px solid var(--bd)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 180 }

// Aba "Acesso": filtros dinâmicos + tabela de todos os registros da tela.
// Só lê tela/registros/dados de acesso via props — não toca no form de edição.
export default function AbaAcesso({
  tela, camposData, total, registros, currentIdx, setCurrentIdx, carregarForm,
  lookupOpcoes, pastasSugest, fmtSize, ExtIcon,
  fFiltros, setFFiltros, fBusca, setFBusca, fResultados, fConsultando, allLoading,
  handleConsultarAcesso, limparFiltrosAcesso, selecionarDaAcesso,
}) {
  const camposFiltro = camposData.filter(c => ['select','radio','pasta'].includes(c.tipo))
  const listaExibir  = fResultados ?? []
  const renderCell   = (c, reg) => {
    const v   = reg[c.nome_campo]
    const ops = Array.isArray(c.opcoes) ? c.opcoes : []
    if (c.tipo === 'booleano') return v ? '✓' : '—'
    if (c.tipo === 'radio' || c.tipo === 'select') {
      const op = ops.find(o => o.valor === v)
      return op ? <span style={{ color: op.cor||'var(--t2)', fontWeight: 600 }}>{op.label}</span> : String(v ?? '—')
    }
    if (c.tipo === 'lookup') {
      const lbl = (lookupOpcoes[c.nome_campo] || []).find(o => o.id === Number(v))?.label
      return lbl || (v ? `#${v}` : '—')
    }
    if (c.tipo === 'arquivo') {
      let meta = null; try { meta = v ? JSON.parse(v) : null } catch {}
      if (!meta) return '—'
      return <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ExtIcon ext={meta.ext} size={12} /><span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{meta.nome}</span><span style={{ fontSize:9.5, color:'var(--t3)', flexShrink:0 }}>{fmtSize(meta.tamanho)}</span></span>
    }
    if (c.tipo === 'avaliacao') {
      const nota = Number(v)||0, max = Number(c.opcoes?.max)||5
      return nota ? <span style={{ color:'#FBBF24' }}>{'★'.repeat(nota)}{'☆'.repeat(Math.max(0,max-nota))}</span> : '—'
    }
    if (c.tipo === 'cor') return v ? <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><span style={{ width:11, height:11, borderRadius:3, background:v, border:'1px solid var(--bd)', display:'inline-block' }}/>{v}</span> : '—'
    if (c.tipo === 'progresso') {
      const pct = Math.max(0,Math.min(100,Number(v)||0))
      return <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:50, height:5, background:'var(--s3)', borderRadius:3, overflow:'hidden', display:'inline-block' }}><span style={{ display:'block', height:'100%', width:`${pct}%`, background: pct<40?'#22c55e':pct<70?'#eab308':'#ef4444', borderRadius:3 }}/></span>{pct}%</span>
    }
    return String(v ?? '—')
  }
  return (
    <>
      {/* Barra de filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', pointerEvents: 'none' }} />
          <input className="form-input" style={{ paddingLeft: 30, height: 34 }}
            placeholder={`Buscar${camposData.filter(c=>c.campo_busca).length ? ' (' + camposData.filter(c=>c.campo_busca).map(c=>c.label).join(', ') + ')' : '...'}...`}
            value={fBusca} onChange={e => setFBusca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConsultarAcesso()} autoFocus />
        </div>
        {camposFiltro.map(c => {
          const vals = pastasSugest[c.nome_campo] || []
          const ops  = Array.isArray(c.opcoes) ? c.opcoes : []
          return (
            <select key={c.id} className="form-select" style={{ height: 34, minWidth: 130, maxWidth: 180 }}
              value={fFiltros[c.nome_campo] || '__todos__'}
              onChange={e => setFFiltros(f => ({ ...f, [c.nome_campo]: e.target.value }))}>
              <option value="__todos__">Todos — {c.label}</option>
              {ops.length
                ? ops.map(o => <option key={o.valor} value={o.valor}>{o.label}</option>)
                : vals.map(v => <option key={v} value={v}>{v || '(vazio)'}</option>)
              }
            </select>
          )
        })}
        <button className="btn btn-primary" style={{ height: 34, padding: '0 14px', flexShrink: 0 }} onClick={handleConsultarAcesso} disabled={fConsultando || allLoading}>
          {(fConsultando || allLoading) ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={13} />} {(fConsultando || allLoading) ? 'Carregando...' : 'Consultar'}
        </button>
        <button className="btn btn-ghost" style={{ height: 34, padding: '0 10px', flexShrink: 0 }} onClick={limparFiltrosAcesso} title="Limpar filtros">
          <RotateCcw size={13} />
        </button>
        <button className="btn btn-ghost" style={{ height: 34, padding: '0 10px', flexShrink: 0, marginLeft: 'auto' }}
          disabled={!fResultados?.length}
          onClick={() => {
            const dados = listaExibir.map(reg => {
              const obj = {}
              camposData.forEach(c => { obj[c.label] = reg[c.nome_campo] ?? '' })
              return obj
            })
            exportarCSV(dados, `${tela?.nome_tela || 'dados'}.csv`)
          }}>
          <Download size={13} /> Exportar CSV
        </button>
      </div>

      {/* Estado inicial */}
      {fResultados === null && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)' }}>
          <Search size={32} strokeWidth={1.25} style={{ marginBottom: 10, opacity: .4 }} />
          <div style={{ fontSize: 13 }}>Configure os filtros e clique em Consultar</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>{total.toLocaleString('pt-BR')} registro{total !== 1 ? 's' : ''} no total</div>
        </div>
      )}

      {/* Tabela de resultados */}
      {fResultados !== null && (
        <div style={{ border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--sh-xs)' }}>
          <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 270px)', minHeight: 100 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={{ ...thS, width: 18, padding: '7px 0 7px 8px' }}></th>
                  <th style={{ ...thS, textAlign: 'center', width: 36 }}>#</th>
                  {camposData.map(c => <th key={c.id} style={thS}>{c.label}</th>)}
                  {tela.col_favorito !== false && <th style={{ ...thS, textAlign: 'center' }}>Fav.</th>}
                </tr>
              </thead>
              <tbody>
                {listaExibir.map((reg, ri) => {
                  const isCur = registros[currentIdx]?.id === reg.id
                  return (
                    <tr key={reg.id}
                      onClick={() => { const idx = registros.findIndex(r => r.id === reg.id); if (idx >= 0) { setCurrentIdx(idx); carregarForm(tela, registros[idx]) } }}
                      onDoubleClick={() => selecionarDaAcesso(reg)}
                      style={{ cursor: 'pointer', background: isCur ? 'rgba(255,107,43,.06)' : ri % 2 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                      onMouseEnter={e => { if (!isCur) e.currentTarget.style.background = 'var(--s3)' }}
                      onMouseLeave={e => { if (!isCur) e.currentTarget.style.background = ri % 2 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                    >
                      <td style={{ padding: '7px 0 7px 8px', width: 18, color: 'var(--or)', fontSize: 13, fontWeight: 700 }}>{isCur ? '›' : ''}</td>
                      <td style={{ ...tdS, textAlign: 'center', color: 'var(--t3)', fontSize: 10 }}>{ri + 1}</td>
                      {camposData.map(c => (
                        <td key={c.id} style={tdS}>{renderCell(c, reg)}</td>
                      ))}
                      {tela.col_favorito !== false && (
                        <td style={{ ...tdS, textAlign: 'center' }}>
                          {reg.favorito ? <Star size={12} fill="var(--or)" color="var(--or)" /> : <span style={{ color: 'var(--bd2)' }}>—</span>}
                        </td>
                      )}
                    </tr>
                  )
                })}
                {listaExibir.length === 0 && (
                  <tr><td colSpan={camposData.length + 2} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)', fontSize: 11, fontStyle: 'italic' }}>Nenhum registro encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '6px 12px', borderTop: '1px solid var(--bd)', background: 'var(--s1)', fontSize: 10, color: 'var(--t3)' }}>
            Total: <strong style={{ color: 'var(--t2)' }}>{listaExibir.length}</strong>
            {listaExibir.length !== total && <span> (de {total.toLocaleString('pt-BR')} carregados)</span>}
          </div>
        </div>
      )}
    </>
  )
}
