import { app } from 'electron'
import { join } from 'path'
import { runner } from 'node-pg-migrate'
import { getDecryptedBancoConfig } from './config'

// Segunda trilha de schema, paralela ao mecanismo legado de db.js (que
// continua responsável por tudo que já existia). A partir de agora, toda
// tabela/coluna NOVA entra por migration versionada aqui, não mais direto
// em db.js — ver docs/MIGRATIONS.md.
//
// Diferente do db.js legado (onde falha de DDL só gera um console.warn e o
// app segue normalmente), aqui a falha é logada bem alto e propagada: o
// objetivo explícito desta trilha é nunca esconder um erro de schema.
function migrationsDir() {
  return app.isPackaged
    ? join(process.resourcesPath, 'migrations')
    : join(__dirname, '../../migrations')
}

export async function runMigrations() {
  const banco = getDecryptedBancoConfig()
  const dir = migrationsDir()

  console.log('[migrate] Rodando migrations de', dir)
  try {
    const applied = await runner({
      databaseUrl: {
        host: banco.host,
        port: banco.port,
        database: banco.database,
        user: banco.user,
        password: banco.password,
        ssl: banco.host !== 'localhost' && banco.host !== '127.0.0.1'
          ? { rejectUnauthorized: false }
          : false,
      },
      dir,
      direction: 'up',
      migrationsTable: 'pgmigrations',
      checkOrder: true,
    })
    if (applied.length) {
      console.log(`[migrate] ${applied.length} migration(s) aplicada(s):`, applied.map(m => m.name).join(', '))
    } else {
      console.log('[migrate] Nenhuma migration pendente.')
    }
  } catch (err) {
    console.error('[migrate] FALHA ao rodar migrations:', err.message)
    throw err
  }
}
