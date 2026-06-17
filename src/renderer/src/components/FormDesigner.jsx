import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Type, Hash, DollarSign, Calendar, ToggleLeft,
  AlignLeft, List, Mail, Phone, Move, CircleDot, Tag, Barcode, Minus,
  Undo2, Redo2, ZoomIn, ZoomOut, Copy, Trash2, Layers,
  ChevronUp, ChevronDown, ChevronsUp, ChevronsDown,
  ChevronLeft, ChevronRight, Star, Clock, MousePointerClick,
  Eye, EyeOff, LayoutGrid, Search, Ruler, CreditCard, Building2, MapPin, CheckSquare,
  Paperclip, ImageIcon, StarHalf, Percent, Palette, Link, Timer, Calculator, CalendarClock, Gauge,
} from 'lucide-react'

export const CANVAS_W    = 780
export const CANVAS_H_MIN = 480
export const SNAP        = 8
const GUIDE_T = 12

const TIPO_ICONS = {
  texto:       Type,    numero:      Hash,
  moeda:       DollarSign, data:    Calendar,
  booleano:    ToggleLeft, texto_longo: AlignLeft,
  select:      List,    radio:       CircleDot,
  tags:        Tag,     codigo_auto: Barcode,
  email:       Mail,    telefone:    Phone,
  divisor:     Minus,   botao:       MousePointerClick,
  favorito:    Star,    timestamps:  Clock,    copiar: Copy,
  cpf:         CreditCard, cnpj:    Building2, cep: MapPin,
  documento:   CreditCard, flags:   CheckSquare,
  arquivo:     Paperclip,  imagem:  ImageIcon,
  avaliacao:   Star,       progresso: Gauge,
  cor:         Palette,    url:     Link,
  data_hora:   CalendarClock, hora: Timer,
  percentual:  Percent,   calculo:  Calculator,
}

const TIPO_H_DEFAULT = { texto_longo: 120, booleano: 44, radio: 52, divisor: 24, timestamps: 80, favorito: 44, copiar: 44, imagem: 180, avaliacao: 48, progresso: 52, calculo: 48, cor: 48, url: 48 }

const TIPOS_PANEL = [
  { valor: 'texto',       label: 'Texto',      Icon: Type              },
  { valor: 'numero',      label: 'Número',     Icon: Hash              },
  { valor: 'moeda',       label: 'Moeda',      Icon: DollarSign        },
  { valor: 'data',        label: 'Data',       Icon: Calendar          },
  { valor: 'booleano',    label: 'Sim/Não',    Icon: ToggleLeft        },
  { valor: 'texto_longo', label: 'T.Longo',    Icon: AlignLeft         },
  { valor: 'select',      label: 'Select',     Icon: List              },
  { valor: 'radio',       label: 'Radio',      Icon: CircleDot         },
  { valor: 'email',       label: 'E-mail',     Icon: Mail              },
  { valor: 'telefone',    label: 'Tel.',        Icon: Phone             },
  { valor: 'codigo_auto', label: 'Cód.Auto',   Icon: Barcode           },
  { valor: 'tags',        label: 'Tags',       Icon: Tag               },
  { valor: 'divisor',     label: 'Divisor',    Icon: Minus             },
  { valor: 'botao',       label: 'Botão',      Icon: MousePointerClick },
  { valor: 'favorito',    label: 'Favorito',   Icon: Star              },
  { valor: 'timestamps',  label: 'Datas',      Icon: Clock             },
  { valor: 'copiar',      label: 'Copiar',     Icon: Copy              },
  { valor: 'cpf',         label: 'CPF',        Icon: CreditCard        },
  { valor: 'cnpj',        label: 'CNPJ',       Icon: Building2         },
  { valor: 'cep',         label: 'CEP',        Icon: MapPin            },
  { valor: 'documento',   label: 'CPF/CNPJ',   Icon: CreditCard        },
  { valor: 'flags',       label: 'Flags',      Icon: CheckSquare       },
  { valor: 'arquivo',     label: 'Arquivo',    Icon: Paperclip         },
  { valor: 'imagem',      label: 'Imagem',     Icon: ImageIcon         },
  { valor: 'avaliacao',   label: 'Avaliação',  Icon: Star              },
  { valor: 'progresso',   label: 'Progresso',  Icon: Gauge             },
  { valor: 'cor',         label: 'Cor',        Icon: Palette           },
  { valor: 'url',         label: 'URL',        Icon: Link              },
  { valor: 'data_hora',   label: 'Data+Hora',  Icon: CalendarClock     },
  { valor: 'hora',        label: 'Hora',       Icon: Timer             },
  { valor: 'percentual',  label: 'Percentual', Icon: Percent           },
  { valor: 'calculo',     label: 'Cálculo',    Icon: Calculator        },
]

const TIPOS_DESIGNER = [
  { valor: 'texto',       label: 'Texto' },
  { valor: 'numero',      label: 'Número' },
  { valor: 'moeda',       label: 'Moeda (R$)' },
  { valor: 'data',        label: 'Data' },
  { valor: 'booleano',    label: 'Sim / Não' },
  { valor: 'texto_longo', label: 'Texto Longo' },
  { valor: 'select',      label: 'Lista (select)' },
  { valor: 'radio',       label: 'Radio colorido' },
  { valor: 'tags',        label: 'Tags' },
  { valor: 'codigo_auto', label: 'Código automático' },
  { valor: 'email',       label: 'E-mail' },
  { valor: 'telefone',    label: 'Telefone' },
  { valor: 'lookup',      label: 'Lookup' },
  { valor: 'cpf',         label: 'CPF' },
  { valor: 'cnpj',        label: 'CNPJ (busca automática)' },
  { valor: 'cep',         label: 'CEP (busca automática)' },
  { valor: 'documento',   label: 'CPF / CNPJ (Física ou Jurídica)' },
  { valor: 'flags',       label: 'Flags (checkboxes com código)' },
  { valor: 'arquivo',     label: 'Arquivo (upload)' },
  { valor: 'imagem',      label: 'Imagem (upload)' },
  { valor: 'avaliacao',   label: 'Avaliação (estrelas)' },
  { valor: 'progresso',   label: 'Barra de Progresso' },
  { valor: 'cor',         label: 'Seletor de Cor' },
  { valor: 'url',         label: 'URL / Link' },
  { valor: 'data_hora',   label: 'Data e Hora' },
  { valor: 'hora',        label: 'Hora' },
  { valor: 'percentual',  label: 'Percentual (%)' },
  { valor: 'calculo',     label: 'Campo Calculado' },
]

function s(v) { return Math.max(0, Math.round(v / SNAP) * SNAP) }

export function autoPos(campos, tipo, opcoes) {
  const maxY = campos.reduce((m, c) => Math.max(m, (c.y_pos || 0) + (c.h_px || 60)), 0)
  let h = TIPO_H_DEFAULT[tipo] || 60
  if ((tipo === 'flags' || tipo === 'radio') && Array.isArray(opcoes) && opcoes.length > 0) {
    // header(28) + padding(16) + per-item(22) * n
    h = 28 + 16 + opcoes.length * 22
  }
  return {
    x_pos: 0,
    y_pos: maxY > 0 ? maxY + SNAP : 0,
    w_px:  (tipo === 'texto_longo' || tipo === 'divisor') ? CANVAS_W : 280,
    h_px:  h,
  }
}

// ── Context menu item ─────────────────────────────────────────────────────────
function CtxItem({ icon: Icon, label, shortcut, onClick, danger, disabled }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: 'calc(100% - 8px)', margin: '1px 4px',
        border: 'none', background: hov ? 'var(--s3)' : 'none',
        borderRadius: 6, padding: '5px 10px', cursor: disabled ? 'default' : 'pointer',
        textAlign: 'left', fontSize: 12,
        color: disabled ? 'var(--t3)' : danger ? 'var(--red)' : 'var(--t1)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {Icon && <Icon size={12} style={{ flexShrink: 0 }} />}
      <span style={{ flex: 1 }}>{label}</span>
      {shortcut && <span style={{ fontSize: 10, color: 'var(--t3)' }}>{shortcut}</span>}
    </button>
  )
}

// ── Toolbar button ────────────────────────────────────────────────────────────
function TbBtn({ children, title, onClick, active, danger, disabled }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        border: `1px solid ${active ? 'var(--or)' : 'var(--bd)'}`,
        borderRadius: 7, background: active ? 'rgba(255,107,43,.12)' : hov ? 'var(--s3)' : 'var(--s2)',
        cursor: disabled ? 'default' : 'pointer',
        padding: '4px 8px',
        color: danger ? 'var(--red)' : active ? 'var(--or)' : 'var(--t2)',
        fontSize: 11, fontFamily: 'inherit',
        opacity: disabled ? 0.4 : 1,
        transition: 'var(--tr)',
      }}
    >
      {children}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
const MM_TO_PX = 96 / 25.4

