import { useState, useEffect, useRef, useCallback } from 'react'
import { Sun, Moon, Play, X, Plus, ChevronLeft, ChevronRight, LayoutDashboard, CalendarDays, FolderOpen, Database, Settings, LayoutGrid } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
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

// Páginas que NÃO viram aba (comportamento normal)
const NO_TAB_PAGES = new Set(['formbuilder'])

const PAGE_META = {
  dashboard:           { title: 'Dashboard',            sub: 'VISÃO GERAL'                       },
  'dashboard-designer':{ title: 'Configurar Dashboard', sub: 'DASHBOARD · WIDGETS'               },
  agenda:              { title: 'Agenda',                sub: 'GESTÃO · COMPROMISSOS'             },
  arquivos:            { title: 'Arquivos',              sub: 'FERRAMENTAS · GESTÃO DE ARQUIVOS'  },
  sql:                 { title: 'Editor SQL',            sub: 'FERRAMENTAS · POSTGRESQL'          },
  formbuilder:         { title: 'Criador de Telas',      sub: 'FERRAMENTAS · CADASTROS DINÂMICOS' },
  configuracoes:       { title: 'Personalização',        sub: 'SISTEMA · CONFIGURAÇÕES'           },
}

function pageLabel(pageId, dynamicTitles) {
  if (pageId.startsWith('fb__')) {
    return dynamicTitles[pageId]?.nome ?? pageId.slice(4).replace(/_/g, ' ')
  }
  return PAGE_META[pageId]?.title ?? pageId
}

