// Sanitização de identificadores SQL (nomes de tabela/coluna) compartilhada
// entre formBuilderService, agenda e pesquisa — nunca interpolar nome_tabela
// ou nome_campo vindos do renderer sem passar por aqui.

export function assertIdent(nome) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(nome)) {
    throw new Error(`Identificador inválido: ${nome}`)
  }
  return nome
}

export function tbl(nome) { return '"' + assertIdent(nome) + '"' }
export function col(nome) { return '"' + assertIdent(nome) + '"' }
