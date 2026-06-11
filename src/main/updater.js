import { autoUpdater } from 'electron-updater'
import { app, BrowserWindow, ipcMain } from 'electron'

const UPDATER_TOKEN = __UPDATER_TOKEN__

let lastEvent = null
let lastData  = null

export function setupAutoUpdater() {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowPrerelease = false

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'aBrognis',
    repo: 'KronTech',
    token: UPDATER_TOKEN,
  })

  const save = (ev, data) => { lastEvent = ev; lastData = data; broadcast('update:' + ev, data) }

  autoUpdater.on('checking-for-update',  ()     => save('checking'))
  autoUpdater.on('update-available',     (info) => save('available', info))
  autoUpdater.on('update-not-available', ()     => save('not-available'))
  autoUpdater.on('download-progress',    (prog) => save('progress', prog))
  autoUpdater.on('update-downloaded',    (info) => save('downloaded', info))
  autoUpdater.on('error',                (err)  => save('error', err.message))

  // Quando o renderer pede o estado atual (caso já tenha disparado antes de carregar)
  ipcMain.handle('update:getLastState', () => ({ event: lastEvent, data: lastData }))

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
