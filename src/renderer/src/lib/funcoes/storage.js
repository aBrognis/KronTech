export function salvarLocal(chave, valor) {
  try {
    localStorage.setItem(`kron_${chave}`, JSON.stringify(valor))
    return true
  } catch { return false }
}

export function lerLocal(chave, fallback = null) {
  try {
    const v = localStorage.getItem(`kron_${chave}`)
    return v !== null ? JSON.parse(v) : fallback
  } catch { return fallback }
}

export function removerLocal(chave) {
  try { localStorage.removeItem(`kron_${chave}`); return true } catch { return false }
}

export function limparLocal() {
  try {
    Object.keys(localStorage).filter(k => k.startsWith('kron_')).forEach(k => localStorage.removeItem(k))
    return true
  } catch { return false }
}

export function listarLocal() {
  try {
    return Object.keys(localStorage)
      .filter(k => k.startsWith('kron_'))
      .map(k => ({ chave: k.replace('kron_', ''), valor: JSON.parse(localStorage.getItem(k)) }))
  } catch { return [] }
}

export function incrementarLocal(chave, por = 1) {
  const atual = lerLocal(chave, 0)
  const novo = Number(atual) + Number(por)
  salvarLocal(chave, novo)
  return novo
}

export function salvarLocalComExpiracao(chave, valor, ttlMs) {
  return salvarLocal(chave, { valor, expira: Date.now() + ttlMs })
}

export function lerLocalComExpiracao(chave, fallback = null) {
  const item = lerLocal(chave, null)
  if (!item || !item.expira) return fallback
  if (Date.now() > item.expira) { removerLocal(chave); return fallback }
  return item.valor
}

export function salvarSessao(chave, valor) {
  try { sessionStorage.setItem(`kron_${chave}`, JSON.stringify(valor)); return true } catch { return false }
}

export function lerSessao(chave, fallback = null) {
  try {
    const v = sessionStorage.getItem(`kron_${chave}`)
    return v !== null ? JSON.parse(v) : fallback
  } catch { return fallback }
}
