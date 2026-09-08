# Plano: tela de Entidade completa (tipo ERP)

## Decisoes tomadas

- **Tabela `entidade_001` continua com o mesmo nome.** Ganha colunas novas; nao e renomeada.
- **Pagina React dedicada** em `src/renderer/src/pages/entidade/`, tipo Viagens/Cofre. Sai do FormBuilder.
- **Abas:** Dados Gerais + Contatos + Financeiro + Fiscal + Anexos.
- **Lupas de Cliente** (Viagens, Documentos, Agenda): padronizar todas pra um unico componente de busca de entidade.

---

## 1. Banco

### 1.1 `entidade_001` — colunas novas (migration, ADD COLUMN IF NOT EXISTS)

Ja tem: id, codigo, nome, apelido, tipo_pessoa, ie_rg, status, papeis, telefone, celular, email, site, cep, logradouro, numero, complemento, bairro, cidade, uf, foto, tags, observacoes, ativo, criado_em, alterado_em, favorito, cnpj.

Adicionar:
- **Fiscal:** `regime_tributario` varchar(30), `inscricao_municipal` varchar(30), `contribuinte_icms` boolean, `retem_iss` boolean, `retem_irrf` boolean, `retem_csll` boolean, `retem_pis` boolean, `retem_cofins` boolean, `cnae` varchar(10), `natureza_juridica` varchar(120), `optante_simples` boolean.
- **Financeiro:** `condicao_pagamento` varchar(60), `limite_credito` numeric(15,2), `dia_vencimento` smallint, `banco` varchar(60), `agencia` varchar(20), `conta_corrente` varchar(30), `pix_tipo` varchar(15), `pix_chave` varchar(140).
- **Dados gerais extra:** `data_nascimento` date (PF), `data_fundacao` date (PJ), `porte` varchar(40), `situacao_cadastral` varchar(60).

### 1.2 Tabelas filhas novas (uma por aba com grid)

Padrao: back-reference NOT NULL + ON DELETE CASCADE (mesma regra do `fn_criar_tabela_usuario`).

```
entidade_contato_001
  id serial pk
  entidade_id int NOT NULL REFERENCES entidade_001(id) ON DELETE CASCADE
  nome varchar(150) NOT NULL
  cargo varchar(80)
  setor varchar(80)
  telefone varchar(30)
  celular varchar(30)
  email varchar(150)
  data_nascimento date
  principal boolean default false
  observacoes text
  ativo boolean default true
  criado_em timestamp default now()
  alterado_em timestamp default now()

entidade_anexo_001
  id serial pk
  entidade_id int NOT NULL REFERENCES entidade_001(id) ON DELETE CASCADE
  nome_original varchar(300) NOT NULL
  caminho text NOT NULL
  content_type varchar(120)
  tamanho_bytes bigint
  categoria varchar(60)        -- contrato, procuracao, cartao cnpj, outro
  observacoes text
  criado_em timestamp default now()
```

Endereco: por ora fica embutido nos Dados Gerais (endereco unico, como hoje). Se depois precisar de multiplos (cobranca/entrega/fiscal), cria `entidade_endereco_001` do mesmo jeito — nao bloqueia agora.

### 1.3 Migrations

Uma migration `node-pg-migrate` por bloco, aplicada nos 3 bancos (krontech, krontech_dev, krontech_fake_prod) + linha no pgmigrations. Todas idempotentes.

---

## 2. Backend

### 2.1 `src/main/services/entidadeService.js` (novo)

- `listarEntidades({ busca, papel, status, uf, limite, offset })` — lista pra aba Acesso (paginada, filtros).
- `obterEntidade(id)` — entidade + contatos + anexos.
- `criarEntidade(dados)` / `atualizarEntidade(id, dados)` — upsert do registro + diff dos filhos (contatos): insere novos, atualiza alterados, remove os que sumiram.
- `excluirEntidade(id)` — CASCADE cuida dos filhos; apagar tambem a pasta de anexos em disco.
- `mudarStatusLote(ids, status)` — pro menu de contexto do grid (padrao ja usado em Viagens/Documentos).
- `contatos` e `anexos`: helpers dedicados (`salvarContatos(entidadeId, lista)`, `salvarAnexo`, `removerAnexo`).

### 2.2 `src/main/handlers/entidade.js` (ja existe — expandir)

Hoje so tem `entidade:buscarCnpj` e `entidade:buscarCep`. Adicionar:
- `entidade:listar`, `entidade:obter`, `entidade:criar`, `entidade:atualizar`, `entidade:excluir`, `entidade:mudarStatusLote`
- `entidade:anexosSelecionar` (dialog), `entidade:anexoAbrir`
- `entidade:buscarLookup({ busca, modo, papel })` — a busca UNICA usada por toda lupa de Cliente/Entidade do sistema.

