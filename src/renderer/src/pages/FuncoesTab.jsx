import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Zap, Database, Globe, Calendar, Bell, BarChart2, GitBranch, BookOpen,
  Plus, Play, Save, Trash2, Edit2, Check, X, RefreshCw, Copy, ExternalLink,
  ChevronDown, ChevronRight, Power, PowerOff, Code, Filter, ArrowRight,
  Clipboard, Wrench, Monitor, Compass, FolderOpen, Send, Activity,
  AlertTriangle, CheckCircle, Clock, Layers, Terminal, Settings,
  Hash, Type, DollarSign, Mail, Phone, ToggleLeft, Download, Eye,
  HelpCircle, Lightbulb, CheckSquare, XCircle, Info,
} from 'lucide-react'
import {
  copiarTexto, mostrarAlerta, formatarData, formatarMoeda,
  formatarCPF, formatarCNPJ, validarEmail, gerarID,
  abrirTela, exportarCSV, executarSQL,
} from '../lib/funcoes/index.js'

// ── Helpers de storage ────────────────────────────────────────────────────────
function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

async function carregarSecao(chave, fallback = []) {
  try { const cfg = await window.api.config.get(); return cfg?.[chave] ?? fallback }
  catch { return fallback }
}
async function salvarSecao(chave, valor) {
  try { await window.api.config.setSection(chave, valor) } catch { /* sem config */ }
}

// ── Primitivos de UI ──────────────────────────────────────────────────────────
function Btn({ children, variant = 'primary', size = 'md', disabled, onClick, title, style }) {
  const h = size === 'sm' ? 28 : 32
  const fs = size === 'sm' ? 11 : 12
  return (
    <button className={`btn btn-${variant}`} style={{ height: h, fontSize: fs, flexShrink: 0, ...style }}
      disabled={disabled} onClick={onClick} title={title}>
      {children}
    </button>
  )
}

function FInput({ label, style, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 100, ...style }}>
      {label && <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', letterSpacing: .5 }}>{label}</label>}
      <input className="form-input" style={{ height: 32 }} {...props} />
    </div>
  )
}

function FSelect({ label, style, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 110, ...style }}>
      {label && <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', letterSpacing: .5 }}>{label}</label>}
      <select className="form-select" style={{ height: 32 }} {...props}>{children}</select>
    </div>
  )
}

function FTextarea({ label, style, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, ...style }}>
      {label && <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', letterSpacing: .5 }}>{label}</label>}
      <textarea className="form-input" style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, padding: '8px 10px', ...props.style }} {...props} />
    </div>
  )
}

function Row({ children, gap = 8 }) {
  return <div style={{ display: 'flex', gap, alignItems: 'flex-end', flexWrap: 'wrap' }}>{children}</div>
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 }}>{children}</div>
}

function StatusBadge({ ativo }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, letterSpacing: .3,
      background: ativo ? 'rgba(74,222,128,.12)' : 'var(--s3)',
      color: ativo ? 'var(--green)' : 'var(--t3)',
      border: `1px solid ${ativo ? 'rgba(74,222,128,.25)' : 'var(--bd)'}` }}>
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  )
}

function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: 'var(--t3)', textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--s2)', border: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} strokeWidth={1.25} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12 }}>{subtitle}</div>
      </div>
      {action}
    </div>
  )
}

