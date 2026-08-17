import { Pool, types } from 'pg'
import bcrypt from 'bcrypt'
import { getDecryptedBancoConfig } from './config'

// Sem isso, o driver 'pg' devolve colunas DATE como objeto Date do JS (não
// string), o que quebra qualquer formatação de data no frontend que espere
// 'YYYY-MM-DD' (ex: fmtDataBR fazendo String(date).slice(0,10) vira
// "Sat Aug 01" em vez de "2026-08-01"). Fixa em toda conexão do pool, de
// uma vez, em vez de cada tela se defender individualmente.
types.setTypeParser(types.builtins.DATE, val => val)

let pool = null

export function getPool() {
  if (!pool) {
    const banco = getDecryptedBancoConfig()
    const isRemote = banco.host !== 'localhost' && banco.host !== '127.0.0.1'
    pool = new Pool({
      host:     banco.host,
      port:     banco.port,
      database: banco.database,
      user:     banco.user,
      password: banco.password,
      ssl:      isRemote ? { rejectUnauthorized: false } : false,
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
  for (const tbl of ['arq_001']) {
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
    `).catch(e => console.warn(`[migration] syncSequencias(${tbl}):`, e.message))
  }
}

// Pré-registra ou atualiza uma tela de sistema no banco (idempotente)
async function registrarTelaSistema({ slug, nomeTela, nomeTabela, icone, moduloSlug, campos }) {
  const modulo = await queryOne('SELECT id FROM kr_modulos_001 WHERE nome=$1', [moduloSlug]).catch(e => { console.warn('[migration] buscar módulo:', e.message); return null })
  const moduloId = modulo?.id || null

  let existing = await queryOne(
    `SELECT id, slug FROM kr_telas_001 WHERE slug=$1 OR nome_tabela=$2 LIMIT 1`,
    [slug, nomeTabela]
  ).catch(e => { console.warn('[migration] buscar tela existente:', e.message); return null })

  let telaId = existing?.id

  if (!telaId) {
    const row = await queryOne(
      `INSERT INTO kr_telas_001 (nome_tela, nome_tabela, icone, modulo_id, sistema, slug, ativo)
       VALUES ($1,$2,$3,$4,TRUE,$5,TRUE) RETURNING id`,
      [nomeTela, nomeTabela, icone, moduloId, slug]
    ).catch(e => { console.warn('[migration] inserir tela de sistema:', e.message); return null })
    telaId = row?.id
    if (!telaId) {
      const fallback = await queryOne('SELECT id FROM kr_telas_001 WHERE nome_tabela=$1', [nomeTabela]).catch(e => { console.warn('[migration] fallback buscar tela:', e.message); return null })
      telaId = fallback?.id
    }
  }

  if (!telaId) return

  await query(
    `UPDATE kr_telas_001 SET slug=$1, sistema=TRUE, icone=$2, modulo_id=$3
     WHERE id=$4 AND (slug IS NULL OR slug != $1)`,
    [slug, icone, moduloId, telaId]
  ).catch(e => console.warn('[migration] atualizar tela de sistema:', e.message))

  for (const [idx, c] of campos.entries()) {
    const exists = await queryOne(
      'SELECT id FROM kr_tela_campos_001 WHERE tela_id=$1 AND nome_campo=$2',
      [telaId, c.nome]
    ).catch(e => { console.warn('[migration] verificar campo existente:', e.message); return null })
    if (!exists) {
      await query(
        `INSERT INTO kr_tela_campos_001
           (tela_id,nome_campo,label,tipo,tamanho,obrigatorio,sequencial,campo_busca,valor_padrao,ordem,largura,x_pos,y_pos,w_px,h_px)
         VALUES ($1,$2,$3,$4,100,FALSE,FALSE,FALSE,NULL,$5,50,$6,$7,$8,$9)`,
        [telaId, c.nome, c.label, c.tipo, idx + 1, c.x, c.y, c.w, c.h]
      ).catch(e => console.warn('[migration] inserir campo de tela:', e.message))
    }
  }
}

// ── Migração 1 ───────────────────────────────────────────────────────────────
async function migration1() {

  // ── Remove tabelas legadas que não devem mais existir como tabelas de sistema
  // CASCADE remove FKs dependentes (ex: age_001.cliente_id, os_001.cliente_id)
  await query(`DROP TABLE IF EXISTS os_001       CASCADE`).catch(e => console.warn('[migration] drop os_001:', e.message))
  await query(`DROP TABLE IF EXISTS clientes_001 CASCADE`).catch(e => console.warn('[migration] drop clientes_001:', e.message))
  await query(`DROP TABLE IF EXISTS solucoes_001 CASCADE`).catch(e => console.warn('[migration] drop solucoes_001:', e.message))
  await query(`DROP TABLE IF EXISTS scr_001      CASCADE`).catch(e => console.warn('[migration] drop scr_001:', e.message))
  await query(`DROP TABLE IF EXISTS rel_001      CASCADE`).catch(e => console.warn('[migration] drop rel_001:', e.message))

  // ── Tabelas de sistema ────────────────────────────────────────────────────

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
  ]) { await query(col).catch(e => console.warn('[migration] alter dash_001:', e.message)) }

  // ── Criador de Telas ──────────────────────────────────────────────────────

  await query(`
    CREATE TABLE IF NOT EXISTS kr_modulos_001 (
      id    SERIAL PRIMARY KEY,
      nome  VARCHAR(100) NOT NULL,
      icone VARCHAR(80)  DEFAULT 'folder',
      ordem INTEGER      DEFAULT 99,
      ativo BOOLEAN      DEFAULT TRUE
    )
  `)
  await query(`
    DELETE FROM kr_modulos_001
    WHERE id NOT IN (SELECT MIN(id) FROM kr_modulos_001 GROUP BY nome)
  `).catch(e => console.warn('[migration] deduplicar kr_modulos_001:', e.message))
  await query(`
    ALTER TABLE kr_modulos_001 ADD CONSTRAINT kr_modulos_nome_unique UNIQUE (nome)
  `).catch(e => console.warn('[migration] constraint unique kr_modulos_001:', e.message))
  await query(`
    INSERT INTO kr_modulos_001 (nome, icone, ordem)
    SELECT v.nome, v.icone, v.ordem FROM (VALUES
      ('Ferramentas', 'wrench',      1),
      ('Cadastros',   'database',    2),
      ('Financeiro',  'dollar-sign', 3),
      ('Estoque',     'package',     4),
      ('Relatórios',  'bar-chart-2', 5),
      ('Gestão',      'layout',      6)
    ) AS v(nome, icone, ordem)
    WHERE NOT EXISTS (SELECT 1 FROM kr_modulos_001)
  `).catch(e => console.warn('[migration] seed kr_modulos_001:', e.message))

  await query(`
    CREATE TABLE IF NOT EXISTS kr_telas_001 (
      id             SERIAL PRIMARY KEY,
      nome_tela      VARCHAR(100) NOT NULL,
      nome_tabela    VARCHAR(100) NOT NULL UNIQUE,
      descricao      TEXT,
      icone          VARCHAR(80)  DEFAULT 'layout',
      modulo_id      INTEGER REFERENCES kr_modulos_001(id) ON DELETE SET NULL,
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
    `ALTER TABLE kr_telas_001 ADD COLUMN IF NOT EXISTS sistema        BOOLEAN  DEFAULT FALSE`,
    `ALTER TABLE kr_telas_001 ADD COLUMN IF NOT EXISTS slug           VARCHAR(50)`,
    `ALTER TABLE kr_telas_001 ADD COLUMN IF NOT EXISTS canvas_w      INTEGER  DEFAULT 780`,
    `ALTER TABLE kr_telas_001 ADD COLUMN IF NOT EXISTS canvas_h      INTEGER  DEFAULT 480`,
    `ALTER TABLE kr_telas_001 ADD COLUMN IF NOT EXISTS col_favorito   BOOLEAN DEFAULT TRUE`,
    `ALTER TABLE kr_telas_001 ADD COLUMN IF NOT EXISTS col_timestamps BOOLEAN DEFAULT TRUE`,
  ]) { await query(col).catch(e => console.warn('[migration] alter kr_telas_001:', e.message)) }

  await query(`
    CREATE TABLE IF NOT EXISTS kr_tela_campos_001 (
      id           SERIAL PRIMARY KEY,
      tela_id      INTEGER      NOT NULL REFERENCES kr_telas_001(id) ON DELETE CASCADE,
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
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS x_pos    INTEGER DEFAULT 0`,
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS y_pos    INTEGER DEFAULT 0`,
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS w_px     INTEGER DEFAULT 280`,
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS h_px     INTEGER DEFAULT 60`,
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS opcoes      JSONB`,
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS copiavel   BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS sem_negrito    BOOLEAN  DEFAULT FALSE`,
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS font_size      SMALLINT DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS input_negrito  BOOLEAN  DEFAULT FALSE`,
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS input_font_size SMALLINT DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS label_cor      VARCHAR(20)  DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS input_align    VARCHAR(10)  DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS input_cor      VARCHAR(20)  DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS input_bg       VARCHAR(20)  DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS border_radius  SMALLINT     DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS border_width   SMALLINT     DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS border_color   VARCHAR(20)  DEFAULT NULL`,
    `ALTER TABLE kr_tela_campos_001 ADD COLUMN IF NOT EXISTS opcoes_layout  VARCHAR(10)  DEFAULT NULL`,
  ]) { await query(col).catch(e => console.warn('[migration] alter kr_tela_campos_001:', e.message)) }
  await query(`
    ALTER TABLE kr_tela_campos_001 DROP CONSTRAINT IF EXISTS kr_tela_campos_tipo_check
  `).catch(e => console.warn('[migration] drop constraint tipo_check:', e.message))
  await query(`
    ALTER TABLE kr_tela_campos_001 DROP CONSTRAINT IF EXISTS kr_tela_campos_largura_check
  `).catch(e => console.warn('[migration] drop constraint largura_check:', e.message))

  // ── Tabela de usuários ────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS kr_usuarios_001 (
      id          SERIAL PRIMARY KEY,
      usuario     VARCHAR(60)  NOT NULL UNIQUE,
      nome        VARCHAR(120) NOT NULL,
      senha_hash  TEXT         NOT NULL,
      perfil      VARCHAR(30)  DEFAULT 'usuario',
      ativo       BOOLEAN      DEFAULT TRUE,
      criado_em   TIMESTAMP    DEFAULT NOW(),
      alterado_em TIMESTAMP    DEFAULT NOW()
    )
  `).catch(e => console.warn('[migration] criar tabela kr_usuarios_001:', e.message))
  await query(`
    INSERT INTO kr_usuarios_001 (usuario, nome, senha_hash, perfil)
    VALUES ('admin', 'Administrador', $1, 'admin')
    ON CONFLICT (usuario) DO NOTHING
  `, [bcrypt.hashSync('admin', 10)]).catch(e => console.warn('[migration] insert admin:', e.message))

  // Migração: bancos existentes tinham senha_hash='admin' em texto plano — re-grava com hash
  await query(
    `UPDATE kr_usuarios_001 SET senha_hash = $1 WHERE usuario = 'admin' AND senha_hash = 'admin'`,
    [bcrypt.hashSync('admin', 10)]
  ).catch(e => console.warn('[migration] rehash admin legado:', e.message))

  // ── Sequências para tabelas de sistema (após todos os CREATE TABLE) ────────
  for (const tbl of ['arq_001']) {
    await query(`ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS codigo VARCHAR(10) DEFAULT ''`).catch(e => console.warn(`[migration] alter ${tbl} coluna codigo:`, e.message))
    await query(`CREATE SEQUENCE IF NOT EXISTS ${tbl}_codigo_seq START 1`).catch(e => console.warn(`[migration] criar sequência ${tbl}:`, e.message))
  }
}

// ── Funções PostgreSQL (roda sempre, idempotente via CREATE OR REPLACE) ──────
// Extraída de migration1() porque migration1 só executa uma vez por banco
// (currentVersion < 1); se essas funções ficassem lá dentro, um rename de
// tabela posterior nunca as recriaria com os nomes atualizados — o corpo da
// função ficaria com o SQL antigo compilado, quebrando em runtime mesmo com
// o código-fonte já corrigido.
async function criarFuncoesPg() {
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
        WHEN 'documento'   THEN 'VARCHAR(18)'
        WHEN 'cep'         THEN 'VARCHAR(9)'
        WHEN 'select'      THEN 'VARCHAR(200)'
        WHEN 'radio'       THEN 'VARCHAR(200)'
        WHEN 'tags'        THEN 'TEXT'
        WHEN 'avaliacao'   THEN 'SMALLINT'
        WHEN 'codigo_auto' THEN 'VARCHAR(50)'
        WHEN 'lookup'      THEN 'INTEGER'
        WHEN 'data_hora'   THEN 'TIMESTAMP'
        WHEN 'hora'        THEN 'TIME'
        WHEN 'percentual'  THEN 'NUMERIC(6,2)'
        WHEN 'cpf'         THEN 'VARCHAR(14)'
        WHEN 'cnpj'        THEN 'VARCHAR(18)'
        WHEN 'flags'       THEN 'VARCHAR(50)'
        WHEN 'pasta'       THEN 'VARCHAR(200)'
        WHEN 'cor'         THEN 'VARCHAR(7)'
        WHEN 'progresso'   THEN 'SMALLINT'
        WHEN 'calculo'     THEN 'NUMERIC(15,2)'
        ELSE 'VARCHAR(100)'
      END;
    END; $$
  `).catch(e => console.warn('[migration] criar função fn_tipo_para_pg:', e.message))

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
      v_resultado      TEXT;
      v_lookup_tabela  TEXT;
      v_sg_tabela      TEXT;
      v_sg_parent_col  TEXT;
      v_sg_existe      BOOLEAN;
      v_sg_sql         TEXT;
      v_sg_campo       JSONB;
      v_sg_tipo_pg     TEXT;
    BEGIN
      SELECT nome_tabela,
             COALESCE(col_favorito,   TRUE),
             COALESCE(col_timestamps, TRUE)
      INTO   v_nome_tabela, v_col_favorito, v_col_timestamps
      FROM   kr_telas_001 WHERE id = p_tela_id;
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
          SELECT c.* FROM kr_tela_campos_001 c
          WHERE c.tela_id=p_tela_id AND c.ativo=TRUE AND c.sequencial=FALSE AND c.tipo NOT IN ('divisor','sub_grid')
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
        v_resultado := 'ALTERADA: ' || v_nome_tabela;
      ELSE
        v_sql := 'CREATE TABLE ' || quote_ident(v_nome_tabela) || ' (' || chr(10)
              || '  id SERIAL PRIMARY KEY';
        FOR rec IN SELECT * FROM kr_tela_campos_001 WHERE tela_id=p_tela_id AND ativo=TRUE AND tipo NOT IN ('divisor','sub_grid') ORDER BY ordem LOOP
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
        FOR rec IN SELECT nome_campo FROM kr_tela_campos_001 WHERE tela_id=p_tela_id AND campo_busca=TRUE AND ativo=TRUE LOOP
          EXECUTE 'CREATE INDEX IF NOT EXISTS idx_' || v_nome_tabela || '_' || rec.nome_campo
               || ' ON ' || quote_ident(v_nome_tabela) || '(' || quote_ident(rec.nome_campo) || ')';
        END LOOP;
        v_resultado := 'CRIADA: ' || v_nome_tabela;
      END IF;

      -- FK real para campos lookup (roda sempre, tabela nova ou existente).
      -- ON DELETE RESTRICT: nunca deixa apagar um registro referenciado em
      -- outro cadastro. Nome de FK determinístico (fk_<tabela>_<campo>) para
      -- que a EXCEPTION abaixo torne isto idempotente em re-salvamentos.
      FOR rec IN
        SELECT c.nome_campo, c.opcoes FROM kr_tela_campos_001 c
        WHERE c.tela_id=p_tela_id AND c.ativo=TRUE AND c.tipo='lookup'
      LOOP
        v_lookup_tabela := rec.opcoes->>'lookupTabela';
        IF v_lookup_tabela IS NOT NULL AND v_lookup_tabela <> '' THEN
          IF EXISTS (SELECT 1 FROM information_schema.tables
                     WHERE table_schema='public' AND table_name=v_lookup_tabela) THEN
            BEGIN
              EXECUTE 'ALTER TABLE ' || quote_ident(v_nome_tabela)
                   || ' ADD CONSTRAINT ' || quote_ident('fk_' || v_nome_tabela || '_' || rec.nome_campo)
                   || ' FOREIGN KEY (' || quote_ident(rec.nome_campo) || ')'
                   || ' REFERENCES ' || quote_ident(v_lookup_tabela) || '(id) ON DELETE RESTRICT';
            EXCEPTION WHEN duplicate_object THEN NULL;
            END;
          END IF;
          -- ELSE tabela-alvo ainda não existe: pula silenciosamente, a FK é
          -- adicionada na próxima vez que esta tela for salva.
        END IF;
      END LOOP;

      -- Tabelas filhas para campos sub_grid (grade de itens editável, ex:
      -- parcelas de um título). O pai já está garantido acima. Uma tabela
      -- filha por campo sub_grid, sempre com back-reference NOT NULL +
      -- ON DELETE CASCADE (única exceção deliberada ao RESTRICT universal:
      -- linhas filhas não têm existência própria fora do registro pai).
      FOR rec IN
        SELECT c.opcoes FROM kr_tela_campos_001 c
        WHERE c.tela_id=p_tela_id AND c.ativo=TRUE AND c.tipo='sub_grid'
      LOOP
        v_sg_tabela     := rec.opcoes->>'subGridTabela';
        v_sg_parent_col := rec.opcoes->>'subGridParentColuna';
        IF v_sg_tabela IS NOT NULL AND v_sg_tabela <> '' AND v_sg_parent_col IS NOT NULL AND v_sg_parent_col <> '' THEN
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema='public' AND table_name=v_sg_tabela
          ) INTO v_sg_existe;

          IF NOT v_sg_existe THEN
            v_sg_sql := 'CREATE TABLE ' || quote_ident(v_sg_tabela) || ' (' || chr(10)
                     || '  id SERIAL PRIMARY KEY,' || chr(10)
                     || '  ' || quote_ident(v_sg_parent_col) || ' INTEGER NOT NULL REFERENCES '
                             || quote_ident(v_nome_tabela) || '(id) ON DELETE CASCADE';
            FOR v_sg_campo IN SELECT * FROM jsonb_array_elements(COALESCE(rec.opcoes->'subGridCampos','[]'::jsonb)) LOOP
              v_sg_tipo_pg := fn_tipo_para_pg(v_sg_campo->>'tipo', (v_sg_campo->>'tamanho')::INTEGER);
              v_sg_sql := v_sg_sql || ',' || chr(10) || '  ' || quote_ident(v_sg_campo->>'nomeCampo') || ' ' || v_sg_tipo_pg;
              IF (v_sg_campo->>'obrigatorio')::BOOLEAN THEN v_sg_sql := v_sg_sql || ' NOT NULL'; END IF;
            END LOOP;
            v_sg_sql := v_sg_sql || ',' || chr(10) || '  ativo BOOLEAN DEFAULT TRUE'
                     || ',' || chr(10) || '  criado_em TIMESTAMP DEFAULT NOW()'
                     || ',' || chr(10) || '  alterado_em TIMESTAMP DEFAULT NOW()'
                     || chr(10) || ');';
            EXECUTE v_sg_sql;
          ELSE
            FOR v_sg_campo IN SELECT * FROM jsonb_array_elements(COALESCE(rec.opcoes->'subGridCampos','[]'::jsonb)) LOOP
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns ic
                WHERE ic.table_schema='public' AND ic.table_name=v_sg_tabela AND ic.column_name=(v_sg_campo->>'nomeCampo')
              ) THEN
                v_sg_tipo_pg := fn_tipo_para_pg(v_sg_campo->>'tipo', (v_sg_campo->>'tamanho')::INTEGER);
                EXECUTE 'ALTER TABLE ' || quote_ident(v_sg_tabela) || ' ADD COLUMN IF NOT EXISTS '
                     || quote_ident(v_sg_campo->>'nomeCampo') || ' ' || v_sg_tipo_pg;
              END IF;
            END LOOP;
          END IF;
        END IF;
      END LOOP;

      RETURN v_resultado;
    END; $$
  `).catch(e => console.warn('[migration] criar função fn_criar_tabela_usuario:', e.message))

  await query(`
    CREATE OR REPLACE FUNCTION fn_excluir_tabela_usuario(p_tela_id INTEGER)
    RETURNS TEXT LANGUAGE plpgsql AS $$
    DECLARE v_nome_tabela VARCHAR(100);
    BEGIN
      SELECT nome_tabela INTO v_nome_tabela FROM kr_telas_001 WHERE id = p_tela_id;
      IF v_nome_tabela IS NULL THEN RAISE EXCEPTION 'Tela % não encontrada.', p_tela_id; END IF;
      EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(v_nome_tabela) || ' CASCADE';
      DELETE FROM kr_tela_campos_001 WHERE tela_id = p_tela_id;
      DELETE FROM kr_telas_001       WHERE id      = p_tela_id;
      RETURN 'EXCLUIDA: ' || v_nome_tabela;
    END; $$
  `).catch(e => console.warn('[migration] criar função fn_excluir_tabela_usuario:', e.message))
}

async function migration1_limpezas() {
  // ── Limpezas ──────────────────────────────────────────────────────────────

  // Remove telas de sistema do FormBuilder (gerenciadas por páginas dedicadas)
  await query(`
    DELETE FROM kr_tela_campos_001 WHERE tela_id IN (
      SELECT id FROM kr_telas_001 WHERE slug IN ('scripts','agenda') OR nome_tabela IN ('scr_001','age_001')
    )
  `).catch(e => console.warn('[migration] limpar campos de telas de sistema:', e.message))
  await query(`
    DELETE FROM kr_telas_001 WHERE slug IN ('scripts','agenda') OR nome_tabela IN ('scr_001','age_001')
  `).catch(e => console.warn('[migration] limpar telas de sistema:', e.message))

  // Garante ativo+criado_em+alterado_em+favorito em TODAS as tabelas dinâmicas
  await query(`
    DO $$
    DECLARE rec RECORD;
    BEGIN
      FOR rec IN
        SELECT nome_tabela FROM kr_telas_001
        WHERE ativo=TRUE
          AND EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema='public' AND table_name=kr_telas_001.nome_tabela
          )
      LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.nome_tabela) || ' ADD COLUMN IF NOT EXISTS ativo       BOOLEAN   DEFAULT TRUE';
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.nome_tabela) || ' ADD COLUMN IF NOT EXISTS criado_em   TIMESTAMP DEFAULT NOW()';
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.nome_tabela) || ' ADD COLUMN IF NOT EXISTS alterado_em TIMESTAMP DEFAULT NOW()';
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.nome_tabela) || ' ADD COLUMN IF NOT EXISTS favorito    BOOLEAN   DEFAULT FALSE';
      END LOOP;
    END $$;
  `).catch(e => console.warn('[migration] garantir colunas padrão nas tabelas dinâmicas:', e.message))

  // Migra colunas sequenciais antigas (INTEGER) para VARCHAR(50)
  await query(`
    DO $$
    DECLARE rec RECORD;
    BEGIN
      FOR rec IN
        SELECT t.nome_tabela, c.nome_campo
        FROM kr_tela_campos_001 c
        JOIN kr_telas_001 t ON t.id = c.tela_id
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
  `).catch(e => console.warn('[migration] migrar colunas sequenciais para VARCHAR:', e.message))
}

// ── Migração 2 — remove campo cliente_id da agenda ───────────────────────────
async function migration2() {
  await query(`
    ALTER TABLE age_001 DROP COLUMN IF EXISTS cliente_id
  `).catch(e => console.warn('[migration] remover coluna cliente_id de age_001:', e.message))
}

// ── Padronização de nomenclatura: tabela → tabela_001 ─────────────────────────
// Mapa de tabelas de sistema que não seguiam o padrão "_NNN" no final,
// renomeadas de uma vez (RENAME preserva dados/FKs/sequences/índices).
// kr_schema_version fica de fora por ser metadado interno de migração.
const RENAME_TABELAS_NNN = [
  ['agenda_categorias', 'agenda_categorias_001'],
  ['agenda_status_log',  'agenda_status_log_001'],   // renomear antes de agenda_status (prefixo)
  ['agenda_status',      'agenda_status_001'],
  ['agenda_eventos',     'agenda_eventos_001'],
  ['agenda_lembretes',   'agenda_lembretes_001'],
  ['kr_modulos',         'kr_modulos_001'],
  ['kr_tela_campos',     'kr_tela_campos_001'],       // antes de kr_telas (prefixo)
  ['kr_telas',           'kr_telas_001'],
  ['kr_usuarios',        'kr_usuarios_001'],
  ['kr_scripts',         'kr_scripts_001'],
  ['kr_integracoes',     'kr_integracoes_001'],
  ['kr_notificacoes',    'kr_notificacoes_001'],
  ['kr_automacoes',      'kr_automacoes_001'],
  ['kr_agendamentos',    'kr_agendamentos_001'],
  ['kr_fluxos',          'kr_fluxos_001'],
  ['kr_execucoes_log',   'kr_execucoes_log_001'],
  ['kr_demo_vendas',     'kr_demo_vendas_001'],
  ['kr_pesquisas',       'kr_pesquisas_001'],
]

const RENAME_SEQUENCES_NNN = [
  ['agenda_eventos_codigo_seq', 'agenda_eventos_001_codigo_seq'],
]

const RENAME_INDEXES_NNN = [
  ['idx_agenda_lembretes_evento',   'idx_agenda_lembretes_001_evento'],
  ['idx_agenda_status_log_evento',  'idx_agenda_status_log_001_evento'],
  ['idx_agenda_eventos_dt',         'idx_agenda_eventos_001_dt'],
  ['idx_agenda_eventos_grupo',      'idx_agenda_eventos_001_grupo'],
  ['idx_execucoes_log_origem',      'idx_execucoes_log_001_origem'],
]

async function renomearTabelasPadraoNNN() {
  for (const [de, para] of RENAME_TABELAS_NNN) {
    await query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='${de}')
           AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='${para}')
        THEN
          ALTER TABLE ${de} RENAME TO ${para};
        END IF;
      END $$;
    `).catch(e => console.warn(`[migration] rename ${de} -> ${para}:`, e.message))
  }
  for (const [de, para] of RENAME_SEQUENCES_NNN) {
    await query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema='public' AND sequence_name='${de}')
           AND NOT EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema='public' AND sequence_name='${para}')
        THEN
          ALTER SEQUENCE ${de} RENAME TO ${para};
        END IF;
      END $$;
    `).catch(e => console.warn(`[migration] rename sequence ${de} -> ${para}:`, e.message))
  }
  for (const [de, para] of RENAME_INDEXES_NNN) {
    await query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='${de}')
           AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='${para}')
        THEN
          ALTER INDEX ${de} RENAME TO ${para};
        END IF;
      END $$;
    `).catch(e => console.warn(`[migration] rename index ${de} -> ${para}:`, e.message))
  }
  // Corrige SQL persistido como dado em kr_pesquisas_001 (seed anterior
  // referenciava os nomes antigos — sem isso, a busca via lupa quebraria
  // mesmo com o código-fonte já atualizado).
  await query(`
    UPDATE kr_pesquisas_001 SET sql_query = 'SELECT * FROM agenda_categorias_001 WHERE ativo = TRUE'
    WHERE codigo='agenda_categoria' AND sql_query = 'SELECT * FROM agenda_categorias WHERE ativo = TRUE'
  `).catch(() => {})
  await query(`
    UPDATE kr_pesquisas_001 SET sql_query = 'SELECT * FROM agenda_status_001 WHERE ativo = TRUE'
    WHERE codigo='agenda_status' AND sql_query = 'SELECT * FROM agenda_status WHERE ativo = TRUE'
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

  // ── Padronização de nomenclatura: toda tabela de sistema termina em _NNN ──
  // Roda sempre (idempotente), antes de qualquer CREATE TABLE, para que as
  // migrações/queries abaixo já operem com os nomes novos. RENAME preserva
  // dados, FKs, sequences e índices — só o relname muda.
  await renomearTabelasPadraoNNN()

  // Recria as funções PL/pgSQL sempre (idempotente) — necessário para que
  // renames de tabela subsequentes atualizem o corpo compilado das funções.
  await criarFuncoesPg()

  const row = await queryOne('SELECT v FROM kr_schema_version LIMIT 1')
  const currentVersion = row?.v ?? 0

  if (currentVersion < SCHEMA_VERSION) {
    if (currentVersion < 1) { await migration1(); await migration1_limpezas() }
    if (currentVersion < 2) await migration2()
    await query(
      `UPDATE kr_schema_version SET v=$1, updated_at=NOW()`,
      [SCHEMA_VERSION]
    )
    console.log(`[db] Schema atualizado para versão ${SCHEMA_VERSION}`)
  }

  // Colunas adicionadas após bancos existentes já terem passado pela migration
  // versionada acima — precisam rodar sempre (idempotente), não só uma vez.
  await query(`ALTER TABLE kr_telas_001 ADD COLUMN IF NOT EXISTS grupo_fixo VARCHAR(30)`).catch(e => console.warn('[migration] alter kr_telas_001 grupo_fixo (startup):', e.message))

  // age_001 foi substituída por agenda_eventos_001/agenda_categorias_001/agenda_status_001
  // (agora tabelas nativas fixas, ver bloco abaixo); só tinha dados de teste.
  await query(`DROP TABLE IF EXISTS age_001 CASCADE`).catch(e => console.warn('[migration] drop age_001 (startup):', e.message))

  // Agenda nativa (tabelas fixas, criadas sempre - idempotente)
  await query(`
    CREATE TABLE IF NOT EXISTS agenda_categorias_001 (
      id          SERIAL PRIMARY KEY,
      codigo      VARCHAR(10)  DEFAULT '',
      nome        VARCHAR(150) NOT NULL,
      cor         VARCHAR(20)  DEFAULT '#6366F1',
      icone       VARCHAR(50)  DEFAULT '',
      descricao   TEXT         DEFAULT '',
      ativo       BOOLEAN      DEFAULT TRUE,
      criado_em   TIMESTAMP    DEFAULT NOW(),
      alterado_em TIMESTAMP    DEFAULT NOW()
    )
  `).catch(e => console.warn('[migration] create agenda_categorias_001 (startup):', e.message))

  await query(`
    CREATE TABLE IF NOT EXISTS agenda_status_001 (
      id          SERIAL PRIMARY KEY,
      codigo      VARCHAR(10)  DEFAULT '',
      nome        VARCHAR(150) NOT NULL,
      cor         VARCHAR(20)  DEFAULT '#94A3B8',
      ordem       INTEGER      DEFAULT 99,
      icone       VARCHAR(50)  DEFAULT '',
      ativo       BOOLEAN      DEFAULT TRUE,
      criado_em   TIMESTAMP    DEFAULT NOW(),
      alterado_em TIMESTAMP    DEFAULT NOW()
    )
  `).catch(e => console.warn('[migration] create agenda_status_001 (startup):', e.message))

  // ── Monta Pesquisa: pesquisas de "consultar"/lupa configuráveis por SQL ────
  await query(`
    CREATE TABLE IF NOT EXISTS kr_pesquisas_001 (
      id               SERIAL PRIMARY KEY,
      codigo           VARCHAR(80)  UNIQUE NOT NULL,
      nome             VARCHAR(150) NOT NULL,
      sql_query        TEXT         NOT NULL,
      campo_busca      VARCHAR(80),
      colunas_exibidas JSONB,
      mostrar_favorito BOOLEAN      DEFAULT FALSE,
      ativo            BOOLEAN      DEFAULT TRUE,
      criado_em        TIMESTAMP    DEFAULT NOW(),
      atualizado_em    TIMESTAMP    DEFAULT NOW()
    )
  `).catch(e => console.warn('[migration] create kr_pesquisas_001 (startup):', e.message))

  // Seed das pesquisas já usadas hoje pela Agenda — ON CONFLICT preserva
  // qualquer edição que o usuário já tenha feito via tela Monta Pesquisa.
  await query(`
    INSERT INTO kr_pesquisas_001 (codigo, nome, sql_query, campo_busca, colunas_exibidas, mostrar_favorito)
    VALUES
      ('agenda_categoria', 'Categorias da Agenda', 'SELECT * FROM agenda_categorias_001 WHERE ativo = TRUE', 'nome',
        '[{"nome_campo":"nome","label":"Nome"},{"nome_campo":"codigo","label":"Código"}]'::jsonb, FALSE),
      ('agenda_status', 'Status da Agenda', 'SELECT * FROM agenda_status_001 WHERE ativo = TRUE', 'nome',
        '[{"nome_campo":"nome","label":"Nome"},{"nome_campo":"codigo","label":"Código"}]'::jsonb, FALSE),
      ('agenda_cliente', 'Cadastro de Entidade', 'SELECT * FROM entidade_001', 'nome',
        '[{"nome_campo":"nome","label":"Nome / Razão Social"},{"nome_campo":"nome_fantasia","label":"Apelido / Nome Fantasia"},{"nome_campo":"cpf_cnpj","label":"CPF / CNPJ"}]'::jsonb, TRUE)
    ON CONFLICT (codigo) DO NOTHING
  `).catch(e => console.warn('[migration] seed kr_pesquisas_001 (startup):', e.message))

  // Sequencia nativa para o codigo de agenda_eventos_001 (substitui a sequencia
  // que hoje so existe porque o Designer a criava para o template FormBuilder).
  await query(`CREATE SEQUENCE IF NOT EXISTS agenda_eventos_001_codigo_seq`)
    .catch(e => console.warn('[migration] create agenda_eventos_001_codigo_seq (startup):', e.message))

  await query(`
    CREATE TABLE IF NOT EXISTS agenda_eventos_001 (
      id                    SERIAL PRIMARY KEY,
      codigo                VARCHAR(10)  DEFAULT '',
      titulo                VARCHAR(300) NOT NULL,
      categoria_id          INTEGER      REFERENCES agenda_categorias_001(id) ON DELETE SET NULL,
      status_id             INTEGER      REFERENCES agenda_status_001(id)     ON DELETE SET NULL,
      cliente_id            INTEGER,
      dt_evento             DATE         NOT NULL,
      hr_inicio             TIME,
      hr_fim                TIME,
      dia_todo              BOOLEAN      DEFAULT FALSE,
      local                 VARCHAR(300) DEFAULT '',
      descricao             TEXT         DEFAULT '',
      lembrete              BOOLEAN      DEFAULT FALSE,
      min_lembrete          INTEGER      DEFAULT 30,
      recorrencia           VARCHAR(20)  DEFAULT 'nenhuma',
      recorrencia_grupo_id  INTEGER,
      recorrencia_fim       DATE,
      ativo                 BOOLEAN      DEFAULT TRUE,
      criado_em             TIMESTAMP    DEFAULT NOW(),
      alterado_em           TIMESTAMP    DEFAULT NOW()
    )
  `).catch(e => console.warn('[migration] create agenda_eventos_001 (startup):', e.message))

  await query(`
    CREATE TABLE IF NOT EXISTS agenda_lembretes_001 (
      id          SERIAL PRIMARY KEY,
      evento_id   INTEGER NOT NULL REFERENCES agenda_eventos_001(id) ON DELETE CASCADE,
      min_antes   INTEGER NOT NULL,
      criado_em   TIMESTAMP DEFAULT NOW()
    )
  `).catch(e => console.warn('[migration] create agenda_lembretes_001 (startup):', e.message))
  await query(`CREATE INDEX IF NOT EXISTS idx_agenda_lembretes_001_evento ON agenda_lembretes_001(evento_id)`).catch(() => {})

  // Status automático de ciclo de vida do compromisso (controlado pelo sistema,
  // separado do status_id livre/customizável pelo usuário em agenda_status_001).
  await query(`ALTER TABLE agenda_eventos_001 ADD COLUMN IF NOT EXISTS status_auto VARCHAR(20) DEFAULT 'agendado'`)
    .catch(e => console.warn('[migration] alter agenda_eventos_001 status_auto (startup):', e.message))

  await query(`
    CREATE TABLE IF NOT EXISTS agenda_status_log_001 (
      id          SERIAL PRIMARY KEY,
      evento_id   INTEGER NOT NULL REFERENCES agenda_eventos_001(id) ON DELETE CASCADE,
      status_de   VARCHAR(20),
      status_para VARCHAR(20) NOT NULL,
      origem      VARCHAR(20) NOT NULL,
      criado_em   TIMESTAMP DEFAULT NOW()
    )
  `).catch(e => console.warn('[migration] create agenda_status_log_001 (startup):', e.message))
  await query(`CREATE INDEX IF NOT EXISTS idx_agenda_status_log_001_evento ON agenda_status_log_001(evento_id)`).catch(() => {})

  await query(`CREATE INDEX IF NOT EXISTS idx_agenda_eventos_001_dt ON agenda_eventos_001(dt_evento)`).catch(() => {})
  await query(`CREATE INDEX IF NOT EXISTS idx_agenda_eventos_001_grupo ON agenda_eventos_001(recorrencia_grupo_id)`).catch(() => {})

  // Relatório de Despesas de Viagem (cabeçalho + itens, controle de reembolso)
  await query(`
    CREATE TABLE IF NOT EXISTS despesa_001 (
      id                SERIAL PRIMARY KEY,
      consultor_id      INTEGER      NOT NULL,
      consultor_nome    VARCHAR(200) NOT NULL DEFAULT '',
      cliente_id        INTEGER,
      cliente_nome      VARCHAR(200) DEFAULT '',
      data_inicio       DATE         NOT NULL,
      data_fim          DATE         NOT NULL,
      local_partida     VARCHAR(200) DEFAULT '',
      local_destino     VARCHAR(200) DEFAULT '',
      meio_transporte   VARCHAR(100) DEFAULT '',
      status            VARCHAR(20)  NOT NULL DEFAULT 'rascunho',
      observacoes       TEXT         DEFAULT '',
      criado_em         TIMESTAMP    DEFAULT NOW(),
      alterado_em       TIMESTAMP    DEFAULT NOW()
    )
  `).catch(e => console.warn('[migration] create despesa_001 (startup):', e.message))

  await query(`
    CREATE TABLE IF NOT EXISTS despesa_item_001 (
      id              SERIAL PRIMARY KEY,
      despesa_id      INTEGER NOT NULL REFERENCES despesa_001(id) ON DELETE CASCADE,
      data            DATE         NOT NULL,
      descricao       VARCHAR(300) DEFAULT '',
      fornecedor      VARCHAR(200) DEFAULT '',
      qtde            NUMERIC(10,2) NOT NULL DEFAULT 1,
      valor_unitario  NUMERIC(12,2) NOT NULL DEFAULT 0,
      valor           NUMERIC(12,2) NOT NULL DEFAULT 0,
      arquivo_path    VARCHAR(500),
      arquivo_nome    VARCHAR(300),
      arquivo_ext     VARCHAR(20),
      criado_em       TIMESTAMP DEFAULT NOW()
    )
  `).catch(e => console.warn('[migration] create despesa_item_001 (startup):', e.message))

  await query(`CREATE INDEX IF NOT EXISTS idx_despesa_item_001_despesa ON despesa_item_001(despesa_id)`).catch(() => {})
  await query(`CREATE INDEX IF NOT EXISTS idx_despesa_001_status ON despesa_001(status)`).catch(() => {})
  await query(`CREATE INDEX IF NOT EXISTS idx_despesa_001_consultor ON despesa_001(consultor_id)`).catch(() => {})

  // Motor de execução da aba Funções (Scripts/Integrações/Notificações/
  // Automações/Agendamentos/Fluxos) — substitui a persistência antiga em
  // .ini (saveSectionConfig só suporta pares chave=valor simples, corrompia
  // silenciosamente ao receber arrays de objetos).
  await query(`
    CREATE TABLE IF NOT EXISTS kr_scripts_001 (
      id SERIAL PRIMARY KEY, nome VARCHAR(200) NOT NULL, sql_texto TEXT NOT NULL,
      ativo BOOLEAN DEFAULT TRUE, criado_em TIMESTAMP DEFAULT NOW(), alterado_em TIMESTAMP DEFAULT NOW()
    )
  `).catch(e => console.warn('[migration] create kr_scripts_001 (startup):', e.message))

  await query(`
    CREATE TABLE IF NOT EXISTS kr_integracoes_001 (
      id SERIAL PRIMARY KEY, nome VARCHAR(200) NOT NULL,
      url TEXT NOT NULL, metodo VARCHAR(10) DEFAULT 'GET',
      headers JSONB DEFAULT '{}', body TEXT DEFAULT '',
      auth_tipo VARCHAR(20) DEFAULT 'none', auth_token TEXT DEFAULT '', auth_key_header VARCHAR(100) DEFAULT '',
      ativo BOOLEAN DEFAULT TRUE, criado_em TIMESTAMP DEFAULT NOW(), alterado_em TIMESTAMP DEFAULT NOW()
    )
  `).catch(e => console.warn('[migration] create kr_integracoes_001 (startup):', e.message))

  await query(`
    CREATE TABLE IF NOT EXISTS kr_notificacoes_001 (
      id SERIAL PRIMARY KEY, nome VARCHAR(200) NOT NULL, tipo VARCHAR(20) NOT NULL,
      titulo VARCHAR(200) DEFAULT '', mensagem TEXT DEFAULT '', tipo_toast VARCHAR(20) DEFAULT 'info', url TEXT DEFAULT '',
      ativo BOOLEAN DEFAULT TRUE, criado_em TIMESTAMP DEFAULT NOW(), alterado_em TIMESTAMP DEFAULT NOW()
    )
  `).catch(e => console.warn('[migration] create kr_notificacoes_001 (startup):', e.message))

  await query(`
    CREATE TABLE IF NOT EXISTS kr_automacoes_001 (
      id SERIAL PRIMARY KEY, nome VARCHAR(200) NOT NULL,
      trigger_tipo VARCHAR(30) NOT NULL, trigger_campo VARCHAR(100) DEFAULT '', trigger_tabela VARCHAR(100) DEFAULT '',
      condicoes JSONB DEFAULT '[]', acoes JSONB DEFAULT '[]',
      ativo BOOLEAN DEFAULT TRUE, criado_em TIMESTAMP DEFAULT NOW(), alterado_em TIMESTAMP DEFAULT NOW()
    )
  `).catch(e => console.warn('[migration] create kr_automacoes_001 (startup):', e.message))

  await query(`
    CREATE TABLE IF NOT EXISTS kr_agendamentos_001 (
      id SERIAL PRIMARY KEY, nome VARCHAR(200) NOT NULL,
      intervalo VARCHAR(10) NOT NULL, cron VARCHAR(100) DEFAULT '',
      acao JSONB NOT NULL,
      ultima_execucao TIMESTAMP, proxima_execucao TIMESTAMP,
      ativo BOOLEAN DEFAULT TRUE, criado_em TIMESTAMP DEFAULT NOW(), alterado_em TIMESTAMP DEFAULT NOW()
    )
  `).catch(e => console.warn('[migration] create kr_agendamentos_001 (startup):', e.message))

  await query(`
    CREATE TABLE IF NOT EXISTS kr_fluxos_001 (
      id SERIAL PRIMARY KEY, nome VARCHAR(200) NOT NULL, descricao TEXT DEFAULT '',
      gatilho VARCHAR(30) NOT NULL, trigger_tabela VARCHAR(100) DEFAULT '',
      etapas JSONB DEFAULT '[]',
      ativo BOOLEAN DEFAULT TRUE, criado_em TIMESTAMP DEFAULT NOW(), alterado_em TIMESTAMP DEFAULT NOW()
    )
  `).catch(e => console.warn('[migration] create kr_fluxos_001 (startup):', e.message))

  await query(`
    CREATE TABLE IF NOT EXISTS kr_execucoes_log_001 (
      id SERIAL PRIMARY KEY,
      origem_tipo VARCHAR(20) NOT NULL,
      origem_id INTEGER NOT NULL,
      sucesso BOOLEAN NOT NULL, mensagem TEXT DEFAULT '', duracao_ms INTEGER,
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `).catch(e => console.warn('[migration] create kr_execucoes_log_001 (startup):', e.message))
  await query(`CREATE INDEX IF NOT EXISTS idx_execucoes_log_001_origem ON kr_execucoes_log_001(origem_tipo, origem_id)`).catch(() => {})

  // Remove constraints problemáticos a cada startup (idempotente)
  await query(`ALTER TABLE kr_tela_campos_001 DROP CONSTRAINT IF EXISTS kr_tela_campos_largura_check`).catch(e => console.warn('[migration] drop constraint largura_check (startup):', e.message))

  // Tabela de dados demo do Dashboard BI (idempotente, roda sempre)
  await query(`
    CREATE TABLE IF NOT EXISTS kr_demo_vendas_001 (
      id          SERIAL PRIMARY KEY,
      vendedor    VARCHAR(80)   NOT NULL,
      regiao      VARCHAR(40)   NOT NULL,
      produto     VARCHAR(80)   NOT NULL,
      categoria   VARCHAR(40)   NOT NULL,
      canal       VARCHAR(30)   NOT NULL,
      status      VARCHAR(20)   NOT NULL,
      quantidade  INTEGER       NOT NULL DEFAULT 1,
      valor       NUMERIC(12,2) NOT NULL,
      custo       NUMERIC(12,2) NOT NULL,
      avaliacao   SMALLINT,
      data_venda  DATE          NOT NULL,
      criado_em   TIMESTAMP     DEFAULT NOW()
    )
  `).catch(e => console.warn('[migration] create kr_demo_vendas_001 (startup):', e.message))
  await query(`CREATE INDEX IF NOT EXISTS idx_demo_vendas_data ON kr_demo_vendas_001(data_venda)`).catch(() => {})

  // Comparação com período anterior nos widgets do Dashboard (idempotente)
  await query(`ALTER TABLE dash_001 ADD COLUMN IF NOT EXISTS comparar_anterior BOOLEAN DEFAULT FALSE`).catch(e => console.warn('[migration] alter dash_001 comparar_anterior (startup):', e.message))
  await query(`ALTER TABLE dash_001 ADD COLUMN IF NOT EXISTS sql_query_anterior TEXT`).catch(e => console.warn('[migration] alter dash_001 sql_query_anterior (startup):', e.message))

  // Sincroniza sequências a cada startup (protege contra restore de backup)
  await syncSequencias()
}
