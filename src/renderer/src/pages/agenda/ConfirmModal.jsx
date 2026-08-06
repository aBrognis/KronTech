import { AlertTriangle } from 'lucide-react'

// Modal de confirmação genérico in-app (substitui window.confirm nativo).
// options: [{ label, value, primary?, danger? }] — se omitido, usa OK/Cancelar padrão.
export default function ConfirmModal({ titulo, mensagem, options, onChoose, onClose }) {
  const opts = options || [
    { label:'Cancelar', value:false },
    { label:'OK', value:true, primary:true },
  ]
  return (
    <div className="modal-overlay" style={{ zIndex:1100 }} onClick={onClose}>
      <div className="modal" style={{ maxWidth:420 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <AlertTriangle size={16} color="var(--red)"/> {titulo || 'Confirmar'}
          </h2>
        </div>
        <div className="modal-body">
          <p style={{ fontSize:13, color:'var(--t2)', margin:0 }}>{mensagem}</p>
        </div>
        <div className="modal-footer" style={{ flexWrap:'wrap' }}>
          {opts.map((o, i) => (
            <button key={i}
              className={o.primary ? (o.danger ? 'btn btn-danger' : 'btn btn-primary') : 'btn btn-ghost'}
              onClick={() => onChoose(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
