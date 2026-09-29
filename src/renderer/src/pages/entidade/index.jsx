import { useState, useEffect, useCallback, useMemo } from 'react'
import '../../App.css'
import FormToolbar from '../../components/FormToolbar'
import PaginacaoBar from '../../components/PaginacaoBar.jsx'
import MenuContextoGrid from '../../components/MenuContextoGrid'
import PainelFiltrosGrid from '../../components/PainelFiltrosGrid'
import TabelaResultados from '../../components/TabelaResultados'
import { notificar } from '../../components/Notificacao'
import { fmtDataBR } from '../../lib/utils/data.js'
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
  { chave: 'id', label: 'Entidade', tipo: 'lookup', fixo: true, tabela: 'entidade_001', campoLabel: 'nome',
    tituloModal: 'Consultar entidade', placeholder: 'Todas as entidades',
    camposBusca: [
      { nome_campo: 'nome', label: 'Nome / Razão Social' },
      { nome_campo: 'apelido', label: 'Apelido / Fantasia' },
      { nome_campo: 'cnpj', label: 'CPF / CNPJ' },
      { nome_campo: 'codigo', label: 'Código' },
    ] },
  { chave: 'nome', label: 'Nome / Razão Social', tipo: 'texto' },
  { chave: 'apelido', label: 'Apelido / Fantasia', tipo: 'texto' },
  { chave: 'cnpj', label: 'CPF / CNPJ', tipo: 'texto' },
  { chave: 'papeis', label: 'Papel', tipo: 'exato', multi: true, csv: true, fixo: true, opcoes: PAPEIS },
  { chave: 'status', label: 'Status', tipo: 'exato', multi: true, fixo: true, opcoes: STATUS },
  { chave: 'tipo_pessoa', label: 'Tipo de pessoa', tipo: 'exato', multi: true, opcoes: TIPOS_PESSOA },
  { chave: 'banco_id', label: 'Banco', tipo: 'lookup', tabela: 'banco_001', campoLabel: 'nome',
    camposBusca: [{ nome_campo: 'nome', label: 'Nome' }, { nome_campo: 'compe', label: 'Compe' }] },
  { chave: 'natureza_juridica_id', label: 'Natureza jurídica', tipo: 'lookup', tabela: 'natureza_juridica_001', campoLabel: 'descricao',
    camposBusca: [{ nome_campo: 'codigo', label: 'Código' }, { nome_campo: 'descricao', label: 'Descrição' }] },
  { chave: 'condicao_pagamento_id', label: 'Condição de pagamento', tipo: 'lookup', tabela: 'condicao_pagamento_001', campoLabel: 'descricao',
    camposBusca: [{ nome_campo: 'codigo', label: 'Código' }, { nome_campo: 'descricao', label: 'Descrição' }] },
  { chave: 'inscricao_estadual', label: 'Inscrição Estadual', tipo: 'texto' },
  { chave: 'inscricao_municipal', label: 'Inscrição Municipal', tipo: 'texto' },
  { chave: 'telefone', label: 'Telefone', tipo: 'texto' },
  { chave: 'celular', label: 'Celular', tipo: 'texto' },
  { chave: 'email', label: 'E-mail', tipo: 'texto' },
  { chave: 'site', label: 'Site', tipo: 'texto' },
  { chave: 'cidade', label: 'Cidade', tipo: 'texto' },
  { chave: 'uf', label: 'UF', tipo: 'exato', multi: true, opcoes: UFS.map((u) => ({ valor: u, label: u })) },
  { chave: 'bairro', label: 'Bairro', tipo: 'texto' },
  { chave: 'cep', label: 'CEP', tipo: 'texto' },
  { chave: 'logradouro', label: 'Logradouro', tipo: 'texto' },
  { chave: 'porte', label: 'Porte', tipo: 'texto' },
  { chave: 'cnae', label: 'CNAE', tipo: 'texto' },
  { chave: 'situacao_cadastral', label: 'Situação cadastral', tipo: 'texto' },
  { chave: 'regime_tributario', label: 'Regime tributário', tipo: 'exato', multi: true, opcoes: REGIMES.filter((r) => r.valor) },
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

