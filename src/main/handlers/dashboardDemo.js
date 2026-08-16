const VENDEDORES = ['Ana Silva', 'Bruno Costa', 'Carla Mendes', 'Diego Alves', 'Elaine Souza',
  'Fábio Lima', 'Gabriela Rocha', 'Henrique Dias', 'Isabela Nunes', 'João Pereira']
const REGIOES = ['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte']
const CATEGORIAS_PRODUTOS = {
  'Eletrônicos': ['Notebook', 'Smartphone', 'Fone Bluetooth', 'Monitor', 'Tablet'],
  'Vestuário':   ['Camiseta', 'Calça Jeans', 'Jaqueta', 'Tênis', 'Boné'],
  'Alimentos':   ['Café Especial', 'Chocolate Gourmet', 'Azeite', 'Vinho', 'Queijo Artesanal'],
  'Casa':        ['Panela Antiaderente', 'Aspirador', 'Luminária', 'Jogo de Cama', 'Liquidificador'],
  'Beleza':      ['Perfume', 'Kit Skincare', 'Shampoo Profissional', 'Batom', 'Protetor Solar'],
}
const CANAIS = ['Loja Física', 'E-commerce', 'Marketplace', 'Telefone']
const STATUS_FUNIL = ['Prospecção', 'Proposta', 'Negociação', 'Fechado', 'Perdido']
const STATUS_WEIGHTS = [0.30, 0.25, 0.20, 0.18, 0.07]

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function pickKey(obj) { return pick(Object.keys(obj)) }
function round2(n) { return Math.round(n * 100) / 100 }
function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
function weightedPick(arr, weights) {
  const r = Math.random()
  let acc = 0
  for (let i = 0; i < arr.length; i++) {
    acc += weights[i]
    if (r <= acc) return arr[i]
  }
  return arr[arr.length - 1]
}
function chunksOf(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function generateDemoRows(n) {
  const rows = []
  const today = new Date()
  for (let i = 0; i < n; i++) {
    const categoria = pickKey(CATEGORIAS_PRODUTOS)
    const produto = pick(CATEGORIAS_PRODUTOS[categoria])
    const custo = round2(20 + Math.random() * 480)
    const margemPct = 0.15 + Math.random() * 0.55
    const valor = round2(custo * (1 + margemPct))
    const daysAgo = Math.floor(Math.random() * 450)
    rows.push({
      vendedor: pick(VENDEDORES), regiao: pick(REGIOES), produto, categoria,
      canal: pick(CANAIS), status: weightedPick(STATUS_FUNIL, STATUS_WEIGHTS),
      quantidade: 1 + Math.floor(Math.random() * 12),
      valor, custo,
      avaliacao: Math.random() < 0.8 ? 1 + Math.floor(Math.random() * 5) : null,
      data_venda: addDays(today, -daysAgo),
    })
  }
  return rows
}

export function registerDashboardDemoHandlers({ ipcMain, wrap, query }) {
  ipcMain.handle('dash:seedDemo', wrap(async () => {
    await query('TRUNCATE TABLE kr_demo_vendas_001 RESTART IDENTITY')
    const rows = generateDemoRows(200)
    for (const chunk of chunksOf(rows, 50)) {
      const values = []
      const placeholders = chunk.map((r, i) => {
        const b = i * 11
        values.push(r.vendedor, r.regiao, r.produto, r.categoria, r.canal, r.status,
          r.quantidade, r.valor, r.custo, r.avaliacao, r.data_venda)
        return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9},$${b + 10},$${b + 11})`
      }).join(',')
      await query(
        `INSERT INTO kr_demo_vendas_001 (vendedor,regiao,produto,categoria,canal,status,quantidade,valor,custo,avaliacao,data_venda) VALUES ${placeholders}`,
        values
      )
    }
    return { inserted: rows.length }
  }))

  ipcMain.handle('dash:clearDemo', wrap(async () => {
    await query('TRUNCATE TABLE kr_demo_vendas_001 RESTART IDENTITY')
  }))
}
