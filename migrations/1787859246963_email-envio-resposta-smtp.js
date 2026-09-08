/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Rastreabilidade do envio: guarda o que o servidor SMTP respondeu quando
// a mensagem foi aceita (origem='enviado'). Ate agora o KronTech gravava a
// copia local e descartava a resposta — se a entrega falhasse depois, nao
// havia como rastrear no painel do provedor. Agora:
//  - smtp_response: a linha crua do servidor ("250 OK id=1wzfl4-...") —
//    esse id e o que se procura no "Track Delivery" do cPanel.
//  - smtp_rejeitados: destinatarios que o servidor recusou parcialmente
//    (RCPT TO negado). Vazio no caso normal.

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumn('email_mensagem_001', {
    smtp_response:   { type: 'text' },
    smtp_rejeitados: { type: 'jsonb', notNull: true, default: pgm.func("'[]'::jsonb") },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropColumn('email_mensagem_001', ['smtp_response', 'smtp_rejeitados']);
};
