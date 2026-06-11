import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Play, Zap, RefreshCw, Table2, Search,
  AlertCircle, CheckCircle2, Clock,
  FolderOpen, Save, Eraser,
  AlignLeft, CaseSensitive, History, X, Pin, PinOff, Copy, Check as CheckIcon,
} from 'lucide-react'
import '../App.css'
import './EditorSQL.css'

// ── Syntax Highlighter ────────────────────────────────────────────────────

const KW_RE = /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|ON|AND|OR|NOT|IN|AS|IS|BY|GROUP|ORDER|HAVING|LIMIT|OFFSET|DISTINCT|UNION|ALL|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|DROP|ALTER|TABLE|VIEW|INDEX|SCHEMA|DATABASE|IF|EXISTS|RETURNING|WITH|CASE|WHEN|THEN|ELSE|END|NULL|TRUE|FALSE|LIKE|ILIKE|BETWEEN|CASCADE|REPLACE|TRIGGER|FUNCTION|PROCEDURE|BEGIN|COMMIT|ROLLBACK|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|DEFAULT|CONSTRAINT|CHECK|SERIAL|RETURNS|DECLARE|VOID|INTEGER|TEXT|BOOLEAN|DATE|TIMESTAMP|NUMERIC|VARCHAR|CHAR|BIGINT|SMALLINT|REAL|DOUBLE|PRECISION|MONEY|UUID|JSON|JSONB|ARRAY|INTERVAL|LANGUAGE|PLPGSQL|DO|LOOP|RAISE|NOTICE|EXCEPT|INTERSECT|SOME|ANY|OVER|PARTITION|FOLLOWING|PRECEDING|UNBOUNDED|CURRENT|ROW|ROWS|RANGE)\b/gi

