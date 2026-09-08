# Plano: Entidade completa — nível ERP grande

> **STATUS (02/09/2026): IMPLEMENTADO (blocos 1-7).** Migrations aplicadas
> nos 2 bancos (krontech, krontech_dev). Backend `entidadeService.js` com
> obter aninhado + syncs + auditoria + handlers (registrarInteracao,
> alterarLimite, documentosVencendo). Frontend `pages/entidade/` com painel
> lateral `PainelResumo.jsx` + 11 abas: Dados Gerais, Endereços, Contatos
> (+ meios), Comercial, Financeiro, Fiscal, Crédito (+ alterar limite +
> histórico), Relacionamento (CRM timeline), Vínculos, Anexos, Histórico
> (documentos com validade + auditoria). Lembrete de documentos vencendo
> integrado no `services/reminder.js`. `SeletorEntidade` unificado em
> Viagens/Documentos. Falta apenas: testar no dev com dados reais e
> eventuais ajustes finos de layout.
>
> Decisão aplicada: `limite_credito` fica em `entidade_credito_001` (fonte
> da verdade), `entidade_001.limite_credito` é espelho atualizado no save.


> Evolução da tela de Entidade já criada (`pages/entidade/`). Adiciona
> múltiplos endereços/contatos, e as abas Vendas/Compras, Crédito &
> Cobrança, Relacionamento (CRM leve), Vínculos e Histórico/Auditoria.
> Layout: **painel lateral fixo com resumo + abas densas à direita**.

---

## 1. Layout

```
┌──────────────────────────────────────────────────────────────┐
│ [Acesso] [Dados] [Endereços] [Contatos] [Comercial] [Fiscal]  │  ← abas de topo
│ [Financeiro] [Crédito] [Relacionamento] [Vínculos] [Anexos] [Histórico]
├────────────┬─────────────────────────────────────────────────┤
│  RESUMO    │                                                 │
│  (fixo)    │   conteúdo da aba ativa, 2-3 colunas densas      │
│            │                                                 │
│  [logo]    │                                                 │
│  NOME      │                                                 │
│  cod 0001  │                                                 │
│  CNPJ ...  │                                                 │
│  ● Ativo   │                                                 │
│  Cliente   │                                                 │
│  Fornec.   │                                                 │
│  (11)9...  │                                                 │
│  Gaspar-SC │                                                 │
│  ────────  │                                                 │
│  Limite:   │                                                 │
│  R$ 50.000 │                                                 │
│  Disp:     │                                                 │
│  R$ 32.100 │                                                 │
│  ⚠ 2 docs  │                                                 │
│  a vencer  │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

- Painel lateral: ~240px, `position: sticky`. Mostra logo/foto, nome,
  código, CNPJ, badge de status, chips de papéis, telefone principal,
  cidade-UF, e (quando houver) limite de crédito / disponível / alertas.
- Abas: muitas — usar rolagem horizontal na `.page-tabs` se não couberem,
  ou agrupar as menos usadas num "mais ▾".
- Cada aba: `FormGrid` 2-3 colunas, `SecaoForm` para blocos, densidade
  padrão (seção 2.4 do PADRAO_TELAS).

---

## 2. Schema — tabelas novas

Todas com `entidade_id int NOT NULL REFERENCES entidade_001 ON DELETE
CASCADE`, `ativo`, `criado_em`, `alterado_em`.

### 2.1 `entidade_endereco_001` (múltiplos endereços)

```
id, entidade_id
tipo            varchar(15)   -- principal | cobranca | entrega | fiscal | filial | obra
descricao       varchar(100)  -- "Matriz", "CD São Paulo"
cep, logradouro, numero, complemento, bairro
cidade          varchar(100)  -- "Gaspar - SC"
uf              varchar(2)
municipio_ibge  integer       -- FK opcional municipio_001.codigo_ibge (p/ NF-e)
ponto_referencia varchar(150)
principal       boolean
```

### 2.2 `entidade_contato_meio_001` (telefones/e-mails do contato OU da entidade)

Substitui os campos soltos `telefone/celular/email`. Uma linha por meio.

```
id, entidade_id
contato_id      integer NULL REFERENCES entidade_contato_001 ON DELETE CASCADE
                -- null = meio da PRÓPRIA entidade; preenchido = do contato
