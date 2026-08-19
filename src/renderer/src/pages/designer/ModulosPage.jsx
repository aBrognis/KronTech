import { useState, useEffect, useCallback } from 'react'
import {
  LayoutGrid, ChevronUp, ChevronDown, ChevronRight, ExternalLink, Check, Plus, Trash2, Edit2,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { MENU_BASE, MENU_DESIGNER } from '../../components/Sidebar'
import FormToolbar from '../../components/FormToolbar'
import { notificar } from '../../components/Notificacao'

function TilaIcon({ nome, size = 15, cor = 'var(--or)' }) {
  const key  = (nome || 'layout').split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  const Icon = LucideIcons[key] || LayoutGrid
  return <Icon size={size} color={cor} />
}

function modArrowBtn(dis) {
  return {
    width: 24, height: 24, borderRadius: 6, border: '1px solid var(--bd)',
    background: 'var(--s2)', cursor: dis ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: dis ? 0.3 : 1, color: 'var(--t2)', flexShrink: 0,
  }
}

// Mesmo padrão de renderLabel() em FormBuilderView.jsx.
function FieldLabel({ children }) {
  return <label className="form-label" style={{ display: 'block', marginBottom: 2, fontSize: 10 }}>{children}</label>
}

const SECAO_TITULO = { fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }

// Tela de configuração pura: sem aba Acesso, sem Incluir/Alterar/Consultar,
// sem modo visualização — sempre editável, e "Gravar" aplica tudo (módulos +
// organização do menu) de uma vez, refletindo direto no sistema.
export default function ModulosPage() {
  const [telas,    setTelas]    = useState([])
  const [modulos,  setModulos]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [salvo,    setSalvo]    = useState(false)

  // Criar módulo novo
  const [novoMod, setNovoMod] = useState({ nome: '' })
  const [erroMod, setErroMod] = useState('')
  // Edição inline de módulo existente (id do módulo em edição, ou null)
  const [editandoId, setEditandoId] = useState(null)
  const [editForm,   setEditForm]   = useState(null)

  // Só itens de MENU_BASE (sidebar principal) podem ser movidos de grupo.
  const NATIVAS_MOVIVEIS = new Set(MENU_BASE.flatMap(g => g.items.map(it => it.id)))
  // Ícone padrão (componente Lucide já importado no código) de cada item
  // nativo — usado como preview quando não há override salvo.
  const ICONE_PADRAO_POR_ID = Object.fromEntries(
    [...MENU_BASE, ...MENU_DESIGNER].flatMap(g => g.items.map(it => [it.id, it.Icon]))
  )
  const [labelsItens, setLabelsItens] = useState({})
  const [itensGrupoOverride, setItensGrupoOverride] = useState({})
  const [itensIconeOverride, setItensIconeOverride] = useState({})
  // Ordem manual dos itens dentro de um grupo (nativos + telas do FormBuilder
  // misturados) — mapa id_do_item -> posição. Mesmo formato usado pelo Sidebar.
  const [ordemItensPorId, setOrdemItensPorId] = useState({})
  const [ordemGlobal, setOrdemGlobal] = useState([])
  const [ordemGrupos, setOrdemGrupos] = useState({})
  // Árvore do menu: qual seção está expandida e qual item está com o
  // editor inline aberto (nome/grupo/posição), um de cada vez.
  const [secaoAberta, setSecaoAberta] = useState(null)
  const [listaModulosAberta, setListaModulosAberta] = useState(false)
  // Snapshot do estado da árvore assim que carregado (config + módulos) —
  // comparado com o estado atual pra só mostrar Gravar/Desistir quando
  // houver mudança de verdade, não só por causa do formulário/módulos.
  const [snapshotMenu, setSnapshotMenu] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [resTelas, resModulos] = await Promise.all([
        window.api.formBuilder.listarTelas(),
        window.api.formBuilder.listarModulos(),
      ])
      if (!resTelas.ok) throw new Error(resTelas.erro)
      if (!resModulos.ok) throw new Error(resModulos.erro)
      setTelas(resTelas.data); setModulos(resModulos.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    window.api.config.get().then(res => {
      const p = (res.ok ? res.data?.Personalizacao : null) || {}
      if (p.labels_itens) {
        try { setLabelsItens(JSON.parse(p.labels_itens)) } catch { /* ignora ini corrompido */ }
      }
      if (p.itens_grupo_override) {
        try { setItensGrupoOverride(JSON.parse(p.itens_grupo_override)) } catch { /* ignora ini corrompido */ }
      }
      if (p.ordem_itens_por_id) {
        try { setOrdemItensPorId(JSON.parse(p.ordem_itens_por_id)) } catch { /* ignora ini corrompido */ }
      }
      if (p.itens_icone_override) {
        try { setItensIconeOverride(JSON.parse(p.itens_icone_override)) } catch { /* ignora ini corrompido */ }
      }
    }).catch(() => {})
  }, [])

  // Reconstrói ordemGlobal (seções fixas + módulos) quando módulos mudam
  useEffect(() => {
    window.api.config.get().then(res => {
      const p = (res.ok ? res.data?.Personalizacao : null) || {}
      const fixedItems = [
        { id: 'inicio',      label: p.label_inicio      || 'Início',      tipo: 'fixo' },
        { id: 'gestao',      label: p.label_gestao      || 'Gestão',      tipo: 'fixo' },
        { id: 'ferramentas', label: p.label_ferramentas || 'Ferramentas', tipo: 'fixo' },
      ]
      const dynItems = modulos.map(m => ({ id: `din_${m.nome}`, label: m.nome, tipo: 'dinamico' }))
      const allItems = [...fixedItems, ...dynItems]
      const savedOrder = (p.menu_global_ordem || '').split(',').filter(Boolean)
      let ordered
      if (savedOrder.length) {
        ordered = []
        savedOrder.forEach(sid => { const x = allItems.find(i => i.id === sid); if (x) ordered.push(x) })
        allItems.forEach(x => { if (!ordered.find(o => o.id === x.id)) ordered.push(x) })
      } else {
        ordered = allItems
      }
      setOrdemGlobal(ordered)
      // Captura o snapshot no mesmo passo, com o mesmo formato usado por
      // snapshotAtual() — evita depender de outro useEffect/timing. Reparseia
      // os JSONs salvos (em vez de comparar string crua) pra bater exatamente
      // com o shape de labelsItens/itensGrupoOverride/ordemItensPorId em memória.
      let labelsSalvo = {}, overrideSalvo = {}, ordemItensSalvo = {}, iconeSalvo = {}
      try { labelsSalvo      = p.labels_itens          ? JSON.parse(p.labels_itens)          : {} } catch { /* ignora */ }
      try { overrideSalvo    = p.itens_grupo_override  ? JSON.parse(p.itens_grupo_override)  : {} } catch { /* ignora */ }
      try { ordemItensSalvo  = p.ordem_itens_por_id    ? JSON.parse(p.ordem_itens_por_id)    : {} } catch { /* ignora */ }
      try { iconeSalvo       = p.itens_icone_override  ? JSON.parse(p.itens_icone_override)  : {} } catch { /* ignora */ }
      setSnapshotMenu(JSON.stringify({
        ordemGlobal: ordered.map(x => ({ id: x.id, label: x.label })),
        labels: labelsSalvo,
        override: overrideSalvo,
        ordemItens: ordemItensSalvo,
        icones: iconeSalvo,
      }))
    }).catch(() => {
      setOrdemGlobal([
        { id: 'inicio',      label: 'Início',      tipo: 'fixo' },
        { id: 'gestao',      label: 'Gestão',      tipo: 'fixo' },
        { id: 'ferramentas', label: 'Ferramentas', tipo: 'fixo' },
        ...modulos.map(m => ({ id: `din_${m.nome}`, label: m.nome, tipo: 'dinamico' })),
      ])
    })
  }, [modulos])

  // Reconstrói grupos de ordem (unificado: itens nativos + telas do
  // FormBuilder), agrupados pela mesma chave de grupo final que o Sidebar usa
  // ('inicio'|'gestao'|'ferramentas'|'din_<modulo>').
  useEffect(() => {
    const grupos = {}
    function addItem(key, nomeGrupo, item) {
      if (!grupos[key]) grupos[key] = { nome: nomeGrupo, itens: [] }
      grupos[key].itens.push(item)
    }
    MENU_BASE.forEach(g => {
      g.items.forEach(it => {
        const destino = itensGrupoOverride[it.id] || g.id
        const nomeDestino = MENU_BASE.find(x => x.id === destino)?.baseLabel
          || modulos.find(m => `din_${m.nome}` === destino)?.nome
          || destino.replace(/^din_/, '')
        addItem(destino, nomeDestino, { id: it.id, label: labelsItens[it.id] || it.label, tipoItem: 'nativo' })
      })
    })
    telas
      .filter(t => !t.sistema && t.ativo)
      .sort((a, b) => a.ordem_menu - b.ordem_menu)
      .forEach(t => {
        const key  = t.grupo_fixo || (t.modulo_id != null ? `din_${t.modulo_nome}` : 'din_Minhas Telas')
        const nome = t.grupo_fixo ? MENU_BASE.find(g => g.id === t.grupo_fixo)?.baseLabel : (t.modulo_nome || 'Minhas Telas')
        addItem(key, nome, { id: `fb__${t.nome_tabela}`, label: t.nome_tela, tipoItem: 'tela', telaId: t.id, icone: t.icone, descricao: t.descricao })
      })
    Object.values(grupos).forEach(grp => {
      grp.itens.sort((a, b) => {
        const oa = ordemItensPorId[a.id], ob = ordemItensPorId[b.id]
        if (oa != null && ob != null) return oa - ob
        if (oa != null) return -1
        if (ob != null) return 1
        return 0
      })
    })
    setOrdemGrupos(grupos)
  }, [telas, itensGrupoOverride, labelsItens, modulos])

  // ── Módulos: criar / editar inline / excluir ─────────────────────────────
  async function handleCriarModulo() {
    setErroMod('')
    if (!novoMod.nome.trim()) { setErroMod('Informe o nome do módulo.'); return }
    try {
      const res = await window.api.formBuilder.criarModulo(novoMod)
      if (!res.ok) throw new Error(res.erro)
      setNovoMod({ nome: '' })
      await carregar()
    } catch (e) { setErroMod(e.message) }
  }

  function abrirEdicaoInline(m) {
    setEditandoId(m.id)
    setEditForm({ nome: m.nome, icone: m.icone, ordem: m.ordem })
  }

  async function handleSalvarModuloInline(id) {
    if (!editForm?.nome?.trim()) return
    try {
      const res = await window.api.formBuilder.editarModulo(id, editForm)
      if (!res.ok) throw new Error(res.erro)
      setEditandoId(null)
      await carregar()
    } catch (e) { notificar.erro('Erro: ' + e.message) }
  }

  async function handleExcluirModulo(m) {
    const qtd = telas.filter(t => t.modulo_id === m.id).length
    if (qtd > 0) { notificar.erro(`Não é possível excluir: ${qtd} tela(s) vinculada(s) a este módulo.`); return }
    if (!(await notificar.confirmar(`Excluir o módulo "${m.nome}"?`, { titulo: 'Excluir módulo', confirmarLabel: 'Excluir', perigo: true }))) return
    try {
      const res = await window.api.formBuilder.excluirModulo(m.id)
      if (!res.ok) throw new Error(res.erro)
      await carregar()
    } catch (e) { notificar.erro('Erro: ' + e.message) }
  }

  // ── Organização do menu ───────────────────────────────────────────────────
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

  function setItemNativoLabel(id, label) {
    setLabelsItens(prev => ({ ...prev, [id]: label }))
  }

  function setItemGrupoOverride(id, destino) {
    setItensGrupoOverride(prev => ({ ...prev, [id]: destino }))
  }

  function setItemIconeOverride(id, icone) {
    setItensIconeOverride(prev => ({ ...prev, [id]: icone }))
  }

  // Telas do FormBuilder: ícone/descrição vivem na própria tabela
  // (kr_telas_001), a mesma fonte usada pela tela "Telas" — gravar aqui já
  // reflete lá e vice-versa, sem duplicar estado em config. Atualiza local
  // primeiro (resposta imediata) e persiste em seguida.
  function setTelaFormBuilderCampo(telaId, campo, valor) {
    setTelas(prev => prev.map(t => t.id === telaId ? { ...t, [campo]: valor } : t))
  }
  async function salvarMetaTelaFormBuilder(telaId) {
    const t = telas.find(x => x.id === telaId)
    if (!t) return
    try {
      const res = await window.api.formBuilder.atualizarMetaTela(telaId, {
        nomeTela: t.nome_tela, descricao: t.descricao, icone: t.icone,
      })
      if (!res.ok) throw new Error(res.erro)
      window.dispatchEvent(new CustomEvent('krontech:telas-updated'))
    } catch (e) { notificar.erro('Erro: ' + e.message) }
  }

  function moverItemGrupo(grupoKey, idx, dir) {
    setOrdemGrupos(prev => {
      const itens = [...prev[grupoKey].itens]
      const novo  = idx + dir
      if (novo < 0 || novo >= itens.length) return prev
      ;[itens[idx], itens[novo]] = [itens[novo], itens[idx]]
      setOrdemItensPorId(prevOrdem => {
        const next = { ...prevOrdem }
        itens.forEach((it, i) => { next[it.id] = i })
        return next
      })
      return { ...prev, [grupoKey]: { ...prev[grupoKey], itens } }
    })
  }

  // Gravar único: aplica organização do menu inteira de uma vez. Alterações
  // de módulo (criar/editar/excluir) e de menu já refletem no sistema
  // imediatamente (via evento krontech:config-changed / recarregar telas),
  // sem exigir esse botão — ele serve para persistir ordem/grupo/labels.
  async function handleGravar() {
    setSaving(true)
    try {
      const fixos = ordemGlobal.filter(x => x.tipo === 'fixo')
      const byId  = Object.fromEntries(fixos.map(x => [x.id, x.label]))
      const labelsItensJson = JSON.stringify(labelsItens)
      const itensGrupoOverrideJson = JSON.stringify(itensGrupoOverride)
      const ordemItensPorIdJson = JSON.stringify(ordemItensPorId)
      const itensIconeOverrideJson = JSON.stringify(itensIconeOverride)
      await window.api.config.setSection('Personalizacao', {
        label_inicio:      byId.inicio      || 'Início',
        label_gestao:      byId.gestao      || 'Gestão',
        label_ferramentas: byId.ferramentas || 'Ferramentas',
        secoes_ordem:      fixos.map(x => x.id).join(','),
        menu_global_ordem: ordemGlobal.map(x => x.id).join(','),
        labels_itens:      labelsItensJson,
        itens_grupo_override: itensGrupoOverrideJson,
        ordem_itens_por_id: ordemItensPorIdJson,
        itens_icone_override: itensIconeOverrideJson,
      })
      window.dispatchEvent(new CustomEvent('krontech:config-changed', {
        detail: {
          labelInicio:      byId.inicio      || 'Início',
          labelGestao:      byId.gestao      || 'Gestão',
          labelFerramentas: byId.ferramentas || 'Ferramentas',
          secoesOrdem:      fixos.map(x => x.id).join(','),
          menuGlobalOrdem:  ordemGlobal.map(x => x.id).join(','),
          labelsItens:      labelsItensJson,
          itensGrupoOverride: itensGrupoOverrideJson,
          ordemItensPorId:  ordemItensPorIdJson,
          itensIconeOverride: itensIconeOverrideJson,
        },
      }))
      const items = []
      Object.values(ordemGrupos).forEach(({ itens }) => {
        itens.filter(it => it.tipoItem === 'tela').forEach((it, idx) => items.push({ id: it.telaId, ordem_menu: idx + 1 }))
      })
      if (items.length) {
        const res = await window.api.formBuilder.reordenarTelas(items)
        if (!res.ok) throw new Error(res.erro)
      }
      await carregar()
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2500)
    } catch (e) { notificar.erro('Erro ao salvar: ' + e.message) }
    finally { setSaving(false) }
  }

  // Descarta mudanças não salvas na árvore, revertendo labels/overrides/ordem
  // para o que está persistido — recarregar() sozinho não bastava porque só
  // atualiza telas/módulos, não esses três estados locais.
  async function handleDesistirMenu() {
    try {
      const res = await window.api.config.get()
      const p = (res.ok ? res.data?.Personalizacao : null) || {}
      try { setLabelsItens(p.labels_itens ? JSON.parse(p.labels_itens) : {}) } catch { setLabelsItens({}) }
      try { setItensGrupoOverride(p.itens_grupo_override ? JSON.parse(p.itens_grupo_override) : {}) } catch { setItensGrupoOverride({}) }
      try { setOrdemItensPorId(p.ordem_itens_por_id ? JSON.parse(p.ordem_itens_por_id) : {}) } catch { setOrdemItensPorId({}) }
      try { setItensIconeOverride(p.itens_icone_override ? JSON.parse(p.itens_icone_override) : {}) } catch { setItensIconeOverride({}) }
    } catch { /* config pode não estar pronto */ }
    await carregar()
  }

  // Estado atual da árvore, no mesmo shape do snapshotMenu — comparados,
  // dizem se há mudança não salva. Só assim Gravar/Desistir aparecem.
  const snapshotAtual = JSON.stringify({
    ordemGlobal: ordemGlobal.map(x => ({ id: x.id, label: x.label })),
    labels: labelsItens,
    override: itensGrupoOverride,
    ordemItens: ordemItensPorId,
    icones: itensIconeOverride,
  })
  const temMudancaMenu = snapshotMenu !== '' && snapshotAtual !== snapshotMenu

  return (
    <div className="page-with-footer">

      <div className="page-tabs">
        <span className="page-tab active" style={{ cursor: 'default' }}>Módulos</span>
        <span className="page-tab-info" style={{ textTransform: 'uppercase', letterSpacing: .4, maxWidth: 'none' }}>Módulos, ícones e organização do menu lateral</span>
        {salvo && (
          <span className="page-tab-info" style={{ color: 'var(--green,#4ADE80)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={11} /> Salvo
          </span>
        )}
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skel" style={{ height: 44, borderRadius: 7 }} />)}
          </div>
        ) : (
        <div style={{ paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* ─ Módulos ─ */}
          <div>
            <div style={SECAO_TITULO}>Módulos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Criar módulo */}
              <div style={{
                background: 'var(--s2)', border: `1px solid ${erroMod ? 'var(--red)' : 'var(--bd)'}`,
                borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-end',
              }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Nome</FieldLabel>
                  <input className="form-input" value={novoMod.nome}
                    onChange={e => { setNovoMod(p => ({ ...p, nome: e.target.value })); setErroMod('') }}
                    onKeyDown={e => e.key === 'Enter' && handleCriarModulo()}
                    placeholder="Ex: Vendas, RH..." autoComplete="off" />
                </div>
                <button className="btn btn-primary" style={{ height: 38, flexShrink: 0 }} onClick={handleCriarModulo}>
                  <Plus size={13} /> Criar
                </button>
              </div>
              {erroMod && <div style={{ fontSize: 11, color: 'var(--red)' }}>{erroMod}</div>}

              {/* Lista de módulos existentes — recolhível, mesmo padrão do
                  bloco "Menu lateral" logo abaixo. */}
              {modulos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--t3)', fontSize: 12, background: 'var(--s2)', borderRadius: 10, border: '1px dashed var(--bd)' }}>
                  Nenhum módulo. Crie o primeiro acima.
                </div>
              ) : (
                <div style={{ border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', overflow: 'hidden' }}>
                  <div
                    onClick={() => setListaModulosAberta(a => !a)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <ChevronRight size={13} color="var(--t3)" style={{ transition: 'transform .15s', transform: listaModulosAberta ? 'rotate(90deg)' : 'none', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--t1)' }}>Módulos existentes</span>
                    <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>{modulos.length}</span>
                  </div>

                  {listaModulosAberta && (
                    <div style={{ borderTop: '1px solid var(--bd)', padding: '10px 12px', background: 'var(--s2)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {modulos.map(m => {
                          const isEdit = editandoId === m.id
                          const qtd = telas.filter(t => t.modulo_id === m.id).length
                          return (
                            <div key={m.id} style={{
                              background: isEdit ? 'rgba(255,107,43,.04)' : 'var(--s1)',
                              border: `1.5px solid ${isEdit ? 'var(--or)' : 'var(--bd)'}`,
                              borderRadius: 9, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                              {isEdit ? (
                                <>
                                  <input className="form-input" style={{ flex: 1, height: 30 }} value={editForm.nome}
                                    onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))} autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleSalvarModuloInline(m.id)} />
                                  <button className="btn btn-primary" style={{ height: 30, padding: '0 10px' }} onClick={() => handleSalvarModuloInline(m.id)}>
                                    <Check size={12} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.nome}</div>
                                    <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>{qtd} tela{qtd !== 1 ? 's' : ''}</div>
                                  </div>
                                  <button className="btn btn-ghost" style={{ height: 26, padding: '0 7px' }}
                                    onClick={() => abrirEdicaoInline(m)} title="Editar módulo">
                                    <Edit2 size={11} />
                                  </button>
                                  <button className="btn btn-danger" style={{ height: 26, padding: '0 7px' }}
                                    onClick={() => handleExcluirModulo(m)} disabled={qtd > 0}
                                    title={qtd > 0 ? `${qtd} tela(s) vinculada(s), remova antes` : 'Excluir módulo'}>
                                    <Trash2 size={11} />
                                  </button>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ─ Árvore do menu lateral: uma coluna, seções expansíveis. Cada
              tela dentro de uma seção já mostra direto o seletor de grupo
              (pra mover pra outro menu) ao lado das setas de reordenar —
              sem precisar clicar pra abrir um editor separado. ─ */}
          <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 18 }}>
            <div style={SECAO_TITULO}>Menu lateral</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ordemGlobal.map((secao, secIdx) => {
                const grupoKey = secao.tipo === 'fixo' ? secao.id : `din_${secao.label}`
                const itensReais = ordemGrupos[grupoKey]?.itens || []
                const totalItens = itensReais.length
                const aberta = secaoAberta === grupoKey

                return (
                  <div key={secao.id} style={{ border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', overflow: 'hidden' }}>
                    <div
                      onClick={() => setSecaoAberta(aberta ? null : grupoKey)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <ChevronRight size={13} color="var(--t3)" style={{ transition: 'transform .15s', transform: aberta ? 'rotate(90deg)' : 'none', flexShrink: 0 }} />
                      {secao.tipo === 'fixo' ? (
                        <input className="form-input" value={secao.label} onClick={e => e.stopPropagation()}
                          onChange={e => setItemLabel(secIdx, e.target.value)} style={{ flex: 1, height: 28, fontSize: 12.5, fontWeight: 600 }} />
                      ) : (
                        <>
                          <span style={{ fontSize: 9, fontWeight: 700, background: 'var(--or3)', color: 'var(--or)', padding: '2px 5px', borderRadius: 3, flexShrink: 0 }}>MOD</span>
                          <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--t1)' }}>{secao.label}</span>
                        </>
                      )}
                      <span style={{ fontSize: 10.5, color: 'var(--t3)', flexShrink: 0 }}>{totalItens} tela{totalItens !== 1 ? 's' : ''}</span>
                      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => moverItem(secIdx, -1)} disabled={secIdx === 0} style={modArrowBtn(secIdx === 0)}><ChevronUp size={12} /></button>
                        <button onClick={() => moverItem(secIdx, 1)} disabled={secIdx === ordemGlobal.length - 1} style={modArrowBtn(secIdx === ordemGlobal.length - 1)}><ChevronDown size={12} /></button>
                      </div>
                    </div>

                    {aberta && (
                      <div style={{ borderTop: '1px solid var(--bd)', padding: '8px 12px 12px 34px', display: 'flex', flexDirection: 'column', gap: 3, background: 'var(--s2)' }}>
                        {totalItens === 0 && (
                          <div style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic', padding: '6px 0' }}>Nenhuma tela neste grupo.</div>
                        )}
                        {itensReais.map((it, idx) => {
                          const iconeAtual = it.tipoItem === 'nativo'
                            ? (itensIconeOverride[it.id] || '')
                            : (it.icone || '')
                          return (
                          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 34, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, color: 'var(--t3)', width: 14, textAlign: 'center', flexShrink: 0 }}>{idx + 1}</span>
                            {it.tipoItem === 'nativo' ? (
                              <span style={{ fontSize: 9, fontWeight: 700, background: 'var(--s3)', color: 'var(--t3)', padding: '2px 5px', borderRadius: 3, flexShrink: 0, width: 54, textAlign: 'center' }}>SISTEMA</span>
                            ) : (
                              <span style={{ fontSize: 9, fontWeight: 700, background: 'var(--or3)', color: 'var(--or)', padding: '2px 5px', borderRadius: 3, flexShrink: 0, width: 54, textAlign: 'center' }}>DESIGNER</span>
                            )}
                            <div style={{ width: 28, height: 28, flexShrink: 0, background: 'var(--or3)', border: '1px solid rgba(255,107,43,.15)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <TilaIcon nome={iconeAtual} size={13} />
                            </div>
                            <input className="form-input" value={iconeAtual}
                              onChange={e => it.tipoItem === 'nativo'
                                ? setItemIconeOverride(it.id, e.target.value)
                                : setTelaFormBuilderCampo(it.telaId, 'icone', e.target.value)}
                              onBlur={() => it.tipoItem === 'tela' && salvarMetaTelaFormBuilder(it.telaId)}
                              placeholder="ícone" title="Nome do ícone (Lucide)"
                              style={{ width: 100, height: 28, fontSize: 11, flexShrink: 0 }} />
                            <a href="https://lucide.dev/icons/" target="_blank" rel="noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--or)', textDecoration: 'none', opacity: .8, flexShrink: 0 }}
                              title="Abrir catálogo de ícones Lucide">
                              <ExternalLink size={10} /> ver todos
                            </a>
                            {it.tipoItem === 'nativo' ? (
                              <input className="form-input" value={labelsItens[it.id] ?? it.label} onChange={e => setItemNativoLabel(it.id, e.target.value)}
                                style={{ flex: 1, height: 28, fontSize: 12.5, minWidth: 120 }} />
                            ) : (
                              <input className="form-input" value={it.label}
                                onChange={e => setTelaFormBuilderCampo(it.telaId, 'nome_tela', e.target.value)}
                                onBlur={() => salvarMetaTelaFormBuilder(it.telaId)}
                                style={{ flex: 1, height: 28, fontSize: 12.5, minWidth: 120, fontWeight: 500 }} />
                            )}
                            {it.tipoItem === 'tela' && (
                              <input className="form-input" value={it.descricao || ''}
                                onChange={e => setTelaFormBuilderCampo(it.telaId, 'descricao', e.target.value)}
                                onBlur={() => salvarMetaTelaFormBuilder(it.telaId)}
                                placeholder="descrição" title="Descrição da tela"
                                style={{ flex: 1, height: 28, fontSize: 11.5, minWidth: 140, color: 'var(--t2)' }} />
                            )}
                            {it.tipoItem === 'nativo' && NATIVAS_MOVIVEIS.has(it.id) && (
                              <select className="form-select" value={itensGrupoOverride[it.id] || ''} onChange={e => setItemGrupoOverride(it.id, e.target.value)}
                                style={{ width: 130, height: 28, fontSize: 11, flexShrink: 0 }} title="Mover para outro menu">
                                <option value="">Padrão</option>
                                <optgroup label="Nativos">
                                  {MENU_BASE.map(g => <option key={g.id} value={g.id}>{g.baseLabel}</option>)}
                                </optgroup>
                                {modulos.length > 0 && (
                                  <optgroup label="Meus Módulos">
                                    {modulos.map(m => <option key={m.id} value={`din_${m.nome}`}>{m.nome}</option>)}
                                  </optgroup>
                                )}
                              </select>
                            )}
                            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                              <button onClick={() => moverItemGrupo(grupoKey, idx, -1)} disabled={idx === 0} style={modArrowBtn(idx === 0)}><ChevronUp size={12} /></button>
                              <button onClick={() => moverItemGrupo(grupoKey, idx, 1)} disabled={idx === itensReais.length - 1} style={modArrowBtn(idx === itensReais.length - 1)}><ChevronDown size={12} /></button>
                            </div>
                          </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

        </div>
        )}
      </div>

      {temMudancaMenu && (
        <FormToolbar
          mode="edit"
          saving={saving}
          onGravar={handleGravar}
          onDesistir={handleDesistirMenu}
        />
      )}
    </div>
  )
}
