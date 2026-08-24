import { spawn } from 'child_process'
import { readFileSync, writeFileSync, createReadStream, statSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { getDecryptedBancoProducaoConfig, getDecryptedGithubToken } from '../config'
import { criarPoolProducao } from './importarBanco'
import { validarToken, invalidarToken } from './tokenAutorizacaoService'

const GITHUB_OWNER = 'aBrognis'
const GITHUB_REPO  = 'KronTech'

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

// Remove sequências de escape ANSI (cores/estilo de terminal) que
// electron-vite/electron-builder imprimem no stdout — sem isso, a UI
// mostrava lixo tipo "[32m" junto do texto.
// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[[0-9;]*m/g
function limparAnsi(texto) {
  return texto.replace(ANSI_RE, '')
}

// Roda um processo filho assíncrono, repassando cada linha de
// stdout/stderr via `onLinha` (sem parsear progresso percentual — só
// mostra atividade). Rejeita se o exit code não for 0. `timeoutMs` mata o
// processo se ele ficar sem emitir nenhuma linha por tempo demais — evita
// a UI travar pra sempre num "Empacotando..." se o processo filho ficar
// esperando algo silenciosamente (ex.: um prompt interativo do Windows).
function spawnAsync(cmd, args, opts, onLinha, timeoutMs = 10 * 60 * 1000) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { ...opts, shell: false })
    let stderrBuf = ''
    let watchdog = setTimeout(() => {
      proc.kill()
      reject(new Error(`${cmd} ${args.join(' ')} sem atividade por mais de ${Math.round(timeoutMs / 60000)} min — processo encerrado.`))
    }, timeoutMs)
    const resetWatchdog = () => {
      clearTimeout(watchdog)
      watchdog = setTimeout(() => {
        proc.kill()
        reject(new Error(`${cmd} ${args.join(' ')} sem atividade por mais de ${Math.round(timeoutMs / 60000)} min — processo encerrado.`))
      }, timeoutMs)
    }
    proc.stdout?.on('data', chunk => {
      resetWatchdog()
      for (const linha of limparAnsi(chunk.toString('utf-8')).split(/\r?\n/)) {
        if (linha.trim()) onLinha?.(linha.trim())
      }
    })
    proc.stderr?.on('data', chunk => {
      resetWatchdog()
      const texto = limparAnsi(chunk.toString('utf-8'))
      stderrBuf += texto
      for (const linha of texto.split(/\r?\n/)) {
        if (linha.trim()) onLinha?.(linha.trim())
      }
    })
    proc.on('error', err => { clearTimeout(watchdog); reject(err) })
    proc.on('close', code => {
      clearTimeout(watchdog)
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

// Diretório de build ISOLADO do "Lançar Versão" — nunca out/, que é o
// diretório que o próprio npm run dev está usando ao vivo (o app aberto
// agora é o processo que dispara este pipeline). electron-vite build
// escrevendo em cima de out/main/index.js enquanto esse mesmo arquivo está
// carregado em memória pelo processo Electron atual trava/corrompe a
// cópia que o electron-builder tenta empacotar depois — foi a causa real
// do pipeline travar sem nunca terminar "Empacotando...".
const OUT_DIR_RELEASE = 'out-release'

// Fases 1-3 do plano: lê versão, builda, empacota — sem tocar git nem
// GitHub. Retorna a versão calculada e o caminho do instalador gerado.
export async function gerarInstalador({ onProgresso }) {
  const emitir = (fase, extra = {}) => onProgresso?.({ fase, ...extra })

  emitir('lendo_versao')
  const { pkgPath, pkg, versaoAtual } = lerVersaoAtual()
  const novaVersao = proximaVersaoPatch(versaoAtual)

  emitir('buildando', { versao: novaVersao })
  const eviteBin = join(ROOT, 'node_modules', 'electron-vite', 'bin', 'electron-vite.js')
  await spawnAsync(process.execPath, [eviteBin, 'build', '--outDir', OUT_DIR_RELEASE], { cwd: ROOT, env: process.env },
    linha => emitir('buildando', { versao: novaVersao, linha }))

  // electron-builder resolve o ponto de entrada do app a partir de
  // package.json "main" — normalmente "out/main/index.js" (o que o dev
  // usa). Aponta temporariamente pro build isolado só durante o
  // empacotamento, sempre restaurando o valor original depois (mesmo se
  // o empacotamento falhar) — nunca deixa o package.json sujo no meio de
  // um erro.
  const mainOriginal = pkg.main
  const mainRelease = `${OUT_DIR_RELEASE}/main/index.js`
  try {
    writeFileSync(pkgPath, JSON.stringify({ ...pkg, main: mainRelease }, null, 2) + '\n', 'utf-8')

    emitir('empacotando', { versao: novaVersao })
    const builderBin = join(ROOT, 'node_modules', 'electron-builder', 'cli.js')
    const envPkg = { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' }
    delete envPkg.WIN_CSC_LINK
    delete envPkg.CSC_LINK
    delete envPkg.CSC_KEY_PASSWORD
    await spawnAsync(process.execPath, [builderBin, '--win', '--config.npmRebuild=false'], { cwd: ROOT, env: envPkg },
      linha => emitir('empacotando', { versao: novaVersao, linha }))
  } finally {
    writeFileSync(pkgPath, JSON.stringify({ ...pkg, main: mainOriginal }, null, 2) + '\n', 'utf-8')
  }

  const distDir = join(ROOT, 'dist')
  const exeName = `KronTech-Setup-${novaVersao}.exe`
  const exePath = join(distDir, exeName)

  emitir('instalador_pronto', { versao: novaVersao, exePath })
  return { versaoAtual, novaVersao, distDir, exePath }
}

// Grava a nova versão em package.json e versiona via git — só chamado
// DEPOIS que build+package (gerarInstalador) já terminaram com sucesso,
// nunca antes (decisão de segurança: nunca deixar um commit publicado sem
// instalador correspondente se o build quebrar no meio).
async function versionarEPublicarGit(novaVersao, onLinha) {
  const pkgPath = join(ROOT, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  pkg.version = novaVersao
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')

  await spawnAsync('git', ['add', 'package.json'], { cwd: ROOT, env: process.env }, onLinha)
  await spawnAsync('git', ['commit', '-m', `chore: v${novaVersao}`], { cwd: ROOT, env: process.env }, onLinha)
  await spawnAsync('git', ['push', 'origin', 'main'], { cwd: ROOT, env: process.env }, onLinha)
}

// Publica a release no GitHub via API REST direta (sem depender do gh CLI
// instalado/autenticado na máquina) — usa o token cifrado guardado em
// Configurações > Token do GitHub.
async function publicarReleaseGithub(novaVersao, distDir, onLinha) {
  const token = getDecryptedGithubToken()
  if (!token) throw new Error('Token do GitHub não configurado. Configure em Configurações > Token do GitHub.')

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'KronTech-LancarVersao',
  }

  onLinha?.('Criando release no GitHub...')
  const resCriar = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tag_name: `v${novaVersao}`,
      name: `v${novaVersao}`,
      body: `Versão ${novaVersao}, publicada via Lançar Versão.`,
    }),
  })
  if (!resCriar.ok) {
    const detalhe = await resCriar.text().catch(() => '')
    throw new Error(`Falha ao criar release no GitHub (${resCriar.status}): ${detalhe.slice(0, 300)}`)
  }
  const release = await resCriar.json()
  const uploadUrlBase = release.upload_url.replace(/\{.*\}$/, '')

  const arquivos = [
    { nome: `KronTech-Setup-${novaVersao}.exe`, tipo: 'application/octet-stream' },
    { nome: `KronTech-Setup-${novaVersao}.exe.blockmap`, tipo: 'application/octet-stream' },
    { nome: 'latest.yml', tipo: 'text/yaml' },
  ]
  for (const { nome, tipo } of arquivos) {
    const caminho = join(distDir, nome)
    const stat = statSync(caminho)
    onLinha?.(`Enviando ${nome}...`)
    const resUpload = await fetch(`${uploadUrlBase}?name=${encodeURIComponent(nome)}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': tipo, 'Content-Length': String(stat.size) },
      body: createReadStream(caminho),
      duplex: 'half',
    })
    if (!resUpload.ok) {
      const detalhe = await resUpload.text().catch(() => '')
      throw new Error(`Falha ao enviar ${nome} (${resUpload.status}): ${detalhe.slice(0, 300)}`)
    }
  }

  return release.html_url
}

// Pipeline completa: valida o token (escopo 'release', contra produção),
// gera o instalador, versiona no git e publica no GitHub. O token só é
// invalidado ao final (sucesso OU falha) — mesmo padrão de
// services/importarBanco.js.
export async function lancarNovaVersao({ onProgresso, token }) {
  const emitir = (fase, extra = {}) => onProgresso?.({ fase, ...extra })
  const bancoProd = getDecryptedBancoProducaoConfig()
  if (!bancoProd.host || !bancoProd.database) {
    throw new Error('Configure host e banco de produção em Configurações antes de lançar uma versão.')
  }

  let tokenId = null
  const poolValidacao = criarPoolProducao(bancoProd)
  try {
    tokenId = await validarToken(poolValidacao, token, 'release')
  } finally {
    await poolValidacao.end().catch(() => {})
  }

  try {
    const { novaVersao, distDir } = await gerarInstalador({ onProgresso })

    emitir('versionando', { versao: novaVersao })
    await versionarEPublicarGit(novaVersao, linha => emitir('versionando', { versao: novaVersao, linha }))

    emitir('publicando', { versao: novaVersao })
    const releaseUrl = await publicarReleaseGithub(novaVersao, distDir, linha => emitir('publicando', { versao: novaVersao, linha }))

    emitir('concluido', { versao: novaVersao, releaseUrl })
    return { novaVersao, releaseUrl }
  } finally {
    const poolInvalidacao = criarPoolProducao(bancoProd)
    await invalidarToken(poolInvalidacao, tokenId)
    await poolInvalidacao.end().catch(() => {})
  }
}
