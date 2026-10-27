import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Search, X, Info, SlidersHorizontal, CalendarDays, MessageCircle, Mail,
  Settings, ChevronRight, CheckCircle2, CircleOff,
} from 'lucide-react'
import { notificar } from '../components/Notificacao'

// Tela de Parametros: catalogo de flags de comportamento do sistema
// (kr_parametros_001), organizadas em 2 niveis (grupo > categoria/modulo).
// Habilita/desabilita funcoes opcionais (integracao com ERP externo,
// Meet->Agenda, WhatsApp...) sem virar comportamento padrao pra todo cliente.
//
// Nao usa TelaCadastroPadrao: aquele componente e pra grid de registros com
// Incluir/Alterar/Excluir. Aqui e navegacao (sidebar de grupo/categoria,
// igual ao padrao de ouro do menu lateral - CLAUDE.md §3, classes .ni/
// .sg-label ja existentes em Sidebar.css) + lista + editor lateral.
const ICONE_POR_CATEGORIA = {
  Agenda: CalendarDays,
  WhatsApp: MessageCircle,
  'E-mail': Mail,
  Sistema: Settings,
}
function iconeCategoria(categoria) {
  return ICONE_POR_CATEGORIA[categoria] || SlidersHorizontal
}

export default function Parametros() {
  const [parametros, setParametros] = useState([])
  const [grupos, setGrupos] = useState([]) // [{ grupo, categorias:[...] }]
  const [categoriaAtiva, setCategoriaAtiva] = useState(null)
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [selecionado, setSelecionado] = useState(null) // parametro aberto no editor

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const [resParams, resGrupos] = await Promise.all([
        window.api.parametros.listar({}),
        window.api.parametros.listarCategorias(),
      ])
      if (resParams.ok) setParametros(resParams.data || [])
      if (resGrupos.ok) {
        const lista = resGrupos.data || []
        setGrupos(lista)
        const todasCategorias = lista.flatMap((g) => g.categorias)
        setCategoriaAtiva((prev) => (prev && todasCategorias.includes(prev)) ? prev : (todasCategorias[0] || null))
      }
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  // Busca ativa ignora a categoria selecionada e varre tudo - achar um
  // parametro por nome é mais importante que respeitar a navegacao.
  const buscando = busca.trim().length > 0
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return parametros.filter((p) => {
      if (!buscando && categoriaAtiva && p.categoria !== categoriaAtiva) return false
      if (!termo) return true
      return p.rotulo.toLowerCase().includes(termo)
        || (p.descricao || '').toLowerCase().includes(termo)
        || p.chave.toLowerCase().includes(termo)
    })
  }, [parametros, categoriaAtiva, busca, buscando])

  const qtdAtivosPorCategoria = useMemo(() => {
    const m = {}
    for (const p of parametros) {
      if (p.tipo === 'booleano' && p.valor_tipado) m[p.categoria] = (m[p.categoria] || 0) + 1
    }
    return m
  }, [parametros])

  async function salvar(id, novoValor) {
    const res = await window.api.parametros.atualizar(id, { valor: novoValor })
    if (!res.ok) {
      notificar.erro(res.erro || 'Não foi possível salvar o parâmetro.')
      return
    }
    setParametros((prev) => prev.map((p) => (p.id === id ? res.data : p)))
    setSelecionado(res.data)
    // avisa outras telas (ex: Agenda consultando useParametro) pra rebuscar.
    window.dispatchEvent(new CustomEvent('krontech:parametros-changed'))
  }

  return (
    <div className="page-with-footer">
      <div className="page-content" style={{ display: 'flex', gap: 16, padding: 0 }}>
        {/* Navegação: grupo > categoria, mesmo padrão visual do menu lateral */}
        <div style={{ flex: '0 0 220px', borderRight: '1px solid var(--bd)', overflowY: 'auto', padding: '14px 0' }}>
          {grupos.map(({ grupo, categorias }) => (
            <div key={grupo} className="sb-group" style={{ marginBottom: 10 }}>
              <div style={{ padding: '4px 14px 6px' }}>
                <span className="sg-label">{grupo}</span>
              </div>
              {categorias.map((cat) => {
                const Icon = iconeCategoria(cat)
                const ativo = !buscando && categoriaAtiva === cat
                const qtd = qtdAtivosPorCategoria[cat] || 0
                return (
                  <button
                    key={cat}
                    className={`ni${ativo ? ' active' : ''}`}
                    onClick={() => { setCategoriaAtiva(cat); setBusca('') }}
                  >
                    <span className="ni-icon"><Icon size={16} strokeWidth={1.75} /></span>
                    <span className="ni-label">{cat}</span>
                    {qtd > 0 && <span className="ni-badge">{qtd}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Lista + editor */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 18px 14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', flex: '0 1 360px' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
              <input
                className="form-input form-input-sm"
                style={{ paddingLeft: 30 }}
                placeholder="Buscar em todos os parâmetros..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            {!buscando && (
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                {filtrados.length} parâmetro{filtrados.length !== 1 ? 's' : ''} em <strong style={{ color: 'var(--t2)' }}>{categoriaAtiva}</strong>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
            {/* Lista */}
            <div style={{ flex: '1 1 auto', minWidth: 0, border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', overflowY: 'auto', boxShadow: 'var(--sh-xs)' }}>
              {carregando ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>Carregando...</div>
              ) : filtrados.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>Nenhum parâmetro encontrado.</div>
              ) : (
                filtrados.map((p) => {
                  const ehSelecionado = selecionado?.id === p.id
                  const Icon = iconeCategoria(p.categoria)
                  const ligado = p.tipo === 'booleano' && p.valor_tipado
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelecionado(p)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer',
                        borderBottom: '1px solid var(--bd)',
                        background: ehSelecionado ? 'var(--or3)' : 'transparent',
                        transition: 'background .14s',
                      }}
                      onMouseEnter={(e) => { if (!ehSelecionado) e.currentTarget.style.background = 'var(--s2)' }}
                      onMouseLeave={(e) => { if (!ehSelecionado) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        width: 32, height: 32, borderRadius: 8,
                        background: ligado ? 'rgba(74,222,128,.12)' : 'var(--s3)',
                        color: ligado ? 'var(--green)' : 'var(--t3)',
                      }}>
                        <Icon size={15} strokeWidth={1.75} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, color: 'var(--t1)', fontWeight: 500 }}>{p.rotulo}</div>
                        {buscando && <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 1 }}>{p.grupo} · {p.categoria}</div>}
                      </div>
                      {p.tipo === 'booleano' ? (
                        <span className={`badge ${p.valor_tipado ? 'badge-green' : 'badge-orange'}`}>
                          {p.valor_tipado ? 'Ativado' : 'Desativado'}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11.5, color: 'var(--t2)', fontFamily: 'monospace' }}>{p.valor_tipado ?? '-'}</span>
                      )}
                      <ChevronRight size={14} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                    </div>
                  )
                })
              )}
            </div>

            {/* Editor lateral */}
            {selecionado && (
              <EditorParametro
                key={selecionado.id}
                parametro={selecionado}
                onFechar={() => setSelecionado(null)}
                onSalvar={salvar}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EditorParametro({ parametro, onFechar, onSalvar }) {
  const [valor, setValor] = useState(parametro.valor_tipado)
  const [salvando, setSalvando] = useState(false)
  const Icon = iconeCategoria(parametro.categoria)
  const sujo = valor !== parametro.valor_tipado

  async function handleSalvar() {
    setSalvando(true)
    try {
      const valorCru = parametro.tipo === 'booleano' ? (valor ? 'S' : 'N') : (valor == null ? '' : String(valor))
      await onSalvar(parametro.id, valorCru)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={{ flex: '0 0 360px', border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: 'var(--sh-xs)' }}>
      {/* Cabeçalho com ícone do módulo, igual ao padrão de identidade do menu lateral */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '16px 16px 14px', borderBottom: '1px solid var(--bd)' }}>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          width: 34, height: 34, borderRadius: '30%', background: 'var(--s3)', color: 'var(--or)',
        }}>
          <Icon size={16} strokeWidth={1.75} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1 }}>
            {parametro.grupo} · {parametro.categoria}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginTop: 2, lineHeight: 1.3 }}>{parametro.rotulo}</div>
        </div>
        <button type="button" onClick={onFechar} style={{ display: 'flex', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--t3)', padding: 2, flexShrink: 0 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        {parametro.descricao && (
          <div style={{ display: 'flex', gap: 8, fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.55, background: 'var(--s2)', borderRadius: 8, padding: 11 }}>
            <Info size={13} style={{ flexShrink: 0, marginTop: 1, color: 'var(--t3)' }} />
            <span>{parametro.descricao}</span>
          </div>
        )}

        <div>
          <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Valor</label>
          {parametro.tipo === 'booleano' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <OpcaoBooleana rotulo="Ativado" ativo={valor === true} Icon={CheckCircle2} cor="var(--green)" onClick={() => setValor(true)} />
              <OpcaoBooleana rotulo="Desativado" ativo={valor !== true} Icon={CircleOff} cor="var(--t3)" onClick={() => setValor(false)} />
            </div>
          )}
          {parametro.tipo === 'texto' && (
            <input className="form-input form-input-sm" value={valor || ''} onChange={(e) => setValor(e.target.value)} />
          )}
          {parametro.tipo === 'numero' && (
            <input type="number" className="form-input form-input-sm" value={valor ?? ''} onChange={(e) => setValor(e.target.value)} />
          )}
          {parametro.tipo === 'exato' && (
            <select className="form-select form-input-sm" value={valor || ''} onChange={(e) => setValor(e.target.value)}>
              {(parametro.opcoes || []).map((o) => (
                <option key={o.valor} value={o.valor}>{o.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div style={{ padding: 16, borderTop: '1px solid var(--bd)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" className="btn btn-primary" onClick={handleSalvar} disabled={salvando || !sujo}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        {sujo && !salvando && <span style={{ fontSize: 11, color: 'var(--t3)' }}>Alteração não salva</span>}
      </div>
    </div>
  )
}

function OpcaoBooleana({ rotulo, ativo, Icon, cor, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        padding: '12px 10px', borderRadius: 10, cursor: 'pointer',
        border: `1px solid ${ativo ? 'var(--or)' : 'var(--bd)'}`,
        background: ativo ? 'var(--or3)' : 'var(--s1)',
        transition: 'border-color .14s, background .14s',
      }}
    >
      <Icon size={18} strokeWidth={1.75} color={ativo ? 'var(--or)' : cor} />
      <span style={{ fontSize: 11.5, fontWeight: ativo ? 600 : 500, color: ativo ? 'var(--t1)' : 'var(--t2)' }}>{rotulo}</span>
    </button>
  )
}
