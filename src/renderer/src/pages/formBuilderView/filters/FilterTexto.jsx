// Texto com filtro "contém": atualiza estado local apenas; a busca roda ao
// clicar "Buscar" (ver PainelFiltros.jsx).
export default function FilterTexto({ value, onChange }) {
  return (
    <input className="form-input" style={{ height: 32, fontSize: 12, padding: '0 8px', width: '100%' }}
      value={value?.valor || ''}
      onChange={e => onChange(e.target.value ? { op: 'contains', valor: e.target.value } : null)}
      placeholder="filtrar..." />
  )
}
