import { useState, useEffect, useRef } from 'react'
import { X, Send, Paperclip, Trash2, Loader2, Save, Bot } from 'lucide-react'
import RichTextEditor from '../../components/RichTextEditor'
import CampoDestinatarios from './CampoDestinatarios'
import { fmtDataHora, nomeOuEmail } from './utils'
import { notificar } from '../../components/Notificacao'

const TITULOS = { novo: 'Novo e-mail', responder: 'Responder', 'responder-todos': 'Responder a todos', encaminhar: 'Encaminhar' }

function escaparHtml(texto) {
  const div = document.createElement('div')
  div.textContent = texto
  return div.innerHTML
}

// Extrai texto puro do HTML editado — fallback pra clientes de e-mail sem
// suporte a HTML (corpo_texto é sempre gravado junto do corpo_html).
function htmlParaTexto(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || ''
}

function montarCitacaoHtml(mensagemOrigem) {
  if (!mensagemOrigem) return ''
  const remetente = nomeOuEmail(mensagemOrigem.remetente_nome, mensagemOrigem.remetente_email)
  const corpo = mensagemOrigem.corpo_html || escaparHtml(mensagemOrigem.corpo_texto || '').replace(/\n/g, '<br>')
  return `<br><br><div style="border-left:2px solid #ccc;padding-left:10px;color:#666">Em ${fmtDataHora(mensagemOrigem.data_envio)}, ${remetente} escreveu:<br>${corpo}</div>`
}

function listaEmails(str) {
  return String(str || '').split(',').map(e => e.trim()).filter(Boolean)
}

