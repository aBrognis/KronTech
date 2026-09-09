/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// A tela de Usuário (usuario_001) deixou de ser montada no FormBuilder e
// virou tela nativa dedicada (pages/usuarios/), com service e handlers
// proprios — mesmo padrao da Entidade. O schema de usuario_001 ja tinha
// todas as colunas necessarias, entao esta migration so normaliza dados:
//  - status legado invalido -> 'ativo'
//  - ativo derivado do status
// A linha em kr_telas_001 continua existindo (inacessivel pela navegacao,
// igual a Entidade) so pra nao quebrar nada que ainda dependa dela.

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.sql(`
    UPDATE usuario_001
    SET status = 'ativo'
    WHERE status IS NULL OR status NOT IN ('ativo', 'inativo', 'bloqueado')
  `);
  pgm.sql(`
    UPDATE usuario_001
    SET ativo = (status <> 'inativo')
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = () => {
  // Apenas normalizacao de dados — nada a desfazer.
};
