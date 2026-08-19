import { Pool } from 'pg'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  getConfig, getDecryptedBancoConfig, getDecryptedBancoProducaoConfig,
  lerSecaoDeArquivoIni, saveSectionConfig, INI_PATH,
} from '../config'
import { getPool, syncSequencias } from '../db'

// Motor de "Importar Banco" — espelha o banco de PRODUÇÃO para o ambiente de
// DEV, em JS puro via node-postgres (sem depender de pg_dump/pg_restore, que
// não estão disponíveis nem em dev nem na máquina de usuários finais).
//
// Arquitetura (ver docs do plano): a substituição em dev roda dentro de UMA
// ÚNICA transação Postgres (BEGIN...COMMIT ou ROLLBACK automático em caso de
// erro) — isso é o mecanismo real de "nunca deixar o banco de dev
// inconsistente". Um backup JSON em disco, feito ANTES de tocar em dev, é a
// camada complementar de recuperação pós-fato (útil mesmo depois de um
// commit bem-sucedido, se o usuário se arrepender depois).

// Tabelas de metadado de schema — nunca copiadas de produção. Dev preserva
// seu próprio estado de versão de schema/migrations, já aplicado localmente
// antes desta feature sequer rodar.
const TABELAS_EXCLUIDAS = new Set(['kr_schema_version', 'pgmigrations'])

// ── Descoberta de schema (genérica, roda contra qualquer pool) ─────────────

async function listarTabelasCandidatas(client) {
  const { rows } = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `)
  return rows.map(r => r.table_name).filter(t => !TABELAS_EXCLUIDAS.has(t))
}

async function listarFKs(client) {
  const { rows } = await client.query(`
    SELECT
      tc.table_name AS tabela,
      ccu.table_name AS tabela_referenciada
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
  `)
  return rows
}

// Ordena tabelas topologicamente (Kahn) a partir das FKs — pais antes de
// filhos. Cobre tabelas fixas E dinâmicas do FormBuilder sem hardcode de
// ordem. Ciclos (não esperados no schema atual) abortam com erro claro.
function ordenarTopologicamente(tabelas, fks) {
  const emGrau = new Map(tabelas.map(t => [t, 0]))
  const dependentes = new Map(tabelas.map(t => [t, []])) // tabela_referenciada -> [tabelas que dependem dela]

  for (const { tabela, tabela_referenciada } of fks) {
    if (tabela === tabela_referenciada) continue // FK auto-referente não define ordem entre tabelas
    if (!emGrau.has(tabela) || !emGrau.has(tabela_referenciada)) continue
    dependentes.get(tabela_referenciada).push(tabela)
    emGrau.set(tabela, emGrau.get(tabela) + 1)
  }

  const fila = tabelas.filter(t => emGrau.get(t) === 0).sort()
  const ordenadas = []
  while (fila.length) {
    const atual = fila.shift()
    ordenadas.push(atual)
    for (const dep of dependentes.get(atual) || []) {
      emGrau.set(dep, emGrau.get(dep) - 1)
      if (emGrau.get(dep) === 0) fila.push(dep)
    }
    fila.sort()
  }

  if (ordenadas.length !== tabelas.length) {
    const faltando = tabelas.filter(t => !ordenadas.includes(t))
    throw new Error(`Ciclo de dependências detectado entre tabelas: ${faltando.join(', ')}. Importação abortada.`)
  }
  return ordenadas
}

async function listarTabelasEOrdem(client) {
  const tabelas = await listarTabelasCandidatas(client)
  const fks = await listarFKs(client)
  return ordenarTopologicamente(tabelas, fks)
}

// ── Dump genérico (reaproveitado tanto para produção quanto para o backup
//    de segurança de dev) ───────────────────────────────────────────────────

async function dumpTabela(client, nomeTabela) {
  const colRes = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `, [nomeTabela])
  const colunas = colRes.rows.map(r => r.column_name)
  // json/jsonb chegam do driver `pg` já desserializados em objeto/array —
  // precisam ser marcados aqui pra voltar a virar string no restore
  // (diferente de colunas array nativas do Postgres, que o driver já sabe
  // reserializar sozinho e não podem ser confundidas com jsonb por typeof).
  const colunasJson = colRes.rows.filter(r => r.data_type === 'json' || r.data_type === 'jsonb').map(r => r.column_name)
  const { rows } = await client.query(`SELECT * FROM "${nomeTabela}"`)
  return { colunas, colunasJson, linhas: rows }
}

