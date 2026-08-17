import { useState, useEffect, useCallback } from 'react'
import { Code, Play, Save, X, Edit2, Trash2, Plus, BookOpen, Filter, Copy, CheckCircle, AlertTriangle } from 'lucide-react'
import { mostrarAlerta, copiarTexto } from '../../lib/funcoes/index.js'
import { genId, carregarSecao, salvarSecao, Btn, FInput, Row, SectionTitle, EmptyState, Card } from './_shared.jsx'

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

export default function SecaoMinhasFuncoes() {
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
          placeholder="Ex: preco, desconto, data, separados por vírgula. Deixe vazio se não precisar." />
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
        <span style={{ fontSize: 13, fontWeight: 700 }}>Exemplos prontos: clique para carregar</span>
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
