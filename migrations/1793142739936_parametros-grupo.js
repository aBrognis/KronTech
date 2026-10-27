/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// kr_parametros_001 ganha hierarquia de 2 niveis: `grupo` (ex: "Sistema",
// "Integracoes") agrupando varias `categoria` (ex: "Agenda", "WhatsApp",
// "E-mail") - pedido do usuario ao ver a tela pela 1a vez: categorias soltas
// uma embaixo da outra ficavam sem organizacao.

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumn('kr_parametros_001', {
    grupo: { type: 'varchar(40)', notNull: true, default: 'Sistema' },
  });
  pgm.sql(`
    UPDATE kr_parametros_001 SET grupo = 'Integrações'
    WHERE categoria IN ('Agenda', 'WhatsApp', 'E-mail')
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropColumn('kr_parametros_001', 'grupo');
};
