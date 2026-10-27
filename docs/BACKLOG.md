# KronTech — Backlog

> O que está pendente e aprovado. Atualizar ao fim de cada sessão: mover o
> que foi feito para "Concluído recentemente" (ou apagar), adicionar o que
> surgir. Planos já implementados por inteiro vão para `docs/historico/`.
>
> **Fora de escopo** (não retomar sem pedido explícito): módulo fiscal,
> Financeiro, Supabase. Ver `CLAUDE.md` §9.

---

## Aberto

### E-mail (lista do usuário, 27/10)

- ✅ **Links externos** — confirmado funcionando pelo usuário. Resolvido.
- ✅ **Mensagem "não lida" errada** — a sincronização nunca lia a flag
  `\Seen` do servidor IMAP; todo e-mail baixado nascia "não lida" mesmo já
  tendo sido lido no celular/webmail antes. Corrigido: semeia `lida` a
  partir de `msg.flags` na sincronização, e `marcarLida`/`marcarLidaLote`
  agora espelham o estado de volta pro servidor (`\Seen`), em segundo
  plano, sem travar a UI se a conta estiver offline.
- ✅ **Assinatura digital S/MIME como anexo** — o `mailparser` entrega a
  parte PKCS#7 (`.p7s`/`.p7m`) como anexo comum, nunca era filtrada.
  Reconhecida agora por content-type e nome padrão, excluída da lista de
  Anexos. (Nenhum e-mail assinado digitalmente no banco ainda pra conferir
  visualmente — só confirma de fato quando chegar um.)
- ✅ **Fonte/resolução inconsistente** — 1ª rodada só forçou `font-family`;
  o usuário trouxe 2 prints do mesmo template de e-mail automático (mesmo
  remetente) com `font-size` bem diferente entre eles, confirmando que
  faltava normalizar o tamanho também. Corrigido (commit `df41850`):
  `body` com `font-size: 14px` base + reforço `!important` nas tags de
  texto corrido (p/span/td/th/li/a), com `h1`-`h6` (e filhos) preservados
  via `font-size: revert` pra não esmagar título real. Mais o fix anterior
  do `transform: scale()` que encolhia o corpo inteiro por causa de 1
  elemento largo (piso de escala 0.8, rola na horizontal abaixo disso).
  **Ainda não validado visualmente pelo usuário após este 2º ajuste.**

Itens antigos ainda pendentes: `PaginacaoCompacta` de `ListaMensagens.jsx`
reimplementa o `PaginacaoBar` genérico "porque a coluna é estreita" (dívida
menor).

### Integrações futuras — pré-requisito concluído, integrações ainda não

- ✅ **Tela "Parâmetros"** (esta sessão) — pré-requisito das 3 integrações
  abaixo, entregue e funcional. `kr_parametros_001` (migration
  `1793142135480_criar-parametros`): colunas tipadas (`chave`, `categoria`,
  `rotulo`, `descricao`, `tipo`, `opcoes` jsonb, `valor`), não chave-valor
  puro. `parametrosService.js` com cache em memória por chave (mesmo
  precedente de `oauthService.js`). Handlers `parametros:listar/
  listarCategorias/obter/atualizar`. Tela `pages/Parametros.jsx` (menu
  Ferramentas): abas por categoria, filtro de texto, lista com badge Sim/Não,
  editor lateral (nunca `<select>` pra booleano, dois radio Sim/Não). Hook
  `lib/useParametros.js` (`useParametro(chave)`) pras telas consumirem a
  flag sem bater no IPC toda hora — invalidado via `CustomEvent
  krontech:parametros-changed`, mesmo padrão leve de
  `krontech:config-changed`. **Sem multi-empresa** (decisão: 1 banco = 1
  cliente, não precisa), **sem aba "Parâmetros Tela"**, **1 valor por
  parâmetro** (não multi-posição) — escopo reduzido por decisão do usuário
  ao comparar com o print de referência (ERP legado com centenas de
  parâmetros multi-posição e por empresa).
  Seed inicial (3 parâmetros, todos `valor='N'`, opt-in):
  `agenda.integracao_erp_externo`, `agenda.meet_grava_automatico`,
  `whatsapp.habilitado`. Nenhum tem função real ligada ainda.

As 3 integrações em si continuam **sem plano aprovado**, cada uma precisa de
investigação técnica (API, autenticação, limites) antes de virar plano:

