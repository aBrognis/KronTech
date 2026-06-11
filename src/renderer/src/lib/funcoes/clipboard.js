import { mostrarAlerta } from './ui.js'

// Usa o clipboard nativo do Electron via IPC (único método que funciona com
// contextIsolation: true). Fallback para execCommand se rodar fora do Electron.
async function _escreverClipboard(texto) {
  if (window.api?.clipboard?.write) {
    return window.api.clipboard.write(String(texto))
  }
  // fallback DOM — funciona na maioria dos contextos web
  const el = document.createElement('textarea')
  el.value = String(texto)
  el.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none'
  document.body.appendChild(el)
  el.focus()
  el.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(el)
  if (!ok) throw new Error('execCommand falhou')
  return true
}

export async function copiarTexto(texto) {
  try {
    await _escreverClipboard(texto)
    mostrarAlerta('Copiado para a área de transferência!', 'sucesso')
    return true
  } catch (err) {
    console.error('copiarTexto:', err)
    mostrarAlerta('Não foi possível copiar', 'erro')
    return false
  }
}

export async function lerClipboard() {
  try {
    if (window.api?.clipboard?.read) return await window.api.clipboard.read()
    return await navigator.clipboard.readText()
  } catch { return '' }
}

export async function copiarElemento(idElemento) {
  try {
    const el = document.getElementById(idElemento)
    if (!el) throw new Error(`Elemento #${idElemento} não encontrado`)
    const texto = el.value ?? el.innerText ?? el.textContent ?? ''
    return copiarTexto(String(texto).trim())
  } catch (err) {
    mostrarAlerta(err.message, 'erro')
    return false
  }
}

export async function copiarCampo(nomeCampo) {
  try {
    const el =
      document.querySelector(`[name="${nomeCampo}"]`) ??
      document.querySelector(`#${nomeCampo}`)
    if (!el) throw new Error(`Campo "${nomeCampo}" não encontrado`)
    return copiarTexto(el.value ?? '')
  } catch (err) {
    mostrarAlerta(err.message, 'erro')
    return false
  }
}

export function mostrarBotaoCopiar(idElemento) {
  try {
    const el = document.getElementById(idElemento)
    if (!el) return
    const parent = el.parentNode
    if (parent.querySelector('.kron-btn-copiar')) return

    const btn = document.createElement('button')
    btn.className = 'kron-btn-copiar'
    btn.title = 'Copiar'
    btn.innerHTML = '📋'
    btn.style.cssText =
      'background:none;border:none;cursor:pointer;padding:2px 6px;font-size:13px;opacity:.55;transition:opacity .15s;flex-shrink:0'
    btn.onmouseenter = () => { btn.style.opacity = '1' }
    btn.onmouseleave = () => { btn.style.opacity = '.55' }
    btn.onclick = (e) => { e.preventDefault(); copiarElemento(idElemento) }

    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'display:inline-flex;align-items:center;gap:4px;width:100%'
    parent.insertBefore(wrapper, el)
    wrapper.appendChild(el)
    wrapper.appendChild(btn)
  } catch (err) {
    console.error('mostrarBotaoCopiar:', err)
  }
}
