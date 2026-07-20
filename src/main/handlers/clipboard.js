import { clipboard } from 'electron'

export function registerClipboardHandlers({ ipcMain, wrap }) {
  ipcMain.handle('clipboard:write', wrap((_e, texto) => {
    clipboard.writeText(String(texto ?? ''))
    return true
  }))
  ipcMain.handle('clipboard:read', wrap(() => clipboard.readText()))
}
