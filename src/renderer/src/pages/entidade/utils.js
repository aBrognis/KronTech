// endereco padrao — replicado aqui pra o EMPTY_FORM (enderecoHelpers importa
// TIPO_ENDERECO daqui, entao nao pode importar de la sem ciclo).
const _ENDERECOS_INICIAIS = ['principal', 'cobranca', 'entrega', 'fiscal'].map((tipo) => ({
  tipo,
  descricao: { principal: 'Principal', cobranca: 'Cobrança', entrega: 'Entrega', fiscal: 'Fiscal' }[tipo],
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
  principal: tipo === 'principal', ativo: true,
}))

export const EMPTY_FORM = {
  id: null, codigo: '',
  nome: '', apelido: '', tipo_pessoa: 'pj', status: 'ativo',
  cnpj: '', inscricao_estadual: '', inscricao_municipal: '', ie_rg: '',
  papeis: [], // array no form; string separada por vírgula no banco
  telefone: '', celular: '', email: '', site: '',
  // endereco legado em entidade_001 (mantido por compat; a UI usa a grade `enderecos`)
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
  data_nascimento: '', data_fundacao: '',
  porte: '', situacao_cadastral: '', cnae: '',
  natureza_juridica_id: '',
  regime_tributario: '', contribuinte_icms: false, optante_simples: false,
  retem_iss: false, retem_irrf: false, retem_csll: false, retem_pis: false, retem_cofins: false,
  condicao_pagamento_id: '', limite_credito: 0, dia_vencimento: '',
  banco_id: '', agencia: '', conta_corrente: '', pix_tipo: '', pix_chave: '',
  foto: '', tags: '', observacoes: '',
  // CRM
  origem: '', segmento: '', grupo_economico: '', data_primeiro_contato: '',
  // aninhados
  contatos: [],
  meios: [],
  enderecos: _ENDERECOS_INICIAIS.map((e) => ({ ...e })),
  anexos: [],
  vinculos: [],
  documentos: [],
  comercial: {},
  credito: {},
  creditoHist: [],
  interacoes: [],
  log: [],
}

export const TIPO_ENDERECO = [
  { valor: 'principal', label: 'Principal' },
  { valor: 'cobranca', label: 'Cobrança' },
  { valor: 'entrega', label: 'Entrega' },
  { valor: 'fiscal', label: 'Fiscal' },
  { valor: 'filial', label: 'Filial' },
  { valor: 'obra', label: 'Obra' },
]
export const TIPO_MEIO = [
  { valor: 'telefone', label: 'Telefone' },
  { valor: 'celular', label: 'Celular' },
  { valor: 'whatsapp', label: 'WhatsApp' },
  { valor: 'email', label: 'E-mail' },
  { valor: 'fax', label: 'Fax' },
]
export const FRETE = [
  { valor: '', label: '(não definido)' },
  { valor: 'cif', label: 'CIF (remetente paga)' },
  { valor: 'fob', label: 'FOB (destinatário paga)' },
  { valor: 'terceiros', label: 'Por conta de terceiros' },
  { valor: 'sem_frete', label: 'Sem frete' },
]
export const SCORE_RISCO = [
  { valor: '', label: '(não avaliado)' },
  { valor: 'A', label: 'A — baixíssimo risco' },
  { valor: 'B', label: 'B — baixo risco' },
  { valor: 'C', label: 'C — risco médio' },
  { valor: 'D', label: 'D — alto risco' },
  { valor: 'E', label: 'E — risco crítico' },
]
export const STATUS_CREDITO = [
  { valor: 'analise', label: 'Em análise', classe: 'badge-yellow' },
  { valor: 'liberado', label: 'Liberado', classe: 'badge-green' },
  { valor: 'bloqueado', label: 'Bloqueado', classe: 'badge-orange' },
  { valor: 'suspenso', label: 'Suspenso', classe: 'badge-purple' },
]
export const TIPO_INTERACAO = [
  { valor: 'ligacao', label: 'Ligação' },
  { valor: 'email', label: 'E-mail' },
  { valor: 'visita', label: 'Visita' },
  { valor: 'reuniao', label: 'Reunião' },
  { valor: 'whatsapp', label: 'WhatsApp' },
  { valor: 'nota', label: 'Nota' },
]
export const RESULTADO_INTERACAO = [
  { valor: '', label: '—' },
  { valor: 'positivo', label: 'Positivo' },
  { valor: 'neutro', label: 'Neutro' },
  { valor: 'negativo', label: 'Negativo' },
  { valor: 'sem_retorno', label: 'Sem retorno' },
]
export const TIPO_VINCULO = [
  { valor: 'matriz', label: 'Matriz' },
  { valor: 'filial', label: 'Filial' },
  { valor: 'controladora', label: 'Controladora' },
  { valor: 'grupo_economico', label: 'Mesmo grupo econômico' },
  { valor: 'representante', label: 'Representante' },
  { valor: 'transportadora_padrao', label: 'Transportadora padrão' },
  { valor: 'contato_pf', label: 'Sócio / responsável (PF)' },
]
export const TIPO_DOCUMENTO = [
  { valor: 'ie', label: 'Inscrição Estadual' },
  { valor: 'contrato_social', label: 'Contrato social' },
  { valor: 'cartao_cnpj', label: 'Cartão CNPJ' },
  { valor: 'certidao_federal', label: 'Certidão Federal' },
  { valor: 'certidao_estadual', label: 'Certidão Estadual' },
  { valor: 'certidao_fgts', label: 'Certidão FGTS' },
  { valor: 'alvara', label: 'Alvará' },
  { valor: 'contrato_comercial', label: 'Contrato comercial' },
  { valor: 'outro', label: 'Outro' },
]