`buscarCnpj` passa a preencher tambem os campos fiscais novos (regime, CNAE, natureza, porte, situacao) que a CNPJa ja retorna e hoje sao ignorados.

### 2.3 `src/preload/index.js`

Expor `window.api.entidade.*` com todos os metodos acima.

---

## 3. Frontend

### 3.1 `src/renderer/src/pages/entidade/` (novo)

```
entidade/
  index.jsx            -- shell: page-tabs (Acesso/Cadastro), FormToolbar, roteia abas internas
  utils.js             -- STATUS_META, PAPEIS, REGIMES, EMPTY_FORM, formatadores
  AbaDadosGerais.jsx   -- nome, apelido, PF/PJ, doc, IE/RG, status, papeis, endereco, foto/logo, tags
  AbaContatos.jsx      -- grid CRUD de entidade_contato_001 (add/editar/remover linha, marcar principal)
  AbaFinanceiro.jsx    -- condicao pgto, limite credito, dia venc., banco/agencia/conta, PIX
  AbaFiscal.jsx        -- regime tributario, IM, contribuinte ICMS, retencoes (checkboxes), CNAE, natureza
  AbaAnexos.jsx        -- lista de entidade_anexo_001, upload, categoria, abrir, remover
```

- Aba **Acesso**: painel de filtros retratil (busca geral, papel, status, UF) + tabela paginada + coluna "Sel" + menu de contexto "Alterar status" (reusa `MenuContextoGrid` ja criado). `PaginacaoBar`.
- Aba **Cadastro**: sub-abas internas (Dados Gerais / Contatos / Financeiro / Fiscal / Anexos) numa barra de sub-abas propria; `FormToolbar` no rodape controla o modo (view/new/edit) da entidade inteira.
- Consulta CNPJ: botao "Buscar CNPJ" na aba Dados Gerais (PJ) preenche tudo, inclusive fiscais. Aviso quando IE nao vem.
- Reusa: `FormToolbar`, `SeletorBusca` (se tiver FK), `PaginacaoBar`, `MenuContextoGrid`, `InputData`, `notificar`, classes `.badge-*`.

### 3.2 `src/renderer/src/components/SeletorEntidade.jsx` (novo — padronizacao)

Componente unico "buscar entidade" que substitui os `buscarClientes` locais de Viagens, Documentos e Agenda. Envolve `SeletorBusca` com `onBuscar` fixo em `window.api.entidade.buscarLookup`, colunas padrao (nome, apelido, CPF/CNPJ, cidade/UF), e opcao `papel` pra filtrar (ex: so quem e "cliente").

Trocar nas 3 telas:
- `src/renderer/src/pages/viagens/index.jsx` — `buscarClientes` -> `<SeletorEntidade papel="cliente" ... />`
- `src/renderer/src/pages/DocumentosGerados.jsx` — idem
- `src/renderer/src/pages/agenda/EventoModal.jsx` — idem (checar se usa)

Colunas `cliente_id` / `clienteId` no banco continuam iguais. Nada de dado muda.

### 3.3 Roteamento (App.jsx / Sidebar.jsx)

Hoje a Entidade abre como `fb__entidade_001` (tela do FormBuilder id 31).

- Adicionar `entidade` ao `MENU_BASE` (Sidebar.jsx) como item nativo, no grupo Cadastros, icone `users`.
- `App.jsx`: `PAGE_META.entidade`, `PAGE_ICON_MAP` (ja vem do MENU_BASE), e no `renderPage` rotear `entidade` -> `<EntidadePage />`.
- Remover o registro `id 31` de `kr_telas_001` (e `kr_tela_campos_001` em cascata) via migration/limpeza no boot — a tela deixa de existir no Designer.
- Redireciono: se algo ainda pedir `fb__entidade_001`, App.jsx mapeia pra `entidade` (compat).

---

## 4. Ordem de execucao

1. Migrations (colunas + tabelas filhas) — aplicar nos 3 bancos.
2. `entidadeService.js` + handlers + preload.
3. `pages/entidade/` — shell + 5 abas.
4. `SeletorEntidade.jsx` + trocar nas 3 telas.
5. Roteamento (MENU_BASE, App.jsx) + remover tela id 31.
6. Build, sync devcache, testar: criar entidade nova com contatos/anexos, editar, excluir, abrir de uma lupa de Viagens.
7. RELEASE_NOTES.

## 5. Risco

- Baixo pro dado: `entidade_001` so ganha coluna, os 3 registros atuais seguem intactos.
- Medio pro roteamento: trocar `fb__entidade_001` por `entidade` mexe em App.jsx/Sidebar. Mitigar com o mapeamento de compat.
- A remocao da tela id 31 e reversivel (recriar o registro em kr_telas_001), mas so fazer depois que a pagina nova estiver validada.
