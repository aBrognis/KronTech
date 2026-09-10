import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import PesquisaPadraoModal from '../PesquisaPadraoModal.jsx'

// Filtro por FK, multi-seleção via lupa. Abre a consulta da tabela
// relacionada (PesquisaPadraoModal), o usuario escolhe um registro, vira
// um chip; reabre a lupa pra adicionar outro. Buscar traz todos os
// registros cujo <chave> esta no conjunto de ids escolhidos.
//
// props:
//   tabela: nome da tabela consultada (ex: 'banco_001')
//   campoValor: coluna gravada no filtro (default 'id')
//   campoLabel: coluna mostrada como rotulo do chip (ex: 'nome')
//   camposBusca: [{ nome_campo, label }] colunas pesquisaveis no modal
//   titulo: titulo do modal (default 'Consultar ' + tabela)
//   value: { op:'in', valores:[12,34], rotulos:{12:'BB',34:'ITAU'} } | null
//   onChange(filtroOuNull)
const RE_TABELA = /^[a-z][a-z0-9_]*_\d{3}$/

export default function FilterLookup({
  tabela, campoValor = 'id', campoLabel = 'nome', camposBusca = [],
  titulo, value, onChange,
}) {
  const [aberto, setAberto] = useState(false)

  const valores = value?.valores || []
  const rotulos = value?.rotulos || {}

  const colsBusca = camposBusca.length
    ? camposBusca
    : [{ nome_campo: campoLabel, label: campoLabel }]

  const onBuscar = useCallback(async (_campo, modo, busca, campo, ordem) => {
    if (!RE_TABELA.test(tabela)) return { registros: [], total: 0 }
    const like = modo === 'iniciando' ? `${busca}%` : modo === 'igual' ? busca : `%${busca}%`
    const colBuscaSql = /^[a-z_][a-z0-9_]*$/i.test(campo || '') ? campo : campoLabel
    const colValSql = /^[a-z_][a-z0-9_]*$/i.test(campoValor) ? campoValor : 'id'
    const colLblSql = /^[a-z_][a-z0-9_]*$/i.test(campoLabel) ? campoLabel : 'nome'
    const dir = ordem === 'desc' ? 'DESC' : 'ASC'
    const extras = colsBusca
      .map((c) => c.nome_campo)
      .filter((n) => /^[a-z_][a-z0-9_]*$/i.test(n) && n !== colValSql && n !== colLblSql)
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
      const novo = [...valores, id]
      onChange({ op: 'in', valores: novo, rotulos: { ...rotulos, [id]: r.__l ?? String(id) } })
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
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, minHeight: 30 }}>
      {valores.map((id) => (
        <span
          key={id}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 4px 2px 8px', borderRadius: 12, fontSize: 11,
            background: 'var(--or3)', color: 'var(--or)', fontWeight: 600,
            maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden',
          }}
          title={rotulos[id] || `#${id}`}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{rotulos[id] || `#${id}`}</span>
          <button
            type="button"
            onClick={() => remover(id)}
            style={{ display: 'flex', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--or)', padding: 0 }}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <button
        type="button"
        className="btn btn-ghost"
        style={{ height: 26, padding: '0 8px', fontSize: 11 }}
        onClick={() => setAberto(true)}
      >
        <Search size={12} /> {valores.length ? 'Adicionar' : 'Consultar'}
      </button>

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
    </div>
  )
}
