import { getPool } from '../db'
import { resolverConfigSubGrid, atualizarRegistroComSubGrids } from './subGridService'

function assertIdent(nome) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(nome)) {
    throw new Error(`Identificador inválido: ${nome}`)
  }
  return nome
}
function tbl(nome) { return '"' + assertIdent(nome) + '"' }
function col(nome) { return '"' + assertIdent(nome) + '"' }

// Máquina de estados de uma parcela. 'estornar' é a única forma de sair de
// Paga/Parcial de volta para Aberta — nunca uma edição silenciosa de status.
const TRANSICOES_PERMITIDAS = {
  Aberta:    ['Paga', 'Parcial', 'Vencida', 'Cancelada'],
  Parcial:   ['Paga', 'Cancelada'],
  Paga:      [],
  Vencida:   ['Paga', 'Parcial', 'Cancelada'],
  Cancelada: [],
}

function statusPelaBaixa(valorParcela, valorPago, dtVencimento) {
  const pago = Number(valorPago) || 0
  const parcela = Number(valorParcela) || 0
  if (pago >= parcela && parcela > 0) return 'Paga'
  if (pago > 0 && pago < parcela) return 'Parcial'
  if (dtVencimento && new Date(dtVencimento) < new Date(new Date().toDateString())) return 'Vencida'
  return 'Aberta'
}

function validarTransicao(statusAnterior, statusNovo, estornar) {
  if (!statusAnterior || statusAnterior === statusNovo) return
  if (estornar && (statusAnterior === 'Paga' || statusAnterior === 'Parcial') && statusNovo === 'Aberta') return
  const permitidas = TRANSICOES_PERMITIDAS[statusAnterior] || []
  if (!permitidas.includes(statusNovo)) {
    throw new Error(`Transição de status inválida: "${statusAnterior}" → "${statusNovo}". Use a opção de estorno se pretende reabrir esta parcela.`)
  }
}

// Recebe as linhas de parcela vindas do formulário, calcula o status
// derivado de cada uma (regra: valor_pago vs valor_parcela) e valida a
// transição contra o status anteriormente salvo no banco (quando existir).
async function calcularEValidarParcelas(client, subGridTabela, parentColuna, tituloId, linhasNovas) {
  const { rows: linhasAtuais } = await client.query(
    `SELECT * FROM ${tbl(subGridTabela)} WHERE ${col(parentColuna)}=$1 AND ativo=TRUE ORDER BY id`,
    [tituloId]
  )
  // Casamento por posição (índice), já que o sub_grid usa apagar-e-reinserir
  // e não preserva id de linha entre saves.
  return linhasNovas.map((linha, i) => {
    const statusCalculado = statusPelaBaixa(linha.valor_parcela, linha.valor_pago, linha.dt_vencimento)
    const statusAnterior = linhasAtuais[i]?.status
    validarTransicao(statusAnterior, statusCalculado, !!linha.estornar)
    const { estornar, ...linhaLimpa } = linha
    return { ...linhaLimpa, status: statusCalculado }
  })
}

function calcularStatusAgregado(parcelas) {
  if (!parcelas.length) return 'Aberto'
  const total = parcelas.length
  const pagas = parcelas.filter(p => p.status === 'Paga').length
  const pagasOuParciais = parcelas.filter(p => p.status === 'Paga' || p.status === 'Parcial').length
  const vencidas = parcelas.filter(p => p.status === 'Vencida').length
  const canceladas = parcelas.filter(p => p.status === 'Cancelada').length
  if (pagas === total) return 'Pago'
  if (pagasOuParciais > 0) return 'Parcialmente Pago'
  if (vencidas > 0) return 'Vencido'
  if (canceladas === total) return 'Cancelado'
  return 'Aberto'
}

// Wrapper específico do domínio financeiro: calcula/valida o status de cada
// parcela, grava título+parcelas numa única transação (via subGridService) e
// recalcula o status agregado do título — tudo em SQL, nunca via calculo do
// cliente, já que agregação entre linhas de sub_grid não é algo que o
// avaliador de fórmula suporta.
export async function atualizarParcelasEStatusTitulo(nomeTabelaPai, tituloId, dadosPai, nomeCampoSubGrid, linhasParcelas, hasTs = true) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const cfg = await resolverConfigSubGrid(nomeTabelaPai, nomeCampoSubGrid)
    const parcelasValidadas = await calcularEValidarParcelas(client, cfg.subGridTabela, cfg.subGridParentColuna, tituloId, linhasParcelas)
    const statusAgregado = calcularStatusAgregado(parcelasValidadas)

    // Apaga e reinsere as parcelas (mesma estratégia do subGridService)
    await client.query(`DELETE FROM ${tbl(cfg.subGridTabela)} WHERE ${col(cfg.subGridParentColuna)}=$1`, [tituloId])
    for (const linha of parcelasValidadas) {
      const dados = { ...linha, [cfg.subGridParentColuna]: tituloId }
      delete dados.id
      const colunas = Object.keys(dados).map(col)
      const valores = Object.values(dados)
      const params = valores.map((_, i) => `$${i + 1}`)
      await client.query(`INSERT INTO ${tbl(cfg.subGridTabela)} (${colunas.join(',')}) VALUES (${params.join(',')})`, valores)
    }

    const dadosComStatus = { ...dadosPai, status: statusAgregado }
    const sets = Object.keys(dadosComStatus).map((k, i) => `${col(k)}=$${i + 1}`)
    const valoresPai = [...Object.values(dadosComStatus), tituloId]
    const tsClause = hasTs !== false ? ',alterado_em=NOW()' : ''
    const { rows } = await client.query(
      `UPDATE ${tbl(nomeTabelaPai)} SET ${sets.join(',')}${tsClause} WHERE id=$${valoresPai.length} RETURNING *`,
      valoresPai
    )

    await client.query('COMMIT')
    return rows[0]
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// Mesma lógica, mas para o INSERT inicial de um título novo (parcelas ainda
// não existem no banco, então não há transição a validar — só o cálculo de
// status por baixa e o agregado).
export async function inserirTituloEParcelas(nomeTabelaPai, dadosPai, nomeCampoSubGrid, linhasParcelas) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const cfg = await resolverConfigSubGrid(nomeTabelaPai, nomeCampoSubGrid)
    const parcelasComStatus = linhasParcelas.map(linha => {
      const { estornar, ...linhaLimpa } = linha
      return { ...linhaLimpa, status: statusPelaBaixa(linha.valor_parcela, linha.valor_pago, linha.dt_vencimento) }
    })
    const statusAgregado = calcularStatusAgregado(parcelasComStatus)

    const dadosComStatus = { ...dadosPai, status: statusAgregado }
    const colunasPai = Object.keys(dadosComStatus).map(col)
    const valoresPai = Object.values(dadosComStatus)
    const paramsPai = valoresPai.map((_, i) => `$${i + 1}`)
    const { rows } = await client.query(
      `INSERT INTO ${tbl(nomeTabelaPai)} (${colunasPai.join(',')}) VALUES (${paramsPai.join(',')}) RETURNING *`,
      valoresPai
    )
    const registroPai = rows[0]

    for (const linha of parcelasComStatus) {
      const dados = { ...linha, [cfg.subGridParentColuna]: registroPai.id }
      delete dados.id
      const colunas = Object.keys(dados).map(col)
      const valores = Object.values(dados)
      const params = valores.map((_, i) => `$${i + 1}`)
      await client.query(`INSERT INTO ${tbl(cfg.subGridTabela)} (${colunas.join(',')}) VALUES (${params.join(',')})`, valores)
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
