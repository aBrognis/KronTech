import { query, queryOne, getPool } from '../db'

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizarNome(nome) {
  return nome.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').replace(/^[^a-z]+/, '')
}

function assertIdent(nome) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(nome)) {
    throw new Error(`Identificador inválido: ${nome}`)
  }
  return nome
}
function tbl(nome)  { return '"' + assertIdent(nome) + '"' }
function col(nome)  { return '"' + assertIdent(nome) + '"' }

const TIPOS_SISTEMA = ['favorito', 'timestamps']

async function inserirCampos(client, telaId, campos) {
  for (const [idx, c] of campos.entries()) {
    const nomeCampo = c.tipo === 'divisor'   ? `_div_${c.ordem || (idx + 1)}`
      : c.tipo === 'botao'                   ? `_btn_${c.ordem || (idx + 1)}`
      : c.tipo === 'favorito'                ? '_fav'
      : c.tipo === 'timestamps'              ? '_ts'
      : c.tipo === 'copiar'                  ? `_cpy_${c.ordem || (idx + 1)}`
      : c.tipo === 'lookup'                  ? normalizarNome(c.nomeCampo).replace(/_id$/, '') + '_id'
      : normalizarNome(c.nomeCampo)
    await client.query(
      `INSERT INTO kr_tela_campos
         (tela_id,nome_campo,label,tipo,tamanho,obrigatorio,sequencial,campo_busca,valor_padrao,ordem,largura,x_pos,y_pos,w_px,h_px,opcoes,copiavel,sem_negrito,font_size,input_negrito,input_font_size,label_cor,input_align,input_cor,input_bg,border_radius,border_width,border_color,opcoes_layout)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)`,
      [telaId, nomeCampo, c.label || c.tipo, c.tipo,
       c.tamanho||100, c.obrigatorio||false, c.sequencial||false,
       c.campoBusca||false, c.valorPadrao||null, c.ordem||(idx+1), Math.max(10, c.largura||50),
       c.x_pos||0, c.y_pos||0, c.w_px||280, c.h_px||60,
       c.opcoes ? JSON.stringify(c.opcoes) : null,
       c.copiavel||false, c.semNegrito||false, c.fontSize||null,
       c.inputNegrito||false, c.inputFontSize||null,
       c.labelCor||null, c.inputAlign||null, c.inputCor||null, c.inputBg||null,
       c.borderRadius??null, c.borderWidth??null, c.borderColor||null,
       c.opcoesLayout||null]
    )
  }
}

// ── Módulos ───────────────────────────────────────────────────────────────────
export async function listarModulos() {
  return query('SELECT id,nome,icone,ordem FROM kr_modulos ORDER BY ordem,nome')
}

export async function criarModulo({ nome, icone, ordem }) {
  if (!nome?.trim()) throw new Error('Nome do módulo é obrigatório.')
  return queryOne(
    `INSERT INTO kr_modulos (nome, icone, ordem) VALUES ($1,$2,$3) RETURNING *`,
    [nome.trim(), icone||'folder', ordem||99]
  )
}

export async function editarModulo(id, { nome, icone, ordem }) {
  if (!nome?.trim()) throw new Error('Nome do módulo é obrigatório.')
  return queryOne(
    `UPDATE kr_modulos SET nome=$1,icone=$2,ordem=$3 WHERE id=$4 RETURNING *`,
    [nome.trim(), icone||'folder', ordem||99, id]
  )
}

export async function excluirModulo(id) {
  const emUso = await queryOne('SELECT id FROM kr_telas WHERE modulo_id=$1 LIMIT 1', [id])
  if (emUso) throw new Error('Módulo está em uso por telas cadastradas. Remova as telas primeiro.')
  await query('DELETE FROM kr_modulos WHERE id=$1', [id])
}

