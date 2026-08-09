import { useState } from 'react'
import { X, Clock3 } from 'lucide-react'
import { STATUS_AUTO_LABEL } from './utils'

const OPCOES = [
  { status:'em_andamento',   label:'Iniciado agora' },
  { status:'concluido',      label:'Concluído' },
  { status:'nao_compareceu', label:'Não compareceu' },
  { status:'cancelado',      label:'Cancelado' },
]

// Modal de confirmação do status automático de um compromisso (Agendado ->
// Em andamento -> Concluído/Atrasado/Não compareceu/Cancelado). Aberto tanto
// pelo clique no corpo da notificação quanto pelo botão "Confirmar status"
// dentro do EventoModal.
export default function ConfirmarStatusModal({ evento, onClose, onConfirmar }) {
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState(null)

  async function escolher(status) {
    setSaving(true)
    setErro(null)
    const res = await window.api.agenda.confirmarStatus({ id: evento.id, status, origem: 'usuario' })
    setSaving(false)
    if (!res.ok) { setErro(res.erro); return }
    onConfirmar(res.data)
  }

  return (
    <div className="modal-overlay" style={{ zIndex:1100 }} onClick={onClose}>
      <div className="modal" style={{ maxWidth:420 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Clock3 size={16} color="var(--or)"/> Status do compromisso
          </h2>
          <button className="modal-close" onClick={onClose}><X size={15}/></button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--t1)' }}>{evento.titulo}</div>
            <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>
              Status atual: {STATUS_AUTO_LABEL[evento.status_auto] || 'Agendado'}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {OPCOES.map(o => (
              <button key={o.status} className="btn btn-ghost" style={{ justifyContent:'flex-start', height:34 }}
                disabled={saving} onClick={()=>escolher(o.status)}>
                {o.label}
              </button>
            ))}
          </div>
          {erro && (
            <div style={{ background:'rgba(248,113,113,.1)', border:'1px solid rgba(239,68,68,.4)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--red)' }}>
              {erro}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <div style={{ flex:1 }}/>
          <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  )
}
