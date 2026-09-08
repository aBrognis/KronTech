/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Tela de Entidade completa (tipo ERP). entidade_001 mantem o nome, ganha
// colunas fiscais/financeiras; + tabelas filhas de contatos e anexos.
// Ver docs/PLANO_TELA_ENTIDADE.md.

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumns('entidade_001', {
    // ── Dados gerais extra ──
    data_nascimento:    { type: 'date' },
    data_fundacao:      { type: 'date' },
    porte:              { type: 'varchar(40)' },
    situacao_cadastral: { type: 'varchar(60)' },
    natureza_juridica_id: { type: 'integer', references: 'natureza_juridica_001', onDelete: 'SET NULL' },
    inscricao_estadual: { type: 'varchar(30)' },   // ie_rg ja existe, mas era generico; este e o campo fiscal
    inscricao_municipal:{ type: 'varchar(30)' },
    cnae:               { type: 'varchar(10)' },
    // ── Fiscal ──
    regime_tributario:  { type: 'varchar(30)' },   // simples | presumido | real | mei
    contribuinte_icms:  { type: 'boolean', notNull: true, default: false },
    optante_simples:    { type: 'boolean', notNull: true, default: false },
    retem_iss:          { type: 'boolean', notNull: true, default: false },
    retem_irrf:         { type: 'boolean', notNull: true, default: false },
    retem_csll:         { type: 'boolean', notNull: true, default: false },
    retem_pis:          { type: 'boolean', notNull: true, default: false },
    retem_cofins:       { type: 'boolean', notNull: true, default: false },
    // ── Financeiro ──
    condicao_pagamento_id: { type: 'integer', references: 'condicao_pagamento_001', onDelete: 'SET NULL' },
    limite_credito:     { type: 'numeric(15,2)', notNull: true, default: 0 },
    dia_vencimento:     { type: 'smallint' },
    banco_id:           { type: 'integer', references: 'banco_001', onDelete: 'SET NULL' },
    agencia:            { type: 'varchar(20)' },
    conta_corrente:     { type: 'varchar(30)' },
    pix_tipo:           { type: 'varchar(15)' },   // cpf_cnpj | email | telefone | aleatoria
    pix_chave:          { type: 'varchar(140)' },
  });

  // ── Contatos ──
  pgm.createTable('entidade_contato_001', {
    id: 'id',
    entidade_id: { type: 'integer', notNull: true, references: 'entidade_001', onDelete: 'CASCADE' },
    nome: { type: 'varchar(150)', notNull: true },
    cargo: { type: 'varchar(80)' },
    setor: { type: 'varchar(80)' },
    telefone: { type: 'varchar(30)' },
    celular: { type: 'varchar(30)' },
    email: { type: 'varchar(150)' },
    data_nascimento: { type: 'date' },
    principal: { type: 'boolean', notNull: true, default: false },
    observacoes: { type: 'text' },
    ativo: { type: 'boolean', notNull: true, default: true },
    criado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    alterado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('entidade_contato_001', 'entidade_id');

  // ── Anexos ──
  pgm.createTable('entidade_anexo_001', {
    id: 'id',
    entidade_id: { type: 'integer', notNull: true, references: 'entidade_001', onDelete: 'CASCADE' },
    nome_original: { type: 'varchar(300)', notNull: true },
    caminho: { type: 'text', notNull: true },
    content_type: { type: 'varchar(120)' },
    tamanho_bytes: { type: 'bigint' },
    categoria: { type: 'varchar(60)' },   // contrato | procuracao | cartao_cnpj | contrato_social | outro
    observacoes: { type: 'text' },
    criado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('entidade_anexo_001', 'entidade_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('entidade_anexo_001');
  pgm.dropTable('entidade_contato_001');
  pgm.dropColumns('entidade_001', [
    'data_nascimento', 'data_fundacao', 'porte', 'situacao_cadastral', 'natureza_juridica_id',
    'inscricao_estadual', 'inscricao_municipal', 'cnae',
    'regime_tributario', 'contribuinte_icms', 'optante_simples',
    'retem_iss', 'retem_irrf', 'retem_csll', 'retem_pis', 'retem_cofins',
    'condicao_pagamento_id', 'limite_credito', 'dia_vencimento',
    'banco_id', 'agencia', 'conta_corrente', 'pix_tipo', 'pix_chave',
  ]);
};
