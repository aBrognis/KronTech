# Plano: armazenamento de e-mail estilo gerenciadores grandes

> **STATUS (02/09/2026): FASES 1, 2 e 3 CONCLUIDAS E APLICADAS EM PRODUCAO.**
> Banco `krontech`: 978 MB -> 24 MB. `email_mensagem_001`: 957 MB -> 2,6 MB.
> 215 e-mails limpos, 1.407 imagens extraidas, 12 viraram anexo listavel.
> Backups em `backup/pre-limpeza-email_krontech_*.dump`.
> Falta: FASE 4 (dedup por hash, retencao configuravel, anexos fora do OneDrive) — incremental, quando quiser.
>
> **Como funciona agora:** `corpo_html` guarda `kmail://anexo/<id>` (leve).
> Na leitura, `emailMensagemService.hidratarCorpoHtml()` troca por `data:` lido
> do disco, so naquele retorno (nunca gravado). O `<iframe srcdoc>` do leitor
> nao carrega protocolo custom (origem opaca) — por isso a hidratacao no main
> em vez do protocolo `kmail://` direto (o protocolo fica registrado pra uso
> futuro: streaming de anexo grande).


## Situação atual (medida em 01/09/2026, banco `krontech` de produção)

| Item | Valor |
|---|---|
| Banco total | 978 MB |
| `email_mensagem_001` | 957 MB (98% do banco) para 287 e-mails |
| `email_mensagem_001.corpo_html` | 917 MB (média 3,4 MB por e-mail, maior 28 MB) |
| `email_mensagem_001.corpo_texto` | 421 kB (leve, serve para preview/busca) |
| Resto do banco todo | ~2 MB |

### Causa raiz

1. **Imagens embutidas no HTML como base64.** No `processarMensagem` (emailSyncService.js linha ~735), cada imagem inline (`cid:`) já é salva em disco, mas TAMBÉM é reescrita no `corpo_html` como `data:image/...;base64,...`. O motivo técnico: o leitor renderiza o corpo num `<iframe srcdoc>` sandboxed, que tem origem opaca e não carrega `file://` nem `cid:`.
2. **Threads acumulam.** Ao responder, o cliente cita o corpo anterior inteiro (com os base64). Resposta 10 de uma thread carrega as imagens das 10 anteriores. E-mail id 158: 28 MB de HTML, 7 kB de texto.

### Bug secundário: assinatura vira anexo

E-mail da Taysa (id 1386, Sisplan/Zimbra): 8 imagens inline. A `isa.png` (42 kB, foto da assinatura) aparece como anexo porque `pareceConteudo()` retorna `true` para qualquer imagem `>= 40 kB` que não bata no padrão `imageNNN.png` do Outlook desktop. Assinaturas de Zimbra/webmail têm nomes como `isa.png` e escapam do filtro `ehAssinaturaOutlook()`.

---

## Como os grandes fazem

- **Thunderbird**: guarda o e-mail bruto (RFC822) em arquivo (`maildir`/`mbox`). O banco (`global-messages-db.sqlite`) só tem metadado + índice de busca + trecho de texto. Corpo pesado nunca entra no banco. Imagens inline ficam dentro do `.eml`, renderizadas na hora.
- **Outlook/Gmail**: corpo e anexos em blob storage / arquivo; banco relacional só com cabeçalho, flags, ponteiros. Retenção configurável ("manter offline os últimos N dias").
- **Nenhum** embute base64 em coluna de banco relacional.

---

## Plano de correção (3 fases)

### FASE 1 — Servir imagem local ao iframe sem base64 (protocolo customizado)

**Problema:** o iframe sandbox não carrega `file://`. **Solução dos grandes:** um protocolo privilegiado próprio do app.

1. Registrar esquema `kmail` como privilegiado/streamable em `app` (antes do `whenReady`), via `protocol.registerSchemesAsPrivileged([{ scheme: 'kmail', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }])`.
2. No `whenReady`, `protocol.handle('kmail', ...)` que resolve `kmail://anexo/<anexoId>` → lê o arquivo de `email_anexo_001.caminho` e devolve como `Response` com o content-type certo. Valida que o id existe e o caminho está sob a base de anexos (anti path-traversal).
3. No `processarMensagem`: em vez de trocar `cid:XXX` por `data:...base64`, trocar por `kmail://anexo/<anexoId>` (precisa inserir o anexo inline ANTES de montar o `corpo_html`, para ter o id).
4. No leitor (`LeitorMensagem.jsx` / `cssTema`): remover a regra que esconde `img[src^="cid:"]` (não haverá mais `cid:`), permitir `img[src^="kmail:"]`.
5. Resultado: `corpo_html` passa a guardar `<img src="kmail://anexo/123">` (30 bytes) em vez de 3 MB de base64. Visualmente idêntico no leitor.

