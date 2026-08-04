export function validarCPF(cpf) {
  const d = cpf.replace(/\D/g,'')
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  let s = 0
  for (let i = 0; i < 9; i++) s += Number(d[i]) * (10 - i)
  let r = (s * 10) % 11; if (r >= 10) r = 0
  if (r !== Number(d[9])) return false
  s = 0
  for (let i = 0; i < 10; i++) s += Number(d[i]) * (11 - i)
  r = (s * 10) % 11; if (r >= 10) r = 0
  return r === Number(d[10])
}
export function validarCNPJ(cnpj) {
  const d = cnpj.replace(/\D/g,'')
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false
  const calc = (l) => {
    let s = 0, p = l - 7
    for (let i = 0; i < l; i++) { s += Number(d[i]) * p--; if (p < 2) p = 9 }
    const r = s % 11
    return r < 2 ? 0 : 11 - r
  }
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13])
}
