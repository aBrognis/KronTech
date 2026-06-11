import { useState } from 'react'
import './Sidebar.css'

// Ícones SVG inline
const icons = {
  dashboard: <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>,
  os:        <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>,
  projetos:  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>,
  financeiro:<svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  agenda:    <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  scripts:   <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  solucoes:  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  sql:       <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  relatorios:<svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>,
  chevron:   <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>,
  arrowLeft: <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
}

// Grupos do menu
const MENU = [
  {
    id: 'inicio', label: 'Início',
    items: [
      { id: 'dashboard', label: 'Dashboard' }
    ]
  },
  {
    id: 'suporte', label: 'Suporte',
    items: [
      { id: 'os', label: 'Ordens de Serviço', badge: 5 }
    ]
  },
  {
    id: 'gestao', label: 'Gestão',
    items: [
      { id: 'projetos',   label: 'Projetos / Clientes' },
      { id: 'financeiro', label: 'Financeiro' },
      { id: 'agenda',     label: 'Agenda' }
    ]
  },
  {
    id: 'ferramentas', label: 'Ferramentas',
    items: [
      { id: 'scripts',    label: 'Base de Scripts' },
      { id: 'solucoes',   label: 'Soluções' },
      { id: 'sql',        label: 'Editor SQL' },
      { id: 'relatorios', label: 'Relatórios' }
    ]
  }
]

export default function Sidebar({ activePage, onNavigate }) {
  const [collapsed, setCollapsed]   = useState(false)
  const [openGroups, setOpenGroups] = useState({ inicio: true, suporte: true, gestao: true, ferramentas: true })

  function toggleGroup(id) {
    if (collapsed) return
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <aside className={`sb${collapsed ? ' collapsed' : ''}`}>

      {/* Botão recolher sidebar */}
      <button className="sb-toggle" onClick={() => setCollapsed(p => !p)}>
        <span className="sb-toggle-icon">{icons.arrowLeft}</span>
      </button>

      {/* Logo */}
      <div className="sb-logo">
        <LogoIcon />
        <div className="sb-wordmark">
          <div className="sb-logo-name">Kron<em>Tech</em></div>
          <div className="sb-logo-tag">v1.0 · 2026</div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="sb-scroll">
        {MENU.map(group => (
          <div key={group.id} className="sb-group">
            <button className="sb-group-header" onClick={() => toggleGroup(group.id)}>
              <span className="sg-label">{group.label}</span>
              <span className={`sg-arrow ${openGroups[group.id] ? 'open' : 'closed'}`}>
                {icons.chevron}
              </span>
            </button>

            <div className={`sg-items ${openGroups[group.id] ? 'open' : 'closed'}`}>
              {group.items.map(item => (
                <button
                  key={item.id}
                  className={`ni${activePage === item.id ? ' active' : ''}`}
                  data-tip={item.label}
                  onClick={() => onNavigate(item.id)}
                >
                  <span className="ni-icon">{icons[item.id]}</span>
                  <span className="ni-label">{item.label}</span>
                  {item.badge && <span className="ni-badge">{item.badge}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Usuário */}
      <div className="sb-bottom">
        <div className="sb-user">
          <div className="sb-av">A</div>
          <div className="sb-uinfo">
            <div className="sb-uname">Anderson</div>
            <div className="sb-urole">Administrador</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function LogoIcon() {
  return (
    <svg className="sb-logo-icon" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      <circle cx="50" cy="50" r="40" fill="none" stroke="#222" strokeWidth="1" strokeDasharray="5 7"/>
      <circle cx="50" cy="50" r="26" fill="#111" stroke="#FF6B2B" strokeWidth="1.2"/>
      <g strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="37" y1="34" x2="37" y2="66" stroke="#F2F2F2" strokeWidth="2.2"/>
        <line x1="37" y1="50" x2="50" y2="34" stroke="#F2F2F2" strokeWidth="2.2"/>
        <line x1="37" y1="50" x2="51" y2="66" stroke="#F2F2F2" strokeWidth="2.2"/>
        <line x1="56" y1="34" x2="70" y2="34" stroke="#FF6B2B" strokeWidth="2.2"/>
        <line x1="63" y1="34" x2="63" y2="66" stroke="#FF6B2B" strokeWidth="2.2"/>
      </g>
    </svg>
  )
}
