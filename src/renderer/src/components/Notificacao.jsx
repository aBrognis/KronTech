import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// Substitui window.alert()/window.confirm() por componentes do próprio
// KronTech — o app nunca deve mostrar o popup nativo do Windows. API
// imperativa (notificar.sucesso(...), notificar.confirmar(...)) para poder
// trocar 1:1 os alert()/confirm() existentes sem reescrever cada chamador.

let toasts = []
let toastListeners = []
let toastId = 0

function emitToasts() { toastListeners.forEach(l => l()) }

function pushToast(tipo, mensagem) {
  const id = ++toastId
  toasts = [...toasts, { id, tipo, mensagem }]
  emitToasts()
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id)
    emitToasts()
  }, tipo === 'erro' ? 6000 : 4000)
}

function dismissToast(id) {
  toasts = toasts.filter(t => t.id !== id)
  emitToasts()
}

let confirmState = null
let confirmListeners = []
function emitConfirm() { confirmListeners.forEach(l => l()) }

export const notificar = {
  sucesso: (mensagem) => pushToast('sucesso', mensagem),
  erro:    (mensagem) => pushToast('erro', mensagem),
  aviso:   (mensagem) => pushToast('aviso', mensagem),
  info:    (mensagem) => pushToast('info', mensagem),

  // Substitui window.confirm(): retorna uma Promise<boolean>, igual ao uso
  // já espalhado pelo código como `if (!confirm(...)) return`.
  confirmar: (mensagem, opcoes = {}) => new Promise(resolve => {
    confirmState = {
      mensagem,
      titulo: opcoes.titulo || 'Confirmar ação',
      confirmarLabel: opcoes.confirmarLabel || 'Confirmar',
      cancelarLabel: opcoes.cancelarLabel || 'Cancelar',
      perigo: opcoes.perigo ?? false,
      resolve,
    }
    emitConfirm()
  }),
}

const TOAST_META = {
  sucesso: { Icon: CheckCircle2, cor: 'var(--green)',  bg: 'rgba(16,185,129,.12)',  bd: 'rgba(16,185,129,.3)'  },
  erro:    { Icon: XCircle,      cor: 'var(--red)',    bg: 'rgba(239,68,68,.12)',   bd: 'rgba(239,68,68,.35)'  },
  aviso:   { Icon: AlertTriangle,cor: 'var(--yellow)', bg: 'rgba(234,179,8,.12)',   bd: 'rgba(234,179,8,.3)'   },
  info:    { Icon: Info,         cor: 'var(--blue)',   bg: 'rgba(59,130,246,.12)',  bd: 'rgba(59,130,246,.3)'  },
}

function ToastItem({ id, tipo, mensagem }) {
  const { Icon, cor, bg, bd } = TOAST_META[tipo] || TOAST_META.info
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 300, maxWidth: 420,
      background: 'var(--s1)', border: `1px solid ${bd}`, borderRadius: 12,
      padding: '12px 14px', boxShadow: '0 16px 40px rgba(0,0,0,.45), 0 4px 12px rgba(0,0,0,.25)',
      animation: 'toastPop .2s cubic-bezier(0.22,1,0.36,1) both',
    }}>
      <div style={{ width: 26, height: 26, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={14} color={cor} />
      </div>
      <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--t1)', lineHeight: 1.5, whiteSpace: 'pre-wrap', paddingTop: 3 }}>
        {mensagem}
      </div>
      <button onClick={() => dismissToast(id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 4, flexShrink: 0, display: 'flex', alignItems: 'center', borderRadius: 6 }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.background = 'var(--s3)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.background = 'none' }}
      >
        <X size={13} />
      </button>
    </div>
  )
}

function ToastStack() {
  const lista = useSyncExternalStore(
    cb => { toastListeners.push(cb); return () => { toastListeners = toastListeners.filter(l => l !== cb) } },
    () => toasts,
  )
  if (!lista.length) return null
  return createPortal(
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 4000, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'none' }}>
      {lista.map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem {...t} />
        </div>
      ))}
    </div>,
    document.body
  )
}

function ConfirmModal() {
  const state = useSyncExternalStore(
    cb => { confirmListeners.push(cb); return () => { confirmListeners = confirmListeners.filter(l => l !== cb) } },
    () => confirmState,
  )
  if (!state) return null

  function responder(valor) {
    state.resolve(valor)
    confirmState = null
    emitConfirm()
  }

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 5000 }} onClick={e => e.target === e.currentTarget && responder(false)}>
      <div className="modal" style={{ width: 420 }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color={state.perigo ? 'var(--red)' : 'var(--or)'} />
            {state.titulo}
          </span>
          <button className="modal-close" onClick={() => responder(false)}><X size={15} /></button>
        </div>
        <div className="modal-body">
          <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{state.mensagem}</div>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => responder(false)}>{state.cancelarLabel}</button>
          <button className={state.perigo ? 'btn btn-danger' : 'btn btn-primary'} onClick={() => responder(true)}>{state.confirmarLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Monta uma vez por janela (App.jsx e DesignerApp.jsx), cuida de toasts e
// confirmações da janela inteira via portal — não precisa de Provider/Context.
export default function NotificacaoRoot() {
  return (
    <>
      <ToastStack />
      <ConfirmModal />
    </>
  )
}
