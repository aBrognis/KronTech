// Registro de hooks pós-save para campos sub_grid, resolvidos pelo nome
// declarado em opcoes.posSaveHook do campo. Mantém o motor genérico de
// sub_grid (subGridService.js) agnóstico de domínio — telas específicas
// plugam lógica própria aqui em vez de o motor genérico conhecer regras
// de negócio de qualquer módulo.
export const SUBGRID_HOOKS = {}
