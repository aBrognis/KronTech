import { useState, useEffect, useRef } from 'react'
import { ShieldCheck, RefreshCw, QrCode, Copy, Check, X } from 'lucide-react'

// base32 A-Z2-7, 32 caracteres — mesmo alfabeto usado pelo otplib no
// backend (RFC 4648). Gerado localmente (não é sensível de outro registro,
// é só aleatório) — validação de verdade acontece no main.
function gerarSecretLocal() {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const arr = new Uint32Array(32)
  crypto.getRandomValues(arr)
  return Array.from(arr, n => alfabeto[n % alfabeto.length]).join('')
}

export default function TotpField({ credencialId, value, salvo, onChange, disabled, onCopiarCodigo }) {
  const [codigo, setCodigo] = useState(null)
  const [segundosRestantes, setSegundosRestantes] = useState(0)
  const [showQr, setShowQr] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const intervalRef = useRef(null)

  const ativo = !!credencialId && !!value && !!salvo

  useEffect(() => {
    if (!ativo) { setCodigo(null); return }
    carregarCodigo()
    intervalRef.current = setInterval(() => {
      setSegundosRestantes(s => {
        if (s <= 1) { carregarCodigo(); return 30 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, credencialId])

  async function carregarCodigo() {
    const res = await window.api.cofreSenhas.totpCodigoAtual(credencialId)
    if (res.ok) { setCodigo(res.data.codigo); setSegundosRestantes(res.data.segundosRestantes) }
  }

  async function abrirQrCode() {
    setShowQr(true)
    const res = await window.api.cofreSenhas.totpQrCode(credencialId)
    if (res.ok) setQrDataUrl(res.data.dataUrl)
  }

  async function copiarCodigo() {
    if (!codigo) return
    await window.api.clipboard.write(codigo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
    onCopiarCodigo?.()
  }

  return (
    <div className="form-group">
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <ShieldCheck size={12} /> Autenticação em Duas Etapas (TOTP)
      </label>

      {!value ? (
        <div style={{ display: 'flex', gap: 4 }}>
          <input className="form-input" value={value} disabled={disabled} readOnly
            placeholder="Nenhuma chave configurada" style={{ height: 36, flex: 1, fontFamily: 'monospace' }} />
          {!disabled && (
            <button type="button" className="btn btn-ghost" onClick={() => onChange(gerarSecretLocal())}
              style={{ flexShrink: 0, padding: '0 10px', height: 36, gap: 6 }}>
              <RefreshCw size={13} /> Gerar chave
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <input className="form-input" value={value} disabled={disabled}
              onChange={e => onChange(e.target.value.toUpperCase().replace(/[^A-Z2-7]/g, ''))}
              style={{ height: 36, flex: 1, fontFamily: 'monospace', letterSpacing: 1.5 }} />
            {!disabled && (
              <button type="button" className="btn btn-ghost" onClick={() => onChange('')}
                title="Remover chave" style={{ flexShrink: 0, padding: '0 9px', height: 36 }}>
                <X size={14} />
              </button>
            )}
          </div>

          {ativo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 10 }}>
              <div style={{ position: 'relative', width: 30, height: 30, flexShrink: 0 }}>
                <svg viewBox="0 0 30 30" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="15" cy="15" r="12" fill="none" stroke="var(--s3)" strokeWidth="3" />
                  <circle cx="15" cy="15" r="12" fill="none" stroke="var(--or)" strokeWidth="3"
                    strokeDasharray={`${(segundosRestantes / 30) * 75.4} 75.4`} strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ flex: 1, fontSize: 20, fontWeight: 700, letterSpacing: 4, fontFamily: 'monospace', color: 'var(--t1)' }}>
                {codigo ? `${codigo.slice(0, 3)} ${codigo.slice(3)}` : '——— ———'}
              </div>
              <button type="button" onClick={abrirQrCode}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 6 }} title="Mostrar QR Code">
                <QrCode size={16} />
              </button>
              <button type="button" onClick={copiarCodigo} disabled={!codigo}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiado ? 'var(--green)' : 'var(--t3)', display: 'flex', padding: 6 }} title="Copiar código">
                {copiado ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Salve o registro para gerar o código e o QR Code.</div>
          )}
        </div>
      )}

      {showQr && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}
          onClick={() => setShowQr(false)}>
          <div style={{ background: 'var(--s1)', borderRadius: 14, padding: 24, boxShadow: 'var(--sh-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Escaneie com seu autenticador</div>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code TOTP" style={{ width: 220, height: 220, borderRadius: 8 }} />
            ) : (
              <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 12 }}>Gerando...</div>
            )}
            <button className="btn btn-ghost" onClick={() => setShowQr(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  )
}
