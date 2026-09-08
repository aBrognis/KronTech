import { BrowserWindow } from 'electron'
import {
  listarMensagens,
  contarMensagens,
  contarNaoLidas,
  contarNaoLidasPorPasta,
  obterMensagem,
  marcarLida,
  marcarLidaLote,
  listarMensagensAgrupadas,
  contarThreads,
  listarMensagensDaThread,
  sinalizar,
  sinalizarLote,
  listarRascunhos,
  salvarRascunho,
  excluirRascunho,
  sugerirContatos,
} from '../services/emailMensagemService'
import { sincronizarContaAgora, ressincronizarDesde } from '../services/emailSyncService'

export function registerEmailMensagemHandlers({ ipcMain, wrap }) {
  ipcMain.handle('email:listarMensagens', wrap((_, filtros) => listarMensagens(filtros)))
  ipcMain.handle('email:contarMensagens', wrap((_, filtros) => contarMensagens(filtros)))
  ipcMain.handle('email:contarNaoLidas', wrap((_, contaId) => contarNaoLidas(contaId)))
  ipcMain.handle('email:contarNaoLidasPorPasta', wrap((_, contaId) => contarNaoLidasPorPasta(contaId)))
  ipcMain.handle('email:obterMensagem', wrap((_, id) => obterMensagem(id)))
  ipcMain.handle('email:marcarLida', wrap((_, id, lida) => marcarLida(id, lida)))
  ipcMain.handle('email:marcarLidaLote', wrap((_, ids, lida) => marcarLidaLote(ids, lida)))
  ipcMain.handle('email:listarMensagensAgrupadas', wrap((_, filtros) => listarMensagensAgrupadas(filtros)))
  ipcMain.handle('email:contarThreads', wrap((_, filtros) => contarThreads(filtros)))
  ipcMain.handle('email:listarMensagensDaThread', wrap((_, grupo) => listarMensagensDaThread(grupo)))
  ipcMain.handle('email:sinalizar', wrap((_, id, sinalizada) => sinalizar(id, sinalizada)))
  ipcMain.handle('email:sinalizarLote', wrap((_, ids, sinalizada) => sinalizarLote(ids, sinalizada)))
  ipcMain.handle('email:listarRascunhos', wrap((_, contaId) => listarRascunhos(contaId)))
  ipcMain.handle('email:salvarRascunho', wrap((_, dados) => salvarRascunho(dados)))
  ipcMain.handle('email:excluirRascunho', wrap((_, id) => excluirRascunho(id)))
  ipcMain.handle('email:sugerirContatos', wrap((_, termo, limite) => sugerirContatos(termo, limite)))

  // Sem wrap() — sync sob demanda pode levar alguns segundos (I/O de rede
  // IMAP), a UI mostra progresso via evento em vez de loading mudo. Mesmo
  // padrão de documentoGerado:gerar.
  ipcMain.handle('email:sincronizarAgora', async (e, contaId) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const send = (data) => { try { win.webContents.send('email:progressoSync', data) } catch {} }

    try {
      send({ fase: 'sincronizando' })
      const resultado = await sincronizarContaAgora(contaId)
      send({ fase: 'pronto' })
      return { ok: true, data: resultado }
    } catch (err) {
      return { ok: false, erro: err.message }
    }
  })

  ipcMain.handle('email:ressincronizarDesde', async (e, contaId, novaData) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const send = (data) => { try { win.webContents.send('email:progressoSync', data) } catch {} }

    try {
      send({ fase: 'sincronizando' })
      const resultado = await ressincronizarDesde(contaId, novaData)
      send({ fase: 'pronto' })
      return { ok: true, data: resultado }
    } catch (err) {
      return { ok: false, erro: err.message }
    }
  })
}