**Arquivos tocados:** `src/main/index.js` (registro do protocolo), `src/main/services/emailSyncService.js` (processarMensagem, ordem de inserção do anexo inline + troca do cid), `src/renderer/src/pages/Email/LeitorMensagem.jsx` (CSS do iframe).

### FASE 2 — Corrigir "assinatura vira anexo"

Reescrever `pareceConteudo()` / `ehAssinaturaOutlook()` no emailSyncService.js:

- **É assinatura (fica só no corpo, nunca vira anexo)** quando qualquer:
  - nome bate `^image\d{3,}\.(png|jpe?g|gif)$` (Outlook desktop), OU
  - o `<img>` correspondente no HTML tem `width`/`height` <= 200px, OU
  - a imagem decodificada tem dimensão <= 250x250px (logo/foto pequena), OU
  - o `Content-Disposition` do part é `inline` E não há palavra de "print" no nome.
- **É conteúdo (vira anexo clicável)** quando qualquer:
  - nome bate `/(screenshot|captura|pasted|colad|colar|print|imagem colada)/i`, OU
  - dimensão da imagem >= 400px em algum lado E tamanho >= 60 kB.
- Empate → NÃO vira anexo (assinatura é o caso comum; o usuário reclamou do falso-positivo, não do falso-negativo).

Para ler dimensão de PNG/JPEG sem lib: parser mínimo de cabeçalho (PNG: bytes 16-24; JPEG: varrer marcadores SOF). ~30 linhas.

### FASE 3 — Migração de limpeza dos 287 e-mails atuais (dados existentes)

Migração `node-pg-migrate` (roda no boot, uma vez) OU script manual `scripts/limpar-corpo-email.js`:

1. **Backup primeiro**: `pg_dump krontech` completo antes de qualquer UPDATE. Guardar em `C:\KronTech\backup\pre-limpeza-email-<data>.dump`.
2. Para cada e-mail com `corpo_html` contendo `data:image`:
   a. Extrair cada `data:(image/...);base64,(...)`.
   b. Decodificar, salvar em `<base>/email/<contaId>/inline/<msgId>_<n>.<ext>`.
   c. Inserir linha em `email_anexo_001` com `inline=true` (aplicando a regra da FASE 2 para decidir se também aparece na lista de anexos ou fica só no corpo).
   d. Substituir o `data:...` no HTML por `kmail://anexo/<novoId>`.
   e. `UPDATE email_mensagem_001 SET corpo_html = <novo>` .
3. Ao final: `VACUUM FULL email_mensagem_001` para devolver o espaço ao SO.
4. Verificação: abrir 5 e-mails no leitor (thread da Taysa, thread "OP's em Duplicidade", um com anexo real, um calendário, um simples) e confirmar que tudo renderiza.

**Estimativa pós-limpeza:** `email_mensagem_001` de 957 MB → ~2 MB. Banco total ~25 MB.

### FASE 4 (depois, incremental — não nesta rodada)

- Dedup de anexo por hash SHA-256 (mesmo PDF em 8 e-mails = 1 arquivo).
- Retenção configurável por conta (baixar corpo completo só dos últimos N meses; mais antigos = metadado + texto, corpo rebaixado sob demanda via IMAP `BODY[]` quando abre).
- Mover a pasta de anexos para fora do OneDrive (já suportado via `arquivosEmail` no .ini) ou para bucket S3/Backblaze B2 (~R$3/mês por 100 GB) com o mesmo protocolo `kmail://`.

---

## Ordem de execução e risco

| Fase | Toca dado? | Reversível? | Risco |
|---|---|---|---|
| 1 (protocolo + sync) | Só e-mails novos daqui pra frente | Sim (é código) | Baixo — e-mails antigos seguem com base64 até a fase 3 |
| 2 (assinatura) | Só e-mails novos | Sim | Baixo |
| 3 (migração) | SIM, reescreve corpo_html de 287 e-mails | Sim, via dump pré-limpeza | Médio — por isso o backup obrigatório + verificação manual |

## Depois disso: nuvem

Com o banco em ~25 MB, qualquer hospedagem barata serve. Os arquivos de anexo (corpos + imagens + anexos reais) ficam em disco da VPS (100+ GB inclusos) ou bucket. Decisão de hospedagem fica para depois da limpeza, com o número real na mão.
