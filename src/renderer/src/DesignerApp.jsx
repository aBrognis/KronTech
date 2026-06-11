import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import FormBuilder from './pages/FormBuilder'
import { aplicarCorSistema } from './pages/Configuracoes'
import { useTheme } from './hooks/useTheme'
import './App.css'

const KT_ANIM_CSS = `
@keyframes kr-rR{to{transform:rotate(360deg)}}
@keyframes kr-rL{to{transform:rotate(-360deg)}}
@keyframes kr-op{0%,100%{opacity:.35}50%{opacity:1}}
`

function WinControls() {
  return (
    <div className="win-controls">
      <button className="wc-btn wc-min" onClick={() => window.api.win.minimize()} title="Minimizar">
        <svg viewBox="0 0 10 1" fill="currentColor"><rect width="10" height="1"/></svg>
      </button>
      <button className="wc-btn wc-max" onClick={() => window.api.win.maximize()} title="Maximizar">
        <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="0.6" y="0.6" width="8.8" height="8.8"/></svg>
      </button>
      <button className="wc-btn wc-close" onClick={() => window.api.win.close()} title="Fechar">
        <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3">
          <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
        </svg>
      </button>
    </div>
  )
}

function KtLogo({ size = 32, isDark = true }) {
  const accent = isDark ? '#FF6B2B' : '#E85A1A'
  const kC     = isDark ? '#FFFFFF' : '#111111'
  const dF0    = isDark ? '#2a2a2a' : '#e8e8e8'
  const dF1    = isDark ? '#0e0e0e' : '#d0d0d0'
  const r1     = isDark ? '#333'    : '#CCCCCC'
  const r3     = isDark ? '#222'    : '#DDDDDD'
  const id     = `kt-dg-${isDark ? 'd' : 'l'}`
  return (
    <svg viewBox="0 0 100 100" fill="none" overflow="visible"
      style={{ width: size, height: size, flexShrink: 0 }}>
      <defs>
        <radialGradient id={id} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor={dF0}/>
          <stop offset="100%" stopColor={dF1}/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="none" stroke={r3} strokeWidth="1" strokeDasharray="2 10"
        style={{transformOrigin:'50px 50px',animation:'kr-rR 22s linear infinite'}}/>
      <circle cx="50" cy="50" r="40" fill="none" stroke={r1} strokeWidth="1.2" strokeDasharray="4 7"
        style={{transformOrigin:'50px 50px',animation:'kr-rR 32s linear infinite'}}/>
      <circle cx="50" cy="50" r="32" fill="none" stroke={accent} strokeWidth="0.8" strokeDasharray="2 8" opacity="0.36"
        style={{transformOrigin:'50px 50px',animation:'kr-rL 46s linear infinite'}}/>
      <circle cx="50" cy="50" r="24" fill={`url(#${id})`} stroke={accent} strokeWidth="1"/>
      <g strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="37" y1="36" x2="37" y2="64" stroke={kC} strokeWidth="3.5"/>
        <line x1="37" y1="50" x2="49" y2="36" stroke={kC} strokeWidth="3.5"/>
        <line x1="37" y1="50" x2="50" y2="64" stroke={kC} strokeWidth="3.5"/>
        <line x1="55" y1="36" x2="68" y2="36" stroke={accent} strokeWidth="3.5"/>
        <line x1="61.5" y1="36" x2="61.5" y2="64" stroke={accent} strokeWidth="3.5"/>
      </g>
      <circle cx="50" cy="3"  r="2.6" fill={accent} style={{animation:'kr-op 3s ease-in-out infinite',animationDelay:'0s'}}/>
      <circle cx="50" cy="97" r="2.6" fill={accent} style={{animation:'kr-op 3s ease-in-out infinite',animationDelay:'2s'}}/>
    </svg>
  )
}

export default function DesignerApp() {
  const { isDark, toggle } = useTheme()
  const [version, setVersion] = useState('1.1')

  useEffect(() => {
    if (!document.getElementById('kt-anim-css')) {
      const s = document.createElement('style')
      s.id = 'kt-anim-css'; s.textContent = KT_ANIM_CSS
      document.head.appendChild(s)
    }
    window.api.config.get().then(cfg => {
      let hex = cfg?.Personalizacao?.cor_primaria
      if (hex === '#FF6B2B') hex = '#D95218'
      if (hex) aplicarCorSistema(hex)
    }).catch(() => {})
    window.api.update?.version().then(v => setVersion(v)).catch(() => {})
  }, [])

  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Titlebar ─────────────────────────────────────────────────────── */}
      <header
        className="drag-region"
        style={{
          height: 56,
          background: 'var(--s1)',
          borderBottom: '1px solid var(--bd)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 0 0 18px',
          flexShrink: 0,
          position: 'relative',
          zIndex: 5,
          boxShadow: 'var(--sh-xs)',
        }}
      >
        {/* Lado esquerdo */}
        <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <KtLogo size={34} isDark={isDark} />

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', letterSpacing: -0.4, lineHeight: 1.25 }}>
              KronTech Designer
            </div>
            <div style={{ fontSize: 9, color: 'var(--t3)', letterSpacing: 1.6, fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.1, marginTop: 1 }}>
              Criador de Telas
            </div>
          </div>

          {/* Divisor */}
          <div style={{ width: 1, height: 20, background: 'var(--bd)', flexShrink: 0, margin: '0 2px' }} />

          {/* Badge versão */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'var(--or4)',
            border: '1px solid rgba(255,107,43,0.22)',
            borderRadius: 6, padding: '3px 9px',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--or)', opacity: 0.85 }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--or)', letterSpacing: 0.3 }}>
              v{version} · {__BUILD_DATE__} · {__BUILD_TIME__}
            </span>
          </div>
        </div>

        {/* Lado direito */}
        <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: 6, height: '100%' }}>
          <span className="tb-dot" />
          <button
            className="theme-toggle no-transition"
            onClick={toggle}
            title={isDark ? 'Modo claro' : 'Modo escuro'}
          >
            {isDark ? <Sun size={14} strokeWidth={2} /> : <Moon size={14} strokeWidth={2} />}
          </button>
          <WinControls />
        </div>
      </header>

      {/* ── Conteúdo ─────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflow: 'hidden', padding: 0 }}>
        <FormBuilder hideHeader onTelasUpdated={() => {}} />
      </main>

    </div>
  )
}
