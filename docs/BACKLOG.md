# KronTech — Backlog

> O que está pendente e aprovado. Atualizar ao fim de cada sessão: mover o
> que foi feito para "Concluído recentemente" (ou apagar), adicionar o que
> surgir. Planos já implementados por inteiro vão para `docs/historico/`.
>
> **Fora de escopo** (não retomar sem pedido explícito): módulo fiscal,
> Financeiro, Supabase. Ver `CLAUDE.md` §9.

---

## Aberto

### FormBuilder — seletor de colunas na aba Acesso

A aba Acesso do FormBuilder (`formBuilderView/AbaAcesso.jsx`) já tem: filtro
por coluna (`PainelFiltros`), busca geral, ordenação por cabeçalho e export
CSV. **Falta o seletor de colunas** que as telas nativas ganharam
(`components/TabelaResultados.jsx`): telas com 15+ campos mostram uma tabela
larga demais, sem como escolher o que ver. Levar `TabelaResultados` (ou só o
mecanismo de colunas visíveis + `localStorage`) para o `AbaAcesso`.

### E-mail

- **Caixa de Saída** — fila de reenvio, estados (`fila` / `enviando` /
  `erro`), reprocessamento com backoff. Backend em `emailEnvioService.js` já
  tem a base (`tentarFilaSaida`, `agendarRetry`); falta revisar a UI e o
  worker.
- Bugs e funções aprovadas acumuladas — o usuário disse que traria a lista
  do que quer verificar. Não iniciar sem essa lista.

### Entidade

- Tela nível ERP está implementada (8 abas, 12 tabelas). **Falta testar o
  fluxo completo no dev com dados reais** — criar entidade nova preenchendo
  várias abas (endereços, contatos, comercial, crédito, relacionamento,
  documentos), gravar, reabrir, conferir persistência.

---

## Concluído recentemente

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
