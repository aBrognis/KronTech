# KronTech — Guia de Identidade Visual
> Ordem no caos do dia a dia. · v1.0 · 2026

---

## 1. CONCEITO

**Kron** vem de *Kronos*, deus do tempo na mitologia grega.
Representa domínio, controle e gestão do tempo — o bem mais precioso de quem trabalha com tecnologia e implantação.

**Tech** representa tecnologia aplicada. Precisão técnica, sistemas, SQL, ERP, relatórios, automações.

**KronTech** é o ponto central onde tempo e tecnologia se encontram para trazer ordem ao caos do dia a dia.

---

## 2. NOME

| USO | FORMA CORRETA |
|---|---|
| Nome do sistema | `KronTech` |
| Em títulos | `KronTech` |
| Em código (variáveis) | `krontech` ou `KRONTECH` |
| Nunca usar | `KRONTEC`, `kron tech`, `Krontech` |

---

## 3. SLOGAN

> **Ordem no caos do dia a dia.**

---

## 4. VERSÃO

`v1.0 · 2026`

---

## 5. SÍMBOLO

- Círculo com anéis orbitais concêntricos
- Letras **KT** internas com traços finos
- **K** em branco, **T** em laranja
- Separador vertical discreto entre K e T
- 3 anéis externos animados (velocidades diferentes)
- 4 orbs pulsando nos eixos cardinais

**Arquivos:**
- `assets/krontech-logo-dark.svg` — versão dark (fundo escuro)
- `assets/krontech-logo-light.svg` — versão light (fundo claro)

---

## 6. PALETA DE CORES

### Laranja
| VARIÁVEL CSS | HEX | USO |
|---|---|---|
| `--kt-orange` | `#FF6B2B` | Cor principal, botões, destaques |
| `--kt-orange-dark` | `#E85A1A` | Hover, laranja light mode |
| `--kt-orange-deeper` | `#CC4A10` | Estados ativos, títulos accent |
| `--kt-orange-muted` | `#FF8C55` | Partículas, elementos suaves |

### Neutros Dark
| VARIÁVEL CSS | HEX | USO |
|---|---|---|
| `--kt-bg-dark` | `#0E0E0E` | Fundo geral dark |
| `--kt-surface-dark` | `#141414` | Sidebar, painéis |
| `--kt-card-dark` | `#1E1E1E` | Cards, inputs |
| `--kt-border-dark` | `#2A2A2A` | Bordas gerais |
| `--kt-gray-dark` | `#3A3A3A` | Elementos secundários |

### Neutros Light
| VARIÁVEL CSS | HEX | USO |
|---|---|---|
| `--kt-bg-light` | `#F4F4F4` | Fundo geral light |
| `--kt-surface-light` | `#ECECEC` | Sidebar, painéis |
| `--kt-card-light` | `#E4E4E4` | Cards, inputs |
| `--kt-border-light` | `#DCDCDC` | Bordas gerais |

### Texto
| VARIÁVEL CSS | HEX | USO |
|---|---|---|
| `--kt-text-white` | `#FFFFFF` | Texto principal dark |
| `--kt-text-dark` | `#111111` | Texto principal light |
| `--kt-text-muted` | `#666666` | Texto secundário |
| `--kt-text-ghost` | `#888888` | Texto terciário, placeholders |

---

## 7. TIPOGRAFIA

| ELEMENTO | FONTE | PESO | TAMANHO |
|---|---|---|---|
| Título do sistema "Kron" | system-ui, sans-serif | 700 | 54px |
| Título do sistema "Tech" | system-ui, sans-serif | 200 | 54px |
| Títulos de página | system-ui, sans-serif | 700 | 28–36px |
| Subtítulos | system-ui, sans-serif | 400 | 16–20px |
| Corpo de texto | system-ui, sans-serif | 400 | 14px |
| Labels e tags | system-ui, sans-serif | 400 | 10px, letter-spacing: 3px |

---

## 8. MODOS

O sistema suporta dois modos via atributo `data-theme` na tag `<html>`:

```html
<!-- Dark (padrão) -->
<html data-theme="dark">

<!-- Light -->
<html data-theme="light">
```

---

## 9. COMPONENTES BASE

### Botão principal
```css
.kt-btn — laranja sólido, hover mais escuro com glow
```

### Botão fantasma
```css
.kt-btn-ghost — borda laranja, hover preenche laranja
```

### Card
```css
.kt-card — fundo escuro, borda sutil, hover acende borda laranja
```

### Sidebar
```css
.kt-sidebar — 220px, surface dark, nav-item com borda laranja quando ativo
```

---

## 10. ARQUIVOS DO PROJETO

```
krontech/
├── assets/
│   ├── krontech-logo-dark.svg     ← logo para fundo escuro
│   ├── krontech-logo-light.svg    ← logo para fundo claro
│   └── krontech-tokens.css        ← variáveis CSS + classes utilitárias
├── docs/
│   └── brand-guide.md             ← este arquivo
├── src/
│   └── (código do sistema)
└── README.md
```

---

## 11. INSTRUÇÃO PARA O CLAUDE NO VSCODE

Cole o texto abaixo no início de qualquer conversa com o Claude no VSCode para manter o padrão visual:

---

```
Estou desenvolvendo o KronTech, um ERP desktop pessoal com Electron + React + PostgreSQL.

IDENTIDADE VISUAL:
- Cores: laranja #FF6B2B (principal), preto #0E0E0E (fundo dark), cinza #1E1E1E (cards)
- Modo light: fundo #F4F4F4, laranja #E85A1A
- Tipografia: system-ui, Kron em 700, Tech em 200
- Bordas: #2A2A2A dark / #DCDCDC light
- Border-radius padrão: 10–14px
- Suporte a data-theme="dark" e data-theme="light"

STACK:
- Electron (app desktop .exe)
- React + CSS Variables (sem Tailwind)
- PostgreSQL (banco local)
- Monaco Editor (editor SQL embutido)
- Puppeteer (geração de PDF via HTML template)

PADRÃO DE CÓDIGO:
- Componentes React funcionais com hooks
- CSS via variáveis --kt-* definidas em krontech-tokens.css
- Sem frameworks CSS externos
- Comentários em português

Sempre gere componentes completos, prontos para usar.
Sempre use as variáveis CSS --kt-* para cores e espaçamentos.
```

---

*KronTech · Ordem no caos do dia a dia. · v1.0 · 2026*
