import { ImapFlow } from 'imapflow'
import { existsSync, rmSync } from 'fs'
import { join } from 'path'
import { query, queryOne } from '../db'
import { resolverBaseAnexos } from '../config'
import { authImap } from './emailAuth'

export async function listarPastas(contaId) {
  return query('SELECT * FROM email_pasta_001 WHERE conta_id = $1 ORDER BY ordem, nome_exibicao', [contaId])
}

// Resolve a pasta de destino de uma conta a partir de uma lista de
// special_use preferidos, na ordem. Ex: arquivar = ['\\Archive', '\\All'] —
// Outlook/IMAP tem \Archive; o Gmail nao, entao cai no \All ("Todos os
// e-mails"), que e como o Gmail arquiva de fato. 'INBOX' (string literal)
// resolve a Caixa de Entrada (special_use NULL).
async function resolverPastaDestino(contaId, preferencias) {
  if (preferencias === 'INBOX') {
    return queryOne(
      `SELECT * FROM email_pasta_001
       WHERE conta_id=$1 AND (special_use IS NULL OR caminho_imap='INBOX')
       ORDER BY (caminho_imap='INBOX') DESC LIMIT 1`, [contaId])
  }
  const lista = Array.isArray(preferencias) ? preferencias : [preferencias]
  for (const su of lista) {
    const p = await queryOne('SELECT * FROM email_pasta_001 WHERE conta_id=$1 AND special_use=$2', [contaId, su])
    if (p) return p
  }
  return null
}

// Agrupa ids por conta_id e por pasta de origem, move o lote inteiro de
// cada pasta numa única chamada messageMove (sequence-set de UIDs).
// alvo: 'INBOX' | um special_use | array de special_use por ordem de
// preferencia (ver resolverPastaDestino).
async function moverLote(ids, alvo) {
  const mensagens = await query(
    `SELECT m.id, m.conta_id, m.uid_imap, m.pasta_imap, m.pasta_id
     FROM email_mensagem_001 m WHERE m.id = ANY($1::int[]) AND m.origem = 'recebido'`,
    [ids]
  )
  const idsIgnorados = ids.filter(id => !mensagens.some(m => m.id === id))

  const porConta = new Map()
  for (const m of mensagens) {
    if (!porConta.has(m.conta_id)) porConta.set(m.conta_id, [])
    porConta.get(m.conta_id).push(m)
  }

  let sucesso = 0
  const falhas = idsIgnorados.map(id => `Mensagem ${id}: e-mail ainda não sincronizado com a pasta do servidor.`)

  for (const [contaId, msgs] of porConta) {
    let client
    try {
      const conta = await queryOne('SELECT * FROM email_conta_001 WHERE id=$1', [contaId])
      const pastaAlvo = await resolverPastaDestino(contaId, alvo)
      if (!pastaAlvo) {
        const nomeAlvo = alvo === 'INBOX' ? 'Caixa de Entrada' : (Array.isArray(alvo) ? alvo.join('/') : alvo)
        falhas.push(`Conta ${conta.nome}: sem pasta "${nomeAlvo}" no servidor. Sincronize a conta.`)
        continue
      }

      client = new ImapFlow({
        host: conta.imap_host, port: conta.imap_porta, secure: conta.imap_seguranca === 'tls',
        auth: await authImap(conta),
        logger: false,
      })
      await client.connect()
      console.log(`[emailPasta] mover conta ${contaId} -> ${pastaAlvo.caminho_imap} (${msgs.length} msgs)`)

      const porPastaOrigem = new Map()
      for (const m of msgs) {
        if (!porPastaOrigem.has(m.pasta_imap)) porPastaOrigem.set(m.pasta_imap, [])
        porPastaOrigem.get(m.pasta_imap).push(m)
      }

      for (const [pastaOrigem, msgsDaPasta] of porPastaOrigem) {
        if (pastaOrigem === pastaAlvo.caminho_imap) {
          sucesso += msgsDaPasta.length
          continue
        }
        const idsMovidos = msgsDaPasta.map(m => m.id)
        const uids = msgsDaPasta.map(m => m.uid_imap).join(',')
        const lock = await client.getMailboxLock(pastaOrigem)
        try {
          await client.messageMove(uids, pastaAlvo.caminho_imap, { uid: true })
          console.log(`[emailPasta]   ${pastaOrigem} [${uids}] -> ${pastaAlvo.caminho_imap}: ok`)
        } finally {
          lock.release()
        }
        // Atualiza o banco fora do lock. Se o servidor nao suporta MOVE, o
        // imapflow ja faz COPY+STORE\Deleted+EXPUNGE por baixo; se ainda
        // assim falhar, o catch externo reporta e o banco nao e tocado.
        await query(
          `UPDATE email_mensagem_001 SET pasta_imap=$1, pasta_id=$2 WHERE id = ANY($3::int[])`,
          [pastaAlvo.caminho_imap, pastaAlvo.id, idsMovidos]
        )
        sucesso += idsMovidos.length
      }
    } catch (err) {
      console.error(`[emailPasta] falha mover conta ${contaId}:`, err)
      falhas.push(`Conta ${contaId}: ${err.message}`)
    } finally {
      if (client) await client.logout().catch(() => {})
    }
  }

  return { sucesso, total: ids.length, falhas }
}

