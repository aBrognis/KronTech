import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { getConfig } from '../config.js'

const MESES = [
  '01 - JANEIRO', '02 - FEVEREIRO', '03 - MARÇO', '04 - ABRIL',
  '05 - MAIO', '06 - JUNHO', '07 - JULHO', '08 - AGOSTO',
  '09 - SETEMBRO', '10 - OUTUBRO', '11 - NOVEMBRO', '12 - DEZEMBRO',
]

function sanitizarNomePasta(nome) {
  const limpo = String(nome || '').trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').toUpperCase()
  return limpo || 'SEM CLIENTE'
}

// Cada tela tem sua chave de exportacao em [Caminhos]; se vazia, cai na
// chave `exportacoes` generica (compat com quem ja tinha configurado).
export function resolverBaseExportacao(chave) {
  const cam = getConfig()?.Caminhos || {}
  return (cam[chave] || '').trim() || (cam.exportacoes || '').trim() || null
}

// Monta e garante a pasta <exportacoes>/<ano>/<mes>/<empresa>/, criando os
// diretórios que faltarem. `dataReferencia` é a data do próprio registro
// exportado (ex: data_inicio da viagem), não a data de hoje — organiza pelo
// período do fato, não por quando o usuário exportou.
export function pastaExportacaoAutomatica(empresa, dataReferencia) {
  const base = resolverBaseExportacao('exportacoesViagens')
  if (!base) return null

  const dt = new Date(dataReferencia)
  const valido = !Number.isNaN(dt.getTime())
  const ano = valido ? String(dt.getUTCFullYear()) : String(new Date().getUTCFullYear())
  const mes = valido ? MESES[dt.getUTCMonth()] : MESES[new Date().getUTCMonth()]

  const pasta = join(base, ano, mes, sanitizarNomePasta(empresa))
  if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true })
  return pasta
}

// Monta e garante a pasta <exportacoes>/<cliente>/<tipo>/, criando os
// diretórios que faltarem. Diferente de pastaExportacaoAutomatica (que
// organiza por ano/mês do fato, usado em Viagens): documentos gerados
// ficam agrupados permanentemente por cliente e tipo, sem quebra
// temporal — não faz sentido separar Atas/Análises por mês de geração.
export function pastaExportacaoDocumento(clienteNome, tipoNome) {
  const base = resolverBaseExportacao('exportacoesDocumentos')
  if (!base) return null

  const pasta = join(base, sanitizarNomePasta(clienteNome), sanitizarNomePasta(tipoNome))
  if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true })
  return pasta
}
