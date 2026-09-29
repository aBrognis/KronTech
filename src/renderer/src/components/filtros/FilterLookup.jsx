import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import PesquisaPadraoModal from '../PesquisaPadraoModal.jsx'

// Filtro por FK, multi-seleção via lupa. Parece um campo de verdade: uma
// caixa com borda, os selecionados como chips dentro, e um botão de lupa
// encostado à direita. A lupa abre a consulta da tabela relacionada
// (PesquisaPadraoModal); cada registro escolhido vira um chip. Buscar traz
// todos os registros cujo <chave> está no conjunto de ids escolhidos.
//
// props:
//   tabela: nome da tabela consultada (ex: 'banco_001')
//   campoValor: coluna gravada no filtro (default 'id')
//   campoLabel: coluna mostrada como rótulo do chip (ex: 'nome')
//   camposBusca: [{ nome_campo, label }] colunas pesquisáveis no modal
//   titulo: título do modal
//   placeholder: texto quando nada selecionado (default 'Todos')
//   value: { op:'in', valores:[12,34], rotulos:{12:'BB',34:'ITAU'} } | null
//   onChange(filtroOuNull)
const RE_TABELA = /^[a-z][a-z0-9_]*_\d{3}$/
const RE_COL = /^[a-z_][a-z0-9_]*$/i

export default function FilterLookup({
  tabela, campoValor = 'id', campoLabel = 'nome', camposBusca = [],
  titulo, placeholder = 'Todos', value, onChange,
}) {
  const [aberto, setAberto] = useState(false)

  const valores = value?.valores || []
  const rotulos = value?.rotulos || {}

  const colsBusca = camposBusca.length
    ? camposBusca
    : [{ nome_campo: campoLabel, label: 'Nome' }]

  const onBuscar = useCallback(async (_campo, modo, busca, campo, ordem) => {
    if (!RE_TABELA.test(tabela)) return { registros: [], total: 0 }
    const like = modo === 'iniciando' ? `${busca}%` : modo === 'igual' ? busca : `%${busca}%`
    const colBuscaSql = RE_COL.test(campo || '') ? campo : campoLabel
    const colValSql = RE_COL.test(campoValor) ? campoValor : 'id'
    const colLblSql = RE_COL.test(campoLabel) ? campoLabel : 'nome'
    const dir = ordem === 'desc' ? 'DESC' : 'ASC'
    const extras = colsBusca
      .map((c) => c.nome_campo)
      .filter((n) => RE_COL.test(n) && n !== colValSql && n !== colLblSql)
    const selExtras = extras.length ? ', ' + extras.map((n) => `"${n}"`).join(', ') : ''
    const sql =
      `SELECT "${colValSql}" AS id, "${colLblSql}" AS __l${selExtras} ` +
      `FROM "${tabela}" ` +
      (busca ? `WHERE CAST("${colBuscaSql}" AS TEXT) ILIKE $1 ` : '') +
      `ORDER BY "${colLblSql}" ${dir} LIMIT 500`
    const params = busca ? [like] : []
    const res = await window.api.form.query(sql, params)
    if (!res.ok) return { registros: [], total: 0 }
    const registros = (res.data || []).map((r) => ({ ...r, [campoLabel]: r.__l }))
    return { registros, total: registros.length, limitado: registros.length >= 500 }
  }, [tabela, campoValor, campoLabel, colsBusca])

  function selecionar(r) {
    const id = r.id
    if (!valores.includes(id)) {
      onChange({ op: 'in', valores: [...valores, id], rotulos: { ...rotulos, [id]: r.__l ?? String(id) } })
    }
    setAberto(false)
  }

  function remover(id) {
    const novo = valores.filter((v) => v !== id)
    const rot = { ...rotulos }
    delete rot[id]
    onChange(novo.length ? { op: 'in', valores: novo, rotulos: rot } : null)
  }

  return (
    <>
      <div
        onClick={() => setAberto(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          minHeight: 30, padding: '3px 3px 3px 8px',
          border: '1px solid var(--bd)', borderRadius: 6, background: 'var(--s1)',
          cursor: 'pointer', flexWrap: 'wrap',
        }}
      >
        {valores.length === 0 && (
          <span style={{ flex: 1, fontSize: 12, color: 'var(--t3)' }}>{placeholder}</span>
        )}
        {valores.map((id) => (
          <span
            key={id}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 3px 2px 8px', borderRadius: 10, fontSize: 11,
              background: 'var(--or3)', color: 'var(--or)', fontWeight: 600,
              maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden',
            }}
            title={rotulos[id] || `#${id}`}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{rotulos[id] || `#${id}`}</span>
            <button
              type="button"
              onClick={() => remover(id)}
              style={{ display: 'flex', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--or)', padding: 1 }}
              title="Remover"
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setAberto(true) }}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 5, flexShrink: 0,
            border: 'none', background: 'var(--s3)', cursor: 'pointer', color: 'var(--t2)',
          }}
          title="Consultar"
        >
          <Search size={13} />
        </button>
      </div>

      {aberto && (
        <PesquisaPadraoModal
          titulo={titulo || `Consultar ${tabela}`}
          campos={colsBusca}
          colunasExibidas={colsBusca}
          campoInicial={colsBusca[0]?.nome_campo}
          onBuscar={onBuscar}
          onSelecionar={selecionar}
          onFechar={() => setAberto(false)}
          renderCelula={(r, c) => String(r[c.nome_campo] ?? '')}
        />
      )}
    </>
  )
}
