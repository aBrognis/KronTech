export function capitalizar(texto) {
  return String(texto).toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase())
}

export function removerAcentos(texto) {
  return String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function slugify(texto) {
  return removerAcentos(String(texto))
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function truncar(texto, limite = 50, sufixo = '...') {
  const t = String(texto)
  return t.length <= limite ? t : t.slice(0, limite - sufixo.length) + sufixo
}

export function contarPalavras(texto) {
  return String(texto).trim().split(/\s+/).filter(Boolean).length
}

export function inverter(texto) {
  return String(texto).split('').reverse().join('')
}

export function repetir(texto, n = 2) {
  return String(texto).repeat(Number(n))
}

export function removerEspacos(texto) {
  return String(texto).replace(/\s+/g, '')
}

export function contarOcorrencias(texto, busca) {
  if (!busca) return 0
  return String(texto).split(String(busca)).length - 1
}

export function substituir(texto, de, para) {
  return String(texto).split(String(de)).join(String(para))
}

export function extrairNumeros(texto) {
  const nums = String(texto).replace(/\D/g, '')
  return nums === '' ? 0 : Number(nums)
}

export function extrairTexto(texto) {
  return String(texto).replace(/[^a-zA-ZÀ-ÿ\s]/g, '').trim()
}

export function mascararTexto(valor, mascara) {
  const v = String(valor).replace(/\D/g, '')
  let r = '', i = 0
  for (let c of mascara) {
    if (c === '#') { if (i < v.length) r += v[i++]; else break }
    else r += c
  }
  return r
}

export function formatarTelefone(tel) {
  const n = String(tel).replace(/\D/g, '')
  if (n.length === 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
  if (n.length === 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`
  return tel
}

export function formatarCEP(cep) {
  const n = String(cep).replace(/\D/g, '')
  return n.length === 8 ? `${n.slice(0,5)}-${n.slice(5)}` : cep
}

export function iniciais(nomeCompleto, qtd = 2) {
  return String(nomeCompleto)
    .trim().split(/\s+/)
    .slice(0, qtd)
    .map(p => p[0]?.toUpperCase() || '')
    .join('')
}

export function primeiroNome(nomeCompleto) {
  return String(nomeCompleto).trim().split(' ')[0]
}

export function ultimoNome(nomeCompleto) {
  const partes = String(nomeCompleto).trim().split(' ')
  return partes[partes.length - 1]
}

export function isPalindromo(texto) {
  const t = removerAcentos(String(texto)).toLowerCase().replace(/\s/g, '')
  return t === t.split('').reverse().join('')
}

export function gerarSlugUnico(texto) {
  return slugify(texto) + '-' + Math.random().toString(36).slice(2, 6)
}

export function base64Codificar(texto) {
  try { return btoa(unescape(encodeURIComponent(texto))) } catch { return '' }
}

export function base64Decodificar(texto) {
  try { return decodeURIComponent(escape(atob(texto))) } catch { return '' }
}
