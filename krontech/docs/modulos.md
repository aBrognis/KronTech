# KronTech — Especificação de Módulos
> v1.0 · 2026

---

## VISÃO GERAL

| MÓDULO | ROTA | ÍCONE SUGERIDO |
|---|---|---|
| Dashboard | `/` | LayoutDashboard |
| Ordens de Serviço | `/os` | ClipboardList |
| Projetos / Clientes | `/projetos` | FolderKanban |
| Base de Scripts | `/scripts` | Code2 |
| Financeiro | `/financeiro` | DollarSign |
| Agenda | `/agenda` | CalendarDays |
| Editor SQL | `/sql` | Database |
| Relatórios | `/relatorios` | FileText |

---

## 1. DASHBOARD (Tela Inicial)

**Objetivo:** Visão geral do dia e do negócio ao abrir o sistema.

### Componentes do painel:

**Cards de métricas (topo)**
- OS abertas
- OS em andamento
- Honorários a receber (R$)
- Despesas do mês (R$)

**Gráfico de OS por mês**
- Barras ou linha
- Últimos 6 meses
- Separado por status (aberta / concluída)

**Próximos compromissos do dia**
- Lista dos eventos de hoje e amanhã
- Categoria + horário + descrição

**Alertas e pendentes**
- OS com prazo vencido
- Honorários em atraso
- Compromissos sem conclusão

---

## 2. ORDENS DE SERVIÇO (OS)

**Objetivo:** Registrar, acompanhar e concluir ordens de serviço por cliente.

### Campos da OS:
| CAMPO | TIPO |
|---|---|
| Número da OS | Auto-incremento |
| Cliente | FK → Clientes |
| Título / Descrição | Texto |
| Tipo de Serviço | Lista (Suporte, Implantação, Desenvolvimento, Treinamento, Consultoria) |
| Prioridade | Lista (Baixa, Normal, Alta, Urgente) |
| Status | Lista (Aberta, Em Andamento, Aguardando, Concluída, Cancelada) |
| Data de abertura | Data |
| Prazo | Data |
| Data de conclusão | Data |
| Valor cobrado | Numérico |
| Observações | Texto longo |
| Anexos | Arquivo |

### Filtros disponíveis:
- Por cliente
- Por status
- Por prioridade
- Por tipo de serviço
- Por período (data abertura / prazo)

### Listagem:
- Tabela com todas as colunas relevantes
- Destaque visual por prioridade (cor na borda do card ou linha)
- Ação rápida: mudar status direto na lista

---

## 3. PROJETOS / CLIENTES

**Objetivo:** Gerenciar clientes e acompanhar projetos de implantação ou desenvolvimento.

### Clientes:
| CAMPO | TIPO |
|---|---|
| Nome / Razão Social | Texto |
| CNPJ / CPF | Texto |
| Contato | Texto |
| Telefone | Texto |
| E-mail | Texto |
| Cidade / UF | Texto |
| Observações | Texto longo |
| Ativo | Booleano |

### Projetos:
| CAMPO | TIPO |
|---|---|
| Nome do projeto | Texto |
| Cliente | FK → Clientes |
| Tipo | Lista (Implantação, Desenvolvimento, Suporte Contínuo, Consultoria) |
| Status | Lista (Planejado, Em andamento, Pausado, Concluído, Cancelado) |
| Data início | Data |
| Previsão de término | Data |
| Valor contratado | Numérico |
| % Concluído | Numérico (0–100) |
| Módulos / Etapas | Sub-lista com checklist |
| Observações | Texto longo |

### Checklist de etapas do projeto:
- Cadastro livre de etapas
- Marcar como concluída individualmente
- % calculado automaticamente com base nas etapas concluídas

---

## 4. BASE DE SCRIPTS / CONHECIMENTO

**Objetivo:** Repositório pessoal de scripts, soluções e anotações técnicas.

### Campos:
| CAMPO | TIPO |
|---|---|
| Título | Texto |
| Tipo | Lista (SQL, Pascal/PL-pgSQL, FR3/FastReport, Anotação Geral) |
| Tags | Texto livre (separado por vírgula) |
| Descrição | Texto |
| Código / Conteúdo | Texto longo (com syntax highlight) |
| Sistema relacionado | Texto (ex: SISPLAN, KronTech, PostgreSQL) |
| Data de criação | Data automática |
| Favorito | Booleano |

### Funcionalidades:
- Busca por título, tag ou conteúdo
- Filtro por tipo
- Copiar conteúdo com um clique
- Syntax highlight por tipo (SQL, Pascal, etc.)
- Marcar como favorito
- Favoritos acessíveis rapidamente no topo da lista

---

## 5. FINANCEIRO

**Objetivo:** Controle de honorários, despesas e fluxo de caixa mensal.

