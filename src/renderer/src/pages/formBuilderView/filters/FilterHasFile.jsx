// Toggle 3 estados: Todos / Com arquivo / Sem arquivo. Dispara imediato.
export default function FilterHasFile({ value, onChange }) {
  const atual = value?.valor ?? '__todos__'
  return (
    <select className="form-select" style={{ height: 26, fontSize: 10.5, padding: '0 4px' }}
      value={atual}
      onChange={e => {
        const v = e.target.value
        onChange(v === '__todos__' ? null : { op: 'has_file', valor: v })
      }}>
      <option value="__todos__">Todos</option>
      <option value="com">Com arquivo</option>
      <option value="sem">Sem arquivo</option>
    </select>
  )
}
