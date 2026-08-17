import ExcelJS from 'exceljs'

function diaDaSemana(data) {
  const d = new Date(data)
  if (Number.isNaN(d.getTime())) return ''
  const nome = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' }).format(d)
  return nome.charAt(0).toUpperCase() + nome.slice(1)
}

function fmtData(data) {
  const d = new Date(data)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(d)
}

const BORDA = { style: 'thin', color: { argb: 'FFDADCE1' } }
const BORDA_CELULA = { top: BORDA, left: BORDA, bottom: BORDA, right: BORDA }
const CINZA_CABECALHO = 'FFF4F5F7'
const CINZA_ZEBRA = 'FFF7F7F8'
const CINZA_TOTAL = 'FFF4F5F7'
const CINZA_ESCURO = 'FF1F2126'
const BRANCO = 'FFF3F4F6'

// Larguras mínimas por coluna (em "caracteres" Excel), para o conteúdo mais
// curto nunca ficar apertado mesmo se a exportação tiver poucos dados.
const LARGURA_MIN = [12, 14, 20, 16, 7, 12, 12]
const LARGURA_MAX = 48

// Autoajusta a largura de cada coluna ao maior conteúdo real da exportação,
// para o usuário nunca precisar redimensionar manualmente ao abrir o arquivo.
// Não varre a planilha inteira: células dentro de um range mesclado "ecoam"
// o mesmo valor em todas as colunas do range via eachCell, o que infla a
// largura calculada para colunas que na prática só têm cabeçalho/números.
// Em vez disso, calcula a largura só a partir das linhas realmente
// relevantes (linhas de metadado, cabeçalho da tabela, linhas de item).
function autoLargura(ws, linhasMedidas) {
  const larguras = LARGURA_MIN.slice()
  for (const { celulas } of linhasMedidas) {
    celulas.forEach((texto, i) => {
      if (i >= larguras.length) return
      larguras[i] = Math.max(larguras[i], String(texto ?? '').length + 2)
    })
  }
  larguras.forEach((w, i) => {
    ws.getColumn(i + 1).width = Math.min(w, LARGURA_MAX)
  })
}

