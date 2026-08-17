import { useState, useCallback, useEffect } from 'react'
import { X, Plus, Trash2, Eye, Settings, Save, AlertCircle, Info, Layout, CircleDot, ExternalLink, Minus, ChevronLeft, ChevronDown, Star, Clock, Copy, Search } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import FormDesigner, { autoPos, CANVAS_W } from '../components/FormDesigner'
import FormToolbar from '../components/FormToolbar'
import { TIPOS, TIPOS_COM_OPCOES, FUNCOES_BOTAO, COR_PALETTE, LARGURAS, TIPO_META } from './formBuilderModal/constants.js'
import { CampoCardDivisor, CampoCardCopiar, CampoCardFavoritoTimestamps } from './formBuilderModal/cards/CampoCardSimples.jsx'
import { CampoCardBotao } from './formBuilderModal/cards/CampoCardBotao.jsx'
import { CampoCardLookup } from './formBuilderModal/cards/CampoCardLookup.jsx'
import { CampoCardSubGrid } from './formBuilderModal/cards/CampoCardSubGrid.jsx'
import { CampoCardPadrao } from './formBuilderModal/cards/CampoCardPadrao.jsx'
import { CampoPainelVazio, CampoPainelFavoritoTimestamps, CampoPainelDivisor, CampoPainelCopiar } from './formBuilderModal/cards/CampoPainelSimples.jsx'
import { CampoPainelBotao } from './formBuilderModal/cards/CampoPainelBotao.jsx'
import { CampoPainelLookup } from './formBuilderModal/cards/CampoPainelLookup.jsx'
import { CampoPainelPadrao } from './formBuilderModal/cards/CampoPainelPadrao.jsx'
import {
  campoVazio, botaoVazio, divisorVazio, favoritoVazio, timestampsVazio,
  copiarVazio, lookupVazio, pastaVazio, arquivoVazio, imagemVazio,
  avaliacaoVazio, progressoVazio, corVazio, urlVazio, calculoVazio,
  opcoesVazias, slugify,
} from './formBuilderModal/camposDefaults.js'
import { IconPreview, TipoCampoInfo, Sec, Row, lucideName } from './formBuilderModal/_shared.jsx'
import OpcoesList from './formBuilderModal/OpcoesList.jsx'
import TemplateModal from './formBuilderModal/TemplateModal.jsx'
import { useFormBuilderCampos } from './formBuilderModal/useFormBuilderCampos.js'

