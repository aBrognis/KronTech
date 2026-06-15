import { autoUpdater } from 'electron-updater'
import { app, BrowserWindow, ipcMain } from 'electron'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

let lastEvent = null
let lastData  = null
let logPath   = null

function log(msg) {
  try {
    if (!logPath) {
      const dir = join(app.getPath('userData'), 'logs')
      mkdirSync(dir, { recursive: true })
      logPath = join(dir, 'updater.log')
    }
    writeFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`, { flag: 'a' })
  } catch {}
}

export function setupAutoUpdater() {
  if (!app.isPackaged) return

  log('setupAutoUpdater iniciado — versao ' + app.getVersion())

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowPrerelease = false

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'aBrognis',
    repo: 'KronTech',
  })

  const save = (ev, data) => {
    log('evento: ' + ev + (data ? ' | ' + JSON.stringify(data).slice(0, 200) : ''))
    lastEvent = ev
    lastData  = data
    broadcast('update:' + ev, data)
  }

  autoUpdater.on('checking-for-update',  ()     => save('checking'))
  autoUpdater.on('update-available',     (info) => save('available', info))
  autoUpdater.on('update-not-available', ()     => save('not-available'))
  autoUpdater.on('download-progress',    (prog) => save('progress', prog))
  autoUpdater.on('update-downloaded',    (info) => save('downloaded', info))
  autoUpdater.on('error',                (err)  => { log('ERRO: ' + err.message); save('error', err.message) })

  ipcMain.handle('update:getLastState', () => ({ event: lastEvent, data: lastData }))

  app.whenReady().then(() => {
    setTimeout(() => {
      log('chamando checkForUpdates...')
      autoUpdater.checkForUpdates().catch(e => log('checkForUpdates CATCH: ' + e.message))
    }, 2000)
  })
}

export function checkForUpdates() {
  return autoUpdater.checkForUpdates()
}

export function downloadUpdate() {
  log('downloadUpdate chamado')
  return autoUpdater.downloadUpdate().catch(e => { log('downloadUpdate ERRO: ' + e.message); throw e })
}

export function installUpdate() {
  autoUpdater.quitAndInstall(false, true)
}

function broadcast(channel, data) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, data)
  }
}
