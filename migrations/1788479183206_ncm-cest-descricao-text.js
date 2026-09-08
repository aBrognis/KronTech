/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// A NCM oficial tem descricoes de ate ~1.200 caracteres (ex: capitulo 38,
// misturas quimicas). varchar(600) estourava. Passa NCM e CEST para text.

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.alterColumn('ncm_001', 'descricao', { type: 'text' });
  pgm.alterColumn('cest_001', 'descricao', { type: 'text' });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.alterColumn('ncm_001', 'descricao', { type: 'varchar(600)' });
  pgm.alterColumn('cest_001', 'descricao', { type: 'varchar(600)' });
};
