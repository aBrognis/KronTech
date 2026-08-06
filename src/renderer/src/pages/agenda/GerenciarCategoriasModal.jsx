import { useState } from 'react'
import { X, Plus, Trash2, Pencil, Check } from 'lucide-react'

const EMPTY_ITEM = { codigo:'', nome:'', cor:'#6366F1', ordem:99 }

export default function GerenciarCategoriasModal({ categorias, statuses, onClose, onReload }) {
  const [tab, setTab] = useState('categorias') // categorias | status
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_ITEM)
  const [erro, setErro] = useState(null)
  const [saving, setSaving] = useState(false)

  const lista = tab === 'categorias' ? categorias : statuses

  function novo() {
    setEditId('new')
    setForm({ ...EMPTY_ITEM, cor: tab === 'categorias' ? '#6366F1' : '#94A3B8' })
    setErro(null)
  }

  function editar(item) {
    setEditId(item.id)
    setForm({ codigo: item.codigo||'', nome: item.nome||'', cor: item.cor||'#6366F1', ordem: item.ordem??99 })
    setErro(null)
  }

  function cancelar() {
    setEditId(null)
    setErro(null)
  }

  async function salvar() {
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return }
    setSaving(true)
    setErro(null)
    try {
      const api = tab === 'categorias' ? window.api.agenda : window.api.agenda
      const criar = tab === 'categorias' ? api.criarCategoria : api.criarStatus
      const atualizar = tab === 'categorias' ? api.atualizarCategoria : api.atualizarStatus
      const res = editId === 'new'
        ? await criar(form)
        : await atualizar({ id: editId, ...form })
      if (!res.ok) { setErro(res.erro); return }
      setEditId(null)
      await onReload()
    } finally { setSaving(false) }
  }

  async function excluir(item) {
    if (!confirm(`Excluir "${item.nome}"?`)) return
    const res = tab === 'categorias'
      ? await window.api.agenda.excluirCategoria(item.id)
      : await window.api.agenda.excluirStatus(item.id)
    if (!res.ok) { alert(res.erro); return }
    await onReload()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:520 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Gerenciar Categorias e Status</h2>
          <button className="modal-close" onClick={onClose}><X size={15}/></button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:12 }}>

          <div style={{ display:'flex', background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:8, overflow:'hidden', width:'fit-content' }}>
            {[{id:'categorias',label:'Categorias'},{id:'status',label:'Status'}].map(t => (
              <button key={t.id} onClick={()=>{ setTab(t.id); cancelar() }}
                style={{ padding:'6px 16px', border:'none', cursor:'pointer', fontSize:12, fontWeight: tab===t.id?700:400,
                  background: tab===t.id?'var(--or)':'transparent', color: tab===t.id?'#fff':'var(--t2)' }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:280, overflowY:'auto' }}>
            {lista.length===0 && editId!=='new' && (
              <div style={{ fontSize:12, color:'var(--t3)', textAlign:'center', padding:20, fontStyle:'italic' }}>
                Nenhum{tab==='status'?' status':'a categoria'} cadastrad{tab==='status'?'o':'a'}.
              </div>
            )}
            {lista.map(item => (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:7 }}>
                <div style={{ width:12, height:12, borderRadius:'50%', background:item.cor, flexShrink:0 }}/>
                <span style={{ fontSize:12, color:'var(--t1)', flex:1 }}>{item.nome}</span>
                <button className="btn btn-ghost" style={{ height:24, width:24, padding:0, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>editar(item)}>
                  <Pencil size={11}/>
                </button>
                <button className="btn btn-ghost" style={{ height:24, width:24, padding:0, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--red)' }} onClick={()=>excluir(item)}>
                  <Trash2 size={11}/>
                </button>
              </div>
            ))}
          </div>

          {editId ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8, padding:10, background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:8 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
                <input className="form-input" placeholder="Nome" value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} autoFocus/>
                <input type="color" value={form.cor} onChange={e=>setForm(f=>({...f,cor:e.target.value}))} style={{ width:40, height:32, padding:2, border:'1px solid var(--bd)', borderRadius:6, background:'var(--s1)' }}/>
              </div>
              {tab==='status' && (
                <input type="number" className="form-input" placeholder="Ordem" value={form.ordem} onChange={e=>setForm(f=>({...f,ordem:Number(e.target.value)}))}/>
              )}
              {erro && <div style={{ fontSize:11, color:'var(--red)' }}>{erro}</div>}
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button className="btn btn-ghost" style={{ height:28, fontSize:11 }} onClick={cancelar}>Cancelar</button>
                <button className="btn btn-primary" style={{ height:28, fontSize:11 }} onClick={salvar} disabled={saving}>
                  <Check size={12}/> {saving?'Salvando...':'Salvar'}
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-primary" style={{ height:32, fontSize:11, width:'fit-content' }} onClick={novo}>
              <Plus size={13}/> Nov{tab==='status'?'o status':'a categoria'}
            </button>
          )}

        </div>
      </div>
    </div>
  )
}
