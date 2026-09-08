import SeletorBusca from './SeletorBusca'

// Lupa unica de busca de Entidade — substitui os buscarClientes locais de
// Viagens, Documentos, Agenda e serve pra qualquer campo que referencie
// entidade_001 (cliente, fornecedor, transportadora, vendedor...).
//
// props:
//   label, disabled, height
//   value        { id, nome } (ou string com o nome) — o que esta selecionado
//   onSelect(reg) reg = { id, codigo, nome, apelido, cnpj, cidade, uf }
//   onClear()
//   papel        opcional: filtra ('cliente' | 'fornecedor' | 'transportadora' | ...)
//   placeholder
const CAMPOS = [
  { nome_campo: 'nome',    label: 'Nome / Razão Social' },
  { nome_campo: 'apelido', label: 'Apelido' },
  { nome_campo: 'cnpj',    label: 'CPF / CNPJ' },
]

export default function SeletorEntidade({
  label, value, onSelect, onClear, papel, disabled, height,
  placeholder = 'Nenhuma',
}) {
  const valorExibido = typeof value === 'string' ? value : (value?.nome || '')

  return (
    <SeletorBusca
      label={label}
      placeholder={placeholder}
      valorExibido={valorExibido}
      disabled={disabled}
      height={height}
      onLimpar={onClear}
      titulo="Pesquisa Padrão · entidade_001"
      campos={CAMPOS}
      colunasExibidas={CAMPOS}
      campoInicial="nome"
      onBuscar={async (campo, modo, busca) => {
        const res = await window.api.entidade.buscarLookup({ busca, modo, papel })
        if (!res.ok) throw new Error(res.erro || 'Falha na busca.')
        return { registros: res.data.registros, total: res.data.total }
      }}
      onSelecionar={onSelect}
      renderCelula={(r, c) => {
        if (c.nome_campo === 'nome') return `${r.nome}${r.cidade ? `  (${r.cidade}${r.uf ? '-' + r.uf : ''})` : ''}`
        return String(r[c.nome_campo] ?? '')
      }}
    />
  )
}
