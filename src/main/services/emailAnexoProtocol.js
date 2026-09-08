// Protocolo customizado kmail:// para servir anexos de e-mail ao <iframe>
// sandboxed do leitor.
//
// Contexto: o corpo do e-mail e renderizado num <iframe srcdoc> sem
// allow-same-origin (origem opaca). Esse iframe NAO carrega file:// nem
// resolve cid:. Antes, a solucao era embutir cada imagem inline como
// data:image;base64 dentro do corpo_html -> um e-mail de assinatura com 8
// imagens virava 3 MB de HTML, e cada "Responder" multiplicava isso pela
// thread inteira (287 e-mails = 957 MB no banco).
//
// Agora: a imagem fica so em disco (email_anexo_001.caminho) e o corpo_html
// referencia `kmail://anexo/<id>`. Este protocolo le o arquivo e devolve.
// E o mesmo padrao que Thunderbird/Outlook usam (protocolo interno pra
// content de mensagem), sem inchar o banco.

import { protocol } from 'electron'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { extname, resolve, sep } from 'path'
import { queryOne } from '../db'
import { resolverBaseAnexos } from '../config'

export const KMAIL_SCHEME = 'kmail'

// Precisa rodar ANTES de app.whenReady (senao o Chromium ja fixou a lista
// de esquemas). standard+secure pra o iframe tratar como origem valida;
// stream/supportFetchAPI pra servir binario grande sem carregar tudo na RAM.
export function registrarEsquemaKmail() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: KMAIL_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        bypassCSP: true,
      },
    },
  ])
}

const MIME_POR_EXT = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml', ico: 'image/x-icon',
  pdf: 'application/pdf', txt: 'text/plain; charset=utf-8',
}

// Registra o handler. Chamar dentro de app.whenReady.
// URL suportada: kmail://anexo/<id>  (id numerico de email_anexo_001)
export function registrarHandlerKmail() {
  protocol.handle(KMAIL_SCHEME, async (req) => {
    try {
      const url = new URL(req.url)
      // host = "anexo", pathname = "/<id>"
      if (url.hostname !== 'anexo') {
        return new Response('rota desconhecida', { status: 404 })
      }
      const id = parseInt(url.pathname.replace(/^\/+/, ''), 10)
      if (!Number.isInteger(id) || id <= 0) {
        return new Response('id invalido', { status: 400 })
      }

      const row = await queryOne(
        'SELECT caminho, content_type, nome_original FROM email_anexo_001 WHERE id = $1',
        [id]
      )
      if (!row || !row.caminho) {
        return new Response('anexo nao encontrado', { status: 404 })
      }

      // Anti path-traversal: o caminho gravado tem que estar DENTRO da base
      // de anexos de e-mail configurada. Nunca serve arquivo fora dela.
      const base = resolverBaseAnexos('arquivosEmail')
      const alvo = resolve(row.caminho)
      const baseResolvida = base ? resolve(base) : null
      if (baseResolvida && !alvo.toLowerCase().startsWith((baseResolvida + sep).toLowerCase())) {
        // Tolera tambem a base generica 'arquivos' (fallback do .ini).
        const baseGenerica = resolve(resolverBaseAnexos('arquivos') || '')
        if (!baseGenerica || !alvo.toLowerCase().startsWith((baseGenerica + sep).toLowerCase())) {
          return new Response('caminho fora da base', { status: 403 })
        }
      }
      if (!existsSync(alvo)) {
        return new Response('arquivo ausente em disco', { status: 404 })
      }

      const buf = await readFile(alvo)
      const ext = extname(alvo).toLowerCase().replace('.', '')
      const mime = row.content_type || MIME_POR_EXT[ext] || 'application/octet-stream'

      return new Response(buf, {
        status: 200,
        headers: {
          'Content-Type': mime,
          'Cache-Control': 'private, max-age=86400',
          'Content-Length': String(buf.length),
        },
      })
    } catch (e) {
      console.warn('[kmail] erro ao servir anexo:', e.message)
      return new Response('erro interno', { status: 500 })
    }
  })
}
