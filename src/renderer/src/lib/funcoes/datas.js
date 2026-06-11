const DIAS_PT = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado']
const MESES_PT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']

export function adicionarDias(data, n) {
  const d = new Date(data)
  d.setDate(d.getDate() + Number(n))
  return d.toISOString().split('T')[0]
}

export function adicionarMeses(data, n) {
  const d = new Date(data)
  d.setMonth(d.getMonth() + Number(n))
  return d.toISOString().split('T')[0]
}

export function adicionarAnos(data, n) {
  const d = new Date(data)
  d.setFullYear(d.getFullYear() + Number(n))
  return d.toISOString().split('T')[0]
}

export function diaDaSemana(data) {
  return DIAS_PT[new Date(data).getDay()]
}

export function mesExtenso(data) {
  return MESES_PT[new Date(data).getMonth()]
}

export function ehFimDeSemana(data) {
  const d = new Date(data).getDay()
  return d === 0 || d === 6
}

export function ehDiaUtil(data) {
  return !ehFimDeSemana(data)
}

export function inicioDoMes(data) {
  const d = new Date(data)
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

export function fimDoMes(data) {
  const d = new Date(data)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
}

export function diasNoMes(data) {
  const d = new Date(data)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

export function diasEntreDatas(dataInicio, dataFim) {
  const d1 = new Date(dataInicio), d2 = new Date(dataFim)
  return Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24))
}

export function calcularIdade(dataNascimento) {
  const nasc = new Date(dataNascimento)
  const hoje = new Date()
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

export function formatarRelativo(data) {
  const diff = Date.now() - new Date(data).getTime()
  const abs = Math.abs(diff)
  const futuro = diff < 0
  const seg = Math.floor(abs / 1000)
  const min = Math.floor(seg / 60)
  const hor = Math.floor(min / 60)
  const dia = Math.floor(hor / 24)
  const mes = Math.floor(dia / 30)
  const ano = Math.floor(mes / 12)
  const fmt = (n, u) => futuro ? `em ${n} ${u}` : `há ${n} ${u}`
  if (seg < 60)  return 'agora'
  if (min < 60)  return fmt(min, min === 1 ? 'minuto' : 'minutos')
  if (hor < 24)  return fmt(hor, hor === 1 ? 'hora' : 'horas')
  if (dia < 30)  return fmt(dia, dia === 1 ? 'dia' : 'dias')
  if (mes < 12)  return fmt(mes, mes === 1 ? 'mês' : 'meses')
  return fmt(ano, ano === 1 ? 'ano' : 'anos')
}

export function formatarDataPorExtenso(data) {
  const d = new Date(data)
  return `${d.getDate()} de ${MESES_PT[d.getMonth()]} de ${d.getFullYear()}`
}

export function agora() {
  return new Date().toISOString()
}

export function hoje() {
  return new Date().toISOString().split('T')[0]
}

export function hojeFormatado() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

export function horaAtual() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export function trimestre(data) {
  return Math.ceil((new Date(data).getMonth() + 1) / 3)
}

export function semanaDoAno(data) {
  const d = new Date(data)
  const inicio = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - inicio) / 86400000 + inicio.getDay() + 1) / 7)
}

export function proximoDiaUtil(data) {
  let d = new Date(data)
  do { d.setDate(d.getDate() + 1) } while (ehFimDeSemana(d))
  return d.toISOString().split('T')[0]
}
