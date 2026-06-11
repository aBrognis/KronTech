#!/usr/bin/env node
delete process.env.ELECTRON_RUN_AS_NODE

const { spawnSync } = require('child_process')
const path = require('path')
const root = path.resolve(__dirname, '..')

const eviteBin = path.resolve(root, 'node_modules/electron-vite/bin/electron-vite.js')

console.log('🔨 Compilando...')
const build = spawnSync(process.execPath, [eviteBin, 'build'], {
  stdio: 'inherit',
  env: process.env,
  cwd: root
})
if (build.status !== 0) process.exit(build.status)

console.log('\n📦 Gerando instalador...')
const builderBin = path.resolve(root, 'node_modules/electron-builder/cli.js')
const pkg = spawnSync(process.execPath, [builderBin, '--win'], {
  stdio: 'inherit',
  env: (() => {
    const e = { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' }
    delete e.WIN_CSC_LINK
    delete e.CSC_LINK
    delete e.CSC_KEY_PASSWORD
    return e
  })(),
  cwd: root
})
if (pkg.status === 0) console.log('\n✅ Instalador gerado em dist/')
process.exit(pkg.status ?? 0)
