import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { Notification, nativeImage, app, BrowserWindow } from 'electron'
import { existsSync, mkdirSync, writeFileSync, readdirSync, rmSync, statSync } from 'fs'
import { join } from 'path'
import { query, queryOne } from '../db'
import { getConfig, resolverBaseAnexos } from '../config'
import { authImap } from './emailAuth'
import { lerDimensaoImagem } from './imagemDimensoes'

const INTERVALO_MS = 5 * 60_000
// A Caixa de Saida e reprocessada num ritmo proprio, bem mais curto que o
// sync IMAP: um e-mail que caiu por rede e a rede volta em segundos sai no
// minuto seguinte, sem esperar o ciclo de 5min. O tick e barato quando a
// fila esta vazia (um SELECT que nao acha nada).
const INTERVALO_FILA_MS = 60_000

// Mesmo padrão de ícone de reminder.js — extraResources em produção,
// app.getAppPath() em dev (imune a junction fora do OneDrive).
const iconBase = app.isPackaged ? join(process.resourcesPath, 'resources') : join(app.getAppPath(), 'resources')
const icon = nativeImage.createFromPath(join(iconBase, 'icon.ico'))

function broadcast(channel, data) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, data)
  }
}

let syncEmAndamento = false

// Conexões IMAP persistentes (uma por conta), escutando notificações em
// tempo real do servidor via IDLE — client.mailboxOpen() já entra em
// auto-IDLE quando a conexão fica ociosa (padrão do imapflow), e o servidor
// dispara o evento 'exists' assim que uma mensagem nova chega na INBOX,
// sem precisar esperar o próximo ciclo de polling. O polling de 5min
// continua existindo como fallback (conexão IDLE caiu, rede oscilou etc.).
const conexoesIdle = new Map() // contaId -> ImapFlow

// So comeca DEPOIS do login (o renderer chama via IPC 'email:iniciarSync').
// Idempotente: chamadas repetidas nao criam multiplos timers/conexoes.
let syncIniciado = false
let intervaloSync = null
let intervaloFila = null
let filaEmAndamento = false

// Reprocessa a Caixa de Saida fora do ciclo do sync IMAP. Barato quando a
// fila esta vazia; nao roda concorrente consigo mesmo.
async function tickFilaSaida() {
  if (filaEmAndamento) return
  filaEmAndamento = true
  try {
    const { tentarFilaSaida } = await import('./emailEnvioService')
    const r = await tentarFilaSaida()
    if (r.enviados > 0) broadcast('email:filaSaida', { enviados: r.enviados })
  } catch (err) {
    console.warn('[emailSync] tickFilaSaida:', err.message)
  } finally {
    filaEmAndamento = false
  }
}

export function startEmailSync() {
  if (syncIniciado) return
  syncIniciado = true
  syncTodasContas()
  intervaloSync = setInterval(syncTodasContas, INTERVALO_MS)
  intervaloFila = setInterval(tickFilaSaida, INTERVALO_FILA_MS)
  iniciarTodasConexoesIdle()
  // Badge da taskbar reflete o estado atual assim que o usuario entra.
  atualizarBadgeNaoLidas().catch(() => {})
  // Limpeza de anexos orfaos: arquivos que sobraram em disco de mensagens
  // ja excluidas do banco (o CASCADE apaga a linha, nao o arquivo). Roda
  // uma vez por sessao, em segundo plano, sem bloquear o boot.
  setTimeout(() => limparAnexosOrfaos().catch(err => console.warn('[emailSync] limparAnexosOrfaos:', err.message)), 15_000)
}

// Varre <arquivos>/email/<contaId>/ e apaga:
//  - subpastas cujo nome (id da mensagem) nao existe mais em
//    email_mensagem_001;
//  - dentro de <contaId>/inline/, arquivos cujo prefixo (uid_imap_) nao
//    corresponde a nenhuma mensagem daquela conta.
// Conservador: so mexe em nomes 100% numericos / no padrao esperado, e
// engole qualquer erro de IO (arquivo em uso etc.).
async function limparAnexosOrfaos() {
  const base = resolverBaseAnexos('arquivosEmail')
  if (!base) return
  const raizEmail = join(base, 'email')
  if (!existsSync(raizEmail)) return

  let contas
  try { contas = readdirSync(raizEmail, { withFileTypes: true }).filter(d => d.isDirectory() && /^\d+$/.test(d.name)) }
  catch { return }

  let removidos = 0
  for (const dirConta of contas) {
    const contaId = Number(dirConta.name)
    const pastaConta = join(raizEmail, dirConta.name)

    // ids de mensagem que ainda existem nessa conta
    const rows = await query('SELECT id, uid_imap FROM email_mensagem_001 WHERE conta_id = $1', [contaId]).catch(() => [])
    const idsVivos = new Set(rows.map(r => String(r.id)))
    const uidsVivos = new Set(rows.map(r => String(r.uid_imap)))

    let subpastas
    try { subpastas = readdirSync(pastaConta, { withFileTypes: true }) } catch { continue }

    for (const sub of subpastas) {
      const alvo = join(pastaConta, sub.name)
      if (sub.isDirectory() && /^\d+$/.test(sub.name)) {
        // pasta de anexos de uma mensagem
        if (!idsVivos.has(sub.name)) {
          try { rmSync(alvo, { recursive: true, force: true }); removidos++ } catch { /* em uso */ }
        }
      } else if (sub.isDirectory() && sub.name === 'inline') {
        let inlineFiles
        try { inlineFiles = readdirSync(alvo) } catch { continue }
        for (const f of inlineFiles) {
          const uid = f.split('_')[0]
          if (uid && /^\d+$/.test(uid) && !uidsVivos.has(uid)) {
            try { rmSync(join(alvo, f), { force: true }); removidos++ } catch { /* em uso */ }
          }
        }
      }
    }
  }
  if (removidos) console.log(`[emailSync] anexos orfaos removidos: ${removidos}`)
}

