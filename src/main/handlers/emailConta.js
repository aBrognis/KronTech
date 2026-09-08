import {
  listarContas,
  obterConta,
  criarConta,
  atualizarConta,
  excluirConta,
  testarConexao,
  testarConexaoConta,
  atualizarAssinatura,
  reordenarContas,
} from '../services/emailContaService'
import { reiniciarConexaoIdle, pararConexaoIdle } from '../services/emailSyncService'
import { iniciarLoginOutlook, salvarLoginOutlookNaConta } from '../services/oauthService'
import { getOutlookClientId, saveOutlookClientId } from '../config'

export function registerEmailContaHandlers({ ipcMain, wrap }) {
  ipcMain.handle('email:listarContas', wrap(() => listarContas()))
  ipcMain.handle('email:obterConta', wrap((_, id) => obterConta(id)))
  ipcMain.handle('email:criarConta', wrap(async (_, dados) => {
    const conta = await criarConta(dados)
    reiniciarConexaoIdle(conta.id).catch(() => {})
    return conta
  }))
  ipcMain.handle('email:atualizarConta', wrap(async (_, id, dados) => {
    const conta = await atualizarConta(id, dados)
    // Credenciais/host podem ter mudado — reabre a conexão IDLE do zero.
    // Se a conta foi desativada, para de vez em vez de reconectar.
    if (conta.ativa) reiniciarConexaoIdle(id).catch(() => {})
    else pararConexaoIdle(id)
    return conta
  }))
  ipcMain.handle('email:excluirConta', wrap(async (_, id) => {
    pararConexaoIdle(id)
    return excluirConta(id)
  }))

  // wrap() já devolve o erro cru do servidor IMAP/SMTP (auth falhou, host
  // incorreto etc.) em {ok:false,erro} — é exatamente o que o modal precisa
  // mostrar, sem reformatar.
  ipcMain.handle('email:testarConexao', wrap((_, dados) => testarConexao(dados)))
  ipcMain.handle('email:testarConexaoConta', wrap((_, id) => testarConexaoConta(id)))
  ipcMain.handle('email:atualizarAssinatura', wrap((_, id, dados) => atualizarAssinatura(id, dados)))
  ipcMain.handle('email:reordenarContas', wrap((_, idsNaOrdem) => reordenarContas(idsNaOrdem)))

  // ── OAuth Outlook ────────────────────────────────────────────────────
  // Abre a janela de login da Microsoft e devolve so o refresh_token pro
  // frontend guardar no payload da conta (nova conta) ou aplicar direto
  // numa conta existente. O refresh_token nunca fica no renderer alem do
  // salvamento imediato.
  ipcMain.handle('email:oauthLoginOutlook', wrap(async (_, { clientId, loginHint } = {}) => {
    const r = await iniciarLoginOutlook({ clientId, loginHint })
    return { refreshToken: r.refreshToken }
  }))
  // Aplica um login recem-feito numa conta ja existente (fluxo editar).
  ipcMain.handle('email:aplicarLoginOutlook', wrap(async (_, id, { refreshToken, clientId } = {}) => {
    const conta = await salvarLoginOutlookNaConta(id, { refreshToken, clientId })
    if (conta.ativa) reiniciarConexaoIdle(id).catch(() => {})
    return conta
  }))
  // Client ID global (fallback do .ini) — a tela de Configuracoes le/grava.
  ipcMain.handle('email:obterOutlookClientId', wrap(() => ({ clientId: getOutlookClientId() })))
  ipcMain.handle('email:salvarOutlookClientId', wrap((_, clientId) => { saveOutlookClientId(clientId); return { ok: true } }))
}