export async function gerarExcelViagem(despesa) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Despesas', { pageSetup: { orientation: 'landscape', fitToPage: true } })
  const linhasMedidas = []

  ws.mergeCells('A1:G1')
  ws.getCell('A1').value = 'Despesas Viagem'
  ws.getCell('A1').font = { bold: true, size: 14 }
  ws.getCell('A1').alignment = { horizontal: 'center' }
  ws.getRow(1).height = 26

  const linhasCabecalho = [
    ['Consultor:', despesa.consultor_nome, 'Cliente:', despesa.cliente_nome || ''],
    ['Período de:', fmtData(despesa.data_inicio), 'Até:', fmtData(despesa.data_fim)],
    ['Local Partida:', despesa.local_partida || '', 'Local Destino:', despesa.local_destino || ''],
    ['Meio de Transporte:', despesa.meio_transporte || '', '', ''],
  ]
  let r = 3
  for (const [l1, v1, l2, v2] of linhasCabecalho) {
    ws.getCell(`A${r}`).value = l1
    ws.getCell(`A${r}`).font = { bold: true }
    ws.mergeCells(`B${r}:C${r}`)
    ws.getCell(`B${r}`).value = v1
    if (l2) {
      ws.getCell(`D${r}`).value = l2
      ws.getCell(`D${r}`).font = { bold: true }
      ws.mergeCells(`E${r}:G${r}`)
      ws.getCell(`E${r}`).value = v2
    }
    // B:C está mesclado (2 colunas) e E:G está mesclado (3 colunas) — divide
    // o comprimento do texto proporcionalmente entre as colunas do range,
    // senão o texto inteiro "cai" só na primeira coluna do merge e infla
    // sua largura sozinha (ex: nome de cliente longo inflando só "Qtde").
    const v1Parte = 'x'.repeat(Math.ceil((v1 || '').length / 2))
    const v2Parte = 'x'.repeat(Math.ceil((v2 || '').length / 3))
    linhasMedidas.push({ celulas: [l1, v1Parte, v1Parte, l2, v2Parte, v2Parte, v2Parte] })
    r++
  }

  r += 1
  const headerRow = ['Data', 'Dia', 'Descrição', 'Fornecedor', 'Qtde', 'Vl. Unit.', 'Valor']
  const hRow = ws.getRow(r)
  headerRow.forEach((h, i) => {
    const cell = hRow.getCell(i + 1)
    cell.value = h
    cell.font = { bold: true, color: { argb: 'FF565A63' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CINZA_CABECALHO } }
    cell.border = BORDA_CELULA
    cell.alignment = { horizontal: i >= 4 ? 'right' : 'left' }
  })
  linhasMedidas.push({ celulas: headerRow })
  r++

  const itens = despesa.itens || []
  itens.forEach((it, idx) => {
    const row = ws.getRow(r)
    row.getCell(1).value = fmtData(it.data)
    row.getCell(2).value = diaDaSemana(it.data)
    row.getCell(3).value = it.descricao || ''
    row.getCell(4).value = it.fornecedor || ''
    row.getCell(5).value = Number(it.qtde) || 0
    row.getCell(6).value = Number(it.valor_unitario) || 0
    row.getCell(6).numFmt = '#,##0.00'
    row.getCell(7).value = Number(it.valor) || 0
    row.getCell(7).numFmt = '#,##0.00'
    const zebra = idx % 2 === 1
    for (let c = 1; c <= 7; c++) {
      row.getCell(c).border = BORDA_CELULA
      if (zebra) row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CINZA_ZEBRA } }
      if (c >= 5) row.getCell(c).alignment = { horizontal: 'right' }
    }
    linhasMedidas.push({
      celulas: [
        fmtData(it.data), diaDaSemana(it.data), it.descricao || '', it.fornecedor || '',
        it.qtde, (Number(it.valor_unitario) || 0).toFixed(2), (Number(it.valor) || 0).toFixed(2),
      ],
    })
    r++
  })

  const total = itens.reduce((soma, it) => soma + Number(it.valor || 0), 0)

  ws.mergeCells(`A${r}:F${r}`)
  ws.getCell(`A${r}`).value = 'Total das Despesas'
  ws.getCell(`A${r}`).font = { bold: true, color: { argb: 'FF565A63' } }
  ws.getCell(`A${r}`).alignment = { horizontal: 'right' }
  ws.getCell(`A${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CINZA_TOTAL } }
  ws.getCell(`G${r}`).value = total
  ws.getCell(`G${r}`).numFmt = '#,##0.00'
  ws.getCell(`G${r}`).font = { bold: true }
  ws.getCell(`G${r}`).alignment = { horizontal: 'right' }
  ws.getCell(`G${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CINZA_TOTAL } }
  r++

  ws.mergeCells(`A${r}:F${r}`)
  ws.getCell(`A${r}`).value = 'Valor a Reembolsar'
  ws.getCell(`A${r}`).font = { bold: true, size: 12, color: { argb: BRANCO } }
  ws.getCell(`A${r}`).alignment = { horizontal: 'right', vertical: 'middle' }
  ws.getCell(`A${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CINZA_ESCURO } }
  ws.getCell(`G${r}`).value = total
  ws.getCell(`G${r}`).numFmt = '#,##0.00'
  ws.getCell(`G${r}`).font = { bold: true, size: 13, color: { argb: BRANCO } }
  ws.getCell(`G${r}`).alignment = { horizontal: 'right', vertical: 'middle' }
  ws.getCell(`G${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CINZA_ESCURO } }
  ws.getRow(r).height = 22

  autoLargura(ws, linhasMedidas)

  return wb.xlsx.writeBuffer()
}
