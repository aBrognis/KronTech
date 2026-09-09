import bcrypt from 'bcrypt'

export function registerAuthHandlers({ ipcMain, query, queryOne }) {

  ipcMain.handle('auth:login', async (_, usuario, senha) => {
    const login = String(usuario).toLowerCase().trim()
    const pwd   = String(senha)
    try {
      // 1) Tabela usuario_001 (tela nativa de Usuário). Colunas login/senha
      //    sao fixas no schema — nao dependem mais da definicao da tela no
      //    FormBuilder (kr_tela_campos_001).
      const tabelaExiste = await queryOne(
        `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='usuario_001'`
      )
      if (tabelaExiste) {
        const row = await queryOne(
          `SELECT id, login, nome, status, foto, perfil,
                  dt_expiracao, forcar_troca_senha, bloqueado_ate,
                  senha AS senha_hash
           FROM usuario_001
           WHERE LOWER(login)=$1 AND ativo=TRUE LIMIT 1`,
          [login]
        )
        if (row) {
          if (!row.senha_hash) return { ok: false, erro: 'Usuário sem senha definida. Contate o administrador.' }
          if (row.status === 'inativo')   return { ok: false, erro: 'Usuário inativo.' }
          if (row.status === 'bloqueado') return { ok: false, erro: 'Usuário bloqueado.' }
          if (row.bloqueado_ate && new Date(row.bloqueado_ate) > new Date()) {
            return { ok: false, erro: 'Usuário temporariamente bloqueado. Tente mais tarde.' }
          }
          if (row.dt_expiracao) {
            const hoje = new Date().toISOString().slice(0, 10)
            const exp = new Date(row.dt_expiracao).toISOString().slice(0, 10)
            if (exp < hoje) return { ok: false, erro: 'Acesso deste usuário expirou. Contate o administrador.' }
          }
          const ok = await bcrypt.compare(pwd, row.senha_hash)
          if (!ok) {
            await query('UPDATE usuario_001 SET tentativas_login = tentativas_login + 1 WHERE id = $1', [row.id]).catch(() => {})
            return { ok: false, erro: 'Senha incorreta.' }
          }
          // Sucesso: carimba o ultimo acesso e zera o contador de tentativas.
          await query('UPDATE usuario_001 SET dt_ultimo_acesso = NOW(), tentativas_login = 0 WHERE id = $1', [row.id]).catch(() => {})
          return {
            ok: true,
            user: {
              id: row.id, usuario: row.login, nome: row.nome,
              perfil: row.perfil || 'operador', foto: row.foto || null,
              fonte: 'usuario_001',
              forcarTrocaSenha: !!row.forcar_troca_senha,
            },
          }
        }
      }

      // 2) Fallback: tabela kr_usuarios_001 (admin/admin)
      const row = await queryOne(
        `SELECT id, usuario, nome, perfil, senha_hash FROM kr_usuarios_001 WHERE usuario=$1 AND ativo=TRUE`,
        [login]
      )
      if (!row) return { ok: false, erro: 'Usuário não encontrado ou inativo.' }
      const okSenha = await bcrypt.compare(pwd, String(row.senha_hash))
      if (!okSenha) return { ok: false, erro: 'Senha incorreta.' }
      return { ok: true, user: { id: row.id, usuario: row.usuario, nome: row.nome, perfil: row.perfil, fonte: 'sistema' } }
    } catch (e) {
      // e.message às vezes vem vazio pra certos erros do driver pg (ex.:
      // connection terminated) — cai no e.detail/e.code como fallback pra
      // nunca devolver "Erro interno:" sem nenhuma pista do que houve.
      const detalhe = e.message || e.detail || e.code || String(e)
      return { ok: false, erro: 'Erro interno: ' + detalhe }
    }
  })

  ipcMain.handle('auth:redefinirSenha', async (_, { tabelaUsuario, campoCodigo, campoSenha, id, novaSenha }) => {
    try {
      const hash = await bcrypt.hash(String(novaSenha), 10)
      // campoSenha explicito evita depender da definicao da tela no
      // FormBuilder (kr_tela_campos_001). Cai na descoberta so quando o
      // chamador nao informa.
      let colSenhaNome = campoSenha
      if (!colSenhaNome) {
        const colSenha = await queryOne(
          `SELECT nome_campo FROM kr_tela_campos_001 tc
           JOIN kr_telas_001 t ON t.id=tc.tela_id
           WHERE t.nome_tabela=$1 AND tc.tipo='senha' AND tc.ativo=TRUE LIMIT 1`,
          [tabelaUsuario]
        )
        colSenhaNome = colSenha?.nome_campo
      }
      if (!colSenhaNome) return { ok: false, erro: 'Coluna de senha não encontrada.' }
      const pk = campoCodigo || 'id'
      const hasTs = await queryOne(`SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name='alterado_em' LIMIT 1`, [tabelaUsuario])
      const tsClause = hasTs ? `, alterado_em=NOW()` : ''
      await query(`UPDATE ${tabelaUsuario} SET ${colSenhaNome}=$1${tsClause} WHERE ${pk}=$2`, [hash, id])
      return { ok: true }
    } catch (e) {
      return { ok: false, erro: e.message }
    }
  })
}