async function dumpBanco(client, tabelas, onTabela) {
  const dump = {}
  for (let i = 0; i < tabelas.length; i++) {
    const tabela = tabelas[i]
    dump[tabela] = await dumpTabela(client, tabela)
    if (onTabela) onTabela(tabela, i + 1, tabelas.length)
  }
  return dump
}

function salvarBackupJson(dump, destino) {
  const pastaDestino = join(destino, '..')
  if (!existsSync(pastaDestino)) mkdirSync(pastaDestino, { recursive: true })
  writeFileSync(destino, JSON.stringify({ criadoEm: new Date().toISOString(), tabelas: dump }), 'utf-8')
}

// ── Restauração em dev, dentro de uma transação já aberta ──────────────────
// TRUNCATE + INSERT das tabelas de produção, na ordem topológica (pais antes
// de filhos). Se qualquer INSERT falhar, o chamador faz ROLLBACK e o
// Postgres desfaz tudo — nenhuma tabela fica truncada sem dados.

const LOTE = 500

async function restaurarNaTransacao(client, tabelasOrdenadas, dumpProducao, onTabela) {
  // TRUNCATE de todas de uma vez, na ordem inversa (filhos antes de pais) —
  // RESTART IDENTITY reseta as sequences de id; CASCADE cobre FKs entre elas
  // mesmo que a ordem não seja perfeita.
  const listaAspas = tabelasOrdenadas.map(t => `"${t}"`).join(', ')
  await client.query(`TRUNCATE TABLE ${listaAspas} RESTART IDENTITY CASCADE`)

  for (let i = 0; i < tabelasOrdenadas.length; i++) {
    const tabela = tabelasOrdenadas[i]
    const { colunas, colunasJson = [], linhas } = dumpProducao[tabela] || { colunas: [], linhas: [] }
    const setJson = new Set(colunasJson)
    if (linhas.length && colunas.length) {
      for (let offset = 0; offset < linhas.length; offset += LOTE) {
        const bloco = linhas.slice(offset, offset + LOTE)
        const params = []
        const placeholders = bloco.map((linha, idx) => {
          const base = idx * colunas.length
          colunas.forEach(c => {
            const v = linha[c]
            // Colunas json/jsonb chegam do dump já desserializadas em
            // objeto/array pelo driver `pg` — precisam voltar a ser string
            // pra outro INSERT parametrizado (o pg não serializa objetos
            // JS automaticamente pra json/jsonb, só faz toString()).
            params.push(v !== null && setJson.has(c) ? JSON.stringify(v) : v)
          })
          return `(${colunas.map((_, j) => `$${base + j + 1}`).join(',')})`
        })
        const colsAspas = colunas.map(c => `"${c}"`).join(',')
        try {
          await client.query(
            `INSERT INTO "${tabela}" (${colsAspas}) VALUES ${placeholders.join(',')}`,
            params
          )
        } catch (err) {
          err.message = `Tabela "${tabela}": ${err.message}`
          throw err
        }
      }
    }
    if (onTabela) onTabela(tabela, i + 1, tabelasOrdenadas.length)
  }

  // Sequences de id (RESTART IDENTITY já zerou; agora avança pro MAX real).
  for (const tabela of tabelasOrdenadas) {
    await client.query(`
      DO $$
      DECLARE seq TEXT; mx BIGINT;
      BEGIN
        SELECT pg_get_serial_sequence('"${tabela}"', 'id') INTO seq;
        IF seq IS NOT NULL THEN
          SELECT COALESCE(MAX(id), 0) INTO mx FROM "${tabela}";
          IF mx > 0 THEN PERFORM setval(seq, mx, true); END IF;
        END IF;
      END $$;
    `).catch(() => {}) // tabela sem coluna 'id' (raro) — ignora
  }
}

// ── Pool de produção (não é singleton — cada importação abre/fecha o seu) ──

function criarPoolProducao(banco) {
  const isRemote = banco.host !== 'localhost' && banco.host !== '127.0.0.1'
  return new Pool({
    host: banco.host, port: banco.port, database: banco.database,
    user: banco.user, password: banco.password,
    ssl: isRemote ? { rejectUnauthorized: false } : false,
  })
}

