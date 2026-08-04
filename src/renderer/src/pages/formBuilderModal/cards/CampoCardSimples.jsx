import { Minus, Copy, Star, Clock, Trash2 } from 'lucide-react'
import { CANVAS_W } from '../../../components/FormDesigner'

function DelBtn({ campo, idx, setCampos, tipInfoIdx, setTipInfoIdx, salvando }) {
  return (
    <button className="btn btn-danger" style={{ height: 28, width: 28, padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { e.stopPropagation(); setCampos(p => p.filter(c => c._key !== campo._key)); if (tipInfoIdx === idx) setTipInfoIdx(null) }}
      disabled={salvando}>
      <Trash2 size={13} />
    </button>
  )
}

export function CampoCardDivisor({ campo, idx, setCampos, atualizarCampo, tipInfoIdx, setTipInfoIdx, salvando }) {
  const isVert = (campo.valorPadrao || 'horizontal') === 'vertical'
  return (
    <div key={campo._key}
      style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 10px', background: 'var(--s2)', border: '1px solid var(--bd)', borderLeft: '3px solid var(--bd2)', borderRadius: 8 }}>
      <Minus size={12} color="var(--t3)" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: 'var(--t3)', flexShrink: 0 }}>Divisor</span>
      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        {[{ label: 'Horizontal', val: 'horizontal' }, { label: 'Vertical', val: 'vertical' }].map(({ label, val }) => {
          const active = (campo.valorPadrao || 'horizontal') === val
          return (
            <button key={val} className={`btn ${active ? 'btn-primary' : 'btn-ghost'}`}
              style={{ height: 22, fontSize: 10, padding: '0 8px' }}
              onClick={() => { if (active) return; setCampos(prev => prev.map(c => { if (c._key !== campo._key) return c; const w = c.w_px||CANVAS_W, h = c.h_px||24; return { ...c, valorPadrao: val, w_px: val==='vertical'?24:Math.max(h,120), h_px: val==='vertical'?Math.max(w,120):24 } })) }}
              disabled={salvando}>{label}</button>
          )
        })}
      </div>
      <div style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
      <input className="form-input" style={{ height: 26, width: 160, fontSize: 11 }}
        value={campo.label} onChange={e => atualizarCampo(campo._key, 'label', e.target.value)}
        placeholder="Título (opcional)" disabled={salvando} />
      <DelBtn campo={campo} idx={idx} setCampos={setCampos} tipInfoIdx={tipInfoIdx} setTipInfoIdx={setTipInfoIdx} salvando={salvando} />
    </div>
  )
}

export function CampoCardCopiar({ campo, idx, campos, setCampos, atualizarCampo, tipInfoIdx, setTipInfoIdx, salvando }) {
  const camposTexto = campos.filter(c => c._key !== campo._key && ['texto', 'texto_longo'].includes(c.tipo) && c.nomeCampo)
  return (
    <div key={campo._key}
      style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 10px', background: 'rgba(96,165,250,.05)', border: '1px solid rgba(96,165,250,.2)', borderLeft: '3px solid #60A5FA', borderRadius: 8 }}>
      <Copy size={13} color="#60A5FA" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>Campo</span>
      <select className="form-select" style={{ height: 26, fontSize: 11, flex: 1, minWidth: 0 }}
        value={campo.valorPadrao||''} onChange={e => atualizarCampo(campo._key, 'valorPadrao', e.target.value)} disabled={salvando}>
        <option value="">— selecione —</option>
        {camposTexto.map(c => <option key={c._key} value={c.nomeCampo}>{c.label||c.nomeCampo}</option>)}
      </select>
      <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>Texto</span>
      <input className="form-input" style={{ height: 26, fontSize: 11, width: 100 }}
        value={campo.label} onChange={e => atualizarCampo(campo._key, 'label', e.target.value)}
        placeholder="Copiar" disabled={salvando} />
      <DelBtn campo={campo} idx={idx} setCampos={setCampos} tipInfoIdx={tipInfoIdx} setTipInfoIdx={setTipInfoIdx} salvando={salvando} />
    </div>
  )
}

export function CampoCardFavoritoTimestamps({ campo, idx, setCampos, tipInfoIdx, setTipInfoIdx, salvando }) {
  const isFav = campo.tipo === 'favorito'
  const Icon  = isFav ? Star : Clock
  const color = isFav ? 'var(--or)' : '#60A5FA'
  return (
    <div key={campo._key}
      style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 10px', background: isFav ? 'rgba(255,107,43,.04)' : 'rgba(96,165,250,.05)', border: `1px solid ${isFav ? 'rgba(255,107,43,.2)' : 'rgba(96,165,250,.2)'}`, borderLeft: `3px solid ${color}`, borderRadius: 8 }}>
      <Icon size={13} color={color} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{isFav ? 'Favorito' : 'Timestamps'}</span>
      <span style={{ fontSize: 10, color: 'var(--t3)' }}>— {isFav ? 'estrela de favorito' : 'criado em · atualizado em'}</span>
      <div style={{ flex: 1 }} />
      <DelBtn campo={campo} idx={idx} setCampos={setCampos} tipInfoIdx={tipInfoIdx} setTipInfoIdx={setTipInfoIdx} salvando={salvando} />
    </div>
  )
}
