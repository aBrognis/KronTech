function _getContainer() {
  let container = document.getElementById('kron-alerts')
  if (container) return container

  if (!document.getElementById('kron-alerts-style')) {
    const style = document.createElement('style')
    style.id = 'kron-alerts-style'
    style.textContent = `
      #kron-alerts {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
        align-items: center;
      }
      .kron-toast {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px 22px;
        border-radius: 16px;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        min-width: 300px;
        max-width: 460px;
        text-align: left;
        box-shadow: 0 12px 48px rgba(0,0,0,.55), 0 2px 8px rgba(0,0,0,.25);
        animation: kron-in .22s cubic-bezier(.34,1.56,.64,1);
        pointer-events: all;
        cursor: pointer;
        line-height: 1.45;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,.15);
      }
      .kron-toast-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: rgba(255,255,255,.18);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 17px;
      }
      .kron-toast-body { display: flex; flex-direction: column; gap: 2px; flex: 1; }
      .kron-toast-title { font-size: 13px; font-weight: 800; letter-spacing: -.2px; }
      .kron-toast-msg   { font-size: 12.5px; font-weight: 500; opacity: .92; }
      .kron-toast.sucesso { background: linear-gradient(135deg, #16a34a, #15803d); }
      .kron-toast.erro    { background: linear-gradient(135deg, #dc2626, #b91c1c); }
      .kron-toast.aviso   { background: linear-gradient(135deg, #d97706, #b45309); }
      .kron-toast.info    { background: linear-gradient(135deg, #FF6B2B, #E5501A); }
      .kron-toast.saindo  { animation: kron-out .25s ease forwards; }
      @keyframes kron-in  {
        from { opacity: 0; transform: scale(.85) translateY(-10px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes kron-out {
        from { opacity: 1; transform: scale(1); }
        to   { opacity: 0; transform: scale(.88) translateY(-6px); }
      }
    `
    document.head.appendChild(style)
  }

  container = document.createElement('div')
  container.id = 'kron-alerts'
  document.body.appendChild(container)
  return container
}

const TOAST_ICONS = {
  sucesso: '✓',
  erro:    '✕',
  aviso:   '⚠',
  info:    'ℹ',
}

const TOAST_TITLES = {
  sucesso: 'Sucesso',
  erro:    'Erro',
  aviso:   'Atenção',
  info:    'Informação',
}

function _removerToast(toast) {
  if (!toast.parentNode) return
  toast.classList.add('saindo')
  setTimeout(() => toast.parentNode?.removeChild(toast), 280)
}

export function mostrarAlerta(mensagem, tipo = 'info') {
  try {
    const container = _getContainer()
    const toast = document.createElement('div')
    toast.className = `kron-toast ${tipo}`

    const icon = document.createElement('div')
    icon.className = 'kron-toast-icon'
    icon.textContent = TOAST_ICONS[tipo] || 'ℹ'

    const body = document.createElement('div')
    body.className = 'kron-toast-body'

    const title = document.createElement('div')
    title.className = 'kron-toast-title'
    title.textContent = TOAST_TITLES[tipo] || 'KronTech'

    const msg = document.createElement('div')
    msg.className = 'kron-toast-msg'
    msg.textContent = mensagem

    body.appendChild(title)
    body.appendChild(msg)
    toast.appendChild(icon)
    toast.appendChild(body)
    toast.onclick = () => _removerToast(toast)

    container.appendChild(toast)
    setTimeout(() => _removerToast(toast), 3800)
  } catch (err) {
    console.error('mostrarAlerta:', err)
  }
}

export function confirmar(mensagem) {
  return window.confirm(mensagem)
}

export function mostrarCarregando(ativo) {
  const existente = document.getElementById('kron-loading')
  if (ativo) {
    if (existente) return
    if (!document.getElementById('kron-loading-style')) {
      const style = document.createElement('style')
      style.id = 'kron-loading-style'
      style.textContent = `
        #kron-loading { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:9998; display:flex; align-items:center; justify-content:center; }
        .kron-spinner { width:38px; height:38px; border:3px solid rgba(255,107,43,.25); border-top-color:#FF6B2B; border-radius:50%; animation:kron-spin .65s linear infinite; }
        @keyframes kron-spin { to { transform:rotate(360deg); } }
      `
      document.head.appendChild(style)
    }
    const overlay = document.createElement('div')
    overlay.id = 'kron-loading'
    overlay.innerHTML = '<div class="kron-spinner"></div>'
    document.body.appendChild(overlay)
  } else {
    existente?.parentNode?.removeChild(existente)
  }
}

export function desabilitarBotao(idBotao) {
  const btn = document.getElementById(idBotao)
  if (btn) { btn.disabled = true; btn.style.opacity = '.5'; btn.style.cursor = 'not-allowed' }
}

export function habilitarBotao(idBotao) {
  const btn = document.getElementById(idBotao)
  if (btn) { btn.disabled = false; btn.style.opacity = ''; btn.style.cursor = '' }
}

export function limparFormulario(idFormulario) {
  try {
    const form = document.getElementById(idFormulario)
    if (!form) return
    form.querySelectorAll('input, textarea, select').forEach(el => {
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = false
      else el.value = ''
    })
  } catch (err) {
    console.error('limparFormulario:', err)
  }
}

export function preencherCampo(nomeCampo, valor) {
  try {
    const el = document.querySelector(`[name="${nomeCampo}"]`) ?? document.getElementById(nomeCampo)
    if (el) el.value = valor
  } catch (err) {
    console.error('preencherCampo:', err)
  }
}

export function lerCampo(nomeCampo) {
  try {
    const el = document.querySelector(`[name="${nomeCampo}"]`) ?? document.getElementById(nomeCampo)
    return el ? el.value : ''
  } catch { return '' }
}