// ── Token de autorização (gerado em produção, colado em dev) ───────────────
// Validação e consumo rodam contra o banco de PRODUÇÃO (não dev) — é lá que
// o token foi criado, por alguém com acesso real ao ambiente. O token só é
// invalidado ao final da importação (sucesso OU falha), nunca no momento de
// colar/validar — assim uma importação que falhe no meio não deixa o token
// "meio usado", mas também não permite reaproveitar o mesmo token depois de
// uma tentativa (sucesso ou não).
async function validarToken(pool, token) {
  if (!token || !token.trim()) throw new Error('Cole o token de autorização gerado em produção.')
  const { rows } = await pool.query(
    `SELECT id FROM kr_tokens_importacao_001
     WHERE token = $1 AND usado_em IS NULL AND expira_em > NOW()`,
    [token.trim()]
  )
  if (!rows.length) throw new Error('Token inválido, já usado ou expirado. Gere um novo token em produção.')
  return rows[0].id
}

async function invalidarToken(pool, tokenId) {
  await pool.query(`UPDATE kr_tokens_importacao_001 SET usado_em = NOW() WHERE id = $1`, [tokenId]).catch(() => {})
}

export async function testarConexaoProducao() {
  const banco = getDecryptedBancoProducaoConfig()
  if (!banco.host || !banco.database) throw new Error('Preencha os dados de conexão do banco de produção antes de testar.')
  const pool = criarPoolProducao(banco)
  try {
    await pool.query('SELECT 1')
    return true
  } finally {
    await pool.end()
  }
}

// ── Aplicação seletiva do .ini de produção (só [Personalizacao]) ───────────

async function aplicarConfigProducao(iniPath, { BrowserWindow }) {
  if (!iniPath) return { aplicado: false, motivo: 'Caminho do .ini de produção não configurado.' }
  // Aceita tanto o caminho do arquivo .ini direto (configuração atual, via
  // seletor de arquivo) quanto o de uma pasta (configurações antigas, que
  // salvaram só o diretório) — evita quebrar quem já tinha isso configurado.
  const ehArquivoIni = iniPath.toLowerCase().endsWith('.ini')
  const caminhoArquivo = ehArquivoIni ? iniPath : join(iniPath, 'krontech.ini')
  const secao = lerSecaoDeArquivoIni(caminhoArquivo, 'Personalizacao')
  if (!secao) return { aplicado: false, motivo: 'Arquivo krontech.ini de produção não encontrado ou sem seção [Personalizacao].' }

  saveSectionConfig('Personalizacao', secao)
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send('config:personalizacaoAlterada', secao)
  }
  return { aplicado: true }
}

// ── Orquestrador ─────────────────────────────────────────────────────────

