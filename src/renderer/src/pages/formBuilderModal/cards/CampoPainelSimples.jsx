import { Search } from 'lucide-react'

export function CampoPainelVazio() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--t3)', padding: 32 }}>
      <Search size={28} strokeWidth={1.2} style={{ opacity: .3 }} />
      <span style={{ fontSize: 13 }}>Selecione um campo para editar</span>
    </div>
  )
}

export function CampoPainelFavoritoTimestamps({ campo }) {
  const isFav = campo.tipo === 'favorito'
  return (
    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: isFav ? 'var(--or)' : '#60A5FA' }}>{isFav ? '♥ Favorito' : '🕐 Timestamps'}</span>
      </div>
      <span style={{ fontSize: 12, color: 'var(--t3)' }}>{isFav ? 'Campo de favorito. Não requer configuração.' : 'Gera colunas criado_em e atualizado_em automaticamente.'}</span>
    </div>
  )
}

export function CampoPainelDivisor({ campo, setCampos, atualizarCampo, salvando }) {
  return (
    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="form-group">
        <label className="form-label">Título (opcional)</label>
        <input className="form-input" value={campo.label} onChange={e => atualizarCampo(campo._key, 'label', e.target.value)} placeholder="Ex: Endereço" disabled={salvando} />
      </div>
      <div className="form-group">
        <label className="form-label">Orientação</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ label: 'Horizontal', val: 'horizontal' }, { label: 'Vertical', val: 'vertical' }].map(({ label, val }) => (
            <button key={val} className={`btn ${(campo.valorPadrao || 'horizontal') === val ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, height: 32 }}
              onClick={() => setCampos(prev => prev.map(c => c._key !== campo._key ? c : { ...c, valorPadrao: val, w_px: val === 'vertical' ? 24 : Math.max(c.h_px || 24, 120), h_px: val === 'vertical' ? Math.max(c.w_px || 120, 120) : 24 }))}
              disabled={salvando}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CampoPainelCopiar({ campo, campos, atualizarCampo, salvando }) {
  const camposTexto = campos.filter(c => c._key !== campo._key && ['texto', 'texto_longo'].includes(c.tipo) && c.nomeCampo)
  return (
    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="form-group">
        <label className="form-label">Texto do botão</label>
        <input className="form-input" value={campo.label} onChange={e => atualizarCampo(campo._key, 'label', e.target.value)} placeholder="Copiar" disabled={salvando} />
      </div>
      <div className="form-group">
        <label className="form-label">Campo a copiar</label>
        <select className="form-select" value={campo.valorPadrao || ''} onChange={e => atualizarCampo(campo._key, 'valorPadrao', e.target.value)} disabled={salvando}>
          <option value="">— selecione —</option>
          {camposTexto.map(c => <option key={c._key} value={c.nomeCampo}>{c.label || c.nomeCampo}</option>)}
        </select>
      </div>
    </div>
  )
}