// Chamado no logout: para o polling, fecha as conexoes IDLE e limpa o
// badge, pra nao continuar puxando e-mail sem sessao ativa.
export function stopEmailSync() {
  if (!syncIniciado) return
  syncIniciado = false
  if (intervaloSync) { clearInterval(intervaloSync); intervaloSync = null }
  if (intervaloFila) { clearInterval(intervaloFila); intervaloFila = null }
  for (const contaId of [...conexoesIdle.keys()]) pararConexaoIdle(contaId)
  const win = BrowserWindow.getAllWindows().find(w => !w.isDestroyed())
  if (win) {
    win.setOverlayIcon(null, '')
    if (process.platform !== 'win32' && typeof app.setBadgeCount === 'function') app.setBadgeCount(0)
  }
}

async function iniciarTodasConexoesIdle() {
  const contas = await query('SELECT * FROM email_conta_001 WHERE ativa = true')
  for (const conta of contas) {
    iniciarConexaoIdle(conta).catch(err => {
      console.warn(`[emailSync] IDLE falhou ao iniciar (conta ${conta.id}):`, err.message)
    })
  }
}

// Mantém uma conexão viva por conta; se cair (rede, timeout do servidor),
// tenta reconectar em 30s — nunca deixa a conta permanentemente sem IDLE
// só porque uma reconexão falhou uma vez.
async function iniciarConexaoIdle(conta) {
  if (conexoesIdle.has(conta.id)) return

  const client = new ImapFlow({
    host: conta.imap_host,
    port: conta.imap_porta,
    secure: conta.imap_seguranca === 'tls',
    auth: await authImap(conta),
    logger: false,
  })
  conexoesIdle.set(conta.id, client)

  client.on('exists', async (data) => {
    if (data.path !== 'INBOX' || data.count <= (data.prevCount || 0)) return
    try {
      const contaAtual = await queryOne('SELECT * FROM email_conta_001 WHERE id = $1', [conta.id])
      if (!contaAtual || !contaAtual.ativa) return

      // Caminho rapido: sincroniza SO a INBOX primeiro e ja avisa a UI /
      // dispara a notificacao. As demais pastas (Enviados, Spam, Lixeira...)
      // ficam pra um sync completo em segundo plano — elas nao sao o que o
      // usuario esta esperando ver quando "chega um e-mail".
      const novas = await sincronizarSoInbox(contaAtual)
      await marcarSyncOk(conta.id)
      if (novas > 0) await notificarNovas(contaAtual, novas)
      else await atualizarBadgeNaoLidas().catch(() => {})
      broadcast('email:novaMensagem', { contaId: conta.id, quantidade: novas })

      // sync completo das outras pastas, sem segurar o evento
      sincronizarConta(contaAtual)
        .then(() => marcarSyncOk(conta.id))
        .catch(err => console.warn(`[emailSync] sync completo pos-IDLE falhou (conta ${conta.id}):`, err.message))
    } catch (err) {
      console.warn(`[emailSync] falha ao processar notificação IDLE (conta ${conta.id}):`, err.message)
    }
  })

  client.on('close', () => reconectarIdle(conta))
  client.on('error', () => {}) // 'close' já cobre o encerramento; evita crash por unhandled error

  await client.connect()
  const lock = await client.getMailboxLock('INBOX')
  lock.release() // mantém a mailbox selecionada (necessário pro IDLE), mas libera o lock de escrita
}

// Notificacao do SO no mesmo formato do Thunderbird:
//   titulo -> "<conta> recebeu N nova(s) mensagem(ns)"
//   corpo  -> "<Assunto> de <Remetente>" + primeira linha do corpo
// Para varias, lista uma linha por e-mail. Depois de notificar, atualiza o
// badge da taskbar com o total de nao lidas.
async function notificarNovas(conta, novas) {
  try {
    const rows = await query(
      `SELECT remetente_nome, remetente_email, assunto, corpo_texto
       FROM email_mensagem_001
       WHERE conta_id = $1 AND lida = false AND rascunho = false
         AND (pasta_imap = 'INBOX' OR pasta_id IN (SELECT id FROM email_pasta_001 WHERE special_use IS NULL))
       ORDER BY data_envio DESC
       LIMIT $2`,
      [conta.id, Math.min(novas, 5)]
    )

    const plural = novas === 1 ? 'nova mensagem' : 'novas mensagens'
    const titulo = `${conta.nome} recebeu ${novas} ${plural}`

    if (rows.length === 0) {
      new Notification({ title: titulo, body: '', icon }).show()
      atualizarBadgeNaoLidas().catch(() => {})
      return
    }

    const nomeDe = m => {
      const n = (m.remetente_nome || '').trim()
      return n || m.remetente_email || 'remetente desconhecido'
    }
    const assunto = m => (m.assunto || '(sem assunto)').slice(0, 120)
    // Primeira linha util do corpo, sem quebras nem espaco repetido.
    const previa = m => {
      const t = (m.corpo_texto || '').replace(/\s+/g, ' ').trim()
      return t ? t.slice(0, 140) : ''
    }

    let body
    if (rows.length === 1) {
      const m = rows[0]
      const p = previa(m)
      body = `${assunto(m)} de ${nomeDe(m)}` + (p ? `\n${p}` : '')
    } else {
      const linhas = rows.map(m => `${assunto(m)} de ${nomeDe(m)}`)
      const extra = novas > rows.length ? `\n+${novas - rows.length} mais` : ''
      body = linhas.join('\n') + extra
    }

    new Notification({ title: titulo, body, icon }).show()
    atualizarBadgeNaoLidas().catch(() => {})
  } catch (err) {
    console.warn('[emailSync] notificarNovas falhou:', err.message)
    new Notification({ title: `${conta.nome} recebeu ${novas} nova(s) mensagem(ns)`, body: '', icon }).show()
  }
}

