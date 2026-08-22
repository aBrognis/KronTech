import { BrowserWindow } from 'electron'
import { unlinkSync } from 'fs'
import { selecionarECopiarArquivo } from './arquivos'

export function registerCofreSenhaAnexosHandlers({ ipcMain, wrap, query, queryOne, getConfig }) {

  ipcMain.handle('cofreSenhaAnexos:listar', wrap(async (_, credencialId) => {
    return query(
      `SELECT id, tipo_anexo, nome_original, caminho, extensao, tamanho_bytes, descricao, criado_em, criado_por
       FROM cofre_senha_anexo_001 WHERE credencial_id=$1 ORDER BY criado_em DESC`,
      [credencialId]
    )
  }))

  ipcMain.handle('cofreSenhaAnexos:adicionar', async (e, { credencialId, tipoAnexo = 'generico', descricao = '', filtros, usuarioNome } = {}) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const copiado = await selecionarECopiarArquivo({ subpasta: 'cofre', filtros }, win, getConfig)
    if (!copiado) return { ok: false, erro: 'Seleção cancelada.' }
    if (!copiado.ok) return copiado
    try {
      const row = await queryOne(`
        INSERT INTO cofre_senha_anexo_001 (credencial_id, tipo_anexo, nome_original, caminho, extensao, tamanho_bytes, descricao, criado_por)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
      `, [credencialId, tipoAnexo, copiado.nome, copiado.path, copiado.ext, copiado.tamanho, descricao, usuarioNome || ''])
      return { ok: true, data: row }
    } catch (err) {
      return { ok: false, erro: err.message }
    }
  })

  ipcMain.handle('cofreSenhaAnexos:remover', wrap(async (_, id) => {
    const row = await queryOne('SELECT caminho FROM cofre_senha_anexo_001 WHERE id=$1', [id])
    await query('DELETE FROM cofre_senha_anexo_001 WHERE id=$1', [id])
    // Remoção física é best-effort — se o arquivo já não existir ou estiver
    // em uso, o registro do banco já foi limpo, que é o que importa pra UI.
    if (row?.caminho) { try { unlinkSync(row.caminho) } catch {} }
  }))
}
