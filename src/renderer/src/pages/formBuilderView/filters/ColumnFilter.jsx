import FilterTexto from './FilterTexto.jsx'
import FilterNumero from './FilterNumero.jsx'
import FilterData from './FilterData.jsx'
import FilterBooleano from './FilterBooleano.jsx'
import FilterExato from './FilterExato.jsx'
import FilterExatoMulti from '../../../components/filtros/FilterExatoMulti.jsx'
import FilterFlags from './FilterFlags.jsx'
import FilterHasFile from './FilterHasFile.jsx'

// Mesma tabela de grupos usada no backend (opGroupForTipo em
// formBuilderService.js): manter as duas em sincronia ao adicionar um tipo.
const FAMILIA = {
  texto: 'texto', texto_longo: 'texto', email: 'texto', telefone: 'texto', url: 'texto',
  cpf: 'texto', cnpj: 'texto', cep: 'texto', documento: 'texto', login: 'texto',
  codigo_auto: 'texto', cor: 'texto', tags: 'texto',
  numero: 'numero', moeda: 'numero', percentual: 'numero', calculo: 'numero',
  avaliacao: 'numero', progresso: 'numero',
  data: 'data', data_hora: 'data', hora: 'data',
  booleano: 'booleano',
  select: 'exato', radio: 'exato', pasta: 'exato',
  lookup: 'lookup',
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
    case 'exato': {
      // select / radio -> checkboxes multi. pasta (valores distintos) segue
      // no dropdown de 1 valor (pode ser lista longa e livre).
      const opcoes = Array.isArray(campo.opcoes) && campo.opcoes.length
        ? campo.opcoes.map(o => ({ valor: o.valor, label: o.label }))
        : null
      if (opcoes) return <FilterExatoMulti opcoes={opcoes} value={value} onChange={onChange} compacto={opcoes.length > 12} />
      return <FilterExato campo={campo} value={value} onChange={onChange} pastasSugest={pastasSugest} lookupOpcoes={lookupOpcoes} />
    }
    case 'lookup': {
      // opcoes do lookup ja vem pre-carregadas em lookupOpcoes[nome_campo].
      const opcoes = (lookupOpcoes?.[campo.nome_campo] || []).map(o => ({ valor: o.id, label: o.label }))
      return <FilterExatoMulti opcoes={opcoes} value={value} onChange={onChange} compacto={opcoes.length > 12} />
    }
    case 'flags':    return <FilterFlags campo={campo} value={value} onChange={onChange} />
    case 'has_file': return <FilterHasFile value={value} onChange={onChange} />
    default:         return null
  }
}
