import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// ─────────────────────────────────────────────────────────────────────────────
// Tabelas de REFERENCIA fiscal — base para amarrar Natureza de Operacao (CFOP),
// Produto, emissao de NF-e, entrada de notas e a Reforma Tributaria (EC
// 132/2023). Todas com coluna `origem` ('oficial' | 'manual') para o botao
// "Importar / Atualizar" nunca sobrescrever linha editada pelo usuario.
//
//   cst_icms_001         CST (Regime Normal) + CSOSN (Simples)   — seed embutido
//   cclass_trib_001      Classificacao tributaria da Reforma       — seed embutido
//   ncm_001              Nomenclatura Comum do Mercosul (~15 mil)  — arquivo ncm.txt
//   cest_001             Codigo Especificador da ST (~1 mil)       — arquivo cest.txt
//   icms_aliquota_001    matriz UF origem x UF destino + interna   — seed embutido
//   tributo_transicao_001  CBS/IBS de referencia por ano 2026-2033 — seed embutido
// ─────────────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const esc = (s) => String(s ?? '').replace(/'/g, "''");

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  // ── 1. CST / CSOSN ────────────────────────────────────────────────────────
  pgm.createTable('cst_icms_001', {
    id: 'id',
    codigo: { type: 'varchar(4)', notNull: true },
    regime: { type: 'varchar(10)', notNull: true }, // normal | simples
    descricao: { type: 'varchar(200)', notNull: true },
    origem: { type: 'varchar(10)', notNull: true, default: 'oficial' },
  });
  pgm.addConstraint('cst_icms_001', 'cst_icms_001_codigo_regime_uk', { unique: ['codigo', 'regime'] });

  const CST_NORMAL = [
    ['00', 'Tributada integralmente'],
    ['10', 'Tributada e com cobranca do ICMS por substituicao tributaria'],
    ['20', 'Com reducao de base de calculo'],
    ['30', 'Isenta ou nao tributada e com cobranca do ICMS por substituicao tributaria'],
    ['40', 'Isenta'],
    ['41', 'Nao tributada'],
    ['50', 'Suspensao'],
    ['51', 'Diferimento'],
    ['60', 'ICMS cobrado anteriormente por substituicao tributaria'],
    ['70', 'Com reducao de base de calculo e cobranca do ICMS por substituicao tributaria'],
    ['90', 'Outras'],
  ];
  const CST_SIMPLES = [
    ['101', 'Tributada pelo Simples Nacional com permissao de credito'],
    ['102', 'Tributada pelo Simples Nacional sem permissao de credito'],
    ['103', 'Isencao do ICMS no Simples Nacional para faixa de receita bruta'],
    ['201', 'Tributada pelo Simples Nacional com permissao de credito e com cobranca do ICMS por ST'],
    ['202', 'Tributada pelo Simples Nacional sem permissao de credito e com cobranca do ICMS por ST'],
    ['203', 'Isencao do ICMS no Simples Nacional para faixa de receita bruta e com cobranca do ICMS por ST'],
    ['300', 'Imune'],
    ['400', 'Nao tributada pelo Simples Nacional'],
    ['500', 'ICMS cobrado anteriormente por ST ou por antecipacao'],
    ['900', 'Outros'],
  ];
  const cstValues = [
    ...CST_NORMAL.map(([c, d]) => `('${c}', 'normal', '${esc(d)}', 'oficial')`),
    ...CST_SIMPLES.map(([c, d]) => `('${c}', 'simples', '${esc(d)}', 'oficial')`),
  ].join(',\n');
  pgm.sql(`INSERT INTO cst_icms_001 (codigo, regime, descricao, origem) VALUES\n${cstValues}`);

  // ── 2. cClassTrib — classificacao tributaria da Reforma (NT 2025.002) ─────
  // Lista resumida das classificacoes mais usadas. O botao Importar traz a
  // versao completa quando publicada (a NT ainda esta em ajuste fino).
  pgm.createTable('cclass_trib_001', {
    id: 'id',
    codigo: { type: 'varchar(6)', notNull: true, unique: true },
    descricao: { type: 'varchar(300)', notNull: true },
    tributo: { type: 'varchar(8)' }, // ibs | cbs | is | (vazio = geral)
    cst_reforma: { type: 'varchar(4)' }, // CST novo da reforma associado
    origem: { type: 'varchar(10)', notNull: true, default: 'oficial' },
  });
  const CCLASS = [
    ['000001', 'Situacao tributaria plena (aliquota padrao) - IBS/CBS', '', '000'],
    ['000002', 'Aliquota reduzida em 60% (dispositivos medicos, medicamentos, etc.)', '', '200'],
    ['000003', 'Aliquota reduzida em 30% (servicos de profissao regulamentada)', '', '200'],
    ['000004', 'Isencao', '', '400'],
    ['000005', 'Imunidade', '', '400'],
    ['000006', 'Aliquota zero (cesta basica nacional)', '', '400'],
    ['000007', 'Diferimento', '', '550'],
    ['000008', 'Suspensao', '', '550'],
    ['000009', 'Nao incidencia', '', '400'],
    ['200001', 'Credito presumido - operacoes especificas', '', '200'],
    ['400001', 'Regime especifico - combustiveis', '', '000'],
    ['400002', 'Regime especifico - servicos financeiros', '', '000'],
    ['400003', 'Regime especifico - planos de saude', '', '000'],
    ['400004', 'Regime especifico - bens imoveis', '', '000'],
    ['810001', 'Zona Franca de Manaus e Areas de Livre Comercio', '', '000'],
  ];
  const cclassValues = CCLASS.map(([c, d, t, cst]) => `('${c}', '${esc(d)}', ${t ? `'${t}'` : 'NULL'}, ${cst ? `'${cst}'` : 'NULL'}, 'oficial')`).join(',\n');
  pgm.sql(`INSERT INTO cclass_trib_001 (codigo, descricao, tributo, cst_reforma, origem) VALUES\n${cclassValues}`);

  // ── 3. NCM ───────────────────────────────────────────────────────────────
  pgm.createTable('ncm_001', {
    id: 'id',
    codigo: { type: 'varchar(10)', notNull: true, unique: true }, // 8 digitos (2/4/6/8) sem ponto
    descricao: { type: 'varchar(600)', notNull: true },
    aliquota_ipi: { type: 'numeric(6,2)' }, // % TIPI (quando informada no arquivo)
    origem: { type: 'varchar(10)', notNull: true, default: 'oficial' },
  });
  pgm.sql(`CREATE INDEX ncm_001_codigo_prefix_idx ON ncm_001 (codigo varchar_pattern_ops)`);
  seedDeArquivo(pgm, 'ncm.txt', (linha) => {
    const [codigo, descricao, ipi] = linha.split('|');
    if (!codigo) return null;
    return `('${codigo.trim()}', '${esc((descricao || '').trim())}', ${ipi && ipi.trim() ? Number(ipi) : 'NULL'}, 'oficial')`;
  }, 'ncm_001', '(codigo, descricao, aliquota_ipi, origem)', 400);

  // ── 4. CEST ──────────────────────────────────────────────────────────────
  pgm.createTable('cest_001', {
    id: 'id',
    codigo: { type: 'varchar(9)', notNull: true }, // NN.NNN.NN
    ncm: { type: 'varchar(10)' }, // NCM vinculado (pode repetir codigo p/ NCMs diferentes)
    descricao: { type: 'varchar(600)', notNull: true },
    segmento: { type: 'varchar(120)' },
    origem: { type: 'varchar(10)', notNull: true, default: 'oficial' },
  });
  pgm.createIndex('cest_001', 'codigo');
  pgm.createIndex('cest_001', 'ncm');
  seedDeArquivo(pgm, 'cest.txt', (linha) => {
    const [codigo, ncm, descricao, segmento] = linha.split('|');
    if (!codigo) return null;
    return `('${codigo.trim()}', ${ncm && ncm.trim() ? `'${ncm.trim()}'` : 'NULL'}, '${esc((descricao || '').trim())}', ${segmento && segmento.trim() ? `'${esc(segmento.trim())}'` : 'NULL'}, 'oficial')`;
  }, 'cest_001', '(codigo, ncm, descricao, segmento, origem)', 400);

  // ── 5. Aliquotas ICMS (interna por UF + interestaduais) ──────────────────
  pgm.createTable('icms_aliquota_001', {
    id: 'id',
    uf_origem: { type: 'varchar(2)', notNull: true },  // '**' = interna (mesma UF)
    uf_destino: { type: 'varchar(2)', notNull: true },
    aliquota: { type: 'numeric(5,2)', notNull: true },
    tipo: { type: 'varchar(15)', notNull: true }, // interna | interestadual
    vigencia_ini: { type: 'date' },
    origem: { type: 'varchar(10)', notNull: true, default: 'oficial' },
  });
  pgm.addConstraint('icms_aliquota_001', 'icms_aliquota_001_uk', { unique: ['uf_origem', 'uf_destino', 'tipo'] });

  const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
  // aliquota interna padrao (base 2024/2025 - o usuario ajusta as que mudarem)
  const INTERNA = {
    AC: 19, AL: 19, AP: 18, AM: 20, BA: 20.5, CE: 20, DF: 20, ES: 17, GO: 19, MA: 22,
    MT: 17, MS: 17, MG: 18, PA: 19, PB: 20, PR: 19.5, PE: 20.5, PI: 21, RJ: 20, RN: 18,
    RS: 17, RO: 19.5, RR: 20, SC: 17, SP: 18, SE: 19, TO: 20,
  };
  // Sul/Sudeste (exceto ES): 7% p/ N/NE/CO+ES; 12% caso contrario. ES conta como "demais".
  const SUL_SUDESTE = new Set(['SP', 'RJ', 'MG', 'PR', 'SC', 'RS']);
  const N_NE_CO_ES = new Set(['AC','AL','AP','AM','BA','CE','MA','PB','PE','PI','RN','SE','TO','DF','GO','MT','MS','RO','RR','PA','ES']);
  const linhasIcms = [];
  for (const uf of UFS) {
    linhasIcms.push(`('**', '${uf}', ${INTERNA[uf]}, 'interna', '2024-01-01', 'oficial')`);
  }
  for (const o of UFS) {
    for (const d of UFS) {
      if (o === d) continue;
      const aliq = (SUL_SUDESTE.has(o) && N_NE_CO_ES.has(d)) ? 7 : 12;
      linhasIcms.push(`('${o}', '${d}', ${aliq}, 'interestadual', '2019-01-01', 'oficial')`);
    }
  }
  for (let i = 0; i < linhasIcms.length; i += 400) {
    pgm.sql(`INSERT INTO icms_aliquota_001 (uf_origem, uf_destino, aliquota, tipo, vigencia_ini, origem) VALUES\n${linhasIcms.slice(i, i + 400).join(',\n')}`);
  }

  // ── 6. Transicao Reforma — CBS/IBS de referencia por ano ─────────────────
  // Numeros de referencia da EC 132/2023 / LC 214/2025. Sujeitos a ajuste na
  // regulamentacao final — por isso editaveis (origem vira 'manual' ao mexer).
  pgm.createTable('tributo_transicao_001', {
    id: 'id',
    ano: { type: 'integer', notNull: true, unique: true },
    cbs_aliquota: { type: 'numeric(6,3)', notNull: true },        // % uniao
    ibs_uf_aliquota: { type: 'numeric(6,3)', notNull: true },     // % estadual
    ibs_mun_aliquota: { type: 'numeric(6,3)', notNull: true },    // % municipal
    icms_fator: { type: 'numeric(5,3)', notNull: true, default: 1 },   // fator de reducao do ICMS (1 = cheio)
    iss_fator: { type: 'numeric(5,3)', notNull: true, default: 1 },
    pis_cofins_ativo: { type: 'boolean', notNull: true, default: true },
    observacao: { type: 'varchar(200)' },
    origem: { type: 'varchar(10)', notNull: true, default: 'oficial' },
  });
  const TRANSICAO = [
    [2026, 0.9, 0.05, 0.05, 1, 1, true, 'Fase de teste - CBS/IBS simbolicos, tributos atuais cheios'],
    [2027, 8.8, 0.05, 0.05, 1, 1, false, 'CBS substitui PIS/COFINS; IPI zerado (salvo ZFM); IS entra'],
    [2028, 8.8, 0.05, 0.05, 1, 1, false, 'Mantem 2027'],
    [2029, 8.8, 1.8, 0.9, 0.9, 0.9, false, 'IBS inicia escalonamento; ICMS/ISS reduzem 10%'],
    [2030, 8.8, 3.6, 1.8, 0.8, 0.8, false, 'ICMS/ISS a 80%'],
    [2031, 8.8, 5.3, 2.7, 0.7, 0.7, false, 'ICMS/ISS a 70%'],
    [2032, 8.8, 7.1, 3.6, 0.6, 0.6, false, 'ICMS/ISS a 60%'],
    [2033, 8.8, 11.7, 6.0, 0, 0, false, 'So IBS + CBS + IS; ICMS/ISS extintos'],
  ];
  const transValues = TRANSICAO.map(([ano, cbs, ibsu, ibsm, icf, isf, pc, obs]) =>
    `(${ano}, ${cbs}, ${ibsu}, ${ibsm}, ${icf}, ${isf}, ${pc}, '${esc(obs)}', 'oficial')`).join(',\n');
  pgm.sql(`INSERT INTO tributo_transicao_001 (ano, cbs_aliquota, ibs_uf_aliquota, ibs_mun_aliquota, icms_fator, iss_fator, pis_cofins_ativo, observacao, origem) VALUES\n${transValues}`);
};

// helper: le arquivo migrations/data/<nome>, mapeia cada linha e insere em lotes.
// Se o arquivo nao existir, apenas loga (a tabela fica vazia e o botao Importar
// preenche depois). Isso evita travar a migration em ambiente sem o arquivo.
function seedDeArquivo(pgm, nome, mapFn, tabela, colunas, lote) {
  let linhas;
  try {
    linhas = readFileSync(join(__dirname, 'data', nome), 'utf-8').split('\n').filter(Boolean);
  } catch {
    pgm.sql(`-- seed ${nome} ausente; tabela ${tabela} iniciada vazia (usar botao Importar)`);
    return;
  }
  const values = linhas.map(mapFn).filter(Boolean);
  for (let i = 0; i < values.length; i += lote) {
    pgm.sql(`INSERT INTO ${tabela} ${colunas} VALUES\n${values.slice(i, i + lote).join(',\n')} ON CONFLICT DO NOTHING`);
  }
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('tributo_transicao_001');
  pgm.dropTable('icms_aliquota_001');
  pgm.dropTable('cest_001');
  pgm.dropTable('ncm_001');
  pgm.dropTable('cclass_trib_001');
  pgm.dropTable('cst_icms_001');
};
