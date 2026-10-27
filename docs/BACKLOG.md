# KronTech — Backlog

> O que está pendente e aprovado. Atualizar ao fim de cada sessão: mover o
> que foi feito para "Concluído recentemente" (ou apagar), adicionar o que
> surgir. Planos já implementados por inteiro vão para `docs/historico/`.
>
> **Fora de escopo** (não retomar sem pedido explícito): módulo fiscal,
> Financeiro, Supabase. Ver `CLAUDE.md` §9.

---

## Aberto

### E-mail (lista do usuário, 27/10) — PRÓXIMO A INICIAR

Vários bugs acumulados, levantados pelo usuário, ainda não investigados a
fundo:

- **Mensagem não lida não atualiza** — indicador de lida/não lida com
  comportamento errado.
- **Links externos não abrem** — clicar num link do corpo do e-mail não faz
  nada (ou abre errado). Investigar o handler de links no leitor de e-mail
  (provavelmente falta `shell.openExternal` / target blindado).
- **Resolução/fonte inconsistente do corpo do e-mail** — ora abre com boa
  resolução, ora com letra pequena; ora com uma fonte, ora com outra. Cheiro
  de falta de normalização do HTML recebido (sem CSS reset no iframe/sandbox
  de renderização, ou herdando estilo inline variado de cada remetente).
- **Anexos mal separados** — assinatura digital (provavelmente .p7s/.asc de
  e-mails assinados S/MIME) está entrando como anexo visível. Precisa
  decidir de vez a lógica de o que conta como "anexo real" x parte MIME
  técnica (assinatura, inline image referenciada no HTML, etc.) e aplicar de
  forma consistente no parser de recebimento.
- Itens antigos ainda pendentes: `PaginacaoCompacta` de `ListaMensagens.jsx`
  reimplementa o `PaginacaoBar` genérico "porque a coluna é estreita" (dívida
  menor).

**Não iniciar sem mapear os bugs no código primeiro** (seguir CLAUDE.md:
investigar antes de perguntar, nunca advinhar causa e pedir teste às cegas).

### Integrações futuras (lista do usuário, 27/10) — AINDA NÃO APROVADAS PARA EXECUÇÃO

Levantadas pelo usuário como visão, mas nenhuma tem plano aprovado ainda.
Cada uma precisa de investigação técnica (API disponível? autenticação?
limites?) antes de virar plano:

- **Integração com a API de um ERP de terceiro ↔ Agenda do sistema**,
  trazendo atendimentos e assuntos. **Função opt-in por tela de parâmetros**
  (ver item "tela de Parâmetros" abaixo) — não é todo cliente que usa esse
  ERP, não pode virar comportamento padrão do produto. Tratar sempre como
  "o ERP externo do cliente" nos textos versionados (nunca citar o nome
  próprio desse ERP, por pedido explícito do usuário).
- **Criar link do Meet → gravar automaticamente na Agenda do sistema**,
  também via parâmetro (nem todo cliente quer o evento duplicado na Agenda).
  Precisa decidir o gatilho: hook no botão de criar reunião, ou integração
  com Google Calendar API observando eventos novos.
- **Tela de WhatsApp dentro do sistema** — usar WhatsApp integrado ao
  KronTech. Decisão grande de arquitetura antes de qualquer código: API
  oficial (WhatsApp Business Cloud API, paga, precisa número dedicado e
  aprovação Meta) vs. biblioteca não oficial (baileys/whatsapp-web.js,
  grátis mas não suportada oficialmente, risco de ban). Também decidir
  armazenamento (mensagens no Postgres, como o e-mail) e se é 1 número por
  empresa ou por usuário.
- **Tela "Parâmetros" sólida e nova** — tela central onde o usuário liga/
  desliga funções opcionais (as 3 integrações acima dependem dela), e essas
  flags mudam o comportamento de outras telas em runtime. Arquitetura:
  provavelmente uma tabela `kr_parametros_001` (chave/valor ou colunas
  tipadas por domínio), um serviço central (`parametrosService.js`) com
  cache em memória (não bater no banco a cada render), e um hook/contexto
  React (`useParametros()`) pras telas consultarem. **Esta tela é
  pré-requisito das 3 integrações acima** — melhor sequência:
  1) desenhar e aprovar a tela de Parâmetros primeiro (ela sozinha já é
     entregável, mesmo sem nenhuma integração ligada ainda);
  2) depois cada integração entra como 1 parâmetro + sua função.

**Nenhuma das 4 acima tem plano aprovado.** Antes de codar qualquer uma,
investigar a API/viabilidade técnica e levar um plano curto pro usuário
aprovar (ver padrão de planning do projeto). Ordem sugerida: Parâmetros →
WhatsApp (maior impacto de produto) → Meet→Agenda (mais simples) →
ERP externo → Agenda (mais específico de 1 cliente).

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
