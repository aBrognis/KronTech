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

// Palavras cujo valor de célula vira um badge colorido em vez de texto plano
// na tabela do dashboard — cobre os status mais comuns usados nas telas do
// FormBuilder/Agenda, sem acoplar a nenhuma coluna específica de um módulo.
const STATUS_CORES = [
  { test: /^(concluid|finaliz|aprovad|pago|ativ|sucesso|conclu[ií]do)/i, cor: 'var(--green)' },
  { test: /^(cancelad|inativ|reprovad|erro|atrasad|vencid|falh)/i,       cor: 'var(--red)' },
  { test: /^(pendente|aguardando|em análise|em analise|revis)/i,        cor: 'var(--yellow)' },
  { test: /^(agendad|em andamento|processando)/i,                       cor: 'var(--blue)' },
]

export function corStatusValor(valor) {
  const s = String(valor ?? '').trim()
  if (!s) return null
  const found = STATUS_CORES.find(({ test }) => test.test(s))
  return found?.cor ?? null
}

// Heurística: coluna "parece" ser de status se o nome sugere isso, ou se pelo
// menos um valor bate num padrão conhecido (funciona mesmo com 1 única linha,
// caso comum em widgets de dashboard filtrados por período).
export function isStatusCol(rows, col) {
  if (isNumCol(rows, col)) return false
  if (/status|situa[cç][aã]o/i.test(col)) return true
  const vals = rows.map(r => String(r[col] ?? '').trim()).filter(Boolean)
  return vals.some(v => corStatusValor(v))
}

export function fmtInterval(s) {
  if (!s) return 'Manual'
  if (s < 60) return `${s}s`
  if (s < 3600) return `${s / 60}min`
  return `${s / 3600}h`
}
