import { useState, useEffect, useCallback } from 'react'
import { Zap, Plus, Save, Trash2, Edit2, X, Power, PowerOff, Filter, BookOpen } from 'lucide-react'
import { mostrarAlerta } from '../../lib/funcoes/index.js'
import { genId, Btn, FInput, FSelect, Row, SectionTitle, StatusBadge, EmptyState, Card } from './_shared.jsx'

function paraApi(a) {
  return {
    id: a.id, nome: a.nome, ativo: a.ativo ?? true,
    trigger_tipo: a.trigger.tipo, trigger_campo: a.trigger.campo || '', trigger_tabela: a.trigger.tabela || '',
    condicoes: a.condicoes, acoes: a.acoes,
  }
}
function daApi(a) {
  return {
    id: a.id, nome: a.nome, ativo: a.ativo,
    trigger: { tipo: a.trigger_tipo, campo: a.trigger_campo || '', tabela: a.trigger_tabela || '' },
    condicoes: a.condicoes || [], acoes: a.acoes || [],
  }
}

const TRIGGERS = [
  { value: 'ao_abrir',     label: 'Ao abrir tela'    },
  { value: 'ao_salvar',    label: 'Ao salvar registro'},
  { value: 'campo_muda',   label: 'Quando campo muda'},
  { value: 'manual',       label: 'Botão manual'     },
  { value: 'ao_excluir',   label: 'Ao excluir registro'},
]

const OPERADORES = [
  { value: 'igual',        label: 'é igual a'        },
  { value: 'diferente',    label: 'é diferente de'   },
  { value: 'maior',        label: 'maior que'         },
  { value: 'menor',        label: 'menor que'         },
  { value: 'contem',       label: 'contém'            },
  { value: 'vazio',        label: 'está vazio'        },
  { value: 'nao_vazio',    label: 'não está vazio'    },
]

const ACOES_TIPOS = [
  { value: 'alerta',        label: '🔔 Mostrar alerta'         },
  { value: 'definir_valor', label: '✏️ Definir valor de campo'  },
  { value: 'mostrar_campo', label: '👁️ Mostrar campo'           },
  { value: 'ocultar_campo', label: '🙈 Ocultar campo'           },
  { value: 'navegar',       label: '➡️ Navegar para tela'       },
  { value: 'executar_sql',  label: '🗄️ Executar SQL'            },
  { value: 'chamar_api',    label: '🌐 Chamar API'              },
  { value: 'exportar_csv',  label: '📥 Exportar dados como CSV' },
]

function AcaoForm({ acao, onChange, telas }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <FSelect label="Ação" value={acao.tipo} onChange={e => onChange({ ...acao, tipo: e.target.value })} style={{ minWidth: 200 }}>
        {ACOES_TIPOS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
      </FSelect>

      {(acao.tipo === 'alerta') && (
        <>
          <FInput label="Mensagem" value={acao.mensagem || ''} onChange={e => onChange({ ...acao, mensagem: e.target.value })} style={{ minWidth: 180 }} />
          <FSelect label="Tipo" value={acao.tipoAlerta || 'info'} onChange={e => onChange({ ...acao, tipoAlerta: e.target.value })} style={{ minWidth: 100 }}>
            {['info','sucesso','aviso','erro'].map(t => <option key={t} value={t}>{t}</option>)}
          </FSelect>
        </>
      )}
      {(acao.tipo === 'definir_valor' || acao.tipo === 'mostrar_campo' || acao.tipo === 'ocultar_campo') && (
        <FInput label="Nome do campo" value={acao.campo || ''} onChange={e => onChange({ ...acao, campo: e.target.value })} placeholder="nome_campo" />
      )}
      {acao.tipo === 'definir_valor' && (
        <FInput label="Valor" value={acao.valor || ''} onChange={e => onChange({ ...acao, valor: e.target.value })} placeholder="novo valor ou {campo}" />
      )}
      {acao.tipo === 'navegar' && (
        <FSelect label="Destino" value={acao.destino || ''} onChange={e => onChange({ ...acao, destino: e.target.value })} style={{ minWidth: 160 }}>
          <option value="">Selecione</option>
          {['dashboard','agenda','arquivos','sql'].map(r => <option key={r} value={r}>{r}</option>)}
          {telas.map(t => <option key={t.id} value={`fb__${t.nome_tabela}`}>{t.nome_tela}</option>)}
        </FSelect>
      )}
      {acao.tipo === 'executar_sql' && (
        <FInput label="SQL" value={acao.sql || ''} onChange={e => onChange({ ...acao, sql: e.target.value })} placeholder="UPDATE tabela SET..." />
      )}
      {acao.tipo === 'chamar_api' && (
        <FInput label="URL da API" value={acao.url || ''} onChange={e => onChange({ ...acao, url: e.target.value })} placeholder="https://..." />
      )}
    </div>
  )
}

