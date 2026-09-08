// Migracao de LIMPEZA: extrai as imagens base64 embutidas no corpo_html de
// e-mails ja gravados, salva cada uma em disco + linha em email_anexo_001,
// e troca o `data:image;base64,...` por `kmail://anexo/<id>`.
//
// Motivo: 287 e-mails ocupavam 957 MB porque cada imagem inline foi
// embutida como base64 no corpo, e "Responder" multiplicava isso pela
// thread. Ver docs/PLANO_EMAIL_ARMAZENAMENTO.md.
//
// SEGURANCA:
//  - Faz pg_dump COMPLETO antes de qualquer UPDATE (--modo=dry nao).
//  - --dry (padrao): so relata o que faria, nao grava nada.
//  - --executar: aplica de verdade.
//  - Ao final do modo --executar: VACUUM FULL email_mensagem_001.
//
// Uso:
//   node scripts/limpar-corpo-email.mjs --db=krontech --dry
//   node scripts/limpar-corpo-email.mjs --db=krontech --executar
//
// A senha do Postgres vem de PGPASSWORD no ambiente.

import pg from 'pg'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RAIZ = join(__dirname, '..')

// ── Args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const getArg = (nome, padrao) => {
  const a = args.find((x) => x.startsWith(`--${nome}=`))
  return a ? a.split('=')[1] : padrao
}
const DB = getArg('db', 'krontech')
const EXECUTAR = args.includes('--executar')
// Modo separado: revisa anexos inline JA existentes (de syncs antigos) e
// rebaixa pra mostrar_lista=false os que sao assinatura (pequenos, banner,
// ou repetidos). Nao mexe em corpo_html. Combina com --executar.
const RECLASSIFICAR = args.includes('--reclassificar')
const PGHOST = getArg('host', 'localhost')
const PGPORT = getArg('port', '5432')
const PGUSER = getArg('user', 'postgres')
const PG_BIN = getArg('pgbin', 'C:\\Program Files\\PostgreSQL\\18\\bin')
// Pasta base dos anexos de e-mail. Igual ao resolverBaseAnexos('arquivosEmail')
// do app; passar via --base= se for diferente.
const BASE_ANEXOS = getArg(
  'base',
  'C:\\Users\\ander\\OneDrive\\Desktop\\Krontech Arquivos\\EMAIL'
)

if (!process.env.PGPASSWORD) {
  console.error('ERRO: defina PGPASSWORD no ambiente (senha do Postgres).')
  process.exit(1)
}

console.log(`\n=== Limpeza de corpo_html (base64 -> kmail://) ===`)
console.log(`Banco:        ${DB} @ ${PGHOST}:${PGPORT}`)
console.log(`Base anexos:  ${BASE_ANEXOS}`)
console.log(`Modo:         ${EXECUTAR ? 'EXECUTAR (grava)' : 'DRY-RUN (so relatorio)'}\n`)

// ── Backup pg_dump (so no modo executar) ────────────────────────────────
if (EXECUTAR) {
  const dirBackup = join(RAIZ, 'backup')
  if (!existsSync(dirBackup)) mkdirSync(dirBackup, { recursive: true })
  const carimbo = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const arqDump = join(dirBackup, `pre-limpeza-email_${DB}_${carimbo}.dump`)
  console.log(`Backup pg_dump -> ${arqDump}`)
  const r = spawnSync(
    join(PG_BIN, 'pg_dump.exe'),
    ['-h', PGHOST, '-p', PGPORT, '-U', PGUSER, '-Fc', '-f', arqDump, DB],
    { stdio: 'inherit', env: process.env }
  )
  if (r.status !== 0) {
    console.error('ERRO: pg_dump falhou. Abortando (nada foi alterado).')
    process.exit(1)
  }
  if (!existsSync(arqDump)) {
    console.error('ERRO: arquivo de dump nao foi criado. Abortando.')
    process.exit(1)
  }
  console.log('Backup OK.\n')
}

// ── Conexao ─────────────────────────────────────────────────────────────
const pool = new pg.Pool({ host: PGHOST, port: Number(PGPORT), database: DB, user: PGUSER, password: process.env.PGPASSWORD })

const RE_DATA_IMG = /data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/gi
const EXT_POR_MIME = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/bmp': 'bmp', 'image/svg+xml': 'svg' }

