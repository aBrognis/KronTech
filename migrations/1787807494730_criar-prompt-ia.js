/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Tabela generica de prompts de IA, editaveis pelo usuario em
// Configuracoes > Prompts de IA. Cada prompt tem um `codigo` estavel que o
// codigo referencia (ex: 'email_redacao'). Documentos migrarao pra ca
// depois (hoje usam documento_tipo_001.prompt_sistema).

const PROMPT_EMAIL_REDACAO = `Voce e um assistente de redacao de e-mails corporativos. Recebe um rascunho bruto (topicos soltos, texto informal, anotacoes) e reescreve como o CORPO de um e-mail profissional, claro e bem formatado.

Regras:
- Retorne apenas o corpo do e-mail em HTML simples (paragrafos <p>, listas <ul>/<ol> quando fizer sentido, <strong> para enfase pontual). Nada de <html>, <head> ou <body>.
- NAO invente informacao que nao esteja no rascunho. Se algo estiver ambiguo, mantenha generico em vez de supor.
- NAO inclua assunto, saudacao de abertura generica exagerada, nem assinatura (o sistema cuida da assinatura).
- Comece direto com uma saudacao curta e adequada ao contexto (ex: "Ola,", "Prezados,", "Boa tarde,") seguida do conteudo.
- Tom cordial e objetivo. Portugues do Brasil. Sem emojis.
- Se o rascunho ja estiver bem escrito, apenas ajuste a formatacao e a cortesia, sem reescrever demais.
- Quando o contexto indicar RESPOSTA ou ENCAMINHAMENTO, escreva de forma coerente com isso (ex: referenciar o pedido anterior), mas NAO reescreva nem cite o historico: ele ja esta no corpo abaixo do ponto onde seu texto sera inserido.`;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('prompt_ia_001', {
    id:             'id',
    codigo:         { type: 'varchar(60)', notNull: true, unique: true },
    nome:           { type: 'varchar(120)', notNull: true },
    // Onde o prompt e usado: 'email' | 'documento' | 'geral'. Serve so pra
    // agrupar na tela de Configuracoes.
    categoria:      { type: 'varchar(40)', notNull: true, default: 'geral' },
    descricao:      { type: 'text' },
    prompt_sistema: { type: 'text', notNull: true },
    ativo:          { type: 'boolean', notNull: true, default: true },
    criado_em:      { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    atualizado_em:  { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.sql(`
    INSERT INTO prompt_ia_001 (codigo, nome, categoria, descricao, prompt_sistema) VALUES
    ('email_redacao', 'Redacao de e-mail', 'email', 'Transforma um rascunho bruto no corpo de um e-mail profissional (botao "Gerar" no compositor).', $prompt$${PROMPT_EMAIL_REDACAO}$prompt$)
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('prompt_ia_001');
};
