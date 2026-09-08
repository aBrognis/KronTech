/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Cadastros de apoio da tela de Entidade / futuro modulo de faturamento.
//   - natureza_juridica_001  (tabela de referencia, societaria — NAO e CFOP)
//   - banco_001 + banco_agencia_001 + banco_convenio_001
//   - condicao_pagamento_001 + condicao_parcela_001 + condicao_forma_001
//
// Natureza de OPERACAO (CFOP) fica FORA daqui — vira modulo proprio junto
// do faturamento (ver docs/PLANO_NATUREZA_OPERACAO_CFOP.md).

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  // ══ Naturezas Juridicas ══════════════════════════════════════════════
  pgm.createTable('natureza_juridica_001', {
    id: 'id',
    codigo: { type: 'varchar(10)', notNull: true, default: "''" },
    codigo_receita: { type: 'varchar(10)' },              // 206-2
    descricao: { type: 'varchar(180)', notNull: true },
    grupo: { type: 'varchar(30)' },                        // empresarial|simples|sem_fins|publico|rural
    tipo_pessoa: { type: 'varchar(4)', notNull: true, default: "'pj'" }, // pj | pf | ambos
    exige_ie: { type: 'boolean', notNull: true, default: true },
    contribuinte_icms_padrao: { type: 'boolean', notNull: true, default: true },
    regime_sugerido: { type: 'varchar(30)' },              // simples|presumido|real|mei
    base_legal: { type: 'text' },
    observacoes: { type: 'text' },
    ativo: { type: 'boolean', notNull: true, default: true },
    criado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    alterado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('natureza_juridica_001', 'descricao');
  pgm.sql(`CREATE SEQUENCE IF NOT EXISTS natureza_juridica_001_codigo_seq START 1`);

  // ══ Bancos ═══════════════════════════════════════════════════════════
  pgm.createTable('banco_001', {
    id: 'id',
    codigo: { type: 'varchar(10)', notNull: true, default: "''" },
    compe: { type: 'varchar(3)' },                         // 341
    ispb: { type: 'varchar(8)' },
    nome: { type: 'varchar(180)', notNull: true },         // nome longo
    nome_curto: { type: 'varchar(60)' },
    tipo: { type: 'varchar(20)' },                         // comercial|cooperativa|fintech|digital|multiplo|desenvolvimento
    site: { type: 'varchar(200)' },
    telefone_sac: { type: 'varchar(30)' },
    pais: { type: 'varchar(60)', notNull: true, default: "'Brasil'" },
    situacao_bacen: { type: 'varchar(20)', notNull: true, default: "'ativo'" }, // ativo|em_liquidacao|extinto
    observacoes: { type: 'text' },
    ativo: { type: 'boolean', notNull: true, default: true },
    criado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    alterado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('banco_001', 'nome');
  pgm.createIndex('banco_001', 'compe');
  pgm.sql(`CREATE SEQUENCE IF NOT EXISTS banco_001_codigo_seq START 1`);

  // Agencias do banco (grid-filho aba Agencias)
  pgm.createTable('banco_agencia_001', {
    id: 'id',
    banco_id: { type: 'integer', notNull: true, references: 'banco_001', onDelete: 'CASCADE' },
    numero: { type: 'varchar(10)', notNull: true },
    digito: { type: 'varchar(2)' },
    nome: { type: 'varchar(150)' },
    telefone: { type: 'varchar(30)' },
    cep: { type: 'varchar(9)' },
    logradouro: { type: 'varchar(200)' },
    numero_end: { type: 'varchar(20)' },
    bairro: { type: 'varchar(100)' },
    cidade: { type: 'varchar(100)' },
    uf: { type: 'varchar(2)' },
    ativo: { type: 'boolean', notNull: true, default: true },
    criado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    alterado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('banco_agencia_001', 'banco_id');

  // Convenios de cobranca — dados da CONTA DA EMPRESA nesse banco, usados
  // pra emitir boleto (grid-filho aba Convenios de Cobranca)
  pgm.createTable('banco_convenio_001', {
    id: 'id',
    banco_id: { type: 'integer', notNull: true, references: 'banco_001', onDelete: 'CASCADE' },
    descricao: { type: 'varchar(150)', notNull: true },    // "Cobranca Bradesco - Matriz"
    agencia: { type: 'varchar(10)' },
    agencia_digito: { type: 'varchar(2)' },
    conta: { type: 'varchar(20)' },
    conta_digito: { type: 'varchar(2)' },
    numero_convenio: { type: 'varchar(30)' },
    carteira: { type: 'varchar(10)' },
    variacao_carteira: { type: 'varchar(10)' },
    cnab: { type: 'varchar(10)', notNull: true, default: "'240'" }, // 240 | 400
    nosso_numero_inicial: { type: 'bigint' },
    nosso_numero_atual: { type: 'bigint' },
    aceite: { type: 'varchar(1)', notNull: true, default: "'N'" },  // A | N
    especie_documento: { type: 'varchar(4)', default: "'DM'" },     // DM, DS, NP...
    multa_percentual: { type: 'numeric(6,2)', notNull: true, default: 0 },
    multa_apos_dias: { type: 'smallint', notNull: true, default: 1 },
    juros_mes_percentual: { type: 'numeric(6,2)', notNull: true, default: 0 },
    dias_protesto: { type: 'smallint' },
    dias_baixa: { type: 'smallint' },
    instrucao1: { type: 'varchar(200)' },
    instrucao2: { type: 'varchar(200)' },
    ativo: { type: 'boolean', notNull: true, default: true },
    criado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    alterado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('banco_convenio_001', 'banco_id');

  // ══ Condicoes de Pagamento ═══════════════════════════════════════════
  pgm.createTable('condicao_pagamento_001', {
    id: 'id',
    codigo: { type: 'varchar(10)', notNull: true, default: "''" },
    descricao: { type: 'varchar(120)', notNull: true },
    tipo: { type: 'varchar(15)', notNull: true, default: "'prazo'" }, // avista | prazo
    // regras de vencimento
    base_prazo: { type: 'varchar(15)', notNull: true, default: "'emissao'" }, // emissao | entrega | aceite
    dias_uteis: { type: 'boolean', notNull: true, default: false },
    empurrar_dia_util: { type: 'boolean', notNull: true, default: true },
    dia_fixo_mes: { type: 'smallint' },                    // se preenchido, todas as parcelas caem nesse dia
    // financeiro
    multa_percentual: { type: 'numeric(6,2)', notNull: true, default: 0 },
    juros_mes_percentual: { type: 'numeric(6,2)', notNull: true, default: 0 },
    desconto_percentual: { type: 'numeric(6,2)', notNull: true, default: 0 },
    desconto_ate_dias: { type: 'smallint', notNull: true, default: 0 },
    acrescimo_parcelamento_percentual: { type: 'numeric(6,2)', notNull: true, default: 0 },
    // restricoes
    valor_minimo: { type: 'numeric(15,2)', notNull: true, default: 0 },
    max_parcelas: { type: 'smallint' },
    papel_permitido: { type: 'varchar(15)' },              // null=todos | cliente | fornecedor
    forma_padrao: { type: 'varchar(20)' },                 // boleto|pix|cartao|transferencia|dinheiro|cheque
    observacoes: { type: 'text' },
    ativo: { type: 'boolean', notNull: true, default: true },
    criado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    alterado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('condicao_pagamento_001', 'descricao');
  pgm.sql(`CREATE SEQUENCE IF NOT EXISTS condicao_pagamento_001_codigo_seq START 1`);

  // Parcelas da condicao (grid-filho): cada linha = dias + % do total
  pgm.createTable('condicao_parcela_001', {
    id: 'id',
    condicao_id: { type: 'integer', notNull: true, references: 'condicao_pagamento_001', onDelete: 'CASCADE' },
    ordem: { type: 'smallint', notNull: true, default: 1 },
    dias: { type: 'smallint', notNull: true, default: 0 },
    percentual: { type: 'numeric(6,2)', notNull: true, default: 100 },
  });
  pgm.createIndex('condicao_parcela_001', 'condicao_id');

  // Formas de pagamento aceitas pela condicao (grid-filho / chips)
  pgm.createTable('condicao_forma_001', {
    id: 'id',
    condicao_id: { type: 'integer', notNull: true, references: 'condicao_pagamento_001', onDelete: 'CASCADE' },
    forma: { type: 'varchar(20)', notNull: true },        // boleto|pix|cartao|transferencia|dinheiro|cheque
  });
  pgm.createIndex('condicao_forma_001', 'condicao_id');

  // ══ Seeds ════════════════════════════════════════════════════════════
  const naturezas = [
    ['206-2', 'SOCIEDADE EMPRESÁRIA LIMITADA', 'empresarial', 'pj', true, true, 'presumido'],
    ['204-6', 'SOCIEDADE ANÔNIMA ABERTA', 'empresarial', 'pj', true, true, 'real'],
    ['205-4', 'SOCIEDADE ANÔNIMA FECHADA', 'empresarial', 'pj', true, true, 'real'],
    ['213-5', 'EMPRESÁRIO (INDIVIDUAL)', 'empresarial', 'pj', true, true, 'simples'],
    ['230-5', 'EMPRESA INDIVIDUAL DE RESP. LIMITADA (NATUREZA EMPRESÁRIA)', 'empresarial', 'pj', true, true, 'presumido'],
    ['231-3', 'EMPRESA INDIVIDUAL DE RESP. LIMITADA (NATUREZA SIMPLES)', 'simples', 'pj', false, false, 'presumido'],
    ['223-2', 'SOCIEDADE SIMPLES PURA', 'simples', 'pj', false, false, 'presumido'],
    ['224-1', 'SOCIEDADE SIMPLES LIMITADA', 'simples', 'pj', false, false, 'presumido'],
    ['214-3', 'COOPERATIVA', 'empresarial', 'pj', true, true, 'real'],
    ['399-9', 'ASSOCIAÇÃO PRIVADA', 'sem_fins', 'pj', false, false, null],
    ['306-9', 'FUNDAÇÃO PRIVADA', 'sem_fins', 'pj', false, false, null],
    ['409-0', 'ORGANIZAÇÃO RELIGIOSA', 'sem_fins', 'pj', false, false, null],
    ['308-5', 'CONDOMÍNIO EDILÍCIO', 'sem_fins', 'pj', false, false, null],
    ['232-1', 'PRODUTOR RURAL (PESSOA FÍSICA)', 'rural', 'pf', true, true, null],
    ['412-0', 'PARTIDO POLÍTICO', 'sem_fins', 'pj', false, false, null],
    ['110-0', 'AUTARQUIA FEDERAL', 'publico', 'pj', false, false, null],
    ['124-0', 'MUNICÍPIO', 'publico', 'pj', false, false, null],
    ['128-3', 'ESTADO OU DISTRITO FEDERAL', 'publico', 'pj', false, false, null],
    ['133-0', 'MEI - MICROEMPREENDEDOR INDIVIDUAL', 'simples', 'pj', true, true, 'mei'],
  ];
  naturezas.forEach(([cr, desc, grupo, tp, ie, icms, reg], i) => {
    pgm.sql(
      `INSERT INTO natureza_juridica_001
         (codigo, codigo_receita, descricao, grupo, tipo_pessoa, exige_ie, contribuinte_icms_padrao, regime_sugerido)
       VALUES (LPAD('${i + 1}', 4, '0'), '${cr}', $$${desc}$$, '${grupo}', '${tp}', ${ie}, ${icms}, ${reg ? `'${reg}'` : 'NULL'})`
    );
  });
  pgm.sql(`SELECT setval('natureza_juridica_001_codigo_seq', ${naturezas.length})`);

  const bancos = [
    ['001', '00000000', 'BANCO DO BRASIL S.A.', 'Banco do Brasil', 'multiplo', 'https://www.bb.com.br', '4004-0001'],
    ['033', '90400888', 'BANCO SANTANDER (BRASIL) S.A.', 'Santander', 'multiplo', 'https://www.santander.com.br', '4004-3535'],
    ['041', '92702067', 'BANRISUL - BANCO DO ESTADO DO RIO GRANDE DO SUL S.A.', 'Banrisul', 'multiplo', 'https://www.banrisul.com.br', '0800-6461515'],
    ['077', '00416968', 'BANCO INTER S.A.', 'Inter', 'digital', 'https://www.bancointer.com.br', '3003-4070'],
    ['104', '00360305', 'CAIXA ECONÔMICA FEDERAL', 'Caixa', 'multiplo', 'https://www.caixa.gov.br', '4004-0104'],
    ['208', '30306294', 'BANCO BTG PACTUAL S.A.', 'BTG Pactual', 'multiplo', 'https://www.btgpactual.com', '4007-1197'],
    ['237', '60746948', 'BANCO BRADESCO S.A.', 'Bradesco', 'multiplo', 'https://www.bradesco.com.br', '4002-0022'],
    ['260', '18236120', 'NU PAGAMENTOS S.A. (NUBANK)', 'Nubank', 'digital', 'https://www.nubank.com.br', '0800-6080483'],
    ['336', '31872495', 'BANCO C6 S.A.', 'C6 Bank', 'digital', 'https://www.c6bank.com.br', '3003-6116'],
    ['341', '60701190', 'BANCO ITAÚ UNIBANCO S.A.', 'Itaú', 'multiplo', 'https://www.itau.com.br', '4004-4828'],
    ['422', '58160789', 'BANCO SAFRA S.A.', 'Safra', 'multiplo', 'https://www.safra.com.br', '0800-7725755'],
    ['748', '01181521', 'BANCO COOPERATIVO SICREDI S.A.', 'Sicredi', 'cooperativa', 'https://www.sicredi.com.br', '0800-7247220'],
    ['756', '02038232', 'BANCO COOPERATIVO DO BRASIL S.A. (SICOOB)', 'Sicoob', 'cooperativa', 'https://www.sicoob.com.br', '0800-7246000'],
  ];
  bancos.forEach(([compe, ispb, nome, curto, tipo, site, sac], i) => {
    pgm.sql(
      `INSERT INTO banco_001 (codigo, compe, ispb, nome, nome_curto, tipo, site, telefone_sac)
       VALUES (LPAD('${i + 1}', 4, '0'), '${compe}', '${ispb}', $$${nome}$$, $$${curto}$$, '${tipo}', '${site}', '${sac}')`
    );
  });
  pgm.sql(`SELECT setval('banco_001_codigo_seq', ${bancos.length})`);

  // condicoes + parcelas + formas
  const condicoes = [
    { desc: 'À VISTA', tipo: 'avista', base: 'emissao', parcelas: [[0, 100]], formas: ['pix', 'dinheiro', 'cartao'], forma_padrao: 'pix' },
    { desc: '28 DDL', tipo: 'prazo', base: 'emissao', parcelas: [[28, 100]], formas: ['boleto', 'pix'], forma_padrao: 'boleto' },
    { desc: '30 DIAS', tipo: 'prazo', base: 'emissao', parcelas: [[30, 100]], formas: ['boleto', 'pix'], forma_padrao: 'boleto' },
    { desc: '30/60 DIAS', tipo: 'prazo', base: 'emissao', parcelas: [[30, 50], [60, 50]], formas: ['boleto'], forma_padrao: 'boleto' },
    { desc: '30/60/90 DIAS', tipo: 'prazo', base: 'emissao', parcelas: [[30, 34], [60, 33], [90, 33]], formas: ['boleto'], forma_padrao: 'boleto' },
    { desc: 'ENTRADA + 30/60', tipo: 'prazo', base: 'emissao', parcelas: [[0, 40], [30, 30], [60, 30]], formas: ['pix', 'boleto'], forma_padrao: 'pix' },
  ];
  condicoes.forEach((c, i) => {
    pgm.sql(
      `INSERT INTO condicao_pagamento_001 (codigo, descricao, tipo, base_prazo, forma_padrao)
       VALUES (LPAD('${i + 1}', 4, '0'), $$${c.desc}$$, '${c.tipo}', '${c.base}', '${c.forma_padrao}')`
    );
    c.parcelas.forEach(([dias, pct], j) => {
      pgm.sql(
        `INSERT INTO condicao_parcela_001 (condicao_id, ordem, dias, percentual)
         VALUES ((SELECT id FROM condicao_pagamento_001 WHERE codigo = LPAD('${i + 1}', 4, '0')), ${j + 1}, ${dias}, ${pct})`
      );
    });
    c.formas.forEach((f) => {
      pgm.sql(
        `INSERT INTO condicao_forma_001 (condicao_id, forma)
         VALUES ((SELECT id FROM condicao_pagamento_001 WHERE codigo = LPAD('${i + 1}', 4, '0')), '${f}')`
      );
    });
  });
  pgm.sql(`SELECT setval('condicao_pagamento_001_codigo_seq', ${condicoes.length})`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('condicao_forma_001');
  pgm.dropTable('condicao_parcela_001');
  pgm.dropTable('condicao_pagamento_001');
  pgm.dropTable('banco_convenio_001');
  pgm.dropTable('banco_agencia_001');
  pgm.dropTable('banco_001');
  pgm.dropTable('natureza_juridica_001');
  pgm.sql(`DROP SEQUENCE IF EXISTS condicao_pagamento_001_codigo_seq`);
  pgm.sql(`DROP SEQUENCE IF EXISTS banco_001_codigo_seq`);
  pgm.sql(`DROP SEQUENCE IF EXISTS natureza_juridica_001_codigo_seq`);
};
