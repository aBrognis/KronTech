export const STATUS_META = {
  rascunho:    { label: 'Rascunho',     classe: 'badge-orange' },
  nao_enviado: { label: 'Não Enviado',  classe: 'badge-yellow' },
  enviado:     { label: 'Enviado',      classe: 'badge-blue'   },
  reembolsado: { label: 'Reembolsado',  classe: 'badge-purple' },
}

export const STATUS_ORDEM = ['rascunho', 'nao_enviado', 'enviado', 'reembolsado']

export function diaDaSemana(dataISO) {
  if (!dataISO) return ''
  const d = new Date(dataISO + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return ''
  const nome = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(d)
  return nome.charAt(0).toUpperCase() + nome.slice(1)
}

export function fmtMoeda(valor) {
  return (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function fmtDataBR(dataISO) {
  if (!dataISO) return ''
  const [ano, mes, dia] = String(dataISO).slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

export function novoItem() {
  return {
    _key: Math.random().toString(36).slice(2),
    data: '', descricao: '', fornecedor: '', qtde: 1, valor_unitario: 0,
    arquivo_path: null, arquivo_nome: null, arquivo_ext: null,
  }
}

export const EMPTY_FORM = {
  codigo: '',
  consultor_id: null, consultor_nome: '',
  cliente_id: '', cliente_nome: '',
  data_inicio: '', data_fim: '',
  local_partida: '', local_destino: '', meio_transporte: '',
  observacoes: '',
  itens: [],
}

export const MEIOS_TRANSPORTE = ['Carro próprio', 'Carro da empresa', 'Ônibus', 'Avião', 'Outro']
