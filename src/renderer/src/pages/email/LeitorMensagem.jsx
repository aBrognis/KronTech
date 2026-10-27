import { useRef, useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Paperclip, Download, MailOpen, Tag, X, Star, Reply, ReplyAll, Forward, ChevronLeft, ChevronDown, DownloadCloud, Send } from 'lucide-react'
import { fmtDataLonga, nomeOuEmail, achatarEtiquetasEmArvore, iniciais, corAvatar, corAvatarTint, descreverStatusSaida } from './utils'
import { notificar } from '../../components/Notificacao'

function abrirAnexo(caminho) {
  window.api.arquivos?.abrir?.(caminho)
}

async function salvarAnexo(caminho, nome) {
  const res = await window.api.arquivos?.salvarComo?.(caminho, nome)
  if (res?.ok) notificar.sucesso(`Anexo salvo em ${res.destino}`)
  else if (res && !res.cancelado) notificar.erro(res.erro || 'Não foi possível salvar o anexo.')
}

async function salvarTodosAnexos(anexos) {
  const itens = anexos.map(a => ({ caminhoOrigem: a.caminho, nome: a.nome_original }))
  const res = await window.api.arquivos?.salvarVarios?.(itens)
  if (res?.ok) {
    notificar.sucesso(`${res.salvos} de ${res.total} anexo(s) salvos em ${res.pasta}`)
    if (res.erros?.length) notificar.erro(`Alguns anexos falharam: ${res.erros.join('; ')}`)
  } else if (res && !res.cancelado) {
    notificar.erro(res.erro || 'Não foi possível salvar os anexos.')
  }
}

