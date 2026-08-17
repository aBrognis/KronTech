// SQL_HINTS (placeholder do textarea) e SQL_GUIDE (regra + exemplos) por tipo de widget.
// Todos os exemplos consultam a tabela demo kr_demo_vendas (populada via botão
// "Popular demo" no Designer), colunas: vendedor, regiao, produto, categoria, canal,
// status, quantidade, valor, custo, avaliacao, data_venda.

export const SQL_HINTS = {
  card:    `SELECT COUNT(*) AS total FROM kr_demo_vendas`,
  bar:     `SELECT categoria, COUNT(*) AS total\nFROM kr_demo_vendas\nGROUP BY categoria\nORDER BY total DESC`,
  bar_h:   `SELECT produto AS label, SUM(valor) AS valor\nFROM kr_demo_vendas\nGROUP BY produto\nORDER BY valor DESC\nLIMIT 10`,
  line:    `SELECT DATE_TRUNC('month', data_venda)::date AS mes, SUM(valor) AS total\nFROM kr_demo_vendas\nGROUP BY mes\nORDER BY mes`,
  pie:     `SELECT categoria, SUM(valor) AS total\nFROM kr_demo_vendas\nGROUP BY categoria`,
  gauge:   `SELECT SUM(valor) AS atual, 100000 AS maximo FROM kr_demo_vendas`,
  scatter: `SELECT custo AS x, valor AS y\nFROM kr_demo_vendas\nLIMIT 200`,
  radar:   `SELECT 'Qualidade' AS eixo, 8 AS valor, 10 AS maximo\nUNION ALL\nSELECT 'Prazo', 6, 10\nUNION ALL\nSELECT 'Custo', 9, 10`,
  grid:    `SELECT * FROM kr_demo_vendas\nORDER BY data_venda DESC\nLIMIT 20`,
  bar_stacked: `SELECT regiao,\n  SUM(CASE WHEN categoria='Eletrônicos' THEN valor ELSE 0 END) AS eletronicos,\n  SUM(CASE WHEN categoria='Vestuário' THEN valor ELSE 0 END) AS vestuario\nFROM kr_demo_vendas\nGROUP BY regiao`,
  line_area: `SELECT DATE_TRUNC('month', data_venda)::date AS mes, SUM(valor) AS total\nFROM kr_demo_vendas\nGROUP BY mes\nORDER BY mes`,
  funnel: `SELECT status AS etapa, COUNT(*) AS total\nFROM kr_demo_vendas\nGROUP BY status\nORDER BY CASE status\n  WHEN 'Prospecção' THEN 1 WHEN 'Proposta' THEN 2\n  WHEN 'Negociação' THEN 3 WHEN 'Fechado' THEN 4 ELSE 5 END`,
  graph: `SELECT regiao AS origem, canal AS destino, COUNT(*) AS peso\nFROM kr_demo_vendas\nGROUP BY regiao, canal`,
  tree: `SELECT categoria AS no, NULL AS pai FROM kr_demo_vendas GROUP BY categoria\nUNION ALL\nSELECT produto AS no, categoria AS pai FROM kr_demo_vendas GROUP BY produto, categoria`,
  sankey: `SELECT regiao AS origem, categoria AS destino, SUM(valor) AS valor\nFROM kr_demo_vendas\nGROUP BY regiao, categoria`,
  theme_river: `SELECT DATE_TRUNC('week', data_venda)::date AS data, categoria, SUM(valor) AS valor\nFROM kr_demo_vendas\nGROUP BY data, categoria\nORDER BY data`,
  heatmap: `SELECT regiao, categoria, SUM(valor) AS total\nFROM kr_demo_vendas\nGROUP BY regiao, categoria`,
  calendar_heatmap: `SELECT data_venda, COUNT(*) AS total\nFROM kr_demo_vendas\nGROUP BY data_venda`,
  treemap: `SELECT produto, SUM(valor) AS total, categoria\nFROM kr_demo_vendas\nGROUP BY produto, categoria`,
  sunburst: `SELECT produto, SUM(valor) AS total, categoria\nFROM kr_demo_vendas\nGROUP BY produto, categoria`,
  parallel: `SELECT quantidade, valor, custo, avaliacao\nFROM kr_demo_vendas\nWHERE avaliacao IS NOT NULL\nLIMIT 100`,
  boxplot: `SELECT categoria, valor\nFROM kr_demo_vendas`,
  candlestick: `SELECT TO_CHAR(data_venda,'DD/MM') AS dia,\n  MIN(valor) AS abertura, MAX(valor) AS fechamento,\n  MIN(valor) AS minima, MAX(valor) AS maxima\nFROM kr_demo_vendas\nGROUP BY dia, data_venda\nORDER BY data_venda\nLIMIT 30`,
  pictorial_bar: `SELECT regiao, COUNT(*) AS total\nFROM kr_demo_vendas\nGROUP BY regiao\nORDER BY total DESC`,
}

