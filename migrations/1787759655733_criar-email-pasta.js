/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('email_pasta_001', {
    id:            'id',
    conta_id:      { type: 'integer', notNull: true, references: 'email_conta_001', onDelete: 'CASCADE' },
    caminho_imap:  { type: 'varchar(500)', notNull: true },
    nome_exibicao: { type: 'varchar(200)', notNull: true },
    special_use:   { type: 'varchar(20)' },
    delimitador:   { type: 'varchar(5)', notNull: true, default: "'/'" },
    sincronizar:   { type: 'boolean', notNull: true, default: true },
    ordem:         { type: 'integer', notNull: true, default: 0 },
    uidvalidity:   { type: 'varchar(50)' },
    criado_em:     { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('email_pasta_001', 'email_pasta_001_conta_caminho_uniq', 'UNIQUE (conta_id, caminho_imap)');
  pgm.createIndex('email_pasta_001', 'conta_id');

  pgm.addColumn('email_mensagem_001', {
    pasta_id: { type: 'integer', references: 'email_pasta_001', onDelete: 'SET NULL' },
  });
  pgm.createIndex('email_mensagem_001', 'pasta_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropColumn('email_mensagem_001', 'pasta_id');
  pgm.dropTable('email_pasta_001');
};
