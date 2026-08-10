import { executarScript, executarIntegracao, enviarNotificacao, logExecucao } from '../services/execucaoService'
import { calcularProximaExecucao, executarAgendamento } from '../services/agendamentoService'
import { dispararAutomacoes } from '../services/automacaoService'

export function registerFuncoesHandlers({ ipcMain, wrap, query, queryOne }) {

  // ── Scripts ────────────────────────────────────────────────────────────
  ipcMain.handle('funcoes:listarScripts', wrap(async () => {
    return query(`SELECT * FROM kr_scripts ORDER BY nome`)
  }))

  ipcMain.handle('funcoes:criarScript', wrap(async (_, d) => {
    if (!d.nome?.trim()) throw new Error('Nome é obrigatório.')
    if (!d.sql_texto?.trim()) throw new Error('SQL é obrigatório.')
    return queryOne(
      `INSERT INTO kr_scripts (nome, sql_texto, ativo) VALUES ($1,$2,$3) RETURNING *`,
      [d.nome.trim(), d.sql_texto, d.ativo ?? true]
    )
  }))

  ipcMain.handle('funcoes:atualizarScript', wrap(async (_, d) => {
    if (!d.nome?.trim()) throw new Error('Nome é obrigatório.')
    return queryOne(
      `UPDATE kr_scripts SET nome=$1, sql_texto=$2, ativo=$3, alterado_em=NOW() WHERE id=$4 RETURNING *`,
      [d.nome.trim(), d.sql_texto, d.ativo ?? true, d.id]
    )
  }))

  ipcMain.handle('funcoes:excluirScript', wrap(async (_, id) => {
    await query(`DELETE FROM kr_scripts WHERE id=$1`, [id])
  }))

  ipcMain.handle('funcoes:executarScript', wrap(async (_, id) => {
    const inicio = Date.now()
    try {
      const rows = await executarScript(id)
      await logExecucao('script', id, true, `${rows?.length ?? 0} linha(s) afetada(s)`, Date.now() - inicio)
      return rows
    } catch (e) {
      await logExecucao('script', id, false, e.message, Date.now() - inicio)
      throw e
    }
  }))

  // ── Integrações ────────────────────────────────────────────────────────
  ipcMain.handle('funcoes:listarIntegracoes', wrap(async () => {
    return query(`SELECT * FROM kr_integracoes ORDER BY nome`)
  }))

  ipcMain.handle('funcoes:criarIntegracao', wrap(async (_, d) => {
    if (!d.nome?.trim()) throw new Error('Nome é obrigatório.')
    if (!d.url?.trim()) throw new Error('URL é obrigatória.')
    return queryOne(
      `INSERT INTO kr_integracoes (nome, url, metodo, headers, body, auth_tipo, auth_token, auth_key_header, ativo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [d.nome.trim(), d.url.trim(), d.metodo || 'GET', JSON.stringify(d.headers || {}), d.body || '',
       d.auth_tipo || 'none', d.auth_token || '', d.auth_key_header || '', d.ativo ?? true]
    )
  }))

  ipcMain.handle('funcoes:atualizarIntegracao', wrap(async (_, d) => {
    if (!d.nome?.trim()) throw new Error('Nome é obrigatório.')
    return queryOne(
      `UPDATE kr_integracoes SET nome=$1, url=$2, metodo=$3, headers=$4, body=$5,
       auth_tipo=$6, auth_token=$7, auth_key_header=$8, ativo=$9, alterado_em=NOW() WHERE id=$10 RETURNING *`,
      [d.nome.trim(), d.url.trim(), d.metodo || 'GET', JSON.stringify(d.headers || {}), d.body || '',
       d.auth_tipo || 'none', d.auth_token || '', d.auth_key_header || '', d.ativo ?? true, d.id]
    )
  }))

  ipcMain.handle('funcoes:excluirIntegracao', wrap(async (_, id) => {
    await query(`DELETE FROM kr_integracoes WHERE id=$1`, [id])
  }))

  ipcMain.handle('funcoes:testarIntegracao', wrap(async (_, id, contexto) => {
    const inicio = Date.now()
    try {
      const r = await executarIntegracao(id, contexto || {})
      await logExecucao('integracao', id, r.ok, `HTTP ${r.status}`, Date.now() - inicio)
      return r
    } catch (e) {
      await logExecucao('integracao', id, false, e.message, Date.now() - inicio)
      throw e
    }
  }))

  // ── Notificações ───────────────────────────────────────────────────────
  ipcMain.handle('funcoes:listarNotificacoes', wrap(async () => {
    return query(`SELECT * FROM kr_notificacoes ORDER BY nome`)
  }))

  ipcMain.handle('funcoes:criarNotificacao', wrap(async (_, d) => {
    if (!d.nome?.trim()) throw new Error('Nome é obrigatório.')
    if (!d.tipo?.trim()) throw new Error('Tipo é obrigatório.')
    return queryOne(
      `INSERT INTO kr_notificacoes (nome, tipo, titulo, mensagem, tipo_toast, url, ativo)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [d.nome.trim(), d.tipo, d.titulo || '', d.mensagem || '', d.tipo_toast || 'info', d.url || '', d.ativo ?? true]
    )
  }))

  ipcMain.handle('funcoes:atualizarNotificacao', wrap(async (_, d) => {
    if (!d.nome?.trim()) throw new Error('Nome é obrigatório.')
    return queryOne(
      `UPDATE kr_notificacoes SET nome=$1, tipo=$2, titulo=$3, mensagem=$4, tipo_toast=$5, url=$6,
       ativo=$7, alterado_em=NOW() WHERE id=$8 RETURNING *`,
      [d.nome.trim(), d.tipo, d.titulo || '', d.mensagem || '', d.tipo_toast || 'info', d.url || '', d.ativo ?? true, d.id]
    )
  }))

  ipcMain.handle('funcoes:excluirNotificacao', wrap(async (_, id) => {
    await query(`DELETE FROM kr_notificacoes WHERE id=$1`, [id])
  }))

  ipcMain.handle('funcoes:testarNotificacao', wrap(async (_, id, contexto) => {
    const inicio = Date.now()
    try {
      await enviarNotificacao(id, contexto || {})
      await logExecucao('notificacao', id, true, 'Enviada com sucesso', Date.now() - inicio)
    } catch (e) {
      await logExecucao('notificacao', id, false, e.message, Date.now() - inicio)
      throw e
    }
  }))

  // ── Agendamentos ───────────────────────────────────────────────────────
  ipcMain.handle('funcoes:listarAgendamentos', wrap(async () => {
    return query(`SELECT * FROM kr_agendamentos ORDER BY nome`)
  }))

  ipcMain.handle('funcoes:criarAgendamento', wrap(async (_, d) => {
    if (!d.nome?.trim()) throw new Error('Nome é obrigatório.')
    if (!d.intervalo) throw new Error('Intervalo é obrigatório.')
    if (!d.acao?.tipo) throw new Error('Ação é obrigatória.')
    const proxima = calcularProximaExecucao(d)
    return queryOne(
      `INSERT INTO kr_agendamentos (nome, intervalo, cron, acao, proxima_execucao, ativo)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [d.nome.trim(), d.intervalo, d.cron || '', JSON.stringify(d.acao), proxima, d.ativo ?? true]
    )
  }))

  ipcMain.handle('funcoes:atualizarAgendamento', wrap(async (_, d) => {
    if (!d.nome?.trim()) throw new Error('Nome é obrigatório.')
    const proxima = calcularProximaExecucao(d)
    return queryOne(
      `UPDATE kr_agendamentos SET nome=$1, intervalo=$2, cron=$3, acao=$4, proxima_execucao=$5,
       ativo=$6, alterado_em=NOW() WHERE id=$7 RETURNING *`,
      [d.nome.trim(), d.intervalo, d.cron || '', JSON.stringify(d.acao), proxima, d.ativo ?? true, d.id]
    )
  }))

  ipcMain.handle('funcoes:excluirAgendamento', wrap(async (_, id) => {
    await query(`DELETE FROM kr_agendamentos WHERE id=$1`, [id])
  }))

  ipcMain.handle('funcoes:executarAgendamentoAgora', wrap(async (_, id) => {
    const ag = await queryOne(`SELECT * FROM kr_agendamentos WHERE id=$1`, [id])
    if (!ag) throw new Error('Agendamento não encontrado.')
    await executarAgendamento(ag)
    return queryOne(`SELECT * FROM kr_agendamentos WHERE id=$1`, [id])
  }))

  // ── Automações ─────────────────────────────────────────────────────────
  ipcMain.handle('funcoes:listarAutomacoes', wrap(async () => {
    return query(`SELECT * FROM kr_automacoes ORDER BY nome`)
  }))

  ipcMain.handle('funcoes:criarAutomacao', wrap(async (_, d) => {
    if (!d.nome?.trim()) throw new Error('Nome é obrigatório.')
    if (!d.trigger_tipo) throw new Error('Gatilho é obrigatório.')
    return queryOne(
      `INSERT INTO kr_automacoes (nome, trigger_tipo, trigger_campo, trigger_tabela, condicoes, acoes, ativo)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [d.nome.trim(), d.trigger_tipo, d.trigger_campo || '', d.trigger_tabela || '',
       JSON.stringify(d.condicoes || []), JSON.stringify(d.acoes || []), d.ativo ?? true]
    )
  }))

  ipcMain.handle('funcoes:atualizarAutomacao', wrap(async (_, d) => {
    if (!d.nome?.trim()) throw new Error('Nome é obrigatório.')
    return queryOne(
      `UPDATE kr_automacoes SET nome=$1, trigger_tipo=$2, trigger_campo=$3, trigger_tabela=$4,
       condicoes=$5, acoes=$6, ativo=$7, alterado_em=NOW() WHERE id=$8 RETURNING *`,
      [d.nome.trim(), d.trigger_tipo, d.trigger_campo || '', d.trigger_tabela || '',
       JSON.stringify(d.condicoes || []), JSON.stringify(d.acoes || []), d.ativo ?? true, d.id]
    )
  }))

  ipcMain.handle('funcoes:excluirAutomacao', wrap(async (_, id) => {
    await query(`DELETE FROM kr_automacoes WHERE id=$1`, [id])
  }))

  ipcMain.handle('automacao:disparar', wrap(async (_, payload) => {
    return dispararAutomacoes(payload || {})
  }))
}
