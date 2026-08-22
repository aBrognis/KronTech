import { encryptCofre, decryptCofre, hashLookupCofre } from '../config'
import { gerarCodigoAtual, gerarQrCodeDataUrl } from '../services/totpService'

// senha_hash_lookup só se aplica a tipos que representam uma credencial de
// acesso reutilizável (login/senha, token de API) — nota segura é texto
// livre, não faz sentido comparar "reuso" contra ela.
const TIPOS_COM_HASH_LOOKUP = ['login_senha', 'api_token']

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
  return {
    ...row,
    senha: decryptCofre(row.senha),
    nota_segura: decryptCofre(row.nota_segura),
    totp_secret: decryptCofre(row.totp_secret),
  }
}

export function registerCofreSenhasHandlers({ ipcMain, wrap, query, queryOne }) {

  ipcMain.handle('cofreSenhas:listar', wrap(async (_, filtros = {}) => {
    const { busca, categoria, apenasFavoritos, apenasVencidas } = filtros
    const conds = ['ativo = TRUE']
    const params = []
    if (busca) {
      params.push(`%${busca}%`)
      conds.push(`(sistema ILIKE $${params.length} OR usuario ILIKE $${params.length} OR categoria ILIKE $${params.length} OR tags ILIKE $${params.length})`)
    }
    if (categoria) { params.push(categoria); conds.push(`categoria = $${params.length}`) }
    if (apenasFavoritos) conds.push('favorito = TRUE')
    if (apenasVencidas)  conds.push(`dt_validade IS NOT NULL AND dt_validade < CURRENT_DATE`)
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
    // Lista não devolve a senha em texto puro — só o suficiente pra listagem.
    return query(
      `SELECT id, codigo, sistema, categoria, url, usuario, nivel_seguranca, dt_validade, tags, favorito, criado_em, alterado_em, tipo_credencial
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
    const tipo = d.tipo_credencial || 'login_senha'
    const senhaCifrada = d.senha ? encryptCofre(d.senha) : ''
    const notaCifrada = d.nota_segura ? encryptCofre(d.nota_segura) : ''
    const totpCifrado = d.totp_secret ? encryptCofre(d.totp_secret) : ''
    const hashLookup = TIPOS_COM_HASH_LOOKUP.includes(tipo) ? hashLookupCofre(d.senha || '') : ''
    const nivel = calcularNivel(d.senha || '')
    const codRow = await queryOne(`SELECT nextval('cofre_senha_001_codigo_seq') AS next`)
    const codigo = String(codRow.next).padStart(3, '0')
    const row = await queryOne(`
      INSERT INTO cofre_senha_001
        (codigo, sistema, categoria, url, usuario, senha, nivel_seguranca, dt_validade, observacoes, tags, favorito,
         tipo_credencial, nota_segura, totp_secret, senha_hash_lookup)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *
    `, [codigo, d.sistema.trim(), d.categoria || '', d.url || '',
        d.usuario || '', senhaCifrada, nivel, d.dt_validade || null, d.observacoes || '',
        d.tags || '', !!d.favorito, tipo, notaCifrada, totpCifrado, hashLookup])
    return linhaParaFrontend(row)
  }))

  ipcMain.handle('cofreSenhas:atualizar', wrap(async (_, d) => {
    if (!d.id) throw new Error('ID é obrigatório.')
    if (!d.sistema?.trim()) throw new Error('Sistema é obrigatório.')

    // Histórico de senha: se o valor mudou em relação ao que está gravado
    // (login_senha ou api_token), arquiva a senha ANTIGA antes de sobrescrever.
    // Nunca guarda a senha nova aqui — só a que está saindo de uso.
    const atual = await queryOne('SELECT senha FROM cofre_senha_001 WHERE id=$1', [d.id])
    const senhaAtualPlana = atual ? decryptCofre(atual.senha) : ''
    if (atual && (d.senha || '') !== senhaAtualPlana && senhaAtualPlana) {
      await query(
        `INSERT INTO cofre_senha_historico_001 (credencial_id, senha_anterior, alterado_por) VALUES ($1,$2,$3)`,
        [d.id, encryptCofre(senhaAtualPlana), d.usuarioNome || '']
      )
    }

    const senhaCifrada = d.senha ? encryptCofre(d.senha) : ''
    const notaCifrada = d.nota_segura ? encryptCofre(d.nota_segura) : ''
    const totpCifrado = d.totp_secret ? encryptCofre(d.totp_secret) : ''
    const tipo = d.tipo_credencial || 'login_senha'
    const hashLookup = TIPOS_COM_HASH_LOOKUP.includes(tipo) ? hashLookupCofre(d.senha || '') : ''
    const nivel = calcularNivel(d.senha || '')
    // tipo_credencial nunca é alterado aqui — bloqueado após a criação
    // (campo desabilitado no frontend fora do modo "novo").
    const row = await queryOne(`
      UPDATE cofre_senha_001
      SET sistema=$1, categoria=$2, url=$3, usuario=$4, senha=$5,
          nivel_seguranca=$6, dt_validade=$7, observacoes=$8, tags=$9, favorito=$10,
          nota_segura=$11, totp_secret=$12, senha_hash_lookup=$13, alterado_em=NOW()
      WHERE id=$14 RETURNING *
    `, [d.sistema.trim(), d.categoria || '', d.url || '',
        d.usuario || '', senhaCifrada, nivel, d.dt_validade || null, d.observacoes || '',
        d.tags || '', !!d.favorito, notaCifrada, totpCifrado, hashLookup, d.id])
    if (!row) throw new Error(`Registro #${d.id} não encontrado.`)
    return linhaParaFrontend(row)
  }))

  ipcMain.handle('cofreSenhas:verificarReuso', wrap(async (_, { senha, excluirId } = {}) => {
    if (!senha) return []
    const hash = hashLookupCofre(senha)
    const params = [hash]
    let cond = 'senha_hash_lookup=$1 AND ativo=TRUE'
    if (excluirId) { params.push(excluirId); cond += ` AND id<>$${params.length}` }
    return query(`SELECT id, sistema, usuario, tipo_credencial FROM cofre_senha_001 WHERE ${cond}`, params)
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

  ipcMain.handle('cofreSenhas:totpCodigoAtual', wrap(async (_, id) => {
    const row = await queryOne('SELECT totp_secret, sistema FROM cofre_senha_001 WHERE id=$1', [id])
    const secret = row ? decryptCofre(row.totp_secret) : ''
    if (!secret) throw new Error('Este registro não tem chave TOTP configurada.')
    return gerarCodigoAtual(secret)
  }))

  ipcMain.handle('cofreSenhas:totpQrCode', wrap(async (_, id) => {
    const row = await queryOne('SELECT totp_secret, sistema, usuario FROM cofre_senha_001 WHERE id=$1', [id])
    const secret = row ? decryptCofre(row.totp_secret) : ''
    if (!secret) throw new Error('Este registro não tem chave TOTP configurada.')
    const dataUrl = await gerarQrCodeDataUrl(secret, `${row.sistema}${row.usuario ? ':' + row.usuario : ''}`)
    return { dataUrl }
  }))
}
