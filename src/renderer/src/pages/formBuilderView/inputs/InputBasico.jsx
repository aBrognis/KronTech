import { Star, Calculator } from 'lucide-react'

// Campos simples que só precisam de val/setField/isRO/ops, sem busca externa,
// sem estado próprio de loading/erro.

export function InputFavorito({ form, isRO, saving, setField }) {
  const favVal = form.favorito ?? false
  return (
    <label className="fav-check" style={{ height: '100%', display: 'flex', alignItems: 'center', pointerEvents: isRO ? 'none' : 'auto', cursor: isRO ? 'default' : 'pointer' }}
      onClick={() => !isRO && !saving && setField('favorito', !favVal)}>
      <span style={{
        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
        border: `2px solid ${favVal ? 'var(--or)' : 'var(--bd2)'}`,
        background: favVal ? 'var(--or)' : 'transparent',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .15s',
      }}>
        {favVal && <span style={{ width: 7, height: 5, borderLeft: '2px solid #fff', borderBottom: '2px solid #fff', transform: 'rotate(-45deg) translateY(-1px)', display: 'block' }} />}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
        Marcar como favorito
        <Star size={13} fill={favVal ? 'var(--or)' : 'none'} color={favVal ? 'var(--or)' : 'currentColor'} />
      </span>
    </label>
  )
}

export function InputTimestamps({ isRO, curReg, fmtDate }) {
  const placeholder = isRO ? '' : 'preenchido ao salvar'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, height: '100%', alignContent: 'center' }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" style={{ fontSize: 10, textAlign: 'center' }}>Criado em</label>
        <div className="form-input" style={{ fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 32, background: 'var(--s1)', cursor: 'default', color: isRO ? 'var(--t1)' : 'var(--t3)', fontStyle: isRO ? 'normal' : 'italic', textAlign: 'center' }}>
          {isRO ? fmtDate(curReg?.criado_em) : placeholder}
        </div>
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" style={{ fontSize: 10, textAlign: 'center' }}>Atualizado em</label>
        <div className="form-input" style={{ fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 32, background: 'var(--s1)', cursor: 'default', color: isRO ? 'var(--t1)' : 'var(--t3)', fontStyle: isRO ? 'normal' : 'italic', textAlign: 'center' }}>
          {isRO ? fmtDate(curReg?.alterado_em) : placeholder}
        </div>
      </div>
    </div>
  )
}

export function InputBooleano({ campo, val, isRO, saving, setField }) {
  return (
    <label className="fav-check" style={{ height: '100%', display: 'flex', alignItems: 'center', pointerEvents: isRO ? 'none' : 'auto' }}>
      <input type="checkbox" checked={!!val}
        onChange={e => setField(campo.nome_campo, e.target.checked)}
        disabled={isRO || saving} />
      <span>{campo.label}</span>
    </label>
  )
}

export function InputTextoLongo({ campo, val, isRO, saving, compact, inputStyle, setField }) {
  return (
    <textarea className="form-textarea" value={val}
      onChange={e => setField(campo.nome_campo, e.target.value)}
      disabled={isRO || saving}
      style={{ fontFamily: "'Cascadia Code','Courier New',monospace", fontSize: 12.5, lineHeight: 1.7, height: '100%', minHeight: 'unset', resize: (isRO || compact) ? 'none' : 'vertical', ...inputStyle }} />
  )
}

export function InputSelect({ campo, val, ops, isRO, saving, setField }) {
  return (
    <select className="form-select" value={val}
      onChange={e => setField(campo.nome_campo, e.target.value)}
      disabled={isRO || saving} style={{ height: '100%' }}>
      <option value="">Selecione</option>
      {ops.map((o, i) => <option key={i} value={o.valor}>{o.label}</option>)}
    </select>
  )
}

