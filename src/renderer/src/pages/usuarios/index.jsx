import { useState, useEffect, useCallback, useMemo } from 'react'
import '../../App.css'
import FormToolbar from '../../components/FormToolbar'
import PaginacaoBar from '../../components/PaginacaoBar.jsx'
import MenuContextoGrid from '../../components/MenuContextoGrid'
import PainelFiltrosGrid from '../../components/PainelFiltrosGrid'
import TabelaResultados from '../../components/TabelaResultados'
import { notificar } from '../../components/Notificacao'
import { fmtDataBR, fmtDataHoraBR } from '../../lib/utils/data.js'
import { EMPTY_FORM, paraForm, paraPayload, STATUS, statusMeta, PERFIS, perfilMeta } from './utils'
import AbaDados from './AbaDados'
import AbaAcessoCredenciais from './AbaAcessoCredenciais'

const ABAS_FORM = [
  { id: 'dados', label: 'Dados', Comp: AbaDados },
  { id: 'credenciais', label: 'Acesso', Comp: AbaAcessoCredenciais },
]

// Filtros da aba Acesso — um por coluna consultável de usuario_001.
const COLUNAS_FILTRO = [
  { chave: 'codigo', label: 'Código', tipo: 'texto' },
  { chave: 'nome', label: 'Nome', tipo: 'texto' },
  { chave: 'apelido', label: 'Apelido', tipo: 'texto' },
  { chave: 'documento', label: 'CPF', tipo: 'texto' },
  { chave: 'matricula', label: 'Matrícula', tipo: 'texto' },
  { chave: 'login', label: 'Login', tipo: 'texto' },
  { chave: 'email', label: 'E-mail', tipo: 'texto' },
  { chave: 'telefone', label: 'Telefone', tipo: 'texto' },
  { chave: 'whatsapp', label: 'WhatsApp', tipo: 'texto' },
  { chave: 'setor', label: 'Setor', tipo: 'texto' },
  { chave: 'cargo', label: 'Cargo', tipo: 'texto' },
  { chave: 'centro_custo', label: 'Centro de custo', tipo: 'texto' },
  { chave: 'perfil', label: 'Perfil', tipo: 'exato', opcoes: PERFIS.map((p) => ({ valor: p.valor, label: p.label })) },
  { chave: 'status', label: 'Status', tipo: 'exato', opcoes: STATUS.map((s) => ({ valor: s.valor, label: s.label })) },
  { chave: 'ativo', label: 'Ativo', tipo: 'booleano' },
  { chave: 'dois_fatores', label: '2FA exigido', tipo: 'booleano' },
  { chave: 'forcar_troca_senha', label: 'Trocar senha no login', tipo: 'booleano' },
  { chave: 'favorito', label: 'Favorito', tipo: 'booleano' },
  { chave: 'admissao', label: 'Admissão', tipo: 'data' },
  { chave: 'desligamento', label: 'Desligamento', tipo: 'data' },
  { chave: 'dt_expiracao', label: 'Acesso expira em', tipo: 'data' },
  { chave: 'dt_ultimo_acesso', label: 'Último acesso', tipo: 'data' },
  { chave: 'criado_em', label: 'Criado em', tipo: 'data' },
  { chave: 'alterado_em', label: 'Alterado em', tipo: 'data' },
]

const COLUNAS_RESULTADO = [
  { chave: 'codigo', label: 'Código', largura: 70, sticky: true,
    render: (r) => <span style={{ fontFamily: 'monospace', color: 'var(--or)', fontWeight: 600 }}>{r.codigo || '-'}</span> },
  { chave: 'nome', label: 'Nome', sticky: true },
  { chave: 'login', label: 'Login', largura: 160, padrao: true, render: (r) => r.login || '-' },
  { chave: 'perfil', label: 'Perfil', largura: 120, padrao: true,
    render: (r) => <span className={`badge ${perfilMeta(r.perfil).classe}`}>{perfilMeta(r.perfil).label}</span> },
  { chave: 'email', label: 'E-mail', largura: 220, padrao: true, render: (r) => r.email || '-' },
  { chave: 'setor', label: 'Setor', largura: 140, padrao: true, render: (r) => r.setor || '-' },
  { chave: 'cargo', label: 'Cargo', largura: 140, padrao: true, render: (r) => r.cargo || '-' },
  { chave: 'status', label: 'Status', largura: 110, padrao: true,
    render: (r) => <span className={`badge ${statusMeta(r.status).classe}`}>{statusMeta(r.status).label}</span> },
  { chave: 'dt_ultimo_acesso', label: 'Último acesso', largura: 150, padrao: true,
    render: (r) => (r.dt_ultimo_acesso ? fmtDataHoraBR(r.dt_ultimo_acesso) : 'Nunca') },
  { chave: 'apelido', label: 'Apelido', largura: 120, render: (r) => r.apelido || '-' },
  { chave: 'documento', label: 'CPF', largura: 140, render: (r) => r.documento || '-' },
  { chave: 'matricula', label: 'Matrícula', largura: 110, render: (r) => r.matricula || '-' },
  { chave: 'telefone', label: 'Telefone', largura: 130, render: (r) => r.telefone || '-' },
  { chave: 'whatsapp', label: 'WhatsApp', largura: 130, render: (r) => r.whatsapp || '-' },
  { chave: 'ramal', label: 'Ramal', largura: 80, render: (r) => r.ramal || '-' },
  { chave: 'centro_custo', label: 'Centro de custo', largura: 140, render: (r) => r.centro_custo || '-' },
  { chave: 'gestor_nome', label: 'Gestor', largura: 180, render: (r) => r.gestor_nome || '-' },
  { chave: 'admissao', label: 'Admissão', largura: 120, render: (r) => fmtDataBR(r.admissao) },
  { chave: 'dt_expiracao', label: 'Expira em', largura: 120,
    render: (r) => (r.dt_expiracao ? <span style={{ color: r.acesso_expirado ? 'var(--red)' : undefined }}>{fmtDataBR(r.dt_expiracao)}{r.acesso_expirado ? ' (expirado)' : ''}</span> : '-') },
  { chave: 'tem_senha', label: 'Senha', largura: 80, align: 'center', render: (r) => (r.tem_senha ? 'Sim' : 'Não') },
  { chave: 'dois_fatores', label: '2FA', largura: 70, align: 'center', render: (r) => (r.dois_fatores ? 'Sim' : '-') },
  { chave: 'favorito', label: 'Fav.', largura: 60, align: 'center', render: (r) => (r.favorito ? 'Sim' : '-') },
  { chave: 'criado_em', label: 'Criado em', largura: 140, render: (r) => fmtDataBR(r.criado_em) },
  { chave: 'alterado_em', label: 'Alterado em', largura: 140, render: (r) => fmtDataBR(r.alterado_em) },
]

