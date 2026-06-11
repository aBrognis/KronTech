import { useState, useEffect } from 'react'
import { Sun, Moon, Play } from 'lucide-react'
import { _initNavegacao } from './lib/funcoes/navegacao.js'
import SplashScreen    from './pages/SplashScreen'
import LoginPage       from './pages/LoginPage'
import Sidebar         from './components/Sidebar'
import UpdateBanner    from './components/UpdateBanner'
import Dashboard           from './pages/Dashboard'
import DashboardDesigner  from './pages/DashboardDesigner'
import Arquivos        from './pages/Arquivos'
import EditorSQL       from './pages/EditorSQL'
import Agenda          from './pages/Agenda'
import FormBuilder     from './pages/FormBuilder'
import FormBuilderView from './pages/FormBuilderView'
import Configuracoes, { aplicarCorSistema } from './pages/Configuracoes'
import { useTheme } from './hooks/useTheme'
import './App.css'

const PAGES = {
  dashboard:           { title: 'Dashboard',             sub: 'VISÃO GERAL',                       btnPri: null            },
  'dashboard-designer':{ title: 'Configurar Dashboard',  sub: 'DASHBOARD · WIDGETS',               btnPri: '+ Novo Widget' },
  agenda:         { title: 'Agenda',             sub: 'GESTÃO · COMPROMISSOS',             btnPri: '+ Compromisso' },
arquivos:       { title: 'Arquivos',           sub: 'FERRAMENTAS · GESTÃO DE ARQUIVOS',  btnPri: '+ Importar'    },
  sql:            { title: 'Editor SQL',         sub: 'FERRAMENTAS · POSTGRESQL',          btnPri: <><Play size={12} style={{ marginRight: 5 }} />Executar</> },
  formbuilder:    { title: 'Criador de Telas',   sub: 'FERRAMENTAS · CADASTROS DINÂMICOS', btnPri: '+ Nova Tela'   },
  configuracoes:  { title: 'Personalização',     sub: 'SISTEMA · CONFIGURAÇÕES',           btnPri: null            },
}

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

export default function App() {
  // ── Estado principal ─────────────────────────────────────────────────────
  const [appPhase, setAppPhase] = useState('splash')
  const [page,          setPage]          = useState('dashboard')
  const [newTrigger,    setNewTrigger]    = useState(0)
  const [telasVersion,  setTelasVersion]  = useState(0)
  const [dynamicTitle,  setDynamicTitle]  = useState(null)
  const { isDark, toggle } = useTheme()

  // Aplica cor personalizada salva ao iniciar
  useEffect(() => {
    if (!document.getElementById('kt-anim-css')) {
      const s = document.createElement('style')
      s.id = 'kt-anim-css'
      s.textContent = '@keyframes kr-rR{to{transform:rotate(360deg)}}@keyframes kr-rL{to{transform:rotate(-360deg)}}@keyframes kr-op{0%,100%{opacity:.35}50%{opacity:1}}'
      document.head.appendChild(s)
    }
    window.api.config.get().then(cfg => {
      let hex = cfg?.Personalizacao?.cor_primaria
      if (hex === '#FF6B2B') hex = '#D95218'
      if (hex) aplicarCorSistema(hex)
    }).catch(() => {})
  }, [])

  const isDynamic = page.startsWith('fb__')
  const cfg = isDynamic
    ? {
        title: dynamicTitle?.nome ?? page.slice(4).replace(/_/g, ' '),
        sub: dynamicTitle ? `${dynamicTitle.tabela.toUpperCase()} · CRIADOR DE TELAS` : 'CADASTRO · CRIADOR DE TELAS',
        btnPri: null,
      }
    : (PAGES[page] || PAGES['dashboard'])

  function handleNavigate(p) { setPage(p); setNewTrigger(0); if (!p.startsWith('fb__')) setDynamicTitle(null) }
  _initNavegacao(handleNavigate)

  // Chamado pelo FormBuilder após criar/editar/inativar/excluir tela
  function handleTelasUpdated() { setTelasVersion(v => v + 1) }

  function renderPage() {
    if (isDynamic) return <FormBuilderView nomeTabela={page.slice(4)} onTituloChange={(nome, tabela) => setDynamicTitle({ nome, tabela })} />
    switch (page) {
      case 'dashboard':            return <Dashboard          onNavigate={handleNavigate} />
      case 'dashboard-designer': return <DashboardDesigner newTrigger={newTrigger} onNavigate={handleNavigate} />
      case 'agenda':      return <Agenda      newTrigger={newTrigger} />
case 'arquivos':    return <Arquivos    newTrigger={newTrigger} />
      case 'sql':         return <EditorSQL />
      case 'formbuilder':   return <FormBuilder newTrigger={newTrigger} onTelasUpdated={handleTelasUpdated} />
      case 'configuracoes': return <Configuracoes />
      default:              return <Dashboard onNavigate={handleNavigate} />
    }
  }

  if (appPhase === 'splash') return <SplashScreen onDone={() => { setAppPhase('login') }} />
  if (appPhase === 'login')  return <><LoginPage onLogin={() => { window.api.win.maximize(); setAppPhase('app') }} /><UpdateBanner /></>

  return (
    <div className="app">
      <Sidebar activePage={page} onNavigate={handleNavigate} telasVersion={telasVersion} />
      <div className="main">
        <header className="topbar drag-region">
          <div className="tb-left no-drag">
            <h1 className="tb-title">{cfg.title}</h1>
            <span className="tb-sub">{cfg.sub}</span>
          </div>
          <div className="tb-right no-drag">
            <span className="tb-dot" />
            <button
              className="theme-toggle no-transition"
              onClick={toggle}
              title={isDark ? 'Modo claro' : 'Modo escuro'}
            >
              {isDark
                ? <Sun  size={14} strokeWidth={2} />
                : <Moon size={14} strokeWidth={2} />}
            </button>
            <WinControls />
          </div>
        </header>
        <main className="content" key={page}>
          {renderPage()}
        </main>
      </div>
      <UpdateBanner />
    </div>
  )
}
