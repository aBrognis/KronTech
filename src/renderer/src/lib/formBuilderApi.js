// Centraliza todas as chamadas à API do FormBuilder expostas pelo preload

const api = () => window.api.formBuilder

// ── Telas ─────────────────────────────────────────────────────────────────────
export const listarTelas        = (apenasAtivas) => api().listarTelas(apenasAtivas)
export const buscarTela         = (id)           => api().buscarTela(id)
export const criarTela          = (payload)      => api().criarTela(payload)
export const editarTela         = (id, payload)  => api().editarTela(id, payload)
export const excluirTela        = (id)           => api().excluirTela(id)

// ── Registros ─────────────────────────────────────────────────────────────────
export const listarRegistros    = (tbl, opts)    => api().listarRegistros(tbl, opts)
export const getAllRegistros     = (tbl)          => api().getAllRegistros(tbl)
export const inserirRegistro    = (tbl, dados)   => api().inserirRegistro(tbl, dados)
export const atualizarRegistro  = (tbl, id, dados, ts) => api().atualizarRegistro(tbl, id, dados, ts)
export const inativarRegistro   = (tbl, id, ts)  => api().inativarRegistro(tbl, id, ts)
export const toggleFavorito     = (tbl, id, ts)  => api().toggleFavorito(tbl, id, ts)
export const proximoCodigo      = (tbl, col, pad, chars) => api().proximoCodigo(tbl, col, pad, chars)
export const valoresDistintos   = (tbl, col)     => api().valoresDistintos(tbl, col)

// ── Lookup ────────────────────────────────────────────────────────────────────
export const listarOpcoesLookup = (tabela, exibir, codigo) =>
  api().listarOpcoesLookup(tabela, exibir, codigo)
export const colunasTabela      = (tabela) => api().colunasTabela(tabela)

// ── Módulos ───────────────────────────────────────────────────────────────────
export const listarModulos      = ()             => api().listarModulos()
export const criarModulo        = (dados)        => api().criarModulo(dados)
export const editarModulo       = (id, dados)    => api().editarModulo(id, dados)
export const excluirModulo      = (id)           => api().excluirModulo(id)

// ── Importação ────────────────────────────────────────────────────────────────
export const importarPasta      = (opts)         => api().importarPasta(opts)
