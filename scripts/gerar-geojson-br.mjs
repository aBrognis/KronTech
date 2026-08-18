// Script de desenvolvimento — roda MANUALMENTE, uma vez (ou quando o IBGE
// atualizar a malha oficial). NÃO faz parte do build/CI nem do bundle do
// app. Baixa a malha de estados + municípios da API oficial do IBGE (v3),
// simplifica a precisão das coordenadas e grava os GeoJSONs finais em
// src/renderer/src/assets/geo/, que aí sim são versionados e embutidos no
// bundle via import estático/dinâmico.
//
// Uso: node scripts/gerar-geojson-br.mjs

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// public/ (não src/assets/) — servido como arquivo estático pelo Vite, sem
// passar pelo bundler. Um import() dinâmico com 27 alvos possíveis (um por
// UF) faz o Vite tentar analisar/bundlar todos os 27 JSONs como módulos,
// o que estoura a heap do processo de build com esse volume de dados.
const OUT_DIR = path.join(__dirname, '..', 'src', 'renderer', 'public', 'geo')
const OUT_MUN_DIR = path.join(OUT_DIR, 'municipios')

const IBGE_BASE = 'https://servicodados.ibge.gov.br/api/v3/malhas'

// UFs do Brasil: sigla + código IBGE de 2 dígitos usado nos endpoints da malha.
const UFS = [
  ['AC','12'], ['AL','27'], ['AP','16'], ['AM','13'], ['BA','29'], ['CE','23'],
  ['DF','53'], ['ES','32'], ['GO','52'], ['MA','21'], ['MT','51'], ['MS','50'],
  ['MG','31'], ['PA','15'], ['PB','25'], ['PR','41'], ['PE','26'], ['PI','22'],
  ['RJ','33'], ['RN','24'], ['RS','43'], ['RO','11'], ['RR','14'], ['SC','42'],
  ['SP','35'], ['SE','28'], ['TO','17'],
]

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`)
  return res.json()
}

// Distância perpendicular de um ponto a uma reta (pra Douglas-Peucker).
function perpDist(pt, a, b) {
  const [x, y] = pt, [x1, y1] = a, [x2, y2] = b
  const dx = x2 - x1, dy = y2 - y1
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(x - x1, y - y1)
  const t = ((x - x1) * dx + (y - y1) * dy) / len2
  const px = x1 + t * dx, py = y1 + t * dy
  return Math.hypot(x - px, y - py)
}

// Douglas-Peucker — reduz o número de pontos mantendo a forma visual do
// polígono. Tolerância em graus (~0.0008 ≈ 90m), suficiente pra exibição em
// tela sem serrilhado perceptível, mas reduz drasticamente o volume de
// pontos vindo da malha oficial do IBGE (que tem precisão de mapeamento
// cadastral, muito acima do necessário pra visualização).
function douglasPeucker(points, tolerance) {
  if (points.length <= 2) return points
  let maxDist = 0, maxIdx = 0
  const first = points[0], last = points[points.length - 1]
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], first, last)
    if (d > maxDist) { maxDist = d; maxIdx = i }
  }
  if (maxDist > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIdx + 1), tolerance)
    const right = douglasPeucker(points.slice(maxIdx), tolerance)
    return left.slice(0, -1).concat(right)
  }
  return [first, last]
}

// Arredonda a 4 casas decimais (~11m de precisão), deduplica pontos
// idênticos, e aplica Douglas-Peucker pra reduzir o volume de pontos ao
// necessário pra exibição em tela (a malha oficial do IBGE vem com
// densidade de mapeamento cadastral, muito além do que um mapa SVG
// renderizado num widget de dashboard precisa).
function lightSimplifyRing(ring, tolerance = 0.0008) {
  const out = []
  let lastKey = null
  for (const [lon, lat] of ring) {
    const rLon = Math.round(lon * 10000) / 10000
    const rLat = Math.round(lat * 10000) / 10000
    const key = rLon + ',' + rLat
    if (key !== lastKey) { out.push([rLon, rLat]); lastKey = key }
  }
  const simplified = douglasPeucker(out, tolerance)
  // Garante fechamento do anel (GeoJSON exige primeiro === último ponto);
  // a simplificação pode ter descartado o ponto de fechamento original.
  if (simplified.length > 2) {
    const [fx, fy] = simplified[0]
    const [lx, ly] = simplified[simplified.length - 1]
    if (fx !== lx || fy !== ly) simplified.push([fx, fy])
  }
  return simplified
}

function ringCentroid(ring) {
  let x = 0, y = 0
  for (const [lon, lat] of ring) { x += lon; y += lat }
  return [x / ring.length, y / ring.length]
}

function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

// Para MultiPolygon: mantém o sub-polígono principal (maior) + qualquer
// outro cujo centroide esteja a até 3° do centroide do principal (ilhas
// costeiras legítimas), descarta o resto (arquipélagos remotos que
// distorceriam o bounding box, ex. Trindade/Martim Vaz do ES).
function filterRemoteOutliers(multiPolygonCoords) {
  if (multiPolygonCoords.length <= 1) return multiPolygonCoords
  const withMeta = multiPolygonCoords.map(poly => {
    const outerRing = poly[0]
    return { poly, centroid: ringCentroid(outerRing), size: outerRing.length }
  })
  const main = withMeta.reduce((a, b) => (b.size > a.size ? b : a))
  return withMeta
    .filter(p => p === main || dist(p.centroid, main.centroid) <= 3)
    .map(p => p.poly)
}

function simplifyGeometry(geometry, tolerance) {
  if (geometry.type === 'Polygon') {
    return { type: 'Polygon', coordinates: geometry.coordinates.map(r => lightSimplifyRing(r, tolerance)) }
  }
  if (geometry.type === 'MultiPolygon') {
    const filtered = filterRemoteOutliers(geometry.coordinates)
    return { type: 'MultiPolygon', coordinates: filtered.map(poly => poly.map(r => lightSimplifyRing(r, tolerance))) }
  }
  return geometry
}

function simplifyFeatureCollection(fc, tolerance, nomesPorCodigo) {
  return {
    type: 'FeatureCollection',
    features: fc.features.map(f => ({
      type: 'Feature',
      properties: {
        codarea: f.properties.codarea,
        ...(nomesPorCodigo ? { nome: nomesPorCodigo.get(f.properties.codarea) || null } : {}),
      },
      geometry: simplifyGeometry(f.geometry, tolerance),
    })),
  }
}

// Tolerância maior pro mapa nacional (visão panorâmica, menos detalhe
// necessário) e menor pros municípios (drill-down, precisa preservar
// traços finos como estreitos entre ilha e continente).
const TOLERANCE_UF = 0.006
const TOLERANCE_MUNICIPIO = 0.0015

async function gerarEstados() {
  console.log('[geo] baixando malha de estados (IBGE v3)…')
  const fc = await fetchJson(`${IBGE_BASE}/paises/BR?formato=application/vnd.geo+json&intrarregiao=UF`)
  const simplified = simplifyFeatureCollection(fc, TOLERANCE_UF)
  await mkdir(OUT_DIR, { recursive: true })
  const outPath = path.join(OUT_DIR, 'brasil-uf.json')
  await writeFile(outPath, JSON.stringify(simplified))
  console.log(`[geo] estados: ${simplified.features.length} UFs -> ${outPath}`)
}

// Malha de município (v3) só traz codarea, sem nome — busca nomes na API de
// localidades (v1), que devolve {id, nome} com id == codarea (7 dígitos).
// Usado pro widget casar o "municipio" digitado no SQL com a feição real.
async function buscarNomesMunicipios(codigo) {
  const lista = await fetchJson(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${codigo}/municipios`)
  return new Map(lista.map(m => [String(m.id), m.nome]))
}

