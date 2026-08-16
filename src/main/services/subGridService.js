import { getPool, query } from '../db'

function assertIdent(nome) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(nome)) {
    throw new Error(`Identificador inválido: ${nome}`)
  }
  return nome
}
function tbl(nome) { return '"' + assertIdent(nome) + '"' }
function col(nome) { return '"' + assertIdent(nome) + '"' }

// Resolve a configuração (subGridTabela/subGridParentColuna/subGridCampos)
// de um campo sub_grid a partir de kr_tela_campos_001, dado a tela pai e o nome
// do campo.
export async function resolverConfigSubGrid(nomeTabelaPai, nomeCampoSubGrid) {
  const rows = await query(
    `SELECT c.opcoes FROM kr_tela_campos_001 c
     JOIN kr_telas_001 t ON t.id = c.tela_id
     WHERE t.nome_tabela = $1 AND c.nome_campo = $2 AND c.tipo = 'sub_grid' AND c.ativo = TRUE
     LIMIT 1`,
    [nomeTabelaPai, nomeCampoSubGrid]
  )
  if (!rows.length) throw new Error(`Campo sub_grid "${nomeCampoSubGrid}" não encontrado na tela.`)
  const cfg = rows[0].opcoes || {}
  if (!cfg.subGridTabela || !cfg.subGridParentColuna) {
    throw new Error(`Campo sub_grid "${nomeCampoSubGrid}" está com configuração incompleta.`)
  }
  return cfg
}

async function inserirLinhasSubGrid(client, subGridTabela, parentColuna, parentId, linhas) {
  for (const linha of linhas) {
    const dados = { ...linha, [parentColuna]: parentId }
    delete dados.id // id da linha nunca é reaproveitado — sempre gera nova linha
    const colunas = Object.keys(dados).map(col)
    const valores = Object.values(dados)
    const params = valores.map((_, i) => `$${i + 1}`)
    await client.query(
      `INSERT INTO ${tbl(subGridTabela)} (${colunas.join(',')}) VALUES (${params.join(',')})`,
      valores
    )
  }
}

// subGrids: { [nomeCampoSubGrid]: [{...linha1}, {...linha2}] }
export async function inserirRegistroComSubGrids(nomeTabelaPai, dadosPai, subGrids = {}) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const colunas = Object.keys(dadosPai).map(col)
    const valores = Object.values(dadosPai)
    const params = valores.map((_, i) => `$${i + 1}`)
    const { rows } = await client.query(
      `INSERT INTO ${tbl(nomeTabelaPai)} (${colunas.join(',')}) VALUES (${params.join(',')}) RETURNING *`,
      valores
    )
    const registroPai = rows[0]

    for (const [nomeCampoSubGrid, linhas] of Object.entries(subGrids)) {
      if (!linhas?.length) continue
      const cfg = await resolverConfigSubGrid(nomeTabelaPai, nomeCampoSubGrid)
      await inserirLinhasSubGrid(client, cfg.subGridTabela, cfg.subGridParentColuna, registroPai.id, linhas)
    }

    await client.query('COMMIT')
    return registroPai
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// Estratégia de diff das linhas filhas: apaga todas as linhas existentes do
// pai em cada subGridTabela, depois insere o conjunto completo recebido.
// Linhas filhas não têm identidade relevante fora do registro pai em v1.
export async function atualizarRegistroComSubGrids(nomeTabelaPai, id, dadosPai, subGrids = {}, hasTs = true) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const sets = Object.keys(dadosPai).map((k, i) => `${col(k)}=$${i + 1}`)
    const valoresPai = [...Object.values(dadosPai), id]
    const tsClause = hasTs !== false ? ',alterado_em=NOW()' : ''
    const { rows } = await client.query(
      `UPDATE ${tbl(nomeTabelaPai)} SET ${sets.join(',')}${tsClause} WHERE id=$${valoresPai.length} RETURNING *`,
      valoresPai
    )
    const registroPai = rows[0]

    for (const [nomeCampoSubGrid, linhas] of Object.entries(subGrids)) {
      const cfg = await resolverConfigSubGrid(nomeTabelaPai, nomeCampoSubGrid)
      await client.query(
        `DELETE FROM ${tbl(cfg.subGridTabela)} WHERE ${col(cfg.subGridParentColuna)}=$1`,
        [id]
      )
      if (linhas?.length) {
        await inserirLinhasSubGrid(client, cfg.subGridTabela, cfg.subGridParentColuna, id, linhas)
      }
    }

    await client.query('COMMIT')
    return registroPai
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function listarSubGrid(subGridTabela, parentColuna, parentId) {
  return query(
    `SELECT * FROM ${tbl(subGridTabela)} WHERE ${col(parentColuna)}=$1 AND ativo=TRUE ORDER BY id`,
    [parentId]
  )
}
