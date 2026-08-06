import { Plus, Trash2 } from 'lucide-react'

// Renderiza uma grade editável inline (sub-tabela) dentro do formulário pai.
// Estado fica só no cliente (form[campo.nome_campo] = array de linhas) até o
// formulário inteiro ser salvo — o backend recebe o array completo e faz
// apagar-e-reinserir (ver subGridService.js).
export function InputSubGrid({ campo, val, isRO, saving, setField }) {
  const cfg = campo.opcoes || {}
  const colunas = cfg.subGridCampos || []
  const linhas = Array.isArray(val) ? val : []

  function addLinha() {
    const nova = {}
    colunas.forEach(c => { nova[c.nomeCampo] = c.tipo === 'booleano' ? false : '' })
    setField(campo.nome_campo, [...linhas, nova])
  }

  function updateLinha(i, nomeCampo, valor) {
    setField(campo.nome_campo, linhas.map((l, li) => li === i ? { ...l, [nomeCampo]: valor } : l))
  }

  function removeLinha(i) {
    setField(campo.nome_campo, linhas.filter((_, li) => li !== i))
  }

  function inputTipo(tipo) {
    if (tipo === 'moeda' || tipo === 'numero' || tipo === 'percentual') return 'number'
    if (tipo === 'data') return 'date'
    if (tipo === 'data_hora') return 'datetime-local'
    if (tipo === 'hora') return 'time'
    return 'text'
  }

  if (!colunas.length) {
    return <div style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>Grade sem colunas configuradas.</div>
  }

  return (
    <div style={{ border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden', background: 'var(--s1)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {colunas.map(c => (
                <th key={c.nomeCampo} style={{ padding: '6px 10px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, textAlign: 'left', borderBottom: '1px solid var(--bd)', background: 'var(--s2)', whiteSpace: 'nowrap' }}>
                  {c.label}{c.obrigatorio ? ' *' : ''}
                </th>
              ))}
              {!isRO && <th style={{ width: 36, borderBottom: '1px solid var(--bd)', background: 'var(--s2)' }} />}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, i) => (
              <tr key={i}>
                {colunas.map(c => (
                  <td key={c.nomeCampo} style={{ padding: '4px 6px', borderBottom: '1px solid var(--bd)' }}>
                    {c.tipo === 'booleano' ? (
                      <input type="checkbox" checked={!!linha[c.nomeCampo]} disabled={isRO || saving}
                        onChange={e => updateLinha(i, c.nomeCampo, e.target.checked)}
                        style={{ accentColor: 'var(--or)' }} />
                    ) : (
                      <input className="form-input" style={{ height: 28, fontSize: 11, minWidth: 100 }}
                        type={inputTipo(c.tipo)}
                        value={linha[c.nomeCampo] ?? ''}
                        disabled={isRO || saving}
                        onChange={e => updateLinha(i, c.nomeCampo, e.target.value)} />
                    )}
                  </td>
                ))}
                {!isRO && (
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid var(--bd)', textAlign: 'center' }}>
                    <button type="button" className="btn btn-danger" style={{ height: 24, width: 24, padding: 0 }}
                      onClick={() => removeLinha(i)} disabled={saving}>
                      <Trash2 size={11} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {!linhas.length && (
              <tr><td colSpan={colunas.length + 1} style={{ padding: '16px', textAlign: 'center', fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>Nenhuma linha adicionada</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {!isRO && (
        <div style={{ padding: '6px 10px', borderTop: '1px solid var(--bd)' }}>
          <button type="button" className="btn btn-ghost" style={{ height: 28, fontSize: 11, padding: '0 10px' }}
            onClick={addLinha} disabled={saving}>
            <Plus size={12} /> Adicionar linha
          </button>
        </div>
      )}
    </div>
  )
}