const fmtR$ = (v) => (v == null ? '-' : (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
const fmtData = (v) => fmtDataBR(v)

// Colunas da TABELA de resultados. O SQL traz tudo (entidade + FKs + endereço
// principal + comercial + crédito); aqui so o que aparece e como. `sticky`:
// sempre visivel. `padrao`: vem marcada na 1a vez. As demais entram pelo
// botao "Colunas".
const COLUNAS_RESULTADO = [
  { chave: 'codigo', label: 'Código', largura: 70, sticky: true,
    render: (r) => <span style={{ fontFamily: 'monospace', color: 'var(--or)', fontWeight: 600 }}>{r.codigo}</span> },
  { chave: 'nome', label: 'Nome / Razão Social', sticky: true },

  { chave: 'apelido', label: 'Apelido', largura: 160, padrao: true, render: (r) => r.apelido || '-' },
  { chave: 'cnpj', label: 'CPF / CNPJ', largura: 150, padrao: true, render: (r) => r.cnpj || '-' },
  { chave: 'papeis', label: 'Papéis', largura: 180, padrao: true,
    render: (r) => String(r.papeis || '').split(',').filter(Boolean).map(papelLabel).join(', ') || '-' },
  { chave: 'status', label: 'Status', largura: 100, padrao: true,
    render: (r) => { const m = statusMeta(r.status); return <span className={`badge ${m.classe}`}>{m.label}</span> } },
  { chave: 'end_cidade', label: 'Cidade', largura: 150, padrao: true,
    render: (r) => `${r.end_cidade || r.cidade || ''}${(r.end_uf || r.uf) ? ' - ' + (r.end_uf || r.uf) : ''}` || '-' },

  { chave: 'tipo_pessoa', label: 'Tipo', largura: 80, render: (r) => (r.tipo_pessoa === 'pf' ? 'PF' : 'PJ') },
  { chave: 'inscricao_estadual', label: 'Inscr. Estadual', largura: 130, render: (r) => r.inscricao_estadual || '-' },
  { chave: 'inscricao_municipal', label: 'Inscr. Municipal', largura: 130, render: (r) => r.inscricao_municipal || '-' },
  { chave: 'telefone', label: 'Telefone', largura: 130, render: (r) => r.telefone || '-' },
  { chave: 'celular', label: 'Celular', largura: 130, render: (r) => r.celular || '-' },
  { chave: 'email', label: 'E-mail', largura: 220, render: (r) => r.email || '-' },
  { chave: 'emails_contatos', label: 'E-mails dos contatos', largura: 260, render: (r) => r.emails_contatos || '-' },
  { chave: 'site', label: 'Site', largura: 180, render: (r) => r.site || '-' },

  { chave: 'end_completo', label: 'Endereço principal', largura: 300,
    render: (r) => {
      const p = [r.end_logradouro, r.end_numero, r.end_bairro].filter(Boolean).join(', ')
      return p || '-'
    } },
  { chave: 'end_cep', label: 'CEP', largura: 110, render: (r) => r.end_cep || r.cep || '-' },
  { chave: 'end_bairro', label: 'Bairro', largura: 140, render: (r) => r.end_bairro || r.bairro || '-' },

  { chave: 'natureza_juridica_nome', label: 'Natureza jurídica', largura: 200, render: (r) => r.natureza_juridica_nome || '-' },
  { chave: 'regime_tributario', label: 'Regime tributário', largura: 140, render: (r) => r.regime_tributario || '-' },
  { chave: 'cnae', label: 'CNAE', largura: 200, render: (r) => r.cnae || '-' },
  { chave: 'porte', label: 'Porte', largura: 120, render: (r) => r.porte || '-' },
  { chave: 'contribuinte_icms', label: 'Contrib. ICMS', largura: 110, render: (r) => (r.contribuinte_icms ? 'Sim' : 'Não') },
  { chave: 'optante_simples', label: 'Simples', largura: 90, render: (r) => (r.optante_simples ? 'Sim' : 'Não') },
  { chave: 'situacao_cadastral', label: 'Situação cadastral', largura: 160, render: (r) => r.situacao_cadastral || '-' },

  { chave: 'condicao_pagamento_nome', label: 'Condição de pagamento', largura: 200, render: (r) => r.condicao_pagamento_nome || '-' },
  { chave: 'dia_vencimento', label: 'Dia venc.', largura: 90, align: 'center', render: (r) => r.dia_vencimento || '-' },
  { chave: 'banco', label: 'Banco', largura: 200, render: (r) => (r.banco_nome ? `${r.banco_compe ? r.banco_compe + ' · ' : ''}${r.banco_nome}` : '-') },
  { chave: 'agencia', label: 'Agência', largura: 100, render: (r) => r.agencia || '-' },
  { chave: 'conta_corrente', label: 'Conta corrente', largura: 130, render: (r) => r.conta_corrente || '-' },
  { chave: 'pix_chave', label: 'Chave PIX', largura: 200, render: (r) => r.pix_chave || '-' },
  { chave: 'limite_credito', label: 'Limite de crédito', largura: 130, align: 'right', render: (r) => fmtR$(r.limite_credito) },

  { chave: 'cred_score_risco', label: 'Score risco', largura: 100, align: 'center', render: (r) => r.cred_score_risco || '-' },
  { chave: 'cred_status', label: 'Status crédito', largura: 120, render: (r) => r.cred_status || '-' },
  { chave: 'cred_limite', label: 'Limite (crédito)', largura: 130, align: 'right', render: (r) => fmtR$(r.cred_limite) },
  { chave: 'cred_utilizado', label: 'Limite utilizado', largura: 130, align: 'right', render: (r) => fmtR$(r.cred_utilizado) },

  { chave: 'com_tabela_preco', label: 'Tabela de preço', largura: 140, render: (r) => r.com_tabela_preco || '-' },
  { chave: 'com_frete_padrao', label: 'Frete padrão', largura: 120, render: (r) => r.com_frete_padrao || '-' },
  { chave: 'com_regiao', label: 'Região', largura: 120, render: (r) => r.com_regiao || '-' },

  { chave: 'origem', label: 'Origem', largura: 120, render: (r) => r.origem || '-' },
  { chave: 'segmento', label: 'Segmento', largura: 140, render: (r) => r.segmento || '-' },
  { chave: 'grupo_economico', label: 'Grupo econômico', largura: 160, render: (r) => r.grupo_economico || '-' },
  { chave: 'tags', label: 'Tags', largura: 160, render: (r) => r.tags || '-' },

  { chave: 'qtd_contatos', label: 'Contatos', largura: 80, align: 'center', render: (r) => r.qtd_contatos || 0 },
  { chave: 'qtd_enderecos', label: 'Endereços', largura: 80, align: 'center', render: (r) => r.qtd_enderecos || 0 },
  { chave: 'qtd_anexos', label: 'Anexos', largura: 80, align: 'center', render: (r) => r.qtd_anexos || 0 },

  { chave: 'data_fundacao', label: 'Data de fundação', largura: 130, render: (r) => fmtData(r.data_fundacao) },
  { chave: 'data_nascimento', label: 'Data de nascimento', largura: 140, render: (r) => fmtData(r.data_nascimento) },
  { chave: 'data_primeiro_contato', label: 'Primeiro contato', largura: 130, render: (r) => fmtData(r.data_primeiro_contato) },
  { chave: 'criado_em', label: 'Cadastrado em', largura: 140, render: (r) => fmtData(r.criado_em) },
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
  }, [filtrosCol])

  const setFiltroCol = (chave, f) => setFiltrosCol((prev) => ({ ...prev, [chave]: f }))
  function limparFiltros() { setFiltrosCol({}) }

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
            />

            {fResultados === null ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)', border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)' }}>
                <div style={{ fontSize: 13 }}>Configure os filtros (opcional) e clique em Buscar</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 8 }}>
                <TabelaResultados
                  colunas={COLUNAS_RESULTADO}
                  registros={registrosPagina}
                  prefKey="entidade-acesso"
                  selecao={{
                    has: (id) => selecionados.has(id),
                    toggle: toggleSelecionado,
                    todos: todosSelecionados,
                    toggleTodos: toggleSelecionarTodos,
                  }}
                  onLinhaDuploClique={selecionarLinha}
                  onLinhaMenu={abrirMenuLinha}
                />
                {selecionados.size > 0 && (
                  <div style={{ padding: '6px 14px', border: '1px solid var(--bd)', borderRadius: 8, background: 'var(--s1)', fontSize: 11.5, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 8 }}>
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