const FN_RE = /\b(COUNT|SUM|AVG|MIN|MAX|COALESCE|NULLIF|CAST|TRIM|UPPER|LOWER|LENGTH|SUBSTRING|SUBSTR|CONCAT|SPLIT_PART|NOW|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|DATE_TRUNC|EXTRACT|TO_CHAR|TO_DATE|TO_NUMBER|TO_TIMESTAMP|ROUND|FLOOR|CEILING|CEIL|ABS|MOD|POWER|SQRT|ROW_NUMBER|RANK|DENSE_RANK|LEAD|LAG|FIRST_VALUE|LAST_VALUE|STRING_AGG|ARRAY_AGG|BOOL_AND|BOOL_OR|GREATEST|LEAST|GENERATE_SERIES|UNNEST|ARRAY_TO_STRING|REGEXP_REPLACE|REGEXP_MATCH|STRPOS|INITCAP|RTRIM|LTRIM|LPAD|RPAD|REPEAT|REVERSE|MD5|FORMAT|QUOTE_IDENT|QUOTE_LITERAL|AGE|DATE_PART|MAKE_DATE|MAKE_INTERVAL)\b(?=\s*\()/gi

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Tokeniza o SQL protegendo strings e comentários
function tokenize(code) {
  const tokens = []
  let i = 0
  while (i < code.length) {
    if (code[i] === '-' && code[i + 1] === '-') {
      const nl = code.indexOf('\n', i)
      const end = nl === -1 ? code.length : nl
      tokens.push({ t: 'comment', v: code.slice(i, end) })
      i = end
    } else if (code[i] === "'") {
      let j = i + 1
      while (j < code.length) {
        if (code[j] === "'" && code[j + 1] === "'") j += 2
        else if (code[j] === "'") { j++; break }
        else j++
      }
      tokens.push({ t: 'string', v: code.slice(i, j) })
      i = j
    } else {
      let j = i
      while (j < code.length && code[j] !== "'" && !(code[j] === '-' && code[j + 1] === '-')) j++
      if (j > i) tokens.push({ t: 'code', v: code.slice(i, j) })
      i = Math.max(j, i + 1)
    }
  }
  return tokens
}

function highlightSQL(code) {
  return tokenize(code).map(({ t, v }) => {
    if (t === 'comment') return `<span class="hl-c">${esc(v)}</span>`
    if (t === 'string')  return `<span class="hl-s">${esc(v)}</span>`
    return esc(v)
      .replace(FN_RE, m => `<span class="hl-f">${m}</span>`)
      .replace(KW_RE, m => `<span class="hl-k">${m}</span>`)
      .replace(/\b(\d+(?:\.\d+)?)\b/g, m => `<span class="hl-n">${m}</span>`)
      .replace(/::/g, '<span class="hl-o">::</span>')
  }).join('')
}

// ── Formatação e Maiúsculas ───────────────────────────────────────────────

// Protege compostos com placeholder sem espaço: _KW_INNER_JOIN
// Assim \bJOIN\b não consegue fazer match dentro do placeholder,
// pois o underscore é word-char e elimina a word-boundary antes do J.
const COMP_PROTECT = [
  [/\bINNER\s+JOIN\b/g,              '_KW_INNER_JOIN'],
  [/\bLEFT\s+(?:OUTER\s+)?JOIN\b/g,  '_KW_LEFT_JOIN'],
  [/\bRIGHT\s+(?:OUTER\s+)?JOIN\b/g, '_KW_RIGHT_JOIN'],
  [/\bFULL\s+(?:OUTER\s+)?JOIN\b/g,  '_KW_FULL_JOIN'],
  [/\bCROSS\s+JOIN\b/g,              '_KW_CROSS_JOIN'],
  [/\bORDER\s+BY\b/g,                '_KW_ORDER_BY'],
  [/\bGROUP\s+BY\b/g,                '_KW_GROUP_BY'],
  [/\bPARTITION\s+BY\b/g,            '_KW_PARTITION_BY'],
  [/\bUNION\s+ALL\b/g,               '_KW_UNION_ALL'],
  [/\bINSERT\s+INTO\b/g,             '_KW_INSERT_INTO'],
  [/\bON\s+CONFLICT\b/g,             '_KW_ON_CONFLICT'],
]

const COMP_RESTORE = [
  ['_KW_INNER_JOIN',    '\nINNER JOIN'],
  ['_KW_LEFT_JOIN',     '\nLEFT JOIN'],
  ['_KW_RIGHT_JOIN',    '\nRIGHT JOIN'],
  ['_KW_FULL_JOIN',     '\nFULL JOIN'],
  ['_KW_CROSS_JOIN',    '\nCROSS JOIN'],
  ['_KW_ORDER_BY',      '\nORDER BY'],
  ['_KW_GROUP_BY',      '\nGROUP BY'],
  ['_KW_PARTITION_BY',  '\nPARTITION BY'],
  ['_KW_UNION_ALL',     '\nUNION ALL'],
  ['_KW_INSERT_INTO',   '\nINSERT INTO'],
  ['_KW_ON_CONFLICT',   '\nON CONFLICT'],
]

function formatSQL(sql) {
  let s = sql.trim().replace(/[ \t]+/g, ' ')
  s = s.replace(KW_RE, m => m.toUpperCase())
  s = s.replace(FN_RE, m => m.toUpperCase())

  // 1. Protege compostos antes de qualquer quebra de linha
  for (const [re, ph] of COMP_PROTECT) s = s.replace(re, ph)

  // 2. Quebra palavras-chave simples de nível superior
  for (const kw of ['SELECT','FROM','WHERE','HAVING','LIMIT','OFFSET',
                     'UPDATE','DELETE','RETURNING','UNION','JOIN','VALUES'])
    s = s.replace(new RegExp(`\\b${kw}\\b`, 'g'), `\n${kw}`)

  // 3. Sub-cláusulas com 2 espaços de indentação
  s = s
    .replace(/\bSET\b/g, '\n  SET')
    .replace(/\bAND\b/g, '\n  AND')
    .replace(/\bOR\b/g,  '\n  OR')

  // 4. Restaura compostos, cada um em linha própria
  for (const [ph, rep] of COMP_RESTORE) s = s.split(ph).join(rep)

  // 5. Limpa linhas; preserva 2 espaços intencionais (AND/OR/SET)
  return s.split('\n').map(l => {
    const t = l.trim()
    if (!t) return null
    return l.startsWith('  ') ? '  ' + t : t
  }).filter(Boolean).join('\n')
}

// AA: maiúscula em TUDO exceto strings e comentários
function toAllUppercase(sql) {
  return tokenize(sql).map(({ t, v }) => {
    if (t === 'comment' || t === 'string') return v
    return v.toUpperCase()
  }).join('')
}

// ── Confirmação destrutiva ────────────────────────────────────────────────

const DESTRUCTIVE_RE = /^\s*(DELETE|DROP|TRUNCATE)\b/i

function isDestructive(sql) { return DESTRUCTIVE_RE.test(sql.trim()) }

const HIST_KEY    = 'krontech_sql_history'
const HIST_MAX    = 60
const RESULT_CAP  = 500  // máximo de linhas renderizadas na tabela

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]') } catch { return [] }
}
function saveHistory(h) {
  try { localStorage.setItem(HIST_KEY, JSON.stringify(h)) } catch {}
}

