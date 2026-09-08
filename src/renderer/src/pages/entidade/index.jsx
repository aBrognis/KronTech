import { useState, useEffect, useCallback, useMemo } from 'react'
import { SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw, Search } from 'lucide-react'
import '../../App.css'
import FormToolbar from '../../components/FormToolbar'
import PaginacaoBar from '../../components/PaginacaoBar.jsx'
import MenuContextoGrid from '../../components/MenuContextoGrid'
import { notificar } from '../../components/Notificacao'
import {
  EMPTY_FORM, paraForm, paraPayload, STATUS, PAPEIS, statusMeta, papelLabel,
} from './utils'
import AbaDadosGerais from './AbaDadosGerais'
import AbaEnderecos from './AbaEnderecos'
import AbaContatos from './AbaContatos'
import AbaComercial from './AbaComercial'
import AbaFinanceiroCredito from './AbaFinanceiroCredito'
import AbaFiscal from './AbaFiscal'
import AbaRelacionamento from './AbaRelacionamento'
import AbaDocumentos from './AbaDocumentos'

const ABAS_FORM = [
  { id: 'dados', label: 'Dados Gerais', Comp: AbaDadosGerais },
  { id: 'enderecos', label: 'Endereços', Comp: AbaEnderecos },
  { id: 'contatos', label: 'Contatos', Comp: AbaContatos },
  { id: 'comercial', label: 'Comercial', Comp: AbaComercial },
  { id: 'financeiro', label: 'Financeiro', Comp: AbaFinanceiroCredito },
  { id: 'fiscal', label: 'Fiscal', Comp: AbaFiscal },
  { id: 'relacionamento', label: 'Relacionamento', Comp: AbaRelacionamento },
  { id: 'documentos', label: 'Documentos', Comp: AbaDocumentos },
]

