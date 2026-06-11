import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const now = new Date()
const pad = n => String(n).padStart(2, '0')
const BUILD_DATE = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()}`
const BUILD_TIME = `${pad(now.getHours())}:${pad(now.getMinutes())}`

let UPDATER_TOKEN = ''
const secretsPath = './src/main/secrets.js'
if (existsSync(secretsPath)) {
  const { createRequire } = await import('module')
  const req = createRequire(import.meta.url)
  UPDATER_TOKEN = req(secretsPath).UPDATER_TOKEN || ''
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      __UPDATER_TOKEN__: JSON.stringify(UPDATER_TOKEN),
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [react()],
    define: {
      __BUILD_DATE__:    JSON.stringify(BUILD_DATE),
      __BUILD_TIME__:    JSON.stringify(BUILD_TIME),
      __APP_VERSION__:   JSON.stringify(pkg.version),
    }
  }
})
