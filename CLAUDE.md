# KronTech — Manual do Projeto

> **Leia este arquivo inteiro antes de qualquer trabalho.** Ele consolida
> tudo que estava espalhado em `docs/` (10 arquivos, sobrepostos). As regras
> aqui são obrigatórias, não sugestões, e várias já causaram retrabalho por
> serem ignoradas.
>
> Índice:
> 1. O que é o projeto
> 2. Ambiente e armadilhas conhecidas
> 3. Regras permanentes (texto, visual, fluxo)
> 4. Padrão de telas
> 5. Padrão de backend (IPC)
> 6. Schema e migrations
> 7. Lançar versão / release
> 8. Ritual de fim de sessão
> 9. Fora de escopo
> 10. Backlog vivo → `docs/BACKLOG.md`

---

## 1. O que é o projeto

ERP desktop. **Electron 30** (main/preload/renderer) + **React** (renderer,
Vite via `electron-vite`) + **PostgreSQL** (`pg`). App empacotado com
`electron-builder`, auto-update por **GitHub Releases** (`aBrognis/KronTech`).

Objetivo: produto vendável para empresas. Priorizar robustez e arquitetura
escalável sobre a solução mais simples.

Scripts:

| Comando | O que faz |
|---|---|
| `npm run dev` | `electron-vite dev` (via `scripts/dev.js`, que remove `ELECTRON_RUN_AS_NODE` antes). Modo dev nativo. |
| `npm run build` | `electron-vite build` → `out/`. |
| `npm run package` | `scripts/build.js` → instalador em `dist/` (sem assinatura, sem publish automático). |

O botão **"Lançar Versão"** dentro do app é o fluxo real de release (ver §7).

---

## 2. Ambiente e armadilhas conhecidas

- **`ELECTRON_RUN_AS_NODE`** — o ambiente do agente define essa variável, o
  que faz o Electron rodar como Node e quebra `require('electron')`. Sempre
  `unset ELECTRON_RUN_AS_NODE` antes de rodar build/package pela linha de
  comando. O `scripts/dev.js` já trata isso sozinho.

- **Devcache** — o app roda a partir de `C:\devcache\KronTech` (o `out/` do
  projeto é um symlink para lá; o Node resolve `require()` a partir desse
  caminho, usando `C:\devcache\KronTech\node_modules`). O `npm run dev`
  recompila do projeto, mas o código-fonte copiado (`src/`, `migrations/`)
  precisa estar atualizado no devcache para o build empacotado e para as
  migrations do boot.
  - **`npm run build` já sincroniza sozinho** (hook `postbuild` →
    `scripts/sync-devcache.js`). O `npm run package` também.
  - Sincronização manual, se precisar: `npm run sync-devcache`.
  - **Instalar dependência nova**: além do `npm install` no projeto, copiar
    `package.json` + `package-lock.json` para `C:\devcache\KronTech`, rodar
    `npm install` lá (SEM `--omit=dev`, já apagou o `electron` do devcache
    uma vez), depois apagar os dois manifests copiados.
  - **Se um bug parecer "impossível" dado o código, o bundle está velho ou o
    app não reiniciou.** Não reabra a investigação sem rodar `npm run build`
    (que sincroniza) e reiniciar o app.

- **3 bancos Postgres** coexistem:
  - `krontech` — produção
  - `krontech_dev` — o que `npm run dev` usa
  - `krontech_fake_prod` — teste de importação

  Credenciais dev: user `postgres`, senha `arizona9723`, `psql.exe` em
  `/c/Program Files/PostgreSQL/18/bin/`. Toda migration roda em `krontech`
  **e** `krontech_dev`. Antes de investigar "dado que não aparece", confira
  qual banco o `krontech.ini` aponta.

- **Nunca tocar o `krontech.ini`** ao atualizar o `.exe`. Regra crítica, já
  custou horas.

