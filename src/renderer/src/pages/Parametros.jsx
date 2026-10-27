import { useEffect, useMemo, useState, useCallback } from 'react'
import { Search, X, Info } from 'lucide-react'
import { notificar } from '../components/Notificacao'

// Tela de Parametros: catalogo de flags de comportamento do sistema
// (kr_parametros_001), organizadas por categoria/aba. Habilita/desabilita
// funcoes opcionais (integracao com ERP externo, Meet->Agenda, WhatsApp...)
// sem virar comportamento padrao pra todo cliente.
//
// Nao usa TelaCadastroPadrao: aquele componente e pra grid de registros com
// Incluir/Alterar/Excluir. Aqui e uma lista so de leitura + edicao pontual
// por item (clique abre o editor lateral), mais perto do padrao
// "lista + editor" do que de um CRUD de cadastro.
export default function Parametros() {
  const [parametros, setParametros] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriaAtiva, setCategoriaAtiva] = useState(null)
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [selecionado, setSelecionado] = useState(null) // parametro aberto no editor

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const [resParams, resCats] = await Promise.all([
        window.api.parametros.listar({}),
        window.api.parametros.listarCategorias(),
      ])
      if (resParams.ok) setParametros(resParams.data || [])
      if (resCats.ok) {
        setCategorias(resCats.data || [])
        setCategoriaAtiva((prev) => prev && resCats.data.includes(prev) ? prev : (resCats.data[0] || null))
      }
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return parametros.filter((p) => {
      if (categoriaAtiva && p.categoria !== categoriaAtiva) return false
      if (!termo) return true
      return p.rotulo.toLowerCase().includes(termo)
        || (p.descricao || '').toLowerCase().includes(termo)
        || p.chave.toLowerCase().includes(termo)
    })
  }, [parametros, categoriaAtiva, busca])

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
      <div className="page-tabs">
        {categorias.map((c) => (
          <button key={c} className={`page-tab${categoriaAtiva === c ? ' active' : ''}`} onClick={() => setCategoriaAtiva(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="form-group" style={{ margin: 0, maxWidth: 360 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
            <input
              className="form-input form-input-sm"
              style={{ paddingLeft: 30 }}
              placeholder="Buscar parâmetro..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
          {/* Lista */}
          <div style={{ flex: '1 1 auto', minWidth: 0, border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', overflowY: 'auto' }}>
            {carregando ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>Carregando...</div>
            ) : filtrados.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>Nenhum parâmetro encontrado.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {filtrados.map((p) => {
                    const ativo = selecionado?.id === p.id
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelecionado(p)}
                        style={{ cursor: 'pointer', background: ativo ? 'var(--or3)' : 'transparent' }}
                      >
                        <td style={{ padding: '9px 12px', fontSize: 11, color: 'var(--t3)', fontFamily: 'monospace', width: 56 }}>
                          {String(p.id).padStart(3, '0')}
                        </td>
                        <td style={{ padding: '9px 12px', fontSize: 12.5, color: 'var(--t1)' }}>
                          {p.rotulo}
                        </td>
                        <td style={{ padding: '9px 12px', width: 90, textAlign: 'right' }}>
                          {p.tipo === 'booleano' && (
                            <span className={`badge ${p.valor_tipado ? 'badge-green' : 'badge-orange'}`}>
                              {p.valor_tipado ? 'Sim' : 'Não'}
                            </span>
                          )}
                          {p.tipo !== 'booleano' && (
                            <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>{p.valor_tipado ?? '-'}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
  )
}

function EditorParametro({ parametro, onFechar, onSalvar }) {
  const [valor, setValor] = useState(parametro.valor_tipado)
  const [salvando, setSalvando] = useState(false)

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
    <div style={{ flex: '0 0 340px', border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{parametro.rotulo}</div>
        <button type="button" onClick={onFechar} style={{ display: 'flex', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--t3)', padding: 0, flexShrink: 0 }}>
          <X size={15} />
        </button>
      </div>

      {parametro.descricao && (
        <div style={{ display: 'flex', gap: 8, fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.5, background: 'var(--s2)', borderRadius: 8, padding: 10 }}>
          <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{parametro.descricao}</span>
        </div>
      )}

      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Valor</label>
        {parametro.tipo === 'booleano' && (
          <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12.5 }}>
              <input type="radio" checked={valor === true} onChange={() => setValor(true)} />
              Sim
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12.5 }}>
              <input type="radio" checked={valor !== true} onChange={() => setValor(false)} />
              Não
            </label>
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

      <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={handleSalvar} disabled={salvando}>
        {salvando ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  )
}
