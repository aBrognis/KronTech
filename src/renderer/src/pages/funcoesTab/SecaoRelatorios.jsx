import { useState, useEffect, useCallback } from 'react'
import { BarChart2, Play, RefreshCw, Download, Save, X, Edit2, Trash2, Plus, BookOpen } from 'lucide-react'
import { mostrarAlerta, exportarCSV, executarSQL } from '../../lib/funcoes/index.js'
import { genId, carregarSecao, salvarSecao, Btn, FInput, Row, SectionTitle, EmptyState, Card } from './_shared.jsx'

const EXEMPLOS_RELATORIOS = [
  { nome: 'Status do servidor', descricao: 'Data/hora, banco e versão do PostgreSQL', categoria: 'Sistema', sql: `SELECT\n  NOW() AS data_hora,\n  current_database() AS banco,\n  current_user AS usuario,\n  version() AS versao` },
  { nome: 'Tabelas do banco', descricao: 'Lista todas as tabelas com tamanho', categoria: 'Sistema', sql: `SELECT tablename AS tabela, pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS tamanho\nFROM pg_tables WHERE schemaname = 'public' ORDER BY tablename` },
  { nome: 'Registros por tabela', descricao: 'Estimativa de linhas em cada tabela', categoria: 'Sistema', sql: `SELECT relname AS tabela, reltuples::bigint AS estimativa_linhas\nFROM pg_class WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace\nORDER BY reltuples DESC` },
]

export default function SecaoRelatorios() {
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
        ? <EmptyState icon={BarChart2} title="Nenhum relatório" subtitle="Salve queries SQL como relatórios reutilizáveis: execute com um clique, exporte CSV, agrupe por categoria"
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
                                {Object.values(row).map((v, j) => <td key={j} style={{ padding: '4px 8px', color: 'var(--t2)', borderBottom: '1px solid var(--bd)', whiteSpace: 'nowrap' }}>{v === null ? 'NULL' : String(v)}</td>)}
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
