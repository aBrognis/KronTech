/**
 * Gera resources/icon.ico usando o SVG real do logo KronTech
 * node scripts/gen-icon.js
 */
const { Resvg } = require('@resvg/resvg-js')
const fs   = require('fs')
const path = require('path')

// SVG fiel ao logo do sistema (sidebar + login)
// Fundo laranja sólido, anéis, disco, letras KT
function makeSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <!-- fundo circular escuro -->
  <circle cx="50" cy="50" r="50" fill="#111111"/>

  <!-- anel externo tracejado -->
  <circle cx="50" cy="50" r="46" fill="none" stroke="#FF6B2B" stroke-width="1.2" stroke-dasharray="2 9" opacity="0.35"/>

  <!-- anel médio -->
  <circle cx="50" cy="50" r="39" fill="none" stroke="#FF6B2B" stroke-width="1.5" stroke-dasharray="4 7" opacity="0.45"/>

  <!-- disco central com preenchimento laranja translúcido -->
  <circle cx="50" cy="50" r="27" fill="#FF6B2B" fill-opacity="0.12" stroke="#FF6B2B" stroke-width="1.5"/>

  <!-- K branco -->
  <line x1="36" y1="35" x2="36" y2="65" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
  <line x1="36" y1="50" x2="48" y2="35" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="36" y1="50" x2="49" y2="65" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- T laranja -->
  <line x1="54" y1="35" x2="68" y2="35" stroke="#FF6B2B" stroke-width="4" stroke-linecap="round"/>
  <line x1="61" y1="35" x2="61" y2="65" stroke="#FF6B2B" stroke-width="4" stroke-linecap="round"/>
</svg>`
}

async function svgToPng(svgStr, size) {
  const resvg = new Resvg(svgStr, {
    fitTo: { mode: 'width', value: size },
    font: { loadSystemFonts: false }
  })
  return Buffer.from(resvg.render().asPng())
}

async function buildIco(sizes) {
  const pngs = []
  for (const s of sizes) {
    const svg = makeSVG(s)
    const buf = await svgToPng(svg, s)
    pngs.push({ size: s, buf })
    console.log(`  ${s}x${s} — ${buf.length} bytes`)
  }

  const count = pngs.length
  const headerSize = 6 + count * 16
  let offset = headerSize

  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(count, 4)

  const entries = []
  for (const p of pngs) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(p.size >= 256 ? 0 : p.size, 0)
    entry.writeUInt8(p.size >= 256 ? 0 : p.size, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(p.buf.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += p.buf.length
  }

  return Buffer.concat([header, ...entries, ...pngs.map(p => p.buf)])
}

async function main() {
  const sizes = [16, 24, 32, 48, 64, 128, 256]
  const resDir = path.join(__dirname, '..', 'resources')

  console.log('Gerando icon.ico...')
  const buf = await buildIco(sizes)
  const outPath = path.join(resDir, 'icon.ico')
  fs.writeFileSync(outPath, buf)
  console.log(`Salvo: ${outPath} (${(buf.length/1024).toFixed(1)} KB)`)

  // light: fundo claro
  console.log('Gerando icon-light.ico...')
  const lightSizes = sizes.map(s => s) // reutiliza mesmos tamanhos
  const pngsLight = []
  for (const s of lightSizes) {
    const svg = makeSVG(s).replace(/#111111/g, '#F0F1F5').replace(/#FFFFFF/g, '#111111')
    const buf2 = await svgToPng(svg, s)
    pngsLight.push({ size: s, buf: buf2 })
  }
  // monta ICO light manualmente
  const count = pngsLight.length
  const headerSize = 6 + count * 16
  let offset = headerSize
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0,0); header.writeUInt16LE(1,2); header.writeUInt16LE(count,4)
  const entries = []
  for (const p of pngsLight) {
    const e = Buffer.alloc(16)
    e.writeUInt8(p.size>=256?0:p.size,0); e.writeUInt8(p.size>=256?0:p.size,1)
    e.writeUInt8(0,2); e.writeUInt8(0,3); e.writeUInt16LE(1,4); e.writeUInt16LE(32,6)
    e.writeUInt32LE(p.buf.length,8); e.writeUInt32LE(offset,12)
    entries.push(e); offset += p.buf.length
  }
  const lightBuf = Buffer.concat([header,...entries,...pngsLight.map(p=>p.buf)])
  const lightPath = path.join(resDir, 'icon-light.ico')
  fs.writeFileSync(lightPath, lightBuf)
  console.log(`Salvo: ${lightPath} (${(lightBuf.length/1024).toFixed(1)} KB)`)
}

main().catch(console.error)
