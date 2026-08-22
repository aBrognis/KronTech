import { useState, useEffect } from 'react'
import { Paperclip, Plus, Trash2, ExternalLink, FileText } from 'lucide-react'
import { notificar } from '../Notificacao'

function fmtTamanho(bytes) {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const EXT_IMAGEM = ['png', 'jpg', 'jpeg', 'gif', 'webp']

const TIPOS_ANEXO = [
  { valor: 'generico',    label: 'Genérico'         },
  { valor: 'certificado', label: 'Certificado'      },
  { valor: 'qrcode_2fa',  label: 'QR Code 2FA'      },
  { valor: 'contrato',    label: 'Contrato'         },
]

export default function AnexosPainel({ credencialId, usuarioNome, disabled }) {
  const [anexos, setAnexos] = useState([])
  const [loading, setLoading] = useState(true)
  const [adicionando, setAdicionando] = useState(false)

  useEffect(() => { carregar() }, [credencialId])

  async function carregar() {
    setLoading(true)
    const res = await window.api.cofreSenhaAnexos.listar(credencialId)
    setAnexos(res.ok ? res.data || [] : [])
    setLoading(false)
  }

  async function adicionar(tipoAnexo) {
    setAdicionando(true)
    try {
      const res = await window.api.cofreSenhaAnexos.adicionar({ credencialId, tipoAnexo, usuarioNome })
      if (res?.ok === false) {
        if (res.erro !== 'Seleção cancelada.') notificar.erro('Erro ao anexar: ' + res.erro)
        return
      }
      await carregar()
    } finally {
      setAdicionando(false)
    }
  }

  async function remover(anexo) {
    const ok = await notificar.confirmar(`Remover o anexo "${anexo.nome_original}"?`, { titulo: 'Remover anexo', confirmarLabel: 'Remover', perigo: true })
    if (!ok) return
    await window.api.cofreSenhaAnexos.remover(anexo.id)
    await carregar()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Paperclip size={12} /> Anexos
        </label>
        {!disabled && (
          <div style={{ display: 'flex', gap: 4 }}>
            {TIPOS_ANEXO.map(t => (
              <button key={t.valor} type="button" className="btn btn-ghost" disabled={adicionando}
                onClick={() => adicionar(t.valor)}
                style={{ height: 26, fontSize: 10.5, padding: '0 8px' }}>
                <Plus size={11} /> {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>Carregando...</div>
      ) : anexos.length === 0 ? (
        <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>Nenhum anexo neste registro.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {anexos.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', border: '1px solid var(--bd)', borderRadius: 8, background: 'var(--s2)' }}>
              {EXT_IMAGEM.includes(a.extensao) ? (
                <img src={`file://${a.caminho}`} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={14} color="var(--t3)" />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome_original}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)' }}>
                  {TIPOS_ANEXO.find(t => t.valor === a.tipo_anexo)?.label || a.tipo_anexo} · {fmtTamanho(a.tamanho_bytes)}
                  {a.criado_por ? ` · ${a.criado_por}` : ''}
                </div>
              </div>
              <button type="button" onClick={() => window.api.arquivos.abrir(a.caminho)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 4 }} title="Abrir">
                <ExternalLink size={13} />
              </button>
              {!disabled && (
                <button type="button" onClick={() => remover(a)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', display: 'flex', padding: 4 }} title="Remover">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
