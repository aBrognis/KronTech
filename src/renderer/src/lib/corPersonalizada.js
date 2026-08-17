// Deriva variações de uma cor de destaque (hex) para uso em telas que não
// dependem do CSS global (Splash/Login rodam antes do <style id="kron-color-override">
// ser aplicável de forma útil (usam tokens locais, não var(--or)).
export function derivarCor(hex) {
  const h = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : '#D95218'
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  const L = (n, a) => Math.min(255, n + a)
  const D = (n, a) => Math.max(0, n - a)
  const toHex = n => n.toString(16).padStart(2, '0')
  const escurecida = `#${toHex(D(r, 40))}${toHex(D(g, 40))}${toHex(D(b, 40))}`
  const clara      = `#${toHex(L(r, 25))}${toHex(L(g, 25))}${toHex(L(b, 25))}`
  return {
    hex: h, r, g, b,
    rgb: `${r},${g},${b}`,
    escurecida, clara,
  }
}
