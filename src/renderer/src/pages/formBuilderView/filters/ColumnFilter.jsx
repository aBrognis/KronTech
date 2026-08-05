import FilterTexto from './FilterTexto.jsx'
import FilterNumero from './FilterNumero.jsx'
import FilterData from './FilterData.jsx'
import FilterBooleano from './FilterBooleano.jsx'
import FilterExato from './FilterExato.jsx'
import FilterFlags from './FilterFlags.jsx'
import FilterHasFile from './FilterHasFile.jsx'

// Mesma tabela de grupos usada no backend (opGroupForTipo em
// formBuilderService.js) — manter as duas em sincronia ao adicionar um tipo.
const FAMILIA = {
  texto: 'texto', texto_longo: 'texto', email: 'texto', telefone: 'texto', url: 'texto',
  cpf: 'texto', cnpj: 'texto', cep: 'texto', documento: 'texto', login: 'texto',
  codigo_auto: 'texto', cor: 'texto', tags: 'texto',
  numero: 'numero', moeda: 'numero', percentual: 'numero', calculo: 'numero',
  avaliacao: 'numero', progresso: 'numero',
  data: 'data', data_hora: 'data', hora: 'data',
  booleano: 'booleano',
  select: 'exato', radio: 'exato', pasta: 'exato', lookup: 'exato',
  flags: 'flags',
  arquivo: 'has_file', imagem: 'has_file',
}

// Dispatcher: renderiza o controle de filtro certo para campo.tipo, ou nada
// se o tipo não for filtrável (senha, divisor, botao, copiar, tags*).
// value: filtro atual ({op,valor,valor2}) ou undefined. onChange(filtroOuNull).
export default function ColumnFilter({ campo, value, onChange, pastasSugest, lookupOpcoes }) {
  const familia = FAMILIA[campo.tipo]
  if (!familia) return null

  switch (familia) {
    case 'texto':    return <FilterTexto campo={campo} value={value} onChange={onChange} />
    case 'numero':   return <FilterNumero campo={campo} value={value} onChange={onChange} />
    case 'data':     return <FilterData campo={campo} value={value} onChange={onChange} />
    case 'booleano': return <FilterBooleano value={value} onChange={onChange} />
    case 'exato':    return <FilterExato campo={campo} value={value} onChange={onChange} pastasSugest={pastasSugest} lookupOpcoes={lookupOpcoes} />
    case 'flags':    return <FilterFlags campo={campo} value={value} onChange={onChange} />
    case 'has_file': return <FilterHasFile value={value} onChange={onChange} />
    default:         return null
  }
}
