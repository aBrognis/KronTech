import { useState, useEffect, useCallback } from 'react'
import { Globe, Plus, Play, RefreshCw, X, Save, Edit2, Trash2, BookOpen } from 'lucide-react'
import { mostrarAlerta } from '../../lib/funcoes/index.js'
import { genId, carregarSecao, salvarSecao, Btn, FInput, FSelect, FTextarea, Row, SectionTitle, EmptyState, Card } from './_shared.jsx'

const EXEMPLOS_INTEGRACOES = [
  { nome: 'Consultar CEP (ViaCEP)', url: 'https://viacep.com.br/ws/01310100/json/', metodo: 'GET', headers: '{}', body: '', authTipo: 'none', authToken: '', ativo: true },
  { nome: 'IP público (ipify)', url: 'https://api.ipify.org?format=json', metodo: 'GET', headers: '{}', body: '', authTipo: 'none', authToken: '', ativo: true },
  { nome: 'Cotação USD (exchangerate)', url: 'https://open.er-api.com/v6/latest/USD', metodo: 'GET', headers: '{}', body: '', authTipo: 'none', authToken: '', ativo: true },
  { nome: 'Webhook Slack (modelo)', url: 'https://hooks.slack.com/services/SEU_TOKEN_AQUI', metodo: 'POST', headers: '{"Content-Type":"application/json"}', body: '{"text": "Mensagem do KronTech: {mensagem}"}', authTipo: 'none', authToken: '', ativo: false },
]

