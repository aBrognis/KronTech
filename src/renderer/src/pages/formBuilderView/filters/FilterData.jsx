const TIPO_INPUT = { data: 'date', data_hora: 'datetime-local', hora: 'time' }

// Range aberto padrão: quando o usuário não mexe nas datas, o filtro cobre
// "tudo". Mostramos esses limites nos campos e emitimos como valor, então a
// busca já sai com o intervalo completo sem o usuário digitar nada.
export const DATA_MIN_PADRAO = '1200-01-01'
export const DATA_MAX_PADRAO = '2500-12-31'

// Range de data/hora "de" / "até": atualiza estado local apenas; a busca
// roda ao clicar "Buscar".
export default function FilterData({ campo, value, onChange }) {
  const tipoInput = TIPO_INPUT[campo.tipo] || 'date'
  const ehData = tipoInput === 'date'
  const de  = value?.valor  || (ehData ? DATA_MIN_PADRAO : '')
  const ate = value?.valor2 || (ehData ? DATA_MAX_PADRAO : '')

  function emit(nDe, nAte) {
    onChange((nDe || nAte) ? { op: 'between', valor: nDe || null, valor2: nAte || null } : null)
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <input type={tipoInput} className="form-input form-input-sm" style={{ width: '50%' }}
        value={de} onChange={e => emit(e.target.value, ate)} />
      <input type={tipoInput} className="form-input form-input-sm" style={{ width: '50%' }}
        value={ate} onChange={e => emit(de, e.target.value)} />
    </div>
  )
}
