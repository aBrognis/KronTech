/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// entidade_001.papeis era varchar(100). Com o formato novo (palavras
// separadas por virgula) e 5 papeis, o valor cheio da 57 chars — cabe, mas
// sem folga para novos papeis, e o valor legado corrompido chegou a bater no
// limite e ser truncado no meio de uma palavra. Passa para varchar(255).

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.alterColumn('entidade_001', 'papeis', { type: 'varchar(255)' });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.alterColumn('entidade_001', 'papeis', { type: 'varchar(100)' });
};
