export function hexParaRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex))
  return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null
}

export function rgbParaHex(r, g, b) {
  return '#' + [r, g, b].map(v => Number(v).toString(16).padStart(2, '0')).join('')
}

export function clarear(hex, pct = 10) {
  const rgb = hexParaRgb(hex)
  if (!rgb) return hex
  const f = Number(pct) / 100
  return rgbParaHex(
    Math.min(255, Math.round(rgb.r + (255 - rgb.r) * f)),
    Math.min(255, Math.round(rgb.g + (255 - rgb.g) * f)),
    Math.min(255, Math.round(rgb.b + (255 - rgb.b) * f)),
  )
}

export function escurecer(hex, pct = 10) {
  const rgb = hexParaRgb(hex)
  if (!rgb) return hex
  const f = 1 - Number(pct) / 100
  return rgbParaHex(
    Math.round(rgb.r * f),
    Math.round(rgb.g * f),
    Math.round(rgb.b * f),
  )
}

export function corContrastante(hex) {
  const rgb = hexParaRgb(hex)
  if (!rgb) return '#000000'
  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return lum > 0.5 ? '#000000' : '#ffffff'
}

export function hexParaRgbString(hex, alpha = 1) {
  const rgb = hexParaRgb(hex)
  return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : hex
}

export function misturarCores(hex1, hex2, peso = 0.5) {
  const a = hexParaRgb(hex1), b = hexParaRgb(hex2)
  if (!a || !b) return hex1
  const p = Number(peso)
  return rgbParaHex(
    Math.round(a.r * (1-p) + b.r * p),
    Math.round(a.g * (1-p) + b.g * p),
    Math.round(a.b * (1-p) + b.b * p),
  )
}

export function gerarPaleta(hexBase, quantidade = 5) {
  const passos = quantidade - 1
  return Array.from({ length: quantidade }, (_, i) =>
    i < passos / 2 ? clarear(hexBase, (passos/2 - i) * (80/passos)) :
    i > passos / 2 ? escurecer(hexBase, (i - passos/2) * (60/passos)) :
    hexBase
  )
}

export function corAleatoria() {
  return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')
}

export function hexValido(hex) {
  return /^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(String(hex))
}
