// Token de autorização (gerado em produção, colado em dev) — mecanismo
// compartilhado por qualquer ação sensível disparada de dev contra
// produção (Importar Banco, Lançar Versão). Validação e consumo sempre
// rodam contra o banco de PRODUÇÃO (nunca dev) — é lá que o token foi
// criado, por alguém com acesso real ao ambiente. `escopo` garante que um
// token gerado pra uma ação não sirva pra outra. O token só é invalidado
// ao final da operação (sucesso OU falha), nunca no momento de colar/
// validar — assim uma operação que falhe no meio não deixa o token "meio
// usado", mas também não permite reaproveitar o mesmo token depois de uma
// tentativa (sucesso ou não).

export async function validarToken(pool, token, escopo) {
  if (!token || !token.trim()) throw new Error('Cole o token de autorização gerado em produção.')
  const { rows } = await pool.query(
    `SELECT id FROM kr_tokens_importacao_001
     WHERE token = $1 AND escopo = $2 AND usado_em IS NULL AND expira_em > NOW()`,
    [token.trim(), escopo]
  )
  if (!rows.length) throw new Error('Token inválido, já usado, expirado ou de escopo errado. Gere um novo token em produção.')
  return rows[0].id
}

export async function invalidarToken(pool, tokenId) {
  await pool.query(`UPDATE kr_tokens_importacao_001 SET usado_em = NOW() WHERE id = $1`, [tokenId]).catch(() => {})
}
