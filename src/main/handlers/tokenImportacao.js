import crypto from 'crypto'
import { IS_DEV } from '../config'

const VALIDADE_MIN = 10

// Gera e consome tokens de autorização de "Importar Banco". A geração só
// faz sentido em PRODUÇÃO (é lá que o token precisa ser criado, por alguém
// com acesso físico ao ambiente real); a validação/consumo é usada pelo
// motor de importação em dev (services/importarBanco.js), conectando na
// mesma base de produção para conferir o token.
export function registerTokenImportacaoHandlers({ ipcMain, wrap, query }) {
  // Disponível só em produção — dev não gera token pra si mesmo, só consome
  // um token gerado por outra pessoa/sessão com acesso real a produção.
  ipcMain.handle('tokenImportacao:gerar', wrap(async () => {
    if (IS_DEV) throw new Error('Geração de token disponível apenas no ambiente de produção.')
    const token = crypto.randomBytes(24).toString('base64url')
    const row = await query(
      `INSERT INTO kr_tokens_importacao_001 (token, expira_em)
       VALUES ($1, NOW() + INTERVAL '${VALIDADE_MIN} minutes')
       RETURNING token, expira_em`,
      [token]
    )
    return row[0]
  }))
}
