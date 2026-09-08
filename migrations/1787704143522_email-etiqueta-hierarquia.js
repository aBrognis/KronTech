/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Arvore de profundidade livre via auto-referencia: uma etiqueta "pasta"
  // (ex: Negociacao) agrupa subetiquetas (ex: Em andamento, Fechado), que
  // por sua vez podem ter suas proprias subetiquetas, sem limite de niveis.
  // O nome deixa de ser globalmente unico (duas pastas diferentes podem ter
  // uma subetiqueta "Fechado" cada) — a unicidade passa a ser por irmaos.
  pgm.dropConstraint('email_etiqueta_001', 'email_etiqueta_001_nome_uniq');
  pgm.addColumn('email_etiqueta_001', {
    parent_id: { type: 'integer', references: 'email_etiqueta_001', onDelete: 'CASCADE' },
  });
  pgm.createIndex('email_etiqueta_001', 'parent_id');
  pgm.addConstraint('email_etiqueta_001', 'email_etiqueta_001_parent_nome_uniq',
    'UNIQUE NULLS NOT DISTINCT (parent_id, nome)');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropConstraint('email_etiqueta_001', 'email_etiqueta_001_parent_nome_uniq');
  pgm.dropColumn('email_etiqueta_001', 'parent_id');
  pgm.addConstraint('email_etiqueta_001', 'email_etiqueta_001_nome_uniq', 'UNIQUE (nome)');
};
