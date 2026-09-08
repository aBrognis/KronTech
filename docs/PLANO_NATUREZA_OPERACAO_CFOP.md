# Plano: Natureza de Operação (CFOP) — cadastro fiscal

> **Escopo:** cadastro que define, para cada tipo de operação da empresa
> (venda, devolução, remessa, transferência, bonificação...), qual CFOP,
> quais tributos incidem e como. É o coração de qualquer emissão de
> documento fiscal (NF-e, NFC-e, NFS-e) e do faturamento.
>
> **NÃO confundir com Natureza JURÍDICA** (`natureza_juridica_001`, já feita)
> — aquela é o tipo societário da empresa (Ltda, S.A., MEI); esta é o tipo
> de operação fiscal.
>
> **Quando construir:** junto do módulo de Faturamento (Pedido → Nota
> Fiscal). Não é pré-requisito da tela de Entidade. Este documento existe
> para o schema já nascer certo, pensando na Reforma Tributária.
>
> ## STATUS (2026-09-02)
>
> **CADASTRO IMPLEMENTADO** (blocos 1–5 deste plano). Falta só o motor de
> cálculo (`fiscalCalc.js`) e a amarração no Pedido/Nota — que vêm com o
> módulo de Faturamento.
>
> - Migration `1788355650198_criar-natureza-operacao-cfop.js` aplicada em
>   `krontech` e `krontech_dev`: 4 tabelas + seed de 666 CFOPs oficiais
>   (`migrations/data/cfop.txt`) + 10 naturezas comuns pré-configuradas.
> - Backend: `src/main/services/naturezaOperacaoService.js`,
>   handlers `naturezaOperacao:*` e `cfop:buscar` / `cfop:obter` em
>   `src/main/handlers/cadastrosApoio.js`, preload atualizado.
> - Frontend: `src/renderer/src/pages/NaturezasOperacao.jsx` (via
>   `TelaCadastroPadrao`, 4 abas: Acesso / Cadastro / CFOP / Tributação),
>   componente `src/renderer/src/components/InputCfop.jsx` (autocomplete).
> - Menu: item "Naturezas de Operação" no grupo Cadastros (Sidebar + App).
>
> ### Rodada 2 (2026-09-02): perfil fiscal + tabelas de referência
>
> - `entidade_001` +consumidor_final/indicador_ie/finalidade_padrao/suframa
>   (migration `1788356774016`), campos na aba Fiscal da Entidade.
> - Migration `1788356774245`: `cst_icms_001`, `cclass_trib_001`, `ncm_001`
>   (`data/ncm.txt`), `cest_001` (`data/cest.txt`), `icms_aliquota_001` (matriz
>   UF×UF), `tributo_transicao_001` (CBS/IBS 2026-2033). Coluna `origem` em
>   todas (+ migration `1788356774421` p/ `cfop_001`).
> - `src/main/services/tabelasFiscaisService.js` (leitura + `reimportar` +
>   `verificarAtualizacoes`); handlers `fiscal:*`; preload `fiscal`.
> - `src/renderer/src/pages/TabelasFiscais.jsx` (6 abas); menu "Tabelas Fiscais".
> - `NaturezasOperacao.jsx`: CST/cClassTrib viram select das tabelas; botão
>   "Atualizar tabela CFOP".
> - Estratégia de import: tabelas empacotadas + verificação de manifesto remoto
>   (`MANIFESTO_URL`), funciona offline. Repo `krontech-fiscal` a publicar.

---

## 1. Contexto: a Reforma Tributária (EC 132/2023)

O modelo atual (ICMS estadual + IPI + PIS + COFINS + ISS municipal) está
sendo substituído, com transição 2026–2033, por:

| Novo tributo | Substitui | Esfera | Sigla |
|---|---|---|---|
| **IBS** — Imposto sobre Bens e Serviços | ICMS + ISS | Estados + Municípios | IBS |
| **CBS** — Contribuição sobre Bens e Serviços | PIS + COFINS + (parte do) IPI | União | CBS |
| **IS** — Imposto Seletivo ("imposto do pecado") | parte do IPI | União | IS |

**Cronograma que afeta o schema:**

