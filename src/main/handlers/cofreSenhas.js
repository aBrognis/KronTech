import { encryptCofre, decryptCofre } from '../config'

// Mesma heurística leve usada no renderer (InputSenhaCofre.jsx) — mantida
// em espelho porque o nível gravado precisa refletir a senha real (só o
// backend vê o valor em texto puro antes de cifrar).
function calcularNivel(senha) {
  if (!senha) return ''
  let pontos = 0
  pontos += Math.min(senha.length, 32) * 2.2
  if (/[a-z]/.test(senha)) pontos += 6
  if (/[A-Z]/.test(senha)) pontos += 6
  if (/[0-9]/.test(senha)) pontos += 6
  if (/[^a-zA-Z0-9]/.test(senha)) pontos += 6
  if (/(.)\1{2,}/.test(senha)) pontos -= 15
  if (/012|123|234|345|456|567|678|789|abc|bcd|cde/i.test(senha)) pontos -= 10
  if (senha.length < 8) pontos -= 20
  pontos = Math.max(0, Math.min(100, pontos))
  if (pontos < 35) return 'Fraca'
  if (pontos < 65) return 'Média'
  if (pontos < 85) return 'Forte'
  return 'Muito forte'
}

function linhaParaFrontend(row) {
  if (!row) return row
  return { ...row, senha: decryptCofre(row.senha) }
}

export function registerCofreSenhasHandlers({ ipcMain, wrap, query, queryOne }) {

  ipcMain.handle('cofreSenhas:listar', wrap(async (_, filtros = {}) => {
    const { busca, categoria, ambiente, apenasFavoritos, apenasVencidas } = filtros
    const conds = ['ativo = TRUE']
    const params = []
    if (busca) {
      params.push(`%${busca}%`)
      conds.push(`(sistema ILIKE $${params.length} OR usuario ILIKE $${params.length} OR categoria ILIKE $${params.length} OR tags ILIKE $${params.length})`)
    }
    if (categoria) { params.push(categoria); conds.push(`categoria = $${params.length}`) }
    if (ambiente)  { params.push(ambiente);  conds.push(`ambiente = $${params.length}`) }
    if (apenasFavoritos) conds.push('favorito = TRUE')
    if (apenasVencidas)  conds.push(`dt_validade IS NOT NULL AND dt_validade < CURRENT_DATE`)
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
    // Lista não devolve a senha em texto puro — só o suficiente pra listagem.
    return query(
      `SELECT id, codigo, sistema, categoria, ambiente, url, usuario, nivel_seguranca, dt_validade, tags, favorito, criado_em, alterado_em
       FROM cofre_senha_001 ${where} ORDER BY favorito DESC, sistema`,
      params
    )
  }))

  ipcMain.handle('cofreSenhas:obter', wrap(async (_, id) => {
    const row = await queryOne('SELECT * FROM cofre_senha_001 WHERE id=$1', [id])
    if (!row) throw new Error(`Registro #${id} não encontrado.`)
    return linhaParaFrontend(row)
  }))

  ipcMain.handle('cofreSenhas:criar', wrap(async (_, d) => {
    if (!d.sistema?.trim()) throw new Error('Sistema é obrigatório.')
    const senhaCifrada = d.senha ? encryptCofre(d.senha) : ''
    const nivel = calcularNivel(d.senha || '')
    const codRow = await queryOne(`SELECT nextval('cofre_senha_001_codigo_seq') AS next`)
    const codigo = String(codRow.next).padStart(3, '0')
    const row = await queryOne(`
      INSERT INTO cofre_senha_001
        (codigo, sistema, categoria, ambiente, url, usuario, senha, nivel_seguranca, dt_validade, observacoes, tags, favorito)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
    `, [codigo, d.sistema.trim(), d.categoria || '', d.ambiente || 'producao', d.url || '',
        d.usuario || '', senhaCifrada, nivel, d.dt_validade || null, d.observacoes || '',
        d.tags || '', !!d.favorito])
    return linhaParaFrontend(row)
  }))

  ipcMain.handle('cofreSenhas:atualizar', wrap(async (_, d) => {
    if (!d.id) throw new Error('ID é obrigatório.')
    if (!d.sistema?.trim()) throw new Error('Sistema é obrigatório.')
    const senhaCifrada = d.senha ? encryptCofre(d.senha) : ''
    const nivel = calcularNivel(d.senha || '')
    const row = await queryOne(`
      UPDATE cofre_senha_001
      SET sistema=$1, categoria=$2, ambiente=$3, url=$4, usuario=$5, senha=$6,
          nivel_seguranca=$7, dt_validade=$8, observacoes=$9, tags=$10, favorito=$11, alterado_em=NOW()
      WHERE id=$12 RETURNING *
    `, [d.sistema.trim(), d.categoria || '', d.ambiente || 'producao', d.url || '',
        d.usuario || '', senhaCifrada, nivel, d.dt_validade || null, d.observacoes || '',
        d.tags || '', !!d.favorito, d.id])
    if (!row) throw new Error(`Registro #${d.id} não encontrado.`)
    return linhaParaFrontend(row)
  }))

  ipcMain.handle('cofreSenhas:excluir', wrap(async (_, id) => {
    await query('DELETE FROM cofre_senha_001 WHERE id=$1', [id])
  }))

  ipcMain.handle('cofreSenhas:toggleFavorito', wrap(async (_, id) => {
    const row = await queryOne(
      `UPDATE cofre_senha_001 SET favorito = NOT favorito, alterado_em=NOW() WHERE id=$1 RETURNING favorito`,
      [id]
    )
    if (!row) throw new Error(`Registro #${id} não encontrado.`)
    return row
  }))

  ipcMain.handle('cofreSenhas:listarCategorias', wrap(async () => {
    const rows = await query(`SELECT DISTINCT categoria FROM cofre_senha_001 WHERE categoria != '' AND ativo = TRUE ORDER BY categoria`)
    return rows.map(r => r.categoria)
  }))
}
