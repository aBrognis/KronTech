import { X, ExternalLink, Paperclip } from 'lucide-react'

const PREVIEW_IMG = ['png','jpg','jpeg','gif','bmp','webp','svg']
const PREVIEW_PDF = ['pdf']

export default function ModalPreviewArquivo({ preview, onAbrirExterno, onFechar }) {
  const ext = (preview.ext || '').toLowerCase()
  const tipo = PREVIEW_IMG.includes(ext) ? 'img' : PREVIEW_PDF.includes(ext) ? 'pdf' : null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onFechar() }}>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14, boxShadow: 'var(--sh-lg)', width: '90vw', height: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', background: 'var(--s2)', borderBottom: '1px solid var(--bd)', flexShrink: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview.nome}</span>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button className="btn btn-ghost" onClick={() => onAbrirExterno(preview)}><ExternalLink size={13} /> Abrir externamente</button>
            <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 2 }}><X size={15} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 8 }}>
          {tipo === 'img' && <img src={`file://${preview.path}`} alt={preview.nome} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />}
          {tipo === 'pdf' && <iframe src={`file://${preview.path}`} style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }} title={preview.nome} />}
          {!tipo && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--t3)' }}>
              <Paperclip size={40} strokeWidth={1} />
              <span style={{ fontSize: 13 }}>Preview não disponível para arquivos <strong style={{ color: 'var(--t1)' }}>.{ext.toUpperCase()}</strong></span>
              <button className="btn btn-ghost" onClick={() => onAbrirExterno(preview)}><ExternalLink size={13} /> Abrir com aplicativo padrão</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
