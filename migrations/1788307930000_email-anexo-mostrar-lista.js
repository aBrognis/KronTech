/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Separa "anexo servido ao leitor" de "anexo que aparece na barra de Anexos".
//
// Toda imagem inline (cid:) agora vira linha em email_anexo_001 pra ser
// servida via kmail://anexo/<id> ao iframe do corpo — INCLUSIVE logos e
// fotos de assinatura, que antes iam embutidas como base64 e inchavam o
// banco. Mas assinatura NAO deve aparecer na lista de "Anexos (N)" do
// leitor. `mostrar_lista = false` marca esses casos.
//
// Anexos de verdade (PDF, planilha) e prints colados: mostrar_lista = true.

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumn('email_anexo_001', {
    mostrar_lista: { type: 'boolean', notNull: true, default: true },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropColumn('email_anexo_001', 'mostrar_lista');
};
