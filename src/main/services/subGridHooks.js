// Registro de hooks pós-save para campos sub_grid, resolvidos pelo nome
// declarado em opcoes.posSaveHook do campo (ex: 'financeiro.recomputeTituloStatus').
// Mantém o motor genérico de sub_grid (subGridService.js) agnóstico de
// domínio — telas específicas plugam lógica própria aqui em vez de o motor
// genérico conhecer regras de negócio de qualquer módulo.
import { atualizarParcelasEStatusTitulo, inserirTituloEParcelas } from './financeiroService'

export const SUBGRID_HOOKS = {
  'financeiro.atualizarTitulo': {
    inserir: (nomeTabelaPai, dadosPai, nomeCampoSubGrid, linhas) =>
      inserirTituloEParcelas(nomeTabelaPai, dadosPai, nomeCampoSubGrid, linhas),
    atualizar: (nomeTabelaPai, id, dadosPai, nomeCampoSubGrid, linhas, hasTs) =>
      atualizarParcelasEStatusTitulo(nomeTabelaPai, id, dadosPai, nomeCampoSubGrid, linhas, hasTs),
  },
}
