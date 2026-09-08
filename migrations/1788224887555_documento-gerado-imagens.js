/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Imagens do documento gerado. Ate agora imagens eram SO referencia pra IA
// (nunca persistidas). Agora cada imagem pode ser marcada "sai no PDF" e
// ganha uma legenda (gerada pela IA, editavel). Formato do jsonb:
//   [{ id, arquivo, mime, legenda, noPdf }]
//     id      : identificador local ("img-<timestamp>-<rand>")
//     arquivo : caminho absoluto do arquivo salvo em disco
//     mime    : image/png | image/jpeg | ...
//     legenda : texto curto abaixo da imagem no PDF (pode ser vazio)
//     noPdf   : true = aparece no documento; false = so referencia pra IA
// As imagens no PDF entram LOGO APOS a secao Introducao.

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumn('documento_gerado_001', {
    imagens: { type: 'jsonb', notNull: true, default: pgm.func("'[]'::jsonb") },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropColumn('documento_gerado_001', 'imagens');
};
