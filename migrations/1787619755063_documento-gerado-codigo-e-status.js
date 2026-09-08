/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Código sequencial — mesmo padrão de despesa_001 (nextval + padStart 4
  // dígitos no backend, não no banco).
  pgm.sql(`CREATE SEQUENCE IF NOT EXISTS documento_gerado_001_codigo_seq START 1`);
  pgm.addColumn('documento_gerado_001', {
    codigo: { type: 'varchar(10)' },
    nome_referencia: { type: 'varchar(300)' },
  });

  // status hoje é 'rascunho' | 'finalizado' — expande pro fluxo real de
  // controle documental, mesmo conceito de STATUS_ORDEM de despesa_001.
  pgm.sql(`UPDATE documento_gerado_001 SET status = 'rascunho' WHERE status NOT IN ('rascunho')`);
  pgm.alterColumn('documento_gerado_001', 'status', { default: "'rascunho'" });

  pgm.createIndex('documento_gerado_001', 'codigo', { unique: true, where: 'codigo IS NOT NULL' });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropColumn('documento_gerado_001', ['codigo', 'nome_referencia']);
  pgm.sql(`DROP SEQUENCE IF EXISTS documento_gerado_001_codigo_seq`);
};
