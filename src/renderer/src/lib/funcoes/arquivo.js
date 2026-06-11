import { mostrarAlerta } from './ui.js'

export async function copiarArquivo(caminhoOrigem, nomeArquivo) {
  try {
    const res = await window.api.arquivos.copiarLocal(caminhoOrigem, nomeArquivo)
    if (!res.ok) throw new Error(res.erro)
    mostrarAlerta('Arquivo copiado com sucesso', 'sucesso')
    return res.destino
  } catch (err) {
    mostrarAlerta(err.message || 'Erro ao copiar arquivo', 'erro')
    return null
  }
}

export function baixarArquivo(url, nomeArquivo = 'download') {
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = nomeArquivo
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    mostrarAlerta(`Download iniciado: ${nomeArquivo}`, 'sucesso')
  } catch (err) {
    mostrarAlerta(err.message || 'Erro ao iniciar download', 'erro')
  }
}

export function exportarCSV(dados, nomeArquivo = 'exportacao.csv') {
  try {
    if (!Array.isArray(dados) || !dados.length) throw new Error('Nenhum dado para exportar')
    const cols = Object.keys(dados[0])
    const header = cols.join(';')
    const linhas = dados.map(row =>
      cols.map(c => {
        const v = row[c] ?? ''
        const s = String(v).replace(/"/g, '""')
        return s.includes(';') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
      }).join(';')
    )
    // BOM UTF-8 para o Excel abrir corretamente em pt-BR
    const csv = '﻿' + [header, ...linhas].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const nome = nomeArquivo.endsWith('.csv') ? nomeArquivo : nomeArquivo + '.csv'
    baixarArquivo(url, nome)
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  } catch (err) {
    mostrarAlerta(err.message || 'Erro ao exportar CSV', 'erro')
  }
}

export function exportarPDF(idElemento, nomeArquivo = 'exportacao') {
  try {
    const el = document.getElementById(idElemento)
    if (!el) throw new Error(`Elemento #${idElemento} não encontrado`)

    const styleId = 'kron-print-style'
    let style = document.getElementById(styleId)
    if (!style) {
      style = document.createElement('style')
      style.id = styleId
      document.head.appendChild(style)
    }

    // Oculta tudo exceto o elemento alvo durante a impressão
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        #${idElemento}, #${idElemento} * { visibility: visible !important; }
        #${idElemento} { position: fixed !important; top: 0; left: 0; width: 100%; }
      }
    `

    const tituloOriginal = document.title
    document.title = nomeArquivo
    window.print()
    document.title = tituloOriginal
    style.textContent = ''
    mostrarAlerta('Caixa de impressão/PDF aberta', 'info')
  } catch (err) {
    mostrarAlerta(err.message || 'Erro ao exportar PDF', 'erro')
  }
}
