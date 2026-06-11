export function arredondar(valor, casas = 2) {
  return Number(Math.round(Number(valor + 'e' + casas)) + 'e-' + casas)
}

export function porcentagem(parte, total) {
  if (!total) return 0
  return arredondar((Number(parte) / Number(total)) * 100, 2)
}

export function aplicarPorcentagem(valor, pct) {
  return arredondar(Number(valor) * (Number(pct) / 100), 2)
}

export function desconto(preco, pct) {
  return arredondar(Number(preco) * (1 - Number(pct) / 100), 2)
}

export function acrescimo(preco, pct) {
  return arredondar(Number(preco) * (1 + Number(pct) / 100), 2)
}

export function clamp(valor, min, max) {
  return Math.min(Math.max(Number(valor), Number(min)), Number(max))
}

export function aleatorio(min = 0, max = 100) {
  return Math.floor(Math.random() * (Number(max) - Number(min) + 1)) + Number(min)
}

export function aleatorioDecimal(min = 0, max = 1) {
  return arredondar(Math.random() * (Number(max) - Number(min)) + Number(min), 4)
}

export function mediaArray(valores) {
  const arr = Array.isArray(valores) ? valores : String(valores).split(',').map(Number)
  return arredondar(arr.reduce((a, b) => a + Number(b), 0) / arr.length, 4)
}

export function fibonacci(n) {
  if (n <= 0) return 0; if (n === 1) return 1
  let a = 0, b = 1
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b]
  return b
}

export function fatorial(n) {
  if (n < 0) return null; if (n <= 1) return 1
  let r = 1; for (let i = 2; i <= n; i++) r *= i; return r
}

export function mdc(a, b) {
  a = Math.abs(a); b = Math.abs(b)
  while (b) { [a, b] = [b, a % b] }
  return a
}

export function mmc(a, b) {
  return Math.abs(a * b) / mdc(a, b)
}

export function ehPrimo(n) {
  if (n < 2) return false
  for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false
  return true
}

export function converterUnidade(valor, de, para) {
  const conv = {
    km_m: 1000, m_km: 0.001,
    kg_g: 1000, g_kg: 0.001,
    km_mi: 0.621371, mi_km: 1.60934,
    l_ml: 1000, ml_l: 0.001,
    c_f: v => v * 9/5 + 32, f_c: v => (v - 32) * 5/9,
  }
  const chave = `${de}_${para}`
  const fn = conv[chave]
  if (!fn) return null
  return typeof fn === 'function' ? arredondar(fn(Number(valor)), 4) : arredondar(Number(valor) * fn, 4)
}

export function raiz(valor, indice = 2) {
  return arredondar(Math.pow(Number(valor), 1 / Number(indice)), 6)
}

export function potencia(base, exp) {
  return Math.pow(Number(base), Number(exp))
}

export function logaritmo(valor, base = Math.E) {
  return arredondar(Math.log(Number(valor)) / Math.log(Number(base)), 6)
}

export function formatarNumero(valor, casas = 2, separadorMilhar = '.', separadorDecimal = ',') {
  const partes = Number(valor).toFixed(casas).split('.')
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, separadorMilhar)
  return partes.join(separadorDecimal)
}
