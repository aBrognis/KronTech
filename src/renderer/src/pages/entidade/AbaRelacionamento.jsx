import { useState } from 'react'
import { Plus, Phone, Mail, MapPin, Users, MessageSquare, StickyNote, Trash2 } from 'lucide-react'
import { FormGrid, Secao, CampoTexto, CampoSelect } from '../../components/cadastroPadrao/TelaCadastroPadrao'
import InputData from '../../components/InputData'
import { notificar } from '../../components/Notificacao'
import { fmtDataBR, fmtDataHoraBR } from '../../lib/utils/data.js'
import { TIPO_INTERACAO, RESULTADO_INTERACAO } from './utils'

const ICONE = { ligacao: Phone, email: Mail, visita: MapPin, reuniao: Users, whatsapp: MessageSquare, nota: StickyNote }
const fmtDataHora = (iso) => fmtDataHoraBR(iso, '')
const tipoLabel = (t) => TIPO_INTERACAO.find((x) => x.valor === t)?.label || t

export default function AbaRelacionamento({ form, setForm, isRO }) {
  const [nova, setNova] = useState(null) // { tipo, titulo, descricao, proximo_contato, resultado }

  async function salvarInteracao() {
    if (!form.id) { notificar.aviso('Grave a entidade antes de registrar interações.'); return }
    const res = await window.api.entidade.registrarInteracao({
      entidadeId: form.id,
      dados: nova,
    })
    setNova(null)
    if (res.ok) setForm((f) => ({ ...f, interacoes: [res.data, ...(f.interacoes || [])] }))
    else notificar.erro(res.erro || 'Falha ao registrar.')
  }
  async function remover(id) {
    const res = await window.api.entidade.removerInteracao(id)
    if (res.ok) setForm((f) => ({ ...f, interacoes: (f.interacoes || []).filter((i) => i.id !== id) }))
  }

  return (
    <FormGrid>
      <Secao titulo="Perfil de relacionamento" cols="1fr 1fr 1fr">
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="origem" label="Origem" upper placeholder="INDICAÇÃO, SITE, FEIRA..." />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="segmento" label="Segmento" upper />
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Primeiro contato</label>
          <InputData value={form.data_primeiro_contato || ''} disabled={isRO}
            onChange={(v) => setForm((f) => ({ ...f, data_primeiro_contato: v }))} />
        </div>
      </Secao>

      <Secao titulo="Histórico de interações" largura="full" cols="1fr">
        <div>
          {!isRO && (
            <button className="btn btn-ghost" style={{ height: 30, fontSize: 11.5, marginBottom: 10 }}
              onClick={() => setNova({ tipo: 'ligacao', titulo: '', descricao: '', proximo_contato: '', resultado: '' })}>
              <Plus size={13} /> Nova interação
            </button>
          )}

          {(!form.interacoes || form.interacoes.length === 0) ? (
            <div style={{ fontSize: 12.5, color: 'var(--t3)', padding: 12 }}>Nenhuma interação registrada.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {form.interacoes.map((it) => {
                const Ic = ICONE[it.tipo] || StickyNote
                return (
                  <div key={it.id} style={{ display: 'flex', gap: 10, padding: '10px 12px', border: '1px solid var(--bd)', borderRadius: 8, background: 'var(--s1)' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--s2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--t3)' }}>
                      <Ic size={14} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)' }}>{it.titulo || tipoLabel(it.tipo)}</span>
                        <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>{fmtDataHora(it.data_hora)}</span>
                        {it.resultado && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: 'var(--s2)', color: 'var(--t2)' }}>{RESULTADO_INTERACAO.find((r) => r.valor === it.resultado)?.label}</span>}
                      </div>
                      {it.descricao && <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 3, whiteSpace: 'pre-wrap' }}>{it.descricao}</div>}
                      {it.proximo_contato && <div style={{ fontSize: 11, color: 'var(--or)', marginTop: 3 }}>Próximo contato: {fmtDataBR(it.proximo_contato, '')}</div>}
                    </div>
                    {!isRO && (
                      <button className="btn btn-ghost" style={{ height: 24, padding: '0 6px', color: 'var(--red)', flexShrink: 0 }} onClick={() => remover(it.id)}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Secao>

      {nova && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}>
          <div style={{ width: 460, background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)' }}>Nova interação</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Tipo</label>
                <select className="form-select" value={nova.tipo} onChange={(e) => setNova((n) => ({ ...n, tipo: e.target.value }))}>
                  {TIPO_INTERACAO.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Resultado</label>
                <select className="form-select" value={nova.resultado} onChange={(e) => setNova((n) => ({ ...n, resultado: e.target.value }))}>
                  {RESULTADO_INTERACAO.map((r) => <option key={r.valor} value={r.valor}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Título</label>
              <input className="form-input" value={nova.titulo} onChange={(e) => setNova((n) => ({ ...n, titulo: e.target.value }))} placeholder="Resumo em uma linha" autoFocus />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Descrição</label>
              <textarea className="form-textarea" rows={3} value={nova.descricao} onChange={(e) => setNova((n) => ({ ...n, descricao: e.target.value }))} />
            </div>
            <div className="form-group" style={{ margin: 0, maxWidth: 180 }}>
              <label className="form-label">Próximo contato</label>
              <InputData value={nova.proximo_contato} onChange={(v) => setNova((n) => ({ ...n, proximo_contato: v }))} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setNova(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvarInteracao}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </FormGrid>
  )
}
