import { BrowserWindow, dialog } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { extname, join } from 'path'
import {
  gerarConteudo,
  confirmarDocumento,
  salvarRevisao,
  mudarStatus,
  mudarStatusLote,
  listarTipos,
  listarDocumentos,
  obterDocumento,
  excluirDocumento,
  salvarCaminhoPdf,
  listarHistoricoDocumento,
} from '../services/documentoGeradoService'
import { gerarPdfDocumento } from '../services/documentoPdfService'
import { pastaExportacaoDocumento, resolverBaseExportacao } from '../services/exportPaths'
import { getConfig, resolverBaseAnexos } from '../config'

const MEDIA_TYPE_POR_EXT = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp',
}

export function registerDocumentoGeradoHandlers({ ipcMain, wrap }) {

  ipcMain.handle('documentoGerado:listarTipos', wrap(() => listarTipos()))
  ipcMain.handle('documentoGerado:listar', wrap((_, filtros) => listarDocumentos(filtros)))
  ipcMain.handle('documentoGerado:obter', wrap((_, id) => obterDocumento(id)))
  ipcMain.handle('documentoGerado:excluir', wrap((_, id) => excluirDocumento(id)))
  ipcMain.handle('documentoGerado:confirmar', wrap((_, dados) => confirmarDocumento(dados)))
  ipcMain.handle('documentoGerado:salvarRevisao', wrap((_, id, dados) => salvarRevisao(id, dados)))
  ipcMain.handle('documentoGerado:listarHistorico', wrap((_, id) => listarHistoricoDocumento(id)))
  ipcMain.handle('documentoGerado:mudarStatus', wrap((_, id, status) => mudarStatus(id, status)))
  ipcMain.handle('documentoGerado:mudarStatusLote', wrap((_, { ids, status }) => mudarStatusLote(ids, status)))

  // Gera o PDF de cada documento num temp e devolve a lista de anexos pro
  // e-mail. `origem: 'novo'` = arquivo temporario, pode ser movido pro
  // e-mail (nao e um arquivo definitivo).
  ipcMain.handle('documentoGerado:anexosParaEmail', wrap(async (_, { ids }) => {
    if (!Array.isArray(ids) || !ids.length) return { anexos: [] }
    const cfg = getConfig()
    const tempBase = cfg?.Caminhos?.temp || join(process.env.TEMP || process.env.TMP || '.', 'krontech')
    const tempDir = join(tempBase, 'email-documentos')
    const anexos = []
    for (const id of ids) {
      try {
        const { bytes, nome } = await gerarPdfDocumento(id)
        const { mkdirSync } = await import('fs')
        if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true })
        const dest = join(tempDir, nome)
        writeFileSync(dest, bytes)
        anexos.push({ nome, caminho: dest, origem: 'novo' })
      } catch (err) {
        console.warn(`[documentoGerado] anexosParaEmail #${id}:`, err.message)
      }
    }
    return { anexos }
  }))

  // Imagens do documento: podem ser SO referência (ajudam a IA, não saem no
  // PDF) ou "sai no documento" (aparecem no PDF, logo após a Introdução,
  // com legenda gerada pela IA). O renderer manda base64 (arquivo escolhido
  // OU print colado); a persistência em disco acontece no Gravar (ver
  // documentoGerado:persistirImagens).
  ipcMain.handle('documentoGerado:selecionarImagens', wrap(async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Selecionar imagens',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }],
    })
    if (canceled || !filePaths.length) return []
    return filePaths.map(caminho => {
      const mediaType = MEDIA_TYPE_POR_EXT[extname(caminho).toLowerCase()] || 'image/png'
      const base64 = readFileSync(caminho).toString('base64')
      return { nome: caminho.split(/[\\/]/).pop(), mediaType, base64 }
    })
  }))

  // Persiste as imagens do documento em disco (chamado no Gravar). Recebe a
  // lista da tela — itens NOVOS trazem base64; itens JA salvos trazem
  // `arquivo`. Retorna a lista canonica pra gravar no jsonb
  // documento_gerado_001.imagens: [{ id, arquivo, mime, legenda, noPdf }].
  ipcMain.handle('documentoGerado:persistirImagens', wrap(async (_, { documentoId, imagens = [] }) => {
    const base = resolverBaseAnexos('arquivosDocumentos')
    const pasta = join(base, 'documentos', String(documentoId))
    const { mkdirSync } = await import('fs')
    if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true })

    const canonicas = []
    const usados = new Set()
    for (const img of imagens) {
      const id = img.id || `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      let arquivo = img.arquivo || null
      if (!arquivo && img.base64) {
        const ext = (img.mime || 'image/png').split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'png'
        arquivo = join(pasta, `${id}.${ext}`)
        writeFileSync(arquivo, Buffer.from(img.base64, 'base64'))
      }
      if (!arquivo) continue
      usados.add(arquivo)
      canonicas.push({
        id,
        arquivo,
        mime: img.mime || MEDIA_TYPE_POR_EXT[extname(arquivo).toLowerCase()] || 'image/png',
        legenda: img.legenda || '',
        noPdf: !!img.noPdf,
      })
    }
    // Limpa arquivos orfaos (imagens removidas na tela).
    try {
      const { readdirSync, rmSync } = await import('fs')
      for (const f of readdirSync(pasta)) {
        const full = join(pasta, f)
        if (!usados.has(full)) rmSync(full, { force: true })
      }
    } catch { /* melhor esforco */ }

    return canonicas
  }))

  // Sem wrap() — precisa do `win` pra emitir progresso via evento, mesmo
  // padrão de lancarVersao:executar (chamada à IA pode levar alguns
  // segundos, a UI mostra etapas em vez de loading mudo).
  ipcMain.handle('documentoGerado:gerar', async (e, dados) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const send = (data) => { try { win.webContents.send('documentoGerado:progresso', data) } catch {} }

    try {
      const resultado = await gerarConteudo({ ...dados, onProgresso: send })
      return { ok: true, data: resultado }
    } catch (err) {
      return { ok: false, erro: err.message }
    }
  })

  // Exporta o PDF de um documento já gravado. Igual documentoGerado:gerar,
  // sem wrap() — o motor de PDF (printToPDF + pdf-lib) pode levar alguns
  // segundos, a UI mostra etapas em vez de loading mudo. Nunca mexe em
  // status: só grava pdf_caminho.
  ipcMain.handle('documentoGerado:exportarPdf', async (e, id) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const send = (data) => { try { win.webContents.send('documentoGerado:progressoPdf', data) } catch {} }

    try {
      const { documento, bytes, nome } = await gerarPdfDocumento(id, send)

      const pastaAuto = pastaExportacaoDocumento(documento.cliente_nome, documento.tipo_codigo === 'analise_aderencia' ? 'Análise de Aderência' : 'Ata de Treinamento')
      let filePath
      if (pastaAuto) {
        filePath = join(pastaAuto, nome)
        writeFileSync(filePath, bytes)
      } else {
        const { canceled, filePath: escolhido } = await dialog.showSaveDialog(win, {
          title: 'Exportar documento',
          defaultPath: nome,
          filters: [{ name: 'PDF', extensions: ['pdf'] }],
        })
        if (canceled || !escolhido) return { ok: false, cancelado: true }
        filePath = escolhido
        writeFileSync(filePath, bytes)
      }

      await salvarCaminhoPdf(id, filePath)
      return { ok: true, path: filePath }
    } catch (err) {
      return { ok: false, erro: err.message }
    }
  })

  // Exporta vários documentos de uma vez, um PDF por registro — mesma
  // organização automática <exportações>/<cliente>/<tipo>/ de sempre. Se a
  // pasta de exportações não estiver configurada, pede uma vez só (não um
  // diálogo por arquivo) e salva todos ali direto, sem subpastas.
  ipcMain.handle('documentoGerado:exportarPdfLote', async (e, ids) => {
    if (!Array.isArray(ids) || !ids.length) return { ok: false, erro: 'Nenhum registro para exportar.' }
    const cfg = getConfig()
    const temPastaAuto = !!resolverBaseExportacao('exportacoesDocumentos')

    let pastaFallback = null
    if (!temPastaAuto) {
      const win = BrowserWindow.fromWebContents(e.sender)
      const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        title: 'Selecionar pasta para exportar os documentos',
        properties: ['openDirectory', 'createDirectory'],
      })
      if (canceled || !filePaths.length) return { ok: false, cancelado: true }
      pastaFallback = filePaths[0]
    }

    let sucesso = 0
    const falhas = []
    for (const id of ids) {
      try {
        const { documento, bytes, nome } = await gerarPdfDocumento(id)
        const pasta = temPastaAuto
          ? pastaExportacaoDocumento(documento.cliente_nome, documento.tipo_codigo === 'analise_aderencia' ? 'Análise de Aderência' : 'Ata de Treinamento')
          : pastaFallback
        const filePath = join(pasta, nome)
        writeFileSync(filePath, bytes)
        await salvarCaminhoPdf(id, filePath)
        sucesso++
      } catch (err) {
        falhas.push(`#${id}: ${err.message}`)
      }
    }
    return { ok: true, sucesso, total: ids.length, falhas }
  })
}
