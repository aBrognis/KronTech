/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Historico de geracoes por IA de um documento — estilo Cofre de Senhas.
// Cada vez que o usuario clica "Gerar" na aba Cadastro, a versao ANTERIOR
// (se houver) e empilhada aqui antes de ser substituida. Guarda o
// conteudo_estruturado completo (jsonb) + o texto bruto que a originou,
// pra dar pra copiar/comparar depois. Nao afeta o PDF (que sempre usa o
// conteudo_estruturado atual em documento_gerado_001).

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable('documento_gerado_historico_001', {
    id:                   'id',
    documento_id:         { type: 'integer', notNull: true, references: 'documento_gerado_001', onDelete: 'CASCADE' },
    texto_bruto:          { type: 'text' },
    conteudo_estruturado: { type: 'jsonb', notNull: true },
    origem:               { type: 'varchar(20)', notNull: true, default: "'geracao'" }, // geracao | edicao_manual
    criado_em:            { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('documento_gerado_historico_001', ['documento_id', 'criado_em']);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('documento_gerado_historico_001');
};
