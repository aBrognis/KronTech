// Formatação de números e intervalos

export function fmtNum(val) {
  if (val == null || val === '') return ''
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

const STATUS_VERDE   = /conclu[íi]do|aprovado|pago|ativo|sucesso/i
const STATUS_VERMELHO= /cancelado|inativo|reprovado|erro|atrasado|vencido|falha/i
const STATUS_AMARELO = /pendente|aguardando|em an[áa]lise|revis[ãa]o/i
const STATUS_AZUL     = /agendado|em andamento|processando/i

export function isStatusCol(rows, col) {
  if (/status|situa[cç][ãa]o/i.test(col)) return true
  return rows.some(r => {
    const v = r[col]
    if (v == null || v === '') return false
    const s = String(v)
    return STATUS_VERDE.test(s) || STATUS_VERMELHO.test(s) || STATUS_AMARELO.test(s) || STATUS_AZUL.test(s)
  })
}

export function corStatusValor(val) {
  const s = String(val ?? '')
  if (STATUS_VERDE.test(s))    return { bg: 'rgba(74,222,128,.12)',  fg: '#4ADE80' }
  if (STATUS_VERMELHO.test(s)) return { bg: 'rgba(248,113,113,.12)', fg: '#F87171' }
  if (STATUS_AMARELO.test(s))  return { bg: 'rgba(251,210,76,.12)',  fg: '#FBD24C' }
  if (STATUS_AZUL.test(s))     return { bg: 'rgba(96,165,250,.12)',  fg: '#60A5FA' }
  return null
}