async function gerarMunicipios() {
  await mkdir(OUT_MUN_DIR, { recursive: true })
  for (const [sigla, codigo] of UFS) {
    console.log(`[geo] baixando municípios de ${sigla}…`)
    const [fc, nomesPorCodigo] = await Promise.all([
      fetchJson(`${IBGE_BASE}/estados/${codigo}?formato=application/vnd.geo+json&intrarregiao=municipio`),
      buscarNomesMunicipios(codigo),
    ])
    const simplified = simplifyFeatureCollection(fc, TOLERANCE_MUNICIPIO, nomesPorCodigo)
    const outPath = path.join(OUT_MUN_DIR, `${sigla}.json`)
    await writeFile(outPath, JSON.stringify(simplified))
    console.log(`[geo] ${sigla}: ${simplified.features.length} municípios -> ${outPath}`)
    // Evita sobrecarregar a API pública do IBGE com 27 chamadas em sequência rápida.
    await new Promise(r => setTimeout(r, 400))
  }
}

async function main() {
  const soMunicipios = process.argv.includes('--so-municipios')
  if (!soMunicipios) await gerarEstados()
  await gerarMunicipios()
  console.log('[geo] concluído.')
}

main().catch(err => { console.error('[geo] falhou:', err); process.exit(1) })
