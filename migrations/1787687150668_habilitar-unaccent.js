/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Habilita a extensão unaccent do Postgres — usada na busca de e-mails
// (e outras buscas futuras) pra ignorar acentuação: "relatorio" deve
// encontrar "Relatório", "Relatorios", "relatórios" etc.
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createExtension('unaccent', { ifNotExists: true });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropExtension('unaccent');
};
