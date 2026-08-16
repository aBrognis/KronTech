import { query } from '../db'
import { interpolarSQL, logExecucao } from './execucaoService'

export function avaliarCondicoes(condicoes, dados) {
  return (condicoes || []).every(c => {
    const v = dados[c.campo]
    switch (c.operador) {
      case 'igual':     return String(v) === String(c.valor)
      case 'diferente': return String(v) !== String(c.valor)
      case 'maior':     return Number(v) > Number(c.valor)
      case 'menor':     return Number(v) < Number(c.valor)
      case 'contem':    return String(v ?? '').includes(c.valor)
      case 'vazio':     return v == null || v === ''
      case 'nao_vazio': return v != null && v !== ''
      default: return true
    }
  })
}

// Dispara automações cadastradas para um trigger/tela. Ações de UI (alerta,
// definir_valor, mostrar_campo, ocultar_campo, navegar, exportar_csv) são
// devolvidas para o renderer aplicar — só ele tem o estado de formulário.
export async function dispararAutomacoes({ triggerTipo, triggerTabela, triggerCampo, dados }) {
  const candidatas = await query(
    `SELECT * FROM kr_automacoes_001 WHERE ativo=TRUE AND trigger_tipo=$1 AND (trigger_tabela='' OR trigger_tabela=$2)`,
    [triggerTipo, triggerTabela || '']
  )
  const efeitosUI = []
  for (const a of candidatas) {
    if (triggerTipo === 'campo_muda' && a.trigger_campo && a.trigger_campo !== triggerCampo) continue
    if (!avaliarCondicoes(a.condicoes, dados || {})) continue

    const inicio = Date.now()
    try {
      for (const acao of a.acoes || []) {
        if (['alerta', 'definir_valor', 'mostrar_campo', 'ocultar_campo', 'navegar', 'exportar_csv'].includes(acao.tipo)) {
          efeitosUI.push(acao)
        } else if (acao.tipo === 'executar_sql' && acao.sql) {
          await query(interpolarSQL(acao.sql, dados || {}))
        } else if (acao.tipo === 'chamar_api' && acao.url) {
          await fetch(acao.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados || {})
          }).catch(() => {})
        }
      }
      await logExecucao('automacao', a.id, true, `${(a.acoes || []).length} ação(ões) executada(s)`, Date.now() - inicio)
    } catch (e) {
      await logExecucao('automacao', a.id, false, e.message, Date.now() - inicio)
    }
  }
  return efeitosUI
}
