# KronTech — Backlog

> O que está pendente e aprovado. Atualizar ao fim de cada sessão: mover o
> que foi feito para "Concluído recentemente" (ou apagar), adicionar o que
> surgir. Planos já implementados por inteiro vão para `docs/historico/`.
>
> **Fora de escopo** (não retomar sem pedido explícito): módulo fiscal,
> Financeiro, Supabase. Ver `CLAUDE.md` §9.

---

## Aberto

### E-mail

- **Caixa de Saída** — começar por aqui quando o usuário retomar o e-mail.
  Fila de reenvio, estados (`fila` / `enviando` / `erro`), reprocessamento
  com backoff. Backend em `emailEnvioService.js` já tem a base
  (`tentarFilaSaida`, `agendarRetry`); falta revisar a UI e o worker.
- Bugs e funções aprovadas acumuladas — o usuário disse que traria a lista
  do que quer verificar. Não iniciar sem essa lista.

### Agenda

- **Conflito / drag-drop ainda com bug.** O usuário disse "ainda está
  errado" depois de 2 rodadas de correção. Não presumir resolvido. Reabrir
  com investigação do zero (`agenda/` + `agendaService.js`).

### Dashboard

- **Bug de abas sobrepostas** — o Dashboard vaza visualmente atrás de outra
  aba ativa. Pendente de investigação. Não é da feature Documentos.

### Entidade

- Tela nível ERP está implementada (8 abas, 12 tabelas). **Falta testar o
  fluxo completo no dev com dados reais** — criar entidade nova preenchendo
  várias abas (endereços, contatos, comercial, crédito, relacionamento,
  documentos), gravar, reabrir, conferir persistência.

---

## Concluído recentemente

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
- **Reorganização do repositório** (esta sessão): 130+ arquivos sem commit
  versionados (incluindo 39 migrations), código morto removido, documentação
  consolidada em `CLAUDE.md`.

---

## Histórico de planos implementados

Ver `docs/historico/`:

- `PLANO_ENTIDADE_COMPLETA.md` — tela de Entidade nível ERP (12 tabelas, 8
  abas).
- `PLANO_EMAIL_ARMAZENAMENTO.md` — enxugamento do armazenamento de e-mail
  (base64 → ponteiro `kmail://` + hidratação na leitura; 978 MB → 24 MB).
- `RELEASE.md` — o que falta para assinatura digital e publish automático.
