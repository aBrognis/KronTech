/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createSequence('email_conta_001_codigo_seq');

  pgm.createTable('email_conta_001', {
    id:                          'id',
    codigo:                      { type: 'varchar(10)', notNull: true, unique: true },
    nome:                        { type: 'varchar(120)', notNull: true },
    email:                       { type: 'varchar(200)', notNull: true },
    provedor:                    { type: 'varchar(20)', notNull: true },
    auth_tipo:                   { type: 'varchar(20)', notNull: true, default: "'senha_app'" },
    imap_host:                   { type: 'varchar(200)', notNull: true },
    imap_porta:                  { type: 'integer', notNull: true, default: 993 },
    imap_seguranca:              { type: 'varchar(10)', notNull: true, default: "'tls'" },
    smtp_host:                   { type: 'varchar(200)', notNull: true },
    smtp_porta:                  { type: 'integer', notNull: true, default: 465 },
    smtp_seguranca:               { type: 'varchar(10)', notNull: true, default: "'tls'" },
    usuario_login:               { type: 'varchar(200)', notNull: true },
    senha_app_cifrada:           { type: 'text' },
    oauth_refresh_token_cifrado: { type: 'text' },
    oauth_client_id:             { type: 'varchar(200)' },
    ativa:                       { type: 'boolean', notNull: true, default: true },
    sync_status:                 { type: 'varchar(20)', notNull: true, default: "'nunca_sincronizada'" },
    sync_erro_msg:               { type: 'text' },
    sync_ultima_em:              { type: 'timestamptz' },
    sincronizar_desde:           { type: 'date', notNull: true },
    primeira_sync_concluida:     { type: 'boolean', notNull: true, default: false },
    criado_em:                   { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    atualizado_em:               { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('email_conta_001', 'ativa');

  pgm.createTable('email_mensagem_001', {
    id:              'id',
    conta_id:        { type: 'integer', notNull: true, references: 'email_conta_001', onDelete: 'CASCADE' },
    uid_imap:        { type: 'varchar(50)', notNull: true },
    pasta_imap:      { type: 'varchar(200)', notNull: true, default: "'INBOX'" },
    message_id:      { type: 'varchar(998)' },
    in_reply_to:     { type: 'varchar(998)' },
    thread_id:       { type: 'varchar(998)' },
    remetente_nome:  { type: 'varchar(300)' },
    remetente_email: { type: 'varchar(320)', notNull: true },
    destinatarios:   { type: 'jsonb', notNull: true, default: pgm.func("'[]'::jsonb") },
    copia:           { type: 'jsonb', notNull: true, default: pgm.func("'[]'::jsonb") },
    assunto:         { type: 'text' },
    corpo_texto:     { type: 'text' },
    corpo_html:      { type: 'text' },
    data_envio:      { type: 'timestamptz', notNull: true },
    lida:            { type: 'boolean', notNull: true, default: false },
    respondida:      { type: 'boolean', notNull: true, default: false },
    encaminhada:     { type: 'boolean', notNull: true, default: false },
    tem_anexo:       { type: 'boolean', notNull: true, default: false },
    tamanho_bytes:   { type: 'integer' },
    origem:          { type: 'varchar(10)', notNull: true, default: "'recebido'" },
    criado_em:       { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('email_mensagem_001', 'email_mensagem_001_conta_pasta_uid_uniq',
    'UNIQUE (conta_id, pasta_imap, uid_imap)');
  pgm.createIndex('email_mensagem_001', 'conta_id');
  pgm.createIndex('email_mensagem_001', ['conta_id', 'data_envio']);
  pgm.createIndex('email_mensagem_001', ['conta_id', 'lida']);
  pgm.createIndex('email_mensagem_001', 'thread_id');
  pgm.createIndex('email_mensagem_001', 'message_id');

  pgm.createTable('email_anexo_001', {
    id:            'id',
    mensagem_id:   { type: 'integer', notNull: true, references: 'email_mensagem_001', onDelete: 'CASCADE' },
    nome_original: { type: 'varchar(500)', notNull: true },
    caminho:       { type: 'text', notNull: true },
    content_type:  { type: 'varchar(150)' },
    tamanho_bytes: { type: 'integer' },
    content_id:    { type: 'varchar(300)' },
    criado_em:     { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('email_anexo_001', 'mensagem_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('email_anexo_001');
  pgm.dropTable('email_mensagem_001');
  pgm.dropTable('email_conta_001');
  pgm.dropSequence('email_conta_001_codigo_seq');
};
