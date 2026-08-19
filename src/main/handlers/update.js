import { app } from 'electron'
import { checkForUpdates, downloadUpdate, installUpdate, getLastUpdateState } from '../services/updater'

export function registerUpdateHandlers({ ipcMain, wrap }) {
  ipcMain.handle('update:check',       wrap(() => checkForUpdates()))
  ipcMain.handle('update:download',    wrap(() => downloadUpdate()))
  ipcMain.handle('update:install',     wrap(() => installUpdate()))
  ipcMain.handle('update:version',     wrap(() => app.getVersion()))
  // Sem wrap() — UpdateBanner.jsx desestrutura {event, data} direto do
  // retorno, mesmo formato que já era usado quando este handler vivia em
  // services/updater.js.
  ipcMain.handle('update:getLastState', () => getLastUpdateState())
}
