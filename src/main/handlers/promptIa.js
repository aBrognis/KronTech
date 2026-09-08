import { listarPrompts, atualizarPrompt, criarPrompt, editarPrompt, excluirPrompt } from '../services/promptIaService'
import { listarProvedores, criarProvedor, editarProvedor, excluirProvedor, MODELOS_SUGERIDOS } from '../services/iaProvedorService'
import { gerarCorpoEmail } from '../services/emailIaService'

export function registerPromptIaHandlers({ ipcMain, wrap }) {
  ipcMain.handle('promptIa:listar', wrap(() => listarPrompts()))
  ipcMain.handle('promptIa:atualizar', wrap((_, id, dados) => atualizarPrompt(id, dados)))
  ipcMain.handle('promptIa:criar', wrap((_, dados) => criarPrompt(dados)))
  ipcMain.handle('promptIa:editar', wrap((_, id, dados) => editarPrompt(id, dados)))
  ipcMain.handle('promptIa:excluir', wrap((_, id) => excluirPrompt(id)))

  // Provedores de IA
  ipcMain.handle('iaProvedor:listar', wrap(() => listarProvedores()))
  ipcMain.handle('iaProvedor:modelosSugeridos', wrap(() => MODELOS_SUGERIDOS))
  ipcMain.handle('iaProvedor:criar', wrap((_, dados) => criarProvedor(dados)))
  ipcMain.handle('iaProvedor:editar', wrap((_, id, dados) => editarProvedor(id, dados)))
  ipcMain.handle('iaProvedor:excluir', wrap((_, id) => excluirProvedor(id)))

  // Geracao de corpo de e-mail a partir de rascunho bruto (botao "Gerar" no
  // compositor). Fica aqui porque depende do prompt_ia; sem wrap de loading
  // mudo porque a chamada a API pode levar alguns segundos.
  ipcMain.handle('emailIa:gerarCorpo', async (_, payload) => {
    try {
      const corpoHtml = await gerarCorpoEmail(payload)
      return { ok: true, data: { corpoHtml } }
    } catch (err) {
      return { ok: false, erro: err.message }
    }
  })
}
