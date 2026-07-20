import { BrowserWindow, dialog } from 'electron'
import { existsSync, mkdirSync } from 'fs'

export function registerConfigHandlers({ ipcMain, wrap, getConfigForFrontend, saveConfig, saveSectionConfig, INI_PATH }) {

  ipcMain.handle('config:get',        wrap(() => getConfigForFrontend()))
  ipcMain.handle('config:set',        wrap((_, { section, key, value }) => saveConfig(section, key, value)))
  ipcMain.handle('config:setSection', wrap((_, { section, kvs })        => saveSectionConfig(section, kvs)))
  ipcMain.handle('config:getIniPath', wrap(() => INI_PATH))

  ipcMain.handle('config:selecionarPasta', wrap(async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Selecionar pasta de arquivos',
      properties: ['openDirectory', 'createDirectory'],
    })
    if (canceled || !filePaths.length) return null
    const pasta = filePaths[0]
    saveConfig('Caminhos', 'arquivos', pasta)
    if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true })
    return pasta
  }))
}
