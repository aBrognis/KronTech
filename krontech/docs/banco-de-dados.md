# KronTech — Padrão de Banco de Dados
> v1.0 · 2026

---

## CONVENÇÕES DEFINIDAS

| ITEM | PADRÃO | EXEMPLO |
|---|---|---|
| Schema | `krontech` | `krontech.cli_001` |
| Tabelas | Prefixo por módulo + `_001` | `cli_001`, `os_001` |
| Campos | `UPPER_CASE` | `NOME`, `STATUS` |
| Chave primária | `ID` | `ID SERIAL PRIMARY KEY` |
| Chaves estrangeiras | `ID_` + tabela origem | `ID_CLIENTE`, `ID_PROJETO` |
| Campos de data | `DT_` + nome | `DT_ABERTURA`, `DT_VENCIMENTO` |
| Demais campos | Nome direto em UPPER | `VALOR`, `STATUS`, `TITULO` |

---

## PREFIXOS POR MÓDULO

| MÓDULO | PREFIXO | TABELAS |
|---|---|---|
| Clientes | `cli_` | `cli_001` |
| Projetos | `prj_` | `prj_001`, `prj_002` |
| Ordens de Serviço | `os_` | `os_001` |
| Scripts / Conhecimento | `scr_` | `scr_001` |
| Financeiro | `fin_` | `fin_001`, `fin_002` |
| Agenda | `age_` | `age_001` |
| Editor SQL | `sql_` | `sql_001`, `sql_002` |
| Relatórios | `rel_` | `rel_001` |

---

## DDL COMPLETO

