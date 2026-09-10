import { useState, useEffect, useCallback } from 'react'
import {
  Star, Lock, ExternalLink, Copy, Check, Calendar, AlertTriangle, FolderOpen, History, ScrollText,
  LayoutGrid, Table as TableIcon,
} from 'lucide-react'
import '../App.css'
import FormToolbar from '../components/FormToolbar'
import PesquisaPadraoModal from '../components/PesquisaPadraoModal.jsx'
import PainelFiltrosGrid from '../components/PainelFiltrosGrid'
import TabelaResultados from '../components/TabelaResultados'
import PasswordVaultField from '../components/PasswordVaultField.jsx'
import InputData from '../components/InputData'
import HistoricoSenhaModal from '../components/cofre/HistoricoSenhaModal.jsx'
import LogAcessoModal from '../components/cofre/LogAcessoModal.jsx'
import AnexosPainel from '../components/cofre/AnexosPainel.jsx'
import TotpField from '../components/cofre/TotpField.jsx'
import { SecaoHeader } from '../components/SecaoForm.jsx'
import { NIVEL_META, EMPTY_FORM, TIPOS_CREDENCIAL, fmtDataBR, estaVencida } from './cofreSenhas/utils'

const CAMPOS_BUSCA = [
  { nome_campo: 'codigo',   label: 'Código'  },
  { nome_campo: 'sistema',  label: 'Sistema' },
  { nome_campo: 'usuario',  label: 'Usuário' },
]

const NIVEIS_OPCOES = [
  { valor: 'Fraca', label: 'Fraca' },
  { valor: 'Média', label: 'Média' },
  { valor: 'Forte', label: 'Forte' },
  { valor: 'Muito forte', label: 'Muito forte' },
]

// Aba de Acesso — consulta completa (docs CLAUDE.md §4). Um filtro por
// coluna consultável de cofre_senha_001.
const COLUNAS_FILTRO = [
  { chave: 'codigo', label: 'Código', tipo: 'texto' },
  { chave: 'sistema', label: 'Sistema', tipo: 'texto' },
  { chave: 'categoria', label: 'Categoria', tipo: 'texto' },
  { chave: 'usuario', label: 'Usuário / E-mail', tipo: 'texto' },
  { chave: 'url', label: 'URL', tipo: 'texto' },
  { chave: 'tags', label: 'Tags', tipo: 'texto' },
  { chave: 'observacoes', label: 'Observações', tipo: 'texto' },
  { chave: 'tipo_credencial', label: 'Tipo de credencial', tipo: 'exato', multi: true, opcoes: TIPOS_CREDENCIAL },
  { chave: 'nivel_seguranca', label: 'Nível de segurança', tipo: 'exato', multi: true, opcoes: NIVEIS_OPCOES },
  { chave: 'favorito', label: 'Favorito', tipo: 'booleano' },
  { chave: 'dt_validade', label: 'Válido até', tipo: 'data' },
  { chave: 'criado_em', label: 'Criado em', tipo: 'data' },
  { chave: 'alterado_em', label: 'Alterado em', tipo: 'data' },
]

const rotuloTipoCred = (v) => TIPOS_CREDENCIAL.find((t) => t.valor === v)?.label || v || '-'