const EXEMPLOS_AUTOMACOES = [
  { id: genId(), nome: 'Alerta de boas-vindas ao abrir', ativo: true, trigger: { tipo: 'ao_abrir', campo: '' }, condicoes: [], acoes: [{ id: genId(), tipo: 'alerta', mensagem: 'Bem-vindo! Preencha todos os campos obrigatórios antes de salvar.', tipoAlerta: 'info' }] },
  { id: genId(), nome: 'Confirmar antes de excluir', ativo: true, trigger: { tipo: 'ao_excluir', campo: '' }, condicoes: [], acoes: [{ id: genId(), tipo: 'alerta', mensagem: 'Registro excluído com sucesso.', tipoAlerta: 'sucesso' }] },
  { id: genId(), nome: 'Notificar ao salvar com sucesso', ativo: true, trigger: { tipo: 'ao_salvar', campo: '' }, condicoes: [], acoes: [{ id: genId(), tipo: 'alerta', mensagem: 'Registro salvo com sucesso!', tipoAlerta: 'sucesso' }] },
  { id: genId(), nome: 'Ocultar campo quando outro está vazio', ativo: false, trigger: { tipo: 'campo_muda', campo: 'tipo_pessoa' }, condicoes: [{ id: genId(), campo: 'tipo_pessoa', operador: 'igual', valor: 'fisica' }], acoes: [{ id: genId(), tipo: 'mostrar_campo', campo: 'cpf' }, { id: genId(), tipo: 'ocultar_campo', campo: 'cnpj' }] },
]

