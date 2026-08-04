// Máscaras puras de CPF/CNPJ/CEP. As variantes *Str existem separadamente
// porque são usadas em carregarForm (formatação ao carregar do banco, aceita
// até 3 dígitos finais de CEP incompletos); as demais são usadas nos inputs
// controlados (formatação enquanto o usuário digita).
export function maskCNPJStr(v) {
  return v.replace(/\D/g,'').slice(0,14)
    .replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2')
}
export function maskCPFStr(v) {
  return v.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d{1,2})$/,'$1-$2')
}
export function maskCEPStr(v) {
  return v.replace(/\D/g,'').slice(0,8).replace(/(\d{5})(\d{1,3})$/,'$1-$2')
}

export function maskCPF(v) {
  return v.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d{1,2})$/,'$1-$2')
}
export function maskCNPJ(v) {
  return v.replace(/\D/g,'').slice(0,14)
    .replace(/(\d{2})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1/$2')
    .replace(/(\d{4})(\d{1,2})$/,'$1-$2')
}
export function maskCEP(v) {
  return v.replace(/\D/g,'').slice(0,8).replace(/(\d{5})(\d)/,'$1-$2')
}
