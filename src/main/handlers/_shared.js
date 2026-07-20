import { app } from 'electron'
import { appendFileSync, readdirSync } from 'fs'
import { join } from 'path'
import bcrypt from 'bcrypt'
import { query } from '../db'

// ── Envelope padrão {ok:true,data}/{ok:false,erro} ──────────────────────────
export function wrap(fn) {
  return async (...args) => {
    try {
      const data = await fn(...args)
      return data === undefined ? { ok: true } : { ok: true, data }
    } catch (err) {
      return { ok: false, erro: err.message || String(err) }
    }
  }
}

// ── Log de depuração de importação em massa ──────────────────────────────────
export function importLog(msg) {
  try {
    const logPath = join(app.getPath('userData'), 'import_debug.log')
    appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`)
  } catch {}
}

// ── Estado compartilhado de cancelamento de importação (arquivos + formBuilder) ──
export const importCancelFlags = new Map()

// ── Categoriza extensão de arquivo para importação em massa ─────────────────
export function categoriaByExt(ext) {
  const map = {
    fr3: 'Relatório',  rpt: 'Relatório',
    pdf: 'Contrato',
    doc: 'Manual',     docx: 'Manual',    odt: 'Manual',
    xls: 'Financeiro', xlsx: 'Financeiro', csv: 'Financeiro',
    jpg: 'Imagem',     jpeg: 'Imagem',     png: 'Imagem',
    gif: 'Imagem',     bmp: 'Imagem',      webp: 'Imagem',
    sql: 'Script',     pas: 'Script',      dpr: 'Script',
    txt: 'Script',     ini: 'Script',
    ppt: 'Apresentação', pptx: 'Apresentação',
  }
  return map[ext.toLowerCase()] || 'Outro'
}

// ── Varre uma pasta recursivamente e retorna todos os arquivos ──────────────
export function scanDir(rootDir) {
  const files = []
  const queue = [rootDir]
  while (queue.length) {
    const dir = queue.pop()
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue
        const full = join(dir, entry.name)
        try {
          if (entry.isDirectory()) queue.push(full)
          else if (entry.isFile()) files.push(full)
        } catch {}
      }
    } catch {}
  }
  return files
}

// ── Hash automático de campos do tipo "senha" antes de gravar ───────────────
export async function hashCamposSenha(nomeTabela, dados) {
  if (!dados || typeof dados !== 'object') return dados
  try {
    const camposSenha = await query(
      `SELECT tc.nome_campo FROM kr_tela_campos tc
       JOIN kr_telas t ON t.id = tc.tela_id
       WHERE t.nome_tabela = $1 AND tc.tipo = 'senha' AND tc.ativo = TRUE`,
      [nomeTabela]
    )
    if (!camposSenha?.length) return dados
    const resultado = { ...dados }
    for (const { nome_campo } of camposSenha) {
      const val = resultado[nome_campo]
      if (!val || val === '***' || val === '') {
        delete resultado[nome_campo]
      } else if (typeof val === 'string' && !val.startsWith('$2b$')) {
        resultado[nome_campo] = await bcrypt.hash(val, 10)
      }
    }
    return resultado
  } catch { return dados }
}
