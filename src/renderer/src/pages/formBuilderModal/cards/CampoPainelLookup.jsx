export function CampoPainelLookup({ campo, setCampos, atualizarCampo, salvando, lookupColMap, carregarColunasLookup, telasList, meta }) {
  const cfg = (campo.opcoes && !Array.isArray(campo.opcoes)) ? campo.opcoes : { lookupTabela: '', lookupExibir: '', lookupCodigo: '', lookupModo: 'select' }
  const cols = lookupColMap[cfg.lookupTabela] || []
  function setLkp(updates) { setCampos(prev => prev.map(c => c._key !== campo._key ? c : { ...c, opcoes: { ...cfg, ...updates } })) }
  return (
    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="form-group">
          <label className="form-label">Label *</label>
          <input className="form-input" value={campo.label} onChange={e => atualizarCampo(campo._key, 'label', e.target.value)} disabled={salvando} />
        </div>
        <div className="form-group">
          <label className="form-label">Nome no banco (sem _id) *</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input className="form-input" style={{ fontFamily: 'monospace', fontSize: 11 }} value={campo.nomeCampo.replace(/_id$/, '')}
              onChange={e => atualizarCampo(campo._key, 'nomeCampo', e.target.value.replace(/_id$/, ''))} placeholder="banco" disabled={salvando} />
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--t3)', flexShrink: 0 }}>_id</span>
          </div>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Tabela de origem *</label>
        <select className="form-select" value={cfg.lookupTabela} disabled={salvando}
          onChange={e => { const t = e.target.value; setLkp({ lookupTabela: t, lookupExibir: '', lookupCodigo: '' }); carregarColunasLookup(t) }}>
          <option value="">Selecione</option>
          {telasList.map(t => <option key={t.id} value={t.nome_tabela}>{t.nome_tela}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="form-group">
          <label className="form-label">Campo a exibir *</label>
          <select className="form-select" value={cfg.lookupExibir} disabled={salvando || !cfg.lookupTabela} onChange={e => setLkp({ lookupExibir: e.target.value })}>
            <option value="">Selecione a tabela primeiro</option>
            {cols.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Campo de código (prefixo)</label>
          <select className="form-select" value={cfg.lookupCodigo || ''} disabled={salvando || !cfg.lookupTabela} onChange={e => setLkp({ lookupCodigo: e.target.value || '' })}>
            <option value="">Nenhum</option>
            {cols.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Modo</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ val: 'select', label: 'Select simples' }, { val: 'modal', label: 'Modal de pesquisa' }].map(m => (
            <label key={m.val} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
              <input type="radio" name={`lkp_modo_${campo._key}`} value={m.val} checked={cfg.lookupModo === m.val} onChange={() => setLkp({ lookupModo: m.val })} disabled={salvando} style={{ accentColor: meta.color }} />
              {m.label}
            </label>
          ))}
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={!!campo.obrigatorio} onChange={e => atualizarCampo(campo._key, 'obrigatorio', e.target.checked)} disabled={salvando} style={{ accentColor: 'var(--or)' }} />
        Obrigatório
      </label>
    </div>
  )
}
