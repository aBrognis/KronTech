#!/usr/bin/env node
// Sincroniza src/ e migrations/ do projeto para C:\devcache\KronTech.
//
// Por que existe: o app roda a partir de C:\devcache\KronTech (o out/ do
// projeto e um symlink para la, e o Node resolve require() a partir desse
// caminho). O `electron-vite dev` recompila do projeto, mas o codigo-fonte
// copiado (src/, migrations/) precisa estar atualizado no devcache para o
// build empacotado e para as migrations que rodam no boot.
//
// Rodado automaticamente por `postbuild` no package.json. Se o devcache nao
// existir, nao faz nada (dev em outra maquina).

const { existsSync, cpSync, mkdirSync } = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DEVCACHE = 'C:\\devcache\\KronTech'

if (!existsSync(DEVCACHE)) {
  console.log('[sync-devcache] C:\\devcache\\KronTech nao existe, pulando.')
  process.exit(0)
}

const alvos = ['src', 'migrations']
for (const dir of alvos) {
  const from = path.join(ROOT, dir)
  const to = path.join(DEVCACHE, dir)
  if (!existsSync(from)) continue
  mkdirSync(to, { recursive: true })
  cpSync(from, to, { recursive: true, force: true })
  console.log(`[sync-devcache] ${dir}/ sincronizado`)
}

// package.json tambem, para o main resolver a versao/config certa
const pkgFrom = path.join(ROOT, 'package.json')
const pkgTo = path.join(DEVCACHE, 'package.json')
if (existsSync(pkgFrom)) {
  cpSync(pkgFrom, pkgTo, { force: true })
  console.log('[sync-devcache] package.json sincronizado')
}
