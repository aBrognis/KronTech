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

export const STATUS_AUTO_LABEL = {
  agendado:       'Agendado',
  em_andamento:   'Em andamento',
  concluido:      'Concluído',
  atrasado:       'Atrasado',
  nao_compareceu: 'Não compareceu',
  cancelado:      'Cancelado',
}

// Cor de destaque do status automático de ciclo de vida (controlado pelo
// sistema, separado de status_cor que é livre/customizável pelo usuário).
// null = 'agendado', sem destaque especial.
export function corStatusAuto(ev) {
  switch (ev.status_auto) {
    case 'atrasado':       return '#EF4444' // vermelho
    case 'em_andamento':   return '#22C55E' // verde
    case 'concluido':      return '#3B82F6' // azul
    case 'nao_compareceu': return '#F59E0B' // amarelo/âmbar
    case 'cancelado':      return '#9CA3AF' // cinza
    default:                return null
  }
}

export function toMinutos(hhmmss) {
  if (!hhmmss) return null
  const [h, m] = hhmmss.split(':').map(Number)
  return h * 60 + m
}

// Retorna o Set de ids de eventos do dia que se sobrepõem no horário com
// pelo menos outro evento. Eventos sem hr_fim assumem 30min de duração;
// eventos dia_todo são ignorados (não fazem sentido como conflito de horário).
export function eventosConflitantes(events, isoDate) {
  const doDia = eventosDodia(events, isoDate).filter(e => e.hr_inicio && !e.dia_todo)
  const conflitantes = new Set()
  for (let i = 0; i < doDia.length; i++) {
    const a = doDia[i]
    const aIni = toMinutos(a.hr_inicio), aFim = a.hr_fim ? toMinutos(a.hr_fim) : aIni + 30
    for (let j = i + 1; j < doDia.length; j++) {
      const b = doDia[j]
      const bIni = toMinutos(b.hr_inicio), bFim = b.hr_fim ? toMinutos(b.hr_fim) : bIni + 30
      if (aIni < bFim && bIni < aFim) { conflitantes.add(a.id); conflitantes.add(b.id) }
    }
  }
  return conflitantes
}

// Calcula o layout "lado a lado" (estilo Google Agenda) dos eventos com hora
// de um dia: cada evento recebe { ev, top, height, col, cols } em pixels/
// frações, onde `col`/`cols` definem em quantas colunas o grupo sobreposto
// foi dividido e em qual delas este evento cai. `pxPorHora` é a altura em
// px de uma hora na grade (ex: 64 na view Dia, 48 na Semana).
export function layoutEventosComHora(events, isoDate, pxPorHora) {
  const doDia = eventosDodia(events, isoDate).filter(e => e.hr_inicio && !e.dia_todo)
  const itens = doDia.map(ev => {
    const ini = toMinutos(ev.hr_inicio)
    const fim = ev.hr_fim ? Math.max(toMinutos(ev.hr_fim), ini + 15) : ini + 30
    return { ev, ini, fim }
  }).sort((a,b) => a.ini - b.ini || a.fim - b.fim)

  // Agrupa em clusters de eventos mutuamente conectados por overlap (transitivo).
  // Um item pode sobrepor mais de um cluster já existente (ex: A-B formam um
  // cluster, e um item C chega sobrepondo só B mas não A — sem merge, C e A
  // ficariam em clusters separados mesmo fazendo parte da mesma "cadeia" de
  // conflitos). Por isso, junta (merge) todos os clusters que o item tocar.
  const clusters = []
  for (const item of itens) {
    const tocados = []
    for (const c of clusters) {
      if (c.some(o => item.ini < o.fim && o.ini < item.fim)) tocados.push(c)
    }
    if (tocados.length === 0) {
      clusters.push([item])
    } else {
      const [alvo, ...resto] = tocados
      alvo.push(item)
      for (const c of resto) {
        alvo.push(...c)
        clusters.splice(clusters.indexOf(c), 1)
      }
    }
  }

  const resultado = []
  for (const cluster of clusters) {
    // Column packing: cada evento pega a primeira coluna livre (sem overlap
    // com o que já está nela); cols = nº máximo de colunas usadas no cluster.
    const colunas = [] // array de arrays de items já alocados por coluna
    for (const item of cluster) {
      let colIdx = colunas.findIndex(col => col.every(o => item.ini >= o.fim || o.ini >= item.fim))
      if (colIdx === -1) { colIdx = colunas.length; colunas.push([]) }
      colunas[colIdx].push(item)
      item.col = colIdx
    }
    const totalCols = colunas.length
    for (const item of cluster) {
      resultado.push({
        ev: item.ev,
        top: (item.ini / 60) * pxPorHora,
        height: Math.max(((item.fim - item.ini) / 60) * pxPorHora, 18),
        col: item.col,
        cols: totalCols,
      })
    }
  }
  return resultado
}

// Desloca hr_fim mantendo a duração original do evento, a partir de uma nova hora de início.
export function deslocarHora(hrInicioAntiga, hrFimAntiga, novaHoraInicio) {
  const iniAntigo = toMinutos(hrInicioAntiga)
  const fimAntigo = toMinutos(hrFimAntiga)
  if (iniAntigo == null || fimAntigo == null) return hrFimAntiga
  const duracao = fimAntigo - iniAntigo
  const novoFimMin = novaHoraInicio * 60 + duracao
  const h = Math.floor(novoFimMin / 60) % 24
  const m = novoFimMin % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}
