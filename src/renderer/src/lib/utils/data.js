// Formatação de data para exibição. Fonte única — não recriar
// `String(x).slice(0,10).split('-')` por tela (quebra quando o valor vem
// como objeto Date, que é como o `pg` devolve colunas date/timestamp: o
// split em '-' não acha nada e sai "undefined/undefined/...").
//
// Aceita: string 'YYYY-MM-DD', ISO com hora, objeto Date, ou epoch ms.
// Sai sempre 'dd/mm/aaaa'. Valor vazio/inválido → o `vazio` informado.

export function fmtDataBR(valor, vazio = '-') {
  if (valor == null || valor === '') return vazio

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return vazio
    return `${pad(valor.getDate())}/${pad(valor.getMonth() + 1)}/${valor.getFullYear()}`
  }

  const s = String(valor)
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`

  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return vazio
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

// dd/mm/aaaa hh:mm — para colunas de auditoria (criado_em/alterado_em).
export function fmtDataHoraBR(valor, vazio = '-') {
  if (valor == null || valor === '') return vazio
  const d = valor instanceof Date ? valor : new Date(valor)
  if (Number.isNaN(d.getTime())) {
    // string 'YYYY-MM-DD' sem hora cai aqui: mostra só a data
    return fmtDataBR(valor, vazio)
  }
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function pad(n) {
  return String(n).padStart(2, '0')
}
