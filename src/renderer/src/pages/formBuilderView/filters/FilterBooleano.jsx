// Tri-state Todos/Sim/Não — dispara imediato (sem debounce).
export default function FilterBooleano({ value, onChange }) {
  const atual = value?.valor === true ? 'sim' : value?.valor === false ? 'nao' : 'todos'
  return (
    <select className="form-select" style={{ height: 26, fontSize: 10.5, padding: '0 4px' }}
      value={atual}
      onChange={e => {
        const v = e.target.value
        onChange(v === 'todos' ? null : { op: 'bool', valor: v === 'sim' })
      }}>
      <option value="todos">Todos</option>
      <option value="sim">Sim</option>
      <option value="nao">Não</option>
    </select>
  )
}
