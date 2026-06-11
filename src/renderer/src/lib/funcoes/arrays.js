export function agruparPor(lista, campo) {
  return Array.isArray(lista)
    ? lista.reduce((acc, item) => {
        const chave = item[campo] ?? 'Sem valor'
        ;(acc[chave] = acc[chave] || []).push(item)
        return acc
      }, {})
    : {}
}

export function ordenarPor(lista, campo, direcao = 'asc') {
  if (!Array.isArray(lista)) return []
  return [...lista].sort((a, b) => {
    const va = a[campo], vb = b[campo]
    if (va == null) return 1; if (vb == null) return -1
    const r = va < vb ? -1 : va > vb ? 1 : 0
    return direcao === 'desc' ? -r : r
  })
}

export function unico(lista, campo) {
  if (!Array.isArray(lista)) return []
  if (!campo) return [...new Set(lista)]
  const vistos = new Set()
  return lista.filter(item => {
    const k = item[campo]
    if (vistos.has(k)) return false
    vistos.add(k); return true
  })
}

export function somar(lista, campo) {
  if (!Array.isArray(lista)) return 0
  return lista.reduce((acc, item) => acc + Number(campo ? item[campo] : item || 0), 0)
}

export function media(lista, campo) {
  if (!Array.isArray(lista) || lista.length === 0) return 0
  return somar(lista, campo) / lista.length
}

export function maximo(lista, campo) {
  if (!Array.isArray(lista) || lista.length === 0) return null
  return Math.max(...lista.map(i => Number(campo ? i[campo] : i)))
}

export function minimo(lista, campo) {
  if (!Array.isArray(lista) || lista.length === 0) return null
  return Math.min(...lista.map(i => Number(campo ? i[campo] : i)))
}

export function filtrarPor(lista, campo, valor) {
  if (!Array.isArray(lista)) return []
  return lista.filter(item => String(item[campo]).toLowerCase().includes(String(valor).toLowerCase()))
}

export function paginar(lista, pagina = 1, porPagina = 10) {
  if (!Array.isArray(lista)) return { dados: [], total: 0, paginas: 0 }
  const inicio = (pagina - 1) * porPagina
  return {
    dados: lista.slice(inicio, inicio + porPagina),
    total: lista.length,
    paginas: Math.ceil(lista.length / porPagina),
  }
}

export function embaralhar(lista) {
  if (!Array.isArray(lista)) return []
  const arr = [...lista]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function chunks(lista, tamanho) {
  if (!Array.isArray(lista)) return []
  const resultado = []
  for (let i = 0; i < lista.length; i += tamanho) {
    resultado.push(lista.slice(i, i + tamanho))
  }
  return resultado
}

export function aplanar(lista, profundidade = 1) {
  return Array.isArray(lista) ? lista.flat(profundidade) : []
}

export function interseccao(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return []
  return a.filter(v => b.includes(v))
}

export function diferenca(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return []
  return a.filter(v => !b.includes(v))
}

export function uniao(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return []
  return [...new Set([...a, ...b])]
}

export function contarPor(lista, campo) {
  if (!Array.isArray(lista)) return {}
  return lista.reduce((acc, item) => {
    const k = item[campo] ?? 'Sem valor'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
}

export function primeiros(lista, n = 5) {
  return Array.isArray(lista) ? lista.slice(0, n) : []
}

export function ultimos(lista, n = 5) {
  return Array.isArray(lista) ? lista.slice(-n) : []
}

export function sortearUm(lista) {
  if (!Array.isArray(lista) || lista.length === 0) return null
  return lista[Math.floor(Math.random() * lista.length)]
}