export default function SecaoIntegracoes() {
  const [lista, setLista]       = useState([])
  const [editando, setEditando] = useState(null)
  const [testando, setTestando] = useState(null)
  const [testRes, setTestRes]   = useState({})

  const carregarExemplos = useCallback(async () => {
    const novos = EXEMPLOS_INTEGRACOES.map(e => ({ ...e, id: genId() }))
    const nova = [...lista, ...novos]; setLista(nova); await salvarSecao('Integracoes', nova)
    mostrarAlerta(`${novos.length} integrações de exemplo carregadas!`, 'sucesso')
  }, [lista])

  useEffect(() => { carregarSecao('Integracoes').then(setLista) }, [])

  const salvar = useCallback(async (item) => {
    const nova = lista.some(i => i.id === item.id)
      ? lista.map(i => i.id === item.id ? item : i)
      : [...lista, item]
    setLista(nova); await salvarSecao('Integracoes', nova); setEditando(null)
    mostrarAlerta('Integração salva!', 'sucesso')
  }, [lista])

  const remover = useCallback(async (id) => {
    if (!confirm('Excluir esta integração?')) return
    const nova = lista.filter(i => i.id !== id); setLista(nova); await salvarSecao('Integracoes', nova)
  }, [lista])

  const testar = useCallback(async (item) => {
    setTestando(item.id); setTestRes(p => ({ ...p, [item.id]: null }))
    const inicio = Date.now()
    try {
      const opts = { method: item.metodo || 'GET', headers: { 'Content-Type': 'application/json' } }
      if (item.authTipo === 'bearer' && item.authToken) opts.headers['Authorization'] = `Bearer ${item.authToken}`
      if (item.authTipo === 'basic' && item.authToken) opts.headers['Authorization'] = `Basic ${btoa(item.authToken)}`
      try { const h = JSON.parse(item.headers || '{}'); Object.assign(opts.headers, h) } catch {}
      if (['POST','PUT','PATCH'].includes(item.metodo) && item.body) opts.body = item.body
      const r = await fetch(item.url, opts)
      const text = await r.text(); let data = text
      try { data = JSON.parse(text) } catch {}
      setTestRes(p => ({ ...p, [item.id]: { ok: r.ok, status: r.status, ms: Date.now() - inicio, data } }))
    } catch (e) {
      setTestRes(p => ({ ...p, [item.id]: { ok: false, status: 0, ms: Date.now() - inicio, data: e.message } }))
    } finally { setTestando(null) }
  }, [])

  const novaIntegracao = () => setEditando({ id: genId(), nome: '', url: '', metodo: 'GET', headers: '{}', body: '', authTipo: 'none', authToken: '', ativo: true })

  const colorMetodo = { GET: 'var(--green)', POST: 'var(--or)', PUT: 'var(--blue)', PATCH: 'var(--yellow)', DELETE: 'var(--red)' }

  if (editando) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Btn variant="ghost" style={{ height: 30 }} onClick={() => setEditando(null)}><X size={13} /> Cancelar</Btn>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{editando.nome || 'Nova Integração'}</span>
      </div>
      <Card>
        <SectionTitle>Identificação</SectionTitle>
        <Row gap={10} style={{ marginTop: 8 }}>
          <FInput label="Nome" value={editando.nome} onChange={e => setEditando(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Minha API, Webhook Slack..." />
        </Row>
      </Card>
      <Card>
        <SectionTitle>Endpoint</SectionTitle>
        <Row gap={10} style={{ marginTop: 8 }}>
          <FSelect label="Método" value={editando.metodo} onChange={e => setEditando(p => ({ ...p, metodo: e.target.value }))} style={{ minWidth: 90 }}>
            {['GET','POST','PUT','PATCH','DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
          </FSelect>
          <FInput label="URL" value={editando.url} onChange={e => setEditando(p => ({ ...p, url: e.target.value }))} placeholder="https://api.exemplo.com/endpoint" />
        </Row>
      </Card>
      <Card>
        <SectionTitle>Autenticação</SectionTitle>
        <Row gap={10} style={{ marginTop: 8 }}>
          <FSelect label="Tipo" value={editando.authTipo} onChange={e => setEditando(p => ({ ...p, authTipo: e.target.value }))} style={{ minWidth: 130 }}>
            <option value="none">Sem autenticação</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth (user:pass)</option>
            <option value="apikey">API Key (header)</option>
          </FSelect>
          {editando.authTipo !== 'none' && (
            <FInput label={editando.authTipo === 'apikey' ? 'Valor da chave' : 'Token / Credencial'}
              value={editando.authToken} onChange={e => setEditando(p => ({ ...p, authToken: e.target.value }))} />
          )}
          {editando.authTipo === 'apikey' && (
            <FInput label="Nome do header" value={editando.authKeyHeader || 'X-API-Key'}
              onChange={e => setEditando(p => ({ ...p, authKeyHeader: e.target.value }))} style={{ maxWidth: 160 }} />
          )}
        </Row>
      </Card>
      <Card>
        <SectionTitle>Headers adicionais (JSON)</SectionTitle>
        <FTextarea style={{ marginTop: 8 }} value={editando.headers} rows={3}
          onChange={e => setEditando(p => ({ ...p, headers: e.target.value }))}
          placeholder={'{\n  "Accept": "application/json"\n}'} />
      </Card>
      {['POST','PUT','PATCH'].includes(editando.metodo) && (
        <Card>
          <SectionTitle>Body (JSON / texto)</SectionTitle>
          <FTextarea style={{ marginTop: 8 }} value={editando.body} rows={4}
            onChange={e => setEditando(p => ({ ...p, body: e.target.value }))}
            placeholder={'{\n  "campo": "{valor_campo}"\n}'} />
        </Card>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn onClick={() => salvar(editando)} disabled={!editando.nome.trim() || !editando.url.trim()}><Save size={13} /> Salvar</Btn>
        <Btn variant="ghost" onClick={() => setEditando(null)}>Cancelar</Btn>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn onClick={novaIntegracao}><Plus size={13} /> Nova Integração</Btn>
      </div>
      {lista.length === 0
        ? <EmptyState icon={Globe} title="Nenhuma integração" subtitle="Conecte APIs REST, webhooks e serviços externos. Exemplos prontos: ViaCEP, Slack, cotação de moeda."
            action={<div style={{ display: 'flex', gap: 8 }}><Btn variant="ghost" onClick={carregarExemplos}><BookOpen size={13} /> Carregar Exemplos</Btn><Btn onClick={novaIntegracao}><Plus size={13} /> Adicionar API</Btn></div>} />
        : lista.map(item => {
          const tr = testRes[item.id]
          return (
            <Card key={item.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(96,165,250,.1)', border: '1px solid rgba(96,165,250,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Globe size={15} color="var(--blue)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{item.nome}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: colorMetodo[item.metodo] || 'var(--t2)', background: 'var(--s3)', padding: '1px 7px', borderRadius: 5 }}>{item.metodo}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.url}</div>
                </div>
                {tr && (
                  <span style={{ fontSize: 11, color: tr.ok ? 'var(--green)' : 'var(--red)', fontWeight: 600, flexShrink: 0 }}>
                    {tr.ok ? '✓' : '✗'} {tr.status} · {tr.ms}ms
                  </span>
                )}
                <div style={{ display: 'flex', gap: 5 }}>
                  <Btn size="sm" variant="ghost" disabled={testando === item.id} onClick={() => testar(item)}>
                    {testando === item.id ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={12} />}
                    Testar
                  </Btn>
                  <button className="btn btn-ghost" style={{ height: 30 }} onClick={() => setEditando(item)}><Edit2 size={13} /></button>
                  <button className="btn btn-danger" style={{ height: 30 }} onClick={() => remover(item.id)}><Trash2 size={13} /></button>
                </div>
              </div>
              {tr?.data !== undefined && (
                <pre style={{ marginTop: 8, fontSize: 10, fontFamily: 'monospace', background: 'var(--s3)', border: '1px solid var(--bd)', borderRadius: 8, padding: '8px 12px', color: tr.ok ? 'var(--t2)' : 'var(--red)', overflowX: 'auto', maxHeight: 120, whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: '8px 0 0' }}>
                  {typeof tr.data === 'string' ? tr.data : JSON.stringify(tr.data, null, 2)}
                </pre>
              )}
            </Card>
          )
        })
      }
    </div>
  )
}
