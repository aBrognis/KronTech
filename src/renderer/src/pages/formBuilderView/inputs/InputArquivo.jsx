import { useState, useEffect } from 'react'
import { Paperclip, ExternalLink, X, Upload, Download, Check, Clipboard, ImageIcon } from 'lucide-react'

// Campos de anexo: arquivo (com satélites _nome/_ext/_tamanho/_path) e imagem
// (preview inline via leitura base64). Ambos usam window.api.arquivos.*.

export function InputArquivoCampo({ campo, val, tela, isRO, saving, compact, fmtSize, copiado, setArquivoComSatellites, handleAbrirArquivo, handleCopiarLocal, handleCopiarClipboard }) {
  let arqMeta = null
  try { arqMeta = val ? JSON.parse(val) : null } catch { arqMeta = null }
  const subpasta = tela?.nome_tabela || 'anexos'
  if (compact) {
    // Layout designer: tudo dentro do container (espaço é fixo pelo usuário)
    return (
      <div className="form-input" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--s1)', cursor: 'default', fontSize: 12, color: arqMeta ? 'var(--t1)' : 'var(--t3)', overflow: 'hidden' }}>
        <Paperclip size={13} style={{ flexShrink: 0, color: arqMeta ? 'var(--or)' : 'var(--t3)' }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {arqMeta ? arqMeta.nome : (!isRO ? 'Selecionar arquivo...' : 'Sem arquivo')}
        </span>
        {arqMeta && <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>{fmtSize(arqMeta.tamanho)}</span>}
        {arqMeta && <button className="btn btn-ghost" style={{ flexShrink: 0, height: 24, fontSize: 11, padding: '0 6px' }} onClick={() => handleAbrirArquivo(arqMeta)}><ExternalLink size={11} /></button>}
        {!isRO && arqMeta && <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 2, flexShrink: 0 }} onClick={() => setArquivoComSatellites(campo.nome_campo, null)} title="Remover"><X size={12} /></button>}
        {!isRO && !arqMeta && <button className="btn btn-ghost" style={{ flexShrink: 0, height: 24, fontSize: 11, padding: '0 6px' }} onClick={async () => { const res = await window.api.arquivos.selecionarECopiar({ subpasta }); if (res?.ok) setArquivoComSatellites(campo.nome_campo, res) }} disabled={saving}><Upload size={11} /></button>}
      </div>
    )
  }
  // Layout grade: padrão idêntico ao Arquivos.jsx
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
      <div className="form-input" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s1)', cursor: 'default', fontSize: 12, color: arqMeta ? 'var(--t1)' : 'var(--t3)' }}>
        <Paperclip size={14} style={{ flexShrink: 0, color: arqMeta ? 'var(--or)' : 'var(--t3)' }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {arqMeta ? arqMeta.nome : 'Nenhum arquivo selecionado'}
        </span>
        {arqMeta && (
          <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>{fmtSize(arqMeta.tamanho)}</span>
        )}
      </div>
      {!isRO && !arqMeta && (
        <button className="btn btn-ghost" style={{ flexShrink: 0 }}
          onClick={async () => {
            const res = await window.api.arquivos.selecionarECopiar({ subpasta })
            if (res?.ok) setArquivoComSatellites(campo.nome_campo, res)
          }}
          disabled={saving}>
          <Upload size={13} /> Selecionar
        </button>
      )}
      {arqMeta && (
        <>
          <button className="btn btn-ghost" style={{ flexShrink: 0 }} onClick={() => handleAbrirArquivo(arqMeta)}>
            <ExternalLink size={13} /> Abrir
          </button>
          <button className="btn btn-ghost" style={{ flexShrink: 0 }} onClick={() => handleCopiarLocal(arqMeta)}>
            <Download size={13} /> Copiar Local
          </button>
          <button className="btn btn-ghost" style={{ flexShrink: 0 }} onClick={() => handleCopiarClipboard(arqMeta)}>
            {copiado === 'clip' ? <Check size={13} color="var(--green)" /> : <Clipboard size={13} />}
            {copiado === 'clip' ? 'Copiado!' : 'Copiar'}
          </button>
          {!isRO && (
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 4, flexShrink: 0 }}
              onClick={() => setArquivoComSatellites(campo.nome_campo, null)} title="Remover arquivo">
              <X size={13} />
            </button>
          )}
        </>
      )}
    </div>
  )
}

function ImagemCampo({ path, isRO, saving, onSelect, onClear }) {
  const [dataUrl, setDataUrl] = useState(null)
  useEffect(() => {
    if (!path) { setDataUrl(null); return }
    window.api.arquivos.lerBase64(path).then(r => r?.ok ? setDataUrl(r.dataUrl) : setDataUrl(null))
  }, [path])
  if (path && dataUrl) return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 80 }}>
      <img src={dataUrl} alt="imagem" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6, border: '1px solid var(--bd)' }} />
      {!isRO && (
        <>
          <button style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,.55)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', padding: '2px 6px', fontSize: 10 }} onClick={onClear}><X size={11} /></button>
          <button style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,.55)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', padding: '2px 6px', fontSize: 10 }} onClick={onSelect}><ImageIcon size={11} /></button>
        </>
      )}
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 80, background: 'var(--s2)', border: '1.5px dashed var(--bd)', borderRadius: 8, gap: 6, cursor: isRO ? 'default' : 'pointer' }}
      onClick={isRO || saving ? undefined : onSelect}>
      <ImageIcon size={24} style={{ color: 'var(--bd2)' }} />
      {!isRO && <span style={{ fontSize: 10, color: 'var(--t3)' }}>Clique para enviar imagem</span>}
    </div>
  )
}

export function InputImagem({ campo, val, tela, isRO, saving, setField }) {
  const subpasta = tela?.nome_tabela || 'anexos'
  const FILTROS_IMG = [{ name: 'Imagens', extensions: ['jpg','jpeg','png','gif','webp','svg','bmp'] }]
  const onSelect = async () => {
    const res = await window.api.arquivos.selecionarECopiar({ subpasta, filtros: FILTROS_IMG })
    if (res?.ok) setField(campo.nome_campo, res.path)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', height: '100%' }}>
      <ImagemCampo path={val} isRO={isRO} saving={saving} onSelect={onSelect} onClear={() => setField(campo.nome_campo, '')} />
    </div>
  )
}
