import { spawn } from 'child_process'
import { readFileSync, writeFileSync, createReadStream, statSync, mkdirSync, existsSync, symlinkSync } from 'fs'
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
//
// Além disso, todo o projeto vive dentro de uma pasta sincronizada pelo
// OneDrive (c:\Users\ander\OneDrive\...). O electron-builder extrai um
// electron.exe de ~177MB dentro do diretório de saída — o OneDrive tenta
// hashear/sincronizar esse arquivo grande enquanto ele ainda está sendo
// escrito, e esse lock de I/O é o que trava o pipeline indefinidamente
// (mesmo sintoma causado pelo Windows Defender, já mitigado antes, mas
// insuficiente sozinho). Por isso a SAÍDA do build (que inclui esse
// electron.exe extraído) vai inteira para fora do OneDrive, em
// C:\KronTech\release-build — mesmo padrão já usado pelo devcache do
// projeto (C:\devcache\KronTech).
//
// electron-builder resolve node_modules e o entry point "main" ambos
// relativos a directories.app — que PRECISA continuar sendo o projeto
// real no OneDrive (node_modules de verdade, não um link: uma junction
// pra node_modules inteiro faz o electron-builder se perder resolvendo
// centenas de package.json de dependências via realpath, travando
// silenciosamente na fase "searching for node modules" — testado e
// descartado). E "main" como caminho ABSOLUTO fora do appDir também
// quebra: o electron-builder resolve o entry point relativo ao appDir
// dentro do .asar, gerando "..\..\..\KronTech\..." e falhando com "was
// not found in this archive" — testado e descartado.
//
// Solução: uma junction PEQUENA e ISOLADA dentro do projeto
// (out-release-link/ → C:\KronTech\release-build\out-release), só para
// que "main" possa ser um caminho relativo válido
// ("out-release-link/main/index.js"). Só essa pasta específica é
// resolvida via link durante o empacotamento — node_modules continua
// 100% real, sem indireção.
const RELEASE_BUILD_ROOT = 'C:\\KronTech\\release-build'
const OUT_DIR_RELEASE = join(RELEASE_BUILD_ROOT, 'out-release')
const DIST_DIR_RELEASE = join(RELEASE_BUILD_ROOT, 'dist')
const OUT_RELEASE_LINK = join(ROOT, 'out-release-link')

// process.execPath dentro do processo main é o electron.exe, não um Node
// puro — mesmo com ELECTRON_RUN_AS_NODE=1 (setado globalmente neste
// ambiente, já documentado como causa de bugs no Electron aqui) o
// electron-builder internamente spawna MAIS processos filhos (electron.exe
// de verificação, app-builder-bin) que herdam o env do processo que os
// chamou. Se ELECTRON_RUN_AS_NODE não propagar corretamente pra essas
// subcamadas, um electron.exe filho tenta abrir janela/GPU e trava
// silenciosamente esperando um display — é a causa mais provável do
// pipeline travar sempre no mesmo ponto (empacotamento), mesmo depois de
// eliminar Defender e OneDrive como causas de I/O. Corrigido usando o
// node.exe real do sistema (nunca process.execPath) e garantindo
// ELECTRON_RUN_AS_NODE=1 explícito em todo env repassado a processos
// filhos deste pipeline.
const NODE_BIN = 'C:\\Program Files\\nodejs\\node.exe'
function envFilho(extra = {}) {
  return { ...process.env, ELECTRON_RUN_AS_NODE: '1', ...extra }
}