tipo            varchar(15)   -- telefone | celular | whatsapp | email | fax
valor           varchar(150)
ramal           varchar(10)
observacao      varchar(120)
principal       boolean
```

`entidade_contato_001` já existe (nome/cargo/setor) — mantém, e os
telefones dele passam a viver aqui.

### 2.3 `entidade_comercial_001` (1:1 com a entidade — aba Vendas/Compras)

```
id, entidade_id UNIQUE
vendedor_id           integer  -- FK entidade_001 (papel=funcionario/representante)
comprador_id          integer  -- idem (quando esta entidade é fornecedor)
tabela_preco          varchar(60)
desconto_maximo_perc  numeric(6,2)
transportadora_id     integer  -- FK entidade_001 (papel=transportadora)
frete_padrao          varchar(10)  -- cif | fob | terceiros | sem_frete
prazo_entrega_dias    smallint
pedido_minimo         numeric(15,2)
regiao                varchar(60)
rota_entrega          varchar(60)
observacao_comercial  text
```

### 2.4 `entidade_credito_001` (1:1 — aba Crédito & Cobrança)

```
id, entidade_id UNIQUE
score_risco        varchar(1)     -- A | B | C | D | E
status_credito     varchar(12)    -- liberado | analise | bloqueado | suspenso
limite_credito     numeric(15,2)  -- (move de entidade_001 pra cá; entidade_001 mantém por compat, sincroniza)
limite_utilizado   numeric(15,2)  -- calculado (títulos em aberto) — por ora manual
data_ultima_analise date
analista_id        integer        -- FK entidade_001
atraso_medio_dias  smallint
observacao_credito text
```

### 2.5 `entidade_credito_hist_001` (histórico de limite)

```
id, entidade_id
data, limite_anterior, limite_novo, motivo varchar(200), usuario_id
```

### 2.6 `entidade_interacao_001` (CRM leve — aba Relacionamento)

```
id, entidade_id
tipo          varchar(15)   -- ligacao | email | visita | reuniao | whatsapp | nota
data_hora     timestamptz
titulo        varchar(150)
descricao     text
usuario_id    integer       -- quem registrou
contato_id    integer NULL  -- com quem falou (entidade_contato_001)
proximo_contato date         -- agenda um follow-up
agenda_evento_id integer NULL -- se virou compromisso na Agenda
resultado     varchar(20)   -- positivo | neutro | negativo | sem_retorno
```

Campos de perfil (vão em `entidade_001` ou numa 1:1 `entidade_crm_001`):
`origem varchar(40)` (indicação, site, feira, prospecção...),
`segmento varchar(60)`, `data_primeiro_contato date`.

### 2.7 `entidade_vinculo_001` (vínculos entre entidades)

```
id
entidade_id       -- a entidade "dona" do vínculo
entidade_rel_id   -- a outra entidade (FK entidade_001)
tipo              varchar(20)  -- matriz | filial | grupo_economico | representante
                               -- | transportadora_padrao | contato_pf | controladora
observacao        varchar(200)
```

Ex: filial 002 tem vínculo `tipo=matriz, entidade_rel_id=001`.
Ex: PJ tem vínculo `tipo=contato_pf` apontando pra uma entidade PF que é
sócio/responsável.

### 2.8 `entidade_documento_001` (documentos com validade — aba Histórico)

```
id, entidade_id
tipo          varchar(30)   -- ie | contrato_social | certidao_fgts | certidao_federal
                            -- | certidao_estadual | alvara | contrato_comercial
