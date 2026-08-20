import { ChevronLeft, ChevronRight } from 'lucide-react'

const TAMANHOS = [25, 50, 100, 200]

// Barra de paginação para grades server-side. Fica no rodapé da tabela,
// substituindo o antigo "Total: N" estático.
export default function PaginacaoBar({ pagina, totalPaginas, total, porPagina, onPagina, onPorPagina }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '8px 14px', borderTop: '1px solid var(--bd)', background: 'var(--s1)', fontSize: 11, color: 'var(--t3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
        <span style={{ whiteSpace: 'nowrap' }}>Total: <strong style={{ color: 'var(--t1)', fontWeight: 700 }}>{total.toLocaleString('pt-BR')}</strong></span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ whiteSpace: 'nowrap' }}>Por página</span>
          <select className="form-select" style={{ width: 62, flex: '0 0 auto', height: 26, fontSize: 11, padding: '0 6px', textAlign: 'center', textAlignLast: 'center' }}
            value={porPagina} onChange={e => onPorPagina(Number(e.target.value))}>
            {TAMANHOS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button className="btn btn-ghost" style={{ height: 26, width: 26, padding: 0, flexShrink: 0 }}
          onClick={() => onPagina(pagina - 1)} disabled={pagina <= 1} title="Página anterior">
          <ChevronLeft size={13} />
        </button>
        <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: 'var(--t2)', fontWeight: 500 }}>Página {pagina} de {totalPaginas}</span>
        <button className="btn btn-ghost" style={{ height: 26, width: 26, padding: 0, flexShrink: 0 }}
          onClick={() => onPagina(pagina + 1)} disabled={pagina >= totalPaginas} title="Próxima página">
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}
