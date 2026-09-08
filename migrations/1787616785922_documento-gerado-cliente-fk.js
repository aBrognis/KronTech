/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Cliente passa a vincular entidade_001 (mesmo padrão de despesa_001:
  // cliente_id FK + cliente_nome denormalizado, evita join na listagem).
  // A coluna "cliente" (texto livre) existente vira o denormalizado.
  pgm.renameColumn('documento_gerado_001', 'cliente', 'cliente_nome');
  pgm.addColumn('documento_gerado_001', {
    cliente_id: { type: 'integer' },
  });
  pgm.createIndex('documento_gerado_001', 'cliente_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropColumn('documento_gerado_001', 'cliente_id');
  pgm.renameColumn('documento_gerado_001', 'cliente_nome', 'cliente');
};
