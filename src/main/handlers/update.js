import { app } from 'electron'
import { checkForUpdates, downloadUpdate, installUpdate } from '../services/updater'

export function registerUpdateHandlers({ ipcMain, wrap }) {
  ipcMain.handle('update:check',    wrap(() => checkForUpdates()))
  ipcMain.handle('update:download', wrap(() => downloadUpdate()))
  ipcMain.handle('update:install',  wrap(() => installUpdate()))
  ipcMain.handle('update:version',  wrap(() => app.getVersion()))
}
