import { envolverHtml, escaparHtml, montarCapaHtml, montarParticipantesEDeclaracaoHtml, montarImagensHtml } from './htmlBase'

// Monta o corpo HTML de uma Análise de Aderência: capa + seções numeradas
// (1 Introdução, 2 Nome da tela, 3 Objetivo da tela, 4 Funcionalidades,
// 5 Integrações, 6 Participantes), mesma estrutura do modelo real usado
// pela Sisplan (ver EXEMPLO.docx).
export function montarHtml(documento) {
  const c = documento.conteudo_estruturado || {}
  let n = 0
  const proxNumero = () => ++n

  const funcionalidades = Array.isArray(c.funcionalidades) && c.funcionalidades.length
    ? `<ol>${c.funcionalidades.map(item => `<li>${escaparHtml(item)}</li>`).join('')}</ol>`
    : ''

  const conteudo = `
${montarCapaHtml(documento)}

<div class="titulo-doc">${escaparHtml(documento.titulo)}</div>

${c.introducao !== undefined ? `<div class="secao-titulo">${proxNumero()} Introdução</div><p>${escaparHtml(c.introducao)}</p>` : ''}

${montarImagensHtml(documento.imagens)}

${c.nomeTela !== undefined ? `<div class="secao-titulo">${proxNumero()} Nome da tela</div><p>${escaparHtml(c.nomeTela)}</p>` : ''}

${c.objetivoTela !== undefined ? `<div class="secao-titulo">${proxNumero()} Objetivo da tela</div><p>${escaparHtml(c.objetivoTela)}</p>` : ''}

${funcionalidades ? `<div class="secao-titulo">${proxNumero()} Funcionalidades</div>${funcionalidades}` : ''}

${c.integracoes !== undefined ? `<div class="secao-titulo">${proxNumero()} Integrações</div><p>${escaparHtml(c.integracoes)}</p>` : ''}

<div class="secao-titulo">${proxNumero()} Participantes</div>
${montarParticipantesEDeclaracaoHtml(documento.participantes)}
`

  return envolverHtml(conteudo)
}
