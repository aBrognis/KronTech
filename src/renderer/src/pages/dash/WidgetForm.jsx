import { ChevronDown, ChevronRight, Check, X, AlertCircle, Copy, Play, RefreshCw, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { LucideIcon } from './icons'
import { WidgetBody } from './chartTypes/WidgetBody'
import { TIPOS, PALETA, INTERVALOS } from './constants'
import { SQL_HINTS, SQL_GUIDE } from './sqlGuide'
import { IconPicker } from './IconPicker'

export function Label({ children, style }) {
  return (
    <div style={{ fontSize:10, fontWeight:600, letterSpacing:1, color:'var(--t3)', textTransform:'uppercase', marginBottom:6, ...style }}>
      {children}
    </div>
  )
}

// Corpo do formulário de criação/edição de widget do Designer — extraído
// para arquivo próprio para caber ao lado do preview ao vivo (painel 3).
export function WidgetForm({
  selected, form, f,
  previewRows, previewFields, previewErr, testing, onTestSql,
  testingPrev, prevPreviewRows, prevPreviewFields, prevPreviewErr, onTestSqlAnterior,
  saving, deleting, onSave, onDelete, onCancel,
}) {
  const [showGuide, setShowGuide] = useState(false)
  const guide   = SQL_GUIDE[form.tipo]
  const sqlHint = SQL_HINTS[form.tipo]

  return (
    <div style={{ maxWidth:680 }}>
      <div style={{ fontSize:15, fontWeight:700, color:'var(--t1)', marginBottom:24, letterSpacing:-.3 }}>
        {selected === 'new' ? 'Novo Widget' : 'Editar Widget'}
      </div>

      {/* ── Tipo ── */}
      <Label>Tipo de visualização</Label>
      <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:20 }}>
        {TIPOS.map(t => {
          const active = form.tipo === t.value
          return (
            <button
              key={t.value}
              onClick={() => f('tipo', t.value)}
              title={t.desc}
              style={{
                display:'flex', alignItems:'center', gap:6, padding:'7px 13px',
                borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:500, transition:'all .12s',
                border: active ? '1.5px solid var(--or)' : '1.5px solid var(--bd)',
                background: active ? 'var(--or3)' : 'var(--s2)',
                color: active ? 'var(--or)' : 'var(--t2)',
              }}
            >
              <LucideIcon name={t.icon} size={12} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Título + Ícone ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 210px', gap:14, marginBottom:16 }}>
        <div>
          <Label>Título</Label>
          <input
            className="form-input"
            value={form.titulo}
            onChange={e => f('titulo', e.target.value)}
            placeholder="Ex: Total de O.S. abertas"
            style={{ width:'100%' }}
          />
        </div>
        <div>
          <Label>Ícone Lucide</Label>
          <IconPicker value={form.icone_lucide} onChange={v => f('icone_lucide', v)} color={form.cor} />
        </div>
      </div>

      {/* ── Cor + Intervalo ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        <div>
          <Label>Cor de destaque</Label>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
            {PALETA.map(c => (
              <button
                key={c}
                onClick={() => f('cor', c)}
                style={{ width:22, height:22, borderRadius:'50%', background:c, border: form.cor===c ? '2.5px solid var(--t1)' : '2px solid transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'transform .1s', transform: form.cor===c ? 'scale(1.18)' : 'scale(1)' }}
              >
                {form.cor === c && <Check size={10} color="#fff" strokeWidth={3} />}
              </button>
            ))}
            <input
              type="color"
              value={form.cor}
              onChange={e => f('cor', e.target.value)}
              title="Cor personalizada"
              style={{ width:22, height:22, borderRadius:'50%', border:'none', cursor:'pointer', padding:0, background:'none' }}
            />
          </div>
        </div>
        <div>
          <Label>Auto-atualização</Label>
          <select className="form-select" value={form.intervalo} onChange={e => f('intervalo', Number(e.target.value))} style={{ width:'100%', height:37 }}>
            {INTERVALOS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Tamanho do card ── */}
      <div style={{ marginBottom:20 }}>
        <Label>Tamanho do card</Label>
        <div style={{ display:'flex', alignItems:'center', gap:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, color:'var(--t3)', width:52 }}>Largura</span>
            <input
              type="range" min={2} max={12} step={1}
              value={form.grid_w}
              onChange={e => f('grid_w', Number(e.target.value))}
              style={{ width:120 }}
            />
            <span style={{ fontSize:11, color:'var(--t1)', fontWeight:600, width:44 }}>{form.grid_w}/12</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, color:'var(--t3)', width:52 }}>Altura</span>
            <input
              type="range" min={1} max={8} step={1}
              value={form.grid_h}
              onChange={e => f('grid_h', Number(e.target.value))}
              style={{ width:120 }}
            />
            <span style={{ fontSize:11, color:'var(--t1)', fontWeight:600 }}>{form.grid_h} lin.</span>
          </div>
        </div>
        <div style={{ fontSize:10, color:'var(--t3)', marginTop:8 }}>
          Veja o tamanho real no dashboard ao lado — também dá para arrastar o canto do card.
        </div>
      </div>

      {/* ── SQL ── */}
      <div style={{ marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <Label style={{ marginBottom:0 }}>Query SQL</Label>
          <div style={{ display:'flex', gap:10 }}>
            {!form.sql_query && sqlHint && (
              <button
                onClick={() => f('sql_query', sqlHint)}
                style={{ fontSize:10, color:'var(--or)', background:'none', border:'none', cursor:'pointer' }}
              >
                Inserir exemplo
              </button>
            )}
            <button
              onClick={() => setShowGuide(v => !v)}
              style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, color:'var(--t3)', background:'none', border:'none', cursor:'pointer' }}
            >
              {showGuide ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              Guia SQL
            </button>
          </div>
        </div>

        {showGuide && guide && (
          <div style={{ marginBottom:8, padding:'12px 14px', background:'var(--s2)', borderRadius:8, border:'1px solid var(--bd)', fontSize:11 }}>
            <div style={{ color:'var(--t2)', marginBottom:10, fontWeight:500, lineHeight:1.5 }}>{guide.regra}</div>
            {guide.exemplos.map((ex, i) => (
              <div key={i} style={{ marginBottom: i < guide.exemplos.length-1 ? 10 : 0 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:10, fontWeight:600, color:'var(--t3)', textTransform:'uppercase', letterSpacing:.5 }}>{ex.label}</span>
                  <button
                    onClick={() => { f('sql_query', ex.sql); setShowGuide(false) }}
                    style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'var(--or)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}
                  >
                    <Copy size={9} />Usar este
                  </button>
                </div>
                <pre style={{ margin:0, padding:'7px 10px', background:'var(--s3)', borderRadius:5, fontSize:10, color:'var(--t2)', overflowX:'auto', whiteSpace:'pre-wrap', wordBreak:'break-all', fontFamily:'monospace', lineHeight:1.6 }}>{ex.sql}</pre>
              </div>
            ))}
          </div>
        )}

        <textarea
          className="form-textarea"
          value={form.sql_query}
          onChange={e => f('sql_query', e.target.value)}
          placeholder={sqlHint || 'SELECT ...'}
          spellCheck={false}
          style={{ width:'100%', height:120, fontFamily:'monospace', fontSize:11, resize:'vertical', lineHeight:1.65 }}
        />

        <div style={{ display:'flex', gap:8, marginTop:7, alignItems:'center' }}>
          <button
            onClick={onTestSql}
            disabled={testing || !form.sql_query.trim()}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 13px', borderRadius:7, border:'1px solid var(--bd)', background:'var(--s2)', color:'var(--t1)', cursor: testing||!form.sql_query.trim() ? 'not-allowed' : 'pointer', fontSize:11, fontWeight:500, opacity: !form.sql_query.trim() ? .5 : 1 }}
          >
            {testing
              ? <RefreshCw size={11} style={{ animation:'spin .7s linear infinite' }} />
              : <Play size={11} />
            }
            Testar SQL
          </button>
          {previewRows && (
            <span style={{ fontSize:10, color:'var(--t3)' }}>
              {previewRows.length} linha{previewRows.length!==1?'s':''} · {previewFields.length} coluna{previewFields.length!==1?'s':''}
            </span>
          )}
          {previewErr && (
            <div style={{ display:'flex', alignItems:'center', gap:4, color:'#F87171', fontSize:10, flex:1, overflow:'hidden' }}>
              <AlertCircle size={11} style={{ flexShrink:0 }} />
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{previewErr}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Comparação com período anterior ── */}
      <div style={{ marginBottom:20, padding:'12px 14px', border:'1px solid var(--bd)', borderRadius:10, background:'var(--s2)' }}>
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:12, fontWeight:600, color:'var(--t1)' }}>
          <input
            type="checkbox"
            checked={form.comparar_anterior}
            onChange={e => f('comparar_anterior', e.target.checked)}
            style={{ width:14, height:14, cursor:'pointer' }}
          />
          Comparar com período anterior
        </label>
        {form.comparar_anterior && (
          <div style={{ marginTop:10 }}>
            <div style={{ fontSize:10, color:'var(--t3)', marginBottom:6, lineHeight:1.5 }}>
              Escreva uma query que retorne o mesmo formato de colunas, referente ao período anterior.
              Para gráficos, as categorias devem estar na mesma ordem da query principal.
            </div>
            <textarea
              className="form-textarea"
              value={form.sql_query_anterior}
              onChange={e => f('sql_query_anterior', e.target.value)}
              placeholder="SELECT ... (mesmo formato, período anterior)"
              spellCheck={false}
              style={{ width:'100%', height:90, fontFamily:'monospace', fontSize:11, resize:'vertical', lineHeight:1.65 }}
            />
            <div style={{ display:'flex', gap:8, marginTop:7, alignItems:'center' }}>
              <button
                type="button"
                onClick={onTestSqlAnterior}
                disabled={testingPrev || !form.sql_query_anterior.trim()}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 13px', borderRadius:7, border:'1px solid var(--bd)', background:'var(--s3)', color:'var(--t1)', cursor: testingPrev||!form.sql_query_anterior.trim() ? 'not-allowed' : 'pointer', fontSize:11, fontWeight:500, opacity: !form.sql_query_anterior.trim() ? .5 : 1 }}
              >
                {testingPrev
                  ? <RefreshCw size={11} style={{ animation:'spin .7s linear infinite' }} />
                  : <Play size={11} />
                }
                Testar SQL
              </button>
              {prevPreviewRows && (
                <span style={{ fontSize:10, color:'var(--t3)' }}>
                  {prevPreviewRows.length} linha{prevPreviewRows.length!==1?'s':''} · {prevPreviewFields.length} coluna{prevPreviewFields.length!==1?'s':''}
                </span>
              )}
              {prevPreviewErr && (
                <div style={{ display:'flex', alignItems:'center', gap:4, color:'#F87171', fontSize:10, flex:1, overflow:'hidden' }}>
                  <AlertCircle size={11} style={{ flexShrink:0 }} />
                  <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{prevPreviewErr}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Preview isolado (mantido como fallback visual quando o SQL foi testado manualmente) ── */}
      {previewRows && previewRows.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <Label>Pré-visualização</Label>
          <div style={{ background:'var(--s2)', borderRadius:10, border:'1px solid var(--bd)', padding:'14px 16px', minHeight:90, position:'relative' }}>
            <WidgetBody
              widget={form}
              rows={previewRows}
              fields={previewFields}
              prevRows={prevPreviewRows}
              prevFields={prevPreviewFields}
              fillHeight={false}
            />
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display:'flex', gap:10, paddingTop:18, borderTop:'1px solid var(--bd)', marginTop:6 }}>
        <button
          className="btn btn-primary"
          onClick={onSave}
          disabled={saving || !form.titulo.trim()}
          style={{ display:'flex', alignItems:'center', gap:6 }}
        >
          {saving
            ? <RefreshCw size={12} style={{ animation:'spin .7s linear infinite' }} />
            : <Save size={12} />
          }
          {selected === 'new' ? 'Criar Widget' : 'Salvar Alterações'}
        </button>

        {selected !== 'new' && (
          <button
            onClick={onDelete}
            disabled={!!deleting}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid #EF444466', background:'transparent', color:'#F87171', cursor:'pointer', fontSize:12, fontWeight:500 }}
          >
            <Trash2 size={12} />
            Excluir Widget
          </button>
        )}

        <button
          onClick={onCancel}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:8, border:'1px solid var(--bd)', background:'transparent', color:'var(--t3)', cursor:'pointer', fontSize:12 }}
        >
          <X size={12} />
          Cancelar
        </button>
      </div>
    </div>
  )
}
