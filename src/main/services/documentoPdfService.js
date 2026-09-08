import { BrowserWindow } from 'electron'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { readFileSync, existsSync } from 'fs'
import { extname } from 'path'
import { obterDocumento } from './documentoGeradoService'
import { getConfig } from '../config'
import { montarHtml as montarHtmlAnaliseAderencia } from './documentoTemplates/analiseAderencia'
import { montarHtml as montarHtmlAtaTreinamento } from './documentoTemplates/ataTreinamento'

const TEMPLATES_POR_LAYOUT = {
  analise_aderencia: montarHtmlAnaliseAderencia,
  ata_treinamento: montarHtmlAtaTreinamento,
}

// Margens ABNT (NBR 14724): 3cm esquerda/topo, 2cm direita/base (mais
// 0.5cm extra no topo pra folga do carimbo de cabeçalho institucional).
// printToPDF roda com marginType:'none' (evita ambiguidade de unidade de
// margins.custom entre versões do Electron/Chromium) — as margens reais
// são aplicadas via CSS @page em htmlBase.js, que o Chromium REPETE em
// toda página impressa.
const CM_TO_PT = 72 / 2.54 // conversão cm -> pontos PDF, usada pra posicionar o carimbo do pdf-lib

async function carregarLogoPdfImage(pdfDoc, logoPath) {
  if (!logoPath || !existsSync(logoPath)) return null
  const ext = extname(logoPath).toLowerCase()
  const bytes = readFileSync(logoPath)
  if (ext === '.png') return pdfDoc.embedPng(bytes)
  if (ext === '.jpg' || ext === '.jpeg') return pdfDoc.embedJpg(bytes)
  return null
}

async function gerarBufferBase(html) {
  const win = new BrowserWindow({ show: false, webPreferences: { offscreen: true } })
  try {
    await win.loadURL(`data:text/html;charset=utf-8;base64,${Buffer.from(html).toString('base64')}`)
    const buffer = await win.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: false,
      margins: { marginType: 'none' },
    })
    return buffer
  } finally {
    win.destroy()
  }
}

// Carimba cabeçalho institucional (logo pequeno + nome/CNPJ/IE,
// centralizado) e rodapé (endereço/telefone/site + numeração de página)
// em TODA página do PDF já paginado, incluindo a capa — mesmo padrão do
// modelo real (Sisplan): capa e páginas de conteúdo levam a mesma faixa de
// cabeçalho/rodapé institucional. O printToPDF do Chromium não repete
// HTML de cabeçalho/rodapé por página (@page margin-boxes e position:fixed
// não se repetem em impressão headless), então isso é feito depois, via
// pdf-lib, sobre a margem reservada pelo @page.margin de htmlBase.js.
async function carimbarCabecalhoRodape(bufferBase, empresa) {
  const pdfDoc = await PDFDocument.load(bufferBase)
  const fonteNormal = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const fonteNegrito = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  const logoImg = await carregarLogoPdfImage(pdfDoc, empresa.logoPath)
  const paginas = pdfDoc.getPages()
  const total = paginas.length
  const cor = rgb(0.15, 0.15, 0.15)
  const corClara = rgb(0.4, 0.4, 0.4)

  const linhaRodape = [empresa.empresaEndereco, empresa.empresaTelefone && `Fone: ${empresa.empresaTelefone}`, empresa.empresaSite]
    .filter(Boolean).join('   |   ')

  paginas.forEach((pagina, idx) => {
    const { width, height } = pagina.getSize()
    const margemDireita = width - 2 * CM_TO_PT

    if (logoImg) {
      const alturaLogo = 1.1 * CM_TO_PT
      const escala = alturaLogo / logoImg.height
      const larguraLogo = logoImg.width * escala

      const nomeTexto = empresa.empresaNome || ''
      const linhaDoc = [empresa.empresaCnpj && `CNPJ: ${empresa.empresaCnpj}`, empresa.empresaIe && `IE: ${empresa.empresaIe}`].filter(Boolean).join('   ')
      const larguraTexto = Math.max(
        nomeTexto ? fonteNegrito.widthOfTextAtSize(nomeTexto, 8.5) : 0,
        linhaDoc ? fonteNormal.widthOfTextAtSize(linhaDoc, 8) : 0,
      )
      const espacamento = (nomeTexto || linhaDoc) ? 10 : 0
      const larguraBloco = larguraLogo + espacamento + larguraTexto
      const xInicial = (width - larguraBloco) / 2

      pagina.drawImage(logoImg, { x: xInicial, y: height - 1.7 * CM_TO_PT, width: larguraLogo, height: alturaLogo })

      const xTexto = xInicial + larguraLogo + espacamento
      if (nomeTexto) {
        pagina.drawText(nomeTexto, { x: xTexto, y: height - 1.15 * CM_TO_PT, size: 8.5, font: fonteNegrito, color: cor })
      }
      if (linhaDoc) {
        pagina.drawText(linhaDoc, { x: xTexto, y: height - 1.5 * CM_TO_PT, size: 8, font: fonteNormal, color: corClara })
      }
    }

    if (linhaRodape) {
      const tamanho = 7.5
      const largura = fonteNormal.widthOfTextAtSize(linhaRodape, tamanho)
      pagina.drawText(linhaRodape, { x: (width - largura) / 2, y: 1.6 * CM_TO_PT, size: tamanho, font: fonteNormal, color: corClara })
    }

    const textoPagina = `Página ${idx + 1} de ${total}`
    const larguraPagina = fonteNormal.widthOfTextAtSize(textoPagina, 8)
    pagina.drawText(textoPagina, { x: margemDireita - larguraPagina, y: 1.2 * CM_TO_PT, size: 8, font: fonteNormal, color: corClara })
  })

  return pdfDoc.save()
}

function sanitizarNomeArquivo(nome) {
  return String(nome || '').replace(/[\\/:*?"<>|]/g, '').trim()
}

export function nomeArquivoDocumento(documento) {
  return `${sanitizarNomeArquivo(documento.codigo)} - ${sanitizarNomeArquivo(documento.titulo)}.pdf`
}

// Gera o PDF final (bytes) de um documento já gravado. Não grava nada em
// disco nem no banco — quem chama decide onde salvar e se atualiza
// pdf_caminho (o botão de exportar nunca mexe em status).
export async function gerarPdfDocumento(documentoId, onProgresso) {
  const emitir = (fase) => onProgresso?.({ fase })

  emitir('carregando')
  const documento = await obterDocumento(documentoId)
  if (!documento) throw new Error('Documento não encontrado.')

  const montarHtml = TEMPLATES_POR_LAYOUT[documento.layout_renderer]
  if (!montarHtml) throw new Error(`Nenhum template de PDF definido para o layout "${documento.layout_renderer}".`)

  const empresa = getConfig().Documentos || {}

  emitir('renderizando')
  const html = montarHtml(documento)
  const bufferBase = await gerarBufferBase(html)

  emitir('finalizando')
  const bytes = await carimbarCabecalhoRodape(bufferBase, empresa)

  emitir('pronto')
  return { documento, bytes: Buffer.from(bytes), nome: nomeArquivoDocumento(documento) }
}
