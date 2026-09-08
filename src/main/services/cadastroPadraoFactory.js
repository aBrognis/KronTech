import { query, queryOne } from '../db'

// Factory de CRUD para tabelas de cadastro simples do KronTech (uma tabela,
// codigo sequencial de 4 digitos, colunas de texto/boolean). Gera listar/
// obter/criar/atualizar/excluir + mudarAtivoLote, sem cada cadastro (Bancos,
// Naturezas, Condicoes de Pagamento, CNAE) reescrever o mesmo SQL.
//
// Espelha o <TelaCadastroPadrao> do renderer: um recurso novo = uma
// chamada a criarCadastroPadrao(config).
//
// config:
//   tabela        'banco_001'
//   colunas       ['nome','compe','ispb','site']   (colunas gravaveis; sem id/codigo/ativo/timestamps)
//   colunasBusca  ['nome','compe']                 (usadas no filtro `busca` da aba Acesso)
//   ordem         'nome ASC'                       (default: 'codigo ASC')
//   temAtivo      true                             (default: true — usa coluna `ativo`)
//   temCodigoSeq  true                             (default: true — gera codigo via <tabela>_codigo_seq)
//   normalizar    (dados) => dados                 (opcional: trim/upper antes de gravar)

export function criarCadastroPadrao(config) {
  const {
    tabela,
    colunas,
    colunasBusca = colunas.slice(0, 2),
    ordem = 'codigo ASC',
    temAtivo = true,
    temCodigoSeq = true,
    normalizar = (d) => d,
  } = config

  const ident = (s) => {
    if (!/^[a-z_][a-z0-9_]*$/i.test(s)) throw new Error(`identificador invalido: ${s}`)
    return s
  }
  ident(tabela)
  colunas.forEach(ident)

  async function listar({ busca } = {}) {
    const cond = []
    const params = []
    if (temAtivo) cond.push('ativo IS DISTINCT FROM false')
    if (busca && String(busca).trim()) {
      const termo = `%${String(busca).trim()}%`
      const ors = colunasBusca.map((c) => {
        params.push(termo)
        return `${ident(c)} ILIKE $${params.length}`
      })
      // codigo tambem entra na busca livre
      params.push(termo)
      ors.push(`codigo ILIKE $${params.length}`)
      cond.push(`(${ors.join(' OR ')})`)
    }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : ''
    return query(`SELECT * FROM ${tabela} ${where} ORDER BY ${ordem} LIMIT 1000`, params)
  }

  async function obter(id) {
    return queryOne(`SELECT * FROM ${tabela} WHERE id = $1`, [id])
  }

  async function criar(dados) {
    const d = normalizar(dados)
    const cols = colunas.filter((c) => d[c] !== undefined)
    const vals = cols.map((c) => d[c])
    const placeholders = cols.map((_, i) => `$${i + 1}`)

    let colCodigo = ''
    let valCodigo = ''
    if (temCodigoSeq) {
      colCodigo = ', codigo'
      valCodigo = `, LPAD(nextval('${tabela}_codigo_seq')::text, 4, '0')`
    }
    const sql = `
      INSERT INTO ${tabela} (${cols.join(', ')}${colCodigo}${temAtivo ? ', ativo' : ''})
      VALUES (${placeholders.join(', ')}${valCodigo}${temAtivo ? `, ${d.ativo === false ? 'false' : 'true'}` : ''})
      RETURNING *`
    return queryOne(sql, vals)
  }

  async function atualizar({ id, ...dados }) {
    const d = normalizar(dados)
    const cols = colunas.filter((c) => d[c] !== undefined)
    if (temAtivo && d.ativo !== undefined) cols.push('ativo')
    if (!cols.length) return obter(id)
    const sets = cols.map((c, i) => `${ident(c)} = $${i + 2}`)
    const vals = cols.map((c) => d[c])
    const sql = `
      UPDATE ${tabela}
      SET ${sets.join(', ')}${colTem(tabela, 'alterado_em') ? ', alterado_em = NOW()' : ''}
      WHERE id = $1 RETURNING *`
    return queryOne(sql, [id, ...vals])
  }

  async function excluir(id) {
    await query(`DELETE FROM ${tabela} WHERE id = $1`, [id])
    return { id }
  }

  async function mudarAtivoLote(ids, ativo) {
    if (!temAtivo) throw new Error(`${tabela} nao tem coluna ativo`)
    if (!Array.isArray(ids) || !ids.length) return { atualizadas: 0 }
    const rows = await query(
      `UPDATE ${tabela} SET ativo = $2${colTem(tabela, 'alterado_em') ? ', alterado_em = NOW()' : ''} WHERE id = ANY($1::int[]) RETURNING id`,
      [ids, ativo]
    )
    return { atualizadas: rows.length }
  }

  return { listar, obter, criar, atualizar, excluir, mudarAtivoLote }
}

// cache simples de "essa tabela tem essa coluna?" — evita bater no
// information_schema a cada UPDATE.
const _colCache = new Map()
function colTem(tabela, coluna) {
  const chave = `${tabela}.${coluna}`
  if (_colCache.has(chave)) return _colCache.get(chave)
  // sincrono nao da; assume que tem alterado_em (padrao das tabelas do
  // KronTech). Se a tabela nao tiver, o UPDATE falha e a gente ajusta a
  // config (temTimestamps: false). Mantido simples de proposito.
  _colCache.set(chave, true)
  return true
}

// Registra os 6 ipcMain.handle de um recurso. `wrap` e o envelope
// {ok, data|erro} padrao do projeto (vem de ipcHandlers).
export function registrarHandlersCadastro(ipcMain, wrap, recurso, crud) {
  ipcMain.handle(`${recurso}:listar`, wrap((_e, filtros) => crud.listar(filtros || {})))
  ipcMain.handle(`${recurso}:obter`, wrap((_e, id) => crud.obter(id)))
  ipcMain.handle(`${recurso}:criar`, wrap((_e, dados) => crud.criar(dados)))
  ipcMain.handle(`${recurso}:atualizar`, wrap((_e, dados) => crud.atualizar(dados)))
  ipcMain.handle(`${recurso}:excluir`, wrap((_e, id) => crud.excluir(id)))
  ipcMain.handle(`${recurso}:mudarAtivoLote`, wrap((_e, { ids, ativo }) => crud.mudarAtivoLote(ids, ativo)))
}
