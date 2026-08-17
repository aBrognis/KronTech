import { useState, useEffect, useCallback } from 'react'
import { GitBranch, Filter, Terminal, Globe, Bell, Clock, Activity, Save, X, Edit2, Trash2, Plus, Play } from 'lucide-react'
import { mostrarAlerta } from '../../lib/funcoes/index.js'
import { genId, Btn, FInput, FSelect, Row, SectionTitle, StatusBadge, EmptyState, Card } from './_shared.jsx'

const OPERADORES = [
  { value: 'igual',     label: 'é igual a'      },
  { value: 'diferente', label: 'é diferente de' },
  { value: 'maior',     label: 'maior que'      },
  { value: 'menor',     label: 'menor que'      },
  { value: 'contem',    label: 'contém'         },
  { value: 'vazio',     label: 'está vazio'     },
  { value: 'nao_vazio', label: 'não está vazio' },
]

function paraApi(f) {
  return { id: f.id, nome: f.nome, descricao: f.descricao || '', gatilho: f.gatilho, trigger_tabela: f.trigger_tabela || '', etapas: f.etapas || [], ativo: f.ativo ?? true }
}

// Formulário de configuração por etapa: cada tipo salva em etapa.config.
function EtapaConfigForm({ etapa, onChange }) {
  const cfg = etapa.config || {}
  const setCfg = (patch) => onChange({ ...etapa, config: { ...cfg, ...patch } })

  if (etapa.tipo === 'condicao') {
    const condicoes = cfg.condicoes || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
        {condicoes.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', gap: 6, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <FInput label="Campo" value={c.campo} style={{ minWidth: 100 }}
              onChange={e => setCfg({ condicoes: condicoes.map((x, j) => j === i ? { ...x, campo: e.target.value } : x) })} />
            <FSelect label="Operador" value={c.operador} style={{ minWidth: 120 }}
              onChange={e => setCfg({ condicoes: condicoes.map((x, j) => j === i ? { ...x, operador: e.target.value } : x) })}>
              {OPERADORES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </FSelect>
            {!['vazio', 'nao_vazio'].includes(c.operador) && (
              <FInput label="Valor" value={c.valor} style={{ minWidth: 100 }}
                onChange={e => setCfg({ condicoes: condicoes.map((x, j) => j === i ? { ...x, valor: e.target.value } : x) })} />
            )}
            <button className="btn btn-danger" style={{ height: 32 }}
              onClick={() => setCfg({ condicoes: condicoes.filter((_, j) => j !== i) })}><Trash2 size={12} /></button>
          </div>
        ))}
        <Btn size="sm" variant="ghost" onClick={() => setCfg({ condicoes: [...condicoes, { id: genId(), campo: '', operador: 'igual', valor: '' }] })}>
          <Plus size={11} /> Condição
        </Btn>
      </div>
    )
  }

  if (etapa.tipo === 'script') {
    return <FInput label="SQL" value={cfg.sql || ''} onChange={e => setCfg({ sql: e.target.value })}
      placeholder="SELECT ... ou UPDATE ... (use {campo} para interpolar)" style={{ width: '100%' }} />
  }

  if (etapa.tipo === 'api') {
    return (
      <Row gap={8}>
        <FSelect label="Método" value={cfg.metodo || 'GET'} style={{ minWidth: 90 }}
          onChange={e => setCfg({ metodo: e.target.value })}>
          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
        </FSelect>
        <FInput label="URL" value={cfg.url || ''} onChange={e => setCfg({ url: e.target.value })} placeholder="https://..." />
      </Row>
    )
  }

  if (etapa.tipo === 'notificacao') {
    return (
      <Row gap={8}>
        <FSelect label="Canal" value={cfg.tipo || 'toast'} style={{ minWidth: 130 }}
          onChange={e => setCfg({ tipo: e.target.value })}>
          <option value="toast">Toast (na tela)</option>
          <option value="desktop">Notificação desktop</option>
          <option value="webhook">Webhook (POST)</option>
        </FSelect>
        <FInput label="Mensagem" value={cfg.mensagem || ''} onChange={e => setCfg({ mensagem: e.target.value })} placeholder="Use {campo} para variáveis" />
        {cfg.tipo === 'webhook' && (
          <FInput label="URL do webhook" value={cfg.url || ''} onChange={e => setCfg({ url: e.target.value })} />
        )}
      </Row>
    )
  }

  if (etapa.tipo === 'espera') {
    return <FInput label="Segundos" type="number" min={1} value={cfg.segundos ?? 1}
      onChange={e => setCfg({ segundos: Number(e.target.value) || 1 })} style={{ maxWidth: 120 }} />
  }

  return null
}