export const SQL_GUIDE = {
  card: {
    regra: 'Retorne 1 linha. Cada coluna vira um valor. Primeira coluna = valor principal (grande).',
    exemplos: [
      { label: 'Total simples', sql: `SELECT COUNT(*) AS total FROM kr_demo_vendas` },
      { label: 'KPI composto', sql: `SELECT\n  COUNT(*) AS vendas,\n  SUM(valor) AS receita,\n  SUM(valor - custo) AS margem\nFROM kr_demo_vendas\nWHERE status = 'Fechado'` },
    ],
  },
  bar: {
    regra: 'Col 1 = rótulo eixo X. Colunas seguintes = valores (uma série cada).',
    exemplos: [
      { label: 'Por categoria', sql: `SELECT categoria, COUNT(*) AS total\nFROM kr_demo_vendas\nGROUP BY categoria\nORDER BY total DESC` },
      { label: 'Top vendedores', sql: `SELECT vendedor, SUM(valor) AS receita\nFROM kr_demo_vendas\nGROUP BY vendedor\nORDER BY receita DESC\nLIMIT 10` },
    ],
  },
  bar_h: {
    regra: 'Igual ao de Barras, mas na horizontal. Ideal para labels longos.',
    exemplos: [
      { label: 'Ranking de produtos', sql: `SELECT produto AS label, SUM(valor) AS valor\nFROM kr_demo_vendas\nGROUP BY produto\nORDER BY valor DESC\nLIMIT 10` },
    ],
  },
  line: {
    regra: 'Col 1 = eixo X (tempo/categoria). Colunas seguintes = linhas.',
    exemplos: [
      { label: 'Por mês', sql: `SELECT DATE_TRUNC('month', data_venda)::date AS mes, SUM(valor) AS total\nFROM kr_demo_vendas\nGROUP BY mes\nORDER BY mes` },
      { label: 'Série dupla (receita x custo)', sql: `SELECT DATE_TRUNC('month', data_venda)::date AS mes,\n  SUM(valor) AS receita,\n  SUM(custo) AS custo\nFROM kr_demo_vendas\nGROUP BY mes\nORDER BY mes` },
    ],
  },
  pie: {
    regra: 'Col 1 = nome da fatia. Col 2 = valor numérico.',
    exemplos: [
      { label: 'Por categoria', sql: `SELECT categoria, SUM(valor) AS total\nFROM kr_demo_vendas\nGROUP BY categoria` },
    ],
  },
  gauge: {
    regra: 'Retorne 1 linha. Col 1 = valor atual, Col 2 (opcional) = máximo.',
    exemplos: [
      { label: 'Percentual', sql: `SELECT 73 AS atual, 100 AS maximo` },
      { label: 'Meta de receita', sql: `SELECT SUM(valor) AS receita, 100000 AS meta\nFROM kr_demo_vendas\nWHERE status = 'Fechado'` },
    ],
  },
  scatter: {
    regra: 'Col 1 = X, Col 2 = Y. Col 3 (opcional) = tooltip.',
    exemplos: [
      { label: 'Custo x Valor', sql: `SELECT custo AS x, valor AS y\nFROM kr_demo_vendas\nLIMIT 200` },
    ],
  },
  radar: {
    regra: '3 colunas: eixo (nome), valor, máximo. Cada linha = 1 eixo.',
    exemplos: [
      { label: 'Avaliação', sql: `SELECT 'Qualidade' AS eixo, 8 AS valor, 10 AS maximo\nUNION ALL SELECT 'Prazo', 6, 10\nUNION ALL SELECT 'Custo', 9, 10\nUNION ALL SELECT 'Suporte', 7, 10` },
      { label: 'Regiões (média avaliação)', sql: `SELECT regiao AS eixo, ROUND(AVG(avaliacao),1) AS valor, 5 AS maximo\nFROM kr_demo_vendas\nWHERE avaliacao IS NOT NULL\nGROUP BY regiao` },
    ],
  },
  grid: {
    regra: 'Qualquer SELECT. Todas as colunas viram cabeçalhos.',
    exemplos: [
      { label: 'Últimas vendas', sql: `SELECT * FROM kr_demo_vendas\nORDER BY data_venda DESC\nLIMIT 20` },
    ],
  },
  bar_stacked: {
    regra: 'Col 1 = categoria (eixo X). Colunas seguintes = séries empilhadas.',
    exemplos: [
      { label: 'Receita por região e categoria', sql: `SELECT regiao,\n  SUM(CASE WHEN categoria='Eletrônicos' THEN valor ELSE 0 END) AS eletronicos,\n  SUM(CASE WHEN categoria='Vestuário' THEN valor ELSE 0 END) AS vestuario,\n  SUM(CASE WHEN categoria='Alimentos' THEN valor ELSE 0 END) AS alimentos\nFROM kr_demo_vendas\nGROUP BY regiao` },
    ],
  },
  line_area: {
    regra: 'Col 1 = eixo X (tempo/categoria). Colunas seguintes = linhas preenchidas.',
    exemplos: [
      { label: 'Receita por mês', sql: `SELECT DATE_TRUNC('month', data_venda)::date AS mes, SUM(valor) AS total\nFROM kr_demo_vendas\nGROUP BY mes\nORDER BY mes` },
    ],
  },
  funnel: {
    regra: 'Col 1 = etapa. Col 2 = valor. Ordene as linhas na ordem lógica do funil; a primeira linha é o topo.',
    exemplos: [
      { label: 'Funil de vendas', sql: `SELECT status AS etapa, COUNT(*) AS total\nFROM kr_demo_vendas\nGROUP BY status\nORDER BY CASE status\n  WHEN 'Prospecção' THEN 1 WHEN 'Proposta' THEN 2\n  WHEN 'Negociação' THEN 3 WHEN 'Fechado' THEN 4 ELSE 5 END` },
    ],
  },
  graph: {
    regra: 'Col 1 = nó origem. Col 2 = nó destino. Col 3 (opcional) = peso da conexão.',
    exemplos: [
      { label: 'Região → Canal', sql: `SELECT regiao AS origem, canal AS destino, COUNT(*) AS peso\nFROM kr_demo_vendas\nGROUP BY regiao, canal` },
    ],
  },
  tree: {
    regra: 'Col 1 = nome do nó. Col 2 = nome do pai (vazio/NULL = raiz).',
    exemplos: [
      { label: 'Categoria → Produto', sql: `SELECT categoria AS no, NULL AS pai FROM kr_demo_vendas GROUP BY categoria\nUNION ALL\nSELECT produto AS no, categoria AS pai FROM kr_demo_vendas GROUP BY produto, categoria` },
    ],
  },
  sankey: {
    regra: 'Col 1 = origem, Col 2 = destino, Col 3 = valor do fluxo.',
    exemplos: [
      { label: 'Região → Categoria (receita)', sql: `SELECT regiao AS origem, categoria AS destino, SUM(valor) AS valor\nFROM kr_demo_vendas\nGROUP BY regiao, categoria` },
    ],
  },
  theme_river: {
    regra: 'Col 1 = data, Col 2 = categoria/série, Col 3 = valor.',
    exemplos: [
      { label: 'Receita semanal por categoria', sql: `SELECT DATE_TRUNC('week', data_venda)::date AS data, categoria, SUM(valor) AS valor\nFROM kr_demo_vendas\nGROUP BY data, categoria\nORDER BY data` },
    ],
  },
  heatmap: {
    regra: 'Col 1 = categoria X, Col 2 = categoria Y, Col 3 = valor.',
    exemplos: [
      { label: 'Região x Categoria (receita)', sql: `SELECT regiao, categoria, SUM(valor) AS total\nFROM kr_demo_vendas\nGROUP BY regiao, categoria` },
    ],
  },
  calendar_heatmap: {
    regra: 'Col 1 = data, Col 2 = valor. Mostra apenas o ano da primeira linha retornada; filtre por ano se necessário.',
    exemplos: [
      { label: 'Vendas por dia', sql: `SELECT data_venda, COUNT(*) AS total\nFROM kr_demo_vendas\nGROUP BY data_venda` },
    ],
  },
  treemap: {
    regra: 'Col 1 = nome, Col 2 = valor, Col 3 (opcional) = grupo pai (hierarquia de 2 níveis).',
    exemplos: [
      { label: 'Produtos (plano)', sql: `SELECT produto, SUM(valor) AS total\nFROM kr_demo_vendas\nGROUP BY produto` },
      { label: 'Produtos por categoria', sql: `SELECT produto, SUM(valor) AS total, categoria\nFROM kr_demo_vendas\nGROUP BY produto, categoria` },
    ],
  },
  sunburst: {
    regra: 'Col 1 = nome, Col 2 = valor, Col 3 (opcional) = grupo pai (hierarquia radial de 2 níveis).',
    exemplos: [
      { label: 'Produtos por categoria', sql: `SELECT produto, SUM(valor) AS total, categoria\nFROM kr_demo_vendas\nGROUP BY produto, categoria` },
    ],
  },
  parallel: {
    regra: 'Todas as colunas numéricas viram eixos paralelos; cada linha do resultado vira 1 traço.',
    exemplos: [
      { label: 'Quantidade, valor, custo, avaliação', sql: `SELECT quantidade, valor, custo, avaliacao\nFROM kr_demo_vendas\nWHERE avaliacao IS NOT NULL\nLIMIT 100` },
    ],
  },
  boxplot: {
    regra: 'Col 1 = categoria. Col 2 = valor numérico (uma linha por observação; o widget calcula mín/Q1/mediana/Q3/máx automaticamente).',
    exemplos: [
      { label: 'Distribuição de valor por categoria', sql: `SELECT categoria, valor\nFROM kr_demo_vendas` },
    ],
  },
  candlestick: {
    regra: 'Ordem das colunas: rótulo, abertura, fechamento, mínima, máxima.',
    exemplos: [
      { label: 'OHLC sintético por dia', sql: `SELECT TO_CHAR(data_venda,'DD/MM') AS dia,\n  MIN(valor) AS abertura, MAX(valor) AS fechamento,\n  MIN(valor) AS minima, MAX(valor) AS maxima\nFROM kr_demo_vendas\nGROUP BY dia, data_venda\nORDER BY data_venda\nLIMIT 30` },
    ],
  },
  pictorial_bar: {
    regra: 'Col 1 = categoria. Col 2 = valor. Renderiza como blocos repetidos em vez de barra sólida, ideal para poucas categorias com valores redondos.',
    exemplos: [
      { label: 'Vendas por região', sql: `SELECT regiao, COUNT(*) AS total\nFROM kr_demo_vendas\nGROUP BY regiao\nORDER BY total DESC` },
    ],
  },
}
