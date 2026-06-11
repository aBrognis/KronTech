import { mostrarAlerta } from './ui.js'

function _resolverCanvas(idElemento) {
  const el = document.getElementById(idElemento)
  if (!el) throw new Error(`Elemento #${idElemento} não encontrado`)
  const canvas = el.tagName === 'CANVAS' ? el : el.querySelector('canvas')
  if (!canvas) throw new Error(`Nenhum canvas encontrado em #${idElemento}`)
  return { canvas, ctx: canvas.getContext('2d') }
}

export function iniciarCanvas(idElemento) {
  try {
    return _resolverCanvas(idElemento)
  } catch (err) {
    mostrarAlerta(err.message, 'erro')
    return null
  }
}

export function limparCanvas(idElemento) {
  try {
    const { canvas, ctx } = _resolverCanvas(idElemento)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  } catch (err) {
    mostrarAlerta(err.message, 'erro')
  }
}

export function salvarCanvas(idElemento, nomeArquivo = 'canvas.png') {
  try {
    const { canvas } = _resolverCanvas(idElemento)
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = nomeArquivo.endsWith('.png') ? nomeArquivo : nomeArquivo + '.png'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    mostrarAlerta(`Canvas salvo como ${a.download}`, 'sucesso')
  } catch (err) {
    mostrarAlerta(err.message || 'Erro ao salvar canvas', 'erro')
  }
}

export function carregarImagem(idElemento, urlImagem) {
  return new Promise((resolve, reject) => {
    try {
      const { canvas, ctx } = _resolverCanvas(idElemento)
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(img)
      }
      img.onerror = () => {
        mostrarAlerta('Erro ao carregar imagem no canvas', 'erro')
        reject(new Error('Imagem não carregada'))
      }
      img.src = urlImagem
    } catch (err) {
      mostrarAlerta(err.message, 'erro')
      reject(err)
    }
  })
}
