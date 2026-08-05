import { useState, useEffect, useRef } from 'react'

// Range numérico "de" / "até" — debounced.
export default function FilterNumero({ campo, value, onChange }) {
  const [de, setDe]   = useState(value?.valor  ?? '')
  const [ate, setAte] = useState(value?.valor2 ?? '')
  const timer = useRef(null)

  useEffect(() => { setDe(value?.valor ?? ''); setAte(value?.valor2 ?? '') }, [campo.nome_campo])

  function emit(nDe, nAte) {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const valor  = nDe  === '' ? null : Number(nDe)
      const valor2 = nAte === '' ? null : Number(nAte)
      onChange((valor != null || valor2 != null) ? { op: 'between', valor, valor2 } : null)
    }, 300)
  }

  return (
    <div style={{ display: 'flex', gap: 3 }}>
      <input type="number" className="form-input" style={{ height: 26, fontSize: 10.5, width: '50%', padding: '0 4px' }}
        value={de} placeholder="de" onChange={e => { setDe(e.target.value); emit(e.target.value, ate) }} />
      <input type="number" className="form-input" style={{ height: 26, fontSize: 10.5, width: '50%', padding: '0 4px' }}
        value={ate} placeholder="até" onChange={e => { setAte(e.target.value); emit(de, e.target.value) }} />
    </div>
  )
}
