import { BrowserWindow, app, shell, nativeTheme } from 'electron'
import { join } from 'path'
import { getIcon } from '../appIcon'

let _designerWin = null

function createDesignerWindow() {
  if (_designerWin && !_designerWin.isDestroyed()) {
    _designerWin.focus()
    return
  }
  _designerWin = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1000, minHeight: 700,
    show: false, frame: false, titleBarStyle: 'hidden',
    backgroundColor: '#0A0A0A',
    icon: getIcon(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false, contextIsolation: true,
    },
  })
  _designerWin.on('ready-to-show', () => { _designerWin.show(); _designerWin.maximize() })
  _designerWin.on('closed', () => { _designerWin = null })
  const onThemeUpdate = () => { if (!_designerWin.isDestroyed()) _designerWin.setIcon(getIcon()) }
  nativeTheme.on('updated', onThemeUpdate)
  _designerWin.on('closed', () => nativeTheme.off('updated', onThemeUpdate))
  _designerWin.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })
  _designerWin.webContents.on('before-input-event', (_ev, input) => {
    if (input.type === 'keyDown' && input.code === 'F12') {
      _designerWin.webContents.isDevToolsOpened()
        ? _designerWin.webContents.closeDevTools()
        : _designerWin.webContents.openDevTools({ mode: 'undocked' })
    }
  })
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    _designerWin.loadURL(process.env['ELECTRON_RENDERER_URL'] + '?mode=designer')
  } else {
    _designerWin.loadFile(join(__dirname, '../renderer/index.html'), { query: { mode: 'designer' } })
  }
}

export function registerJanelaHandlers({ ipcMain, wrap }) {
  ipcMain.handle('win:minimize', wrap((e) => { BrowserWindow.fromWebContents(e.sender)?.minimize() }))
  ipcMain.handle('designer:open', wrap(() => { createDesignerWindow() }))
  ipcMain.handle('win:maximize', wrap((e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    win?.isMaximized() ? win.unmaximize() : win.maximize()
  }))
  ipcMain.handle('win:close', wrap((e) => { BrowserWindow.fromWebContents(e.sender)?.close() }))
  ipcMain.handle('win:isMaximized', wrap((e) => BrowserWindow.fromWebContents(e.sender)?.isMaximized() ?? false))
}