- **2026:** CBS/IBS em alíquota de teste (0,9% + 0,1%), ICMS/PIS/COFINS ainda cheios. Notas já precisam carregar os campos novos.
- **2027:** CBS substitui PIS/COFINS de vez; IPI zerado (salvo ZFM); IS entra.
- **2029–2032:** IBS sobe gradualmente, ICMS/ISS descem.
- **2033:** só IBS + CBS + IS.

**Consequência de projeto:** o cadastro precisa comportar **os dois
regimes ao mesmo tempo** durante a transição (campos de ICMS/PIS/COFINS
*e* de IBS/CBS/IS), e um indicador de qual conjunto vale por data.

O layout da NF-e para a reforma é a **NT 2025.002** (grupo `IBSCBS` no XML,
campos `gIBSCBS`, `gIBSUF`, `gIBSMun`, `gCBS`, `gIS`, `CST` e
`cClassTrib` novos). O schema abaixo já nomeia os campos por esse padrão.

---

## 2. Tabelas

### 2.1 `natureza_operacao_001` (cabeçalho)

```
id                 serial pk
codigo             varchar(10)   -- sequencial 4 digitos
descricao          varchar(120) NOT NULL   -- "Venda de mercadoria adquirida de terceiros"
tipo               varchar(15) NOT NULL    -- entrada | saida
finalidade         varchar(20)             -- normal | devolucao | complementar | ajuste
movimenta_estoque  boolean NOT NULL DEFAULT true
gera_financeiro    boolean NOT NULL DEFAULT true   -- gera titulo a receber/pagar
gera_fiscal        boolean NOT NULL DEFAULT true   -- entra na apuracao
consumidor_final   varchar(10)             -- sim | nao | ambos
indicador_presenca varchar(2)             -- 0..9 da NF-e (presencial, internet, teleatendimento...)
modelo_documento   varchar(4)             -- 55 (NF-e) | 65 (NFC-e) | 99 (sem doc) | nfse
serie_padrao       varchar(3)
observacao_fiscal  text                   -- texto que sai em "Informacoes Complementares"
ativo              boolean NOT NULL DEFAULT true
criado_em / alterado_em
```

### 2.2 `natureza_operacao_cfop_001` (CFOP por UF de destino)

Um mesmo tipo de operação usa CFOP diferente conforme dentro/fora do
estado e destino. Grid-filho:

```
id                 serial pk
natureza_id        int NOT NULL REFERENCES natureza_operacao_001 ON DELETE CASCADE
abrangencia        varchar(12) NOT NULL   -- dentro_uf | fora_uf | exterior
cfop               varchar(4) NOT NULL    -- 5102, 6102, 7102...
uf_especifica      varchar(2)             -- opcional: regra so pra essa UF (sobrepoe abrangencia)
```

### 2.3 `natureza_operacao_trib_001` (regras de tributo — vigência por data)

Uma linha por (tributo × vigência). Durante a transição a mesma natureza
tem linhas de ICMS *e* de IBS.

```
id                 serial pk
natureza_id        int NOT NULL REFERENCES natureza_operacao_001 ON DELETE CASCADE
tributo            varchar(8) NOT NULL    -- icms | icms_st | ipi | pis | cofins | iss | ibs | cbs | is
vigencia_ini       date                   -- null = sempre
vigencia_fim       date                   -- null = sem fim
-- situacao tributaria
cst                varchar(4)             -- CST/CSOSN do tributo (00, 20, 40, 60, 102, 500, ... e os novos da reforma)
cclass_trib        varchar(6)             -- cClassTrib (classificacao tributaria da reforma, NT 2025.002)
-- calculo
modalidade_bc      varchar(15)            -- valor_operacao | pauta | preco_tabelado | margem_valor_agregado
aliquota           numeric(7,4)           -- %
reducao_bc         numeric(7,4)           -- % de reducao da base
mva                numeric(7,4)           -- margem valor agregado (ICMS-ST)
diferimento_perc   numeric(7,4)
-- IBS e repartido: parcela estadual + municipal
aliquota_uf        numeric(7,4)           -- so tributo = ibs
aliquota_mun       numeric(7,4)           -- so tributo = ibs
-- credito/beneficio
credita            boolean DEFAULT true   -- gera credito do tributo pra empresa
codigo_beneficio   varchar(10)            -- cBenef (beneficio fiscal ICMS) ou equivalente reforma
fundamento_legal   varchar(200)
observacao         text
```

### 2.4 `cfop_001` (tabela de referência — opcional, mas recomendado)