// dimensao de imagem sem lib (PNG/JPEG/GIF) — pra decidir mostrar_lista
function dimImg(buf) {
  if (!buf || buf.length < 24) return null
  if (buf[0] === 0x89 && buf[1] === 0x50) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let o = 2
    while (o + 9 < buf.length) {
      if (buf[o] !== 0xff) { o++; continue }
      const m = buf[o + 1]
      if ((m >= 0xc0 && m <= 0xc3) || (m >= 0xc5 && m <= 0xc7) || (m >= 0xc9 && m <= 0xcb)) {
        return { h: buf.readUInt16BE(o + 5), w: buf.readUInt16BE(o + 7) }
      }
      if (m === 0xd8 || m === 0xd9 || (m >= 0xd0 && m <= 0xd7)) { o += 2; continue }
      const t = buf.readUInt16BE(o + 2); if (t < 2) break; o += 2 + t
    }
  }
  return null
}

let totalEmails = 0
let totalImagens = 0
let totalListaveis = 0
let bytesAntes = 0
let bytesDepois = 0
const erros = []

// ── Modo --reclassificar: so revisa email_anexo_001 inline ja existente ──
if (RECLASSIFICAR) {
  try {
    const { rows } = await pool.query(
      `SELECT id, caminho, tamanho_bytes, content_type, content_id
       FROM email_anexo_001
       WHERE inline = true AND mostrar_lista = true
       ORDER BY id`
    )
    console.log(`Anexos inline com mostrar_lista=true: ${rows.length}`)
    let rebaixados = 0
    for (const a of rows) {
      let dim = null
      try {
        if (a.caminho && existsSync(a.caminho)) {
          const { readFileSync } = await import('node:fs')
          dim = dimImg(readFileSync(a.caminho))
        }
      } catch { /* ignora */ }
      const prop = dim ? Math.max(dim.w, dim.h) / Math.max(1, Math.min(dim.w, dim.h)) : 1
      // Assinatura: pequena, banner, ou < 60 kB. Mantem listavel so o que
      // e claramente print (grande, proporcao de tela, pesado).
      const ehPrint = dim && prop <= 2.5 && (dim.w >= 500 || dim.h >= 500) && (a.tamanho_bytes || 0) >= 80 * 1024
      if (!ehPrint) {
        rebaixados++
        if (EXECUTAR) {
          await pool.query('UPDATE email_anexo_001 SET mostrar_lista = false WHERE id = $1', [a.id])
        }
        console.log(`  ${EXECUTAR ? 'rebaixado' : 'rebaixaria'} anexo ${a.id} (${a.tamanho_bytes} B${dim ? `, ${dim.w}x${dim.h}` : ''})`)
      }
    }
    console.log(`\n${EXECUTAR ? 'Rebaixados' : 'Rebaixaria'}: ${rebaixados} de ${rows.length}`)
    if (!EXECUTAR) console.log('(DRY — passe --executar para aplicar)')
  } finally {
    await pool.end()
  }
  process.exit(0)
}

