import { query } from '../db'
import { executarScript, executarIntegracao, logExecucao } from './execucaoService'

const INTERVALOS_MS = {
  '5m': 5 * 60_000, '15m': 15 * 60_000, '30m': 30 * 60_000,
  '1h': 60 * 60_000, '6h': 6 * 60 * 60_000, '12h': 12 * 60 * 60_000,
  '1d': 24 * 60 * 60_000, '1w': 7 * 24 * 60 * 60_000,
}

// Parser mínimo de 5 campos (min hora dia mês diaSemana), suporta só '*' e
// listas 'N,M' — não é um parser cron completo (sem '*/N' nem ranges 'N-M').
// Cobre os casos já sugeridos na UI (ex: '0 8 * * 1-5' NÃO é suportado com
// range; usar '0 8 * * 1,2,3,4,5' como alternativa documentada na UI).
function proximaExecucaoCron(cronExpr, agora) {
  const partes = cronExpr.trim().split(/\s+/)
  if (partes.length !== 5) return new Date(agora.getTime() + 60 * 60_000)
  const [minExpr, horaExpr, , , diaSemanaExpr] = partes
  const matchCampo = (expr, valor) => expr === '*' || expr.split(',').map(Number).includes(valor)

  for (let i = 0; i < 7 * 24 * 60; i++) {
    const candidato = new Date(agora.getTime() + i * 60_000)
    if (candidato <= agora) continue
    if (matchCampo(minExpr, candidato.getMinutes()) &&
        matchCampo(horaExpr, candidato.getHours()) &&
        matchCampo(diaSemanaExpr, candidato.getDay())) {
      return candidato
    }
  }
  return new Date(agora.getTime() + 24 * 60 * 60_000)
}

export function calcularProximaExecucao(agendamento, agora = new Date()) {
  if (agendamento.intervalo === 'cron' && agendamento.cron) {
    return proximaExecucaoCron(agendamento.cron, agora)
  }
  const passo = INTERVALOS_MS[agendamento.intervalo] || INTERVALOS_MS['1h']
  return new Date(agora.getTime() + passo)
}

export async function executarAgendamento(ag) {
  const inicio = Date.now()
  try {
    if (ag.acao.tipo === 'script') await executarScript(ag.acao.id)
    else if (ag.acao.tipo === 'api') await executarIntegracao(ag.acao.id)
    await query(
      'UPDATE kr_agendamentos_001 SET ultima_execucao=NOW(), proxima_execucao=$1 WHERE id=$2',
      [calcularProximaExecucao(ag), ag.id]
    )
    await logExecucao('agendamento', ag.id, true, 'Executado com sucesso', Date.now() - inicio)
  } catch (e) {
    await logExecucao('agendamento', ag.id, false, e.message, Date.now() - inicio)
  }
}

export async function checkAgendamentos() {
  try {
    const pendentes = await query(
      `SELECT * FROM kr_agendamentos_001 WHERE ativo=TRUE AND (proxima_execucao IS NULL OR proxima_execucao <= NOW())`
    )
    for (const ag of pendentes) await executarAgendamento(ag)
  } catch (e) {
    console.warn('[agendamentoService] checkAgendamentos:', e.message)
  }
}