Lista oficial dos CFOP (~600) pra o campo `cfop` ter lupa/validação em vez
de digitação livre. Mesmo padrão de `municipio_001`: seed de arquivo.

```
id             serial pk
codigo         varchar(4) NOT NULL UNIQUE
descricao      varchar(300) NOT NULL
tipo           varchar(7)   -- entrada | saida
grupo          varchar(60)  -- "Compras para industrializacao", "Vendas", "Devolucoes"...
```

---

## 3. Backend

`src/main/services/naturezaOperacaoService.js` — CRUD do cabeçalho + diff
dos 3 grids-filho (cfops, tributos). Mesmo padrão de `bancoService.js`.

`src/main/handlers/naturezaOperacao.js` — handlers `naturezaOperacao:*`.

`src/main/handlers/cfop.js` — só `cfop:buscar` (autocomplete, igual
`municipio:buscar`).

**Motor de cálculo** (`src/main/services/fiscalCalc.js`, vem com o
Faturamento, não agora): recebe (natureza, item, cliente, data) e devolve
os valores/CST/base de cada tributo, escolhendo a linha de
`natureza_operacao_trib_001` cuja vigência contém a data.

---

## 4. Frontend

Página React dedicada `src/renderer/src/pages/naturezaOperacao/`.

Abas de topo (padrão `TelaCadastroPadrao` com `abasForm`):

| Aba | Conteúdo |
|---|---|
| **Acesso** | lista + filtro (tipo, ativo, busca) |
| **Cadastro** | seções: Identificação · Comportamento (estoque/financeiro/fiscal) · Documento fiscal (modelo, série, indicadores) · Observação fiscal |
| **CFOP** | grid `natureza_operacao_cfop_001` — abrangência + CFOP (com lupa em `cfop_001`) |
| **Tributação** | grid `natureza_operacao_trib_001` agrupado por tributo, com sub-linhas por vigência. Aqui aparece o par ICMS↔IBS durante a transição. |

Componentes reusados: `TelaCadastroPadrao`, `SecaoForm`/`FormBlocos`,
`GridFilho`, `MenuContextoGrid`, autocomplete estilo `InputCidade` para o
CFOP.

---

## 5. Seeds

- `cfop_001`: lista oficial (arquivo `migrations/data/cfop.txt`, formato
  `codigo|descricao|tipo|grupo`). Fonte: tabela CFOP do Convênio SINIEF.
- `natureza_operacao_001`: 8–10 naturezas mais comuns já configuradas
  (Venda de mercadoria, Venda de produção própria, Devolução de venda,
  Remessa p/ conserto, Retorno de conserto, Transferência, Bonificação,
  Compra p/ revenda, Compra p/ industrialização, Prestação de serviço),
  cada uma com CFOP dentro/fora UF e as linhas de tributo do regime atual
  + placeholders de IBS/CBS zerados (o usuário preenche as alíquotas
  conforme a transição).

---

## 6. Ordem de execução (quando pegar o Faturamento)

1. Migrations das 4 tabelas + seeds (cfop, naturezas comuns).
2. `naturezaOperacaoService` + handlers + preload.
3. Página `naturezaOperacao/` com as 4 abas.
4. Só depois: `fiscalCalc.js` e a amarração no Pedido/Nota.

## 7. Riscos / decisões em aberto

- **Granularidade da tributação por produto:** o ideal ERP é ter também
  um "Grupo Tributário" no cadastro de Produto que sobrepõe a natureza
  (ex: produto monofásico de PIS/COFINS). Fica para o módulo de Produtos;
  o schema de `natureza_operacao_trib_001` já serve de base pra isso
  (mesma estrutura numa tabela `produto_grupo_trib_001`).
- **Reforma ainda em regulamentação:** LC 214/2025 publicada, mas NTs da
  NF-e e cClassTrib ainda saindo. Os campos `cclass_trib`, `aliquota_uf`,
  `aliquota_mun` podem precisar de ajuste fino quando a NT final sair —
  por isso ficam como texto/numeric genéricos agora, sem constraint rígida.
- **NFS-e nacional:** o padrão nacional de NFS-e (layout ABRASF/RFB) tem
  campos próprios; se a empresa presta serviço, a aba Tributação precisa
  de `tributo = iss` e, na transição, `ibs`. Já contemplado.