- **Auto-update travado** — se o cliente instalado não vê versão nova, checar
  `%LOCALAPPDATA%\krontech-updater\pending\`: um instalador baixado e não
  aplicado faz o `electron-updater` responder `update-not-available` para
  todas as versões seguintes. Tratado no código a partir da 1.2.49
  (`limparPendingObsoleto()` em `updater.js`), mas instalações já travadas
  precisam da limpeza manual uma vez.

- **`db.js` legado + `migrations/`** — dois mecanismos de schema (ver §6).

---

## 3. Regras permanentes

### Texto e mensagens

- **Nunca usar travessão (`—`, em dash)** em texto visível ao usuário: label,
  placeholder, mensagem de erro/sucesso, botão, título. Renderiza errado na
  UI. Use vírgula, ponto, ou reformule. Comentário de código não conta.
- **Nunca `alert()` / `confirm()` nativos.** Sempre o componente
  `Notificacao` do sistema.
- **Não** usar `notificar.sucesso('Registro incluído/alterado/excluído')` ao
  gravar — o retorno ao modo consulta já é o feedback. Exceção pontual:
  e-mail enviado (o modal fecha e não há outro sinal).
- Errors explicam o que deu errado e como corrigir. Sem "desculpe", sem
  vaguidão. Um controle diz exatamente o que faz ("Publicar", toast
  "Publicado").

### Visual

- **Cor de destaque é sempre `var(--or)` / `--or2..4`**, nunca hex fixo tipo
  `#FF6B2B`. Ela reage à cor que o usuário escolhe em Configurações (que
  sobrescreve `--or` via `!important` em runtime, ver `Configuracoes.jsx`).
  Todo elemento "ativo"/selecionado que usa cor de destaque tem que ter sua
  contraparte adicionada ao bloco de override em `Configuracoes.jsx` — procure
  por `.ni.active` nesse arquivo para o padrão.
- **Item ativo do sistema (Sidebar, `.ni.active`) é a referência de ouro**
  para qualquer navegação lateral nova: fundo em degradê horizontal sutil
  (`linear-gradient(90deg, rgba(cor,.11) 0%, rgba(cor,.03) 60%, transparent 100%)`),
  barra lateral de 3px com gradiente vertical da cor de destaque (`::before`),
  ícone com `filter: drop-shadow(...)` na cor de destaque. **Nunca fundo
  sólido chapado.** Vale igual no estado recolhido, sem exceção.
- **Avatar de iniciais é sóbrio**: fundo neutro (`var(--s3)`), nunca cor
  sólida saturada. A cor de identidade aparece só no texto das iniciais.
  Squircle (`border-radius: 30%`), não círculo.
- **Barra de rolagem**: 5px, thumb `var(--bd2)`, track transparente. É o
  padrão de `.page-content` / `.content` / `.dash-grid-area`. Não inventar
  barra mais grossa por tela.
- **"Poluído" / "feio" pede melhoria incremental de craft** (densidade,
  hierarquia, espaçamento) dentro da metáfora existente, não redesign do
  zero. Só proponha conceitos/mockups quando o usuário pedir isso
  explicitamente; se ele já rejeitou mockups antes, trabalhe direto no código
  real da tela.
- Não reinventar estrutura de tela já existente sem pedido explícito.

### Fluxo de trabalho

- **Investigar antes de perguntar.** Decidir sozinho tudo que for tecnicamente
  decidível pela leitura do código/dados. Só perguntar o que exige julgamento
  do usuário (prioridade, gosto, trade-off de produto).
- **Nunca "adivinhar" a causa de um bug e pedir teste às cegas repetido.** Se
  um teste não confirma a hipótese, reler o código com mais cuidado antes de
  pedir outro teste.
- Ao corrigir algo, verificar se a correção chegou ao app testado (build +
  sync). Bug "impossível" → suspeitar de bundle desatualizado / app não
  reiniciado.
- **Manter o projeto organizado proativamente**: limpar arquivos órfãos,
  lixo, código morto, sem precisar que peçam.
- **Backend nunca confia no formato do dado no banco.** Entrada legada é
  normalizada e blindada no service, sempre. Migração de tela antiga → nova
  sempre inclui migration de **dados**, não só de schema.

---

## 4. Padrão de telas

> Motivo de existir: o sistema ficou com telas inconsistentes (umas com lupa,
> outras não; umas com filtro, outras não) porque cada tela nova foi escrita
> "do jeito que achou melhor". Isso não acontece mais.

### Regra de ouro

**Se uma função existe em uma tela do sistema, ela existe em toda tela
equivalente. Nenhuma tela é "especial" a ponto de justificar reinventar lupa,
filtro, paginação ou barra de ações do zero.**

