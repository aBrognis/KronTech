// Dropdown de igualdade exata: select/radio (opções fixas), pasta (valores
// distintos já pré-carregados), lookup (opções do registro relacionado).
// Dispara imediato (sem debounce).
export default function FilterExato({ campo, value, onChange, pastasSugest, lookupOpcoes }) {
  const atual = value?.valor ?? '__todos__'

  let opcoes = []
  if (campo.tipo === 'lookup') {
    opcoes = (lookupOpcoes?.[campo.nome_campo] || []).map(o => ({ valor: String(o.id), label: o.label }))
  } else if (Array.isArray(campo.opcoes) && campo.opcoes.length) {
    opcoes = campo.opcoes.map(o => ({ valor: o.valor, label: o.label }))
  } else {
    opcoes = (pastasSugest?.[campo.nome_campo] || []).map(v => ({ valor: v, label: v || '(vazio)' }))
  }

  return (
    <select className="form-select" style={{ height: 32, fontSize: 12, padding: '0 8px', width: '100%' }}
      value={atual}
      onChange={e => {
        const v = e.target.value
        onChange(v === '__todos__' ? null : { op: 'eq', valor: v })
      }}>
      <option value="__todos__">Todos</option>
      {opcoes.map(o => <option key={o.valor} value={o.valor}>{o.label}</option>)}
    </select>
  )
}
