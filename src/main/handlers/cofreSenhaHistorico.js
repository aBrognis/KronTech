import { decryptCofre } from '../config'

export function registerCofreSenhaHistoricoHandlers({ ipcMain, wrap, query }) {

  ipcMain.handle('cofreSenhaHistorico:listar', wrap(async (_, credencialId) => {
    const rows = await query(
      `SELECT id, senha_anterior, alterado_em, alterado_por
       FROM cofre_senha_historico_001 WHERE credencial_id=$1 ORDER BY alterado_em DESC`,
      [credencialId]
    )
    return rows.map(r => ({ ...r, senha_anterior: decryptCofre(r.senha_anterior) }))
  }))
}
