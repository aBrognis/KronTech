import { BrowserWindow, BrowserView, session, shell } from 'electron'

// WhatsApp embutido: nao e uma integracao que troca dados com o WhatsApp,
// e literalmente o WhatsApp Web (web.whatsapp.com) aberto dentro do app via
// BrowserView, sobreposto a area de conteudo da aba (coordenadas mandadas
// pelo renderer via whatsapp:atualizarBounds). Sem webviewTag, sem segunda
// janela do Windows (diferente do Designer, que usa BrowserWindow filha).
//
// Sessao isolada por usuario: session.fromPartition('persist:whatsapp-
// <fonte>-<id>') faz o Electron persistir cookies/localStorage em disco por
// essa chave - e esse mecanismo que mantem o WhatsApp Web logado entre
// reinicios do app sem reescanear o QR. `fonte`/`id` vem do objeto `sessao`
// que o renderer ja guarda (App.jsx) - nao existe "usuario atual" no
// processo main, precisa ser repassado explicitamente a cada chamada.
//
// Uma view por BrowserWindow (Map por id de janela) - nunca por app inteiro,
// pra nao vazar WhatsApp de uma janela (ex: o Designer, se um dia abrir
// outra) pra outra.
const views = new Map() // windowId -> BrowserView

function partitionDe(sessaoUsuario) {
  const fonte = String(sessaoUsuario?.fonte || sessaoUsuario?.usuario || 'sistema').replace(/[^a-z0-9_-]/gi, '')
  const id = String(sessaoUsuario?.registro?.id ?? sessaoUsuario?.id ?? '0')
  return `persist:whatsapp-${fonte}-${id}`
}

function viewDaJanela(win) {
  return views.get(win.id)
}

// O WhatsApp Web verifica o User-Agent e rejeita o default do Electron (que
// inclui o sufixo "Electron/30.x.x") com a mensagem "atualize o Chrome" -
// mesmo o Chromium por baixo sendo recente o bastante. UA de um Chrome
// desktop real (sem o sufixo Electron) resolve: o WhatsApp Web so olha a
// string, nao ha verificacao mais profunda de engine.
const USER_AGENT_WHATSAPP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

export function registerWhatsappHandlers({ ipcMain, wrap }) {
  ipcMain.handle('whatsapp:abrir', wrap((e, sessaoUsuario) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return

    const existente = viewDaJanela(win)
    if (existente) {
      win.addBrowserView(existente)
      return
    }

    const view = new BrowserView({
      webPreferences: {
        partition: partitionDe(sessaoUsuario),
        sandbox: false,
      },
    })
    view.webContents.setUserAgent(USER_AGENT_WHATSAPP)
    view.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })
    view.webContents.loadURL('https://web.whatsapp.com')

    views.set(win.id, view)
    win.addBrowserView(view)
    win.on('closed', () => views.delete(win.id))
  }))

  ipcMain.handle('whatsapp:atualizarBounds', wrap((e, bounds) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const view = win && viewDaJanela(win)
    if (!view) return
    const { x, y, width, height } = bounds || {}
    view.setBounds({
      x: Math.round(x || 0), y: Math.round(y || 0),
      width: Math.max(0, Math.round(width || 0)), height: Math.max(0, Math.round(height || 0)),
    })
  }))

  // Ao trocar de aba: tira a view de cima (nao aparece sobre outra tela),
  // mas mantem viva em memoria - volta sem recarregar a pagina.
  ipcMain.handle('whatsapp:esconder', wrap((e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const view = win && viewDaJanela(win)
    if (win && view) win.removeBrowserView(view)
  }))

  ipcMain.handle('whatsapp:mostrar', wrap((e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const view = win && viewDaJanela(win)
    if (win && view) win.addBrowserView(view)
  }))

  // "Sair/trocar de numero": apaga a sessao em disco pra poder escanear
  // outro QR da proxima vez que abrir.
  ipcMain.handle('whatsapp:fecharSessao', wrap(async (e, sessaoUsuario) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const view = win && viewDaJanela(win)
    if (win && view) {
      win.removeBrowserView(view)
      views.delete(win.id)
    }
    await session.fromPartition(partitionDe(sessaoUsuario)).clearStorageData()
  }))
}
