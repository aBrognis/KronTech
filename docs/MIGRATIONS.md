# Migrations — schema versionado (node-pg-migrate)

> **Regra a partir de agora:** toda tabela ou coluna nova entra por uma
> migration versionada aqui, não mais direto em `src/main/db.js`.

## Por quê

`src/main/db.js` (o mecanismo antigo) concentra o schema inteiro num arquivo
único, sem histórico de mudanças, sem rollback, e com falhas de DDL que só
geram um `console.warn` — o app continua abrindo normalmente mesmo se uma
tabela não tiver sido criada. Isso não é reescrito: `db.js` continua
respondendo por tudo que já existe. `node-pg-migrate` roda como uma segunda
trilha, só para schema novo, com três diferenças deliberadas:

- **Histórico real:** cada mudança é um arquivo com timestamp, versionado no
  Git.
- **Rollback:** toda migration tem `up` e `down`.
- **Falha visível:** se uma migration falhar, o erro é logado bem alto e
  propagado — não é engolido silenciosamente como no `db.js` legado.

## Como criar uma migration nova

```bash
npx node-pg-migrate create nome-da-mudanca --migrations-dir migrations
```

Isso gera `migrations/<timestamp>_nome-da-mudanca.js` com dois exports,
`up` e `down`. Exemplo:

```js
export const up = (pgm) => {
  pgm.createTable('minha_tabela_001', {
    id: 'id',
    nome: { type: 'varchar(200)', notNull: true },
  })
}

export const down = (pgm) => {
  pgm.dropTable('minha_tabela_001')
}
```

Lembrar da convenção do projeto: nomes de tabela sempre terminam em `_NNN`
(ex: `_001`).

## Como testar localmente

```bash
DATABASE_URL="postgres://postgres:postgres@localhost:5432/krontech_dev" npx node-pg-migrate up --migrations-dir migrations
```

Para desfazer a última migration aplicada:

```bash
DATABASE_URL="postgres://postgres:postgres@localhost:5432/krontech_dev" npx node-pg-migrate down --migrations-dir migrations
```

## Como roda em produção

`src/main/migrate.js` chama `runMigrations()` automaticamente no boot do
app (`src/main/index.js`, antes de `initDb()`), usando a mesma config de
banco já usada pelo resto do sistema (`getDecryptedBancoConfig()`).

Em app empacotado, a pasta `migrations/` não vai dentro do bundle JS — ela
é copiada para fora do ASAR via `"extraResources"` na config do
electron-builder (`package.json`), e fica acessível em
`process.resourcesPath/migrations`. Em dev, o caminho é resolvido
relativo ao projeto. `src/main/migrate.js` já trata os dois casos.

## O que NÃO muda

- Tabelas que já existem (Agenda, FormBuilder, Funções, etc.) continuam
  sob responsabilidade do `db.js` legado — não precisam ser "migradas" para
  cá retroativamente.
- `SCHEMA_VERSION`/`migration1()`/`migration2()` dentro de `db.js` continuam
  existindo e rodando normalmente.