export const TIPOS_PESSOA = [
  { valor: 'pj', label: 'Pessoa Jurídica' },
  { valor: 'pf', label: 'Pessoa Física' },
]
export const STATUS = [
  { valor: 'ativo', label: 'Ativo', classe: 'badge-green' },
  { valor: 'inativo', label: 'Inativo', classe: 'badge-yellow' },
  { valor: 'bloqueado', label: 'Bloqueado', classe: 'badge-orange' },
]
export const PAPEIS = [
  { valor: 'cliente', label: 'Cliente' },
  { valor: 'fornecedor', label: 'Fornecedor' },
  { valor: 'transportadora', label: 'Transportadora' },
  { valor: 'funcionario', label: 'Funcionário' },
  { valor: 'representante', label: 'Representante' },
]
export const REGIMES = [
  { valor: '', label: '(não definido)' },
  { valor: 'mei', label: 'MEI' },
  { valor: 'simples', label: 'Simples Nacional' },
  { valor: 'presumido', label: 'Lucro Presumido' },
  { valor: 'real', label: 'Lucro Real' },
]
export const PIX_TIPOS = [
  { valor: '', label: '(nenhum)' },
  { valor: 'cpf_cnpj', label: 'CPF / CNPJ' },
  { valor: 'email', label: 'E-mail' },
  { valor: 'telefone', label: 'Telefone' },
  { valor: 'aleatoria', label: 'Chave aleatória' },
]
export const CATEGORIAS_ANEXO = [
  { valor: 'contrato', label: 'Contrato' },
  { valor: 'contrato_social', label: 'Contrato social' },
  { valor: 'cartao_cnpj', label: 'Cartão CNPJ' },
  { valor: 'procuracao', label: 'Procuração' },
  { valor: 'outro', label: 'Outro' },
]

export const statusMeta = (s) => STATUS.find((x) => x.valor === s) || STATUS[0]
export const papelLabel = (p) => PAPEIS.find((x) => x.valor === p)?.label || p