export default function FormBuilderModal({ tela, modulos, onSalvar, onFechar, inline = false }) {
  const editando = !!tela

  const [aba,           setAba]           = useState('campos')
  const [salvando,      setSalvando]      = useState(false)
  const [erro,          setErro]          = useState(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [tipInfoIdx,    setTipInfoIdx]    = useState(null)
  const [dragHandleIdx, setDragHandleIdx] = useState(null)
  const [expandedKeys,  setExpandedKeys]  = useState(new Set())
  const [showAddMenu,   setShowAddMenu]   = useState(false)
  const [addMenuHover,  setAddMenuHover]  = useState(null)
  const [telasList,     setTelasList]     = useState([])
  const [lookupColMap,  setLookupColMap]  = useState({}) // { nomeTabela: [col1, col2, ...] }

  // Estado do designer, persiste ao trocar de aba
  const [dsLivePreview,  setDsLivePreview]  = useState(false)
  const [dsShowGrid,     setDsShowGrid]     = useState(true)
  const [dsShowRulers,   setDsShowRulers]   = useState(false)
  const [dsSnapSz,       setDsSnapSz]       = useState(8)
  const [canvasMargins,  setCanvasMargins]  = useState({ top: 0, bottom: 0, left: 0, right: 0 })

  useEffect(() => {
    window.api.formBuilder.listarTelas(true)
      .then(res => { if (res.ok) setTelasList(res.data.filter(t => !t.sistema)) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'F9') {
        e.preventDefault()
        setAba(prev => prev === 'preview' ? 'campos' : 'preview')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  async function carregarColunasLookup(nomeTabela) {
    if (!nomeTabela || lookupColMap[nomeTabela]) return
    try {
      const res = await window.api.formBuilder.listarColunasTabela(nomeTabela)
      if (res.ok) setLookupColMap(prev => ({ ...prev, [nomeTabela]: res.data }))
    } catch {}
  }

  function toggleExpand(key) {
    setExpandedKeys(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  const [nomeTela,   setNomeTela]   = useState(tela?.nome_tela   || '')
  const [nomeTabela, setNomeTabela] = useState(tela?.nome_tabela || '')
  const [descricao,  setDescricao]  = useState(tela?.descricao   || '')
  const [icone,      setIcone]      = useState(tela?.icone       || 'layout')
  const [moduloId,   setModuloId]   = useState(tela?.grupo_fixo ? `__${tela.grupo_fixo}` : (tela?.modulo_id || ''))
  const [ordemMenu,  setOrdemMenu]  = useState(tela?.ordem_menu  || 99)
  const [canvasW,       setCanvasW]       = useState(tela?.canvas_w       || 780)
  const [canvasH,       setCanvasH]       = useState(tela?.canvas_h       || 480)

  const { campos, setCampos, addCampo: addCampoBase, atualizarCampo, onDragStart, onDragOver, onDragEnd } = useFormBuilderCampos(tela, editando)
  function addCampo(factory) {
    addCampoBase(factory, (novoKey) => setExpandedKeys(prev => new Set([...prev, novoKey])))
  }

  const handleDesignerChange = useCallback((updater) => {
    setCampos(updater)
  }, [])

  function renderPreviewCampo(campo, fill) {
    const ops = Array.isArray(campo.opcoes) ? campo.opcoes : []
    const _satSfx = ['_nome', '_ext', '_tamanho', '_path'].find(s => campo.nomeCampo.endsWith(s))
    const _isSat  = _satSfx ? campos.some(c => c.nomeCampo === campo.nomeCampo.slice(0, -_satSfx.length) && c.tipo === 'arquivo') : false
    const SKIP_LABEL = ['booleano', 'botao', 'favorito', 'timestamps']
    const NO_WRAPPER = ['botao', 'favorito', 'timestamps', 'copiar', 'divisor']

    function fieldInner() {
      if (campo.tipo === 'divisor') {
        const isVert = campo.valorPadrao === 'vertical'
        return (
          <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 16 }}>
            {isVert
              ? <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, transform: 'translateX(-50%)', background: 'var(--bd2)' }} />
              : <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, transform: 'translateY(-50%)', background: 'var(--bd2)' }} />
            }
            {campo.label && <span style={{ position: 'absolute', top: isVert ? 4 : '50%', left: isVert ? '50%' : 6, transform: isVert ? 'translateX(-50%)' : 'translateY(-50%)', fontSize: 9, fontWeight: 700, color: 'var(--t3)', background: 'var(--s1)', padding: '0 4px', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{campo.label}</span>}
          </div>
        )
      }
      if (campo.tipo === 'botao') {
        let cfg = {}
        try { cfg = JSON.parse(campo.valorPadrao || '{}') } catch {}
        return <button className={`btn btn-${cfg.variant || 'ghost'}`} disabled style={{ width: '100%', height: fill ? '100%' : 36, fontSize: 12 }}>{campo.label || 'Botão'}</button>
      }
      if (campo.tipo === 'favorito') return (
        <label className="fav-check" style={{ height: fill ? '100%' : 'auto', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
          <input type="checkbox" disabled style={{ accentColor: 'var(--or)' }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            Marcar como favorito <Star size={13} />
          </span>
        </label>
      )
      if (campo.tipo === 'timestamps') return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, height: fill ? '100%' : 'auto', alignContent: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ textAlign: 'center' }}>Criado em</label>
            <div className="form-input" style={{ fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 32, textAlign: 'center' }}>...</div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ textAlign: 'center' }}>Atualizado em</label>
            <div className="form-input" style={{ fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 32, textAlign: 'center' }}>...</div>
          </div>
        </div>
      )
      if (campo.tipo === 'copiar') return (
        <button disabled className="btn btn-ghost" style={{ width: '100%', height: fill ? '100%' : 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11 }}>
          <Copy size={11} /> {campo.label || 'Copiar'}
        </button>
      )
      if (campo.tipo === 'booleano') return (
        <label className="fav-check" style={{ height: fill ? '100%' : 'auto', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
          <input type="checkbox" disabled style={{ accentColor: 'var(--or)' }} />
          <span style={{ fontSize: 12 }}>{campo.label}</span>
        </label>
      )
      if (campo.tipo === 'texto_longo') return (
        <textarea className="form-textarea" disabled placeholder={campo.valorPadrao || 'Texto longo...'}
          style={{ width: '100%', height: fill ? '100%' : 80, minHeight: 'unset', resize: 'none', boxSizing: 'border-box', fontSize: 12 }} />
      )
      if (campo.tipo === 'select') return (
        <select className="form-select" disabled style={{ width: '100%', height: fill ? '100%' : 37, fontSize: 12 }}>
          <option>Selecione</option>
          {ops.map((o, i) => <option key={i}>{o.label}</option>)}
        </select>
      )
      if (campo.tipo === 'radio') {
        const isColuna = (campo.opcoesLayout || 'linha') === 'coluna'
        return (
          <div style={{ display: 'flex', flexDirection: isColuna ? 'column' : 'row', alignItems: isColuna ? 'flex-start' : 'center', gap: isColuna ? 6 : 14, height: fill ? '100%' : 37, padding: isColuna ? '6px 12px' : '0 12px', background: 'var(--s1)', border: '1.5px solid var(--bd)', borderRadius: 10, flexWrap: isColuna ? 'nowrap' : 'wrap', boxSizing: 'border-box', width: '100%', overflowY: isColuna ? 'auto' : 'visible' }}>
            {ops.length ? ops.map((o, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: o.cor || 'var(--t2)', fontWeight: 600, userSelect: 'none' }}>
                <input type="radio" disabled style={{ accentColor: o.cor || 'var(--or)', width: 13, height: 13 }} /> {o.label}
              </label>
            )) : <span style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>Sem opções</span>}
          </div>
        )
      }
      if (campo.tipo === 'tags') return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: fill ? '100%' : 37, padding: '0 8px', background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8, fontSize: 11, flexWrap: 'wrap', overflow: 'hidden' }}>
          {campo.valorPadrao
            ? campo.valorPadrao.split(',').map((t, i) => <span key={i} style={{ background: 'var(--s3)', borderRadius: 4, padding: '1px 6px', color: 'var(--t2)' }}>{t.trim()}</span>)
            : <span style={{ color: 'var(--t3)' }}>tag1, tag2...</span>}
        </div>
      )
      if (campo.tipo === 'codigo_auto') return (
        <div className="form-input" style={{ display: 'flex', alignItems: 'center', height: fill ? '100%' : 37, fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--or)', letterSpacing: 2 }}>001</div>
      )
      if (campo.tipo === 'lookup') {
        const cfg = (campo.opcoes && !Array.isArray(campo.opcoes)) ? campo.opcoes : {}
        return (
          <div style={{ display: 'flex', gap: 4, height: fill ? '100%' : 37 }}>
            <div className="form-input" style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--t3)', fontStyle: 'italic' }}>
              {cfg.lookupTabela ? `← ${cfg.lookupTabela}` : 'Nenhum'}
            </div>
            <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 8px', height: '100%' }} disabled><Search size={13} /></button>
          </div>
        )
      }
      if (campo.tipo === 'data') return (
        <input className="form-input" type="date" disabled style={{ width: '100%', height: fill ? '100%' : 37 }} />
      )
      if (campo.tipo === 'cpf') return (
        <input className="form-input" disabled placeholder="000.000.000-00" style={{ width: '100%', height: fill ? '100%' : 37 }} />
      )
      if (campo.tipo === 'cnpj') return (
        <div style={{ display: 'flex', gap: 4, height: fill ? '100%' : 37 }}>
          <input className="form-input" disabled placeholder="00.000.000/0000-00" style={{ flex: 1, height: '100%' }} />
          <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 8px', height: '100%', fontSize: 11 }} disabled>Buscar</button>
        </div>
      )
      if (campo.tipo === 'cep') return (
        <div style={{ display: 'flex', gap: 4, height: fill ? '100%' : 37 }}>
          <input className="form-input" disabled placeholder="00000-000" style={{ flex: 1, height: '100%' }} />
          <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 8px', height: '100%', fontSize: 11 }} disabled>Buscar</button>
        </div>
      )
      if (campo.tipo === 'documento') return (
        <div style={{ display: 'flex', gap: 4, height: fill ? '100%' : 37 }}>
          <input className="form-input" disabled placeholder="000.000.000-00" style={{ flex: 1, height: '100%' }} />
          <button className="btn btn-ghost" style={{ padding: '0 9px', height: '100%' }} disabled title="Consultar"><Search size={14} /></button>
        </div>
      )
      if (campo.tipo === 'flags') {
        const isColuna = (campo.opcoesLayout || 'linha') === 'coluna'
        return (
          <div className="form-input" style={{ display: 'flex', flexDirection: isColuna ? 'column' : 'row', flexWrap: isColuna ? 'nowrap' : 'wrap', gap: isColuna ? 4 : '4px 16px', height: 'auto', padding: '6px 10px', minHeight: 38 }}>
            {ops.length ? ops.map((op, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--t2)' }}>
                <div style={{ width: 14, height: 14, border: '1.5px solid var(--bd2)', borderRadius: 2, flexShrink: 0 }} />
                {op.label}
                {op.valor && <span style={{ fontSize: 9, fontFamily: 'monospace', opacity: .5 }}>[{op.valor}]</span>}
              </div>
            )) : <span style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>Sem flags</span>}
          </div>
        )
      }
      if (campo.tipo === 'pasta') return (
        <div style={{ position: 'relative', height: fill ? '100%' : 37 }}>
          <input className="form-input" disabled placeholder={campo.valorPadrao || 'Contratos, Financeiro...'} style={{ width: '100%', height: '100%' }} />
          <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 9, color: 'var(--t3)', pointerEvents: 'none' }}>▾ sugestões</span>
        </div>
      )
      // Satélites de arquivo: renderizar como linha label/valor sem borda de input
      const ARQ_SAT_SUFFIXES = ['_nome', '_ext', '_tamanho', '_path']
      const satSuffix = ARQ_SAT_SUFFIXES.find(s => campo.nomeCampo.endsWith(s))
      if (satSuffix) {
        const satPrefixo = campo.nomeCampo.slice(0, -satSuffix.length)
        const temPai = campos.some(c => c.nomeCampo === satPrefixo && c.tipo === 'arquivo')
        if (temPai) {
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: fill ? '100%' : 37, padding: '0 2px', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--t3)', flexShrink: 0 }}>{campo.label}</span>
              <span style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>auto</span>
            </div>
          )
        }
      }

      if (campo.tipo === 'arquivo') return (
        <div style={{ display:'flex', alignItems:'center', gap:8, height: fill ? '100%' : 37, padding:'0 10px', background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:8, fontSize:11, color:'var(--t3)' }}>
          <span style={{ fontSize:16 }}>📎</span>
          <span style={{ flex:1, fontStyle:'italic' }}>Nenhum arquivo selecionado</span>
          <span style={{ background:'var(--s3)', border:'1px solid var(--bd)', borderRadius:5, padding:'2px 8px', fontSize:10, color:'var(--t2)', cursor:'not-allowed' }}>Escolher</span>
        </div>
      )
      if (campo.tipo === 'imagem') return (
        <div style={{ width:'100%', height: fill ? '100%' : 120, background:'var(--s2)', border:'2px dashed var(--bd)', borderRadius:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, color:'var(--t3)', fontSize:11 }}>
          <span style={{ fontSize:28 }}>🖼️</span>
          <span>Clique para selecionar imagem</span>
          <span style={{ fontSize:9, color:'var(--t3)' }}>PNG, JPG, WEBP, GIF</span>
        </div>
      )
      if (campo.tipo === 'avaliacao') {
        const max = campo.opcoes?.max || 5
        return (
          <div style={{ display:'flex', alignItems:'center', gap:4, height: fill ? '100%' : 37, padding:'0 4px' }}>
            {Array.from({ length: max }, (_, i) => (
              <span key={i} style={{ fontSize:22, color: i < 3 ? '#FBD24C' : 'var(--bd2)', cursor:'not-allowed' }}>★</span>
            ))}
            <span style={{ fontSize:10, color:'var(--t3)', marginLeft:4 }}>3/{max}</span>
          </div>
        )
      }
      if (campo.tipo === 'progresso') return (
        <div style={{ display:'flex', flexDirection:'column', gap:6, width:'100%', justifyContent:'center', height: fill ? '100%' : 52 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--t2)' }}>
            <span>{campo.label || 'Progresso'}</span><span style={{ fontWeight:700, color:'var(--or)' }}>0%</span>
          </div>
          <div style={{ height:8, background:'var(--s3)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ width:'0%', height:'100%', background:'linear-gradient(90deg, var(--or),#FF9055)', borderRadius:4 }}/>
          </div>
        </div>
      )
      if (campo.tipo === 'cor') return (
        <div style={{ display:'flex', alignItems:'center', gap:8, height: fill ? '100%' : 37 }}>
          <div style={{ width:32, height:32, borderRadius:6, background: campo.valorPadrao || '#FF6B2B', border:'2px solid var(--bd)', flexShrink:0 }}/>
          <input className="form-input" disabled value={campo.valorPadrao || '#FF6B2B'} style={{ flex:1, height:32, fontFamily:'monospace' }}/>
        </div>
      )
      if (campo.tipo === 'url') return (
        <div style={{ display:'flex', gap:4, height: fill ? '100%' : 37 }}>
          <input className="form-input" disabled placeholder="https://..." style={{ flex:1, height:'100%' }}/>
          <button className="btn btn-ghost" style={{ flexShrink:0, padding:'0 8px', height:'100%' }} disabled title="Abrir link"><ExternalLink size={13}/></button>
        </div>
      )
      if (campo.tipo === 'data_hora') return (
        <input className="form-input" type="datetime-local" disabled style={{ width:'100%', height: fill ? '100%' : 37 }}/>
      )
      if (campo.tipo === 'hora') return (
        <input className="form-input" type="time" disabled style={{ width:'100%', height: fill ? '100%' : 37 }}/>
      )
      if (campo.tipo === 'percentual') return (
        <div style={{ display:'flex', alignItems:'center', gap:4, height: fill ? '100%' : 37 }}>
          <input className="form-input" type="number" disabled placeholder="0" style={{ flex:1, height:'100%' }}/>
          <span style={{ fontSize:14, fontWeight:700, color:'var(--t2)', paddingRight:8 }}>%</span>
        </div>
      )
      if (campo.tipo === 'calculo') return (
        <div style={{ display:'flex', alignItems:'center', gap:6, height: fill ? '100%' : 37, padding:'0 10px', background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:8 }}>
          <span style={{ fontSize:12 }}>𝑓𝑥</span>
          <span style={{ fontSize:12, color:'var(--t3)', fontStyle:'italic', fontFamily:'monospace' }}>{campo.opcoes?.formula || 'fórmula não configurada'}</span>
          <span style={{ marginLeft:'auto', fontWeight:700, color:'var(--or)', fontFamily:'monospace' }}>0,00</span>
        </div>
      )
      if (campo.tipo === 'login') return (
        <div style={{ display:'flex', alignItems:'center', gap:0, height: fill ? '100%' : 37, position:'relative' }}>
          <input className="form-input" disabled placeholder="usuario.login"
            style={{ width:'100%', height:'100%', paddingLeft:32 }}/>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'var(--t3)', pointerEvents:'none' }}>👤</span>
        </div>
      )
      if (campo.tipo === 'senha') return (
        <div style={{ display:'flex', gap:4, height: fill ? '100%' : 37 }}>
          <input className="form-input" disabled placeholder="••••••••"
            style={{ flex:1, height:'100%', letterSpacing:3 }}/>
          <button className="btn btn-ghost" style={{ flexShrink:0, padding:'0 8px', height:'100%', fontSize:10, whiteSpace:'nowrap' }} disabled>Redefinir</button>
        </div>
      )
      return (
        <input className="form-input" disabled
          placeholder={campo.valorPadrao || TIPOS.find(t => t.valor === campo.tipo)?.ex?.split(',')[0] || ''}
          style={{ width: '100%', height: fill ? '100%' : 37 }} />
      )
    }

    if (NO_WRAPPER.includes(campo.tipo)) return fieldInner()
    if (_isSat) return (
      <div style={{ width: '100%', height: fill ? '100%' : 37, padding: '0 2px', boxSizing: 'border-box', display: 'flex', alignItems: 'center' }}>
        {fieldInner()}
      </div>
    )
    const inputWrapStyle = {
      flex: 1, minHeight: 0,
      fontSize: campo.inputFontSize ? `${campo.inputFontSize}px` : undefined,
      textAlign: campo.inputAlign || undefined,
      color: campo.inputCor || undefined,
      background: campo.inputBg || undefined,
      borderRadius: campo.borderRadius != null ? `${campo.borderRadius}px` : undefined,
      borderWidth: campo.borderWidth != null ? `${campo.borderWidth}px` : undefined,
      borderColor: campo.borderColor || undefined,
      borderStyle: campo.borderWidth != null ? 'solid' : undefined,
    }
    return (
      <div className="form-group" style={{ width: '100%', height: fill ? '100%' : 'auto', padding: '0 2px', boxSizing: 'border-box', marginBottom: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!SKIP_LABEL.includes(campo.tipo) && (
          <label className="form-label" style={{ flexShrink: 0, marginBottom: 2, fontWeight: campo.semNegrito ? 400 : undefined, fontSize: campo.fontSize ? `${campo.fontSize}px` : '10px', color: campo.labelCor || undefined }}>
            {campo.label || campo.nomeCampo || 'Sem nome'}
            {campo.obrigatorio && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
          </label>
        )}
        <div style={inputWrapStyle}>{fieldInner()}</div>
      </div>
    )
  }

  async function handleSalvar() {
    setErro(null)
    try {
      if (!nomeTela.trim())   return setErro('Informe o nome da tela.')
      if (!nomeTabela.trim()) return setErro('Informe o nome da tabela.')
      const TIPOS_AUTO = ['divisor', 'botao', 'favorito', 'timestamps', 'copiar']
      const camposReais = campos.filter(c => !TIPOS_AUTO.includes(c.tipo))
      if (!camposReais.length) return setErro('Adicione pelo menos um campo de dados.')
      for (const c of camposReais) {
        if (!(c.label || '').trim())     return setErro('Há campos sem label definido.')
        if (!(c.nomeCampo || '').trim()) return setErro(`Campo "${c.label || '?'}" sem nome de coluna.`)
      }
      const payload = {
        nomeTela, nomeTabela, descricao, icone,
        moduloId:  (moduloId && !moduloId.startsWith('__')) ? moduloId : null,
        grupoFixo: moduloId?.startsWith('__') ? moduloId.slice(2) : null,
        ordemMenu: ordemMenu || 99,
        canvasW: canvasW || 780, canvasH: canvasH || 480,
        colFavorito:   campos.some(c => c.tipo === 'favorito')   || (tela?.col_favorito   === true),
        colTimestamps: campos.some(c => c.tipo === 'timestamps') || (tela?.col_timestamps === true),
        campos: campos.map((c, i) => ({ ...c, ordem: i + 1, largura: Math.max(10, c.largura || 50) })),
      }
      setSalvando(true)
      const res = editando
        ? await window.api.formBuilder.editarTela(tela.id, payload)
        : await window.api.formBuilder.criarTela(payload)
      if (!res.ok) throw new Error(res.erro)
      onSalvar()
    } catch(e) {
      console.error('[FormBuilderModal] Falha ao salvar tela:', e)
      setErro(e.message || String(e))
    } finally {
      setSalvando(false)
    }
  }

  function aplicarTemplate(tmpl) {
    setShowTemplates(false)
    if (tmpl.tipo === 'duplo') return
    setNomeTela(tmpl.nomeTela)
    setNomeTabela(tmpl.nomeTabela || slugify(tmpl.nomeTela) + '_001')
    setIcone(tmpl.icone || 'paperclip')
    setCanvasW(tmpl.canvasW || 900)
    setCanvasH(tmpl.canvasH || 620)
    setCampos(tmpl.campos.map(c => ({ ...c, _key: Math.random().toString(36).slice(2) })))
    setExpandedKeys(new Set())
    setAba('designer')
  }

  const secHead = { fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }

  const abas = [
    { id: 'campos',   Icon: Settings, label: 'Campos'   },
    { id: 'designer', Icon: Layout,   label: 'Design'   },
    { id: 'preview',  Icon: Eye,      label: 'Preview'  },
  ]

  // ── Campo card ────────────────────────────────────────────────────────────
  function renderCampoCard(campo, idx) {
    const isExp = expandedKeys.has(campo._key)

    // ── DIVISOR ────────────────────────────────────────────────────────────
    if (campo.tipo === 'divisor') return (
      <CampoCardDivisor campo={campo} idx={idx} setCampos={setCampos} atualizarCampo={atualizarCampo}
        tipInfoIdx={tipInfoIdx} setTipInfoIdx={setTipInfoIdx} salvando={salvando} />
    )

    // ── COPIAR ────────────────────────────────────────────────────────────
    if (campo.tipo === 'copiar') return (
      <CampoCardCopiar campo={campo} idx={idx} campos={campos} setCampos={setCampos} atualizarCampo={atualizarCampo}
        tipInfoIdx={tipInfoIdx} setTipInfoIdx={setTipInfoIdx} salvando={salvando} />
    )

    // ── FAVORITO / TIMESTAMPS ─────────────────────────────────────────────
    if (campo.tipo === 'favorito' || campo.tipo === 'timestamps') return (
      <CampoCardFavoritoTimestamps campo={campo} idx={idx} setCampos={setCampos}
        tipInfoIdx={tipInfoIdx} setTipInfoIdx={setTipInfoIdx} salvando={salvando} />
    )

    // ── BOTÃO (accordion) ─────────────────────────────────────────────────
    if (campo.tipo === 'botao') return (
      <CampoCardBotao campo={campo} idx={idx} campos={campos} setCampos={setCampos} atualizarCampo={atualizarCampo}
        isExp={isExp} toggleExpand={toggleExpand} tipInfoIdx={tipInfoIdx} setTipInfoIdx={setTipInfoIdx} salvando={salvando} />
    )

    // ── LOOKUP (accordion) ────────────────────────────────────────────────
    if (campo.tipo === 'lookup') return (
      <CampoCardLookup campo={campo} idx={idx} setCampos={setCampos} atualizarCampo={atualizarCampo}
        isExp={isExp} toggleExpand={toggleExpand} tipInfoIdx={tipInfoIdx} setTipInfoIdx={setTipInfoIdx} salvando={salvando}
        lookupColMap={lookupColMap} carregarColunasLookup={carregarColunasLookup} telasList={telasList} />
    )

    // ── SUB_GRID (accordion) ──────────────────────────────────────────────
    if (campo.tipo === 'sub_grid') return (
      <CampoCardSubGrid campo={campo} idx={idx} setCampos={setCampos} atualizarCampo={atualizarCampo}
        isExp={isExp} toggleExpand={toggleExpand} tipInfoIdx={tipInfoIdx} setTipInfoIdx={setTipInfoIdx} salvando={salvando}
        nomeTabelaPai={nomeTabela} />
    )

    // ── CAMPO NORMAL (accordion) ──────────────────────────────────────────
    return (
      <CampoCardPadrao campo={campo} idx={idx} setCampos={setCampos} atualizarCampo={atualizarCampo}
        isExp={isExp} toggleExpand={toggleExpand} tipInfoIdx={tipInfoIdx} setTipInfoIdx={setTipInfoIdx}
        salvando={salvando} editando={editando} />
    )
  }

  // ── Renderiza o painel de preview ─────────────────────────────────────────
  function renderPreview(compact = false) {
    const temLayout = campos.some(c => c.x_pos > 0 || c.y_pos > 0 || c.w_px !== 280)
    const cW = temLayout
      ? Math.max(canvasW || CANVAS_W, ...campos.map(c => (c.x_pos || 0) + (c.w_px || 280) + 16))
      : (canvasW || CANVAS_W)
    const alturaCanvas = temLayout
      ? Math.max(canvasH || 480, ...campos.map(c => (c.y_pos || 0) + (c.h_px || 60) + 40))
      : 'auto'

    if (compact) {
      // Preview escalado para a coluna direita
      if (temLayout) {
        const scale = 248 / cW
        const scaledH = (typeof alturaCanvas === 'number' ? alturaCanvas : 480) * scale
        return (
          <>
            <div style={{ ...secHead, marginBottom: 8 }}>{nomeTela || 'Sem nome'}</div>
            <div style={{ border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden', height: scaledH }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: cW, height: scaledH / scale, position: 'relative', background: 'var(--s1)' }}>
                {campos.map(campo => {
                  const x = campo.x_pos || 0, y = campo.y_pos || 0, w = campo.w_px || 280, h = campo.h_px || 60
                  return (
                    <div key={campo._key} style={{ position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box' }}>
                      {renderPreviewCampo(campo, true)}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )
      }
      return (
        <>
          <div style={{ ...secHead, marginBottom: 8 }}>{nomeTela || 'Sem nome'}</div>
          <div style={{ border: '1px solid var(--bd)', borderRadius: 8, padding: 12, background: 'var(--s1)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {campos.map(campo => (
              <div key={campo._key} style={{ width: `calc(${campo.largura}% - 5px)`, minWidth: 80, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>
                  {campo.label || campo.nomeCampo}{campo.obrigatorio && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
                </label>
                {renderPreviewCampo(campo, false)}
              </div>
            ))}
            {campos.length === 0 && <span style={{ color: 'var(--t3)', fontSize: 11 }}>Adicione campos para visualizar.</span>}
          </div>
        </>
      )
    }

    // Preview normal (aba preview do modal)
    return (
      <div>
        <div style={{ ...secHead, marginBottom: 10 }}>{nomeTela || 'Sem nome'} · Preview do Formulário</div>
        {temLayout ? (
          <div style={{ overflow: 'auto', border: '1px solid var(--bd)', borderRadius: 12 }}>
            <div style={{ position: 'relative', width: cW, height: alturaCanvas, background: 'var(--s1)' }}>
              {campos.map(campo => {
                const x = campo.x_pos || 0, y = campo.y_pos || 0, w = campo.w_px || 280, h = campo.h_px || 60
                return (
                  <div key={campo._key} style={{ position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box' }}>
                    {renderPreviewCampo(campo, true)}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--bd)', borderRadius: 12, padding: 20, background: 'var(--s1)', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {campos.map(campo => (
              <div key={campo._key} style={{ width: `calc(${campo.largura}% - 8px)`, minWidth: 120, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', letterSpacing: .5, textTransform: 'uppercase' }}>
                  {campo.label || campo.nomeCampo || 'Campo'}{campo.obrigatorio && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
                </label>
                {renderPreviewCampo(campo, false)}
                <span style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'monospace' }}>
                  {campo.nomeCampo || '?'} · {TIPOS.find(t => t.valor === campo.tipo)?.pg}
                </span>
              </div>
            ))}
            {campos.length === 0 && <span style={{ color: 'var(--t3)', fontSize: 12 }}>Adicione campos para visualizar.</span>}
          </div>
        )}
      </div>
    )
  }

  // ── Seção de identificação (reutilizada nos dois modos) ───────────────────
  function renderIdentificacao(compact = false) {
    const h = compact ? 34 : undefined
    return (
      <div>
        <div style={secHead}>Identificação</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: compact ? 10 : 12, marginBottom: compact ? 10 : 12 }}>
          <div className="form-group">
            <label className="form-label">Nome da Tela *</label>
            <input className="form-input" style={h ? { height: h } : {}} value={nomeTela}
              onChange={e => { setNomeTela(e.target.value); if (!editando) setNomeTabela(slugify(e.target.value) ? slugify(e.target.value) + '_001' : '') }}
              placeholder="Ex: Cadastro de Fornecedores" disabled={salvando} />
          </div>
          <div className="form-group">
            <label className="form-label">Nome no Banco (tabela) *</label>
            <input className="form-input" style={{ ...(h ? { height: h } : {}), fontFamily: 'monospace', fontSize: 12, opacity: editando ? .6 : 1 }} value={nomeTabela}
              onChange={e => !editando && setNomeTabela(slugify(e.target.value))}
              placeholder="cad_fornecedores_001" disabled={editando || salvando} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr 60px' : '1fr 1fr 80px', gap: compact ? 10 : 12 }}>
          <div className="form-group">
            <label className="form-label">Módulo</label>
            <select className="form-select" style={h ? { height: h } : {}} value={moduloId} onChange={e => setModuloId(e.target.value)} disabled={salvando}>
              <option value="">Nenhum</option>
              <optgroup label="Nativos">
                <option value="__inicio">Início</option>
                <option value="__gestao">Gestão</option>
                <option value="__ferramentas">Ferramentas</option>
              </optgroup>
              {modulos.length > 0 && <optgroup label="Meus Módulos">
                {modulos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </optgroup>}
            </select>
          </div>
          {!compact && (
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className="form-label" style={{ margin: 0 }}>Ícone (Lucide)</label>
                <a href="https://lucide.dev/icons/" target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--or)', textDecoration: 'none', opacity: .8 }}>
                  <ExternalLink size={10} /> ver todos
                </a>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 37, height: 37, flexShrink: 0, background: 'var(--s2)', border: '1.5px solid var(--bd)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: icone && LucideIcons[lucideName(icone)] ? 'var(--or)' : 'var(--t3)', boxShadow: 'var(--sh-xs)' }}>
                  <IconPreview name={icone} size={17} />
                </div>
                <input className="form-input" value={icone} onChange={e => setIcone(e.target.value)}
                  placeholder="terminal, database, users..." disabled={salvando} style={{ flex: 1 }} />
              </div>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Ordem</label>
            <input className="form-input" style={h ? { height: h } : {}} type="number" value={ordemMenu} onChange={e => setOrdemMenu(Number(e.target.value))} min={1} disabled={salvando} />
          </div>
        </div>
        {compact && (
          <div className="form-group" style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <label className="form-label" style={{ margin: 0 }}>Ícone (Lucide)</label>
              <a href="https://lucide.dev/icons/" target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--or)', textDecoration: 'none', opacity: .8 }}>
                <ExternalLink size={10} /> ver todos
              </a>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 34, height: 34, flexShrink: 0, background: 'var(--s2)', border: '1.5px solid var(--bd)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: icone && LucideIcons[lucideName(icone)] ? 'var(--or)' : 'var(--t3)' }}>
                <IconPreview name={icone} size={15} />
              </div>
              <input className="form-input" value={icone} onChange={e => setIcone(e.target.value)}
                placeholder="terminal, database, users..." disabled={salvando} style={{ flex: 1, height: 34 }} />
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Painel de edição de campo (reutilizado na aba Campos e no Designer) ──
  function renderCampoPainel(campo) {
    if (!campo) return <CampoPainelVazio />

    if (campo.tipo === 'favorito' || campo.tipo === 'timestamps') return <CampoPainelFavoritoTimestamps campo={campo} />

    if (campo.tipo === 'divisor') return (
      <CampoPainelDivisor campo={campo} setCampos={setCampos} atualizarCampo={atualizarCampo} salvando={salvando} />
    )

    if (campo.tipo === 'copiar') return (
      <CampoPainelCopiar campo={campo} campos={campos} atualizarCampo={atualizarCampo} salvando={salvando} />
    )

    if (campo.tipo === 'botao') return (
      <CampoPainelBotao campo={campo} campos={campos} atualizarCampo={atualizarCampo} salvando={salvando} />
    )

    if (campo.tipo === 'lookup') {
      const meta = TIPO_META[campo.tipo] || { short: '?', color: '#94A3B8' }
      return (
        <CampoPainelLookup campo={campo} setCampos={setCampos} atualizarCampo={atualizarCampo} salvando={salvando}
          lookupColMap={lookupColMap} carregarColunasLookup={carregarColunasLookup} telasList={telasList} meta={meta} />
      )
    }

    // ── Campo normal ──
    return (
      <CampoPainelPadrao campo={campo} campos={campos} atualizarCampo={atualizarCampo} salvando={salvando}
        editando={editando} tipInfoIdx={tipInfoIdx} setTipInfoIdx={setTipInfoIdx} />
    )
  }

  // ── MODO INLINE (abas, sem backdrop) ────────────────────────────────────
  if (inline) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--s1)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--bd)', flexShrink: 0, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onFechar}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 12, padding: '4px 10px', borderRadius: 8, transition: 'var(--tr)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--t1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
          >
            <ChevronLeft size={15} /> Voltar
          </button>
          <div style={{ width: 1, height: 18, background: 'var(--bd)', flexShrink: 0 }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>
            {editando ? `Editar · ${tela.nome_tela}` : 'Nova Tela'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!editando && (
            <button className="btn btn-ghost" onClick={() => setShowTemplates(true)} style={{ height: 32, gap: 5, fontSize: 12 }}>
              <Layout size={13} /> Templates
            </button>
          )}
        </div>
      </div>

      {erro && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', background: 'rgba(248,113,113,.1)', borderBottom: '1px solid rgba(248,113,113,.25)', color: 'var(--red)', fontSize: 12.5, flexShrink: 0 }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} /> {erro}
        </div>
      )}

      {/* Abas */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--bd)', padding: '0 22px', flexShrink: 0 }}>
        {abas.map(({ id, Icon, label }) => (
          <button key={id} onClick={() => setAba(id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
            borderBottom: `2px solid ${aba === id ? 'var(--or)' : 'transparent'}`,
            padding: '9px 4px', marginRight: 20, fontSize: 12,
            color: aba === id ? 'var(--or)' : 'var(--t3)',
            cursor: 'pointer', fontWeight: aba === id ? 600 : 400, marginBottom: -1,
          }}>
            <Icon size={13} /> {label}
          </button>
        ))}
        {aba === 'designer' && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--t3)', alignSelf: 'center', paddingRight: 4 }}>
            Arraste campos • Resize pelo canto inferior direito • Clique para selecionar
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ overflowY: aba === 'designer' ? 'hidden' : 'auto', flex: 1, padding: aba === 'designer' ? 14 : '18px 22px', display: 'flex', flexDirection: 'column', gap: aba === 'designer' ? 0 : 20, minHeight: 0 }}>

        {aba === 'campos' && (() => {
          const selCampo = campos.find(c => c._key === expandedKeys.values().next().value) || null
          const selKey   = selCampo?._key || null

          function selecionar(key) {
            setExpandedKeys(new Set(key ? [key] : []))
          }

          // grupos de campos para o menu de adicionar
          const GRUPOS_ADD = [
            { label: 'Básicos', items: [
              { label: 'Texto',       desc: 'Texto curto com tamanho máximo. Ex: nome, código, endereço.',         action: () => addCampo(campoVazio) },
              { label: 'Número',      desc: 'Valor numérico decimal. Ex: quantidade, peso, distância.',            action: () => { const c = campoVazio(campos); addCampo(() => ({ ...c, tipo: 'numero', tamanho: 0 })) } },
              { label: 'Moeda',       desc: 'Valor monetário com 2 casas decimais. Ex: R$ 1.250,00.',             action: () => { const c = campoVazio(campos); addCampo(() => ({ ...c, tipo: 'moeda', tamanho: 0 })) } },
              { label: 'Data',        desc: 'Seletor de data (sem hora). Ex: 04/06/2024.',                        action: () => { const c = campoVazio(campos); addCampo(() => ({ ...c, tipo: 'data', tamanho: 0 })) } },
              { label: 'Sim/Não',     desc: 'Checkbox verdadeiro ou falso. Ex: Ativo, Recorrente.',               action: () => { const c = campoVazio(campos); addCampo(() => ({ ...c, tipo: 'booleano', tamanho: 0 })) } },
              { label: 'Texto longo', desc: 'Área de texto multilinha. Ex: descrição, observações, histórico.',   action: () => { const c = campoVazio(campos); addCampo(() => ({ ...c, tipo: 'texto_longo', tamanho: 0, h_px: 120 })) } },
            ]},
            { label: 'Seleção', items: [
              { label: 'Select',  desc: 'Lista suspensa com opções fixas. Apenas um valor selecionável.',         action: () => { const c = campoVazio(campos); addCampo(() => ({ ...c, tipo: 'select', opcoes: opcoesVazias() })) } },
              { label: 'Radio',   desc: 'Botões de opção coloridos visíveis na tela. Ex: Status, Prioridade.',   action: () => { const c = campoVazio(campos); addCampo(() => ({ ...c, tipo: 'radio', opcoes: opcoesVazias(), h_px: 52 })) } },
              { label: 'Tags',    desc: 'Múltiplos valores separados por vírgula. Ex: contrato, 2024, cliente.',  action: () => { const c = campoVazio(campos); addCampo(() => ({ ...c, tipo: 'tags', tamanho: 0 })) } },
              { label: 'Flags',   desc: 'Múltiplos checkboxes independentes. Ex: Revisado, Aprovado, Enviado.',  action: () => { const c = campoVazio(campos); addCampo(() => ({ ...c, tipo: 'flags', opcoes: opcoesVazias() })) } },
            ]},
            { label: 'Formatados', items: [
              { label: 'E-mail',    desc: 'Campo de e-mail com validação de formato.',                            action: () => { const c = campoVazio(campos); addCampo(() => ({ ...c, tipo: 'email' })) } },
              { label: 'Telefone',  desc: 'Telefone com máscara automática (fixo ou celular).',                  action: () => { const c = campoVazio(campos); addCampo(() => ({ ...c, tipo: 'telefone' })) } },
              { label: 'CEP',       desc: 'CEP com busca automática de endereço via ViaCEP.',                    action: () => { const c = campoVazio(campos); addCampo(() => ({ ...c, tipo: 'cep', tamanho: 9 })) } },
              { label: 'CPF/CNPJ',  desc: 'Adapta a máscara automaticamente conforme o tipo (Física/Jurídica).', action: () => { const c = campoVazio(campos); addCampo(() => ({ ...c, tipo: 'documento' })) } },
              { label: 'CNPJ',      desc: 'CNPJ fixo com busca automática na Receita Federal.',                  action: () => { const c = campoVazio(campos); addCampo(() => ({ ...c, tipo: 'cnpj' })) } },
              { label: 'URL',       desc: 'Link clicável com botão de abrir no navegador.',                      action: () => addCampo(urlVazio) },
              { label: 'Cód. Auto', desc: 'Código sequencial gerado automaticamente. Ex: 001, 002, 003.',        action: () => { const c = campoVazio(campos); addCampo(() => ({ ...c, tipo: 'codigo_auto', opcoes: { seqChars: 3 } })) } },
            ]},
            { label: 'Avançados', items: [
              { label: 'Arquivo',   desc: 'Upload de qualquer arquivo (PDF, DOCX, XLSX...). Salva o caminho.',   action: () => addCampo(arquivoVazio) },
              { label: 'Imagem',    desc: 'Upload de imagem com preview inline (PNG, JPG, GIF, WEBP).',          action: () => addCampo(imagemVazio) },
              { label: 'Pasta',     desc: 'Texto com autocomplete dos valores já cadastrados nessa coluna.',      action: () => addCampo(pastaVazio) },
              { label: 'Avaliação', desc: 'Estrelas de 1 a N. Ideal para NPS, satisfação, qualidade.',           action: () => addCampo(avaliacaoVazio) },
              { label: 'Progresso', desc: 'Barra de progresso de 0 a 100%. Ex: conclusão, andamento.',           action: () => addCampo(progressoVazio) },
              { label: 'Cor',       desc: 'Seletor de cor HEX com preview visual. Ex: cor de destaque.',         action: () => addCampo(corVazio) },
              { label: 'Cálculo',   desc: 'Valor calculado por fórmula usando outros campos. Não salvo no banco.',action: () => addCampo(calculoVazio) },
              { label: 'Lookup',    desc: 'Referência a outra tabela do sistema. Ex: banco → tabela de bancos.',  action: () => addCampo(lookupVazio) },
            ]},
            { label: 'Elementos', items: [
              { label: 'Botão',    desc: 'Botão de ação configurável: abrir tela, copiar, exportar PDF e mais.', action: () => addCampo(botaoVazio) },
              { label: 'Copiar',   desc: 'Botão que copia o conteúdo de outro campo para a área de transferência.', action: () => setCampos(p => [...p, copiarVazio(p)]) },
              { label: 'Divisor',  desc: 'Linha separadora horizontal ou vertical para organizar seções.',        action: () => setCampos(p => [...p, divisorVazio(p)]) },
              { label: 'Favorito', desc: 'Checkbox de favorito com estrela. Só pode existir um por tela.',        action: () => setCampos(p => [...p, favoritoVazio(p)]), dis: campos.some(c => c.tipo === 'favorito') },
              { label: 'Datas',    desc: 'Campos criado_em e atualizado_em preenchidos automaticamente.',         action: () => setCampos(p => [...p, timestampsVazio(p)]), dis: campos.some(c => c.tipo === 'timestamps') },
            ]},
          ]

          function renderPainel() {
            if (!selCampo) return (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--t3)', padding: 32 }}>
                <Search size={28} strokeWidth={1.2} style={{ opacity: .3 }} />
                <span style={{ fontSize: 13 }}>Selecione um campo para editar</span>
              </div>
            )
            return renderCampoPainel(selCampo)
          }

          return (
            <>
              {renderIdentificacao(false)}
              <div style={{ display: 'flex', gap: 0, flex: 1, minHeight: 0, border: '1px solid var(--bd)', borderRadius: 12, overflow: 'hidden', background: 'var(--s1)' }}>

                {/* Coluna esquerda: lista de campos */}
                <div style={{ width: 230, flexShrink: 0, borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column' }}>

                  {/* Header */}
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--bd)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)' }}>Campos <span style={{ color: 'var(--t3)', fontWeight: 400 }}>({campos.length})</span></span>
                    <div style={{ position: 'relative' }}>
                      <button className="btn btn-primary" style={{ height: 26, fontSize: 11, padding: '0 10px', gap: 4 }}
                        id="btn-add-campo"
                        onClick={() => setShowAddMenu(v => !v)} disabled={salvando}>
                        <Plus size={12} /> Adicionar
                      </button>
                      {showAddMenu && (
                        <>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => { setShowAddMenu(false); setAddMenuHover(null) }} />
                          <div style={{ position: 'fixed', zIndex: 200, background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 12, boxShadow: 'var(--sh-lg)', padding: '12px 14px', width: 320, display: 'flex', flexDirection: 'column', gap: 10 }}
                            ref={el => {
                              if (!el) return
                              const btn = document.getElementById('btn-add-campo')
                              if (!btn) return
                              const r = btn.getBoundingClientRect()
                              el.style.top = (r.bottom + 6) + 'px'
                              el.style.left = Math.min(r.left, window.innerWidth - 336) + 'px'
                            }}>
                            {GRUPOS_ADD.map(grupo => (
                              <div key={grupo.label}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 6 }}>{grupo.label}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                  {grupo.items.map(item => (
                                    <button key={item.label} className="btn btn-ghost"
                                      style={{ height: 28, fontSize: 11, padding: '0 10px', opacity: item.dis ? .35 : 1 }}
                                      onMouseEnter={() => setAddMenuHover(item.desc)}
                                      onMouseLeave={() => setAddMenuHover(null)}
                                      onClick={() => { if (!item.dis) { item.action(); setShowAddMenu(false); setAddMenuHover(null) } }}
                                      disabled={salvando || !!item.dis}>
                                      {item.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 8, minHeight: 34, fontSize: 11, color: addMenuHover ? 'var(--t2)' : 'var(--t3)', fontStyle: addMenuHover ? 'normal' : 'italic', lineHeight: 1.5, transition: 'color .15s' }}>
                              {addMenuHover || 'Passe o mouse sobre um tipo para ver a descrição.'}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Lista de campos */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px' }}>
                    {campos.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--t3)', fontSize: 11 }}>
                        Nenhum campo ainda.
                      </div>
                    )}
                    {campos.map((campo) => {
                      const meta = TIPO_META[campo.tipo] || { short: '?', color: '#94A3B8' }
                      const isSel = campo._key === selKey
                      return (
                        <div key={campo._key}
                          onClick={() => selecionar(isSel ? null : campo._key)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                            background: isSel ? 'rgba(255,107,43,.1)' : 'transparent',
                            border: `1px solid ${isSel ? 'var(--or)' : 'transparent'}`,
                            transition: 'background .12s, border-color .12s',
                          }}
                          onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--s3)' }}
                          onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}>
                          <span style={{ fontSize: 8, fontWeight: 700, background: meta.color + '22', color: meta.color, padding: '2px 5px', borderRadius: 4, border: `1px solid ${meta.color}44`, flexShrink: 0, minWidth: 24, textAlign: 'center', lineHeight: 1.4 }}>{meta.short}</span>
                          <span style={{ flex: 1, fontSize: 12, color: campo.label ? 'var(--t1)' : 'var(--t3)', fontStyle: campo.label ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {campo.label || 'Sem label'}
                          </span>
                          {campo.obrigatorio && <span style={{ fontSize: 7, fontWeight: 700, color: 'var(--red)', flexShrink: 0 }}>OBR</span>}
                          <button
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 2, borderRadius: 4, flexShrink: 0, opacity: .6 }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.opacity = '1' }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.opacity = '.6' }}
                            onClick={e => { e.stopPropagation(); if (selKey === campo._key) selecionar(null); setCampos(p => p.filter(c => c._key !== campo._key)) }}
                            disabled={salvando}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Rodapé hint */}
                  <div style={{ padding: '6px 10px', borderTop: '1px solid var(--bd)', fontSize: 9, color: 'var(--t3)', flexShrink: 0 }}>
                    id · ativo{campos.some(c => c.tipo === 'timestamps') ? ' · criado_em · alterado_em' : ''}{campos.some(c => c.tipo === 'favorito') ? ' · favorito' : ''}
                  </div>
                </div>

                {/* Painel direito: edição */}
                <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: 'var(--s1)' }}>
                  {renderPainel()}
                </div>

              </div>
            </>
          )
        })()}

        {aba === 'designer' && (
          <FormDesigner
            campos={campos}
            onChange={handleDesignerChange}
            canvasConfigW={canvasW}
            canvasConfigH={canvasH}
            onCanvasConfig={(w, h) => { setCanvasW(w); setCanvasH(h) }}
            livePreview={dsLivePreview}   onLivePreview={setDsLivePreview}
            showGrid={dsShowGrid}         onShowGrid={setDsShowGrid}
            showRulers={dsShowRulers}     onShowRulers={setDsShowRulers}
            snapSz={dsSnapSz}             onSnapSz={setDsSnapSz}
            canvasMargins={canvasMargins} onCanvasMargins={setCanvasMargins}
            renderFieldPanel={renderCampoPainel}
          />
        )}

        {aba === 'preview' && renderPreview(false)}

      </div>

      <FormToolbar
        mode="edit"
        saving={salvando}
        onGravar={handleSalvar}
        onDesistir={onFechar}
      />

      {showTemplates && <TemplateModal onSelecionar={aplicarTemplate} onFechar={() => setShowTemplates(false)} />}
    </div>
  )

  // ── MODO MODAL (existente) ────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={{
        background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16,
        width: aba === 'designer' ? '96vw' : '100%',
        maxWidth: aba === 'designer' ? 1200 : 900,
        height: aba === 'designer' ? '90vh' : 'auto',
        maxHeight: aba === 'designer' ? '90vh' : '92vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--sh-lg)',
        transition: 'max-width .2s, width .2s',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderBottom: '1px solid var(--bd)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>
              {editando ? `Editar: ${tela.nome_tela}` : 'Nova Tela'}
            </div>
            {!editando && (
              <button className="btn btn-ghost" onClick={() => setShowTemplates(true)} style={{ height: 30, gap: 5, fontSize: 11 }}>
                <Layout size={12} /> Templates
              </button>
            )}
          </div>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex' }}><X size={18} /></button>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--bd)', padding: '0 22px', flexShrink: 0 }}>
          {abas.map(({ id, Icon, label }) => (
            <button key={id} onClick={() => setAba(id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
              borderBottom: `2px solid ${aba === id ? 'var(--or)' : 'transparent'}`,
              padding: '9px 4px', marginRight: 20, fontSize: 12,
              color: aba === id ? 'var(--or)' : 'var(--t3)',
              cursor: 'pointer', fontWeight: aba === id ? 600 : 400, marginBottom: -1,
            }}>
              <Icon size={13} /> {label}
            </button>
          ))}
          {aba === 'designer' && (
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--t3)', alignSelf: 'center', paddingRight: 4 }}>
              Arraste campos • Resize pelo canto inferior direito • Clique para selecionar
            </span>
          )}
        </div>

        {/* Body */}
        <div style={{ overflowY: aba === 'designer' ? 'hidden' : 'auto', flex: 1, padding: aba === 'designer' ? 14 : '18px 22px', display: 'flex', flexDirection: 'column', gap: aba === 'designer' ? 0 : 20, minHeight: 0 }}>

          {/* ABA: CAMPOS */}
          {aba === 'campos' && (
            <>
              {renderIdentificacao(false)}

              {/* Lista de campos */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={secHead}>Campos do Formulário</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }} disabled={salvando || campos.some(c => c.tipo === 'favorito')}
                      onClick={() => setCampos(p => [...p, favoritoVazio(p)])}>
                      <Star size={12} /> Favorito
                    </button>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }} disabled={salvando || campos.some(c => c.tipo === 'timestamps')}
                      onClick={() => setCampos(p => [...p, timestampsVazio(p)])}>
                      <Clock size={12} /> Datas
                    </button>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }}
                      onClick={() => setCampos(p => [...p, divisorVazio(p)])} disabled={salvando}>
                      <Minus size={12} /> Divisor
                    </button>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }}
                      onClick={() => addCampo(botaoVazio)} disabled={salvando}>
                      <CircleDot size={12} /> Botão
                    </button>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }}
                      onClick={() => addCampo(lookupVazio)} disabled={salvando}>
                      <ExternalLink size={12} /> Lookup
                    </button>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }}
                      onClick={() => addCampo(campoVazio)} disabled={salvando}>
                      <Plus size={12} /> Campo
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 8 }}>
                  Use a aba <strong style={{ color: 'var(--or)' }}>Designer</strong> para posicionar e dimensionar os campos visualmente
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {campos.map((campo, idx) => renderCampoCard(campo, idx))}
                  {campos.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)', fontSize: 12, background: 'var(--s2)', borderRadius: 10, border: '1px dashed var(--bd)' }}>
                      Nenhum campo adicionado. Clique em <strong>+ Adicionar Campo</strong>.
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 8, padding: '12px 14px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bd)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Elementos especiais</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }} disabled={salvando || campos.some(c => c.tipo === 'favorito')}
                      onClick={() => setCampos(p => [...p, favoritoVazio(p)])}>
                      <Star size={12} /> Favorito
                    </button>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }} disabled={salvando || campos.some(c => c.tipo === 'timestamps')}
                      onClick={() => setCampos(p => [...p, timestampsVazio(p)])}>
                      <Clock size={12} /> Datas
                    </button>
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'monospace' }}>
                    Sempre incluídas: <span style={{ color: 'var(--t2)' }}>
                      id · ativo{campos.some(c => c.tipo === 'timestamps') ? ' · criado_em · alterado_em' : ''}{campos.some(c => c.tipo === 'favorito') ? ' · favorito' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ABA: DESIGNER */}
          {aba === 'designer' && (
            <FormDesigner
              campos={campos}
              onChange={handleDesignerChange}
              canvasConfigW={canvasW}
              canvasConfigH={canvasH}
              onCanvasConfig={(w, h) => { setCanvasW(w); setCanvasH(h) }}
              renderFieldPanel={renderCampoPainel}
            />
          )}

          {/* ABA: PREVIEW */}
          {aba === 'preview' && renderPreview(false)}

        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 22px', borderTop: '1px solid var(--bd)', flexShrink: 0, background: 'var(--s1)', gap: 12 }}>
          <div>
            {erro && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--red)' }}><AlertCircle size={13} /> {erro}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onFechar} disabled={salvando}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSalvar} disabled={salvando}>
              <Save size={13} /> {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Criar Tela'}
            </button>
          </div>
        </div>

      </div>
      {showTemplates && <TemplateModal onSelecionar={aplicarTemplate} onFechar={() => setShowTemplates(false)} />}
    </div>
  )
}
