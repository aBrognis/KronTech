import { useState, useEffect, useRef } from 'react'

const TIPO_INPUT = { data: 'date', data_hora: 'datetime-local', hora: 'time' }

// Range de data/hora "de" / "até" — debounced.
export default function FilterData({ campo, value, onChange }) {
  const [de, setDe]   = useState(value?.valor  || '')
  const [ate, setAte] = useState(value?.valor2 || '')
  const timer = useRef(null)
  const tipoInput = TIPO_INPUT[campo.tipo] || 'date'

  useEffect(() => { setDe(value?.valor || ''); setAte(value?.valor2 || '') }, [campo.nome_campo])

  function emit(nDe, nAte) {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      onChange((nDe || nAte) ? { op: 'between', valor: nDe || null, valor2: nAte || null } : null)
    }, 300)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <input type={tipoInput} className="form-input" style={{ height: 24, fontSize: 9.5, padding: '0 4px' }}
        value={de} onChange={e => { setDe(e.target.value); emit(e.target.value, ate) }} />
      <input type={tipoInput} className="form-input" style={{ height: 24, fontSize: 9.5, padding: '0 4px' }}
        value={ate} onChange={e => { setAte(e.target.value); emit(de, e.target.value) }} />
    </div>
  )
}
