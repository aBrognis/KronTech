/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Entidade nivel ERP grande: multiplos enderecos/contatos-meio, abas
// Comercial, Credito & Cobranca, Relacionamento (CRM), Vinculos,
// Documentos-com-validade e Auditoria. Ver docs/PLANO_ENTIDADE_COMPLETA.md.

const ts = (pgm) => ({
  criado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  alterado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
});
const fkEnt = { type: 'integer', notNull: true, references: 'entidade_001', onDelete: 'CASCADE' };

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  // ── entidade_001: campos de CRM / grupo ──
  pgm.addColumns('entidade_001', {
    origem:                 { type: 'varchar(40)' },
    segmento:               { type: 'varchar(60)' },
    grupo_economico:        { type: 'varchar(80)' },
    data_primeiro_contato:  { type: 'date' },
  });

  // ── Enderecos ──
  pgm.createTable('entidade_endereco_001', {
    id: 'id',
    entidade_id: fkEnt,
    tipo: { type: 'varchar(15)', notNull: true, default: "'entrega'" },
    descricao: { type: 'varchar(100)' },
    cep: { type: 'varchar(9)' },
    logradouro: { type: 'varchar(200)' },
    numero: { type: 'varchar(20)' },
    complemento: { type: 'varchar(100)' },
    bairro: { type: 'varchar(100)' },
    cidade: { type: 'varchar(120)' },
    uf: { type: 'varchar(2)' },
    municipio_ibge: { type: 'integer' },
    ponto_referencia: { type: 'varchar(150)' },
    principal: { type: 'boolean', notNull: true, default: false },
    ativo: { type: 'boolean', notNull: true, default: true },
    ...ts(pgm),
  });
  pgm.createIndex('entidade_endereco_001', 'entidade_id');

  // ── Meios de contato (telefones/emails da entidade OU de um contato) ──
  pgm.createTable('entidade_contato_meio_001', {
    id: 'id',
    entidade_id: fkEnt,
    contato_id: { type: 'integer', references: 'entidade_contato_001', onDelete: 'CASCADE' },
    tipo: { type: 'varchar(15)', notNull: true, default: "'telefone'" },
    valor: { type: 'varchar(150)', notNull: true },
    ramal: { type: 'varchar(10)' },
    observacao: { type: 'varchar(120)' },
    principal: { type: 'boolean', notNull: true, default: false },
    ...ts(pgm),
  });
  pgm.createIndex('entidade_contato_meio_001', 'entidade_id');
  pgm.createIndex('entidade_contato_meio_001', 'contato_id');

  // ── Comercial (1:1) ──
  pgm.createTable('entidade_comercial_001', {
    id: 'id',
    entidade_id: { ...fkEnt, unique: true },
    vendedor_id: { type: 'integer', references: 'entidade_001', onDelete: 'SET NULL' },
    comprador_id: { type: 'integer', references: 'entidade_001', onDelete: 'SET NULL' },
    tabela_preco: { type: 'varchar(60)' },
    desconto_maximo_perc: { type: 'numeric(6,2)', notNull: true, default: 0 },
    transportadora_id: { type: 'integer', references: 'entidade_001', onDelete: 'SET NULL' },
    frete_padrao: { type: 'varchar(12)' },   // cif | fob | terceiros | sem_frete
    prazo_entrega_dias: { type: 'smallint' },
    pedido_minimo: { type: 'numeric(15,2)', notNull: true, default: 0 },
    regiao: { type: 'varchar(60)' },
    rota_entrega: { type: 'varchar(60)' },
    observacao_comercial: { type: 'text' },
    ...ts(pgm),
  });

  // ── Credito & Cobranca (1:1) ──
  pgm.createTable('entidade_credito_001', {
    id: 'id',
    entidade_id: { ...fkEnt, unique: true },
    score_risco: { type: 'varchar(1)' },        // A..E
    status_credito: { type: 'varchar(12)', notNull: true, default: "'analise'" }, // liberado|analise|bloqueado|suspenso
    limite_credito: { type: 'numeric(15,2)', notNull: true, default: 0 },
    limite_utilizado: { type: 'numeric(15,2)', notNull: true, default: 0 },
    data_ultima_analise: { type: 'date' },
    analista_id: { type: 'integer', references: 'entidade_001', onDelete: 'SET NULL' },
    atraso_medio_dias: { type: 'smallint', notNull: true, default: 0 },
    observacao_credito: { type: 'text' },
    ...ts(pgm),
  });

  pgm.createTable('entidade_credito_hist_001', {
    id: 'id',
    entidade_id: fkEnt,
    data: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    limite_anterior: { type: 'numeric(15,2)' },
    limite_novo: { type: 'numeric(15,2)' },
    motivo: { type: 'varchar(200)' },
    usuario_id: { type: 'integer' },
  });
  pgm.createIndex('entidade_credito_hist_001', 'entidade_id');

  // ── Relacionamento / CRM ──
  pgm.createTable('entidade_interacao_001', {
    id: 'id',
    entidade_id: fkEnt,
    tipo: { type: 'varchar(15)', notNull: true, default: "'nota'" }, // ligacao|email|visita|reuniao|whatsapp|nota
    data_hora: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    titulo: { type: 'varchar(150)' },
    descricao: { type: 'text' },
    usuario_id: { type: 'integer' },
    contato_id: { type: 'integer', references: 'entidade_contato_001', onDelete: 'SET NULL' },
    proximo_contato: { type: 'date' },
    agenda_evento_id: { type: 'integer' },
    resultado: { type: 'varchar(20)' }, // positivo|neutro|negativo|sem_retorno
    criado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('entidade_interacao_001', 'entidade_id');
  pgm.createIndex('entidade_interacao_001', 'data_hora');

  // ── Vinculos entre entidades ──
  pgm.createTable('entidade_vinculo_001', {
    id: 'id',
    entidade_id: fkEnt,
    entidade_rel_id: { type: 'integer', notNull: true, references: 'entidade_001', onDelete: 'CASCADE' },
    tipo: { type: 'varchar(24)', notNull: true }, // matriz|filial|grupo_economico|representante|transportadora_padrao|contato_pf|controladora
    observacao: { type: 'varchar(200)' },
    criado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('entidade_vinculo_001', 'entidade_id');
  pgm.createIndex('entidade_vinculo_001', 'entidade_rel_id');

  // ── Documentos com validade ──
  pgm.createTable('entidade_documento_001', {
    id: 'id',
    entidade_id: fkEnt,
    tipo: { type: 'varchar(30)', notNull: true }, // ie|contrato_social|certidao_fgts|certidao_federal|certidao_estadual|alvara|contrato_comercial|outro
    numero: { type: 'varchar(60)' },
    emissao: { type: 'date' },
    validade: { type: 'date' },
    anexo_id: { type: 'integer', references: 'entidade_anexo_001', onDelete: 'SET NULL' },
    observacao: { type: 'varchar(200)' },
    ...ts(pgm),
  });
  pgm.createIndex('entidade_documento_001', 'entidade_id');
  pgm.createIndex('entidade_documento_001', 'validade');

  // ── Auditoria ──
  pgm.createTable('entidade_log_001', {
    id: 'id',
    entidade_id: { type: 'integer', notNull: true }, // sem FK: log sobrevive a exclusao
    data_hora: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    usuario_id: { type: 'integer' },
    usuario_nome: { type: 'varchar(120)' },
    acao: { type: 'varchar(20)', notNull: true }, // criou|alterou|status|limite|anexo|excluiu
    campo: { type: 'varchar(60)' },
    valor_de: { type: 'text' },
    valor_para: { type: 'text' },
  });
  pgm.createIndex('entidade_log_001', 'entidade_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('entidade_log_001');
  pgm.dropTable('entidade_documento_001');
  pgm.dropTable('entidade_vinculo_001');
  pgm.dropTable('entidade_interacao_001');
  pgm.dropTable('entidade_credito_hist_001');
  pgm.dropTable('entidade_credito_001');
  pgm.dropTable('entidade_comercial_001');
  pgm.dropTable('entidade_contato_meio_001');
  pgm.dropTable('entidade_endereco_001');
  pgm.dropColumns('entidade_001', ['origem', 'segmento', 'grupo_economico', 'data_primeiro_contato']);
};