// papeis: banco guarda "cliente,fornecedor"; form usa array.
// Blinda contra lixo legado ("CFP", "CLIENTE", "cliente,cliente"):
//  - expande letras coladas em MAIUSCULA (C/F/T/P/R) para o codigo completo
//  - normaliza cada token para minusculo
//  - descarta o que nao for um papel valido de PAPEIS
//  - deduplica
const _MAPA_LETRA_PAPEL = { c: 'cliente', f: 'fornecedor', t: 'transportadora', p: 'representante', r: 'representante' }
export const papeisParaArray = (s) => {
  const validos = new Set(PAPEIS.map((p) => p.valor))
  const out = []
  for (const tokenRaw of String(s || '').split(',')) {
    const token = tokenRaw.trim()
    if (!token) continue
    const lower = token.toLowerCase()
    if (validos.has(lower)) { out.push(lower); continue }
    // token de letras coladas do formato antigo (ex: "CFP")
    if (/^[a-z]{1,6}$/i.test(token) && token === token.toUpperCase()) {
      for (const letra of lower) {
        const p = _MAPA_LETRA_PAPEL[letra]
        if (p) out.push(p)
      }
    }
  }
  return [...new Set(out)]
}
export const papeisParaString = (arr) => (Array.isArray(arr) ? [...new Set(arr)].join(',') : '')

// normaliza tipo_pessoa legado ("J"/"C"/"CFP"...) para 'pj'/'pf'
export function normalizarTipoPessoa(v) {
  const s = String(v || '').toLowerCase()
  if (s === 'pf' || s.startsWith('f') || s === 'c') return 'pf'
  return 'pj'
}

export function normalizarStatus(v) {
  const s = String(v || '').toLowerCase()
  if (s === 'inativo' || s === 'bloqueado') return s
  return 'ativo'
}

// Normaliza para 'YYYY-MM-DD' (o que o InputData espera). O pg devolve
// colunas date como objeto Date pelo IPC (structured clone), então
// String(Date).slice não serve.
const dia = (v) => {
  if (!v) return ''
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? '' : v.toISOString().slice(0, 10)
  const s = String(v)
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : ''
}

// entidades antigas podem nao ter os 4 tipos padrao — completa
function completarEnderecos(lista) {
  const atual = Array.isArray(lista) ? [...lista] : []
  for (const base of _ENDERECOS_INICIAIS) {
    if (!atual.some((e) => e.tipo === base.tipo)) atual.push({ ...base, principal: base.tipo === 'principal' && !atual.some((e) => e.principal) })
  }
  return atual
}

export function paraForm(d) {
  return {
    ...EMPTY_FORM, ...d,
    tipo_pessoa: normalizarTipoPessoa(d.tipo_pessoa),
    status: normalizarStatus(d.status),
    papeis: papeisParaArray(d.papeis),
    limite_credito: Number(d.limite_credito) || 0,
    dia_vencimento: d.dia_vencimento ?? '',
    natureza_juridica_id: d.natureza_juridica_id ?? '',
    condicao_pagamento_id: d.condicao_pagamento_id ?? '',
    banco_id: d.banco_id ?? '',
    data_nascimento: dia(d.data_nascimento),
    data_fundacao: dia(d.data_fundacao),
    data_primeiro_contato: dia(d.data_primeiro_contato),
    contatos: Array.isArray(d.contatos) ? d.contatos.map((c) => ({ ...c, data_nascimento: dia(c.data_nascimento) })) : [],
    meios: Array.isArray(d.meios) ? d.meios : [],
    enderecos: completarEnderecos(d.enderecos),
    anexos: Array.isArray(d.anexos) ? d.anexos : [],
    vinculos: Array.isArray(d.vinculos) ? d.vinculos : [],
    documentos: Array.isArray(d.documentos) ? d.documentos.map((x) => ({ ...x, emissao: dia(x.emissao), validade: dia(x.validade) })) : [],
    comercial: d.comercial && typeof d.comercial === 'object' ? {
      ...d.comercial,
      desconto_maximo_perc: d.comercial.desconto_maximo_perc ?? 0,
      pedido_minimo: d.comercial.pedido_minimo ?? 0,
      prazo_entrega_dias: d.comercial.prazo_entrega_dias ?? '',
      vendedor_id: d.comercial.vendedor_id ?? '',
      comprador_id: d.comercial.comprador_id ?? '',
      transportadora_id: d.comercial.transportadora_id ?? '',
    } : {},
    credito: d.credito && typeof d.credito === 'object' ? {
      ...d.credito,
      status_credito: d.credito.status_credito || 'analise',
      score_risco: d.credito.score_risco || '',
      limite_credito: Number(d.credito.limite_credito ?? d.limite_credito ?? 0),
      limite_utilizado: Number(d.credito.limite_utilizado ?? 0),
      atraso_medio_dias: d.credito.atraso_medio_dias ?? 0,
      data_ultima_analise: dia(d.credito.data_ultima_analise),
    } : { status_credito: 'analise', limite_credito: Number(d.limite_credito) || 0 },
    creditoHist: Array.isArray(d.creditoHist) ? d.creditoHist : [],
    interacoes: Array.isArray(d.interacoes) ? d.interacoes : [],
    log: Array.isArray(d.log) ? d.log : [],
  }
}

