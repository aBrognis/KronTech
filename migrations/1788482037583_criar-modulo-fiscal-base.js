/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// ─────────────────────────────────────────────────────────────────────────────
// Modulo Fiscal — BASE PARAMETRIZAVEL (Reforma Tributaria EC 132/2023).
//
// Tres tabelas, seguindo a orientacao tecnica:
//   fiscal_tabela_ref  cache local unificado das tabelas oficiais (NCM, CEST,
//                      CFOP, cClassTrib, aliquotas IBS por UF/municipio).
//                      Alimentado por arquivo/API, nunca digitado a mao.
//   fiscal_regra       REGRA_FISCAL: por NCM + CFOP + UF origem/destino + data
//                      de vigencia, define aliquotas e tratamento tributario
//                      (checkboxes). E o coracao do calculo fiscal.
//   fiscal_api_log     toda chamada a API externa (CNPJ, CEP, ...) com JSON
//                      bruto + status, para auditoria.
//
// Cronograma da reforma NAO fica em codigo: cada regra tem vigencia_de/ate.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  // ── 1. Cache de tabelas oficiais de referencia ───────────────────────────
  pgm.createTable('fiscal_tabela_ref', {
    id: 'id',
    tipo_tabela: { type: 'varchar(20)', notNull: true }, // NCM | CEST | CFOP | CCLASSTRIB | ALIQ_IBS_UF | ALIQ_IBS_MUN
    codigo: { type: 'varchar(20)', notNull: true },
    descricao: { type: 'text' },
    valor_numerico: { type: 'numeric(9,4)' }, // aliquota, quando o tipo for ALIQ_*
    dados_extra: { type: 'jsonb' }, // campos especificos do tipo (ex: NCM -> {ipi, tipo}; CFOP -> {tipo, grupo})
    origem: { type: 'varchar(10)', notNull: true, default: 'oficial' }, // oficial | manual
    dt_atualizacao: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('fiscal_tabela_ref', 'fiscal_tabela_ref_uk', { unique: ['tipo_tabela', 'codigo'] });
  pgm.sql(`CREATE INDEX fiscal_tabela_ref_busca_idx ON fiscal_tabela_ref (tipo_tabela, codigo varchar_pattern_ops)`);

  // ── 2. Regra fiscal por vigencia ────────────────────────────────────────
  pgm.createTable('fiscal_regra', {
    id: 'id',
    codigo: { type: 'varchar(10)' }, // sequencial legivel, gerado no service
    descricao: { type: 'varchar(160)', notNull: true },

    // ── chave de aplicacao (o que casa a regra com o item) ──
    ncm: { type: 'varchar(10)' }, // vazio = qualquer NCM
    cest: { type: 'varchar(10)' },
    cfop: { type: 'varchar(10)' }, // vazio = qualquer CFOP
    uf_origem: { type: 'char(2)' }, // vazio = qualquer UF
    uf_destino: { type: 'char(2)' },
    vigencia_de: { type: 'date', notNull: true },
    vigencia_ate: { type: 'date' }, // nulo = sem fim

    // ── tratamento tributario (os checkboxes da tela) ──
    trib_integral: { type: 'boolean', notNull: true, default: true },
    reducao_aliquota: { type: 'boolean', notNull: true, default: false },
    reducao_percentual: { type: 'numeric(9,4)', default: 0 }, // % de reducao aplicado
    isencao: { type: 'boolean', notNull: true, default: false },
    imunidade: { type: 'boolean', notNull: true, default: false },
    diferimento: { type: 'boolean', notNull: true, default: false },
    credito_presumido: { type: 'boolean', notNull: true, default: false },
    credito_presumido_perc: { type: 'numeric(9,4)', default: 0 },
    credito_presumido_fundamento: { type: 'varchar(200)' },
    monofasia: { type: 'boolean', notNull: true, default: false },
    split_payment: { type: 'boolean', notNull: true, default: false },
    simples_nacional: { type: 'boolean', notNull: true, default: false },
    compra_governamental: { type: 'boolean', notNull: true, default: false },

    // ── codigo de classificacao tributaria da reforma ──
    cclass_trib: { type: 'varchar(10)' }, // sugerido pelo conjunto de checkboxes, editavel

    // ── aliquotas (habilitadas conforme os checkboxes) ──
    aliq_ibs_uf: { type: 'numeric(9,4)', notNull: true, default: 0 },
    aliq_ibs_mun: { type: 'numeric(9,4)', notNull: true, default: 0 },
    aliq_cbs: { type: 'numeric(9,4)', notNull: true, default: 0 },
    aliq_is: { type: 'numeric(9,4)', notNull: true, default: 0 },
    perc_icms_residual: { type: 'numeric(9,4)', notNull: true, default: 0 }, // ICMS que ainda incide na transicao
    perc_iss_residual: { type: 'numeric(9,4)', notNull: true, default: 0 },

    observacao: { type: 'varchar(500)' },
    ativo: { type: 'boolean', notNull: true, default: true },
    criado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    alterado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('fiscal_regra', ['ncm']);
  pgm.createIndex('fiscal_regra', ['cfop']);
  pgm.createIndex('fiscal_regra', ['ativo']);

  // ── 3. Log de chamadas a APIs externas ─────────────────────────────────
  pgm.createTable('fiscal_api_log', {
    id: 'id',
    tipo_consulta: { type: 'varchar(30)', notNull: true }, // CNPJ | CEP | NCM | CCLASSTRIB | ALIQUOTA_IBS
    chave_consulta: { type: 'varchar(120)', notNull: true },
    status_http: { type: 'integer' },
    retorno_json: { type: 'jsonb' },
    erro: { type: 'text' },
    origem_tela: { type: 'varchar(50)' },
    duracao_ms: { type: 'integer' },
    dt_consulta: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('fiscal_api_log', ['tipo_consulta', 'chave_consulta']);
  pgm.createIndex('fiscal_api_log', ['dt_consulta']);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('fiscal_api_log');
  pgm.dropTable('fiscal_regra');
  pgm.dropTable('fiscal_tabela_ref');
};
