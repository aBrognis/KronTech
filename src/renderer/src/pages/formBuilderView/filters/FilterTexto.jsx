import { useState, useEffect, useRef } from 'react'

// Texto/numero-de-documento com filtro "contém" — debounced para não disparar
// uma query a cada tecla.
export default function FilterTexto({ campo, value, onChange }) {
  const [texto, setTexto] = useState(value?.valor || '')
  const timer = useRef(null)

  useEffect(() => { setTexto(value?.valor || '') }, [campo.nome_campo])

  function handleChange(v) {
    setTexto(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      onChange(v ? { op: 'contains', valor: v } : null)
    }, 300)
  }

  return (
    <input className="form-input" style={{ height: 26, fontSize: 10.5, padding: '0 6px' }}
      value={texto} onChange={e => handleChange(e.target.value)}
      placeholder="filtrar..." />
  )
}