export function paraPayload(f) {
  const num = (v) => (v === '' || v == null ? null : Number(v))
  return {
    nome: f.nome, apelido: f.apelido, tipo_pessoa: f.tipo_pessoa, status: f.status,
    cnpj: f.cnpj, inscricao_estadual: f.inscricao_estadual, inscricao_municipal: f.inscricao_municipal, ie_rg: f.ie_rg,
    papeis: papeisParaString(f.papeis),
    telefone: f.telefone, celular: f.celular, email: f.email, site: f.site,
    cep: f.cep, logradouro: f.logradouro, numero: f.numero, complemento: f.complemento,
    bairro: f.bairro, cidade: f.cidade, uf: f.uf,
    data_nascimento: f.data_nascimento || null, data_fundacao: f.data_fundacao || null,
    porte: f.porte, situacao_cadastral: f.situacao_cadastral, cnae: f.cnae,
    natureza_juridica_id: num(f.natureza_juridica_id),
    regime_tributario: f.regime_tributario || null,
    contribuinte_icms: f.contribuinte_icms, optante_simples: f.optante_simples,
    retem_iss: f.retem_iss, retem_irrf: f.retem_irrf, retem_csll: f.retem_csll,
    retem_pis: f.retem_pis, retem_cofins: f.retem_cofins,
    condicao_pagamento_id: num(f.condicao_pagamento_id),
    limite_credito: Number(f.limite_credito) || 0,
    dia_vencimento: num(f.dia_vencimento),
    banco_id: num(f.banco_id), agencia: f.agencia, conta_corrente: f.conta_corrente,
    pix_tipo: f.pix_tipo || null, pix_chave: f.pix_chave,
    foto: f.foto, tags: f.tags, observacoes: f.observacoes,
    origem: f.origem, segmento: f.segmento, grupo_economico: f.grupo_economico,
    data_primeiro_contato: f.data_primeiro_contato || null,
    // aninhados
    contatos: f.contatos,
    meios: (f.meios || []).filter((m) => (m.valor || '').trim()),
    enderecos: f.enderecos || [],
    vinculos: (f.vinculos || []).filter((v) => v.entidade_rel_id && v.tipo),
    documentos: (f.documentos || []).filter((d) => d.tipo),
    comercial: {
      ...f.comercial,
      vendedor_id: num(f.comercial?.vendedor_id),
      comprador_id: num(f.comercial?.comprador_id),
      transportadora_id: num(f.comercial?.transportadora_id),
      prazo_entrega_dias: num(f.comercial?.prazo_entrega_dias),
      desconto_maximo_perc: Number(f.comercial?.desconto_maximo_perc) || 0,
      pedido_minimo: Number(f.comercial?.pedido_minimo) || 0,
    },
    credito: {
      ...f.credito,
      analista_id: num(f.credito?.analista_id),
      limite_credito: Number(f.credito?.limite_credito) || 0,
      limite_utilizado: Number(f.credito?.limite_utilizado) || 0,
      atraso_medio_dias: num(f.credito?.atraso_medio_dias),
      data_ultima_analise: f.credito?.data_ultima_analise || null,
    },
  }
}