let tabCounter = 0
function makeTab(pageId, dynamicTitles = {}) {
  return { id: ++tabCounter, pageId, label: pageLabel(pageId, dynamicTitles) }
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

const FIXED_PAGES = [
  { pageId: 'dashboard',           label: 'Dashboard',         Icon: LayoutDashboard },
  { pageId: 'agenda',              label: 'Agenda',            Icon: CalendarDays    },
  { pageId: 'arquivos',            label: 'Arquivos',          Icon: FolderOpen      },
  { pageId: 'sql',                 label: 'Editor SQL',        Icon: Database        },
  { pageId: 'configuracoes',       label: 'Personalização',    Icon: Settings        },
]

function telaIcon(nome) {
  const key = (nome || 'layout').split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  return LucideIcons[key] || LayoutGrid
}

// ── Ícone de página ──────────────────────────────────────────────────────────
const PAGE_ICON_MAP = {
  dashboard: LayoutDashboard, agenda: CalendarDays,
  arquivos: FolderOpen, sql: Database, configuracoes: Settings,
  'dashboard-designer': LayoutGrid,
}

function PageIcon({ pageId, icone, size = 18 }) {
  if (pageId.startsWith('fb__')) {
    const Icon = telaIcon(icone || 'layout')
    return <Icon size={size} strokeWidth={1.5} />
  }
  const Icon = PAGE_ICON_MAP[pageId] || LayoutGrid
  return <Icon size={size} strokeWidth={1.5} />
}

// ── Painel flutuante de abas ─────────────────────────────────────────────────
function TabsPanel({ tabs, activeTabId, onSelect, onClose, onReorder, onHide, telasDin }) {
  const [pos, setPos] = useState(null)
  const dragTabRef = useRef(null)
  const [localTabs, setLocalTabs] = useState(tabs)
  const [draggingId, setDraggingId] = useState(null)
  const [overIdx, setOverIdx] = useState(null)

  // Sincroniza tabs externas
  useEffect(() => { setLocalTabs(tabs) }, [tabs])

  const panelRef = useRef(null)

  // Drag do painel pela header
  function onHeaderMouseDown(e) {
    if (e.target.closest('button')) return
    e.preventDefault()
    const rect = panelRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
    const ox = e.clientX - rect.left, oy = e.clientY - rect.top
    const move = ev => setPos({ x: ev.clientX - ox, y: ev.clientY - oy })
    const up   = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  // Drag-and-drop para reordenar cards
  function onCardDragStart(e, tabId, idx) {
    dragTabRef.current = { tabId, idx }
    setDraggingId(tabId)
    e.dataTransfer.effectAllowed = 'move'
  }
  function onCardDragOver(e, idx) {
    e.preventDefault()
    setOverIdx(idx)
  }
  function onCardDrop(e, toIdx) {
    e.preventDefault()
    if (dragTabRef.current == null) return
    const fromIdx = dragTabRef.current.idx
    setDraggingId(null); setOverIdx(null); dragTabRef.current = null
    if (fromIdx === toIdx) return
    const next = [...localTabs]
    const [m] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, m)
    setLocalTabs(next)
    onReorder(m.id, localTabs[toIdx].id)
  }
  function onCardDragEnd() { setDraggingId(null); setOverIdx(null); dragTabRef.current = null }

  const posStyle = pos
    ? { left: pos.x, top: pos.y, transform: 'none' }
    : {}

  return (
    <div ref={panelRef} className={`tabs-panel${pos ? '' : ' centered'}`} style={posStyle}>
      {/* Header arrastável */}
      <div className="tpanel-header" onMouseDown={onHeaderMouseDown}>
        <span className="tpanel-title">Abas abertas · {localTabs.length}</span>
        <button className="tpanel-close" onClick={onHide}><X size={11} strokeWidth={2.5} /></button>
      </div>

      {/* Cards das abas abertas */}
      <div className="tpanel-cards">
        {localTabs.map((tab, idx) => (
          <div
            key={tab.id}
            draggable
            onDragStart={e => onCardDragStart(e, tab.id, idx)}
            onDragOver={e => onCardDragOver(e, idx)}
            onDrop={e => onCardDrop(e, idx)}
            onDragEnd={onCardDragEnd}
            className={[
              'tpanel-card',
              tab.id === activeTabId ? 'active' : '',
              draggingId === tab.id ? 'dragging' : '',
              overIdx === idx && draggingId !== tab.id ? 'drag-over' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => onSelect(tab.id)}
          >
            {/* Preview colorido */}
            <div className="tpanel-card-preview">
              <PageIcon
                pageId={tab.pageId}
                icone={tab.pageId.startsWith('fb__')
                  ? telasDin.find(t => `fb__${t.nome_tabela}` === tab.pageId)?.icone
                  : undefined}
                size={22}
              />
            </div>
            <div className="tpanel-card-footer">
              <span className="tpanel-card-label">{tab.label}</span>
              {localTabs.length > 1 && (
                <button className="tpanel-card-close" onClick={e => { e.stopPropagation(); onClose(tab.id) }}>
                  <X size={8} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

let onReorderFromPanel = () => {}

// ── Barra de abas ────────────────────────────────────────────────────────────
function TabBar({ tabs, activeTabId, onSelect, onClose, onReorder, telasDin, showPanel, onTogglePanel }) {
  const scrollRef  = useRef(null)
  const dragState  = useRef(null)
  const [canLeft,  setCanLeft]  = useState(false)
  const [canRight, setCanRight] = useState(false)
  const [dragOver, setDragOver] = useState(null)

  // expõe reorder para o painel flutuante
  onReorderFromPanel = onReorder

  function checkScroll() {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 0)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }

  useEffect(() => { checkScroll() }, [tabs])
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const activeEl = el.querySelector(`[data-tabid="${activeTabId}"]`)
    if (activeEl) activeEl.scrollIntoView({ inline: 'nearest', block: 'nearest' })
    checkScroll()
  }, [activeTabId, tabs])

  function scroll(dir) {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * 140, behavior: 'smooth' })
    setTimeout(checkScroll, 300)
  }

  function onTabDragStart(e, tabId) {
    dragState.current = tabId
    e.dataTransfer.effectAllowed = 'move'
  }
  function onTabDragOver(e, tabId) {
    e.preventDefault()
    if (dragState.current !== tabId) setDragOver(tabId)
  }
  function onTabDrop(e, tabId) {
    e.preventDefault()
    setDragOver(null)
    if (dragState.current == null || dragState.current === tabId) return
    onReorder(dragState.current, tabId)
    dragState.current = null
  }

  return (
    <div className="tab-bar no-drag">
      {canLeft && (
        <button className="tab-scroll-btn" onClick={() => scroll(-1)}>
          <ChevronLeft size={12} />
        </button>
      )}

      <div ref={scrollRef} className="tab-list" onScroll={checkScroll}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            data-tabid={tab.id}
            draggable
            onDragStart={e => onTabDragStart(e, tab.id)}
            onDragOver={e => onTabDragOver(e, tab.id)}
            onDrop={e => onTabDrop(e, tab.id)}
            onDragEnd={() => setDragOver(null)}
            className={`tab-item${tab.id === activeTabId ? ' active' : ''}${dragOver === tab.id ? ' drag-over' : ''}`}
            onClick={() => onSelect(tab.id)}
            title={tab.label}
          >
            <span className="tab-icon">
              <PageIcon
                pageId={tab.pageId}
                icone={tab.pageId.startsWith('fb__')
                  ? telasDin.find(t => `fb__${t.nome_tabela}` === tab.pageId)?.icone
                  : undefined}
                size={12}
              />
            </span>
            <span className="tab-label">{tab.label}</span>
            {tabs.length > 1 && (
              <span className="tab-close" onClick={e => { e.stopPropagation(); onClose(tab.id) }}>
                <X size={10} strokeWidth={2.5} />
              </span>
            )}
          </button>
        ))}
      </div>

      {canRight && (
        <button className="tab-scroll-btn" onClick={() => scroll(1)}>
          <ChevronRight size={12} />
        </button>
      )}

      <button
        className={`tab-new-btn${showPanel ? ' open' : ''}`}
        onClick={onTogglePanel}
        title="Gerenciar abas"
      >
        <Plus size={12} strokeWidth={2.5} />
      </button>
    </div>
  )
}

// ── App principal ────────────────────────────────────────────────────────────
export default function App() {
  const [appPhase, setAppPhase] = useState(import.meta.env.DEV ? 'app' : 'splash')

  // Abas: cada aba tem { id, pageId, label }
  const [tabs,        setTabs]        = useState(() => [makeTab('dashboard')])
  const [activeTabId, setActiveTabId] = useState(1)

  // Estado de página fora das abas (formbuilder)
  const [noTabPage,   setNoTabPage]   = useState(null)

  // Títulos dinâmicos por pageId (para telas fb__)
  const [dynamicTitles, setDynamicTitles] = useState({})

  // Telas dinâmicas para o dropdown de nova aba
  const [telasDin,   setTelasDin]   = useState([])
  const [showPanel,  setShowPanel]  = useState(false)

  const [newTrigger,   setNewTrigger]   = useState(0)
  const [telasVersion, setTelasVersion] = useState(0)
  const { isDark, toggle } = useTheme()

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
    window.api.formBuilder.listarTelas(true).then(setTelasDin).catch(() => {})
  }, [])

  const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0]
  const activePage = noTabPage ?? activeTab?.pageId ?? 'dashboard'

  // Atualiza label da aba quando o título dinâmico chega
  function handleTituloChange(pageId, nome, tabela) {
    setDynamicTitles(prev => ({ ...prev, [pageId]: { nome, tabela } }))
    setTabs(prev => prev.map(t =>
      t.pageId === pageId ? { ...t, label: nome } : t
    ))
  }

  const tabsRef = useRef(tabs)
  useEffect(() => { tabsRef.current = tabs }, [tabs])

  const handleNavigate = useCallback((pageId) => {
    setNewTrigger(0)

    if (NO_TAB_PAGES.has(pageId)) {
      setNoTabPage(pageId)
      return
    }

    setNoTabPage(null)

    // Lê sempre a versão mais recente via ref
    const existing = tabsRef.current.find(t => t.pageId === pageId)
    if (existing) {
      setActiveTabId(existing.id)
      return
    }

    const tab = makeTab(pageId)
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
  }, [])

  _initNavegacao(handleNavigate)

  function handleTelasUpdated() {
    setTelasVersion(v => v + 1)
    window.api.formBuilder.listarTelas(true).then(setTelasDin).catch(() => {})
  }

  function closeTab(tabId) {
    setTabs(prev => {
      if (prev.length <= 1) return prev
      const idx = prev.findIndex(t => t.id === tabId)
      const next = prev.filter(t => t.id !== tabId)
      if (activeTabId === tabId) {
        const newActive = next[Math.min(idx, next.length - 1)]
        setActiveTabId(newActive.id)
      }
      return next
    })
  }

  function openPageInNewTab(pageId) {
    setNoTabPage(null)
    setShowPanel(false)
    const existing = tabs.find(t => t.pageId === pageId)
    if (existing) { setActiveTabId(existing.id); return }
    const tab = makeTab(pageId, dynamicTitles)
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
  }

  function reorderTabs(fromId, toId) {
    setTabs(prev => {
      const next = [...prev]
      const fromIdx = next.findIndex(t => t.id === fromId)
      const toIdx   = next.findIndex(t => t.id === toId)
      if (fromIdx === -1 || toIdx === -1) return prev
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next
    })
  }

  // Topbar meta da página ativa
  const currentPageId = noTabPage ?? activePage
  const isDynamic = currentPageId.startsWith('fb__')
  const topMeta = isDynamic
    ? {
        title: dynamicTitles[currentPageId]?.nome ?? currentPageId.slice(4).replace(/_/g, ' '),
        sub: dynamicTitles[currentPageId]
          ? `${dynamicTitles[currentPageId].tabela.toUpperCase()} · CRIADOR DE TELAS`
          : 'CADASTRO · CRIADOR DE TELAS',
      }
    : (PAGE_META[currentPageId] ?? PAGE_META['dashboard'])

  function renderTabContent(pageId) {
    if (pageId.startsWith('fb__')) {
      const nomeTabela = pageId.slice(4)
      return (
        <FormBuilderView
          nomeTabela={nomeTabela}
          onTituloChange={(nome, tabela) => handleTituloChange(pageId, nome, tabela)}
        />
      )
    }
    switch (pageId) {
      case 'dashboard':          return <Dashboard onNavigate={handleNavigate} />
      case 'dashboard-designer': return <DashboardDesigner newTrigger={newTrigger} onNavigate={handleNavigate} />
      case 'agenda':             return <Agenda newTrigger={newTrigger} />
      case 'arquivos':           return <Arquivos newTrigger={newTrigger} />
      case 'sql':                return <EditorSQL />
      case 'configuracoes':      return <Configuracoes />
      default:                   return <Dashboard onNavigate={handleNavigate} />
    }
  }

  if (appPhase === 'splash') return <SplashScreen onDone={() => setAppPhase('login')} />
  if (appPhase === 'login')  return <><LoginPage onLogin={() => { window.api.win.maximize(); setAppPhase('app') }} /><UpdateBanner /></>

  return (
    <div className="app">
      <Sidebar activePage={currentPageId} onNavigate={handleNavigate} telasVersion={telasVersion} />
      <div className="main">

        {/* ── Topbar ── */}
        <header className="topbar drag-region">
          <div className="tb-left no-drag">
            <h1 className="tb-title">{topMeta.title}</h1>
            <span className="tb-sub">{topMeta.sub}</span>
            {import.meta.env.DEV && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: '2px 7px', borderRadius: 4, background: 'rgba(255,107,43,.15)', color: 'var(--or)', border: '1px solid rgba(255,107,43,.3)', textTransform: 'uppercase' }}>
                DEV
              </span>
            )}
          </div>
          <div className="tb-right no-drag">
            <button className="theme-toggle no-transition" onClick={toggle} title={isDark ? 'Modo claro' : 'Modo escuro'}>
              {isDark ? <Sun size={14} strokeWidth={2} /> : <Moon size={14} strokeWidth={2} />}
            </button>
            <WinControls />
          </div>
        </header>

        {/* ── Barra de abas (oculta se estiver em página sem aba) ── */}
        {!noTabPage && (
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSelect={id => { setActiveTabId(id); setShowPanel(false) }}
            onClose={closeTab}
            onReorder={reorderTabs}
            telasDin={telasDin}
            showPanel={showPanel}
            onTogglePanel={() => setShowPanel(v => !v)}
          />
        )}

        {showPanel && !noTabPage && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 9400, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(3px)' }}
              onClick={() => setShowPanel(false)}
            />
            <TabsPanel
              tabs={tabs}
              activeTabId={activeTabId}
              onSelect={id => { setActiveTabId(id); setShowPanel(false) }}
              onClose={closeTab}
              onReorder={reorderTabs}
              onHide={() => setShowPanel(false)}
              telasDin={telasDin}
            />
          </>
        )}

        {/* ── Conteúdo ── */}
        {noTabPage ? (
          <main className="content" key={noTabPage}>
            <FormBuilder newTrigger={newTrigger} onTelasUpdated={handleTelasUpdated} />
          </main>
        ) : (
          <div className="tab-content-area">
            {tabs.map(tab => (
              <main
                key={tab.id}
                className="content"
                style={{ display: tab.id === activeTabId ? 'flex' : 'none' }}
              >
                {renderTabContent(tab.pageId)}
              </main>
            ))}
          </div>
        )}

      </div>
      <UpdateBanner />
    </div>
  )
}
