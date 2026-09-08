import { Plus, Trash2 } from 'lucide-react'

// Grid editavel de linhas-filhas (agencias de um banco, parcelas de uma
// condicao...). Cada linha e um objeto; colunas descrevem os inputs.
//
// props:
//   itens     array de objetos
//   onChange  (novoArray) => void
//   isRO      bloqueia edicao
//   colunas   [{ chave, label, tipo?, largura?, opcoes?, align?, render? }]
//             tipo: 'texto'(default) | 'numero' | 'moeda' | 'select' | 'check'
//   novoItem  () => objeto  (default: {} com chaves das colunas)
//   rotuloAdd string
//   min       nao deixa remover abaixo desse total (default 0)
export default function GridFilho({
  itens = [], onChange, isRO, colunas, novoItem, rotuloAdd = 'Adicionar linha', min = 0,
}) {
  const lista = Array.isArray(itens) ? itens : []

  const setLinha = (i, patch) => onChange(lista.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  const addLinha = () => onChange([...lista, novoItem ? novoItem() : Object.fromEntries(colunas.map((c) => [c.chave, '']))])
  const removeLinha = (i) => onChange(lista.filter((_, j) => j !== i))

  const cellStyle = {
    width: '100%', boxSizing: 'border-box', border: isRO ? '1px solid transparent' : '1px solid var(--bd)',
    background: 'transparent', fontSize: 12, padding: '4px 8px', borderRadius: 6, color: 'var(--t1)', height: 30,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <span className="form-label" style={{ flex: 1, marginBottom: 0 }} />
        {!isRO && (
          <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }} onClick={addLinha}>
            <Plus size={13} /> {rotuloAdd}
          </button>
        )}
      </div>
      <div style={{ border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden', background: 'var(--s1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--s1)' }}>
              {colunas.map((c) => (
                <th key={c.chave} style={{ padding: '7px 10px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)', textAlign: c.align || 'left', width: c.largura }}>{c.label}</th>
              ))}
              {!isRO && <th style={{ width: 40, borderBottom: '1px solid var(--bd)' }} />}
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr><td colSpan={colunas.length + (isRO ? 0 : 1)} style={{ padding: 14, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>Nenhum registro.</td></tr>
            )}
            {lista.map((linha, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--bd)' }}>
                {colunas.map((c) => (
                  <td key={c.chave} style={{ padding: '5px 6px', textAlign: c.align || 'left' }}>
                    {c.render
                      ? c.render(linha, (patch) => setLinha(i, patch))
                      : c.tipo === 'check' ? (
                        <input type="checkbox" checked={!!linha[c.chave]} disabled={isRO}
                          onChange={(e) => setLinha(i, { [c.chave]: e.target.checked })} />
                      ) : c.tipo === 'select' ? (
                        <select style={cellStyle} value={linha[c.chave] ?? ''} disabled={isRO}
                          onChange={(e) => setLinha(i, { [c.chave]: e.target.value })}>
                          <option value="">-</option>
                          {(c.opcoes || []).map((o) => <option key={o.valor ?? o} value={o.valor ?? o}>{o.label ?? o}</option>)}
                        </select>
                      ) : (
                        <input
                          type={c.tipo === 'numero' || c.tipo === 'moeda' ? 'number' : 'text'}
                          step={c.tipo === 'moeda' ? '0.01' : c.tipo === 'numero' ? '1' : undefined}
                          style={{ ...cellStyle, textAlign: c.align === 'right' || c.tipo === 'numero' || c.tipo === 'moeda' ? 'right' : 'left' }}
                          value={linha[c.chave] ?? ''} disabled={isRO}
                          maxLength={c.maxLength}
                          onChange={(e) => setLinha(i, { [c.chave]: c.upper ? e.target.value.toUpperCase() : e.target.value })}
                          placeholder={c.placeholder} />
                      )}
                  </td>
                ))}
                {!isRO && (
                  <td style={{ textAlign: 'center' }}>
                    <button title="Remover" disabled={lista.length <= min}
                      style={{ background: 'transparent', border: 'none', cursor: lista.length <= min ? 'default' : 'pointer', color: lista.length <= min ? 'var(--t3)' : 'var(--red)', padding: 4 }}
                      onClick={() => removeLinha(i)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
