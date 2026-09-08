/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Remocao do modulo fiscal v2 (base parametrizavel). O usuario avaliou a
// interface e decidiu tirar o modulo fiscal do KronTech por enquanto.
//
// Nada aqui depende de outras tabelas; dropar e seguro. Se um dia voltar,
// rodar de novo a migration 1788482037583.

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.sql('DROP TABLE IF EXISTS fiscal_api_log CASCADE');
  pgm.sql('DROP TABLE IF EXISTS fiscal_regra CASCADE');
  pgm.sql('DROP TABLE IF EXISTS fiscal_tabela_ref CASCADE');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = () => {
  // sem reversao automatica
};
