import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Trash2, SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw, Search,
  Star, Lock, ExternalLink, Copy, Check, Calendar, AlertTriangle, FolderOpen,
} from 'lucide-react'
import '../App.css'
import FormToolbar from '../components/FormToolbar'
import PesquisaPadraoModal from '../components/PesquisaPadraoModal.jsx'
import PasswordVaultField from '../components/PasswordVaultField.jsx'
import InputData from '../components/InputData'
import { notificar } from '../components/Notificacao'
import { AMBIENTES, NIVEL_META, EMPTY_FORM, fmtDataBR, estaVencida } from './cofreSenhas/utils'

const FILTROS_VAZIOS = { busca: '', categoria: '', ambiente: '', apenasFavoritos: false, apenasVencidas: false }
const CAMPOS_BUSCA = [
  { nome_campo: 'codigo',   label: 'Código'  },
  { nome_campo: 'sistema',  label: 'Sistema' },
  { nome_campo: 'usuario',  label: 'Usuário' },
]

export default function CofreSenhas({ newTrigger }) {
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

  const [filtrosAbertos, setFiltrosAbertos] = useState(true)
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS)
  const [fResultados, setFResultados] = useState(null)
  const [fLoading, setFLoading] = useState(false)
  const [copiadoId, setCopiadoId] = useState(null)

  const carregarAcesso = useCallback(async (f = filtros) => {
    setFLoading(true)
    try {
      const params = {}
      if (f.busca.trim())     params.busca = f.busca.trim()
      if (f.categoria)        params.categoria = f.categoria
      if (f.ambiente)         params.ambiente = f.ambiente
      if (f.apenasFavoritos)  params.apenasFavoritos = true
      if (f.apenasVencidas)   params.apenasVencidas = true
      const res = await window.api.cofreSenhas.listar(params)
      setFResultados(res.ok ? res.data || [] : [])
    } catch { setFResultados([]) }
    finally { setFLoading(false) }
  }, [filtros])

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
    setFiltros(FILTROS_VAZIOS)
  }

  const qtdFiltrosAtivos = [filtros.busca.trim(), filtros.categoria, filtros.ambiente, filtros.apenasFavoritos, filtros.apenasVencidas].filter(Boolean).length

  async function carregarForm(reg) {
    const res = await window.api.cofreSenhas.obter(reg.id)
    if (!res.ok) { setErro(res.erro); return }
    const d = res.data
    setForm({
      id: d.id, codigo: d.codigo || '', sistema: d.sistema || '', categoria: d.categoria || '',
      ambiente: d.ambiente || 'producao', url: d.url || '', usuario: d.usuario || '',
      senha: d.senha || '', nivel_seguranca: d.nivel_seguranca || '',
      dt_validade: d.dt_validade ? String(d.dt_validade).slice(0, 10) : '',
      observacoes: d.observacoes || '', tags: d.tags || '', favorito: !!d.favorito,
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

  async function handleGravar() {
    if (!form.sistema.trim()) { setErro('Informe o sistema.'); return }
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

  async function handleCopiarSenhaLinha(reg) {
    const res = await window.api.cofreSenhas.obter(reg.id)
    if (!res.ok || !res.data.senha) return
    await window.api.clipboard.write(res.data.senha)
    setCopiadoId(reg.id)
    setTimeout(() => setCopiadoId(null), 1500)
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Busca geral</label>
                      <input className="form-input form-input-sm"
                        value={filtros.busca} onChange={e => setFiltros(f => ({ ...f, busca: e.target.value }))}
                        placeholder="sistema, usuário, tag..." />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Categoria</label>
                      <select className="form-select form-input-sm"
                        value={filtros.categoria} onChange={e => setFiltros(f => ({ ...f, categoria: e.target.value }))}>
                        <option value="">Todas</option>
                        {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Ambiente</label>
                      <select className="form-select form-input-sm"
                        value={filtros.ambiente} onChange={e => setFiltros(f => ({ ...f, ambiente: e.target.value }))}>
                        <option value="">Todos</option>
                        {AMBIENTES.map(a => <option key={a.valor} value={a.valor}>{a.label}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, paddingBottom: 6 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11.5, color: 'var(--t2)' }}>
                        <input type="checkbox" checked={filtros.apenasFavoritos}
                          onChange={e => setFiltros(f => ({ ...f, apenasFavoritos: e.target.checked }))} />
                        Favoritos
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11.5, color: 'var(--t2)' }}>
                        <input type="checkbox" checked={filtros.apenasVencidas}
                          onChange={e => setFiltros(f => ({ ...f, apenasVencidas: e.target.checked }))} />
                        Vencidas
                      </label>
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
                          <code style={{ fontFamily: 'monospace', fontSize: 10, background: 'var(--s3)', padding: '1px 6px', borderRadius: 4, color: 'var(--t2)' }}>{AMBIENTES.find(a => a.valor === r.ambiente)?.label || r.ambiente}</code>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10 }}>
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
              <div className="form-group">
                <label className="form-label">Ambiente</label>
                <select className="form-select" style={{ width: 160 }} value={form.ambiente} disabled={isRO}
                  onChange={e => setForm(f => ({ ...f, ambiente: e.target.value }))}>
                  {AMBIENTES.map(a => <option key={a.valor} value={a.valor}>{a.label}</option>)}
                </select>
              </div>
            </div>

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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Usuário / E-mail</label>
                <CampoComCopiar value={form.usuario} disabled={isRO}
                  onChange={v => setForm(f => ({ ...f, usuario: v }))} placeholder="usuario@empresa.com.br" />
              </div>
              <div className="form-group">
                <label className="form-label">Válido até</label>
                <InputData value={form.dt_validade} disabled={isRO}
                  onChange={v => setForm(f => ({ ...f, dt_validade: v }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <PasswordVaultField
                value={form.senha}
                onChange={v => setForm(f => ({ ...f, senha: v }))}
                disabled={isRO}
              />
            </div>

            <datalist id="cofre-categorias">{categorias.map(c => <option key={c} value={c} />)}</datalist>

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