// ── Badge (overlay) da taskbar ──────────────────────────────────────────
// O overlay da taskbar do Windows e desenhado pequeno (16px em 100%, ~24
// em 150%, ~32 em 200%). O CAMINHO QUE FUNCIONOU (confirmado na barra do
// usuario, comparado ao Thunderbird): rasterizar o SVG JA no tamanho final
// pequeno via @resvg/resvg-js, e passar esse PNG direto pro setOverlayIcon
// SEM redimensionar depois.
//
// O que NAO funciona (nao repetir):
//  - PNG grande (64/96px) e deixar o Windows OU o nativeImage.resize
//    reduzir: o setOverlayIcon perde o fundo e mostra so o numero solto.
//  - createFromDataURL(SVG) no main: sai preto.
//  - fundo transparente + stroke branco: o Windows pinta o entorno de preto.
// Regra: PNG opaco (fundo todo vermelho, canto = vermelho escuro, nunca
// preto), gerado no tamanho final.
import { Resvg } from '@resvg/resvg-js'

const BADGE_VERMELHO = '#E01B24' // vermelho vivo, estilo Thunderbird
const BADGE_ESCURO   = '#9E141B' // canto fora do circulo (opaco, nao preto)
const BADGE_PX       = 32        // tamanho final; sem resize depois

