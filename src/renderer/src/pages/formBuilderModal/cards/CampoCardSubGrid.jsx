import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { TIPO_META, TIPOS } from '../constants.js'
import { DelBtn } from './CampoCardSimples.jsx'

// Tipos escalares elegíveis para uma coluna filha de sub_grid — exclui
// sub_grid (sem aninhamento, v1) e os tipos de sistema/layout que não fazem
// sentido numa linha de grade.
const TIPOS_SUBGRID = TIPOS.filter(t => !['sub_grid'].includes(t.valor))

function slugify(s) {
  return (s || '').toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

export function CampoCardSubGrid({ campo, idx, setCampos, atualizarCampo, isExp, toggleExpand, tipInfoIdx, setTipInfoIdx, salvando, nomeTabelaPai }) {
  const meta = TIPO_META.sub_grid
  const cfg = (campo.opcoes && !Array.isArray(campo.opcoes)) ? campo.opcoes : { subGridTabela: '', subGridParentColuna: '', subGridCampos: [] }
  const subCampos = cfg.subGridCampos || []
  const lbl = { fontSize: 9, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }

  function setSg(updates) {
    setCampos(prev => prev.map(c => c._key !== campo._key ? c : { ...c, opcoes: { ...cfg, ...updates } }))
  }

  function garantirConfigInicial() {
    if (cfg.subGridTabela) return cfg
    const slugLabel = slugify(campo.label || campo.nomeCampo || 'itens')
    const tabelaBase = nomeTabelaPai || 'tela'
    const novaCfg = {
      subGridTabela: `${tabelaBase}_${slugLabel}`,
      subGridParentColuna: `${slugify(tabelaBase)}_id`,
      subGridCampos: [],
    }
    setSg(novaCfg)
    return novaCfg
  }

  function addSubCampo() {
    const atual = garantirConfigInicial()
    const novos = [...(atual.subGridCampos || []), {
      nomeCampo: `campo_${(atual.subGridCampos?.length || 0) + 1}`,
      label: '', tipo: 'texto', obrigatorio: false, ordem: atual.subGridCampos?.length || 0,
    }]
    setSg({ subGridCampos: novos })
  }

  function updateSubCampo(i, patch) {
    const novos = subCampos.map((c, ci) => ci === i ? { ...c, ...patch } : c)
    setSg({ subGridCampos: novos })
  }

  function removeSubCampo(i) {
    setSg({ subGridCampos: subCampos.filter((_, ci) => ci !== i) })
  }

  const aviso = !subCampos.length

  return (
    <div key={campo._key}
      style={{ background: isExp ? 'var(--s2)' : 'var(--s1)', border: `1px solid ${aviso ? '#fb923c' : isExp ? meta.color : 'var(--bd)'}`, borderLeft: `3px solid ${aviso ? '#fb923c' : meta.color}`, borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--sh-xs)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 10px', cursor: 'pointer' }}
        onClick={() => { if (!cfg.subGridTabela) garantirConfigInicial(); toggleExpand(campo._key) }}>
        <span style={{ fontSize: 9, fontWeight: 700, background: meta.color + '22', color: meta.color, padding: '3px 6px', borderRadius: 5, flexShrink: 0, minWidth: 30, textAlign: 'center', border: `1px solid ${meta.color}44`, lineHeight: 1 }}>{meta.short}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: campo.label ? 'var(--t1)' : 'var(--t3)', fontStyle: campo.label ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {campo.label || 'Grade de Itens'}
        </span>
        <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>{subCampos.length} coluna{subCampos.length !== 1 ? 's' : ''}</span>
        <ChevronDown size={12} color="var(--t3)" style={{ transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
        <DelBtn campo={campo} idx={idx} setCampos={setCampos} tipInfoIdx={tipInfoIdx} setTipInfoIdx={setTipInfoIdx} salvando={salvando} />
      </div>
      {isExp && (
        <div style={{ padding: '12px', borderTop: `1px solid ${meta.color}33`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="form-group">
            <label className="form-label">Label *</label>
            <input className="form-input" style={{ height: 32 }} value={campo.label}
              onChange={e => atualizarCampo(campo._key, 'label', e.target.value)} placeholder="Ex: Parcelas" disabled={salvando} />
          </div>

          <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'monospace' }}>
            Tabela filha: {cfg.subGridTabela || '—'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={lbl}>Colunas da grade</span>
            <button type="button" className="btn btn-ghost" style={{ height: 26, padding: '0 8px', fontSize: 11 }}
              onClick={addSubCampo} disabled={salvando}>
              <Plus size={11} /> Adicionar coluna
            </button>
          </div>

          {subCampos.map((sc, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: 6, alignItems: 'center', padding: '6px 8px', background: 'var(--s1)', borderRadius: 6, border: '1px solid var(--bd)' }}>
              <input className="form-input" style={{ height: 28, fontSize: 11 }} value={sc.label}
                onChange={e => updateSubCampo(i, { label: e.target.value, nomeCampo: sc.nomeCampo === `campo_${i + 1}` || !sc.nomeCampo ? slugify(e.target.value) : sc.nomeCampo })}
                placeholder="Label da coluna" disabled={salvando} />
              <input className="form-input" style={{ height: 28, fontSize: 11, fontFamily: 'monospace' }} value={sc.nomeCampo}
                onChange={e => updateSubCampo(i, { nomeCampo: slugify(e.target.value) })}
                placeholder="nome_no_banco" disabled={salvando} />
              <select className="form-select" style={{ height: 28, fontSize: 11 }} value={sc.tipo}
                onChange={e => updateSubCampo(i, { tipo: e.target.value })} disabled={salvando}>
                {TIPOS_SUBGRID.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--t3)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={!!sc.obrigatorio} onChange={e => updateSubCampo(i, { obrigatorio: e.target.checked })} disabled={salvando} style={{ accentColor: 'var(--or)' }} />
                Obrig.
              </label>
              <button type="button" className="btn btn-danger" style={{ height: 26, width: 26, padding: 0 }}
                onClick={() => removeSubCampo(i)} disabled={salvando}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}

          {aviso && <div style={{ fontSize: 11, color: '#fb923c', padding: '6px 10px', background: 'rgba(251,146,60,.08)', borderRadius: 6, border: '1px solid rgba(251,146,60,.25)' }}>
            ⚠ Adicione pelo menos uma coluna antes de salvar.
          </div>}
        </div>
      )}
    </div>
  )
}
