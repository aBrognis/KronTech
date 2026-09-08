import { readFileSync, existsSync } from 'fs'

// CSS ABNT (NBR 14724) comum aos templates de documento: Times New Roman
// 12pt, espaçamento 1,5, papel A4. printToPDF roda com marginType:'none'
// (main) para evitar a ambiguidade de unidade de margins.custom entre
// versões do Electron/Chromium — as margens reais são aplicadas aqui via
// @page.margin, que o Chromium REPETE em toda página impressa (diferente
// de padding do body, que só existe uma vez no início/fim do fluxo de
// conteúdo). Logo/cabeçalho/rodapé institucional (nome, CNPJ/IE, endereço,
// telefone, site) NÃO são feitos em CSS (position:fixed não repete em
// páginas impressas no Chromium headless) — são carimbados depois pelo
// pdf-lib em documentoPdfService.js, sobre a margem reservada aqui.
export function envolverHtml(conteudoHtml) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  @page { size: A4; margin: 3.5cm 2cm 3cm 3cm; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #000;
    margin: 0;
    hyphens: auto;
  }
  h1, h2, h3 { font-family: inherit; }
  .capa { page-break-after: always; padding-top: 8cm; }
  .capa-titulo { font-size: 15pt; font-weight: bold; text-align: center; text-transform: uppercase; margin: 0 0 10pt; }
  .capa-info { font-size: 12pt; text-align: center; margin-bottom: 4pt; }
  .titulo-doc {
    font-size: 13pt;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    margin: 0 0 18pt;
  }
  .secao-titulo {
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
    margin: 16pt 0 6pt;
  }
  .subsecao-titulo {
    font-size: 12pt;
    font-weight: bold;
    margin: 12pt 0 4pt;
  }
  p { margin: 0 0 8pt; text-align: justify; text-justify: inter-word; word-spacing: -0.5pt; }
  ul, ol { margin: 0 0 8pt; padding-left: 22pt; }
  li { margin-bottom: 3pt; text-align: justify; text-justify: inter-word; word-spacing: -0.5pt; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0 14pt; font-size: 11pt; }
  th, td { border: 1px solid #000; padding: 5pt 8pt; text-align: left; }
  th { font-weight: bold; }
  .processo { margin-bottom: 10pt; }
  .processo-titulo { font-weight: bold; }
  .processo-sublabel { font-weight: bold; }
  .assinaturas { margin-top: 36pt; }
  .assinatura-linha { margin-top: 30pt; border-top: 1px solid #000; width: 60%; padding-top: 4pt; font-size: 11pt; }
  .doc-figura { margin: 10pt 0 14pt; page-break-inside: avoid; text-align: center; }
  .doc-figura img { max-width: 100%; max-height: 20cm; border: 1px solid #999; }
  .doc-figura figcaption { font-size: 10pt; font-style: italic; color: #333; margin-top: 4pt; }
</style>
</head>
<body>
${conteudoHtml}
</body>
</html>`
}

// Bloco de imagens do documento (as marcadas noPdf=true), cada uma como
// <figure> com legenda. `imagens` = documento.imagens (jsonb). Lê o
// arquivo de disco e embute como data URI (o PDF renderer não acessa file
// paths arbitrários com seguranca). Retorna '' se nao houver nenhuma.
export function montarImagensHtml(imagens) {
  const lista = (Array.isArray(imagens) ? imagens : []).filter(i => i && i.noPdf && i.arquivo)
  if (!lista.length) return ''
  const figuras = lista.map(img => {
    if (!existsSync(img.arquivo)) return ''
    let dataUri
    try {
      const b64 = readFileSync(img.arquivo).toString('base64')
      dataUri = `data:${img.mime || 'image/png'};base64,${b64}`
    } catch { return '' }
    const cap = img.legenda ? `<figcaption>${escaparHtml(img.legenda)}</figcaption>` : ''
    return `<figure class="doc-figura"><img src="${dataUri}" />${cap}</figure>`
  }).join('')
  return figuras
}

export function escaparHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function formatarDataPtBr(data) {
  const dt = data ? new Date(data) : new Date()
  if (Number.isNaN(dt.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(dt)
}

// Capa (página de rosto) — título do documento, cliente e autor. O logo já
// aparece no cabeçalho pequeno carimbado em toda página (documentoPdfService.js),
// sem repetir em tamanho grande aqui. Sempre a primeira página, isolada do
// corpo por page-break-after (mesmo padrão do modelo real da Sisplan).
export function montarCapaHtml(documento) {
  const dataGeracao = formatarDataPtBr(documento.criado_em)
  return `
<div class="capa">
  <div class="capa-titulo">${escaparHtml(documento.titulo)}</div>
  <div class="capa-info">Cliente: ${escaparHtml(documento.cliente_nome)}</div>
  <div class="capa-info">Autor: ${escaparHtml(documento.autor)}</div>
  <div class="capa-info">Data: ${escaparHtml(dataGeracao)}</div>
</div>`
}

// Não inclui o título da seção — os templates emitem "N Participantes"
// eles mesmos, mantendo a numeração sequencial junto das demais seções.
export function montarParticipantesEDeclaracaoHtml(participantes) {
  const lista = Array.isArray(participantes) ? participantes.filter(p => p?.nome?.trim()) : []
  const linhasParticipantes = lista.length
    ? lista.map(p => `<tr><td>${escaparHtml(p.nome)}</td><td>${escaparHtml(p.setor)}</td></tr>`).join('')
    : `<tr><td colspan="2" style="text-align:center;">Nenhum participante informado.</td></tr>`

  return `
<table>
  <thead><tr><th>Nome</th><th>Setor</th></tr></thead>
  <tbody>${linhasParticipantes}</tbody>
</table>

<div class="assinaturas">
  <p>Declaram, para os devidos fins, que a tela encontra-se validada conforme descrito neste documento.</p>
  <div class="assinatura-linha">Assinatura</div>
</div>`
}
