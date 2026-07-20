import { useState, useEffect, useCallback } from 'react'
import { Bell, Monitor, Globe, Mail, Play, Save, X, Edit2, Trash2, Plus, BookOpen } from 'lucide-react'
import { mostrarAlerta } from '../../lib/funcoes/index.js'
import { genId, carregarSecao, salvarSecao, Btn, FInput, FSelect, Row, SectionTitle, EmptyState, Card } from './_shared.jsx'

const EXEMPLOS_NOTIFICACOES = [
  { nome: 'Salvo com sucesso', tipo: 'toast', titulo: 'KronTech', mensagem: 'Registro salvo com sucesso!', tipoToast: 'sucesso', url: '' },
  { nome: 'Erro de validação', tipo: 'toast', titulo: 'KronTech', mensagem: 'Preencha todos os campos obrigatórios antes de continuar.', tipoToast: 'erro', url: '' },
  { nome: 'Aviso de prazo', tipo: 'desktop', titulo: 'KronTech — Lembrete', mensagem: 'Você tem tarefas com prazo para hoje. Acesse o painel para verificar.', tipoToast: 'aviso', url: '' },
  { nome: 'Notificação informativa', tipo: 'toast', titulo: 'KronTech', mensagem: 'Nova atualização disponível. Reinicie o sistema para aplicar.', tipoToast: 'info', url: '' },
]

export default function SecaoNotificacoes() {
  const [lista, setLista]       = useState([])
  const [editando, setEditando] = useState(null)
  const [testando, setTestando] = useState(null)

  const carregarExemplos = useCallback(async () => {
    const novos = EXEMPLOS_NOTIFICACOES.map(e => ({ ...e, id: genId() }))
    const nova = [...lista, ...novos]; setLista(nova); await salvarSecao('Notificacoes', nova)
    mostrarAlerta(`${novos.length} notificações de exemplo carregadas!`, 'sucesso')
  }, [lista])

  useEffect(() => { carregarSecao('Notificacoes').then(setLista) }, [])

  const salvar = useCallback(async (item) => {
    const nova = lista.some(n => n.id === item.id)
      ? lista.map(n => n.id === item.id ? item : n)
      : [...lista, item]
    setLista(nova); await salvarSecao('Notificacoes', nova); setEditando(null)
    mostrarAlerta('Notificação salva!', 'sucesso')
  }, [lista])

  const remover = useCallback(async (id) => {
    if (!confirm('Excluir esta notificação?')) return
    const nova = lista.filter(n => n.id !== id); setLista(nova); await salvarSecao('Notificacoes', nova)
  }, [lista])

  const testar = useCallback(async (item) => {
    setTestando(item.id)
    try {
      if (item.tipo === 'desktop') {
        new Notification(item.titulo || 'KronTech', { body: item.mensagem || 'Notificação de teste' })
        mostrarAlerta('Notificação desktop disparada!', 'sucesso')
      } else if (item.tipo === 'toast') {
        mostrarAlerta(item.mensagem || 'Mensagem de teste', item.tipoToast || 'info')
      } else if (item.tipo === 'webhook') {
        await fetch(item.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mensagem: item.mensagem, sistema: 'KronTech', timestamp: new Date().toISOString() }) })
        mostrarAlerta('Webhook enviado!', 'sucesso')
      }
    } catch (e) { mostrarAlerta('Erro: ' + e.message, 'erro') }
    finally { setTestando(null) }
  }, [])

  const novo = () => setEditando({ id: genId(), nome: '', tipo: 'toast', titulo: 'KronTech', mensagem: '', tipoToast: 'info', url: '' })
  const iconTipo = { toast: Bell, desktop: Monitor, webhook: Globe, email: Mail }

  if (editando) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Btn variant="ghost" style={{ height: 30 }} onClick={() => setEditando(null)}><X size={13} /> Cancelar</Btn>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{editando.nome || 'Nova Notificação'}</span>
      </div>
      <Card>
        <Row gap={10}>
          <FInput label="Nome" value={editando.nome} onChange={e => setEditando(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Alerta de erro crítico..." />
          <FSelect label="Canal" value={editando.tipo} onChange={e => setEditando(p => ({ ...p, tipo: e.target.value }))}>
            <option value="toast">Toast (na tela)</option>
            <option value="desktop">Notificação desktop</option>
            <option value="webhook">Webhook (POST)</option>
          </FSelect>
        </Row>
      </Card>
      <Card>
        <SectionTitle>Conteúdo</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {(editando.tipo === 'desktop') && (
            <FInput label="Título" value={editando.titulo} onChange={e => setEditando(p => ({ ...p, titulo: e.target.value }))} />
          )}
          {editando.tipo === 'toast' && (
            <FSelect label="Tipo visual" value={editando.tipoToast} onChange={e => setEditando(p => ({ ...p, tipoToast: e.target.value }))}>
              {['sucesso','erro','aviso','info'].map(t => <option key={t} value={t}>{t}</option>)}
            </FSelect>
          )}
          <FInput label="Mensagem" value={editando.mensagem} onChange={e => setEditando(p => ({ ...p, mensagem: e.target.value }))} placeholder="Texto da notificação. Use {campo} para variáveis." />
          {editando.tipo === 'webhook' && (
            <FInput label="URL do webhook" value={editando.url} onChange={e => setEditando(p => ({ ...p, url: e.target.value }))} placeholder="https://hooks.slack.com/..." />
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
        <Btn onClick={novo}><Plus size={13} /> Nova Notificação</Btn>
      </div>
      {lista.length === 0
        ? <EmptyState icon={Bell} title="Nenhuma notificação configurada" subtitle="Toast, desktop, webhook — defina templates reutilizáveis e dispare com um clique ou por automação"
            action={<div style={{ display: 'flex', gap: 8 }}><Btn variant="ghost" onClick={carregarExemplos}><BookOpen size={13} /> Carregar Exemplos</Btn><Btn onClick={novo}><Plus size={13} /> Criar Template</Btn></div>} />
        : lista.map(n => {
          const Ic = iconTipo[n.tipo] || Bell
          return (
            <Card key={n.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ic size={15} color="var(--purple)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 2 }}>{n.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{n.tipo} · {n.mensagem?.slice(0, 60) || '—'}</div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <Btn size="sm" variant="ghost" disabled={testando === n.id} onClick={() => testar(n)}><Play size={12} /> Testar</Btn>
                  <button className="btn btn-ghost" style={{ height: 30 }} onClick={() => setEditando(n)}><Edit2 size={13} /></button>
                  <button className="btn btn-danger" style={{ height: 30 }} onClick={() => remover(n.id)}><Trash2 size={13} /></button>
                </div>
              </div>
            </Card>
          )
        })
      }
    </div>
  )
}
