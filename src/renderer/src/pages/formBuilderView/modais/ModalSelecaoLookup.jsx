import { X, ChevronRight } from 'lucide-react'

export default function ModalSelecaoLookup({
  campo, todos, busca, setBusca, loading, selId, setSelId,
  onSelecionarCampo, onConfirmar, onFechar,
}) {
  const filtrados = todos.filter(o => !busca.trim() || o.label.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onFechar() }}>
      <div style={{ width: 520, maxWidth: '92vw', maxHeight: '80vh', background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', background: 'var(--s2)', borderBottom: '1px solid var(--bd)' }}>
          <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--t1)' }}>Selecionar · {campo?.label}</span>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 2 }}><X size={15} /></button>
        </div>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--bd)' }}>
          <input className="form-input" value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Filtrar..." autoFocus style={{ height: 32, width: '100%' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--t3)', fontSize: 12 }}>Carregando...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {filtrados.map((o, ri) => {
                  const isSel = selId === o.id
                  return (
                    <tr key={o.id}
                      onClick={() => setSelId(o.id)}
                      onDoubleClick={() => { setSelId(o.id); onSelecionarCampo(campo.nome_campo, o.id); onFechar() }}
                      style={{ cursor: 'pointer', background: ri % 2 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--s3)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = ri % 2 ? 'rgba(0,0,0,.015)' : 'transparent' }}>
                      <td style={{ padding: '7px 4px', width: 20, textAlign: 'center', color: 'var(--or)' }}>
                        {isSel ? <ChevronRight size={12} strokeWidth={2.5} /> : null}
                      </td>
                      <td style={{ padding: '7px 10px', fontSize: 12, color: 'var(--t1)' }}>{o.label}</td>
                    </tr>
                  )
                })}
                {filtrados.length === 0 && (
                  <tr><td colSpan={2} style={{ padding: 32, textAlign: 'center', color: 'var(--t3)', fontSize: 11, fontStyle: 'italic' }}>Nenhum resultado</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid var(--bd)', background: 'var(--s2)' }}>
          <button className="btn btn-primary" onClick={onConfirmar} disabled={!selId}>✓ Confirmar</button>
          <button className="btn btn-ghost"   onClick={onFechar}>✕ Fechar</button>
          {selId && <button className="btn btn-ghost" onClick={() => { onSelecionarCampo(campo?.nome_campo, null); onFechar() }}>Limpar seleção</button>}
        </div>
      </div>
    </div>
  )
}
