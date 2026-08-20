import { useState } from 'react'
import { Eye, EyeOff, RefreshCw, Copy, Check, Settings2 } from 'lucide-react'

const MAXLEN = 200

const CLASSES = {
  maiuscula: { label: 'Letras maiúsculas (A-Z)', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  minuscula: { label: 'Letras minúsculas (a-z)',  chars: 'abcdefghijklmnopqrstuvwxyz' },
  numero:    { label: 'Números (0-9)',            chars: '0123456789' },
  simbolo:   { label: 'Símbolos (!@#$%)',         chars: '!@#$%&*+-=?' },
}
const AMBIGUOS = /[Il1O0]/

function gerarSenha({ tamanho, classes, evitarAmbiguos }) {
  const ativas = Object.keys(CLASSES).filter(k => classes[k])
  if (!ativas.length) return ''
  let alfabeto = ativas.map(k => CLASSES[k].chars).join('')
  if (evitarAmbiguos) alfabeto = alfabeto.replace(AMBIGUOS, '')
  if (!alfabeto) return ''
  const arr = new Uint32Array(tamanho)
  crypto.getRandomValues(arr)
  return Array.from(arr, n => alfabeto[n % alfabeto.length]).join('')
}

// Estimativa leve de força — sem depender de libs pesadas tipo zxcvbn.
// Combina comprimento + variedade de classes de caractere + penalidade por
// padrões óbvios (repetição, sequência). Suficiente pra um indicador visual,
// não é uma auditoria criptográfica de verdade. Espelhada no backend
// (src/main/handlers/cofreSenhas.js) pra gravar o nível junto com a senha.
export function calcularForcaSenha(senha) {
  if (!senha) return { score: 0, label: '', cor: 'var(--bd2)' }
  let pontos = 0
  pontos += Math.min(senha.length, 32) * 2.2 // até 32 chars — sem teto artificial pra tokens longos
  if (/[a-z]/.test(senha)) pontos += 6
  if (/[A-Z]/.test(senha)) pontos += 6
  if (/[0-9]/.test(senha)) pontos += 6
  if (/[^a-zA-Z0-9]/.test(senha)) pontos += 6 // símbolo é um extra, não um requisito pra força máxima
  if (/(.)\1{2,}/.test(senha)) pontos -= 15 // repetição tipo "aaa"
  if (/012|123|234|345|456|567|678|789|abc|bcd|cde/i.test(senha)) pontos -= 10 // sequência
  if (senha.length < 8) pontos -= 20
  pontos = Math.max(0, Math.min(100, pontos))

  if (pontos < 35)  return { score: pontos, label: 'Fraca',  cor: '#f87171' }
  if (pontos < 65)  return { score: pontos, label: 'Média',  cor: '#fbbf24' }
  if (pontos < 85)  return { score: pontos, label: 'Forte',  cor: '#4ade80' }
  return                   { score: pontos, label: 'Muito forte', cor: '#22c55e' }
}

// Campo de senha reversível: mostrar/ocultar, copiar, gerador configurável
// (comprimento + classes de caractere) e barra de força — usado tanto pelo
// campo "senha_cofre" do FormBuilder quanto pela tela nativa Cofre de Senhas.
export default function PasswordVaultField({ value, onChange, disabled, placeholder = 'Senha' }) {
  const [visivel, setVisivel]         = useState(false)
  const [copiado, setCopiado]         = useState(false)
  const [showGerador, setShowGerador] = useState(false)
  const [tamanho, setTamanho]         = useState(20)
  const [classes, setClasses]         = useState({ maiuscula: true, minuscula: true, numero: true, simbolo: true })
  const [evitarAmbiguos, setEvitarAmbiguos] = useState(false)

  const forca = calcularForcaSenha(value)

  function handleGerar() {
    const nova = gerarSenha({ tamanho, classes, evitarAmbiguos })
    if (nova) { onChange(nova); setVisivel(true) }
  }

  async function handleCopiar() {
    if (!value) return
    try {
      await window.api.clipboard.write(value)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch (e) { console.error('copiar senha:', e) }
  }

  const nenhumaClasseAtiva = !Object.values(classes).some(Boolean)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            className="form-input"
            type={visivel ? 'text' : 'password'}
            value={value}
            onChange={e => onChange(e.target.value.slice(0, MAXLEN))}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete="new-password"
            maxLength={MAXLEN}
            style={{ height: 36, width: '100%', paddingRight: 32, fontFamily: visivel ? 'monospace' : undefined, letterSpacing: visivel ? undefined : 2 }}
          />
          <button type="button" onClick={() => setVisivel(v => !v)} disabled={!value}
            style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: value ? 'pointer' : 'default', color: 'var(--t3)', display: 'flex', padding: 2, opacity: value ? 1 : .4 }}
            title={visivel ? 'Ocultar senha' : 'Mostrar senha'}>
            {visivel ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {!disabled && (
          <button type="button" className="btn btn-ghost"
            onClick={() => setShowGerador(v => !v)} title="Configurar gerador de senha"
            style={{ flexShrink: 0, padding: '0 9px', height: 36, color: showGerador ? 'var(--or)' : undefined }}>
            <Settings2 size={14} />
          </button>
        )}
        {!disabled && (
          <button type="button" className="btn btn-ghost"
            onClick={handleGerar} title="Gerar senha" style={{ flexShrink: 0, padding: '0 9px', height: 36 }}>
            <RefreshCw size={14} />
          </button>
        )}
        <button type="button" className="btn btn-ghost" disabled={!value}
          onClick={handleCopiar} title="Copiar senha" style={{ flexShrink: 0, padding: '0 9px', height: 36, color: copiado ? 'var(--green)' : undefined }}>
          {copiado ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {value && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, height: 4, background: 'var(--s3)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${forca.score}%`, background: forca.cor, borderRadius: 99, transition: 'width .2s ease, background .2s ease' }} />
          </div>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: forca.cor, flexShrink: 0, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: .3 }}>
            {forca.label}
          </span>
        </div>
      )}

      {showGerador && (
        <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .6 }}>Gerador de senha</span>
              <span style={{ fontSize: 10, color: 'var(--t3)' }}>Comprimento</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="range" min={8} max={64} value={tamanho}
                onChange={e => setTamanho(Number(e.target.value))}
                style={{ flex: 1 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', minWidth: 24, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{tamanho}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
              {Object.entries(CLASSES).map(([key, { label }]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11.5, color: 'var(--t2)' }}>
                  <input type="checkbox" checked={classes[key]}
                    onChange={e => setClasses(c => ({ ...c, [key]: e.target.checked }))} />
                  {label}
                </label>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11.5, color: 'var(--t2)' }}>
                <input type="checkbox" checked={evitarAmbiguos}
                  onChange={e => setEvitarAmbiguos(e.target.checked)} />
                Evitar caracteres ambíguos (I, l, 1, O, 0)
              </label>
            </div>
            {nenhumaClasseAtiva && (
              <div style={{ fontSize: 10.5, color: 'var(--red)' }}>Selecione ao menos um tipo de caractere.</div>
            )}
            <button type="button" className="btn btn-primary" disabled={nenhumaClasseAtiva}
              onClick={handleGerar} style={{ height: 30, fontSize: 11.5, gap: 6 }}>
              <RefreshCw size={12} /> Gerar senha
            </button>
        </div>
      )}
    </div>
  )
}
