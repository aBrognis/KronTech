import bcrypt from 'bcrypt'

export function registerAuthHandlers({ ipcMain, query, queryOne }) {

  ipcMain.handle('auth:login', async (_, usuario, senha) => {
    const login = String(usuario).toLowerCase().trim()
    const pwd   = String(senha)
    try {
      // 1) Tenta tabela usuario_001 se existir
      const tabelaExiste = await queryOne(
        `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='usuario_001'`
      )
      if (tabelaExiste) {
        // Descobre qual coluna é o campo login (tipo='login') e qual é a senha
        const colLogin = await queryOne(
          `SELECT nome_campo FROM kr_tela_campos tc
           JOIN kr_telas t ON t.id=tc.tela_id
           WHERE t.nome_tabela='usuario_001' AND tc.tipo='login' AND tc.ativo=TRUE LIMIT 1`
        )
        const colSenha = await queryOne(
          `SELECT nome_campo FROM kr_tela_campos tc
           JOIN kr_telas t ON t.id=tc.tela_id
           WHERE t.nome_tabela='usuario_001' AND tc.tipo='senha' AND tc.ativo=TRUE LIMIT 1`
        )
        if (colLogin && colSenha) {
          const row = await queryOne(
            `SELECT id, ${colLogin.nome_campo} AS login, nome, status, foto, ${colSenha.nome_campo} AS senha_hash
             FROM usuario_001
             WHERE LOWER(${colLogin.nome_campo})=$1 AND ativo=TRUE LIMIT 1`,
            [login]
          )
          if (row) {
            if (!row.senha_hash) return { ok: false, erro: 'Usuário sem senha definida. Contate o administrador.' }
            const ok = await bcrypt.compare(pwd, row.senha_hash)
            if (!ok) return { ok: false, erro: 'Senha incorreta.' }
            if (row.status === 'inativo')   return { ok: false, erro: 'Usuário inativo.' }
            if (row.status === 'bloqueado') return { ok: false, erro: 'Usuário bloqueado.' }
            return { ok: true, user: { id: row.id, usuario: row.login, nome: row.nome, perfil: row.status || 'usuario', foto: row.foto || null, fonte: 'usuario_001' } }
          }
        }
      }

      // 2) Fallback: tabela kr_usuarios (admin/admin)
      const row = await queryOne(
        `SELECT id, usuario, nome, perfil, senha_hash FROM kr_usuarios WHERE usuario=$1 AND ativo=TRUE`,
        [login]
      )
      if (!row) return { ok: false, erro: 'Usuário não encontrado ou inativo.' }
      const okSenha = await bcrypt.compare(pwd, String(row.senha_hash))
      if (!okSenha) return { ok: false, erro: 'Senha incorreta.' }
      return { ok: true, user: { id: row.id, usuario: row.usuario, nome: row.nome, perfil: row.perfil, fonte: 'sistema' } }
    } catch (e) {
      return { ok: false, erro: 'Erro interno: ' + e.message }
    }
  })

  ipcMain.handle('auth:redefinirSenha', async (_, { tabelaUsuario, campoCodigo, id, novaSenha }) => {
    try {
      const hash = await bcrypt.hash(String(novaSenha), 10)
      const colSenha = await queryOne(
        `SELECT nome_campo FROM kr_tela_campos tc
         JOIN kr_telas t ON t.id=tc.tela_id
         WHERE t.nome_tabela=$1 AND tc.tipo='senha' AND tc.ativo=TRUE LIMIT 1`,
        [tabelaUsuario]
      )
      if (!colSenha) return { ok: false, erro: 'Coluna de senha não encontrada.' }
      const pk = campoCodigo || 'id'
      const hasTs = await queryOne(`SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name='alterado_em' LIMIT 1`, [tabelaUsuario])
      const tsClause = hasTs ? `, alterado_em=NOW()` : ''
      await query(`UPDATE ${tabelaUsuario} SET ${colSenha.nome_campo}=$1${tsClause} WHERE ${pk}=$2`, [hash, id])
      return { ok: true }
    } catch (e) {
      return { ok: false, erro: e.message }
    }
  })
}
