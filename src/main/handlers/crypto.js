import { encryptCofre, decryptCofre } from '../config'

export function registerCryptoHandlers({ ipcMain }) {

  ipcMain.handle('crypto:encrypt', async (_, texto) => {
    try { return { ok: true, data: encryptCofre(texto) } }
    catch (e) { return { ok: false, erro: e.message } }
  })

  ipcMain.handle('crypto:decrypt', async (_, textoCifrado) => {
    try { return { ok: true, data: decryptCofre(textoCifrado) } }
    catch (e) { return { ok: false, erro: e.message } }
  })
}