export default function FormDesigner({
  campos, onChange,
  canvasConfigW = CANVAS_W, canvasConfigH = CANVAS_H_MIN, onCanvasConfig,
  livePreview = false,   onLivePreview,
  showGrid = true,       onShowGrid,
  showRulers = false,    onShowRulers,
  snapSz = SNAP,         onSnapSz,
  canvasMargins = { top: 0, bottom: 0, left: 0, right: 0 },
  onCanvasMargins,
}) {

  // ── State ──────────────────────────────────────────────────────────────────
  const [selected,   setSelected]   = useState(new Set())
  const [zoom,       setZoom]       = useState(1)
  const [marquee,    setMarquee]    = useState(null)   // { x1,y1,x2,y2 }
  const [guides,     setGuides]     = useState([])     // [{ type:'v'|'h', value:number }]
  const [ctxMenu,    setCtxMenu]    = useState(null)   // { x, y }
  const [containerH,      setContainerH]      = useState(CANVAS_H_MIN)
  const [containerW,      setContainerW]      = useState(CANVAS_W)
  const [panelCollapsed,  setPanelCollapsed]  = useState(false)
  const [panelTab,        setPanelTab]        = useState('campos') // 'campos' | 'canvas' | 'atalhos'

  // ── Refs ───────────────────────────────────────────────────────────────────
  const dragging   = useRef(null)
  const resizing   = useRef(null)
  const marqueeRef = useRef(null)
  const canvasRef  = useRef(null)
  const scrollRef  = useRef(null)
  const clipboard  = useRef([])
  const history    = useRef({ past: [], future: [] })

  // Mirrors to avoid stale closures in window event handlers
  const selectedRef = useRef(selected)
  const camposRef   = useRef(campos)
  const zoomRef     = useRef(zoom)
  const snapSzRef   = useRef(snapSz)
  useEffect(() => { selectedRef.current = selected }, [selected])
  useEffect(() => { camposRef.current   = campos   }, [campos])
  useEffect(() => { zoomRef.current     = zoom     }, [zoom])
  useEffect(() => { snapSzRef.current   = snapSz   }, [snapSz])

  const sn = useCallback((v) => Math.max(0, Math.round(v / snapSz) * snapSz), [snapSz])

  // ── History ────────────────────────────────────────────────────────────────
  const snapshot = useCallback(() => {
    history.current.past.push(camposRef.current.map(c => ({ ...c })))
    history.current.future = []
  }, [])

  const undo = useCallback(() => {
    const { past, future } = history.current
    if (!past.length) return
    const prev = past.pop()
    future.push(camposRef.current.map(c => ({ ...c })))
    onChange(() => prev)
  }, [onChange])

  const redo = useCallback(() => {
    const { past, future } = history.current
    if (!future.length) return
    const next = future.pop()
    past.push(camposRef.current.map(c => ({ ...c })))
    onChange(() => next)
  }, [onChange])

  const updateLayout = useCallback((key, patch) => {
    onChange(prev => prev.map(c => c._key === key ? { ...c, ...patch } : c))
  }, [onChange])

  const updateProp = useCallback((key, patch) => {
    snapshot()
    onChange(prev => prev.map(c => c._key === key ? { ...c, ...patch } : c))
  }, [onChange, snapshot])

  function addCampo(tipo) {
    const pos = autoPos(campos, tipo)
    const label = tipo.charAt(0).toUpperCase() + tipo.slice(1).replace('_', ' ')
    const novo = {
      _key: Math.random().toString(36).slice(2),
      nomeCampo: '', label,
      tipo, tamanho: 100, obrigatorio: false, sequencial: false,
      campoBusca: false, valorPadrao: '', largura: 50, opcoes: null,
      ...pos,
    }
    snapshot()
    onChange(prev => [...prev, novo])
    setSelected(new Set([novo._key]))
  }

  // ── Smart guides ────────────────────────────────────────────────────────────
  function computeGuides(draggingCampos, allCampos) {
    const others = allCampos.filter(c => !draggingCampos.find(d => d._key === c._key))
    // Collect candidates: { type, movingEdge, value, dist }
    const candidates = []
    draggingCampos.forEach(dc => {
      const dL = dc.x_pos || 0, dT = dc.y_pos || 0
      const dR = dL + (dc.w_px || 280), dB = dT + (dc.h_px || 60)
      const dMX = (dL + dR) / 2, dMY = (dT + dB) / 2
      others.forEach(oc => {
        const oL = oc.x_pos || 0, oT = oc.y_pos || 0
        const oR = oL + (oc.w_px || 280), oB = oT + (oc.h_px || 60)
        const oMX = (oL + oR) / 2, oMY = (oT + oB) / 2
        ;[[dL,oL],[dL,oR],[dL,oMX],[dR,oL],[dR,oR],[dR,oMX],[dMX,oMX]].forEach(([a,b]) => {
          const dist = Math.abs(a - b)
          if (dist < GUIDE_T) candidates.push({ type:'v', movingEdge:a, value:b, dist })
        })
        ;[[dT,oT],[dT,oB],[dT,oMY],[dB,oT],[dB,oB],[dB,oMY],[dMY,oMY]].forEach(([a,b]) => {
          const dist = Math.abs(a - b)
          if (dist < GUIDE_T) candidates.push({ type:'h', movingEdge:a, value:b, dist })
        })
      })
    })
    // Per moving edge, keep only the closest static edge
    const best = {}
    candidates.forEach(c => {
      const k = `${c.type}-${c.movingEdge}`
      if (!best[k] || c.dist < best[k].dist) best[k] = c
    })
    // Deduplicate by value (same static line shown once)
    const seen = new Set()
    return Object.values(best).filter(g => {
      const k = `${g.type}-${Math.round(g.value)}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }

  // ── Mouse move / up ─────────────────────────────────────────────────────────
  useEffect(() => {
    function onMove(e) {
      const snp = v => Math.max(0, Math.round(v / snapSzRef.current) * snapSzRef.current)

      if (dragging.current) {
        const { fields, startMX, startMY } = dragging.current
        const z  = zoomRef.current
        const dx = (e.clientX - startMX) / z
        const dy = (e.clientY - startMY) / z

        if (!dragging.current.snapshotted && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
          snapshot()
          dragging.current.snapshotted = true
        }

        const newPos = {}
        fields.forEach(f => {
          const c = camposRef.current.find(c => c._key === f.key)
          if (!c) return
          newPos[f.key] = {
            x_pos: snp(Math.max(0, Math.min(canvasConfigW - (c.w_px || 80), f.startX + dx))),
            y_pos: snp(Math.max(0, f.startY + dy)),
          }
        })
        onChange(prev => prev.map(c => { const p = newPos[c._key]; return p ? { ...c, ...p } : c }))

        const dk = new Set(Object.keys(newPos))
        const updAll = camposRef.current.map(c => { const p = newPos[c._key]; return p ? { ...c, ...p } : c })
        setGuides(computeGuides(updAll.filter(c => dk.has(c._key)), updAll))
      }

      if (resizing.current) {
        const { key, startMX, startMY, startW, startH, fieldX, fieldY } = resizing.current
        const z = zoomRef.current
        if (!resizing.current.snapshotted) { snapshot(); resizing.current.snapshotted = true }
        const w = snp(Math.max(32, Math.min(canvasConfigW - (fieldX || 0), startW + (e.clientX - startMX) / z)))
        const h = snp(Math.max(16, startH + (e.clientY - startMY) / z))
        updateLayout(key, { w_px: w, h_px: h })

        const updAll = camposRef.current.map(c => c._key === key ? { ...c, w_px: w, h_px: h } : c)
        setGuides(computeGuides(updAll.filter(c => c._key === key), updAll))
      }

      if (marqueeRef.current) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const z  = zoomRef.current
        const x2 = (e.clientX - rect.left) / z
        const y2 = (e.clientY - rect.top)  / z
        marqueeRef.current = { ...marqueeRef.current, x2, y2 }
        setMarquee({ ...marqueeRef.current })
        const { x1, y1 } = marqueeRef.current
        const L = Math.min(x1,x2), T = Math.min(y1,y2), R = Math.max(x1,x2), B = Math.max(y1,y2)
        const keys = camposRef.current
          .filter(c => { const cx=c.x_pos||0,cy=c.y_pos||0,cw=c.w_px||280,ch=c.h_px||60; return cx<R&&cx+cw>L&&cy<B&&cy+ch>T })
          .map(c => c._key)
        setSelected(new Set(keys))
      }
    }

    function onUp() {
      setGuides([])
      if (marqueeRef.current) { marqueeRef.current = null; setMarquee(null) }
      dragging.current = null
      resizing.current = null
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [updateLayout, canvasConfigW, onChange, snapshot])

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const sel = selectedRef.current
      const cur = camposRef.current
      const ctrl = e.ctrlKey || e.metaKey

      if (e.key === 'Escape')            { setSelected(new Set()); setCtxMenu(null); return }
      if (ctrl && e.key === 'a')         { e.preventDefault(); setSelected(new Set(cur.map(c => c._key))); return }
      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return }

      if (ctrl && e.key === 'c') {
        clipboard.current = cur.filter(c => sel.has(c._key)).map(c => ({ ...c })); return
      }
      if (ctrl && e.key === 'v') {
        e.preventDefault()
        if (!clipboard.current.length) return
        snapshot()
        const pasted = clipboard.current.map(c => ({ ...c, _key: Math.random().toString(36).slice(2), id: undefined, x_pos: (c.x_pos||0)+16, y_pos: (c.y_pos||0)+16 }))
        onChange(prev => [...prev, ...pasted])
        setSelected(new Set(pasted.map(c => c._key))); return
      }
      if (ctrl && e.key === 'd') {
        e.preventDefault()
        if (!sel.size) return
        snapshot()
        const duped = cur.filter(c => sel.has(c._key)).map(c => ({ ...c, _key: Math.random().toString(36).slice(2), id: undefined, x_pos: (c.x_pos||0)+16, y_pos: (c.y_pos||0)+16 }))
        onChange(prev => [...prev, ...duped])
        setSelected(new Set(duped.map(c => c._key))); return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel.size) {
        e.preventDefault(); snapshot()
        onChange(prev => prev.filter(c => !sel.has(c._key))); setSelected(new Set()); return
      }
      const ARROW = { ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1] }
      if (ARROW[e.key] && sel.size) {
        e.preventDefault()
        const step = e.shiftKey ? snapSzRef.current : 1
        const [ddx, ddy] = ARROW[e.key]
        onChange(prev => prev.map(c => sel.has(c._key) ? { ...c, x_pos: Math.max(0,(c.x_pos||0)+ddx*step), y_pos: Math.max(0,(c.y_pos||0)+ddy*step) } : c))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onChange, undo, redo, snapshot])

  // ── Ctrl+Wheel zoom ─────────────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = e => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const d = e.deltaY < 0 ? 0.1 : -0.1
      setZoom(z => Math.max(0.25, Math.min(3, parseFloat((z + d).toFixed(2)))))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // ── Context menu dismiss ────────────────────────────────────────────────────
  useEffect(() => {
    if (!ctxMenu) return
    const timer = setTimeout(() => {
      const dismiss = () => setCtxMenu(null)
      window.addEventListener('click', dismiss, { once: true })
    }, 30)
    return () => clearTimeout(timer)
  }, [ctxMenu])

  // ── ResizeObserver ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!scrollRef.current) return
    const obs = new ResizeObserver(([e]) => {
      setContainerH(e.contentRect.height)
      setContainerW(e.contentRect.width)
    })
    obs.observe(scrollRef.current)
    return () => obs.disconnect()
  }, [])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const canvasH = Math.max(containerH, canvasConfigH, ...campos.map(c => (c.y_pos||0)+(c.h_px||60)+80))
  const canvasW = Math.max(containerW, canvasConfigW)
  const selCampos = campos.filter(c => selected.has(c._key))
  const selSingle = selCampos.length === 1 ? selCampos[0] : null
  const selMulti  = selCampos.length > 1

  // ── Z-order ──────────────────────────────────────────────────────────────────
  function bringToFront() { snapshot(); const k=[...selected]; onChange(p=>[...p.filter(c=>!k.includes(c._key)),...p.filter(c=>k.includes(c._key))]) }
  function sendToBack()   { snapshot(); const k=[...selected]; onChange(p=>[...p.filter(c=>k.includes(c._key)),...p.filter(c=>!k.includes(c._key))]) }
  function bringForward() {
    snapshot(); const k=[...selected]
    onChange(p => { const a=[...p]; [...k].reverse().forEach(key => { const i=a.findIndex(c=>c._key===key); if(i<a.length-1)[a[i],a[i+1]]=[a[i+1],a[i]] }); return a })
  }
  function sendBackward() {
    snapshot(); const k=[...selected]
    onChange(p => { const a=[...p]; k.forEach(key => { const i=a.findIndex(c=>c._key===key); if(i>0)[a[i],a[i-1]]=[a[i-1],a[i]] }); return a })
  }

  // ── Delete / Duplicate ───────────────────────────────────────────────────────
  function deleteSelected() {
    if (!selected.size) return; snapshot()
    onChange(prev => prev.filter(c => !selected.has(c._key))); setSelected(new Set()); setCtxMenu(null)
  }
  function duplicateSelected() {
    if (!selected.size) return; snapshot()
    const duped = campos.filter(c => selected.has(c._key)).map(c => ({ ...c, _key: Math.random().toString(36).slice(2), id: undefined, x_pos:(c.x_pos||0)+16, y_pos:(c.y_pos||0)+16 }))
    onChange(prev => [...prev, ...duped]); setSelected(new Set(duped.map(c=>c._key))); setCtxMenu(null)
  }

  // ── Alignment ───────────────────────────────────────────────────────────────
  function alignLeft()   { const v=Math.min(...selCampos.map(c=>c.x_pos||0)); onChange(p=>p.map(c=>selected.has(c._key)?{...c,x_pos:v}:c)) }
  function alignRight()  { const v=Math.max(...selCampos.map(c=>(c.x_pos||0)+(c.w_px||280))); onChange(p=>p.map(c=>selected.has(c._key)?{...c,x_pos:sn(v-(c.w_px||280))}:c)) }
  function alignTop()    { const v=Math.min(...selCampos.map(c=>c.y_pos||0)); onChange(p=>p.map(c=>selected.has(c._key)?{...c,y_pos:v}:c)) }
  function alignBottom() { const v=Math.max(...selCampos.map(c=>(c.y_pos||0)+(c.h_px||60)));  onChange(p=>p.map(c=>selected.has(c._key)?{...c,y_pos:sn(v-(c.h_px||60))}:c)) }
  function centerHoriz() { onChange(p=>p.map(c=>selected.has(c._key)?{...c,x_pos:sn((canvasConfigW-(c.w_px||280))/2)}:c)) }
  function centerVert()  { const cy=(Math.min(...selCampos.map(c=>c.y_pos||0))+Math.max(...selCampos.map(c=>(c.y_pos||0)+(c.h_px||60))))/2; onChange(p=>p.map(c=>selected.has(c._key)?{...c,y_pos:sn(cy-(c.h_px||60)/2)}:c)) }
  function distributeH() {
    if (selCampos.length<3) return
    const srt=[...selCampos].sort((a,b)=>(a.x_pos||0)-(b.x_pos||0))
    const span=(srt[srt.length-1].x_pos||0)+(srt[srt.length-1].w_px||280)-(srt[0].x_pos||0)
    const tw=srt.reduce((a,c)=>a+(c.w_px||280),0), gap=(span-tw)/(srt.length-1)
    let x=srt[0].x_pos||0; const mp={}; srt.forEach(c=>{mp[c._key]=sn(x);x+=(c.w_px||280)+gap})
    onChange(p=>p.map(c=>mp[c._key]!==undefined?{...c,x_pos:mp[c._key]}:c))
  }
  function distributeV() {
    if (selCampos.length<3) return
    const srt=[...selCampos].sort((a,b)=>(a.y_pos||0)-(b.y_pos||0))
    const span=(srt[srt.length-1].y_pos||0)+(srt[srt.length-1].h_px||60)-(srt[0].y_pos||0)
    const th=srt.reduce((a,c)=>a+(c.h_px||60),0), gap=(span-th)/(srt.length-1)
    let y=srt[0].y_pos||0; const mp={}; srt.forEach(c=>{mp[c._key]=sn(y);y+=(c.h_px||60)+gap})
    onChange(p=>p.map(c=>mp[c._key]!==undefined?{...c,y_pos:mp[c._key]}:c))
  }
  function sameWidth()  { const r=selCampos[0]?.w_px||280; onChange(p=>p.map(c=>selected.has(c._key)?{...c,w_px:r}:c)) }
  function sameHeight() { const r=selCampos[0]?.h_px||60;  onChange(p=>p.map(c=>selected.has(c._key)?{...c,h_px:r}:c)) }

  // ── Auto-layout ──────────────────────────────────────────────────────────────

  // ── Canvas mousedown (marquee) ───────────────────────────────────────────────
  function handleCanvasMD(e) {
    if (e.button !== 0) return
    setSelected(new Set()); setCtxMenu(null)
    const rect = canvasRef.current.getBoundingClientRect()
    const z = zoomRef.current
    const x1 = (e.clientX - rect.left) / z
    const y1 = (e.clientY - rect.top)  / z
    marqueeRef.current = { x1, y1, x2: x1, y2: y1 }
    setMarquee({ x1, y1, x2: x1, y2: y1 })
  }

  // ── Live field renderer ───────────────────────────────────────────────────────
  function renderFieldLive(campo) {
    const ops = Array.isArray(campo.opcoes) ? campo.opcoes : []
    const NO_WRAPPER = ['botao', 'favorito', 'timestamps', 'copiar', 'divisor']
    const SKIP_LABEL = ['booleano', 'botao', 'favorito', 'timestamps']

    function fieldInner() {
      if (campo.tipo === 'botao') {
        let cfg = {}; try { cfg = JSON.parse(campo.valorPadrao || '{}') } catch {}
        return <button className={`btn btn-${cfg.variant || 'ghost'}`} disabled style={{ width:'100%', height:'100%', fontSize:12 }}>{campo.label || 'Botão'}</button>
      }
      if (campo.tipo === 'favorito') return (
        <label className="fav-check" style={{ height:'100%', display:'flex', alignItems:'center', pointerEvents:'none' }}>
          <input type="checkbox" disabled style={{ accentColor:'var(--or)' }}/>
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12 }}>Marcar como favorito <Star size={13}/></span>
        </label>
      )
      if (campo.tipo === 'timestamps') return (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, height:'100%', alignContent:'center' }}>
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label" style={{ fontSize:10 }}>Criado em</label>
            <div className="form-input" style={{ fontSize:11, display:'flex', alignItems:'center', height:32, cursor:'default', background:'#fff', color:'#333', border:'1px solid #ddd' }}>—</div>
          </div>
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label" style={{ fontSize:10 }}>Atualizado em</label>
            <div className="form-input" style={{ fontSize:11, display:'flex', alignItems:'center', height:32, cursor:'default', background:'#fff', color:'#333', border:'1px solid #ddd' }}>—</div>
          </div>
        </div>
      )
      if (campo.tipo === 'copiar') return (
        <button disabled className="btn btn-ghost" style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontSize:11 }}>
          <Copy size={11}/> {campo.label || 'Copiar'}
        </button>
      )
      if (campo.tipo === 'booleano') return (
        <label className="fav-check" style={{ height:'100%', display:'flex', alignItems:'center', pointerEvents:'none' }}>
          <input type="checkbox" disabled style={{ accentColor:'var(--or)' }}/>
          <span style={{ fontSize:12 }}>{campo.label}</span>
        </label>
      )
      if (campo.tipo === 'texto_longo') return (
        <textarea className="form-textarea" disabled placeholder={campo.valorPadrao || 'Texto longo...'}
          style={{ width:'100%', height:'100%', minHeight:'unset', resize:'none', boxSizing:'border-box', fontSize:12 }}/>
      )
      if (campo.tipo === 'select') return (
        <select className="form-select" disabled style={{ width:'100%', height:'100%', fontSize:12 }}>
          <option>— selecione —</option>
          {ops.map((o, i) => <option key={i}>{o.label}</option>)}
        </select>
      )
      if (campo.tipo === 'radio') return (
        <div style={{ display:'flex', alignItems:'center', gap:14, height:'100%', padding:'0 12px', background:'#fff', border:'1.5px solid #ddd', borderRadius:10, flexWrap:'wrap', boxSizing:'border-box', width:'100%' }}>
          {ops.length ? ops.map((o, i) => (
            <label key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11.5, color:o.cor||'var(--t2)', fontWeight:600, userSelect:'none' }}>
              <input type="radio" disabled style={{ accentColor:o.cor||'var(--or)', width:13, height:13 }}/>{o.label}
            </label>
          )) : <span style={{ fontSize:11, color:'var(--t3)', fontStyle:'italic' }}>Sem opções</span>}
        </div>
      )
      if (campo.tipo === 'tags') return (
        <div style={{ display:'flex', alignItems:'center', gap:4, height:'100%', padding:'0 8px', background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:8, fontSize:11, flexWrap:'wrap', overflow:'hidden' }}>
          {campo.valorPadrao
            ? campo.valorPadrao.split(',').map((t,i) => <span key={i} style={{ background:'var(--s3)', borderRadius:4, padding:'1px 6px', color:'var(--t2)' }}>{t.trim()}</span>)
            : <span style={{ color:'var(--t3)' }}>tag1, tag2...</span>}
        </div>
      )
      if (campo.tipo === 'codigo_auto') return (
        <div className="form-input" style={{ display:'flex', alignItems:'center', height:'100%', fontFamily:'monospace', fontWeight:700, fontSize:13, color:'var(--or)', letterSpacing:2 }}>001</div>
      )
      if (campo.tipo === 'lookup') {
        const cfg = (campo.opcoes && !Array.isArray(campo.opcoes)) ? campo.opcoes : {}
        return (
          <div style={{ display:'flex', gap:4, height:'100%' }}>
            <div className="form-input" style={{ flex:1, height:'100%', display:'flex', alignItems:'center', fontSize:12, color:'var(--t3)', fontStyle:'italic' }}>
              {cfg.lookupTabela ? `← ${cfg.lookupTabela}` : '— nenhum —'}
            </div>
            <button className="btn btn-ghost" style={{ flexShrink:0, padding:'0 8px', height:'100%' }} disabled><Search size={13}/></button>
          </div>
        )
      }
      if (campo.tipo === 'data') return (
        <input className="form-input" type="date" disabled style={{ width:'100%', height:'100%' }}/>
      )
      if (campo.tipo === 'data_hora') return (
        <input className="form-input" type="datetime-local" disabled style={{ width:'100%', height:'100%' }}/>
      )
      if (campo.tipo === 'hora') return (
        <input className="form-input" type="time" disabled style={{ width:'100%', height:'100%' }}/>
      )
      if (campo.tipo === 'url') return (
        <div style={{ display:'flex', gap:4, height:'100%' }}>
          <div className="form-input" style={{ flex:1, height:'100%', display:'flex', alignItems:'center', fontSize:12, color:'#3B82F6', fontStyle:'italic' }}>
            <Link size={11} style={{ marginRight:4, flexShrink:0 }}/>{campo.valorPadrao || 'https://...'}
          </div>
        </div>
      )
      if (campo.tipo === 'arquivo') return (
        <div style={{ display:'flex', alignItems:'center', gap:6, height:'100%', padding:'0 10px', background:'var(--s2)', border:'1.5px dashed var(--bd)', borderRadius:8, boxSizing:'border-box', width:'100%' }}>
          <Paperclip size={13} style={{ color:'var(--t3)', flexShrink:0 }}/>
          <span style={{ fontSize:11, color:'var(--t3)', fontStyle:'italic' }}>Clique para anexar arquivo...</span>
        </div>
      )
      if (campo.tipo === 'imagem') return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', background:'var(--s2)', border:'1.5px dashed var(--bd)', borderRadius:8, boxSizing:'border-box', width:'100%', gap:6 }}>
          <ImageIcon size={24} style={{ color:'var(--bd2)' }}/>
          <span style={{ fontSize:10, color:'var(--t3)' }}>Clique para enviar imagem</span>
        </div>
      )
      if (campo.tipo === 'avaliacao') {
        const max = Number(campo.valorPadrao) || 5
        return (
          <div style={{ display:'flex', alignItems:'center', gap:4, height:'100%', padding:'0 8px' }}>
            {Array.from({ length: max }, (_, i) => (
              <Star key={i} size={16} style={{ color: i < 3 ? '#FBBF24' : 'var(--bd2)', fill: i < 3 ? '#FBBF24' : 'transparent' }}/>
            ))}
          </div>
        )
      }
      if (campo.tipo === 'progresso') {
        const pct = Number(campo.valorPadrao) || 60
        return (
          <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', gap:4, height:'100%', padding:'0 8px', width:'100%', boxSizing:'border-box' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--t2)' }}>
              <span>Progresso</span><span>{pct}%</span>
            </div>
            <div style={{ height:8, background:'var(--s3)', borderRadius:4, overflow:'hidden', width:'100%' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:'var(--or)', borderRadius:4, transition:'width .3s' }}/>
            </div>
          </div>
        )
      }
      if (campo.tipo === 'cor') return (
        <div style={{ display:'flex', alignItems:'center', gap:8, height:'100%', padding:'0 10px' }}>
          <div style={{ width:28, height:28, borderRadius:6, background:campo.valorPadrao || '#3B82F6', border:'2px solid var(--bd)', flexShrink:0 }}/>
          <div className="form-input" style={{ flex:1, height:32, display:'flex', alignItems:'center', fontSize:12, fontFamily:'monospace' }}>
            {campo.valorPadrao || '#3B82F6'}
          </div>
          <Palette size={13} style={{ color:'var(--t3)', flexShrink:0 }}/>
        </div>
      )
      if (campo.tipo === 'percentual') return (
        <div style={{ display:'flex', alignItems:'center', gap:4, height:'100%' }}>
          <input className="form-input" type="number" disabled placeholder="0" style={{ flex:1, height:'100%' }}/>
          <div style={{ padding:'0 8px', height:'100%', display:'flex', alignItems:'center', background:'var(--s3)', border:'1px solid var(--bd)', borderRadius:'0 8px 8px 0', fontSize:13, fontWeight:700, color:'var(--t2)', marginLeft:-1 }}>%</div>
        </div>
      )
      if (campo.tipo === 'calculo') {
        let formula = '—'
        try { formula = JSON.parse(campo.valorPadrao || '{}').formula || '—' } catch {}
        return (
          <div style={{ display:'flex', alignItems:'center', gap:6, height:'100%', padding:'0 10px', background:'rgba(255,107,43,.06)', border:'1.5px solid rgba(255,107,43,.25)', borderRadius:8, boxSizing:'border-box', width:'100%' }}>
            <Calculator size={12} style={{ color:'var(--or)', flexShrink:0 }}/>
            <span style={{ fontSize:11, color:'var(--or)', fontFamily:'monospace' }}>{formula}</span>
            <span style={{ marginLeft:'auto', fontSize:11, fontWeight:700, color:'var(--t2)' }}>0,00</span>
          </div>
        )
      }
      return (
        <input className="form-input" disabled placeholder={campo.valorPadrao || ''} style={{ width:'100%', height:'100%' }}/>
      )
    }

    if (NO_WRAPPER.includes(campo.tipo)) return fieldInner()
    return (
      <div className="form-group" style={{ width:'100%', height:'100%', padding:'0 2px', boxSizing:'border-box', marginBottom:0, display:'flex', flexDirection:'column', gap:6 }}>
        {!SKIP_LABEL.includes(campo.tipo) && (
          <label className="form-label">
            {campo.label || campo.nomeCampo || '—'}
            {campo.obrigatorio && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}
          </label>
        )}
        <div style={{ flex:1, minHeight:0 }}>{fieldInner()}</div>
      </div>
    )
  }

  // ── Panel section box ────────────────────────────────────────────────────────
  const panelBox = { background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:10, padding:12, display:'flex', flexDirection:'column', gap:6 }
  const panelTitle = { fontSize:10, fontWeight:700, color:'var(--t3)', letterSpacing:.8, textTransform:'uppercase', marginBottom:2 }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, height:'100%' }}>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0, flexWrap:'wrap' }}>

        {/* Grupo 1: Histórico */}
        <TbBtn title="Desfazer (Ctrl+Z)"  onClick={undo}><Undo2 size={13}/></TbBtn>
        <TbBtn title="Refazer (Ctrl+Y)"   onClick={redo}><Redo2 size={13}/></TbBtn>

        <div style={{ width:1, height:18, background:'var(--bd2)', margin:'0 2px' }}/>

        {/* Grupo 2: Zoom */}
        <TbBtn title="Diminuir zoom (Ctrl+Scroll↓)" onClick={()=>setZoom(z=>Math.max(0.25,+(z-.1).toFixed(2)))}><ZoomOut size={13}/></TbBtn>
        <TbBtn title="Redefinir zoom (100%)" onClick={()=>setZoom(1)}>
          <span style={{ fontFamily:'monospace', fontSize:10 }}>{Math.round(zoom*100)}%</span>
        </TbBtn>
        <TbBtn title="Aumentar zoom (Ctrl+Scroll↑)" onClick={()=>setZoom(z=>Math.min(3,+(z+.1).toFixed(2)))}><ZoomIn size={13}/></TbBtn>

        <div style={{ width:1, height:18, background:'var(--bd2)', margin:'0 2px' }}/>

        {/* Grupo 3: Visualização */}
        <TbBtn title={livePreview ? 'Modo wireframe' : 'Campos reais'} onClick={()=>onLivePreview(!livePreview)} active={livePreview}>
          {livePreview ? <Eye size={13}/> : <EyeOff size={13}/>}
          <span style={{ fontSize:10 }}>{livePreview ? 'Real' : 'Wire'}</span>
        </TbBtn>
        <TbBtn title="Mostrar/ocultar grade" onClick={()=>onShowGrid(!showGrid)} active={showGrid}><LayoutGrid size={13}/></TbBtn>
        <TbBtn title="Mostrar/ocultar réguas" onClick={()=>onShowRulers(!showRulers)} active={showRulers}><Ruler size={13}/></TbBtn>

        <div style={{ width:1, height:18, background:'var(--bd2)', margin:'0 2px' }}/>

        {/* Grupo 4: Snap */}
        <div style={{ display:'flex', alignItems:'center', gap:3 }}>
          <span style={{ fontSize:10, color:'var(--t3)' }}>Snap</span>
          {[4, 8, 16].map(sz => (
            <button key={sz} onClick={()=>onSnapSz(sz)}
              style={{ height:22, minWidth:26, borderRadius:5, border:`1px solid ${snapSz===sz?'var(--or)':'var(--bd)'}`, background:snapSz===sz?'rgba(255,107,43,.12)':'var(--s2)', color:snapSz===sz?'var(--or)':'var(--t3)', fontSize:10, cursor:'pointer', padding:'0 4px', fontFamily:'monospace' }}>
              {sz}
            </button>
          ))}
        </div>

        <div style={{ width:1, height:18, background:'var(--bd2)', margin:'0 2px' }}/>

        {/* Grupo 5: Ações de seleção (só quando há seleção) */}
        {selected.size > 0 && <>
          <div style={{ width:1, height:18, background:'var(--bd2)', margin:'0 2px' }}/>
          <TbBtn title="Copiar (Ctrl+C)" onClick={()=>{ clipboard.current=campos.filter(c=>selected.has(c._key)).map(c=>({...c})) }}><Copy size={13}/><span style={{ fontSize:10 }}>Copiar</span></TbBtn>
          <TbBtn title="Duplicar (Ctrl+D)" onClick={duplicateSelected}><Copy size={13}/><span style={{ fontSize:10 }}>Duplicar</span></TbBtn>
          <TbBtn title="Excluir seleção (Del)" onClick={deleteSelected} danger><Trash2 size={13}/></TbBtn>
        </>}

        <div style={{ marginLeft:'auto', fontSize:10, color:'var(--t3)' }}>
          {selected.size > 0
            ? `${selected.size} selecionado${selected.size>1?'s':''}`
            : `${campos.length} campo${campos.length!==1?'s':''}`}
        </div>
      </div>

      {/* ── Canvas + Panel ─────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:14, flex:1, minHeight:0 }}>

        {/* ── Canvas scroll container ─────────────────────────────────────── */}
        <div ref={scrollRef} style={{ flex:1, overflow:'auto', border:'1px solid var(--bd)', borderRadius:12, background:'var(--bg)', boxShadow:'var(--sh-xs) inset' }}>
          {/* Wrapper sets the physical scroll area proportional to zoom */}
          <div style={{ width: canvasW*zoom, height: canvasH*zoom, position:'relative', flexShrink:0 }}>
            <div
              ref={canvasRef}
              onMouseDown={handleCanvasMD}
              style={{
                position:'absolute', top:0, left:0,
                width: canvasW, height: canvasH,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                ...(showGrid ? {
                  backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
                  backgroundSize: `${snapSz * 2}px ${snapSz * 2}px`,
                } : {}),
                cursor: 'crosshair',
              }}
            >
              {/* Rulers */}
              {showRulers && (<>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:18, background:'rgba(0,0,0,.18)', borderBottom:'1px solid var(--bd2)', pointerEvents:'none', zIndex:400, overflow:'hidden' }}>
                  {Array.from({ length: Math.ceil(canvasW / 50) + 1 }, (_, i) => {
                    const px = i * 50; const major = i % 2 === 0
                    return (
                      <div key={i} style={{ position:'absolute', left:px, top:0, height:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-end', alignItems:'flex-start' }}>
                        <div style={{ width:1, height:major ? 8 : 4, background:'var(--t3)' }}/>
                        {major && <span style={{ position:'absolute', bottom:9, left:2, fontSize:7, color:'var(--t3)', fontFamily:'monospace', whiteSpace:'nowrap' }}>{px}</span>}
                      </div>
                    )
                  })}
                </div>
                <div style={{ position:'absolute', top:0, left:0, bottom:0, width:18, background:'rgba(0,0,0,.18)', borderRight:'1px solid var(--bd2)', pointerEvents:'none', zIndex:400, overflow:'hidden' }}>
                  {Array.from({ length: Math.ceil(canvasH / 50) + 1 }, (_, i) => {
                    const px = i * 50; const major = i % 2 === 0
                    return (
                      <div key={i} style={{ position:'absolute', top:px, left:0, width:'100%', display:'flex', alignItems:'flex-start', justifyContent:'flex-end' }}>
                        <div style={{ height:1, width:major ? 8 : 4, background:'var(--t3)' }}/>
                        {major && px > 0 && <span style={{ position:'absolute', left:1, top:1, fontSize:7, color:'var(--t3)', fontFamily:'monospace', writingMode:'vertical-rl', transform:'rotate(180deg)', whiteSpace:'nowrap', lineHeight:1 }}>{px}</span>}
                      </div>
                    )
                  })}
                </div>
              </>)}

              {/* Margin guides */}
              {(canvasMargins.top > 0 || canvasMargins.bottom > 0 || canvasMargins.left > 0 || canvasMargins.right > 0) && (() => {
                const t = canvasMargins.top    * MM_TO_PX
                const b = canvasMargins.bottom * MM_TO_PX
                const l = canvasMargins.left   * MM_TO_PX
                const r = canvasMargins.right  * MM_TO_PX
                const mgStyle = { position: 'absolute', background: 'rgba(0,120,255,.45)', pointerEvents: 'none', zIndex: 3 }
                const lblStyle = { position: 'absolute', fontSize: 7, color: 'rgba(0,120,255,.8)', fontFamily: 'monospace', whiteSpace: 'nowrap' }
                return (<>
                  {t > 0 && <><div style={{ ...mgStyle, top: t, left: 0, right: 0, height: 1 }}/><span style={{ ...lblStyle, top: t + 2, left: l > 0 ? l + 3 : 3 }}>{canvasMargins.top}mm</span></>}
                  {b > 0 && <><div style={{ ...mgStyle, bottom: b, left: 0, right: 0, height: 1 }}/><span style={{ ...lblStyle, bottom: b + 2, left: l > 0 ? l + 3 : 3 }}>{canvasMargins.bottom}mm</span></>}
                  {l > 0 && <><div style={{ ...mgStyle, left: l, top: 0, bottom: 0, width: 1 }}/><span style={{ ...lblStyle, left: l + 2, top: t > 0 ? t + 3 : 3, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{canvasMargins.left}mm</span></>}
                  {r > 0 && <><div style={{ ...mgStyle, right: r, top: 0, bottom: 0, width: 1 }}/><span style={{ ...lblStyle, right: r + 2, top: t > 0 ? t + 3 : 3, writingMode: 'vertical-rl' }}>{canvasMargins.right}mm</span></>}
                </>)
              })()}

              {/* Fields */}
              {campos.map(campo => {
                const x=campo.x_pos||0, y=campo.y_pos||0, w=campo.w_px||280, h=campo.h_px||60
                const isSel = selected.has(campo._key)
                const Icon  = TIPO_ICONS[campo.tipo] || Type

                const handleFieldMD = e => {
                  if (e.target.dataset.resize) return
                  e.stopPropagation()
                  if (e.button !== 0) return
                  if (e.ctrlKey || e.metaKey) {
                    setSelected(prev => { const n=new Set(prev); n.has(campo._key)?n.delete(campo._key):n.add(campo._key); return n }); return
                  }
                  const keys = selected.has(campo._key) ? [...selected] : [campo._key]
                  if (!selected.has(campo._key)) setSelected(new Set([campo._key]))
                  const fields = campos.filter(c=>keys.includes(c._key)).map(c=>({ key:c._key, startX:c.x_pos||0, startY:c.y_pos||0 }))
                  dragging.current = { fields, startMX:e.clientX, startMY:e.clientY, snapshotted:false }
                }

                const handleCtxMenu = e => {
                  e.preventDefault(); e.stopPropagation()
                  if (!selected.has(campo._key)) setSelected(new Set([campo._key]))
                  const cx = Math.min(e.clientX, window.innerWidth  - 180)
                  const cy = Math.min(e.clientY, window.innerHeight - 220)
                  setCtxMenu({ x:cx, y:cy })
                }

                const resizeHandle = (
                  <div
                    data-resize="1" title="Redimensionar"
                    onMouseDown={e => { e.stopPropagation(); if (e.button !== 0) return; resizing.current = { key:campo._key, startMX:e.clientX, startMY:e.clientY, startW:w, startH:h, fieldX:x, fieldY:y, snapshotted:false } }}
                    style={{ position:'absolute', right:0, bottom:0, width:14, height:14, cursor:'se-resize', borderTop:`2px solid ${isSel?'var(--or)':'var(--bd2)'}`, borderLeft:`2px solid ${isSel?'var(--or)':'var(--bd2)'}`, borderBottomRightRadius:7, opacity:isSel?1:0.4, transition:'opacity .12s,border-color .12s', pointerEvents:'all' }}
                  />
                )

                // ── Divisor ────────────────────────────────────────────────
                if (campo.tipo === 'divisor') {
                  const isVert = campo.valorPadrao === 'vertical'
                  const lc = isSel ? 'rgba(255,107,43,.7)' : 'var(--bd2)'
                  return (
                    <div key={campo._key} onMouseDown={handleFieldMD} onContextMenu={handleCtxMenu}
                      onClick={e=>{ e.stopPropagation(); if(!e.ctrlKey&&!e.metaKey) setSelected(new Set([campo._key])) }}
                      style={{ position:'absolute', left:x, top:y, width:Math.max(w,16), height:Math.max(h,16), cursor:'move', userSelect:'none', border:`1.5px dashed ${isSel?'var(--or)':'transparent'}`, borderRadius:4, boxShadow:isSel?'0 0 0 3px rgba(255,107,43,.15)':'none', background:isSel?'rgba(255,107,43,.04)':'transparent', transition:'border-color .12s,box-shadow .12s' }}>
                      {isVert
                        ? <div style={{ position:'absolute', top:0, bottom:0, left:'50%', width:2, transform:'translateX(-50%)', background:lc, borderRadius:1 }}/>
                        : <div style={{ position:'absolute', left:0, right:0, top:'50%', height:2, transform:'translateY(-50%)', background:lc, borderRadius:1 }}/>
                      }
                      {campo.label && (
                        <span style={{ position:'absolute', top:isVert?4:'50%', left:isVert?'50%':6, transform:isVert?'translateX(-50%)':'translateY(-50%)', fontSize:9, fontWeight:700, color:isSel?'var(--or)':'var(--t3)', background:'var(--bg)', padding:'0 4px', textTransform:'uppercase', letterSpacing:.5, whiteSpace:'nowrap', zIndex:1 }}>
                          {campo.label}
                        </span>
                      )}
                      {isSel && <div style={{ position:'absolute', right:4, bottom:2, fontSize:7.5, color:'var(--or)', fontFamily:'monospace', background:'var(--bg)', padding:'0 2px' }}>{isVert?`${Math.max(w,16)}×${Math.max(h,16)}`:`${Math.max(w,16)}px`}</div>}
                      {resizeHandle}
                    </div>
                  )
                }

                // ── Live preview mode ──────────────────────────────────────
                if (livePreview) {
                  return (
                    <div key={campo._key} onMouseDown={handleFieldMD} onContextMenu={handleCtxMenu}
                      onClick={e=>{ e.stopPropagation(); if(!e.ctrlKey&&!e.metaKey) setSelected(new Set([campo._key])) }}
                      style={{ position:'absolute', left:x, top:y, width:w, height:h, cursor:'move', userSelect:'none', border:`1.5px solid ${isSel?'var(--or)':'transparent'}`, borderRadius:8, boxShadow:isSel?'0 0 0 3px rgba(255,107,43,.18)':'none', overflow:'hidden', transition:'border-color .12s,box-shadow .12s' }}>
                      <div style={{ width:'100%', height:'100%', pointerEvents:'none' }}>
                        {renderFieldLive(campo)}
                      </div>
                      {isSel && !selMulti && (
                        <div style={{ position:'absolute', right:4, bottom:2, fontSize:7.5, color:'var(--or)', fontFamily:'monospace', background:'rgba(0,0,0,.5)', padding:'0 3px', borderRadius:3, pointerEvents:'none' }}>
                          x:{x} y:{y} · {w}×{h}
                        </div>
                      )}
                      {resizeHandle}
                    </div>
                  )
                }

                // ── Campo normal (wireframe) ───────────────────────────────
                return (
                  <div key={campo._key} onMouseDown={handleFieldMD} onContextMenu={handleCtxMenu}
                    onClick={e=>{ e.stopPropagation(); if(!e.ctrlKey&&!e.metaKey) setSelected(new Set([campo._key])) }}
                    style={{ position:'absolute', left:x, top:y, width:w, height:h, background:'var(--s1)', border:`1.5px solid ${isSel?'var(--or)':'var(--bd)'}`, borderRadius:8, boxShadow:isSel?'0 0 0 3px rgba(255,107,43,.18),var(--sh-sm)':'var(--sh-xs)', cursor:'move', userSelect:'none', display:'flex', flexDirection:'column', padding:'5px 8px 4px', overflow:'hidden', transition:'border-color .12s,box-shadow .12s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:4, flexShrink:0 }}>
                      <Icon size={10} color={isSel?'var(--or)':'var(--t3)'}/>
                      <span style={{ fontSize:10, fontWeight:700, color:isSel?'var(--t1)':'var(--t2)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1 }}>
                        {campo.label||campo.nomeCampo||'Campo'}
                        {campo.obrigatorio && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}
                      </span>
                    </div>
                    <div style={{ flex:1, background:'var(--s2)', borderRadius:5, border:'1px solid var(--bd)', display:'flex', alignItems:campo.tipo==='texto_longo'?'flex-start':'center', padding:campo.tipo==='texto_longo'?'6px 8px':'0 8px', fontSize:10, color:'var(--t3)', overflow:'hidden' }}>
                      {campo.tipo==='booleano'
                        ? <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:14, height:14, border:'1.5px solid var(--bd2)', borderRadius:3, display:'inline-block' }}/>{campo.label}</span>
                        : campo.tipo==='favorito'     ? <span style={{ display:'flex', alignItems:'center', gap:6 }}><Star size={12} fill="var(--or)" color="var(--or)"/><span style={{ color:'var(--t2)' }}>Marcar como favorito</span></span>
                        : campo.tipo==='timestamps'   ? <span style={{ display:'flex', gap:10 }}><span>Criado em: <b>dd/mm/aaaa</b></span><span>Atualizado: <b>dd/mm/aaaa</b></span></span>
                        : campo.tipo==='copiar'       ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, width:'100%', color:'var(--blue)', fontWeight:600 }}><Copy size={11}/>{campo.label||'Copiar'}</span>
                        : campo.tipo==='botao'        ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%', color:'var(--or)', fontWeight:600 }}>{campo.label||'Botão'}</span>
                        : campo.tipo==='texto_longo' ? <span style={{ fontStyle:'italic', lineHeight:1.4 }}>Texto longo...</span>
                        : campo.tipo==='select'      ? <span>▾ {(campo.opcoes||[])[0]?.label||'Selecione...'}</span>
                        : campo.tipo==='radio'        ? <span style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{(campo.opcoes||[]).slice(0,3).map((o,i)=><span key={i} style={{ display:'flex', alignItems:'center', gap:3, color:o.cor||'var(--t2)', fontWeight:600 }}><span style={{ width:10, height:10, borderRadius:'50%', border:`1.5px solid ${o.cor||'var(--t3)'}`, display:'inline-block' }}/>{o.label}</span>)}</span>
                        : campo.tipo==='flags'        ? <span style={{ display:'flex', flexDirection:'column', gap:3, width:'100%' }}>{(campo.opcoes||[]).map((o,i)=><span key={i} style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, border:'1.5px solid var(--bd2)', borderRadius:2, display:'inline-block', flexShrink:0 }}/><span style={{ fontSize:10 }}>{o.label}</span>{o.codigo&&<span style={{ fontSize:9, color:'var(--t3)', fontFamily:'monospace' }}>[{o.codigo}]</span>}</span>)}</span>
                        : campo.tipo==='tags'         ? <span style={{ display:'flex', gap:4 }}>{(campo.valorPadrao||'tag1,tag2').split(',').slice(0,3).map((t,i)=><span key={i} style={{ background:'var(--s3)', borderRadius:3, padding:'0 4px' }}>{t.trim()}</span>)}</span>
                        : campo.tipo==='codigo_auto'  ? <span style={{ fontFamily:'monospace', fontWeight:700, color:'var(--or)', letterSpacing:2 }}>001</span>
                        : campo.tipo==='data'         ? <span>dd/mm/aaaa</span>
                        : <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{campo.valorPadrao||campo.label||'...'}</span>
                      }
                    </div>
                    {isSel && !selMulti && (
                      <div style={{ fontSize:7.5, color:'var(--or)', marginTop:2, fontFamily:'monospace', flexShrink:0 }}>
                        x:{x} y:{y} · {w}×{h}px
                      </div>
                    )}
                    {resizeHandle}
                  </div>
                )
              })}

              {/* Marquee selection rectangle */}
              {marquee && (
                <div style={{ position:'absolute', left:Math.min(marquee.x1,marquee.x2), top:Math.min(marquee.y1,marquee.y2), width:Math.abs(marquee.x2-marquee.x1), height:Math.abs(marquee.y2-marquee.y1), border:'1.5px dashed rgba(255,107,43,.7)', background:'rgba(255,107,43,.06)', pointerEvents:'none', zIndex:300 }}/>
              )}

              {/* Smart guides */}
              {guides.map((g,i) => (
                g.type==='v'
                  ? <div key={i} style={{ position:'absolute', top:0, bottom:0, left:g.value, width:1, background:'rgba(34,197,94,.9)', pointerEvents:'none', zIndex:200 }}/>
                  : <div key={i} style={{ position:'absolute', left:0, right:0, top:g.value, height:1, background:'rgba(34,197,94,.9)', pointerEvents:'none', zIndex:200 }}/>
              ))}

              {/* Empty state */}
              {campos.length===0 && (
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--t3)', gap:8, pointerEvents:'none' }}>
                  <Move size={32} strokeWidth={1.25} style={{ opacity:.3 }}/>
                  <div style={{ fontSize:13 }}>Canvas vazio</div>
                  <div style={{ fontSize:11 }}>Adicione campos na aba Campos ou use o painel lateral</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Side panel ─────────────────────────────────────────────────── */}
        <div style={{ width: panelCollapsed ? 28 : 264, flexShrink:0, display:'flex', flexDirection:'column', transition:'width .18s ease', overflow:'hidden', position:'relative', background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:12, boxShadow:'var(--sh-xs)' }}>

          {/* Expand button — shown only when collapsed */}
          {panelCollapsed && (
            <button
              onClick={() => setPanelCollapsed(false)}
              title="Expandir painel"
              style={{
                width:'100%', height:40, border:'none', background:'transparent',
                cursor:'pointer', color:'var(--t3)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}
            >
              <ChevronLeft size={12} />
            </button>
          )}

          {/* Panel content — hidden when collapsed */}
          {!panelCollapsed && (
          <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

          {/* ── Panel header (context-sensitive title + tabs when no selection) */}
          {!selSingle && !selMulti && (
            <div style={{ flexShrink:0, borderBottom:'1px solid var(--bd)', display:'flex', alignItems:'stretch' }}>
              <div style={{ display:'flex', flex:1, gap:0 }}>
                {[
                  { id:'campos', label:'Campos' },
                  { id:'canvas', label:'Canvas' },
                  { id:'atalhos', label:'Atalhos' },
                ].map(t => (
                  <button key={t.id} onClick={() => setPanelTab(t.id)}
                    style={{
                      flex:1, border:'none', borderBottom:`2px solid ${panelTab===t.id?'var(--or)':'transparent'}`,
                      background:'transparent', cursor:'pointer', padding:'9px 0', fontSize:11,
                      fontWeight: panelTab===t.id ? 700 : 400,
                      color: panelTab===t.id ? 'var(--or)' : 'var(--t3)',
                      transition:'var(--tr)', fontFamily:'inherit',
                    }}>{t.label}</button>
                ))}
              </div>
              {/* Toggle button inline at the right of tabs */}
              <button
                onClick={() => setPanelCollapsed(true)}
                title="Recolher painel"
                style={{
                  width: 30, border:'none', borderBottom:'2px solid transparent',
                  background:'transparent', cursor:'pointer', color:'var(--t3)',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                }}
              >
                <ChevronRight size={12} />
              </button>
            </div>
          )}

          {(selSingle || selMulti) && (
            <div style={{ padding:'10px 12px 8px', borderBottom:'1px solid var(--bd)', flexShrink:0, display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {selMulti ? `${selCampos.length} selecionados` : selSingle.tipo==='divisor' ? '— Divisor' : (selSingle.label||selSingle.nomeCampo||'Campo')}
                </div>
                {selSingle && (
                  <div style={{ fontSize:9, color:'var(--t3)', fontFamily:'monospace', marginTop:1 }}>
                    {selSingle.nomeCampo||'?'} · {selSingle.tipo}
                  </div>
                )}
              </div>
              {selMulti && (
                <button className="btn btn-ghost" style={{ height:22, padding:'0 7px', fontSize:10, flexShrink:0 }} onClick={()=>setSelected(new Set())}>✕</button>
              )}
              <button
                onClick={() => setPanelCollapsed(true)}
                title="Recolher painel"
                style={{ border:'none', background:'transparent', cursor:'pointer', color:'var(--t3)', padding:2, display:'flex', alignItems:'center', flexShrink:0 }}
              >
                <ChevronRight size={12} />
              </button>
            </div>
          )}

          {/* ── Scrollable panel body */}
          <div style={{ flex:1, overflowY:'auto', padding:'10px 10px 12px', display:'flex', flexDirection:'column', gap:8 }}>

          {/* ── Canvas panel ──────────────────────────────────────────────── */}
          {!selSingle && !selMulti && panelTab === 'campos' && (<>
            {/* Quick add — full-width prominent buttons in 2 cols */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
              {TIPOS_PANEL.map(({ valor, label, Icon }) => (
                <button key={valor} onClick={() => addCampo(valor)} title={`Adicionar campo: ${label}`}
                  style={{
                    height:40, display:'flex', alignItems:'center', gap:7,
                    border:'1px solid var(--bd)', borderRadius:9,
                    background:'var(--s2)', cursor:'pointer',
                    color:'var(--t2)', fontSize:11, fontWeight:600,
                    padding:'0 10px', transition:'var(--tr)', textAlign:'left',
                  }}
                  onMouseEnter={e=>{ e.currentTarget.style.background='var(--or3)'; e.currentTarget.style.borderColor='rgba(255,107,43,.35)'; e.currentTarget.style.color='var(--or)' }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='var(--s2)'; e.currentTarget.style.borderColor='var(--bd)'; e.currentTarget.style.color='var(--t2)' }}
                >
                  <Icon size={13} style={{ flexShrink:0 }}/>{label}
                </button>
              ))}
            </div>

            {/* Canvas stats footer */}
            <div style={{ fontSize:10, color:'var(--t3)', padding:'6px 2px', borderTop:'1px solid var(--bd)', marginTop:2, display:'flex', gap:10 }}>
              <span>{campos.length} campo{campos.length!==1?'s':''}</span>
              <span>{canvasConfigW}×{canvasConfigH}px</span>
              <span style={{ marginLeft:'auto' }}>{Math.round(zoom*100)}%</span>
            </div>
          </>)}

          {!selSingle && !selMulti && panelTab === 'canvas' && (<>

            {/* ── Dimensões ── */}
            <div style={panelBox}>
              <div style={panelTitle}>Dimensões do canvas</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <div>
                  <div style={{ fontSize:9, color:'var(--t3)', marginBottom:4, textTransform:'uppercase', letterSpacing:.5 }}>Largura (px)</div>
                  <input className="form-input" type="number" min={400} step={8} value={canvasConfigW}
                    onChange={e=>onCanvasConfig?.(Math.max(400,Number(e.target.value)),canvasConfigH)} style={{ height:28, fontSize:11, padding:'0 6px', width:'100%' }}/>
                </div>
                <div>
                  <div style={{ fontSize:9, color:'var(--t3)', marginBottom:4, textTransform:'uppercase', letterSpacing:.5 }}>Altura (px)</div>
                  <input className="form-input" type="number" min={200} step={8} value={canvasConfigH}
                    onChange={e=>onCanvasConfig?.(canvasConfigW,Math.max(200,Number(e.target.value)))} style={{ height:28, fontSize:11, padding:'0 6px', width:'100%' }}/>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4, marginTop:6 }}>
                {[{label:'HD',w:1280,h:720},{label:'4:3',w:1024,h:768},{label:'Padrão',w:780,h:480}].map(p=>(
                  <button key={p.label} className={`btn ${canvasConfigW===p.w&&canvasConfigH===p.h?'btn-primary':'btn-ghost'}`} style={{ height:26, fontSize:10 }} onClick={()=>onCanvasConfig?.(p.w,p.h)}>{p.label}</button>
                ))}
              </div>
            </div>

            {/* ── Visualização ── */}
            <div style={panelBox}>
              <div style={panelTitle}>Visualização</div>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                <label style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11, cursor:'pointer', userSelect:'none' }}>
                  Mostrar grade
                  <input type="checkbox" checked={showGrid} onChange={e=>onShowGrid(e.target.checked)} style={{ accentColor:'var(--or)', width:14, height:14 }}/>
                </label>
                <label style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11, cursor:'pointer', userSelect:'none' }}>
                  Mostrar réguas
                  <input type="checkbox" checked={showRulers} onChange={e=>onShowRulers(e.target.checked)} style={{ accentColor:'var(--or)', width:14, height:14 }}/>
                </label>
                <label style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11, cursor:'pointer', userSelect:'none' }}>
                  Preview real
                  <input type="checkbox" checked={livePreview} onChange={e=>onLivePreview(e.target.checked)} style={{ accentColor:'var(--or)', width:14, height:14 }}/>
                </label>
              </div>
              <div style={{ borderTop:'1px solid var(--bd)', paddingTop:8, marginTop:6 }}>
                <div style={{ fontSize:9, color:'var(--t3)', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>Snap (px)</div>
                <div style={{ display:'flex', gap:4 }}>
                  {[4,8,16].map(sz=>(
                    <button key={sz} onClick={()=>onSnapSz(sz)}
                      style={{ flex:1, height:26, borderRadius:6, border:`1px solid ${snapSz===sz?'var(--or)':'var(--bd)'}`, background:snapSz===sz?'rgba(255,107,43,.12)':'var(--s2)', color:snapSz===sz?'var(--or)':'var(--t3)', fontSize:11, cursor:'pointer', fontFamily:'monospace' }}>
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Margens ── */}
            <div style={panelBox}>
              <div style={panelTitle}>Margens do canvas (mm)</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {[{label:'Superior',key:'top'},{label:'Inferior',key:'bottom'},{label:'Esquerda',key:'left'},{label:'Direita',key:'right'}].map(({label,key})=>(
                  <div key={key}>
                    <div style={{ fontSize:9, color:'var(--t3)', marginBottom:4, textTransform:'uppercase', letterSpacing:.5 }}>{label}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <input className="form-input" type="number" min={0} step={1}
                        value={canvasMargins[key]}
                        onChange={e=>onCanvasMargins?.({...canvasMargins,[key]:Math.max(0,Number(e.target.value))})}
                        style={{ height:28, fontSize:11, padding:'0 6px', flex:1, minWidth:0 }}/>
                      <span style={{ fontSize:10, color:'var(--t3)', flexShrink:0 }}>mm</span>
                    </div>
                  </div>
                ))}
              </div>
              {(canvasMargins.top>0||canvasMargins.bottom>0||canvasMargins.left>0||canvasMargins.right>0)&&(
                <button className="btn btn-ghost" style={{ height:24, fontSize:10, marginTop:6, width:'100%' }}
                  onClick={()=>onCanvasMargins?.({top:0,bottom:0,left:0,right:0})}>
                  Limpar margens
                </button>
              )}
            </div>
          </>)}

          {!selSingle && !selMulti && panelTab === 'atalhos' && (
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {[
                ['Arrastar',         'Mover campo'],
                ['Ctrl+Clique',      'Multi-seleção'],
                ['Arrastar canvas',  'Marquee (caixa)'],
                ['Delete',           'Excluir seleção'],
                ['Ctrl+D',           'Duplicar'],
                ['Ctrl+C / V',       'Copiar / Colar'],
                ['Ctrl+Z / Y',       'Desfazer / Refazer'],
                ['Ctrl+A',           'Selecionar tudo'],
                ['Setas',            'Mover 1px'],
                ['Shift+Setas',      `Mover ${snapSz}px`],
                ['Ctrl+Scroll',      'Zoom'],
                ['Esc',              'Desmarcar'],
                ['Clique direito',   'Menu de contexto'],
              ].map(([key, desc]) => (
                <div key={key} style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                  <span style={{ fontFamily:'monospace', fontSize:9.5, background:'var(--s3)', border:'1px solid var(--bd)', borderRadius:4, padding:'1px 5px', color:'var(--t2)', flexShrink:0, whiteSpace:'nowrap' }}>{key}</span>
                  <span style={{ fontSize:10.5, color:'var(--t3)' }}>{desc}</span>
                </div>
              ))}
              <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid var(--bd)', fontSize:10, color:'var(--t3)', display:'flex', gap:12 }}>
                <span>Snap: {snapSz}px</span>
                <span>Zoom: {Math.round(zoom*100)}%</span>
              </div>
            </div>
          )}

          {/* ── Multi-select panel ────────────────────────────────────────── */}
          {selMulti && (<>
            <div style={panelBox}>
              <div style={panelTitle}>Alinhar</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4 }}>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} title="Alinhar borda esquerda" onClick={alignLeft}>⇤ Esq</button>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} title="Centralizar no canvas" onClick={centerHoriz}>↔ Ctr</button>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} title="Alinhar borda direita" onClick={alignRight}>⇥ Dir</button>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} title="Alinhar borda superior" onClick={alignTop}>⇡ Top</button>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} title="Centralizar vertical" onClick={centerVert}>↕ Mid</button>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} title="Alinhar borda inferior" onClick={alignBottom}>⇣ Bot</button>
              </div>
            </div>

            <div style={panelBox}>
              <div style={panelTitle}>Distribuir</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} onClick={distributeH} disabled={selCampos.length<3} title="3+ campos">⟺ H</button>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} onClick={distributeV} disabled={selCampos.length<3} title="3+ campos">⇕ V</button>
              </div>
            </div>

            <div style={panelBox}>
              <div style={panelTitle}>Igualar tamanho</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} onClick={sameWidth}>= Larg</button>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} onClick={sameHeight}>= Alt</button>
              </div>
            </div>

            <div style={panelBox}>
              <div style={panelTitle}>Z-order</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} onClick={bringToFront} title="Trazer ao topo">⬆⬆ Topo</button>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} onClick={sendToBack}   title="Mandar ao fundo">⬇⬇ Fundo</button>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} onClick={bringForward} title="Um para frente">▲ Frente</button>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} onClick={sendBackward} title="Um para trás">▼ Trás</button>
              </div>
            </div>

          </>)}

          {/* ── Single field panel ────────────────────────────────────────── */}
          {selSingle && (<>
            {/* Inline property editing */}
            <div style={panelBox}>
              <div style={panelTitle}>Propriedades</div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize:9 }}>Label</label>
                <input className="form-input" value={selSingle.label || ''} placeholder="Label do campo"
                  onChange={e => updateProp(selSingle._key, { label: e.target.value })}
                  style={{ height:28, fontSize:11 }}/>
              </div>
              {!['divisor','favorito','timestamps','copiar','botao'].includes(selSingle.tipo) && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize:9 }}>Nome no banco</label>
                  <input className="form-input" value={selSingle.nomeCampo || ''} placeholder="nome_campo"
                    onChange={e => updateProp(selSingle._key, { nomeCampo: e.target.value })}
                    style={{ height:28, fontSize:11, fontFamily:'monospace' }}/>
                </div>
              )}
              {!['divisor','favorito','timestamps','copiar'].includes(selSingle.tipo) && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize:9 }}>Tipo</label>
                  <select className="form-select" value={selSingle.tipo}
                    onChange={e => updateProp(selSingle._key, { tipo: e.target.value })}
                    style={{ height:28, fontSize:11 }}>
                    {TIPOS_DESIGNER.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
                  </select>
                </div>
              )}
              {!['divisor','favorito','timestamps','copiar','booleano','botao'].includes(selSingle.tipo) && (
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, cursor:'pointer', userSelect:'none' }}>
                    <input type="checkbox" checked={!!selSingle.obrigatorio}
                      onChange={e => updateProp(selSingle._key, { obrigatorio: e.target.checked })}
                      style={{ accentColor:'var(--or)' }}/>
                    Obrigatório
                  </label>
                  <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, cursor:'pointer', userSelect:'none' }}>
                    <input type="checkbox" checked={!!selSingle.campoBusca}
                      onChange={e => updateProp(selSingle._key, { campoBusca: e.target.checked })}
                      style={{ accentColor:'var(--or)' }}/>
                    Campo de busca
                  </label>
                  {!['divisor','botao','favorito','timestamps','copiar'].includes(selSingle.tipo) && (
                    <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, cursor:'pointer', userSelect:'none' }}>
                      <input type="checkbox" checked={!!selSingle.semNegrito}
                        onChange={e => updateProp(selSingle._key, { semNegrito: e.target.checked })}
                        style={{ accentColor:'var(--or)' }}/>
                      Label sem negrito
                    </label>
                  )}
                  {!['divisor','botao','favorito','timestamps','copiar'].includes(selSingle.tipo) && (
                    <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, userSelect:'none' }}>
                      Label fonte:
                      <input type="number" min={8} max={32}
                        value={selSingle.fontSize || ''}
                        onChange={e => updateProp(selSingle._key, { fontSize: e.target.value ? Number(e.target.value) : null })}
                        placeholder="padrão"
                        style={{ width:58, height:24, fontSize:11, padding:'0 5px', border:'1px solid var(--bd)', borderRadius:4, background:'var(--bg2)', color:'var(--t1)' }}/>
                      px
                    </label>
                  )}
                  {!['divisor','botao','favorito','timestamps','copiar','booleano','radio','flags'].includes(selSingle.tipo) && (<>
                    <div style={{ borderTop:'1px solid var(--bd)', margin:'2px 0' }}/>
                    <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, cursor:'pointer', userSelect:'none' }}>
                      <input type="checkbox" checked={!!selSingle.inputNegrito}
                        onChange={e => updateProp(selSingle._key, { inputNegrito: e.target.checked })}
                        style={{ accentColor:'var(--or)' }}/>
                      Conteúdo negrito
                    </label>
                    <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, userSelect:'none' }}>
                      Conteúdo fonte:
                      <input type="number" min={8} max={32}
                        value={selSingle.inputFontSize || ''}
                        onChange={e => updateProp(selSingle._key, { inputFontSize: e.target.value ? Number(e.target.value) : null })}
                        placeholder="padrão"
                        style={{ width:58, height:24, fontSize:11, padding:'0 5px', border:'1px solid var(--bd)', borderRadius:4, background:'var(--bg2)', color:'var(--t1)' }}/>
                      px
                    </label>
                  </>)}
                  {!['lookup','select','tags','multiline','booleano','cpf','cnpj','cep','documento'].includes(selSingle.tipo) && (
                    <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, cursor:'pointer', userSelect:'none' }}>
                      <input type="checkbox" checked={!!selSingle.sequencial}
                        onChange={e => updateProp(selSingle._key, { sequencial: e.target.checked })}
                        style={{ accentColor:'var(--or)' }}/>
                      Código sequencial
                    </label>
                  )}
                  {selSingle.sequencial && (
                    <div className="form-group" style={{ marginTop:2 }}>
                      <label className="form-label" style={{ fontSize:9 }}>Qtde de caracteres</label>
                      <input className="form-input" type="number" min={1} max={20}
                        value={(selSingle.opcoes?.seqChars) || 3}
                        onChange={e => updateProp(selSingle._key, { opcoes: { ...(selSingle.opcoes||{}), seqChars: Math.max(1, Math.min(20, Number(e.target.value)||3)) } })}
                        style={{ height:28, fontSize:11, padding:'0 6px' }}/>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Documento — campo de tipo F/J */}
            {selSingle.tipo==='documento' && (
              <div style={panelBox}>
                <div style={panelTitle}>Vínculo Física / Jurídica</div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize:9 }}>Nome do campo radio (F/J)</label>
                  <input className="form-input" value={selSingle.opcoes?.tipoRef || ''}
                    onChange={e => updateProp(selSingle._key, { opcoes: { ...(selSingle.opcoes||{}), tipoRef: e.target.value.trim() } })}
                    placeholder="ex: tipo_pessoa"
                    style={{ height:28, fontSize:11, fontFamily:'monospace' }}/>
                </div>
                <div style={{ fontSize:9.5, color:'var(--t3)', lineHeight:1.6 }}>
                  Crie um campo <b>Radio</b> com opções <b>F</b> e <b>J</b>, informe seu nome aqui. O documento troca a máscara automaticamente conforme o radio selecionado.
                </div>
              </div>
            )}

            {/* Divisor orientation toggle */}
            {selSingle.tipo==='divisor' && (
              <div style={panelBox}>
                <div style={panelTitle}>Orientação</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                  {[{label:'― Horizontal',val:'horizontal'},{label:'| Vertical',val:'vertical'}].map(({label,val})=>{
                    const active=(selSingle.valorPadrao||'horizontal')===val
                    return (
                      <button key={val} className={`btn ${active?'btn-primary':'btn-ghost'}`} style={{ height:28, fontSize:10 }}
                        onClick={()=>{ const ww=selSingle.w_px||280, hh=selSingle.h_px||24; updateLayout(selSingle._key,{ valorPadrao:val, w_px:val==='vertical'?24:Math.max(hh,120), h_px:val==='vertical'?Math.max(ww,120):24 }) }}>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Position & Size */}
            <div style={panelBox}>
              <div style={panelTitle}>Posição e Tamanho</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {[{label:'X (px)',key:'x_pos',min:0},{label:'Y (px)',key:'y_pos',min:0},{label:'Largura',key:'w_px',min:80},{label:'Altura',key:'h_px',min:16}].map(({label,key,min})=>(
                  <div key={key} className="form-group">
                    <label className="form-label" style={{ fontSize:9 }}>{label}</label>
                    <input className="form-input" type="number" min={min} step={snapSz} value={selSingle[key]||0}
                      onChange={e=>updateLayout(selSingle._key,{[key]:sn(Number(e.target.value))})} style={{ height:28, fontSize:11, padding:'0 6px' }}/>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick width */}
            <div style={panelBox}>
              <div style={panelTitle}>Largura rápida</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                {[{l:'¼',w:Math.round(canvasConfigW*.25/snapSz)*snapSz},{l:'½',w:Math.round(canvasConfigW*.5/snapSz)*snapSz},{l:'¾',w:Math.round(canvasConfigW*.75/snapSz)*snapSz},{l:'Full',w:canvasConfigW}].map(({l,w})=>(
                  <button key={l} className="btn btn-ghost" style={{ height:26, fontSize:11 }} onClick={()=>updateLayout(selSingle._key,{w_px:w})}>{l}</button>
                ))}
              </div>
            </div>

            {/* Single align */}
            <div style={panelBox}>
              <div style={panelTitle}>Alinhar</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5 }}>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} onClick={()=>updateLayout(selSingle._key,{x_pos:0})}>⇤ Esq</button>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} onClick={()=>updateLayout(selSingle._key,{x_pos:sn((canvasConfigW-(selSingle.w_px||280))/2)})}>↔ Ctr</button>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} onClick={()=>updateLayout(selSingle._key,{x_pos:sn(canvasConfigW-(selSingle.w_px||280))})}>⇥ Dir</button>
              </div>
            </div>

            {/* Z-order single */}
            <div style={panelBox}>
              <div style={panelTitle}>Camadas (Z-order)</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} onClick={bringToFront} title="Trazer ao topo">⬆⬆ Topo</button>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} onClick={sendToBack}   title="Mandar ao fundo">⬇⬇ Fundo</button>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} onClick={bringForward} title="Um para frente">▲ Frente</button>
                <button className="btn btn-ghost" style={{ height:26, fontSize:10 }} onClick={sendBackward} title="Um para trás">▼ Trás</button>
              </div>
            </div>
          </>)}

          </div>
          </div>
          )}
        </div>
      </div>

      {/* ── Context menu ───────────────────────────────────────────────────── */}
      {ctxMenu && (
        <div onClick={e=>e.stopPropagation()} style={{ position:'fixed', left:ctxMenu.x, top:ctxMenu.y, zIndex:9999, background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:10, boxShadow:'var(--sh-lg)', padding:'6px 0', minWidth:168 }}>
          <CtxItem icon={Copy}   label="Copiar"   shortcut="Ctrl+C" onClick={()=>{ clipboard.current=campos.filter(c=>selected.has(c._key)).map(c=>({...c})); setCtxMenu(null) }}/>
          <CtxItem icon={Layers} label="Duplicar" shortcut="Ctrl+D" onClick={duplicateSelected}/>
          <CtxItem icon={Trash2} label="Excluir"  shortcut="Del"    onClick={deleteSelected} danger/>
          <div style={{ height:1, background:'var(--bd)', margin:'4px 0' }}/>
          <CtxItem icon={ChevronsUp}   label="Trazer ao topo"  onClick={()=>{ bringToFront(); setCtxMenu(null) }}/>
          <CtxItem icon={ChevronUp}    label="Um para frente"  onClick={()=>{ bringForward(); setCtxMenu(null) }}/>
          <CtxItem icon={ChevronDown}  label="Um para trás"    onClick={()=>{ sendBackward(); setCtxMenu(null) }}/>
          <CtxItem icon={ChevronsDown} label="Mandar ao fundo" onClick={()=>{ sendToBack();   setCtxMenu(null) }}/>
        </div>
      )}
    </div>
  )
}
