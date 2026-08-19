import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { safeStorage, app } from 'electron'

const IS_DEV = !app.isPackaged

// Empacotado (produção "portable"): tudo fica ao lado do próprio .exe, em
// C:\KronTech\KronTech_Oficial. Dev roda isolado em C:\KronTech\
// KronTech_Teste, com seu próprio .ini e seu próprio banco (krontech_dev).
const BASE_DIR = IS_DEV ? 'C:\\KronTech\\KronTech_Teste' : dirname(process.execPath)
const INI_PATH = join(BASE_DIR, 'krontech.ini')
const ENC_PFX  = 'ENC:'

// ── Criptografia (Windows DPAPI via safeStorage) ──────────────────────────────
function encryptVal(val) {
  if (!val || !safeStorage.isEncryptionAvailable()) return val
  return ENC_PFX + safeStorage.encryptString(val).toString('base64')
}

function decryptVal(val) {
  if (!val || !val.startsWith(ENC_PFX)) return val
  if (!safeStorage.isEncryptionAvailable()) return val
  try {
    return safeStorage.decryptString(Buffer.from(val.slice(ENC_PFX.length), 'base64'))
  } catch { return val }
}

// Campos sensíveis que devem ser criptografados
const SENSITIVE = { Banco: ['senha'], BancoProducao: ['senha'] }

// ── Valores padrão ────────────────────────────────────────────────────────────
const DEFAULTS = {
  Banco: {
    host:     'localhost',
    port:     '5432',
    database: IS_DEV ? 'krontech_dev' : 'krontech',
    usuario:  'postgres',
    senha:    'postgres',
  },
  Caminhos: {
    arquivos: join(BASE_DIR, 'arquivos'),
    backup:   join(BASE_DIR, 'backup'),
    temp:     join(BASE_DIR, 'temp'),
  },
  Sistema: {
    nome:   'KronTech',
    versao: '1.1.0',
  },
  // Usada só pela feature "Importar Banco" (dev-only, ver
  // src/main/services/importarBanco.js) — credenciais de leitura do banco de
  // produção + caminho da pasta onde fica o krontech.ini de produção (pra
  // trazer também a seção [Personalizacao], que não vem do banco). Não faz
  // sentido em produção: lá não existe "de onde importar".
  ...(IS_DEV ? {
    BancoProducao: {
      host: '', port: '5432', database: '', usuario: '', senha: '', iniPath: '',
    },
  } : {}),
}

// ── Parser INI ────────────────────────────────────────────────────────────────
function parseIni(text) {
  const result = {}
  let section = null
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith(';') || line.startsWith('#')) continue
    const secMatch = line.match(/^\[(.+)\]$/)
    if (secMatch) { section = secMatch[1]; result[section] = result[section] ?? {}; continue }
    const eqIdx = line.indexOf('=')
    if (eqIdx === -1 || !section) continue
    const key = line.slice(0, eqIdx).trim()
    const val = line.slice(eqIdx + 1).trim()
    result[section][key] = val
  }
  return result
}

function stringifyIni(obj) {
  return Object.entries(obj).map(([sec, kvs]) =>
    `[${sec}]\n` + Object.entries(kvs).map(([k, v]) => `${k} = ${v}`).join('\n')
  ).join('\n\n') + '\n'
}

function mergeDefaults(loaded) {
  const result = {}
  for (const [sec, defs] of Object.entries(DEFAULTS)) {
    result[sec] = { ...defs, ...(loaded[sec] ?? {}) }
  }
  for (const sec of Object.keys(loaded)) {
    if (!result[sec]) result[sec] = { ...loaded[sec] }
  }
  return result
}

// ── API pública ───────────────────────────────────────────────────────────────
let _cfg = null

export function loadConfig() {
  if (!existsSync(BASE_DIR)) mkdirSync(BASE_DIR, { recursive: true })

  if (!existsSync(INI_PATH)) {
    _cfg = mergeDefaults({})
    writeFileSync(INI_PATH, stringifyIni(_cfg), 'utf-8')
  } else {
    const raw = readFileSync(INI_PATH, 'utf-8')
    _cfg = mergeDefaults(parseIni(raw))
    writeFileSync(INI_PATH, stringifyIni(_cfg), 'utf-8')
  }

  for (const p of Object.values(_cfg.Caminhos)) {
    if (p && !existsSync(p)) mkdirSync(p, { recursive: true })
  }

  return _cfg
}

