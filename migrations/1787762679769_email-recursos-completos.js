/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.addColumn('email_mensagem_001', {
    sinalizada: { type: 'boolean', notNull: true, default: false },
    copia_oculta: { type: 'jsonb', notNull: true, default: pgm.func("'[]'::jsonb") },
    rascunho: { type: 'boolean', notNull: true, default: false },
  });
  pgm.createIndex('email_mensagem_001', ['conta_id', 'sinalizada']);
  pgm.createIndex('email_mensagem_001', ['conta_id', 'rascunho']);

  pgm.addColumn('email_conta_001', {
    reply_to: { type: 'varchar(320)' },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropColumn('email_conta_001', ['reply_to']);
  pgm.dropColumn('email_mensagem_001', ['sinalizada', 'copia_oculta', 'rascunho']);
};
