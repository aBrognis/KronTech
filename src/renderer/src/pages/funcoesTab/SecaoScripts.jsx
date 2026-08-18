import { useState, useEffect, useCallback } from 'react'
import { Plus, Play, RefreshCw, X, Terminal, Download, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react'
import { mostrarAlerta, exportarCSV, executarSQL } from '../../lib/funcoes/index.js'
import { notificar } from '../../components/Notificacao'
import { Btn, FInput, SectionTitle, EmptyState } from './_shared.jsx'

function paraApi(s) { return { id: s.id, nome: s.nome, sql_texto: s.sql, ativo: s.ativo ?? true } }
function daApi(s) { return { id: s.id, nome: s.nome, sql: s.sql_texto, descricao: s.descricao || '', ativo: s.ativo } }

const EXEMPLOS_SCRIPTS = [
  { nome: 'Info do banco',          descricao: 'Versão e informações do servidor PostgreSQL', sql: `SELECT version() AS versao_postgres,\n  current_database() AS banco,\n  current_user AS usuario,\n  NOW() AS data_hora_servidor,\n  pg_size_pretty(pg_database_size(current_database())) AS tamanho_banco` },
  { nome: 'Listar tabelas',         descricao: 'Todas as tabelas do banco com contagem de linhas estimada', sql: `SELECT\n  schemaname AS schema,\n  tablename AS tabela,\n  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS tamanho\nFROM pg_tables\nWHERE schemaname = 'public'\nORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC` },
  { nome: 'Registros por dia',      descricao: 'Conta registros agrupados por dia (precisa ter coluna criado_em)', sql: `SELECT\n  DATE(criado_em) AS dia,\n  COUNT(*) AS total\nFROM sua_tabela\nWHERE criado_em >= NOW() - INTERVAL '30 days'\nGROUP BY DATE(criado_em)\nORDER BY dia DESC` },
  { nome: 'Buscar duplicados',      descricao: 'Encontra registros com valor duplicado em uma coluna', sql: `SELECT email, COUNT(*) AS ocorrencias\nFROM sua_tabela\nGROUP BY email\nHAVING COUNT(*) > 1\nORDER BY ocorrencias DESC` },
  { nome: 'Top 10 maiores tabelas', descricao: 'Lista as 10 maiores tabelas por tamanho em disco', sql: `SELECT\n  relname AS tabela,\n  pg_size_pretty(pg_total_relation_size(oid)) AS tamanho_total,\n  pg_size_pretty(pg_relation_size(oid)) AS tamanho_dados\nFROM pg_class\nWHERE relkind = 'r'\nORDER BY pg_total_relation_size(oid) DESC\nLIMIT 10` },
]

export default function SecaoScripts() {
  const [scripts, setScripts]       = useState([])
  const [ativo, setAtivo]           = useState(null)
  const [resultado, setResultado]   = useState(null)
  const [executando, setExecutando] = useState(false)

  useEffect(() => {
    window.api.funcoes.listarScripts().then(async res => {
      let lista = res.ok ? res.data.map(daApi) : []
      if (!lista.length) {
        const criado = await window.api.funcoes.criarScript(paraApi({
          nome: 'Consulta inicial',
          sql: 'SELECT NOW() AS agora, current_database() AS banco, current_user AS usuario',
        }))
        if (criado.ok) lista = [daApi(criado.data)]
      }
      setScripts(lista); setAtivo(lista[0]?.id ?? null)
    })
  }, [])

  const carregarExemplos = useCallback(async (all) => {
    const criados = []
    for (const e of EXEMPLOS_SCRIPTS) {
      const res = await window.api.funcoes.criarScript(paraApi({ nome: e.nome, sql: e.sql }))
      if (res.ok) criados.push(daApi(res.data))
    }
    const nova = [...all, ...criados]
    setScripts(nova); setAtivo(criados[0]?.id ?? ativo)
    mostrarAlerta(`${criados.length} scripts de exemplo carregados!`, 'sucesso')
  }, [ativo])

  const scriptAtivo = scripts.find(s => s.id === ativo)

  const atualizar = useCallback((id, patch) => {
    setScripts(prev => {
      const nova = prev.map(s => s.id === id ? { ...s, ...patch } : s)
      const atualizado = nova.find(s => s.id === id)
      window.api.funcoes.atualizarScript(paraApi(atualizado))
      return nova
    })
  }, [])

  const novoScript = async () => {
    const res = await window.api.funcoes.criarScript(paraApi({ nome: 'Novo Script', sql: '-- Escreva seu SQL aqui\nSELECT ' }))
    if (!res.ok) return
    const s = daApi(res.data)
    setScripts(prev => [...prev, s])
    setAtivo(s.id); setResultado(null)
  }

  const remover = async (id) => {
    if (!(await notificar.confirmar('Excluir este script?', { perigo: true, confirmarLabel: 'Excluir' }))) return
    await window.api.funcoes.excluirScript(id)
    setScripts(prev => {
      const nova = prev.filter(s => s.id !== id)
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
