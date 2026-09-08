import { useEffect, useState } from 'react'
import {
  SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw, Search,
} from 'lucide-react'
import FormToolbar from '../FormToolbar'
import PaginacaoBar from '../PaginacaoBar.jsx'
import MenuContextoGrid from '../MenuContextoGrid'
import { useCadastroPadrao } from './useCadastroPadrao'

/**
 * Tela de cadastro NATIVA do KronTech — mesmo layout, comportamento e
 * componentes das telas do sistema (Arquivos, Entidade), mas escrita como
 * pagina React dedicada (nao depende do motor do Designer).
 *
 * Abas SEMPRE em cima, na page-tabs: "Acesso", "Cadastro" e (se houver)
 * cada aba do formulario. Nada de sub-barra dentro do Cadastro.
 *
 * @param {object} props
 * @param {object} props.config            ver useCadastroPadrao
 * @param {string} props.tituloSingular    ex: "banco"
 * @param {Array}  props.colunas           [{ chave, label, largura?, align?, render?(reg) }]
 * @param {(ctx)=>JSX} [props.renderForm]  quando NAO ha abas de form. ctx = { form, setForm, isRO, erro }
 * @param {Array}  [props.abasForm]        [{ id, label, render(ctx) }] — cada uma vira aba de topo
 * @param {string} [props.buscaPlaceholder]
 * @param {object} [props.statusEmMassa]   { valores:[{valor,label}], aplicar(ids,valor) }
 */
