import { app, shell, BrowserWindow, nativeImage, nativeTheme } from 'electron'
import { join } from 'path'
import { loadConfig, encryptSensitiveConfig } from './config'
import { registerHandlers } from './ipcHandlers'
import { initDb } from './db'
import { startReminderCheck } from './services/reminder'
import { setupAutoUpdater } from './services/updater'
import { confirmarStatus } from './handlers/agenda'
import { query, queryOne } from './db'

function broadcast(channel, data) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, data)
  }
}

// Trata o clique num botão da notificação de status (URI krontech://agenda/confirmar?...)
// ou no corpo dela (acao=abrir). No Windows, isso chega como argumento de linha de
// comando de uma "segunda instância" que o Windows redireciona pra este processo já
// rodando (capturado via second-instance abaixo).
async function handleAgendaProtocolo(url) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== 'agenda' || parsed.pathname !== '/confirmar') return
    const id = Number(parsed.searchParams.get('id'))
    const acao = parsed.searchParams.get('acao')
    if (!id) return

    if (acao === 'abrir') {
      broadcast('agenda:statusAtualizado', { acao: 'abrir', eventoId: id })
      return
    }
    if (acao === 'iniciar') {
      await confirmarStatus({ id, status: 'em_andamento', origem: 'notificacao' })
    } else if (acao === 'adiar') {
      // Só registra que o usuário viu e adiou, sem mudar o status atual.
      const atual = await queryOne('SELECT status_auto FROM agenda_eventos WHERE id=$1', [id])
      if (atual) {
        await query(
          'INSERT INTO agenda_status_log (evento_id, status_de, status_para, origem) VALUES ($1,$2,$2,$3)',
          [id, atual.status_auto, 'notificacao']
        )
      }
    }
    broadcast('agenda:statusAtualizado', { acao, eventoId: id })
  } catch (e) {
    console.warn('[protocolo] handleAgendaProtocolo:', e.message)
  }
}

function findProtocoloUrl(argv) {
  return argv.find(a => a.startsWith('krontech://'))
}

function getIcon() {
  const name = nativeTheme.shouldUseDarkColors ? 'icon.ico' : 'icon-light.ico'
  return nativeImage.createFromPath(join(__dirname, '../../resources', name))
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0A0A0A',
    icon: getIcon(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  // Atualiza ícone quando tema do Windows mudar
  nativeTheme.on('updated', () => {
    win.setIcon(getIcon())
  })

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
  win.on('ready-to-show', () => { win.show(); if (isDev) win.maximize() })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Dev: F12 abre DevTools
  win.webContents.on('before-input-event', (_event, input) => {
    if (input.type === 'keyDown' && input.code === 'F12') {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools()
      } else {
        win.webContents.openDevTools({ mode: 'undocked' })
      }
    }
  })
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

if (process.platform === 'win32') {
  app.setAppUserModelId('com.anderson.krontech')
}

// Necessário para os botões de ação da notificação de status da Agenda: o
// clique dispara uma URI krontech://... que o Windows abre como "nova
// instância" do app; sem o lock, isso abriria uma segunda janela em vez de
// avisar a instância já rodando via second-instance.
// Em dev (npm run dev), o executável é o electron.exe genérico do
// node_modules — sem passar execPath + o caminho do script como argumentos,
// o Windows registra o protocolo apontando só para o electron.exe "pelado",
// e ao clicar no botão da notificação ele tenta interpretar a própria URI
// como se fosse o caminho do app a carregar. Em produção (app empacotado) o
// executável já é o app inteiro, então não precisa desses argumentos extras.
if (!app.isPackaged) {
  // electron-vite/electron sempre é invocado a partir da raiz do projeto
  // (onde está o package.json com "main"), então process.cwd() é o caminho
  // estável a passar — mais confiável que tentar derivar de process.argv[1],
  // que varia conforme a forma exata como o electron-vite invoca o binário.
  app.setAsDefaultProtocolClient('krontech', process.execPath, [process.cwd()])
} else {
  app.setAsDefaultProtocolClient('krontech')
}
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const url = findProtocoloUrl(argv)
    if (url) handleAgendaProtocolo(url)
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(async () => {
    loadConfig()              // lê/cria C:\KronTech\krontech.ini
    encryptSensitiveConfig() // criptografa senhas em texto puro (Windows DPAPI)
    registerHandlers()
    await initDb().catch(err => console.error('initDb error:', err.message))
    startReminderCheck()
    setupAutoUpdater()
    createWindow()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
