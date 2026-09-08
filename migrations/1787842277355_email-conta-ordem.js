/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Ordem manual das contas de e-mail na barra lateral. Ate agora a lista
// vinha ordenada por nome; o usuario quer definir a posicao (arrastar /
// setas). A ordenacao efetiva na UI e por (provedor, ordem, nome) — o
// agrupamento por provedor vem primeiro, a ordem manual desempata dentro
// do grupo. Contas ja existentes recebem ordem sequencial pelo nome atual
// dentro de cada provedor, preservando o que se ve hoje.

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumn('email_conta_001', {
    ordem: { type: 'integer', notNull: true, default: 0 },
  });
  pgm.sql(`
    UPDATE email_conta_001 c
    SET ordem = sub.rn
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY provedor ORDER BY nome, id) AS rn
      FROM email_conta_001
    ) sub
    WHERE sub.id = c.id
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropColumn('email_conta_001', 'ordem');
};
