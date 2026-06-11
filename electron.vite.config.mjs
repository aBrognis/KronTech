import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const now = new Date()
const pad = n => String(n).padStart(2, '0')
const BUILD_DATE = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()}`
const BUILD_TIME = `${pad(now.getHours())}:${pad(now.getMinutes())}`

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
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