export default function TelaCadastroPadrao({
  config,
  tituloSingular = 'registro',
  colunas,
  renderForm,
  abasForm,
  buscaPlaceholder = 'código, descrição...',
  statusEmMassa = null,
  newTrigger,
}) {
  const c = useCadastroPadrao(config)

  // aba ativa: 'acesso' | 'cadastro' | id de uma abaForm
  const [aba, setAba] = useState('cadastro')
  const abasFormIds = (abasForm || []).map((a) => a.id)
  const emCadastro = aba === 'cadastro' || abasFormIds.includes(aba)

  useEffect(() => {
    if (newTrigger) { c.openNew(); setAba(abasForm ? abasForm[0].id : 'cadastro') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTrigger])

  // ── menu de contexto (status em massa) ──────────────────────────────
  const [menuCtx, setMenuCtx] = useState(null)
  function abrirMenuLinha(e, id) {
    if (!statusEmMassa) return
    e.preventDefault()
    setMenuCtx({ x: e.clientX, y: e.clientY, alvoId: id })
  }
  function idsAlvoMenu() {
    if (!menuCtx) return []
    if (menuCtx.alvoId != null && !c.selecionados.has(menuCtx.alvoId)) return [menuCtx.alvoId]
    return [...c.selecionados]
  }
  async function aplicarStatus(valor) {
    const ids = idsAlvoMenu()
    setMenuCtx(null)
    if (!ids.length) return
    await statusEmMassa.aplicar(ids, valor)
    c.setSelecionados(new Set())
    await c.carregarAcesso()
    await c.carregarTudo()
  }

  const temSel = statusEmMassa != null
  const nColunas = colunas.length + (temSel ? 1 : 0)
  const ctx = { form: c.form, setForm: c.setForm, isRO: c.isRO, erro: c.erro }
  const abaFormAtiva = (abasForm || []).find((a) => a.id === aba) || (abasForm || [])[0]

  return (
    <div className="page-with-footer">
      <div className="page-tabs">
        <button className={`page-tab${aba === 'acesso' ? ' active' : ''}`} onClick={() => setAba('acesso')}>Acesso</button>
        {abasForm ? (
          abasForm.map((a) => (
            <button key={a.id} className={`page-tab${aba === a.id ? ' active' : ''}`} onClick={() => setAba(a.id)}>{a.label}</button>
          ))
        ) : (
          <button className={`page-tab${aba === 'cadastro' ? ' active' : ''}`} onClick={() => setAba('cadastro')}>Cadastro</button>
        )}
        {c.form.id && <span className="page-tab-info">{c.form.codigo || '----'} · {resumoForm(c.form, colunas)}</span>}
      </div>

      <div className="page-content">
        {c.erro && (
          <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(239,68,68,.4)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--red)' }}>
            {c.erro}
          </div>
        )}

        {aba === 'acesso' && (
          <>
            <div style={{ border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', boxShadow: 'var(--sh-xs)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => c.setFiltrosAbertos((a) => !a)}>
                <SlidersHorizontal size={13} color="var(--t2)" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Filtros</span>
                {c.buscaGeral.trim() && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: 'var(--or3)', color: 'var(--or)' }}>1 ativo</span>
                )}
                <div style={{ flex: 1 }} />
                {c.buscaGeral.trim() && (
                  <button type="button" className="btn btn-ghost" style={{ height: 24, padding: '0 8px', fontSize: 11 }}
                    onClick={(e) => { e.stopPropagation(); c.setBuscaGeral('') }}>
                    <RotateCcw size={11} /> Limpar
                  </button>
                )}
                {c.filtrosAbertos ? <ChevronUp size={13} color="var(--t3)" /> : <ChevronDown size={13} color="var(--t3)" />}
              </div>
              {c.filtrosAbertos && (
                <div style={{ padding: '4px 14px 14px', borderTop: '1px solid var(--bd)', paddingTop: 12 }}
                  onKeyDown={(e) => e.key === 'Enter' && c.carregarAcesso()}>
                  <div className="form-group" style={{ margin: 0, marginBottom: 12, maxWidth: 380 }}>
                    <label className="form-label">Busca geral</label>
                    <input className="form-input form-input-sm"
                      value={c.buscaGeral} onChange={(e) => c.setBuscaGeral(e.target.value)}
                      placeholder={buscaPlaceholder} />
                  </div>
                  <button type="button" className="btn btn-primary" style={{ height: 32, padding: '0 16px' }}
                    onClick={() => c.carregarAcesso()} disabled={c.fLoading}>
                    <Search size={13} /> {c.fLoading ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              )}
            </div>

            {c.fResultados === null ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)', border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)' }}>
                <div style={{ fontSize: 13 }}>Clique em Buscar para listar</div>
              </div>
            ) : (
              <div style={{ border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden', background: 'var(--s1)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        {temSel && (
                          <Th style={{ width: 40, textAlign: 'center' }}>
                            <input type="checkbox" checked={c.todosSelecionados} onChange={c.toggleSelecionarTodos}
                              title="Selecionar todos" style={{ cursor: 'pointer' }} />
                          </Th>
                        )}
                        {colunas.map((col) => (
                          <Th key={col.chave} style={{ width: col.largura, textAlign: col.align || 'left' }}>{col.label}</Th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {c.registrosPagina.map((r) => {
                        const marcado = c.selecionados.has(r.id)
                        return (
                          <tr key={r.id}
                            onDoubleClick={() => { c.selecionarLinha(r); setAba(abasForm ? abasForm[0].id : 'cadastro') }}
                            onContextMenu={(e) => abrirMenuLinha(e, r.id)}
                            style={{ cursor: 'pointer', background: marcado ? 'var(--or4, var(--s2))' : 'transparent' }}
                            onMouseEnter={(e) => { if (!marcado) e.currentTarget.style.background = 'var(--s2)' }}
                            onMouseLeave={(e) => { if (!marcado) e.currentTarget.style.background = 'transparent' }}>
                            {temSel && (
                              <Td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <input type="checkbox" checked={marcado} onChange={() => c.toggleSelecionado(r.id)} style={{ cursor: 'pointer' }} />
                              </Td>
                            )}
                            {colunas.map((col) => (
                              <Td key={col.chave} style={{ textAlign: col.align || 'left' }}>
                                {col.render ? col.render(r) : String(r[col.chave] ?? '')}
                              </Td>
                            ))}
                          </tr>
                        )
                      })}
                      {!c.fLoading && c.registrosPagina.length === 0 && (
                        <tr><td colSpan={nColunas} style={{ textAlign: 'center', padding: 32, color: 'var(--t3)', fontSize: 11, fontStyle: 'italic' }}>
                          Nenhum registro encontrado
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {c.selecionados.size > 0 && (
                  <div style={{ padding: '6px 14px', borderTop: '1px solid var(--bd)', fontSize: 11.5, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{c.selecionados.size} selecionado{c.selecionados.size !== 1 ? 's' : ''}. Clique com o botão direito na lista para alterar.</span>
                    <button className="btn btn-ghost" style={{ height: 22, fontSize: 10.5, padding: '0 8px' }} onClick={() => c.setSelecionados(new Set())}>Limpar seleção</button>
                  </div>
                )}
                <PaginacaoBar pagina={c.pagina} totalPaginas={c.totalPaginas} total={c.totalFiltrado} porPagina={c.porPagina}
                  onPagina={(p) => c.setPagina(p)} onPorPagina={(n) => { c.setPorPagina(n); c.setPagina(1) }} />
              </div>
            )}

            {statusEmMassa && (
              <MenuContextoGrid
                pos={menuCtx}
                onFechar={() => setMenuCtx(null)}
                titulo={`Alterar ${idsAlvoMenu().length} ${tituloSingular}${idsAlvoMenu().length !== 1 ? 's' : ''}`}
                itens={statusEmMassa.valores.map((v) => ({ label: v.label, onClick: () => aplicarStatus(v.valor) }))}
              />
            )}
          </>
        )}

        {emCadastro && (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
            {abasForm ? abaFormAtiva.render(ctx) : renderForm(ctx)}
          </div>
        )}
      </div>

      {emCadastro && (
        <FormToolbar
          mode={c.mode}
          nav={{ currentIdx: c.currentIdx, total: c.registros.length, onNav: c.navTo }}
          temRegistros={c.registros.length > 0}
          saving={c.saving}
          onIncluir={() => c.openNew()}
          onAlterar={() => c.setMode('edit')}
          onExcluir={() => c.setConfirmExcluir(true)}
          onConsultar={() => setAba('acesso')}
          onGravar={c.handleGravar}
          onDesistir={c.handleDesistir}
        />
      )}

      {c.confirmExcluir && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}>
          <div style={{ width: 380, background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px 10px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)' }}>Excluir {tituloSingular}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 6 }}>Esta ação não pode ser desfeita.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '14px 22px 20px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => c.setConfirmExcluir(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={c.confirmarExclusao}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── helpers ───────────────────────────────────────────────────────────
function resumoForm(form, colunas) {
  const primeira = colunas.find((col) => col.chave !== 'codigo' && !col.render)
  return primeira ? (form[primeira.chave] || '(sem nome)') : ''
}

function Th({ children, style }) {
  return <th style={{ padding: '7px 12px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1.2, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)', background: 'var(--s1)', textAlign: 'left', ...style }}>{children}</th>
}
function Td({ children, style, onClick }) {
  return <td onClick={onClick} style={{ padding: '9px 12px', color: 'var(--t2)', borderBottom: '1px solid var(--bd)', fontSize: 12.5, ...style }}>{children}</td>
}

// ── Componentes de formulario (padrao do sistema) ─────────────────────
// Secao/FormGrid vem de components/SecaoForm.jsx (compartilhado com as
// telas antigas). Reexportados aqui com os nomes que as telas de apoio ja
// usam, pra nao mexer nelas.
import SecaoForm, { FormBlocos } from '../SecaoForm'
export const Secao = SecaoForm
export const FormGrid = FormBlocos

// Coluna de span dentro da Secao: 1 = metade, 2/full = linha inteira.
function colSpan(span) {
  return span === 'full' || span === 2 ? '1 / -1' : 'span 1'
}

export function CampoTexto({ form, setForm, isRO, campo, label, placeholder, span = 1, maxLength, upper, hint }) {
  return (
    <div className="form-group" style={{ margin: 0, gridColumn: colSpan(span) }}>
      <label className="form-label">{label}{hint && <span style={{ color: 'var(--t3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}> {hint}</span>}</label>
      <input className="form-input" value={form[campo] ?? ''} disabled={isRO} maxLength={maxLength}
        onChange={(e) => setForm((f) => ({ ...f, [campo]: upper ? e.target.value.toUpperCase() : e.target.value }))}
        placeholder={placeholder} />
    </div>
  )
}
export function CampoNumero({ form, setForm, isRO, campo, label, placeholder, span = 1, sufixo, min, max, step = '1' }) {
  return (
    <div className="form-group" style={{ margin: 0, gridColumn: colSpan(span) }}>
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input className="form-input" type="number" step={step} min={min} max={max}
          value={form[campo] ?? ''} disabled={isRO}
          onChange={(e) => setForm((f) => ({ ...f, [campo]: e.target.value }))}
          placeholder={placeholder} style={{ paddingRight: sufixo ? 30 : undefined }} />
        {sufixo && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--t3)' }}>{sufixo}</span>}
      </div>
    </div>
  )
}
export function CampoSelect({ form, setForm, isRO, campo, label, opcoes, span = 1, onChange }) {
  return (
    <div className="form-group" style={{ margin: 0, gridColumn: colSpan(span) }}>
      <label className="form-label">{label}</label>
      <select className="form-select" value={form[campo] ?? ''} disabled={isRO}
        onChange={(e) => (onChange ? onChange(e.target.value) : setForm((f) => ({ ...f, [campo]: e.target.value })))}>
        {opcoes.map((o) => <option key={o.valor ?? o} value={o.valor ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  )
}
export function CampoTextarea({ form, setForm, isRO, campo, label, rows = 3, placeholder }) {
  return (
    <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
      {label ? <label className="form-label">{label}</label> : null}
      <textarea className="form-textarea" rows={rows} value={form[campo] ?? ''} disabled={isRO}
        onChange={(e) => setForm((f) => ({ ...f, [campo]: e.target.value }))} placeholder={placeholder}
        style={{ resize: isRO ? 'none' : 'vertical' }} />
    </div>
  )
}
export function CampoCheck({ form, setForm, isRO, campo, label, span = 1 }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--t1)', cursor: isRO ? 'default' : 'pointer', minHeight: 37, gridColumn: colSpan(span) }}>
      <input type="checkbox" checked={!!form[campo]} disabled={isRO}
        onChange={(e) => setForm((f) => ({ ...f, [campo]: e.target.checked }))} />
      {label}
    </label>
  )
}
export function CampoCodigo({ valor }) {
  return (
    <div className="form-group" style={{ margin: 0, gridColumn: 'span 1' }}>
      <label className="form-label">Código</label>
      <div className="form-input" style={{ width: 90, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1.5, color: valor ? 'var(--or)' : 'var(--t3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}>
        {valor || ''}
      </div>
    </div>
  )
}