export async function importarBancoDeProducao({ onProgresso, BrowserWindow, token }) {
  const emitir = (fase, extra = {}) => { if (onProgresso) onProgresso({ fase, ...extra }) }

  const bancoProd = getDecryptedBancoProducaoConfig()
  if (!bancoProd.host || !bancoProd.database || !bancoProd.user) {
    throw new Error('Configure host, banco e usuário de produção em Configurações antes de importar.')
  }

  let poolProd = null
  let clientProd = null
  let clientDev = null
  let tokenId = null

  try {
    // ── conectando_producao ──────────────────────────────────────────────
    emitir('conectando_producao')
    poolProd = criarPoolProducao(bancoProd)

    // Token conferido com o pool inteiro (não uma transação read-only já
    // aberta), porque invalidarToken() precisa escrever nele mais tarde —
    // read-only bloquearia esse UPDATE final.
    tokenId = await validarToken(poolProd, token)

    clientProd = await poolProd.connect()
    // Somente leitura garantida em nível de banco — se algum bug futuro
    // tentasse escrever, o Postgres rejeitaria com erro, não só o código.
    await clientProd.query('BEGIN TRANSACTION READ ONLY')

    // ── descobrindo_schema ───────────────────────────────────────────────
    emitir('descobrindo_schema')
    const tabelas = await listarTabelasEOrdem(clientProd)

    // ── exportando_producao ──────────────────────────────────────────────
    emitir('exportando_producao', { atual: 0, total: tabelas.length })
    const dumpProducao = await dumpBanco(clientProd, tabelas, (tabela, atual, total) => {
      emitir('exportando_producao', { atual, total, tabela })
    })

    // Produção é só leitura — nunca commitar (não há nada a persistir lá).
    await clientProd.query('ROLLBACK')
    clientProd.release()
    clientProd = null
    await poolProd.end()
    poolProd = null

    // ── backup_dev (camada 1: recuperação pós-fato) ─────────────────────
    emitir('backup_dev', { atual: 0, total: tabelas.length })
    const poolDev = getPool()
    const clientBackup = await poolDev.connect()
    let dumpDevBackup
    try {
      // Só as tabelas que também existem em dev (schema pode divergir
      // ligeiramente se dev estiver com migrations pendentes).
      const tabelasDevExistentes = await listarTabelasCandidatas(clientBackup)
      const tabelasParaBackup = tabelas.filter(t => tabelasDevExistentes.includes(t))
      dumpDevBackup = await dumpBanco(clientBackup, tabelasParaBackup, (tabela, atual, total) => {
        emitir('backup_dev', { atual, total, tabela })
      })
    } finally {
      clientBackup.release()
    }
    const cfg = getConfig()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const destinoBackup = join(cfg.Caminhos.backup, 'import-banco', `backup-dev-${timestamp}.json`)
    salvarBackupJson(dumpDevBackup, destinoBackup)

    // ── restaurando_dev (camada 2: transação única, atomicidade nativa) ──
    emitir('restaurando_dev', { atual: 0, total: tabelas.length })
    clientDev = await poolDev.connect()
    await clientDev.query('BEGIN')
    try {
      // Só truncar/inserir tabelas que existem em dev — uma tabela nova de
      // produção sem migration correspondente em dev ainda não pode ser
      // restaurada (schema não existe localmente).
      const tabelasDevExistentes = await listarTabelasCandidatas(clientDev)
      const tabelasParaRestaurar = tabelas.filter(t => tabelasDevExistentes.includes(t))
      await restaurarNaTransacao(clientDev, tabelasParaRestaurar, dumpProducao, (tabela, atual, total) => {
        emitir('restaurando_dev', { atual, total, tabela })
      })
      await clientDev.query('COMMIT')
    } catch (err) {
      await clientDev.query('ROLLBACK').catch(() => {})
      throw err
    } finally {
      clientDev.release()
      clientDev = null
    }

    // Sequences de código (arq_001_codigo_seq etc.) — reusa a mesma lógica
    // já usada no boot do app, em vez de duplicá-la.
    await syncSequencias()

    // ── aplicando_config (não crítico — falha aqui não desfaz os dados já
    //    commitados com sucesso) ──────────────────────────────────────────
    emitir('aplicando_config')
    let resultadoConfig
    try {
      resultadoConfig = await aplicarConfigProducao(bancoProd.iniPath, { BrowserWindow })
    } catch (err) {
      resultadoConfig = { aplicado: false, motivo: err.message }
    }

    // ── finalizando ───────────────────────────────────────────────────────
    emitir('finalizando')
    await invalidarTokenComNovaConexao(bancoProd, tokenId)

    emitir('concluido', { avisoConfig: resultadoConfig.aplicado ? null : resultadoConfig.motivo })
    return { ok: true, backupPath: destinoBackup, avisoConfig: resultadoConfig.aplicado ? null : resultadoConfig.motivo }

  } catch (err) {
    // Limpeza defensiva de conexões ainda abertas em caso de erro em
    // qualquer etapa — o ROLLBACK de clientDev já foi feito no catch interno
    // se a falha ocorreu ali; isto cobre falhas nas etapas anteriores.
    try { if (clientProd) { await clientProd.query('ROLLBACK').catch(() => {}); clientProd.release() } } catch {}
    try { if (poolProd) await poolProd.end() } catch {}
    try { if (clientDev) { await clientDev.query('ROLLBACK').catch(() => {}); clientDev.release() } } catch {}
    // Token invalida mesmo em falha — uma tentativa (com sucesso ou não)
    // consome a autorização; um novo token precisa ser gerado pra tentar de
    // novo, mesmo que o problema não tenha sido do token em si.
    if (tokenId) await invalidarTokenComNovaConexao(bancoProd, tokenId)

    emitir('erro', { erro: err.message })
    throw err
  }
}

async function invalidarTokenComNovaConexao(bancoProd, tokenId) {
  if (!tokenId) return
  const pool = criarPoolProducao(bancoProd)
  try {
    await invalidarToken(pool, tokenId)
  } finally {
    await pool.end().catch(() => {})
  }
}