// Fases 1-3 do plano: lê versão, builda, empacota — sem tocar git nem
// GitHub. Retorna a versão calculada e o caminho do instalador gerado.
export async function gerarInstalador({ onProgresso }) {
  const emitir = (fase, extra = {}) => onProgresso?.({ fase, ...extra })

  emitir('lendo_versao')
  const { pkgPath, pkg, versaoAtual } = lerVersaoAtual()
  const novaVersao = proximaVersaoPatch(versaoAtual)

  mkdirSync(RELEASE_BUILD_ROOT, { recursive: true })
  mkdirSync(OUT_DIR_RELEASE, { recursive: true })
  // Junction idempotente — criada uma vez, reaproveitada em todo lançamento.
  if (!existsSync(OUT_RELEASE_LINK)) {
    symlinkSync(OUT_DIR_RELEASE, OUT_RELEASE_LINK, 'junction')
  }

  // "version" precisa virar novaVersao ANTES do build (não só do
  // empacotamento): electron.vite.config.mjs lê package.json em build time
  // pra injetar __APP_VERSION__ no bundle do renderer (usado na tela de
  // splash/login) — se o build rodar com a versão antiga, o instalador
  // final embute o número de versão errado na UI, mesmo o electron-builder
  // nomeando o .exe corretamente com a versão nova. E "main" precisa virar
  // relativo via a junction pequena (out-release-link/ →
  // C:\KronTech\release-build\out-release) só durante o empacotamento —
  // sempre restaurando o package.json original depois (mesmo se build OU
  // empacotamento falhar), nunca deixando o arquivo sujo no meio de um
  // erro. directories.app do electron-builder continua sendo ROOT
  // (node_modules real, sem link).
  //
  // electron-builder lê artifactName ("KronTech-Setup-${version}.exe") do
  // package.json no momento do empacotamento, e o bump real de versão só
  // acontece depois (em versionarEPublicarGit, por decisão de segurança:
  // nunca commitar antes de confirmar que build+package funcionaram). Sem
  // a versão nova aqui o instalador sairia nomeado com a versão ANTIGA,
  // mas o código downstream (exePath, publicarReleaseGithub) já espera o
  // nome com novaVersao — causava ENOENT ao tentar publicar um arquivo que
  // não existe com esse nome.
  const pkgOriginal = pkg
  try {
    writeFileSync(pkgPath, JSON.stringify({ ...pkg, version: novaVersao }, null, 2) + '\n', 'utf-8')

    emitir('buildando', { versao: novaVersao })
    const eviteBin = join(ROOT, 'node_modules', 'electron-vite', 'bin', 'electron-vite.js')
    await spawnAsync(NODE_BIN, [eviteBin, 'build', '--outDir', OUT_DIR_RELEASE], { cwd: ROOT, env: envFilho() },
      linha => emitir('buildando', { versao: novaVersao, linha }))

    writeFileSync(pkgPath, JSON.stringify({ ...pkg, version: novaVersao, main: 'out-release-link/main/index.js' }, null, 2) + '\n', 'utf-8')

    emitir('empacotando', { versao: novaVersao })
    const builderBin = join(ROOT, 'node_modules', 'electron-builder', 'cli.js')
    const envPkg = envFilho({ CSC_IDENTITY_AUTO_DISCOVERY: 'false' })
    delete envPkg.WIN_CSC_LINK
    delete envPkg.CSC_LINK
    delete envPkg.CSC_KEY_PASSWORD
    await spawnAsync(NODE_BIN, [
      builderBin, '--win', '--config.npmRebuild=false',
      `--config.directories.output=${DIST_DIR_RELEASE}`,
    ], { cwd: ROOT, env: envPkg },
      linha => emitir('empacotando', { versao: novaVersao, linha }))
  } finally {
    writeFileSync(pkgPath, JSON.stringify(pkgOriginal, null, 2) + '\n', 'utf-8')
  }

  const distDir = DIST_DIR_RELEASE
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
async function publicarReleaseGithub(novaVersao, distDir, notas, onLinha) {
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
      body: notas?.trim() || `Versão ${novaVersao}, publicada via Lançar Versão.`,
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
export async function lancarNovaVersao({ onProgresso, token, notas }) {
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
    const releaseUrl = await publicarReleaseGithub(novaVersao, distDir, notas, linha => emitir('publicando', { versao: novaVersao, linha }))

    emitir('concluido', { versao: novaVersao, releaseUrl })
    return { novaVersao, releaseUrl }
  } finally {
    const poolInvalidacao = criarPoolProducao(bancoProd)
    await invalidarToken(poolInvalidacao, tokenId)
    await poolInvalidacao.end().catch(() => {})
  }
}
