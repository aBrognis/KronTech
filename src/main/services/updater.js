import { autoUpdater } from 'electron-updater'
import { app, BrowserWindow, ipcMain } from 'electron'
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'

let lastEvent = null
let lastData  = null
let logPath   = null

function log(msg) {
  try {
    if (!logPath) {
      const dir = join(app.getPath('userData'), 'logs')
      mkdirSync(dir, { recursive: true })
      logPath = join(dir, 'updater.log')
    }
    writeFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`, { flag: 'a' })
  } catch {}
}

// Um instalador que o updater baixou em pending/ mas que nunca foi aplicado
// (versao instalada segue < a do pending) faz o electron-updater tratar
// aquela atualizacao como "ja resolvida" e responder update-not-available
// para TODAS as versoes seguintes. Aconteceu na pratica: pending/ ficou com
// o 1.2.47 e o app parou de ver a 1.2.49. Solucao: no boot, se o instalador
// pendente for de versao <= a atual, o cache esta obsoleto -> limpa.
function versaoMaior(a, b) {
  const pa = String(a).split('.').map(Number)
  const pb = String(b).split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0)
  }
  return false
}

function limparPendingObsoleto() {
  try {
    const cacheDir = join(app.getPath('appData'), '..', 'Local', 'krontech-updater')
    const infoPath = join(cacheDir, 'pending', 'update-info.json')
    if (!existsSync(infoPath)) return
    const info = JSON.parse(readFileSync(infoPath, 'utf-8'))
    const m = String(info.fileName || '').match(/(\d+\.\d+\.\d+)/)
    const versaoPendente = m ? m[1] : null
    // Se a pendente NAO for estritamente maior que a instalada, o cache nao
    // serve mais e trava a deteccao das versoes seguintes -> limpa tudo.
    if (!versaoPendente || !versaoMaior(versaoPendente, app.getVersion())) {
      log(`pending obsoleto (${versaoPendente || '?'} <= ${app.getVersion()}) — limpando cache do updater`)
      rmSync(join(cacheDir, 'pending'), { recursive: true, force: true })
      rmSync(join(cacheDir, 'installer.exe'), { force: true })
      rmSync(join(cacheDir, 'current.blockmap'), { force: true })
    }
  } catch (e) {
    log('limparPendingObsoleto falhou (ignorado): ' + e.message)
  }
}

export function setupAutoUpdater() {
  if (!app.isPackaged) return

  log('setupAutoUpdater iniciado — versao ' + app.getVersion())
  limparPendingObsoleto()

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowPrerelease = false

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'aBrognis',
    repo: 'KronTech',
  })

  const save = (ev, data) => {
    log('evento: ' + ev + (data ? ' | ' + JSON.stringify(data).slice(0, 200) : ''))
    lastEvent = ev
    lastData  = data
    broadcast('update:' + ev, data)
  }

  autoUpdater.on('checking-for-update',  ()     => save('checking'))
  autoUpdater.on('update-available',     (info) => save('available', info))
  autoUpdater.on('update-not-available', ()     => save('not-available'))
  autoUpdater.on('download-progress',    (prog) => save('progress', prog))
  autoUpdater.on('update-downloaded',    (info) => save('downloaded', info))
  autoUpdater.on('error',                (err)  => { log('ERRO: ' + err.message); save('error', err.message) })

  const verificar = () => {
    // Nao adianta re-checar se ja tem update baixado OU se ja detectou um
    // disponivel (o usuario ainda nao clicou Atualizar) — evita spam de
    // eventos e de requests ao GitHub.
    if (lastEvent === 'downloaded' || lastEvent === 'available') return
    log('chamando checkForUpdates...')
    autoUpdater.checkForUpdates().catch(e => log('checkForUpdates CATCH: ' + e.message))
  }

  app.whenReady().then(() => {
    // Primeira verificacao logo apos abrir.
    setTimeout(verificar, 2000)
    // A cada 2 min enquanto o app roda — assim uma versao lancada com o
    // app aberto aparece em ate ~2 min, sem fechar/reabrir. ~30 req/hora
    // por instalacao, dentro do limite gratuito do GitHub sem auth.
    setInterval(verificar, 2 * 60_000)
  })
}

export function checkForUpdates() {
  return autoUpdater.checkForUpdates()
}

export function downloadUpdate() {
  log('downloadUpdate chamado')
  return autoUpdater.downloadUpdate().catch(e => { log('downloadUpdate ERRO: ' + e.message); throw e })
}

export function installUpdate() {
  autoUpdater.quitAndInstall(false, true)
}

// Em dev, setupAutoUpdater() nunca roda (autoUpdater não faz sentido fora
// de um build empacotado) — lastEvent/lastData ficam null, e é isso mesmo
// que o handler deve responder, em vez de não existir.
export function getLastUpdateState() {
  return { event: lastEvent, data: lastData }
}

function broadcast(channel, data) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, data)
  }
}
