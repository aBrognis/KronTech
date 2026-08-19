// Catálogo de tipos de widget, paleta de cores e intervalos de auto-atualização

export const TIPOS = [
  { value: 'card',    icon: 'hash',          label: 'Card KPI',      desc: 'Valor único em destaque',      defW: 3, defH: 2 },
  { value: 'bar',     icon: 'bar-chart-2',   label: 'Barras',        desc: 'Comparação por categoria',     defW: 4, defH: 5 },
  { value: 'bar_h',   icon: 'align-left',    label: 'Barras horiz.', desc: 'Rankings com labels longos',   defW: 4, defH: 5 },
  { value: 'line',    icon: 'trending-up',   label: 'Linhas',        desc: 'Evolução no tempo',            defW: 6, defH: 5 },
  { value: 'pie',     icon: 'pie-chart',     label: 'Donut',         desc: 'Distribuição percentual',      defW: 4, defH: 5 },
  { value: 'gauge',   icon: 'gauge',         label: 'Gauge',         desc: 'Velocímetro / progresso',      defW: 3, defH: 4 },
  { value: 'scatter', icon: 'crosshair',     label: 'Dispersão',     desc: 'Correlação X × Y',             defW: 5, defH: 5 },
  { value: 'radar',   icon: 'activity',      label: 'Radar',         desc: 'Multi-eixo / teia',            defW: 4, defH: 5 },
  { value: 'grid',    icon: 'table-2',       label: 'Tabela',        desc: 'Lista de dados',               defW: 6, defH: 5 },
  { value: 'bar_stacked',      icon: 'bar-chart-3',       label: 'Barras empilhadas',    desc: 'Comparação empilhada por categoria', defW: 5, defH: 5 },
  { value: 'line_area',        icon: 'area-chart',        label: 'Área',                 desc: 'Evolução preenchida no tempo',       defW: 6, defH: 5 },
  { value: 'funnel',           icon: 'filter',             label: 'Funil',                desc: 'Conversão por etapa',                 defW: 4, defH: 5 },
  { value: 'heatmap',          icon: 'grid-3x3',          label: 'Mapa de calor',        desc: 'Intensidade por 2 categorias',        defW: 5, defH: 5 },
  { value: 'calendar_heatmap', icon: 'calendar-days',     label: 'Calendário',           desc: 'Atividade por dia (estilo GitHub)',   defW: 8, defH: 3 },
  { value: 'treemap',          icon: 'layout-grid',       label: 'Treemap',              desc: 'Hierarquia por área proporcional',    defW: 5, defH: 5 },
  { value: 'sunburst',         icon: 'sun',                label: 'Sunburst',             desc: 'Hierarquia radial',                   defW: 4, defH: 5 },
  { value: 'boxplot',          icon: 'box-select',        label: 'Boxplot',              desc: 'Distribuição estatística',            defW: 5, defH: 5 },
  { value: 'candlestick',      icon: 'candlestick-chart', label: 'Candlestick',          desc: 'OHLC / financeiro',                   defW: 6, defH: 5 },
  { value: 'graph',            icon: 'share-2',            label: 'Rede (grafo)',         desc: 'Relações entre nós',                  defW: 5, defH: 5 },
  { value: 'tree',             icon: 'git-branch',        label: 'Árvore',               desc: 'Estrutura hierárquica',               defW: 5, defH: 5 },
  { value: 'sankey',           icon: 'workflow',           label: 'Sankey',               desc: 'Fluxo entre etapas',                  defW: 6, defH: 5 },
  { value: 'theme_river',      icon: 'waves',              label: 'Rio temático',         desc: 'Fluxo de séries no tempo',            defW: 6, defH: 4 },
  { value: 'pictorial_bar',    icon: 'image',              label: 'Barras pictóricas',    desc: 'Barras com ícones repetidos',         defW: 4, defH: 5 },
  { value: 'parallel',         icon: 'columns-3',          label: 'Coordenadas paralelas',desc: 'Comparação multi-dimensional',        defW: 6, defH: 5 },
  { value: 'mapa_br',          icon: 'map',                label: 'Mapa do Brasil',       desc: 'Distribuição geográfica por UF/município', defW: 6, defH: 6 },
]

export const PALETA = [
  '#FF6B2B','#60A5FA','#4ADE80','#FBD24C','#A78BFA','#F472B6','#34D399','#FB923C','#E879F9','#22D3EE','#F43F5E','#84CC16',
  '#EF4444','#F97316','#EAB308','#84CC16','#22C55E','#10B981','#14B8A6','#06B6D4','#0EA5E9','#3B82F6','#6366F1','#8B5CF6',
  '#A855F7','#D946EF','#EC4899','#F43F5E','#78716C','#64748B','#DC2626','#EA580C','#CA8A04','#16A34A','#0891B2','#2563EB',
  '#7C3AED','#C026D3','#DB2777','#B91C1C','#9A3412','#854D0E','#166534','#155E75','#1D4ED8','#5B21B6','#9D174D','#374151',
]

export const INTERVALOS = [
  { label: 'Sem auto-atualização', value: 0    },
  { label: '15 segundos',          value: 15   },
  { label: '30 segundos',          value: 30   },
  { label: '1 minuto',             value: 60   },
  { label: '5 minutos',            value: 300  },
  { label: '15 minutos',           value: 900  },
  { label: '1 hora',               value: 3600 },
]
