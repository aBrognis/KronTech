/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Marca anexos que sao imagens EMBUTIDAS no corpo (referenciadas por cid:
// no HTML, tipicamente prints colados direto no e-mail). Ate agora essas
// eram descartadas no sync (filtro `!a.related`), entao a imagem aparecia
// quebrada no corpo e nao dava pra clicar/ampliar. Agora sao gravadas
// tambem, com inline = true, e o corpo_html passa a referenciar o arquivo
// local em vez do cid:. Anexos "de verdade" continuam com inline = false.

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumn('email_anexo_001', {
    inline: { type: 'boolean', notNull: true, default: false },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropColumn('email_anexo_001', 'inline');
};
