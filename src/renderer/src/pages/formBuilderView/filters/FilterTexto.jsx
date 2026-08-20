// Texto com filtro "contém": atualiza estado local apenas; a busca roda ao
// clicar "Buscar" (ver PainelFiltros.jsx).
export default function FilterTexto({ value, onChange }) {
  return (
    <input className="form-input form-input-sm"
      value={value?.valor || ''}
      onChange={e => onChange(e.target.value ? { op: 'contains', valor: e.target.value } : null)}
      placeholder="filtrar..." />
  )
}
