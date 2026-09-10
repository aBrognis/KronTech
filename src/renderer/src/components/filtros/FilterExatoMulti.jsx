import { useMemo } from 'react'

// Filtro de escolha fixa, multi-seleção: um grupo de checkboxes.
// Substitui o <select> de 1 valor. Usado pelas telas nativas (tipo
// 'exato' + multi) e pelo FormBuilder (select / radio / lookup com
// opcoes ja carregadas).
//
// props:
//   opcoes: [{ valor, label }]
//   value: { op:'in', valores:[...] } | null
//   onChange(filtroOuNull)
//   compacto: se true, limita altura e rola (grupos grandes tipo UF)
export default function FilterExatoMulti({ opcoes = [], value, onChange, compacto = false }) {
  const marcados = useMemo(
    () => new Set((value?.valores || []).map(String)),
    [value]
  )

  function toggle(v) {
    const s = new Set(marcados)
    const k = String(v)
    if (s.has(k)) s.delete(k)
    else s.add(k)
    const arr = [...s]
    onChange(arr.length ? { op: 'in', valores: arr } : null)
  }

  if (!opcoes.length) {
    return <span style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>sem opcoes</span>
  }

  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap', gap: '4px 14px',
        padding: '6px 8px', border: '1px solid var(--bd)', borderRadius: 6,
        background: 'var(--s1)',
        maxHeight: compacto ? 108 : undefined,
        overflowY: compacto ? 'auto' : undefined,
      }}
    >
      {opcoes.map((o) => {
        const k = String(o.valor)
        return (
          <label
            key={k}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              fontSize: 11.5, color: marcados.has(k) ? 'var(--t1)' : 'var(--t2)',
              fontWeight: marcados.has(k) ? 600 : 400, userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <input type="checkbox" checked={marcados.has(k)} onChange={() => toggle(o.valor)} />
            {o.label}
          </label>
        )
      })}
    </div>
  )
}
