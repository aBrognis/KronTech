import { ChevronLeft, ChevronRight } from 'lucide-react'

const TAMANHOS = [25, 50, 100, 200]

// Barra de paginação para grades server-side. Fica no rodapé da tabela,
// substituindo o antigo "Total: N" estático.
export default function PaginacaoBar({ pagina, totalPaginas, total, porPagina, onPagina, onPorPagina }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px', borderTop: '1px solid var(--bd)', background: 'var(--s1)', fontSize: 10.5, color: 'var(--t3)' }}>
      <span>Total: <strong style={{ color: 'var(--t2)' }}>{total.toLocaleString('pt-BR')}</strong></span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>Por página:</span>
        <select className="form-select" style={{ height: 22, fontSize: 10, padding: '0 4px' }}
          value={porPagina} onChange={e => onPorPagina(Number(e.target.value))}>
          {TAMANHOS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
        <button className="btn btn-ghost" style={{ height: 22, width: 22, padding: 0 }}
          onClick={() => onPagina(pagina - 1)} disabled={pagina <= 1} title="Página anterior">
          <ChevronLeft size={12} />
        </button>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>Página {pagina} de {totalPaginas}</span>
        <button className="btn btn-ghost" style={{ height: 22, width: 22, padding: 0 }}
          onClick={() => onPagina(pagina + 1)} disabled={pagina >= totalPaginas} title="Próxima página">
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  )
}
