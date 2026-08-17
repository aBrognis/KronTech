import { Copy, Star, Search, Link, Paperclip, ImageIcon, Palette, Calculator } from 'lucide-react'

// ── Live field renderer ───────────────────────────────────────────────────────
export default function FieldLivePreview({ campo }) {
  const ops = Array.isArray(campo.opcoes) ? campo.opcoes : []
  const NO_WRAPPER = ['botao', 'favorito', 'timestamps', 'copiar', 'divisor']
  const SKIP_LABEL = ['booleano', 'botao', 'favorito', 'timestamps']

  function fieldInner() {
    if (campo.tipo === 'botao') {
      let cfg = {}; try { cfg = JSON.parse(campo.valorPadrao || '{}') } catch {}
      return <button className={`btn btn-${cfg.variant || 'ghost'}`} disabled style={{ width:'100%', height:'100%', fontSize:12 }}>{campo.label || 'Botão'}</button>
    }
    if (campo.tipo === 'favorito') return (
      <label className="fav-check" style={{ height:'100%', display:'flex', alignItems:'center', pointerEvents:'none' }}>
        <input type="checkbox" disabled style={{ accentColor:'var(--or)' }}/>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12 }}>Marcar como favorito <Star size={13}/></span>
      </label>
    )
    if (campo.tipo === 'timestamps') return (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, height:'100%', alignContent:'center' }}>
        <div className="form-group" style={{ marginBottom:0 }}>
          <label className="form-label" style={{ fontSize:10 }}>Criado em</label>
          <div className="form-input" style={{ fontSize:11, display:'flex', alignItems:'center', height:32, cursor:'default', background:'#fff', color:'#333', border:'1px solid #ddd' }}>...</div>
        </div>
        <div className="form-group" style={{ marginBottom:0 }}>
          <label className="form-label" style={{ fontSize:10 }}>Atualizado em</label>
          <div className="form-input" style={{ fontSize:11, display:'flex', alignItems:'center', height:32, cursor:'default', background:'#fff', color:'#333', border:'1px solid #ddd' }}>...</div>
        </div>
      </div>
    )
    if (campo.tipo === 'copiar') return (
      <button disabled className="btn btn-ghost" style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontSize:11 }}>
        <Copy size={11}/> {campo.label || 'Copiar'}
      </button>
    )
    if (campo.tipo === 'booleano') return (
      <label className="fav-check" style={{ height:'100%', display:'flex', alignItems:'center', pointerEvents:'none' }}>
        <input type="checkbox" disabled style={{ accentColor:'var(--or)' }}/>
        <span style={{ fontSize:12 }}>{campo.label}</span>
      </label>
    )
    if (campo.tipo === 'texto_longo') return (
      <textarea className="form-textarea" disabled placeholder={campo.valorPadrao || 'Texto longo...'}
        style={{ width:'100%', height:'100%', minHeight:'unset', resize:'none', boxSizing:'border-box', fontSize:12 }}/>
    )
    if (campo.tipo === 'select') return (
      <select className="form-select" disabled style={{ width:'100%', height:'100%', fontSize:12 }}>
        <option>Selecione</option>
        {ops.map((o, i) => <option key={i}>{o.label}</option>)}
      </select>
    )
    if (campo.tipo === 'radio') return (
      <div style={{ display:'flex', alignItems:'center', gap:14, height:'100%', padding:'0 12px', background:'#fff', border:'1.5px solid #ddd', borderRadius:10, flexWrap:'wrap', boxSizing:'border-box', width:'100%' }}>
        {ops.length ? ops.map((o, i) => (
          <label key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11.5, color:o.cor||'var(--t2)', fontWeight:600, userSelect:'none' }}>
            <input type="radio" disabled style={{ accentColor:o.cor||'var(--or)', width:13, height:13 }}/>{o.label}
          </label>
        )) : <span style={{ fontSize:11, color:'var(--t3)', fontStyle:'italic' }}>Sem opções</span>}
      </div>
    )
    if (campo.tipo === 'tags') return (
      <div style={{ display:'flex', alignItems:'center', gap:4, height:'100%', padding:'0 8px', background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:8, fontSize:11, flexWrap:'wrap', overflow:'hidden' }}>
        {campo.valorPadrao
          ? campo.valorPadrao.split(',').map((t,i) => <span key={i} style={{ background:'var(--s3)', borderRadius:4, padding:'1px 6px', color:'var(--t2)' }}>{t.trim()}</span>)
          : <span style={{ color:'var(--t3)' }}>tag1, tag2...</span>}
      </div>
    )
    if (campo.tipo === 'codigo_auto') return (
      <div className="form-input" style={{ display:'flex', alignItems:'center', height:'100%', fontFamily:'monospace', fontWeight:700, fontSize:13, color:'var(--or)', letterSpacing:2 }}>001</div>
    )
    if (campo.tipo === 'lookup') {
      const cfg = (campo.opcoes && !Array.isArray(campo.opcoes)) ? campo.opcoes : {}
      return (
        <div style={{ display:'flex', gap:4, height:'100%' }}>
          <div className="form-input" style={{ flex:1, height:'100%', display:'flex', alignItems:'center', fontSize:12, color:'var(--t3)', fontStyle:'italic' }}>
            {cfg.lookupTabela ? `← ${cfg.lookupTabela}` : 'Nenhum'}
          </div>
          <button className="btn btn-ghost" style={{ flexShrink:0, padding:'0 8px', height:'100%' }} disabled><Search size={13}/></button>
        </div>
      )
    }
    if (campo.tipo === 'data') return (
      <input className="form-input" type="date" disabled style={{ width:'100%', height:'100%' }}/>
    )
    if (campo.tipo === 'data_hora') return (
      <input className="form-input" type="datetime-local" disabled style={{ width:'100%', height:'100%' }}/>
    )
    if (campo.tipo === 'hora') return (
      <input className="form-input" type="time" disabled style={{ width:'100%', height:'100%' }}/>
    )
    if (campo.tipo === 'url') return (
      <div style={{ display:'flex', gap:4, height:'100%' }}>
        <div className="form-input" style={{ flex:1, height:'100%', display:'flex', alignItems:'center', fontSize:12, color:'#3B82F6', fontStyle:'italic' }}>
          <Link size={11} style={{ marginRight:4, flexShrink:0 }}/>{campo.valorPadrao || 'https://...'}
        </div>
      </div>
    )
    if (campo.tipo === 'arquivo') return (
      <div style={{ display:'flex', alignItems:'center', gap:6, height:'100%', padding:'0 10px', background:'var(--s2)', border:'1.5px dashed var(--bd)', borderRadius:8, boxSizing:'border-box', width:'100%' }}>
        <Paperclip size={13} style={{ color:'var(--t3)', flexShrink:0 }}/>
        <span style={{ fontSize:11, color:'var(--t3)', fontStyle:'italic' }}>Clique para anexar arquivo...</span>
      </div>
    )
    if (campo.tipo === 'imagem') return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', background:'var(--s2)', border:'1.5px dashed var(--bd)', borderRadius:8, boxSizing:'border-box', width:'100%', gap:6 }}>
        <ImageIcon size={24} style={{ color:'var(--bd2)' }}/>
        <span style={{ fontSize:10, color:'var(--t3)' }}>Clique para enviar imagem</span>
      </div>
    )
    if (campo.tipo === 'avaliacao') {
      const max = Number(campo.valorPadrao) || 5
      return (
        <div style={{ display:'flex', alignItems:'center', gap:4, height:'100%', padding:'0 8px' }}>
          {Array.from({ length: max }, (_, i) => (
            <Star key={i} size={16} style={{ color: i < 3 ? '#FBBF24' : 'var(--bd2)', fill: i < 3 ? '#FBBF24' : 'transparent' }}/>
          ))}
        </div>
      )
    }
    if (campo.tipo === 'progresso') {
      const pct = Number(campo.valorPadrao) || 60
      return (
        <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', gap:4, height:'100%', padding:'0 8px', width:'100%', boxSizing:'border-box' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--t2)' }}>
            <span>Progresso</span><span>{pct}%</span>
          </div>
          <div style={{ height:8, background:'var(--s3)', borderRadius:4, overflow:'hidden', width:'100%' }}>
            <div style={{ height:'100%', width:`${pct}%`, background:'var(--or)', borderRadius:4, transition:'width .3s' }}/>
          </div>
        </div>
      )
    }
    if (campo.tipo === 'cor') return (
      <div style={{ display:'flex', alignItems:'center', gap:8, height:'100%', padding:'0 10px' }}>
        <div style={{ width:28, height:28, borderRadius:6, background:campo.valorPadrao || '#3B82F6', border:'2px solid var(--bd)', flexShrink:0 }}/>
        <div className="form-input" style={{ flex:1, height:32, display:'flex', alignItems:'center', fontSize:12, fontFamily:'monospace' }}>
          {campo.valorPadrao || '#3B82F6'}
        </div>
        <Palette size={13} style={{ color:'var(--t3)', flexShrink:0 }}/>
      </div>
    )
    if (campo.tipo === 'percentual') return (
      <div style={{ display:'flex', alignItems:'center', gap:4, height:'100%' }}>
        <input className="form-input" type="number" disabled placeholder="0" style={{ flex:1, height:'100%' }}/>
        <div style={{ padding:'0 8px', height:'100%', display:'flex', alignItems:'center', background:'var(--s3)', border:'1px solid var(--bd)', borderRadius:'0 8px 8px 0', fontSize:13, fontWeight:700, color:'var(--t2)', marginLeft:-1 }}>%</div>
      </div>
    )
    if (campo.tipo === 'calculo') {
      let formula = ''
      try { formula = JSON.parse(campo.valorPadrao || '{}').formula || '' } catch {}
      return (
        <div style={{ display:'flex', alignItems:'center', gap:6, height:'100%', padding:'0 10px', background:'rgba(255,107,43,.06)', border:'1.5px solid rgba(255,107,43,.25)', borderRadius:8, boxSizing:'border-box', width:'100%' }}>
          <Calculator size={12} style={{ color:'var(--or)', flexShrink:0 }}/>
          <span style={{ fontSize:11, color:'var(--or)', fontFamily:'monospace' }}>{formula}</span>
          <span style={{ marginLeft:'auto', fontSize:11, fontWeight:700, color:'var(--t2)' }}>0,00</span>
        </div>
      )
    }
    return (
      <input className="form-input" disabled placeholder={campo.valorPadrao || ''} style={{ width:'100%', height:'100%' }}/>
    )
  }

  if (NO_WRAPPER.includes(campo.tipo)) return fieldInner()
  return (
    <div className="form-group" style={{ width:'100%', height:'100%', padding:'0 2px', boxSizing:'border-box', marginBottom:0, display:'flex', flexDirection:'column', gap:6 }}>
      {!SKIP_LABEL.includes(campo.tipo) && (
        <label className="form-label">
          {campo.label || campo.nomeCampo || 'Sem nome'}
          {campo.obrigatorio && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}
        </label>
      )}
      <div style={{ flex:1, minHeight:0 }}>{fieldInner()}</div>
    </div>
  )
}
