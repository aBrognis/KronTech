import * as usuarioService from '../services/usuarioService'

export function registerUsuarioHandlers({ ipcMain, wrap }) {
  ipcMain.handle('usuario:listar', wrap((_e, f) => usuarioService.listar(f || {})))
  ipcMain.handle('usuario:obter', wrap((_e, id) => usuarioService.obter(id)))
  ipcMain.handle('usuario:criar', wrap((_e, d) => usuarioService.criar(d)))
  ipcMain.handle('usuario:atualizar', wrap((_e, d) => usuarioService.atualizar(d)))
  ipcMain.handle('usuario:excluir', wrap((_e, id) => usuarioService.excluir(id)))
  ipcMain.handle('usuario:mudarStatusLote', wrap((_e, { ids, status }) => usuarioService.mudarStatusLote(ids, status)))
  ipcMain.handle('usuario:redefinirSenha', wrap((_e, { id, novaSenha, porNome, forcarTroca }) => usuarioService.redefinirSenha(id, novaSenha, { porNome, forcarTroca })))
  ipcMain.handle('usuario:listarParaGestor', wrap((_e, id) => usuarioService.listarParaGestor(id)))
}
