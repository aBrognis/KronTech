import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { getConfig } from '../config.js'

const MESES = [
  '01 - JANEIRO', '02 - FEVEREIRO', '03 - MARÇO', '04 - ABRIL',
  '05 - MAIO', '06 - JUNHO', '07 - JULHO', '08 - AGOSTO',
  '09 - SETEMBRO', '10 - OUTUBRO', '11 - NOVEMBRO', '12 - DEZEMBRO',
]

function sanitizarNomePasta(nome) {
  const limpo = String(nome || '').trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ')
  return limpo || 'Sem Cliente'
}

// Monta e garante a pasta <exportacoes>/<ano>/<mes>/<empresa>/, criando os
// diretórios que faltarem. `dataReferencia` é a data do próprio registro
// exportado (ex: data_inicio da viagem), não a data de hoje — organiza pelo
// período do fato, não por quando o usuário exportou.
export function pastaExportacaoAutomatica(empresa, dataReferencia) {
  const cfg = getConfig()
  const base = cfg?.Caminhos?.exportacoes
  if (!base) return null

  const dt = new Date(dataReferencia)
  const valido = !Number.isNaN(dt.getTime())
  const ano = valido ? String(dt.getUTCFullYear()) : String(new Date().getUTCFullYear())
  const mes = valido ? MESES[dt.getUTCMonth()] : MESES[new Date().getUTCMonth()]

  const pasta = join(base, ano, mes, sanitizarNomePasta(empresa))
  if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true })
  return pasta
}