### Honorários a Receber:
| CAMPO | TIPO |
|---|---|
| Cliente / Projeto | FK |
| Descrição | Texto |
| Valor | Numérico |
| Vencimento | Data |
| Status | Lista (Pendente, Pago, Atrasado, Cancelado) |
| Data de recebimento | Data |
| Forma de pagamento | Lista (PIX, Boleto, Transferência, Dinheiro) |
| Observações | Texto |

### Despesas / Contas a Pagar:
| CAMPO | TIPO |
|---|---|
| Descrição | Texto |
| Categoria | Lista (Ferramentas, Assinaturas, Transporte, Alimentação, Outros) |
| Valor | Numérico |
| Vencimento | Data |
| Status | Lista (Pendente, Pago, Atrasado) |
| Data de pagamento | Data |
| Observações | Texto |

### Fluxo de Caixa Mensal:
- Gráfico de entradas x saídas por mês
- Saldo do mês atual
- Comparativo com mês anterior
- Filtro por período

---

## 6. AGENDA / COMPROMISSOS

**Objetivo:** Controle de compromissos, tarefas e prazos com categorias.

### Campos:
| CAMPO | TIPO |
|---|---|
| Título | Texto |
| Categoria | Lista (Tarefa, Reunião/Visita, Prazo de Projeto, Treinamento, Outro) |
| Data | Data |
| Hora início | Hora |
| Hora fim | Hora |
| Cliente / Projeto | FK (opcional) |
| Descrição | Texto |
| Status | Lista (Pendente, Concluído, Cancelado) |
| Lembrete | Booleano + antecedência |

### Visualizações:
- Lista do dia (padrão)
- Lista semanal
- Calendário mensal

---

## 7. EDITOR SQL

**Objetivo:** Consultas diretas ao banco PostgreSQL sem sair do sistema.

### Funcionalidades:
- Monaco Editor com syntax highlight SQL
- Executar query com botão ou Ctrl+Enter
- Resultado em grid (tabela)
- Histórico das últimas queries executadas
- Salvar query como script na Base de Scripts
- Configuração de conexão (host, porta, banco, usuário, senha)
- Suporte a múltiplas conexões salvas

---

## 8. RELATÓRIOS / PDF

**Objetivo:** Gerar relatórios profissionais em PDF a partir de templates HTML.

### Templates iniciais:
- Ordem de Serviço (OS) individual
- Listagem de OS por período / cliente
- Extrato financeiro mensal
- Resumo de projeto

### Funcionalidades:
- Editor visual de template (HTML + CSS editável dentro do sistema)
- Preview antes de gerar
- Geração de PDF via Puppeteer
- Parâmetros dinâmicos (período, cliente, etc.)
- Histórico de relatórios gerados

---

## BANCO DE DADOS — TABELAS PRINCIPAIS

