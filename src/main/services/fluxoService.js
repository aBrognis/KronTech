import { queryOne, query } from '../db'
import { avaliarCondicoes } from './automacaoService'
import { interpolarSQL, executarIntegracaoAdHoc, enviarNotificacaoAdHoc, logExecucao } from './execucaoService'

// Execução estritamente sequencial e linear — etapa 'condicao' funciona como
// guard clause (encerra o fluxo se falsa), não há ramificação real ("senão").
export async function executarFluxo(fluxoId, dadosIniciais = {}) {
  const f = await queryOne('SELECT * FROM kr_fluxos_001 WHERE id=$1 AND ativo=TRUE', [fluxoId])
  if (!f) throw new Error('Fluxo não encontrado ou inativo.')
  const inicio = Date.now()
  let contexto = { ...dadosIniciais }
  try {
    for (const etapa of f.etapas || []) {
      switch (etapa.tipo) {
        case 'condicao':
          if (!avaliarCondicoes(etapa.config?.condicoes || [], contexto)) {
            await logExecucao('fluxo', f.id, true, 'Interrompido por condição falsa', Date.now() - inicio)
            return
          }
          break
        case 'script': {
          if (!etapa.config?.sql) break
          const rows = await query(interpolarSQL(etapa.config.sql, contexto))
          if (rows[0]) contexto = { ...contexto, ...rows[0] }
          break
        }
        case 'api': {
          if (!etapa.config?.url) break
          const r = await executarIntegracaoAdHoc(etapa.config, contexto)
          if (r.data && typeof r.data === 'object') contexto = { ...contexto, ...r.data }
          break
        }
        case 'notificacao':
          if (etapa.config) await enviarNotificacaoAdHoc(etapa.config, contexto)
          break
        case 'espera':
          await new Promise(r => setTimeout(r, (etapa.config?.segundos || 1) * 1000))
          break
      }
    }
    await logExecucao('fluxo', f.id, true, `${(f.etapas || []).length} etapa(s) concluída(s)`, Date.now() - inicio)
  } catch (e) {
    await logExecucao('fluxo', f.id, false, e.message, Date.now() - inicio)
    throw e
  }
}