Antes de escrever UI nova: **"já existe um componente pronto pra isso?"** Quase
sempre a resposta é sim.

### Como criar uma tela — escolha certo

1. **Cadastro simples de uma tabela** → cadastre no **Designer → Telas**
   (FormBuilder). Zero código. Ganha Acesso + Cadastro + lupa + paginação +
   ordenação + CSV + FormToolbar automaticamente, tudo pelo motor único
   `FormBuilderView.jsx` + `formBuilderService.js`.
   Limitação: a sub-grade nativa não suporta upload por linha.

2. **Cadastro simples que precisa vir nativo** (cliente final não monta tela)
   → molde **`TelaCadastroPadrao`** (`components/cadastroPadrao/`). ~50 linhas
   de config, sai idêntica às do FormBuilder. Referência viva:
   `components/cadastroPadrao/_EXEMPLO_TelaBancos.jsx`. Exemplos reais:
   Bancos, Naturezas Jurídicas, Condições de Pagamento.

3. **Tela tipo ERP** (abas, grid-filho com CRUD, API externa, layout próprio)
   → página React dedicada. **Obrigada a replicar** o padrão visual/funcional,
   reusando os componentes abaixo. Nunca reescrever lupa, filtro, paginação.
   Exemplos: Entidade, E-mail, Agenda, Viagens.

### Componentes que JÁ EXISTEM — use estes

`src/renderer/src/components/`:

| Componente | Para quê |
|---|---|
| `FormToolbar` | Barra de ações do rodapé (Incluir/Alterar/Excluir/Consultar ↔ Gravar/Desistir) + navegação entre registros. **Toda tela de cadastro usa, sem exceção.** |
| `PesquisaPadraoModal` | Modal de busca por trás de toda lupa. Recebe `onBuscar(campo, modo, busca, ...)`. |
| `SeletorBusca` | Campo pronto (input readonly + botão de lupa) que abre o `PesquisaPadraoModal`. **Use sempre que um campo referenciar outra tabela.** |
| `SeletorEntidade` | Lupa específica de `entidade_001` (cliente, fornecedor, transportadora, vendedor). Wrapper de `SeletorBusca` + `entidade:buscarLookup`, com prop `papel`. |
| `SecaoForm` (`SecaoHeader`, `FormBlocos`) | Divisores de seção do formulário (ver abaixo). **Fonte única, nunca reescrever inline.** |
| `InputData` | Todo campo de data. Atalhos: `R` = data mínima, `Y` = máxima, `T` = hoje, `+`/`-` = ±1 dia. **Nunca `<input type="date">` cru.** |
| `InputCidade` | Autocomplete de municípios do Brasil (`municipio_001`, 5571 linhas). `upper` força caixa alta. |
| `PaginacaoBar` | Paginação (25/50/100/200). 100% genérico. |
| `MenuContextoGrid` | Menu de clique-direito em grid (status em massa). |
| `GridFilho` (`cadastroPadrao/`) | Grid editável de linhas-filhas. Suporta `render(linha, setPatch)` por coluna. |
| `ErrorBoundary` | Fallback amigável em erro de render. |

Badge de status: use as classes `.badge .badge-green` (`.badge-orange`,
`.badge-blue`, `.badge-yellow`, `.badge-purple`), definidas em `App.css`.
**Não use** `components/ui/badge.jsx` — foi removido, era scaffold não adotado.

### Esqueleto de uma tela manual

```jsx
<div className="page-with-footer">
  <div className="page-tabs">
    <button className={`page-tab${activeTab==='acesso'?' active':''}`}>Acesso</button>
    <button className={`page-tab${activeTab==='cadastro'?' active':''}`}>Cadastro</button>
  </div>
  <div className="page-content">
    {/* aba Acesso: painel de filtros retrátil + tabela + paginação */}
    {/* aba Cadastro: formulário, lupa real p/ toda FK */}
  </div>
  <FormToolbar mode={mode} nav={...} onIncluir={...} onAlterar={...} onGravar={...} onDesistir={...} />
</div>
```

Classes estruturais obrigatórias (em `App.css`): `.page-with-footer`,
`.page-tabs` / `.page-tab` / `.page-tab.active`, `.page-content`,
`.page-footer`. Nunca escrever `position:fixed` + overlay do zero para o
corpo da página.

