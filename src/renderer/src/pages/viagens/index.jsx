import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, FileDown, FileX, SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw, Search, Settings } from 'lucide-react'
import '../../App.css'
import FormToolbar from '../../components/FormToolbar'
import SeletorBusca from '../../components/SeletorBusca'
import PesquisaPadraoModal from '../../components/PesquisaPadraoModal.jsx'
import InputData from '../../components/InputData'
import { notificar } from '../../components/Notificacao'
import PaginacaoBar from '../../components/PaginacaoBar.jsx'
import { EMPTY_FORM, STATUS_ORDEM, STATUS_META, MEIOS_TRANSPORTE, diaDaSemana, fmtDataBR, fmtMoeda, novoItem } from './utils'

const CAMPOS_CLIENTE = [{ nome_campo: 'nome', label: 'Nome' }]
const CAMPOS_CONSULTOR = [{ nome_campo: 'nome', label: 'Nome' }]
const FILTROS_VAZIOS = { clienteId: '', clienteNome: '', consultorId: '', consultorNome: '', status: '', dataIni: '', dataFim: '' }
const CAMPOS_BUSCA_DESPESA = [
  { nome_campo: 'codigo',         label: 'Código'    },
  { nome_campo: 'consultor_nome', label: 'Consultor' },
  { nome_campo: 'cliente_nome',   label: 'Cliente'   },
  { nome_campo: 'status',         label: 'Status'    },
]

