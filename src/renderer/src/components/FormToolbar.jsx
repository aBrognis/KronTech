import { Plus, Edit2, Trash2, Search, Save, X, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, FileDown } from 'lucide-react'

// Barra de ações padrão de formulários CRUD: alterna entre modo consulta
// (Incluir/Alterar/Excluir/Consultar) e modo edição (Gravar/Desistir).
// Extraído de FormBuilderView.jsx/Arquivos.jsx, que tinham o mesmo bloco
// duplicado; este componente é a fonte única para esse padrão.
export default function FormToolbar({
  mode,                    // 'view' | 'new' | 'edit'
  nav,                     // opcional: { currentIdx, total, onNav(idx) }
  temRegistros = true,     // desabilita Alterar/Excluir quando não há registros
  saving = false,
  onIncluir, onAlterar, onExcluir, onConsultar, onExportar,
  onGravar, onDesistir,
}) {
  const isRO = mode === 'view'

  return (
    <div className="page-footer">
      {nav && (
        <>
          <div className="page-footer-nav">
            <button className="page-footer-nav-btn" onClick={() => nav.onNav(0)} disabled={nav.currentIdx <= 0} title="Primeiro"><ChevronsLeft size={13} /></button>
            <button className="page-footer-nav-btn" onClick={() => nav.onNav(nav.currentIdx - 1)} disabled={nav.currentIdx <= 0} title="Anterior"><ChevronLeft size={13} /></button>
            <span className="page-footer-counter">{nav.total > 0 ? `${nav.currentIdx + 1} / ${nav.total}` : '0 / 0'}</span>
            <button className="page-footer-nav-btn" onClick={() => nav.onNav(nav.currentIdx + 1)} disabled={nav.currentIdx >= nav.total - 1} title="Próximo"><ChevronRight size={13} /></button>
            <button className="page-footer-nav-btn" onClick={() => nav.onNav(nav.total - 1)} disabled={nav.currentIdx >= nav.total - 1} title="Último"><ChevronsRight size={13} /></button>
          </div>
          <div style={{ width: 1, height: 22, background: 'var(--bd)', flexShrink: 0 }} />
        </>
      )}

      <div className="page-footer-actions">
        {isRO ? (
          <>
            {onIncluir && <button className="btn btn-primary" onClick={onIncluir}><Plus size={13} /> Incluir</button>}
            {onAlterar && <button className="btn btn-ghost" onClick={onAlterar} disabled={!temRegistros}><Edit2 size={13} /> Alterar</button>}
            {onExcluir && <button className="btn btn-danger" onClick={onExcluir} disabled={!temRegistros}><Trash2 size={13} /> Excluir</button>}
            {onConsultar && <button className="btn btn-ghost" onClick={onConsultar}><Search size={13} /> Consultar</button>}
            {onExportar && <button className="btn btn-ghost" onClick={onExportar}><FileDown size={13} /> Exportar</button>}
          </>
        ) : (
          <>
            <button className="btn btn-primary" onClick={onGravar} disabled={saving}><Save size={13} /> {saving ? 'Salvando...' : 'Gravar'}</button>
            <button className="btn btn-ghost" onClick={onDesistir}><X size={13} /> Desistir</button>
          </>
        )}
      </div>
    </div>
  )
}
