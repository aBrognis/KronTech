import { useState } from 'react'
import { X } from 'lucide-react'
import { TEMPLATES } from './templates.js'
import { IconPreview } from './_shared.jsx'

export default function TemplateModal({ onSelecionar, onFechar }) {
  const categorias = [...new Set(TEMPLATES.map(t => t.categoria))]
  const [catAtiva, setCatAtiva] = useState(null)
  const lista = catAtiva ? TEMPLATES.filter(t => t.categoria === catAtiva) : TEMPLATES
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, width: 700, maxWidth: '95vw', maxHeight: '88vh', boxShadow: 'var(--sh-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--bd)', background: 'var(--s2)', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)' }}>Escolher Template</span>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex' }}><X size={16} /></button>
        </div>
        {/* filtro por categoria */}
        <div style={{ padding: '10px 20px 0', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
          <button onClick={() => setCatAtiva(null)}
            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer',
              borderColor: catAtiva === null ? 'var(--or)' : 'var(--bd)',
              background: catAtiva === null ? 'rgba(255,107,43,.12)' : 'var(--s2)',
              color: catAtiva === null ? 'var(--or)' : 'var(--t2)', fontWeight: catAtiva === null ? 700 : 400 }}>
            Todos
          </button>
          {categorias.map(cat => (
            <button key={cat} onClick={() => setCatAtiva(cat === catAtiva ? null : cat)}
              style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer',
                borderColor: catAtiva === cat ? 'var(--or)' : 'var(--bd)',
                background: catAtiva === cat ? 'rgba(255,107,43,.12)' : 'var(--s2)',
                color: catAtiva === cat ? 'var(--or)' : 'var(--t2)', fontWeight: catAtiva === cat ? 700 : 400 }}>
              {cat}
            </button>
          ))}
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
          {lista.map(t => (
            <div key={t.id}
              onClick={() => onSelecionar(t)}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 16px', background: 'var(--s2)', border: '1.5px solid var(--bd)', borderRadius: 12, cursor: 'pointer', transition: 'border-color .15s, background .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--or)'; e.currentTarget.style.background = 'rgba(255,107,43,.04)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.background = 'var(--s2)' }}>
              <div style={{ width: 40, height: 40, flexShrink: 0, background: 'rgba(255,107,43,.1)', border: '1.5px solid rgba(255,107,43,.25)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--or)' }}>
                <IconPreview name={t.icone || 'layout-template'} size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)' }}>{t.label}</span>
                  <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: 'var(--s3)', color: 'var(--t3)', border: '1px solid var(--bd)' }}>{t.categoria}</span>
                  {t.tipo === 'duplo'
                    ? <span style={{ fontSize: 10, color: 'var(--or)', fontWeight: 600 }}>tela dupla</span>
                    : <span style={{ fontSize: 10, color: 'var(--t3)' }}>{t.campos.length} campos</span>}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 6 }}>{t.descricao}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {t.tipo === 'duplo' ? (
                    t.paineis.map(p => (
                      <span key={p.tabela} style={{ fontSize: 9.5, fontFamily: 'monospace', background: p.cor+'22', border: `1px solid ${p.cor}55`, borderRadius: 4, padding: '1px 8px', color: p.cor, fontWeight: 600 }}>
                        {p.titulo}
                      </span>
                    ))
                  ) : (
                    <>
                      {t.campos.filter(c => !['divisor','timestamps','favorito'].includes(c.tipo)).slice(0, 8).map(c => (
                        <span key={c._key} style={{ fontSize: 9.5, fontFamily: 'monospace', background: 'var(--s3)', border: '1px solid var(--bd)', borderRadius: 4, padding: '1px 6px', color: 'var(--t2)' }}>
                          {c.tipo === 'calculo' ? '⚡' : ''}{c.nomeCampo}
                        </span>
                      ))}
                      {t.campos.filter(c => !['divisor','timestamps','favorito'].includes(c.tipo)).length > 8 && (
                        <span style={{ fontSize: 9.5, color: 'var(--t3)', padding: '1px 4px' }}>+{t.campos.filter(c => !['divisor','timestamps','favorito'].includes(c.tipo)).length - 8}</span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--or)', fontWeight: 600, flexShrink: 0, alignSelf: 'center' }}>Usar →</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
