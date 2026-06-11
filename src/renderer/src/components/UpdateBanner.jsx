import { useState, useEffect } from 'react'
import { Download, RefreshCw, ArrowDown, X } from 'lucide-react'

export default function UpdateBanner() {
  const [status, setStatus]       = useState(null)
  const [info, setInfo]           = useState(null)
  const [progress, setProgress]   = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Busca estado já existente (evento pode ter disparado antes do renderer montar)
    window.api.update.getLastState?.().then(({ event, data }) => {
      if (!event || event === 'checking' || event === 'not-available') return
      applyEvent(event, data)
    })

    const unsub = window.api.update.onStatus((event, data) => applyEvent(event, data))
    return unsub
  }, [])

  function applyEvent(event, data) {
    if (event === 'available')     { setInfo(data); setStatus('available'); setDismissed(false) }
    if (event === 'progress')      { setProgress(Math.round(data?.percent ?? 0)); setStatus('downloading') }
    if (event === 'downloaded')    { setInfo(data); setStatus('ready') }
    if (event === 'error')         { setStatus('error') }
  }

  function handleAtualizar() {
    setStatus('downloading')
    window.api.update.download().catch(() => {})
  }

  if (!status || dismissed) return null

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
      background: 'var(--s2)', border: '1px solid var(--bd2)',
      borderRadius: 10, padding: '12px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,.25)',
      display: 'flex', alignItems: 'center', gap: 12,
      minWidth: 300, maxWidth: 380,
    }}>
      <div style={{ color: status === 'error' ? 'var(--red)' : 'var(--or)', flexShrink: 0 }}>
        {status === 'available'   && <ArrowDown size={18} />}
        {status === 'downloading' && <Download size={18} />}
        {status === 'ready'       && <RefreshCw size={18} />}
        {status === 'error'       && <X size={18} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {status === 'available' && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', marginBottom: 2 }}>
              Nova versão disponível — {info?.version}
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)' }}>Clique em Atualizar para baixar</div>
          </>
        )}
        {status === 'downloading' && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>
              Baixando atualização... {progress}%
            </div>
            <div style={{ height: 4, background: 'var(--bd)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--or)', borderRadius: 2, transition: 'width .3s' }} />
            </div>
          </>
        )}
        {status === 'ready' && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', marginBottom: 2 }}>
              Atualização pronta — v{info?.version}
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)' }}>Reinicie para aplicar</div>
          </>
        )}
        {status === 'error' && (
          <div style={{ fontSize: 12, color: 'var(--red)' }}>Erro ao verificar atualização</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {status === 'available' && (
          <button
            className="btn btn-primary"
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={handleAtualizar}
          >
            Atualizar
          </button>
        )}
        {status === 'ready' && (
          <button
            className="btn btn-primary"
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => window.api.update.install()}
          >
            Reiniciar
          </button>
        )}
        {(status === 'available' || status === 'error') && (
          <button
            style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', padding: '2px 4px', display: 'flex' }}
            onClick={() => setDismissed(true)}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
