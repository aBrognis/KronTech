# Release — assinatura digital e publish automático

> **Nenhum destes dois itens está implementado.** Por decisão do dono do
> projeto (custo de certificado + necessidade de token de escrita no
> GitHub), esta página só documenta o que falta para cada um, para acionar
> quando fizer sentido.

## Assinatura digital do instalador

Hoje `scripts/build.js` desliga ativamente qualquer assinatura: define
`CSC_IDENTITY_AUTO_DISCOVERY: 'false'` e remove `CSC_LINK`/`WIN_CSC_LINK`/
`CSC_KEY_PASSWORD` do ambiente antes de chamar o electron-builder. Resultado
prático: o instalador `.exe` gerado hoje **não é assinado**, e o Windows
SmartScreen mostra o alerta "Editor desconhecido" para quem baixar.

**O que precisa, quando decidir fazer:**

1. Comprar um certificado de assinatura de código Windows — OV (Organization
   Validation) ou EV (Extended Validation), de um provedor como DigiCert,
   Sectigo ou SSL.com. Custo na faixa de centenas de dólares por ano, exige
   verificação de identidade/empresa. EV reduz o alerta do SmartScreen mais
   rápido (tem reputação inicial melhor); OV é mais barato mas o SmartScreen
   leva mais tempo/downloads para "confiar" no editor.
2. Com o certificado em mãos (arquivo `.pfx`/`.p12` ou um token
   HSM/cloud-based, dependendo do provedor):
   - Configurar `"build.win.signtoolOptions"` no `package.json` (a chave
     mudou de nome — `electron-builder` 26.x não aceita mais
     `win.certificateFile`/`win.sign` na raiz de `win`, só dentro de
     `signtoolOptions` ou via `azureSignOptions` se usar Azure Trusted
     Signing).
   - Reverter a neutralização em `scripts/build.js`: parar de deletar
     `CSC_LINK`/`WIN_CSC_LINK`/`CSC_KEY_PASSWORD` do ambiente, e passar a
     ler o caminho do certificado + senha dessas variáveis (nunca commitar
     o certificado nem a senha no repositório — usar variável de ambiente
     local ou secret de CI).

Sem assinatura, o app continua funcionando normalmente — o único efeito é
o alerta do Windows na primeira execução do instalador.

## Publish automático para GitHub Releases

A config `"build.publish"` do `package.json` já aponta para
`aBrognis/KronTech`, mas `scripts/build.js` só passa a flag `--win` ao
electron-builder — nunca `--publish`. Ou seja, hoje **nenhuma execução de
`npm run package` publica nada automaticamente**; subir um instalador pro
GitHub Releases continua sendo manual (upload direto na interface do
GitHub, ou `gh release upload` à parte).

**O que precisa, quando decidir fazer:**

1. Gerar um Personal Access Token do GitHub com escopo de escrita
   (`repo` ou o escopo mínimo equivalente de "contents: write") na conta
   dona do repositório `aBrognis/KronTech`.
2. Disponibilizar esse token como variável de ambiente `GH_TOKEN` (nome que
   o electron-builder espera) no ambiente onde `npm run package` roda.
3. Adicionar `--publish always` (ou `--publish onTagOrDraft`, dependendo de
   quando quiser que a publicação de fato aconteça) ao array de argumentos
   em `scripts/build.js`.

**Atenção antes de habilitar:** a partir do momento em que a flag entra,
**toda execução do script passa a criar/atualizar uma release de verdade**
no GitHub — não é uma operação neutra nem facilmente reversível (release já
publicada precisa ser apagada manualmente se for engano). Vale considerar
condicionar isso a uma flag extra do próprio script (ex: só publica se
`npm run package -- --publish` for chamado explicitamente), em vez de
deixar sempre ligado.