export function InputRadio({ campo, val, ops, isRO, saving, setField }) {
  const isColuna = (campo.opcoes_layout || 'linha') === 'coluna'
  return (
    <div style={{ display: 'flex', flexDirection: isColuna ? 'column' : 'row', alignItems: isColuna ? 'flex-start' : 'center', gap: isColuna ? 8 : 14, height: '100%', padding: isColuna ? '8px 12px' : '0 12px', background: 'var(--s1)', border: '1.5px solid var(--bd)', borderRadius: 10, boxShadow: 'var(--sh-xs)', flexWrap: isColuna ? 'nowrap' : 'wrap', boxSizing: 'border-box', width: '100%', overflowY: isColuna ? 'auto' : 'visible' }}>
      {ops.map((o, i) => {
        const checked = val != null && o.valor != null && String(val).trim().toLowerCase() === String(o.valor).trim().toLowerCase()
        const cor = o.cor || 'var(--or)'
        return (
          <label key={i} onClick={() => !isRO && !saving && setField(campo.nome_campo, o.valor)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: isRO ? 'default' : 'pointer', fontSize: 11.5, color: checked ? cor : 'var(--t3)', fontWeight: checked ? 600 : 400, userSelect: 'none', transition: 'color .15s' }}>
            <span style={{
              width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${checked ? cor : 'var(--bd2)'}`,
              background: checked ? cor : 'transparent',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}>
              {checked && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'block' }} />}
            </span>
            {o.label}
          </label>
        )
      })}
      {ops.length === 0 && <span style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>Sem opções</span>}
    </div>
  )
}

export function InputCodigoAuto({ val }) {
  return (
    <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: val ? 'var(--or)' : 'var(--t3)', letterSpacing: 2, height: '100%', cursor: 'default' }}>
      {val || 'gerado ao salvar'}
    </div>
  )
}

export function InputFlags({ campo, val, isRO, saving, setField }) {
  const opcoes    = Array.isArray(campo.opcoes) ? campo.opcoes : []
  const current   = String(val || '')
  const multiChar = opcoes.some(o => (o.valor || '').length > 1)
  const activeSet = new Set(
    multiChar
      ? current.split(',').map(s => s.trim()).filter(Boolean)
      : current.split('').filter(Boolean)
  )
  function handleFlagChange(codigo, checked) {
    const set = new Set(activeSet)
    if (checked) set.add(codigo)
    else set.delete(codigo)
    const novo = multiChar
      ? opcoes.map(o => o.valor).filter(v => v && set.has(v)).join(',')
      : opcoes.map(o => o.valor).filter(v => v && set.has(v)).join('')
    setField(campo.nome_campo, novo)
  }
  const isColuna = (campo.opcoes_layout || 'linha') === 'coluna'
  return (
    <div style={{ display: 'flex', flexDirection: isColuna ? 'column' : 'row', flexWrap: isColuna ? 'nowrap' : 'wrap', gap: isColuna ? 6 : '6px 20px', padding: '6px 10px', background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 6 }}>
      {opcoes.map((op, oi) => {
        if (!op.valor) return null
        const checked = activeSet.has(op.valor)
        return (
          <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: isRO ? 'default' : 'pointer', userSelect: 'none', fontSize: 13, color: checked ? 'var(--or)' : 'var(--t1)', fontWeight: checked ? 600 : 400 }}>
            <input
              type="checkbox"
              checked={checked}
              disabled={isRO || saving}
              onChange={e => handleFlagChange(op.valor, e.target.checked)}
              style={{ width: 14, height: 14, accentColor: 'var(--or)', cursor: isRO ? 'default' : 'pointer', flexShrink: 0 }}
            />
            {op.label || op.valor}
          </label>
        )
      })}
    </div>
  )
}

export function InputAvaliacao({ campo, val, isRO, saving, setField }) {
  const max = Number(campo.opcoes?.max || campo.valor_padrao) || 5
  const nota = Number(val) || 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: '100%', padding: '0 4px' }}>
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} size={18}
          style={{ color: i < nota ? '#FBBF24' : 'var(--bd2)', fill: i < nota ? '#FBBF24' : 'transparent', cursor: isRO ? 'default' : 'pointer', transition: 'color .15s' }}
          onClick={() => !isRO && !saving && setField(campo.nome_campo, i + 1 === nota ? 0 : i + 1)}
        />
      ))}
      {nota > 0 && <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 4 }}>{nota}/{max}</span>}
    </div>
  )
}

export function InputProgresso({ campo, val, isRO, saving, setField }) {
  const pct = Math.max(0, Math.min(100, Number(val) || 0))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, height: '100%', width: '100%', boxSizing: 'border-box', padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t2)', marginBottom: 2 }}>
        <span>Progresso</span><span>{pct}%</span>
      </div>
      <div style={{ height: 8, background: 'var(--s3)', borderRadius: 4, overflow: 'hidden', width: '100%' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct < 40 ? '#22c55e' : pct < 70 ? '#eab308' : '#ef4444', borderRadius: 4, transition: 'width .3s' }} />
      </div>
      {!isRO && (
        <input type="range" min="0" max="100" value={pct}
          onChange={e => setField(campo.nome_campo, Number(e.target.value))}
          disabled={saving}
          style={{ width: '100%', accentColor: 'var(--or)', cursor: 'pointer' }} />
      )}
    </div>
  )
}

export function InputCor({ campo, val, isRO, saving, inputStyle, setField }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: '100%' }}>
      <input type="color" value={val || '#3B82F6'}
        onChange={e => setField(campo.nome_campo, e.target.value)}
        disabled={isRO || saving}
        style={{ width: 36, height: 36, borderRadius: 6, border: '2px solid var(--bd)', cursor: isRO ? 'default' : 'pointer', flexShrink: 0, padding: 2, background: 'none' }} />
      <input className="form-input" value={val || ''}
        onChange={e => setField(campo.nome_campo, e.target.value)}
        disabled={isRO || saving}
        placeholder="#3B82F6"
        maxLength={9}
        style={{ flex: 1, height: '100%', fontFamily: 'monospace', ...inputStyle }} />
    </div>
  )
}

export function InputPercentual({ campo, val, isRO, saving, inputStyle, setField }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: '100%' }}>
      <input className="form-input" value={val}
        onChange={e => setField(campo.nome_campo, e.target.value)}
        disabled={isRO || saving}
        type="number"
        min="0" max="100" step="0.01"
        placeholder="0"
        style={{ flex: 1, height: '100%', borderRadius: '8px 0 0 8px', ...inputStyle }} />
      <div style={{ padding: '0 10px', height: '100%', display: 'flex', alignItems: 'center', background: 'var(--s3)', border: '1px solid var(--bd)', borderLeft: 'none', borderRadius: '0 8px 8px 0', fontSize: 13, fontWeight: 700, color: 'var(--t2)', flexShrink: 0 }}>%</div>
    </div>
  )
}

export function InputCalculo({ campo, form }) {
  const opcCalc = campo.opcoes && !Array.isArray(campo.opcoes) ? campo.opcoes : {}
  const formula = opcCalc.formula || ''
  let resultado = ''
  if (formula) {
    try {
      const expr = formula.replace(/\{(\w+)\}/g, (_, k) => {
        const v = form[k]
        return (v !== undefined && v !== '' && !isNaN(Number(v))) ? Number(v) : 0
      })
      // eslint-disable-next-line no-new-func
      resultado = String(Math.round(new Function(`return (${expr})`)() * 100) / 100)
    } catch { resultado = 'Erro' }
  }
  return (
    <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: 6, height: '100%', cursor: 'default', background: 'rgba(255,107,43,.04)', borderColor: 'rgba(255,107,43,.3)' }}>
      <Calculator size={12} style={{ color: 'var(--or)', flexShrink: 0 }} />
      <span style={{ fontWeight: 700, color: 'var(--t1)', fontSize: 13 }}>{resultado || '0'}</span>
      {formula && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--t3)', fontFamily: 'monospace' }}>{formula}</span>}
    </div>
  )
}
