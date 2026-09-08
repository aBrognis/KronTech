/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

const PROMPT_ANALISE_ADERENCIA = `Você reformula texto bruto de reunião em um documento formal de "Análise de Aderência" (validação de uma tela/funcionalidade de um sistema ERP). Preencha os campos da ferramenta a partir do texto bruto fornecido pelo usuário, mantendo tom formal e técnico, sem inventar informação que não esteja implícita no texto original.`;

const PROMPT_ATA_TREINAMENTO = `Você reformula texto bruto de reunião em um documento formal de "Ata de Treinamento" (registro de um treinamento de módulo de um sistema ERP). Preencha os campos da ferramenta a partir do texto bruto fornecido pelo usuário, detalhando cada processo abordado com suas aplicações/importância e benefícios, mantendo tom formal e técnico, sem inventar informação que não esteja implícita no texto original.`;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('documento_tipo_001', {
    id:               'id',
    codigo:           { type: 'varchar(50)', notNull: true, unique: true },
    nome:             { type: 'varchar(120)', notNull: true },
    prompt_sistema:   { type: 'text', notNull: true },
    layout_renderer:  { type: 'varchar(50)', notNull: true },
    ativo:            { type: 'boolean', notNull: true, default: true },
    criado_em:        { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTable('documento_gerado_001', {
    id:                   'id',
    documento_tipo_id:    { type: 'integer', notNull: true, references: 'documento_tipo_001', onDelete: 'RESTRICT' },
    titulo:               { type: 'varchar(300)', notNull: true },
    cliente:              { type: 'varchar(200)', notNull: true },
    autor:                { type: 'varchar(200)', notNull: true },
    texto_bruto:          { type: 'text', notNull: true },
    conteudo_estruturado: { type: 'jsonb', notNull: true },
    participantes:        { type: 'jsonb', notNull: true, default: pgm.func("'[]'::jsonb") },
    status:               { type: 'varchar(20)', notNull: true, default: "'rascunho'" },
    pdf_caminho:          { type: 'varchar(500)' },
    criado_por:           { type: 'varchar(200)' },
    criado_em:            { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    atualizado_em:        { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('documento_gerado_001', 'documento_tipo_id');
  pgm.createIndex('documento_gerado_001', 'criado_em');
  pgm.createIndex('documento_gerado_001', 'cliente');

  pgm.sql(`
    INSERT INTO documento_tipo_001 (codigo, nome, layout_renderer, prompt_sistema) VALUES
    ('analise_aderencia', 'Análise de Aderência', 'analise_aderencia', $$${PROMPT_ANALISE_ADERENCIA}$$),
    ('ata_treinamento', 'Ata de Treinamento', 'ata_treinamento', $$${PROMPT_ATA_TREINAMENTO}$$)
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('documento_gerado_001');
  pgm.dropTable('documento_tipo_001');
};
