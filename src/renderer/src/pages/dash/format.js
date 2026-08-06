// Formatação de números e intervalos

export function fmtNum(val) {
  if (val == null || val === '') return '—'
  const n = Number(String(val).trim())
  if (!isNaN(n)) {
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'M'
    if (Number.isInteger(n)) return n.toLocaleString('pt-BR')
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return String(val)
}

export function isNumCol(rows, col) {
  return rows.every(r => r[col] == null || r[col] === '' || !isNaN(Number(r[col])))
}

export function fmtInterval(s) {
  if (!s) return 'Manual'
  if (s < 60) return `${s}s`
  if (s < 3600) return `${s / 60}min`
  return `${s / 3600}h`
}
