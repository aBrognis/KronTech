/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Provedores de IA configuraveis (Configuracoes > Provedores de IA). Cada
// linha e uma conta/chave + modelo + qual formato de API. Um prompt
// (prompt_ia_001) aponta para um provedor.
//
// tipo_api: 'anthropic' | 'openai' | 'gemini' — define o formato da
// requisicao. 'openai' cobre tambem qualquer API compativel (Groq,
// DeepSeek, Azure OpenAI, OpenRouter, Ollama) via base_url.

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable('ia_provedor_001', {
    id:              'id',
    codigo:          { type: 'varchar(60)', notNull: true, unique: true },
    nome:            { type: 'varchar(120)', notNull: true },
    tipo_api:        { type: 'varchar(20)', notNull: true }, // anthropic | openai | gemini
    modelo:          { type: 'varchar(120)', notNull: true },
    base_url:        { type: 'text' }, // opcional: proxy / API compativel
    api_key_cifrada: { type: 'text' }, // encryptCofre(chave)
    ativo:           { type: 'boolean', notNull: true, default: true },
    criado_em:       { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    atualizado_em:   { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // prompt_ia_001 aponta para um provedor. NULL = ainda nao configurado
  // (o codigo trata como "sem provedor" e mostra erro amigavel).
  pgm.addColumn('prompt_ia_001', {
    ia_provedor_id: { type: 'integer', references: 'ia_provedor_001', onDelete: 'SET NULL' },
  });
  pgm.createIndex('prompt_ia_001', 'ia_provedor_id');

  // A migracao da chave que ja esta no krontech.ini ([Integracoes]
  // anthropicApiKey) e feita em runtime no boot (migrarChaveAnthropicLegada
  // em iaProvedorService), porque o .ini nao e acessivel de dentro de uma
  // migration SQL. Aqui so criamos a estrutura.
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropColumn('prompt_ia_001', 'ia_provedor_id');
  pgm.dropTable('ia_provedor_001');
};
