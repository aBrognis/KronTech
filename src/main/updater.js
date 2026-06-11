import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'

export function setupAutoUpdater() {
  // Não roda em modo de desenvolvimento
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') return

  autoUpdater.autoDownload = false       // usuário decide quando baixar
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update',  ()       => broadcast('update:checking'))
  autoUpdater.on('update-available',     (info)   => broadcast('update:available', info))
  autoUpdater.on('update-not-available', ()       => broadcast('update:not-available'))
  autoUpdater.on('download-progress',    (prog)   => broadcast('update:progress', prog))
  autoUpdater.on('update-downloaded',    (info)   => broadcast('update:downloaded', info))
  autoUpdater.on('error',                (err)    => broadcast('update:error', err.message))

  // Verifica 8 segundos após a janela abrir
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {})
  }, 8000)
}

export function checkForUpdates() {
  return autoUpdater.checkForUpdates()
}

export function downloadUpdate() {
  return autoUpdater.downloadUpdate()
}

export function installUpdate() {
  autoUpdater.quitAndInstall(false, true)
}

function broadcast(channel, data) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, data)
  }
}
