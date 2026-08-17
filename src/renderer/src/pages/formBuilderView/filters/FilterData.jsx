const TIPO_INPUT = { data: 'date', data_hora: 'datetime-local', hora: 'time' }

// Range de data/hora "de" / "até": atualiza estado local apenas; a busca
// roda ao clicar "Buscar".
export default function FilterData({ campo, value, onChange }) {
  const tipoInput = TIPO_INPUT[campo.tipo] || 'date'
  const de  = value?.valor  || ''
  const ate = value?.valor2 || ''

  function emit(nDe, nAte) {
    onChange((nDe || nAte) ? { op: 'between', valor: nDe || null, valor2: nAte || null } : null)
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <input type={tipoInput} className="form-input" style={{ height: 32, fontSize: 11.5, padding: '0 6px', width: '50%' }}
        value={de} onChange={e => emit(e.target.value, ate)} />
      <input type={tipoInput} className="form-input" style={{ height: 32, fontSize: 11.5, padding: '0 6px', width: '50%' }}
        value={ate} onChange={e => emit(de, e.target.value)} />
    </div>
  )
}
