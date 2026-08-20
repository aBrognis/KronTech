// Range numérico "de" / "até": atualiza estado local apenas; a busca roda
// ao clicar "Buscar".
export default function FilterNumero({ value, onChange }) {
  function emit(nDe, nAte) {
    const valor  = nDe  === '' ? null : Number(nDe)
    const valor2 = nAte === '' ? null : Number(nAte)
    onChange((valor != null || valor2 != null) ? { op: 'between', valor, valor2 } : null)
  }
  const de  = value?.valor  ?? ''
  const ate = value?.valor2 ?? ''

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <input type="number" className="form-input form-input-sm" style={{ width: '50%' }}
        value={de} placeholder="de" onChange={e => emit(e.target.value, ate)} />
      <input type="number" className="form-input form-input-sm" style={{ width: '50%' }}
        value={ate} placeholder="até" onChange={e => emit(de, e.target.value)} />
    </div>
  )
}
