// Dropdown com os códigos de flag definidos no campo — filtra registros que
// contêm o código selecionado. Dispara imediato.
export default function FilterFlags({ campo, value, onChange }) {
  const opcoes = Array.isArray(campo.opcoes) ? campo.opcoes.filter(o => o.valor) : []
  const atual = value?.valor ?? '__todos__'

  return (
    <select className="form-select" style={{ height: 26, fontSize: 10.5, padding: '0 4px' }}
      value={atual}
      onChange={e => {
        const v = e.target.value
        onChange(v === '__todos__' ? null : { op: 'flags', valor: v })
      }}>
      <option value="__todos__">Todos</option>
      {opcoes.map(o => <option key={o.valor} value={o.valor}>{o.label || o.valor}</option>)}
    </select>
  )
}
