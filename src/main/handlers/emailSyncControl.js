import { startEmailSync, stopEmailSync } from '../services/emailSyncService'

// A sincronizacao de e-mail so pode comecar DEPOIS que o usuario logou no
// sistema. O login e todo no renderer (LoginPage -> setSessao), entao o
// renderer avisa o main por estes IPCs. startEmailSync e idempotente.
export function registerEmailSyncControl({ ipcMain }) {
  ipcMain.handle('email:iniciarSync', () => { startEmailSync(); return { ok: true } })
  ipcMain.handle('email:pararSync', () => { stopEmailSync(); return { ok: true } })
}
