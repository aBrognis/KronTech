import { criarCadastroPadrao, registrarHandlersCadastro } from '../services/cadastroPadraoFactory'
import * as bancoService from '../services/bancoService'
import * as condicaoService from '../services/condicaoPagamentoService'

// Cadastros de apoio da Entidade / faturamento.
//  - Naturezas Juridicas: tabela unica -> factory.
//  - Bancos e Condicoes de Pagamento: tem grids-filho -> service dedicado.

const naturezaJuridica = criarCadastroPadrao({
  tabela: 'natureza_juridica_001',
  colunas: [
    'codigo_receita', 'descricao', 'grupo', 'tipo_pessoa', 'exige_ie',
    'contribuinte_icms_padrao', 'regime_sugerido', 'base_legal', 'observacoes',
  ],
  colunasBusca: ['descricao', 'codigo_receita', 'grupo', 'base_legal'],
  colunasFiltro: [
    { chave: 'codigo', tipo: 'texto' },
    { chave: 'codigo_receita', tipo: 'texto' },
    { chave: 'descricao', tipo: 'texto' },
    { chave: 'grupo', tipo: 'texto' },
    { chave: 'tipo_pessoa', tipo: 'exato' },
    { chave: 'regime_sugerido', tipo: 'texto' },
    { chave: 'exige_ie', tipo: 'booleano' },
    { chave: 'contribuinte_icms_padrao', tipo: 'booleano' },
    { chave: 'ativo', tipo: 'booleano' },
    { chave: 'criado_em', tipo: 'data' },
  ],
  ordem: 'descricao ASC',
  normalizar: (d) => ({
    ...d,
    descricao: typeof d.descricao === 'string' ? d.descricao.trim().toUpperCase() : d.descricao,
    codigo_receita: typeof d.codigo_receita === 'string' ? d.codigo_receita.trim() : d.codigo_receita,
  }),
})

export function registerCadastrosApoioHandlers({ ipcMain, wrap }) {
  registrarHandlersCadastro(ipcMain, wrap, 'naturezaJuridica', naturezaJuridica)

  // ── Bancos ─────────────────────────────────────────────────────────
  ipcMain.handle('banco:listar', wrap((_e, f) => bancoService.listar(f || {})))
  ipcMain.handle('banco:obter', wrap((_e, id) => bancoService.obter(id)))
  ipcMain.handle('banco:criar', wrap((_e, d) => bancoService.criar(d)))
  ipcMain.handle('banco:atualizar', wrap((_e, d) => bancoService.atualizar(d)))
  ipcMain.handle('banco:excluir', wrap((_e, id) => bancoService.excluir(id)))
  ipcMain.handle('banco:mudarAtivoLote', wrap((_e, { ids, ativo }) => bancoService.mudarAtivoLote(ids, ativo)))
  ipcMain.handle('banco:importarFebraban', wrap(() => bancoService.importarFebraban()))

  // ── Condicoes de Pagamento ─────────────────────────────────────────
  ipcMain.handle('condicaoPagamento:listar', wrap((_e, f) => condicaoService.listar(f || {})))
  ipcMain.handle('condicaoPagamento:obter', wrap((_e, id) => condicaoService.obter(id)))
  ipcMain.handle('condicaoPagamento:criar', wrap((_e, d) => condicaoService.criar(d)))
  ipcMain.handle('condicaoPagamento:atualizar', wrap((_e, d) => condicaoService.atualizar(d)))
  ipcMain.handle('condicaoPagamento:excluir', wrap((_e, id) => condicaoService.excluir(id)))
  ipcMain.handle('condicaoPagamento:mudarAtivoLote', wrap((_e, { ids, ativo }) => condicaoService.mudarAtivoLote(ids, ativo)))

}
