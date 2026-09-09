/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// A tela nativa de Usuário (pages/usuarios/) ficou magra demais perto do
// formulario antigo do FormBuilder. Este migration enche o schema de
// usuario_001 com os campos que uma ficha de usuario de ERP tem de ter:
// identificacao (CPF, matricula), RH (admissao, gestor), acesso (perfil,
// expiracao, ultimo acesso, 2FA, forcar troca de senha) e auditoria leve.
// Mais uma tabela de historico de senhas.

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumns('usuario_001', {
    // ── Identificacao ──
    documento:        { type: 'varchar(18)' },   // CPF
    matricula:        { type: 'varchar(30)' },
    apelido:          { type: 'varchar(60)' },    // "como quer ser chamado"
    // ── Contato ──
    ramal:            { type: 'varchar(10)' },
    whatsapp:         { type: 'varchar(30)' },
    // ── RH ──
    admissao:         { type: 'date' },
    desligamento:     { type: 'date' },
    gestor_id:        { type: 'integer', references: 'usuario_001', onDelete: 'SET NULL' },
    centro_custo:     { type: 'varchar(60)' },
    // ── Acesso / seguranca ──
    perfil:           { type: 'varchar(20)', notNull: true, default: 'operador' }, // admin|gerente|supervisor|operador|consulta
    dt_expiracao:     { type: 'date' },           // acesso expira em
    dt_ultimo_acesso: { type: 'timestamptz' },    // preenchido no auth:login
    forcar_troca_senha: { type: 'boolean', notNull: true, default: false },
    senha_alterada_em:  { type: 'timestamptz' },
    dois_fatores:     { type: 'boolean', notNull: true, default: false },
    tentativas_login: { type: 'integer', notNull: true, default: 0 },
    bloqueado_ate:    { type: 'timestamptz' },
    // ── Preferencias ──
    tema:             { type: 'varchar(10)' },    // claro|escuro|auto
    idioma:           { type: 'varchar(8)', default: 'pt-BR' },
  });

  // perfil inicial pelo status/legado: quem estava 'admin' no status vira
  // perfil admin; o resto fica operador (default).
  pgm.sql(`UPDATE usuario_001 SET perfil = 'admin' WHERE LOWER(COALESCE(status,'')) = 'admin'`);
  pgm.sql(`UPDATE usuario_001 SET perfil = 'operador' WHERE perfil IS NULL`);

  // Historico de senhas — cada troca arquiva o hash anterior. Serve pra
  // politica de "nao repetir as ultimas N senhas" e auditoria.
  pgm.createTable('usuario_senha_hist_001', {
    id:            'id',
    usuario_id:    { type: 'integer', notNull: true, references: 'usuario_001', onDelete: 'CASCADE' },
    senha_hash:    { type: 'text', notNull: true },
    trocada_em:    { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    trocada_por:   { type: 'varchar(120)' },   // quem fez a troca (nome)
  });
  pgm.createIndex('usuario_senha_hist_001', 'usuario_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('usuario_senha_hist_001');
  pgm.dropColumns('usuario_001', [
    'documento', 'matricula', 'apelido', 'ramal', 'whatsapp',
    'admissao', 'desligamento', 'gestor_id', 'centro_custo',
    'perfil', 'dt_expiracao', 'dt_ultimo_acesso', 'forcar_troca_senha',
    'senha_alterada_em', 'dois_fatores', 'tentativas_login', 'bloqueado_ate',
    'tema', 'idioma',
  ]);
};
