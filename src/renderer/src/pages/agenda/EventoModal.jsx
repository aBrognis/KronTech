import { X, Bell, Trash2 } from 'lucide-react'
import { RECORRENCIAS, MIN_OPTIONS } from './utils'

export default function EventoModal({ modal, form, setForm, categorias, statuses, clientes, saving, erro, onSave, onDelete, onClose }) {
  const isNew = modal === 'new'
  function set(k,v) { setForm(f=>({...f,[k]:v})) }

  const lembretes = form.lembretes || []
  const opcoesDisponiveis = MIN_OPTIONS.filter(o => !lembretes.includes(o.value))

  function adicionarLembrete(valor) {
    if (!valor) return
    const v = Number(valor)
    if (lembretes.includes(v)) return
    set('lembretes', [...lembretes, v].sort((a,b)=>a-b))
  }

  function removerLembrete(valor) {
    set('lembretes', lembretes.filter(v => v !== valor))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:600 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isNew ? 'Novo Evento' : 'Editar Evento'}</h2>
          <button className="modal-close" onClick={onClose}><X size={15}/></button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Título */}
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Título *</label>
            <input className="form-input" placeholder="Título do evento..." value={form.titulo} onChange={e=>set('titulo',e.target.value)} autoFocus/>
          </div>

          {/* Categoria + Status */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Categoria</label>
              <select className="form-select" value={form.categoria_id} onChange={e=>set('categoria_id',e.target.value)}>
                <option value="">— sem categoria —</option>
                {categorias.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status_id} onChange={e=>set('status_id',e.target.value)}>
                <option value="">— sem status —</option>
                {statuses.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
          </div>

          {/* Cliente */}
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Cliente</label>
            <select className="form-select" value={form.cliente_id} onChange={e=>set('cliente_id',e.target.value)}>
              <option value="">— sem cliente —</option>
              {clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          {/* Data + Horas + Dia todo */}
          <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap:12 }}>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Data</label>
              <input type="date" className="form-input" value={form.dt_evento} onChange={e=>set('dt_evento',e.target.value)}/>
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Início</label>
              <input type="time" className="form-input" value={form.hr_inicio} disabled={form.dia_todo} onChange={e=>set('hr_inicio',e.target.value)}/>
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Fim</label>
              <input type="time" className="form-input" value={form.hr_fim} disabled={form.dia_todo} onChange={e=>set('hr_fim',e.target.value)}/>
            </div>
          </div>

          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, cursor:'pointer', color:'var(--t2)', userSelect:'none' }}>
              <input type="checkbox" checked={form.dia_todo} onChange={e=>set('dia_todo',e.target.checked)} style={{ accentColor:'var(--or)' }}/>
              Dia todo
            </label>
            <div className="form-group" style={{ margin:0, minWidth:160 }}>
              <select className="form-select" value={form.recorrencia} onChange={e=>set('recorrencia',e.target.value)} style={{ height:28, fontSize:11 }}>
                {RECORRENCIAS.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          {isNew && form.recorrencia !== 'nenhuma' && (
            <div style={{ fontSize:11, color:'var(--t3)', fontStyle:'italic' }}>
              Serão criados eventos futuros por até 6 meses.
            </div>
          )}

          {/* Local */}
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Local</label>
            <input className="form-input" placeholder="Endereço, link ou local..." value={form.local} onChange={e=>set('local',e.target.value)}/>
          </div>

          {/* Descrição */}
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Descrição</label>
            <textarea className="form-textarea" rows={3} placeholder="Detalhes, pauta, observações..." value={form.descricao} onChange={e=>set('descricao',e.target.value)}/>
          </div>

          {/* Lembretes */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Bell size={13}/> Lembretes
            </label>
            {lembretes.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {lembretes.map(v => {
                  const opt = MIN_OPTIONS.find(o=>o.value===v)
                  return (
                    <span key={v} style={{
                      display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--t2)',
                      background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:6, padding:'4px 6px 4px 10px',
                    }}>
                      {opt?.label || `${v} min antes`}
                      <button type="button" onClick={()=>removerLembrete(v)}
                        style={{ display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', cursor:'pointer', color:'var(--t3)', padding:2 }}>
                        <X size={11}/>
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
            {opcoesDisponiveis.length > 0 && (
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <select className="form-select" style={{ width:'auto', height:28, fontSize:11 }} defaultValue=""
                  onChange={e => { adicionarLembrete(e.target.value); e.target.value = '' }}>
                  <option value="" disabled>Adicionar lembrete...</option>
                  {opcoesDisponiveis.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}
          </div>

          {erro && (
            <div style={{ background:'rgba(248,113,113,.1)', border:'1px solid rgba(239,68,68,.4)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'var(--red)' }}>
              {erro}
            </div>
          )}

        </div>
        <div className="modal-footer">
          {!isNew && <button className="btn btn-danger" onClick={onDelete} style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Trash2 size={13}/> Excluir</button>}
          <div style={{ flex:1 }}/>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving||!form.titulo.trim()}>
            {saving ? 'Salvando...' : isNew ? 'Criar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
