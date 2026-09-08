import { BrowserWindow } from 'electron'
import { enviarEmail, tentarFilaSaida } from '../services/emailEnvioService'
import { selecionarECopiarArquivo } from './arquivos'

export function registerEmailEnvioHandlers({ ipcMain, wrap, getConfig }) {
  // enviarEmail agora NUNCA "perde" o e-mail: se o SMTP falha por rede, a
  // mensagem fica na Caixa de Saida e wrap() devolve {ok:false,erro} com a
  // explicacao (o composer mostra e fecha; a fila reenvia sozinha).
  ipcMain.handle('email:enviar', wrap((_, dados) => enviarEmail(dados)))

  // "Reenviar agora" — forca a fila (ignora o horario agendado). Sem
  // mensagemId reprocessa a fila inteira.
  ipcMain.handle('email:reenviarFilaSaida', wrap((_, mensagemId) => tentarFilaSaida({ forcar: true, mensagemId: mensagemId || null })))

  ipcMain.handle('email:selecionarAnexos', wrap(async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    return selecionarECopiarArquivo({ subpasta: 'email/rascunhos', chaveCaminho: 'arquivosEmail' }, win, getConfig)
  }))
}
