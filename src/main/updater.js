import { autoUpdater } from 'electron-updater'
import { app, BrowserWindow } from 'electron'

// Token injetado em build-time via electron.vite.config.mjs — não existe em runtime
const UPDATER_TOKEN = __UPDATER_TOKEN__

export function setupAutoUpdater() {
  // Só verifica atualizações no app empacotado
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowPrerelease = false

  // Configura o feed explicitamente
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'aBrognis',
    repo: 'KronTech',
    token: UPDATER_TOKEN,
  })

  autoUpdater.on('checking-for-update',  ()     => broadcast('update:checking'))
  autoUpdater.on('update-available',     (info) => broadcast('update:available', info))
  autoUpdater.on('update-not-available', ()     => broadcast('update:not-available'))
  autoUpdater.on('download-progress',    (prog) => broadcast('update:progress', prog))
  autoUpdater.on('update-downloaded',    (info) => broadcast('update:downloaded', info))
  autoUpdater.on('error',                (err)  => broadcast('update:error', err.message))

  // Dispara 3s após o app estar pronto — garante que o renderer já carregou
  app.whenReady().then(() => {
    setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 3000)
  })
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