```sql
-- Clientes
CREATE TABLE clientes (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(200) NOT NULL,
    cnpj_cpf    VARCHAR(20),
    contato     VARCHAR(100),
    telefone    VARCHAR(20),
    email       VARCHAR(100),
    cidade      VARCHAR(100),
    uf          CHAR(2),
    observacoes TEXT,
    ativo       BOOLEAN DEFAULT TRUE,
    criado_em   TIMESTAMP DEFAULT NOW()
);

-- Projetos
CREATE TABLE projetos (
    id               SERIAL PRIMARY KEY,
    cliente_id       INTEGER REFERENCES clientes(id),
    nome             VARCHAR(200) NOT NULL,
    tipo             VARCHAR(50),
    status           VARCHAR(50) DEFAULT 'Planejado',
    dt_inicio        DATE,
    dt_previsao      DATE,
    valor_contratado NUMERIC(12,2),
    perc_concluido   INTEGER DEFAULT 0,
    observacoes      TEXT,
    criado_em        TIMESTAMP DEFAULT NOW()
);

-- Ordens de Serviço
CREATE TABLE ordens_servico (
    id            SERIAL PRIMARY KEY,
    numero        VARCHAR(20),
    cliente_id    INTEGER REFERENCES clientes(id),
    projeto_id    INTEGER REFERENCES projetos(id),
    titulo        VARCHAR(300) NOT NULL,
    tipo_servico  VARCHAR(50),
    prioridade    VARCHAR(20) DEFAULT 'Normal',
    status        VARCHAR(30) DEFAULT 'Aberta',
    dt_abertura   DATE DEFAULT CURRENT_DATE,
    dt_prazo      DATE,
    dt_conclusao  DATE,
    valor_cobrado NUMERIC(12,2),
    observacoes   TEXT,
    criado_em     TIMESTAMP DEFAULT NOW()
);

-- Scripts / Base de Conhecimento
CREATE TABLE scripts (
    id           SERIAL PRIMARY KEY,
    titulo       VARCHAR(300) NOT NULL,
    tipo         VARCHAR(50),
    tags         TEXT,
    descricao    TEXT,
    conteudo     TEXT,
    sistema      VARCHAR(100),
    favorito     BOOLEAN DEFAULT FALSE,
    criado_em    TIMESTAMP DEFAULT NOW()
);

-- Financeiro — Honorários
CREATE TABLE honorarios (
    id               SERIAL PRIMARY KEY,
    cliente_id       INTEGER REFERENCES clientes(id),
    projeto_id       INTEGER REFERENCES projetos(id),
    descricao        VARCHAR(300),
    valor            NUMERIC(12,2),
    dt_vencimento    DATE,
    status           VARCHAR(30) DEFAULT 'Pendente',
    dt_recebimento   DATE,
    forma_pagamento  VARCHAR(50),
    observacoes      TEXT,
    criado_em        TIMESTAMP DEFAULT NOW()
);

-- Financeiro — Despesas
CREATE TABLE despesas (
    id              SERIAL PRIMARY KEY,
    descricao       VARCHAR(300),
    categoria       VARCHAR(100),
    valor           NUMERIC(12,2),
    dt_vencimento   DATE,
    status          VARCHAR(30) DEFAULT 'Pendente',
    dt_pagamento    DATE,
    observacoes     TEXT,
    criado_em       TIMESTAMP DEFAULT NOW()
);

-- Agenda
CREATE TABLE agenda (
    id           SERIAL PRIMARY KEY,
    titulo       VARCHAR(300) NOT NULL,
    categoria    VARCHAR(50),
    dt_evento    DATE,
    hr_inicio    TIME,
    hr_fim       TIME,
    cliente_id   INTEGER REFERENCES clientes(id),
    projeto_id   INTEGER REFERENCES projetos(id),
    descricao    TEXT,
    status       VARCHAR(30) DEFAULT 'Pendente',
    lembrete     BOOLEAN DEFAULT FALSE,
    criado_em    TIMESTAMP DEFAULT NOW()
);

-- Conexões SQL salvas
CREATE TABLE conexoes_sql (
    id       SERIAL PRIMARY KEY,
    nome     VARCHAR(100) NOT NULL,
    host     VARCHAR(200),
    porta    INTEGER DEFAULT 5432,
    banco    VARCHAR(100),
    usuario  VARCHAR(100),
    senha    TEXT,
    ativa    BOOLEAN DEFAULT TRUE
);

-- Histórico de queries SQL
CREATE TABLE historico_sql (
    id          SERIAL PRIMARY KEY,
    conexao_id  INTEGER REFERENCES conexoes_sql(id),
    query       TEXT,
    executado_em TIMESTAMP DEFAULT NOW()
);

-- Templates de relatório
CREATE TABLE relatorio_templates (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(200) NOT NULL,
    descricao   TEXT,
    html        TEXT,
    criado_em   TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);
```

---

## INSTRUÇÃO COMPLETA PARA O CLAUDE NO VSCODE

```
Estou desenvolvendo o KronTech, um ERP desktop pessoal com Electron + React + PostgreSQL.

IDENTIDADE VISUAL:
- Cores: laranja #FF6B2B (principal), preto #0E0E0E (fundo dark), cinza #1E1E1E (cards)
- Modo light: fundo #F4F4F4, laranja #E85A1A
- Tipografia: system-ui, Kron em 700, Tech em 200
- Bordas: #2A2A2A dark / #DCDCDC light
- Border-radius padrão: 10–14px
- Suporte a data-theme="dark" e data-theme="light"
- Variáveis CSS definidas em assets/krontech-tokens.css

STACK:
- Electron (app desktop .exe)
- React + CSS Variables (sem Tailwind, sem Bootstrap)
- PostgreSQL (banco local)
- Monaco Editor (editor SQL embutido)
- Puppeteer (geração de PDF via HTML template)

MÓDULOS DO SISTEMA:
1. Dashboard (tela inicial) — cards de métricas, gráfico OS por mês, compromissos do dia, alertas
2. Ordens de Serviço — listagem com filtros por cliente, status, prioridade, tipo, período
3. Projetos / Clientes — cadastro de clientes e projetos com etapas em checklist
4. Base de Scripts — repositório de SQL, Pascal, FR3 e anotações com busca e syntax highlight
5. Financeiro — honorários a receber, despesas e fluxo de caixa mensal
6. Agenda — compromissos categorizados (tarefas, reuniões, prazos, treinamentos)
7. Editor SQL — Monaco Editor com execução de queries, histórico e múltiplas conexões
8. Relatórios — templates HTML editáveis com geração de PDF via Puppeteer

BANCO DE DADOS (PostgreSQL):
Tabelas: clientes, projetos, ordens_servico, scripts, honorarios, despesas, agenda,
         conexoes_sql, historico_sql, relatorio_templates

PADRÃO DE CÓDIGO:
- Componentes React funcionais com hooks
- CSS via variáveis --kt-* definidas em krontech-tokens.css
- Sem frameworks CSS externos
- Comentários em português
- Sempre componentes completos, prontos para usar
- Sempre usar variáveis --kt-* para cores e espaçamentos
```

---

*KronTech · Ordem no caos do dia a dia. · v1.0 · 2026*
