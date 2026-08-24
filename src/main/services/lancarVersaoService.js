import { spawn } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

// Motor de "Lançar Versão" — automatiza o fluxo hoje feito manualmente no
// terminal: bump de versão, build, empacotamento, commit/push e publicação
// no GitHub. Roda de dentro do processo main do Electron (modo dev), então
// usa `spawn` assíncrono em todo lugar — nunca `execSync`/`spawnSync`
// (bloquearia o event loop do main, travando a UI inteira do Electron
// durante o build, que leva minutos).
//
// Ordem do pipeline (decisão de segurança): build + package rodam ANTES do
// commit/push — nunca deixa um commit publicado no repositório sem um
// instalador correspondente se o build quebrar no meio.

// app.getAppPath() aponta pra raiz real do projeto em dev (package.json ao
// lado), diferente de __dirname (que ficaria dentro de out/main — se essa
// pasta for hardlinked pra um devcache fora do OneDrive, __dirname
// resolveria pro devcache, não pro projeto real onde node_modules está
// atualizado). Mesmo raciocínio já usado em appIcon.js.
const ROOT = app.getAppPath()

function proximaVersaoPatch(versaoAtual) {
  const partes = versaoAtual.split('.').map(Number)
  partes[2] = (partes[2] || 0) + 1
  return partes.join('.')
}

// Roda um processo filho assíncrono, repassando cada linha de
// stdout/stderr via `onLinha` (sem parsear progresso percentual — só
// mostra atividade). Rejeita se o exit code não for 0.
function spawnAsync(cmd, args, opts, onLinha) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { ...opts, shell: false })
    let stderrBuf = ''
    proc.stdout?.on('data', chunk => {
      for (const linha of chunk.toString('utf-8').split(/\r?\n/)) {
        if (linha.trim()) onLinha?.(linha.trim())
      }
    })
    proc.stderr?.on('data', chunk => {
      const texto = chunk.toString('utf-8')
      stderrBuf += texto
      for (const linha of texto.split(/\r?\n/)) {
        if (linha.trim()) onLinha?.(linha.trim())
      }
    })
    proc.on('error', reject)
    proc.on('close', code => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} ${args.join(' ')} falhou (código ${code}).${stderrBuf ? ' ' + stderrBuf.slice(-500) : ''}`))
    })
  })
}

function lerVersaoAtual() {
  const pkgPath = join(ROOT, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  return { pkgPath, pkg, versaoAtual: pkg.version }
}

// Fases 1-3 do plano: lê versão, builda, empacota — sem tocar git nem
// GitHub. Retorna a versão calculada e o caminho do instalador gerado.
export async function gerarInstalador({ onProgresso }) {
  const emitir = (fase, extra = {}) => onProgresso?.({ fase, ...extra })

  emitir('lendo_versao')
  const { versaoAtual } = lerVersaoAtual()
  const novaVersao = proximaVersaoPatch(versaoAtual)

  emitir('buildando', { versao: novaVersao })
  const eviteBin = join(ROOT, 'node_modules', 'electron-vite', 'bin', 'electron-vite.js')
  await spawnAsync(process.execPath, [eviteBin, 'build'], { cwd: ROOT, env: process.env },
    linha => emitir('buildando', { versao: novaVersao, linha }))

  emitir('empacotando', { versao: novaVersao })
  const builderBin = join(ROOT, 'node_modules', 'electron-builder', 'cli.js')
  const envPkg = { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' }
  delete envPkg.WIN_CSC_LINK
  delete envPkg.CSC_LINK
  delete envPkg.CSC_KEY_PASSWORD
  await spawnAsync(process.execPath, [builderBin, '--win', '--config.npmRebuild=false'], { cwd: ROOT, env: envPkg },
    linha => emitir('empacotando', { versao: novaVersao, linha }))

  const distDir = join(ROOT, 'dist')
  const exeName = `KronTech-Setup-${novaVersao}.exe`
  const exePath = join(distDir, exeName)

  emitir('instalador_pronto', { versao: novaVersao, exePath })
  return { versaoAtual, novaVersao, distDir, exePath }
}
