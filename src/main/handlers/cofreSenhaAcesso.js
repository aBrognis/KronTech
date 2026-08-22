const ACOES_VALIDAS = ['visualizar', 'copiar', 'copiar_totp']

export function registerCofreSenhaAcessoHandlers({ ipcMain, wrap, query }) {

  ipcMain.handle('cofreSenhaAcesso:registrar', wrap(async (_, { credencialId, acao, usuarioNome } = {}) => {
    if (!credencialId || !ACOES_VALIDAS.includes(acao)) return
    await query(
      `INSERT INTO cofre_senha_acesso_log_001 (credencial_id, acao, usuario_nome) VALUES ($1,$2,$3)`,
      [credencialId, acao, usuarioNome || '']
    )
  }))

  ipcMain.handle('cofreSenhaAcesso:listar', wrap(async (_, credencialId) => {
    return query(
      `SELECT id, acao, usuario_nome, criado_em FROM cofre_senha_acesso_log_001
       WHERE credencial_id=$1 ORDER BY criado_em DESC LIMIT 200`,
      [credencialId]
    )
  }))
}