- **Integração com a API de um ERP de terceiro ↔ Agenda do sistema**,
  trazendo atendimentos e assuntos. Chave já reservada:
  `agenda.integracao_erp_externo`. Tratar sempre como "o ERP externo do
  cliente" nos textos versionados (nunca citar o nome próprio desse ERP, por
  pedido explícito do usuário).
- **Criar link do Meet → gravar automaticamente na Agenda do sistema**.
  Chave já reservada: `agenda.meet_grava_automatico`. Precisa decidir o
  gatilho: hook no botão de criar reunião, ou integração com Google
  Calendar API observando eventos novos.
- **Tela de WhatsApp dentro do sistema**. Chave já reservada:
  `whatsapp.habilitado`. Decisão grande de arquitetura antes de qualquer
  código: API oficial (WhatsApp Business Cloud API, paga, precisa número
  dedicado e aprovação Meta) vs. biblioteca não oficial (baileys/
  whatsapp-web.js, grátis mas não suportada oficialmente, risco de ban).
  Também decidir armazenamento (Postgres, como o e-mail) e se é 1 número
  por empresa ou por usuário.

Ordem sugerida: WhatsApp (maior impacto de produto) → Meet→Agenda (mais
simples) → ERP externo → Agenda (mais específico de 1 cliente). Cada uma
leva um plano curto pro usuário aprovar antes de codar.

---

## Concluído recentemente

- **Filtros da aba Acesso nível ERP** (esta sessão): FK vira lupa,
  multi-escolha vira checkbox, como **regra global do padrão** (nativas +
  FormBuilder), não feature de tela.
  - `montarFiltro` (`filtroSqlGenerico.js`) ganhou família `lookup`
    (`col = ANY(ids::int[])`), `exato`+`multi` (`= ANY`), `exato`+`multi`+`csv`
    (ILIKE OR com vírgulas nas pontas, p/ `papeis`), e passou a aceitar
    `tiposPorColuna[chave]` como string OU `{ tipo, multi, csv, castArray }`.
  - `buildFiltroSQL` / `opGroupForTipo` (`formBuilderService.js`): `lookup`
    virou grupo próprio; `exato` aceita `f.valores` array.
  - `cadastroPadraoFactory.js` propaga as flags do `colunasFiltro` pro
    `montarFiltro`.
  - Novos: `components/filtros/FilterLookup.jsx` (chips + lupa, reusa
    `PesquisaPadraoModal` + `window.api.form.query`) e
    `components/filtros/FilterExatoMulti.jsx` (grupo de checkboxes).
  - `PainelFiltrosGrid.jsx` + `formBuilderView/PainelFiltros.jsx`: `lookup` e
    `exato`+`multi` são filtros fixos; largos ocupam `span 2`.
  - `ColumnFilter.jsx` / `FilterExato.jsx` do FormBuilder: `lookup` e
    `select`/`radio` com opções agora renderizam checkboxes; `lookup` usa as
    opções já pré-carregadas em `lookupOpcoes`.
  - Telas que declararam filtros novos: Entidade (banco / natureza jurídica /
    condição de pagamento = lupa; papéis / status / tipo de pessoa / regime /
    UF = checkbox), Bancos, Naturezas Jurídicas, Condições de Pagamento,
    Documentos Gerados (tipo de documento = lupa), Despesas de Viagem
    (cliente / consultor = lupa), Cofre de Senhas, Arquivos.
  - `CLAUDE.md` §4: tabela de tipos de filtro + regra de ouro documentada.

- **E-mail: Caixa de Saída revisada** (esta sessão):
  - A listagem agora traz `envio_status` / `envio_erro` /
    `envio_proxima_tentativa`; a Caixa de Saída tem renderização própria
    (`ItemSaida` em `ListaMensagens.jsx`): destinatário + chip de status
    ("Na fila · nova tentativa em X" / "Falhou: <motivo>") + ações por item
    (reenviar agora, editar, descartar).
    `descreverStatusSaida` em `email/utils.js`.
  - Backend: `descartarDaFilaSaida` e `moverFilaParaRascunho` em
    `emailEnvioService.js`; handlers `email:descartarDaFila` /
    `email:editarDaFila`.
  - Leitor mostra o `envio_erro` de um e-mail preso (antes só mostrava a
    resposta de sucesso).
  - Composer: confirma o descarte ao fechar com conteúdo não salvo; bloqueia
    o envio se houver endereço malformado (`emailsInvalidos`).
  - Fila reprocessada a cada 60s por um tick dedicado (`INTERVALO_FILA_MS`),
    não mais só junto do sync IMAP de 5min.
  - `tentarFilaSaida` reusa um transporte SMTP com pool por conta.
  - Cópia do enviado sobe pra pasta "Enviados" do servidor via IMAP APPEND
    (`apendarEmailEnviado` em `emailSyncService.js`), com Message-Id fixo pra
    o sync não duplicar a linha.
