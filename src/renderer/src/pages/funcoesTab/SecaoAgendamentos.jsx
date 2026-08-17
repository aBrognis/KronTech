import { useState, useEffect, useCallback } from 'react'
import { Save, X, Power, PowerOff, Edit2, Trash2, Plus, Calendar, Clock } from 'lucide-react'
import { mostrarAlerta } from '../../lib/funcoes/index.js'
import { Btn, FInput, FSelect, SectionTitle, StatusBadge, EmptyState, Card } from './_shared.jsx'

const INTERVALOS = [
  { value: '5m',  label: 'A cada 5 minutos'  },
  { value: '15m', label: 'A cada 15 minutos' },
  { value: '30m', label: 'A cada 30 minutos' },
  { value: '1h',  label: 'A cada 1 hora'     },
  { value: '6h',  label: 'A cada 6 horas'    },
  { value: '12h', label: 'A cada 12 horas'   },
  { value: '1d',  label: 'Todo dia (meia-noite)' },
  { value: '1w',  label: 'Toda semana (segunda-feira)' },
  { value: 'cron',label: 'Expressão cron personalizada' },
]

export default function SecaoAgendamentos({ scripts }) {
  const [lista, setLista]       = useState([])
  const [editando, setEditando] = useState(null)

  useEffect(() => {
    window.api.funcoes.listarAgendamentos().then(res => res.ok && setLista(res.data))
  }, [])

  const salvar = useCallback(async (item) => {
    const existe = lista.some(a => a.id === item.id)
    const res = existe
      ? await window.api.funcoes.atualizarAgendamento(item)
      : await window.api.funcoes.criarAgendamento(item)
    if (!res.ok) { mostrarAlerta(res.erro || 'Erro ao salvar', 'erro'); return }
    setLista(prev => existe ? prev.map(a => a.id === res.data.id ? res.data : a) : [...prev, res.data])
    setEditando(null)
    mostrarAlerta('Agendamento salvo!', 'sucesso')
  }, [lista])

  const remover = useCallback(async (id) => {
    if (!confirm('Excluir este agendamento?')) return
    await window.api.funcoes.excluirAgendamento(id)
    setLista(prev => prev.filter(a => a.id !== id))
  }, [])

  const toggleAtivo = useCallback(async (a) => {
    const res = await window.api.funcoes.atualizarAgendamento({ ...a, ativo: !a.ativo })
    if (res.ok) setLista(prev => prev.map(x => x.id === a.id ? res.data : x))
  }, [])

  const novo = () => setEditando({ id: null, nome: '', intervalo: '1h', cron: '0 * * * *', acao: { tipo: 'script', id: '' }, ativo: false })

  if (editando) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Btn variant="ghost" style={{ height: 30 }} onClick={() => setEditando(null)}><X size={13} /> Cancelar</Btn>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{editando.nome || 'Novo Agendamento'}</span>
      </div>
      <Card>
        <SectionTitle>Identificação</SectionTitle>
        <FInput label="Nome" style={{ marginTop: 8 }} value={editando.nome} onChange={e => setEditando(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Backup diário, Relatório semanal..." />
      </Card>
      <Card>
        <SectionTitle>Frequência</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          <FSelect label="Intervalo" value={editando.intervalo} onChange={e => setEditando(p => ({ ...p, intervalo: e.target.value }))}>
            {INTERVALOS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
          </FSelect>
          {editando.intervalo === 'cron' && (
            <FInput label="Expressão cron (min hora dia mês semana)" value={editando.cron}
              onChange={e => setEditando(p => ({ ...p, cron: e.target.value }))} placeholder="0 8 * * 1-5" />
          )}
          <div style={{ fontSize: 10, color: 'var(--t3)', fontStyle: 'italic' }}>
            ⚠️ Agendamentos exigem que o KronTech esteja aberto para executar. Futuramente: agente de background.
          </div>
        </div>
      </Card>
      <Card>
        <SectionTitle>Ação a executar</SectionTitle>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <FSelect label="Tipo de ação" value={editando.acao.tipo} onChange={e => setEditando(p => ({ ...p, acao: { ...p.acao, tipo: e.target.value, id: '' } }))}>
            <option value="script">Executar Script SQL</option>
            <option value="api">Chamar Integração API</option>
            <option value="exportar">Exportar tabela como CSV</option>
          </FSelect>
          {editando.acao.tipo === 'script' && (
            <FSelect label="Script" value={editando.acao.id} onChange={e => setEditando(p => ({ ...p, acao: { ...p.acao, id: e.target.value } }))}>
              <option value="">Selecione</option>
              {scripts.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </FSelect>
          )}
          {editando.acao.tipo === 'exportar' && (
            <FInput label="Nome da tabela" value={editando.acao.tabela || ''} onChange={e => setEditando(p => ({ ...p, acao: { ...p.acao, tabela: e.target.value } }))} placeholder="nome_tabela" />
          )}
        </div>
      </Card>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn onClick={() => salvar(editando)} disabled={!editando.nome.trim()}><Save size={13} /> Salvar</Btn>
        <Btn variant="ghost" onClick={() => setEditando(null)}>Cancelar</Btn>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn onClick={novo}><Plus size={13} /> Novo Agendamento</Btn>
      </div>
      {lista.length === 0
        ? <EmptyState icon={Calendar} title="Nenhum agendamento" subtitle="Execute scripts e integrações automaticamente em intervalos programados"
            action={<Btn onClick={novo}><Plus size={13} /> Criar Agendamento</Btn>} />
        : lista.map(a => (
          <Card key={a.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(251,210,76,.1)', border: '1px solid rgba(251,210,76,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={15} color="var(--yellow)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 2 }}>{a.nome}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                  {INTERVALOS.find(i => i.value === a.intervalo)?.label || a.intervalo}
                  {a.intervalo === 'cron' && ` · ${a.cron}`}
                  {' · '}{a.acao.tipo === 'script' ? 'Script SQL' : a.acao.tipo === 'api' ? 'Integração API' : 'Exportar CSV'}
                </div>
              </div>
              <StatusBadge ativo={a.ativo} />
              <div style={{ display: 'flex', gap: 5 }}>
                <button className="btn btn-ghost" style={{ height: 30, color: a.ativo ? 'var(--green)' : 'var(--t3)' }} onClick={() => toggleAtivo(a)}>
                  {a.ativo ? <Power size={13} /> : <PowerOff size={13} />}
                </button>
                <button className="btn btn-ghost" style={{ height: 30 }} onClick={() => setEditando(a)}><Edit2 size={13} /></button>
                <button className="btn btn-danger" style={{ height: 30 }} onClick={() => remover(a.id)}><Trash2 size={13} /></button>
              </div>
            </div>
          </Card>
        ))
      }
    </div>
  )
}
