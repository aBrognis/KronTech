import { app, shell, BrowserWindow, nativeImage, nativeTheme } from 'electron'
import { join } from 'path'
import { loadConfig, encryptSensitiveConfig } from './config'
import { registerHandlers } from './ipcHandlers'
import { initDb } from './db'
import { startReminderCheck } from './services/reminder'
import { setupAutoUpdater } from './services/updater'

function getIcon() {
  const name = nativeTheme.shouldUseDarkColors ? 'icon.ico' : 'icon-light.ico'
  return nativeImage.createFromPath(join(__dirname, '../../resources', name))
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0A0A0A',
    icon: getIcon(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  // Atualiza ícone quando tema do Windows mudar
  nativeTheme.on('updated', () => {
    win.setIcon(getIcon())
  })

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
  win.on('ready-to-show', () => { win.show(); if (isDev) win.maximize() })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Dev: F12 abre DevTools
  win.webContents.on('before-input-event', (_event, input) => {
    if (input.type === 'keyDown' && input.code === 'F12') {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools()
      } else {
        win.webContents.openDevTools({ mode: 'undocked' })
      }
    }
  })
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

if (process.platform === 'win32') {
  app.setAppUserModelId('com.krontech.app')
}

app.whenReady().then(async () => {
  loadConfig()              // lê/cria C:\KronTech\krontech.ini
  encryptSensitiveConfig() // criptografa senhas em texto puro (Windows DPAPI)
  registerHandlers()
  await initDb().catch(err => console.error('initDb error:', err.message))
  startReminderCheck()
  setupAutoUpdater()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
