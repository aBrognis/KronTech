import { X, Bell, Clock3 } from 'lucide-react'
import { RECORRENCIAS, MIN_OPTIONS, STATUS_AUTO_LABEL, corStatusAuto } from './utils'
import SeletorBusca from '../../components/SeletorBusca'
import FormToolbar from '../../components/FormToolbar'

const CAMPOS_CATEGORIA = [{ nome_campo: 'nome', label: 'Nome' }, { nome_campo: 'codigo', label: 'Código' }]
const CAMPOS_STATUS    = [{ nome_campo: 'nome', label: 'Nome' }, { nome_campo: 'codigo', label: 'Código' }]
const CAMPOS_CLIENTE   = [
  { nome_campo: 'nome',            label: 'Nome / Razão Social' },
  { nome_campo: 'nome_fantasia',   label: 'Apelido / Nome Fantasia' },
  { nome_campo: 'cpf_cnpj',        label: 'CPF / CNPJ' },
]

export default function EventoModal({ modal, modo, form, setForm, categorias, statuses, clientes, saving, erro, onSave, onDelete, onClose, onAlterar, onDesistir, onConfirmarStatus }) {
  const isNew = modal === 'new'
  const isRO  = modo === 'view'
  function set(k,v) { setForm(f=>({...f,[k]:v})) }
  const mostrarStatusAuto = !isNew && modal.status_auto && !['agendado','concluido','cancelado'].includes(modal.status_auto)

  const categoriaAtual = categorias.find(c => String(c.id) === String(form.categoria_id))
  const statusAtual    = statuses.find(s => String(s.id) === String(form.status_id))
  const clienteAtual   = clientes.find(c => String(c.id) === String(form.cliente_id))

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

  const titulo = modo === 'new' ? 'Novo Evento' : modo === 'edit' ? 'Editar Evento' : 'Evento'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:600 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{titulo}</h2>
          <button className="modal-close" onClick={onClose}><X size={15}/></button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Título */}
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Título *</label>
            <input className="form-input" placeholder="Título do evento..." value={form.titulo} onChange={e=>set('titulo',e.target.value)} disabled={isRO} autoFocus={!isRO}/>
          </div>

          {/* Categoria + Status */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <SeletorBusca
              label="Categoria"
              placeholder="— sem categoria —"
              valorExibido={categoriaAtual?.nome}
              onLimpar={() => set('categoria_id', '')}
              disabled={isRO}
              titulo="Pesquisa Padrão — Categorias da Agenda"
              campos={CAMPOS_CATEGORIA}
              colunasExibidas={CAMPOS_CATEGORIA}
              campoInicial="nome"
              onBuscar={async (campo, modo, busca, ordenar, direcao) => {
                const res = await window.api.agenda.pesquisarCategorias({ campo, modo, busca, ordenar, direcao })
                if (!res.ok) throw new Error(res.erro)
                return res.data
              }}
              onSelecionar={r => set('categoria_id', r.id)}
            />
            <SeletorBusca
              label="Status"
              placeholder="— sem status —"
              valorExibido={statusAtual?.nome}
              onLimpar={() => set('status_id', '')}
              disabled={isRO}
              titulo="Pesquisa Padrão — Status da Agenda"
              campos={CAMPOS_STATUS}
              colunasExibidas={CAMPOS_STATUS}
              campoInicial="nome"
              onBuscar={async (campo, modo, busca, ordenar, direcao) => {
                const res = await window.api.agenda.pesquisarStatus({ campo, modo, busca, ordenar, direcao })
                if (!res.ok) throw new Error(res.erro)
                return res.data
              }}
              onSelecionar={r => set('status_id', r.id)}
            />
          </div>

          {/* Cliente */}
          <SeletorBusca
            label="Cliente"
            placeholder="— sem cliente —"
            valorExibido={clienteAtual?.nome}
            onLimpar={() => set('cliente_id', '')}
            disabled={isRO}
            titulo="Pesquisa Padrão — Cadastro de Entidade"
            campos={CAMPOS_CLIENTE}
            colunasExibidas={CAMPOS_CLIENTE}
            campoInicial="nome"
            mostrarFavorito
            onBuscar={async (campo, modo, busca, ordenar, direcao) => {
              const res = await window.api.formBuilder.pesquisarRegistros('entidade_001', { campo, modo, busca, ordenar, direcao })
              if (!res.ok) throw new Error(res.erro)
              return res.data
            }}
            onSelecionar={r => set('cliente_id', r.id)}
          />

          {/* Data + Horas + Dia todo */}
          <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap:12 }}>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Data</label>
              <input type="date" className="form-input" value={form.dt_evento} onChange={e=>set('dt_evento',e.target.value)} disabled={isRO}/>
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Início</label>
              <input type="time" className="form-input" value={form.hr_inicio} disabled={isRO || form.dia_todo} onChange={e=>set('hr_inicio',e.target.value)}/>
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Fim</label>
              <input type="time" className="form-input" value={form.hr_fim} disabled={isRO || form.dia_todo} onChange={e=>set('hr_fim',e.target.value)}/>
            </div>
          </div>

          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, cursor: isRO ? 'default' : 'pointer', color:'var(--t2)', userSelect:'none' }}>
              <input type="checkbox" checked={form.dia_todo} onChange={e=>set('dia_todo',e.target.checked)} disabled={isRO} style={{ accentColor:'var(--or)' }}/>
              Dia todo
            </label>
            <div className="form-group" style={{ margin:0, minWidth:160 }}>
              <select className="form-select" value={form.recorrencia} onChange={e=>set('recorrencia',e.target.value)} disabled={isRO} style={{ height:28, fontSize:11 }}>
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
            <input className="form-input" placeholder="Endereço, link ou local..." value={form.local} onChange={e=>set('local',e.target.value)} disabled={isRO}/>
          </div>

          {/* Descrição */}
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Descrição</label>
            <textarea className="form-textarea" rows={3} placeholder="Detalhes, pauta, observações..." value={form.descricao} onChange={e=>set('descricao',e.target.value)} disabled={isRO}/>
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
                      display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:600, color:'#4ADE80',
                      background:'rgba(74,222,128,.1)', border:'1px solid rgba(74,222,128,.35)', borderRadius:6, padding:'4px 6px 4px 10px',
                    }}>
                      <Bell size={10}/>
                      {opt?.label || `${v} min antes`}
                      {!isRO && (
                        <button type="button" onClick={()=>removerLembrete(v)}
                          style={{ display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', cursor:'pointer', color:'#4ADE80', opacity:.7, padding:2 }}>
                          <X size={11}/>
                        </button>
                      )}
                    </span>
                  )
                })}
              </div>
            )}
            {!isRO && opcoesDisponiveis.length > 0 && (() => {
              const RAPIDOS = [5, 10, 15, 30, 60]
              const chipsRapidos = opcoesDisponiveis.filter(o => RAPIDOS.includes(o.value))
              const resto        = opcoesDisponiveis.filter(o => !RAPIDOS.includes(o.value))
              return (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
                  {chipsRapidos.map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => adicionarLembrete(o.value)}
                      style={{
                        display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--t2)',
                        background:'var(--s2)', border:'1px dashed var(--bd2)', borderRadius:6,
                        padding:'4px 10px', cursor:'pointer',
                      }}
                      onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--or)'; e.currentTarget.style.color='var(--or)' }}
                      onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--bd2)'; e.currentTarget.style.color='var(--t2)' }}
                    >
                      <Bell size={10}/>
                      {o.value < 60 ? `${o.value} min` : o.value === 60 ? '1 hora' : o.label}
                    </button>
                  ))}
                  {resto.length > 0 && (
                    <select className="form-select" style={{ width:'auto', height:26, fontSize:11 }} defaultValue=""
                      onChange={e => { adicionarLembrete(e.target.value); e.target.value = '' }}>
                      <option value="" disabled>Outro...</option>
                      {resto.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  )}
                </div>
              )
            })()}
          </div>

          {mostrarStatusAuto && (
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between', gap:8,
              background:'var(--s2)', border:`1px solid ${corStatusAuto(modal)}55`, borderRadius:8, padding:'8px 12px',
            }}>
              <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color: corStatusAuto(modal) }}>
                <Clock3 size={13}/> {STATUS_AUTO_LABEL[modal.status_auto]}
              </span>
              <button type="button" className="btn btn-ghost" style={{ height:26, fontSize:11 }} onClick={()=>onConfirmarStatus(modal)}>
                Confirmar status
              </button>
            </div>
          )}

          {erro && (
            <div style={{ background:'rgba(248,113,113,.1)', border:'1px solid rgba(239,68,68,.4)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'var(--red)' }}>
              {erro}
            </div>
          )}

        </div>
        <FormToolbar
          mode={modo}
          saving={saving}
          onAlterar={onAlterar}
          onExcluir={!isNew ? onDelete : undefined}
          onGravar={onSave}
          onDesistir={onDesistir}
        />
      </div>
    </div>
  )
}
