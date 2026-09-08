/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Limpeza total do primeiro modulo fiscal (Natureza de Operacao + Tabelas
// Fiscais). O usuario reprovou o desenho e pediu para recomecar do zero
// seguindo a orientacao tecnica da Reforma Tributaria. As tabelas de
// referencia (NCM/CEST/CFOP/...) serao recriadas de forma limpa na proxima
// migration; os dados oficiais vem do repo krontech-fiscal (botao Importar).
//
// down() nao recria nada: se precisar voltar, rodar as migrations
// 1788355650198, 1788356774245, 1788356774421, 1788479183206, 1788480585595.

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  const tabelas = [
    'natureza_operacao_trib_001',
    'natureza_operacao_cfop_001',
    'natureza_operacao_001',
    'tributo_transicao_001',
    'icms_aliquota_001',
    'cest_001',
    'ncm_001',
    'cclass_trib_001',
    'cst_icms_001',
    'cfop_001',
  ];
  for (const t of tabelas) {
    pgm.sql(`DROP TABLE IF EXISTS ${t} CASCADE`);
  }

  // reverte os campos fiscais adicionados na entidade_001
  pgm.sql(`
    ALTER TABLE entidade_001
      DROP COLUMN IF EXISTS consumidor_final,
      DROP COLUMN IF EXISTS indicador_ie,
      DROP COLUMN IF EXISTS finalidade_padrao,
      DROP COLUMN IF EXISTS suframa
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = () => {
  // sem reversao automatica (ver comentario acima)
};
