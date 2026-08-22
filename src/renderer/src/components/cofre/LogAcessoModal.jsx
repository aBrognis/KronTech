import { useState, useEffect } from 'react'
import { X, Eye, Copy, ScrollText } from 'lucide-react'

function fmtDataHora(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const ACAO_META = {
  visualizar: { label: 'Visualizou', Icon: Eye },
  copiar:     { label: 'Copiou',     Icon: Copy },
  copiar_totp:{ label: 'Copiou código 2FA', Icon: Copy },
}

export default function LogAcessoModal({ credencialId, onFechar }) {
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.cofreSenhaAcesso.listar(credencialId).then(res => {
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
          <ScrollText size={15} color="var(--t2)" />
          <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--t1)', flex: 1 }}>Log de Acesso</div>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 4 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--t3)', fontSize: 12 }}>Carregando...</div>
          ) : itens.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--t3)', fontSize: 12 }}>
              Nenhum acesso registrado ainda para este item.
            </div>
          ) : (
            itens.map(item => {
              const meta = ACAO_META[item.acao] || { label: item.acao, Icon: Eye }
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--s2)' }}>
                  <meta.Icon size={13} color="var(--t3)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--t1)' }}>
                      {meta.label}{item.usuario_nome ? ` · ${item.usuario_nome}` : ''}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>{fmtDataHora(item.criado_em)}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
