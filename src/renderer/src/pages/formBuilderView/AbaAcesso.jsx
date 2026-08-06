import { Download, Star, ChevronUp, ChevronDown } from 'lucide-react'
import { exportarCSV } from '../../lib/funcoes/index.js'
import { thS, tdS } from './gridStyles.js'
import PaginacaoBar from './PaginacaoBar.jsx'
import PainelFiltros from './PainelFiltros.jsx'

// Aba "Acesso": filtro por coluna (server-side) + tabela paginada de
// registros da tela. Só lê tela/registros/dados de acesso via props — não
// toca no form de edição.
export default function AbaAcesso({
  tela, camposData, nomeTabela, total, registros, currentIdx, setCurrentIdx, carregarForm,
  lookupOpcoes, pastasSugest, fmtSize, ExtIcon,
  fFiltros, setFiltroCampo, fBusca, setFBusca, fResultados, fLoading,
  fPagina, fPorPagina, irParaPagina, mudarPorPagina,
  fOrdenar, fDirecao, setOrdenacao,
  limparFiltrosAcesso, selecionarDaAcesso, handleBuscar,
}) {
  const listaExibir = fResultados?.registros ?? []
  const totalGeral  = fResultados?.total ?? total
  const totalPaginas = fResultados?.totalPaginas ?? 1

  const renderCell = (c, reg) => {
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

  function handleExportCSV() {
    window.api.formBuilder.listarRegistrosFiltrado(nomeTabela, {
      filtros: Object.entries(fFiltros).filter(([, f]) => f).map(([campo, f]) => ({ campo, ...f })),
      busca: fBusca,
      pagina: 1,
      porPagina: 5000,
      ordenar: fOrdenar,
      direcao: fDirecao,
    }).then(res => {
      if (!res.ok) return
      const dados = res.data.registros.map(reg => {
        const obj = {}
        camposData.forEach(c => { obj[c.label] = reg[c.nome_campo] ?? '' })
        return obj
      })
      exportarCSV(dados, `${tela?.nome_tela || 'dados'}.csv`)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 10 }}>
      {/* Painel de filtros por coluna + busca global, retrátil */}
      <div style={{ flexShrink: 0 }}>
        <PainelFiltros camposData={camposData} fFiltros={fFiltros} setFiltroCampo={setFiltroCampo}
          fBusca={fBusca} setFBusca={setFBusca}
          pastasSugest={pastasSugest} lookupOpcoes={lookupOpcoes}
          limparFiltrosAcesso={limparFiltrosAcesso} onBuscar={handleBuscar} fLoading={fLoading} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
        <button className="btn btn-ghost" style={{ height: 30, padding: '0 10px' }}
          disabled={!totalGeral}
          onClick={handleExportCSV}>
          <Download size={13} /> Exportar CSV
        </button>
      </div>

      {/* Tabela */}
      {fResultados === null ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)', border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)' }}>
          <div style={{ fontSize: 13 }}>Configure os filtros (opcional) e clique em Buscar</div>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden', background: 'var(--s1)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1, minHeight: 100 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--s1)' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={{ ...thS, textAlign: 'center', width: 36 }}>#</th>
                  {camposData.map(c => (
                    <th key={c.id} style={{ ...thS, cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => setOrdenacao(c.nome_campo)}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        {c.label}
                        {fOrdenar === c.nome_campo && (fDirecao === 'ASC' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                      </span>
                    </th>
                  ))}
                  {tela.col_favorito !== false && <th style={{ ...thS, textAlign: 'center' }}>Fav.</th>}
                </tr>
              </thead>
              <tbody>
                {listaExibir.map((reg, ri) => (
                  <tr key={reg.id}
                    onClick={() => { const idx = registros.findIndex(r => r.id === reg.id); if (idx >= 0) { setCurrentIdx(idx); carregarForm(tela, registros[idx]) } }}
                    onDoubleClick={() => selecionarDaAcesso(reg)}
                    style={{ cursor: 'pointer', background: 'var(--s1)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--s2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--s1)' }}
                  >
                    <td style={{ ...tdS, textAlign: 'center', color: 'var(--t3)', fontSize: 10, width: 36 }}>{(fPagina - 1) * fPorPagina + ri + 1}</td>
                    {camposData.map(c => (
                      <td key={c.id} style={tdS}>{renderCell(c, reg)}</td>
                    ))}
                    {tela.col_favorito !== false && (
                      <td style={{ ...tdS, textAlign: 'center' }}>
                        {reg.favorito ? <Star size={12} fill="var(--or)" color="var(--or)" /> : <span style={{ color: 'var(--bd2)' }}>—</span>}
                      </td>
                    )}
                  </tr>
                ))}
                {!fLoading && listaExibir.length === 0 && (
                  <tr><td colSpan={camposData.length + 1 + (tela.col_favorito !== false ? 1 : 0)} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)', fontSize: 11, fontStyle: 'italic' }}>Nenhum registro encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginacaoBar pagina={fPagina} totalPaginas={totalPaginas} total={totalGeral} porPagina={fPorPagina}
            onPagina={irParaPagina} onPorPagina={mudarPorPagina} />
        </div>
      )}
    </div>
  )
}