export default function ComposerModal({ modo, contas, contaAtivaId, mensagemOrigem, rascunho, onFechar, onEnviado, anexosIniciais, assuntoInicial, corpoInicial }) {
  // Conta remetente inicial: rascunho > (ao responder/encaminhar) a conta que
  // recebeu o e-mail original > conta ativa na navegacao > primeira cadastrada.
  // O usuario pode trocar livremente no seletor "De" em qualquer modo.
  const [contaId, setContaId] = useState(
    rascunho?.conta_id
    || (modo !== 'novo' ? mensagemOrigem?.conta_id : null)
    || contaAtivaId
    || contas[0]?.id
  )
  const [para, setPara] = useState(rascunho ? (rascunho.destinatarios || []).map(d => d.email).join(', ') : '')
  const [cc, setCc] = useState(rascunho ? (rascunho.copia || []).map(d => d.email).join(', ') : '')
  const [cco, setCco] = useState(rascunho ? (rascunho.copia_oculta || []).map(d => d.email).join(', ') : '')
  const [mostrarCco, setMostrarCco] = useState(!!rascunho?.copia_oculta?.length)
  const [assunto, setAssunto] = useState(rascunho?.assunto || assuntoInicial || '')
  const [corpo, setCorpo] = useState(rascunho?.corpo_html || corpoInicial || '')
  // Anexos pre-carregados (ex.: chamado a partir de Despesas de Viagem).
  const [anexos, setAnexos] = useState(() => (anexosIniciais || []).map(a => ({
    nome: a.nome, caminho: a.caminho, origem: a.origem || 'existente',
  })))
  const [enviando, setEnviando] = useState(false)
  const [salvandoRascunho, setSalvandoRascunho] = useState(false)
  const [erro, setErro] = useState(null)
  const rascunhoIdRef = useRef(rascunho?.id || null)
  // Trava sincrona contra envio duplo: o state `enviando` so vale no
  // proximo render, entao um duplo-clique rapido passava por ele.
  const enviandoRef = useRef(false)

  // Guarda a assinatura atualmente inserida pra poder trocá-la (sem duplicar
  // nem apagar o que o usuário já escreveu) quando ele muda a conta remetente.
  const assinaturaAtualRef = useRef('')

  function corpoSemAssinatura(html) {
    return assinaturaAtualRef.current ? html.replace(assinaturaAtualRef.current, '') : html
  }

  async function aplicarAssinaturaDaConta(id, corpoBase) {
    const conta = contas.find(c => c.id === id)
    if (!conta?.assinatura_ativa || !conta?.assinatura_html) {
      assinaturaAtualRef.current = ''
      setCorpo(corpoBase)
      return
    }
    // A assinatura fica numa <div class="kr-assinatura">. O DESTAQUE VISUAL
    // (linha separadora + fundo) vem so do CSS do editor (.rich-text-editor-area
    // .kr-assinatura) — NAO e enviado no e-mail. No e-mail vai so a assinatura
    // no fim do corpo, sem separador nenhum. Um <p><br></p> antes garante um
    // ponto de clique/cursor claramente editavel acima dela.
    const bloco = `<p><br></p><div class="kr-assinatura">${conta.assinatura_html}</div>`
    assinaturaAtualRef.current = bloco
    const base = corpoBase || '<p><br></p>'
    setCorpo(base + bloco)
  }

  useEffect(() => {
    if (rascunho) return // rascunho já veio com corpo/destinatários prontos, não sobrescreve
    let corpoBase = corpoInicial || ''
    if ((modo === 'responder' || modo === 'responder-todos') && mensagemOrigem) {
      setPara(mensagemOrigem.remetente_email)
      setAssunto(mensagemOrigem.assunto?.startsWith('Re:') ? mensagemOrigem.assunto : `Re: ${mensagemOrigem.assunto || ''}`)
      corpoBase = montarCitacaoHtml(mensagemOrigem)
      // "Responder a todos": destinatarios originais + quem estava em copia,
      // menos o proprio remetente da conta (nao faz sentido responder pra si).
      if (modo === 'responder-todos') {
        const contaAtual = contas.find(c => c.id === contaId)
        const meu = (contaAtual?.email || '').toLowerCase()
        const origem = (mensagemOrigem.remetente_email || '').toLowerCase()
        const outros = [
          ...(mensagemOrigem.destinatarios || []),
          ...(mensagemOrigem.copia || []),
        ]
          .map(d => d.email)
          .filter(Boolean)
          .filter(e => {
            const el = e.toLowerCase()
            return el !== meu && el !== origem
          })
        if (outros.length) setCc([...new Set(outros)].join(', '))
      }
    } else if (modo === 'encaminhar' && mensagemOrigem) {
      setAssunto(mensagemOrigem.assunto?.startsWith('Fwd:') ? mensagemOrigem.assunto : `Fwd: ${mensagemOrigem.assunto || ''}`)
      corpoBase = montarCitacaoHtml(mensagemOrigem)
      // Anexos originais seguem no encaminhamento — copiados (não movidos)
      // pra não afetar a mensagem original, que continua referenciando o
      // mesmo arquivo físico.
      if (mensagemOrigem.anexos?.length) {
        setAnexos(mensagemOrigem.anexos.map(a => ({ nome: a.nome_original, caminho: a.caminho, origem: 'existente' })))
      }
    }
    if (contaId) aplicarAssinaturaDaConta(contaId, corpoBase)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, mensagemOrigem])

  function trocarConta(novoId) {
    const corpoBase = corpoSemAssinatura(corpo)
    setContaId(novoId)
    aplicarAssinaturaDaConta(novoId, corpoBase)
  }

  async function adicionarAnexo() {
    const res = await window.api.email.selecionarAnexos()
    if (res.ok && res.data) setAnexos(prev => [...prev, { nome: res.data.nome, caminho: res.data.path, origem: 'novo' }])
  }
  function removerAnexo(idx) {
    setAnexos(prev => prev.filter((_, i) => i !== idx))
  }

  // "Gerar com IA": pega o texto que o usuario escreveu (so o que ele
  // digitou, sem a assinatura nem a citacao), manda pro backend reescrever
  // como corpo de e-mail, e substitui SO essa parte, preservando assinatura
  // e historico. O prompt e editavel em Configuracoes > Prompts de IA.
  const [gerando, setGerando] = useState(false)
  async function gerarComIa() {
    if (gerando) return
    // O que o usuario escreveu = corpo atual menos a assinatura menos a
    // citacao (montarCitacaoHtml). Sobra o rascunho bruto dele.
    let rascunho = corpoSemAssinatura(corpo)
    const citacao = mensagemOrigem ? montarCitacaoHtml(mensagemOrigem) : ''
    if (citacao) rascunho = rascunho.replace(citacao, '')
    const textoBruto = htmlParaTexto(rascunho).trim()
    if (!textoBruto) { setErro('Escreva um rascunho no corpo antes de gerar.'); return }

    setGerando(true)
    setErro(null)
    try {
      const res = await window.api.emailIa.gerarCorpo({ textoBruto, modo, assunto: assunto.trim() || undefined })
      if (!res.ok) { setErro(res.erro); return }
      // Remonta: corpo gerado + citacao (se houver) + assinatura.
      const assinatura = assinaturaAtualRef.current || ''
      setCorpo(`${res.data.corpoHtml}${citacao}${assinatura}`)
      notificar.sucesso('Corpo gerado. Revise antes de enviar.')
    } finally {
      setGerando(false)
    }
  }

  function temConteudo() {
    return para.trim() || cc.trim() || cco.trim() || assunto.trim() || htmlParaTexto(corpo).trim()
  }

  async function salvarRascunho({ silencioso = false } = {}) {
    if (!contaId || !temConteudo()) return
    setSalvandoRascunho(true)
    try {
      const res = await window.api.email.salvarRascunho({
        id: rascunhoIdRef.current, contaId, para: para.trim(), cc: cc.trim(), cco: cco.trim(),
        assunto: assunto.trim(), corpoTexto: htmlParaTexto(corpo), corpoHtml: corpo,
      })
      if (res.ok) {
        rascunhoIdRef.current = res.data.id
        if (!silencioso) onEnviado() // reaproveita o recarregamento de lista do chamador
      }
    } finally {
      setSalvandoRascunho(false)
    }
  }

  // Cancelar/fechar NAO salva rascunho. O rascunho so e criado quando o
  // usuario clica explicitamente em "Salvar rascunho". Se ja existe um
  // rascunho (aberto pra edicao) e o usuario cancela sem salvar, mantem o
  // que estava gravado, nao sobrescreve.
  function fechar() {
    onFechar()
  }

  async function enviar() {
    if (enviandoRef.current) return
    if (!contaId) { setErro('Selecione a conta remetente.'); return }
    if (!para.trim()) { setErro('Informe ao menos um destinatário.'); return }
    if (!assunto.trim()) { setErro('Informe o assunto.'); return }
    enviandoRef.current = true
    setErro(null)
    setEnviando(true)
    try {
      const res = await window.api.email.enviar({
        contaId, para: para.trim(), cc: cc.trim() || undefined, cco: cco.trim() || undefined, assunto: assunto.trim(),
        corpoTexto: htmlParaTexto(corpo), corpoHtml: corpo,
        anexos: anexos.map(a => ({ nome: a.nome, caminho: a.caminho, origem: a.origem })),
        emReplyA: (modo === 'responder' || modo === 'responder-todos') ? mensagemOrigem?.message_id : undefined,
        mensagemOrigemId: (modo === 'responder' || modo === 'responder-todos') ? mensagemOrigem?.id : undefined,
        rascunhoId: rascunhoIdRef.current || undefined,
      })
      if (!res.ok) {
        // enviarEmail nunca "perde" o e-mail: se foi pra Caixa de Saida
        // (falha de rede), a mensagem esta salva e vai sozinha — avisa e
        // fecha, nao trava o usuario no modal. Erro permanente (dado
        // invalido) tambem foi pra Saida como 'erro'; nesse caso mantem
        // aberto pra ele corrigir.
        if (/Caixa de Sa[ií]da/i.test(res.erro || '')) {
          const permanente = /como erro/i.test(res.erro)
          if (permanente) { setErro(res.erro); return }
          notificar.aviso(res.erro)
          onEnviado()
          return
        }
        setErro(res.erro); return
      }
      notificar.sucesso('E-mail enviado.')
      onEnviado()
    } finally {
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}>
      <div style={{ width: 980, maxWidth: '94vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)' }}>
        <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{TITULOS[modo]}</span>
          <button className="btn btn-ghost" style={{ height: 28, width: 28, padding: 0 }} onClick={fechar}><X size={14} /></button>
        </div>

        <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {erro && (
            <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(239,68,68,.4)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--red)' }}>
              {erro}
            </div>
          )}

          {/* De + Para lado a lado */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-group" style={{ margin: 0, flex: '0 0 320px', minWidth: 0 }}>
              <label className="form-label">De</label>
              <select className="form-select" value={contaId || ''} onChange={e => trocarConta(Number(e.target.value))}>
                {contas.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.email})</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 0 }}>
              <label className="form-label">Para</label>
              <CampoDestinatarios value={para} onChange={setPara} placeholder="Para" />
            </div>
          </div>

          {/* Cc + Cco + Assunto na mesma linha */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 0 }}>
              <label className="form-label">Cc</label>
              <CampoDestinatarios value={cc} onChange={setCc} placeholder="Cc" />
            </div>
            {mostrarCco ? (
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 0 }}>
                <label className="form-label">Cco</label>
                <CampoDestinatarios value={cco} onChange={setCco} placeholder="Cco" autoFocus />
              </div>
            ) : (
              <button className="btn btn-ghost" style={{ height: 34, fontSize: 11.5, flexShrink: 0, marginTop: 18 }} onClick={() => setMostrarCco(true)}>
                + Cco
              </button>
            )}
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Assunto</label>
            <input className="form-input" value={assunto} onChange={e => setAssunto(e.target.value)} />
          </div>

          <div className="form-group" style={{ margin: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 220 }}>
            <label className="form-label">Mensagem</label>
            <RichTextEditor value={corpo} onChange={setCorpo} minHeight={200} placeholder="Escreva sua mensagem..." />
          </div>

          {anexos.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {anexos.map((a, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--bd)', fontSize: 11.5 }}>
                  <Paperclip size={11} /> {a.nome}
                  <button onClick={() => removerAnexo(idx)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}>
                    <Trash2 size={11} color="var(--red)" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '14px 22px 20px', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={adicionarAnexo}>
              <Paperclip size={13} /> Anexar arquivo
            </button>
            <button className="btn btn-primary" onClick={gerarComIa} disabled={gerando} title="Reescrever o rascunho como um e-mail formatado">
              {gerando ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Bot size={13} />}
              {gerando ? 'Gerando...' : 'Gerar'}
            </button>
            <button className="btn btn-ghost" onClick={() => salvarRascunho()} disabled={salvandoRascunho || !temConteudo()}>
              {salvandoRascunho ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
              Salvar rascunho
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={fechar}>Cancelar</button>
            <button className="btn btn-primary" onClick={enviar} disabled={enviando}>
              {enviando ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
