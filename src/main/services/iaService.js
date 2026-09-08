import { obterProvedorComChave } from './iaProvedorService'

// Camada generica de chamada a IA. Recebe um provedorId (ia_provedor_001),
// um prompt de sistema, o texto do usuario e um schema JSON, e devolve um
// objeto batendo com o schema — usando tool-calling / structured output
// conforme o formato da API do provedor (anthropic | openai | gemini).

// ── Anthropic (Claude) ──────────────────────────────────────────────────
async function chamarAnthropic({ provedor, promptSistema, textoUsuario, schema, nomeFerramenta, imagens }) {
  const url = (provedor.base_url || 'https://api.anthropic.com') + '/v1/messages'
  // Content multimodal: imagens antes do texto (ordem recomendada pela
  // Anthropic). Sem imagens, manda so a string.
  const content = imagens?.length
    ? [
        ...imagens.map(img => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.base64 } })),
        { type: 'text', text: textoUsuario },
      ]
    : textoUsuario
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': provedor.api_key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: provedor.modelo,
      max_tokens: 8192,
      system: promptSistema,
      messages: [{ role: 'user', content }],
      tools: [{ name: nomeFerramenta, input_schema: schema }],
      tool_choice: { type: 'tool', name: nomeFerramenta },
    }),
  })
  if (!res.ok) {
    const d = await res.text().catch(() => '')
    throw new Error(`Anthropic ${res.status}: ${d.slice(0, 300)}`)
  }
  const data = await res.json()
  const tu = data.content?.find(b => b.type === 'tool_use' && b.name === nomeFerramenta)
  if (!tu?.input) throw new Error('Resposta da IA fora do formato esperado.')
  return tu.input
}

// ── OpenAI e compativeis (Groq, DeepSeek, Azure, OpenRouter, Ollama) ─────
async function chamarOpenAI({ provedor, promptSistema, textoUsuario, schema, nomeFerramenta }) {
  const url = (provedor.base_url || 'https://api.openai.com/v1') + '/chat/completions'
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${provedor.api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: provedor.modelo,
      messages: [
        { role: 'system', content: promptSistema },
        { role: 'user', content: textoUsuario },
      ],
      tools: [{ type: 'function', function: { name: nomeFerramenta, parameters: schema } }],
      tool_choice: { type: 'function', function: { name: nomeFerramenta } },
    }),
  })
  if (!res.ok) {
    const d = await res.text().catch(() => '')
    throw new Error(`OpenAI ${res.status}: ${d.slice(0, 300)}`)
  }
  const data = await res.json()
  const call = data.choices?.[0]?.message?.tool_calls?.[0]
  if (!call?.function?.arguments) throw new Error('Resposta da IA fora do formato esperado.')
  return JSON.parse(call.function.arguments)
}

// ── Google Gemini ───────────────────────────────────────────────────────
async function chamarGemini({ provedor, promptSistema, textoUsuario, schema, nomeFerramenta }) {
  const base = provedor.base_url || 'https://generativelanguage.googleapis.com/v1beta'
  const url = `${base}/models/${provedor.modelo}:generateContent?key=${provedor.api_key}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: promptSistema }] },
      contents: [{ role: 'user', parts: [{ text: textoUsuario }] }],
      tools: [{ functionDeclarations: [{ name: nomeFerramenta, parameters: schema }] }],
      toolConfig: { functionCallingConfig: { mode: 'ANY', allowedFunctionNames: [nomeFerramenta] } },
    }),
  })
  if (!res.ok) {
    const d = await res.text().catch(() => '')
    throw new Error(`Gemini ${res.status}: ${d.slice(0, 300)}`)
  }
  const data = await res.json()
  const part = data.candidates?.[0]?.content?.parts?.find(p => p.functionCall?.name === nomeFerramenta)
  if (!part?.functionCall?.args) throw new Error('Resposta da IA fora do formato esperado.')
  return part.functionCall.args
}

const HANDLERS = { anthropic: chamarAnthropic, openai: chamarOpenAI, gemini: chamarGemini }

// API publica: gera um objeto estruturado (schema) a partir de um prompt +
// texto (+ imagens opcionais, so Anthropic por ora), usando o provedor
// indicado.
export async function gerarEstruturado({ provedorId, promptSistema, textoUsuario, schema, nomeFerramenta = 'responder', imagens }) {
  if (!provedorId) throw new Error('Nenhum provedor de IA definido. Configure em Configurações > Prompts de IA.')
  const provedor = await obterProvedorComChave(provedorId)
  if (!provedor) throw new Error('O provedor de IA deste prompt não existe mais ou está inativo.')
  if (!provedor.api_key) throw new Error(`O provedor "${provedor.nome}" está sem chave de API configurada.`)
  const handler = HANDLERS[provedor.tipo_api]
  if (!handler) throw new Error(`Tipo de API não suportado: ${provedor.tipo_api}`)
  if (imagens?.length && provedor.tipo_api !== 'anthropic') {
    console.warn(`[iaService] imagens ignoradas: ${provedor.tipo_api} ainda nao suportado com anexos.`)
  }
  return handler({ provedor, promptSistema, textoUsuario, schema, nomeFerramenta, imagens })
}
