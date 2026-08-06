export const DIAS_SEMANA_LONGO = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
export const DIAS_SEMANA_CURTO = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
export const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
export const MESES_CURTO = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export const RECORRENCIAS = [
  { value:'nenhuma', label:'Não repete' },
  { value:'diaria',  label:'Todo dia' },
  { value:'semanal', label:'Toda semana' },
  { value:'mensal',  label:'Todo mês' },
]

export const MIN_OPTIONS = [
  { label:'5 minutos antes',  value:5 },
  { label:'15 minutos antes', value:15 },
  { label:'30 minutos antes', value:30 },
  { label:'1 hora antes',     value:60 },
  { label:'2 horas antes',    value:120 },
  { label:'1 dia antes',      value:1440 },
]

export const COR_FALLBACK = '#6366F1'
export const COR_STATUS_FALLBACK = '#94A3B8'

export const EMPTY_FORM = {
  titulo:'', categoria_id:'', status_id:'', cliente_id:'',
  dt_evento:'', hr_inicio:'', hr_fim:'', dia_todo:false,
  local:'', descricao:'', lembretes:[], recorrencia:'nenhuma',
}

export function toISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth()+1).padStart(2,'0')
  const d = String(date.getDate()).padStart(2,'0')
  return `${y}-${m}-${d}`
}

export function fmtHora(t) { return t ? String(t).slice(0,5) : '' }

export function dtToISO(val) {
  if (!val) return ''
  if (val instanceof Date) return val.toISOString().slice(0,10)
  return String(val).slice(0,10)
}

export function buildGrid(year, month) {
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function getWeekDays(date) {
  const dow = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - dow)
  return Array.from({length:7}, (_,i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate()+i)
    return d
  })
}

export function eventosDodia(events, isoDate) {
  return events.filter(e => dtToISO(e.dt_evento) === isoDate)
    .sort((a,b) => (a.hr_inicio||'99:99').localeCompare(b.hr_inicio||'99:99'))
}

export function corEvento(ev) {
  return ev.categoria_cor || COR_FALLBACK
}

export function corStatus(ev) {
  return ev.status_cor || COR_STATUS_FALLBACK
}

export function nomeCategoria(ev) {
  return ev.categoria_nome || '—'
}

export function nomeStatus(ev) {
  return ev.status_nome || '—'
}

export function nomeCliente(ev) {
  return ev.cliente_nome || '—'
}
