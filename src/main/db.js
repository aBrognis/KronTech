import { Pool } from 'pg'
import { getDecryptedBancoConfig } from './config'

let pool = null

export function getPool() {
  if (!pool) {
    const banco = getDecryptedBancoConfig()
    pool = new Pool({
      host:     banco.host,
      port:     banco.port,
      database: banco.database,
      user:     banco.user,
      password: banco.password,
    })
    pool.on('error', (err) => {
      console.error('PostgreSQL error:', err.message)
    })
  }
  return pool
}

export async function query(sql, params = []) {
  const client = await getPool().connect()
  try {
    const result = await client.query(sql, params)
    return result.rows
  } finally {
    client.release()
  }
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params)
  return rows[0] ?? null
}

// ── Versão do schema ─────────────────────────────────────────────────────────
const SCHEMA_VERSION = 2

// Sincroniza sequências de código com o max existente nas tabelas de sistema.
// Roda em TODA inicialização para proteger contra restore de backup.
async function syncSequencias() {
  for (const tbl of ['age_001', 'arq_001']) {
    await query(`
      DO $$
      DECLARE cur_max INTEGER;
      BEGIN
        EXECUTE format('SELECT COALESCE(MAX(NULLIF(codigo,$1)::INTEGER),0) FROM %I','${tbl}')
          INTO cur_max USING '';
        IF cur_max > 0 THEN
          PERFORM setval('${tbl}_codigo_seq', cur_max);
        END IF;
      END $$;
    `).catch(() => {})
  }
}

// Pré-registra ou atualiza uma tela de sistema no banco (idempotente)
async function registrarTelaSistema({ slug, nomeTela, nomeTabela, icone, moduloSlug, campos }) {
  const modulo = await queryOne('SELECT id FROM kr_modulos WHERE nome=$1', [moduloSlug]).catch(() => null)
  const moduloId = modulo?.id || null

  let existing = await queryOne(
    `SELECT id, slug FROM kr_telas WHERE slug=$1 OR nome_tabela=$2 LIMIT 1`,
    [slug, nomeTabela]
  ).catch(() => null)

  let telaId = existing?.id

  if (!telaId) {
    const row = await queryOne(
      `INSERT INTO kr_telas (nome_tela, nome_tabela, icone, modulo_id, sistema, slug, ativo)
       VALUES ($1,$2,$3,$4,TRUE,$5,TRUE) RETURNING id`,
      [nomeTela, nomeTabela, icone, moduloId, slug]
    ).catch(() => null)
    telaId = row?.id
    if (!telaId) {
      const fallback = await queryOne('SELECT id FROM kr_telas WHERE nome_tabela=$1', [nomeTabela]).catch(() => null)
      telaId = fallback?.id
    }
  }

  if (!telaId) return

  await query(
    `UPDATE kr_telas SET slug=$1, sistema=TRUE, icone=$2, modulo_id=$3
     WHERE id=$4 AND (slug IS NULL OR slug != $1)`,
    [slug, icone, moduloId, telaId]
  ).catch(() => {})

  for (const [idx, c] of campos.entries()) {
    const exists = await queryOne(
      'SELECT id FROM kr_tela_campos WHERE tela_id=$1 AND nome_campo=$2',
      [telaId, c.nome]
    ).catch(() => null)
    if (!exists) {
      await query(
        `INSERT INTO kr_tela_campos
           (tela_id,nome_campo,label,tipo,tamanho,obrigatorio,sequencial,campo_busca,valor_padrao,ordem,largura,x_pos,y_pos,w_px,h_px)
         VALUES ($1,$2,$3,$4,100,FALSE,FALSE,FALSE,NULL,$5,50,$6,$7,$8,$9)`,
        [telaId, c.nome, c.label, c.tipo, idx + 1, c.x, c.y, c.w, c.h]
      ).catch(() => {})
    }
  }
}

