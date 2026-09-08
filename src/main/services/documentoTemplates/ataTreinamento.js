import { envolverHtml, escaparHtml, montarCapaHtml, montarParticipantesEDeclaracaoHtml, montarImagensHtml } from './htmlBase'

function montarProcessoHtml(numeroSecao, proc, idx) {
  const bullets = (rotulo, itens) => (Array.isArray(itens) && itens.length)
    ? `<div><span class="processo-sublabel">${rotulo}:</span> ${itens.map(escaparHtml).join(', ')}</div>`
    : ''

  return `
<div class="subsecao-titulo">${numeroSecao}.${idx + 1} ${escaparHtml(proc.titulo)}</div>
<p>${escaparHtml(proc.descricao)}</p>
${bullets('Aplicações', proc.aplicacoes)}
${bullets('Importância', proc.importancia)}
${bullets('Benefícios', proc.beneficios)}
`
}

// Monta o corpo HTML de uma Ata de Treinamento: capa + seções numeradas
// (1 Introdução, 2 Escopo do treinamento, 3 Detalhamento dos processos
// com subseções 3.1/3.2/..., 4 Participantes), mesma estrutura do modelo
// real usado pela Sisplan (ver EXEMPLO.docx).
export function montarHtml(documento) {
  const c = documento.conteudo_estruturado || {}
  let n = 0
  const proxNumero = () => ++n

  const escopo = Array.isArray(c.escopo) && c.escopo.length
    ? `<ol>${c.escopo.map(item => `<li>${escaparHtml(item)}</li>`).join('')}</ol>`
    : ''

  let secaoProcessos = ''
  if (Array.isArray(c.processos) && c.processos.length) {
    const numeroSecao = proxNumero()
    secaoProcessos = `
<div class="secao-titulo">${numeroSecao} Detalhamento dos processos</div>
${c.processos.map((proc, idx) => montarProcessoHtml(numeroSecao, proc, idx)).join('')}
`
  }

  const conteudo = `
${montarCapaHtml(documento)}

<div class="titulo-doc">${escaparHtml(documento.titulo)}</div>

${c.introducao !== undefined ? `<div class="secao-titulo">${proxNumero()} Introdução</div><p>${escaparHtml(c.introducao)}</p>` : ''}

${montarImagensHtml(documento.imagens)}

${escopo ? `<div class="secao-titulo">${proxNumero()} Escopo do treinamento</div>${escopo}` : ''}

${secaoProcessos}

<div class="secao-titulo">${proxNumero()} Participantes</div>
${montarParticipantesEDeclaracaoHtml(documento.participantes)}
`

  return envolverHtml(conteudo)
}
