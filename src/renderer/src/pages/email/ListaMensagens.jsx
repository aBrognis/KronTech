import { useState } from 'react'
import { Search, Paperclip, MailOpen, Mail as MailIcon, X, Loader2, ChevronDown, ChevronRight, ChevronLeft, Layers, Tag, Archive, Trash2, MoreVertical, CheckCheck, Star, SlidersHorizontal, Send, Pencil, AlertTriangle } from 'lucide-react'
import { fmtDataCurta, iniciais, nomeOuEmail, achatarEtiquetasEmArvore, corAvatar, corAvatarTint, descreverStatusSaida } from './utils'

const TAMANHOS_PAGINA = [25, 50, 100, 200]

// Variante compacta do PaginacaoBar genérico (components/PaginacaoBar.jsx),
// tudo em uma única linha — a coluna de e-mail tem só 340px, então cada
// elemento aqui é reduzido ao essencial (sem label "Por página", texto
// "Pág." abreviado) pra caber sem cortar nas bordas.
function PaginacaoCompacta({ pagina, totalPaginas, total, porPagina, onPagina, onPorPagina }) {
  return (
    <div style={{ width: '100%', boxSizing: 'border-box', flexShrink: 0, height: 'var(--email-footer-h, 38px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '0 10px', borderTop: '1px solid var(--bd)', background: 'var(--s1)', fontSize: 11, color: 'var(--t3)' }}>
      <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>Total: <strong style={{ color: 'var(--t1)', fontWeight: 700 }}>{total.toLocaleString('pt-BR')}</strong></span>

      <select className="form-select" style={{ width: 50, height: 22, fontSize: 11, padding: '0 2px', textAlign: 'center', textAlignLast: 'center', flexShrink: 0 }}
        value={porPagina} onChange={e => onPorPagina(Number(e.target.value))} title="Itens por página">
        {TAMANHOS_PAGINA.map(n => <option key={n} value={n}>{n}</option>)}
      </select>

      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        <button className="btn btn-ghost" style={{ height: 22, width: 22, padding: 0 }}
          onClick={() => onPagina(pagina - 1)} disabled={pagina <= 1} title="Página anterior">
          <ChevronLeft size={12} />
        </button>
        <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: 'var(--t2)', fontWeight: 500 }}>{pagina}/{totalPaginas}</span>
        <button className="btn btn-ghost" style={{ height: 22, width: 22, padding: 0 }}
          onClick={() => onPagina(pagina + 1)} disabled={pagina >= totalPaginas} title="Próxima página">
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  )
}

