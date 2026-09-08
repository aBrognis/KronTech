import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Tabela de referencia com TODOS os municipios do Brasil (IBGE, 5.571).
// Usada em autocomplete de "cidade" (ex: Local de Partida/Destino nas
// Despesas de Viagem). Dados de migrations/data/municipios-ibge.txt
// (formato "codigo_ibge|nome|uf" por linha).

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable('municipio_001', {
    id: 'id',
    codigo_ibge: { type: 'integer', notNull: true, unique: true },
    nome: { type: 'varchar(120)', notNull: true },
    uf: { type: 'varchar(2)', notNull: true },
    nome_uf: { type: 'varchar(130)', notNull: true }, // "Gaspar - SC", pronto pra exibir
  });
  pgm.createIndex('municipio_001', 'uf');
  // prefixo case-insensitive (a busca aplica unaccent no runtime; a tabela
  // e pequena, 5.571 linhas, entao nao precisa indice de unaccent).
  pgm.sql(`CREATE INDEX municipio_001_nome_lower_idx ON municipio_001 (lower(nome) varchar_pattern_ops)`);

  const arquivo = join(__dirname, 'data', 'municipios-ibge.txt');
  const linhas = readFileSync(arquivo, 'utf-8').split('\n').filter(Boolean);

  // INSERT em lotes de 500 (VALUES multi-linha) — ~12 statements, rapido.
  const LOTE = 500;
  for (let i = 0; i < linhas.length; i += LOTE) {
    const chunk = linhas.slice(i, i + LOTE);
    const values = chunk.map((l) => {
      const [cod, nome, uf] = l.split('|');
      const nomeEsc = nome.replace(/'/g, "''");
      return `(${parseInt(cod, 10)}, '${nomeEsc}', '${uf}', '${nomeEsc} - ${uf}')`;
    }).join(',\n');
    pgm.sql(`INSERT INTO municipio_001 (codigo_ibge, nome, uf, nome_uf) VALUES\n${values}`);
  }
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('municipio_001');
};