function Card({ children, style }) {
  return (
    <div style={{ background: 'var(--s1)', border: '1.5px solid var(--bd)', borderRadius: 12, padding: '14px 16px', boxShadow: 'var(--sh-xs)', ...style }}>
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 1 — AUTOMAÇÕES (regras visuais)
// ═══════════════════════════════════════════════════════════════════════════════

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
          <option value="">— selecione —</option>
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

function SecaoAutomacoes({ telas }) {
  const [lista, setLista]     = useState([])
  const [editando, setEditando] = useState(null)
  const [busca, setBusca]     = useState('')

  useEffect(() => { carregarSecao('Automacoes').then(setLista) }, [])

  const carregarExemplos = useCallback(async () => {
    const novos = EXEMPLOS_AUTOMACOES.map(e => ({ ...e, id: genId(), acoes: e.acoes.map(a => ({ ...a, id: genId() })), condicoes: e.condicoes.map(c => ({ ...c, id: genId() })) }))
    const nova = [...lista, ...novos]; setLista(nova); await salvarSecao('Automacoes', nova)
    mostrarAlerta(`${novos.length} automações de exemplo carregadas!`, 'sucesso')
  }, [lista])

  const salvar = useCallback(async (atualizada) => {
    const nova = lista.some(a => a.id === atualizada.id)
      ? lista.map(a => a.id === atualizada.id ? atualizada : a)
      : [...lista, atualizada]
    setLista(nova)
    await salvarSecao('Automacoes', nova)
    setEditando(null)
    mostrarAlerta('Automação salva!', 'sucesso')
  }, [lista])

  const remover = useCallback(async (id) => {
    if (!confirm('Excluir esta automação?')) return
    const nova = lista.filter(a => a.id !== id)
    setLista(nova)
    await salvarSecao('Automacoes', nova)
  }, [lista])

  const toggleAtivo = useCallback(async (id) => {
    const nova = lista.map(a => a.id === id ? { ...a, ativo: !a.ativo } : a)
    setLista(nova)
    await salvarSecao('Automacoes', nova)
  }, [lista])

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
        <SectionTitle>Gatilho — quando executar</SectionTitle>
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
          <div style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>Sem condições — sempre executa ao gatilho.</div>
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
          <SectionTitle>Ações — o que fazer</SectionTitle>
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
                <button className="btn btn-ghost" style={{ height: 30, color: a.ativo ? 'var(--green)' : 'var(--t3)' }} onClick={() => toggleAtivo(a.id)} title={a.ativo ? 'Desativar' : 'Ativar'}>
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

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 2 — SCRIPTS SQL
// ═══════════════════════════════════════════════════════════════════════════════

const EXEMPLOS_SCRIPTS = [
  { nome: 'Info do banco',          descricao: 'Versão e informações do servidor PostgreSQL', sql: `SELECT version() AS versao_postgres,\n  current_database() AS banco,\n  current_user AS usuario,\n  NOW() AS data_hora_servidor,\n  pg_size_pretty(pg_database_size(current_database())) AS tamanho_banco` },
  { nome: 'Listar tabelas',         descricao: 'Todas as tabelas do banco com contagem de linhas estimada', sql: `SELECT\n  schemaname AS schema,\n  tablename AS tabela,\n  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS tamanho\nFROM pg_tables\nWHERE schemaname = 'public'\nORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC` },
  { nome: 'Registros por dia',      descricao: 'Conta registros agrupados por dia (precisa ter coluna criado_em)', sql: `SELECT\n  DATE(criado_em) AS dia,\n  COUNT(*) AS total\nFROM sua_tabela\nWHERE criado_em >= NOW() - INTERVAL '30 days'\nGROUP BY DATE(criado_em)\nORDER BY dia DESC` },
  { nome: 'Buscar duplicados',      descricao: 'Encontra registros com valor duplicado em uma coluna', sql: `SELECT email, COUNT(*) AS ocorrencias\nFROM sua_tabela\nGROUP BY email\nHAVING COUNT(*) > 1\nORDER BY ocorrencias DESC` },
  { nome: 'Top 10 maiores tabelas', descricao: 'Lista as 10 maiores tabelas por tamanho em disco', sql: `SELECT\n  relname AS tabela,\n  pg_size_pretty(pg_total_relation_size(oid)) AS tamanho_total,\n  pg_size_pretty(pg_relation_size(oid)) AS tamanho_dados\nFROM pg_class\nWHERE relkind = 'r'\nORDER BY pg_total_relation_size(oid) DESC\nLIMIT 10` },
]

function SecaoScripts() {
  const [scripts, setScripts]       = useState([])
  const [ativo, setAtivo]           = useState(null)
  const [resultado, setResultado]   = useState(null)
  const [executando, setExecutando] = useState(false)
  const [editandoNome, setEditandoNome] = useState(false)

  useEffect(() => {
    carregarSecao('Scripts').then(s => {
      const lista = s.length ? s : [{
        id: genId(), nome: 'Consulta inicial', sql: 'SELECT NOW() AS agora, current_database() AS banco, current_user AS usuario', descricao: 'Informações do banco',
      }]
      setScripts(lista); setAtivo(lista[0].id)
    })
  }, [])

  const carregarExemplos = useCallback(async (all) => {
    const novos = EXEMPLOS_SCRIPTS.map(e => ({ ...e, id: genId() }))
    const nova = [...all, ...novos]
    setScripts(nova); setAtivo(novos[0].id); await salvarSecao('Scripts', nova)
    mostrarAlerta(`${novos.length} scripts de exemplo carregados!`, 'sucesso')
  }, [])

  const scriptAtivo = scripts.find(s => s.id === ativo)

  const atualizar = useCallback((id, patch) => {
    setScripts(prev => {
      const nova = prev.map(s => s.id === id ? { ...s, ...patch } : s)
      salvarSecao('Scripts', nova)
      return nova
    })
  }, [])

  const novoScript = () => {
    const s = { id: genId(), nome: 'Novo Script', sql: '-- Escreva seu SQL aqui\nSELECT ', descricao: '' }
    setScripts(prev => { const nova = [...prev, s]; salvarSecao('Scripts', nova); return nova })
    setAtivo(s.id); setResultado(null)
  }

  const remover = (id) => {
    if (!confirm('Excluir este script?')) return
    setScripts(prev => {
      const nova = prev.filter(s => s.id !== id)
      salvarSecao('Scripts', nova)
      if (ativo === id) setAtivo(nova[0]?.id || null)
      return nova
    })
  }

  const executar = useCallback(async () => {
    if (!scriptAtivo?.sql?.trim()) return
    setExecutando(true); setResultado(null)
    const inicio = Date.now()
    try {
      const res = await executarSQL(scriptAtivo.sql)
      setResultado({ ok: true, rows: res.rows || [], rowCount: res.rowCount ?? 0, command: res.command, ms: Date.now() - inicio })
    } catch (e) {
      setResultado({ ok: false, erro: e.message, ms: Date.now() - inicio })
    } finally { setExecutando(false) }
  }, [scriptAtivo])

  const exportar = () => {
    if (!resultado?.rows?.length) return
    exportarCSV(resultado.rows, `${scriptAtivo.nome || 'resultado'}.csv`)
  }

  return (
    <div style={{ display: 'flex', gap: 14, height: '100%', minHeight: 0 }}>
      {/* Lista de scripts */}
      <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Btn size="sm" onClick={novoScript}><Plus size={12} /> Novo Script</Btn>
        <Btn size="sm" variant="ghost" onClick={() => carregarExemplos(scripts)}><BookOpen size={12} /> Exemplos</Btn>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {scripts.map(s => (
            <div key={s.id} onClick={() => { setAtivo(s.id); setResultado(null) }}
              style={{ padding: '9px 11px', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                background: ativo === s.id ? 'var(--or4)' : 'var(--s2)',
                border: `1.5px solid ${ativo === s.id ? 'rgba(255,107,43,.3)' : 'var(--bd)'}` }}>
              <Terminal size={12} color={ativo === s.id ? 'var(--or)' : 'var(--t3)'} />
              <span style={{ fontSize: 12, fontWeight: ativo === s.id ? 700 : 400, color: ativo === s.id ? 'var(--or)' : 'var(--t1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.nome}
              </span>
              <button onClick={e => { e.stopPropagation(); remover(s.id) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 0, display: 'flex', opacity: 0.6 }}>
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor + resultado */}
      {scriptAtivo ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          {/* Nome + desc */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <FInput label="Nome" value={scriptAtivo.nome}
              onChange={e => atualizar(scriptAtivo.id, { nome: e.target.value })} style={{ maxWidth: 240 }} />
            <FInput label="Descrição (opcional)" value={scriptAtivo.descricao || ''}
              onChange={e => atualizar(scriptAtivo.id, { descricao: e.target.value })} />
          </div>

          {/* Editor SQL */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <SectionTitle>Editor SQL</SectionTitle>
              <div style={{ display: 'flex', gap: 6 }}>
                {resultado?.ok && resultado.rows.length > 0 && (
                  <Btn size="sm" variant="ghost" onClick={exportar}><Download size={12} /> Exportar CSV</Btn>
                )}
                <Btn size="sm" onClick={executar} disabled={executando}>
                  {executando ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={12} />}
                  {executando ? 'Executando...' : 'Executar (F5)'}
                </Btn>
              </div>
            </div>
            <textarea
              value={scriptAtivo.sql}
              onChange={e => atualizar(scriptAtivo.id, { sql: e.target.value })}
              onKeyDown={e => { if (e.key === 'F5' || (e.ctrlKey && e.key === 'Enter')) { e.preventDefault(); executar() } }}
              spellCheck={false}
              style={{
                flex: resultado ? 'none' : 1, height: resultado ? 160 : undefined,
                minHeight: 120, resize: 'vertical',
                fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                fontSize: 12.5, lineHeight: 1.7, padding: '12px 14px',
                background: 'var(--s2)', border: '1.5px solid var(--bd)', borderRadius: 10,
                color: 'var(--t1)', outline: 'none', width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Resultado */}
          {resultado && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {resultado.ok
                  ? <CheckCircle size={13} color="var(--green)" />
                  : <AlertTriangle size={13} color="var(--red)" />}
                <span style={{ fontSize: 11, color: resultado.ok ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                  {resultado.ok
                    ? `${resultado.command} · ${resultado.rowCount} linha(s) · ${resultado.ms}ms`
                    : `Erro · ${resultado.ms}ms`}
                </span>
              </div>
              {!resultado.ok && (
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--red)', background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 8, padding: '8px 12px', whiteSpace: 'pre-wrap' }}>
                  {resultado.erro}
                </div>
              )}
              {resultado.ok && resultado.rows.length > 0 && (
                <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--bd)', maxHeight: 200 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: 'var(--s3)' }}>
                        {Object.keys(resultado.rows[0]).map(k => (
                          <th key={k} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--t3)', fontSize: 10, letterSpacing: .5, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)', whiteSpace: 'nowrap' }}>{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.rows.slice(0, 100).map((r, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'var(--s1)' : 'var(--s2)' }}>
                          {Object.values(r).map((v, j) => (
                            <td key={j} style={{ padding: '5px 10px', color: 'var(--t2)', borderBottom: '1px solid var(--bd)', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {v === null ? <span style={{ color: 'var(--t3)', fontStyle: 'italic' }}>null</span> : String(v)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {resultado.rows.length > 100 && (
                    <div style={{ fontSize: 10, color: 'var(--t3)', padding: '4px 10px', background: 'var(--s3)', borderTop: '1px solid var(--bd)' }}>
                      Exibindo 100 de {resultado.rows.length} linhas. Exporte CSV para ver todos.
                    </div>
                  )}
                </div>
              )}
              {resultado.ok && resultado.rows.length === 0 && (
                <div style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>Sem resultados retornados.</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <EmptyState icon={Terminal} title="Nenhum script" subtitle="Crie scripts SQL reutilizáveis"
          action={<Btn onClick={novoScript}><Plus size={13} /> Novo Script</Btn>} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 3 — INTEGRAÇÕES (HTTP APIs)
// ═══════════════════════════════════════════════════════════════════════════════

const EXEMPLOS_INTEGRACOES = [
  { nome: 'Consultar CEP (ViaCEP)', url: 'https://viacep.com.br/ws/01310100/json/', metodo: 'GET', headers: '{}', body: '', authTipo: 'none', authToken: '', ativo: true },
  { nome: 'IP público (ipify)', url: 'https://api.ipify.org?format=json', metodo: 'GET', headers: '{}', body: '', authTipo: 'none', authToken: '', ativo: true },
  { nome: 'Cotação USD (exchangerate)', url: 'https://open.er-api.com/v6/latest/USD', metodo: 'GET', headers: '{}', body: '', authTipo: 'none', authToken: '', ativo: true },
  { nome: 'Webhook Slack (modelo)', url: 'https://hooks.slack.com/services/SEU_TOKEN_AQUI', metodo: 'POST', headers: '{"Content-Type":"application/json"}', body: '{"text": "Mensagem do KronTech: {mensagem}"}', authTipo: 'none', authToken: '', ativo: false },
]

function SecaoIntegracoes() {
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

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 4 — AGENDAMENTOS
// ═══════════════════════════════════════════════════════════════════════════════

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

function SecaoAgendamentos({ scripts }) {
  const [lista, setLista]       = useState([])
  const [editando, setEditando] = useState(null)

  useEffect(() => { carregarSecao('Agendamentos').then(setLista) }, [])

  const salvar = useCallback(async (item) => {
    const nova = lista.some(a => a.id === item.id)
      ? lista.map(a => a.id === item.id ? item : a)
      : [...lista, item]
    setLista(nova); await salvarSecao('Agendamentos', nova); setEditando(null)
    mostrarAlerta('Agendamento salvo!', 'sucesso')
  }, [lista])

  const remover = useCallback(async (id) => {
    if (!confirm('Excluir este agendamento?')) return
    const nova = lista.filter(a => a.id !== id); setLista(nova); await salvarSecao('Agendamentos', nova)
  }, [lista])

  const toggleAtivo = useCallback(async (id) => {
    const nova = lista.map(a => a.id === id ? { ...a, ativo: !a.ativo } : a)
    setLista(nova); await salvarSecao('Agendamentos', nova)
  }, [lista])

  const novo = () => setEditando({ id: genId(), nome: '', intervalo: '1h', cron: '0 * * * *', acao: { tipo: 'script', id: '' }, ativo: false })

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
              <option value="">— selecione —</option>
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
                <button className="btn btn-ghost" style={{ height: 30, color: a.ativo ? 'var(--green)' : 'var(--t3)' }} onClick={() => toggleAtivo(a.id)}>
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

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 5 — NOTIFICAÇÕES
// ═══════════════════════════════════════════════════════════════════════════════

const EXEMPLOS_NOTIFICACOES = [
  { nome: 'Salvo com sucesso', tipo: 'toast', titulo: 'KronTech', mensagem: 'Registro salvo com sucesso!', tipoToast: 'sucesso', url: '' },
  { nome: 'Erro de validação', tipo: 'toast', titulo: 'KronTech', mensagem: 'Preencha todos os campos obrigatórios antes de continuar.', tipoToast: 'erro', url: '' },
  { nome: 'Aviso de prazo', tipo: 'desktop', titulo: 'KronTech — Lembrete', mensagem: 'Você tem tarefas com prazo para hoje. Acesse o painel para verificar.', tipoToast: 'aviso', url: '' },
  { nome: 'Notificação informativa', tipo: 'toast', titulo: 'KronTech', mensagem: 'Nova atualização disponível. Reinicie o sistema para aplicar.', tipoToast: 'info', url: '' },
]

function SecaoNotificacoes() {
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

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 6 — RELATÓRIOS (SQL salvos com export)
// ═══════════════════════════════════════════════════════════════════════════════

const EXEMPLOS_RELATORIOS = [
  { nome: 'Status do servidor', descricao: 'Data/hora, banco e versão do PostgreSQL', categoria: 'Sistema', sql: `SELECT\n  NOW() AS data_hora,\n  current_database() AS banco,\n  current_user AS usuario,\n  version() AS versao` },
  { nome: 'Tabelas do banco', descricao: 'Lista todas as tabelas com tamanho', categoria: 'Sistema', sql: `SELECT tablename AS tabela, pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS tamanho\nFROM pg_tables WHERE schemaname = 'public' ORDER BY tablename` },
  { nome: 'Registros por tabela', descricao: 'Estimativa de linhas em cada tabela', categoria: 'Sistema', sql: `SELECT relname AS tabela, reltuples::bigint AS estimativa_linhas\nFROM pg_class WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace\nORDER BY reltuples DESC` },
]

function SecaoRelatorios() {
  const [lista, setLista]         = useState([])
  const [editando, setEditando]   = useState(null)
  const [executando, setExecutando] = useState(null)
  const [resultados, setResultados] = useState({})

  const carregarExemplos = useCallback(async () => {
    const novos = EXEMPLOS_RELATORIOS.map(e => ({ ...e, id: genId() }))
    const nova = [...lista, ...novos]; setLista(nova); await salvarSecao('Relatorios', nova)
    mostrarAlerta(`${novos.length} relatórios de exemplo carregados!`, 'sucesso')
  }, [lista])

  useEffect(() => { carregarSecao('Relatorios').then(setLista) }, [])

  const salvar = useCallback(async (item) => {
    const nova = lista.some(r => r.id === item.id)
      ? lista.map(r => r.id === item.id ? item : r)
      : [...lista, item]
    setLista(nova); await salvarSecao('Relatorios', nova); setEditando(null)
    mostrarAlerta('Relatório salvo!', 'sucesso')
  }, [lista])

  const remover = useCallback(async (id) => {
    if (!confirm('Excluir este relatório?')) return
    const nova = lista.filter(r => r.id !== id); setLista(nova); await salvarSecao('Relatorios', nova)
  }, [lista])

  const executarRelatorio = useCallback(async (item) => {
    setExecutando(item.id)
    try {
      const res = await executarSQL(item.sql)
      setResultados(p => ({ ...p, [item.id]: { ok: true, rows: res.rows || [], rowCount: res.rowCount, command: res.command } }))
    } catch (e) {
      setResultados(p => ({ ...p, [item.id]: { ok: false, erro: e.message } }))
    } finally { setExecutando(null) }
  }, [])

  const novo = () => setEditando({ id: genId(), nome: '', descricao: '', sql: 'SELECT\n  \nFROM\n  ', categoria: 'Geral' })

  if (editando) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Btn variant="ghost" style={{ height: 30 }} onClick={() => setEditando(null)}><X size={13} /> Cancelar</Btn>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{editando.nome || 'Novo Relatório'}</span>
      </div>
      <Card>
        <Row gap={10}>
          <FInput label="Nome do relatório" value={editando.nome} onChange={e => setEditando(p => ({ ...p, nome: e.target.value }))} />
          <FInput label="Categoria" value={editando.categoria} onChange={e => setEditando(p => ({ ...p, categoria: e.target.value }))} style={{ maxWidth: 160 }} />
        </Row>
        <FInput label="Descrição" value={editando.descricao} onChange={e => setEditando(p => ({ ...p, descricao: e.target.value }))} style={{ marginTop: 8 }} />
      </Card>
      <Card>
        <SectionTitle>Query SQL</SectionTitle>
        <textarea value={editando.sql} onChange={e => setEditando(p => ({ ...p, sql: e.target.value }))} rows={8}
          style={{ marginTop: 8, width: '100%', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7, padding: '10px 12px', background: 'var(--s2)', border: '1.5px solid var(--bd)', borderRadius: 10, color: 'var(--t1)', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
      </Card>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn onClick={() => salvar(editando)} disabled={!editando.nome.trim()}><Save size={13} /> Salvar</Btn>
        <Btn variant="ghost" onClick={() => setEditando(null)}>Cancelar</Btn>
      </div>
    </div>
  )

  const categorias = [...new Set(lista.map(r => r.categoria || 'Geral'))]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn onClick={novo}><Plus size={13} /> Novo Relatório</Btn>
      </div>
      {lista.length === 0
        ? <EmptyState icon={BarChart2} title="Nenhum relatório" subtitle="Salve queries SQL como relatórios reutilizáveis — execute com um clique, exporte CSV, agrupe por categoria"
            action={<div style={{ display: 'flex', gap: 8 }}><Btn variant="ghost" onClick={carregarExemplos}><BookOpen size={13} /> Carregar Exemplos</Btn><Btn onClick={novo}><Plus size={13} /> Criar Relatório</Btn></div>} />
        : categorias.map(cat => (
          <div key={cat}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, padding: '0 2px' }}>{cat}</div>
            {lista.filter(r => (r.categoria || 'Geral') === cat).map(r => {
              const res = resultados[r.id]
              return (
                <Card key={r.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <BarChart2 size={15} color="var(--green)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 2 }}>{r.nome}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)' }}>{r.descricao || 'Sem descrição'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <Btn size="sm" variant="ghost" disabled={executando === r.id} onClick={() => executarRelatorio(r)}>
                        {executando === r.id ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={12} />}
                        Executar
                      </Btn>
                      {res?.ok && res.rows.length > 0 && (
                        <Btn size="sm" variant="ghost" onClick={() => exportarCSV(res.rows, `${r.nome}.csv`)}><Download size={12} /> CSV</Btn>
                      )}
                      <button className="btn btn-ghost" style={{ height: 30 }} onClick={() => setEditando(r)}><Edit2 size={13} /></button>
                      <button className="btn btn-danger" style={{ height: 30 }} onClick={() => remover(r.id)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  {res && (
                    <div style={{ marginTop: 8 }}>
                      {!res.ok && <div style={{ fontSize: 11, color: 'var(--red)', fontFamily: 'monospace' }}>{res.erro}</div>}
                      {res.ok && res.rows.length > 0 && (
                        <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--bd)', maxHeight: 160 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                            <thead><tr style={{ background: 'var(--s3)' }}>
                              {Object.keys(res.rows[0]).map(k => <th key={k} style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 700, color: 'var(--t3)', fontSize: 9, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)', whiteSpace: 'nowrap' }}>{k}</th>)}
                            </tr></thead>
                            <tbody>{res.rows.slice(0, 50).map((row, i) => (
                              <tr key={i} style={{ background: i % 2 === 0 ? 'var(--s1)' : 'var(--s2)' }}>
                                {Object.values(row).map((v, j) => <td key={j} style={{ padding: '4px 8px', color: 'var(--t2)', borderBottom: '1px solid var(--bd)', whiteSpace: 'nowrap' }}>{v === null ? '—' : String(v)}</td>)}
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      )}
                      {res.ok && <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4 }}>{res.rowCount} linha(s) · {res.command}</div>}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        ))
      }
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 7 — FLUXOS (workflow visual, base)
// ═══════════════════════════════════════════════════════════════════════════════

function SecaoFluxos() {
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

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 8 — BIBLIOTECA (funções built-in)
// ═══════════════════════════════════════════════════════════════════════════════

function SecaoBiblioteca({ telas }) {
  const GRUPOS = [
    {
      id: 'strings', icon: Type, cor: '#a78bfa', titulo: 'Textos & Strings',
      desc: 'Formatar, transformar e manipular textos',
      itens: [
        { fn: 'capitalizar(texto)',              desc: '"joão silva" → "João Silva"' },
        { fn: 'removerAcentos(texto)',           desc: '"ação" → "acao"' },
        { fn: 'slugify(texto)',                  desc: '"Olá Mundo!" → "ola-mundo"' },
        { fn: 'truncar(texto, limite)',          desc: '"texto longo..." (com reticências)' },
        { fn: 'contarPalavras(texto)',           desc: 'número de palavras' },
        { fn: 'inverter(texto)',                 desc: '"abc" → "cba"' },
        { fn: 'repetir(texto, n)',               desc: '"ab" × 3 → "ababab"' },
        { fn: 'removerEspacos(texto)',           desc: 'remove TODOS os espaços' },
        { fn: 'contarOcorrencias(texto, busca)', desc: 'quantas vezes "busca" aparece' },
        { fn: 'substituir(texto, de, para)',     desc: 'troca todas as ocorrências' },
        { fn: 'extrairNumeros(texto)',           desc: '"R$ 1.500" → 1500' },
        { fn: 'extrairTexto(texto)',             desc: 'remove números e símbolos' },
        { fn: 'mascararTexto(valor, mascara)',   desc: '"##.###.###/####-##" (CNPJ)' },
        { fn: 'formatarTelefone(tel)',           desc: '"11999999999" → "(11) 99999-9999"' },
        { fn: 'formatarCEP(cep)',               desc: '"01310100" → "01310-100"' },
        { fn: 'iniciais(nome, qtd)',             desc: '"João Silva" → "JS"' },
        { fn: 'primeiroNome(nomeCompleto)',      desc: '"João Silva" → "João"' },
        { fn: 'ultimoNome(nomeCompleto)',        desc: '"João Silva" → "Silva"' },
        { fn: 'isPalindromo(texto)',             desc: '"arara" → true' },
        { fn: 'base64Codificar(texto)',          desc: 'encode base64' },
        { fn: 'base64Decodificar(texto)',        desc: 'decode base64' },
        { fn: 'gerarSlugUnico(texto)',           desc: '"produto-ab3x" (slug com ID)' },
      ],
    },
    {
      id: 'arrays', icon: Layers, cor: '#34d399', titulo: 'Listas & Arrays',
      desc: 'Agrupar, filtrar, ordenar e calcular listas',
      itens: [
        { fn: 'agruparPor(lista, campo)',       desc: '{ categoria: [...itens] }' },
        { fn: 'ordenarPor(lista, campo, dir)',  desc: 'asc ou desc por qualquer campo' },
        { fn: 'unico(lista, campo)',            desc: 'remove duplicatas' },
        { fn: 'somar(lista, campo)',            desc: 'soma os valores de um campo' },
        { fn: 'media(lista, campo)',            desc: 'média dos valores' },
        { fn: 'maximo(lista, campo)',           desc: 'maior valor' },
        { fn: 'minimo(lista, campo)',           desc: 'menor valor' },
        { fn: 'filtrarPor(lista, campo, val)', desc: 'filtra por texto (contém)' },
        { fn: 'paginar(lista, pag, porPag)',    desc: '{ dados, total, paginas }' },
        { fn: 'embaralhar(lista)',              desc: 'ordem aleatória' },
        { fn: 'chunks(lista, tamanho)',         desc: 'divide em grupos de N' },
        { fn: 'aplanar(lista, prof)',           desc: '[[1,2],[3]] → [1,2,3]' },
        { fn: 'interseccao(a, b)',              desc: 'elementos em comum' },
        { fn: 'diferenca(a, b)',               desc: 'elementos só em A' },
        { fn: 'uniao(a, b)',                   desc: 'todos sem repetição' },
        { fn: 'contarPor(lista, campo)',        desc: '{ valor: quantidade }' },
        { fn: 'primeiros(lista, n)',            desc: 'primeiros N elementos' },
        { fn: 'ultimos(lista, n)',              desc: 'últimos N elementos' },
        { fn: 'sortearUm(lista)',              desc: 'item aleatório da lista' },
      ],
    },
    {
      id: 'math', icon: Hash, cor: '#facc15', titulo: 'Matemática',
      desc: 'Cálculos, porcentagens, conversões',
      itens: [
        { fn: 'arredondar(valor, casas)',       desc: 'arredonda para N decimais' },
        { fn: 'porcentagem(parte, total)',      desc: '25 de 200 → 12.5%' },
        { fn: 'aplicarPorcentagem(valor, pct)', desc: '10% de 500 → 50' },
        { fn: 'desconto(preco, pct)',           desc: '15% off em R$100 → R$85' },
        { fn: 'acrescimo(preco, pct)',          desc: '10% em R$100 → R$110' },
        { fn: 'clamp(valor, min, max)',         desc: 'limita valor entre min e max' },
        { fn: 'aleatorio(min, max)',            desc: 'inteiro aleatório no intervalo' },
        { fn: 'aleatorioDecimal(min, max)',     desc: 'decimal aleatório' },
        { fn: 'mediaArray(valores)',            desc: 'média de array de números' },
        { fn: 'fibonacci(n)',                  desc: 'N-ésimo número de Fibonacci' },
        { fn: 'fatorial(n)',                   desc: '5! → 120' },
        { fn: 'mdc(a, b)',                     desc: 'máximo divisor comum' },
        { fn: 'mmc(a, b)',                     desc: 'mínimo múltiplo comum' },
        { fn: 'ehPrimo(n)',                    desc: 'true / false' },
        { fn: 'converterUnidade(v, de, para)', desc: 'km→m, kg→g, c→f, l→ml...' },
        { fn: 'raiz(valor, indice)',            desc: 'raiz quadrada, cúbica...' },
        { fn: 'potencia(base, exp)',            desc: '2^10 → 1024' },
        { fn: 'logaritmo(valor, base)',         desc: 'log de qualquer base' },
        { fn: 'formatarNumero(v, casas)',       desc: '1500.5 → "1.500,50"' },
      ],
    },
    {
      id: 'validacao', icon: CheckSquare, cor: '#f472b6', titulo: 'Validação',
      desc: 'CPF, CNPJ, email, telefone, senha e mais',
      itens: [
        { fn: 'validarCPF(cpf)',            desc: 'verifica dígitos verificadores reais' },
        { fn: 'validarCNPJ(cnpj)',          desc: 'verifica dígitos verificadores reais' },
        { fn: 'validarEmail(email)',        desc: 'true / false' },
        { fn: 'validarTelefone(tel)',       desc: '10 ou 11 dígitos' },
        { fn: 'validarCEP(cep)',           desc: 'formato 00000-000' },
        { fn: 'validarURL(url)',           desc: 'URL válida → true' },
        { fn: 'validarData(data)',         desc: 'data válida → true' },
        { fn: 'validarSenha(s, opcoes)',   desc: '{ ok, motivo } — min, maiuscula, número, especial' },
        { fn: 'forcaSenha(senha)',         desc: '"Fraca" / "Média" / "Forte"' },
        { fn: 'validarCartaoCredito(n)',   desc: 'algoritmo de Luhn' },
        { fn: 'validarPlacaBr(placa)',     desc: 'padrão ABC1234 e ABC1D23 (Mercosul)' },
        { fn: 'validarHorario(hora)',      desc: 'formato HH:MM' },
        { fn: 'isMaiorDeIdade(dataNasc)', desc: 'true se ≥ 18 anos' },
      ],
    },
    {
      id: 'datas', icon: Calendar, cor: '#60a5fa', titulo: 'Data & Hora',
      desc: 'Calcular, formatar e comparar datas',
      itens: [
        { fn: 'hoje()',                          desc: '"2025-06-06" (formato ISO)' },
        { fn: 'hojeFormatado()',                 desc: '"06/06/2025"' },
        { fn: 'horaAtual()',                     desc: '"14:30"' },
        { fn: 'agora()',                         desc: 'ISO string completo com hora' },
        { fn: 'adicionarDias(data, n)',          desc: '"2025-06-06" + 7 → "2025-06-13"' },
        { fn: 'adicionarMeses(data, n)',         desc: 'adiciona N meses' },
        { fn: 'adicionarAnos(data, n)',          desc: 'adiciona N anos' },
        { fn: 'diasEntreDatas(inicio, fim)',     desc: 'número de dias' },
        { fn: 'calcularIdade(dataNasc)',         desc: 'idade em anos' },
        { fn: 'diaDaSemana(data)',              desc: '"segunda-feira"' },
        { fn: 'mesExtenso(data)',               desc: '"junho"' },
        { fn: 'ehFimDeSemana(data)',            desc: 'true / false' },
        { fn: 'ehDiaUtil(data)',                desc: 'true / false' },
        { fn: 'inicioDoMes(data)',              desc: 'primeiro dia do mês' },
        { fn: 'fimDoMes(data)',                 desc: 'último dia do mês' },
        { fn: 'diasNoMes(data)',               desc: '28, 29, 30 ou 31' },
        { fn: 'trimestre(data)',               desc: '1, 2, 3 ou 4' },
        { fn: 'semanaDoAno(data)',             desc: 'semana 1–52' },
        { fn: 'formatarRelativo(data)',         desc: '"há 2 dias" / "em 3 horas"' },
        { fn: 'formatarDataPorExtenso(data)',   desc: '"6 de junho de 2025"' },
        { fn: 'proximoDiaUtil(data)',           desc: 'pula fins de semana' },
      ],
    },
    {
      id: 'storage', icon: FolderOpen, cor: '#fb923c', titulo: 'Storage Local',
      desc: 'Salvar dados no dispositivo sem banco',
      itens: [
        { fn: 'salvarLocal(chave, valor)',          desc: 'persiste até o usuário limpar' },
        { fn: 'lerLocal(chave, fallback)',          desc: 'lê valor salvo ou retorna fallback' },
        { fn: 'removerLocal(chave)',               desc: 'remove uma chave' },
        { fn: 'limparLocal()',                     desc: 'apaga TODOS os dados do KronTech' },
        { fn: 'listarLocal()',                     desc: '[{ chave, valor }] — lista tudo salvo' },
        { fn: 'incrementarLocal(chave, por)',       desc: 'incrementa contador salvo' },
        { fn: 'salvarLocalComExpiracao(k,v,ttl)',  desc: 'expira após N milissegundos' },
        { fn: 'lerLocalComExpiracao(chave)',        desc: 'retorna null se expirado' },
        { fn: 'salvarSessao(chave, valor)',         desc: 'apaga ao fechar o app' },
        { fn: 'lerSessao(chave, fallback)',         desc: 'lê dado de sessão' },
      ],
    },
    {
      id: 'cores', icon: Activity, cor: '#f472b6', titulo: 'Cores',
      desc: 'Converter, misturar e gerar paletas',
      itens: [
        { fn: 'hexParaRgb(hex)',           desc: '{ r: 255, g: 107, b: 43 }' },
        { fn: 'rgbParaHex(r, g, b)',       desc: '"#ff6b2b"' },
        { fn: 'clarear(hex, pct)',         desc: 'clareia N% a cor' },
        { fn: 'escurecer(hex, pct)',       desc: 'escurece N% a cor' },
        { fn: 'corContrastante(hex)',      desc: 'retorna #000 ou #fff (legibilidade)' },
        { fn: 'hexParaRgbString(hex, a)',  desc: '"rgba(255, 107, 43, 0.5)"' },
        { fn: 'misturarCores(hex1, hex2)', desc: 'mistura duas cores com peso' },
        { fn: 'gerarPaleta(hex, qtd)',     desc: 'gera N variações da cor' },
        { fn: 'corAleatoria()',           desc: '"#a3f2c1" — hex aleatório' },
        { fn: 'hexValido(hex)',           desc: 'true / false' },
      ],
    },
    {
      id: 'ui', icon: Monitor, cor: '#a78bfa', titulo: 'Interface',
      desc: 'Alertas, loading, formulários',
      itens: [
        { fn: "mostrarAlerta(msg, tipo)",    desc: 'toast no centro da tela (sucesso/erro/aviso/info)' },
        { fn: 'confirmar(msg)',              desc: 'caixa nativa → true / false' },
        { fn: 'mostrarCarregando(bool)',     desc: 'overlay de loading' },
        { fn: 'preencherCampo(nome,valor)',  desc: 'preenche <input name=...>' },
        { fn: 'lerCampo(nome)',              desc: 'lê valor do campo' },
        { fn: 'limparFormulario(id)',        desc: 'zera todos os campos do form' },
        { fn: 'desabilitarBotao(id)',        desc: 'desabilita botão por ID' },
        { fn: 'habilitarBotao(id)',          desc: 'reabilita botão por ID' },
      ],
    },
    {
      id: 'nav', icon: Compass, cor: '#fb923c', titulo: 'Navegação',
      desc: 'Navegar entre telas e modais',
      itens: [
        { fn: "abrirTela('dashboard')",   desc: 'navega para rota interna' },
        { fn: "abrirTela('fb__tabela')",  desc: 'abre tela dinâmica criada no Designer' },
        { fn: 'voltarTela()',             desc: 'volta para a tela anterior' },
        { fn: 'abrirModal(id)',           desc: 'exibe div modal pelo ID' },
        { fn: 'fecharModal(id)',          desc: 'fecha modal pelo ID' },
        { fn: 'abrirEmNovaAba(url)',      desc: 'abre URL externa na janela padrão' },
      ],
    },
    {
      id: 'db', icon: Database, cor: '#facc15', titulo: 'Banco de Dados',
      desc: 'Consultar e gravar via PostgreSQL',
      itens: [
        { fn: 'executarSQL(sql)',           desc: '{ ok, rows, rowCount, command, ms }' },
        { fn: 'buscar(tabela, {filtros})',  desc: 'SELECT * com WHERE automático' },
        { fn: 'inserir(tabela, dados)',     desc: 'INSERT RETURNING * → registro criado' },
        { fn: 'atualizar(tabela,dados,f)', desc: 'UPDATE RETURNING *' },
        { fn: 'deletar(tabela, filtros)',   desc: 'DELETE com filtros obrigatórios' },
      ],
    },
    {
      id: 'arq', icon: FolderOpen, cor: '#f472b6', titulo: 'Arquivo & Export',
      desc: 'Download, CSV, PDF',
      itens: [
        { fn: 'exportarCSV(dados, nome)',  desc: 'CSV com BOM UTF-8, abre no Excel' },
        { fn: 'baixarArquivo(url, nome)', desc: 'inicia download de qualquer URL' },
        { fn: 'exportarPDF(id, nome)',    desc: 'imprime elemento #id como PDF' },
        { fn: 'copiarTexto(texto)',        desc: 'copia para área de transferência' },
      ],
    },
    {
      id: 'clip', icon: Clipboard, cor: '#60a5fa', titulo: 'Clipboard',
      desc: 'Copiar textos e elementos',
      itens: [
        { fn: 'copiarTexto(texto)',        desc: 'copia texto puro para clipboard' },
        { fn: 'copiarElemento(id)',        desc: 'copia conteúdo de elemento pelo ID' },
        { fn: 'copiarCampo(nome)',         desc: 'copia valor de <input name=...>' },
        { fn: 'mostrarBotaoCopiar(id)',    desc: 'injeta botão 📋 ao lado do elemento' },
      ],
    },
    {
      id: 'util', icon: Wrench, cor: '#34d399', titulo: 'Utilitários Gerais',
      desc: 'Formatação, IDs, tempo e misc',
      itens: [
        { fn: 'formatarMoeda(v)',     desc: 'R$ 1.234,56' },
        { fn: 'formatarCPF(v)',       desc: '000.000.000-00' },
        { fn: 'formatarCNPJ(v)',      desc: '00.000.000/0000-00' },
        { fn: 'formatarData(v,fmt)',  desc: "dd/MM/yyyy · use HH:mm para hora" },
        { fn: 'gerarID()',            desc: 'string única aleatória em base36' },
        { fn: 'debounce(fn, ms)',     desc: 'atrasa execução em X ms' },
        { fn: 'sleep(ms)',            desc: 'await sleep(1000) — pausa assíncrona' },
      ],
    },
  ]

  const [abertos, setAbertos] = useState({})
  const toggle = id => setAbertos(p => ({ ...p, [id]: !p[id] }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, color: 'var(--t2)', background: 'var(--or4)', border: '1px solid rgba(255,107,43,.18)', borderRadius: 9, padding: '8px 12px', lineHeight: 1.5 }}>
        <b>Importação:</b>{' '}
        <code style={{ fontFamily: 'monospace', fontSize: 10, background: 'var(--s3)', padding: '1px 6px', borderRadius: 4, color: 'var(--or)' }}>
          {'import { nomeDaFuncao } from \'../lib/funcoes/index.js\''}
        </code>
      </div>
      {GRUPOS.map(g => (
        <div key={g.id} style={{ background: 'var(--s1)', border: `1.5px solid ${abertos[g.id] ? g.cor + '55' : 'var(--bd)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color .15s' }}>
          <div onClick={() => toggle(g.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--s2)', border: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <g.icon size={14} color={g.cor} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{g.titulo}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>{g.desc}</div>
            </div>
            <span style={{ fontSize: 9, background: 'var(--s3)', padding: '2px 7px', borderRadius: 20, color: 'var(--t3)' }}>{g.itens.length} funções</span>
            {abertos[g.id] ? <ChevronDown size={12} color="var(--t3)" /> : <ChevronRight size={12} color="var(--t3)" />}
          </div>
          {abertos[g.id] && (
            <div style={{ borderTop: '1px solid var(--bd)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {g.itens.map(it => (
                <div key={it.fn} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <code style={{ fontSize: 11, fontFamily: 'monospace', color: g.cor, fontWeight: 600, flexShrink: 0 }}>{it.fn}</code>
                  <span style={{ fontSize: 10, color: 'var(--t2)' }}>{it.desc}</span>
                  <button title="Copiar" onClick={() => copiarTexto(it.fn.split('(')[0])} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', opacity: .6, padding: 0 }}>
                    <Copy size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 9 — MINHAS FUNÇÕES (código JS personalizado)
// ═══════════════════════════════════════════════════════════════════════════════

const EXEMPLOS_FUNCOES = [
  {
    nome: 'calcularDesconto',
    descricao: 'Calcula preço com desconto percentual',
    parametros: 'preco, desconto',
    codigo: `// desconto: número de 0 a 100
const fator = 1 - (desconto / 100)
const resultado = preco * fator
return resultado.toFixed(2)`,
    categoria: 'Cálculo',
  },
  {
    nome: 'diasEntreDatas',
    descricao: 'Retorna quantos dias há entre duas datas',
    parametros: 'dataInicio, dataFim',
    codigo: `const d1 = new Date(dataInicio)
const d2 = new Date(dataFim)
const diff = Math.abs(d2 - d1)
return Math.ceil(diff / (1000 * 60 * 60 * 24))`,
    categoria: 'Data',
  },
  {
    nome: 'apenasNumeros',
    descricao: 'Remove tudo que não for número de uma string',
    parametros: 'texto',
    codigo: `return String(texto).replace(/\\D/g, '')`,
    categoria: 'Texto',
  },
  {
    nome: 'primeiroNome',
    descricao: 'Retorna apenas o primeiro nome de um nome completo',
    parametros: 'nomeCompleto',
    codigo: `return String(nomeCompleto).trim().split(' ')[0]`,
    categoria: 'Texto',
  },
  {
    nome: 'calcularIdade',
    descricao: 'Calcula idade a partir da data de nascimento',
    parametros: 'dataNascimento',
    codigo: `const nasc = new Date(dataNascimento)
const hoje = new Date()
let idade = hoje.getFullYear() - nasc.getFullYear()
const m = hoje.getMonth() - nasc.getMonth()
if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
return idade`,
    categoria: 'Data',
  },
  {
    nome: 'truncarTexto',
    descricao: 'Limita texto a N caracteres e adiciona reticências',
    parametros: 'texto, limite',
    codigo: `const t = String(texto)
if (t.length <= limite) return t
return t.slice(0, limite) + '...'`,
    categoria: 'Texto',
  },
  {
    nome: 'somarArray',
    descricao: 'Soma todos os valores numéricos de um array',
    parametros: 'valores',
    codigo: `const arr = Array.isArray(valores) ? valores : String(valores).split(',').map(Number)
return arr.reduce((acc, v) => acc + Number(v || 0), 0)`,
    categoria: 'Cálculo',
  },
  {
    nome: 'gerarSenha',
    descricao: 'Gera uma senha aleatória com letras e números',
    parametros: 'tamanho',
    codigo: `const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
let senha = ''
for (let i = 0; i < (tamanho || 10); i++) {
  senha += chars[Math.floor(Math.random() * chars.length)]
}
return senha`,
    categoria: 'Utilitário',
  },
]

function SecaoMinhasFuncoes() {
  const [lista, setLista]         = useState([])
  const [editando, setEditando]   = useState(null)
  const [testInput, setTestInput] = useState({})
  const [testRes, setTestRes]     = useState({})
  const [busca, setBusca]         = useState('')
  const [mostrarExemplos, setMostrarExemplos] = useState(false)

  useEffect(() => { carregarSecao('FuncoesCustom').then(setLista) }, [])

  const salvar = useCallback(async (item) => {
    if (!item.nome.trim()) return
    const nova = lista.some(f => f.id === item.id)
      ? lista.map(f => f.id === item.id ? item : f)
      : [...lista, item]
    setLista(nova); await salvarSecao('FuncoesCustom', nova); setEditando(null)
    mostrarAlerta('Função salva!', 'sucesso')
  }, [lista])

  const remover = useCallback(async (id) => {
    if (!confirm('Excluir esta função?')) return
    const nova = lista.filter(f => f.id !== id); setLista(nova); await salvarSecao('FuncoesCustom', nova)
  }, [lista])

  const executar = useCallback((item) => {
    try {
      const params = item.parametros ? item.parametros.split(',').map(s => s.trim()).filter(Boolean) : []
      const fn = new Function(...params, item.codigo)
      const args = params.map(p => {
        const v = testInput[`${item.id}_${p}`] ?? ''
        const n = Number(v)
        return v !== '' && !isNaN(n) ? n : v
      })
      const resultado = fn(...args)
      setTestRes(prev => ({ ...prev, [item.id]: { ok: true, valor: String(resultado ?? 'undefined') } }))
    } catch (e) {
      setTestRes(prev => ({ ...prev, [item.id]: { ok: false, erro: e.message } }))
    }
  }, [testInput])

  const carregarExemplo = useCallback(async (ex) => {
    const item = { ...ex, id: genId() }
    const nova = [...lista, item]
    setLista(nova); await salvarSecao('FuncoesCustom', nova)
    setMostrarExemplos(false)
    mostrarAlerta(`Exemplo "${ex.nome}" carregado!`, 'sucesso')
  }, [lista])

  const novo = () => setEditando({ id: genId(), nome: '', descricao: '', parametros: '', codigo: '// Escreva sua função aqui\n// Use "return" para retornar um valor\n\nreturn ', categoria: 'Geral' })

  const CATS = [...new Set(lista.map(f => f.categoria || 'Geral'))]
  const filtradas = lista.filter(f => f.nome.toLowerCase().includes(busca.toLowerCase()) || f.descricao?.toLowerCase().includes(busca.toLowerCase()))

  if (editando) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Btn variant="ghost" style={{ height: 30 }} onClick={() => setEditando(null)}><X size={13} /> Cancelar</Btn>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{editando.nome || 'Nova Função'}</span>
      </div>

      <Card>
        <SectionTitle>Identificação</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <Row gap={10}>
            <FInput label="Nome da função (sem espaços)" value={editando.nome}
              onChange={e => setEditando(p => ({ ...p, nome: e.target.value.replace(/\s/g, '') }))}
              placeholder="Ex: calcularDesconto, formatarTelefone..." />
            <FInput label="Categoria" value={editando.categoria || 'Geral'}
              onChange={e => setEditando(p => ({ ...p, categoria: e.target.value }))}
              style={{ maxWidth: 140 }} placeholder="Cálculo, Texto..." />
          </Row>
          <FInput label="Descrição (o que ela faz)" value={editando.descricao}
            onChange={e => setEditando(p => ({ ...p, descricao: e.target.value }))}
            placeholder="Ex: Calcula preço com desconto percentual" />
        </div>
      </Card>

      <Card>
        <SectionTitle>Parâmetros (entradas da função)</SectionTitle>
        <FInput style={{ marginTop: 8 }} value={editando.parametros}
          onChange={e => setEditando(p => ({ ...p, parametros: e.target.value }))}
          placeholder="Ex: preco, desconto, data  — separados por vírgula. Deixe vazio se não precisar." />
        {editando.parametros && (
          <div style={{ marginTop: 6, fontSize: 10, color: 'var(--t3)' }}>
            Parâmetros: {editando.parametros.split(',').map(p => <code key={p} style={{ background: 'var(--s3)', padding: '1px 5px', borderRadius: 4, marginRight: 4, color: 'var(--blue)' }}>{p.trim()}</code>)}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Código JavaScript</SectionTitle>
        <div style={{ fontSize: 10, color: 'var(--t3)', margin: '4px 0 8px', lineHeight: 1.5 }}>
          Escreva o corpo da função. Use <code style={{ background: 'var(--s3)', padding: '1px 5px', borderRadius: 4 }}>return</code> para retornar um valor.
          Os parâmetros definidos acima ficam disponíveis como variáveis. Você pode usar <code style={{ background: 'var(--s3)', padding: '1px 5px', borderRadius: 4 }}>console.log()</code> para depurar.
        </div>
        <textarea value={editando.codigo}
          onChange={e => setEditando(p => ({ ...p, codigo: e.target.value }))}
          rows={10} spellCheck={false}
          style={{ width: '100%', fontFamily: "'Fira Code','Consolas',monospace", fontSize: 12.5, lineHeight: 1.7,
            padding: '12px 14px', background: 'var(--s2)', border: '1.5px solid var(--bd)', borderRadius: 10,
            color: 'var(--t1)', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
      </Card>

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn onClick={() => salvar(editando)} disabled={!editando.nome.trim() || !editando.codigo.trim()}>
          <Save size={13} /> Salvar Função
        </Btn>
        <Btn variant="ghost" onClick={() => setEditando(null)}>Cancelar</Btn>
      </div>
    </div>
  )

  if (mostrarExemplos) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Btn variant="ghost" style={{ height: 30 }} onClick={() => setMostrarExemplos(false)}><X size={13} /> Fechar</Btn>
        <span style={{ fontSize: 13, fontWeight: 700 }}>Exemplos prontos — clique para carregar</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {EXEMPLOS_FUNCOES.map(ex => (
          <Card key={ex.nome} style={{ cursor: 'pointer', transition: 'border-color .15s' }}
            onClick={() => carregarExemplo(ex)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--or4)', border: '1px solid rgba(255,107,43,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Code size={13} color="var(--or)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', fontFamily: 'monospace' }}>{ex.nome}()</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{ex.descricao}</div>
                {ex.parametros && (
                  <div style={{ fontSize: 9, color: 'var(--blue)', marginTop: 3, fontFamily: 'monospace' }}>({ex.parametros})</div>
                )}
              </div>
              <span style={{ fontSize: 9, background: 'var(--s3)', padding: '2px 7px', borderRadius: 20, color: 'var(--t3)', flexShrink: 0 }}>{ex.categoria}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 9, padding: '0 10px', flex: 1, maxWidth: 300, height: 32 }}>
          <Filter size={12} color="var(--t3)" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Filtrar funções..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: 'var(--t1)', width: '100%' }} />
        </div>
        <Btn variant="ghost" onClick={() => setMostrarExemplos(true)}><BookOpen size={13} /> Ver Exemplos</Btn>
        <Btn onClick={novo}><Plus size={13} /> Nova Função</Btn>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState icon={Code} title="Nenhuma função criada"
          subtitle="Crie funções JavaScript reutilizáveis que podem ser chamadas em automações, scripts e fluxos."
          action={
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="ghost" onClick={() => setMostrarExemplos(true)}><BookOpen size={13} /> Carregar Exemplo</Btn>
              <Btn onClick={novo}><Plus size={13} /> Criar do Zero</Btn>
            </div>
          } />
      ) : CATS.map(cat => (
        <div key={cat}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{cat}</div>
          {filtradas.filter(f => (f.categoria || 'Geral') === cat).map(f => {
            const params = f.parametros ? f.parametros.split(',').map(s => s.trim()).filter(Boolean) : []
            const tr = testRes[f.id]
            return (
              <Card key={f.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--or4)', border: '1px solid rgba(255,107,43,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Code size={15} color="var(--or)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', fontFamily: 'monospace' }}>
                        {f.nome}({f.parametros || ''})
                      </code>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{f.descricao || 'Sem descrição'}</div>

                    {/* Área de teste */}
                    {params.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        {params.map(p => (
                          <FInput key={p} label={p} style={{ maxWidth: 140, flex: 'none' }}
                            value={testInput[`${f.id}_${p}`] || ''}
                            onChange={e => setTestInput(prev => ({ ...prev, [`${f.id}_${p}`]: e.target.value }))}
                            placeholder="valor de teste" />
                        ))}
                        <Btn size="sm" onClick={() => executar(f)}><Play size={11} /> Testar</Btn>
                      </div>
                    )}
                    {params.length === 0 && (
                      <div style={{ marginTop: 8 }}>
                        <Btn size="sm" onClick={() => executar(f)}><Play size={11} /> Executar</Btn>
                      </div>
                    )}

                    {tr && (
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {tr.ok
                          ? <><CheckCircle size={12} color="var(--green)" /><code style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'monospace' }}>{tr.valor}</code></>
                          : <><AlertTriangle size={12} color="var(--red)" /><span style={{ fontSize: 11, color: 'var(--red)' }}>{tr.erro}</span></>}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 5 }}>
                    <button className="btn btn-ghost" style={{ height: 30 }} title="Copiar nome"
                      onClick={() => { copiarTexto(f.nome); mostrarAlerta('Copiado!', 'sucesso') }}>
                      <Copy size={12} />
                    </button>
                    <button className="btn btn-ghost" style={{ height: 30 }} onClick={() => setEditando(f)}><Edit2 size={13} /></button>
                    <button className="btn btn-danger" style={{ height: 30 }} onClick={() => remover(f.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO MANUAL
// ═══════════════════════════════════════════════════════════════════════════════

function Tip({ children }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(255,107,43,.06)', border: '1px solid rgba(255,107,43,.18)', borderRadius: 9, padding: '9px 12px', marginTop: 6 }}>
      <Lightbulb size={13} color="var(--or)" style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.5 }}>{children}</span>
    </div>
  )
}

function Ok({ children }) {
  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 5 }}>
      <CheckSquare size={12} color="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>{children}</span>
    </div>
  )
}

function Nope({ children }) {
  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 5 }}>
      <Clock size={12} color="var(--yellow)" style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>{children}</span>
    </div>
  )
}

function ManualCard({ titulo, cor, Icon, status, children }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div style={{ background: 'var(--s1)', border: `1.5px solid ${aberto ? cor + '55' : 'var(--bd)'}`, borderRadius: 12, overflow: 'hidden' }}>
      <div onClick={() => setAberto(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: cor + '18', border: `1px solid ${cor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} color={cor} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{titulo}</div>
          {status && (
            <div style={{ fontSize: 10, marginTop: 2 }}>
              <span style={{ color: status === 'ok' ? 'var(--green)' : 'var(--yellow)', fontWeight: 600 }}>
                {status === 'ok' ? '✓ Funciona agora, sem configuração extra' : '⏳ Precisa de configuração adicional'}
              </span>
            </div>
          )}
        </div>
        {aberto ? <ChevronDown size={14} color="var(--t3)" /> : <ChevronRight size={14} color="var(--t3)" />}
      </div>
      {aberto && (
        <div style={{ borderTop: '1px solid var(--bd)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Codigo({ children }) {
  return (
    <code style={{ display: 'block', fontFamily: 'monospace', fontSize: 11.5, background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '8px 12px', color: 'var(--or)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {children}
    </code>
  )
}

function SecaoManual() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Intro */}
      <div style={{ background: 'linear-gradient(135deg, var(--or4), transparent)', border: '1.5px solid rgba(255,107,43,.2)', borderRadius: 14, padding: '16px 18px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>Central de Automações — Manual de Uso</div>
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Esta central permite automatizar e estender o KronTech sem depender de programadores para cada tarefa.
          Abaixo você encontra uma explicação prática de cada módulo — o que ele faz, como usar e um exemplo real.
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, display: 'flex', gap: 5, alignItems: 'center' }}>
            <CheckSquare size={12} color="var(--green)" /> <span style={{ color: 'var(--green)', fontWeight: 600 }}>Funciona agora</span>
          </div>
          <div style={{ fontSize: 11, display: 'flex', gap: 5, alignItems: 'center' }}>
            <Clock size={12} color="var(--yellow)" /> <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>Em desenvolvimento / precisa de configuração extra</span>
          </div>
        </div>
      </div>

      {/* Scripts SQL */}
      <ManualCard titulo="Scripts SQL" cor="var(--blue)" Icon={Terminal} status="ok">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Scripts SQL são consultas que você escreve e salva para usar sempre que precisar. Funciona diretamente no banco de dados PostgreSQL do KronTech.
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8, marginTop: 4 }}>Como usar:</div>
        <Ok>Clique em <b>Novo Script</b>, dê um nome e escreva o SQL</Ok>
        <Ok>Pressione <b>F5</b> ou clique em <b>Executar</b> para rodar</Ok>
        <Ok>O resultado aparece em uma tabela abaixo do editor</Ok>
        <Ok>Clique em <b>Exportar CSV</b> para baixar os dados no Excel</Ok>
        <Tip>
          Exemplo prático: você quer ver todos os clientes cadastrados no mês atual.{'\n'}
          Escreva: <b>SELECT * FROM clientes WHERE DATE_TRUNC('month', criado_em) = DATE_TRUNC('month', NOW())</b>
          {'\n'}Salve como "Clientes do mês" e execute sempre que precisar.
        </Tip>
        <Codigo>{`-- Exemplo: buscar os 10 registros mais recentes
SELECT * FROM sua_tabela
ORDER BY criado_em DESC
LIMIT 10`}</Codigo>
      </ManualCard>

      {/* Relatórios */}
      <ManualCard titulo="Relatórios" cor="var(--green)" Icon={BarChart2} status="ok">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Relatórios são scripts SQL organizados por categoria, com execução com um clique e export CSV. Ideais para relatórios gerenciais que o usuário consulta frequentemente.
        </div>
        <Ok>Crie o relatório com a query SQL desejada e uma categoria (Ex: "Financeiro", "RH")</Ok>
        <Ok>Clique em <b>Executar</b> no card para ver os dados imediatamente</Ok>
        <Ok>Clique em <b>CSV</b> para exportar para Excel</Ok>
        <Tip>
          Diferença de Scripts: Scripts SQL são para uso técnico (testar, ajustar, debugar). Relatórios são para uso do dia a dia por qualquer usuário.
        </Tip>
      </ManualCard>

      {/* Integrações */}
      <ManualCard titulo="Integrações" cor="var(--green)" Icon={Globe} status="ok">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Integrações conectam o KronTech a serviços externos via HTTP/REST. Você configura a URL, método, autenticação e corpo da requisição — e pode testar com um clique.
        </div>
        <Ok>Cadastre a API com nome, URL, método (GET/POST/...) e autenticação</Ok>
        <Ok>Clique em <b>Testar</b> para fazer a chamada de verdade e ver a resposta</Ok>
        <Ok>A resposta aparece logo abaixo do card em formato JSON</Ok>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8, marginTop: 6, marginBottom: 4 }}>Exemplo prático — Consultar CEP:</div>
        <Ok>URL: <code style={{ background: 'var(--s2)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>https://viacep.com.br/ws/01310100/json/</code></Ok>
        <Ok>Método: GET — sem autenticação</Ok>
        <Ok>Clique Testar: retorna logradouro, bairro, cidade automaticamente</Ok>
        <Tip>
          Para integrar com o Slack, WhatsApp Business, n8n, Zapier ou qualquer sistema que tenha webhook: configure como Integração e acione manualmente ou via Fluxo.
        </Tip>
      </ManualCard>

      {/* Notificações */}
      <ManualCard titulo="Notificações" cor="var(--purple)" Icon={Bell} status="ok">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Templates de notificação reutilizáveis. Você cria o template uma vez e aciona quando quiser — pelo botão Testar, ou futuramente por automações e fluxos.
        </div>
        <Ok><b>Toast (na tela)</b> — aparece no centro da tela por alguns segundos. Tipos: sucesso (verde), erro (vermelho), aviso (amarelo), info (laranja)</Ok>
        <Ok><b>Desktop</b> — notificação do sistema operacional, aparece mesmo com o KronTech minimizado</Ok>
        <Ok><b>Webhook</b> — envia um POST HTTP para qualquer URL quando acionada (Slack, Teams, etc.)</Ok>
        <Tip>
          Você pode usar variáveis nas mensagens como <b>{'{nome_campo}'}</b> — quando o motor de automações for ativado, elas serão substituídas pelo valor real do campo.
        </Tip>
      </ManualCard>

      {/* Minhas Funções */}
      <ManualCard titulo="Minhas Funções" cor="var(--or)" Icon={Code} status="ok">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Crie funções JavaScript reutilizáveis para cálculos, formatações e lógicas personalizadas. Você testa ali mesmo na tela — sem precisar abrir nenhum editor externo.
        </div>
        <Ok>Defina o nome (sem espaços), os parâmetros de entrada e o código JavaScript</Ok>
        <Ok>Use <b>return</b> para retornar o resultado</Ok>
        <Ok>Preencha os campos de teste e clique em <b>Testar</b> para ver o resultado</Ok>
        <Ok>Clique em <b>Ver Exemplos</b> para carregar funções prontas como calcularDesconto, calcularIdade, gerarSenha</Ok>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8, marginTop: 6, marginBottom: 4 }}>Exemplo — calcular desconto:</div>
        <Codigo>{`// Parâmetros: preco, desconto
const fator = 1 - (desconto / 100)
return (preco * fator).toFixed(2)

// Teste: preco=100, desconto=15 → resultado: 85.00`}</Codigo>
        <Tip>
          As funções criadas aqui ficam salvas no sistema. No futuro, poderão ser chamadas diretamente nas automações e fluxos com o nome da função.
        </Tip>
      </ManualCard>

      {/* Automações */}
      <ManualCard titulo="Automações" cor="var(--or)" Icon={Zap} status="pending">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Automações são regras visuais do tipo <b>"quando X acontecer → faça Y"</b>. Você configura o gatilho (evento), condições opcionais e as ações a executar.
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8, marginTop: 4, marginBottom: 4 }}>Como funciona na teoria:</div>
        <Ok><b>Gatilho</b>: define quando a automação roda — ao abrir tela, ao salvar, quando um campo muda, ao excluir</Ok>
        <Ok><b>Condições</b> (opcionais): filtram quando executar — ex: só se campo_tipo for igual a "PJ"</Ok>
        <Ok><b>Ações</b>: o que acontece — mostrar alerta, preencher campo, ocultar campo, navegar para outra tela, executar SQL, chamar API</Ok>
        <div style={{ background: 'rgba(251,210,76,.08)', border: '1px solid rgba(251,210,76,.25)', borderRadius: 9, padding: '10px 12px', marginTop: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--yellow)', marginBottom: 4 }}>⏳ Status atual:</div>
          <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.6 }}>
            As automações já são <b>salvas e configuradas</b> aqui, mas ainda não estão conectadas ao motor de execução das telas. O próximo passo do desenvolvimento é criar o mecanismo que lê essas regras e as aplica quando os eventos acontecem nas telas criadas no Designer.
            <br /><br />
            <b>O que fazer agora:</b> Configure suas automações aqui. Quando o motor for integrado, elas já vão funcionar automaticamente nas telas corretas.
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8, marginTop: 6, marginBottom: 4 }}>Exemplo real (quando pronto):</div>
        <Ok>Gatilho: <b>Quando campo "tipo_pessoa" muda</b></Ok>
        <Ok>Condição: tipo_pessoa <b>é igual a</b> "PJ"</Ok>
        <Ok>Ação 1: <b>Ocultar campo</b> "cpf"</Ok>
        <Ok>Ação 2: <b>Mostrar campo</b> "cnpj"</Ok>
      </ManualCard>

      {/* Agendamentos */}
      <ManualCard titulo="Agendamentos" cor="var(--yellow)" Icon={Calendar} status="pending">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Permite executar scripts SQL ou integrações automaticamente em intervalos definidos — a cada hora, diariamente, semanalmente ou por expressão cron personalizada.
        </div>
        <Ok>Vincule um <b>Script SQL</b> salvo (ex: "Backup diário") ou uma <b>Integração</b> (ex: "Enviar relatório Slack")</Ok>
        <Ok>Escolha o intervalo: 5min, 1h, 1 dia, 1 semana, ou cron personalizado</Ok>
        <div style={{ background: 'rgba(251,210,76,.08)', border: '1px solid rgba(251,210,76,.25)', borderRadius: 9, padding: '10px 12px', marginTop: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--yellow)', marginBottom: 4 }}>⏳ Status atual:</div>
          <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.6 }}>
            A configuração já funciona, mas o timer de background ainda não foi implementado. O KronTech precisará de um processo em segundo plano que verifica os agendamentos e os executa no momento certo.
          </div>
        </div>
        <Tip>
          Expressão cron — exemplos: <b>0 8 * * 1-5</b> = toda semana de seg a sex às 8h. <b>0 0 1 * *</b> = primeiro dia de cada mês à meia-noite.
        </Tip>
      </ManualCard>

      {/* Fluxos */}
      <ManualCard titulo="Fluxos" cor="var(--purple)" Icon={GitBranch} status="pending">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Fluxos são sequências de etapas encadeadas: condição → SQL → API → notificação → espera. São como mini-programas visuais que você monta sem código.
        </div>
        <Ok><b>Gatilho</b>: define o início — botão manual, ao salvar, agendado, webhook</Ok>
        <Ok><b>Condição</b>: ramifica o fluxo — se verdadeiro segue, se falso para ou desvia</Ok>
        <Ok><b>SQL</b>: executa um script no banco e passa o resultado para a próxima etapa</Ok>
        <Ok><b>API</b>: chama uma integração externa e pode usar o resultado</Ok>
        <Ok><b>Notificar</b>: dispara um template de notificação</Ok>
        <Ok><b>Esperar</b>: pausa por X segundos antes de continuar</Ok>
        <div style={{ background: 'rgba(251,210,76,.08)', border: '1px solid rgba(251,210,76,.25)', borderRadius: 9, padding: '10px 12px', marginTop: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--yellow)', marginBottom: 4 }}>⏳ Status atual:</div>
          <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.6 }}>
            A interface de configuração está pronta. O mecanismo de execução das etapas em sequência está em desenvolvimento.
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8, marginTop: 6, marginBottom: 4 }}>Exemplo de fluxo completo (quando pronto):</div>
        <Ok>1. Gatilho: botão "Fechar Pedido" clicado</Ok>
        <Ok>2. SQL: atualiza status do pedido para "fechado"</Ok>
        <Ok>3. API: envia os dados para o sistema de faturamento</Ok>
        <Ok>4. Notificar: toast "Pedido fechado e enviado para faturamento!"</Ok>
      </ManualCard>

      {/* Biblioteca */}
      <ManualCard titulo="Biblioteca de Funções" cor="var(--t2)" Icon={BookOpen} status="ok">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Referência de todas as funções JavaScript já prontas que você pode importar e usar em scripts, automações e funções personalizadas.
        </div>
        <Ok><b>Utilitários:</b> formatarMoeda, formatarCPF, formatarCNPJ, validarEmail, formatarData, gerarID</Ok>
        <Ok><b>Interface:</b> mostrarAlerta, mostrarCarregando, preencherCampo, lerCampo, limparFormulario</Ok>
        <Ok><b>Navegação:</b> abrirTela, voltarTela, abrirModal, fecharModal</Ok>
        <Ok><b>Banco de Dados:</b> executarSQL, buscar, inserir, atualizar, deletar</Ok>
        <Ok><b>Arquivo:</b> exportarCSV, baixarArquivo, exportarPDF, copiarTexto</Ok>
        <Tip>
          Para usar em um script personalizado: <code style={{ background: 'var(--s2)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 10 }}>import {"{ formatarMoeda }"} from '../lib/funcoes/index.js'</code>
        </Tip>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8, marginTop: 6, marginBottom: 4 }}>Exemplo — formatar valor monetário:</div>
        <Codigo>{`import { formatarMoeda } from '../lib/funcoes/index.js'

const preco = 1500.5
console.log(formatarMoeda(preco)) // → "R$ 1.500,50"`}</Codigo>
      </ManualCard>

      {/* Próximos passos */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 12, padding: '14px 16px', marginTop: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Roteiro de desenvolvimento</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { done: true,  label: 'Scripts SQL — editor, salvar, executar, exportar CSV' },
            { done: true,  label: 'Integrações HTTP — configurar, testar com resposta em tempo real' },
            { done: true,  label: 'Relatórios — queries salvas por categoria com export' },
            { done: true,  label: 'Notificações — toast, desktop e webhook configuráveis' },
            { done: true,  label: 'Minhas Funções — criar e testar funções JS personalizadas' },
            { done: false, label: 'Motor de Automações — conectar regras às telas do Designer' },
            { done: false, label: 'Timer de Agendamentos — executar em background por intervalo/cron' },
            { done: false, label: 'Engine de Fluxos — executar etapas em sequência com resultado entre elas' },
            { done: false, label: 'Vinculação tela ↔ automação — cada tela escolhe quais automações a afetam' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
              {item.done
                ? <CheckCircle size={13} color="var(--green)" />
                : <Clock size={13} color="var(--yellow)" />}
              <span style={{ color: item.done ? 'var(--t1)' : 'var(--t3)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

const SECOES = [
  { id: 'manual',        Icon: HelpCircle, label: 'Manual de Uso',  cor: 'var(--or)',     desc: 'Como usar cada módulo'          },
  { id: 'automacoes',    Icon: Zap,        label: 'Automações',     cor: 'var(--or)',     desc: 'Regras visuais if→then'         },
  { id: 'scripts',       Icon: Terminal,   label: 'Scripts SQL',    cor: 'var(--blue)',   desc: 'Editor + salvar + executar'     },
  { id: 'integracoes',   Icon: Globe,      label: 'Integrações',    cor: 'var(--green)',  desc: 'APIs REST e webhooks externos'  },
  { id: 'agendamentos',  Icon: Calendar,   label: 'Agendamentos',   cor: 'var(--yellow)', desc: 'Execução automática por tempo'  },
  { id: 'notificacoes',  Icon: Bell,       label: 'Notificações',   cor: 'var(--purple)', desc: 'Toast, desktop, webhook'        },
  { id: 'relatorios',    Icon: BarChart2,  label: 'Relatórios',     cor: 'var(--green)',  desc: 'Queries salvas + export CSV'    },
  { id: 'fluxos',        Icon: GitBranch,  label: 'Fluxos',         cor: 'var(--purple)', desc: 'Workflows de etapas encadeadas' },
  { id: 'minhasfuncoes', Icon: Code,       label: 'Minhas Funções', cor: 'var(--or)',     desc: 'Crie funções JS infinitas'      },
  { id: 'biblioteca',    Icon: BookOpen,   label: 'Biblioteca',     cor: 'var(--t2)',     desc: 'Funções built-in reutilizáveis' },
]

export default function FuncoesTab({ telas = [] }) {
  const [secao, setSecao] = useState('manual')
  const [scripts, setScripts] = useState([])

  useEffect(() => { carregarSecao('Scripts').then(setScripts) }, [secao])

  const sec = SECOES.find(s => s.id === secao)

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0, gap: 0 }}>

      {/* ── Nav lateral ────────────────────────────────────────────────────── */}
      <div style={{ width: 196, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 8px', borderRight: '1px solid var(--bd)', overflowY: 'auto' }}>
        {SECOES.map((s, i) => {
          const ativo = secao === s.id
          const isDivider = i === 1 || i === 8
          return (
            <div key={s.id}>
              {isDivider && <div style={{ height: 1, background: 'var(--bd)', margin: '4px 4px' }} />}
              <button onClick={() => setSecao(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 11px', borderRadius: 9, cursor: 'pointer',
                background: ativo ? 'var(--or4)' : 'transparent',
                border: `1.5px solid ${ativo ? 'rgba(255,107,43,.25)' : 'transparent'}`,
                textAlign: 'left', width: '100%', transition: 'var(--tr)',
              }}>
                <s.Icon size={15} color={ativo ? 'var(--or)' : s.cor} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: ativo ? 700 : 500, color: ativo ? 'var(--or)' : 'var(--t1)', lineHeight: 1.2 }}>{s.label}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--t3)', lineHeight: 1.2, marginTop: 1 }}>{s.desc}</div>
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Conteúdo da seção ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        {/* Header da seção */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--s2)', border: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {sec && <sec.Icon size={17} color={sec.cor} />}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', letterSpacing: -0.3 }}>{sec?.label}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>{sec?.desc}</div>
          </div>
        </div>

        {secao === 'manual'        && <SecaoManual />}
        {secao === 'automacoes'    && <SecaoAutomacoes telas={telas} />}
        {secao === 'scripts'       && <SecaoScripts />}
        {secao === 'integracoes'   && <SecaoIntegracoes />}
        {secao === 'agendamentos'  && <SecaoAgendamentos scripts={scripts} />}
        {secao === 'notificacoes'  && <SecaoNotificacoes />}
        {secao === 'relatorios'    && <SecaoRelatorios />}
        {secao === 'fluxos'        && <SecaoFluxos />}
        {secao === 'minhasfuncoes' && <SecaoMinhasFuncoes />}
        {secao === 'biblioteca'    && <SecaoBiblioteca telas={telas} />}
      </div>
    </div>
  )
}
