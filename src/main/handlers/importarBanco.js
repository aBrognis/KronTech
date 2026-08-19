import { BrowserWindow } from 'electron'
import { Pool } from 'pg'
import { IS_DEV, getDecryptedBancoConfig } from '../config'
import { importarBancoDeProducao, testarConexaoProducao } from '../services/importarBanco'

// Feature restrita a dev — trava dupla: item de menu escondido na UI (ver
// Sidebar.jsx) + este handler recusando explicitamente fora de dev, mesmo
// que alguém tente disparar via DevTools do console.
export function registerImportarBancoHandlers({ ipcMain, wrap }) {

  ipcMain.handle('importarBanco:isDev', wrap(() => IS_DEV))

  ipcMain.handle('importarBanco:testarConexaoProducao', wrap(async () => {
    if (!IS_DEV) throw new Error('Disponível apenas em ambiente de desenvolvimento.')
    await testarConexaoProducao()
    return true
  }))

  // Testa o próprio banco de dev com uma conexão NOVA e independente (não o
  // pool singleton de db.js, que guarda a senha usada no boot do app — se a
  // senha do Postgres mudou depois, aquele pool nunca saberia). Útil pra
  // confirmar se o .ini já está com o valor certo antes de reiniciar o app.
  ipcMain.handle('importarBanco:testarConexaoDev', wrap(async () => {
    if (!IS_DEV) throw new Error('Disponível apenas em ambiente de desenvolvimento.')
    const banco = getDecryptedBancoConfig()
    const pool = new Pool({
      host: banco.host, port: banco.port, database: banco.database,
      user: banco.user, password: banco.password,
    })
    try {
      await pool.query('SELECT 1')
      return true
    } finally {
      await pool.end()
    }
  }))

  // Sem wrap() — precisa do `win` pra emitir progresso via evento, e quer
  // controlar o formato do erro final (mesmo padrão de arquivos:importarPasta).
  ipcMain.handle('importarBanco:executar', async (e, token) => {
    if (!IS_DEV) return { ok: false, erro: 'Disponível apenas em ambiente de desenvolvimento.' }
    const win = BrowserWindow.fromWebContents(e.sender)
    const send = (data) => { try { win.webContents.send('importarBanco:progresso', data) } catch {} }

    try {
      const resultado = await importarBancoDeProducao({
        onProgresso: send,
        BrowserWindow,
        token,
      })
      return { ok: true, ...resultado }
    } catch (err) {
      return { ok: false, erro: err.message }
    }
  })
}
