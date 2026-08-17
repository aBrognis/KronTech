# Padrão de Arquitetura de Telas — KronTech

> **Regra permanente do projeto.** Este documento define como toda tela nova
> (ou alterada) do sistema deve ser construída. Não é uma sugestão — é a
> referência obrigatória antes de escrever qualquer tela.
>
> **Motivo de existir:** o sistema ficou com telas inconsistentes (algumas
> com lupa de busca, outras não; algumas com filtros, outras não) porque
> cada tela nova foi escrita "do jeito que achou melhor" em vez de reusar
> os componentes que já existem. Esse documento existe para isso nunca mais
> acontecer.

## Regra de ouro

> **Se uma função existe em uma tela do sistema, ela deve existir em toda
> tela equivalente. Nenhuma tela é "especial" a ponto de justificar reinventar
> lupa, filtro, paginação ou barra de ações do zero.**

Antes de escrever uma linha de UI nova, pergunte: **"já existe um
componente pronto pra isso?"** Na grande maioria dos casos, a resposta é
sim — a lista completa está na seção 2.

---

## 1. Duas formas de criar uma tela — escolha corretamente

### 1.1 Tela via FormBuilder (padrão preferencial, use sempre que possível)

Se a tela é um cadastro simples (uma tabela, campos, sem lógica visual
muito específica) — **cadastre-a no Designer → Telas**, não escreva código
React manualmente. É assim que Entidade, Usuário e a maioria das telas do
sistema funcionam. Cadastrando pelo Designer, a tela automaticamente ganha,
sem escrever nada:

- Aba **Acesso** (listagem paginada + filtros por coluna) e aba
  **Cadastro** (formulário com navegação entre registros).
- Lupa de busca em qualquer campo `lookup` (basta marcar
  `lookupModo: 'modal'` na configuração do campo).
- Barra de ações padrão (Incluir/Alterar/Excluir/Consultar/Gravar/Desistir).
- Paginação, ordenação de colunas, exportação CSV.
- Upload de arquivo, campos mascarados (CPF/CNPJ/CEP com autopreenchimento),
  sub-grade de itens simples (sem upload por linha — ver limitação abaixo).

Isso é gerado pelo motor único em `FormBuilderView.jsx` +
`formBuilderService.js` — qualquer tela cadastrada assim NUNCA fica
"diferente" de outra, porque é o mesmo código rodando para todas.

**Limitação conhecida:** a sub-grade nativa do FormBuilder
(`InputSubGrid.jsx`) não suporta upload de arquivo por linha. Se a tela
precisa disso, use a opção 1.2.

### 1.2 Tela manual (React própria) — só quando o FormBuilder não cobre o caso

Use uma página customizada (como Agenda, Arquivos, Viagens) **apenas**
quando a tela tem uma necessidade que o FormBuilder genuinamente não
resolve (ex: calendário com drag-and-drop, grid de itens com anexo por
linha). Nesse caso, a tela **é obrigada a replicar o mesmo padrão visual e
funcional** das telas FormBuilder, reusando os componentes da seção 2 —
nunca reescrevendo lupa, filtro ou paginação do zero.

Uma tela manual segue **sempre** este esqueleto:

```jsx
<div className="page-with-footer">
  <div className="page-tabs">
    <button className={`page-tab${activeTab==='acesso'?' active':''}`}>Acesso</button>
    <button className={`page-tab${activeTab==='cadastro'?' active':''}`}>Cadastro</button>
  </div>
  <div className="page-content">
    {/* aba Acesso: painel de filtros retrátil + tabela + paginação */}
    {/* aba Cadastro: formulário com campos, usando lupa real p/ qualquer FK */}
  </div>
  <FormToolbar mode={mode} nav={...} onIncluir={...} onAlterar={...} onGravar={...} onDesistir={...} />
</div>
```

---

## 2. Componentes que JÁ EXISTEM — use estes, não crie outros

### 2.1 Genéricos, para qualquer tela (`src/renderer/src/components/`)

| Componente | Arquivo | Para quê |
|---|---|---|
| `FormToolbar` | `components/FormToolbar.jsx` | Barra de ações do rodapé (Incluir/Alterar/Excluir/Consultar ↔ Gravar/Desistir) + navegação entre registros. **Toda tela de cadastro usa este componente, sem exceção.** |
| `PesquisaPadraoModal` | `components/PesquisaPadraoModal.jsx` | O modal de busca por trás de toda lupa do sistema. Recebe `onBuscar(campo, modo, busca, campoOrdem, ordem)` que você implementa para buscar no backend; o componente cuida de toda a UI. |
| `SeletorBusca` | `components/SeletorBusca.jsx` | Campo pronto (input somente-leitura + botão de lupa) que já abre o `PesquisaPadraoModal`. **Use este sempre que um campo referenciar outra tabela (cliente, consultor, entidade, etc.) — é o componente correto para "todo campo de FK tem lupa".** |
| `ErrorBoundary` | `components/ErrorBoundary.jsx` | Captura erros de render da tela e mostra fallback amigável. |

