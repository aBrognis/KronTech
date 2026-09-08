import { obterPromptPorCodigo } from './promptIaService'
import { gerarEstruturado } from './iaService'

const CODIGO_PROMPT_EMAIL = 'email_redacao'

// Recebe o rascunho bruto que o usuario digitou no compositor + o modo
// (novo / responder / responder-todos / encaminhar) e o assunto, monta o
// contexto e devolve o corpo do e-mail em HTML. Usa o prompt gravado em
// prompt_ia_001 e o provedor de IA (ia_provedor_001) ligado a esse prompt.
export async function gerarCorpoEmail({ textoBruto, modo, assunto }) {
  const texto = (textoBruto || '').trim()
  if (!texto) throw new Error('Escreva um rascunho antes de gerar.')

  const prompt = await obterPromptPorCodigo(CODIGO_PROMPT_EMAIL)
  if (!prompt) {
    throw new Error(`Prompt "${CODIGO_PROMPT_EMAIL}" não encontrado ou inativo. Verifique em Configurações > Prompts de IA.`)
  }

  const rotuloModo = {
    novo: 'e-mail novo',
    responder: 'resposta a um e-mail recebido',
    'responder-todos': 'resposta a todos de um e-mail recebido',
    encaminhar: 'encaminhamento de um e-mail',
  }[modo] || 'e-mail novo'

  const contexto = `Este e um ${rotuloModo}.` + (assunto ? ` Assunto: "${assunto}".` : '')
  const textoUsuario = `Contexto: ${contexto}\n\n--- RASCUNHO BRUTO ---\n${texto}`

  const schema = {
    type: 'object',
    properties: {
      corpo_html: {
        type: 'string',
        description: 'O corpo do e-mail em HTML simples (apenas <p>, <ul>/<ol>, <li>, <strong>, <em>, <a>, <br>). Sem <html>/<head>/<body>, sem assunto, sem assinatura.',
      },
    },
    required: ['corpo_html'],
  }

  const out = await gerarEstruturado({
    provedorId: prompt.ia_provedor_id,
    promptSistema: prompt.prompt_sistema,
    textoUsuario,
    schema,
    nomeFerramenta: 'entregar_email',
  })
  if (!out?.corpo_html) throw new Error('A IA não retornou o corpo do e-mail. Tente novamente.')
  return out.corpo_html
}
