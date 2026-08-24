import { BrowserWindow } from 'electron'
import { IS_DEV } from '../config'
import { gerarInstalador, lancarNovaVersao } from '../services/lancarVersaoService'

// Feature restrita a dev — mesma trava dupla de importarBanco.js: escondida
// na UI (Configuracoes.jsx) + este handler recusando explicitamente fora
// de dev, mesmo que alguém tente disparar via DevTools do console.
export function registerLancarVersaoHandlers({ ipcMain }) {

  // Sem wrap() — precisa do `win` pra emitir progresso via evento, mesmo
  // padrão de importarBanco:executar.
  ipcMain.handle('lancarVersao:gerarInstalador', async (e) => {
    if (!IS_DEV) return { ok: false, erro: 'Disponível apenas em ambiente de desenvolvimento.' }
    const win = BrowserWindow.fromWebContents(e.sender)
    const send = (data) => { try { win.webContents.send('lancarVersao:progresso', data) } catch {} }

    try {
      const resultado = await gerarInstalador({ onProgresso: send })
      return { ok: true, ...resultado }
    } catch (err) {
      return { ok: false, erro: err.message }
    }
  })

  // Pipeline completa: token (escopo 'release') + build + package +
  // commit/push + publicação no GitHub.
  ipcMain.handle('lancarVersao:executar', async (e, token) => {
    if (!IS_DEV) return { ok: false, erro: 'Disponível apenas em ambiente de desenvolvimento.' }
    const win = BrowserWindow.fromWebContents(e.sender)
    const send = (data) => { try { win.webContents.send('lancarVersao:progresso', data) } catch {} }

    try {
      const resultado = await lancarNovaVersao({ onProgresso: send, token })
      return { ok: true, ...resultado }
    } catch (err) {
      return { ok: false, erro: err.message }
    }
  })
}
