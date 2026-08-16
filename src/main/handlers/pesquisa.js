import { col } from '../services/sqlHelpers.js'

const LIMITE_PESQUISA = 200
const LIMITE_TESTE     = 20

const SQL_LEITURA_RE = /^\s*(select|with)\b/i

function validarSelect(sql) {
  if (!SQL_LEITURA_RE.test(sql || '')) {
    throw new Error('A query da pesquisa precisa começar com SELECT ou WITH.')
  }
}

// Aproximação razoável do nome da tabela base, extraído do primeiro FROM
// da query salva — cobre o caso comum de uma tabela só; SQL com JOIN/
// subquery complexos retorna a primeira tabela do FROM principal.
function extrairNomeTabela(sql) {
  const m = /\bFROM\s+"?(\w+)"?/i.exec(sql || '')
  return m ? m[1] : null
}

// Monta o resultado paginado/filtrado a partir do SQL configurado, tratado
// como subquery — preserva o filtro dinâmico da caixa "Buscar" do
// PesquisaPadraoModal sem exigir que quem escreveu o SQL pense em WHERE.
async function executarPesquisa(sqlQuery, { campo, modo = 'contendo', busca = '', ordenar, direcao = 'ASC' } = {}, query, queryOne) {
  validarSelect(sqlQuery)
  const params = []
  const conds = []
  if (busca?.trim() && campo) {
    const c = col(campo)
    if (modo === 'iniciando')      { params.push(`${busca.trim()}%`);  conds.push(`CAST(${c} AS TEXT) ILIKE $${params.length}`) }
    else if (modo === 'igual')     { params.push(busca.trim());        conds.push(`CAST(${c} AS TEXT) = $${params.length}`) }
    else /* contendo */            { params.push(`%${busca.trim()}%`); conds.push(`CAST(${c} AS TEXT) ILIKE $${params.length}`) }
  }
  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : ''
  const colOrdem = ordenar ? col(ordenar) : (campo ? col(campo) : null)
  const orderBy = colOrdem ? `ORDER BY ${colOrdem} ${direcao === 'desc' || direcao === 'DESC' ? 'DESC' : 'ASC'}` : ''
  const base = `SELECT * FROM (${sqlQuery}) AS q ${where}`
  params.push(LIMITE_PESQUISA)

  const [registros, total] = await Promise.all([
    query(`${base} ${orderBy} LIMIT $${params.length}`, params),
    queryOne(`SELECT COUNT(*) AS n FROM (${sqlQuery}) AS q ${where}`, params.slice(0, params.length - 1)),
  ])
  return { registros, total: parseInt(total.n), limitado: parseInt(total.n) > LIMITE_PESQUISA }
}

export function registerPesquisaHandlers({ ipcMain, wrap, query, queryOne }) {

  ipcMain.handle('pesquisa:listar', wrap(async () => {
    return query('SELECT * FROM kr_pesquisas_001 ORDER BY nome')
  }))

  ipcMain.handle('pesquisa:obter', wrap(async (_, codigo) => {
    const row = await queryOne('SELECT * FROM kr_pesquisas_001 WHERE codigo=$1', [codigo])
    if (!row) throw new Error(`Pesquisa "${codigo}" não encontrada.`)
    return { ...row, tabela: extrairNomeTabela(row.sql_query) }
  }))

  ipcMain.handle('pesquisa:salvar', wrap(async (_, d) => {
    if (!d.codigo?.trim()) throw new Error('Código é obrigatório.')
    if (!d.nome?.trim()) throw new Error('Nome é obrigatório.')
    validarSelect(d.sql_query)
    if (d.id) {
      const row = await queryOne(`
        UPDATE kr_pesquisas_001
        SET codigo=$1, nome=$2, sql_query=$3, campo_busca=$4, colunas_exibidas=$5, mostrar_favorito=$6, atualizado_em=NOW()
        WHERE id=$7 RETURNING *
      `, [d.codigo.trim(), d.nome.trim(), d.sql_query, d.campo_busca || null, JSON.stringify(d.colunas_exibidas || []), !!d.mostrar_favorito, d.id])
      if (!row) throw new Error(`Pesquisa #${d.id} não encontrada.`)
      return row
    }
    return queryOne(`
      INSERT INTO kr_pesquisas_001 (codigo, nome, sql_query, campo_busca, colunas_exibidas, mostrar_favorito)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [d.codigo.trim(), d.nome.trim(), d.sql_query, d.campo_busca || null, JSON.stringify(d.colunas_exibidas || []), !!d.mostrar_favorito])
  }))

  ipcMain.handle('pesquisa:excluir', wrap(async (_, id) => {
    await query('DELETE FROM kr_pesquisas_001 WHERE id=$1', [id])
  }))

  ipcMain.handle('pesquisa:testarSql', wrap(async (_, sql) => {
    validarSelect(sql)
    const rows = await query(`SELECT * FROM (${sql}) AS q LIMIT ${LIMITE_TESTE}`)
    const fields = rows.length ? Object.keys(rows[0]) : []
    return { rows, fields }
  }))

  ipcMain.handle('pesquisa:executar', wrap(async (_, codigo, opts) => {
    const pesquisa = await queryOne('SELECT * FROM kr_pesquisas_001 WHERE codigo=$1 AND ativo=TRUE', [codigo])
    if (!pesquisa) throw new Error(`Pesquisa "${codigo}" não encontrada ou inativa.`)
    const resultado = await executarPesquisa(pesquisa.sql_query, {
      campo: opts?.campo || pesquisa.campo_busca,
      modo: opts?.modo,
      busca: opts?.busca,
      ordenar: opts?.ordenar,
      direcao: opts?.direcao,
    }, query, queryOne)
    return {
      ...resultado,
      campos: pesquisa.colunas_exibidas || [],
      colunasExibidas: pesquisa.colunas_exibidas || [],
      campoInicial: pesquisa.campo_busca,
      mostrarFavorito: pesquisa.mostrar_favorito,
      titulo: pesquisa.nome,
      tabela: extrairNomeTabela(pesquisa.sql_query),
    }
  }))
}