// ── Migração 1 ───────────────────────────────────────────────────────────────
async function migration1() {

  // ── Remove tabelas legadas que não devem mais existir como tabelas de sistema
  // CASCADE remove FKs dependentes (ex: age_001.cliente_id, os_001.cliente_id)
  await query(`DROP TABLE IF EXISTS os_001       CASCADE`).catch(() => {})
  await query(`DROP TABLE IF EXISTS clientes_001 CASCADE`).catch(() => {})
  await query(`DROP TABLE IF EXISTS solucoes_001 CASCADE`).catch(() => {})
  await query(`DROP TABLE IF EXISTS scr_001      CASCADE`).catch(() => {})
  await query(`DROP TABLE IF EXISTS rel_001      CASCADE`).catch(() => {})

  // ── Tabelas de sistema ────────────────────────────────────────────────────

  await query(`
    CREATE TABLE IF NOT EXISTS age_001 (
      id           SERIAL PRIMARY KEY,
      titulo       VARCHAR(300) NOT NULL,
      categoria    VARCHAR(50)  DEFAULT 'Tarefa',
      dt_evento    DATE,
      hr_inicio    TIME,
      hr_fim       TIME,
      descricao    TEXT,
      status       VARCHAR(30)  DEFAULT 'Pendente',
      lembrete     BOOLEAN      DEFAULT FALSE,
      min_lembrete INTEGER      DEFAULT 30,
      dt_criacao   TIMESTAMP    DEFAULT NOW()
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS arq_001 (
      id               SERIAL PRIMARY KEY,
      codigo           VARCHAR(10)  DEFAULT '',
      nome             VARCHAR(300) NOT NULL,
      categoria        VARCHAR(100) DEFAULT '',
      tags             TEXT         DEFAULT '',
      pasta            VARCHAR(200) DEFAULT '',
      arquivo_nome     VARCHAR(500) NOT NULL,
      arquivo_path     TEXT         NOT NULL,
      arquivo_ext      VARCHAR(20)  DEFAULT '',
      arquivo_tamanho  BIGINT       DEFAULT 0,
      descricao        TEXT         DEFAULT '',
      favorito         BOOLEAN      DEFAULT FALSE,
      dt_criacao       TIMESTAMP    DEFAULT NOW(),
      dt_atualizacao   TIMESTAMP    DEFAULT NOW()
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS dash_001 (
      id           SERIAL PRIMARY KEY,
      titulo       VARCHAR(200) NOT NULL,
      tipo         VARCHAR(50)  NOT NULL,
      sql_query    TEXT         NOT NULL,
      icone        VARCHAR(50)  DEFAULT '📊',
      cor          VARCHAR(20)  DEFAULT '#FF6B2B',
      tamanho      VARCHAR(20)  DEFAULT 'pequeno',
      intervalo    INTEGER      DEFAULT 300,
      posicao      INTEGER      DEFAULT 0,
      grid_x       INTEGER      DEFAULT 0,
      grid_y       INTEGER      DEFAULT 0,
      grid_w       INTEGER      DEFAULT 3,
      grid_h       INTEGER      DEFAULT 4,
      icone_lucide VARCHAR(100),
      dt_criacao   TIMESTAMP    DEFAULT NOW()
    )
  `)
  for (const col of [
    `ALTER TABLE dash_001 ADD COLUMN IF NOT EXISTS grid_x       INTEGER      DEFAULT 0`,
    `ALTER TABLE dash_001 ADD COLUMN IF NOT EXISTS grid_y       INTEGER      DEFAULT 0`,
    `ALTER TABLE dash_001 ADD COLUMN IF NOT EXISTS grid_w       INTEGER      DEFAULT 3`,
    `ALTER TABLE dash_001 ADD COLUMN IF NOT EXISTS grid_h       INTEGER      DEFAULT 4`,
    `ALTER TABLE dash_001 ADD COLUMN IF NOT EXISTS icone_lucide VARCHAR(100)`,
  ]) { await query(col).catch(() => {}) }

  // ── Criador de Telas ──────────────────────────────────────────────────────

  await query(`
    CREATE TABLE IF NOT EXISTS kr_modulos (
      id    SERIAL PRIMARY KEY,
      nome  VARCHAR(100) NOT NULL,
      icone VARCHAR(80)  DEFAULT 'folder',
      ordem INTEGER      DEFAULT 99,
      ativo BOOLEAN      DEFAULT TRUE
    )
  `)
  await query(`
    DELETE FROM kr_modulos
    WHERE id NOT IN (SELECT MIN(id) FROM kr_modulos GROUP BY nome)
  `).catch(() => {})
  await query(`
    ALTER TABLE kr_modulos ADD CONSTRAINT kr_modulos_nome_unique UNIQUE (nome)
  `).catch(() => {})
  await query(`
    INSERT INTO kr_modulos (nome, icone, ordem)
    SELECT v.nome, v.icone, v.ordem FROM (VALUES
      ('Ferramentas', 'wrench',      1),
      ('Cadastros',   'database',    2),
      ('Financeiro',  'dollar-sign', 3),
      ('Estoque',     'package',     4),
      ('Relatórios',  'bar-chart-2', 5),
      ('Gestão',      'layout',      6)
    ) AS v(nome, icone, ordem)
    WHERE NOT EXISTS (SELECT 1 FROM kr_modulos)
  `).catch(() => {})

  await query(`
    CREATE TABLE IF NOT EXISTS kr_telas (
      id             SERIAL PRIMARY KEY,
      nome_tela      VARCHAR(100) NOT NULL,
      nome_tabela    VARCHAR(100) NOT NULL UNIQUE,
      descricao      TEXT,
      icone          VARCHAR(80)  DEFAULT 'layout',
      modulo_id      INTEGER REFERENCES kr_modulos(id) ON DELETE SET NULL,
      ordem_menu     INTEGER      DEFAULT 99,
      ativo          BOOLEAN      DEFAULT TRUE,
      sistema        BOOLEAN      DEFAULT FALSE,
      slug           VARCHAR(50),
      canvas_w       INTEGER      DEFAULT 780,
      canvas_h       INTEGER      DEFAULT 480,
      col_favorito   BOOLEAN      DEFAULT TRUE,
      col_timestamps BOOLEAN      DEFAULT TRUE,
      criado_em      TIMESTAMP    DEFAULT NOW(),
      atualizado_em  TIMESTAMP    DEFAULT NOW()
    )
  `)
  for (const col of [
    `ALTER TABLE kr_telas ADD COLUMN IF NOT EXISTS sistema        BOOLEAN  DEFAULT FALSE`,
    `ALTER TABLE kr_telas ADD COLUMN IF NOT EXISTS slug           VARCHAR(50)`,
    `ALTER TABLE kr_telas ADD COLUMN IF NOT EXISTS canvas_w      INTEGER  DEFAULT 780`,
    `ALTER TABLE kr_telas ADD COLUMN IF NOT EXISTS canvas_h      INTEGER  DEFAULT 480`,
    `ALTER TABLE kr_telas ADD COLUMN IF NOT EXISTS col_favorito   BOOLEAN DEFAULT TRUE`,
    `ALTER TABLE kr_telas ADD COLUMN IF NOT EXISTS col_timestamps BOOLEAN DEFAULT TRUE`,
  ]) { await query(col).catch(() => {}) }

  await query(`
    CREATE TABLE IF NOT EXISTS kr_tela_campos (
      id           SERIAL PRIMARY KEY,
      tela_id      INTEGER      NOT NULL REFERENCES kr_telas(id) ON DELETE CASCADE,
      nome_campo   VARCHAR(100) NOT NULL,
      label        VARCHAR(150) NOT NULL,
      tipo         VARCHAR(30)  NOT NULL,
      tamanho      INTEGER      DEFAULT 100,
      obrigatorio  BOOLEAN      DEFAULT FALSE,
      sequencial   BOOLEAN      DEFAULT FALSE,
      campo_busca  BOOLEAN      DEFAULT FALSE,
      valor_padrao TEXT,
      ordem        INTEGER      DEFAULT 1,
      largura      INTEGER      DEFAULT 50,
      ativo        BOOLEAN      DEFAULT TRUE,
      x_pos        INTEGER      DEFAULT 0,
      y_pos        INTEGER      DEFAULT 0,
      w_px         INTEGER      DEFAULT 280,
      h_px         INTEGER      DEFAULT 60,
      opcoes       JSONB,
      copiavel     BOOLEAN      DEFAULT FALSE,
      criado_em    TIMESTAMP    DEFAULT NOW()
    )
  `)
  for (const col of [
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS x_pos    INTEGER DEFAULT 0`,
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS y_pos    INTEGER DEFAULT 0`,
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS w_px     INTEGER DEFAULT 280`,
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS h_px     INTEGER DEFAULT 60`,
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS opcoes      JSONB`,
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS copiavel   BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS sem_negrito    BOOLEAN  DEFAULT FALSE`,
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS font_size      SMALLINT DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS input_negrito  BOOLEAN  DEFAULT FALSE`,
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS input_font_size SMALLINT DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS label_cor      VARCHAR(20)  DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS input_align    VARCHAR(10)  DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS input_cor      VARCHAR(20)  DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS input_bg       VARCHAR(20)  DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS border_radius  SMALLINT     DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS border_width   SMALLINT     DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS border_color   VARCHAR(20)  DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos ADD COLUMN IF NOT EXISTS opcoes_layout  VARCHAR(10)  DEFAULT NULL`,
  ]) { await query(col).catch(() => {}) }
  await query(`
    ALTER TABLE kr_tela_campos DROP CONSTRAINT IF EXISTS kr_tela_campos_tipo_check
  `).catch(() => {})
  await query(`
    ALTER TABLE kr_tela_campos DROP CONSTRAINT IF EXISTS kr_tela_campos_largura_check
  `).catch(() => {})

  // ── Tabela de usuários ────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS kr_usuarios (
      id          SERIAL PRIMARY KEY,
      usuario     VARCHAR(60)  NOT NULL UNIQUE,
      nome        VARCHAR(120) NOT NULL,
      senha_hash  TEXT         NOT NULL,
      perfil      VARCHAR(30)  DEFAULT 'usuario',
      ativo       BOOLEAN      DEFAULT TRUE,
      criado_em   TIMESTAMP    DEFAULT NOW(),
      alterado_em TIMESTAMP    DEFAULT NOW()
    )
  `).catch(() => {})
  await query(`
    INSERT INTO kr_usuarios (usuario, nome, senha_hash, perfil)
    VALUES ('admin', 'Administrador', 'admin', 'admin')
    ON CONFLICT (usuario) DO NOTHING
  `).catch(() => {})

  // ── Sequências para tabelas de sistema (após todos os CREATE TABLE) ────────
  for (const tbl of ['age_001', 'arq_001']) {
    await query(`ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS codigo VARCHAR(10) DEFAULT ''`).catch(() => {})
    await query(`CREATE SEQUENCE IF NOT EXISTS ${tbl}_codigo_seq START 1`).catch(() => {})
  }

  // ── Funções PostgreSQL ────────────────────────────────────────────────────

  await query(`
    CREATE OR REPLACE FUNCTION fn_tipo_para_pg(p_tipo VARCHAR, p_tamanho INTEGER)
    RETURNS TEXT LANGUAGE plpgsql AS $$
    BEGIN
      RETURN CASE p_tipo
        WHEN 'texto'       THEN 'VARCHAR(' || COALESCE(NULLIF(p_tamanho,0),100) || ')'
        WHEN 'email'       THEN 'VARCHAR(150)'
        WHEN 'telefone'    THEN 'VARCHAR(30)'
        WHEN 'numero'      THEN 'NUMERIC(15,4)'
        WHEN 'moeda'       THEN 'NUMERIC(15,2)'
        WHEN 'data'        THEN 'DATE'
        WHEN 'booleano'    THEN 'BOOLEAN'
        WHEN 'texto_longo' THEN 'TEXT'
        WHEN 'arquivo'     THEN 'TEXT'
        WHEN 'imagem'      THEN 'TEXT'
        WHEN 'url'         THEN 'TEXT'
        WHEN 'login'       THEN 'VARCHAR(100)'
        WHEN 'senha'       THEN 'TEXT'
        WHEN 'documento'   THEN 'VARCHAR(20)'
        WHEN 'cep'         THEN 'VARCHAR(10)'
        WHEN 'select'      THEN 'VARCHAR(200)'
        WHEN 'radio'       THEN 'VARCHAR(200)'
        WHEN 'tags'        THEN 'TEXT'
        WHEN 'avaliacao'   THEN 'SMALLINT'
        WHEN 'codigo_auto' THEN 'VARCHAR(50)'
        WHEN 'lookup'      THEN 'INTEGER'
        ELSE 'VARCHAR(100)'
      END;
    END; $$
  `).catch(() => {})

  await query(`
    CREATE OR REPLACE FUNCTION fn_criar_tabela_usuario(p_tela_id INTEGER)
    RETURNS TEXT LANGUAGE plpgsql AS $$
    DECLARE
      v_nome_tabela    VARCHAR(100);
      v_sql            TEXT := '';
      v_col            TEXT;
      rec              RECORD;
      v_tipo_pg        TEXT;
      v_existe         BOOLEAN;
      v_col_favorito   BOOLEAN;
      v_col_timestamps BOOLEAN;
    BEGIN
      SELECT nome_tabela,
             COALESCE(col_favorito,   TRUE),
             COALESCE(col_timestamps, TRUE)
      INTO   v_nome_tabela, v_col_favorito, v_col_timestamps
      FROM   kr_telas WHERE id = p_tela_id;
      IF v_nome_tabela IS NULL THEN RAISE EXCEPTION 'Tela % não encontrada.', p_tela_id; END IF;

      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema='public' AND table_name=v_nome_tabela
      ) INTO v_existe;

      IF v_existe THEN
        EXECUTE 'ALTER TABLE ' || quote_ident(v_nome_tabela) || ' ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE';
        IF v_col_timestamps THEN
          EXECUTE 'ALTER TABLE ' || quote_ident(v_nome_tabela) || ' ADD COLUMN IF NOT EXISTS criado_em   TIMESTAMP DEFAULT NOW()';
          EXECUTE 'ALTER TABLE ' || quote_ident(v_nome_tabela) || ' ADD COLUMN IF NOT EXISTS alterado_em TIMESTAMP DEFAULT NOW()';
        END IF;
        IF v_col_favorito THEN
          EXECUTE 'ALTER TABLE ' || quote_ident(v_nome_tabela) || ' ADD COLUMN IF NOT EXISTS favorito BOOLEAN DEFAULT FALSE';
        END IF;

        FOR rec IN
          SELECT c.* FROM kr_tela_campos c
          WHERE c.tela_id=p_tela_id AND c.ativo=TRUE AND c.sequencial=FALSE AND c.tipo != 'divisor'
            AND NOT EXISTS (
              SELECT 1 FROM information_schema.columns ic
              WHERE ic.table_schema='public' AND ic.table_name=v_nome_tabela AND ic.column_name=c.nome_campo
            )
          ORDER BY c.ordem
        LOOP
          v_tipo_pg := fn_tipo_para_pg(rec.tipo, rec.tamanho);
          v_sql := v_sql || 'ALTER TABLE ' || quote_ident(v_nome_tabela)
                         || ' ADD COLUMN IF NOT EXISTS ' || quote_ident(rec.nome_campo)
                         || ' ' || v_tipo_pg;
          IF rec.valor_padrao IS NOT NULL THEN v_sql := v_sql || ' DEFAULT ' || quote_literal(rec.valor_padrao); END IF;
          v_sql := v_sql || '; ';
        END LOOP;
        IF v_sql <> '' THEN EXECUTE v_sql; END IF;
        RETURN 'ALTERADA: ' || v_nome_tabela;
      END IF;

      v_sql := 'CREATE TABLE ' || quote_ident(v_nome_tabela) || ' (' || chr(10)
            || '  id SERIAL PRIMARY KEY';
      FOR rec IN SELECT * FROM kr_tela_campos WHERE tela_id=p_tela_id AND ativo=TRUE AND tipo != 'divisor' ORDER BY ordem LOOP
        IF rec.sequencial THEN
          v_col := '  ' || quote_ident(rec.nome_campo) || ' VARCHAR(50)';
        ELSE
          v_tipo_pg := fn_tipo_para_pg(rec.tipo, rec.tamanho);
          v_col := '  ' || quote_ident(rec.nome_campo) || ' ' || v_tipo_pg;
          IF rec.valor_padrao IS NOT NULL THEN v_col := v_col || ' DEFAULT ' || quote_literal(rec.valor_padrao); END IF;
          IF rec.obrigatorio THEN v_col := v_col || ' NOT NULL'; END IF;
        END IF;
        v_sql := v_sql || ',' || chr(10) || v_col;
      END LOOP;
      v_sql := v_sql || ',' || chr(10) || '  ativo BOOLEAN DEFAULT TRUE';
      IF v_col_timestamps THEN
        v_sql := v_sql || ',' || chr(10) || '  criado_em   TIMESTAMP DEFAULT NOW()'
                       || ',' || chr(10) || '  alterado_em TIMESTAMP DEFAULT NOW()';
      END IF;
      IF v_col_favorito THEN
        v_sql := v_sql || ',' || chr(10) || '  favorito BOOLEAN DEFAULT FALSE';
      END IF;
      v_sql := v_sql || chr(10) || ');';
      EXECUTE v_sql;
      FOR rec IN SELECT nome_campo FROM kr_tela_campos WHERE tela_id=p_tela_id AND campo_busca=TRUE AND ativo=TRUE LOOP
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_' || v_nome_tabela || '_' || rec.nome_campo
             || ' ON ' || quote_ident(v_nome_tabela) || '(' || quote_ident(rec.nome_campo) || ')';
      END LOOP;
      RETURN 'CRIADA: ' || v_nome_tabela;
    END; $$
  `).catch(() => {})

  await query(`
    CREATE OR REPLACE FUNCTION fn_excluir_tabela_usuario(p_tela_id INTEGER)
    RETURNS TEXT LANGUAGE plpgsql AS $$
    DECLARE v_nome_tabela VARCHAR(100);
    BEGIN
      SELECT nome_tabela INTO v_nome_tabela FROM kr_telas WHERE id = p_tela_id;
      IF v_nome_tabela IS NULL THEN RAISE EXCEPTION 'Tela % não encontrada.', p_tela_id; END IF;
      EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(v_nome_tabela) || ' CASCADE';
      DELETE FROM kr_tela_campos WHERE tela_id = p_tela_id;
      DELETE FROM kr_telas       WHERE id      = p_tela_id;
      RETURN 'EXCLUIDA: ' || v_nome_tabela;
    END; $$
  `).catch(() => {})

  // ── Limpezas ──────────────────────────────────────────────────────────────

  // Remove telas de sistema do FormBuilder (gerenciadas por páginas dedicadas)
  await query(`
    DELETE FROM kr_tela_campos WHERE tela_id IN (
      SELECT id FROM kr_telas WHERE slug IN ('scripts','agenda') OR nome_tabela IN ('scr_001','age_001')
    )
  `).catch(() => {})
  await query(`
    DELETE FROM kr_telas WHERE slug IN ('scripts','agenda') OR nome_tabela IN ('scr_001','age_001')
  `).catch(() => {})

  // Garante ativo+criado_em+alterado_em+favorito em TODAS as tabelas dinâmicas
  await query(`
    DO $$
    DECLARE rec RECORD;
    BEGIN
      FOR rec IN
        SELECT nome_tabela FROM kr_telas
        WHERE ativo=TRUE
          AND EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema='public' AND table_name=kr_telas.nome_tabela
          )
      LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.nome_tabela) || ' ADD COLUMN IF NOT EXISTS ativo       BOOLEAN   DEFAULT TRUE';
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.nome_tabela) || ' ADD COLUMN IF NOT EXISTS criado_em   TIMESTAMP DEFAULT NOW()';
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.nome_tabela) || ' ADD COLUMN IF NOT EXISTS alterado_em TIMESTAMP DEFAULT NOW()';
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.nome_tabela) || ' ADD COLUMN IF NOT EXISTS favorito    BOOLEAN   DEFAULT FALSE';
      END LOOP;
    END $$;
  `).catch(() => {})

  // Migra colunas sequenciais antigas (INTEGER) para VARCHAR(50)
  await query(`
    DO $$
    DECLARE rec RECORD;
    BEGIN
      FOR rec IN
        SELECT t.nome_tabela, c.nome_campo
        FROM kr_tela_campos c
        JOIN kr_telas t ON t.id = c.tela_id
        WHERE c.sequencial = TRUE AND c.ativo = TRUE
          AND EXISTS (
            SELECT 1 FROM information_schema.columns ic
            WHERE ic.table_schema = 'public'
              AND ic.table_name   = t.nome_tabela
              AND ic.column_name  = c.nome_campo
              AND ic.data_type IN ('integer','bigint','smallint')
          )
      LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.nome_tabela)
             || ' ALTER COLUMN ' || quote_ident(rec.nome_campo)
             || ' TYPE VARCHAR(50) USING ' || quote_ident(rec.nome_campo) || '::TEXT';
      END LOOP;
    END $$;
  `).catch(() => {})
}

// ── Migração 2 — remove campo cliente_id da agenda ───────────────────────────
async function migration2() {
  await query(`
    ALTER TABLE age_001 DROP COLUMN IF EXISTS cliente_id
  `).catch(() => {})
}

// ── Inicialização principal ───────────────────────────────────────────────────
export async function initDb() {
  // Única DDL incondicional: tabela de controle de versão
  await query(`
    CREATE TABLE IF NOT EXISTS kr_schema_version (
      singleton  BOOLEAN  PRIMARY KEY DEFAULT TRUE,
      v          INTEGER  NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `)
  await query(`
    INSERT INTO kr_schema_version (singleton, v)
    VALUES (TRUE, 0)
    ON CONFLICT (singleton) DO NOTHING
  `)

  const row = await queryOne('SELECT v FROM kr_schema_version LIMIT 1')
  const currentVersion = row?.v ?? 0

  if (currentVersion < SCHEMA_VERSION) {
    if (currentVersion < 1) await migration1()
    if (currentVersion < 2) await migration2()
    await query(
      `UPDATE kr_schema_version SET v=$1, updated_at=NOW()`,
      [SCHEMA_VERSION]
    )
    console.log(`[db] Schema atualizado para versão ${SCHEMA_VERSION}`)
  }

  // Remove constraints problemáticos a cada startup (idempotente)
  await query(`ALTER TABLE kr_tela_campos DROP CONSTRAINT IF EXISTS kr_tela_campos_largura_check`).catch(() => {})

  // Sincroniza sequências a cada startup (protege contra restore de backup)
  await syncSequencias()
}
