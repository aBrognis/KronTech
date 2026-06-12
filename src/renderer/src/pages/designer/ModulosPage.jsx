import { useState, useEffect, useCallback } from 'react'
import {
  LayoutGrid, Plus, Edit2, Trash2,
  ChevronUp, ChevronDown, Menu, Save, Check, X, ExternalLink,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'

function TilaIcon({ nome, size = 15, cor = 'var(--or)' }) {
  const key  = (nome || 'layout').split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  const Icon = LucideIcons[key] || LayoutGrid
  return <Icon size={size} color={cor} />
}

const modIconBox = {
  width: 32, height: 32, flexShrink: 0,
  background: 'var(--or3)', border: '1px solid rgba(255,107,43,.15)',
  borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const modSubHead = {
  fontSize: 10, fontWeight: 700, color: 'var(--t3)',
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
}

function modArrowBtn(dis) {
  return {
    width: 24, height: 24, borderRadius: 6, border: '1px solid var(--bd)',
    background: 'var(--s2)', cursor: dis ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: dis ? 0.3 : 1, color: 'var(--t2)', flexShrink: 0,
  }
}

export default function ModulosPage() {
  const [telas,        setTelas]        = useState([])
  const [modulos,      setModulos]      = useState([])
  const [carregando,   setCarregando]   = useState(false)

  // Estado de criação de módulo
  const [novoMod,  setNovoMod]  = useState({ nome: '', icone: 'folder', ordem: 99 })
  const [editandoMod, setEditandoMod] = useState(null)
  const [erroMod,     setErroMod]     = useState('')

  // Ordem global unificada do menu (seções fixas + módulos dinâmicos)
  const [ordemGlobal,  setOrdemGlobal]  = useState([])
  const [ordemGrupos,  setOrdemGrupos]  = useState({})
  const [salvandoMenu, setSalvandoMenu] = useState(false)
  const [menuSalvo,    setMenuSalvo]    = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const [t, m] = await Promise.all([
        window.api.formBuilder.listarTelas(),
        window.api.formBuilder.listarModulos(),
      ])
      setTelas(t); setModulos(m)
    } catch (e) { console.error(e) }
    finally     { setCarregando(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  // Reconstrói ordemGlobal quando módulos mudam
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
      const byId  = Object.fromEntries(fixos.map(x => [x.id, x.label]))
      await window.api.config.setSection('Personalizacao', {
        label_inicio:      byId.inicio      || 'Início',
        label_gestao:      byId.gestao      || 'Gestão',
        label_ferramentas: byId.ferramentas || 'Ferramentas',
        secoes_ordem:      fixos.map(x => x.id).join(','),
        menu_global_ordem: ordemGlobal.map(x => x.id).join(','),
      })
      window.dispatchEvent(new CustomEvent('krontech:config-changed', {
        detail: {
          labelInicio:      byId.inicio      || 'Início',
          labelGestao:      byId.gestao      || 'Gestão',
          labelFerramentas: byId.ferramentas || 'Ferramentas',
          secoesOrdem:      fixos.map(x => x.id).join(','),
          menuGlobalOrdem:  ordemGlobal.map(x => x.id).join(','),
        },
      }))
      const items = []
      Object.values(ordemGrupos).forEach(({ telas: gr }) =>
        gr.forEach((t, idx) => items.push({ id: t.id, ordem_menu: idx + 1 }))
      )
      if (items.length) await window.api.formBuilder.reordenarTelas(items)
      await carregar()
      setMenuSalvo(true)
      setTimeout(() => setMenuSalvo(false), 2500)
    } catch (e) { alert('Erro ao salvar: ' + e.message) }
    finally { setSalvandoMenu(false) }
  }

  async function handleCriarModulo() {
    setErroMod('')
    if (!novoMod.nome.trim()) { setErroMod('Informe o nome do módulo.'); return }
    try {
      await window.api.formBuilder.criarModulo(novoMod)
      setNovoMod({ nome: '', icone: 'folder', ordem: 99 })
      await carregar()
    } catch (e) { setErroMod(e.message) }
  }

  async function handleSalvarModulo(id) {
    if (!editandoMod?.nome?.trim()) return
    try {
      await window.api.formBuilder.editarModulo(id, editandoMod)
      setEditandoMod(null)
      await carregar()
    } catch (e) { alert('Erro: ' + e.message) }
  }

  async function handleExcluirModulo(mod) {
    if (!confirm(`Excluir módulo "${mod.nome}"?`)) return
    try {
      await window.api.formBuilder.excluirModulo(mod.id)
      await carregar()
    } catch (e) { alert('Erro: ' + e.message) }
  }

  if (carregando && modulos.length === 0) {
    return (
      <div style={{ padding: '20px 24px', color: 'var(--t3)', fontSize: 13 }}>Carregando...</div>
    )
  }

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflow: 'auto' }}>

      {/* Layout de duas colunas */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>

        {/* ─── COLUNA ESQUERDA: gerenciamento de módulos ─── */}
        <div style={{ flex: '0 0 360px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', minWidth: 0 }}>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1 }}>Módulos</span>
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>— agrupe telas no sidebar</span>
          </div>

          {/* Criar módulo */}
          <div style={{
            background: 'var(--s2)',
            border: `1px solid ${erroMod ? 'var(--red)' : 'var(--bd)'}`,
            borderRadius: 10, padding: '10px 12px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Nome *</label>
                <input
                  className="form-input"
                  value={novoMod.nome}
                  onChange={e => { setNovoMod(p => ({ ...p, nome: e.target.value })); setErroMod('') }}
                  onKeyDown={e => e.key === 'Enter' && handleCriarModulo()}
                  placeholder="Ex: Vendas, RH..."
                  autoComplete="off"
                />
              </div>
              <div style={{ width: 60 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Ordem</label>
                <input
                  className="form-input"
                  type="number" min={1}
                  value={novoMod.ordem}
                  onChange={e => setNovoMod(p => ({ ...p, ordem: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5 }}>Ícone</label>
                  <a
                    href="https://lucide.dev/icons/" target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--or)', textDecoration: 'none', opacity: .8 }}
                  >
                    <ExternalLink size={10} /> ver todos
                  </a>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ ...modIconBox, width: 34, height: 34, flexShrink: 0 }}>
                    <TilaIcon nome={novoMod.icone} size={15} />
                  </div>
                  <input
                    className="form-input"
                    value={novoMod.icone}
                    onChange={e => setNovoMod(p => ({ ...p, icone: e.target.value }))}
                    placeholder="folder, users..."
                    autoComplete="off"
                  />
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
                        <input
                          className="form-input"
                          style={{ flex: 1, height: 30 }}
                          value={editandoMod.nome}
                          onChange={e => setEditandoMod(p => ({ ...p, nome: e.target.value }))}
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', width: 120 }}>
                          <div style={{ ...modIconBox, width: 30, height: 30, background: 'var(--s3)', border: '1px solid var(--bd)', flexShrink: 0 }}>
                            <TilaIcon nome={editandoMod.icone} size={13} />
                          </div>
                          <input
                            className="form-input"
                            style={{ flex: 1, height: 30 }}
                            value={editandoMod.icone}
                            onChange={e => setEditandoMod(p => ({ ...p, icone: e.target.value }))}
                            placeholder="ícone"
                          />
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
                        <button
                          className="btn btn-ghost"
                          style={{ height: 26, padding: '0 8px', fontSize: 11 }}
                          onClick={() => setEditandoMod({ id: mod.id, nome: mod.nome, icone: mod.icone, ordem: mod.ordem })}
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ height: 26, padding: '0 7px' }}
                          onClick={() => handleExcluirModulo(mod)}
                          disabled={qtd > 0}
                          title={qtd > 0 ? `${qtd} tela(s) vinculada(s) — remova antes` : 'Excluir módulo'}
                        >
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
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            background: 'var(--s2)', border: '1px solid var(--bd)',
            borderRadius: 12, overflow: 'hidden',
            display: 'flex', flexDirection: 'column', minHeight: 440,
          }}>

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderBottom: '1px solid var(--bd)',
              background: 'var(--s1)', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Menu size={13} color="var(--or)" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Menu Lateral</span>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>— ordem das seções e telas</span>
              </div>
              <button
                className="btn btn-primary"
                style={{ height: 30, padding: '0 14px', fontSize: 11 }}
                onClick={salvarMenuLateral}
                disabled={salvandoMenu}
              >
                {menuSalvo
                  ? <><Check size={12} /> Salvo</>
                  : salvandoMenu
                    ? 'Salvando...'
                    : <><Save size={12} /> Salvar</>
                }
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
                    <div key={item.id} style={{
                      display: 'flex', gap: 6, alignItems: 'center',
                      height: 36, background: 'var(--bg)',
                      border: '1px solid var(--bd)', borderRadius: 7, padding: '0 8px',
                    }}>
                      <span style={{ fontSize: 10, color: 'var(--t3)', width: 14, textAlign: 'center', flexShrink: 0 }}>{idx + 1}</span>
                      {item.tipo === 'fixo' ? (
                        <input
                          className="form-input"
                          value={item.label}
                          onChange={e => setItemLabel(idx, e.target.value)}
                          style={{ flex: 1, height: 26, fontSize: 12 }}
                        />
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
                            <div key={t.id} style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              height: 36, background: 'var(--bg)',
                              border: '1px solid var(--bd)', borderRadius: 7, padding: '0 8px',
                            }}>
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
    </div>
  )
}
