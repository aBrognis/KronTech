import {
  listarEtiquetas,
  criarEtiqueta,
  atualizarEtiqueta,
  excluirEtiqueta,
  etiquetasPorMensagens,
  aplicarEtiquetaLote,
  removerEtiquetaLote,
} from '../services/emailEtiquetaService'

export function registerEmailEtiquetaHandlers({ ipcMain, wrap }) {
  ipcMain.handle('email:listarEtiquetas', wrap(() => listarEtiquetas()))
  ipcMain.handle('email:criarEtiqueta', wrap((_, dados) => criarEtiqueta(dados)))
  ipcMain.handle('email:atualizarEtiqueta', wrap((_, id, dados) => atualizarEtiqueta(id, dados)))
  ipcMain.handle('email:excluirEtiqueta', wrap((_, id) => excluirEtiqueta(id)))
  ipcMain.handle('email:etiquetasPorMensagens', wrap((_, ids) => etiquetasPorMensagens(ids)))
  ipcMain.handle('email:aplicarEtiquetaLote', wrap((_, ids, etiquetaId) => aplicarEtiquetaLote(ids, etiquetaId)))
  ipcMain.handle('email:removerEtiquetaLote', wrap((_, ids, etiquetaId) => removerEtiquetaLote(ids, etiquetaId)))
}
