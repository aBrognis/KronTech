// Schemas de tool calling por template — cada um define os campos que o
// Claude precisa preencher a partir do texto bruto. Mantidos em código (não
// no banco), já que são o contrato entre o motor de IA e o renderer HTML,
// não dado de negócio.

export const SCHEMA_ANALISE_ADERENCIA = {
  type: 'object',
  required: ['introducao', 'nomeTela', 'objetivoTela', 'funcionalidades', 'integracoes'],
  properties: {
    introducao:      { type: 'string', description: 'Parágrafo de introdução explicando o propósito de validar a tela.' },
    nomeTela:         { type: 'string', description: 'Nome da tela/cadastro sendo validado (ex: "CADASTRO DE ORDEM DE PRODUÇÃO").' },
    objetivoTela:     { type: 'string', description: 'Parágrafo descrevendo o objetivo da tela.' },
    funcionalidades:  { type: 'array', items: { type: 'string' }, description: 'Lista de funcionalidades disponíveis na tela, uma por item.' },
    integracoes:      { type: 'string', description: 'Parágrafo descrevendo integrações com outros módulos do sistema.' },
  },
}

export const SCHEMA_ATA_TREINAMENTO = {
  type: 'object',
  required: ['introducao', 'escopo', 'processos'],
  properties: {
    introducao: { type: 'string', description: 'Parágrafo de introdução explicando o propósito de registrar o treinamento do módulo.' },
    escopo:     { type: 'array', items: { type: 'string' }, description: 'Lista dos processos abordados no treinamento, um por item.' },
    processos: {
      type: 'array',
      description: 'Detalhamento de cada processo abordado, na ordem do escopo.',
      items: {
        type: 'object',
        required: ['titulo', 'descricao'],
        properties: {
          titulo:      { type: 'string', description: 'Título curto do processo.' },
          descricao:   { type: 'string', description: 'Parágrafo curto descrevendo o que o processo faz.' },
          aplicacoes:  { type: 'array', items: { type: 'string' }, description: 'Bullets de aplicações do processo (opcional).' },
          importancia: { type: 'array', items: { type: 'string' }, description: 'Bullets de importância do processo (opcional, alternativa a aplicacoes).' },
          beneficios:  { type: 'array', items: { type: 'string' }, description: 'Bullets de benefícios do processo (opcional).' },
        },
      },
    },
  },
}

// Campo opcional acrescentado a QUALQUER schema quando o usuario mandou
// imagens que devem sair no PDF: a IA gera uma legenda curta pra cada,
// olhando a imagem + o texto ao redor. `legendas` sai na MESMA ordem das
// imagens enviadas.
export const CAMPO_LEGENDAS_IMAGENS = {
  legendas: {
    type: 'array',
    items: { type: 'string' },
    description: 'Uma legenda curta (5 a 12 palavras) para cada imagem enviada, na mesma ordem em que foram apresentadas. Descreva o que a tela/print mostra, em tom tecnico. Mesma quantidade de itens que imagens.',
  },
}

export const SCHEMAS_POR_LAYOUT = {
  analise_aderencia: SCHEMA_ANALISE_ADERENCIA,
  ata_treinamento: SCHEMA_ATA_TREINAMENTO,
}

// Devolve uma copia do schema do layout com o campo `legendas` acrescido
// quando `qtdImagensPdf > 0`.
export function schemaComLegendas(layout, qtdImagensPdf) {
  const base = SCHEMAS_POR_LAYOUT[layout]
  if (!base || !qtdImagensPdf) return base
  return {
    ...base,
    properties: { ...base.properties, ...CAMPO_LEGENDAS_IMAGENS },
  }
}
