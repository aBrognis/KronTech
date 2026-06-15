import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, CalendarDays, Package, Zap,
  Database, ChevronDown, ChevronLeft, FolderOpen, LayoutGrid, RefreshCw, Settings, LogOut
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

const MENU_DESIGNER = [
  {
    id: 'designer',
    baseLabel: 'Designer',
    items: [
      { id: 'telas',   label: 'Telas',   Icon: LayoutGrid },
      { id: 'modulos', label: 'Módulos', Icon: Package    },
      { id: 'funcoes', label: 'Funções', Icon: Zap        },
    ]
  }
]

const LABELS_KEY = { inicio: 'label_inicio', gestao: 'label_gestao', ferramentas: 'label_ferramentas' }

export default function Sidebar({ activePage, onNavigate, telasVersion = 0, hideFormbuilder = false, designerMode = false, sessao = null, onLogout }) {
  const [collapsed,      setCollapsed]      = useState(false)
  const [openGroups,     setOpenGroups]     = useState({ inicio: true, gestao: true, ferramentas: true, designer: true })
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
    } catch (e) { console.error('[Sidebar] carregarTelas:', e) }
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

  // Remove o item formbuilder se solicitado (ex: quando já estamos dentro do Designer)
  const filterItems = items => hideFormbuilder ? items.filter(i => i.id !== 'formbuilder') : items

  // Modo Designer: menu fixo com Telas/Módulos/Funções, sem telas dinâmicas
  let menu
  if (designerMode) {
    menu = MENU_DESIGNER
  } else if (ordemGlobal.length) {
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
        result.push({ ...base, items: filterItems(base.items), label: labelsMenu[sid] || base.baseLabel })
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
      .map(g => ({ ...g, items: filterItems(g.items), label: labelsMenu[g.id] || g.baseLabel }))
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

  // barra = tempo DECORRIDO do dia (cresce da esquerda, verde→amarelo→vermelho)
  const totalSeg   = 24 * 3600
  const segAtual   = hh * 3600 + agora.getMinutes() * 60 + agora.getSeconds()
  const barPct     = Math.round((segAtual / totalSeg) * 100)

  // cor do texto acompanha a posição na barra: verde→amarelo→vermelho
  const barTextColor = barPct < 40 ? '#22c55e' : barPct < 70 ? '#eab308' : '#ef4444'

  // tempo restante formatado
  const segRestante = totalSeg - segAtual
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

  const MSGS = {
    manha: [
      'Cada hora conta. Domine o dia.',
      'O dia é uma tela em branco. Pinte com propósito.',
      'Comece antes de estar pronto.',
      'A disciplina de hoje é a vitória de amanhã.',
      'Pequenos passos, grandes conquistas.',
      'Foque no que você pode controlar.',
      'Quem age cedo, colhe primeiro.',
      'A manhã pertence aos que se antecipam.',
      'Um passo agora vale dez depois.',
      'Clareza de manhã, resultado à noite.',
      'Construa hoje o que vai celebrar amanhã.',
      'Energia alta, foco total.',
      'O sucesso começa antes do café esfriar.',
      'Priorize o que move o ponteiro.',
      'Menos desculpa, mais ação.',
      'O dia não espera. Você também não deveria.',
      'Execute com intenção.',
      'Bom dia é o dia que você decide ser bom.',
      'Sua versão mais produtiva acorda cedo.',
      'Comece. O resto vem enquanto você anda.',
    ],
    tarde: [
      'A tarde é sua. Execute sem limites.',
      'Metade do dia feito — não desperdice a outra.',
      'Consistência bate talento todos os dias.',
      'Não espere a motivação. Aja primeiro.',
      'O progresso acontece um passo de cada vez.',
      'Feito é melhor que perfeito.',
      'Cada tarefa concluída é uma vitória.',
      'O cansaço passa. O resultado fica.',
      'Ajuste a rota, mas não pare o motor.',
      'A tarde decide o que a manhã prometeu.',
      'Foco é escassez bem gerenciada.',
      'Entregue mais do que o esperado.',
      'Quem não para, chega.',
      'O detalhe que você caprichar agora faz diferença.',
      'Mova o que importa. Ignore o resto.',
      'Produtividade é escolha, não talento.',
      'Cada hora investida tem juros.',
      'Não meça o esforço. Meça o impacto.',
      'A tarde eficiente salva a semana.',
      'Termine forte o que começou bem.',
    ],
    noiteCedo: [
      'Hora de fechar com chave de ouro.',
      'O que você entregou hoje?',
      'Revisar, ajustar, evoluir.',
      'O esforço de hoje vira resultado amanhã.',
      'Terminar bem é começar melhor.',
      'Cada entrega conta na construção do todo.',
      'Avalie o dia com honestidade.',
      'Feche pendências antes de fechar os olhos.',
      'O que ficou pra amanhã pode ser resolvido agora.',
      'Organize a mente antes de descansar.',
      'Um bom encerramento vale um bom começo.',
      'Celebre o que foi feito. Planeje o que vem.',
      'O fim do dia é o início do próximo.',
      'Gratidão pelo que foi. Foco no que vem.',
      'Quem reflete hoje, age melhor amanhã.',
      'Desacelere com propósito.',
      'O que você aprendeu hoje?',
      'A noite recarrega quem usou bem o dia.',
      'Fechar bem é tão importante quanto começar.',
      'Cada dia encerrado com intencionalidade conta.',
    ],
    noite: [
      'O mundo dorme. Você decide.',
      'Silêncio é combustível para quem sabe usar.',
      'Grandes ideias nascem quando tudo cala.',
      'A madrugada pertence a quem não desiste.',
      'O amanhã agradece o que você faz agora.',
      'Enquanto o mundo para, você avança.',
      'Na quietude, nasce a clareza.',
      'Noite funda, mente afiada.',
      'O silêncio da noite é o barulho do progresso.',
      'Quem trabalha no escuro, brilha na luz.',
      'A concentração da madrugada é um superpoder.',
      'Menos distrações, mais profundidade.',
      'A noite revela o que o dia esconde.',
      'Cada hora noturna vale por duas diurnas.',
      'Enquanto dormem, você constrói.',
      'O descanso também é estratégia.',
      'Noite é tempo de criar, não de desperdiçar.',
      'Quem planta na noite, colhe de manhã.',
      'O universo conspira com quem age.',
      'A última hora do dia pode ser a mais importante.',
    ],
  }

  const [msgIdx, setMsgIdx] = useState(0)
  const [msgVisible, setMsgVisible] = useState(true)

  const msgList = hh >= 5 && hh < 12 ? MSGS.manha
    : hh >= 12 && hh < 18 ? MSGS.tarde
    : hh >= 18 && hh < 22 ? MSGS.noiteCedo
    : MSGS.noite

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgVisible(false)
      setTimeout(() => {
        setMsgIdx(i => (i + 1) % msgList.length)
        setMsgVisible(true)
      }, 500)
    }, 8000)
    return () => clearInterval(interval)
  }, [msgList.length])

  function getSubMsg() {
    return msgList[msgIdx % msgList.length]
  }

  return (
    <>
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
            {!designerMode && (<>
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
              onClick={() => { carregarTelas(true); carregarPersonalizacao(); window.dispatchEvent(new CustomEvent('krontech:telas-updated')) }}
            >
              <span className="ni-icon">
                <RefreshCw size={16} strokeWidth={1.75} style={{ animation: reloading ? 'spin 0.8s linear infinite' : 'none' }} />
              </span>
              <span className="ni-label">{reloading ? 'Carregando...' : 'Recarregar menu'}</span>
            </button>
            {onLogout && (
            <button className="ni" data-tip="Sair" onClick={onLogout}>
              <span className="ni-icon">
                <LogOut size={16} strokeWidth={1.75} />
              </span>
              <span className="ni-label">Sair</span>
            </button>
            )}
            </>)}
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
              {(sessao?.nome || nomeUsuario || 'Usuário').toUpperCase()}
            </div>

            {/* relógio */}
            <div className="sb-wel-clock">
              <span className="sb-wel-clock-hm">{horaStr}</span>
              <span className="sb-wel-clock-sep">:</span>
              <span className="sb-wel-clock-ss">{segStr}</span>
            </div>

            {/* frase com efeito de digitação via CSS */}
            <div className="sb-wel-msg">
              <span className="sb-wel-msg-inner" style={{ opacity: msgVisible ? 1 : 0, transition: 'opacity 0.5s ease' }}>{getSubMsg()}</span>
              <span className="sb-wel-cursor" />
            </div>

            {/* barra — tempo decorrido do dia */}
            <div className="sb-wel-bar-track">
              <div className="sb-wel-bar-fill" style={{
                width: `${barPct}%`,
                backgroundImage: 'linear-gradient(90deg, #22c55e 0%, #eab308 50%, #ef4444 100%)',
                backgroundSize: `${(100 / Math.max(barPct, 1)) * 100}% 100%`,
                backgroundPosition: 'left center',
              }} />
            </div>
            <div className="sb-wel-bar-label">
              <span className="sb-wel-bar-reset">↻ inicio de um novo dia em</span>
              <span className="sb-wel-bar-time" style={{ color: barTextColor }}>{tempoRestante}</span>
            </div>
          </div>

        </div>

      </div>

    </aside>

      {/* Modal confirmação KronTech Designer — fora do aside para cobrir tela toda */}
      {designerConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)',
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
              <button className="btn btn-primary" style={{ height: 32, fontSize: 12 }} onClick={() => { setDesignerConfirm(false); window.api.designer?.open() }}>
                Abrir
              </button>
              <button className="btn btn-ghost" style={{ height: 32, fontSize: 12 }} onClick={() => setDesignerConfirm(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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