export default function Usuarios({ newTrigger }) {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(-1)

  const [mode, setMode] = useState('view')
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState(null)
  const [confirmExcluir, setConfirmExcluir] = useState(false)

  // aba: 'acesso' | id de ABAS_FORM (a aba de cadastro E uma das do form).
  const [aba, setAba] = useState('dados')
  const activeTab = aba === 'acesso' ? 'acesso' : 'cadastro'
  const setActiveTab = (t) => setAba(t === 'acesso' ? 'acesso' : 'dados')
  const setAbaForm = (a) => setAba(a)

  // aba Acesso — filtros independentes, so roda ao clicar Buscar.
  const [busca, setBusca] = useState('')
  const [filtrosCol, setFiltrosCol] = useState({})
  const [fResultados, setFResultados] = useState(null)
  const [fLoading, setFLoading] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(25)
  const [selecionados, setSelecionados] = useState(() => new Set())
  const [menuCtx, setMenuCtx] = useState(null)

  const carregarForm = useCallback(async (reg) => {
    const res = await window.api.usuario.obter(reg.id)
    if (!res.ok) { setErro(res.erro); return }
    setForm(paraForm(res.data))
    setErro(null)
    setMode('view')
  }, [])

  const carregarTudo = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.api.usuario.listar({})
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
      const res = await window.api.usuario.listar(params)
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
    if (!form.nome.trim()) { setErro('Informe o nome do usuário.'); return }
    if (!form.login.trim()) { setErro('Informe o login do usuário.'); return }
    if (mode === 'new' && (!form.senha || form.senha.trim().length < 4)) {
      setErro('Defina uma senha com ao menos 4 caracteres.')
      return
    }
    setSaving(true)
    setErro(null)
    try {
      const payload = paraPayload(form)
      const res = mode === 'new'
        ? await window.api.usuario.criar(payload)
        : await window.api.usuario.atualizar({ id: form.id, ...payload })
      if (!res.ok) { setErro(res.erro); return }
      setMode('view')
      const resLista = await window.api.usuario.listar({})
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
    const res = await window.api.usuario.excluir(form.id)
    if (!res.ok) { setErro(res.erro); return }
    const resLista = await window.api.usuario.listar({})
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
    const res = await window.api.usuario.mudarStatusLote({ ids, status })
    if (res.ok) {
      notificar.sucesso(`${res.data.atualizadas} usuário(s) para "${statusMeta(status).label}".`)
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
  const AbaAtiva = ABAS_FORM.find((a) => a.id === (aba === 'acesso' ? 'dados' : aba)) || ABAS_FORM[0]
  const ctx = { form, setForm, isRO, erro }

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
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 8 }}>
                <TabelaResultados
                  colunas={COLUNAS_RESULTADO}
                  registros={registrosPagina}
                  prefKey="usuarios-acesso"
                  selecao={{
                    has: (id) => selecionados.has(id),
                    toggle: toggleSelecionado,
                    todos: todosSelecionados,
                    toggleTodos: toggleSelecionarTodos,
                  }}
                  onLinhaDuploClique={selecionarLinha}
                  onLinhaMenu={abrirMenuLinha}
                  vazio={fLoading ? 'Buscando...' : 'Nenhum usuário encontrado'}
                />
                {selecionados.size > 0 && (
                  <div style={{ padding: '6px 14px', border: '1px solid var(--bd)', borderRadius: 8, background: 'var(--s1)', fontSize: 11.5, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{selecionados.size} selecionado{selecionados.size !== 1 ? 's' : ''}. Botão direito na lista para alterar o status.</span>
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
              titulo={`Alterar status de ${idsAlvoMenu().length} usuário${idsAlvoMenu().length !== 1 ? 's' : ''}`}
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
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)' }}>Excluir usuário</div>
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
