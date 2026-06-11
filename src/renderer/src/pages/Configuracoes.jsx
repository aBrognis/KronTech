import { useState, useEffect, useRef } from 'react'
import { Palette, User, Save, RotateCcw, Pencil, Check } from 'lucide-react'

const CORES = [
  { nome: 'KronTech',  hex: '#D95218' },
  { nome: 'Âmbar',    hex: '#F59E0B' },
  { nome: 'Lima',     hex: '#84CC16' },
  { nome: 'Verde',    hex: '#10B981' },
  { nome: 'Ciano',    hex: '#06B6D4' },
  { nome: 'Azul',     hex: '#3B82F6' },
  { nome: 'Índigo',   hex: '#6366F1' },
  { nome: 'Roxo',     hex: '#8B5CF6' },
  { nome: 'Rosa',     hex: '#EC4899' },
  { nome: 'Vermelho', hex: '#EF4444' },
]

const VAZIO = {
  cor: '#D95218', nomeSistema: 'KronTech',
  nomeUsuario: 'Anderson', cargoUsuario: 'Administrador',
}

export function aplicarCorSistema(hex) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const L = (n, a) => Math.min(255, n + a)
  const D = (n, a) => Math.max(0,   n - a)
  const r2 = Math.round(r * .87), g2 = Math.round(g * .87), b2 = Math.round(b * .87)

  let el = document.getElementById('kron-color-override')
  if (!el) {
    el = document.createElement('style')
    el.id = 'kron-color-override'
    document.head.appendChild(el)
  }
  el.textContent = `
    :root, html.light {
      --or:  ${hex} !important;
      --or2: rgb(${r2},${g2},${b2}) !important;
      --or3: rgba(${r},${g},${b},.12) !important;
      --or4: rgba(${r},${g},${b},.06) !important;
    }
    .btn-primary {
      background: linear-gradient(180deg,
        rgb(${L(r,18)},${L(g,18)},${L(b,18)}) 0%,
        ${hex} 55%,
        rgb(${r2},${g2},${b2}) 100%) !important;
      box-shadow:
        0 1px 0 rgba(255,255,255,.18) inset,
        0 -1px 0 rgba(0,0,0,.12) inset,
        0 2px 6px rgba(${r},${g},${b},.4),
        0 1px 2px rgba(0,0,0,.2) !important;
    }
    .btn-primary:hover {
      background: linear-gradient(180deg,
        rgb(${L(r,28)},${L(g,28)},${L(b,28)}) 0%,
        rgb(${L(r,14)},${L(g,14)},${L(b,14)}) 55%,
        rgb(${L(r,4)},${L(g,4)},${L(b,4)}) 100%) !important;
      box-shadow:
        0 1px 0 rgba(255,255,255,.18) inset,
        0 -1px 0 rgba(0,0,0,.12) inset,
        0 0 22px rgba(${r},${g},${b},.55),
        0 4px 16px rgba(${r},${g},${b},.35),
        0 2px 4px rgba(0,0,0,.2) !important;
    }
    .btn-primary:active {
      background: linear-gradient(180deg,
        rgb(${D(r,18)},${D(g,18)},${D(b,18)}) 0%,
        rgb(${D(r,28)},${D(g,28)},${D(b,28)}) 100%) !important;
    }
    .form-input:focus,
    .form-select:focus,
    .form-textarea:focus,
    .search-input:focus {
      box-shadow: 0 0 0 3.5px rgba(${r},${g},${b},.14), var(--sh-xs) !important;
    }
    .btn-outline {
      color: var(--or) !important;
      border-color: rgba(${r},${g},${b},.3) !important;
    }
    .btn-outline:hover {
      background: rgba(${r},${g},${b},.07) !important;
      border-color: rgba(${r},${g},${b},.5) !important;
      box-shadow: 0 4px 12px rgba(${r},${g},${b},.15) !important;
    }
    .sb-av {
      box-shadow: 0 0 12px rgba(${r},${g},${b},.4) !important;
    }
    .sb::before {
      background: radial-gradient(ellipse at 50% 0%, rgba(${r},${g},${b},.1) 0%, transparent 70%) !important;
    }
    html.light .sb::before {
      background: radial-gradient(ellipse at 50% 0%, rgba(${r},${g},${b},.07) 0%, transparent 70%) !important;
    }
    .sb-logo-icon {
      filter: drop-shadow(0 0 10px rgba(${r},${g},${b},.35)) !important;
    }
    .sb-logo-icon:hover {
      filter: drop-shadow(0 0 16px rgba(${r},${g},${b},.6)) !important;
    }
    .ni.active {
      background: linear-gradient(90deg,
        rgba(${r},${g},${b},.11) 0%,
        rgba(${r},${g},${b},.03) 60%,
        transparent 100%) !important;
    }
    .ni.active::before {
      background: linear-gradient(180deg,
        rgb(${L(r,25)},${L(g,25)},${L(b,25)}),
        ${hex},
        rgb(${r2},${g2},${b2})) !important;
      box-shadow: 2px 0 10px rgba(${r},${g},${b},.5) !important;
    }
    .ni.active .ni-icon {
      filter: drop-shadow(0 0 6px rgba(${r},${g},${b},.7)) !important;
    }
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 12px rgba(${r},${g},${b},0.3); }
      50%       { box-shadow: 0 0 24px rgba(${r},${g},${b},0.5), 0 0 48px rgba(${r},${g},${b},0.15); }
    }
  `
}

