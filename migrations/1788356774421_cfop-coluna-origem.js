/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// cfop_001 nasceu antes das demais tabelas fiscais; ganha a coluna `origem`
// ('oficial' | 'manual') para o botao "Importar / Atualizar" nao sobrescrever
// linha editada pelo usuario — mesmo padrao de ncm_001, cest_001, etc.

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumns('cfop_001', {
    origem: { type: 'varchar(10)', notNull: true, default: 'oficial' },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropColumns('cfop_001', ['origem']);
};