// ── Telas ─────────────────────────────────────────────────────────────────────
export async function listarTelas(apenasAtivas = false) {
  return query(`
    SELECT t.id,t.nome_tela,t.nome_tabela,t.descricao,t.icone,
           t.modulo_id,m.nome AS modulo_nome,t.ordem_menu,t.ativo,
           COALESCE(t.sistema,FALSE) AS sistema,
           t.slug,t.criado_em,t.atualizado_em,
           COALESCE(t.canvas_w,780) AS canvas_w, COALESCE(t.canvas_h,480) AS canvas_h,
           COALESCE(t.col_favorito,TRUE)   AS col_favorito,
           COALESCE(t.col_timestamps,TRUE) AS col_timestamps,
           t.grupo_fixo
    FROM kr_telas t
    LEFT JOIN kr_modulos m ON m.id=t.modulo_id
    ${apenasAtivas ? 'WHERE t.ativo=TRUE' : ''}
    ORDER BY t.sistema DESC, m.ordem NULLS LAST, t.ordem_menu, t.nome_tela
  `)
}

export async function getTelaPorSlug(slug) {
  const tela = await queryOne(
    `SELECT t.id,t.nome_tela,t.nome_tabela,t.icone,t.slug,
            COALESCE(t.sistema,FALSE) AS sistema, t.ativo,
            COALESCE(t.col_favorito,TRUE)   AS col_favorito,
            COALESCE(t.col_timestamps,TRUE) AS col_timestamps
     FROM kr_telas t WHERE t.slug=$1`, [slug]
  )
  if (!tela) return null
  const campos = await query(
    `SELECT id,nome_campo,label,tipo,tamanho,obrigatorio,sequencial,campo_busca,
            valor_padrao,ordem,largura,ativo,x_pos,y_pos,w_px,h_px,opcoes,copiavel,sem_negrito,font_size,input_negrito,input_font_size,
            label_cor,input_align,input_cor,input_bg,border_radius,border_width,border_color,opcoes_layout
     FROM kr_tela_campos WHERE tela_id=$1 AND ativo=TRUE ORDER BY ordem`, [tela.id]
  )
  return { ...tela, campos }
}

export async function buscarTela(telaId) {
  const tela = await queryOne(
    `SELECT t.id,t.nome_tela,t.nome_tabela,t.descricao,t.icone,t.modulo_id,t.ordem_menu,t.ativo,
            COALESCE(t.canvas_w,780) AS canvas_w, COALESCE(t.canvas_h,480) AS canvas_h,
            COALESCE(t.col_favorito,TRUE)   AS col_favorito,
            COALESCE(t.col_timestamps,TRUE) AS col_timestamps
     FROM kr_telas t WHERE t.id=$1`, [telaId]
  )
  if (!tela) throw new Error(`Tela ${telaId} não encontrada.`)
  const campos = await query(
    `SELECT id,nome_campo,label,tipo,tamanho,obrigatorio,sequencial,campo_busca,valor_padrao,ordem,largura,ativo,
            x_pos,y_pos,w_px,h_px,opcoes,copiavel,sem_negrito,font_size,input_negrito,input_font_size,
            label_cor,input_align,input_cor,input_bg,border_radius,border_width,border_color,opcoes_layout
     FROM kr_tela_campos WHERE tela_id=$1 AND ativo=TRUE ORDER BY ordem`, [telaId]
  )
  return { ...tela, campos }
}

