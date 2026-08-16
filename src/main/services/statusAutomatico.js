import { Notification } from 'electron'
import { query } from '../db'
import { confirmarStatus } from '../handlers/agenda'

const notificados = new Set() // ids já notificados nesta sessão (não reenviar a cada tick)

function toMinutos(hhmmss) {
  const [h, m] = String(hhmmss).split(':').map(Number)
  return h * 60 + m
}

function escapeXml(s) {
  return String(s ?? '').replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;',
  })[c])
}

function notificarInicio(evento) {
  const hora = String(evento.hr_inicio).slice(0, 5)
  const toastXml = `
    <toast launch="krontech://agenda/confirmar?id=${evento.id}&amp;acao=abrir" activationType="protocol">
      <visual>
        <binding template="ToastGeneric">
          <text>Compromisso: ${escapeXml(evento.titulo)}</text>
          <text>Já são ${hora}. Você iniciou?</text>
        </binding>
      </visual>
      <actions>
        <action content="Iniciar agora" activationType="protocol"
          arguments="krontech://agenda/confirmar?id=${evento.id}&amp;acao=iniciar" />
        <action content="Ainda não" activationType="protocol"
          arguments="krontech://agenda/confirmar?id=${evento.id}&amp;acao=adiar" />
      </actions>
    </toast>`
  try {
    new Notification({ toastXml }).show()
  } catch (e) {
    console.warn('[statusAutomatico] notificarInicio:', e.message)
  }
}

// Dispara a pergunta "foi iniciado?" assim que hr_inicio chega, para eventos
// ainda 'agendado'. Mesmo padrão de dedup em memória (Set) já usado em reminder.js.
async function checkInicioPendente() {
  try {
    const rows = await query(`
      SELECT id, titulo, hr_inicio
      FROM agenda_eventos_001
      WHERE ativo = true AND dt_evento = CURRENT_DATE
        AND hr_inicio IS NOT NULL AND status_auto = 'agendado'
    `)
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
    for (const r of rows) {
      if (notificados.has(r.id)) continue
      if (nowMin >= toMinutos(r.hr_inicio)) {
        notificados.add(r.id)
        notificarInicio(r)
      }
    }
  } catch (e) {
    console.warn('[statusAutomatico] checkInicioPendente:', e.message)
  }
}

// Marca como 'atrasado' eventos que continuam 'agendado' bem depois do horário
// (hr_fim, ou +30min sobre hr_inicio se não houver hr_fim — mesma convenção de
// duração-padrão usada em layoutEventosComHora no frontend). Eventos já
// 'em_andamento' não avançam sozinhos: fica pendente de ação manual, por decisão
// explícita de não inventar status.
async function checkAtraso() {
  try {
    const rows = await query(`
      SELECT id, hr_inicio, hr_fim
      FROM agenda_eventos_001
      WHERE ativo = true AND dt_evento = CURRENT_DATE
        AND hr_inicio IS NOT NULL AND status_auto = 'agendado'
    `)
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
    for (const r of rows) {
      const limite = r.hr_fim ? toMinutos(r.hr_fim) : toMinutos(r.hr_inicio) + 30
      if (nowMin >= limite) {
        await confirmarStatus({ id: r.id, status: 'atrasado', origem: 'sistema' })
      }
    }
  } catch (e) {
    console.warn('[statusAutomatico] checkAtraso:', e.message)
  }
}

export async function checkStatusAutomatico() {
  await checkInicioPendente()
  await checkAtraso()
}
