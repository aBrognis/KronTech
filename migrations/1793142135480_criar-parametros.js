/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// ─────────────────────────────────────────────────────────────────────────────
// kr_parametros_001 — catalogo de flags de comportamento do sistema, ligadas/
// desligadas pela tela nativa de Parametros (menu Ferramentas).
//
// Fronteira com config.js (krontech.ini): o .ini e config de MAQUINA/
// INSTALACAO (conexao do banco, caminhos de disco, segredos cifrados por
// instalacao). kr_parametros_001 e dado de PRODUTO, no Postgres, compartilhado
// por todos os usuarios daquele cliente. Nunca confundir os dois.
//
// `chave` e o identificador estavel que o codigo consulta (parametrosService.
// obter('agenda.meet_grava_automatico')); `categoria` e so a aba de exibicao
// na tela, pode mudar sem quebrar quem usa a chave. `valor` sempre grava texto
// cru ('S'/'N' para booleano) - a tipagem (`tipo`) e so pra UI/normalizacao
// na leitura, nao uma constraint de banco.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable('kr_parametros_001', {
    id: 'id',
    chave: { type: 'varchar(80)', notNull: true, unique: true },
    categoria: { type: 'varchar(40)', notNull: true },
    rotulo: { type: 'varchar(160)', notNull: true },
    descricao: { type: 'text' },
    tipo: { type: 'varchar(20)', notNull: true, default: 'booleano' }, // booleano | texto | numero | exato
    opcoes: { type: 'jsonb' }, // so tipo 'exato': [{valor,label}]
    valor: { type: 'text' },
    ativo: { type: 'boolean', notNull: true, default: true },
    criado_em: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    alterado_em: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });

  // Seed: so os parametros com uso real ja conhecido (ver docs/BACKLOG.md).
  // Nascem desligados ('N') - funcao opt-in, nunca comportamento padrao.
  pgm.sql(`
    INSERT INTO kr_parametros_001 (chave, categoria, rotulo, descricao, tipo, valor) VALUES
    ('agenda.integracao_erp_externo', 'Agenda',
     'Integrar com o ERP externo do cliente',
     'Quando ligado, traz atendimentos e assuntos do ERP externo do cliente para a Agenda do sistema. Nem todo cliente usa esse ERP - mantenha desligado salvo pedido explicito.',
     'booleano', 'N'),
    ('agenda.meet_grava_automatico', 'Agenda',
     'Gravar reuniao do Meet na Agenda automaticamente',
     'Quando ligado, criar um link de reuniao do Google Meet tambem registra o evento na Agenda do sistema automaticamente. Desligado, o link do Meet funciona normalmente, so nao duplica na Agenda.',
     'booleano', 'N'),
    ('whatsapp.habilitado', 'WhatsApp',
     'Habilitar WhatsApp no sistema',
     'Reservado para a futura tela de WhatsApp integrado ao KronTech. Hoje e so a flag - nenhuma funcao esta ligada a ela ainda.',
     'booleano', 'N')
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('kr_parametros_001');
};
