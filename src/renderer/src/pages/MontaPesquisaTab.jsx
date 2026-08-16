import { useState, useEffect } from 'react'
import { Search, Plus, Trash2, Save, X, Play, RefreshCw, AlertCircle,
         ChevronUp, ChevronDown, Star, Table2 } from 'lucide-react'
import './MontaPesquisaTab.css'

function emptyForm() {
  return { codigo: '', nome: '', sql_query: '', campo_busca: '', colunas_exibidas: [], mostrar_favorito: false }
}

function abreviaTipo(tipo) {
  return (tipo || '')
    .replace('character varying', 'varchar')
    .replace('timestamp without time zone', 'ts')
    .replace('timestamp with time zone', 'tstz')
}

function gerarSql(tabela, colunas) {
  if (!tabela || !colunas.length) return ''
  return `SELECT ${colunas.map(c => c.nome_campo).join(', ')} FROM ${tabela}`
}

export default function MontaPesquisaTab() {
  const [pesquisas,  setPesquisas]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState(null)   // null | 'new' | pesquisa
  const [form,       setForm]       = useState(emptyForm())
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [erro,       setErro]       = useState(null)

  const [modo, setModo] = useState('avancado')   // 'basico' | 'avancado'

  // ── modo Básico: catálogo de tabelas/colunas ──
  const [tabelas,        setTabelas]        = useState([])
  const [buscaTabela,    setBuscaTabela]    = useState('')
  const [tabelaSel,      setTabelaSel]      = useState('')
  const [colunasTabela,  setColunasTabela]  = useState([])
  const [carregandoCols, setCarregandoCols] = useState(false)

  // ── modo Avançado: testar SQL ──
  const [testing,    setTesting]    = useState(false)
  const [testRows,   setTestRows]   = useState(null)
  const [testFields, setTestFields] = useState([])
  const [testErr,    setTestErr]    = useState(null)

  useEffect(() => { load() }, [])
  useEffect(() => { if (modo === 'basico' && !tabelas.length) carregarTabelas() }, [modo]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    try {
      const res = await window.api.pesquisa.listar()
      setPesquisas(res.ok ? res.data : [])
    } finally { setLoading(false) }
  }

  async function carregarTabelas() {
    const res = await window.api.sql.getTables()
    if (res.ok) setTabelas(res.data)
  }

  function openNew() {
    setSelected('new')
    setForm(emptyForm())
    resetTeste()
    resetBasico()
    setModo('basico')
    setErro(null)
  }

  function openEdit(p) {
    setSelected(p)
    setForm({
      codigo: p.codigo || '',
      nome: p.nome || '',
      sql_query: p.sql_query || '',
      campo_busca: p.campo_busca || '',
      colunas_exibidas: p.colunas_exibidas || [],
      mostrar_favorito: !!p.mostrar_favorito,
    })
    resetTeste()
    resetBasico()
    setModo('avancado')
    setErro(null)
  }

  function resetTeste() {
    setTestRows(null); setTestFields([]); setTestErr(null)
  }

  function resetBasico() {
    setTabelaSel(''); setColunasTabela([]); setBuscaTabela('')
  }

  function f(key, val) { setForm(prev => ({ ...prev, [key]: val })) }

  async function selecionarTabela(nomeTabela) {
    setTabelaSel(nomeTabela)
    setCarregandoCols(true)
    // trocar de tabela sempre reseta a seleção de colunas anterior
    f('colunas_exibidas', [])
    f('campo_busca', '')
    try {
      const res = await window.api.sql.getColumns(nomeTabela)
      const cols = res.ok ? res.data : []
      setColunasTabela(cols)
      // todas as colunas marcadas por padrão
      const exibidas = cols.map(c => ({ nome_campo: c.column_name, label: c.column_name }))
      f('colunas_exibidas', exibidas)
      f('sql_query', gerarSql(nomeTabela, exibidas))
      if (exibidas.length) f('campo_busca', exibidas[0].nome_campo)
    } finally { setCarregandoCols(false) }
  }

  function toggleColunaBasico(nomeCampo) {
    const existe = form.colunas_exibidas.some(c => c.nome_campo === nomeCampo)
    const novasColunas = existe
      ? form.colunas_exibidas.filter(c => c.nome_campo !== nomeCampo)
      : [...form.colunas_exibidas, { nome_campo: nomeCampo, label: nomeCampo }]
    f('colunas_exibidas', novasColunas)
    f('sql_query', gerarSql(tabelaSel, novasColunas))
    if (form.campo_busca && !novasColunas.some(c => c.nome_campo === form.campo_busca)) {
      f('campo_busca', novasColunas[0]?.nome_campo || '')
    }
  }

  function irParaAvancado() {
    setModo('avancado')
  }

  function irParaBasico() {
    resetBasico()
    resetTeste()
    f('sql_query', '')
    f('colunas_exibidas', [])
    f('campo_busca', '')
    setModo('basico')
  }

  async function handleTestar() {
    if (!form.sql_query.trim()) return
    setTesting(true)
    resetTeste()
    try {
      const res = await window.api.pesquisa.testarSql(form.sql_query)
      if (!res.ok) { setTestErr(res.erro); return }
      setTestRows(res.data.rows || [])
      setTestFields(res.data.fields || [])
      const fields = res.data.fields || []
      if (!form.colunas_exibidas.length) {
        f('colunas_exibidas', fields.slice(0, 5).map(nome => ({ nome_campo: nome, label: nome })))
      } else {
        const validas = form.colunas_exibidas.filter(c => fields.includes(c.nome_campo))
        if (validas.length !== form.colunas_exibidas.length) f('colunas_exibidas', validas)
      }
      if (form.campo_busca && !fields.includes(form.campo_busca)) f('campo_busca', '')
    } catch (e) { setTestErr(String(e)) }
    finally { setTesting(false) }
  }

  async function handleGravar() {
    if (!form.codigo.trim() || !form.nome.trim() || !form.sql_query.trim()) {
      setErro('Código, nome e SQL são obrigatórios.')
      return
    }
    setSaving(true)
    setErro(null)
    try {
      const payload = { ...form, id: selected === 'new' ? undefined : selected.id }
      const res = await window.api.pesquisa.salvar(payload)
      if (!res.ok) { setErro(res.erro); return }
      await load()
      setSelected(res.data)
    } finally { setSaving(false) }
  }

  async function handleExcluir() {
    if (selected === 'new' || !selected?.id) return
    if (deleting) return
    setDeleting(true)
    try {
      await window.api.pesquisa.excluir(selected.id)
      setSelected(null)
      await load()
    } finally { setDeleting(false) }
  }

  function handleDesistir() {
    setSelected(null)
    setForm(emptyForm())
    resetTeste()
    resetBasico()
    setErro(null)
  }

  function moverColuna(idx, dir) {
    const arr = [...form.colunas_exibidas]
    const novo = idx + dir
    if (novo < 0 || novo >= arr.length) return
    ;[arr[idx], arr[novo]] = [arr[novo], arr[idx]]
    f('colunas_exibidas', arr)
  }

  function renomearColuna(idx, label) {
    const arr = [...form.colunas_exibidas]
    arr[idx] = { ...arr[idx], label }
    f('colunas_exibidas', arr)
  }

  const colunasSelecionadasBasico = new Set(form.colunas_exibidas.map(c => c.nome_campo))
  const tabelasFiltradas = tabelas.filter(t =>
    !buscaTabela || t.table_name.toLowerCase().includes(buscaTabela.toLowerCase()))

  const camposBuscaOptions = modo === 'basico'
    ? colunasTabela.map(c => c.column_name)
    : (testFields.length ? testFields : form.colunas_exibidas.map(c => c.nome_campo))

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>

      {/* ── LEFT: lista de pesquisas ── */}
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--bd)', background: 'var(--s1)' }}>
        <div style={{ padding: 14, borderBottom: '1px solid var(--bd)' }}>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', gap: 6, display: 'flex', alignItems: 'center' }} onClick={openNew}>
            <Plus size={13} /> Nova Pesquisa
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="skel" style={{ height: 44, borderRadius: 7, marginBottom: 6 }} />)
          ) : pesquisas.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--t3)', fontSize: 11, padding: '32px 12px' }}>
              Nenhuma pesquisa configurada.
            </div>
          ) : pesquisas.map(p => {
            const isSel = selected !== 'new' && selected?.id === p.id
            return (
              <div key={p.id} onClick={() => openEdit(p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 3,
                  borderRadius: 8, cursor: 'pointer',
                  background: isSel ? 'var(--or4)' : 'transparent',
                  border: isSel ? '1px solid rgba(217,82,24,.35)' : '1px solid transparent',
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--s2)' }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
              >
                <Search size={13} color={isSel ? 'var(--or)' : 'var(--t3)'} style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isSel ? 'var(--or)' : 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.nome}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'monospace' }}>{p.codigo}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── RIGHT: editor ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {!selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, color: 'var(--t3)' }}>
            <Search size={48} />
            <div style={{ fontSize: 13, textAlign: 'center', lineHeight: 1.8 }}>
              Selecione uma pesquisa para editar<br/>ou clique em <strong style={{ color: 'var(--t2)' }}>Nova Pesquisa</strong>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 900 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>
                {selected === 'new' ? 'Nova Pesquisa' : 'Editar Pesquisa'}
              </div>
              <div className="mp-modo-toggle">
                <button className={`mp-modo-btn${modo === 'basico' ? ' active' : ''}`} onClick={irParaBasico}>Básico</button>
                <button className={`mp-modo-btn${modo === 'avancado' ? ' active' : ''}`} onClick={irParaAvancado}>Avançado</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <Label>Código</Label>
                <input className="form-input" value={form.codigo} onChange={e => f('codigo', e.target.value.trim())}
                  placeholder="ex: agenda_cliente" style={{ width: '100%', fontFamily: 'monospace' }} />
              </div>
              <div>
                <Label>Nome (título do modal)</Label>
                <input className="form-input" value={form.nome} onChange={e => f('nome', e.target.value)}
                  placeholder="ex: Cadastro de Entidade" style={{ width: '100%' }} />
              </div>
            </div>

            {modo === 'basico' ? (
              <div style={{ marginBottom: 20 }}>
                <Label>Escolha a tabela e as colunas</Label>
                <div className="mp-basico">
                  <div className="mp-tabelas">
                    <div className="mp-tabelas-head"><span>Tabelas</span></div>
                    <div className="mp-search-wrap">
                      <Search size={11} />
                      <input className="mp-search-input" placeholder="Buscar tabela..." value={buscaTabela} onChange={e => setBuscaTabela(e.target.value)} />
                    </div>
                    <div className="mp-tabela-list">
                      {tabelasFiltradas.map(t => (
                        <button key={t.table_name}
                          className={`mp-tabela-row${tabelaSel === t.table_name ? ' active' : ''}`}
                          onClick={() => selecionarTabela(t.table_name)}
                        >
                          <Table2 size={11} strokeWidth={1.75} />
                          <span>{t.table_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mp-colunas">
                    <div className="mp-colunas-head">
                      <span>{tabelaSel ? `Colunas de ${tabelaSel}` : 'Colunas'}</span>
                      {colunasTabela.length > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--t3)' }}>
                          {colunasSelecionadasBasico.size} de {colunasTabela.length}
                        </span>
                      )}
                    </div>
                    {!tabelaSel ? (
                      <div className="mp-colunas-empty">Selecione uma tabela à esquerda</div>
                    ) : carregandoCols ? (
                      <div className="mp-colunas-empty">Carregando colunas...</div>
                    ) : (
                      <div className="mp-colunas-list">
                        {colunasTabela.map(c => (
                          <button key={c.column_name} className="mp-coluna-row" onClick={() => toggleColunaBasico(c.column_name)}>
                            <input type="checkbox" className="mp-coluna-check" checked={colunasSelecionadasBasico.has(c.column_name)} readOnly />
                            <span className="mp-coluna-nome">{c.column_name}</span>
                            <span className="mp-coluna-tipo">{abreviaTipo(c.data_type)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {form.sql_query && (
                  <div style={{ marginTop: 8, fontSize: 10.5, color: 'var(--t3)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {form.sql_query}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Label style={{ marginBottom: 0 }}>Query SQL</Label>
                </div>
                <textarea
                  className="form-textarea"
                  value={form.sql_query}
                  onChange={e => f('sql_query', e.target.value)}
                  placeholder="SELECT * FROM minha_tabela WHERE ativo = TRUE"
                  spellCheck={false}
                  style={{ width: '100%', height: 140, fontFamily: 'monospace', fontSize: 11, resize: 'vertical', lineHeight: 1.65 }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 7, alignItems: 'center' }}>
                  <button
                    onClick={handleTestar}
                    disabled={testing || !form.sql_query.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 7, border: '1px solid var(--bd)', background: 'var(--s2)', color: 'var(--t1)', cursor: testing || !form.sql_query.trim() ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 500, opacity: !form.sql_query.trim() ? .5 : 1 }}
                  >
                    {testing ? <RefreshCw size={11} style={{ animation: 'spin .7s linear infinite' }} /> : <Play size={11} />}
                    Testar SQL
                  </button>
                  {testRows && (
                    <span style={{ fontSize: 10, color: 'var(--t3)' }}>
                      {testRows.length} linha{testRows.length !== 1 ? 's' : ''} · {testFields.length} coluna{testFields.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {testErr && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F87171', fontSize: 10, flex: 1, overflow: 'hidden' }}>
                      <AlertCircle size={11} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{testErr}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {form.colunas_exibidas.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <Label>Colunas exibidas na grid de resultado (arraste para reordenar)</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8, padding: 8 }}>
                  {form.colunas_exibidas.map((c, idx) => (
                    <div key={c.nome_campo} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <button onClick={() => moverColuna(idx, -1)} disabled={idx === 0}
                          style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? 'var(--bd2)' : 'var(--t3)', padding: 0, lineHeight: 0 }}>
                          <ChevronUp size={12} />
                        </button>
                        <button onClick={() => moverColuna(idx, 1)} disabled={idx === form.colunas_exibidas.length - 1}
                          style={{ background: 'none', border: 'none', cursor: idx === form.colunas_exibidas.length - 1 ? 'default' : 'pointer', color: idx === form.colunas_exibidas.length - 1 ? 'var(--bd2)' : 'var(--t3)', padding: 0, lineHeight: 0 }}>
                          <ChevronDown size={12} />
                        </button>
                      </div>
                      <span style={{ fontSize: 10.5, color: 'var(--t3)', fontFamily: 'monospace', width: 110, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.nome_campo}
                      </span>
                      <input className="form-input" value={c.label} onChange={e => renomearColuna(idx, e.target.value)}
                        style={{ flex: 1, height: 26, fontSize: 11 }} placeholder="Label exibido" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <Label>Campo de busca padrão</Label>
                <select className="form-select" value={form.campo_busca} onChange={e => f('campo_busca', e.target.value)} style={{ width: '100%' }}>
                  <option value="">— nenhum —</option>
                  {camposBuscaOptions.map(nome => (
                    <option key={nome} value={nome}>{nome}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--t2)', paddingBottom: 8 }}>
                  <input type="checkbox" checked={form.mostrar_favorito} onChange={e => f('mostrar_favorito', e.target.checked)} style={{ accentColor: 'var(--or)' }} />
                  <Star size={13} /> Mostrar coluna de favorito
                </label>
              </div>
            </div>

            {erro && (
              <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(239,68,68,.4)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--red)', marginBottom: 16 }}>
                {erro}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, paddingTop: 18, borderTop: '1px solid var(--bd)' }}>
              <button className="btn btn-primary" onClick={handleGravar} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {saving ? <RefreshCw size={12} style={{ animation: 'spin .7s linear infinite' }} /> : <Save size={12} />}
                {selected === 'new' ? 'Criar Pesquisa' : 'Salvar Alterações'}
              </button>
              {selected !== 'new' && (
                <button onClick={handleExcluir} disabled={deleting}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #EF444466', background: 'transparent', color: '#F87171', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                  <Trash2 size={12} /> Excluir
                </button>
              )}
              <button onClick={handleDesistir}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--bd)', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', fontSize: 12 }}>
                <X size={12} /> Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Label({ children, style }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 6, ...style }}>
      {children}
    </div>
  )
}