### 2.2 Específicos do padrão FormBuilder (`src/renderer/src/pages/formBuilderView/`)

Usados apenas por telas que manipulam o objeto `campo` do FormBuilder
(`{nome_campo, tipo, opcoes}`). Uma tela manual **não importa direto
daqui** — se precisar do mesmo comportamento, replica visualmente usando os
genéricos da seção 2.1, ou pede para promover o componente para
`components/` (ver seção 4).

| Componente | Arquivo | Para quê |
|---|---|---|
| `InputLookup` | `formBuilderView/inputs/InputLookup.jsx` | Campo de lookup com lupa, modo select ou modal. |
| `PainelFiltros` + `ColumnFilter` | `formBuilderView/PainelFiltros.jsx`, `formBuilderView/filters/*` | Painel de filtros retrátil, um filtro por coluna, aplicado só ao clicar "Buscar". |
| `PaginacaoBar` | `formBuilderView/PaginacaoBar.jsx` | Paginação (25/50/100/200 por página). **100% genérico, sem dependência de `campo` — pode ser usado por qualquer tela manual diretamente.** |

### 2.3 Badge de status

Não existe hoje um componente `StatusBadge` genérico oficial em
`components/`. Use as classes CSS já prontas do sistema:

```jsx
<span className="badge badge-green">Aprovado</span>
```

Classes disponíveis: `.badge-orange`, `.badge-blue`, `.badge-yellow`,
`.badge-green`, `.badge-purple` (definidas em `App.css`, linhas 500-506).

**Não use** `components/ui/badge.jsx` — é resíduo de um scaffold não
adotado pelo projeto, não está conectado a nada.

---

## 3. Classes CSS estruturais obrigatórias

Toda tela (FormBuilder ou manual) usa este esqueleto de classes, definidas
em `src/renderer/src/App.css`:

| Classe | Função |
|---|---|
| `.page-with-footer` | Container raiz da tela (flex column, altura 100%) |
| `.page-tabs` / `.page-tab` / `.page-tab.active` | Barra de abas Acesso/Cadastro |
| `.page-content` | Área de conteúdo scrollável |
| `.page-footer` | Rodapé fixo onde o `FormToolbar` se insere |
| `.badge`, `.badge-*` | Badges de status coloridos |

Nunca escreva uma tela nova com `position:fixed` + overlay do zero para o
"corpo" da página, nem reinvente a barra de abas — use essas classes.

---

## 4. Quando falta um componente genérico

Se você (ou eu, ao implementar) perceber que uma tela manual precisa de um
comportamento que só existe hoje dentro de `formBuilderView/` (acoplado ao
objeto `campo`), a ação correta é **promover** esse componente para
`components/` generalizando sua API — não copiar/colar o código nem
reinventar um parecido. Isso mantém a regra de ouro: um único componente-
fonte por funcionalidade, reusado em todo lugar.

---

## 5. Padrão de backend (IPC)

- Toda ação de banco passa por um handler em `src/main/handlers/<modulo>.js`,
  exportando `registerXHandlers({ ipcMain, wrap, query, queryOne })`,
  registrado em `src/main/ipcHandlers.js`.
- Nome de canal IPC: `<modulo>:<acao>` em camelCase (ex: `viagens:listar`,
  `arquivos:selecionarECopiar`).
- Toda resposta passa pelo envelope `wrap()` (`src/main/handlers/_shared.js`):
  `{ ok: true, data }` ou `{ ok: false, erro }`. Nunca retornar formato
  diferente.
- Exposição no `src/preload/index.js`: bloco `<modulo>: { acao: (args) =>
  ipcRenderer.invoke('<modulo>:acao', args) }`, mapeamento 1:1.
- Lógica de negócio complexa fica em `src/main/services/<modulo>Service.js`
  — o handler é só a casca fina que chama o service.

---

## 6. Checklist antes de considerar uma tela pronta

- [ ] Toda referência a outra tabela (cliente, consultor, entidade, etc.)
      tem lupa de busca real (`SeletorBusca` ou `InputLookup`), não um
      `<select>` que carrega tudo de uma vez sem busca.
- [ ] A tela tem aba Acesso (listagem + filtros + paginação) e aba Cadastro
      (formulário), usando `.page-tabs`/`.page-content`.
- [ ] O rodapé de ações usa `FormToolbar`, não botões soltos reinventados.
- [ ] Todo IPC novo segue `wrap()` e a convenção `modulo:acao`.
- [ ] Nenhum componente genérico foi duplicado — se algo parecido já existe
      em `components/` ou `formBuilderView/`, foi reusado ou promovido.