// ── Componente ────────────────────────────────────────────────────────────

export default function EditorSQL() {
  const [sql, setSql]             = useState('')
  const [result, setResult]       = useState(null)
  const [running, setRunning]     = useState(false)
  const [confirm, setConfirm]     = useState(null)
  const [currentFile, setCurrentFile] = useState(null)
  const [f9Warn, setF9Warn]       = useState(false)

  // Schema sidebar state
  const [tables, setTables]       = useState([])
  const [tableSearch, setSearch]  = useState('')
  const [selected, setSelected]   = useState(null)
  const [columns, setColumns]     = useState([])
  const [indexes, setIndexes]     = useState([])
  const [detailTab, setDetailTab] = useState('campos')
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Aba da área de resultados: 'resultado' | 'historico'
  const [resultTab, setResultTab] = useState('resultado')

  // Histórico
  const [history, setHistory]     = useState(loadHistory)

  // SQL fixado — exibe o comando que gerou o resultado atual
  const [lastRunSql, setLastRunSql] = useState('')
  const [pinSql,    setPinSql]     = useState(false)
  const [copied,    setCopied]     = useState(false)

  const textareaRef = useRef(null)
  const preRef      = useRef(null)

  // Memoiza o highlight para não recalcular em cada render não relacionado ao sql
  const highlighted = useMemo(() => highlightSQL(sql) + '\n', [sql])

  useEffect(() => { loadTables() }, [])

  async function loadTables() {
    try { setTables(await window.api.sql.getTables()) } catch {}
  }

  async function selectTableDetail(name) {
    if (selected === name) return
    setSelected(name)
    setDetailTab('campos')
    setLoadingDetail(true)
    try {
      const [cols, idxs] = await Promise.all([
        window.api.sql.getColumns(name),
        window.api.sql.getIndexes(name),
      ])
      setColumns(cols)
      setIndexes(idxs)
    } finally {
      setLoadingDetail(false)
    }
    setSql(`SELECT * FROM ${name};`)
    textareaRef.current?.focus()
  }

  function insertAtCursor(name) {
    const ta = textareaRef.current
    if (!ta) return
    const s    = ta.selectionStart
    const next = sql.slice(0, s) + name + sql.slice(ta.selectionEnd)
    setSql(next)
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + name.length; ta.focus() }, 0)
  }

  const handleFileAction = useCallback(async () => {
    if (currentFile) {
      await window.api.sql.saveFile(currentFile, sql)
    } else {
      const res = await window.api.sql.openFile()
      if (!res) return
      setSql(res.content)
      setCurrentFile(res.path)
      setResult(null)
    }
  }, [currentFile, sql])

  const runQuery = useCallback(async (q) => {
    if (!q?.trim() || running) return
    setRunning(true)
    setResult(null)
    setLastRunSql(q.trim())
    setResultTab('resultado')
    const res = await window.api.sql.execute(q.trim())
    setResult(res)
    setRunning(false)
    const entry = {
      id:       Date.now(),
      sql:      q.trim(),
      ts:       new Date().toISOString(),
      ok:       res.ok,
      ms:       res.ms,
      command:  res.command,
      rowCount: res.rowCount ?? (res.rows?.length ?? 0),
    }
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, HIST_MAX)
      saveHistory(next)
      return next
    })
  }, [running])

  async function triggerExecute(mode) {
    const q = sql.trim()
    if (!q) return

    if (mode === 'select') {
      // F9 só aceita SELECT
      if (!/^\s*SELECT\b/i.test(q)) {
        setF9Warn(true)
        setTimeout(() => setF9Warn(false), 3000)
        return
      }
      runQuery(q)
      return
    }

    // F6 — executa qualquer DML/DDL, pede confirmação se destrutivo
    if (isDestructive(q)) { setConfirm(q); return }
    runQuery(q)
  }

  function handleKeyDown(e) {
    if (e.key === 'F2') { e.preventDefault(); handleFileAction(); return }
    if (e.key === 'F9') { e.preventDefault(); triggerExecute('select'); return }
    if (e.key === 'F6') { e.preventDefault(); triggerExecute('execute'); return }
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.target, s = ta.selectionStart
      const next = sql.slice(0, s) + '  ' + sql.slice(ta.selectionEnd)
      setSql(next)
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + 2 }, 0)
    }
  }

  function syncScroll() {
    if (preRef.current && textareaRef.current) {
      preRef.current.scrollTop  = textareaRef.current.scrollTop
      preRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  const filteredTables = tables.filter(t =>
    !tableSearch || t.table_name.toLowerCase().includes(tableSearch.toLowerCase())
  )

  const isSelect = result?.command === 'SELECT'
  const rows     = result?.rows   ?? []
  const fields   = result?.fields ?? []

  return (
    <div className="sql-layout">

      {/* ── Modal confirmação destrutiva ─────────────────── */}
      {confirm && (
        <div className="sql-confirm-overlay" onClick={() => setConfirm(null)}>
          <div className="sql-confirm" onClick={e => e.stopPropagation()}>
            <div className="sql-confirm-header">
              <AlertCircle size={15} strokeWidth={2} style={{ color: 'var(--red)', flexShrink: 0 }} />
              <span className="sql-confirm-title">Confirmação necessária</span>
            </div>
            <div className="sql-confirm-desc">
              Este comando pode remover dados de forma irreversível. Verifique o SQL antes de confirmar.
            </div>
            <pre className="sql-confirm-query">
              {confirm.length > 200 ? confirm.slice(0, 200) + '\n…' : confirm}
            </pre>
            <div className="sql-confirm-btns">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => { const q = confirm; setConfirm(null); runQuery(q) }}>
                Executar mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar: Tabelas ──────────────────────────────── */}
      <aside className="sql-schema">
        <div className="sql-schema-top">
          <div className="sql-schema-head">
            <span>Tabelas</span>
            <button className="sql-icon-btn" onClick={loadTables} title="Recarregar">
              <RefreshCw size={12} strokeWidth={2} />
            </button>
          </div>
          <div className="sql-search-wrap">
            <Search size={11} strokeWidth={2} className="sql-search-icon" />
            <input className="sql-search-input" placeholder="Buscar tabela..." value={tableSearch} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="sql-table-list">
            {filteredTables.map(t => (
              <button key={t.table_name}
                className={`sql-table-row${selected === t.table_name ? ' active' : ''}`}
                onClick={() => selectTableDetail(t.table_name)}
                onDoubleClick={() => insertAtCursor(t.table_name)}
                title="Clique → SELECT | Duplo-clique → inserir nome"
              >
                <Table2 size={11} strokeWidth={1.75} />
                <span>{t.table_name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sql-schema-bottom">
          <div className="sql-detail-tabs">
            <button className={`sql-detail-tab${detailTab === 'campos' ? ' active' : ''}`} onClick={() => setDetailTab('campos')}>Campos</button>
            <button className={`sql-detail-tab${detailTab === 'indices' ? ' active' : ''}`} onClick={() => setDetailTab('indices')}>Índices</button>
          </div>
          {!selected && <div className="sql-detail-empty">Selecione uma tabela</div>}
          {selected && loadingDetail && <div className="sql-detail-empty">Carregando...</div>}
          {selected && !loadingDetail && detailTab === 'campos' && (
            <div className="sql-detail-scroll">
              <table className="sql-detail-table">
                <thead><tr><th>Coluna</th><th>Tipo</th><th>Tam.</th></tr></thead>
                <tbody>
                  {columns.map(c => (
                    <tr key={c.column_name} onClick={() => insertAtCursor(c.column_name)} title="Clique para inserir no editor">
                      <td className="sql-col-pk">{c.column_name}</td>
                      <td>{c.data_type.replace('character varying', 'varchar').replace('timestamp without time zone', 'ts')}</td>
                      <td>{c.tamanho ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {selected && !loadingDetail && detailTab === 'indices' && (
            <div className="sql-detail-scroll">
              <table className="sql-detail-table">
                <thead><tr><th>Índice</th><th>Único</th></tr></thead>
                <tbody>
                  {indexes.map(idx => (
                    <tr key={idx.indexname}>
                      <td>{idx.indexname}</td>
                      <td style={{ color: idx.unico ? 'var(--green)' : 'var(--t3)' }}>{idx.unico ? 'Sim' : 'Não'}</td>
                    </tr>
                  ))}
                  {indexes.length === 0 && <tr><td colSpan={2} style={{ color: 'var(--t3)' }}>Nenhum índice</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </aside>

      {/* ── Editor Principal ─────────────────────────────── */}
      <div className="sql-main">

        {/* Toolbar */}
        <div className="sql-toolbar">

          {/* F2 — Arquivo (abre / salva) */}
          <button
            className="sql-flat-btn"
            onClick={handleFileAction}
            title={currentFile ? `Salvar — ${currentFile}` : 'Abrir arquivo SQL (F2)'}
          >
            {currentFile
              ? <Save size={13} strokeWidth={2} />
              : <FolderOpen size={13} strokeWidth={2} />}
            {currentFile ? 'Salvar' : 'Arquivo'}
            <span className="sql-flat-kbd">F2</span>
          </button>

          <div className="sql-sep" />

          {/* F9 — Consultar (SELECT) */}
          <button
            className={`sql-flat-btn primary${running ? ' running' : ''}${f9Warn ? ' f9-warn' : ''}`}
            onClick={() => triggerExecute('select')}
            disabled={running || !sql.trim()}
            title="Consultar — somente SELECT (F9)"
          >
            <Play size={13} strokeWidth={2} fill="currentColor" />
            {running ? 'Consultando...' : f9Warn ? 'Só SELECT!' : 'Consultar'}
            {!running && !f9Warn && <span className="sql-flat-kbd">F9</span>}
          </button>

          {/* F6 — Executar DML/DDL (DROP, CREATE, INSERT, DELETE...) */}
          <button
            className="sql-flat-btn execute"
            onClick={() => triggerExecute('execute')}
            disabled={running || !sql.trim()}
            title="Executar — DROP, CREATE, INSERT, UPDATE, DELETE, ALTER... (F6)"
          >
            <Zap size={13} strokeWidth={2} />
            Executar
            <span className="sql-flat-kbd">F6</span>
          </button>

          <div className="sql-sep" />

          {/* Formatar */}
          <button
            className="sql-flat-btn"
            onClick={() => setSql(formatSQL(sql))}
            disabled={!sql.trim()}
            title="Formatar SQL (quebrar cláusulas em linhas)"
          >
            <AlignLeft size={13} strokeWidth={2} />
            Formatar
          </button>

          {/* AA — tudo maiúsculo */}
          <button
            className="sql-flat-btn"
            onClick={() => setSql(toAllUppercase(sql))}
            disabled={!sql.trim()}
            title="Converter tudo para MAIÚSCULAS (exceto strings e comentários)"
          >
            <CaseSensitive size={14} strokeWidth={2} />
            AA
          </button>

          <div className="sql-sep" />

          {/* Manter SQL */}
          <button
            className={`sql-flat-btn${pinSql ? ' pin-active' : ''}`}
            onClick={() => setPinSql(v => !v)}
            title={pinSql ? 'Ocultar SQL executado nos resultados' : 'Mostrar SQL executado nos resultados'}
          >
            {pinSql ? <Pin size={13} strokeWidth={2} /> : <PinOff size={13} strokeWidth={2} />}
            Manter SQL
          </button>

          <div className="sql-sep" />

          {/* Limpar */}
          <button
            className="sql-flat-btn danger"
            onClick={() => { setSql(''); setResult(null); setCurrentFile(null); setLastRunSql('') }}
            disabled={!sql.trim() && !result}
            title="Limpar editor"
          >
            <Eraser size={13} strokeWidth={2} />
            Limpar
          </button>

          {/* Status */}
          {result && (
            <div className={`sql-status ${result.ok ? 'ok' : 'err'}`}>
              {result.ok
                ? <><CheckCircle2 size={12} strokeWidth={2} />
                    {isSelect
                      ? `${rows.length} linha${rows.length !== 1 ? 's' : ''}`
                      : `${result.command} — ${result.rowCount ?? 0} afetada${(result.rowCount ?? 0) !== 1 ? 's' : ''}`}
                  </>
                : <><AlertCircle size={12} strokeWidth={2} />Erro</>
              }
              <span className="sql-ms"><Clock size={10} strokeWidth={2} />{result.ms}ms</span>
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="sql-editor-wrap">
          <pre ref={preRef} className="sql-highlight" aria-hidden
            dangerouslySetInnerHTML={{ __html: highlighted }} />
          <textarea
            ref={textareaRef}
            className="sql-textarea"
            value={sql}
            onChange={e => { setSql(e.target.value); syncScroll() }}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            placeholder={'-- F9: executar tudo  |  F6: executar seleção'}
            spellCheck={false} autoComplete="off" autoCorrect="off"
          />
        </div>

        {/* ── Área de Resultados com abas ── */}
        <div className="sql-results-area">

          {/* Abas Resultado / Histórico */}
          <div className="sql-result-tabs">
            <button className={`sql-result-tab${resultTab === 'resultado' ? ' active' : ''}`} onClick={() => setResultTab('resultado')}>
              Resultado
              {result && <span className={`sql-result-tab-badge ${result.ok ? 'ok' : 'err'}`}>{result.ok ? (isSelect ? rows.length : result.rowCount ?? 0) : '!'}</span>}
            </button>
            <button className={`sql-result-tab${resultTab === 'historico' ? ' active' : ''}`} onClick={() => setResultTab('historico')}>
              <History size={11} strokeWidth={1.75} /> Histórico
              {history.length > 0 && <span className="sql-result-tab-badge neutral">{history.length}</span>}
            </button>
            {/* SQL mantido — aparece quando pinSql está ativo e há SQL executado */}
            {pinSql && lastRunSql && (
              <div className="sql-pinned-bar">
                <span className="sql-pinned-label">SQL:</span>
                <code className="sql-pinned-code">{lastRunSql.split('\n')[0].slice(0, 120)}{lastRunSql.split('\n').length > 1 || lastRunSql.length > 120 ? ' …' : ''}</code>
                <button className="sql-icon-btn" title="Copiar SQL" onClick={() => {
                  navigator.clipboard.writeText(lastRunSql).catch(() => {})
                  setCopied(true); setTimeout(() => setCopied(false), 2000)
                }}>
                  {copied ? <CheckIcon size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2} />}
                </button>
              </div>
            )}
          </div>

          {/* ── Aba Resultado ── */}
          {resultTab === 'resultado' && (
            <div className="sql-results">
              {!result && !running && (
                <div className="sql-results-empty">Execute uma query para ver os resultados</div>
              )}
              {running && (
                <div className="sql-results-empty">Executando...</div>
              )}
              {result?.ok === false && (
                <div className="sql-error">
                  <AlertCircle size={14} strokeWidth={2} />
                  <pre>{result.error}</pre>
                </div>
              )}
              {result?.ok && !isSelect && (
                <div className="sql-success">
                  <CheckCircle2 size={14} strokeWidth={2} />
                  <span><strong>{result.command}</strong> — {result.rowCount ?? 0} linha{(result.rowCount ?? 0) !== 1 ? 's' : ''} afetada{(result.rowCount ?? 0) !== 1 ? 's' : ''} em {result.ms}ms</span>
                </div>
              )}
              {result?.ok && isSelect && rows.length === 0 && (
                <div className="sql-results-empty">Nenhuma linha retornada</div>
              )}
              {result?.ok && isSelect && rows.length > 0 && (
                <div className="sql-table-wrap">
                  {rows.length > RESULT_CAP && (
                    <div className="sql-cap-warn">
                      Exibindo {RESULT_CAP} de {rows.length} linhas — use LIMIT para reduzir
                    </div>
                  )}
                  <table className="sql-table">
                    <thead>
                      <tr>
                        <th className="sql-th sql-th-row">#</th>
                        {fields.map(f => <th key={f} className="sql-th">{f}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, RESULT_CAP).map((row, i) => (
                        <tr key={i} className="sql-tr">
                          <td className="sql-td sql-td-row">{i + 1}</td>
                          {fields.map(f => {
                            const val = row[f]
                            const txt = val === null ? 'NULL' : typeof val === 'object' ? JSON.stringify(val) : String(val)
                            return <td key={f} className={`sql-td${val === null ? ' sql-null' : ''}`} title={txt}>{txt}</td>
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Aba Histórico ── */}
          {resultTab === 'historico' && (
            <div className="sql-results sql-hist-panel">
              <div className="sql-hist-header">
                <span>{history.length} execução{history.length !== 1 ? 'ões' : ''} registrada{history.length !== 1 ? 's' : ''}</span>
                {history.length > 0 && (
                  <button className="sql-icon-btn" title="Limpar histórico" onClick={() => { setHistory([]); saveHistory([]) }}>
                    <X size={12} strokeWidth={2} />
                  </button>
                )}
              </div>
              {history.length === 0 && (
                <div className="sql-results-empty">Nenhuma consulta ainda</div>
              )}
              <div className="sql-hist-rows">
                {history.map(h => (
                  <button key={h.id} className="sql-hist-row"
                    onClick={() => { setSql(h.sql); setResultTab('resultado'); textareaRef.current?.focus() }}
                    title="Clique para restaurar no editor">
                    <div className="sql-hist-meta">
                      <span className={`sql-hist-badge ${h.ok ? 'ok' : 'err'}`}>{h.ok ? '✓' : '✗'}</span>
                      <span className="sql-hist-cmd">{h.command || 'SQL'}</span>
                      {h.ok && <span className="sql-hist-rows-count">{h.rowCount} linha{h.rowCount !== 1 ? 's' : ''}</span>}
                      <span className="sql-hist-ms">{h.ms}ms</span>
                      <span className="sql-hist-time">
                        {new Date(h.ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="sql-hist-preview">{h.sql.split('\n').slice(0, 2).join(' ').slice(0, 140)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