const FILTROS_VAZIOS = { busca: '', papel: '', status: '', uf: '', cidade: '' }

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function Entidade({ newTrigger, sessao }) {
  // lista completa (fonte da navegacao no form) — padrao Viagens/Cofre
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(-1)

  const [mode, setMode] = useState('view')
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState(null)
  const [confirmExcluir, setConfirmExcluir] = useState(false)

  // padrao obrigatorio: abre em Cadastro, modo view, ultimo registro.
  // aba: 'acesso' | id de ABAS_FORM (a aba de cadastro E uma das do form)
  const [aba, setAba] = useState('dados')
  const activeTab = aba === 'acesso' ? 'acesso' : 'cadastro'
  const abaForm = aba === 'acesso' ? 'dados' : aba
  const setActiveTab = (t) => setAba(t === 'acesso' ? 'acesso' : 'dados')
  const setAbaForm = (a) => setAba(a)

  // aba Acesso — filtros independentes, so roda ao clicar Buscar
  const [filtrosAbertos, setFiltrosAbertos] = useState(true)
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS)
  const [fResultados, setFResultados] = useState(null)
  const [fLoading, setFLoading] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(25)
  const [selecionados, setSelecionados] = useState(() => new Set())
  const [menuCtx, setMenuCtx] = useState(null)

  // listas de apoio
  const [apoio, setApoio] = useState({ naturezas: [], condicoes: [], bancos: [] })
  useEffect(() => {
    Promise.all([
      window.api.naturezaJuridica.listar({}),
      window.api.condicaoPagamento.listar({}),
      window.api.banco.listar({}),
    ]).then(([n, cd, b]) => setApoio({
      naturezas: n.ok ? n.data : [],
      condicoes: cd.ok ? cd.data : [],
      bancos: b.ok ? b.data : [],
    }))
  }, [])

  const ctxUsuario = () => ({
    usuarioId: sessao?.registro?.id ?? sessao?.id ?? null,
    usuarioNome: sessao?.nome ?? sessao?.registro?.nome ?? null,
  })

  const carregarForm = useCallback(async (reg) => {
    const res = await window.api.entidade.obter(reg.id)
    if (!res.ok) { setErro(res.erro); return }
    setForm(paraForm(res.data))
    setErro(null)
    setMode('view')
  }, [])

  const carregarTudo = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.api.entidade.listar({})
      const lista = res.ok ? res.data || [] : []
      setRegistros(lista)
      if (lista.length) {
        const ultimo = lista.length - 1
        setCurrentIdx(ultimo)
        await carregarForm(lista[ultimo])
      }
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { carregarTudo() }, [carregarTudo])

  useEffect(() => {
    if (newTrigger) openNew()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTrigger])

  const carregarAcesso = useCallback(async (f = filtros) => {
    setFLoading(true)
    try {
      const params = {}
      if (f.busca.trim()) params.busca = f.busca.trim()
      if (f.papel)  params.papel = f.papel
      if (f.status) params.status = f.status
      if (f.uf)     params.uf = f.uf
      const res = await window.api.entidade.listar(params)
      let lista = res.ok ? res.data || [] : []
      if (f.cidade.trim()) {
        const c = f.cidade.trim().toLowerCase()
        lista = lista.filter((r) => String(r.cidade || '').toLowerCase().includes(c))
      }
      setFResultados(lista)
      setSelecionados(new Set())
      setPagina(1)
    } catch {
      setFResultados([])
    } finally {
      setFLoading(false)
    }
  }, [filtros])

  function limparFiltros() { setFiltros(FILTROS_VAZIOS) }
  const qtdFiltrosAtivos = Object.values(filtros).filter(Boolean).length

  function navTo(idx) {
    if (idx < 0 || idx >= registros.length) return
    setCurrentIdx(idx)
    carregarForm(registros[idx])
  }
  function openNew() {
    setForm(EMPTY_FORM)
    setCurrentIdx(-1)
    setErro(null)
    setMode('new')
    setActiveTab('cadastro')
    setAbaForm('dados')
  }
  function handleDesistir() {
    if (currentIdx >= 0 && registros[currentIdx]) carregarForm(registros[currentIdx])
    else { setForm(EMPTY_FORM); setMode('view') }
    setErro(null)
  }

  async function handleGravar() {
    if (!form.nome.trim()) { setErro('Informe o nome / razão social.'); return }
    setSaving(true)
    setErro(null)
    try {
      const payload = { ...paraPayload(form), _usuarioId: ctxUsuario().usuarioId, _usuarioNome: ctxUsuario().usuarioNome }
      const res = mode === 'new'
        ? await window.api.entidade.criar(payload)
        : await window.api.entidade.atualizar({ id: form.id, ...payload })
      if (!res.ok) { setErro(res.erro); return }
      setMode('view')
      const resLista = await window.api.entidade.listar({})
      const lista = resLista.ok ? resLista.data || [] : []
      setRegistros(lista)
      const idx = lista.findIndex((r) => r.id === res.data.id)
      if (idx >= 0) setCurrentIdx(idx)
      setForm(paraForm(res.data))
      if (fResultados) await carregarAcesso()
    } finally {
      setSaving(false)
    }
  }

  async function confirmarExclusao() {
    setConfirmExcluir(false)
    const res = await window.api.entidade.excluir(form.id)
    if (!res.ok) { setErro(res.erro); return }
    const resLista = await window.api.entidade.listar({})
    const lista = resLista.ok ? resLista.data || [] : []
    setRegistros(lista)
    if (lista.length) {
      const ni = Math.min(currentIdx, lista.length - 1)
      setCurrentIdx(ni)
      await carregarForm(lista[ni])
    } else {
      setForm(EMPTY_FORM); setCurrentIdx(-1); setMode('view')
    }
    if (fResultados) await carregarAcesso()
  }

  function selecionarLinha(reg) {
    const idx = registros.findIndex((r) => r.id === reg.id)
    if (idx < 0) return
    setCurrentIdx(idx)
    carregarForm(registros[idx])
    setActiveTab('cadastro')
    setAbaForm('dados')
  }

  // ── selecao em massa ──
  function toggleSelecionado(id) {
    setSelecionados((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }
  const idsResultado = (fResultados || []).map((r) => r.id)
  const todosSelecionados = idsResultado.length > 0 && idsResultado.every((id) => selecionados.has(id))
  function toggleSelecionarTodos() { setSelecionados(todosSelecionados ? new Set() : new Set(idsResultado)) }
  function abrirMenuLinha(e, id) { e.preventDefault(); setMenuCtx({ x: e.clientX, y: e.clientY, alvoId: id }) }
  function idsAlvoMenu() {
    if (!menuCtx) return []
    if (menuCtx.alvoId != null && !selecionados.has(menuCtx.alvoId)) return [menuCtx.alvoId]
    return [...selecionados]
  }
  async function aplicarStatus(status) {
    const ids = idsAlvoMenu()
    setMenuCtx(null)
    if (!ids.length) return
    const res = await window.api.entidade.mudarStatusLote({ ids, status, ctx: ctxUsuario() })
    if (res.ok) {
      notificar.sucesso(`${res.data.atualizadas} entidade(s) para "${statusMeta(status).label}".`)
      setSelecionados(new Set())
      await carregarAcesso()
      await carregarTudo()
    }
  }

  const totalFiltrado = fResultados?.length || 0
  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / porPagina))
  const registrosPagina = useMemo(
    () => (fResultados || []).slice((pagina - 1) * porPagina, pagina * porPagina),
    [fResultados, pagina, porPagina]
  )
  const isRO = mode === 'view'
  const AbaAtiva = ABAS_FORM.find((a) => a.id === abaForm) || ABAS_FORM[0]
  const ctx = { form, setForm, isRO, erro, apoio, sessao }

  return (
    <div className="page-with-footer">
      <div className="page-tabs" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
        <button className={`page-tab${aba === 'acesso' ? ' active' : ''}`} onClick={() => setAba('acesso')}>Acesso</button>
        {ABAS_FORM.map((a) => (
          <button key={a.id}
            className={`page-tab${aba === a.id ? ' active' : ''}`}
            style={{ fontSize: 11.5 }}
            onClick={() => setAba(a.id)}>{a.label}</button>
        ))}
        {form.id && <span className="page-tab-info">{form.codigo || '----'} · {form.nome || '(sem nome)'}</span>}
      </div>

      <div className="page-content">
        {erro && (
          <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(239,68,68,.4)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--red)' }}>
            {erro}
          </div>
        )}

        {activeTab === 'acesso' && (
          <>
            <div style={{ border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', boxShadow: 'var(--sh-xs)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setFiltrosAbertos((a) => !a)}>
                <SlidersHorizontal size={13} color="var(--t2)" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Filtros</span>
                {qtdFiltrosAtivos > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: 'var(--or3)', color: 'var(--or)' }}>
                    {qtdFiltrosAtivos} ativo{qtdFiltrosAtivos !== 1 ? 's' : ''}
                  </span>
                )}
                <div style={{ flex: 1 }} />
                {qtdFiltrosAtivos > 0 && (
                  <button type="button" className="btn btn-ghost" style={{ height: 24, padding: '0 8px', fontSize: 11 }}
                    onClick={(e) => { e.stopPropagation(); limparFiltros() }}>
                    <RotateCcw size={11} /> Limpar
                  </button>
                )}
                {filtrosAbertos ? <ChevronUp size={13} color="var(--t3)" /> : <ChevronDown size={13} color="var(--t3)" />}
              </div>

              {filtrosAbertos && (
                <div style={{ padding: '4px 14px 14px', borderTop: '1px solid var(--bd)', paddingTop: 12 }}
                  onKeyDown={(e) => e.key === 'Enter' && carregarAcesso()}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Busca geral</label>
                      <input className="form-input form-input-sm" value={filtros.busca}
                        onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))}
                        placeholder="nome, apelido, CNPJ..." />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Papel</label>
                      <select className="form-select form-input-sm" value={filtros.papel}
                        onChange={(e) => setFiltros((f) => ({ ...f, papel: e.target.value }))}>
                        <option value="">Todos</option>
                        {PAPEIS.map((p) => <option key={p.valor} value={p.valor}>{p.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Status</label>
                      <select className="form-select form-input-sm" value={filtros.status}
                        onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
                        <option value="">Todos</option>
                        {STATUS.map((s) => <option key={s.valor} value={s.valor}>{s.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">UF</label>
                      <select className="form-select form-input-sm" value={filtros.uf}
                        onChange={(e) => setFiltros((f) => ({ ...f, uf: e.target.value }))}>
                        <option value="">Todas</option>
                        {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Cidade</label>
                      <input className="form-input form-input-sm" value={filtros.cidade}
                        onChange={(e) => setFiltros((f) => ({ ...f, cidade: e.target.value }))}
                        placeholder="parte do nome" />
                    </div>
                  </div>
                  <button type="button" className="btn btn-primary" style={{ height: 32, padding: '0 16px' }}
                    onClick={() => carregarAcesso()} disabled={fLoading}>
                    <Search size={13} /> {fLoading ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              )}
            </div>

            {fResultados === null ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)', border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)' }}>
                <div style={{ fontSize: 13 }}>Configure os filtros (opcional) e clique em Buscar</div>
              </div>
            ) : (
              <div style={{ border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden', background: 'var(--s1)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <Th style={{ width: 40, textAlign: 'center' }}>
                          <input type="checkbox" checked={todosSelecionados} onChange={toggleSelecionarTodos} style={{ cursor: 'pointer' }} />
                        </Th>
                        <Th style={{ width: 70 }}>Código</Th>
                        <Th>Nome / Razão Social</Th>
                        <Th style={{ width: 160 }}>Apelido</Th>
                        <Th style={{ width: 150 }}>CPF / CNPJ</Th>
                        <Th style={{ width: 150 }}>Cidade</Th>
                        <Th style={{ width: 180 }}>Papéis</Th>
                        <Th style={{ width: 100 }}>Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrosPagina.map((r) => {
                        const marcado = selecionados.has(r.id)
                        const m = statusMeta(r.status)
                        return (
                          <tr key={r.id}
                            onDoubleClick={() => selecionarLinha(r)}
                            onContextMenu={(e) => abrirMenuLinha(e, r.id)}
                            style={{ cursor: 'pointer', background: marcado ? 'var(--or4, var(--s2))' : 'transparent' }}
                            onMouseEnter={(e) => { if (!marcado) e.currentTarget.style.background = 'var(--s2)' }}
                            onMouseLeave={(e) => { if (!marcado) e.currentTarget.style.background = 'transparent' }}>
                            <Td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" checked={marcado} onChange={() => toggleSelecionado(r.id)} style={{ cursor: 'pointer' }} />
                            </Td>
                            <Td style={{ fontFamily: 'monospace', color: 'var(--or)', fontWeight: 600 }}>{r.codigo}</Td>
                            <Td>{r.nome}</Td>
                            <Td>{r.apelido || '-'}</Td>
                            <Td>{r.cnpj || '-'}</Td>
                            <Td>{`${r.cidade || ''}${r.uf && !String(r.cidade || '').includes(' - ') ? ' - ' + r.uf : ''}` || '-'}</Td>
                            <Td>{String(r.papeis || '').split(',').filter(Boolean).map(papelLabel).join(', ') || '-'}</Td>
                            <Td><span className={`badge ${m.classe}`}>{m.label}</span></Td>
                          </tr>
                        )
                      })}
                      {!fLoading && registrosPagina.length === 0 && (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--t3)', fontSize: 11, fontStyle: 'italic' }}>Nenhum registro encontrado</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {selecionados.size > 0 && (
                  <div style={{ padding: '6px 14px', borderTop: '1px solid var(--bd)', fontSize: 11.5, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{selecionados.size} selecionada{selecionados.size !== 1 ? 's' : ''}. Botão direito na lista para alterar o status.</span>
                    <button className="btn btn-ghost" style={{ height: 22, fontSize: 10.5, padding: '0 8px' }} onClick={() => setSelecionados(new Set())}>Limpar seleção</button>
                  </div>
                )}
                <PaginacaoBar pagina={pagina} totalPaginas={totalPaginas} total={totalFiltrado} porPagina={porPagina}
                  onPagina={(p) => setPagina(p)} onPorPagina={(n) => { setPorPagina(n); setPagina(1) }} />
              </div>
            )}

            <MenuContextoGrid
              pos={menuCtx}
              onFechar={() => setMenuCtx(null)}
              titulo={`Alterar status de ${idsAlvoMenu().length} entidade${idsAlvoMenu().length !== 1 ? 's' : ''}`}
              itens={STATUS.map((s) => ({ label: s.label, onClick: () => aplicarStatus(s.valor) }))}
            />
          </>
        )}

        {activeTab === 'cadastro' && (
          <div className="entidade-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', paddingRight: 8 }}>
            <AbaAtiva.Comp {...ctx} />
          </div>
        )}
      </div>

      {activeTab === 'cadastro' && (
        <FormToolbar
          mode={mode}
          nav={{ currentIdx, total: registros.length, onNav: navTo }}
          temRegistros={registros.length > 0}
          saving={saving}
          onIncluir={openNew}
          onAlterar={() => setMode('edit')}
          onExcluir={() => setConfirmExcluir(true)}
          onConsultar={() => setActiveTab('acesso')}
          onGravar={handleGravar}
          onDesistir={handleDesistir}
        />
      )}

      {confirmExcluir && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}>
          <div style={{ width: 380, background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px 10px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)' }}>Excluir entidade</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 6 }}>Esta ação não pode ser desfeita. Contatos, endereços e anexos são removidos junto.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '14px 22px 20px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmExcluir(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmarExclusao}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Th({ children, style }) {
  return <th style={{ padding: '7px 12px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1.2, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)', background: 'var(--s1)', textAlign: 'left', ...style }}>{children}</th>
}
function Td({ children, style, onClick }) {
  return <td onClick={onClick} style={{ padding: '9px 12px', color: 'var(--t2)', borderBottom: '1px solid var(--bd)', fontSize: 12.5, ...style }}>{children}</td>
}