const COLUNAS_RESULTADO = [
  { chave: 'codigo', label: 'Código', largura: 70, sticky: true,
    render: (r) => <span style={{ fontFamily: 'monospace', color: 'var(--or)', fontWeight: 600 }}>{r.codigo || '-'}</span> },
  { chave: 'sistema', label: 'Sistema', sticky: true },
  { chave: 'usuario', label: 'Usuário', largura: 200, padrao: true, render: (r) => r.usuario || '-' },
  { chave: 'categoria', label: 'Categoria', largura: 150, padrao: true, render: (r) => r.categoria || '-' },
  { chave: 'tipo_credencial', label: 'Tipo', largura: 150, padrao: true, render: (r) => rotuloTipoCred(r.tipo_credencial) },
  { chave: 'nivel_seguranca', label: 'Nível', largura: 110, padrao: true,
    render: (r) => (r.nivel_seguranca ? <span className={`badge ${NIVEL_META[r.nivel_seguranca]?.classe || ''}`}>{r.nivel_seguranca}</span> : '-') },
  { chave: 'dt_validade', label: 'Válido até', largura: 110, padrao: true,
    render: (r) => (r.dt_validade
      ? <span style={{ color: r.vencida ? 'var(--or)' : undefined }}>{fmtDataBR(r.dt_validade)}{r.vencida ? ' (vencida)' : ''}</span>
      : '-') },
  { chave: 'favorito', label: 'Fav.', largura: 60, align: 'center', padrao: true,
    render: (r) => (r.favorito ? <Star size={12} fill="var(--or)" color="var(--or)" /> : '-') },
  { chave: 'url', label: 'URL', largura: 240, render: (r) => r.url || '-' },
  { chave: 'tags', label: 'Tags', largura: 180, render: (r) => r.tags || '-' },
  { chave: 'observacoes', label: 'Observações', largura: 260, render: (r) => r.observacoes || '-' },
  { chave: 'tem_nota', label: 'Nota segura', largura: 100, align: 'center', render: (r) => (r.tem_nota ? 'Sim' : 'Não') },
  { chave: 'tem_totp', label: '2FA (TOTP)', largura: 100, align: 'center', render: (r) => (r.tem_totp ? 'Sim' : 'Não') },
  { chave: 'criado_em', label: 'Criado em', largura: 140, render: (r) => fmtDataBR(r.criado_em) || '-' },
  { chave: 'alterado_em', label: 'Alterado em', largura: 140, render: (r) => fmtDataBR(r.alterado_em) || '-' },
]

