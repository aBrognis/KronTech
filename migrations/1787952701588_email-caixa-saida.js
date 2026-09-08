/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Caixa de Saida: quando o envio falha por problema de conexao/servidor
// (nao por dado invalido), a mensagem NAO se perde — fica gravada com
// origem='enviado' e envio_status='fila', e um worker tenta reenviar
// sozinho com backoff. Estados:
//   fila     -> aguardando (re)tentativa
//   enviando -> tentativa em curso (trava reentrancia)
//   enviado  -> ok, saiu de verdade (estado normal de tudo que ja existia)
//   erro     -> excedeu as tentativas, precisa de acao do usuario
// Mensagens ja enviadas ficam com envio_status='enviado' (default), sem
// mudanca de comportamento.

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumn('email_mensagem_001', {
    envio_status:            { type: 'varchar(12)', notNull: true, default: "'enviado'" },
    envio_erro:              { type: 'text' },
    envio_tentativas:        { type: 'integer', notNull: true, default: 0 },
    envio_proxima_tentativa: { type: 'timestamptz' },
  });
  // So mensagens enviadas tem status relevante; recebidas ficam 'enviado'
  // (neutro) e nunca sao olhadas pelo worker (ele filtra origem='enviado'
  // AND envio_status IN ('fila')).
  pgm.createIndex('email_mensagem_001', ['envio_status', 'envio_proxima_tentativa'], {
    name: 'email_mensagem_001_fila_saida_idx',
    where: "origem = 'enviado' AND envio_status = 'fila'",
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropIndex('email_mensagem_001', ['envio_status', 'envio_proxima_tentativa'], { name: 'email_mensagem_001_fila_saida_idx' });
  pgm.dropColumn('email_mensagem_001', ['envio_status', 'envio_erro', 'envio_tentativas', 'envio_proxima_tentativa']);
};
