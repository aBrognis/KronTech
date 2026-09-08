import { listarPastas, arquivarLote, moverParaInboxLote, excluirLote, excluirPermanenteLote, esvaziarLixeira } from '../services/emailPastaService'
import { descobrirPastasAgora } from '../services/emailSyncService'

export function registerEmailPastaHandlers({ ipcMain, wrap }) {
  ipcMain.handle('email:listarPastas', wrap((_, contaId) => listarPastas(contaId)))
  ipcMain.handle('email:arquivarLote', wrap((_, ids) => arquivarLote(ids)))
  ipcMain.handle('email:moverParaInboxLote', wrap((_, ids) => moverParaInboxLote(ids)))
  ipcMain.handle('email:excluirLote', wrap((_, ids) => excluirLote(ids)))
  ipcMain.handle('email:excluirPermanenteLote', wrap((_, ids) => excluirPermanenteLote(ids)))
  ipcMain.handle('email:esvaziarLixeira', wrap((_, contaId) => esvaziarLixeira(contaId || null)))
  ipcMain.handle('email:descobrirPastasAgora', wrap((_, contaId) => descobrirPastasAgora(contaId)))
}
