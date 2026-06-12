import { useState, useEffect, useCallback } from 'react'
import {
  LayoutGrid, Plus, Search, Edit2, Trash2, Power, PowerOff,
  Database, RefreshCw, FolderOpen, Check, X, Zap,
  ChevronUp, ChevronDown, Menu, Save, ExternalLink,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import FormBuilderModal from './FormBuilderModal'
import FuncoesTab from './FuncoesTab'

function TilaIcon({ nome, size = 15, cor = 'var(--or)' }) {
  const key  = (nome || 'layout').split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  const Icon = LucideIcons[key] || LayoutGrid
  return <Icon size={size} color={cor} />
}

import '../App.css'

function notifyTelasUpdated(cb) {
  cb?.()
  window.dispatchEvent(new CustomEvent('krontech:telas-updated'))
}

export default function FormBuilder({ onTelasUpdated, hideHeader = false, hideTabs = false, initialTab = 'telas' }) {
  const [telas,       setTelas]       = useState([])
  const [modulos,     setModulos]     = useState([])
  const [busca,       setBusca]       = useState('')
  const [carregando,  setCarregando]  = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [telaEditando,setTelaEditando]= useState(null)
  const [erro,        setErro]        = useState(null)
  const [abaAtiva,    setAbaAtiva]    = useState(initialTab)

  // Estado para gestão de módulos
  const [novoMod,     setNovoMod]     = useState({ nome: '', icone: 'folder', ordem: 99 })
  const [editandoMod, setEditandoMod] = useState(null)
  const [erroMod,     setErroMod]     = useState('')

  // Ordem global unificada do menu (seções fixas + módulos dinâmicos)
  // Cada item: { id, label, tipo: 'fixo'|'dinamico' }
  const [ordemGlobal,  setOrdemGlobal]  = useState([])
  const [ordemGrupos,  setOrdemGrupos]  = useState({})
  const [salvandoMenu, setSalvandoMenu] = useState(false)
  const [menuSalvo,    setMenuSalvo]    = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true); setErro(null)
    try {
      const [t, m] = await Promise.all([
        window.api.formBuilder.listarTelas(),
        window.api.formBuilder.listarModulos(),
      ])
      setTelas(t); setModulos(m)
    } catch(e) { setErro(e.message) }
    finally    { setCarregando(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  // Reconstrói a ordemGlobal unificada sempre que módulos são carregados
  useEffect(() => {
    window.api.config.get().then(cfg => {
      const p = cfg?.Personalizacao || {}
      const fixedItems = [
        { id: 'inicio',      label: p.label_inicio      || 'Início',      tipo: 'fixo' },
        { id: 'gestao',      label: p.label_gestao      || 'Gestão',      tipo: 'fixo' },
        { id: 'ferramentas', label: p.label_ferramentas || 'Ferramentas', tipo: 'fixo' },
      ]
      const dynItems = modulos.map(m => ({ id: `din_${m.nome}`, label: m.nome, tipo: 'dinamico' }))
      const allItems = [...fixedItems, ...dynItems]
      const savedOrder = (p.menu_global_ordem || '').split(',').filter(Boolean)
      if (savedOrder.length) {
        const ordered = []
        savedOrder.forEach(sid => { const x = allItems.find(i => i.id === sid); if (x) ordered.push(x) })
        allItems.forEach(x => { if (!ordered.find(o => o.id === x.id)) ordered.push(x) })
        setOrdemGlobal(ordered)
      } else {
        setOrdemGlobal(allItems)
      }
    }).catch(() => {
      setOrdemGlobal([
        { id: 'inicio',      label: 'Início',      tipo: 'fixo' },
        { id: 'gestao',      label: 'Gestão',      tipo: 'fixo' },
        { id: 'ferramentas', label: 'Ferramentas', tipo: 'fixo' },
        ...modulos.map(m => ({ id: `din_${m.nome}`, label: m.nome, tipo: 'dinamico' })),
      ])
    })
  }, [modulos])

  // Reconstrói grupos de ordem quando telas mudam
  useEffect(() => {
    const grupos = {}
    telas
      .filter(t => !t.sistema && t.ativo)
      .sort((a, b) => a.ordem_menu - b.ordem_menu)
      .forEach(t => {
        const key  = t.modulo_id ?? '__sem__'
        const nome = t.modulo_nome || 'Sem módulo'
        if (!grupos[key]) grupos[key] = { nome, telas: [] }
        grupos[key].telas.push(t)
      })
    setOrdemGrupos(grupos)
  }, [telas])

  const telasFiltradas = telas.filter(t =>
    t.nome_tela.toLowerCase().includes(busca.toLowerCase()) ||
    t.nome_tabela.toLowerCase().includes(busca.toLowerCase()) ||
    (t.modulo_nome || '').toLowerCase().includes(busca.toLowerCase())
  )

  async function handleToggleAtivo(tela) {
    const acao = tela.ativo ? 'Inativar' : 'Reativar'
    if (!confirm(`${acao} a tela "${tela.nome_tela}"?`)) return
    try {
      if (tela.ativo) await window.api.formBuilder.inativarTela(tela.id)
      else            await window.api.formBuilder.reativarTela(tela.id)
      await carregar()
      notifyTelasUpdated(onTelasUpdated)
    } catch(e) { alert('Erro: ' + e.message) }
  }

  async function handleExcluir(tela) {
    if (!confirm(`ATENÇÃO: Isso vai EXCLUIR a tabela "${tela.nome_tabela}" e TODOS os dados.\n\nDeseja continuar?`)) return
    try {
      await window.api.formBuilder.excluirTela(tela.id)
      await carregar()
      notifyTelasUpdated(onTelasUpdated)
    } catch(e) { alert('Erro: ' + e.message) }
  }

  async function abrirEditar(tela) {
    try {
      const completa = await window.api.formBuilder.buscarTela(tela.id)
      setTelaEditando(completa); setModalAberto(true)
    } catch(e) { alert('Erro ao carregar tela: ' + e.message) }
  }

  async function handleSalvar() {
    setModalAberto(false); setTelaEditando(null)
    await carregar()
    onTelasUpdated?.()
  }

  function moverItem(idx, dir) {
    setOrdemGlobal(prev => {
      const next = [...prev]
      const novo = idx + dir
      if (novo < 0 || novo >= next.length) return prev
      ;[next[idx], next[novo]] = [next[novo], next[idx]]
      return next
    })
  }

  function setItemLabel(idx, label) {
    setOrdemGlobal(prev => prev.map((x, i) => i === idx ? { ...x, label } : x))
  }

  function moverTela(moduloKey, idx, dir) {
    setOrdemGrupos(prev => {
      const grupo = [...prev[moduloKey].telas]
      const novo  = idx + dir
      if (novo < 0 || novo >= grupo.length) return prev
      ;[grupo[idx], grupo[novo]] = [grupo[novo], grupo[idx]]
      return { ...prev, [moduloKey]: { ...prev[moduloKey], telas: grupo } }
    })
  }

  async function salvarMenuLateral() {
    setSalvandoMenu(true)
    try {
      const fixos = ordemGlobal.filter(x => x.tipo === 'fixo')
      const byId = Object.fromEntries(fixos.map(x => [x.id, x.label]))
      await window.api.config.setSection('Personalizacao', {
        label_inicio:       byId.inicio       || 'Início',
        label_gestao:       byId.gestao       || 'Gestão',
        label_ferramentas:  byId.ferramentas  || 'Ferramentas',
        secoes_ordem:       fixos.map(x => x.id).join(','),
        menu_global_ordem:  ordemGlobal.map(x => x.id).join(','),
      })
      window.dispatchEvent(new CustomEvent('krontech:config-changed', {
        detail: {
          labelInicio:       byId.inicio       || 'Início',
          labelGestao:       byId.gestao       || 'Gestão',
          labelFerramentas:  byId.ferramentas  || 'Ferramentas',
          secoesOrdem:       fixos.map(x => x.id).join(','),
          menuGlobalOrdem:   ordemGlobal.map(x => x.id).join(','),
        }
      }))
      const items = []
      Object.values(ordemGrupos).forEach(({ telas }) =>
        telas.forEach((t, idx) => items.push({ id: t.id, ordem_menu: idx + 1 }))
      )
      if (items.length) await window.api.formBuilder.reordenarTelas(items)
      await carregar()
      setMenuSalvo(true)
      setTimeout(() => setMenuSalvo(false), 2500)
    } catch(e) { alert('Erro ao salvar: ' + e.message) }
    finally { setSalvandoMenu(false) }
  }

  async function handleCriarModulo() {
    setErroMod('')
    if (!novoMod.nome.trim()) { setErroMod('Informe o nome do módulo.'); return }
    try {
      await window.api.formBuilder.criarModulo(novoMod)
      setNovoMod({ nome: '', icone: 'folder', ordem: 99 })
      await carregar()
    } catch(e) { setErroMod(e.message) }
  }

  async function handleSalvarModulo(id) {
    if (!editandoMod?.nome?.trim()) return
    try {
      await window.api.formBuilder.editarModulo(id, editandoMod)
      setEditandoMod(null)
      await carregar()
    } catch(e) { alert('Erro: ' + e.message) }
  }

  async function handleExcluirModulo(mod) {
    if (!confirm(`Excluir módulo "${mod.nome}"?`)) return
    try {
      await window.api.formBuilder.excluirModulo(mod.id)
      await carregar()
    } catch(e) { alert('Erro: ' + e.message) }
  }

  // ── Estilos inline (seguem tokens KronTech) ───────────────────────────────
  const thS = {
    padding: '8px 14px', fontSize: 9, fontWeight: 700, color: 'var(--t3)',
    letterSpacing: 1.2, textTransform: 'uppercase',
    borderBottom: '1px solid var(--bd)', background: 'var(--s2)', textAlign: 'left',
  }
  const tdS = {
    padding: '10px 14px', fontSize: 12, color: 'var(--t2)',
    borderBottom: '1px solid var(--bd)', verticalAlign: 'middle',
  }

  if (modalAberto) return (
    <FormBuilderModal
      inline
      tela={telaEditando}
      modulos={modulos}
      onSalvar={handleSalvar}
      onFechar={() => { setModalAberto(false); setTelaEditando(null) }}
    />
  )

  const modArrowBtn = (dis) => ({
    width: 24, height: 24, borderRadius: 6, border: '1px solid var(--bd)',
    background: 'var(--s2)', cursor: dis ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: dis ? 0.3 : 1, color: 'var(--t2)', flexShrink: 0,
  })
  const modIconBox = { width: 32, height: 32, flexShrink: 0, background: 'var(--or3)', border: '1px solid rgba(255,107,43,.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const modSubHead = { fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }

  return (
    <div style={hideHeader
      ? { height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
      : { display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 24px', height: '100%', overflow: 'auto' }
    }>

      {/* Header – oculto na janela Designer */}
      {!hideHeader && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--or3)', border: '1px solid rgba(255,107,43,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutGrid size={18} color="var(--or)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', letterSpacing: -0.3 }}>Criador de Telas</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>Crie cadastros personalizados sem codificação</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={carregar} title="Atualizar">
              <RefreshCw size={13} style={{ animation: carregando ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            {abaAtiva === 'telas' && (
              <button className="btn btn-primary" onClick={() => { setTelaEditando(null); setModalAberto(true) }}>
                <Plus size={13} /> Nova Tela
              </button>
            )}
          </div>
        </div>
      )}

      {/* Abas — ocultas quando a navegação é feita externamente (Designer) */}
      {!hideTabs && <div style={hideHeader
        ? { display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--bd)', padding: '0 16px', flexShrink: 0, background: 'var(--s3)', minHeight: 44 }
        : { display: 'flex', gap: 0, borderBottom: '1px solid var(--bd)', marginBottom: -4 }
      }>
        {[
          { id: 'telas',   label: 'Telas',   Icon: LayoutGrid  },
          { id: 'modulos', label: 'Módulos', Icon: FolderOpen  },
          { id: 'funcoes', label: 'Funções', Icon: Zap         },
        ].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setAbaAtiva(id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none',
            borderBottom: `2px solid ${abaAtiva === id ? 'var(--or)' : 'transparent'}`,
            padding: hideHeader ? '11px 14px' : '8px 16px',
            fontSize: 12, cursor: 'pointer', marginBottom: -1,
            color: abaAtiva === id ? 'var(--or)' : 'var(--t2)',
            fontWeight: abaAtiva === id ? 650 : 400,
            transition: 'color 0.15s',
          }}>
            <Icon size={13} /> {label}
          </button>
        ))}
        {hideHeader && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="btn btn-ghost" style={{ height: 28 }} onClick={carregar} title="Atualizar">
              <RefreshCw size={13} style={{ animation: carregando ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            {abaAtiva === 'telas' && (
              <button className="btn btn-primary" style={{ height: 28, fontSize: 12 }} onClick={() => { setTelaEditando(null); setModalAberto(true) }}>
                <Plus size={13} /> Nova Tela
              </button>
            )}
          </div>
        )}
      </div>}

      {/* Conteúdo das abas */}
      <div style={hideHeader
        ? { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }
        : { display: 'flex', flexDirection: 'column', gap: 16 }
      }>

      {/* ── ABA MÓDULOS ── */}
      {abaAtiva === 'modulos' && (
        <div style={hideHeader
          ? { flex: 1, overflow: 'hidden', display: 'flex', gap: 14, padding: '14px 16px' }
          : { display: 'flex', gap: 16 }
        }>

          {/* ─── COLUNA ESQUERDA: gerenciamento de módulos ─── */}
          <div style={{ flex: '0 0 360px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', minWidth: 0 }}>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1 }}>Módulos</span>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>— agrupe telas no sidebar</span>
            </div>

            {/* Criar módulo */}
            <div style={{ background: 'var(--s2)', border: `1px solid ${erroMod ? 'var(--red)' : 'var(--bd)'}`, borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Nome *</label>
                  <input className="form-input" value={novoMod.nome}
                    onChange={e => { setNovoMod(p => ({ ...p, nome: e.target.value })); setErroMod('') }}
                    onKeyDown={e => e.key === 'Enter' && handleCriarModulo()}
                    placeholder="Ex: Vendas, RH..." autoComplete="off" />
                </div>
                <div style={{ width: 60 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Ordem</label>
                  <input className="form-input" type="number" min={1} value={novoMod.ordem}
                    onChange={e => setNovoMod(p => ({ ...p, ordem: Number(e.target.value) }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5 }}>Ícone</label>
                    <a href="https://lucide.dev/icons/" target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--or)', textDecoration: 'none', opacity: .8 }}>
                      <ExternalLink size={10} /> ver todos
                    </a>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ ...modIconBox, width: 34, height: 34, flexShrink: 0 }}><TilaIcon nome={novoMod.icone} size={15} /></div>
                    <input className="form-input" value={novoMod.icone}
                      onChange={e => setNovoMod(p => ({ ...p, icone: e.target.value }))}
                      placeholder="folder, users..." autoComplete="off" />
                  </div>
                </div>
                <button className="btn btn-primary" style={{ height: 34, flexShrink: 0 }} onClick={handleCriarModulo}>
                  <Plus size={13} /> Criar
                </button>
              </div>
              {erroMod && <div style={{ fontSize: 11, color: 'var(--red)' }}>{erroMod}</div>}
            </div>

            {/* Lista de módulos */}
            {modulos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--t3)', fontSize: 12, background: 'var(--s2)', borderRadius: 10, border: '1px dashed var(--bd)' }}>
                Nenhum módulo. Crie o primeiro acima.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {modulos.map(mod => {
                  const isEdit = editandoMod?.id === mod.id
                  const qtd    = telas.filter(t => t.modulo_id === mod.id).length
                  return (
                    <div key={mod.id} style={{
                      background: isEdit ? 'rgba(255,107,43,.04)' : 'var(--s1)',
                      border: `1.5px solid ${isEdit ? 'var(--or)' : 'var(--bd)'}`,
                      borderRadius: 9, padding: '8px 10px',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      {isEdit ? (
                        <>
                          <input className="form-input" style={{ flex: 1, height: 30 }}
                            value={editandoMod.nome}
                            onChange={e => setEditandoMod(p => ({ ...p, nome: e.target.value }))}
                            autoFocus />
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', width: 120 }}>
                            <div style={{ ...modIconBox, width: 30, height: 30, background: 'var(--s3)', border: '1px solid var(--bd)', flexShrink: 0 }}><TilaIcon nome={editandoMod.icone} size={13} /></div>
                            <input className="form-input" style={{ flex: 1, height: 30 }}
                              value={editandoMod.icone}
                              onChange={e => setEditandoMod(p => ({ ...p, icone: e.target.value }))}
                              placeholder="ícone" />
                          </div>
                          <button className="btn btn-primary" style={{ height: 30, padding: '0 10px' }} onClick={() => handleSalvarModulo(mod.id)}>
                            <Check size={12} />
                          </button>
                          <button className="btn btn-ghost" style={{ height: 30, padding: '0 8px' }} onClick={() => setEditandoMod(null)}>
                            <X size={13} />
                          </button>
                        </>
                      ) : (
                        <>
                          <div style={modIconBox}><TilaIcon nome={mod.icone} size={14} /></div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.nome}</div>
                            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1, display: 'flex', gap: 6 }}>
                              <code style={{ fontFamily: 'monospace', background: 'var(--s3)', padding: '1px 4px', borderRadius: 3 }}>{mod.icone}</code>
                              <span>{qtd} tela{qtd !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          <button className="btn btn-ghost" style={{ height: 26, padding: '0 8px', fontSize: 11 }}
                            onClick={() => setEditandoMod({ id: mod.id, nome: mod.nome, icone: mod.icone, ordem: mod.ordem })}>
                            <Edit2 size={11} />
                          </button>
                          <button className="btn btn-danger" style={{ height: 26, padding: '0 7px' }}
                            onClick={() => handleExcluirModulo(mod)}
                            disabled={qtd > 0}
                            title={qtd > 0 ? `${qtd} tela(s) vinculada(s) — remova antes` : 'Excluir módulo'}>
                            <Trash2 size={11} />
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ─── COLUNA DIREITA: menu lateral ─── */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: hideHeader ? 'hidden' : 'visible' }}>
            <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', ...(hideHeader ? { height: '100%' } : { minHeight: 440 }) }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--bd)', background: 'var(--s1)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Menu size={13} color="var(--or)" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Menu Lateral</span>
                  <span style={{ fontSize: 11, color: 'var(--t3)' }}>— ordem das seções e telas</span>
                </div>
                <button className="btn btn-primary" style={{ height: 30, padding: '0 14px', fontSize: 11 }}
                  onClick={salvarMenuLateral} disabled={salvandoMenu}>
                  {menuSalvo ? <><Check size={12} /> Salvo</> : salvandoMenu ? 'Salvando...' : <><Save size={12} /> Salvar</>}
                </button>
              </div>

              {/* Conteúdo em duas colunas */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', gap: 0 }}>

                {/* Coluna A: Ordem do menu */}
                <div style={{ flex: 1, padding: '12px 14px', borderRight: '1px solid var(--bd)' }}>
                  <div style={modSubHead}>Ordem do menu</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>Reordene seções fixas e módulos</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {ordemGlobal.map((item, idx) => (
                      <div key={item.id} style={{ display: 'flex', gap: 6, alignItems: 'center', height: 36, background: 'var(--bg)', border: '1px solid var(--bd)', borderRadius: 7, padding: '0 8px' }}>
                        <span style={{ fontSize: 10, color: 'var(--t3)', width: 14, textAlign: 'center', flexShrink: 0 }}>{idx + 1}</span>
                        {item.tipo === 'fixo' ? (
                          <input className="form-input" value={item.label}
                            onChange={e => setItemLabel(idx, e.target.value)}
                            style={{ flex: 1, height: 26, fontSize: 12 }} />
                        ) : (
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, background: 'var(--or3)', color: 'var(--or)', padding: '2px 5px', borderRadius: 3, flexShrink: 0, lineHeight: 1.6 }}>MOD</span>
                            <span style={{ fontSize: 12, color: 'var(--t1)', fontWeight: 500 }}>{item.label}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                          <button onClick={() => moverItem(idx, -1)} disabled={idx === 0} style={modArrowBtn(idx === 0)}><ChevronUp size={12} /></button>
                          <button onClick={() => moverItem(idx, 1)} disabled={idx === ordemGlobal.length - 1} style={modArrowBtn(idx === ordemGlobal.length - 1)}><ChevronDown size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coluna B: Ordem das telas */}
                <div style={{ flex: 1, padding: '12px 14px' }}>
                  <div style={modSubHead}>Ordem das telas</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>Reordene telas dentro de cada módulo</div>
                  {Object.keys(ordemGrupos).length === 0 ? (
                    <div style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic', marginTop: 16 }}>Nenhuma tela cadastrada.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {Object.entries(ordemGrupos).map(([key, { nome, telas: gr }]) => (
                        <div key={key}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{nome}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {gr.map((t, idx) => (
                              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, background: 'var(--bg)', border: '1px solid var(--bd)', borderRadius: 7, padding: '0 8px' }}>
                                <span style={{ fontSize: 10, color: 'var(--t3)', width: 14, textAlign: 'center', flexShrink: 0 }}>{idx + 1}</span>
                                <span style={{ flex: 1, fontSize: 12, color: 'var(--t1)', fontWeight: 500 }}>{t.nome_tela}</span>
                                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                                  <button onClick={() => moverTela(key, idx, -1)} disabled={idx === 0} style={modArrowBtn(idx === 0)}><ChevronUp size={12} /></button>
                                  <button onClick={() => moverTela(key, idx, 1)} disabled={idx === gr.length - 1} style={modArrowBtn(idx === gr.length - 1)}><ChevronDown size={12} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── ABA TELAS ── */}
      {abaAtiva === 'telas' && (hideHeader ? (
        <>
          {/* Busca — fixa acima do scroll */}
          <div style={{ padding: '10px 16px 9px', borderBottom: '1px solid var(--bd)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--s1)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', border: '1px solid var(--bd)', borderRadius: 8, padding: '0 11px', flex: 1, maxWidth: 440, height: 32, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
              <Search size={13} color="var(--t3)" style={{ flexShrink: 0 }} />
              <input value={busca} onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por nome, tabela ou módulo..."
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: 'var(--t1)', width: '100%', fontFamily: 'var(--fb)' }} />
            </div>
            {busca && (
              <button onClick={() => setBusca('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 0, display: 'flex', alignItems: 'center' }}>
                <svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg>
              </button>
            )}
            <span style={{ fontSize: 11, color: 'var(--t3)', flexShrink: 0 }}>
              {telasFiltradas.length} {telasFiltradas.length !== 1 ? 'telas' : 'tela'}
            </span>
          </div>
          {erro && (
            <div style={{ margin: '8px 20px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', color: 'var(--red)', borderRadius: 9, padding: '10px 14px', fontSize: 12 }}>
              <span>{erro}</span>
              <button onClick={() => setErro(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}>✕</button>
            </div>
          )}
          {/* Corpo scrollável */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {carregando ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 13 }}>Carregando...</div>
            ) : telasFiltradas.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'var(--t3)', textAlign: 'center', padding: '0 48px' }}>
                {/* Ícone */}
                <div style={{
                  width: 72, height: 72, borderRadius: 20,
                  background: 'var(--s1)',
                  border: '1px solid var(--bd)',
                  boxShadow: 'var(--sh-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Database size={30} strokeWidth={1.1} color="var(--t3)" />
                </div>
                {/* Texto */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', letterSpacing: -0.3 }}>
                    {busca ? 'Nenhum resultado' : 'Nenhuma tela criada'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.6, maxWidth: 280 }}>
                    {busca
                      ? `Nenhuma tela corresponde a "${busca}".`
                      : 'Crie telas de cadastro personalizadas sem escrever código. Campos, tipos e módulos configurados visualmente.'}
                  </div>
                </div>
                {/* CTA */}
                {!busca && (
                  <button className="btn btn-primary" style={{ height: 36, padding: '0 20px', fontSize: 13 }} onClick={() => { setTelaEditando(null); setModalAberto(true) }}>
                    <Plus size={14} /> Nova Tela
                  </button>
                )}
                {busca && (
                  <button className="btn btn-ghost" style={{ height: 32, fontSize: 12 }} onClick={() => setBusca('')}>
                    Limpar busca
                  </button>
                )}
              </div>
            ) : (
              <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {telasFiltradas.map(tela => (
                  <div key={tela.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: 'var(--s1)', border: '1.5px solid var(--bd)',
                    borderRadius: 12, padding: '12px 16px',
                    boxShadow: 'var(--sh-xs)',
                    opacity: tela.ativo ? 1 : 0.55,
                    transition: 'box-shadow .15s',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: tela.sistema ? 'rgba(96,165,250,.1)' : 'var(--or3)',
                      border: `1px solid ${tela.sistema ? 'rgba(96,165,250,.2)' : 'rgba(255,107,43,.15)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <TilaIcon nome={tela.icone} size={18} cor={tela.sistema ? 'var(--blue)' : 'var(--or)'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tela.nome_tela}
                        </span>
                        {!tela.ativo && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'var(--s3)', color: 'var(--t3)', flexShrink: 0 }}>INATIVA</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--t3)', flexWrap: 'wrap' }}>
                        <code style={{ fontFamily: 'monospace', fontSize: 10, background: 'var(--s3)', padding: '1px 6px', borderRadius: 4, color: 'var(--t2)' }}>{tela.nome_tabela}</code>
                        {tela.modulo_nome && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><FolderOpen size={11} /> {tela.modulo_nome}</span>}
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: tela.sistema ? 'rgba(96,165,250,.1)' : 'var(--or3)', color: tela.sistema ? 'var(--blue)' : 'var(--or)' }}>
                          {tela.sistema ? 'SISTEMA' : 'USUÁRIO'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-ghost" style={{ height: 32, padding: '0 12px', gap: 5, fontSize: 12 }} onClick={() => abrirEditar(tela)} title="Editar tela no Designer">
                        <Edit2 size={13} /> Editar
                      </button>
                      {!tela.sistema && (
                        <>
                          <button className="btn btn-ghost" style={{ height: 32, padding: '0 10px', color: tela.ativo ? 'var(--t3)' : 'var(--green)' }}
                            onClick={() => handleToggleAtivo(tela)} title={tela.ativo ? 'Inativar tela' : 'Reativar tela'}>
                            {tela.ativo ? <PowerOff size={13} /> : <Power size={13} />}
                          </button>
                          <button className="btn btn-danger" style={{ height: 32, padding: '0 10px' }} onClick={() => handleExcluir(tela)} title="Excluir tela e tabela">
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 10, color: 'var(--t3)', padding: '4px 2px' }}>
                  {telasFiltradas.length} tela{telasFiltradas.length !== 1 ? 's' : ''} · {telasFiltradas.filter(t => t.ativo).length} ativa{telasFiltradas.filter(t => t.ativo).length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Busca */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 10, padding: '0 12px', flex: 1, maxWidth: 400, height: 36, boxShadow: 'var(--sh-xs)' }}>
              <Search size={13} color="var(--t3)" />
              <input value={busca} onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por nome, tabela ou módulo..."
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: 'var(--t1)', width: '100%', fontFamily: 'var(--fb)' }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>
              {telasFiltradas.length} tela{telasFiltradas.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Erro */}
          {erro && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', color: 'var(--red)', borderRadius: 9, padding: '10px 14px', fontSize: 12 }}>
              <span>{erro}</span>
              <button onClick={() => setErro(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}>✕</button>
            </div>
          )}

          {/* Conteúdo */}
          {carregando ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)', fontSize: 13 }}>Carregando...</div>
          ) : telasFiltradas.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '70px 20px', color: 'var(--t3)', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--s2)', border: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={26} strokeWidth={1.25} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)', marginBottom: 4 }}>Nenhuma tela encontrada</div>
                <div style={{ fontSize: 12 }}>Crie sua primeira tela de cadastro personalizada.</div>
              </div>
              <button className="btn btn-primary" onClick={() => { setTelaEditando(null); setModalAberto(true) }}>
                <Plus size={13} /> Nova Tela
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {telasFiltradas.map(tela => (
                <div key={tela.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'var(--s1)', border: '1.5px solid var(--bd)',
                  borderRadius: 12, padding: '12px 16px',
                  boxShadow: 'var(--sh-xs)',
                  opacity: tela.ativo ? 1 : 0.55,
                  transition: 'box-shadow .15s',
                }}>
                  {/* Ícone */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: tela.sistema ? 'rgba(96,165,250,.1)' : 'var(--or3)',
                    border: `1px solid ${tela.sistema ? 'rgba(96,165,250,.2)' : 'rgba(255,107,43,.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <TilaIcon nome={tela.icone} size={18} cor={tela.sistema ? 'var(--blue)' : 'var(--or)'} />
                  </div>

                  {/* Info principal */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tela.nome_tela}
                      </span>
                      {!tela.ativo && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'var(--s3)', color: 'var(--t3)', flexShrink: 0 }}>
                          INATIVA
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--t3)', flexWrap: 'wrap' }}>
                      <code style={{ fontFamily: 'monospace', fontSize: 10, background: 'var(--s3)', padding: '1px 6px', borderRadius: 4, color: 'var(--t2)' }}>
                        {tela.nome_tabela}
                      </code>
                      {tela.modulo_nome && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <FolderOpen size={11} /> {tela.modulo_nome}
                        </span>
                      )}
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                        background: tela.sistema ? 'rgba(96,165,250,.1)' : 'var(--or3)',
                        color: tela.sistema ? 'var(--blue)' : 'var(--or)',
                      }}>
                        {tela.sistema ? 'SISTEMA' : 'USUÁRIO'}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-ghost" style={{ height: 32, padding: '0 12px', gap: 5, fontSize: 12 }}
                      onClick={() => abrirEditar(tela)} title="Editar tela no Designer">
                      <Edit2 size={13} /> Editar
                    </button>
                    {!tela.sistema && (
                      <>
                        <button
                          className="btn btn-ghost"
                          style={{ height: 32, padding: '0 10px', color: tela.ativo ? 'var(--t3)' : 'var(--green)' }}
                          onClick={() => handleToggleAtivo(tela)}
                          title={tela.ativo ? 'Inativar tela' : 'Reativar tela'}
                        >
                          {tela.ativo ? <PowerOff size={13} /> : <Power size={13} />}
                        </button>
                        <button className="btn btn-danger" style={{ height: 32, padding: '0 10px' }}
                          onClick={() => handleExcluir(tela)} title="Excluir tela e tabela">
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 10, color: 'var(--t3)', padding: '4px 2px' }}>
                {telasFiltradas.length} tela{telasFiltradas.length !== 1 ? 's' : ''} · {telasFiltradas.filter(t => t.ativo).length} ativa{telasFiltradas.filter(t => t.ativo).length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </>
      ))}

      {/* ── ABA FUNÇÕES ── */}
      {abaAtiva === 'funcoes' && (
        hideHeader ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            <FuncoesTab telas={telas} />
          </div>
        ) : (
          <FuncoesTab telas={telas} />
        )
      )}

      </div>
    </div>
  )
}
