import { app, shell, BrowserWindow, nativeTheme } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'
import { loadConfig, encryptSensitiveConfig, IS_DEV } from './config'

// Perfil do Chromium (cache, cookies etc.) isolado do de produção — sem
// isso, rodar dev e produção ao mesmo tempo faz as duas instâncias
// disputarem o mesmo diretório de cache (erros "Unable to move the cache").
// Precisa rodar antes de qualquer outra chamada de app.* (inclusive o lock
// de instância única, mais abaixo).
if (IS_DEV) app.setPath('userData', 'C:\\KronTech\\KronTech_Teste\\electron-userdata')
import { registerHandlers } from './ipcHandlers'
import { initDb } from './db'
import { runMigrations } from './migrate'
import { startReminderCheck } from './services/reminder'
import { startEmailSync, atualizarBadgeNaoLidas } from './services/emailSyncService'
import { registerEmailSyncControl } from './handlers/emailSyncControl'
import { registrarEsquemaKmail, registrarHandlerKmail } from './services/emailAnexoProtocol'
import { setupAutoUpdater } from './services/updater'
import { confirmarStatus } from './handlers/agenda'
import { query, queryOne } from './db'
import { getIcon } from './appIcon'

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
      const atual = await queryOne('SELECT status_auto FROM agenda_eventos_001 WHERE id=$1', [id])
      if (atual) {
        await query(
          'INSERT INTO agenda_status_log_001 (evento_id, status_de, status_para, origem) VALUES ($1,$2,$2,$3)',
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
  win.on('ready-to-show', () => {
    win.show()
    if (isDev) win.maximize()
    // Reaplica o selo (overlay) de e-mails nao lidos DEPOIS que a janela
    // tem botao na barra de tarefas. Se atualizarBadgeNaoLidas rodar no
    // login antes disso, o Windows descarta o setOverlayIcon em silencio.
    setTimeout(() => atualizarBadgeNaoLidas().catch(() => {}), 1500)
  })

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

// Esquema kmail:// (anexos de e-mail servidos ao iframe do leitor). Tem que
// ser registrado antes de app.whenReady.
registrarEsquemaKmail()

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
  // app.getAppPath() dá a raiz do projeto (onde está o package.json com
  // "main"), que é o argumento que "electron <caminho>" espera. Preferido a
  // join(__dirname, '../..') porque __dirname fica dentro de out/main — se
  // out/ for uma junction (ex.: movida pra fora do OneDrive), subir pastas
  // relativas resolve para o destino físico da junction, não a raiz real do
  // projeto. process.cwd() também foi tentado antes mas não é confiável: o
  // diretório de trabalho no momento em que o Windows relança o processo
  // pode não ser a raiz do projeto (por isso o registro anterior apontou
  // para C:\windows\system32).
  // Sem barra final: o Windows monta o comando registrado como "<execPath>"
  // "<arg>" "%1" — uma barra invertida logo antes da aspa de fechamento
  // escapa essa aspa (regra de parsing de linha de comando do Windows),
  // corrompendo o comando inteiro (visto no erro real: caminho terminando
  // em `KronTech" krontech:\...` em vez de dois argumentos separados).
  const projectRoot = app.getAppPath()
  app.setAsDefaultProtocolClient('krontech', process.execPath, [projectRoot])
} else {
  app.setAsDefaultProtocolClient('krontech')
}
// Lockfile do dev: grava o PID neste processo; se o arquivo já existe e o
// PID de lá ainda está vivo, é outro `npm run dev` rodando — este sai.
// (PID morto ou arquivo corrompido = lock obsoleto, sobrescreve.)
function adquirirLockDev() {
  const lockPath = join(app.getPath('userData'), 'dev-instance.lock')
  try {
    if (existsSync(lockPath)) {
      const pidAntigo = parseInt(readFileSync(lockPath, 'utf-8').trim(), 10)
      if (pidAntigo && pidAntigo !== process.pid) {
        try {
          process.kill(pidAntigo, 0) // não mata, só testa se existe
          return false               // ainda vivo -> outra instância dev ativa
        } catch { /* ESRCH: processo morto, lock obsoleto */ }
      }
    }
    writeFileSync(lockPath, String(process.pid))
    app.on('quit', () => { try { unlinkSync(lockPath) } catch {} })
    return true
  } catch (e) {
    console.warn('[dev-lock] falhou, seguindo sem lock:', e.message)
    return true
  }
}

// Instância única:
//  - Produção: lock nativo do Electron (chaveado pelo AppUserModelId).
//  - Dev: NÃO usa o lock nativo (senão uma instância de produção aberta
//    derrubaria o dev, já que os dois compartilham o AppUserModelId). Em
//    vez disso, um lockfile no userData do dev: se outro `npm run dev` já
//    está rodando, este sai — evita as duas instâncias disputarem a pasta
//    de cache do Chromium ("Unable to move the cache: Acesso negado").
const gotLock = IS_DEV ? adquirirLockDev() : app.requestSingleInstanceLock()
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
    loadConfig()              // lê/cria krontech.ini (BASE_DIR — produção ou dev)
    encryptSensitiveConfig() // criptografa senhas em texto puro (Windows DPAPI)
    registrarHandlerKmail()  // kmail://anexo/<id> — precisa do banco e da config já carregados
    registerHandlers()
    await runMigrations().catch(err => console.error('[migrate] runMigrations error:', err.message))
    await initDb().catch(err => console.error('initDb error:', err.message))
    // Migra a chave Anthropic legada do krontech.ini para ia_provedor_001
    // (so faz algo no primeiro boot apos a feature de provedores).
    await import('./services/iaProvedorService')
      .then(m => m.migrarChaveAnthropicLegada())
      .catch(err => console.warn('[iaProvedor] migrarChaveAnthropicLegada:', err.message))
    startReminderCheck()
    // startEmailSync() NAO roda aqui — so depois do login, disparado pelo
    // renderer via IPC 'email:iniciarSync'. Sem isso o app puxava e-mail
    // (e notificava) antes mesmo da tela de login.
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
