import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Sun, Moon, X, Plus, ChevronLeft, ChevronRight, LayoutGrid, Package, Zap,
} from 'lucide-react'
import Sidebar from './components/Sidebar'
import FuncoesTab from './pages/FuncoesTab'
import TelasPage from './pages/designer/TelasPage'
import ModulosPage from './pages/designer/ModulosPage'
import { aplicarCorSistema } from './pages/Configuracoes'
import { useTheme } from './hooks/useTheme'
import './App.css'

// ── Páginas do Designer mapeadas para abas do FormBuilder ────────────────────
// pageId do Designer → aba interna do FormBuilder
// 'funcoes' → componente próprio
const DESIGNER_PAGES = [
  { pageId: 'telas',   label: 'Telas',   Icon: LayoutGrid, fbTab: 'telas'   },
  { pageId: 'modulos', label: 'Módulos', Icon: Package,    fbTab: 'modulos' },
  { pageId: 'funcoes', label: 'Funções', Icon: Zap,        fbTab: null      },
]

const PAGE_META = {
  telas:        { title: 'Telas',        sub: 'CRIADOR DE TELAS'          },
  modulos:      { title: 'Módulos',      sub: 'ORGANIZAÇÃO · MÓDULOS'     },
  funcoes:      { title: 'Funções',      sub: 'AUTOMAÇÃO · FUNÇÕES'       },
  // páginas do KronTech principal que o Sidebar também pode navegar
  dashboard:           { title: 'Dashboard',         sub: 'VISÃO GERAL'          },
  agenda:              { title: 'Agenda',             sub: 'GESTÃO · COMPROMISSOS'},
  arquivos:            { title: 'Arquivos',           sub: 'FERRAMENTAS · ARQUIVOS'},
  sql:                 { title: 'Editor SQL',         sub: 'FERRAMENTAS · SQL'    },
  configuracoes:       { title: 'Personalização',     sub: 'SISTEMA · CONFIGURAÇÕES'},
  'dashboard-designer':{ title: 'Dashboard Config',  sub: 'DASHBOARD · WIDGETS'  },
}

const KT_ANIM_CSS = `
@keyframes kr-rR{to{transform:rotate(360deg)}}
@keyframes kr-rL{to{transform:rotate(-360deg)}}
@keyframes kr-op{0%,100%{opacity:.35}50%{opacity:1}}
`

// ── Controles de janela ──────────────────────────────────────────────────────
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