export default function CofreSenhas({ newTrigger, sessao }) {
  const [activeTab, setActiveTab] = useState('cadastro')

  // Lista completa (não filtrada) — sempre carregada no mount, é a fonte
  // de verdade pra navegação (« ‹ N/total › ») e pro form, igual
  // Arquivos.jsx/Viagens.jsx. A aba Acesso NÃO usa isto — usa fResultados
  // (abaixo), uma consulta filtrada e independente que só roda ao buscar.
  const [registros, setRegistros] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(-1)

  const [mode, setMode] = useState('view')
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState(null)
  const [confirmExcluir, setConfirmExcluir] = useState(false)
  const [showConsulta, setShowConsulta] = useState(false)
  const [reusoDetectado, setReusoDetectado] = useState(null)
  const [showHistorico, setShowHistorico] = useState(false)
  const [showLogAcesso, setShowLogAcesso] = useState(false)

  const [busca, setBusca] = useState('')
  const [filtrosCol, setFiltrosCol] = useState({})
  const [fResultados, setFResultados] = useState(null)
  const [fLoading, setFLoading] = useState(false)
  const [copiadoId, setCopiadoId] = useState(null)
  // Cofre usa cards por padrão (navegação visual); tabela é a alternativa
  // para consulta completa com seletor de colunas (docs CLAUDE.md §4).
  const [modoVisao, setModoVisao] = useState('cards') // 'cards' | 'tabela'

  const carregarAcesso = useCallback(async (b = busca, fc = filtrosCol) => {
    setFLoading(true)
    try {
      const params = {}
      if (b && b.trim()) params.busca = b.trim()
      const limpo = Object.fromEntries(Object.entries(fc || {}).filter(([, v]) => v != null))
      if (Object.keys(limpo).length) params.filtros = limpo
      const res = await window.api.cofreSenhas.listar(params)
      setFResultados(res.ok ? res.data || [] : [])
    } catch { setFResultados([]) }
    finally { setFLoading(false) }
  }, [busca, filtrosCol])

  const setFiltroCol = (chave, f) => setFiltrosCol((prev) => ({ ...prev, [chave]: f }))

  const carregarCategorias = useCallback(async () => {
    const res = await window.api.cofreSenhas.listarCategorias()
    if (res.ok) setCategorias(res.data)
  }, [])

  // Ao abrir a tela, carrega a lista completa e mostra o último registro em
  // modo consulta (view) — mesmo padrão de Arquivos.jsx/Viagens.jsx. Nunca
  // entra em modo "novo" sozinho, mesmo com a lista vazia (o form fica com
  // os campos vazios, mas em view/readonly).
  const carregarTudo = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.api.cofreSenhas.listar({})
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

  useEffect(() => { carregarTudo(); carregarCategorias() }, [carregarTudo, carregarCategorias])

  useEffect(() => {
    if (newTrigger) openNew()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTrigger])

  function limparFiltros() {
    setBusca('')
    setFiltrosCol({})
  }

  async function carregarForm(reg) {
    const res = await window.api.cofreSenhas.obter(reg.id)
    if (!res.ok) { setErro(res.erro); return }
    const d = res.data
    setForm({
      id: d.id, codigo: d.codigo || '', sistema: d.sistema || '', categoria: d.categoria || '',
      url: d.url || '', usuario: d.usuario || '',
      senha: d.senha || '', nivel_seguranca: d.nivel_seguranca || '',
      dt_validade: d.dt_validade ? String(d.dt_validade).slice(0, 10) : '',
      observacoes: d.observacoes || '', tags: d.tags || '', favorito: !!d.favorito,
      tipo_credencial: d.tipo_credencial || 'login_senha',
      nota_segura: d.nota_segura || '', totp_secret: d.totp_secret || '',
    })
    setErro(null)
    setMode('view')
  }

  // Chamada a partir da lista filtrada da aba Acesso — acha o índice do
  // registro na lista COMPLETA (registros), não na lista filtrada.
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

  // Preview otimista do próximo código — mesmo padrão de Viagens.jsx: só
  // feedback visual imediato, o valor real vem do backend via nextval() no
  // insert (cofreSenhas:criar).
  function previewNextCodigo() {
    const max = registros.reduce((m, r) => Math.max(m, parseInt(r.codigo || '0', 10)), 0)
    return String(max + 1).padStart(3, '0')
  }

  function openNew() {
    setForm({ ...EMPTY_FORM, codigo: previewNextCodigo() })
    setCurrentIdx(-1)
    setErro(null)
    setMode('new')
    setActiveTab('cadastro')
  }

  function selecionarDaConsulta(item) {
    const idx = registros.findIndex(r => r.id === item.id)
    if (idx >= 0) { setCurrentIdx(idx); carregarForm(item); setActiveTab('cadastro') }
    setShowConsulta(false)
  }

  function handleDesistir() {
    if (currentIdx >= 0 && registros[currentIdx]) carregarForm(registros[currentIdx])
    else setForm(EMPTY_FORM)
    setMode('view')
  }

  async function gravarDeFato() {
    setSaving(true)
    setErro(null)
    try {
      const payload = { ...form, dt_validade: form.dt_validade || null }
      const res = mode === 'new'
        ? await window.api.cofreSenhas.criar(payload)
        : await window.api.cofreSenhas.atualizar(payload)
      if (!res.ok) { setErro(res.erro); return }
      setMode('view')
      const resLista = await window.api.cofreSenhas.listar({})
      const lista = resLista.ok ? resLista.data || [] : []
      setRegistros(lista)
      const idx = lista.findIndex(r => r.id === res.data.id)
      if (idx >= 0) setCurrentIdx(idx)
      await carregarCategorias()
      await carregarForm(res.data)
    } finally { setSaving(false) }
  }

  async function handleGravar() {
    if (!form.sistema.trim()) { setErro('Informe o sistema.'); return }
    const senhaReutilizavel = form.tipo_credencial === 'login_senha' || form.tipo_credencial === 'api_token'
    if (senhaReutilizavel && form.senha) {
      const res = await window.api.cofreSenhas.verificarReuso({ senha: form.senha, excluirId: form.id })
      if (res.ok && res.data?.length) { setReusoDetectado(res.data); return }
    }
    await gravarDeFato()
  }

  async function confirmarExclusao() {
    setConfirmExcluir(false)
    const res = await window.api.cofreSenhas.excluir(form.id)
    if (!res.ok) { setErro(res.erro); return }
    const resLista = await window.api.cofreSenhas.listar({})
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

  async function handleToggleFavorito(id) {
    const res = await window.api.cofreSenhas.toggleFavorito(id)
    if (!res.ok) return
    setRegistros(rs => rs.map(r => r.id === id ? { ...r, favorito: res.data.favorito } : r))
    if (fResultados) setFResultados(rs => rs.map(r => r.id === id ? { ...r, favorito: res.data.favorito } : r))
    if (form.id === id) setForm(f => ({ ...f, favorito: res.data.favorito }))
  }

  const nomeUsuarioAtual = sessao?.nome || sessao?.usuario || 'desconhecido'

  function registrarAcesso(credencialId, acao) {
    window.api.cofreSenhaAcesso.registrar({ credencialId, acao, usuarioNome: nomeUsuarioAtual }).catch(() => {})
  }

  async function handleCopiarSenhaLinha(reg) {
    const res = await window.api.cofreSenhas.obter(reg.id)
    if (!res.ok || !res.data.senha) return
    await window.api.clipboard.write(res.data.senha)
    setCopiadoId(reg.id)
    setTimeout(() => setCopiadoId(null), 1500)
    registrarAcesso(reg.id, 'copiar')
  }

  const isRO = mode === 'view'

  return (
    <div className="page-with-footer">
      <div className="page-tabs">
        <button className={`page-tab${activeTab === 'acesso' ? ' active' : ''}`} onClick={() => setActiveTab('acesso')}>Acesso</button>
        <button className={`page-tab${activeTab === 'cadastro' ? ' active' : ''}`} onClick={() => setActiveTab('cadastro')}>Cadastro</button>
        {form.id && <span className="page-tab-info">{form.codigo || '----'} · {form.sistema || '(sem nome)'}</span>}
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
              onBuscar={() => carregarAcesso()}
              onLimpar={limparFiltros}
              fLoading={fLoading}
              busca={busca}
              onBusca={setBusca}
            />

            {fResultados !== null && !fLoading && fResultados.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11.5, color: 'var(--t3)', flex: 1 }}>
                  {fResultados.length} registro{fResultados.length !== 1 ? 's' : ''}
                </span>
                <div style={{ display: 'flex', border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden' }}>
                  <button type="button"
                    className={`btn ${modoVisao === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ height: 28, fontSize: 11, padding: '0 10px', borderRadius: 0 }}
                    onClick={() => setModoVisao('cards')}>
                    <LayoutGrid size={12} /> Cards
                  </button>
                  <button type="button"
                    className={`btn ${modoVisao === 'tabela' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ height: 28, fontSize: 11, padding: '0 10px', borderRadius: 0 }}
                    onClick={() => setModoVisao('tabela')}>
                    <TableIcon size={12} /> Tabela
                  </button>
                </div>
              </div>
            )}

            {fResultados === null ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)', border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)' }}>
                <div style={{ fontSize: 13 }}>Configure os filtros (opcional) e clique em Buscar</div>
              </div>
            ) : fLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...Array(4)].map((_, i) => <div key={i} className="skel" style={{ height: 66, borderRadius: 10 }} />)}
              </div>
            ) : fResultados.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '60px 20px', color: 'var(--t3)', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--s1)', border: '1px solid var(--bd)', boxShadow: 'var(--sh-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={26} strokeWidth={1.2} color="var(--t3)" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Nenhum acesso encontrado</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 280, lineHeight: 1.6 }}>Ajuste os filtros ou cadastre um novo acesso.</div>
              </div>
            ) : modoVisao === 'tabela' ? (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <TabelaResultados
                  colunas={COLUNAS_RESULTADO}
                  registros={fResultados}
                  prefKey="cofre-senhas-acesso"
                  onLinhaDuploClique={selecionarLinha}
                  vazio="Nenhum acesso encontrado"
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {fResultados.map(r => {
                  const nivel = NIVEL_META[r.nivel_seguranca] || {}
                  const vencida = estaVencida(r.dt_validade)
                  return (
                    <div key={r.id} onDoubleClick={() => selecionarLinha(r)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        background: 'var(--s1)', border: '1.5px solid var(--bd)', borderRadius: 12,
                        padding: '12px 16px', boxShadow: 'var(--sh-xs)', cursor: 'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--bd2)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bd)'}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: 'var(--or3)', border: '1px solid rgba(255,107,43,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Lock size={16} color="var(--or)" />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sistema}</span>
                          {r.nivel_seguranca && <span className={`badge ${nivel.classe}`}>{r.nivel_seguranca}</span>}
                          {vencida && <span className="badge badge-orange" style={{ display: 'flex', alignItems: 'center', gap: 3 }}><AlertTriangle size={10} /> Vencida</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--t3)', flexWrap: 'wrap' }}>
                          {r.usuario && <span>{r.usuario}</span>}
                          {r.categoria && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><FolderOpen size={10} /> {r.categoria}</span>}
                          {r.dt_validade && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={10} /> {fmtDataBR(r.dt_validade)}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {r.url && (
                          <button className="btn btn-ghost" style={{ height: 30, width: 30, padding: 0 }}
                            onClick={e => { e.stopPropagation(); window.api?.shell?.openExternal?.(r.url) }} title="Abrir URL">
                            <ExternalLink size={13} />
                          </button>
                        )}
                        <button className="btn btn-ghost" style={{ height: 30, width: 30, padding: 0, color: copiadoId === r.id ? 'var(--green)' : undefined }}
                          onClick={e => { e.stopPropagation(); handleCopiarSenhaLinha(r) }} title="Copiar senha">
                          {copiadoId === r.id ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                        <button className="btn btn-ghost" style={{ height: 30, width: 30, padding: 0 }}
                          onClick={e => { e.stopPropagation(); handleToggleFavorito(r.id) }} title="Favorito">
                          <Star size={13} fill={r.favorito ? 'var(--or)' : 'none'} color={r.favorito ? 'var(--or)' : 'currentColor'} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'cadastro' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px' }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap' }}>Identificação</span>
              <span style={{ flex: 1, height: 1, background: 'var(--bd2)' }} />
              {isRO && form.id && (
                <button type="button" onClick={() => setShowLogAcesso(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 11, flexShrink: 0 }}
                  title="Ver log de acesso deste item">
                  <ScrollText size={12} /> Log de Acesso
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 10 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Código</label>
                <div className="form-input" style={{ width: 80, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', color: form.codigo ? 'var(--or)' : 'var(--t3)', fontFamily: 'monospace' }}>
                  {form.codigo || 'novo'}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Sistema *</label>
                <input className="form-input" value={form.sistema} disabled={isRO}
                  onChange={e => setForm(f => ({ ...f, sistema: e.target.value }))} placeholder="Ex: Servidor de E-mail" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Credencial</label>
              <select className="form-select" style={{ width: 260 }} value={form.tipo_credencial}
                disabled={isRO || mode === 'edit'}
                title={mode === 'edit' ? 'O tipo não pode ser alterado após a criação — crie um novo registro se precisar de outro tipo.' : undefined}
                onChange={e => setForm(f => ({ ...f, tipo_credencial: e.target.value }))}>
                {TIPOS_CREDENCIAL.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
              </select>
            </div>

            <div><SecaoHeader titulo="Acesso" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <input className="form-input" list="cofre-categorias" value={form.categoria} disabled={isRO}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} placeholder="Ex: Contratos" />
              </div>
              <div className="form-group">
                <label className="form-label">URL de Acesso</label>
                <CampoComCopiar value={form.url} disabled={isRO}
                  onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://" />
              </div>
            </div>

            {form.tipo_credencial === 'login_senha' && (
              <div className="form-group">
                <label className="form-label">Usuário / E-mail</label>
                <CampoComCopiar value={form.usuario} disabled={isRO}
                  onChange={v => setForm(f => ({ ...f, usuario: v }))} placeholder="usuario@empresa.com.br" />
              </div>
            )}

            {form.tipo_credencial === 'nota_segura' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 10, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Nota Segura</label>
                  <PasswordVaultField
                    value={form.nota_segura}
                    onChange={v => setForm(f => ({ ...f, nota_segura: v }))}
                    disabled={isRO}
                    semGerador
                    multilinha
                    placeholder="Texto sigiloso — ex: recovery codes, chave privada, PIN..."
                    onVisualizar={() => form.id && registrarAcesso(form.id, 'visualizar')}
                    onCopiar={() => form.id && registrarAcesso(form.id, 'copiar')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Válido até</label>
                  <InputData value={form.dt_validade} disabled={isRO}
                    onChange={v => setForm(f => ({ ...f, dt_validade: v }))} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 10, alignItems: 'start' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="form-label" style={{ margin: 0 }}>{form.tipo_credencial === 'api_token' ? 'Chave de API / Token' : 'Senha'}</label>
                    {isRO && form.id && (
                      <button type="button" onClick={() => setShowHistorico(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 11, padding: '0 0 4px' }}
                        title="Ver histórico de senhas anteriores">
                        <History size={12} /> Histórico
                      </button>
                    )}
                  </div>
                  <PasswordVaultField
                    value={form.senha}
                    onChange={v => setForm(f => ({ ...f, senha: v }))}
                    disabled={isRO}
                    onVisualizar={() => form.id && registrarAcesso(form.id, 'visualizar')}
                    onCopiar={() => form.id && registrarAcesso(form.id, 'copiar')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Válido até</label>
                  <InputData value={form.dt_validade} disabled={isRO}
                    onChange={v => setForm(f => ({ ...f, dt_validade: v }))} />
                </div>
              </div>
            )}

            <datalist id="cofre-categorias">{categorias.map(c => <option key={c} value={c} />)}</datalist>

            <div><SecaoHeader titulo="Autenticação em dois fatores" /></div>
            <TotpField
              credencialId={form.id}
              value={form.totp_secret}
              salvo={isRO}
              onChange={v => setForm(f => ({ ...f, totp_secret: v }))}
              disabled={isRO}
              onCopiarCodigo={() => form.id && registrarAcesso(form.id, 'copiar_totp')}
            />

            {form.id && (
              <>
                <div><SecaoHeader titulo="Anexos" /></div>
                <AnexosPainel credencialId={form.id} usuarioNome={nomeUsuarioAtual} disabled={isRO} />
              </>
            )}

            <div><SecaoHeader titulo="Complemento" /></div>
            <div className="form-group">
              <label className="form-label">Observações</label>
              <textarea className="form-textarea" rows={2} value={form.observacoes} disabled={isRO}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="Informações adicionais sobre este acesso..." />
            </div>

            <div className="form-group">
              <label className="form-label">Tags</label>
              <input className="form-input" value={form.tags} disabled={isRO}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="separadas por vírgula" />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: isRO ? 'default' : 'pointer', fontSize: 12, color: 'var(--t2)' }}>
              <input type="checkbox" checked={form.favorito} disabled={isRO}
                onChange={e => setForm(f => ({ ...f, favorito: e.target.checked }))} />
              Marcar como favorito <Star size={12} fill={form.favorito ? 'var(--or)' : 'none'} color={form.favorito ? 'var(--or)' : 'currentColor'} />
            </label>
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
          onConsultar={() => setShowConsulta(true)}
          onGravar={handleGravar}
          onDesistir={handleDesistir}
        />
      )}

      {showConsulta && (
        <PesquisaPadraoModal
          titulo="Pesquisa Padrão · Cofre de Senhas"
          campos={CAMPOS_BUSCA}
          colunasExibidas={CAMPOS_BUSCA}
          campoInicial="sistema"
          onBuscar={async (campo, modo, busca) => {
            const res = await window.api.cofreSenhas.listar({ busca })
            if (!res.ok) throw new Error(res.erro)
            return { registros: res.data, total: res.data.length }
          }}
          onSelecionar={selecionarDaConsulta}
          onFechar={() => setShowConsulta(false)}
          renderCelula={(r, c) => String(r[c.nome_campo] ?? '')}
        />
      )}

      {confirmExcluir && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}>
          <div style={{ width: 380, background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px 10px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)' }}>Excluir acesso</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 6 }}>Esta ação não pode ser desfeita.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '14px 22px 20px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmExcluir(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmarExclusao}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {showHistorico && form.id && (
        <HistoricoSenhaModal credencialId={form.id} onFechar={() => setShowHistorico(false)} />
      )}

      {showLogAcesso && form.id && (
        <LogAcessoModal credencialId={form.id} onFechar={() => setShowLogAcesso(false)} />
      )}

      {reusoDetectado && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}>
          <div style={{ width: 420, background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px 10px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertTriangle size={18} color="var(--or)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)' }}>Senha já utilizada</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 6, lineHeight: 1.6 }}>
                  Esta senha também está cadastrada em: {reusoDetectado.map(r => r.sistema).join(', ')}.
                  Usar a mesma senha em vários sistemas é um risco de segurança.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '14px 22px 20px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setReusoDetectado(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={async () => { setReusoDetectado(null); await gravarDeFato() }}>Salvar mesmo assim</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Input com botão de copiar acoplado — usado em campos que o usuário
// frequentemente precisa colar em outro lugar (URL, usuário/e-mail).
function CampoComCopiar({ value, onChange, disabled, placeholder }) {
  const [copiado, setCopiado] = useState(false)
  async function copiar() {
    if (!value) return
    await window.api.clipboard.write(value)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <input className="form-input" value={value} disabled={disabled}
        onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1 }} />
      <button type="button" className="btn btn-ghost" disabled={!value}
        onClick={copiar} title="Copiar" style={{ flexShrink: 0, padding: '0 9px', height: 38, color: copiado ? 'var(--green)' : undefined }}>
        {copiado ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  )
}