export default function SecaoAutomacoes({ telas }) {
  const [lista, setLista]     = useState([])
  const [editando, setEditando] = useState(null)
  const [busca, setBusca]     = useState('')

  useEffect(() => {
    window.api.funcoes.listarAutomacoes().then(res => res.ok && setLista(res.data.map(daApi)))
  }, [])

  const carregarExemplos = useCallback(async () => {
    const novos = EXEMPLOS_AUTOMACOES.map(e => ({ ...e, id: genId(), acoes: e.acoes.map(a => ({ ...a, id: genId() })), condicoes: e.condicoes.map(c => ({ ...c, id: genId() })) }))
    const criadas = []
    for (const a of novos) {
      const res = await window.api.funcoes.criarAutomacao(paraApi(a))
      if (res.ok) criadas.push(daApi(res.data))
    }
    setLista(prev => [...prev, ...criadas])
    mostrarAlerta(`${criadas.length} automações de exemplo carregadas!`, 'sucesso')
  }, [])

  const salvar = useCallback(async (atualizada) => {
    const existe = lista.some(a => a.id === atualizada.id)
    const res = existe
      ? await window.api.funcoes.atualizarAutomacao(paraApi(atualizada))
      : await window.api.funcoes.criarAutomacao(paraApi(atualizada))
    if (!res.ok) { mostrarAlerta(res.erro || 'Erro ao salvar', 'erro'); return }
    const salva = daApi(res.data)
    setLista(prev => existe ? prev.map(a => a.id === salva.id ? salva : a) : [...prev, salva])
    setEditando(null)
    mostrarAlerta('Automação salva!', 'sucesso')
  }, [lista])

  const remover = useCallback(async (id) => {
    if (!confirm('Excluir esta automação?')) return
    await window.api.funcoes.excluirAutomacao(id)
    setLista(prev => prev.filter(a => a.id !== id))
  }, [])

  const toggleAtivo = useCallback(async (a) => {
    const res = await window.api.funcoes.atualizarAutomacao(paraApi({ ...a, ativo: !a.ativo }))
    if (res.ok) setLista(prev => prev.map(x => x.id === a.id ? daApi(res.data) : x))
  }, [])

  const novaAutomacao = () => setEditando({
    id: genId(), nome: '', ativo: true,
    trigger: { tipo: 'ao_salvar', campo: '' },
    condicoes: [],
    acoes: [{ id: genId(), tipo: 'alerta', mensagem: '', tipoAlerta: 'info' }],
  })

  const filtradas = lista.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()))

  if (editando) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn btn-ghost" style={{ height: 30 }} onClick={() => setEditando(null)}><X size={13} /> Cancelar</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>
          {editando.nome || 'Nova Automação'}
        </span>
      </div>

      <Card>
        <SectionTitle>Identificação</SectionTitle>
        <div style={{ marginTop: 8 }}>
          <FInput label="Nome da automação" value={editando.nome}
            onChange={e => setEditando(p => ({ ...p, nome: e.target.value }))}
            placeholder="Ex: Calcular total ao salvar, Validar CPF..." />
        </div>
      </Card>

      <Card>
        <SectionTitle>Gatilho: quando executar</SectionTitle>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <FSelect label="Evento" value={editando.trigger.tipo}
            onChange={e => setEditando(p => ({ ...p, trigger: { ...p.trigger, tipo: e.target.value } }))}>
            {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </FSelect>
          {editando.trigger.tipo === 'campo_muda' && (
            <FInput label="Nome do campo" value={editando.trigger.campo || ''}
              onChange={e => setEditando(p => ({ ...p, trigger: { ...p.trigger, campo: e.target.value } }))}
              placeholder="nome_do_campo" />
          )}
          {editando.trigger.tipo !== 'manual' && (
            <FSelect label="Tela" value={editando.trigger.tabela || ''}
              onChange={e => setEditando(p => ({ ...p, trigger: { ...p.trigger, tabela: e.target.value } }))} style={{ minWidth: 200 }}>
              <option value="">Todas as telas</option>
              {telas.map(t => <option key={t.id} value={t.nome_tabela}>{t.nome_tela}</option>)}
            </FSelect>
          )}
        </div>
      </Card>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <SectionTitle>Condições (todas devem ser verdadeiras)</SectionTitle>
          <Btn size="sm" variant="ghost" onClick={() => setEditando(p => ({ ...p, condicoes: [...p.condicoes, { id: genId(), campo: '', operador: 'igual', valor: '' }] }))}>
            <Plus size={11} /> Condição
          </Btn>
        </div>
        {editando.condicoes.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>Sem condições, sempre executa ao gatilho.</div>
        )}
        {editando.condicoes.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8, flexWrap: 'wrap' }}>
            {i > 0 && <span style={{ fontSize: 10, color: 'var(--or)', fontWeight: 700, alignSelf: 'center', minWidth: 20 }}>E</span>}
            <FInput label="Campo" value={c.campo} onChange={e => setEditando(p => ({ ...p, condicoes: p.condicoes.map((x, j) => j === i ? { ...x, campo: e.target.value } : x) }))} placeholder="nome_campo" />
            <FSelect label="Operador" value={c.operador} onChange={e => setEditando(p => ({ ...p, condicoes: p.condicoes.map((x, j) => j === i ? { ...x, operador: e.target.value } : x) }))}>
              {OPERADORES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </FSelect>
            {!['vazio','nao_vazio'].includes(c.operador) && (
              <FInput label="Valor" value={c.valor} onChange={e => setEditando(p => ({ ...p, condicoes: p.condicoes.map((x, j) => j === i ? { ...x, valor: e.target.value } : x) }))} placeholder="valor ou {campo}" />
            )}
            <button className="btn btn-danger" style={{ height: 32 }} onClick={() => setEditando(p => ({ ...p, condicoes: p.condicoes.filter((_, j) => j !== i) }))}><Trash2 size={12} /></button>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <SectionTitle>Ações: o que fazer</SectionTitle>
          <Btn size="sm" variant="ghost" onClick={() => setEditando(p => ({ ...p, acoes: [...p.acoes, { id: genId(), tipo: 'alerta', mensagem: '', tipoAlerta: 'info' }] }))}>
            <Plus size={11} /> Ação
          </Btn>
        </div>
        {editando.acoes.map((a, i) => (
          <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 10, padding: '10px 12px', background: 'var(--s2)', borderRadius: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--or)', minWidth: 18, alignSelf: 'center' }}>{i + 1}.</span>
            <AcaoForm acao={a} telas={telas} onChange={novo => setEditando(p => ({ ...p, acoes: p.acoes.map((x, j) => j === i ? novo : x) }))} />
            {editando.acoes.length > 1 && (
              <button className="btn btn-danger" style={{ height: 32 }} onClick={() => setEditando(p => ({ ...p, acoes: p.acoes.filter((_, j) => j !== i) }))}><Trash2 size={12} /></button>
            )}
          </div>
        ))}
      </Card>

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn onClick={() => salvar(editando)} disabled={!editando.nome.trim()}><Save size={13} /> Salvar Automação</Btn>
        <Btn variant="ghost" onClick={() => setEditando(null)}>Cancelar</Btn>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 9, padding: '0 10px', flex: 1, maxWidth: 320, height: 32 }}>
          <Filter size={12} color="var(--t3)" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Filtrar automações..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: 'var(--t1)', width: '100%' }} />
        </div>
        <Btn onClick={novaAutomacao}><Plus size={13} /> Nova Automação</Btn>
      </div>

      {filtradas.length === 0
        ? <EmptyState icon={Zap} title="Nenhuma automação" subtitle="Crie regras visuais: quando um evento acontece → executar ações automaticamente"
            action={<div style={{ display: 'flex', gap: 8 }}><Btn variant="ghost" onClick={carregarExemplos}><BookOpen size={13} /> Carregar Exemplos</Btn><Btn onClick={novaAutomacao}><Plus size={13} /> Criar Automação</Btn></div>} />
        : filtradas.map(a => (
          <Card key={a.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--or4)', border: '1px solid rgba(255,107,43,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={15} color="var(--or)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{a.nome}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                  {TRIGGERS.find(t => t.value === a.trigger?.tipo)?.label}
                  {a.condicoes?.length > 0 && ` · ${a.condicoes.length} condição(ões)`}
                  {' · '}{a.acoes?.length || 0} ação(ões)
                </div>
              </div>
              <StatusBadge ativo={a.ativo} />
              <div style={{ display: 'flex', gap: 5 }}>
                <button className="btn btn-ghost" style={{ height: 30, color: a.ativo ? 'var(--green)' : 'var(--t3)' }} onClick={() => toggleAtivo(a)} title={a.ativo ? 'Desativar' : 'Ativar'}>
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
