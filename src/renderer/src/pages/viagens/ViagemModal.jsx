import { useMemo } from 'react'
import { X, Plus, Trash2, Paperclip, FileText } from 'lucide-react'
import { diaDaSemana, fmtMoeda, novoItem } from './utils'
import StatusBadge from './StatusBadge'

const MEIOS_TRANSPORTE = ['Carro próprio', 'Carro da empresa', 'Ônibus', 'Avião', 'Outro']

export default function ViagemModal({
  modo, form, setForm, clientes, saving, erro,
  status, onSave, onDelete, onClose, onAlterar, onDesistir,
}) {
  const somenteLeitura = modo === 'view'
  const itens = form.itens || []

  const total = useMemo(() => (
    itens.reduce((soma, it) => soma + (Number(it.qtde) || 0) * (Number(it.valor_unitario) || 0), 0)
  ), [itens])

  function setCampo(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

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

  return (
    <div style={OVERLAY} onClick={onClose}>
      <div style={PAINEL} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--bd)', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', flex: 1 }}>
            {modo === 'new' ? 'Nova Despesa de Viagem' : `Despesa de Viagem #${form.id ?? ''}`}
          </span>
          {status && <StatusBadge status={status} />}
          <button onClick={onClose} style={ICON_BTN}><X size={16} /></button>
        </div>

        {erro && (
          <div style={{ margin: '10px 20px 0', background: 'rgba(248,113,113,.1)', border: '1px solid rgba(239,68,68,.4)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--red)' }}>
            {erro}
          </div>
        )}

        {/* Corpo */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Cabeçalho */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Cliente</label>
              <select className="form-select" value={form.cliente_id} disabled={somenteLeitura}
                onChange={e => {
                  const c = clientes.find(cl => String(cl.id) === e.target.value)
                  setForm(prev => ({ ...prev, cliente_id: e.target.value, cliente_nome: c?.nome || '' }))
                }}>
                <option value="">— sem cliente —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Consultor</label>
              <input className="form-input" value={form.consultor_nome || ''} disabled readOnly />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Período — de *</label>
              <input type="date" className="form-input" value={form.data_inicio} disabled={somenteLeitura}
                onChange={e => setCampo('data_inicio', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Período — até *</label>
              <input type="date" className="form-input" value={form.data_fim} disabled={somenteLeitura}
                onChange={e => setCampo('data_fim', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Meio de Transporte</label>
              <select className="form-select" value={form.meio_transporte} disabled={somenteLeitura}
                onChange={e => setCampo('meio_transporte', e.target.value)}>
                <option value="">— selecione —</option>
                {MEIOS_TRANSPORTE.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Local de Partida</label>
              <input className="form-input" value={form.local_partida} disabled={somenteLeitura}
                onChange={e => setCampo('local_partida', e.target.value)} placeholder="Ex: Gaspar - SC" />
            </div>
            <div className="form-group">
              <label className="form-label">Local de Destino</label>
              <input className="form-input" value={form.local_destino} disabled={somenteLeitura}
                onChange={e => setCampo('local_destino', e.target.value)} placeholder="Ex: Criciúma - SC" />
            </div>
          </div>

          {/* Grid de despesas */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: .5, flex: 1 }}>
                Despesas
              </span>
              {!somenteLeitura && (
                <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }} onClick={addItem}>
                  <Plus size={13} /> Adicionar linha
                </button>
              )}
            </div>

            <div style={{ border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--s2)' }}>
                    <Th>Data</Th><Th>Dia</Th><Th>Descrição</Th><Th>Fornecedor</Th>
                    <Th style={{ width: 60 }}>Qtde</Th><Th style={{ width: 90 }}>Vl. Unit.</Th>
                    <Th style={{ width: 90 }}>Valor</Th><Th style={{ width: 70 }}></Th>
                  </tr>
                </thead>
                <tbody>
                  {itens.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: 16, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>
                      Nenhuma despesa lançada.
                    </td></tr>
                  )}
                  {itens.map(it => {
                    const valor = (Number(it.qtde) || 0) * (Number(it.valor_unitario) || 0)
                    return (
                      <tr key={it._key} style={{ borderTop: '1px solid var(--bd)' }}>
                        <Td><input type="date" style={CELL_INPUT} value={it.data} disabled={somenteLeitura}
                          onChange={e => setItem(it._key, { data: e.target.value })} /></Td>
                        <Td><span style={{ color: 'var(--t3)', fontSize: 11 }}>{diaDaSemana(it.data)}</span></Td>
                        <Td><input style={CELL_INPUT} value={it.descricao} disabled={somenteLeitura}
                          onChange={e => setItem(it._key, { descricao: e.target.value })} placeholder="Ex: Refeição" /></Td>
                        <Td><input style={CELL_INPUT} value={it.fornecedor} disabled={somenteLeitura}
                          onChange={e => setItem(it._key, { fornecedor: e.target.value })} /></Td>
                        <Td><input type="number" step="1" min="0" style={CELL_INPUT} value={it.qtde} disabled={somenteLeitura}
                          onChange={e => setItem(it._key, { qtde: e.target.value })} /></Td>
                        <Td><input type="number" step="0.01" min="0" style={CELL_INPUT} value={it.valor_unitario} disabled={somenteLeitura}
                          onChange={e => setItem(it._key, { valor_unitario: e.target.value })} /></Td>
                        <Td><span style={{ fontWeight: 600 }}>{fmtMoeda(valor)}</span></Td>
                        <Td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            {it.arquivo_path ? (
                              <button title={it.arquivo_nome} style={ICON_BTN_SM} onClick={() => abrirComprovante(it.arquivo_path)}>
                                <FileText size={13} color="var(--or)" />
                              </button>
                            ) : !somenteLeitura && (
                              <button title="Anexar comprovante" style={ICON_BTN_SM} onClick={() => anexarComprovante(it._key)}>
                                <Paperclip size={13} />
                              </button>
                            )}
                            {!somenteLeitura && (
                              <button title="Remover linha" style={ICON_BTN_SM} onClick={() => removerItem(it._key)}>
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

          {/* Rodapé de totais */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, padding: '10px 14px', background: 'var(--s2)', borderRadius: 8 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5 }}>Total das Despesas</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>{fmtMoeda(total)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5 }}>Valor a Reembolsar</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--or)' }}>{fmtMoeda(total)}</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Observações</label>
            <textarea className="form-input" rows={2} value={form.observacoes} disabled={somenteLeitura}
              onChange={e => setCampo('observacoes', e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--bd)', flexShrink: 0 }}>
          {modo === 'view' ? (
            <>
              <button className="btn btn-ghost" style={{ height: 34 }} onClick={onDelete}>Excluir</button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-primary" style={{ height: 34 }} onClick={onAlterar}>Alterar</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" style={{ height: 34 }} onClick={onDesistir} disabled={saving}>Cancelar</button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-primary" style={{ height: 34 }} onClick={onSave} disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Th({ children, style }) {
  return <th style={{ ...THTD, textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: .3, padding: '8px 8px', ...style }}>{children}</th>
}
function Td({ children }) {
  return <td style={{ ...THTD, padding: '5px 8px' }}>{children}</td>
}

const THTD = { verticalAlign: 'middle' }
const CELL_INPUT = {
  width: '100%', border: '1px solid transparent', background: 'transparent',
  fontSize: 12, padding: '4px 5px', borderRadius: 4, color: 'var(--t1)',
}
const OVERLAY = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
}
const PAINEL = {
  width: 'min(920px, 94vw)', maxHeight: '90vh', background: 'var(--s1)',
  border: '1px solid var(--bd)', borderRadius: 12, display: 'flex', flexDirection: 'column',
  boxShadow: '0 20px 60px rgba(0,0,0,.35)',
}
const ICON_BTN = {
  background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--t3)',
  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6,
}
const ICON_BTN_SM = { ...ICON_BTN, width: 24, height: 24 }