```sql
-- ============================================================
-- KRONTECH — Criação do Schema e Tabelas
-- Schema: krontech
-- Padrão: UPPER_CASE campos, prefixo módulo nas tabelas
-- ============================================================

CREATE SCHEMA IF NOT EXISTS krontech;

-- ============================================================
-- MÓDULO: CLIENTES
-- ============================================================

CREATE TABLE krontech.cli_001 (
    ID              SERIAL          PRIMARY KEY,
    NOME            VARCHAR(200)    NOT NULL,
    CNPJ_CPF        VARCHAR(20),
    CONTATO         VARCHAR(100),
    TELEFONE        VARCHAR(20),
    EMAIL           VARCHAR(100),
    CIDADE          VARCHAR(100),
    UF              CHAR(2),
    OBSERVACOES     TEXT,
    ATIVO           BOOLEAN         DEFAULT TRUE,
    DT_CRIACAO      TIMESTAMP       DEFAULT NOW()
);

COMMENT ON TABLE  krontech.cli_001          IS 'Clientes';
COMMENT ON COLUMN krontech.cli_001.ID       IS 'Chave primária';
COMMENT ON COLUMN krontech.cli_001.NOME     IS 'Nome ou razão social';
COMMENT ON COLUMN krontech.cli_001.ATIVO    IS 'Registro ativo';

-- ============================================================
-- MÓDULO: PROJETOS
-- ============================================================

CREATE TABLE krontech.prj_001 (
    ID                  SERIAL          PRIMARY KEY,
    ID_CLIENTE          INTEGER         REFERENCES krontech.cli_001(ID),
    NOME                VARCHAR(200)    NOT NULL,
    TIPO                VARCHAR(50),
    STATUS              VARCHAR(50)     DEFAULT 'Planejado',
    DT_INICIO           DATE,
    DT_PREVISAO         DATE,
    VALOR_CONTRATADO    NUMERIC(12,2),
    PERC_CONCLUIDO      INTEGER         DEFAULT 0,
    OBSERVACOES         TEXT,
    DT_CRIACAO          TIMESTAMP       DEFAULT NOW()
);

COMMENT ON TABLE krontech.prj_001 IS 'Projetos';

-- Etapas / Checklist do Projeto
CREATE TABLE krontech.prj_002 (
    ID          SERIAL          PRIMARY KEY,
    ID_PROJETO  INTEGER         NOT NULL REFERENCES krontech.prj_001(ID) ON DELETE CASCADE,
    DESCRICAO   VARCHAR(300)    NOT NULL,
    CONCLUIDA   BOOLEAN         DEFAULT FALSE,
    DT_CONCLUSAO DATE,
    ORDEM       INTEGER         DEFAULT 0
);

COMMENT ON TABLE krontech.prj_002 IS 'Etapas/Checklist dos Projetos';

-- ============================================================
-- MÓDULO: ORDENS DE SERVIÇO
-- ============================================================

CREATE TABLE krontech.os_001 (
    ID              SERIAL          PRIMARY KEY,
    NUMERO          VARCHAR(20),
    ID_CLIENTE      INTEGER         REFERENCES krontech.cli_001(ID),
    ID_PROJETO      INTEGER         REFERENCES krontech.prj_001(ID),
    TITULO          VARCHAR(300)    NOT NULL,
    TIPO_SERVICO    VARCHAR(50),
    PRIORIDADE      VARCHAR(20)     DEFAULT 'Normal',
    STATUS          VARCHAR(30)     DEFAULT 'Aberta',
    DT_ABERTURA     DATE            DEFAULT CURRENT_DATE,
    DT_PRAZO        DATE,
    DT_CONCLUSAO    DATE,
    VALOR           NUMERIC(12,2),
    OBSERVACOES     TEXT,
    DT_CRIACAO      TIMESTAMP       DEFAULT NOW()
);

COMMENT ON TABLE krontech.os_001 IS 'Ordens de Serviço';

-- Numeração automática da OS
CREATE SEQUENCE IF NOT EXISTS krontech.os_numero_seq START 1;

CREATE OR REPLACE FUNCTION krontech.fn_gerar_numero_os()
RETURNS TRIGGER AS $$
BEGIN
    NEW.NUMERO := 'OS-' || LPAD(NEXTVAL('krontech.os_numero_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_numero_os
BEFORE INSERT ON krontech.os_001
FOR EACH ROW
WHEN (NEW.NUMERO IS NULL)
EXECUTE FUNCTION krontech.fn_gerar_numero_os();

-- ============================================================
-- MÓDULO: SCRIPTS / BASE DE CONHECIMENTO
-- ============================================================

CREATE TABLE krontech.scr_001 (
    ID          SERIAL          PRIMARY KEY,
    TITULO      VARCHAR(300)    NOT NULL,
    TIPO        VARCHAR(50),
    TAGS        TEXT,
    DESCRICAO   TEXT,
    CONTEUDO    TEXT,
    SISTEMA     VARCHAR(100),
    FAVORITO    BOOLEAN         DEFAULT FALSE,
    DT_CRIACAO  TIMESTAMP       DEFAULT NOW()
);

COMMENT ON TABLE krontech.scr_001 IS 'Base de Scripts e Conhecimento';

-- ============================================================
-- MÓDULO: FINANCEIRO
-- ============================================================

-- Honorários a Receber
CREATE TABLE krontech.fin_001 (
    ID              SERIAL          PRIMARY KEY,
    ID_CLIENTE      INTEGER         REFERENCES krontech.cli_001(ID),
    ID_PROJETO      INTEGER         REFERENCES krontech.prj_001(ID),
    DESCRICAO       VARCHAR(300),
    VALOR           NUMERIC(12,2),
    DT_VENCIMENTO   DATE,
    STATUS          VARCHAR(30)     DEFAULT 'Pendente',
    DT_RECEBIMENTO  DATE,
    FORMA_PAGTO     VARCHAR(50),
    OBSERVACOES     TEXT,
    DT_CRIACAO      TIMESTAMP       DEFAULT NOW()
);

COMMENT ON TABLE krontech.fin_001 IS 'Honorários a Receber';

-- Despesas / Contas a Pagar
CREATE TABLE krontech.fin_002 (
    ID              SERIAL          PRIMARY KEY,
    DESCRICAO       VARCHAR(300)    NOT NULL,
    CATEGORIA       VARCHAR(100),
    VALOR           NUMERIC(12,2),
    DT_VENCIMENTO   DATE,
    STATUS          VARCHAR(30)     DEFAULT 'Pendente',
    DT_PAGAMENTO    DATE,
    OBSERVACOES     TEXT,
    DT_CRIACAO      TIMESTAMP       DEFAULT NOW()
);

COMMENT ON TABLE krontech.fin_002 IS 'Despesas / Contas a Pagar';

-- ============================================================
-- MÓDULO: AGENDA
-- ============================================================

CREATE TABLE krontech.age_001 (
    ID          SERIAL          PRIMARY KEY,
    TITULO      VARCHAR(300)    NOT NULL,
    CATEGORIA   VARCHAR(50),
    DT_EVENTO   DATE,
    HR_INICIO   TIME,
    HR_FIM      TIME,
    ID_CLIENTE  INTEGER         REFERENCES krontech.cli_001(ID),
    ID_PROJETO  INTEGER         REFERENCES krontech.prj_001(ID),
    DESCRICAO   TEXT,
    STATUS      VARCHAR(30)     DEFAULT 'Pendente',
    LEMBRETE    BOOLEAN         DEFAULT FALSE,
    DT_CRIACAO  TIMESTAMP       DEFAULT NOW()
);

COMMENT ON TABLE krontech.age_001 IS 'Agenda e Compromissos';

-- ============================================================
-- MÓDULO: EDITOR SQL
-- ============================================================

-- Conexões salvas
CREATE TABLE krontech.sql_001 (
    ID      SERIAL          PRIMARY KEY,
    NOME    VARCHAR(100)    NOT NULL,
    HOST    VARCHAR(200),
    PORTA   INTEGER         DEFAULT 5432,
    BANCO   VARCHAR(100),
    USUARIO VARCHAR(100),
    SENHA   TEXT,
    ATIVA   BOOLEAN         DEFAULT TRUE,
    DT_CRIACAO TIMESTAMP    DEFAULT NOW()
);

COMMENT ON TABLE krontech.sql_001 IS 'Conexões SQL Salvas';

-- Histórico de queries
CREATE TABLE krontech.sql_002 (
    ID          SERIAL      PRIMARY KEY,
    ID_CONEXAO  INTEGER     REFERENCES krontech.sql_001(ID),
    QUERY       TEXT,
    DT_EXECUCAO TIMESTAMP   DEFAULT NOW()
);

COMMENT ON TABLE krontech.sql_002 IS 'Histórico de Queries SQL';

-- ============================================================
-- MÓDULO: RELATÓRIOS
-- ============================================================

CREATE TABLE krontech.rel_001 (
    ID              SERIAL          PRIMARY KEY,
    NOME            VARCHAR(200)    NOT NULL,
    DESCRICAO       TEXT,
    HTML            TEXT,
    DT_CRIACAO      TIMESTAMP       DEFAULT NOW(),
    DT_ATUALIZACAO  TIMESTAMP       DEFAULT NOW()
);

COMMENT ON TABLE krontech.rel_001 IS 'Templates de Relatórios';

-- ============================================================
-- DOMÍNIOS / LISTAS DE VALORES
-- ============================================================

-- Tipos de serviço OS
-- Suporte, Implantação, Desenvolvimento, Treinamento, Consultoria

-- Prioridades OS
-- Baixa, Normal, Alta, Urgente

-- Status OS
-- Aberta, Em Andamento, Aguardando, Concluída, Cancelada

-- Tipos de projeto
-- Implantação, Desenvolvimento, Suporte Contínuo, Consultoria

-- Status projeto
-- Planejado, Em andamento, Pausado, Concluído, Cancelado

-- Categorias agenda
-- Tarefa, Reunião/Visita, Prazo de Projeto, Treinamento, Outro

-- Status financeiro
-- Pendente, Pago, Atrasado, Cancelado

-- Formas de pagamento
-- PIX, Boleto, Transferência, Dinheiro, Cartão

-- Categorias despesa
-- Ferramentas, Assinaturas, Transporte, Alimentação, Outros

-- Tipos de script
-- SQL, Pascal/PL-pgSQL, FR3/FastReport, Anotação Geral

-- ============================================================
-- GRANTS (caso necessite usuário separado)
-- ============================================================

-- GRANT USAGE ON SCHEMA krontech TO seu_usuario;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA krontech TO seu_usuario;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA krontech TO seu_usuario;
```

---

## RESUMO DO PADRÃO

```
Schema:     krontech
Tabelas:    krontech.cli_001, krontech.os_001, krontech.fin_001 ...
Campos:     UPPER_CASE direto — NOME, STATUS, TITULO, VALOR
Datas:      DT_ + nome — DT_ABERTURA, DT_VENCIMENTO, DT_CRIACAO
PK:         ID SERIAL PRIMARY KEY
FK:         ID_CLIENTE, ID_PROJETO, ID_CONEXAO
```

---

*KronTech · Ordem no caos do dia a dia. · v1.0 · 2026*
