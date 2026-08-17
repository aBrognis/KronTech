import { ChevronDown } from 'lucide-react'
import { TIPO_META } from '../constants.js'
import { DelBtn } from './CampoCardSimples.jsx'

export function CampoCardLookup({ campo, idx, setCampos, atualizarCampo, isExp, toggleExpand, tipInfoIdx, setTipInfoIdx, salvando, lookupColMap, carregarColunasLookup, telasList }) {
  const meta = TIPO_META.lookup
  const cfg = (campo.opcoes && !Array.isArray(campo.opcoes)) ? campo.opcoes : { lookupTabela: '', lookupExibir: '', lookupCodigo: '', lookupModo: 'select' }
  const cols = lookupColMap[cfg.lookupTabela] || []
  const dbName = campo.nomeCampo ? campo.nomeCampo.replace(/_id$/, '') + '_id' : ''
  const lbl = { fontSize: 9, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }
  function setLkp(updates) {
    setCampos(prev => prev.map(c => c._key !== campo._key ? c : { ...c, opcoes: { ...cfg, ...updates } }))
  }
  const aviso = cfg.lookupTabela && !cfg.lookupExibir
  return (
    <div key={campo._key}
      style={{ background: isExp ? 'var(--s2)' : 'var(--s1)', border: `1px solid ${aviso ? '#fb923c' : isExp ? meta.color : 'var(--bd)'}`, borderLeft: `3px solid ${aviso ? '#fb923c' : meta.color}`, borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--sh-xs)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 10px', cursor: 'pointer' }}
        onClick={() => toggleExpand(campo._key)}>
        <span style={{ fontSize: 9, fontWeight: 700, background: meta.color + '22', color: meta.color, padding: '3px 6px', borderRadius: 5, flexShrink: 0, minWidth: 30, textAlign: 'center', border: `1px solid ${meta.color}44`, lineHeight: 1 }}>{meta.short}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: campo.label ? 'var(--t1)' : 'var(--t3)', fontStyle: campo.label ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {campo.label || 'Lookup'}
        </span>
        <code style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--t3)', background: 'var(--s3)', padding: '2px 6px', borderRadius: 3, flexShrink: 0 }}>{dbName}</code>
        {cfg.lookupTabela
          ? <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>→ {cfg.lookupTabela}</span>
          : <span style={{ fontSize: 9, color: '#fb923c', flexShrink: 0 }}>não configurado</span>}
        <ChevronDown size={12} color="var(--t3)" style={{ transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
        <DelBtn campo={campo} idx={idx} setCampos={setCampos} tipInfoIdx={tipInfoIdx} setTipInfoIdx={setTipInfoIdx} salvando={salvando} />
      </div>
      {isExp && (
        <div style={{ padding: '12px', borderTop: `1px solid ${meta.color}33`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="form-group">
              <label className="form-label">Label *</label>
              <input className="form-input" style={{ height: 32 }} value={campo.label}
                onChange={e => atualizarCampo(campo._key, 'label', e.target.value)} placeholder="Ex: Banco" disabled={salvando} />
            </div>
            <div className="form-group">
              <label className="form-label">Nome no Banco (sem _id) *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input className="form-input" style={{ height: 32, flex: 1, fontFamily: 'monospace', fontSize: 11 }} value={campo.nomeCampo.replace(/_id$/, '')}
                  onChange={e => atualizarCampo(campo._key, 'nomeCampo', e.target.value.replace(/_id$/, ''))}
                  placeholder="banco" disabled={salvando} />
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--t3)', flexShrink: 0 }}>_id</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div className="form-group">
              <label className="form-label">Tabela de origem *</label>
              <select className="form-select" style={{ height: 32 }} value={cfg.lookupTabela} disabled={salvando}
                onChange={e => { const t = e.target.value; setLkp({ lookupTabela: t, lookupExibir: '', lookupCodigo: '' }); carregarColunasLookup(t) }}>
                <option value="">Selecione</option>
                {telasList.map(t => <option key={t.id} value={t.nome_tabela}>{t.nome_tela}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Campo a exibir *</label>
              <select className="form-select" style={{ height: 32 }} value={cfg.lookupExibir} disabled={salvando || !cfg.lookupTabela}
                onChange={e => setLkp({ lookupExibir: e.target.value })}>
                <option value="">Selecione a tabela primeiro</option>
                {cols.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Campo de código (prefixo)</label>
              <select className="form-select" style={{ height: 32 }} value={cfg.lookupCodigo || ''} disabled={salvando || !cfg.lookupTabela}
                onChange={e => setLkp({ lookupCodigo: e.target.value || '' })}>
                <option value="">Nenhum</option>
                {cols.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={lbl}>Modo de exibição</span>
            {[{ val: 'select', label: 'Select simples' }, { val: 'modal', label: 'Modal de pesquisa' }].map(m => (
              <label key={m.val} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, cursor: 'pointer', userSelect: 'none' }}>
                <input type="radio" name={`lkp_modo_${campo._key}`} value={m.val} checked={cfg.lookupModo === m.val}
                  onChange={() => setLkp({ lookupModo: m.val })} disabled={salvando}
                  style={{ accentColor: meta.color, cursor: 'pointer' }} />
                {m.label}
              </label>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, cursor: 'pointer', userSelect: 'none', marginLeft: 16 }}>
              <input type="checkbox" checked={!!campo.obrigatorio} onChange={e => atualizarCampo(campo._key, 'obrigatorio', e.target.checked)} disabled={salvando} style={{ accentColor: 'var(--or)' }} />
              Obrigatório
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: 8 }}>
            <div className="form-group">
              <label className="form-label">Filtrar por (opcional)</label>
              <select className="form-select" style={{ height: 32 }} value={cfg.lookupFiltro?.campo || ''} disabled={salvando || !cfg.lookupTabela}
                onChange={e => setLkp({ lookupFiltro: e.target.value ? { campo: e.target.value, op: cfg.lookupFiltro?.op || 'ilike', valor: cfg.lookupFiltro?.valor || '' } : null })}>
                <option value="">Sem filtro</option>
                {cols.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Op.</label>
              <select className="form-select" style={{ height: 32 }} value={cfg.lookupFiltro?.op || 'ilike'} disabled={salvando || !cfg.lookupFiltro?.campo}
                onChange={e => setLkp({ lookupFiltro: { ...cfg.lookupFiltro, op: e.target.value } })}>
                <option value="ilike">contém</option>
                <option value="eq">igual a</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Valor</label>
              <input className="form-input" style={{ height: 32 }} value={cfg.lookupFiltro?.valor || ''} disabled={salvando || !cfg.lookupFiltro?.campo}
                onChange={e => setLkp({ lookupFiltro: { ...cfg.lookupFiltro, valor: e.target.value } })}
                placeholder="Ex: F (Fornecedor)" />
            </div>
          </div>
          {aviso && <div style={{ fontSize: 11, color: '#fb923c', padding: '6px 10px', background: 'rgba(251,146,60,.08)', borderRadius: 6, border: '1px solid rgba(251,146,60,.25)' }}>
            ⚠ Configure a tabela e o campo a exibir antes de salvar.
          </div>}
        </div>
      )}
    </div>
  )
}
