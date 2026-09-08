import { useState, useEffect, useCallback, useMemo } from 'react'
import '../../App.css'
import FormToolbar from '../../components/FormToolbar'
import PaginacaoBar from '../../components/PaginacaoBar.jsx'
import MenuContextoGrid from '../../components/MenuContextoGrid'
import PainelFiltrosGrid from '../../components/PainelFiltrosGrid'
import { notificar } from '../../components/Notificacao'
import {
  EMPTY_FORM, paraForm, paraPayload, STATUS, PAPEIS, TIPOS_PESSOA, REGIMES,
  statusMeta, papelLabel,
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

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

// Filtros da aba Acesso, abrangente (docs CLAUDE.md §4): toda coluna
// consultavel de entidade_001 tem um filtro tipado aqui.
const COLUNAS_FILTRO = [
  { chave: 'codigo', label: 'Código', tipo: 'texto' },
  { chave: 'nome', label: 'Nome / Razão Social', tipo: 'texto' },
  { chave: 'apelido', label: 'Apelido / Fantasia', tipo: 'texto' },
  { chave: 'cnpj', label: 'CPF / CNPJ', tipo: 'texto' },
  { chave: 'papeis', label: 'Papel', tipo: 'exato', opcoes: PAPEIS },
  { chave: 'status', label: 'Status', tipo: 'exato', opcoes: STATUS },
  { chave: 'tipo_pessoa', label: 'Tipo de pessoa', tipo: 'exato', opcoes: TIPOS_PESSOA },
  { chave: 'inscricao_estadual', label: 'Inscrição Estadual', tipo: 'texto' },
  { chave: 'inscricao_municipal', label: 'Inscrição Municipal', tipo: 'texto' },
  { chave: 'telefone', label: 'Telefone', tipo: 'texto' },
  { chave: 'celular', label: 'Celular', tipo: 'texto' },
  { chave: 'email', label: 'E-mail', tipo: 'texto' },
  { chave: 'site', label: 'Site', tipo: 'texto' },
  { chave: 'cidade', label: 'Cidade', tipo: 'texto' },
  { chave: 'uf', label: 'UF', tipo: 'exato', opcoes: UFS.map((u) => ({ valor: u, label: u })) },
  { chave: 'bairro', label: 'Bairro', tipo: 'texto' },
  { chave: 'cep', label: 'CEP', tipo: 'texto' },
  { chave: 'logradouro', label: 'Logradouro', tipo: 'texto' },
  { chave: 'porte', label: 'Porte', tipo: 'texto' },
  { chave: 'cnae', label: 'CNAE', tipo: 'texto' },
  { chave: 'situacao_cadastral', label: 'Situação cadastral', tipo: 'texto' },
  { chave: 'regime_tributario', label: 'Regime tributário', tipo: 'exato', opcoes: REGIMES.filter((r) => r.valor) },
  { chave: 'contribuinte_icms', label: 'Contribuinte ICMS', tipo: 'booleano' },
  { chave: 'optante_simples', label: 'Optante Simples', tipo: 'booleano' },
  { chave: 'limite_credito', label: 'Limite de crédito', tipo: 'numero' },
  { chave: 'dia_vencimento', label: 'Dia de vencimento', tipo: 'numero' },
  { chave: 'origem', label: 'Origem', tipo: 'texto' },
  { chave: 'segmento', label: 'Segmento', tipo: 'texto' },
  { chave: 'grupo_economico', label: 'Grupo econômico', tipo: 'texto' },
  { chave: 'data_fundacao', label: 'Data de fundação', tipo: 'data' },
  { chave: 'data_nascimento', label: 'Data de nascimento', tipo: 'data' },
  { chave: 'data_primeiro_contato', label: 'Primeiro contato', tipo: 'data' },
  { chave: 'criado_em', label: 'Cadastrado em', tipo: 'data' },
]

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
  const [busca, setBusca] = useState('')
  const [filtrosCol, setFiltrosCol] = useState({}) // { chave: {op,valor,valor2} | null }
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

  const carregarAcesso = useCallback(async () => {
    setFLoading(true)
    try {
      const params = {}
      if (busca.trim()) params.busca = busca.trim()
      const fc = Object.fromEntries(Object.entries(filtrosCol).filter(([, v]) => v))
      if (Object.keys(fc).length) params.filtros = fc
      const res = await window.api.entidade.listar(params)
      setFResultados(res.ok ? res.data || [] : [])
      setSelecionados(new Set())
      setPagina(1)
    } catch {
      setFResultados([])
    } finally {
      setFLoading(false)
    }
  }, [busca, filtrosCol])

  const setFiltroCol = (chave, f) => setFiltrosCol((prev) => ({ ...prev, [chave]: f }))
  function limparFiltros() { setBusca(''); setFiltrosCol({}) }

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
            <PainelFiltrosGrid
              colunas={COLUNAS_FILTRO}
              valores={filtrosCol}
              onChange={setFiltroCol}
              onBuscar={carregarAcesso}
              onLimpar={limparFiltros}
              fLoading={fLoading}
              busca={busca}
              onBusca={setBusca}
            />

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
