import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// ─────────────────────────────────────────────────────────────────────────────
// Natureza de Operacao (CFOP) — cadastro fiscal que define, para cada tipo de
// operacao da empresa (venda, devolucao, remessa, transferencia...), qual CFOP,
// quais tributos incidem e como. E o coracao da emissao de documento fiscal
// (NF-e/NFC-e) e do faturamento.
//
// NAO confundir com natureza_juridica_001 (tipo societario: Ltda, S.A., MEI).
//
// Schema pensado para a Reforma Tributaria (EC 132/2023): a mesma natureza
// comporta linhas de ICMS/PIS/COFINS E de IBS/CBS/IS ao mesmo tempo, com
// vigencia por data, para atravessar a transicao 2026-2033.
// Layout de referencia: NT 2025.002 da NF-e (grupo gIBSCBS, cClassTrib).
// ─────────────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  // ── 1. cfop_001 — tabela de referencia (lista oficial do Convenio SINIEF) ──
  pgm.createTable('cfop_001', {
    id: 'id',
    codigo: { type: 'varchar(4)', notNull: true, unique: true },
    descricao: { type: 'varchar(400)', notNull: true },
    tipo: { type: 'varchar(7)', notNull: true }, // entrada | saida
    grupo: { type: 'varchar(80)' },
  });
  pgm.sql(`CREATE INDEX cfop_001_codigo_prefix_idx ON cfop_001 (codigo varchar_pattern_ops)`);

  const arquivo = join(__dirname, 'data', 'cfop.txt');
  const linhas = readFileSync(arquivo, 'utf-8').split('\n').filter(Boolean);
  const LOTE = 400;
  const registros = linhas
    .map((l) => {
      const [codigo, descricao, tipo, grupo] = l.split('|');
      return { codigo: (codigo || '').trim(), descricao: (descricao || '').trim(), tipo: (tipo || '').trim(), grupo: (grupo || '').trim() };
    })
    // descarta os cabecalhos de grupo (codigo terminando em "00" com grupo "Grupo")
    .filter((r) => r.codigo.length === 4 && !(r.codigo.endsWith('00') && r.grupo === 'Grupo'));

  for (let i = 0; i < registros.length; i += LOTE) {
    const chunk = registros.slice(i, i + LOTE);
    const values = chunk
      .map((r) => `('${r.codigo}', '${r.descricao.replace(/'/g, "''")}', '${r.tipo}', '${r.grupo.replace(/'/g, "''")}')`)
      .join(',\n');
    pgm.sql(`INSERT INTO cfop_001 (codigo, descricao, tipo, grupo) VALUES\n${values} ON CONFLICT (codigo) DO NOTHING`);
  }

  // ── 2. natureza_operacao_001 — cabecalho ──
  pgm.createTable('natureza_operacao_001', {
    id: 'id',
    codigo: { type: 'varchar(10)' }, // sequencial 4 digitos, preenchido pelo service
    descricao: { type: 'varchar(120)', notNull: true },
    tipo: { type: 'varchar(15)', notNull: true }, // entrada | saida
    finalidade: { type: 'varchar(20)', default: 'normal' }, // normal | devolucao | complementar | ajuste
    movimenta_estoque: { type: 'boolean', notNull: true, default: true },
    gera_financeiro: { type: 'boolean', notNull: true, default: true }, // gera titulo a receber/pagar
    gera_fiscal: { type: 'boolean', notNull: true, default: true }, // entra na apuracao
    consumidor_final: { type: 'varchar(10)', default: 'ambos' }, // sim | nao | ambos
    indicador_presenca: { type: 'varchar(2)' }, // 0..9 da NF-e
    modelo_documento: { type: 'varchar(4)', default: '55' }, // 55 (NF-e) | 65 (NFC-e) | 99 | nfse
    serie_padrao: { type: 'varchar(3)' },
    observacao_fiscal: { type: 'text' }, // texto p/ "Informacoes Complementares"
    ativo: { type: 'boolean', notNull: true, default: true },
    criado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    alterado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('natureza_operacao_001', 'tipo');
  pgm.createIndex('natureza_operacao_001', 'ativo');

  // ── 3. natureza_operacao_cfop_001 — CFOP por abrangencia ──
  pgm.createTable('natureza_operacao_cfop_001', {
    id: 'id',
    natureza_id: {
      type: 'integer',
      notNull: true,
      references: 'natureza_operacao_001',
      onDelete: 'CASCADE',
    },
    abrangencia: { type: 'varchar(12)', notNull: true }, // dentro_uf | fora_uf | exterior
    cfop: { type: 'varchar(4)', notNull: true },
    uf_especifica: { type: 'varchar(2)' }, // opcional: regra so p/ essa UF (sobrepoe abrangencia)
  });
  pgm.createIndex('natureza_operacao_cfop_001', 'natureza_id');

  // ── 4. natureza_operacao_trib_001 — regras de tributo (vigencia por data) ──
  pgm.createTable('natureza_operacao_trib_001', {
    id: 'id',
    natureza_id: {
      type: 'integer',
      notNull: true,
      references: 'natureza_operacao_001',
      onDelete: 'CASCADE',
    },
    tributo: { type: 'varchar(8)', notNull: true }, // icms | icms_st | ipi | pis | cofins | iss | ibs | cbs | is
    vigencia_ini: { type: 'date' }, // null = sempre
    vigencia_fim: { type: 'date' }, // null = sem fim
    // situacao tributaria
    cst: { type: 'varchar(4)' }, // CST/CSOSN (00, 20, 40, 60, 102, 500... e os novos da reforma)
    cclass_trib: { type: 'varchar(6)' }, // cClassTrib (NT 2025.002)
    // calculo
    modalidade_bc: { type: 'varchar(15)' }, // valor_operacao | pauta | preco_tabelado | margem_valor_agregado
    aliquota: { type: 'numeric(7,4)' }, // %
    reducao_bc: { type: 'numeric(7,4)' }, // % de reducao da base
    mva: { type: 'numeric(7,4)' }, // margem valor agregado (ICMS-ST)
    diferimento_perc: { type: 'numeric(7,4)' },
    // IBS e repartido: parcela estadual + municipal
    aliquota_uf: { type: 'numeric(7,4)' }, // so tributo = ibs
    aliquota_mun: { type: 'numeric(7,4)' }, // so tributo = ibs
    // credito / beneficio
    credita: { type: 'boolean', default: true }, // gera credito do tributo p/ a empresa
    codigo_beneficio: { type: 'varchar(10)' }, // cBenef (ICMS) ou equivalente reforma
    fundamento_legal: { type: 'varchar(200)' },
    observacao: { type: 'text' },
  });
  pgm.createIndex('natureza_operacao_trib_001', 'natureza_id');

  // ── 5. Seed: naturezas mais comuns ─────────────────────────────────────────
  // Cada natureza ganha: CFOP dentro_uf + fora_uf, e linhas de tributo do
  // regime atual (ICMS/PIS/COFINS) + placeholders de IBS/CBS zerados a partir
  // de 2027 (o usuario ajusta as aliquotas conforme a transicao).
  const seed = [
    {
      codigo: '0001', descricao: 'VENDA DE MERCADORIA ADQUIRIDA DE TERCEIROS', tipo: 'saida',
      movimenta_estoque: true, gera_financeiro: true, consumidor_final: 'ambos', modelo_documento: '55',
      cfops: [['dentro_uf', '5102'], ['fora_uf', '6102'], ['exterior', '7102']],
      tribs: [
        { tributo: 'icms', cst: '00', modalidade_bc: 'valor_operacao', aliquota: 18, credita: true },
        { tributo: 'pis', cst: '01', aliquota: 1.65, credita: true },
        { tributo: 'cofins', cst: '01', aliquota: 7.6, credita: true },
        { tributo: 'cbs', vigencia_ini: '2027-01-01', cst: '000', aliquota: 0, credita: true },
        { tributo: 'ibs', vigencia_ini: '2027-01-01', cst: '000', aliquota_uf: 0, aliquota_mun: 0, credita: true },
      ],
    },
    {
      codigo: '0002', descricao: 'VENDA DE PRODUCAO DO ESTABELECIMENTO', tipo: 'saida',
      movimenta_estoque: true, gera_financeiro: true, consumidor_final: 'ambos', modelo_documento: '55',
      cfops: [['dentro_uf', '5101'], ['fora_uf', '6101'], ['exterior', '7101']],
      tribs: [
        { tributo: 'icms', cst: '00', modalidade_bc: 'valor_operacao', aliquota: 18, credita: true },
        { tributo: 'ipi', cst: '50', aliquota: 0, credita: true },
        { tributo: 'pis', cst: '01', aliquota: 1.65, credita: true },
        { tributo: 'cofins', cst: '01', aliquota: 7.6, credita: true },
        { tributo: 'cbs', vigencia_ini: '2027-01-01', cst: '000', aliquota: 0, credita: true },
        { tributo: 'ibs', vigencia_ini: '2027-01-01', cst: '000', aliquota_uf: 0, aliquota_mun: 0, credita: true },
      ],
    },
    {
      codigo: '0003', descricao: 'DEVOLUCAO DE VENDA', tipo: 'entrada', finalidade: 'devolucao',
      movimenta_estoque: true, gera_financeiro: true, consumidor_final: 'ambos', modelo_documento: '55',
      cfops: [['dentro_uf', '1202'], ['fora_uf', '2202'], ['exterior', '3202']],
      tribs: [
        { tributo: 'icms', cst: '00', modalidade_bc: 'valor_operacao', aliquota: 18, credita: true },
        { tributo: 'pis', cst: '01', aliquota: 1.65, credita: true },
        { tributo: 'cofins', cst: '01', aliquota: 7.6, credita: true },
      ],
    },
    {
      codigo: '0004', descricao: 'REMESSA PARA CONSERTO OU REPARO', tipo: 'saida', finalidade: 'normal',
      movimenta_estoque: false, gera_financeiro: false, consumidor_final: 'nao', modelo_documento: '55',
      cfops: [['dentro_uf', '5915'], ['fora_uf', '6915']],
      tribs: [
        { tributo: 'icms', cst: '50', modalidade_bc: 'valor_operacao', aliquota: 0, credita: false, fundamento_legal: 'Suspensao - remessa p/ conserto' },
        { tributo: 'pis', cst: '08', aliquota: 0, credita: false },
        { tributo: 'cofins', cst: '08', aliquota: 0, credita: false },
      ],
    },
    {
      codigo: '0005', descricao: 'RETORNO DE CONSERTO OU REPARO', tipo: 'entrada', finalidade: 'normal',
      movimenta_estoque: false, gera_financeiro: false, consumidor_final: 'nao', modelo_documento: '55',
      cfops: [['dentro_uf', '1916'], ['fora_uf', '2916']],
      tribs: [
        { tributo: 'icms', cst: '50', modalidade_bc: 'valor_operacao', aliquota: 0, credita: false },
      ],
    },
    {
      codigo: '0006', descricao: 'TRANSFERENCIA DE MERCADORIA', tipo: 'saida', finalidade: 'normal',
      movimenta_estoque: true, gera_financeiro: false, consumidor_final: 'nao', modelo_documento: '55',
      cfops: [['dentro_uf', '5152'], ['fora_uf', '6152']],
      tribs: [
        { tributo: 'icms', cst: '00', modalidade_bc: 'valor_operacao', aliquota: 18, credita: true },
      ],
    },
    {
      codigo: '0007', descricao: 'BONIFICACAO, DOACAO OU BRINDE', tipo: 'saida', finalidade: 'normal',
      movimenta_estoque: true, gera_financeiro: false, consumidor_final: 'ambos', modelo_documento: '55',
      cfops: [['dentro_uf', '5910'], ['fora_uf', '6910']],
      tribs: [
        { tributo: 'icms', cst: '00', modalidade_bc: 'valor_operacao', aliquota: 18, credita: false },
        { tributo: 'pis', cst: '49', aliquota: 0, credita: false },
        { tributo: 'cofins', cst: '49', aliquota: 0, credita: false },
      ],
    },
    {
      codigo: '0008', descricao: 'COMPRA PARA COMERCIALIZACAO', tipo: 'entrada', finalidade: 'normal',
      movimenta_estoque: true, gera_financeiro: true, consumidor_final: 'nao', modelo_documento: '55',
      cfops: [['dentro_uf', '1102'], ['fora_uf', '2102'], ['exterior', '3102']],
      tribs: [
        { tributo: 'icms', cst: '00', modalidade_bc: 'valor_operacao', aliquota: 18, credita: true },
        { tributo: 'pis', cst: '50', aliquota: 1.65, credita: true },
        { tributo: 'cofins', cst: '50', aliquota: 7.6, credita: true },
      ],
    },
    {
      codigo: '0009', descricao: 'COMPRA PARA INDUSTRIALIZACAO', tipo: 'entrada', finalidade: 'normal',
      movimenta_estoque: true, gera_financeiro: true, consumidor_final: 'nao', modelo_documento: '55',
      cfops: [['dentro_uf', '1101'], ['fora_uf', '2101'], ['exterior', '3101']],
      tribs: [
        { tributo: 'icms', cst: '00', modalidade_bc: 'valor_operacao', aliquota: 18, credita: true },
        { tributo: 'ipi', cst: '50', aliquota: 0, credita: true },
        { tributo: 'pis', cst: '50', aliquota: 1.65, credita: true },
        { tributo: 'cofins', cst: '50', aliquota: 7.6, credita: true },
      ],
    },
    {
      codigo: '0010', descricao: 'PRESTACAO DE SERVICO', tipo: 'saida', finalidade: 'normal',
      movimenta_estoque: false, gera_financeiro: true, consumidor_final: 'ambos', modelo_documento: 'nfse',
      cfops: [['dentro_uf', '5933'], ['fora_uf', '6933']],
      tribs: [
        { tributo: 'iss', cst: '00', modalidade_bc: 'valor_operacao', aliquota: 5, credita: false },
        { tributo: 'pis', cst: '01', aliquota: 0.65, credita: false },
        { tributo: 'cofins', cst: '01', aliquota: 3, credita: false },
        { tributo: 'cbs', vigencia_ini: '2027-01-01', cst: '000', aliquota: 0, credita: true },
        { tributo: 'ibs', vigencia_ini: '2027-01-01', cst: '000', aliquota_uf: 0, aliquota_mun: 0, credita: true },
      ],
    },
  ];

  for (const n of seed) {
    pgm.sql(`
      INSERT INTO natureza_operacao_001
        (codigo, descricao, tipo, finalidade, movimenta_estoque, gera_financeiro, gera_fiscal, consumidor_final, modelo_documento, ativo)
      VALUES
        ('${n.codigo}', '${n.descricao.replace(/'/g, "''")}', '${n.tipo}', '${n.finalidade || 'normal'}',
         ${n.movimenta_estoque}, ${n.gera_financeiro}, true, '${n.consumidor_final}', '${n.modelo_documento}', true)
    `);

    for (const [abrangencia, cfop] of n.cfops) {
      pgm.sql(`
        INSERT INTO natureza_operacao_cfop_001 (natureza_id, abrangencia, cfop)
        SELECT id, '${abrangencia}', '${cfop}' FROM natureza_operacao_001 WHERE codigo = '${n.codigo}'
      `);
    }

    for (const t of n.tribs) {
      const col = ['natureza_id', 'tributo'];
      const val = [`(SELECT id FROM natureza_operacao_001 WHERE codigo = '${n.codigo}')`, `'${t.tributo}'`];
      const add = (c, v, quote = true) => {
        if (v === undefined || v === null) return;
        col.push(c);
        val.push(quote && typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : String(v));
      };
      add('vigencia_ini', t.vigencia_ini);
      add('vigencia_fim', t.vigencia_fim);
      add('cst', t.cst);
      add('cclass_trib', t.cclass_trib);
      add('modalidade_bc', t.modalidade_bc);
      add('aliquota', t.aliquota, false);
      add('reducao_bc', t.reducao_bc, false);
      add('mva', t.mva, false);
      add('diferimento_perc', t.diferimento_perc, false);
      add('aliquota_uf', t.aliquota_uf, false);
      add('aliquota_mun', t.aliquota_mun, false);
      add('credita', t.credita, false);
      add('codigo_beneficio', t.codigo_beneficio);
      add('fundamento_legal', t.fundamento_legal);
      add('observacao', t.observacao);
      pgm.sql(`INSERT INTO natureza_operacao_trib_001 (${col.join(', ')}) VALUES (${val.join(', ')})`);
    }
  }
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('natureza_operacao_trib_001');
  pgm.dropTable('natureza_operacao_cfop_001');
  pgm.dropTable('natureza_operacao_001');
  pgm.dropTable('cfop_001');
};
