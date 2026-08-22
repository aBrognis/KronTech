export const NIVEL_META = {
  'Fraca':       { classe: 'badge-orange' },
  'Média':       { classe: 'badge-yellow' },
  'Forte':       { classe: 'badge-green'  },
  'Muito forte': { classe: 'badge-green'  },
}

export const TIPOS_CREDENCIAL = [
  { valor: 'login_senha', label: 'Login e Senha' },
  { valor: 'nota_segura', label: 'Nota Segura' },
  { valor: 'api_token',   label: 'Chave de API / Token' },
]

export const EMPTY_FORM = {
  id: null, codigo: '', sistema: '', categoria: '',
  url: '', usuario: '', senha: '', nivel_seguranca: '', dt_validade: '',
  observacoes: '', tags: '', favorito: false,
  tipo_credencial: 'login_senha', nota_segura: '', totp_secret: '',
}

export function fmtDataBR(iso) {
  if (!iso) return ''
  const [ano, mes, dia] = String(iso).slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

export function estaVencida(dtValidade) {
  if (!dtValidade) return false
  return String(dtValidade).slice(0, 10) < new Date().toISOString().slice(0, 10)
}