// Versao aprovada ("quase perfeito"): circulo vermelho opaco + numero da
// fonte do sistema (Segoe UI, peso 700), rasterizado direto em 32px.
function desenharBadge(texto) {
  const n = BADGE_PX
  const cx = n / 2
  const fonte = texto.length >= 2 ? Math.round(n * 0.56) : Math.round(n * 0.68)
  // resvg ignora dominant-baseline; posiciona pela linha de base.
  const baseY = Math.round(cx + fonte * 0.35)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}" viewBox="0 0 ${n} ${n}">
    <rect width="${n}" height="${n}" fill="${BADGE_ESCURO}"/>
    <circle cx="${cx}" cy="${cx}" r="${cx}" fill="${BADGE_VERMELHO}"/>
    <text x="${cx}" y="${baseY}" fill="#ffffff"
      font-family="Segoe UI Semibold, Segoe UI, Arial, sans-serif"
      font-size="${fonte}" font-weight="700" text-anchor="middle">${texto}</text>
  </svg>`

  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: n },
    font: { loadSystemFonts: true, defaultFontFamily: 'Segoe UI' },
    background: BADGE_VERMELHO,
  }).render().asPng()

  return nativeImage.createFromBuffer(png)
}

// Badge vermelho na taskbar com o total de e-mails nao lidos em todas as
// contas ativas. Zerado -> some o overlay.
export async function atualizarBadgeNaoLidas() {
  try {
    const row = await queryOne(
      `SELECT COUNT(*)::int AS n
       FROM email_mensagem_001 m
       JOIN email_conta_001 c ON c.id = m.conta_id AND c.ativa = true
       WHERE m.lida = false AND m.rascunho = false
         AND (m.pasta_imap = 'INBOX' OR m.pasta_id IN (SELECT id FROM email_pasta_001 WHERE special_use IS NULL))`
    )
    const total = row?.n || 0
    const win = BrowserWindow.getAllWindows().find(w => !w.isDestroyed())
    if (!win) return

    // app.setBadgeCount NAO e usado no Windows: la ele desenha um badge
    // proprio do Electron (bolinha) que SOBREPOE / concorre com o nosso
    // setOverlayIcon e aparecia preto. setBadgeCount so vale macOS/Linux.
    const ehWindows = process.platform === 'win32'

    if (total === 0) {
      win.setOverlayIcon(null, '')
      if (!ehWindows && typeof app.setBadgeCount === 'function') app.setBadgeCount(0)
      return
    }

    const rotulo = total > 9 ? '9+' : String(total)
    win.setOverlayIcon(desenharBadge(rotulo), `${total} e-mails não lidos`)
    if (!ehWindows && typeof app.setBadgeCount === 'function') app.setBadgeCount(total)
  } catch (err) {
    console.warn('[emailSync] atualizarBadgeNaoLidas falhou:', err.message)
  }
}

function reconectarIdle(conta) {
  conexoesIdle.delete(conta.id)
  setTimeout(() => {
    iniciarConexaoIdle(conta).catch(err => {
      console.warn(`[emailSync] reconexão IDLE falhou (conta ${conta.id}):`, err.message)
    })
  }, 30_000)
}

export function pararConexaoIdle(contaId) {
  const client = conexoesIdle.get(contaId)
  if (client) {
    client.removeAllListeners('close')
    client.logout().catch(() => {})
    conexoesIdle.delete(contaId)
  }
}

export async function reiniciarConexaoIdle(contaId) {
  pararConexaoIdle(contaId)
  const conta = await queryOne('SELECT * FROM email_conta_001 WHERE id = $1', [contaId])
  if (conta?.ativa) {
    await iniciarConexaoIdle(conta)
  }
}

async function syncTodasContas() {
  if (syncEmAndamento) return
  syncEmAndamento = true
  try {
    const contas = await query('SELECT * FROM email_conta_001 WHERE ativa = true')
    for (const conta of contas) {
      try {
        const novas = await sincronizarConta(conta)
        await marcarSyncOk(conta.id)
        if (novas > 0) await notificarNovas(conta, novas)
        else await atualizarBadgeNaoLidas().catch(() => {})
        broadcast('email:novaMensagem', { contaId: conta.id, quantidade: novas })
      } catch (err) {
        // Falha de UMA conta (rede, senha invalida, servidor fora) nunca
        // aborta o loop nem afeta as outras contas.
        await marcarSyncErro(conta.id, err.message)
        console.warn(`[emailSync] conta ${conta.id} (${conta.email}):`, err.message)
      }
    }
    // Caixa de Saida: tenta reenviar o que ficou preso por falha de rede
    // (o tick dedicado ja cuida disso a cada minuto; aqui e so mais uma
    // chance logo apos o sync IMAP).
    await tickFilaSaida()
  } finally {
    syncEmAndamento = false
  }
}

// Sync sob demanda de uma única conta — reaproveitado pelo botão
// "Atualizar agora" da tela, fora do ciclo do setInterval.
export async function sincronizarContaAgora(contaId) {
  const conta = await queryOne('SELECT * FROM email_conta_001 WHERE id = $1', [contaId])
  if (!conta) throw new Error('Conta de e-mail não encontrada.')
  try {
    const novas = await sincronizarConta(conta)
    await marcarSyncOk(conta.id)
    broadcast('email:novaMensagem', { contaId: conta.id, quantidade: novas })
    return { novas }
  } catch (err) {
    await marcarSyncErro(conta.id, err.message)
    throw err
  }
}

// Ação explícita (botão "Ressincronizar" no modal de editar conta) — mudar
// sincronizar_desde sozinho não refaz o backfill, porque uma vez que
// primeira_sync_concluida=true a sincronização normal só busca UIDs novos
// (mais barato, não refiltra por data a cada ciclo). Aqui o usuário pede
// explicitamente pra refazer a busca retroativa a partir da nova data;
// idempotente via ON CONFLICT em processarMensagem, então e-mails já
// baixados não duplicam.
export async function ressincronizarDesde(contaId, novaData) {
  await query(
    `UPDATE email_conta_001 SET sincronizar_desde = $2, primeira_sync_concluida = false WHERE id = $1`,
    [contaId, novaData]
  )
  return sincronizarContaAgora(contaId)
}

async function marcarSyncOk(contaId) {
  await query(`UPDATE email_conta_001 SET sync_status='ok', sync_erro_msg=NULL, sync_ultima_em=NOW() WHERE id=$1`, [contaId])
}

async function marcarSyncErro(contaId, mensagem) {
  await query(`UPDATE email_conta_001 SET sync_status='erro', sync_erro_msg=$2, sync_ultima_em=NOW() WHERE id=$1`, [contaId, mensagem])
}

async function proximoUidBusca(contaId, pastaImap) {
  // Cada pasta tem sua própria numeração de UID (únicos só dentro da
  // mailbox, não globalmente na conta) — por isso o parâmetro pastaImap.
  const row = await queryOne(
    `SELECT COALESCE(MAX(uid_imap::bigint), 0) AS max_uid
     FROM email_mensagem_001
     WHERE conta_id = $1 AND pasta_imap = $2`,
    [contaId, pastaImap]
  )
  return Number(row.max_uid) + 1
}

// ── Descoberta de pastas: unifica Gmail, Outlook e IMAP generico ──────────
//
// Cada provedor nomeia as pastas de sistema de um jeito. A estrategia:
//  1. Preferir o atributo SPECIAL-USE (RFC 6154) que o servidor anuncia
//     (\Sent \Drafts \Trash \Junk \Archive \All \Flagged \Important).
//     Gmail, Outlook 2013+, Dovecot moderno e Yahoo suportam.
//  2. Fallback por NOME quando o servidor nao anuncia (IMAP antigo): casar
//     o path contra listas de nomes conhecidos em varios idiomas.
//  3. INBOX sempre existe e sempre fica com special_use NULL.
//
// PARTICULARIDADE DO GMAIL: nao existe pasta \Archive. "Arquivar" = tirar o
// rotulo \Inbox; a mensagem continua em "[Gmail]/Todos os e-mails" (\All).
// Entao para o Gmail o destino de arquivamento e a pasta \All. Para os
// demais (Outlook/IMAP) e a pasta \Archive de fato.

const SPECIAL_USE_CATALOGAR = ['\\Sent', '\\Drafts', '\\Trash', '\\Junk', '\\Archive', '\\All']

const NOME_POR_SPECIAL_USE = {
  '\\Sent': 'Enviados',
  '\\Drafts': 'Rascunhos',
  '\\Archive': 'Arquivo',
  '\\Trash': 'Lixeira',
  '\\Junk': 'Spam',
  '\\All': 'Todos os e-mails',
}

// Fallback por nome (lowercased, sem prefixo de namespace tipo "INBOX." ou
// "[Gmail]/"). Cobre PT/EN/ES e as variacoes mais comuns.
const NOME_CONHECIDO = {
  '\\Sent': ['sent', 'sent items', 'sent mail', 'enviados', 'e-mails enviados', 'itens enviados', 'elementos enviados', 'correo enviado'],
  '\\Drafts': ['drafts', 'draft', 'rascunhos', 'borradores'],
  '\\Trash': ['trash', 'deleted', 'deleted items', 'deleted messages', 'lixeira', 'lixo', 'itens excluidos', 'papelera', 'elementos eliminados'],
  '\\Junk': ['junk', 'junk e-mail', 'junk email', 'spam', 'bulk mail', 'correo no deseado', 'lixo eletronico'],
  '\\Archive': ['archive', 'archived', 'arquivo', 'arquivo morto', 'archivo'],
  '\\All': ['all mail', 'all', 'todos os e-mails', 'todos os emails', 'todo', 'todos'],
}

function semNamespace(path, delimiter) {
  let p = path
  if (p.toUpperCase().startsWith('INBOX' + delimiter)) p = p.slice(5 + delimiter.length)
  const m = p.match(/^\[[^\]]+\]\/?(.*)$/) // "[Gmail]/Lixeira" -> "Lixeira"
  if (m) p = m[1]
  return p.toLowerCase().trim()
}

function classificarPasta(m, delimiter) {
  if (m.path === 'INBOX') return null // Inbox = special_use NULL sempre
  if (m.specialUse && SPECIAL_USE_CATALOGAR.includes(m.specialUse)) return m.specialUse
  const nome = semNamespace(m.path, delimiter)
  for (const [su, nomes] of Object.entries(NOME_CONHECIDO)) {
    if (nomes.includes(nome)) return su
  }
  return undefined // pasta comum, nao catalogar
}

async function descobrirPastas(client, contaId) {
  const lista = await client.list()

  // Classifica cada pasta; guarda a 1a de cada special_use (evita duplicar
  // se o servidor tiver "Sent" e "Sent Items" as duas).
  const porSpecialUse = new Map() // '\Sent' -> mailbox
  let inbox = null
  for (const m of lista) {
    if (m.path === 'INBOX') { inbox = m; continue }
    const su = classificarPasta(m, m.delimiter || '/')
    if (su && !porSpecialUse.has(su)) porSpecialUse.set(su, m)
  }

  const paraGravar = []
  if (inbox) paraGravar.push({ path: 'INBOX', nome: 'Caixa de entrada', su: null, delim: inbox.delimiter || '/' })
  for (const [su, m] of porSpecialUse) {
    // Rascunhos e "Todos os e-mails" nao viram item de navegacao proprio
    // (Rascunhos e pseudo-pasta client-side; \All e usado so como destino de
    // arquivamento no Gmail) — mas sao gravados pra resolucao de destino.
    paraGravar.push({ path: m.path, nome: NOME_POR_SPECIAL_USE[su] || m.name, su, delim: m.delimiter || '/' })
  }

  const pastas = []
  for (const p of paraGravar) {
    const registro = await queryOne(
      `INSERT INTO email_pasta_001 (conta_id, caminho_imap, nome_exibicao, special_use, delimitador)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (conta_id, caminho_imap) DO UPDATE SET special_use = EXCLUDED.special_use, nome_exibicao = EXCLUDED.nome_exibicao
       RETURNING *`,
      [contaId, p.path, p.nome, p.su, p.delim]
    )
    pastas.push(registro)
  }

  // Re-associa pasta_id das mensagens ja sincronizadas pelo pasta_imap
  // (necessario apos recatalogar as pastas, ou quando o sync gravou msgs
  // antes da pasta existir). So toca linhas onde pasta_id esta desatualizado.
  for (const pasta of pastas) {
    await query(
      `UPDATE email_mensagem_001 SET pasta_id = $1
       WHERE conta_id = $2 AND pasta_imap = $3 AND (pasta_id IS DISTINCT FROM $1)`,
      [pasta.id, contaId, pasta.caminho_imap]
    )
  }

  return pastas
}

// Descoberta de pastas isolada do sync completo — usada pelo frontend ao
// expandir uma conta pela primeira vez, pra listar Caixa de entrada/
// Enviados/Arquivo/Lixeira/Spam sem esperar a sincronização completa de
// mensagens (que só roda a cada 5min ou sob demanda).
//
// Reaproveita a conexão IDLE já aberta daquela conta quando existir, em vez
// de abrir uma conexão nova — abrir uma 3ª conexão simultânea logo no boot
// do app (quando o polling inicial + a conexão IDLE de cada conta já estão
// negociando ao mesmo tempo) esbarra no limite de conexões simultâneas por
// credencial que provedores como Gmail impõem, e a tentativa falha ou
// trava silenciosamente — sintoma visto: "Nenhuma pasta encontrada" na
// primeira expansão, mas funciona ao recolher/expandir de novo (quando as
// conexões do boot já estabilizaram).
export async function descobrirPastasAgora(contaId) {
  const clientIdle = conexoesIdle.get(contaId)
  if (clientIdle && clientIdle.usable) {
    return descobrirPastas(clientIdle, contaId)
  }

  const conta = await queryOne('SELECT * FROM email_conta_001 WHERE id = $1', [contaId])
  if (!conta) throw new Error('Conta de e-mail não encontrada.')

  const client = new ImapFlow({
    host: conta.imap_host,
    port: conta.imap_porta,
    secure: conta.imap_seguranca === 'tls',
    auth: await authImap(conta),
    logger: false,
  })
  await client.connect()
  try {
    return await descobrirPastas(client, contaId)
  } finally {
    await client.logout()
  }
}

// Sobe uma copia do e-mail recem-enviado para a pasta "Enviados" do
// servidor IMAP, pra ele aparecer no webmail / no celular do usuario (o
// SMTP so entrega, nao arquiva). Melhor esforco: qualquer falha aqui e
// engolida — o e-mail ja foi enviado, isto e so paridade com clientes
// nativos. Recebe o MIME cru (Buffer) que o nodemailer produziu no envio.
export async function apendarEmailEnviado(contaId, rawMime) {
  if (!rawMime || !Buffer.isBuffer(rawMime)) return
  const conta = await queryOne('SELECT * FROM email_conta_001 WHERE id = $1 AND ativa = true', [contaId])
  if (!conta) return

  // Descobre o caminho da pasta Enviados: do catalogo local, senao lista as
  // pastas do servidor pra achar a \Sent.
  let caminhoSent = null
  const local = await queryOne(
    `SELECT caminho_imap FROM email_pasta_001 WHERE conta_id = $1 AND special_use = '\\Sent' LIMIT 1`,
    [contaId]
  )
  if (local) caminhoSent = local.caminho_imap

  const client = new ImapFlow({
    host: conta.imap_host,
    port: conta.imap_porta,
    secure: conta.imap_seguranca === 'tls',
    auth: await authImap(conta),
    logger: false,
  })
  try {
    await client.connect()
    if (!caminhoSent) {
      try {
        const pastas = await descobrirPastas(client, contaId)
        caminhoSent = pastas.find(p => p.special_use === '\\Sent')?.caminho_imap || null
      } catch { /* sem catalogo: aborta silencioso */ }
    }
    if (!caminhoSent) return
    await client.append(caminhoSent, rawMime, ['\\Seen'])
  } catch (err) {
    console.warn(`[emailSync] apendarEmailEnviado (conta ${contaId}):`, err.message)
  } finally {
    try { await client.logout() } catch { /* ignore */ }
  }
}

// Retorna a quantidade de mensagens genuinamente novas processadas, somada
// de todas as pastas sincronizadas.
// Caminho rapido do IDLE: baixa so a INBOX. Reaproveita descobrirPastas pra
// achar o registro da INBOX (pasta_id correto), mas nao toca nas outras.
async function sincronizarSoInbox(conta) {
  const client = new ImapFlow({
    host: conta.imap_host,
    port: conta.imap_porta,
    secure: conta.imap_seguranca === 'tls',
    auth: await authImap(conta),
    logger: false,
  })
  let novas = 0
  await client.connect()
  try {
    let inbox = { id: null, caminho_imap: 'INBOX', special_use: null }
    try {
      const pastas = await descobrirPastas(client, conta.id)
      inbox = pastas.find(p => p.caminho_imap === 'INBOX' || p.special_use === '\\Inbox') || inbox
    } catch { /* usa o fallback INBOX cru */ }
    novas = await sincronizarPasta(client, conta, inbox)
  } finally {
    await client.logout()
  }
  if (!conta.primeira_sync_concluida) {
    await query('UPDATE email_conta_001 SET primeira_sync_concluida = true WHERE id = $1', [conta.id])
  }
  return novas
}

async function sincronizarConta(conta) {
  const client = new ImapFlow({
    host: conta.imap_host,
    port: conta.imap_porta,
    secure: conta.imap_seguranca === 'tls',
    auth: await authImap(conta),
    logger: false,
  })

  let novas = 0
  await client.connect()
  try {
    let pastas
    try {
      pastas = await descobrirPastas(client, conta.id)
    } catch (err) {
      // Falha ao listar pastas (servidor sem suporte, erro de rede pontual)
      // não pode travar o sync da INBOX, que já funcionava antes desta
      // feature — cai pro comportamento antigo (só INBOX, sem catalogar).
      console.warn(`[emailSync] descoberta de pastas falhou (conta ${conta.id}):`, err.message)
      pastas = [{ id: null, caminho_imap: 'INBOX', special_use: null }]
    }

    // Sequencial, não em paralelo — uma única conexão TCP, locks de mailbox
    // são sequenciais por natureza do protocolo IMAP.
    // \Drafts e \All nao sao sincronizados como lista propria: Rascunhos e
    // client-side; \All (Gmail "Todos os e-mails") duplicaria toda a caixa.
    // Ficam catalogados so pra resolver destino de arquivamento/mover.
    for (const pasta of pastas) {
      if (pasta.special_use === '\\Drafts' || pasta.special_use === '\\All') continue
      novas += await sincronizarPasta(client, conta, pasta)
    }
  } finally {
    await client.logout()
  }

  if (!conta.primeira_sync_concluida) {
    await query('UPDATE email_conta_001 SET primeira_sync_concluida = true WHERE id = $1', [conta.id])
  }
  return novas
}

// Pastas de sistema pequenas: baixa TUDO (sem filtro de data), a Lixeira e o
// Spam costumam ter e-mails antigos que o sincronizar_desde da conta (focado
// na Inbox) cortaria. A Inbox e o Arquivo (que podem ser enormes) seguem o
// sincronizar_desde.
const PASTAS_BACKFILL_TOTAL = ['\\Trash', '\\Junk']

async function sincronizarPasta(client, conta, pasta) {
  const lock = await client.getMailboxLock(pasta.caminho_imap)
  try {
    const maxUidAtual = await proximoUidBusca(conta.id, pasta.caminho_imap) - 1
    const backfillTotal = PASTAS_BACKFILL_TOTAL.includes(pasta.special_use)

    let criterio
    if (conta.primeira_sync_concluida && maxUidAtual > 0) {
      // Pasta ja sincronizada: so incremental (UIDs novos).
      criterio = { uid: `${maxUidAtual + 1}:*` }
    } else if (backfillTotal) {
      // Lixeira/Spam nunca sincronizada: pega tudo (range de sequencia 1:*).
      criterio = '1:*'
    } else {
      // Inbox/Arquivo: backfill a partir da data configurada.
      criterio = { since: new Date(conta.sincronizar_desde) }
    }

    // UIDs que ja estao no banco pra esta pasta — pula o parse (caro:
    // MIME completo + extracao de anexo) das mensagens ja baixadas. Antes,
    // numa 1a sync interrompida, o `since` retrazia a Inbox inteira e cada
    // mensagem era reparseada so pra o INSERT cair no ON CONFLICT.
    const jaBaixados = new Set(
      (await query('SELECT uid_imap FROM email_mensagem_001 WHERE conta_id = $1 AND pasta_imap = $2', [conta.id, pasta.caminho_imap])
        .catch(() => [])).map(r => String(r.uid_imap))
    )

    let novas = 0
    for await (const msg of client.fetch(criterio, { envelope: true, uid: true, source: true, flags: true }, { uid: true })) {
      if (jaBaixados.has(String(msg.uid))) continue
      const gravou = await processarMensagem(conta, msg, pasta)
      if (gravou) novas++
    }
    console.log(`[emailSync] ${pasta.caminho_imap} (conta ${conta.id}): +${novas} mensagens`)
    return novas
  } catch (err) {
    console.warn(`[emailSync] falha ao sincronizar pasta ${pasta.caminho_imap} (conta ${conta.id}):`, err.message)
    return 0
  } finally {
    lock.release()
  }
}

function calcularThreadId(parsed) {
  // mailparser retorna parsed.references ora como string única, ora como
  // array (dependendo do cabeçalho bruto do e-mail) — sem normalizar pra
  // array primeiro, references[0] numa string pega só o 1º caractere ("<"),
  // corrompendo o thread_id e quebrando o agrupamento por conversa.
  const referencias = Array.isArray(parsed.references) ? parsed.references : (parsed.references ? [parsed.references] : [])
  if (referencias.length) return referencias[0]
  if (parsed.inReplyTo) return parsed.inReplyTo
  return parsed.messageId || null
}

// Idempotência via ON CONFLICT DO NOTHING sobre (conta_id, pasta_imap,
// uid_imap) — se a mensagem já existe, RETURNING id não devolve linha e a
// função retorna false sem reprocessar anexos nem notificar de novo.
async function processarMensagem(conta, msg, pasta) {
  const parsed = await simpleParser(msg.source)

  const destinatarios = (parsed.to?.value || []).map(v => ({ nome: v.name || '', email: v.address }))
  const copia = (parsed.cc?.value || []).map(v => ({ nome: v.name || '', email: v.address }))
  const remetente = parsed.from?.value?.[0]

  // Pasta real de Enviados: se o KronTech já gravou uma cópia local no
  // momento do envio (pasta_imap='SENT' sentinela, origem='enviado'), essa
  // mensagem que o servidor está devolvendo agora é a MESMA — casada por
  // message_id — então atualiza a linha existente (uid/pasta reais) em vez
  // de inserir de novo, evitando duplicata visível na lista.
  if (pasta.special_use === '\\Sent' && parsed.messageId) {
    const existente = await queryOne(
      `SELECT id FROM email_mensagem_001 WHERE conta_id=$1 AND message_id=$2 AND origem='enviado'`,
      [conta.id, parsed.messageId]
    )
    if (existente) {
      await query(
        `UPDATE email_mensagem_001 SET uid_imap=$1, pasta_imap=$2, pasta_id=$3 WHERE id=$4`,
        [String(msg.uid), pasta.caminho_imap, pasta.id, existente.id]
      )
      return false
    }
  }

  // mailparser separa os anexos em dois tipos:
  //  - related:true  -> imagem embutida no corpo (cid:): print colado ou
  //    logo de assinatura. E gravada em email_anexo_001 (inline=true) e o
  //    cid: do HTML vira `kmail://anexo/<id>` (protocolo servido pelo main).
  //    NAO embute mais base64 no corpo_html — era o que inchava o banco
  //    (957 MB em 287 e-mails). Ver docs/PLANO_EMAIL_ARMAZENAMENTO.md.
  //  - related:false -> anexo "de verdade" (planilha, PDF, zip...). Vai
  //    pra secao Anexos como antes.
  const todosAnexos = parsed.attachments || []
  const inlineImgs = todosAnexos.filter(a => a.related && /^image\//i.test(a.contentType || ''))
  const anexosReais = todosAnexos.filter(a => !a.related)

  // Classifica uma imagem INLINE: e so decoracao de assinatura/logo (fica
  // embutida no corpo e nada mais) ou conteudo de verdade (print colado,
  // aparece tambem na barra de Anexos)?
  //
  // Assinatura/logo: nome no padrao "imageNNN.png" do Outlook, OU dimensao
  // pequena (<= 250px em ambos os lados), OU o <img> no HTML declara
  // width/height pequenos. Assinaturas de Zimbra/webmail tem nome livre
  // (ex: "isa.png") — por isso a dimensao e o criterio principal.
  const htmlOrig = parsed.html || ''
  const ehNomeOutlook = (img) => {
    const nome = (img.filename || '').toLowerCase()
    const cid = (img.cid || '').toLowerCase()
    return /^image\d{3,}\.(png|jpe?g|gif)$/.test(nome) || /^<?image\d{3,}\.(png|jpe?g|gif)@/.test(cid)
  }
  // width/height declarados no <img> que referencia este cid (atributo ou
  // style inline). Se ambos <= 200, e decoracao.
  const dimNoHtml = (cidLimpo) => {
    if (!htmlOrig || !cidLimpo) return null
    const re = new RegExp(`<img\\b[^>]*cid:${cidLimpo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*>`, 'i')
    const tag = htmlOrig.match(re)?.[0]
    if (!tag) return null
    const w = parseInt((tag.match(/\bwidth\s*[:=]\s*["']?\s*(\d+)/i) || [])[1] || '', 10)
    const h = parseInt((tag.match(/\bheight\s*[:=]\s*["']?\s*(\d+)/i) || [])[1] || '', 10)
    if (!w && !h) return null
    return { w: w || h, h: h || w }
  }
  const pareceConteudo = (img) => {
    const nome = (img.filename || '').toLowerCase()
    if (/(screenshot|captura|pasted|colad|colar|imagem colada|print)/.test(nome)) return true
    if (ehNomeOutlook(img)) return false
    const cidLimpo = (img.cid || '').replace(/[<>]/g, '')
    const dh = dimNoHtml(cidLimpo)
    if (dh && dh.w <= 200 && dh.h <= 200) return false
    const dim = lerDimensaoImagem(img.content)
    if (dim) {
      // Assinatura/foto: pequena nos dois lados.
      if (dim.largura <= 250 && dim.altura <= 250) return false
      // Banner de assinatura: proporcao alongada (largura >> altura).
      const prop = Math.max(dim.largura, dim.altura) / Math.max(1, Math.min(dim.largura, dim.altura))
      if (prop > 2.5) return false
      // Print de verdade: grande num lado E pesado E proporcao "de tela".
      if ((dim.largura >= 500 || dim.altura >= 500) && (img.size || img.content?.length || 0) >= 80 * 1024) return true
    }
    // Empate: NAO vira anexo (o falso-positivo — assinatura virando anexo —
    // era a reclamacao; assinatura no corpo e o caso comum).
    return false
  }

  // Imagens que o Outlook do remetente referenciou por caminho de arquivo
  // LOCAL da maquina dele (src="file:///C:/Users/.../Signatures/...") nunca
  // carregam aqui. Sempre lixo de assinatura mal montada — remove o <img>.
  let corpoHtml = parsed.html || null
  if (corpoHtml && /src\s*=\s*["']file:/i.test(corpoHtml)) {
    corpoHtml = corpoHtml.replace(/<img\b[^>]*\bsrc\s*=\s*["']file:[^>]*>/gi, '')
  }

  // 1) Insere a mensagem (com o corpo_html ainda referenciando cid:).
  const row = await queryOne(
    `INSERT INTO email_mensagem_001
       (conta_id, uid_imap, pasta_imap, pasta_id, message_id, in_reply_to, thread_id,
        remetente_nome, remetente_email, destinatarios, copia, assunto,
        corpo_texto, corpo_html, data_envio, tem_anexo, tamanho_bytes, origem)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'recebido')
     ON CONFLICT (conta_id, pasta_imap, uid_imap) DO NOTHING
     RETURNING id`,
    [
      conta.id, String(msg.uid), pasta.caminho_imap, pasta.id, parsed.messageId || null, parsed.inReplyTo || null, calcularThreadId(parsed),
      remetente?.name || '', remetente?.address || '', JSON.stringify(destinatarios), JSON.stringify(copia),
      parsed.subject || '', parsed.text || '', corpoHtml,
      parsed.date || new Date(), anexosReais.length > 0, msg.source.length,
    ]
  )
  if (!row) return false

  if (anexosReais.length) {
    await gravarAnexos(conta.id, row.id, anexosReais, false)
  }

  // 2) Grava cada imagem inline em disco + linha em email_anexo_001, e
  //    troca `cid:XXX` por `kmail://anexo/<id>` no corpo_html.
  if (inlineImgs.length && corpoHtml) {
    const base = resolverBaseAnexos('arquivosEmail')
    const pastaInline = base ? join(base, 'email', String(conta.id), 'inline') : null
    if (pastaInline && !existsSync(pastaInline)) mkdirSync(pastaInline, { recursive: true })

    let temAnexoListavel = false
    for (const img of inlineImgs) {
      const cidLimpo = (img.cid || '').replace(/[<>]/g, '')
      const tipo = img.contentType || 'image/png'
      if (!pastaInline) continue

      const ext = tipo.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'png'
      const nomeArquivo = `${String(msg.uid)}_${(cidLimpo || 'img').replace(/[^a-z0-9._-]/gi, '_')}.${ext}`
      const caminho = join(pastaInline, nomeArquivo)
      writeFileSync(caminho, img.content)

      const listavel = pareceConteudo(img)
      const anexoRow = await queryOne(
        `INSERT INTO email_anexo_001 (mensagem_id, nome_original, caminho, content_type, tamanho_bytes, content_id, inline, mostrar_lista)
         VALUES ($1,$2,$3,$4,$5,$6,true,$7) RETURNING id`,
        [
          row.id,
          img.filename || `imagem.${ext}`,
          caminho, tipo,
          img.size || img.content?.length || null,
          cidLimpo || null,
          listavel,
        ]
      )
      if (listavel) temAnexoListavel = true

      // Substitui cid:XXX -> kmail://anexo/<id> no corpo.
      if (anexoRow && cidLimpo) {
        const reCid = new RegExp(`cid:${cidLimpo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
        corpoHtml = corpoHtml.replace(reCid, `kmail://anexo/${anexoRow.id}`)
      }
    }

    await query('UPDATE email_mensagem_001 SET corpo_html = $1 WHERE id = $2', [corpoHtml, row.id])
    if (temAnexoListavel && !anexosReais.length) {
      await query('UPDATE email_mensagem_001 SET tem_anexo = true WHERE id = $1', [row.id])
    }
  }

  return true
}

// Extensao padrao por content-type, pra dar nome decente a anexo sem
// filename (ex: convite .ics do Outlook vem como "attachment" sem nome).
const EXT_POR_TIPO = {
  'text/calendar': 'ics', 'application/ics': 'ics',
  'application/pdf': 'pdf', 'application/zip': 'zip',
  'application/msword': 'doc', 'application/vnd.ms-excel': 'xls',
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif',
  'text/plain': 'txt', 'text/html': 'html', 'message/rfc822': 'eml',
}
function nomeAnexo(anexo) {
  if (anexo.filename && anexo.filename.trim()) return anexo.filename.replace(/[\\/:*?"<>|]/g, '')
  const tipo = (anexo.contentType || '').toLowerCase().split(';')[0].trim()
  const ext = EXT_POR_TIPO[tipo]
  if (tipo === 'text/calendar') return `convite.ics`
  return ext ? `anexo.${ext}` : 'anexo'
}

async function gravarAnexos(contaId, mensagemId, anexos, inline = false) {
  const base = resolverBaseAnexos('arquivosEmail')
  if (!base) return

  const pasta = join(base, 'email', String(contaId), String(mensagemId))
  if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true })

  for (const anexo of anexos) {
    const nome = nomeAnexo(anexo)
    const caminho = join(pasta, nome)
    writeFileSync(caminho, anexo.content)
    await query(
      `INSERT INTO email_anexo_001 (mensagem_id, nome_original, caminho, content_type, tamanho_bytes, content_id, inline)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [mensagemId, nome, caminho, anexo.contentType || null, anexo.size || null, anexo.cid || null, inline]
    )
  }
}
