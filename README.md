# KronTech — Guia de Início Rápido
> Ordem no caos do dia a dia. · v1.0 · 2026

---

## PRÉ-REQUISITOS

Antes de começar, instale:
- [Node.js 18+](https://nodejs.org) — LTS recomendado
- [VSCode](https://code.visualstudio.com)
- [Git](https://git-scm.com) (opcional)

---

## PASSO A PASSO

### 1. Abrir no VSCode

```
Arquivo → Abrir Pasta → selecionar a pasta krontech-app
```

### 2. Abrir o terminal integrado

```
Ctrl + ` (acento grave)
```

### 3. Instalar dependências

```bash
npm install
```

Aguarde baixar tudo (pode demorar 1-2 minutos na primeira vez).

### 4. Rodar em modo desenvolvimento

```bash
npm run dev
```

A janela do KronTech vai abrir automaticamente.

### 5. Gerar o .exe instalável

```bash
npm run package
```

O instalador será gerado em `dist/`.

---

## ESTRUTURA DO PROJETO

```
krontech-app/
├── src/
│   ├── main/
│   │   └── index.js              ← Electron — processo principal
│   ├── preload/
│   │   └── index.js              ← Ponte entre Electron e React
│   └── renderer/
│       ├── index.html            ← HTML base
│       └── src/
│           ├── main.jsx          ← Entry point React
│           ├── App.jsx           ← Layout principal + roteamento
│           ├── App.css           ← Estilos globais + componentes base
│           ├── styles/
│           │   ├── tokens.css    ← Variáveis CSS (cores, fontes, tamanhos)
│           │   └── global.css    ← Reset e base global
│           ├── components/
│           │   ├── Sidebar.jsx   ← Sidebar recolhível com grupos
│           │   └── Sidebar.css   ← Estilos da sidebar
│           ├── pages/
│           │   ├── Dashboard.jsx    ← Tela inicial
│           │   ├── OrdemServico.jsx ← OS com filtros e tabela
│           │   ├── Scripts.jsx      ← Base de scripts
│           │   ├── Solucoes.jsx     ← Base de soluções
│           │   └── Placeholder.jsx  ← Módulos ainda não implementados
│           └── services/
│               └── (conexão PostgreSQL aqui)
├── package.json
├── electron.vite.config.mjs
└── README.md
```

---

## ADICIONANDO NOVOS MÓDULOS

### 1. Criar a página em `src/renderer/src/pages/NomePagina.jsx`

```jsx
export default function NomePagina() {
  return (
    <div className="sect">
      <p>Conteúdo aqui</p>
    </div>
  )
}
```

### 2. Registrar no menu — `src/renderer/src/components/Sidebar.jsx`

Adicionar no array `MENU` dentro do grupo desejado:
```js
{ id: 'nomepagina', label: 'Nome da Página' }
```

### 3. Adicionar ícone SVG em `icons` no Sidebar.jsx

```jsx
nomepagina: <svg ...>...</svg>
```

### 4. Registrar no App.jsx

Em `PAGES`:
```js
nomepagina: { title: 'Nome', sub: 'GRUPO · SUBTÍTULO', btnPri: '+ Novo', btnSec: '' }
```

Em `renderPage()`:
```jsx
case 'nomepagina': return <NomePagina />
```

---

## CONECTAR AO POSTGRESQL

Em `src/renderer/src/services/`, criar `db.js`:

```js
import { Pool } from 'pg'

export const pool = new Pool({
  host:     'localhost',
  port:     5432,
  database: 'krontech',      // banco que você criou
  user:     'seu_usuario',
  password: 'sua_senha',
})

export async function query(sql, params = []) {
  const client = await pool.connect()
  try {
    const result = await client.query(sql, params)
    return result.rows
  } finally {
    client.release()
  }
}
```

Usar em qualquer página:
```js
import { query } from '../services/db'

const dados = await query('SELECT * FROM krontech.cli_001 WHERE ATIVO = TRUE')
```

---

## IDENTIDADE VISUAL

Todas as cores estão em `src/renderer/src/styles/tokens.css` como variáveis CSS.

| VARIÁVEL    | COR       | USO              |
|-------------|-----------|------------------|
| `--or`      | `#FF6B2B` | Laranja principal |
| `--or2`     | `#E85A1A` | Laranja escuro   |
| `--bg`      | `#0A0A0A` | Fundo dark       |
| `--s1`      | `#111111` | Sidebar          |
| `--s2`      | `#161616` | Cards/seções     |
| `--t1`      | `#F2F2F2` | Texto principal  |
| `--t2`      | `#888888` | Texto secundário |

Sempre use as variáveis — nunca cores hardcoded.

---

*KronTech · Ordem no caos do dia a dia. · v1.0 · 2026*
