import { useState, useEffect, useCallback } from 'react'
import { GitBranch, Filter, Terminal, Globe, Bell, Clock, Activity, Save, X, Edit2, Trash2, Plus } from 'lucide-react'
import { mostrarAlerta } from '../../lib/funcoes/index.js'
import { genId, carregarSecao, salvarSecao, Btn, FInput, FSelect, Row, SectionTitle, StatusBadge, EmptyState, Card } from './_shared.jsx'

export default function SecaoFluxos() {
  const [lista, setLista]       = useState([])
  const [editando, setEditando] = useState(null)

  useEffect(() => { carregarSecao('Fluxos').then(setLista) }, [])

  const salvar = useCallback(async (item) => {
    const nova = lista.some(f => f.id === item.id)
      ? lista.map(f => f.id === item.id ? item : f)
      : [...lista, item]
    setLista(nova); await salvarSecao('Fluxos', nova); setEditando(null)
    mostrarAlerta('Fluxo salvo!', 'sucesso')
  }, [lista])

  const remover = useCallback(async (id) => {
    if (!confirm('Excluir este fluxo?')) return
    const nova = lista.filter(f => f.id !== id); setLista(nova); await salvarSecao('Fluxos', nova)
  }, [lista])

  const adicionarEtapa = (tipo) => setEditando(p => ({
    ...p, etapas: [...(p.etapas || []), { id: genId(), tipo, nome: tipo === 'condicao' ? 'Se condição' : tipo === 'script' ? 'Executar SQL' : tipo === 'api' ? 'Chamar API' : tipo === 'notificacao' ? 'Notificar' : 'Esperar', config: {} }]
  }))

  const ETAPA_CORES = { condicao: 'var(--yellow)', script: 'var(--blue)', api: 'var(--green)', notificacao: 'var(--purple)', espera: 'var(--t3)' }
  const ETAPA_ICONS = { condicao: Filter, script: Terminal, api: Globe, notificacao: Bell, espera: Clock }

  const novo = () => setEditando({ id: genId(), nome: '', descricao: '', gatilho: 'manual', etapas: [], ativo: false })

  if (editando) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Btn variant="ghost" style={{ height: 30 }} onClick={() => setEditando(null)}><X size={13} /> Cancelar</Btn>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{editando.nome || 'Novo Fluxo'}</span>
      </div>
      <Card>
        <Row gap={10}>
          <FInput label="Nome do fluxo" value={editando.nome} onChange={e => setEditando(p => ({ ...p, nome: e.target.value }))} />
          <FSelect label="Gatilho de início" value={editando.gatilho} onChange={e => setEditando(p => ({ ...p, gatilho: e.target.value }))}>
            <option value="manual">Botão manual</option>
            <option value="ao_salvar">Ao salvar registro</option>
            <option value="ao_abrir">Ao abrir tela</option>
            <option value="agendamento">Por agendamento</option>
            <option value="webhook">Webhook recebido</option>
          </FSelect>
        </Row>
      </Card>

      {/* Canvas do fluxo */}
      <Card>
        <SectionTitle>Etapas do fluxo</SectionTitle>

        {/* Gatilho inicial */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, marginTop: 12 }}>
          <div style={{ background: 'var(--or4)', border: '2px solid var(--or)', borderRadius: 12, padding: '10px 20px', fontSize: 12, fontWeight: 700, color: 'var(--or)' }}>
            🚀 Gatilho: {editando.gatilho === 'manual' ? 'Botão manual' : editando.gatilho === 'ao_salvar' ? 'Ao salvar' : editando.gatilho === 'ao_abrir' ? 'Ao abrir' : editando.gatilho === 'agendamento' ? 'Agendado' : 'Webhook'}
          </div>

          {editando.etapas?.map((et, i) => {
            const Ic = ETAPA_ICONS[et.tipo] || Activity
            const cor = ETAPA_CORES[et.tipo] || 'var(--t3)'
            return (
              <div key={et.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                <div style={{ width: 2, height: 20, background: 'var(--bd)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s2)', border: `1.5px solid ${cor}44`, borderRadius: 10, padding: '8px 14px', minWidth: 200, position: 'relative' }}>
                  <Ic size={14} color={cor} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{et.nome}</div>
                    <div style={{ fontSize: 10, color: cor }}>tipo: {et.tipo}</div>
                  </div>
                  <FInput value={et.nome} onChange={e => setEditando(p => ({ ...p, etapas: p.etapas.map((x, j) => j === i ? { ...x, nome: e.target.value } : x) }))}
                    style={{ position: 'absolute', opacity: 0, inset: 0, width: '100%', cursor: 'pointer' }} />
                  <button onClick={() => setEditando(p => ({ ...p, etapas: p.etapas.filter((_, j) => j !== i) }))}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 0 }}>
                    <X size={11} />
                  </button>
                </div>
              </div>
            )
          })}

          <div style={{ width: 2, height: 20, background: 'var(--bd)' }} />
          {/* Adicionar etapa */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { tipo: 'condicao', label: '⚡ Condição' },
              { tipo: 'script',   label: '🗄️ SQL'       },
              { tipo: 'api',      label: '🌐 API'        },
              { tipo: 'notificacao', label: '🔔 Notificar' },
              { tipo: 'espera',   label: '⏳ Esperar'   },
            ].map(({ tipo, label }) => (
              <button key={tipo} className="btn btn-ghost" style={{ height: 28, fontSize: 11 }} onClick={() => adicionarEtapa(tipo)}>
                <Plus size={11} /> {label}
              </button>
            ))}
          </div>

          <div style={{ width: 2, height: 20, background: 'var(--bd)' }} />
          <div style={{ background: 'var(--s3)', border: '1.5px dashed var(--bd)', borderRadius: 10, padding: '8px 20px', fontSize: 11, color: 'var(--t3)' }}>
            ✅ Fim do fluxo
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn onClick={() => salvar(editando)} disabled={!editando.nome.trim()}><Save size={13} /> Salvar Fluxo</Btn>
        <Btn variant="ghost" onClick={() => setEditando(null)}>Cancelar</Btn>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn onClick={novo}><Plus size={13} /> Novo Fluxo</Btn>
      </div>
      {lista.length === 0
        ? <EmptyState icon={GitBranch} title="Nenhum fluxo criado" subtitle="Fluxos são sequências de etapas automáticas: condição → SQL → API → notificação"
            action={<Btn onClick={novo}><Plus size={13} /> Criar Fluxo</Btn>} />
        : lista.map(f => (
          <Card key={f.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <GitBranch size={15} color="var(--purple)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 2 }}>{f.nome}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                  Gatilho: {f.gatilho} · {f.etapas?.length || 0} etapa(s)
                </div>
              </div>
              <StatusBadge ativo={f.ativo} />
              <div style={{ display: 'flex', gap: 5 }}>
                <button className="btn btn-ghost" style={{ height: 30 }} onClick={() => setEditando(f)}><Edit2 size={13} /></button>
                <button className="btn btn-danger" style={{ height: 30 }} onClick={() => remover(f.id)}><Trash2 size={13} /></button>
              </div>
            </div>
          </Card>
        ))
      }
    </div>
  )
}
