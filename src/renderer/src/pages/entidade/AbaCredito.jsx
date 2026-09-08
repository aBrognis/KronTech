import { useState } from 'react'
import { History, Pencil } from 'lucide-react'
import { FormGrid, Secao, CampoNumero, CampoSelect } from '../../components/cadastroPadrao/TelaCadastroPadrao'
import InputData from '../../components/InputData'
import { notificar } from '../../components/Notificacao'
import { SCORE_RISCO, STATUS_CREDITO } from './utils'

const fmtR$ = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDataHora = (iso) => { try { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) } catch { return String(iso || '') } }

export default function AbaCredito({ form, setForm, isRO }) {
  const cr = form.credito || {}
  const set = (patch) => setForm((f) => ({ ...f, credito: { ...(f.credito || {}), ...patch } }))
  const c = { form: cr, isRO, setForm: (u) => set(typeof u === 'function' ? u(cr) : u) }

  const limite = Number(cr.limite_credito) || 0
  const usado = Number(cr.limite_utilizado) || 0
  const disp = limite - usado

  const [modalLimite, setModalLimite] = useState(null) // { valor, motivo }

  async function confirmarLimite() {
    if (!form.id) { notificar.aviso('Grave a entidade antes de alterar o limite.'); return }
    const res = await window.api.entidade.alterarLimite({
      entidadeId: form.id,
      limite_novo: Number(modalLimite.valor) || 0,
      motivo: modalLimite.motivo,
    })
    setModalLimite(null)
    if (res.ok) {
      setForm((f) => ({ ...f, credito: res.data.credito || f.credito, creditoHist: res.data.creditoHist || f.creditoHist }))
      notificar.sucesso('Limite atualizado.')
    } else {
      notificar.erro(res.erro || 'Falha ao alterar limite.')
    }
  }

  return (
    <FormGrid>
      <Secao titulo="Situação de crédito" cols="minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)">
        <CampoSelect {...c} campo="score_risco" label="Score de risco" opcoes={SCORE_RISCO} />
        <CampoSelect {...c} campo="status_credito" label="Status" opcoes={STATUS_CREDITO.map((s) => ({ valor: s.valor, label: s.label }))} />
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Última análise</label>
          <InputData value={cr.data_ultima_analise || ''} disabled={isRO}
            onChange={(v) => set({ data_ultima_analise: v })} />
        </div>
        <CampoNumero {...c} campo="atraso_medio_dias" label="Atraso médio" sufixo="dias" />
      </Secao>

      <Secao titulo="Limite" largura="full" cols="1fr">
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', padding: '8px 14px', background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Limite de crédito</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)' }}>{fmtR$(limite)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Utilizado</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t2)' }}>{fmtR$(usado)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Disponível</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: disp >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtR$(disp)}</div>
          </div>
          {!isRO && (
            <button className="btn btn-ghost" style={{ marginLeft: 'auto', height: 32 }}
              onClick={() => setModalLimite({ valor: limite, motivo: '' })}>
              <Pencil size={13} /> Alterar limite
            </button>
          )}
        </div>
      </Secao>

      <Secao titulo="Observações" largura="full" cols="1fr">
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Observação de crédito</label>
          <textarea className="form-textarea" rows={2} value={cr.observacao_credito || ''} disabled={isRO}
            onChange={(e) => set({ observacao_credito: e.target.value })} />
        </div>
      </Secao>

      {form.creditoHist?.length > 0 && (
        <Secao titulo="Histórico de limite" largura="full" cols="1fr">
          <div style={{ border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden', background: 'var(--s1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--s1)' }}>
                  {['Data', 'De', 'Para', 'Motivo'].map((h) => (
                    <th key={h} style={{ padding: '7px 12px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.creditoHist.map((h) => (
                  <tr key={h.id} style={{ borderTop: '1px solid var(--bd)' }}>
                    <td style={{ padding: '7px 12px', color: 'var(--t2)' }}>{fmtDataHora(h.data)}</td>
                    <td style={{ padding: '7px 12px', color: 'var(--t2)' }}>{fmtR$(h.limite_anterior)}</td>
                    <td style={{ padding: '7px 12px', color: 'var(--t1)', fontWeight: 600 }}>{fmtR$(h.limite_novo)}</td>
                    <td style={{ padding: '7px 12px', color: 'var(--t3)' }}>{h.motivo || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Secao>
      )}

      {modalLimite && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}>
          <div style={{ width: 380, background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)' }}>Alterar limite de crédito</div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Novo limite</label>
              <input className="form-input" type="number" step="0.01" value={modalLimite.valor}
                onChange={(e) => setModalLimite((m) => ({ ...m, valor: e.target.value }))} autoFocus />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Motivo</label>
              <input className="form-input" value={modalLimite.motivo}
                onChange={(e) => setModalLimite((m) => ({ ...m, motivo: e.target.value }))}
                placeholder="Ex: reavaliação anual, aumento de faturamento" />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setModalLimite(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmarLimite}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </FormGrid>
  )
}
