import { getPool } from '../db.js'
import { existsSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'
import { BrowserWindow, dialog } from 'electron'
import { gerarExcelViagem } from '../services/exportViagem.js'
import { pastaExportacaoAutomatica } from '../services/exportPaths.js'

export const STATUS_VALIDOS = ['rascunho', 'nao_enviado', 'enviado', 'reembolsado']

function normalizarItens(itens) {
  if (!Array.isArray(itens)) return []
  return itens.map(it => {
    const qtde = Number(it.qtde) || 0
    const valorUnitario = Number(it.valor_unitario) || 0
    return {
      data: it.data,
      descricao: it.descricao || '',
      fornecedor: it.fornecedor || '',
      qtde,
      valor_unitario: valorUnitario,
      valor: qtde * valorUnitario,
      arquivo_path: it.arquivo_path || null,
      arquivo_nome: it.arquivo_nome || null,
      arquivo_ext: it.arquivo_ext || null,
    }
  })
}

async function gravarItens(client, despesaId, itens) {
  const antigos = await client.query('SELECT arquivo_path FROM despesa_item_001 WHERE despesa_id=$1', [despesaId])
  const novosPath = new Set(itens.map(it => it.arquivo_path).filter(Boolean))
  const orfaos = antigos.rows.map(r => r.arquivo_path).filter(p => p && !novosPath.has(p))

  await client.query('DELETE FROM despesa_item_001 WHERE despesa_id=$1', [despesaId])
  for (const it of itens) {
    await client.query(`
      INSERT INTO despesa_item_001
        (despesa_id, data, descricao, fornecedor, qtde, valor_unitario, valor, arquivo_path, arquivo_nome, arquivo_ext)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `, [despesaId, it.data, it.descricao, it.fornecedor, it.qtde, it.valor_unitario, it.valor,
        it.arquivo_path, it.arquivo_nome, it.arquivo_ext])
  }
  return orfaos
}

function removerArquivos(paths) {
  for (const p of paths) {
    try { if (p && existsSync(p)) unlinkSync(p) } catch { /* melhor esforço */ }
  }
}

export function registerViagensHandlers({ ipcMain, wrap, query, queryOne }) {

  const SELECT_LISTA = `
    SELECT d.*, COALESCE(it.total_despesas, 0) AS total_despesas
    FROM despesa_001 d
    LEFT JOIN LATERAL (
      SELECT SUM(valor) AS total_despesas
      FROM despesa_item_001 WHERE despesa_id = d.id
    ) it ON true
  `

  ipcMain.handle('viagens:listar', wrap(async (_, filtros = {}) => {
    const { clienteId, consultorId, status, dataIni, dataFim, busca } = filtros
    const conds = []
    const params = []
    if (clienteId)   { params.push(clienteId);   conds.push(`d.cliente_id = $${params.length}`) }
    if (consultorId) { params.push(consultorId); conds.push(`d.consultor_id = $${params.length}`) }
    if (status)      { params.push(status);      conds.push(`d.status = $${params.length}`) }
    if (dataIni)     { params.push(dataIni);     conds.push(`d.data_fim >= $${params.length}`) }
    if (dataFim)     { params.push(dataFim);     conds.push(`d.data_inicio <= $${params.length}`) }
    if (busca) {
      params.push(`%${busca}%`)
      conds.push(`(d.consultor_nome ILIKE $${params.length} OR d.cliente_nome ILIKE $${params.length} OR d.local_partida ILIKE $${params.length} OR d.local_destino ILIKE $${params.length})`)
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
    return query(`${SELECT_LISTA} ${where} ORDER BY d.data_inicio DESC, d.id DESC`, params)
  }))

  ipcMain.handle('viagens:obter', wrap(async (_, id) => {
    const cabecalho = await queryOne('SELECT * FROM despesa_001 WHERE id=$1', [id])
    if (!cabecalho) throw new Error(`Despesa #${id} não encontrada.`)
    const itens = await query('SELECT * FROM despesa_item_001 WHERE despesa_id=$1 ORDER BY data, id', [id])
    const total = itens.reduce((soma, it) => soma + Number(it.valor), 0)
    return { ...cabecalho, itens, total }
  }))

  ipcMain.handle('viagens:criar', wrap(async (_, d) => {
    if (!d.consultor_id)   throw new Error('Consultor é obrigatório.')
    if (!d.data_inicio)    throw new Error('Data início é obrigatória.')
    if (!d.data_fim)       throw new Error('Data fim é obrigatória.')

    const itens = normalizarItens(d.itens)
    const client = await getPool().connect()
    try {
      await client.query('BEGIN')
      const codRow = await client.query(`SELECT nextval('despesa_001_codigo_seq') AS next`)
      const codigo = String(codRow.rows[0].next).padStart(4, '0')
      const ins = await client.query(`
        INSERT INTO despesa_001
          (codigo, consultor_id, consultor_nome, cliente_id, cliente_nome, data_inicio, data_fim,
           local_partida, local_destino, meio_transporte, status, observacoes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
      `, [codigo, d.consultor_id, d.consultor_nome || '', d.cliente_id || null, d.cliente_nome || '',
          d.data_inicio, d.data_fim, d.local_partida || '', d.local_destino || '',
          d.meio_transporte || '', 'rascunho', d.observacoes || ''])
      const parent = ins.rows[0]
      await gravarItens(client, parent.id, itens)
      await client.query('COMMIT')
      return parent
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }))

  ipcMain.handle('viagens:atualizar', wrap(async (_, d) => {
    if (!d.data_inicio) throw new Error('Data início é obrigatória.')
    if (!d.data_fim)    throw new Error('Data fim é obrigatória.')

    const itens = normalizarItens(d.itens)
    const client = await getPool().connect()
    try {
      await client.query('BEGIN')
      const upd = await client.query(`
        UPDATE despesa_001
        SET cliente_id=$1, cliente_nome=$2, data_inicio=$3, data_fim=$4,
            local_partida=$5, local_destino=$6, meio_transporte=$7, observacoes=$8,
            alterado_em=NOW()
        WHERE id=$9 RETURNING *
      `, [d.cliente_id || null, d.cliente_nome || '', d.data_inicio, d.data_fim,
          d.local_partida || '', d.local_destino || '', d.meio_transporte || '',
          d.observacoes || '', d.id])
      const row = upd.rows[0]
      if (!row) throw new Error(`Despesa #${d.id} não encontrada.`)
      const orfaos = await gravarItens(client, row.id, itens)
      await client.query('COMMIT')
      removerArquivos(orfaos)
      return row
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }))

  ipcMain.handle('viagens:excluir', wrap(async (_, id) => {
    const row = await queryOne('SELECT id FROM despesa_001 WHERE id=$1', [id])
    if (!row) throw new Error(`Despesa #${id} não encontrada.`)
    const itens = await query('SELECT arquivo_path FROM despesa_item_001 WHERE despesa_id=$1', [id])
    await query('DELETE FROM despesa_001 WHERE id=$1', [id])
    removerArquivos(itens.map(it => it.arquivo_path))
  }))

  ipcMain.handle('viagens:mudarStatus', wrap(async (_, { id, status }) => {
    if (!STATUS_VALIDOS.includes(status)) throw new Error(`Status inválido: ${status}`)
    const row = await queryOne(
      'UPDATE despesa_001 SET status=$1, alterado_em=NOW() WHERE id=$2 RETURNING *',
      [status, id]
    )
    if (!row) throw new Error(`Despesa #${id} não encontrada.`)
    return row
  }))

  ipcMain.handle('viagens:listarConsultores', wrap(async () => {
    const tabelaExiste = await queryOne(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='usuario_001'`
    )
    if (tabelaExiste) {
      const colLogin = await queryOne(
        `SELECT nome_campo FROM kr_tela_campos_001 tc
         JOIN kr_telas_001 t ON t.id=tc.tela_id
         WHERE t.nome_tabela='usuario_001' AND tc.tipo='login' AND tc.ativo=TRUE LIMIT 1`
      )
      if (colLogin) {
        return query(`SELECT id, nome FROM usuario_001 WHERE ativo=TRUE ORDER BY nome`)
      }
    }
    return query(`SELECT id, nome FROM kr_usuarios_001 WHERE ativo=TRUE ORDER BY nome`)
  }))

  ipcMain.handle('viagens:exportarExcel', async (e, id) => {
    try {
      const cabecalho = await queryOne('SELECT * FROM despesa_001 WHERE id=$1', [id])
      if (!cabecalho) return { ok: false, erro: `Despesa #${id} não encontrada.` }
      const itens = await query('SELECT * FROM despesa_item_001 WHERE despesa_id=$1 ORDER BY data, id', [id])

      const fmtDataArquivo = d => {
        const dt = new Date(d)
        if (Number.isNaN(dt.getTime())) return ''
        return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(dt).replace(/\//g, '-')
      }
      const nomeSugerido = `DESPESAS VIAGEM ${fmtDataArquivo(cabecalho.data_inicio)} ATE ${fmtDataArquivo(cabecalho.data_fim)} - ${(cabecalho.consultor_nome || 'CONSULTOR').toUpperCase()}.xlsx`
        .replace(/[\\/:*?"<>|]/g, '')

      const buffer = await gerarExcelViagem({ ...cabecalho, itens })

      const pastaAuto = pastaExportacaoAutomatica(cabecalho.cliente_nome, cabecalho.data_inicio)
      if (pastaAuto) {
        const filePath = join(pastaAuto, nomeSugerido)
        writeFileSync(filePath, buffer)
        return { ok: true, path: filePath }
      }

      const win = BrowserWindow.fromWebContents(e.sender)
      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: 'Exportar despesas de viagem',
        defaultPath: nomeSugerido,
        filters: [{ name: 'Excel', extensions: ['xlsx'] }],
      })
      if (canceled || !filePath) return { ok: false, cancelado: true }
      writeFileSync(filePath, buffer)
      return { ok: true, path: filePath }
    } catch (err) {
      return { ok: false, erro: err.message }
    }
  })
}
