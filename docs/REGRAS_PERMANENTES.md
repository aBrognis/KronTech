# Regras Permanentes do Projeto KronTech

> **Leia isto antes de qualquer trabalho no projeto.** São regras dadas
> explicitamente pelo usuário (Anderson), várias delas depois de já terem
> causado retrabalho por serem ignoradas. Não são sugestões — são
> obrigatórias, e valem para qualquer tela/feature, não só a que estiver em
> discussão no momento.

## Texto e caracteres

- **NUNCA usar travessão ("—", em dash)** em nenhum texto visível ao
  usuário: labels, placeholders, mensagens de erro/sucesso, botões, títulos.
  O caractere renderiza errado na UI. Vale para texto de UI/mensagens —
  comentários de código não são afetados pela regra. Se precisar de uma
  pausa/separação na frase, use vírgula, ponto, ou reformule.
- Nunca usar `alert()`/`confirm()` nativos do navegador/SO. Sempre usar o
  componente próprio de notificação/confirmação do sistema.

## Visual e design

- **Cor de destaque do sistema é sempre `var(--or)` (ou os tokens
  `--or2/--or3/--or4`)**, nunca uma cor hardcoded tipo `#FF6B2B` direto —
  ela precisa reagir à cor customizada que o usuário define em
  Configurações (que sobrescreve `--or` via `!important` em runtime, ver
  `Configuracoes.jsx`). Qualquer elemento "ativo"/selecionado que usa cor
  de destaque tem que ter sua contraparte adicionada ao bloco de override
  em `Configuracoes.jsx` (procure por `.ni.active` nesse arquivo para ver
  o padrão a seguir).
- **Padrão visual de "item ativo" do sistema** (Sidebar, `.ni.active`) é a
  referência de ouro para qualquer navegação lateral nova: fundo em
  degradê horizontal sutil (`linear-gradient(90deg, rgba(cor,.11) 0%,
  rgba(cor,.03) 60%, transparent 100%)`), uma barra lateral de 3px com
  gradiente vertical da cor de destaque (`::before`), e o ícone ganhando
  `filter: drop-shadow(...)` na cor de destaque — nunca um fundo sólido
  chapado. Esse padrão vale **igual, sem exceção, no estado recolhido**:
  não criar tratamento especial para colapsado, o Sidebar não tem exceção
  nenhuma e qualquer navegação nova não deve ter também.
- **Avatares de identidade (iniciais tipo "AB") são sóbrios**: fundo
  sempre neutro (`var(--s3)`), nunca uma cor sólida saturada de fundo. A
  cor de identidade (por hash ou escolhida manualmente) aparece **só no
  texto das iniciais**, nunca como fundo — nem mesmo em versão "tint"
  suave, a menos que seja pedido explicitamente. Squircle (`border-radius:
  30%`), não círculo perfeito.
- Rejeitar reinvenção estrutural de telas já existentes sem pedido
  explícito. Ajustes visuais pedidos como "poluído"/"feio" geralmente
  pedem **melhoria incremental de craft** (densidade, hierarquia,
  espaçamento) dentro da metáfora já existente — não um redesign
  conceitual do zero. Só proponha conceitos alternativos/mockups quando o
  usuário pedir isso explicitamente ("quero ver conceitos antes de
  decidir"); se ele já rejeitou mockups antes, trabalhe direto em cima do
  código real da tela.
- Nunca mexer no `.ini` de deploy ao atualizar o `.exe` — regra crítica,
  já causou horas de retrabalho.

## Telas e arquitetura

- Seguir `docs/PADRAO_TELAS.md`: reusar `FormToolbar`/`SeletorBusca`/
  `PaginacaoBar` e os demais componentes padrão, nunca reinventar por
  tela. Preferir FormBuilder quando a tela for cadastro simples; tela
  manual (React própria) só quando o FormBuilder genuinamente não cobre o
  caso — e mesmo assim replicando o mesmo padrão visual/funcional.
- Telas complexas (tipo ERP: e-mail, agenda com drag-drop etc.) são
  construídas como página própria, não tentadas encaixar no FormBuilder
  básico.
- Priorizar robustez e arquitetura escalável sobre a solução mais simples
  — o objetivo é produto vendável para empresas, não protótipo pessoal.
- Todos os campos de data do sistema devem ter os atalhos de teclado
  padrão (ver `InputData.jsx`): R = data mínima, Y = data máxima, T =
  hoje, +/- = soma/subtrai um dia. Novo campo de data = usar o componente
  `InputData`, nunca um `<input type="date">` cru.

## Investigação e comunicação

- **Investigar antes de perguntar**: decidir sozinho tudo que for
  tecnicamente decidível pela leitura do código/dados; só perguntar ao
  usuário o que exige julgamento dele (prioridade, gosto pessoal,
  trade-off de produto).
- **Nunca "adivinhar" a causa de um bug e pedir pro usuário testar às
  cegas repetidamente.** Se um teste não confirma a hipótese, reler o
  código com mais cuidado antes de pedir outro teste — o usuário já
  reclamou explicitamente disso ("cansado de você ficar tentando
  adivinhar as coisas").
- Ao corrigir algo, verificar se a correção realmente chegou ao app que o
  usuário está testando (rodar build, e se o problema persistir de forma
  "impossível" dado o código, suspeitar de bundle desatualizado / app não
  reiniciado antes de reabrir investigação).
- Manter o projeto organizado proativamente: limpar arquivos órfãos, lixo,
  código morto — sem precisar que o usuário peça.
- Escrever `RELEASE_NOTES.md` (Lançar Versão) proativamente ao fim de
  cada sessão de trabalho relevante, cobrindo tudo que foi implementado
  desde a última vez que foi escrito. Seguir o template formal estruturado
  já em uso (sem campo de versão manual).

## Ambiente técnico (armadilhas conhecidas)

- Variável de ambiente `ELECTRON_RUN_AS_NODE` quebra o Electron no
  ambiente do Claude Code — cuidado ao rodar comandos que possam herdá-la.
- App roda de `C:\devcache\KronTech\node_modules` (paralelo ao
  OneDrive) — sincronizar ao instalar dependência nova.
- Múltiplos bancos Postgres coexistem: `krontech` (produção),
  `krontech_dev` (dev real, o que `npm run dev` usa), `krontech_fake_prod`.
  Checar `krontech.ini` antes de investigar dado que "não aparece" —
  migration pode ter sido rodada no banco errado.
- Supabase foi tentado e revertido — produção usa Postgres local hoje,
  não retomar migração pro Supabase sem pedido explícito.
- Financeiro (Contas a Pagar/Receber) foi removido do escopo do projeto —
  não retomar sem pedido explícito.
