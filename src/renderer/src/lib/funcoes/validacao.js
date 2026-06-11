export function validarCPF(cpf) {
  const n = String(cpf).replace(/\D/g, '')
  if (n.length !== 11 || /^(\d)\1+$/.test(n)) return false
  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(n[i]) * (10 - i)
  let d1 = 11 - (soma % 11); if (d1 >= 10) d1 = 0
  if (parseInt(n[9]) !== d1) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(n[i]) * (11 - i)
  let d2 = 11 - (soma % 11); if (d2 >= 10) d2 = 0
  return parseInt(n[10]) === d2
}

export function validarCNPJ(cnpj) {
  const n = String(cnpj).replace(/\D/g, '')
  if (n.length !== 14 || /^(\d)\1+$/.test(n)) return false
  const calc = (s, t) => {
    let soma = 0, pos = t - 7
    for (let i = 0; i < s; i++) {
      soma += parseInt(n[i]) * pos--
      if (pos < 2) pos = 9
    }
    const r = soma % 11 < 2 ? 0 : 11 - (soma % 11)
    return r === parseInt(n[s])
  }
  return calc(12, 5) && calc(13, 6)
}

export function validarTelefone(tel) {
  const n = String(tel).replace(/\D/g, '')
  return n.length === 10 || n.length === 11
}

export function validarCEP(cep) {
  return /^\d{5}-?\d{3}$/.test(String(cep).trim())
}

export function validarURL(url) {
  try { new URL(String(url)); return true } catch { return false }
}

export function validarData(data) {
  const d = new Date(data)
  return !isNaN(d.getTime())
}

export function validarSenha(senha, opcoes = {}) {
  const { minLen = 6, maiuscula = false, numero = false, especial = false } = opcoes
  const s = String(senha)
  if (s.length < minLen) return { ok: false, motivo: `Mínimo ${minLen} caracteres` }
  if (maiuscula && !/[A-Z]/.test(s)) return { ok: false, motivo: 'Precisa de letra maiúscula' }
  if (numero && !/\d/.test(s)) return { ok: false, motivo: 'Precisa de número' }
  if (especial && !/[!@#$%^&*(),.?":{}|<>]/.test(s)) return { ok: false, motivo: 'Precisa de caractere especial' }
  return { ok: true, motivo: null }
}

export function forcaSenha(senha) {
  const s = String(senha)
  let pontos = 0
  if (s.length >= 8) pontos++
  if (s.length >= 12) pontos++
  if (/[A-Z]/.test(s)) pontos++
  if (/[a-z]/.test(s)) pontos++
  if (/\d/.test(s)) pontos++
  if (/[!@#$%^&*]/.test(s)) pontos++
  if (pontos <= 2) return 'Fraca'
  if (pontos <= 4) return 'Média'
  return 'Forte'
}

export function validarCartaoCredito(numero) {
  const n = String(numero).replace(/\s/g, '')
  if (!/^\d{13,19}$/.test(n)) return false
  let soma = 0
  for (let i = n.length - 1; i >= 0; i--) {
    let d = parseInt(n[i])
    if ((n.length - i) % 2 === 0) { d *= 2; if (d > 9) d -= 9 }
    soma += d
  }
  return soma % 10 === 0
}

export function validarPlacaBr(placa) {
  return /^[A-Z]{3}\d[A-Z\d]\d{2}$/i.test(String(placa).replace(/[-\s]/g, ''))
}

export function validarHorario(hora) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(hora))
}

export function isMaiorDeIdade(dataNascimento) {
  const nasc = new Date(dataNascimento)
  const hoje = new Date()
  const diff = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  return diff > 18 || (diff === 18 && (m > 0 || (m === 0 && hoje.getDate() >= nasc.getDate())))
}