// Um botao por anexo; clique abre um menu (em portal, pra nao ser cortado
// pelo overflow:hidden do rodape) com Abrir / Salvar como.
function AnexoBotao({ anexo }) {
  const [aberto, setAberto] = useState(false)
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const [pos, setPos] = useState(null)

  useLayoutEffect(() => {
    if (!aberto || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    // Menu abre PRA CIMA (o rodape fica na base da tela).
    setPos({ left: r.left, bottom: window.innerHeight - r.top + 6 })
  }, [aberto])

  useEffect(() => {
    if (!aberto) return
    const fora = e => {
      if (btnRef.current?.contains(e.target)) return
      if (menuRef.current?.contains(e.target)) return
      setAberto(false)
    }
    const esc = e => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc) }
  }, [aberto])

  return (
    <>
      <button
        ref={btnRef}
        className="btn btn-ghost"
        style={{ height: 28, fontSize: 11.5, padding: '0 10px', maxWidth: 260 }}
        onClick={() => setAberto(v => !v)}
        title={anexo.nome_original}
      >
        <Paperclip size={12} style={{ flexShrink: 0, color: 'var(--t3)' }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{anexo.nome_original}</span>
        <ChevronDown size={12} style={{ flexShrink: 0, color: 'var(--t3)' }} />
      </button>
      {aberto && pos && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed', left: pos.left, bottom: pos.bottom, zIndex: 4000, minWidth: 160,
            background: 'var(--s1)', border: '1px solid var(--bd2)', borderRadius: 8, boxShadow: 'var(--sh-lg)', padding: 4,
          }}
        >
          {[
            { label: 'Abrir', icon: <Paperclip size={13} />, fn: () => abrirAnexo(anexo.caminho) },
            { label: 'Salvar como', icon: <Download size={13} />, fn: () => salvarAnexo(anexo.caminho, anexo.nome_original) },
          ].map(op => (
            <button
              key={op.label}
              onClick={() => { op.fn(); setAberto(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', borderRadius: 6,
                border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--t1)', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--s2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ color: 'var(--t3)', display: 'flex', flexShrink: 0 }}>{op.icon}</span>
              {op.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

// CSS injetado no <head> do e-mail pra ele se fundir ao painel em vez de
// ficar num cartão "papel" separado — mesma técnica nos dois temas, só
// trocando as cores. Cores literais porque o iframe é um documento isolado
// e não enxerga as variáveis CSS do app (ver styles/tokens.css).
function cssTema(escuro) {
  const bg = escuro ? '#1c1c1c' : '#fff'
  const texto = escuro ? '#F0F0F0' : '#0D0E14'
  const link = escuro ? '#8ab4f8' : '#1a56db'
  const borda = escuro ? '#333' : '#dcdfe8'
  return `
    html { color-scheme: ${escuro ? 'dark' : 'light'}; }
    body { background: ${bg} !important; color: ${texto} !important; padding: 24px 28px !important; margin: 0 !important; box-sizing: border-box !important; overflow-x: hidden !important; }
    table, tr, td, th, div, span, p, section, article, header, footer, ul, ol, li {
      background-color: transparent !important; border-color: ${borda} !important;
    }
    *:not(a):not(a *):not([style*="background"]) { color: ${texto} !important; }
    a:not([style*="background"]), a:not([style*="background"]) * { color: ${link} !important; }
    img, video, svg, picture { filter: none !important; background: none !important; }
    /* Imagens (logos de assinatura, banners) nunca estouram a largura do
       painel — encolhem no lugar em vez de forcar o e-mail inteiro a
       escalar. height:auto mantem a proporcao. */
    img, video, svg, picture { max-width: 100% !important; height: auto !important; }
    /* Imagens que o remetente referenciou por caminho de arquivo local
       (file://), por cid: nao resolvido, ou por kmail:// cujo arquivo
       sumiu do disco (o main troca kmail:// por data: na leitura; o que
       sobrar e imagem ausente) nunca carregam — esconde pra nao mostrar o
       icone de "imagem quebrada". */
    img[src^="file:"], img[src^="cid:"], img[src^="kmail:"] { display: none !important; }
    /* Fonte SEMPRE a do sistema, nunca a que o remetente mandou - e a maior
       causa de "ora uma fonte, ora outra" entre e-mails diferentes.
       !important pra vencer o font-family inline que a maioria dos
       remetentes aplica em cada <td>/<span> (sem isso uma regra em body{}
       nunca ganha de estilo inline). Mesma familia do resto do app
       (--fb em styles/tokens.css). */
    * { font-family: 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif !important; }
    /* Tamanho base TAMBEM fixo (14px, igual ao resto do app): a maioria dos
       e-mails - sobretudo os automaticos/de sistema, como notificacao de
       pendencia - nao tem hierarquia de titulo/corpo nenhuma, so um
       font-size escolhido ao acaso por quem gerou o template (mesmo
       remetente manda um e-mail com letra grande e outro com letra
       pequena). Aplica em body (herda pra quem nao define o proprio
       tamanho) E, com !important, nas tags de texto corrido onde o
       remetente mais costuma fixar um font-size inline/herdado direto
       (p/span/td/li/a) - sem !important essas regras nunca vencem o
       style="font-size:Npx" que templates de sistema aplicam o tempo
       todo. Fica de fora <h1>-<h6>, <font size=...> e qualquer coisa com
       classe/estilo que declare escala (ex: assinatura com fonte grande
       de proposito) nao e sobrescrito por essas tags especificas. */
    body { font-size: 14px; line-height: 1.55; }
    p, span, td, th, li, a {
      font-size: 14px !important; line-height: 1.55 !important;
    }
    /* ...mas nao dentro de um titulo de verdade (h1-h6) - senao um <span>
       usado pra colorir parte de um titulo grande ficava do tamanho do
       texto normal, quebrando a hierarquia que o remetente quis dar. */
    h1, h1 *, h2, h2 *, h3, h3 *, h4, h4 *, h5, h5 *, h6, h6 * {
      font-size: revert !important; line-height: revert !important;
    }
  `
}

// Corpo HTML de e-mail nunca é confiável (pode vir com <script>, tracking
// pixel, CSS agressivo) — renderizado num iframe sandboxed sem
// allow-scripts/allow-same-origin em vez de dangerouslySetInnerHTML.
//
// A altura acompanha o conteúdo real (scrollHeight do documento interno) e
// é remedida quando o usuário abre/fecha um <details> de colapso — sem isso
// expandir o histórico deixaria o conteúdo cortado dentro do iframe.
function CorpoHtmlIsolado({ html, escuro, onImagem }) {
  const wrapRef = useRef(null)
  const iframeRef = useRef(null)
  const [altura, setAltura] = useState(200)
  // O e-mail renderiza na largura natural dele (newsletters usam 600-800px
  // fixos). Se isso for mais largo que o painel, escala tudo pra caber
  // (transform: scale), como o Gmail faz no mobile — nada de scroll lateral.
  const [larguraConteudo, setLarguraConteudo] = useState(0)
  const [larguraDisponivel, setLarguraDisponivel] = useState(0)
  const [pronto, setPronto] = useState(false)

  // Palpite de largura extraido do proprio HTML (width=/max-width= das tabelas
  // de layout) ANTES de renderizar — evita o "flash grande" de ~2s ate a
  // medicao real. So um chute; a medicao no load corrige.
  const larguraPalpite = medirLarguraDoHtml(html)

  useEffect(() => {
    setPronto(false)
    const iframe = iframeRef.current
    if (!iframe) return
    function medir() {
      try {
        const doc = iframe.contentWindow?.document
        if (!doc?.body) return
        setAltura(doc.body.scrollHeight + 20)
        setLarguraConteudo(medirLarguraReal(doc))
        setPronto(true)
      } catch { /* sandbox pode bloquear leitura em casos raros */ }
    }
    function aoCarregar() {
      medir()
      setTimeout(medir, 150)
      setTimeout(medir, 600)
      try {
        const win = iframe.contentWindow
        win?.document?.querySelectorAll('img').forEach(img => {
          if (!img.complete) img.addEventListener('load', medir, { once: true })
        })
        // Clique numa imagem do corpo abre o lightbox em tamanho real.
        // So imagens com algum tamanho (ignora spacer/pixel de tracking).
        const doc = win?.document
        if (doc) {
          doc.body.addEventListener('click', e => {
            // 1) Link: SEMPRE abre no navegador do sistema, nunca dentro do
            //    iframe (o sandbox so permite navegar o proprio iframe, e o
            //    site clicado costuma bloquear <iframe> -> iframe fica branco
            //    e o e-mail "some"). Era exatamente esse o bug relatado.
            // <area href> cobre imagem com mapa de links clicaveis (layout
            // antigo de newsletter): o clique nao cai num <a>, cai na propria
            // <img usemap>, mas o browser resolve pra o <area> correspondente
            // via elementFromPoint - closest() sozinho nao pega isso.
            const link = e.target?.closest?.('a[href]')
              || (e.target?.tagName === 'IMG' && e.target.useMap
                ? doc.querySelector(`map[name="${e.target.useMap.replace(/^#/, '')}"] area[href]`)
                : null)
            if (link) {
              const href = link.getAttribute('href') || ''
              e.preventDefault()
              if (/^(https?:|mailto:|tel:)/i.test(href)) {
                window.api.sistema.abrirLink(href)
              }
              return
            }
            // 2) Imagem: abre o lightbox em tamanho real (ignora spacer/pixel).
            const alvo = e.target
            if (alvo?.tagName === 'IMG' && (alvo.naturalWidth > 40 || alvo.naturalHeight > 40)) {
              e.preventDefault()
              onImagem?.(alvo.currentSrc || alvo.src)
            }
          })
          // Cursor de "ampliavel" nas imagens grandes.
          doc.querySelectorAll('img').forEach(img => {
            if (img.naturalWidth > 40 || img.naturalHeight > 40 || !img.complete) img.style.cursor = 'zoom-in'
          })
          // Reforco: todo link ganha target=_blank e rel de seguranca, e um
          // <base target=_blank> no head cobre o que for injetado depois.
          doc.querySelectorAll('a[href]').forEach(a => {
            a.setAttribute('target', '_blank')
            a.setAttribute('rel', 'noopener noreferrer')
          })
        }
      } catch { /* ignora */ }
    }
    iframe.addEventListener('load', aoCarregar)
    const css = cssTema(escuro)
    // <base target="_blank">: qualquer link sem target definido nao tenta
    // navegar o proprio iframe (que ficaria branco). A interceptacao de
    // clique acima ja abre no navegador do sistema; isto e a rede de baixo.
    const head = `<base target="_blank"><style>${css}</style>`
    const doc = /<head[^>]*>/i.test(html)
      ? html.replace(/<head[^>]*>/i, m => `${m}${head}`)
      : `<head>${head}</head>${html}`
    iframe.srcdoc = doc
    return () => iframe.removeEventListener('load', aoCarregar)
  }, [html, escuro])

  // useLayoutEffect: mede a largura ANTES do browser pintar, entao o scale
  // ja sai certo no primeiro frame (com useEffect havia um flash de 1 tick).
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const medir = () => setLarguraDisponivel(el.clientWidth)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Largura disponivel: o state, ou (no primeiro render, antes do state) o
  // clientWidth direto do wrapper.
  const dispEfetiva = larguraDisponivel || wrapRef.current?.clientWidth || 0
  // So ESCALA com base na medicao REAL (larguraConteudo), nunca so no
  // palpite do HTML cru — o palpite pega qualquer width= grande (inclusive
  // de tabela de assinatura) e encolhia o e-mail inteiro antes da medicao
  // real corrigir. O palpite fica so pra pre-dimensionar o iframe.
  const larguraEfetiva = larguraConteudo || 0
  // So escala quando o conteudo e MESMO mais largo que o painel por uma
  // margem relevante (>24px), e so depois de medido de verdade. Sintoma
  // que isso corrige: e-mail comum com assinatura de logos aparecendo
  // minusculo em producao (imagens da assinatura carregam da rede e
  // inflavam o scrollWidth medido).
  const precisaEscalar = larguraEfetiva > 0 && dispEfetiva > 0 && larguraEfetiva > dispEfetiva + 24
  const escalaBruta = precisaEscalar ? dispEfetiva / larguraEfetiva : 1
  // Piso de legibilidade: abaixo disso o TEXTO fica minusculo demais so
  // porque 1 tabela de assinatura/layout e larga (era exatamente a
  // reclamacao "hora com letra pequena"). Quando o calculo pediria encolher
  // mais que isso, mantem o e-mail no tamanho normal e deixa ele rolar na
  // horizontal (igual Gmail/Outlook web fazem com newsletter larga) em vez
  // de miniaturizar o texto inteiro.
  const PISO_ESCALA = 0.8
  const escala = escalaBruta < PISO_ESCALA ? 1 : escalaBruta
  const rolaNaHorizontal = escalaBruta < PISO_ESCALA && precisaEscalar
  const larguraIframe = escala < 1 ? larguraEfetiva : (rolaNaHorizontal ? larguraEfetiva : '100%')

  return (
    <div
      ref={wrapRef}
      style={{ width: '100%', height: altura * escala, overflow: rolaNaHorizontal ? 'auto' : 'hidden' }}
    >
      <iframe
        ref={iframeRef}
        sandbox="allow-same-origin"
        style={{
          width: larguraIframe,
          height: altura,
          border: 'none',
          background: escuro ? '#1c1c1c' : '#fff',
          display: 'block',
          transform: escala < 1 ? `scale(${escala})` : undefined,
          transformOrigin: 'top left',
          // Fica invisivel so no primeiro frame, ate o palpite/medicao valerem.
          visibility: pronto || larguraPalpite ? 'visible' : 'hidden',
        }}
      />
    </div>
  )
}

// Chute rapido da largura de layout do e-mail a partir do HTML cru: pega o
// maior width=/max-width fixo em px de tabelas/containers. So heuristica pra
// aplicar o scale de imediato; a medicao real no load ajusta.
function medirLarguraDoHtml(html) {
  if (!html) return 0
  let max = 0
  const re = /(?:max-)?width\s*[:=]\s*["']?\s*(\d{3,4})(?:px)?/gi
  let m
  while ((m = re.exec(html))) {
    const v = parseInt(m[1], 10)
    if (v >= 480 && v <= 1600 && v > max) max = v
  }
  return max
}

// Largura REAL do e-mail depois de carregado. `body.scrollWidth` sozinho
// mente: uma assinatura com varios logos lado a lado, ou uma imagem larga
// sem width, infla o scrollWidth mesmo quando o conteudo cabe encolhendo as
// imagens — foi o que fazia o e-mail comum ser escalado a 50% em producao
// (onde os logos da assinatura carregam da rede depois da 1a medicao).
//
// Aqui ignoramos <img> (elas encolhem sozinhas via CSS: img{max-width:100%})
// e medimos so o que e RIGIDO e largo: <table> de layout e blocos com
// width/min-width fixo em px. So esses justificam o transform: scale.
function medirLarguraReal(doc) {
  const body = doc.body
  if (!body) return 0
  let max = 0
  const candidatos = doc.querySelectorAll('table, div, td, center, [style*="width"]')
  for (const el of candidatos) {
    if (el.querySelector('img') && !el.querySelector('table')) {
      // Container cujo unico "peso" sao imagens: elas encolhem, ignora.
      const soImagens = [...el.children].every(c => c.tagName === 'IMG' || c.tagName === 'BR' || !c.textContent.trim())
      if (soImagens) continue
    }
    const w = el.scrollWidth || 0
    // Ignora larguras absurdas (layout quebrado) e as menores que um
    // painel tipico — nao vale a pena escalar por causa delas.
    if (w > max && w <= 2000) max = w
  }
  // Nunca menos que a largura visivel do proprio body (conteudo simples).
  return Math.max(max, body.clientWidth || 0)
}

// Lê a classe do <html> e reage a trocas de tema em tempo real.
function useTemaEscuro() {
  const [escuro, setEscuro] = useState(() => !document.documentElement.classList.contains('light'))
  useEffect(() => {
    const alvo = document.documentElement
    const obs = new MutationObserver(() => setEscuro(!alvo.classList.contains('light')))
    obs.observe(alvo, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return escuro
}

// Linha "Para:" / "Cc:" com recolhimento quando há muitos destinatários —
// mostra os 3 primeiros e um "+N" que expande o resto.
function LinhaDestinatarios({ rotulo, lista }) {
  const [expandido, setExpandido] = useState(false)
  if (!lista?.length) return null
  const emails = lista.map(d => d.nome ? `${d.nome} <${d.email}>` : d.email)
  const visiveis = expandido ? emails : emails.slice(0, 3)
  const resto = emails.length - visiveis.length
  return (
    <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2, lineHeight: 1.5 }}>
      <span style={{ fontWeight: 600 }}>{rotulo}: </span>
      {visiveis.join(', ')}
      {resto > 0 && (
        <button
          onClick={() => setExpandido(true)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--or)', fontSize: 11.5, fontWeight: 600, padding: '0 0 0 4px' }}
        >
          +{resto}
        </button>
      )}
      {expandido && emails.length > 3 && (
        <button
          onClick={() => setExpandido(false)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--t3)', fontSize: 11.5, padding: '0 0 0 6px' }}
        >
          recolher
        </button>
      )}
    </div>
  )
}

export default function LeitorMensagem({
  mensagem, etiquetasDisponiveis = [],
  onAplicarEtiqueta, onRemoverEtiqueta, onSinalizar,
  onResponder, onResponderTodos, onEncaminhar,
}) {
  const escuro = useTemaEscuro()
  const [menuEtiquetaAberto, setMenuEtiquetaAberto] = useState(false)
  // Lightbox de imagem do corpo — src da imagem clicada, ou null.
  const [imagemAmpliada, setImagemAmpliada] = useState(null)
  useEffect(() => {
    if (!imagemAmpliada) return
    const esc = e => { if (e.key === 'Escape') setImagemAmpliada(null) }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [imagemAmpliada])
  // Cabecalho recolhivel: esconde as acoes (Responder/Encaminhar/etiquetas)
  // e as linhas Para/Cc, deixando so assunto + remetente + data. Preferencia
  // per-viewer, lembrada no localStorage.
  const [cabecalhoRecolhido, setCabecalhoRecolhido] = useState(() => {
    try { return localStorage.getItem('email-leitor-cabecalho-recolhido') === '1' } catch { return false }
  })
  const toggleCabecalho = () => setCabecalhoRecolhido(v => {
    const novo = !v
    try { localStorage.setItem('email-leitor-cabecalho-recolhido', novo ? '1' : '0') } catch { /* ignora */ }
    return novo
  })

  if (!mensagem) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--t3)' }}>
        <MailOpen size={32} strokeWidth={1.5} />
        <span style={{ fontSize: 13 }}>Selecione um e-mail para ler</span>
      </div>
    )
  }

  const temMuitosDestino = (mensagem.destinatarios?.length || 0) + (mensagem.copia?.length || 0) > 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Cabecalho fixo no topo; so o corpo + anexos rolam. */}
      <div className={`email-leitor-cabecalho${cabecalhoRecolhido ? ' recolhido' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div className="email-leitor-assunto" style={{ textWrap: cabecalhoRecolhido ? 'nowrap' : 'balance', minWidth: 0 }}>
            {mensagem.assunto || '(sem assunto)'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, paddingTop: 2 }}>
            <span style={{ fontSize: 11.5, color: 'var(--t3)', whiteSpace: 'nowrap' }}>{fmtDataLonga(mensagem.data_envio)}</span>
            {onSinalizar && (
              <button
                onClick={() => onSinalizar(mensagem.id, !mensagem.sinalizada)}
                style={{ display: 'flex', border: 'none', background: 'transparent', cursor: 'pointer', color: mensagem.sinalizada ? '#f5b400' : 'var(--t3)' }}
                title={mensagem.sinalizada ? 'Remover sinalização' : 'Sinalizar'}
              >
                <Star size={17} fill={mensagem.sinalizada ? '#f5b400' : 'none'} />
              </button>
            )}
            <button
              className={`toggle-recolher${cabecalhoRecolhido ? ' is-recolhido' : ''}`}
              onClick={toggleCabecalho}
              title={cabecalhoRecolhido ? 'Expandir cabeçalho' : 'Recolher cabeçalho'}
              style={{ transform: 'rotate(-90deg)' }}
            >
              <span className="toggle-recolher-icon"><ChevronLeft size={11} strokeWidth={2.5} /></span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: cabecalhoRecolhido ? 8 : 14 }}>
          <div style={{
            width: cabecalhoRecolhido ? 26 : 40, height: cabecalhoRecolhido ? 26 : 40, borderRadius: '30%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: corAvatarTint(corAvatar(mensagem.remetente_nome, mensagem.remetente_email)), color: corAvatar(mensagem.remetente_nome, mensagem.remetente_email),
            fontSize: cabecalhoRecolhido ? 11 : 14, fontWeight: 700, transition: 'width .16s, height .16s, font-size .16s',
          }}>
            {iniciais(mensagem.remetente_nome, mensagem.remetente_email)}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--t2)', minWidth: 0, flex: 1 }}>
            <div>
              <strong style={{ color: 'var(--t1)', fontWeight: 600 }}>{nomeOuEmail(mensagem.remetente_nome, mensagem.remetente_email)}</strong>
              {' '}
              <span style={{ color: 'var(--t3)' }}>&lt;{mensagem.remetente_email}&gt;</span>
            </div>
            {!cabecalhoRecolhido && <LinhaDestinatarios rotulo="Para" lista={mensagem.destinatarios} />}
            {!cabecalhoRecolhido && <LinhaDestinatarios rotulo="Cc" lista={mensagem.copia} />}
            {/* Status de envio — so em mensagens enviadas por aqui. Mostra
                a resposta do servidor (o id serve pra rastrear no painel do
                provedor) e destaca destinatarios recusados, se houver. */}
            {!cabecalhoRecolhido && mensagem.origem === 'enviado' && (mensagem.smtp_response || (mensagem.smtp_rejeitados || []).length > 0) && (
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4, lineHeight: 1.5 }}>
                {mensagem.smtp_response && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Send size={11} style={{ flexShrink: 0, color: 'var(--green)' }} />
                    <span style={{ fontFamily: 'var(--fm, monospace)' }}>{mensagem.smtp_response}</span>
                  </div>
                )}
                {(mensagem.smtp_rejeitados || []).length > 0 && (
                  <div style={{ color: 'var(--red)', marginTop: 2 }}>
                    Recusados pelo servidor: {(mensagem.smtp_rejeitados || []).join(', ')}
                  </div>
                )}
              </div>
            )}
            {/* Caixa de Saida: e-mail que ainda NAO saiu — mostra o motivo
                (fila com proxima tentativa, ou falha permanente). */}
            {!cabecalhoRecolhido && mensagem.origem === 'enviado' && ['fila', 'enviando', 'erro'].includes(mensagem.envio_status) && (() => {
              const s = descreverStatusSaida(mensagem)
              return (
                <div style={{ fontSize: 11, color: s.corInline, marginTop: 4, lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                  <Send size={11} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span><strong>{s.rotulo}.</strong> {s.detalhe}</span>
                </div>
              )
            })()}
            {!cabecalhoRecolhido && (mensagem.etiquetas || []).length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {(mensagem.etiquetas || []).map(etq => (
                  <span key={etq.id} className="email-chip" style={{ background: `${etq.cor}1f`, color: etq.cor, padding: '3px 9px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: etq.cor, flexShrink: 0 }} />
                    {etq.nome}
                    <button onClick={() => onRemoverEtiqueta?.(etq.id)} style={{ display: 'flex', border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit', padding: 0 }} title="Remover etiqueta">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Acoes compactas (so icone) — sempre nesta posicao, recolhido ou nao */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button className="btn btn-ghost" style={{ height: 28, width: 28, padding: 0 }} onClick={onResponder} title="Responder">
              <Reply size={13} />
            </button>
            {temMuitosDestino && (
              <button className="btn btn-ghost" style={{ height: 28, width: 28, padding: 0 }} onClick={onResponderTodos} title="Responder a todos">
                <ReplyAll size={13} />
              </button>
            )}
            <button className="btn btn-ghost" style={{ height: 28, width: 28, padding: 0 }} onClick={onEncaminhar} title="Encaminhar">
              <Forward size={13} />
            </button>
            {etiquetasDisponiveis.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-ghost"
                  style={{ height: 28, width: 28, padding: 0 }}
                  onClick={() => setMenuEtiquetaAberto(v => !v)}
                  title="Aplicar etiqueta"
                >
                  <Tag size={13} />
                </button>
                {menuEtiquetaAberto && (
                  <div style={{
                    position: 'absolute', top: '110%', right: 0, zIndex: 30, minWidth: 180,
                    background: 'var(--s1)', border: '1px solid var(--bd2)', borderRadius: 8, boxShadow: 'var(--sh-lg)', padding: 4,
                  }}>
                    {achatarEtiquetasEmArvore(etiquetasDisponiveis).filter(e => !(mensagem.etiquetas || []).some(m => m.id === e.id)).map(etq => (
                      <button
                        key={etq.id}
                        onClick={() => { onAplicarEtiqueta?.(etq.id); setMenuEtiquetaAberto(false) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', paddingLeft: 8 + etq.nivel * 14, borderRadius: 6,
                          border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--t1)', textAlign: 'left',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--s2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: etq.cor, flexShrink: 0 }} />
                        {etq.nome}
                      </button>
                    ))}
                    {etiquetasDisponiveis.every(e => (mensagem.etiquetas || []).some(m => m.id === e.id)) && (
                      <div style={{ padding: '6px 8px', fontSize: 11.5, color: 'var(--t3)' }}>Todas já aplicadas.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Area rolavel: so o corpo. Cabecalho fixo acima, anexos fixos abaixo.
          Fundo = o mesmo do painel (var(--s1)); nao pintar de --bg aqui,
          senao quando o e-mail e curto sobra um bloco branco gigante abaixo
          do cartao (a area estica com flex:1). */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: 'var(--s1)' }}>
        {/* Corpo dentro de um cartão de papel (cantos arredondados, sombra,
            fundo próprio do tema — claro no light, cinza-escuro sóbrio no
            dark). O cartão cresce com a altura real do conteúdo (ver
            CorpoHtmlIsolado); não há scroll dentro do cartão. */}
        <div style={{ padding: '18px 24px 24px' }}>
          {mensagem.corpo_html && mensagem.corpo_html.replace(/<[^>]*>/g, '').trim() ? (
            // Newsletters largas sao escaladas pra caber (ver CorpoHtmlIsolado),
            // sem scroll horizontal.
            <div style={{ background: escuro ? '#1c1c1c' : '#fff', borderRadius: 12, boxShadow: 'var(--sh-sm)', border: '1px solid var(--bd)', overflow: 'hidden' }}>
              <CorpoHtmlIsolado html={mensagem.corpo_html} escuro={escuro} onImagem={setImagemAmpliada} />
            </div>
          ) : (mensagem.corpo_texto || '').trim() ? (
            <div style={{ background: escuro ? '#1c1c1c' : '#fff', borderRadius: 12, boxShadow: 'var(--sh-sm)', border: '1px solid var(--bd)', padding: '22px 28px' }}>
              <div style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{mensagem.corpo_texto}</div>
            </div>
          ) : (
            // E-mail sem corpo (tipico de convite de reuniao .ics, ou
            // mensagem so com anexo). Nao deixa o cartao vazio.
            <div style={{ background: escuro ? '#1c1c1c' : '#fff', borderRadius: 12, boxShadow: 'var(--sh-sm)', border: '1px solid var(--bd)', padding: '28px', textAlign: 'center', color: 'var(--t3)' }}>
              <MailOpen size={26} strokeWidth={1.5} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 13 }}>Este e-mail não tem texto no corpo.</div>
              {mensagem.anexos?.length > 0 && (
                <div style={{ fontSize: 12, marginTop: 6 }}>
                  O conteúdo pode estar {mensagem.anexos.length === 1 ? 'no anexo abaixo' : 'nos anexos abaixo'}.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Anexos: rodape fino e discreto, fora do scroll, na base.
          Rotulo + arquivos numa linha so; tipografia do menu lateral. */}
      {mensagem.anexos?.length > 0 && (
        <div style={{ borderTop: '1px solid var(--bd)', background: 'var(--s1)', minHeight: 'var(--email-footer-h, 38px)', boxSizing: 'border-box', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 10, overflowX: 'auto', overflowY: 'hidden', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--fb)', fontSize: 8.5, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: 'var(--t3)', flexShrink: 0 }}>
            Anexos ({mensagem.anexos.length})
          </span>
          {mensagem.anexos.map(a => (
            <AnexoBotao key={a.id} anexo={a} />
          ))}
          {mensagem.anexos.length > 1 && (
            <button
              className="btn btn-ghost"
              style={{ height: 28, fontSize: 11.5, padding: '0 10px', flexShrink: 0 }}
              onClick={() => salvarTodosAnexos(mensagem.anexos)}
              title="Salvar todos os anexos numa pasta"
            >
              <DownloadCloud size={13} style={{ flexShrink: 0, color: 'var(--t3)' }} />
              Salvar todos
            </button>
          )}
        </div>
      )}

      {/* Lightbox: imagem do corpo em tamanho natural, sobre um fundo
          escuro. Clique fora ou Esc fecha. Rola se a imagem for maior que
          a tela. */}
      {imagemAmpliada && createPortal(
        <div
          onClick={() => setImagemAmpliada(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,.82)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
            overflow: 'auto', cursor: 'zoom-out',
          }}
        >
          <button
            onClick={e => { e.stopPropagation(); setImagemAmpliada(null) }}
            title="Fechar"
            style={{
              position: 'fixed', top: 16, right: 16, width: 34, height: 34, borderRadius: 8,
              border: 'none', background: 'rgba(255,255,255,.12)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
          <img
            src={imagemAmpliada}
            alt=""
            onClick={e => e.stopPropagation()}
            style={{ display: 'block', maxWidth: 'none', boxShadow: '0 12px 48px rgba(0,0,0,.5)', borderRadius: 4, cursor: 'default' }}
          />
        </div>,
        document.body
      )}
    </div>
  )
}