try {
  const { rows } = await pool.query(
    `SELECT id, conta_id, uid_imap, corpo_html
     FROM email_mensagem_001
     WHERE corpo_html LIKE '%data:image/%;base64,%'
     ORDER BY id`
  )
  console.log(`E-mails com base64 embutido: ${rows.length}`)

  // PASSO 1: varre tudo so pra CONTAR quantos e-mails distintos cada
  // imagem (por hash do conteudo) aparece. Assinatura/logo repete em
  // varias threads; print colado e unico. Se um hash aparece em 2+
  // e-mails distintos -> e assinatura, mostrar_lista = false.
  const contagemPorHash = new Map() // hash -> Set(msgId)
  for (const msg of rows) {
    for (const oc of msg.corpo_html.matchAll(RE_DATA_IMG)) {
      const h = createHash('sha1').update(oc[2]).digest('hex')
      if (!contagemPorHash.has(h)) contagemPorHash.set(h, new Set())
      contagemPorHash.get(h).add(msg.id)
    }
  }
  const repetida = (h) => (contagemPorHash.get(h)?.size || 0) >= 2
  console.log(`Imagens distintas (por hash): ${contagemPorHash.size}\n`)

  for (const msg of rows) {
    let html = msg.corpo_html
    const original = html
    bytesAntes += Buffer.byteLength(original, 'utf8')

    // Junta todas as ocorrencias primeiro (o replace e feito depois, com o
    // id do anexo ja criado).
    const ocorrencias = [...original.matchAll(RE_DATA_IMG)]
    if (!ocorrencias.length) { bytesDepois += bytesAntes; continue }

    totalEmails++
    const pastaInline = join(BASE_ANEXOS, 'email', String(msg.conta_id), 'inline')
    if (EXECUTAR && !existsSync(pastaInline)) mkdirSync(pastaInline, { recursive: true })

    let n = 0
    for (const oc of ocorrencias) {
      const [trecho, mime, b64] = oc
      const buf = Buffer.from(b64, 'base64')
      const hash = createHash('sha1').update(b64).digest('hex')
      const ext = EXT_POR_MIME[mime.toLowerCase()] || 'png'
      const nomeArq = `limpeza_${msg.id}_${n}.${ext}`
      const caminho = join(pastaInline, nomeArq)
      const dim = dimImg(buf)
      // Classificacao "e print colado (listavel) ou assinatura/logo?":
      //  - repete em 2+ e-mails      -> assinatura      -> NAO lista
      //  - proporcao de banner (>2.5:1) -> assinatura   -> NAO lista
      //  - pequena (<=250 nos 2 lados) -> logo/foto     -> NAO lista
      //  - grande (>=500 em um lado) E unica E >=80 kB -> print -> LISTA
      const prop = dim ? Math.max(dim.w, dim.h) / Math.max(1, Math.min(dim.w, dim.h)) : 1
      let listavel = false
      if (!repetida(hash) && dim && prop <= 2.5 &&
          (dim.w >= 500 || dim.h >= 500) && buf.length >= 80 * 1024) {
        listavel = true
      }
      n++
      totalImagens++
      if (listavel) totalListaveis++

      if (EXECUTAR) {
        try {
          writeFileSync(caminho, buf)
          const ins = await pool.query(
            `INSERT INTO email_anexo_001
               (mensagem_id, nome_original, caminho, content_type, tamanho_bytes, content_id, inline, mostrar_lista)
             VALUES ($1,$2,$3,$4,$5,NULL,true,$6) RETURNING id`,
            [msg.id, nomeArq, caminho, mime, buf.length, listavel]
          )
          const anexoId = ins.rows[0].id
          html = html.replace(trecho, `kmail://anexo/${anexoId}`)
        } catch (e) {
          erros.push(`msg ${msg.id} img ${n}: ${e.message}`)
        }
      } else {
        // dry: so simula a troca no texto pra medir o tamanho final
        html = html.replace(trecho, `kmail://anexo/000000`)
      }
    }

    // Remove <img src="file:..."> de quebra (mesma limpeza do sync).
    html = html.replace(/<img\b[^>]*\bsrc\s*=\s*["']file:[^>]*>/gi, '')
    bytesDepois += Buffer.byteLength(html, 'utf8')

    if (EXECUTAR && html !== original) {
      await pool.query('UPDATE email_mensagem_001 SET corpo_html = $1 WHERE id = $2', [html, msg.id])
    }

    const kbAntes = (Buffer.byteLength(original, 'utf8') / 1024).toFixed(0)
    const kbDepois = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(0)
    console.log(`  msg ${String(msg.id).padStart(5)} | ${ocorrencias.length} img | ${kbAntes} kB -> ${kbDepois} kB`)
  }

  console.log(`\n--- Resumo ---`)
  console.log(`E-mails processados:      ${totalEmails}`)
  console.log(`Imagens extraidas:        ${totalImagens}`)
  console.log(`  viram anexo listavel:   ${totalListaveis} (print colado)`)
  console.log(`  so no corpo (assinatura): ${totalImagens - totalListaveis}`)
  console.log(`corpo_html total:         ${(bytesAntes / 1024 / 1024).toFixed(1)} MB -> ${(bytesDepois / 1024 / 1024).toFixed(2)} MB`)
  if (erros.length) {
    console.log(`\nERROS (${erros.length}):`)
    erros.forEach((e) => console.log('  ' + e))
  }

  if (EXECUTAR) {
    console.log(`\nVACUUM FULL email_mensagem_001 ...`)
    await pool.query('VACUUM FULL email_mensagem_001')
    await pool.query('VACUUM FULL email_anexo_001')
    const t = await pool.query(`SELECT pg_size_pretty(pg_total_relation_size('email_mensagem_001')) AS tam`)
    console.log(`email_mensagem_001 agora: ${t.rows[0].tam}`)
    const d = await pool.query(`SELECT pg_size_pretty(pg_database_size($1)) AS tam`, [DB])
    console.log(`banco ${DB} agora: ${d.rows[0].tam}`)
  } else {
    console.log(`\n(DRY-RUN — nada foi gravado. Rode com --executar para aplicar.)`)
  }
} catch (e) {
  console.error('\nFALHA:', e.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