numero        varchar(60)
emissao       date
validade      date
anexo_id      integer NULL  -- FK entidade_anexo_001
observacao    varchar(200)
```

Dashboard/lembrete: "documentos vencendo em 30 dias".

### 2.9 Auditoria — `entidade_log_001`

```
id, entidade_id, data_hora, usuario_id
acao       varchar(20)   -- criou | alterou | status | limite | excluiu_anexo ...
campo      varchar(60)
valor_de   text
valor_para text
```

Gravado pelo `entidadeService` em cada `atualizar` (diff dos campos).

---

## 3. Ajustes em `entidade_001`

- `origem`, `segmento`, `data_primeiro_contato` (CRM).
- `grupo_economico varchar(80)` (texto livre, ou vira cadastro depois).
- `limite_credito` já existe — passa a ser espelho de
  `entidade_credito_001.limite_credito` (trigger ou no service).
- Manter `telefone/celular/email` por compat, mas a UI passa a editar via
  `entidade_contato_meio_001` (contato_id null). No save, sincroniza o
  "principal" de volta pros campos legados (pra lupas antigas não quebrarem).

---

## 4. Backend

`entidadeService.js` cresce: cada aba com grid = uma função `syncX` no
mesmo padrão de `syncContatos`. As 1:1 (`comercial`, `credito`) = upsert
por `entidade_id`.

`obter(id)` retorna tudo aninhado:
`{ ...entidade, enderecos, contatos, meios, comercial, credito,
credito_hist, interacoes, vinculos, documentos, log }`.

Novos handlers pontuais:
- `entidade:registrarInteracao` (add rápido no CRM sem salvar a tela toda)
- `entidade:alterarLimite` (grava hist + atualiza)
- `entidade:documentosVencendo` (pro dashboard/lembrete)

Lembrete: integrar `entidade_documento_001.validade` no
`services/reminder.js` (já roda checagens periódicas).

---

## 5. Frontend

```
pages/entidade/
  index.jsx              -- shell: painel lateral + abas
  PainelResumo.jsx       -- card lateral fixo
  utils.js               -- (cresce)
  AbaDadosGerais.jsx     -- (existe, densificar)
  AbaEnderecos.jsx       -- grid entidade_endereco_001
  AbaContatos.jsx        -- (existe) contatos + meios aninhados
  AbaComercial.jsx       -- entidade_comercial_001 + lupas de entidade
  AbaFiscal.jsx          -- (existe)
  AbaFinanceiro.jsx      -- (existe) dados bancários
  AbaCredito.jsx         -- entidade_credito_001 + botão "alterar limite" + hist
  AbaRelacionamento.jsx  -- timeline entidade_interacao_001 + "nova interação"
  AbaVinculos.jsx        -- grid entidade_vinculo_001 com SeletorEntidade
  AbaAnexos.jsx          -- (existe)
  AbaHistorico.jsx       -- entidade_documento_001 (validade) + entidade_log_001
```

Componente novo reusável: **`SeletorEntidade`** (envolve `SeletorBusca` +
`window.api.entidade.buscarLookup`, com prop `papel`). Usado em Comercial
(vendedor, transportadora), Vínculos, e substitui os `buscarClientes`
locais de Viagens/Documentos/Agenda.

---

## 6. Ordem de implementação

1. Migrations (todas as tabelas + colunas). Rodar nos 3 bancos.
2. `SeletorEntidade` + trocar nas 3 telas antigas.
3. `entidadeService` — obter aninhado + syncs + handlers novos.
4. `index.jsx` novo (painel lateral + abas) + `PainelResumo`.
5. Abas novas, uma a uma (Endereços → Comercial → Crédito → Relacionamento
   → Vínculos → Histórico).
6. Auditoria (`entidade_log_001`) + integração no reminder.
7. Densificar Dados Gerais / Fiscal / Financeiro.

## 7. Riscos

- Muitas tabelas — `obter` fica com ~10 queries. OK (é 1 entidade por vez),
  mas paralelizar com `Promise.all`.
- `limite_credito` duplicado (entidade_001 + entidade_credito_001):
  decidir a fonte da verdade = `entidade_credito_001`; `entidade_001`
  vira espelho só de leitura pra compatibilidade.
- CRM pode crescer muito (`entidade_interacao_001`) — paginar a timeline
  (últimas 50, "carregar mais").
