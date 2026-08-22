export function registerCofreSenhaGeradorHandlers({ ipcMain, wrap, query, queryOne }) {

  ipcMain.handle('cofreSenhaGerador:listarPerfis', wrap(async () => {
    return query(`SELECT * FROM cofre_senha_gerador_perfil_001 ORDER BY padrao DESC, nome`)
  }))

  ipcMain.handle('cofreSenhaGerador:salvarPerfil', wrap(async (_, d) => {
    if (!d.nome?.trim()) throw new Error('Nome do perfil é obrigatório.')
    // Um único perfil padrão por vez — desmarca os demais se este virar padrão.
    if (d.padrao) await query(`UPDATE cofre_senha_gerador_perfil_001 SET padrao=FALSE`)

    if (d.id) {
      const row = await queryOne(`
        UPDATE cofre_senha_gerador_perfil_001
        SET nome=$1, tamanho=$2, usa_maiuscula=$3, usa_minuscula=$4, usa_numero=$5, usa_simbolo=$6,
            evitar_ambiguos=$7, padrao=$8, alterado_em=NOW()
        WHERE id=$9 RETURNING *
      `, [d.nome.trim(), d.tamanho, !!d.usa_maiuscula, !!d.usa_minuscula, !!d.usa_numero, !!d.usa_simbolo,
          !!d.evitar_ambiguos, !!d.padrao, d.id])
      if (!row) throw new Error(`Perfil #${d.id} não encontrado.`)
      return row
    }
    return queryOne(`
      INSERT INTO cofre_senha_gerador_perfil_001
        (nome, tamanho, usa_maiuscula, usa_minuscula, usa_numero, usa_simbolo, evitar_ambiguos, padrao)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [d.nome.trim(), d.tamanho, !!d.usa_maiuscula, !!d.usa_minuscula, !!d.usa_numero, !!d.usa_simbolo,
        !!d.evitar_ambiguos, !!d.padrao])
  }))

  ipcMain.handle('cofreSenhaGerador:excluirPerfil', wrap(async (_, id) => {
    await query('DELETE FROM cofre_senha_gerador_perfil_001 WHERE id=$1', [id])
  }))
}
