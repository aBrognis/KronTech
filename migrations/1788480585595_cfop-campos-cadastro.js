/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// cfop_001 vira um cadastro de verdade (tela CFOP), nao so tabela de consulta:
//   aplicacao   texto livre: quando usar este CFOP (ex: "venda dentro do estado")
//   observacao  anotacao interna
//   ativo       permite ocultar CFOPs que a empresa nao usa

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumns('cfop_001', {
    aplicacao: { type: 'text' },
    observacao: { type: 'text' },
    ativo: { type: 'boolean', notNull: true, default: true },
  });
  // descricao curta demais p/ alguns CFOPs -> text
  pgm.alterColumn('cfop_001', 'descricao', { type: 'text' });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropColumns('cfop_001', ['aplicacao', 'observacao', 'ativo']);
  pgm.alterColumn('cfop_001', 'descricao', { type: 'varchar(400)' });
};
