import { BrowserWindow, app } from 'electron'
import { readFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { IS_DEV } from '../config'
import { gerarInstalador, lancarNovaVersao } from '../services/lancarVersaoService'

// RELEASE_NOTES.md na raiz do projeto — Claude escreve o changelog aqui ao
// terminar uma sessão de trabalho, o modal "Lançar Versão" lê e pré-
// preenche o campo de notas automaticamente (ainda editável antes de
// confirmar). Arquivo é consumido (apagado) após o lançamento — evita notas
// de uma sessão vazando pro lançamento seguinte.
const RELEASE_NOTES_PATH = join(app.getAppPath(), 'RELEASE_NOTES.md')

// Feature restrita a dev — mesma trava dupla de importarBanco.js: escondida
// na UI (Configuracoes.jsx) + este handler recusando explicitamente fora
// de dev, mesmo que alguém tente disparar via DevTools do console.
export function registerLancarVersaoHandlers({ ipcMain }) {

  ipcMain.handle('lancarVersao:lerNotasPendentes', () => {
    if (!existsSync(RELEASE_NOTES_PATH)) return ''
    try {
      return readFileSync(RELEASE_NOTES_PATH, 'utf-8').trim()
    } catch {
      return ''
    }
  })

  // Sem wrap() — precisa do `win` pra emitir progresso via evento, mesmo
  // padrão de importarBanco:executar.
  ipcMain.handle('lancarVersao:gerarInstalador', async (e) => {
    if (!IS_DEV) return { ok: false, erro: 'Disponível apenas em ambiente de desenvolvimento.' }
    const win = BrowserWindow.fromWebContents(e.sender)
    const send = (data) => { try { win.webContents.send('lancarVersao:progresso', data) } catch {} }

    try {
      const resultado = await gerarInstalador({ onProgresso: send })
      return { ok: true, ...resultado }
    } catch (err) {
      return { ok: false, erro: err.message }
    }
  })

  // Pipeline completa: token (escopo 'release') + build + package +
  // commit/push + publicação no GitHub.
  ipcMain.handle('lancarVersao:executar', async (e, token, notas) => {
    if (!IS_DEV) return { ok: false, erro: 'Disponível apenas em ambiente de desenvolvimento.' }
    const win = BrowserWindow.fromWebContents(e.sender)
    const send = (data) => { try { win.webContents.send('lancarVersao:progresso', data) } catch {} }

    try {
      const resultado = await lancarNovaVersao({ onProgresso: send, token, notas })
      if (existsSync(RELEASE_NOTES_PATH)) {
        try { unlinkSync(RELEASE_NOTES_PATH) } catch {}
      }
      return { ok: true, ...resultado }
    } catch (err) {
      return { ok: false, erro: err.message }
    }
  })
}