export default function Configuracoes() {
  const pickerRef  = useRef(null)
  const [editando, setEditando] = useState(false)
  const [saved,    setSaved]    = useState(VAZIO)
  const [form,     setForm]     = useState(VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [salvo,    setSalvo]    = useState(false)

  useEffect(() => {
    window.api.config.get().then(cfg => {
      const p = cfg?.Personalizacao || {}
      const corSalva = p.cor_primaria === '#FF6B2B' ? '#D95218' : (p.cor_primaria || VAZIO.cor)
      const loaded = {
        cor:          corSalva,
        nomeSistema:  p.nome_sistema || VAZIO.nomeSistema,
        nomeUsuario:  p.nome_usuario || VAZIO.nomeUsuario,
        cargoUsuario: p.cargo_usuario || VAZIO.cargoUsuario,
      }
      setSaved(loaded)
      setForm(loaded)
    }).catch(() => {})
  }, [])

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleCor(hex) {
    set('cor', hex)
    aplicarCorSistema(hex)
  }

  function reverter() {
    setForm({ ...saved })
    aplicarCorSistema(saved.cor)
    setEditando(false)
  }

  async function salvar() {
    setSalvando(true)
    try {
      await window.api.config.setSection('Personalizacao', {
        cor_primaria:  form.cor,
        nome_sistema:  form.nomeSistema,
        nome_usuario:  form.nomeUsuario,
        cargo_usuario: form.cargoUsuario,
      })
      setSaved({ ...form })
      setEditando(false)
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2500)
      window.dispatchEvent(new CustomEvent('krontech:config-changed', {
        detail: { cor: form.cor, nomeSistema: form.nomeSistema, nomeUsuario: form.nomeUsuario, cargoUsuario: form.cargoUsuario }
      }))
    } catch (e) {
      alert('Erro ao salvar: ' + e.message)
    } finally {
      setSalvando(false)
    }
  }

  const nomeCorAtual = CORES.find(c => c.hex.toLowerCase() === form.cor.toLowerCase())?.nome

  return (
    <div style={{ maxWidth: 660, display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Aparência ──────────────────────────────────────── */}
      <SecCard icon={<Palette size={14} />} title="Aparência">
        <div className="form-group">
          <label className="form-label">Cor principal</label>

          {!editando ? (
            /* View mode */
            <div className="form-input" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              height: 'auto', padding: '9px 12px', cursor: 'default',
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                background: form.cor,
                boxShadow: `0 0 0 1px rgba(0,0,0,.15)`,
              }} />
              <span style={{ fontSize: 12.5, color: 'var(--t1)', fontWeight: 500 }}>
                {nomeCorAtual ?? 'Personalizada'}
              </span>
              <code style={{
                fontSize: 11, color: 'var(--t3)', fontFamily: 'monospace',
                letterSpacing: 1, marginLeft: 2,
              }}>
                {form.cor.toUpperCase()}
              </code>
            </div>
          ) : (
            /* Edit mode */
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                background: 'var(--s2)', border: '1.5px solid var(--bd)',
                borderRadius: 10, padding: '9px 12px',
                boxShadow: 'var(--sh-xs)',
              }}>
                {/* Trigger */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button
                    onClick={() => pickerRef.current?.click()}
                    title="Escolher cor personalizada"
                    style={{
                      width: 28, height: 28, borderRadius: 7, border: 'none',
                      background: form.cor, cursor: 'pointer',
                      boxShadow: `0 0 0 2px var(--s2), 0 0 0 3.5px ${form.cor}`,
                      flexShrink: 0,
                    }}
                  />
                  <input
                    ref={pickerRef}
                    type="color"
                    value={form.cor}
                    onChange={e => handleCor(e.target.value)}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                    tabIndex={-1}
                  />
                </div>

                <div style={{ width: 1, height: 18, background: 'var(--bd)' }} />

                {/* Swatches */}
                {CORES.map(s => {
                  const sel = form.cor.toLowerCase() === s.hex.toLowerCase()
                  return (
                    <button
                      key={s.hex}
                      title={s.nome}
                      onClick={() => handleCor(s.hex)}
                      style={{
                        width: 20, height: 20, borderRadius: 5,
                        background: s.hex, border: 'none', cursor: 'pointer',
                        outline: sel ? `2px solid ${s.hex}` : '2px solid transparent',
                        outlineOffset: 2,
                        transform: sel ? 'scale(1.3)' : 'scale(1)',
                        transition: 'transform 0.12s',
                        flexShrink: 0,
                      }}
                    />
                  )
                })}

                <div style={{ width: 1, height: 18, background: 'var(--bd)', marginLeft: 'auto' }} />

                <code style={{
                  fontSize: 11, color: 'var(--t3)', fontFamily: 'monospace',
                  letterSpacing: 1, flexShrink: 0,
                }}>
                  {form.cor.toUpperCase()}
                </code>
              </div>

              {/* Preview */}
              <div style={{
                marginTop: 8,
                display: 'flex', gap: 8, alignItems: 'center',
                padding: '8px 12px', borderRadius: 8,
                background: 'var(--s1)', border: '1px solid var(--bd)',
              }}>
                <span style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1, marginRight: 2 }}>
                  Preview
                </span>
                <button style={{
                  padding: '4px 12px', borderRadius: 6, border: 'none',
                  background: form.cor, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'default',
                }}>Botão</button>
                <button style={{
                  padding: '4px 12px', borderRadius: 6, border: `1.5px solid ${form.cor}`,
                  background: 'transparent', color: form.cor, fontSize: 11, cursor: 'default',
                }}>Outline</button>
                <span style={{
                  padding: '2px 8px', borderRadius: 20,
                  background: `${form.cor}20`, color: form.cor, fontSize: 10, fontWeight: 600,
                }}>Badge</span>
              </div>
            </div>
          )}
        </div>
      </SecCard>

      {/* ── Identidade ─────────────────────────────────────── */}
      <SecCard icon={<User size={14} />} title="Identidade">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          <Campo label="Nome do sistema" value={form.nomeSistema}      onChange={v => set('nomeSistema', v)}      placeholder="KronTech"      disabled={!editando} />
          <Campo label="Seu nome"        value={form.nomeUsuario}      onChange={v => set('nomeUsuario', v)}      placeholder="Anderson"      disabled={!editando} />
          <Campo label="Cargo / função"  value={form.cargoUsuario}     onChange={v => set('cargoUsuario', v)}     placeholder="Administrador" disabled={!editando} />
        </div>
      </SecCard>

      {/* ── Ações ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 2 }}>
        {!editando ? (
          <button
            className="btn btn-outline"
            onClick={() => setEditando(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 16px', height: 34 }}
          >
            <Pencil size={13} strokeWidth={2} />
            Alterar
          </button>
        ) : (
          <>
            <button
              className="btn btn-ghost"
              onClick={reverter}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 16px', height: 34 }}
            >
              <RotateCcw size={13} strokeWidth={2} />
              Reverter mudanças
            </button>
            <button
              className="btn btn-primary"
              onClick={salvar}
              disabled={salvando}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 20px', height: 34 }}
            >
              {salvo
                ? <><Check size={13} strokeWidth={2.5} /> Salvo!</>
                : <><Save  size={13} strokeWidth={2}   /> {salvando ? 'Salvando…' : 'Salvar'}</>
              }
            </button>
          </>
        )}
      </div>

    </div>
  )
}

function SecCard({ icon, title, children }) {
  return (
    <div style={{
      background: 'var(--s2)', border: '1px solid var(--bd)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '11px 16px', borderBottom: '1px solid var(--bd)',
      }}>
        <span style={{ color: 'var(--or)', display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', letterSpacing: .5, textTransform: 'uppercase' }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '14px 16px' }}>
        {children}
      </div>
    </div>
  )
}

function Campo({ label, value, onChange, placeholder, disabled }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  )
}