export async function criarTela(payload) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const nomeTabela = normalizarNome(payload.nomeTabela)
    const dup = await client.query('SELECT id FROM kr_telas WHERE nome_tabela=$1', [nomeTabela])
    if (dup.rows.length) throw new Error(`Já existe uma tela com a tabela "${nomeTabela}".`)

    const ordemMenu = payload.ordemMenu || 99
    if (ordemMenu < 99) {
      if (payload.moduloId) {
        await client.query(
          `UPDATE kr_telas SET ordem_menu = ordem_menu + 1
           WHERE modulo_id = $1 AND ordem_menu >= $2`,
          [payload.moduloId, ordemMenu]
        )
      } else {
        await client.query(
          `UPDATE kr_telas SET ordem_menu = ordem_menu + 1
           WHERE modulo_id IS NULL AND ordem_menu >= $1`,
          [ordemMenu]
        )
      }
    }

    const campos = payload.campos || []
    const temFavorito   = campos.some(c => c.tipo === 'favorito')
    const temTimestamps = campos.some(c => c.tipo === 'timestamps')
    const colFav = temFavorito   ? true : (payload.colFavorito   !== false)
    const colTs  = temTimestamps ? true : (payload.colTimestamps !== false)

    const { rows } = await client.query(
      `INSERT INTO kr_telas (nome_tela,nome_tabela,descricao,icone,modulo_id,grupo_fixo,ordem_menu,canvas_w,canvas_h,col_favorito,col_timestamps)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [payload.nomeTela, nomeTabela, payload.descricao||null,
       payload.icone||'layout', payload.moduloId||null, payload.grupoFixo||null, ordemMenu,
       payload.canvasW||780, payload.canvasH||480,
       colFav, colTs]
    )
    const telaId = rows[0].id
    await inserirCampos(client, telaId, payload.campos||[])
    const res = await client.query('SELECT fn_criar_tabela_usuario($1) AS r', [telaId])
    await client.query('COMMIT')
    return { telaId, nomeTabela, resultadoSQL: res.rows[0].r }
  } catch(err) { await client.query('ROLLBACK'); throw err }
  finally { client.release() }
}

export async function editarTela(telaId, payload) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const editCampos = payload.campos || []
    const editTemFav = editCampos.some(c => c.tipo === 'favorito')
    const editTemTs  = editCampos.some(c => c.tipo === 'timestamps')
    const editColFav = editTemFav ? true : (payload.colFavorito !== false)
    const editColTs  = editTemTs  ? true : (payload.colTimestamps !== false)

    await client.query(
      `UPDATE kr_telas SET nome_tela=$1,descricao=$2,icone=$3,modulo_id=$4,grupo_fixo=$5,ordem_menu=$6,ativo=$7,canvas_w=$8,canvas_h=$9,col_favorito=$10,col_timestamps=$11
       WHERE id=$12`,
      [payload.nomeTela, payload.descricao||null, payload.icone||'layout',
       payload.moduloId||null, payload.grupoFixo||null, payload.ordemMenu||99,
       payload.ativo !== undefined ? payload.ativo : true,
       payload.canvasW||780, payload.canvasH||480,
       editColFav, editColTs,
       telaId]
    )
    const idsRecebidos = (payload.campos||[]).filter(c=>c.id).map(c=>c.id)
    if (idsRecebidos.length) {
      await client.query(
        `UPDATE kr_tela_campos SET ativo=FALSE WHERE tela_id=$1 AND id!=ALL($2::int[])`,
        [telaId, idsRecebidos]
      )
    } else {
      await client.query('UPDATE kr_tela_campos SET ativo=FALSE WHERE tela_id=$1', [telaId])
    }
    for (const [idx, c] of (payload.campos||[]).entries()) {
      c.ordem = idx + 1
      if (c.id) {
        await client.query(
          `UPDATE kr_tela_campos SET label=$1,tipo=$2,tamanho=$3,obrigatorio=$4,
           campo_busca=$5,valor_padrao=$6,ordem=$7,largura=$8,
           x_pos=$9,y_pos=$10,w_px=$11,h_px=$12,opcoes=$13,copiavel=$14,
           sem_negrito=$15,font_size=$16,input_negrito=$17,input_font_size=$18,
           label_cor=$19,input_align=$20,input_cor=$21,input_bg=$22,
           border_radius=$23,border_width=$24,border_color=$25,opcoes_layout=$26,
           ativo=TRUE WHERE id=$27 AND tela_id=$28`,
          [c.label,c.tipo,c.tamanho||100,c.obrigatorio||false,
           c.campoBusca||false,c.valorPadrao||null,c.ordem,Math.max(10, c.largura||50),
           c.x_pos||0,c.y_pos||0,c.w_px||280,c.h_px||60,
           c.opcoes ? JSON.stringify(c.opcoes) : null,
           c.copiavel||false, c.semNegrito||false, c.fontSize||null,
           c.inputNegrito||false, c.inputFontSize||null,
           c.labelCor||null, c.inputAlign||null, c.inputCor||null, c.inputBg||null,
           c.borderRadius??null, c.borderWidth??null, c.borderColor||null,
           c.opcoesLayout||null,
           c.id,telaId]
        )
      } else {
        await inserirCampos(client, telaId, [c])
      }
    }
    const res = await client.query('SELECT fn_criar_tabela_usuario($1) AS r', [telaId])
    await client.query('COMMIT')
    return { resultadoSQL: res.rows[0].r }
  } catch(err) { await client.query('ROLLBACK'); throw err }
  finally { client.release() }
}

export async function excluirTela(telaId) {
  const res = await queryOne('SELECT fn_excluir_tabela_usuario($1) AS r', [telaId])
  return { resultadoSQL: res.r }
}

export async function inativarTela(telaId) {
  await query('UPDATE kr_telas SET ativo=FALSE WHERE id=$1', [telaId])
}

export async function reativarTela(telaId) {
  await query('UPDATE kr_telas SET ativo=TRUE WHERE id=$1', [telaId])
}

// ── CRUD genérico das telas geradas ──────────────────────────────────────────
export async function listarRegistros(nomeTabela, opcoes = {}) {
  const tela = await queryOne('SELECT id FROM kr_telas WHERE nome_tabela=$1 AND ativo=TRUE', [nomeTabela])
  if (!tela) throw new Error(`Tela "${nomeTabela}" não encontrada.`)

  const camposBusca = await query(
    'SELECT nome_campo FROM kr_tela_campos WHERE tela_id=$1 AND campo_busca=TRUE AND ativo=TRUE',
    [tela.id]
  )

  const pagina    = Math.max(1, opcoes.pagina    || 1)
  const porPagina = Math.min(opcoes.semLimite ? 999999 : 200, opcoes.porPagina || 50)
  const offset    = (pagina - 1) * porPagina
  const params    = []
  let where = 'WHERE ativo=TRUE'

  if (opcoes.busca && camposBusca.length) {
    const conds = camposBusca.map((c, i) => {
      params.push(`%${opcoes.busca}%`)
      return `CAST(${col(c.nome_campo)} AS TEXT) ILIKE $${i+1}`
    })
    where += ` AND (${conds.join(' OR ')})`
  }

  const colOrdem = opcoes.ordenar ? col(opcoes.ordenar) : 'id'
  const dir      = opcoes.direcao === 'DESC' ? 'DESC' : 'ASC'
  params.push(porPagina, offset)
  const pL = params.length - 1
  const pO = params.length

  const [registros, total] = await Promise.all([
    query(`SELECT * FROM ${tbl(nomeTabela)} ${where} ORDER BY ${colOrdem} ${dir} LIMIT $${pL} OFFSET $${pO}`, params),
    queryOne(`SELECT COUNT(*) AS n FROM ${tbl(nomeTabela)} ${where}`, params.slice(0, params.length - 2))
  ])
  return { registros, total: parseInt(total.n), pagina, porPagina, totalPaginas: Math.ceil(parseInt(total.n)/porPagina) }
}

export async function getAllRegistros(nomeTabela) {
  const registros = await query(`SELECT * FROM ${tbl(nomeTabela)} WHERE ativo=TRUE ORDER BY id ASC`)
  return { registros, total: registros.length }
}

export async function valoresDistintos(nomeTabela, nomeColuna) {
  const c = col(nomeColuna)
  const rows = await query(
    `SELECT DISTINCT ${c} AS v FROM ${tbl(nomeTabela)} WHERE ${c} IS NOT NULL AND ${c} <> '' ORDER BY ${c}`
  )
  return rows.map(r => r.v)
}

// ── Filtro por coluna (aba Acesso) ─────────────────────────────────────────────
// Mapeia cada tipo de campo do FormBuilder para um grupo de operador de filtro.
// Ponto único de extensão: adicionar um tipo novo é uma linha aqui.
function opGroupForTipo(tipo) {
  const MAP = {
    texto:'texto', texto_longo:'texto', email:'texto', telefone:'texto', url:'texto',
    cpf:'texto', cnpj:'texto', cep:'texto', documento:'texto', login:'texto',
    codigo_auto:'texto', cor:'texto',
    numero:'numero', moeda:'numero', percentual:'numero', calculo:'numero',
    avaliacao:'numero', progresso:'numero',
    data:'data', data_hora:'data', hora:'data',
    booleano:'booleano',
    select:'exato', radio:'exato', pasta:'exato', lookup:'exato',
    flags:'flags', tags:'tags',
    arquivo:'has_file', imagem:'has_file',
  }
  return MAP[tipo] || null
}

function buildFiltroSQL(f, tipoCampo, params) {
  const c = col(f.campo)
  const push = (v) => { params.push(v); return params.length }

  switch (opGroupForTipo(tipoCampo)) {
    case 'texto': {
      if (!f.valor) return null
      const n = push(`%${f.valor}%`)
      return `CAST(${c} AS TEXT) ILIKE $${n}`
    }
    case 'numero': {
      const parts = []
      if (f.valor  != null && f.valor  !== '') parts.push(`${c} >= $${push(f.valor)}`)
      if (f.valor2 != null && f.valor2 !== '') parts.push(`${c} <= $${push(f.valor2)}`)
      return parts.length ? parts.join(' AND ') : null
    }
    case 'data': {
      const parts = []
      if (f.valor  != null && f.valor  !== '') parts.push(`${c} >= $${push(f.valor)}`)
      if (f.valor2 != null && f.valor2 !== '') parts.push(`${c} <= $${push(f.valor2)}`)
      return parts.length ? parts.join(' AND ') : null
    }
    case 'booleano': {
      if (f.valor !== true && f.valor !== false) return null
      return `${c} = $${push(f.valor)}`
    }
    case 'exato': {
      if (!f.valor || f.valor === '__todos__') return null
      return `${c} = $${push(f.valor)}`
    }
    case 'flags': {                      // código de flag é sempre 1 caractere (ver OpcoesList.jsx)
      if (!f.valor) return null
      const n = push(`%${f.valor}%`)
      return `${c} ILIKE $${n}`
    }
    case 'tags': {                       // contains simples — pode dar falso positivo por substring
      if (!f.valor) return null
      const n = push(`%${f.valor}%`)
      return `${c} ILIKE $${n}`
    }
    case 'has_file':
      if (f.valor === 'com') return `${c} IS NOT NULL AND ${c} <> ''`
      if (f.valor === 'sem') return `(${c} IS NULL OR ${c} = '')`
      return null
    default:
      return null   // senha, divisor, botao, copiar — não filtráveis
  }
}

// filtros: [{ campo, op, valor, valor2 }] — tipo do campo é resolvido no servidor
// via kr_tela_campos, nunca confiado no valor vindo do renderer.
export async function listarRegistrosFiltrado(nomeTabela, {
  filtros = [], busca = '', pagina = 1, porPagina = 50, ordenar = null, direcao = 'ASC',
} = {}) {
  const tela = await queryOne('SELECT id FROM kr_telas WHERE nome_tabela=$1 AND ativo=TRUE', [nomeTabela])
  if (!tela) throw new Error(`Tela "${nomeTabela}" não encontrada.`)

  const camposTela = await query(
    'SELECT nome_campo, tipo, campo_busca FROM kr_tela_campos WHERE tela_id=$1 AND ativo=TRUE',
    [tela.id]
  )
  const tipoPorCampo = Object.fromEntries(camposTela.map(c => [c.nome_campo, c.tipo]))

  const params = []
  const conds = ['ativo=TRUE']

  for (const f of filtros) {
    if (!tipoPorCampo[f.campo]) continue
    const frag = buildFiltroSQL(f, tipoPorCampo[f.campo], params)
    if (frag) conds.push(frag)
  }

  if (busca && busca.trim()) {
    const camposBusca = camposTela.filter(c => c.campo_busca).map(c => c.nome_campo)
    if (camposBusca.length) {
      const orConds = camposBusca.map(nc => {
        params.push(`%${busca.trim()}%`)
        return `CAST(${col(nc)} AS TEXT) ILIKE $${params.length}`
      })
      conds.push(`(${orConds.join(' OR ')})`)
    }
  }

  const where = 'WHERE ' + conds.join(' AND ')
  const pag = Math.max(1, pagina)
  const porPag = Math.min(200, Math.max(1, porPagina))
  const offset = (pag - 1) * porPag
  const colOrdem = ordenar && tipoPorCampo[ordenar] ? col(ordenar) : 'id'
  const dir = direcao === 'DESC' ? 'DESC' : 'ASC'

  const countParams = [...params]
  params.push(porPag, offset)
  const pL = params.length - 1, pO = params.length

  const [registros, total] = await Promise.all([
    query(`SELECT * FROM ${tbl(nomeTabela)} ${where} ORDER BY ${colOrdem} ${dir} LIMIT $${pL} OFFSET $${pO}`, params),
    queryOne(`SELECT COUNT(*) AS n FROM ${tbl(nomeTabela)} ${where}`, countParams)
  ])
  return { registros, total: parseInt(total.n), pagina: pag, porPagina: porPag, totalPaginas: Math.ceil(parseInt(total.n) / porPag) || 1 }
}

const LIMITE_PESQUISA_PADRAO = 1000

// Busca do modal "Pesquisa Padrão" (botão Consultar): um campo escolhido
// pelo usuário, modo iniciando/contendo/igual, cortada em LIMITE_PESQUISA_PADRAO
// via SQL — evita trazer tabelas grandes inteiras para o navegador (ex: arq_001
// com ~15 mil linhas).
export async function pesquisarRegistros(nomeTabela, { campo, modo = 'contendo', busca = '', ordenar, direcao = 'ASC' } = {}) {
  const tela = await queryOne('SELECT id FROM kr_telas WHERE nome_tabela=$1 AND ativo=TRUE', [nomeTabela])
  if (!tela) throw new Error(`Tela "${nomeTabela}" não encontrada.`)

  const camposTela = await query(
    'SELECT nome_campo FROM kr_tela_campos WHERE tela_id=$1 AND ativo=TRUE',
    [tela.id]
  )
  const nomesValidos = new Set(camposTela.map(c => c.nome_campo).concat(['id']))

  const params = []
  const conds = ['ativo=TRUE']
  if (busca.trim() && nomesValidos.has(campo)) {
    const c = col(campo)
    if (modo === 'iniciando')      { params.push(`${busca.trim()}%`);  conds.push(`CAST(${c} AS TEXT) ILIKE $${params.length}`) }
    else if (modo === 'igual')     { params.push(busca.trim());        conds.push(`CAST(${c} AS TEXT) = $${params.length}`) }
    else /* contendo */            { params.push(`%${busca.trim()}%`); conds.push(`CAST(${c} AS TEXT) ILIKE $${params.length}`) }
  }
  const where = 'WHERE ' + conds.join(' AND ')
  const colOrdem = ordenar && nomesValidos.has(ordenar) ? col(ordenar) : 'id'
  const dir = direcao === 'desc' || direcao === 'DESC' ? 'DESC' : 'ASC'
  params.push(LIMITE_PESQUISA_PADRAO)

  const [registros, total] = await Promise.all([
    query(`SELECT * FROM ${tbl(nomeTabela)} ${where} ORDER BY ${colOrdem} ${dir} LIMIT $${params.length}`, params),
    queryOne(`SELECT COUNT(*) AS n FROM ${tbl(nomeTabela)} ${where}`, params.slice(0, params.length - 1)),
  ])
  return { registros, total: parseInt(total.n), limitado: parseInt(total.n) > LIMITE_PESQUISA_PADRAO, limite: LIMITE_PESQUISA_PADRAO }
}

export async function inserirRegistro(nomeTabela, dados) {
  const colunas = Object.keys(dados).map(col)
  const valores = Object.values(dados)
  const params  = valores.map((_, i) => `$${i+1}`)
  return queryOne(
    `INSERT INTO ${tbl(nomeTabela)} (${colunas.join(',')}) VALUES (${params.join(',')}) RETURNING *`,
    valores
  )
}

export async function atualizarRegistro(nomeTabela, id, dados, hasTs = true) {
  const sets   = Object.keys(dados).map((k, i) => `${col(k)}=$${i+1}`)
  const valores = [...Object.values(dados), id]
  const tsClause = hasTs !== false ? ',alterado_em=NOW()' : ''
  return queryOne(
    `UPDATE ${tbl(nomeTabela)} SET ${sets.join(',')}${tsClause} WHERE id=$${valores.length} RETURNING *`,
    valores
  )
}

export async function reordenarTelas(items) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const { id, ordem_menu } of items) {
      await client.query('UPDATE kr_telas SET ordem_menu=$1 WHERE id=$2', [ordem_menu, id])
    }
    await client.query('COMMIT')
  } catch(err) { await client.query('ROLLBACK'); throw err }
  finally { client.release() }
}

export async function inativarRegistro(nomeTabela, id, hasTs = true) {
  const tsClause = hasTs !== false ? ',alterado_em=NOW()' : ''
  await query(`UPDATE ${tbl(nomeTabela)} SET ativo=FALSE${tsClause} WHERE id=$1`, [id])
}

export async function excluirRegistro(nomeTabela, id) {
  await query(`DELETE FROM ${tbl(nomeTabela)} WHERE id=$1`, [id])
}

export async function toggleFavorito(nomeTabela, id, hasTs = true) {
  const tsClause = hasTs !== false ? ', alterado_em = NOW()' : ''
  return queryOne(
    `UPDATE ${tbl(nomeTabela)} SET favorito = NOT favorito${tsClause} WHERE id=$1 RETURNING *`,
    [id]
  )
}

export async function listarOpcoesLookup(nomeTabela, campoExibir, campoCodigo, filtro) {
  if (!nomeTabela || !campoExibir) return []
  try {
    const codSelect = campoCodigo ? `, ${col(campoCodigo)} AS codigo` : ''
    const params = []
    let whereFiltro = ''
    if (filtro?.campo && filtro?.valor) {
      const c = col(filtro.campo)
      if (filtro.op === 'eq') { params.push(filtro.valor); whereFiltro = ` AND ${c} = $${params.length}` }
      else { params.push(`%${filtro.valor}%`); whereFiltro = ` AND ${c} ILIKE $${params.length}` }
    }
    const rows = await query(
      `SELECT id, ${col(campoExibir)} AS exibir${codSelect} FROM ${tbl(nomeTabela)} WHERE ativo=TRUE${whereFiltro} ORDER BY ${col(campoExibir)}`,
      params
    )
    return rows.map(r => ({
      id: r.id,
      label: campoCodigo && r.codigo
        ? `${r.codigo} - ${r.exibir}`
        : String(r.exibir ?? ''),
    }))
  } catch { return [] }
}

export async function listarColunasTabela(nomeTabela) {
  if (!nomeTabela) return []
  try {
    const rows = await query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1
         AND column_name NOT IN ('id','ativo','criado_em','alterado_em','favorito')
       ORDER BY ordinal_position`,
      [nomeTabela]
    )
    return rows.map(r => r.column_name)
  } catch { return [] }
}

export async function proximoCodigo(nomeTabela, nomeCampo, valorPadrao, seqChars) {
  const padrao = String(valorPadrao || '001').trim()
  const padLen = seqChars ? Math.max(1, Number(seqChars)) : padrao.length

  const res = await queryOne(
    `SELECT MAX(${col(nomeCampo)}) AS max_val FROM ${tbl(nomeTabela)}`,
    []
  )

  const maxVal = res?.max_val
  if (!maxVal) return String(1).padStart(padLen, '0')

  // Extrai apenas a parte numérica do valor máximo (suporte a formatos como 'OS-005', '005', '5')
  const numStr = String(maxVal).replace(/\D/g, '')
  const num = parseInt(numStr || '0', 10)
  return String(num + 1).padStart(padLen, '0')
}
