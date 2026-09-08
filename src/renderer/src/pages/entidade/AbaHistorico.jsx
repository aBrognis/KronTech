import { FormGrid, Secao } from '../../components/cadastroPadrao/TelaCadastroPadrao'
import GridFilho from '../../components/cadastroPadrao/GridFilho'
import { TIPO_DOCUMENTO } from './utils'

const fmtDataHora = (iso) => { try { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) } catch { return String(iso || '') } }
const fmtData = (v) => (v ? String(v).slice(0, 10).split('-').reverse().join('/') : '')
const acaoLabel = { criou: 'Criou', alterou: 'Alterou', status: 'Mudou status', limite: 'Alterou limite', anexo: 'Anexo', excluiu: 'Excluiu' }

function diasAte(validade) {
  if (!validade) return null
  const d = Math.ceil((new Date(String(validade).slice(0, 10)) - new Date()) / 86400000)
  return d
}

export default function AbaHistorico({ form, setForm, isRO }) {
  return (
    <FormGrid>
      <Secao titulo="Documentos e certidões (com validade)" largura="full" cols="1fr">
        <div>
          <GridFilho
            itens={form.documentos} isRO={isRO}
            onChange={(documentos) => setForm((f) => ({ ...f, documentos }))}
            rotuloAdd="Adicionar documento"
            novoItem={() => ({ tipo: 'ie', numero: '', emissao: '', validade: '', observacao: '' })}
            colunas={[
              { chave: 'tipo', label: 'Tipo', largura: 180, tipo: 'select', opcoes: TIPO_DOCUMENTO },
              { chave: 'numero', label: 'Número', largura: 160, upper: true },
              { chave: 'emissao', label: 'Emissão', largura: 130, render: (linha, set) => (
                <input type="date" className="form-input" style={{ height: 30, fontSize: 12 }} value={linha.emissao || ''} disabled={isRO}
                  onChange={(e) => set({ emissao: e.target.value })} /> ) },
              { chave: 'validade', label: 'Validade', largura: 150, render: (linha, set) => {
                const d = diasAte(linha.validade)
                const cor = d == null ? undefined : d < 0 ? 'var(--red)' : d <= 30 ? 'var(--orange, #f59e0b)' : undefined
                return (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <input type="date" className="form-input" style={{ height: 30, fontSize: 12 }} value={linha.validade || ''} disabled={isRO}
                      onChange={(e) => set({ validade: e.target.value })} />
                    {d != null && <span style={{ fontSize: 9.5, color: cor }}>{d < 0 ? `vencido há ${-d}d` : d === 0 ? 'vence hoje' : `${d}d`}</span>}
                  </div>
                )
              } },
              { chave: 'observacao', label: 'Observação', largura: 200 },
            ]}
          />
        </div>
      </Secao>

      <Secao titulo="Auditoria" largura="full" cols="1fr">
        <div style={{ border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden', background: 'var(--s1)', maxHeight: 360, overflowY: 'auto' }}>
          {(!form.log || form.log.length === 0) ? (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>Sem registros de auditoria.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--s1)', position: 'sticky', top: 0 }}>
                  {['Data', 'Usuário', 'Ação', 'Campo', 'De', 'Para'].map((h) => (
                    <th key={h} style={{ padding: '7px 12px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.log.map((l) => (
                  <tr key={l.id} style={{ borderTop: '1px solid var(--bd)' }}>
                    <td style={{ padding: '6px 12px', color: 'var(--t3)', whiteSpace: 'nowrap' }}>{fmtDataHora(l.data_hora)}</td>
                    <td style={{ padding: '6px 12px', color: 'var(--t2)' }}>{l.usuario_nome || '-'}</td>
                    <td style={{ padding: '6px 12px', color: 'var(--t1)', fontWeight: 600 }}>{acaoLabel[l.acao] || l.acao}</td>
                    <td style={{ padding: '6px 12px', color: 'var(--t2)' }}>{l.campo || '-'}</td>
                    <td style={{ padding: '6px 12px', color: 'var(--t3)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.valor_de || '-'}</td>
                    <td style={{ padding: '6px 12px', color: 'var(--t2)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.valor_para || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Secao>
    </FormGrid>
  )
}