// ── Logo KronTech (topbar) ───────────────────────────────────────────────────
function KtLogo({ size = 22, isDark = true }) {
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

// ── Painel flutuante Alt+Tab ─────────────────────────────────────────────────
function TabsPanel({ tabs, activeTabId, onSelect, onClose, onReorder, onHide }) {
  const [pos, setPos] = useState(null)
  const dragTabRef = useRef(null)
  const [localTabs, setLocalTabs] = useState(tabs)
  const [draggingId, setDraggingId] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const panelRef = useRef(null)

  useEffect(() => { setLocalTabs(tabs) }, [tabs])

  function onHeaderMouseDown(e) {
    if (e.target.closest('button')) return
    e.preventDefault()
    const rect = panelRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
    const ox = e.clientX - rect.left, oy = e.clientY - rect.top
    const move = ev => setPos({ x: ev.clientX - ox, y: ev.clientY - oy })
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  function onCardDragStart(e, tabId, idx) {
    dragTabRef.current = { tabId, idx }; setDraggingId(tabId)
    e.dataTransfer.effectAllowed = 'move'
  }
  function onCardDragOver(e, idx) { e.preventDefault(); setOverIdx(idx) }
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

  const posStyle = pos ? { left: pos.x, top: pos.y, transform: 'none' } : {}

  return (
    <div ref={panelRef} className={`tabs-panel${pos ? '' : ' centered'}`} style={posStyle}>
      <div className="tpanel-header" onMouseDown={onHeaderMouseDown}>
        <span className="tpanel-title">Abas abertas · {localTabs.length}</span>
        <button className="tpanel-close" onClick={onHide}><X size={11} strokeWidth={2.5} /></button>
      </div>
      <div className="tpanel-cards">
        {localTabs.map((tab, idx) => {
          const page = DESIGNER_PAGES.find(p => p.pageId === tab.pageId)
          const Icon = page?.Icon ?? LayoutGrid
          return (
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
              <div className="tpanel-card-preview">
                <Icon size={22} strokeWidth={1.5} />
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
          )
        })}
      </div>
    </div>
  )
}

// ── Barra de abas ────────────────────────────────────────────────────────────
function TabBar({ tabs, activeTabId, onSelect, onClose, onReorder, showPanel, onTogglePanel }) {
  const scrollRef = useRef(null)
  const dragState = useRef(null)
  const [canLeft,  setCanLeft]  = useState(false)
  const [canRight, setCanRight] = useState(false)
  const [dragOver, setDragOver] = useState(null)

  function checkScroll() {
    const el = scrollRef.current; if (!el) return
    setCanLeft(el.scrollLeft > 0)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }

  useEffect(() => { checkScroll() }, [tabs])
  useEffect(() => {
    const el = scrollRef.current; if (!el) return
    const activeEl = el.querySelector(`[data-tabid="${activeTabId}"]`)
    if (activeEl) activeEl.scrollIntoView({ inline: 'nearest', block: 'nearest' })
    checkScroll()
  }, [activeTabId, tabs])

  function scroll(dir) {
    scrollRef.current?.scrollBy({ left: dir * 140, behavior: 'smooth' })
    setTimeout(checkScroll, 300)
  }

  function onTabDragStart(e, tabId) { dragState.current = tabId; e.dataTransfer.effectAllowed = 'move' }
  function onTabDragOver(e, tabId) { e.preventDefault(); if (dragState.current !== tabId) setDragOver(tabId) }
  function onTabDrop(e, tabId) {
    e.preventDefault(); setDragOver(null)
    if (dragState.current == null || dragState.current === tabId) return
    onReorder(dragState.current, tabId); dragState.current = null
  }

  return (
    <div className="tab-bar no-drag">
      {canLeft && <button className="tab-scroll-btn" onClick={() => scroll(-1)}><ChevronLeft size={12} /></button>}
      <div ref={scrollRef} className="tab-list" onScroll={checkScroll}>
        {tabs.map(tab => {
          const page = DESIGNER_PAGES.find(p => p.pageId === tab.pageId)
          const Icon = page?.Icon ?? LayoutGrid
          return (
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
              <span className="tab-icon"><Icon size={12} strokeWidth={1.5} /></span>
              <span className="tab-label">{tab.label}</span>
              {tabs.length > 1 && (
                <span className="tab-close" onClick={e => { e.stopPropagation(); onClose(tab.id) }}>
                  <X size={10} strokeWidth={2.5} />
                </span>
              )}
            </button>
          )
        })}
      </div>
      {canRight && <button className="tab-scroll-btn" onClick={() => scroll(1)}><ChevronRight size={12} /></button>}
      <button className={`tab-new-btn${showPanel ? ' open' : ''}`} onClick={onTogglePanel} title="Gerenciar abas">
        <Plus size={12} strokeWidth={2.5} />
      </button>
    </div>
  )
}

// ── Conteúdo de cada aba ─────────────────────────────────────────────────────
function DesignerTabContent({ pageId }) {
  switch (pageId) {
    case 'telas':   return <TelasPage />
    case 'modulos': return <ModulosPage />
    case 'funcoes': return <FuncoesTab />
    default:        return <TelasPage />
  }
}

// ── Contador de abas ─────────────────────────────────────────────────────────
let tabCounter = 0
function makeTab(pageId) {
  const page = DESIGNER_PAGES.find(p => p.pageId === pageId)
  return { id: ++tabCounter, pageId, label: page?.label ?? pageId }
}

// ── Designer App ─────────────────────────────────────────────────────────────
export default function DesignerApp() {
  const { isDark, toggle } = useTheme()
  const [version, setVersion] = useState('1.1')

  const [tabs,        setTabs]        = useState(() => [makeTab('telas')])
  const [activeTabId, setActiveTabId] = useState(1)
  const [showPanel,   setShowPanel]   = useState(false)
  const tabsRef = useRef(tabs)
  useEffect(() => { tabsRef.current = tabs }, [tabs])

  const activeTab  = tabs.find(t => t.id === activeTabId) ?? tabs[0]
  const activePage = activeTab?.pageId ?? 'telas'
  const topMeta    = PAGE_META[activePage] ?? PAGE_META['telas']

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

  const handleNavigate = useCallback((pageId) => {
    // Páginas do Designer (telas/modulos/funcoes) → abrem em aba no Designer
    if (DESIGNER_PAGES.some(p => p.pageId === pageId)) {
      const existing = tabsRef.current.find(t => t.pageId === pageId)
      if (existing) { setActiveTabId(existing.id); return }
      const tab = makeTab(pageId)
      setTabs(prev => [...prev, tab])
      setActiveTabId(tab.id)
      return
    }
    // Qualquer outra página (dashboard, agenda, etc.) — ignora no Designer
    // O Sidebar vai tentar navegar mas essas páginas não existem aqui
  }, [])

  function closeTab(tabId) {
    setTabs(prev => {
      if (prev.length <= 1) return prev
      const idx = prev.findIndex(t => t.id === tabId)
      const next = prev.filter(t => t.id !== tabId)
      if (activeTabId === tabId) setActiveTabId(next[Math.min(idx, next.length - 1)].id)
      return next
    })
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

  return (
    <div className="app">

      {/* ── Sidebar real do KronTech — idêntico ao App principal ── */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        designerMode
      />

      <div className="main">

        {/* ── Topbar ── */}
        <header className="topbar drag-region">
          <div className="tb-left no-drag">
            <KtLogo size={22} isDark={isDark} />
            <h1 className="tb-title">{topMeta.title}</h1>
            <span className="tb-sub">{topMeta.sub}</span>

            <div style={{ width: 1, height: 14, background: 'var(--bd)', flexShrink: 0, margin: '0 4px' }} />

            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'var(--or4)', border: '1px solid rgba(255,107,43,0.22)',
              borderRadius: 5, padding: '2px 7px',
            }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--or)', opacity: 0.85 }} />
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--or)', letterSpacing: 0.3 }}>
                v{version} · {__BUILD_DATE__} · {__BUILD_TIME__}
              </span>
            </div>

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

        {/* ── Tab bar ── */}
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelect={id => { setActiveTabId(id); setShowPanel(false) }}
          onClose={closeTab}
          onReorder={reorderTabs}
          showPanel={showPanel}
          onTogglePanel={() => setShowPanel(v => !v)}
        />

        {/* ── Painel Alt+Tab ── */}
        {showPanel && (
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
            />
          </>
        )}

        {/* ── Conteúdo das abas ── */}
        <div className="tab-content-area">
          {tabs.map(tab => (
            <main
              key={tab.id}
              className="content"
              style={{ display: tab.id === activeTabId ? 'flex' : 'none' }}
            >
              <DesignerTabContent pageId={tab.pageId} />
            </main>
          ))}
        </div>

      </div>
    </div>
  )
}
