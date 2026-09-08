# KronTech

> Ordem no caos do dia a dia.

ERP desktop em **Electron 30 + React + PostgreSQL**. App empacotado com
`electron-builder`, auto-update por GitHub Releases.

---

## Rodar

Pré-requisitos: Node.js 18+, PostgreSQL, Git.

```bash
npm install
npm run dev
```

A janela do KronTech abre automaticamente. O modo dev usa o banco
`krontech_dev`.

## Gerar o instalador

```bash
npm run package
```

Instalador em `dist/`. Para publicar uma release, use o botão **"Lançar
Versão"** dentro do app (bump + build + commit + release no GitHub).

---

## Estrutura

```
src/
  main/          processo principal do Electron
    handlers/    handlers IPC por módulo (registerXHandlers)
    services/    lógica de negócio por módulo
    db.js        schema legado (não estender — usar migrations/)
    migrate.js   roda as migrations no boot
    index.js     entry point do main
  preload/
    index.js     ponte contextBridge (window.api.*)
  renderer/
    src/
      App.jsx          layout + roteamento
      App.css          estilos globais e componentes base
      components/      componentes reutilizáveis (FormToolbar, SeletorBusca...)
      pages/           uma pasta ou arquivo por tela
migrations/      schema versionado (node-pg-migrate)
docs/
  BACKLOG.md     o que está pendente
  historico/     planos de features já implementadas
CLAUDE.md        manual do projeto — LEIA ANTES DE MEXER
```

---

## Antes de contribuir

Leia **[`CLAUDE.md`](CLAUDE.md)**. Ele consolida as regras permanentes, o
padrão de telas, o padrão de backend, o processo de migrations e release, e
as armadilhas de ambiente. Não são sugestões.