export default function SecaoFluxos({ telas = [] }) {
  const [lista, setLista]       = useState([])
  const [editando, setEditando] = useState(null)
  const [executando, setExecutando] = useState(null)

  useEffect(() => {
    window.api.funcoes.listarFluxos().then(res => res.ok && setLista(res.data))
  }, [])

  const salvar = useCallback(async (item) => {
    const existe = lista.some(f => f.id === item.id)
    const res = existe
      ? await window.api.funcoes.atualizarFluxo(paraApi(item))
      : await window.api.funcoes.criarFluxo(paraApi(item))
    if (!res.ok) { mostrarAlerta(res.erro || 'Erro ao salvar', 'erro'); return }
    setLista(prev => existe ? prev.map(f => f.id === res.data.id ? res.data : f) : [...prev, res.data])
    setEditando(null)
    mostrarAlerta('Fluxo salvo!', 'sucesso')
  }, [lista])

  const remover = useCallback(async (id) => {
    if (!confirm('Excluir este fluxo?')) return
    await window.api.funcoes.excluirFluxo(id)
    setLista(prev => prev.filter(f => f.id !== id))
  }, [])

  const executar = useCallback(async (f) => {
    setExecutando(f.id)
    const res = await window.api.fluxo.executar(f.id, {})
    if (res.ok) mostrarAlerta('Fluxo executado!', 'sucesso')
    else mostrarAlerta('Erro: ' + res.erro, 'erro')
    setExecutando(null)
  }, [])

  const adicionarEtapa = (tipo) => setEditando(p => ({
    ...p, etapas: [...(p.etapas || []), { id: genId(), tipo, nome: tipo === 'condicao' ? 'Se condição' : tipo === 'script' ? 'Executar SQL' : tipo === 'api' ? 'Chamar API' : tipo === 'notificacao' ? 'Notificar' : 'Esperar', config: {} }]
  }))

  const ETAPA_CORES = { condicao: 'var(--yellow)', script: 'var(--blue)', api: 'var(--green)', notificacao: 'var(--purple)', espera: 'var(--t3)' }
  const ETAPA_ICONS = { condicao: Filter, script: Terminal, api: Globe, notificacao: Bell, espera: Clock }

  const novo = () => setEditando({ id: null, nome: '', descricao: '', gatilho: 'manual', trigger_tabela: '', etapas: [], ativo: false })

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
          {editando.gatilho !== 'manual' && editando.gatilho !== 'agendamento' && (
            <FSelect label="Tela" value={editando.trigger_tabela || ''} onChange={e => setEditando(p => ({ ...p, trigger_tabela: e.target.value }))} style={{ minWidth: 180 }}>
              <option value="">Todas as telas</option>
              {telas.map(t => <option key={t.id} value={t.nome_tabela}>{t.nome_tela}</option>)}
            </FSelect>
          )}
        </Row>
      </Card>

      {/* Canvas do fluxo */}
      <Card>
        <SectionTitle>Etapas do fluxo</SectionTitle>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, marginTop: 12 }}>
          <div style={{ background: 'var(--or4)', border: '2px solid var(--or)', borderRadius: 12, padding: '10px 20px', fontSize: 12, fontWeight: 700, color: 'var(--or)' }}>
            🚀 Gatilho: {editando.gatilho === 'manual' ? 'Botão manual' : editando.gatilho === 'ao_salvar' ? 'Ao salvar' : editando.gatilho === 'ao_abrir' ? 'Ao abrir' : editando.gatilho === 'agendamento' ? 'Agendado' : 'Webhook'}
          </div>

          {editando.etapas?.map((et, i) => {
            const Ic = ETAPA_ICONS[et.tipo] || Activity
            const cor = ETAPA_CORES[et.tipo] || 'var(--t3)'
            return (
              <div key={et.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0, width: '100%', maxWidth: 480 }}>
                <div style={{ width: 2, height: 20, background: 'var(--bd)', alignSelf: 'center' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--s2)', border: `1.5px solid ${cor}44`, borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Ic size={14} color={cor} />
                    <FInput value={et.nome} style={{ flex: 1 }}
                      onChange={e => setEditando(p => ({ ...p, etapas: p.etapas.map((x, j) => j === i ? { ...x, nome: e.target.value } : x) }))} />
                    <span style={{ fontSize: 10, color: cor, flexShrink: 0 }}>{et.tipo}</span>
                    <button onClick={() => setEditando(p => ({ ...p, etapas: p.etapas.filter((_, j) => j !== i) }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 0, flexShrink: 0 }}>
                      <X size={13} />
                    </button>
                  </div>
                  <EtapaConfigForm etapa={et}
                    onChange={novaEtapa => setEditando(p => ({ ...p, etapas: p.etapas.map((x, j) => j === i ? novaEtapa : x) }))} />
                </div>
              </div>
            )
          })}

          <div style={{ width: 2, height: 20, background: 'var(--bd)' }} />
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
                <Btn size="sm" variant="ghost" disabled={executando === f.id} onClick={() => executar(f)}><Play size={12} /> Executar</Btn>
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
