# KronTech — Backlog

> O que está pendente e aprovado. Atualizar ao fim de cada sessão: mover o
> que foi feito para "Concluído recentemente" (ou apagar), adicionar o que
> surgir. Planos já implementados por inteiro vão para `docs/historico/`.
>
> **Fora de escopo** (não retomar sem pedido explícito): módulo fiscal,
> Financeiro, Supabase. Ver `CLAUDE.md` §9.

---

## Aberto

### Controle de acesso (permissões)

As tabelas `kr_grupos_acesso_001`, `kr_grupo_permissoes_001`,
`kr_usuario_permissoes_001`, `kr_usuario_grupo_001` e os campos
`usuario_001.perm_*` / `perfil` existem no banco mas **nenhum código lê ou
aplica**. A tela nativa de Usuário mostra o `perfil` (informativo) mas não
edita mais os `perm_*` — a aba de Permissões foi removida por ser fachada.
Falta o motor de verdade: cada tela nativa checar
incluir/alterar/excluir/consultar do usuário logado, uma tela de
Grupos/Perfis, e o `App.jsx`/`Sidebar` respeitarem as permissões. Escopo
grande; só iniciar com pedido explícito. Quando entrar, decidir se
`perm_*` (colunas soltas) some em favor de `kr_usuario_permissoes_001`.

### E-mail

- Bugs e funções aprovadas acumuladas — o usuário disse que traria a lista
  do que quer verificar. Não iniciar sem essa lista.
- (opcional) `PaginacaoCompacta` de `ListaMensagens.jsx` reimplementa o
  `PaginacaoBar` genérico "porque a coluna é estreita" — dívida menor.

---

## Concluído recentemente

- **Usuários: tela nativa nível ERP** (esta sessão): `usuario_001` deixou
  de ser tela do FormBuilder e virou página dedicada (`pages/usuarios/`) no
  padrão da Entidade. Schema enriquecido (migration
  `1788916719794_usuario-campos-erp`): CPF, apelido, matrícula, ramal,
  WhatsApp, admissão/desligamento, gestor (FK auto-referência), centro de
  custo, **perfil** (admin/gerente/supervisor/operador/consulta),
  expiração de acesso, último acesso, forçar troca de senha, 2FA, tema,
  idioma, + tabela `usuario_senha_hist_001` (histórico de trocas de
  senha). `usuarioService.js` + `handlers/usuario.js`; 3 abas densas
  (Dados / Acesso com histórico de senhas + preferências);
  aba Acesso com `PainelFiltrosGrid` (24 filtros) + `TabelaResultados` +
  status em massa. `auth:login` carimba `dt_ultimo_acesso`, checa
  `dt_expiracao`/`bloqueado_ate`, conta `tentativas_login`, devolve
  `perfil` + `forcarTrocaSenha`; desacoplado de `kr_tela_campos_001`.
  Migration `1788915346560_usuario-tela-nativa` normaliza dados. `App.jsx`
  redireciona `fb__usuario_001` → `usuarios`.
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