### Aba de Acesso — filtros ABRANGENTES (OBRIGATÓRIO)

A aba de Acesso é onde o usuário **consulta tudo** de uma tela. Ela **não
pode** ter só "os filtros básicos" (nome + status + uma UF). Regra:

> **Se a tabela tem a coluna, a aba de Acesso tem um filtro para ela.**
> Um punhado de filtros escolhidos "na mão" é violação do padrão.

Fonte única: **`components/PainelFiltrosGrid.jsx`** — painel retrátil, um
filtro por coluna, tipado, em grade responsiva, mais busca geral. Filtros só
aplicam ao clicar "Buscar" (ou Enter). Reusa os `Filter*` do FormBuilder
(`pages/formBuilderView/filters/`) — que já são genéricos.

**Tela via `TelaCadastroPadrao`:** passe a prop `colunasFiltro`:

```jsx
const COLUNAS_FILTRO = [
  { chave: 'codigo', label: 'Código', tipo: 'texto' },
  { chave: 'tipo', label: 'Tipo', tipo: 'exato', opcoes: TIPOS },
  { chave: 'ativo', label: 'Ativo', tipo: 'booleano' },
  { chave: 'valor_minimo', label: 'Valor mínimo', tipo: 'numero' },
  { chave: 'criado_em', label: 'Cadastrado em', tipo: 'data' },
  // ...uma entrada por coluna consultável da tabela
]
<TelaCadastroPadrao colunasFiltro={COLUNAS_FILTRO} ... />
```

E na config do backend (`criarCadastroPadrao` ou o service próprio), declare
`colunasFiltro: [{ chave, tipo }]` — o factory monta o `WHERE` sozinho via
`services/filtroSqlGenerico.js` (`montarFiltro`).

**Tela React dedicada (Entidade etc.):** monte `COLUNAS_FILTRO` do mesmo
jeito, renderize `<PainelFiltrosGrid colunas={...} valores={...} onChange={...}
onBuscar={...} onLimpar={...} busca={...} onBusca={...} />`, e no service use
`montarFiltro(filtros, TIPOS_POR_COLUNA, { alias })`.

Tipos de filtro:

| tipo | controle | operador |
|---|---|---|
| `texto` | input "contém" | `ILIKE '%...%'` |
| `numero` | de / até | `>= AND <=` |
| `data` | de / até (date) | `>= AND <=` |
| `booleano` | Todos / Sim / Não | `= true/false` |
| `exato` | dropdown (precisa de `opcoes: [{valor,label}]`) | `=` |

Quando um filtro de `status`/`ativo` é usado, o service **deixa de forçar
"só ativos"** — o usuário pode querer ver inativos/bloqueados.

Cadastro trivial de 2-3 colunas (sem `colunasFiltro`) cai no modo antigo de
"busca geral" simples — só aceitável aí.

### Estado inicial — regra de ouro

**Toda tela manual abre da mesma forma, sem exceção:**

1. `activeTab` inicia em `'cadastro'`, nunca `'acesso'`.
2. Ao montar, carrega a lista completa; se houver ao menos um registro,
   carrega o **último** no formulário, em **modo `view`** (consulta), nunca
   `'new'`/`'edit'`.
3. Lista vazia → form com campos vazios, ainda em `view`. **Nunca chamar
   `openNew()`/`handleIncluir()` automaticamente no carregamento.**

O erro comum (já corrigido em `CofreSenhas.jsx` e `viagens/index.jsx`) é copiar
um `carregarTudo()` com `if (lista.length) {...} else { openNew() }` — isso abre
em modo edição quando o cadastro está vazio.

```js
const carregarTudo = useCallback(async () => {
  setLoading(true)
  try {
    const res = await window.api.<modulo>.listar({})
    const lista = res.ok ? res.data || [] : []
    setRegistros(lista)
    if (lista.length) {
      const ultimo = lista.length - 1
      setCurrentIdx(ultimo)
      await carregarForm(lista[ultimo])
    }
    // lista vazia: form fica vazio, view
  } finally { setLoading(false) }
}, [])
```

### Divisores de seção e espaçamento (OBRIGATÓRIO)

Todo formulário de cadastro é dividido em blocos com um divisor: rótulo curto
em **maiúsculas** + linha horizontal do fim do texto até a borda. **Sem fundo
atrás do rótulo** (herda a cor de fundo do sistema, funciona claro e escuro).

