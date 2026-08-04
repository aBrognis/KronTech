import { useState, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { slugify } from './camposDefaults.js'

export default function OpcoesList({ opcoes, tipo, salvando, onChange }) {
  const [dragging, setDragging] = useState(null) // índice sendo arrastado
  const [overAt,   setOverAt]   = useState(null) // índice sob o cursor
  const listRef = useRef(null)
  const rowH    = 35 // altura estimada de cada linha (gap=5 + height=30)

  function handleMouseDown(e, idx) {
    if (e.button !== 0) return
    e.preventDefault()
    setDragging(idx)
    setOverAt(idx)

    const startY = e.clientY

    function onMouseMove(ev) {
      const delta = ev.clientY - startY
      const newIdx = Math.max(0, Math.min(opcoes.length - 1, idx + Math.round(delta / rowH)))
      setOverAt(newIdx)
    }

    function onMouseUp() {
      setDragging(prev => {
        setOverAt(over => {
          if (prev !== null && over !== null && prev !== over) {
            const novo = [...opcoes]
            const [moved] = novo.splice(prev, 1)
            novo.splice(over, 0, moved)
            onChange(novo)
          }
          return null
        })
        return null
      })
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // Reconstrói a ordem visual durante o drag
  const displayOps = (() => {
    if (dragging === null || overAt === null || dragging === overAt) return opcoes.map((op, i) => ({ op, i }))
    const arr = opcoes.map((op, i) => ({ op, i }))
    const [moved] = arr.splice(dragging, 1)
    arr.splice(overAt, 0, moved)
    return arr
  })()

  return (
    <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {displayOps.map(({ op, i: oi }, displayIdx) => {
        const isDragging = dragging === oi
        return (
          <div key={oi}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 30,
              opacity: isDragging ? 0.4 : 1,
              background: overAt === displayIdx && dragging !== null && dragging !== displayIdx ? 'var(--s3)' : 'transparent',
              borderRadius: 6,
              transition: 'background .1s',
            }}>
            <span
              onMouseDown={e => handleMouseDown(e, oi)}
              style={{ color: 'var(--t3)', fontSize: 14, cursor: 'grab', flexShrink: 0, lineHeight: 1, userSelect: 'none', padding: '0 2px' }}
              title="Arrastar para reordenar">⠿</span>
            {tipo !== 'flags' && (
              <input type="color" value={op.cor || '#888888'}
                onChange={e => { const ops = [...opcoes]; ops[oi] = { ...ops[oi], cor: e.target.value }; onChange(ops) }}
                style={{ width: 26, height: 26, border: 'none', borderRadius: 5, cursor: 'pointer', padding: 2, background: 'none' }} />
            )}
            <input className="form-input" style={{ height: 28, flex: 1, fontSize: 11 }} value={op.label} placeholder="Label"
              onChange={e => {
                const ops = [...opcoes]
                if (tipo === 'flags') ops[oi] = { ...ops[oi], label: e.target.value }
                else ops[oi] = { ...ops[oi], label: e.target.value, valor: slugify(e.target.value) || ops[oi].valor }
                onChange(ops)
              }}
              disabled={salvando} />
            <input className="form-input"
              style={{ height: 28, width: tipo === 'flags' ? 44 : 90, fontSize: tipo === 'flags' ? 13 : 10, fontFamily: 'monospace', textAlign: 'center', fontWeight: tipo === 'flags' ? 700 : 400, textTransform: tipo === 'flags' ? 'uppercase' : 'none' }}
              value={op.valor}
              placeholder={tipo === 'flags' ? 'C' : 'valor'}
              maxLength={tipo === 'flags' ? 1 : undefined}
              onChange={e => {
                const ops = [...opcoes]
                ops[oi] = { ...ops[oi], valor: tipo === 'flags' ? e.target.value.toUpperCase().slice(0, 1) : slugify(e.target.value) }
                onChange(ops)
              }}
              disabled={salvando} />
            <button className="btn btn-danger" style={{ height: 26, width: 26, padding: 0, flexShrink: 0 }}
              onClick={() => onChange(opcoes.filter((_, i) => i !== oi))}
              disabled={salvando}><Trash2 size={10} /></button>
          </div>
        )
      })}
    </div>
  )
}
