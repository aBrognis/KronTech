import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, CalendarDays,
  Database, ChevronDown, ChevronLeft, FolderOpen, LayoutGrid, RefreshCw, Settings
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import './Sidebar.css'

function telaIcon(nome) {
  const key = (nome || 'layout').split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  return LucideIcons[key] || LayoutGrid
}

const MENU_BASE = [
  {
    id: 'inicio',
    baseLabel: 'Início',
    items: [
      { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard }
    ]
  },
  {
    id: 'gestao',
    baseLabel: 'Gestão',
    items: [
      { id: 'agenda', label: 'Agenda', Icon: CalendarDays },
    ]
  },
  {
    id: 'ferramentas',
    baseLabel: 'Ferramentas',
    items: [
{ id: 'arquivos',    label: 'Arquivos',         Icon: FolderOpen },
      { id: 'sql',         label: 'Editor SQL',       Icon: Database   },
      { id: 'formbuilder', label: 'KronTech Designer', Icon: LayoutGrid },
    ]
  }
]

const LABELS_KEY = { inicio: 'label_inicio', gestao: 'label_gestao', ferramentas: 'label_ferramentas' }

export default function Sidebar({ activePage, onNavigate, telasVersion = 0 }) {
  const [collapsed,      setCollapsed]      = useState(false)
  const [openGroups,     setOpenGroups]     = useState({ inicio: true, gestao: true, ferramentas: true })
  const [version,        setVersion]        = useState('1.1')
  const [telasDin,       setTelasDin]       = useState([])
  const [reloading,      setReloading]      = useState(false)
  const [autoReload,     setAutoReload]     = useState(0)
  const [agora,          setAgora]          = useState(new Date())
  const [designerConfirm, setDesignerConfirm] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Personalização
  const [nomeSistema,      setNomeSistema]      = useState('KronTech')
  const [nomeUsuario,      setNomeUsuario]      = useState('Anderson')
  const [cargoUsuario,     setCargoUsuario]     = useState('Administrador')
  const [labelsMenu,       setLabelsMenu]       = useState({ inicio: 'Início', gestao: 'Gestão', ferramentas: 'Ferramentas' })
  const [ordemSecoes,      setOrdemSecoes]      = useState(['inicio', 'gestao', 'ferramentas'])
  const [ordemGlobal,      setOrdemGlobal]      = useState([])

  useEffect(() => {
    window.api.update?.version().then(v => setVersion(v)).catch(() => {})
    carregarTelas()
    carregarPersonalizacao()

    function onConfigChanged(e) {
      const d = e.detail || {}
      if (d.nomeSistema)  setNomeSistema(d.nomeSistema)
      if (d.nomeUsuario)  setNomeUsuario(d.nomeUsuario)
      if (d.cargoUsuario) setCargoUsuario(d.cargoUsuario)
      if (d.labelInicio || d.labelGestao || d.labelFerramentas) {
        setLabelsMenu(prev => ({
          inicio:       d.labelInicio      || prev.inicio,
          gestao:       d.labelGestao      || prev.gestao,
          ferramentas:  d.labelFerramentas || prev.ferramentas,
        }))
      }
      if (d.secoesOrdem) {
        setOrdemSecoes(d.secoesOrdem.split(',').filter(Boolean))
      }
      if (d.menuGlobalOrdem) {
        setOrdemGlobal(d.menuGlobalOrdem.split(',').filter(Boolean))
      }
    }
    function onTelasUpdated() { setAutoReload(v => v + 1) }
    window.addEventListener('krontech:config-changed', onConfigChanged)
    window.addEventListener('krontech:telas-updated', onTelasUpdated)
    return () => {
      window.removeEventListener('krontech:config-changed', onConfigChanged)
      window.removeEventListener('krontech:telas-updated', onTelasUpdated)
    }
  }, [])

  useEffect(() => { if (autoReload > 0) carregarTelas(true) }, [autoReload])

  useEffect(() => { carregarTelas() }, [telasVersion])

  useEffect(() => {
    if (activePage === 'formbuilder') carregarTelas()
  }, [activePage])

  async function carregarPersonalizacao() {
    try {
      const cfg = await window.api.config.get()
      const p = cfg?.Personalizacao || {}
      if (p.nome_sistema)  setNomeSistema(p.nome_sistema)
      if (p.nome_usuario)  setNomeUsuario(p.nome_usuario)
      if (p.cargo_usuario) setCargoUsuario(p.cargo_usuario)
      setLabelsMenu({
        inicio:      p.label_inicio      || 'Início',
        gestao:      p.label_gestao      || 'Gestão',
        ferramentas: p.label_ferramentas || 'Ferramentas',
      })
      if (p.secoes_ordem) {
        setOrdemSecoes(p.secoes_ordem.split(',').filter(Boolean))
      }
      if (p.menu_global_ordem) {
        setOrdemGlobal(p.menu_global_ordem.split(',').filter(Boolean))
      }
    } catch { /* banco/config pode não estar pronto */ }
  }

  async function carregarTelas(showSpin = false) {
    if (showSpin) setReloading(true)
    try {
      const telas = await window.api.formBuilder.listarTelas(true)
      setTelasDin(telas)
      const extras = {}
      telas.forEach(t => { if (t.modulo_nome) extras[`din_${t.modulo_nome}`] = true })
      if (telas.length) setOpenGroups(prev => ({ ...prev, ...extras }))
    } catch { /* banco pode não estar pronto ainda */ }
    finally { if (showSpin) setReloading(false) }
  }

  function toggleGroup(id) {
    if (collapsed) return
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const gruposDin = {}
  telasDin.filter(t => !t.sistema).forEach(t => {
    const grp = t.modulo_nome || 'Minhas Telas'
    if (!gruposDin[grp]) gruposDin[grp] = []
    gruposDin[grp].push(t)
  })

  const buildDynGroup = (nome, telas) => ({
    id: `din_${nome}`,
    label: nome,
    items: telas.map(t => ({ id: `fb__${t.nome_tabela}`, label: t.nome_tela, Icon: telaIcon(t.icone) }))
  })

  let menu
  if (ordemGlobal.length) {
    const result = []
    const usedDin = new Set()
    ordemGlobal.forEach(sid => {
      if (sid.startsWith('din_')) {
        const nome = sid.slice(4)
        const tls = gruposDin[nome]
        if (!tls?.length) return
        usedDin.add(nome)
        result.push(buildDynGroup(nome, tls))
      } else {
        const base = MENU_BASE.find(g => g.id === sid)
        if (!base) return
        result.push({ ...base, label: labelsMenu[sid] || base.baseLabel })
      }
    })
    Object.entries(gruposDin).forEach(([nome, tls]) => {
      if (!usedDin.has(nome)) result.push(buildDynGroup(nome, tls))
    })
    menu = result
  } else {
    const menuFixo = ordemSecoes
      .map(id => MENU_BASE.find(g => g.id === id))
      .filter(Boolean)
      .map(g => ({ ...g, label: labelsMenu[g.id] || g.baseLabel }))
    menu = [
      ...menuFixo,
      ...Object.entries(gruposDin).map(([nome, tls]) => buildDynGroup(nome, tls))
    ]
  }

  const hh = agora.getHours()
  const mm  = String(agora.getMinutes()).padStart(2, '0')
  const ss  = String(agora.getSeconds()).padStart(2, '0')
  const horaStr = `${String(hh).padStart(2, '0')}:${mm}`
  const segStr  = ss

  // barra = tempo RESTANTE do dia (começa cheia, esvazia até meia-noite)
  const totalSeg   = 24 * 3600
  const segAtual   = hh * 3600 + agora.getMinutes() * 60 + agora.getSeconds()
  const segRestante = totalSeg - segAtual
  const barPct     = Math.round((segRestante / totalSeg) * 100)

  // tempo restante formatado
  const hRest = Math.floor(segRestante / 3600)
  const mRest = Math.floor((segRestante % 3600) / 60)
  const sRest = segRestante % 60
  const tempoRestante = hRest > 0
    ? `${hRest}h ${String(mRest).padStart(2,'0')}m restantes`
    : mRest > 0
      ? `${mRest}m ${String(sRest).padStart(2,'0')}s restantes`
      : `${String(sRest).padStart(2,'0')}s para o reset`

  function getSaudacao() {
    if (hh >= 5  && hh < 12) return 'Bom dia'
    if (hh >= 12 && hh < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  function getSubMsg() {
    if (hh >= 5  && hh < 12) return 'Cada hora conta. Domine o dia.'
    if (hh >= 12 && hh < 18) return 'A tarde é sua. Execute sem limites.'
    if (hh >= 18 && hh < 22) return 'Hora de fechar com chave de ouro.'
    return 'O mundo dorme. Você decide.'
  }

  return (
    <aside className={`sb${collapsed ? ' collapsed' : ''}`}>

      <button className="sb-toggle" onClick={() => setCollapsed(p => !p)}>
        <span className="sb-toggle-icon">
          <ChevronLeft size={11} strokeWidth={2.5} />
        </span>
      </button>

      <div className="sb-inner">

        <div className="sb-logo">
          <LogoIcon />
          <div className="sb-wordmark">
            <div className="sb-logo-name">
              {nomeSistema.length > 8
                ? nomeSistema
                : <>
                    {nomeSistema.slice(0, Math.ceil(nomeSistema.length / 2))}
                    <em>{nomeSistema.slice(Math.ceil(nomeSistema.length / 2))}</em>
                  </>
              }
            </div>
            <div className="sb-logo-tag">v{version} · {__BUILD_DATE__} · {__BUILD_TIME__}</div>
          </div>
        </div>

        <nav className="sb-scroll">
          {menu.map(group => (
            <div key={group.id} className="sb-group">
              <button className="sb-group-header" onClick={() => toggleGroup(group.id)}>
                <span className="sg-label">{group.label}</span>
                <span className={`sg-arrow ${openGroups[group.id] ? 'open' : 'closed'}`}>
                  <ChevronDown size={10} strokeWidth={2.5} />
                </span>
              </button>

              <div className={`sg-items ${openGroups[group.id] !== false ? 'open' : 'closed'}`}>
                {group.items.map(({ id, label, Icon, badge }) => (
                  <button
                    key={id}
                    className={`ni${activePage === id || (id === 'dashboard' && activePage === 'dashboard-designer') ? ' active' : ''}`}
                    data-tip={label}
                    onClick={() => id === 'formbuilder'
                      ? setDesignerConfirm(true)
                      : onNavigate(id)}
                  >
                    <span className="ni-icon">
                      <Icon size={16} strokeWidth={1.75} />
                    </span>
                    <span className="ni-label">{label}</span>
                    {badge > 0 && <span className="ni-badge">{badge}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="sb-bottom">

          <div className="sb-actions">
            <button
              className={`ni${activePage === 'configuracoes' ? ' active' : ''}`}
              data-tip="Personalização"
              onClick={() => onNavigate('configuracoes')}
            >
              <span className="ni-icon"><Settings size={16} strokeWidth={1.75} /></span>
              <span className="ni-label">Personalização</span>
            </button>

            <button
              className="ni"
              data-tip="Recarregar menu"
              disabled={reloading}
              onClick={() => carregarTelas(true)}
            >
              <span className="ni-icon">
                <RefreshCw size={16} strokeWidth={1.75} style={{ animation: reloading ? 'spin 0.8s linear infinite' : 'none' }} />
              </span>
              <span className="ni-label">{reloading ? 'Carregando...' : 'Recarregar menu'}</span>
            </button>
          </div>

          <div className="sb-welcome">
            {/* linha de acento animada */}
            <div className="sb-wel-accent" />

            <div className="sb-wel-top">
              {/* dot pulsante */}
              <span className="sb-wel-dot" />
              <span className="sb-wel-greet">{getSaudacao()}</span>
            </div>

            <div className="sb-wel-name">
              {(nomeUsuario || 'Usuário').toUpperCase()}
            </div>

            {/* relógio */}
            <div className="sb-wel-clock">
              <span className="sb-wel-clock-hm">{horaStr}</span>
              <span className="sb-wel-clock-sep">:</span>
              <span className="sb-wel-clock-ss">{segStr}</span>
            </div>

            {/* frase com efeito de digitação via CSS */}
            <div className="sb-wel-msg">
              <span className="sb-wel-msg-inner">{getSubMsg()}</span>
              <span className="sb-wel-cursor" />
            </div>

            {/* barra — tempo restante do dia */}
            <div className="sb-wel-bar-track">
              <div className="sb-wel-bar-fill" style={{ width: `${barPct}%` }} />
            </div>
            <div className="sb-wel-bar-label">
              <span className="sb-wel-bar-reset">↻ inicio de um novo dia em</span>
              <span className="sb-wel-bar-time">{tempoRestante}</span>
            </div>
          </div>

        </div>

      </div>

      {/* Modal confirmação KronTech Designer */}
      {designerConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--s1)', border: '1px solid var(--bd)',
            borderRadius: 14, padding: '28px 28px 22px',
            width: 320, boxShadow: '0 24px 64px rgba(0,0,0,.4)',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, flexShrink: 0 }}>
                <LogoIcon />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>KronTech Designer</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Abrir o criador de telas?</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" style={{ height: 32, fontSize: 12 }} onClick={() => setDesignerConfirm(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" style={{ height: 32, fontSize: 12 }} onClick={() => { setDesignerConfirm(false); window.api.designer?.open() }}>
                Abrir
              </button>
            </div>
          </div>
        </div>
      )}

    </aside>
  )
}

function LogoIcon() {
  return (
    <svg className="sb-logo-icon" viewBox="0 0 100 100" fill="none" overflow="visible">
      {/* anéis externos */}
      <circle cx="50" cy="50" r="47" fill="none" stroke="var(--or)" strokeWidth="1" strokeDasharray="2 10" opacity="0.22" style={{transformOrigin:'50px 50px',animation:'kr-rR 22s linear infinite'}}/>
      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--or)" strokeWidth="1.2" strokeDasharray="4 7" opacity="0.28" style={{transformOrigin:'50px 50px',animation:'kr-rR 32s linear infinite'}}/>
      {/* disco central */}
      <circle cx="50" cy="50" r="24" fill="var(--or)" fillOpacity="0.1" stroke="var(--or)" strokeWidth="1.2"/>
      {/* K branco / adaptativo */}
      <g strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="37" y1="36" x2="37" y2="64" stroke="var(--t1)" strokeWidth="3.5"/>
        <line x1="37" y1="50" x2="49" y2="36" stroke="var(--t1)" strokeWidth="3.5"/>
        <line x1="37" y1="50" x2="50" y2="64" stroke="var(--t1)" strokeWidth="3.5"/>
        {/* T laranja */}
        <line x1="55" y1="36" x2="68" y2="36" stroke="var(--or)" strokeWidth="3.5"/>
        <line x1="61.5" y1="36" x2="61.5" y2="64" stroke="var(--or)" strokeWidth="3.5"/>
      </g>
    </svg>
  )
}