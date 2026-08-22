import { useState, useEffect } from 'react'
import { X, Eye, EyeOff, Copy, Check, History } from 'lucide-react'

function fmtDataHora(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function LinhaHistorico({ item }) {
  const [visivel, setVisivel] = useState(false)
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    await window.api.clipboard.write(item.senha_anterior)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s2)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: visivel ? 'monospace' : undefined, fontSize: 13, color: 'var(--t1)', letterSpacing: visivel ? undefined : 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {visivel ? item.senha_anterior : '•'.repeat(Math.min(item.senha_anterior.length || 12, 20))}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 3 }}>
          {fmtDataHora(item.alterado_em)}{item.alterado_por ? ` · ${item.alterado_por}` : ''}
        </div>
      </div>
      <button type="button" onClick={() => setVisivel(v => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 4 }}
        title={visivel ? 'Ocultar' : 'Mostrar'}>
        {visivel ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      <button type="button" onClick={copiar}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiado ? 'var(--green)' : 'var(--t3)', display: 'flex', padding: 4 }}
        title="Copiar">
        {copiado ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  )
}

export default function HistoricoSenhaModal({ credencialId, onFechar }) {
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.cofreSenhaHistorico.listar(credencialId).then(res => {
      setItens(res.ok ? res.data || [] : [])
      setLoading(false)
    })
  }, [credencialId])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}
      onClick={onFechar}>
      <div style={{ width: 440, maxHeight: '70vh', display: 'flex', flexDirection: 'column', background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 18px', borderBottom: '1px solid var(--bd)' }}>
          <History size={15} color="var(--t2)" />
          <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--t1)', flex: 1 }}>Histórico de Senhas</div>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 4 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--t3)', fontSize: 12 }}>Carregando...</div>
          ) : itens.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--t3)', fontSize: 12 }}>
              Nenhuma troca de senha registrada ainda para este acesso.
            </div>
          ) : (
            itens.map(item => <LinhaHistorico key={item.id} item={item} />)
          )}
        </div>
      </div>
    </div>
  )
}