Fonte única: **`components/SecaoForm.jsx`**. Nunca reescrever o divisor inline.

```jsx
import SecaoForm, { SecaoHeader, FormBlocos } from '../components/SecaoForm.jsx'
```

| Situação | Use | Como |
|---|---|---|
| Tela **manual** com layout de campos próprio (Arquivos, Cofre, Despesas) | `<SecaoHeader titulo="..." />` | Irmão dos `.form-group` dentro de um container `flex column` com `gap: 10`. Só o cabeçalho. |
| Tela **nova** montada com helpers (`CampoTexto`, `CampoSelect`, ...) | `<FormBlocos>` + `<SecaoForm titulo="...">` | O `SecaoForm` traz cabeçalho **e** grid de campos. `cols` controla o grid (default 2 colunas). |

Métrica (definida em `SecaoForm.jsx`, **não replicar**):

| Constante | Valor | Onde |
|---|---|---|
| `DIV_TOPO` | 14px | acima da linha (separa do bloco anterior) |
| `DIV_BASE_HEADER` | 8px | abaixo da linha no `<SecaoHeader>` (+ `gap: 10` do container = **18px reais** até o 1º campo) |
| `DIV_BASE_FORM` | 18px | abaixo da linha no `<SecaoForm>` |
| gap entre campos | `10px 14px` | dentro de uma seção |
| gap entre blocos (tela manual) | `10` | no `flex column` que envolve os `SecaoHeader` |

Resultado: **~18px entre a linha divisória e o primeiro campo, em qualquer
tela.** Se o espaçamento parecer errado, o problema é o container (o `gap` do
`flex column` tem que ser 10). **Nunca `marginTop`/`marginBottom` ad-hoc** nos
`SecaoHeader` para "consertar".

Rótulos curtos: Identificação, Contato, Endereço, Fiscal, Financeiro,
Complemento, Observações. Último bloco costuma ser "Complemento" (observações +
flag `ativo`).

Botão de ação de um bloco (ex: "Adicionar linha") vai na própria linha do
divisor, à direita, com `flexShrink: 0` (o `SecaoHeader` ainda não aceita
`children`; replique o markup — única exceção).

### Quando falta um componente genérico

Se uma tela manual precisa de algo que só existe hoje dentro de
`formBuilderView/` (acoplado ao objeto `campo`): **promova** esse componente
para `components/` generalizando a API. Não copiar/colar, não reinventar
parecido. Um único componente-fonte por funcionalidade.

### Checklist antes de considerar uma tela pronta

- [ ] Toda referência a outra tabela tem lupa real (`SeletorBusca` /
      `InputLookup`), não `<select>` que carrega tudo.
- [ ] Tem aba Acesso (listagem + filtros + paginação) e aba Cadastro, usando
      `.page-tabs` / `.page-content`.
- [ ] A aba Acesso usa `PainelFiltrosGrid` com **um filtro por coluna
      consultável** da tabela, não só 3-4 filtros escolhidos na mão.
- [ ] Estado inicial: abre em `activeTab='cadastro'`, modo `view`, nunca
      dispara `openNew()` sozinha.
- [ ] Rodapé usa `FormToolbar`, não botões soltos.
- [ ] Formulário dividido com `SecaoHeader` / `SecaoForm`. Container `flex
      column` com `gap: 10`. Nenhum divisor inline, nenhum `marginTop` ad-hoc.
- [ ] Sem `notificar.sucesso('Registro incluído/...')` ao gravar/excluir.
- [ ] Todo campo de data usa `InputData`.
- [ ] Todo IPC novo segue `wrap()` e `modulo:acao`.
- [ ] Nenhum componente genérico duplicado.

---

## 5. Padrão de backend (IPC)

- Toda ação de banco passa por um handler em
  `src/main/handlers/<modulo>.js`, exportando
  `registerXHandlers({ ipcMain, wrap })`, registrado em
  `src/main/ipcHandlers.js`.
- Canal IPC: `<modulo>:<acao>` em camelCase (ex: `viagens:listar`,
  `arquivos:selecionarECopiar`).
- Toda resposta pelo envelope `wrap()` (`src/main/handlers/_shared.js`):
  `{ ok: true, data }` ou `{ ok: false, erro }`. Nunca outro formato.
