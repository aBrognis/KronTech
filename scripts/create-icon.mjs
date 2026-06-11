// Gera resources/icon.ico com o logo do KronTech
import { Resvg } from '@resvg/resvg-js'
import toIco from 'to-ico'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// SVG do ícone KronTech (fundo escuro + KT laranja/branco)
function makeSvg(size) {
  const r  = size * 0.28     // raio do arredondamento
  const cx = size / 2
  const sw = size * 0.065    // espessura do traço
  // K: x de 28% a 50%, T: x de 54% a 78%
  const x0 = size * 0.26, x1 = size * 0.50
  const x2 = size * 0.52, x3 = size * 0.76
  const y0 = size * 0.26, ym = size * 0.50, y1 = size * 0.74

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Fundo -->
  <rect width="${size}" height="${size}" rx="${r}" fill="#111111"/>
  <!-- Borda sutil laranja -->
  <rect width="${size}" height="${size}" rx="${r}" fill="none" stroke="#FF6B2B" stroke-width="${size * 0.018}" opacity="0.5"/>
  <!-- Letra K (branco) -->
  <line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="#F2F2F2" stroke-width="${sw}" stroke-linecap="round"/>
  <line x1="${x0}" y1="${ym}" x2="${x1}" y2="${y0}" stroke="#F2F2F2" stroke-width="${sw}" stroke-linecap="round"/>
  <line x1="${x0}" y1="${ym}" x2="${x1}" y2="${y1}" stroke="#F2F2F2" stroke-width="${sw}" stroke-linecap="round"/>
  <!-- Letra T (laranja) -->
  <line x1="${x2}" y1="${y0}" x2="${x3}" y2="${y0}" stroke="#FF6B2B" stroke-width="${sw}" stroke-linecap="round"/>
  <line x1="${cx + (x3 - x2) * 0.08}" y1="${y0}" x2="${cx + (x3 - x2) * 0.08}" y2="${y1}" stroke="#FF6B2B" stroke-width="${sw}" stroke-linecap="round"/>
</svg>`
}

const sizes  = [16, 32, 48, 64, 128, 256]
const pngs   = []

for (const s of sizes) {
  const svg = makeSvg(s)
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: s }
  })
  pngs.push(resvg.render().asPng())
  console.log(`  ✓ ${s}x${s}`)
}

const icoBuffer = await toIco(pngs)
mkdirSync(resolve(__dirname, '../resources'), { recursive: true })
writeFileSync(resolve(__dirname, '../resources/icon.ico'), icoBuffer)
console.log('\n✅ resources/icon.ico criado com sucesso!')