// Arquivar: Outlook/IMAP generico movem pra \Archive. O Gmail nao tem essa
// pasta — "arquivar" no Gmail e tirar de \Inbox, a msg fica em \All ("Todos
// os e-mails"). Entao a preferencia e \Archive, com fallback \All.
export async function arquivarLote(ids) {
  return moverLote(ids, ['\\Archive', '\\All'])
}

// Devolve mensagens para a Caixa de Entrada (ex: ao remover a ultima
// etiqueta de um e-mail que tinha sido arquivado ao ser etiquetado).
export async function moverParaInboxLote(ids) {
  return moverLote(ids, 'INBOX')
}

export async function excluirLote(ids) {
  return moverLote(ids, '\\Trash')
}

// Apaga DEFINITIVAMENTE: EXPUNGE no servidor IMAP + remove do banco + apaga
// os arquivos de anexo do disco. Sem volta. Usado quando o usuario exclui
// dentro da Lixeira, ou faz Shift+Excluir em qualquer pasta.
export async function excluirPermanenteLote(ids) {
  const mensagens = await query(
    `SELECT m.id, m.conta_id, m.uid_imap, m.pasta_imap
     FROM email_mensagem_001 m WHERE m.id = ANY($1::int[]) AND m.origem = 'recebido'`,
    [ids]
  )
  const semServidor = ids.filter(id => !mensagens.some(m => m.id === id))
  const porConta = new Map()
  for (const m of mensagens) {
    if (!porConta.has(m.conta_id)) porConta.set(m.conta_id, [])
    porConta.get(m.conta_id).push(m)
  }

  const base = resolverBaseAnexos('arquivosEmail')
  let sucesso = 0
  const falhas = []

  for (const [contaId, msgs] of porConta) {
    let client
    const idsDaConta = msgs.map(m => m.id)
    try {
      const conta = await queryOne('SELECT * FROM email_conta_001 WHERE id=$1', [contaId])
      client = new ImapFlow({
        host: conta.imap_host, port: conta.imap_porta, secure: conta.imap_seguranca === 'tls',
        auth: await authImap(conta), logger: false,
      })
      await client.connect()

      const porPasta = new Map()
      for (const m of msgs) {
        if (!porPasta.has(m.pasta_imap)) porPasta.set(m.pasta_imap, [])
        porPasta.get(m.pasta_imap).push(m.uid_imap)
      }
      for (const [pastaImap, uids] of porPasta) {
        const lock = await client.getMailboxLock(pastaImap)
        try {
          await client.messageDelete(uids.join(','), { uid: true })
        } catch (err) {
          // Servidor sem MOVE/DELETE direto: tenta marcar \Deleted + expunge.
          try {
            await client.messageFlagsAdd(uids.join(','), ['\\Deleted'], { uid: true })
            if (typeof client.expunge === 'function') await client.expunge()
          } catch { falhas.push(`Conta ${conta.nome} (${pastaImap}): ${err.message}`) }
        } finally {
          lock.release()
        }
      }
    } catch (err) {
      falhas.push(`Conta ${contaId}: ${err.message}`)
      continue
    } finally {
      if (client) await client.logout().catch(() => {})
    }

    // Banco + disco (mesmo se o EXPUNGE do servidor falhou parcialmente, a
    // copia local sai — o usuario pediu pra apagar).
    for (const id of idsDaConta) {
      const anexos = await query('SELECT caminho FROM email_anexo_001 WHERE mensagem_id = $1', [id]).catch(() => [])
      await query('DELETE FROM email_mensagem_001 WHERE id = $1', [id])
      for (const a of anexos) {
        try { if (a.caminho && existsSync(a.caminho)) rmSync(a.caminho, { force: true }) } catch { /* em uso */ }
      }
      // pasta da mensagem, se ficou vazia
      if (base) {
        const pastaMsg = join(base, 'email', String(contaId), String(id))
        try { if (existsSync(pastaMsg)) rmSync(pastaMsg, { recursive: true, force: true }) } catch { /* em uso */ }
      }
      sucesso++
    }
  }

  // Sem UID de servidor (rascunho perdido, etc.) — apaga so do banco.
  for (const id of semServidor) {
    await query('DELETE FROM email_mensagem_001 WHERE id = $1', [id]).catch(() => {})
    sucesso++
  }

  return { sucesso, total: ids.length, falhas }
}

// Esvazia a Lixeira de UMA conta (ou de todas se contaId omitido): pega
// tudo que esta em pasta special_use = '\\Trash' e chama excluirPermanente.
export async function esvaziarLixeira(contaId = null) {
  const rows = await query(
    `SELECT m.id
     FROM email_mensagem_001 m
     JOIN email_pasta_001 p ON p.id = m.pasta_id
     WHERE p.special_use = '\\Trash' AND m.origem = 'recebido'
       ${contaId ? 'AND m.conta_id = $1' : ''}`,
    contaId ? [contaId] : []
  )
  if (!rows.length) return { sucesso: 0, total: 0, falhas: [] }
  return excluirPermanenteLote(rows.map(r => r.id))
}
