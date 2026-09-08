import { useState } from 'react'
import { Paperclip, Trash2, ExternalLink, Plus } from 'lucide-react'
import { FormGrid, Secao, CampoSelect } from '../../components/cadastroPadrao/TelaCadastroPadrao'
import { notificar } from '../../components/Notificacao'
import { CATEGORIAS_ANEXO } from './utils'

function fmtSize(b) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 ** 2).toFixed(1)} MB`
}

export default function AbaAnexos({ form, setForm, isRO }) {
  const [categoria, setCategoria] = useState('contrato')
  const [enviando, setEnviando] = useState(false)

  async function adicionar() {
    if (!form.id) { notificar.aviso('Grave a entidade antes de anexar arquivos.'); return }
    setEnviando(true)
    try {
      const res = await window.api.entidade.adicionarAnexo({ entidadeId: form.id, categoria })
      if (res.cancelado) return
      if (!res.ok) { notificar.erro(res.erro || 'Falha ao anexar.'); return }
      setForm((f) => ({ ...f, anexos: [res.data, ...(f.anexos || [])] }))
    } finally {
      setEnviando(false)
    }
  }

  async function remover(id) {
    const res = await window.api.entidade.removerAnexo(id)
    if (res.ok) setForm((f) => ({ ...f, anexos: (f.anexos || []).filter((a) => a.id !== id) }))
  }

  return (
    <FormGrid>
      <Secao titulo="Documentos da entidade" largura="full" cols="1fr">
        {!form.id ? (
          <div style={{ fontSize: 12.5, color: 'var(--t3)', padding: 16 }}>Grave a entidade para anexar documentos.</div>
        ) : (
          <div>
            {!isRO && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'end', marginBottom: 12 }}>
                <div className="form-group" style={{ margin: 0, width: 200 }}>
                  <label className="form-label">Categoria</label>
                  <select className="form-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                    {CATEGORIAS_ANEXO.map((c) => <option key={c.valor} value={c.valor}>{c.label}</option>)}
                  </select>
                </div>
                <button className="btn btn-ghost" style={{ height: 34 }} onClick={adicionar} disabled={enviando}>
                  <Plus size={13} /> {enviando ? 'Enviando...' : 'Anexar arquivo'}
                </button>
              </div>
            )}

            <div style={{ border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden', background: 'var(--s1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: 'var(--s1)' }}>
                    {['Arquivo', 'Categoria', 'Tamanho', 'Data', ''].map((h, i) => (
                      <th key={i} style={{ padding: '7px 12px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(!form.anexos || form.anexos.length === 0) && (
                    <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: 'var(--t3)' }}>Nenhum anexo.</td></tr>
                  )}
                  {(form.anexos || []).map((a) => (
                    <tr key={a.id} style={{ borderTop: '1px solid var(--bd)' }}>
                      <td style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Paperclip size={12} color="var(--t3)" /> {a.nome_original}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--t2)' }}>{CATEGORIAS_ANEXO.find((c) => c.valor === a.categoria)?.label || a.categoria}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--t2)' }}>{fmtSize(a.tamanho_bytes)}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--t3)' }}>{a.criado_em ? new Date(a.criado_em).toLocaleDateString('pt-BR') : ''}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button className="btn btn-ghost" style={{ height: 24, padding: '0 8px' }}
                          onClick={() => window.api.arquivos.abrir(a.caminho)} title="Abrir">
                          <ExternalLink size={12} />
                        </button>
                        {!isRO && (
                          <button className="btn btn-ghost" style={{ height: 24, padding: '0 8px', color: 'var(--red)' }}
                            onClick={() => remover(a.id)} title="Remover">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Secao>
    </FormGrid>
  )
}
