/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Ajustes na entidade_001 apos o primeiro uso da tela nova:
//  - cnae: 10 -> 120 (guarda "codigo - descricao")
//  - porte / situacao_cadastral / regime: folga
//  - agencia / conta_corrente: folga (bancos grandes usam mais digitos)

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.alterColumn('entidade_001', 'cnae', { type: 'varchar(120)' });
  pgm.alterColumn('entidade_001', 'porte', { type: 'varchar(80)' });
  pgm.alterColumn('entidade_001', 'situacao_cadastral', { type: 'varchar(120)' });
  pgm.alterColumn('entidade_001', 'agencia', { type: 'varchar(30)' });
  pgm.alterColumn('entidade_001', 'conta_corrente', { type: 'varchar(40)' });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.alterColumn('entidade_001', 'cnae', { type: 'varchar(10)' });
  pgm.alterColumn('entidade_001', 'porte', { type: 'varchar(40)' });
  pgm.alterColumn('entidade_001', 'situacao_cadastral', { type: 'varchar(60)' });
  pgm.alterColumn('entidade_001', 'agencia', { type: 'varchar(20)' });
  pgm.alterColumn('entidade_001', 'conta_corrente', { type: 'varchar(30)' });
};
