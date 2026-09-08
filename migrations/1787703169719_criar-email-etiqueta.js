/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('email_etiqueta_001', {
    id:        'id',
    nome:      { type: 'varchar(60)', notNull: true },
    cor:       { type: 'varchar(20)', notNull: true, default: "'#94a3b8'" },
    ordem:     { type: 'integer', notNull: true, default: 0 },
    criado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('email_etiqueta_001', 'email_etiqueta_001_nome_uniq', 'UNIQUE (nome)');

  pgm.createTable('email_mensagem_etiqueta_001', {
    mensagem_id: { type: 'integer', notNull: true, references: 'email_mensagem_001', onDelete: 'CASCADE' },
    etiqueta_id: { type: 'integer', notNull: true, references: 'email_etiqueta_001', onDelete: 'CASCADE' },
    criado_em:   { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('email_mensagem_etiqueta_001', 'email_mensagem_etiqueta_001_pk', 'PRIMARY KEY (mensagem_id, etiqueta_id)');
  pgm.createIndex('email_mensagem_etiqueta_001', 'etiqueta_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('email_mensagem_etiqueta_001');
  pgm.dropTable('email_etiqueta_001');
};
