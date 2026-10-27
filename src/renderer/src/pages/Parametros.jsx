import { useEffect, useMemo, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, Info, CheckCircle2, CircleOff } from 'lucide-react'
import { notificar } from '../components/Notificacao'

// Tela de Parametros: catalogo de flags de comportamento do sistema
// (kr_parametros_001), organizadas em 2 niveis (grupo > categoria/modulo).
// Habilita/desabilita funcoes opcionais (integracao com ERP externo,
// Meet->Agenda, WhatsApp...) sem virar comportamento padrao pra todo
// cliente.
//
// Layout pedido pelo usuario, bem proximo da referencia dele (ERP legado):
// abas HORIZONTAIS por categoria no topo (nao sidebar), lista densa so com
// codigo/descricao/valor (sem card/icone), duplo-clique abre um EDITOR EM
// MODAL (nao painel lateral) - mesmo padrao de modal ja usado no sistema
// (ver components/PesquisaPadraoModal.jsx: createPortal pro body, overlay
// com blur).
//
// Nao usa TelaCadastroPadrao: aquele componente e pra grid de registros com
// Incluir/Alterar/Excluir; aqui e consulta + edicao pontual por item.
export default function Parametros() {
  const [parametros, setParametros] = useState([])
  const [grupos, setGrupos] = useState([]) // [{ grupo, categorias:[...] }]
  const [categoriaAtiva, setCategoriaAtiva] = useState(null)
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(null) // parametro aberto no modal

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

  async function salvar(id, novoValor) {
    const res = await window.api.parametros.atualizar(id, { valor: novoValor })
    if (!res.ok) {
      notificar.erro(res.erro || 'Não foi possível salvar o parâmetro.')
      return
    }
    setParametros((prev) => prev.map((p) => (p.id === id ? res.data : p)))
    setEditando(null)
    window.dispatchEvent(new CustomEvent('krontech:parametros-changed'))
  }

  const todasCategorias = grupos.flatMap((g) => g.categorias)

  return (
    <div className="page-with-footer">
      {/* Abas horizontais por categoria, uma linha so (sem agrupar
          visualmente por "grupo" - grupo fica so na trilha do editor).
          Rola na horizontal se nao couber (igual ao ERP de referencia),
          nunca quebra linha - .page-tabs tem altura fixa. */}
      <div className="page-tabs" style={{ overflowX: 'auto', overflowY: 'hidden' }}>
        {todasCategorias.map((cat) => (
          <button
            key={cat}
            className={`page-tab${!buscando && categoriaAtiva === cat ? ' active' : ''}`}
            onClick={() => { setCategoriaAtiva(cat); setBusca('') }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flex: '0 1 380px' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
            <input
              className="form-input form-input-sm"
              style={{ paddingLeft: 30 }}
              placeholder="Buscar em todos os parâmetros..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <span style={{ fontSize: 11, color: 'var(--t3)' }}>
            {filtrados.length} parâmetro{filtrados.length !== 1 ? 's' : ''}
            {!buscando && categoriaAtiva ? <> em <strong style={{ color: 'var(--t2)' }}>{categoriaAtiva}</strong></> : null}
          </span>
        </div>

        {/* Grid denso: Código | Descrição | Valor — igual a referencia.
            Duplo-clique (ou clique simples, mais acessivel) abre o editor. */}
        <div style={{ flex: 1, minHeight: 0, border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', overflowY: 'auto' }}>
          {carregando ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>Nenhum parâmetro encontrado.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={thS}>Código</th>
                  <th style={thS}>Descrição</th>
                  {buscando && <th style={thS}>Categoria</th>}
                  <th style={{ ...thS, textAlign: 'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p, i) => (
                  <tr
                    key={p.id}
                    onDoubleClick={() => setEditando(p)}
                    onClick={() => setEditando(p)}
                    style={{ cursor: 'pointer', background: i % 2 !== 0 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 !== 0 ? 'rgba(0,0,0,.015)' : 'transparent')}
                  >
                    <td style={{ ...tdS, fontFamily: 'monospace', color: 'var(--t3)', width: 70 }}>{String(p.id).padStart(3, '0')}</td>
                    <td style={tdS}>{p.rotulo}</td>
                    {buscando && <td style={{ ...tdS, color: 'var(--t3)', fontSize: 11 }}>{p.grupo} · {p.categoria}</td>}
                    <td style={{ ...tdS, textAlign: 'right', width: 110 }}>
                      {p.tipo === 'booleano' ? (
                        <span className={`badge ${p.valor_tipado ? 'badge-green' : 'badge-orange'}`}>
                          {p.valor_tipado ? 'S' : 'N'}
                        </span>
                      ) : (
                        <span style={{ fontFamily: 'monospace', color: 'var(--t2)' }}>{p.valor_tipado ?? '-'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editando && (
        <EditorParametroModal
          parametro={editando}
          onFechar={() => setEditando(null)}
          onSalvar={salvar}
        />
      )}
    </div>
  )
}

const thS = { padding: '8px 14px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1.2, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)', background: 'var(--s1)', textAlign: 'left' }
const tdS = { padding: '8px 14px', fontSize: 12, color: 'var(--t1)', borderBottom: '1px solid var(--bd)' }

// Editor em modal, por cima de tudo — mesmo padrao do PesquisaPadraoModal
// (createPortal pro body, overlay escuro com blur, Esc fecha).
function EditorParametroModal({ parametro, onFechar, onSalvar }) {
  const [valor, setValor] = useState(parametro.valor_tipado)
  const [salvando, setSalvando] = useState(false)
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

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }}
      onClick={onFechar}
    >
      <div
        style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14, boxShadow: 'var(--sh-lg)', width: 460, maxWidth: '92vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onFechar() }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '14px 18px', background: 'var(--s2)', borderBottom: '1px solid var(--bd)' }}>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Código {String(parametro.id).padStart(3, '0')} · {parametro.grupo} · {parametro.categoria}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginTop: 3 }}>{parametro.rotulo}</div>
          </div>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 2, flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                <OpcaoBooleana rotulo="Sim" ativo={valor === true} Icon={CheckCircle2} onClick={() => setValor(true)} />
                <OpcaoBooleana rotulo="Não" ativo={valor !== true} Icon={CircleOff} onClick={() => setValor(false)} />
              </div>
            )}
            {parametro.tipo === 'texto' && (
              <input className="form-input" autoFocus value={valor || ''} onChange={(e) => setValor(e.target.value)} />
            )}
            {parametro.tipo === 'numero' && (
              <input type="number" className="form-input" autoFocus value={valor ?? ''} onChange={(e) => setValor(e.target.value)} />
            )}
            {parametro.tipo === 'exato' && (
              <select className="form-select" value={valor || ''} onChange={(e) => setValor(e.target.value)}>
                {(parametro.opcoes || []).map((o) => (
                  <option key={o.valor} value={o.valor}>{o.label}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderTop: '1px solid var(--bd)', background: 'var(--s3)' }}>
          <button className="btn btn-primary" onClick={handleSalvar} disabled={salvando || !sujo}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
          <button className="btn btn-ghost" onClick={onFechar}>Fechar</button>
          {sujo && !salvando && <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 'auto' }}>Alteração não salva</span>}
        </div>
      </div>
    </div>,
    document.body
  )
}

function OpcaoBooleana({ rotulo, ativo, Icon, onClick }) {
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
      <Icon size={18} strokeWidth={1.75} color={ativo ? 'var(--or)' : 'var(--t3)'} />
      <span style={{ fontSize: 11.5, fontWeight: ativo ? 600 : 500, color: ativo ? 'var(--t1)' : 'var(--t2)' }}>{rotulo}</span>
    </button>
  )
}
