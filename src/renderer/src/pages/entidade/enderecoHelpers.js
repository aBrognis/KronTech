import { TIPO_ENDERECO } from './utils'

// Tipos de endereco que TODA entidade nova ja nasce com (linhas fixas na
// grade). O usuario preenche o que precisar; os vazios simplesmente ficam
// sem dados. "principal" e o que a busca de CNPJ/CEP preenche.
export const TIPOS_PADRAO = ['principal', 'cobranca', 'entrega', 'fiscal']

export function enderecosIniciais() {
  return TIPOS_PADRAO.map((tipo) => ({
    tipo,
    descricao: TIPO_ENDERECO.find((t) => t.valor === tipo)?.label || '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
    principal: tipo === 'principal',
    ativo: true,
  }))
}

// Garante que a lista carregada do banco tenha ao menos os tipos padrao
// (entidades antigas podem nao ter todos).
export function completarTiposPadrao(lista) {
  const atual = Array.isArray(lista) ? [...lista] : []
  for (const tipo of TIPOS_PADRAO) {
    if (!atual.some((e) => e.tipo === tipo)) {
      atual.push({
        tipo,
        descricao: TIPO_ENDERECO.find((t) => t.valor === tipo)?.label || '',
        cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
        principal: tipo === 'principal' && !atual.some((e) => e.principal),
        ativo: true,
      })
    }
  }
  return atual
}

// Aplica os dados de endereco (vindos do CNPJ / CEP) em TODAS as linhas da
// grade. O usuario faz a manutencao individual das que forem diferentes.
export function aplicarCepNoPrincipal(lista, dados) {
  const arr = completarTiposPadrao(lista)
  return arr.map((e) => ({
    ...e,
    cep: dados.cep || e.cep || '',
    logradouro: dados.logradouro || '',
    numero: dados.numero || '',
    complemento: dados.complemento || '',
    bairro: dados.bairro || '',
    cidade: dados.cidade || '',
    uf: dados.uf || '',
  }))
}
