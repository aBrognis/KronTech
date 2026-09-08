// fmtDataBR mora em lib/utils/data.js (fonte única). Re-exportado aqui só
// pra não quebrar os imports existentes desta tela.
export { fmtDataBR } from '../../lib/utils/data.js'

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

export function estaVencida(dtValidade) {
  if (!dtValidade) return false
  const iso = dtValidade instanceof Date
    ? dtValidade.toISOString().slice(0, 10)
    : String(dtValidade).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  return iso < new Date().toISOString().slice(0, 10)
}
