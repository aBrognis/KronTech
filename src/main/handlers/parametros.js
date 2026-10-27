import * as parametrosService from '../services/parametrosService'

export function registerParametrosHandlers({ ipcMain, wrap }) {
  ipcMain.handle('parametros:listar', wrap((_e, filtros) => parametrosService.listar(filtros || {})))
  ipcMain.handle('parametros:listarCategorias', wrap(() => parametrosService.listarCategorias()))
  ipcMain.handle('parametros:obter', wrap((_e, chave) => parametrosService.obter(chave)))
  ipcMain.handle('parametros:atualizar', wrap((_e, id, dados) => parametrosService.atualizar(id, dados)))
}