// Chamado após app.whenReady() — criptografa senhas em texto puro
export function encryptSensitiveConfig() {
  if (!safeStorage.isEncryptionAvailable()) return
  const cfg = getConfig()
  let changed = false
  for (const [section, keys] of Object.entries(SENSITIVE)) {
    for (const key of keys) {
      const val = cfg[section]?.[key]
      if (val && !val.startsWith(ENC_PFX)) {
        cfg[section][key] = encryptVal(val)
        changed = true
      }
    }
  }
  if (changed) writeFileSync(INI_PATH, stringifyIni(cfg), 'utf-8')
}

// Retorna configuração do banco com a senha já descriptografada — sempre a
// partir do .ini (dev e produção), nunca hardcoded, pra sobreviver a troca
// de senha do Postgres sem precisar mexer em código.
export function getDecryptedBancoConfig() {
  const cfg = getConfig()
  return {
    host:     cfg.Banco.host,
    port:     Number(cfg.Banco.port),
    database: cfg.Banco.database,
    user:     cfg.Banco.usuario,
    password: decryptVal(cfg.Banco.senha),
  }
}

// Configuração do banco de PRODUÇÃO (usada só por "Importar Banco", dev-only)
// — ao contrário de getDecryptedBancoConfig(), nunca hardcoda: sempre vem do
// .ini, porque produção não tem o desvio especial que dev tem.
export function getDecryptedBancoProducaoConfig() {
  const cfg = getConfig()
  const bp = cfg.BancoProducao || {}
  return {
    host:     bp.host || '',
    port:     Number(bp.port) || 5432,
    database: bp.database || '',
    user:     bp.usuario || '',
    password: decryptVal(bp.senha || ''),
    iniPath:  bp.iniPath || '',
  }
}

// Lê só a seção pedida de um arquivo .ini arbitrário (ex.: krontech.ini de
// produção, acessado por caminho de pasta configurado pelo usuário). Reusa o
// mesmo parser do .ini local — nunca duplicar essa lógica.
export function lerSecaoDeArquivoIni(caminhoArquivo, secao) {
  if (!caminhoArquivo || !existsSync(caminhoArquivo)) return null
  const raw = readFileSync(caminhoArquivo, 'utf-8')
  const parsed = parseIni(raw)
  return parsed[secao] || null
}

export function getConfig() {
  if (!_cfg) loadConfig()
  return _cfg
}

export function saveConfig(section, key, value) {
  const cfg = getConfig()
  if (!cfg[section]) cfg[section] = {}
  // Se for campo sensível, criptografa antes de salvar
  const isSensitive = SENSITIVE[section]?.includes(key)
  cfg[section][key] = isSensitive ? encryptVal(String(value)) : String(value)
  writeFileSync(INI_PATH, stringifyIni(cfg), 'utf-8')
}

export function saveSectionConfig(section, kvs) {
  const cfg = getConfig()
  const sensKeys = SENSITIVE[section] ?? []
  const processed = Object.fromEntries(
    Object.entries(kvs).map(([k, v]) => [
      k,
      sensKeys.includes(k) ? encryptVal(String(v)) : String(v),
    ])
  )
  cfg[section] = { ...(cfg[section] ?? {}), ...processed }
  writeFileSync(INI_PATH, stringifyIni(cfg), 'utf-8')
}

// Retorna config legível para o frontend (sem revelar valores ENC:)
export function getConfigForFrontend() {
  const cfg = getConfig()
  const result = JSON.parse(JSON.stringify(cfg))
  for (const [section, keys] of Object.entries(SENSITIVE)) {
    for (const key of keys) {
      if (result[section]?.[key]?.startsWith(ENC_PFX)) {
        result[section][key] = '••••••••'
      }
    }
  }
  return result
}

export { INI_PATH, BASE_DIR, IS_DEV }
