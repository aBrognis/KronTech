import { BrowserWindow, dialog } from 'electron'
import { existsSync, mkdirSync } from 'fs'

export function registerConfigHandlers({ ipcMain, wrap, getConfigForFrontend, saveConfig, saveSectionConfig, INI_PATH }) {

  ipcMain.handle('config:get',        wrap(() => getConfigForFrontend()))
  ipcMain.handle('config:set',        wrap((_, { section, key, value }) => saveConfig(section, key, value)))
  ipcMain.handle('config:setSection', wrap((_, { section, kvs }) => {
    const result = saveSectionConfig(section, kvs)
    // Personalização (cor/identidade) precisa refletir em todas as janelas
    // abertas (app principal + Designer, que roda em BrowserWindow separada
    // e não recebe window.dispatchEvent da outra janela).
    if (section === 'Personalizacao') {
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) win.webContents.send('config:personalizacaoAlterada', kvs)
      }
    }
    return result
  }))
  ipcMain.handle('config:getIniPath', wrap(() => INI_PATH))

  ipcMain.handle('config:selecionarPasta', wrap(async (e, opts = {}) => {
    const chave = opts.chave || 'arquivos'
    const win = BrowserWindow.fromWebContents(e.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: opts.titulo || 'Selecionar pasta de arquivos',
      properties: ['openDirectory', 'createDirectory'],
    })
    if (canceled || !filePaths.length) return null
    const pasta = filePaths[0]
    // apenasSelecionar: usado por telas que gravam a pasta numa seção
    // diferente de Caminhos (ex.: BancoProducao.iniPath) — só abre o diálogo
    // e devolve o caminho, sem gravar nem criar a pasta (pasta remota já
    // deve existir; criar não faz sentido nesse caso).
    if (opts.apenasSelecionar) return pasta
    saveConfig('Caminhos', chave, pasta)
    if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true })
    return pasta
  }))

  // Seleção do arquivo krontech.ini de produção diretamente (não a pasta) —
  // usado só por "Importar Banco". Guardar o caminho do arquivo em vez da
  // pasta evita ambiguidade quando a pasta contém mais de um .ini ou quando
  // o arquivo não se chama exatamente "krontech.ini".
  ipcMain.handle('config:selecionarArquivoIni', wrap(async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Selecionar o krontech.ini de produção',
      properties: ['openFile'],
      filters: [{ name: 'Arquivo de configuração', extensions: ['ini'] }],
    })
    if (canceled || !filePaths.length) return null
    return filePaths[0]
  }))
}