- Preload (`src/preload/index.js`): bloco
  `<modulo>: { acao: (args) => ipcRenderer.invoke('<modulo>:acao', args) }`,
  mapeamento 1:1.
- Lógica de negócio complexa em `src/main/services/<modulo>Service.js`. O
  handler é só a casca fina que chama o service.

---

## 6. Schema e migrations

**Toda tabela ou coluna nova entra por migration versionada em
`migrations/`**, nunca mais direto em `src/main/db.js`.

`db.js` (o mecanismo antigo, ~1.250 linhas) concentra o schema legado num
arquivo só, sem histórico, sem rollback, com falhas de DDL que só geram
`console.warn`. Não é reescrito: continua respondendo por tudo que já existia
(Agenda, FormBuilder, Funções). `node-pg-migrate` roda como segunda trilha,
só para schema novo, com histórico real, rollback (`up`/`down`) e falha
visível (erro logado alto e propagado).

Criar:
```bash
npx node-pg-migrate create nome-da-mudanca --migrations-dir migrations
```

Convenção: nome de tabela termina em `_NNN` (ex: `_001`).

Testar:
```bash
DATABASE_URL="postgres://postgres:arizona9723@localhost:5432/krontech_dev" \
  npx node-pg-migrate up -m migrations --migrations-table pgmigrations
```
Rodar em **`krontech` e `krontech_dev`**, sempre os dois.

Em produção, `src/main/migrate.js` chama `runMigrations()` no boot. Em app
empacotado, `migrations/` vai para fora do ASAR via `"extraResources"` no
`package.json` e fica em `process.resourcesPath/migrations`.

Migração de tela antiga → nova: **sempre** inclui migration de dados junto,
não só de schema (o formato antigo do dado pode não bater com a UI nova; ex:
`entidade_001.papeis` era `CFP`, virou `cliente,fornecedor`).

---

## 7. Lançar versão / release

O botão **"Lançar Versão"** dentro do app (`LancarVersaoModal.jsx` →
`lancarVersaoService.js`) faz: bump de versão, build, empacotamento
(`electron-builder`), commit `chore: vX.Y.Z`, e publica a release no GitHub
via API REST usando o **token cifrado guardado em Configurações → Token do
GitHub** (`getDecryptedGithubToken()`), **não** o `GH_TOKEN` do ambiente.

Se der `Falha ao criar release no GitHub (401)`: o token salvo em
Configurações expirou. Gerar novo em github.com/settings/tokens (classic,
escopo `repo`) e colar em Configurações → Token do GitHub.

**O bump de versão é o ÚLTIMO commit, não o único.** Commitar o código da
sessão antes, com mensagem descritiva.

Não implementado (por decisão do dono): assinatura digital do instalador
(SmartScreen mostra "Editor desconhecido"), publish automático via
`--publish` no `scripts/build.js`. Detalhes em `docs/historico/RELEASE.md`.

### RELEASE_NOTES.md

Escrever proativamente ao fim de cada sessão relevante, template formal
estruturado (sem campo de versão manual), cobrindo tudo desde a última
escrita. O arquivo é consumido/apagado pelo "Lançar Versão", por isso está no
`.gitignore`.

---

## 8. Ritual de fim de sessão

1. **Build passou + devcache sincronizado**, verificado.
2. **Commit descritivo** do que foi feito (não só o bump de versão).
3. **`RELEASE_NOTES.md` atualizado** no template formal.

---

## 9. Fora de escopo — não retomar sem pedido explícito

- **Módulo fiscal** (CFOP, NCM, IBS/CBS, Reforma Tributária) — duas
  tentativas reprovadas por interface. Banco sem nenhuma tabela fiscal. O
  problema nunca foi o backend, foi a UI; qualquer retomada começa por
  desenhar a tela COM o usuário. Infra externa dorme em
  `github.com/aBrognis/krontech-fiscal`.
- **Financeiro** (Contas a Pagar / Receber) — removido do projeto.
- **Migração para Supabase** — feita e revertida. Produção usa Postgres
  local.

---

## 10. Backlog

Ver `docs/BACKLOG.md` — o que está pendente e aprovado. Histórico de planos
já implementados em `docs/historico/`.
