#!/usr/bin/env node
// Remove ELECTRON_RUN_AS_NODE before spawning electron-vite.
// Necessário porque o ambiente do Claude Code define essa variável,
// o que faz o Electron rodar como Node.js e quebra o require('electron').
delete process.env.ELECTRON_RUN_AS_NODE

const { spawn } = require('child_process')
const path = require('path')
const eviteBin = path.resolve(__dirname, '../node_modules/electron-vite/bin/electron-vite.js')

const proc = spawn(process.execPath, [eviteBin, 'dev'], {
  stdio: 'inherit',
  env: process.env
})

proc.on('close', code => process.exit(code ?? 0))