- **FormBuilder: seletor de colunas na aba Acesso** (esta sessão): o
  mecanismo de colunas visíveis foi extraído para `components/
  SeletorColunas.jsx` (`useSeletorColunas` + `<BotaoSeletorColunas>`),
  `TabelaResultados` passou a consumi-lo, e a aba Acesso do FormBuilder
  (`formBuilderView/AbaAcesso.jsx`) ganhou o botão "Colunas" (2 primeiras
  fixas, 6 seguintes marcadas por padrão, preferência salva por tabela). O
  filtro por coluna continua abrangendo todos os campos, visíveis ou não.
- **Datas em objeto Date pelo IPC** (esta sessão): o Electron manda `Date`
  pelo IPC como `Date` de verdade (structured clone, não JSON). Vários
  `fmtData` faziam `String(x).slice(0,10).split('-')` e saíam
  `undefined/undefined/Mon Aug 17` (visível na aba Acesso da Entidade e das
  Viagens). Criada `lib/utils/data.js` (`fmtDataBR` / `fmtDataHoraBR`, fonte
  única) e os call sites de Entidade, Viagens e Cofre apontados para ela.
- **Aba de Acesso completa nas telas restantes** (esta sessão): Documentos
  Gerados, Arquivos, Cofre de Senhas e Despesas de Viagem ganharam
  `PainelFiltrosGrid` (um filtro por coluna) + `TabelaResultados` (seletor de
  colunas). Cofre e Viagens ganharam alternador Cards / Tabela. SQL das
  listagens enriquecido (dados da entidade cliente, contagens de filhos,
  flags derivadas). Documentado no `CLAUDE.md` §4.
- **Aba de Acesso robusta nas telas nativas** (sessão anterior): Entidade,
  Bancos, Naturezas Jurídicas, Condições de Pagamento.
- **E-mail: campo de destinatários por chip** (Para/Cc/Cco) com Enter,
  autocomplete do histórico + contatos de Entidade (`email:sugerirContatos`).
- **E-mail: confirmação de envio** ("E-mail enviado" ao concluir).
- **E-mail: recebimento mais rápido** — no aviso do IMAP IDLE, sincroniza a
  Caixa de Entrada primeiro (`sincronizarSoInbox`), demais pastas em segundo
  plano.
- **Entidade: papéis** — bug de persistência corrigido (`toUpperCase` no
  service quebrava o match), dados legados normalizados (migration
  `1788893668776`), UI trocada de botão-pílula para checkbox, coluna
  `papeis` ampliada para `varchar(255)`.
- **Auto-update**: `limparPendingObsoleto()` no boot do updater, resolve o
  caso de um instalador baixado e não aplicado travar a detecção de versões
  novas.
- **Build do instalador**: `backup/` (2,1 GB de dumps) removido, `.gitignore`
  e `package.json` reforçados contra dumps no pacote, `app.asar` de 2,2 GB →
  114 MB.
- **Reorganização do repositório**: 130+ arquivos sem commit versionados
  (incluindo 39 migrations), código morto removido, documentação consolidada
  em `CLAUDE.md`.
- **Agenda — conflito / drag-drop**: resolvido (confirmado pelo usuário).
- **Dashboard — abas sobrepostas**: resolvido (confirmado pelo usuário).

---

## Histórico de planos implementados

Ver `docs/historico/`:

- `PLANO_ENTIDADE_COMPLETA.md` — tela de Entidade nível ERP (12 tabelas, 8
  abas).
- `PLANO_EMAIL_ARMAZENAMENTO.md` — enxugamento do armazenamento de e-mail
  (base64 → ponteiro `kmail://` + hidratação na leitura; 978 MB → 24 MB).
- `RELEASE.md` — o que falta para assinatura digital e publish automático.
