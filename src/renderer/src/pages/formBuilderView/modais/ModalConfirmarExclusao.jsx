import { Trash2 } from 'lucide-react'

export default function ModalConfirmarExclusao({ onCancelar, onConfirmar }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,.45)' }}>
      <div style={{ width:380, background:'var(--s1)', borderRadius:14, boxShadow:'var(--sh-lg)', overflow:'hidden' }}>
        <div style={{ padding:'20px 22px 10px', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(220,38,38,.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Trash2 size={16} color="var(--red)"/>
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:'var(--t1)' }}>Excluir registro</div>
            <div style={{ fontSize:12, color:'var(--t3)', marginTop:2 }}>Esta ação não pode ser desfeita.</div>
          </div>
        </div>
        <div style={{ padding:'8px 22px 20px', display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" style={{ height:34, fontSize:12 }} onClick={onCancelar}>Cancelar</button>
          <button className="btn btn-danger" style={{ height:34, fontSize:12 }} onClick={onConfirmar}>Excluir</button>
        </div>
      </div>
    </div>
  )
}
