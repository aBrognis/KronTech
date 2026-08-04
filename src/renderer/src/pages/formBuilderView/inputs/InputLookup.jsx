import { Search, X, ExternalLink } from 'lucide-react'

// Campo lookup: modo select (dropdown direto) ou modo modal (busca via
// openLookupModal, do hook useLookupModal).
export function InputLookup({ campo, val, isRO, saving, setField, lookupOpcoes, openLookupModal, setLkpPopover }) {
  const cfg = (campo.opcoes && !Array.isArray(campo.opcoes)) ? campo.opcoes : {}
  const opts = lookupOpcoes[campo.nome_campo] || []
  const modoLkp = cfg.lookupModo || 'select'
  const numVal = val ? Number(val) : null
  const displayLabel = opts.find(o => o.id === numVal)?.label || (val ? `#${val}` : '')

  if (modoLkp === 'select') return (
    <select className="form-select" value={numVal ?? ''} style={{ height: '100%' }}
      onChange={e => setField(campo.nome_campo, e.target.value ? Number(e.target.value) : null)}
      disabled={isRO || saving}>
      <option value="">— nenhum —</option>
      {opts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  )

  // Modo modal
  return (
    <div style={{ display: 'flex', gap: 4, height: '100%' }}>
      <div className="form-input" style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', cursor: (!isRO && !saving) ? 'pointer' : 'default', fontSize: 12 }}
        onClick={() => !isRO && !saving && openLookupModal(campo)}>
        {displayLabel || <span style={{ color: 'var(--t3)', fontStyle: 'italic' }}>— nenhum —</span>}
      </div>
      <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 8px', height: '100%' }}
        onClick={() => openLookupModal(campo)} disabled={saving || isRO} title="Buscar">
        <Search size={13} />
      </button>
      {numVal && !isRO && (
        <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 8px', height: '100%' }}
          onClick={() => setField(campo.nome_campo, null)} disabled={saving} title="Limpar">
          <X size={13} />
        </button>
      )}
      {isRO && numVal && displayLabel && (
        <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 6px', height: '100%' }}
          onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setLkpPopover({ label: displayLabel, x: r.left, y: r.bottom + 6 }) }}
          title="Ver registro relacionado">
          <ExternalLink size={12} />
        </button>
      )}
    </div>
  )
}