// Linha da Caixa de Saida: mostra o DESTINATARIO (nao o remetente, que sou
// eu), o status ("Na fila / nova tentativa em X" ou "Falhou: <motivo>") e
// acoes por item (reenviar agora, editar, descartar).
function ItemSaida({ m, ativa, onSelecionar, onReenviar, onEditar, onDescartar, ocupado }) {
  const status = descreverStatusSaida(m)
  const dest = (m.destinatarios || []).map(d => d.nome?.trim() || d.email).filter(Boolean)
  const destLabel = dest.length ? dest.join(', ') : '(sem destinatário)'
  const classes = ['email-item-linha']
  if (ativa) classes.push('ativa')

  return (
    <div className={classes.join(' ')} style={{ display: 'flex', alignItems: 'stretch', gap: 4 }}>
      <button
        onClick={() => onSelecionar(m.id)}
        style={{ display: 'flex', gap: 10, flex: 1, minWidth: 0, textAlign: 'left', padding: '9px 8px 9px 13px', border: 'none', background: 'transparent', cursor: 'pointer' }}
      >
        <div style={{
          width: 29, height: 29, borderRadius: '30%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--s3)', color: status.corInline, fontSize: 11, fontWeight: 700, marginTop: 1,
        }}>
          {status.aguardando
            ? (m.envio_status === 'enviando' ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />)
            : <AlertTriangle size={13} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
              Para: {destLabel}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: status.corInline, flexShrink: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {status.rotulo}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
            {m.assunto || '(sem assunto)'}
          </div>
          {status.detalhe && (
            <div style={{ fontSize: 10.5, color: status.corInline, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={status.detalhe}>
              {status.detalhe}
            </div>
          )}
        </div>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, padding: '0 6px', flexShrink: 0 }}>
        <button className="btn btn-ghost" style={{ height: 24, width: 24, padding: 0 }} disabled={ocupado}
          onClick={e => { e.stopPropagation(); onReenviar(m.id) }} title="Reenviar agora">
          <Send size={12} />
        </button>
        <button className="btn btn-ghost" style={{ height: 24, width: 24, padding: 0 }} disabled={ocupado}
          onClick={e => { e.stopPropagation(); onEditar(m.id) }} title="Editar e reenviar">
          <Pencil size={12} />
        </button>
        <button className="btn btn-ghost" style={{ height: 24, width: 24, padding: 0, color: 'var(--red)' }} disabled={ocupado}
          onClick={e => { e.stopPropagation(); onDescartar(m.id) }} title="Descartar">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

function ItemMensagem({ m, ativa, selecionada, onSelecionar, onToggleSelecao, contadorThread, expandivel, expandida, onToggleExpandir, semBorda, etiquetasDoItem, nomeConta, onSinalizar, getDragIds }) {
  const [arrastando, setArrastando] = useState(false)
  const classes = ['email-item-linha']
  if (ativa) classes.push('ativa')
  if (selecionada) classes.push('selecionada')

  // Arrastar a linha para cima de uma etiqueta na navegacao lateral. Se este
  // e-mail esta na selecao atual, arrasta a selecao inteira; senao, so ele.
  // Monta um "fantasma" proprio, compacto e opaco, em vez do screenshot
  // translucido que o Chromium gera da linha inteira (que sai quase
  // invisivel e ainda deixa a linha real parada, parecendo marca d'agua).
  function handleDragStart(e) {
    const ids = getDragIds ? getDragIds(m.id) : [m.id]
    e.dataTransfer.setData('application/x-email-ids', ids.join(','))
    e.dataTransfer.effectAllowed = 'link'

    // Fantasma estilo Outlook: cartao com icone de e-mail + assunto da
    // mensagem "pegada"; quando ha varios selecionados, um badge redondo
    // com a contagem no canto.
    const fantasma = document.createElement('div')
    fantasma.className = 'email-drag-fantasma'
    const icone = document.createElement('span')
    icone.className = 'email-drag-fantasma-icone'
    icone.textContent = '✉' // envelope
    const texto = document.createElement('span')
    texto.className = 'email-drag-fantasma-texto'
    texto.textContent = m.assunto || '(sem assunto)'
    fantasma.appendChild(icone)
    fantasma.appendChild(texto)
    if (ids.length > 1) {
      const badge = document.createElement('span')
      badge.className = 'email-drag-fantasma-badge'
      badge.textContent = ids.length
      fantasma.appendChild(badge)
    }
    document.body.appendChild(fantasma)
    e.dataTransfer.setDragImage(fantasma, 16, 16)
    // remove no proximo frame: ja foi capturado como imagem de arraste
    requestAnimationFrame(() => fantasma.remove())

    setArrastando(true)
  }

  return (
    <div
      className={classes.join(' ')}
      style={{ display: 'flex', alignItems: 'stretch', gap: 4, marginBottom: semBorda ? 0 : undefined, opacity: arrastando ? 0.9 : undefined }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setArrastando(false)}
    >
      <label
        className="email-item-checkbox"
        style={{ display: 'flex', alignItems: 'center', paddingLeft: 12, cursor: 'pointer' }}
        onClick={e => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={selecionada}
          onClick={e => { e.stopPropagation(); onToggleSelecao(m.id, { shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey }) }}
          onChange={() => {}}
        />
      </label>
      {expandivel && (
        <button
          onClick={e => { e.stopPropagation(); onToggleExpandir() }}
          style={{ display: 'flex', alignItems: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--t3)', padding: 0 }}
          title={expandida ? 'Recolher conversa' : 'Expandir conversa'}
        >
          {expandida ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
      )}
      {onSinalizar && (
        <button
          onClick={e => { e.stopPropagation(); onSinalizar(m.id, !m.sinalizada) }}
          style={{ display: 'flex', alignItems: 'center', border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 2px', color: m.sinalizada ? '#f5b400' : 'var(--t3)' }}
          title={m.sinalizada ? 'Remover sinalização' : 'Sinalizar'}
        >
          <Star size={14} fill={m.sinalizada ? '#f5b400' : 'none'} />
        </button>
      )}
      <button
        onClick={() => onSelecionar(m.id)}
        style={{
          display: 'flex', gap: 10, flex: 1, minWidth: 0, textAlign: 'left', padding: '9px 13px 9px 5px',
          border: 'none', background: 'transparent', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 29, height: 29, borderRadius: '30%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: corAvatarTint(corAvatar(m.remetente_nome, m.remetente_email)), color: corAvatar(m.remetente_nome, m.remetente_email), fontSize: 10.5, fontWeight: 700, marginTop: 1,
          opacity: m.lida ? 0.55 : 1,
        }}>
          {iniciais(m.remetente_nome, m.remetente_email)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 5, overflow: 'hidden', minWidth: 0 }}>
              <span style={{ fontSize: 12.5, fontWeight: m.lida ? 500 : 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nomeOuEmail(m.remetente_nome, m.remetente_email)}
              </span>
              {nomeConta && (
                <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--t3)', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }} title={nomeConta}>
                  · {nomeConta}
                </span>
              )}
            </span>
            <span style={{ fontSize: 10.5, color: 'var(--t3)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{fmtDataCurta(m.data_envio)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
            <span style={{ fontSize: 12, color: m.lida ? 'var(--t3)' : 'var(--t1)', fontWeight: m.lida ? 400 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
              {m.assunto || '(sem assunto)'}
            </span>
            {contadorThread && (
              <span style={{ fontSize: 10.5, color: 'var(--t3)', flexShrink: 0, fontWeight: 600 }}>({contadorThread})</span>
            )}
            {m.tem_anexo && <Paperclip size={10.5} color="var(--t3)" style={{ flexShrink: 0 }} />}
            {etiquetasDoItem?.map(etq => (
              <span key={etq.id} style={{ width: 6, height: 6, borderRadius: '50%', background: etq.cor, flexShrink: 0 }} title={etq.nome} />
            ))}
          </div>
        </div>
      </button>
    </div>
  )
}

export default function ListaMensagens({
  mensagens, mensagemAtivaId, onSelecionar,
  busca, onBusca, apenasNaoLidas, onApenasNaoLidas,
  loading, pagina, totalPaginas, total, porPagina, onPagina, onPorPagina,
  selecionados, onToggleSelecao, onSelecionarTodosVisiveis, onLimparSelecao,
  onMarcarLidaLote, processandoLote,
  agrupado, onToggleAgrupado, threadsExpandidas, onToggleThread,
  etiquetas = [], etiquetasPorMensagem = {}, onAplicarEtiquetaLote,
  onArquivarLote, onExcluirLote, processandoPasta,
  mostrarConta, contasPorId = {},
  onSinalizar, apenasSinalizadas, onApenasSinalizadas, onBuscaAvancada, filtrosAvancados,
  modoSaida = false, onReenviarItem, onEditarItem, onDescartarItem, itemSaidaOcupado,
}) {
  const temSelecao = selecionados.size > 0
  const [menuEtiquetaAberto, setMenuEtiquetaAberto] = useState(false)
  const [menuMaisAberto, setMenuMaisAberto] = useState(false)

  // Ao arrastar uma linha: se ela faz parte da selecao atual, arrasta a
  // selecao inteira; caso contrario, arrasta so aquela mensagem.
  const getDragIds = (id) => (selecionados.has(id) ? Array.from(selecionados) : [id])

  // Caixa de Saida: lista enxuta, sem busca/filtros/selecao em massa, so os
  // itens da fila com status e acoes por item.
  if (modoSaida) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: 0, overflowX: 'hidden' }}>
        <div className="email-lista-scroll">
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)', fontSize: 12.5 }}>Carregando...</div>
          ) : !mensagens.length ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)', fontSize: 12.5 }}>A Caixa de Saída está vazia.</div>
          ) : (
            mensagens.map(m => (
              <ItemSaida
                key={m.id}
                m={m}
                ativa={m.id === mensagemAtivaId}
                onSelecionar={onSelecionar}
                onReenviar={onReenviarItem}
                onEditar={onEditarItem}
                onDescartar={onDescartarItem}
                ocupado={itemSaidaOcupado}
              />
            ))
          )}
        </div>
        <PaginacaoCompacta pagina={pagina} totalPaginas={totalPaginas} total={total} porPagina={porPagina} onPagina={onPagina} onPorPagina={onPorPagina} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: 0, overflowX: 'hidden' }}>
      <div className="email-lista-topo">
        {temSelecao ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t1)', marginRight: 2, flexShrink: 0 }}>
              {selecionados.size}
            </span>
            <button className="btn btn-ghost" style={{ height: 26, width: 26, padding: 0, flexShrink: 0 }}
              onClick={() => onMarcarLidaLote(true)} disabled={processandoLote} title="Marcar como lida">
              {processandoLote ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <MailOpen size={13} />}
            </button>
            <button className="btn btn-ghost" style={{ height: 26, width: 26, padding: 0, flexShrink: 0 }}
              onClick={() => onMarcarLidaLote(false)} disabled={processandoLote} title="Marcar como não lida">
              <MailIcon size={13} />
            </button>
            {onArquivarLote && (
              <button className="btn btn-ghost" style={{ height: 26, width: 26, padding: 0, flexShrink: 0 }}
                onClick={onArquivarLote} disabled={processandoLote || processandoPasta} title="Arquivar">
                <Archive size={13} />
              </button>
            )}
            {onExcluirLote && (
              <button className="btn btn-ghost" style={{ height: 26, width: 26, padding: 0, flexShrink: 0, color: 'var(--red)' }}
                onClick={e => onExcluirLote(e.shiftKey)} disabled={processandoLote || processandoPasta}
                title="Excluir (Shift para apagar definitivamente)">
                <Trash2 size={13} />
              </button>
            )}

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <button className="btn btn-ghost" style={{ height: 26, width: 26, padding: 0 }}
                  onClick={() => setMenuMaisAberto(v => !v)} title="Mais ações">
                  <MoreVertical size={13} />
                </button>
                {menuMaisAberto && (
                  <div style={{
                    position: 'absolute', top: '110%', right: 0, zIndex: 30, minWidth: 170,
                    background: 'var(--s1)', border: '1px solid var(--bd2)', borderRadius: 8, boxShadow: 'var(--sh-lg)', padding: 4,
                  }}>
                    <button
                      onClick={() => { onSelecionarTodosVisiveis(); setMenuMaisAberto(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--t1)', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--s2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <CheckCheck size={13} /> Selecionar todos
                    </button>
                    {etiquetas.length > 0 && (
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setMenuEtiquetaAberto(v => !v)}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--t1)', textAlign: 'left' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--s2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Tag size={13} /> Aplicar etiqueta
                        </button>
                        {menuEtiquetaAberto && (
                          <div style={{
                            position: 'absolute', top: 0, right: '100%', marginRight: 4, zIndex: 31, minWidth: 160,
                            background: 'var(--s1)', border: '1px solid var(--bd2)', borderRadius: 8, boxShadow: 'var(--sh-lg)', padding: 4,
                          }}>
                            {achatarEtiquetasEmArvore(etiquetas).map(etq => (
                              <button
                                key={etq.id}
                                onClick={() => { onAplicarEtiquetaLote(etq.id); setMenuEtiquetaAberto(false); setMenuMaisAberto(false) }}
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
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button className="btn btn-ghost" style={{ height: 26, width: 26, padding: 0 }} onClick={onLimparSelecao} title="Cancelar seleção">
                <X size={13} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
              <input
                className="form-input form-input-sm"
                placeholder="Buscar por assunto ou remetente..."
                value={busca}
                onChange={e => onBusca(e.target.value)}
                style={{ paddingLeft: 28, paddingRight: onBuscaAvancada ? 30 : undefined }}
              />
              {onBuscaAvancada && (
                <button
                  onClick={onBuscaAvancada}
                  style={{
                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', display: 'flex',
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    color: (filtrosAvancados?.remetente || filtrosAvancados?.dataInicio || filtrosAvancados?.dataFim || filtrosAvancados?.comAnexo) ? 'var(--or)' : 'var(--t3)',
                  }}
                  title="Busca avançada"
                >
                  <SlidersHorizontal size={13} />
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  className="btn btn-ghost"
                  style={{ height: 24, fontSize: 10.5, padding: '0 8px', color: apenasNaoLidas ? 'var(--or)' : 'var(--t2)' }}
                  onClick={() => onApenasNaoLidas(!apenasNaoLidas)}
                  title="Mostrar apenas mensagens não lidas"
                >
                  <MailIcon size={11} /> Não lidas
                </button>
                {onApenasSinalizadas && (
                  <button
                    className="btn btn-ghost"
                    style={{ height: 24, width: 24, padding: 0, color: apenasSinalizadas ? '#f5b400' : 'var(--t2)' }}
                    onClick={() => onApenasSinalizadas(!apenasSinalizadas)}
                    title="Mostrar apenas mensagens sinalizadas"
                  >
                    <Star size={13} fill={apenasSinalizadas ? '#f5b400' : 'none'} />
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {mensagens.length > 0 && (
                  <button
                    className="btn btn-ghost"
                    style={{ height: 24, fontSize: 10.5, padding: '0 8px' }}
                    onClick={onSelecionarTodosVisiveis}
                    title="Selecionar todas as mensagens desta página"
                  >
                    Selecionar todos
                  </button>
                )}
                <button
                  className="btn btn-ghost"
                  style={{ height: 24, fontSize: 10.5, padding: '0 8px', color: agrupado ? 'var(--or)' : 'var(--t2)' }}
                  onClick={onToggleAgrupado}
                  title="Agrupar por conversa"
                >
                  <Layers size={11} /> Agrupar
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="email-lista-scroll">
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)', fontSize: 12.5 }}>Carregando...</div>
        ) : !mensagens.length ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)', fontSize: 12.5 }}>Nenhuma mensagem.</div>
        ) : (
          mensagens.map(m => {
            const ehThread = agrupado && m.thread_total > 1
            const expandida = ehThread && threadsExpandidas[m.thread_grupo]
            return (
              <div key={m.id}>
                <ItemMensagem
                  m={m}
                  ativa={m.id === mensagemAtivaId}
                  selecionada={selecionados.has(m.id)}
                  onSelecionar={onSelecionar}
                  onToggleSelecao={onToggleSelecao}
                  contadorThread={ehThread ? m.thread_total : null}
                  expandivel={ehThread}
                  expandida={!!expandida}
                  onToggleExpandir={ehThread ? () => onToggleThread(m.thread_grupo) : undefined}
                  etiquetasDoItem={etiquetasPorMensagem[m.id]}
                  nomeConta={mostrarConta ? contasPorId[m.conta_id]?.nome : undefined}
                  onSinalizar={onSinalizar}
                  getDragIds={getDragIds}
                />
                {expandida && (
                  <div style={{ paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 3 }}>
                    {threadsExpandidas[m.thread_grupo].map(sub => (
                      <ItemMensagem
                        key={sub.id}
                        m={sub}
                        ativa={sub.id === mensagemAtivaId}
                        selecionada={selecionados.has(sub.id)}
                        onSelecionar={onSelecionar}
                        onToggleSelecao={onToggleSelecao}
                        semBorda
                        etiquetasDoItem={etiquetasPorMensagem[sub.id]}
                        nomeConta={mostrarConta ? contasPorId[sub.conta_id]?.nome : undefined}
                        onSinalizar={onSinalizar}
                        getDragIds={getDragIds}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <PaginacaoCompacta pagina={pagina} totalPaginas={totalPaginas} total={total} porPagina={porPagina} onPagina={onPagina} onPorPagina={onPorPagina} />
    </div>
  )
}