export default function Viagens({ sessao, newTrigger }) {
  const [activeTab, setActiveTab] = useState('acesso')

  // Lista completa (não filtrada) — sempre carregada no mount, é a fonte
  // de verdade pra navegação (« ‹ N/total › ») e pro form, igual
  // Arquivos.jsx. A aba Acesso NÃO usa isto — usa fResultados (abaixo),
  // uma consulta filtrada e independente que só roda ao clicar "Buscar".
  const [registros, setRegistros]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [currentIdx, setCurrentIdx] = useState(-1)

  const [mode, setMode]     = useState('view') // 'view' | 'new' | 'edit'
  const [form, setForm]     = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [erro, setErro]     = useState(null)
  const [confirmExcluir, setConfirmExcluir] = useState(false)
  const [showConsulta, setShowConsulta] = useState(false)

  // Filtros da aba Acesso — resultado fica em fResultados, null até buscar
  // (mesmo padrão de Arquivos.jsx), nunca mexe em `registros`.
  const [filtrosAbertos, setFiltrosAbertos] = useState(true)
  const [filtros, setFiltros]         = useState(FILTROS_VAZIOS)
  const [buscaGeral, setBuscaGeral]   = useState('')
  const [fResultados, setFResultados] = useState(null)
  const [fLoading, setFLoading]       = useState(false)
  const [pagina, setPagina]     = useState(1)
  const [porPagina, setPorPagina] = useState(25)
  const [pastaExportacoes, setPastaExportacoes] = useState('')

  const carregarAcesso = useCallback(async (f = filtros, b = buscaGeral) => {
    setFLoading(true)
    try {
      const params = {}
      if (f.clienteId)   params.clienteId   = f.clienteId
      if (f.consultorId) params.consultorId = f.consultorId
      if (f.status)      params.status      = f.status
      if (f.dataIni)     params.dataIni     = f.dataIni
      if (f.dataFim)     params.dataFim     = f.dataFim
      if (b.trim())       params.busca       = b.trim()
      const res = await window.api.viagens.listar(params)
      setFResultados(res.ok ? res.data || [] : [])
      setPagina(1)
    } catch { setFResultados([]) }
    finally { setFLoading(false) }
  }, [filtros, buscaGeral])

  // Ao abrir a tela, carrega a lista completa e entra direto no último
  // registro (aba Cadastro) — ou em modo "novo" se ainda não há nenhum.
  const carregarTudo = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.api.viagens.listar({})
      const lista = res.ok ? res.data || [] : []
      setRegistros(lista)
      if (lista.length) {
        const ultimo = lista.length - 1
        setCurrentIdx(ultimo)
        await carregarForm(lista[ultimo])
        setActiveTab('cadastro')
      } else {
        openNew()
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

  useEffect(() => {
    window.api.config.get().then(res => setPastaExportacoes((res.ok ? res.data?.Caminhos?.exportacoes : '') || ''))
  }, [])


  async function handleConfigurarPastaExportacoes() {
    const res = await window.api.config.selecionarPasta({ chave: 'exportacoes', titulo: 'Selecionar pasta de exportações' })
    const nova = res.ok ? res.data : null
    if (nova) {
      setPastaExportacoes(nova)
      notificar.sucesso(`Pasta de exportações atualizada:\n${nova}\n\nAs exportações passam a ser salvas automaticamente aqui, organizadas por Cliente/Ano/Mês.`)
    }
  }

  const [exportandoTodos, setExportandoTodos] = useState(false)

  async function handleExportarTodos() {
    if (!(fResultados?.length) || exportandoTodos) return
    setExportandoTodos(true)
    try {
      const res = await window.api.viagens.exportarExcelLote(fResultados.map(r => r.id))
      if (!res?.ok) {
        if (!res?.cancelado) notificar.erro(res?.erro || 'Falha ao exportar.')
        return
      }
      if (res.falhas?.length) {
        notificar.aviso(`${res.sucesso} de ${res.total} exportadas. Falharam: ${res.falhas.join(', ')}`)
      } else {
        notificar.sucesso(`${res.sucesso} despesa${res.sucesso === 1 ? '' : 's'} exportada${res.sucesso === 1 ? '' : 's'} com sucesso.`)
      }
    } finally {
      setExportandoTodos(false)
    }
  }

  function limparFiltros() {
    setFiltros(FILTROS_VAZIOS)
    setBuscaGeral('')
  }

  const qtdFiltrosAtivos = Object.values(filtros).filter(Boolean).length + (buscaGeral.trim() ? 1 : 0)
  const totalFiltrado = fResultados?.length || 0
  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / porPagina))
  const registrosPagina = (fResultados || []).slice((pagina - 1) * porPagina, pagina * porPagina)

  async function carregarForm(reg) {
    const res = await window.api.viagens.obter(reg.id)
    if (!res.ok) { setErro(res.erro); return }
    const d = res.data
    setForm({
      id: d.id, codigo: d.codigo || '', status: d.status,
      consultor_id: d.consultor_id, consultor_nome: d.consultor_nome,
      cliente_id: d.cliente_id ? String(d.cliente_id) : '', cliente_nome: d.cliente_nome || '',
      data_inicio: String(d.data_inicio).slice(0, 10), data_fim: String(d.data_fim).slice(0, 10),
      local_partida: d.local_partida || '', local_destino: d.local_destino || '',
      meio_transporte: d.meio_transporte || '', observacoes: d.observacoes || '',
      itens: (d.itens || []).map(it => ({
        _key: String(it.id), data: String(it.data).slice(0, 10), descricao: it.descricao || '',
        fornecedor: it.fornecedor || '', qtde: it.qtde, valor_unitario: it.valor_unitario,
        arquivo_path: it.arquivo_path, arquivo_nome: it.arquivo_nome, arquivo_ext: it.arquivo_ext,
      })),
    })
    setErro(null)
    setMode('view')
  }

  // Chamada a partir da tabela filtrada da aba Acesso — acha o índice do
  // registro na lista COMPLETA (registros), não na paginação filtrada.
  function selecionarLinha(registroFiltrado) {
    const idx = registros.findIndex(r => r.id === registroFiltrado.id)
    if (idx < 0) return
    setCurrentIdx(idx)
    carregarForm(registros[idx])
    setActiveTab('cadastro')
  }

  function navTo(idx) {
    if (idx < 0 || idx >= registros.length) return
    setCurrentIdx(idx)
    carregarForm(registros[idx])
  }

  // Preview otimista do próximo código — mesmo padrão de Arquivos.jsx: só
  // feedback visual imediato, o valor real vem do backend via nextval() no
  // insert (viagens:criar).
  function previewNextCodigo() {
    const max = registros.reduce((m, r) => Math.max(m, parseInt(r.codigo || '0', 10)), 0)
    return String(max + 1).padStart(4, '0')
  }

  function openNew() {
    setForm({
      ...EMPTY_FORM,
      codigo: previewNextCodigo(),
      consultor_id: sessao?.registro?.id ?? sessao?.id ?? null,
      consultor_nome: sessao?.registro?.nome ?? sessao?.nome ?? '',
      itens: [novoItem()],
    })
    setErro(null)
    setMode('new')
    setActiveTab('cadastro')
  }

  // Modal Pesquisa Padrão — mesmo padrão de Arquivos.jsx: botão "Consultar"
  // do FormToolbar abre busca rápida sobre a lista completa, em vez de só
  // trocar para a aba Acesso.
  function selecionarDaConsulta(item) {
    const idx = registros.findIndex(r => r.id === item.id)
    if (idx >= 0) { setCurrentIdx(idx); carregarForm(item); setActiveTab('cadastro') }
    setShowConsulta(false)
  }
  function abrirConsulta() {
    setShowConsulta(true)
  }

  function handleDesistir() {
    if (currentIdx >= 0 && registros[currentIdx]) carregarForm(registros[currentIdx])
    else setForm(EMPTY_FORM)
    setMode('view')
  }

  async function handleGravar() {
    if (!form.data_inicio || !form.data_fim) { setErro('Informe o período da viagem.'); return }
    setSaving(true)
    setErro(null)
    try {
      const payload = {
        ...form,
        cliente_id: form.cliente_id || null,
        itens: (form.itens || []).filter(it => it.data),
      }
      const res = mode === 'new'
        ? await window.api.viagens.criar(payload)
        : await window.api.viagens.atualizar({ id: form.id, ...payload })
      if (!res.ok) { setErro(res.erro); return }
      setMode('view')
      const resLista = await window.api.viagens.listar({})
      const lista = resLista.ok ? resLista.data || [] : []
      setRegistros(lista)
      const idx = lista.findIndex(r => r.id === res.data.id)
      if (idx >= 0) setCurrentIdx(idx)
      if (mode === 'new') await carregarForm(res.data)
    } finally { setSaving(false) }
  }

  async function confirmarExclusao() {
    setConfirmExcluir(false)
    const res = await window.api.viagens.excluir(form.id)
    if (!res.ok) { setErro(res.erro); return }
    const resLista = await window.api.viagens.listar({})
    const lista = resLista.ok ? resLista.data || [] : []
    setRegistros(lista)
    if (lista.length) {
      const ni = Math.min(currentIdx, lista.length - 1)
      setCurrentIdx(ni)
      await carregarForm(lista[ni])
    } else {
      setForm(EMPTY_FORM)
      setCurrentIdx(-1)
      setMode('view')
    }
  }

  async function handleMudarStatus(status) {
    if (!form.id) return
    const res = await window.api.viagens.mudarStatus({ id: form.id, status })
    if (res.ok) { setForm(f => ({ ...f, status })); await carregar() }
  }

  async function handleExportar() {
    if (!form.id) return
    const res = await window.api.viagens.exportarExcel(form.id)
    if (!res?.ok && !res?.cancelado) { setErro(res?.erro || 'Falha ao exportar.'); return }
    if (res?.ok && res?.path) notificar.sucesso(`Exportado com sucesso:\n${res.path}`)
  }

  // ── Itens (grid editável) ──────────────────────────────────────────────
  function setItem(key, patch) {
    setForm(prev => ({ ...prev, itens: prev.itens.map(it => it._key === key ? { ...it, ...patch } : it) }))
  }
  function addItem() {
    setForm(prev => ({ ...prev, itens: [...prev.itens, novoItem()] }))
  }
  function removerItem(key) {
    setForm(prev => ({ ...prev, itens: prev.itens.filter(it => it._key !== key) }))
  }
  async function anexarComprovante(key) {
    const res = await window.api.arquivos.selecionarECopiar({ subpasta: 'viagens' })
    if (!res?.ok) return
    setItem(key, { arquivo_path: res.path, arquivo_nome: res.nome, arquivo_ext: res.ext })
  }
  function abrirComprovante(path) {
    if (path) window.api.arquivos.abrir(path)
  }
  function removerComprovante(key) {
    setItem(key, { arquivo_path: null, arquivo_nome: null, arquivo_ext: null })
  }

  const totalItens = (form.itens || []).reduce((s, it) => s + (Number(it.qtde) || 0) * (Number(it.valor_unitario) || 0), 0)
  const isRO = mode === 'view'

  // ── Buscas para os SeletorBusca (lupa) ──────────────────────────────────
  async function buscarClientes(campo, modo, busca) {
    let sql = 'SELECT id, nome FROM entidade_001 WHERE ativo IS DISTINCT FROM false'
    const params = []
    if (busca) {
      const termo = modo === 'iniciando' ? `${busca}%` : modo === 'igual' ? busca : `%${busca}%`
      params.push(termo)
      sql += ` AND nome ILIKE $${params.length}`
    }
    sql += ' ORDER BY nome LIMIT 200'
    const res = await window.api.form.query(sql, params)
    return { registros: res.ok ? res.data : [], total: res.ok ? res.data.length : 0 }
  }
  async function buscarConsultores(campo, modo, busca) {
    const res = await window.api.viagens.listarConsultores()
    let lista = res.ok ? res.data : []
    if (busca) {
      const b = busca.toLowerCase()
      lista = lista.filter(c => modo === 'igual' ? c.nome.toLowerCase() === b
        : modo === 'iniciando' ? c.nome.toLowerCase().startsWith(b)
        : c.nome.toLowerCase().includes(b))
    }
    return { registros: lista, total: lista.length }
  }

  return (
    <div className="page-with-footer">
      <div className="page-tabs">
        <button className={`page-tab${activeTab === 'acesso' ? ' active' : ''}`} onClick={() => setActiveTab('acesso')}>Acesso</button>
        <button className={`page-tab${activeTab === 'cadastro' ? ' active' : ''}`} onClick={() => setActiveTab('cadastro')}>Cadastro</button>
        {form.id && <span className="page-tab-info">{form.codigo || '----'} · {form.cliente_nome || form.consultor_nome}</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          {activeTab === 'acesso' && (
            <button className="btn btn-ghost" onClick={handleExportarTodos} disabled={!(fResultados?.length) || exportandoTodos}
              title={fResultados?.length ? `Exportar as ${fResultados.length} despesas do filtro atual` : 'Nenhum registro para exportar'}
              style={{ height: 28, fontSize: 11, padding: '0 10px' }}>
              <FileDown size={12} />
              {exportandoTodos ? 'Exportando...' : `Exportar Todos${fResultados?.length ? ` (${fResultados.length})` : ''}`}
            </button>
          )}
          <button className="btn btn-ghost" onClick={handleConfigurarPastaExportacoes}
            title={pastaExportacoes ? `Pasta de exportações: ${pastaExportacoes}` : 'Nenhuma pasta configurada — exportações abrem "Salvar como"'}
            style={{ height: 28, fontSize: 11, padding: '0 10px' }}>
            <Settings size={12} />
            {pastaExportacoes
              ? <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{pastaExportacoes}</span>
              : 'Pasta de Exportações'}
          </button>
        </div>
      </div>

      <div className="page-content">
        {erro && (
          <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(239,68,68,.4)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--red)' }}>
            {erro}
          </div>
        )}

        {activeTab === 'acesso' && (
          <>
            {/* Painel de filtros retrátil, mesmo padrão do FormBuilder */}
            <div style={{ border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', boxShadow: 'var(--sh-xs)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setFiltrosAbertos(a => !a)}>
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
                    onClick={e => { e.stopPropagation(); limparFiltros() }}>
                    <RotateCcw size={11} /> Limpar
                  </button>
                )}
                {filtrosAbertos ? <ChevronUp size={13} color="var(--t3)" /> : <ChevronDown size={13} color="var(--t3)" />}
              </div>

              {filtrosAbertos && (
                <div style={{ padding: '4px 14px 14px', borderTop: '1px solid var(--bd)', paddingTop: 12 }}
                  onKeyDown={e => e.key === 'Enter' && carregarAcesso()}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Busca geral</label>
                      <input className="form-input form-input-sm"
                        value={buscaGeral} onChange={e => setBuscaGeral(e.target.value)}
                        placeholder="consultor, cliente, local..." />
                    </div>
                    <SeletorBusca
                      label="Cliente"
                      placeholder="Todos"
                      height={32}
                      valorExibido={filtros.clienteNome}
                      onLimpar={() => setFiltros(f => ({ ...f, clienteId: '', clienteNome: '' }))}
                      titulo="Pesquisa Padrão · entidade_001"
                      campos={CAMPOS_CLIENTE}
                      colunasExibidas={CAMPOS_CLIENTE}
                      campoInicial="nome"
                      onBuscar={buscarClientes}
                      onSelecionar={r => setFiltros(f => ({ ...f, clienteId: String(r.id), clienteNome: r.nome }))}
                    />
                    <SeletorBusca
                      label="Consultor"
                      placeholder="Todos"
                      height={32}
                      valorExibido={filtros.consultorNome}
                      onLimpar={() => setFiltros(f => ({ ...f, consultorId: '', consultorNome: '' }))}
                      titulo="Pesquisa Padrão · consultores"
                      campos={CAMPOS_CONSULTOR}
                      colunasExibidas={CAMPOS_CONSULTOR}
                      campoInicial="nome"
                      onBuscar={buscarConsultores}
                      onSelecionar={r => setFiltros(f => ({ ...f, consultorId: r.id, consultorNome: r.nome }))}
                    />
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Status</label>
                      <select className="form-select form-input-sm"
                        value={filtros.status} onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))}>
                        <option value="">Todos</option>
                        {STATUS_ORDEM.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Período de</label>
                      <InputData className="form-input form-input-sm"
                        value={filtros.dataIni} onChange={v => setFiltros(f => ({ ...f, dataIni: v }))}
                        onRange={(ini, fim) => setFiltros(f => ({ ...f, dataIni: ini, dataFim: fim }))} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Período até</label>
                      <InputData className="form-input form-input-sm"
                        value={filtros.dataFim} onChange={v => setFiltros(f => ({ ...f, dataFim: v }))}
                        onRange={(ini, fim) => setFiltros(f => ({ ...f, dataIni: ini, dataFim: fim }))} />
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
                        <Th style={{ textAlign: 'center', width: 36 }}>#</Th>
                        <Th>Consultor</Th><Th>Cliente</Th><Th>Período</Th><Th>Status</Th><Th style={{ textAlign: 'right' }}>Total</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrosPagina.map((r, ri) => {
                        const idxAbsoluto = (pagina - 1) * porPagina + ri
                        const meta = STATUS_META[r.status] || STATUS_META.rascunho
                        return (
                          <tr key={r.id} onDoubleClick={() => selecionarLinha(r)}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--s2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <Td style={{ textAlign: 'center', color: 'var(--t3)', fontSize: 10 }}>{idxAbsoluto + 1}</Td>
                            <Td>{r.consultor_nome}</Td>
                            <Td>{r.cliente_nome || 'Nenhum'}</Td>
                            <Td>{fmtDataBR(r.data_inicio)} a {fmtDataBR(r.data_fim)}</Td>
                            <Td><span className={`badge ${meta.classe}`}>{meta.label}</span></Td>
                            <Td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtMoeda(r.total_despesas)}</Td>
                          </tr>
                        )
                      })}
                      {!fLoading && registrosPagina.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--t3)', fontSize: 11, fontStyle: 'italic' }}>
                          Nenhum registro encontrado
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginacaoBar pagina={pagina} totalPaginas={totalPaginas} total={totalFiltrado} porPagina={porPagina}
                  onPagina={p => setPagina(p)} onPorPagina={n => { setPorPagina(n); setPagina(1) }} />
              </div>
            )}
          </>
        )}

        {activeTab === 'cadastro' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {form.status && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge ${STATUS_META[form.status].classe}`}>{STATUS_META[form.status].label}</span>
                {isRO && form.id && STATUS_ORDEM.map(s => s !== form.status && (
                  <button key={s} className="btn btn-ghost" style={{ height: 26, fontSize: 10.5 }}
                    onClick={() => handleMudarStatus(s)}>
                    {STATUS_META[s].label}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 10 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Código</label>
                <div className="form-input" style={{ width: 80, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', color: form.codigo ? 'var(--or)' : 'var(--t3)', fontFamily: 'monospace' }}>
                  {form.codigo || ''}
                </div>
              </div>
              <SeletorBusca
                label="Cliente"
                placeholder="Nenhum"
                valorExibido={form.cliente_nome}
                disabled={isRO}
                onLimpar={() => setForm(f => ({ ...f, cliente_id: '', cliente_nome: '' }))}
                titulo="Pesquisa Padrão · entidade_001"
                campos={CAMPOS_CLIENTE}
                colunasExibidas={CAMPOS_CLIENTE}
                campoInicial="nome"
                onBuscar={buscarClientes}
                onSelecionar={r => setForm(f => ({ ...f, cliente_id: String(r.id), cliente_nome: r.nome }))}
              />
              <SeletorBusca
                label="Consultor"
                placeholder="Nenhum"
                valorExibido={form.consultor_nome}
                disabled={isRO}
                titulo="Pesquisa Padrão · consultores"
                campos={CAMPOS_CONSULTOR}
                colunasExibidas={CAMPOS_CONSULTOR}
                campoInicial="nome"
                onBuscar={buscarConsultores}
                onSelecionar={r => setForm(f => ({ ...f, consultor_id: r.id, consultor_nome: r.nome }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Período de *</label>
                <InputData value={form.data_inicio} disabled={isRO}
                  onChange={v => setForm(f => ({ ...f, data_inicio: v }))}
                  onRange={(ini, fim) => setForm(f => ({ ...f, data_inicio: ini, data_fim: fim }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Período até *</label>
                <InputData value={form.data_fim} disabled={isRO}
                  onChange={v => setForm(f => ({ ...f, data_fim: v }))}
                  onRange={(ini, fim) => setForm(f => ({ ...f, data_inicio: ini, data_fim: fim }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Meio de Transporte</label>
                <select className="form-select" value={form.meio_transporte} disabled={isRO}
                  onChange={e => setForm(f => ({ ...f, meio_transporte: e.target.value }))}>
                  <option value="">Selecione</option>
                  {MEIOS_TRANSPORTE.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Local de Partida</label>
                <input className="form-input" value={form.local_partida} disabled={isRO}
                  onChange={e => setForm(f => ({ ...f, local_partida: e.target.value }))} placeholder="Ex: Gaspar - SC" />
              </div>
              <div className="form-group">
                <label className="form-label">Local de Destino</label>
                <input className="form-input" value={form.local_destino} disabled={isRO}
                  onChange={e => setForm(f => ({ ...f, local_destino: e.target.value }))} placeholder="Ex: Criciúma - SC" />
              </div>
            </div>

            {/* Grid de despesas: sem equivalente pronto no padrão (sub_grid nativo não suporta anexo por linha) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <span className="form-label" style={{ flex: 1, marginBottom: 0 }}>Despesas</span>
                {!isRO && (
                  <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }} onClick={addItem}>
                    <Plus size={13} /> Adicionar linha
                  </button>
                )}
              </div>
              <div style={{ border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden', background: 'var(--s1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--s1)' }}>
                      <Th style={{ width: 130 }}>Data</Th><Th style={{ width: 90 }}>Dia</Th><Th>Descrição</Th><Th>Fornecedor</Th>
                      <Th style={{ width: 70, textAlign: 'right' }}>Qtde</Th><Th style={{ width: 100, textAlign: 'right' }}>Vl. Unit.</Th>
                      <Th style={{ width: 90, textAlign: 'right' }}>Valor</Th><Th style={{ width: 96 }}></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.itens || []).length === 0 && (
                      <tr><td colSpan={8} style={{ padding: 16, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>Nenhuma despesa lançada.</td></tr>
                    )}
                    {(form.itens || []).map(it => {
                      const valor = (Number(it.qtde) || 0) * (Number(it.valor_unitario) || 0)
                      return (
                        <tr key={it._key} style={{ borderTop: '1px solid var(--bd)' }}>
                          <Td><InputData className={`form-input${isRO ? ' cell-date-ro' : ''}`} style={cellInputStyle(isRO)} value={it.data} disabled={isRO}
                            onChange={v => setItem(it._key, { data: v })} /></Td>
                          <Td><span style={{ color: 'var(--t3)', fontSize: 11, whiteSpace: 'nowrap' }}>{diaDaSemana(it.data)}</span></Td>
                          <Td><input style={cellInputStyle(isRO)} value={it.descricao} disabled={isRO}
                            onChange={e => setItem(it._key, { descricao: e.target.value })} placeholder="Ex: Refeição" /></Td>
                          <Td><input style={cellInputStyle(isRO)} value={it.fornecedor} disabled={isRO}
                            onChange={e => setItem(it._key, { fornecedor: e.target.value })} /></Td>
                          <Td style={{ padding: '9px 4px' }}><input type="number" step="1" min="0" style={{ ...cellInputStyle(isRO), textAlign: 'right' }} value={it.qtde} disabled={isRO}
                            onChange={e => setItem(it._key, { qtde: e.target.value })} /></Td>
                          <Td style={{ padding: '9px 4px' }}><input type="number" step="0.01" min="0" style={{ ...cellInputStyle(isRO), textAlign: 'right' }} value={it.valor_unitario} disabled={isRO}
                            onChange={e => setItem(it._key, { valor_unitario: e.target.value })} /></Td>
                          <Td style={{ textAlign: 'right' }}><span style={{ fontWeight: 600 }}>{fmtMoeda(valor)}</span></Td>
                          <Td>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                              {it.arquivo_path ? (
                                <>
                                  <button title={it.arquivo_nome} style={iconBtnSmStyle(isRO)} onClick={() => abrirComprovante(it.arquivo_path)}>
                                    <FileDown size={13} color="var(--or)" />
                                  </button>
                                  {!isRO && (
                                    <button title="Remover comprovante" style={iconBtnSmStyle(isRO)} onClick={() => removerComprovante(it._key)}>
                                      <FileX size={13} color="var(--red)" />
                                    </button>
                                  )}
                                </>
                              ) : !isRO && (
                                <button title="Anexar comprovante" style={iconBtnSmStyle(isRO)} onClick={() => anexarComprovante(it._key)}>
                                  <FileDown size={13} />
                                </button>
                              )}
                              {!isRO && (
                                <button title="Remover linha" style={iconBtnSmStyle(isRO)} onClick={() => removerItem(it._key)}>
                                  <Trash2 size={13} color="var(--red)" />
                                </button>
                              )}
                            </div>
                          </Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, padding: '10px 14px', background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5 }}>Total das Despesas</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>{fmtMoeda(totalItens)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5 }}>Valor a Reembolsar</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--or)' }}>{fmtMoeda(totalItens)}</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Observações</label>
              <textarea className="form-input" rows={2} value={form.observacoes} disabled={isRO}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
            </div>
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
          onConsultar={abrirConsulta}
          onExportar={mode === 'view' && form.id ? handleExportar : undefined}
          onGravar={handleGravar}
          onDesistir={handleDesistir}
        />
      )}

      {/* Modal Pesquisa Padrão */}
      {showConsulta && (
        <PesquisaPadraoModal
          titulo="Pesquisa Padrão · despesa_001"
          campos={CAMPOS_BUSCA_DESPESA}
          colunasExibidas={CAMPOS_BUSCA_DESPESA}
          campoInicial="codigo"
          onBuscar={async (campo, modo, busca) => {
            const res = await window.api.viagens.listar({ busca })
            if (!res.ok) throw new Error(res.erro)
            return { registros: res.data, total: res.data.length }
          }}
          onSelecionar={selecionarDaConsulta}
          onFechar={() => setShowConsulta(false)}
          renderCelula={(r, c) => {
            if (c.nome_campo === 'status') return <span className={`badge ${STATUS_META[r.status]?.classe}`}>{STATUS_META[r.status]?.label}</span>
            return String(r[c.nome_campo] ?? '')
          }}
        />
      )}

      {confirmExcluir && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}>
          <div style={{ width: 380, background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px 10px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)' }}>Excluir despesa de viagem</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 6 }}>Esta ação não pode ser desfeita.</div>
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
function Td({ children, style }) {
  return <td style={{ padding: '9px 12px', color: 'var(--t2)', borderBottom: '1px solid var(--bd)', fontSize: 12.5, ...style }}>{children}</td>
}

// Fundo/borda só aparecem em modo edição (Incluir/Alterar) — em modo
// consulta a grade fica "limpa", só texto, sem parecer editável.
function cellInputStyle(isRO) {
  return {
    width: '100%', minWidth: 0, boxSizing: 'border-box',
    border: isRO ? '1px solid transparent' : '1px solid var(--bd)',
    background: 'transparent',
    fontSize: 12, padding: '4px 8px', borderRadius: 6, color: 'var(--t1)', height: 30,
  }
}
function iconBtnSmStyle(isRO) {
  return {
    background: 'transparent', border: isRO ? '1px solid transparent' : '1px solid var(--bd)',
    cursor: 'pointer', color: 'var(--t3)',
    width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6,
  }
}
