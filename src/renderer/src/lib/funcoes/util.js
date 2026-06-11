export function formatarData(data, formato = 'dd/MM/yyyy') {
  try {
    const d = data instanceof Date ? data : new Date(data)
    if (isNaN(d)) return ''
    const pad = n => String(n).padStart(2, '0')
    const map = {
      dd:   pad(d.getDate()),
      MM:   pad(d.getMonth() + 1),
      yyyy: String(d.getFullYear()),
      yy:   String(d.getFullYear()).slice(-2),
      HH:   pad(d.getHours()),
      mm:   pad(d.getMinutes()),
      ss:   pad(d.getSeconds()),
    }
    return formato.replace(/dd|MM|yyyy|yy|HH|mm|ss/g, m => map[m] ?? m)
  } catch { return '' }
}

export function formatarMoeda(valor) {
  try {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  } catch { return 'R$ 0,00' }
}

export function formatarCPF(cpf) {
  try {
    const s = String(cpf).replace(/\D/g, '').padStart(11, '0')
    return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  } catch { return String(cpf) }
}

export function formatarCNPJ(cnpj) {
  try {
    const s = String(cnpj).replace(/\D/g, '').padStart(14, '0')
    return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  } catch { return String(cnpj) }
}

export function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))
}

export function gerarID() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function debounce(funcao, tempo = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => funcao(...args), tempo)
  }
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
