import { useState } from 'react'
import { X, Search, RotateCcw } from 'lucide-react'
import InputData from '../../components/InputData'

export default function BuscaAvancadaModal({ filtros, onAplicar, onFechar }) {
  const [remetente, setRemetente] = useState(filtros?.remetente || '')
  const [dataInicio, setDataInicio] = useState(filtros?.dataInicio || '')
  const [dataFim, setDataFim] = useState(filtros?.dataFim || '')
  const [comAnexo, setComAnexo] = useState(filtros?.comAnexo || false)

  function limpar() {
    setRemetente(''); setDataInicio(''); setDataFim(''); setComAnexo(false)
    onAplicar({})
  }

  function aplicar() {
    onAplicar({
      remetente: remetente.trim() || undefined,
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
      comAnexo: comAnexo || undefined,
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}>
      <div style={{ width: 420, background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Busca avançada</span>
          <button className="btn btn-ghost" style={{ height: 28, width: 28, padding: 0 }} onClick={onFechar}><X size={14} /></button>
        </div>

        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Remetente (e-mail)</label>
            <input className="form-input" value={remetente} onChange={e => setRemetente(e.target.value)} placeholder="nome@exemplo.com" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">De</label>
              <InputData value={dataInicio} onChange={setDataInicio} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Até</label>
              <InputData value={dataFim} onChange={setDataFim} />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--t2)', cursor: 'pointer' }}>
            <input type="checkbox" checked={comAnexo} onChange={e => setComAnexo(e.target.checked)} />
            Apenas mensagens com anexo
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '14px 22px 20px', justifyContent: 'space-between' }}>
          <button className="btn btn-ghost" onClick={limpar}>
            <RotateCcw size={13} /> Limpar
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onFechar}>Cancelar</button>
            <button className="btn btn-primary" onClick={aplicar}>
              <Search size={13} /> Buscar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
