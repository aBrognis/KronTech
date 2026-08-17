const DATA_MIN = '1200-01-01'
const DATA_MAX = '2500-12-31'

function hojeISO() {
  const d = new Date()
  return `${d.getFullYear()}`.padStart(4, '0') + '-' + `${d.getMonth() + 1}`.padStart(2, '0') + '-' + `${d.getDate()}`.padStart(2, '0')
}

function somarDias(iso, n) {
  if (!iso) return iso
  const [ano, mes, dia] = iso.split('-').map(Number)
  const d = new Date(Date.UTC(ano, mes - 1, dia))
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function pad2(n) { return String(n).padStart(2, '0') }

function mesAtual() {
  const d = new Date()
  const ano = d.getFullYear(), mes = d.getMonth() + 1
  const ultimoDia = new Date(ano, mes, 0).getDate()
  return [`${ano}-${pad2(mes)}-01`, `${ano}-${pad2(mes)}-${pad2(ultimoDia)}`]
}

function anoAtual() {
  const ano = new Date().getFullYear()
  return [`${ano}-01-01`, `${ano}-12-31`]
}

// Input de data com atalhos de teclado, padrão único para todo o sistema:
// R = data mínima (01/01/1200), Y = data máxima (31/12/2500), T = hoje,
// +/- = soma/subtrai um dia da data atual do campo.
// onRange (opcional): quando o campo faz parte de um par "de/até", habilita
// E = mês presente inteiro, U = ano presente inteiro, preenchendo os dois
// campos de uma vez via onRange(dataIni, dataFim).
export default function InputData({ value, onChange, onRange, disabled, className = 'form-input', style, ...rest }) {
  function handleKeyDown(e) {
    if (disabled) return
    const key = e.key.toLowerCase()
    if (key === 'r') { e.preventDefault(); onChange(DATA_MIN) }
    else if (key === 'y') { e.preventDefault(); onChange(DATA_MAX) }
    else if (key === 't') { e.preventDefault(); onChange(hojeISO()) }
    else if (key === '+') { e.preventDefault(); onChange(somarDias(value || hojeISO(), 1)) }
    else if (key === '-') { e.preventDefault(); onChange(somarDias(value || hojeISO(), -1)) }
    else if (key === 'e' && onRange) { e.preventDefault(); onRange(...mesAtual()) }
    else if (key === 'u' && onRange) { e.preventDefault(); onRange(...anoAtual()) }
  }

  return (
    <input
      type="date"
      className={className}
      style={style}
      value={value || ''}
      disabled={disabled}
      min={DATA_MIN}
      max={DATA_MAX}
      onChange={e => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      {...rest}
    />
  )
}
