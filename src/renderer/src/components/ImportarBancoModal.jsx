import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle, Loader2, CheckCircle2, XCircle, X, KeyRound, Clipboard,
  Plug, ListTree, DownloadCloud, ShieldCheck, UploadCloud, Palette, PartyPopper,
} from 'lucide-react'

// Ordem fixa das etapas — dita a ordem da lista de progresso, não só o
// título da etapa atual. icon aparece riscado/cinza (pendente), colorido
// com spinner sobreposto (ativa) ou com check (concluída).
const ETAPAS = [
  { fase: 'conectando_producao', titulo: 'Conectando ao banco de produção',        icon: Plug },
  { fase: 'descobrindo_schema',  titulo: 'Mapeando tabelas e dependências',        icon: ListTree },
  { fase: 'exportando_producao', titulo: 'Exportando dados de produção',           icon: DownloadCloud },
  { fase: 'backup_dev',          titulo: 'Fazendo backup de segurança do dev',     icon: ShieldCheck },
  { fase: 'restaurando_dev',     titulo: 'Restaurando dados no ambiente dev',      icon: UploadCloud },
  { fase: 'aplicando_config',    titulo: 'Aplicando configurações e ordenação de telas', icon: Palette },
  { fase: 'finalizando',         titulo: 'Finalizando',                            icon: PartyPopper },
]

const TITULOS_FASE = Object.fromEntries(ETAPAS.map(e => [e.fase, e.titulo]))

// Modal dedicado (confirmação sim/não + progresso), padrão de overlay igual
// ao ConfirmModal de Notificacao.jsx e ao modal de progresso de Arquivos.jsx
// (adaptado aqui, já que não existe um <ModalProgresso> compartilhado no
// projeto).
export default function ImportarBancoModal({ open, onClose }) {
  const [fase, setFase]           = useState('confirmacao') // confirmacao | progresso | sucesso | erro
  const [progresso, setProgresso] = useState({ fase: '', atual: 0, total: 0, tabela: '' })
  const [erro, setErro]           = useState('')
  const [avisoConfig, setAvisoConfig] = useState(null)
  const [token, setToken]         = useState('')

  if (!open) return null

  function resetar() {
    setFase('confirmacao')
    setProgresso({ fase: '', atual: 0, total: 0, tabela: '' })
    setErro('')
    setAvisoConfig(null)
    setToken('')
  }

  function fechar() {
    const eraSucesso = fase === 'sucesso'
    resetar()
    onClose()
    if (eraSucesso) {
      // "Lembrar usuário" pode apontar pra um login que só existia no banco
      // de dev antigo (ou de um teste) — depois de espelhar produção, esse
      // valor pré-preenchido só confunde.
      localStorage.removeItem('kt-lembrar-usuario')
      // Todo estado do renderer (listas carregadas, sessão etc.) referencia
      // dados que acabaram de ser substituídos por completo — reload total
      // é o caminho mais seguro pra não deixar a UI com dados obsoletos.
      window.location.reload()
    }
  }

  async function colarToken() {
    const res = await window.api.clipboard.read()
    if (res.ok && res.data) setToken(res.data.trim())
  }

  async function iniciarImportacao() {
    setFase('progresso')
    const unsub = window.api.importarBanco.onProgresso(p => setProgresso(p))
    try {
      const res = await window.api.importarBanco.executar(token)
      if (!res.ok) {
        setErro(res.erro)
        setFase('erro')
      } else {
        setAvisoConfig(res.avisoConfig || null)
        setFase('sucesso')
      }
    } catch (e) {
      setErro(e.message)
      setFase('erro')
    } finally {
      unsub()
    }
  }

  const emProgresso = fase === 'progresso'
  const podeFechar = !emProgresso
  const indiceAtual = ETAPAS.findIndex(e => e.fase === progresso.fase)
  const larguraModal = (fase === 'progresso' || fase === 'sucesso' || fase === 'erro') ? 520 : 480

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => podeFechar && e.target === e.currentTarget && fechar()}
    >
      <style>{'@keyframes importarBancoIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}'}</style>
      <div style={{
        background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14,
        boxShadow: '0 24px 64px rgba(0,0,0,.4)', width: larguraModal, maxWidth: '94vw',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transition: 'width .2s ease', animation: 'importarBancoIn .18s ease',
      }}>

        {fase === 'confirmacao' && (
          <>
            <div style={{ padding: '20px 24px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <AlertTriangle size={20} color="var(--red)" />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Importar banco de produção</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.7 }}>
                Esta ação vai <strong style={{ color: 'var(--red)' }}>APAGAR e SUBSTITUIR</strong> todo
                o banco de dev atual pelos dados de produção. <strong>Não pode ser desfeita.</strong>
                <br /><br />
                Um backup de segurança do dev atual será feito automaticamente antes de começar.
              </div>
              <div style={{
                marginTop: 16, padding: 12, borderRadius: 10,
                background: 'var(--s2)', border: '1px solid var(--bd)',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <label style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <KeyRound size={11} /> Token de autorização (gerado em produção)
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-input"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="Cole o token aqui"
                    autoFocus
                    autoComplete="off"
                    style={{ flex: 1, fontFamily: 'monospace', fontSize: 12.5 }}
                  />
                  <button className="btn btn-ghost" onClick={colarToken}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <Clipboard size={13} /> Colar
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '18px 24px' }}>
              <button className="btn btn-ghost" onClick={fechar}>Cancelar</button>
              <button className="btn btn-danger" disabled={!token.trim()} onClick={iniciarImportacao}>
                Importar com este token
              </button>
            </div>
          </>
        )}

        {(fase === 'progresso' || fase === 'sucesso' || fase === 'erro') && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>

            {/* Cabeçalho de estado — em progresso é uma faixa discreta; em
                sucesso/erro vira um bloco maior e mais celebrativo/sério,
                já que ali é o conteúdo principal do card, não só um título. */}
            {emProgresso ? (
              <div style={{
                padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 14,
                borderBottom: '1px solid var(--bd)',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--or3)',
                }}>
                  <Loader2 size={19} color="var(--or)" style={{ animation: 'spin .9s linear infinite' }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--t1)' }}>
                    {TITULOS_FASE[progresso.fase] || 'Processando...'}
                  </div>
                  {progresso.tabela && (
                    <div style={{
                      fontSize: 11.5, color: 'var(--t3)', marginTop: 2, fontFamily: 'monospace',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {progresso.tabela}
                      {progresso.total > 0 && <span style={{ opacity: .6 }}> · {progresso.atual}/{progresso.total}</span>}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                padding: '32px 28px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14,
                background: fase === 'sucesso'
                  ? 'linear-gradient(180deg, rgba(52,199,89,.10), transparent)'
                  : 'linear-gradient(180deg, rgba(239,68,68,.10), transparent)',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: fase === 'sucesso' ? 'rgba(52,199,89,.16)' : 'rgba(239,68,68,.16)',
                  boxShadow: fase === 'sucesso' ? '0 0 0 1px rgba(52,199,89,.3)' : '0 0 0 1px rgba(239,68,68,.3)',
                }}>
                  {fase === 'sucesso'
                    ? <CheckCircle2 size={28} color="var(--green)" strokeWidth={2} />
                    : <XCircle size={28} color="var(--red)" strokeWidth={2} />
                  }
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>
                  {fase === 'sucesso' ? TITULOS_FASE.concluido : TITULOS_FASE.erro}
                </div>
              </div>
            )}

            {/* Barra de progresso macro — posição na sequência de etapas,
                separada do % por tabela que já aparece dentro de cada item. */}
            {emProgresso && (
              <div style={{ height: 3, background: 'var(--s3)' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.max(4, ((indiceAtual + 1) / ETAPAS.length) * 100)}%`,
                  background: 'var(--or)', transition: 'width .35s ease',
                }} />
              </div>
            )}

            {/* Checklist de etapas — cada uma pendente/ativa/concluída */}
            {emProgresso && (
              <div style={{ padding: '18px 28px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {ETAPAS.map((etapa, i) => {
                  const Icon = etapa.icon
                  const estado = i < indiceAtual ? 'feita' : i === indiceAtual ? 'ativa' : 'pendente'
                  return (
                    <div key={etapa.fase} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
                      opacity: estado === 'pendente' ? .4 : 1, transition: 'opacity .25s ease',
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: estado === 'feita' ? 'var(--green)' : estado === 'ativa' ? 'var(--or3)' : 'var(--s3)',
                        border: estado === 'ativa' ? '1.5px solid var(--or)' : 'none',
                      }}>
                        {estado === 'feita'
                          ? <CheckCircle2 size={13} color="#fff" strokeWidth={2.5} />
                          : estado === 'ativa'
                            ? <Loader2 size={11} color="var(--or)" style={{ animation: 'spin .9s linear infinite' }} />
                            : <Icon size={11} color="var(--t3)" />
                        }
                      </div>
                      <span style={{
                        fontSize: 12, color: estado === 'ativa' ? 'var(--t1)' : 'var(--t3)',
                        fontWeight: estado === 'ativa' ? 600 : 400,
                      }}>
                        {etapa.titulo}
                      </span>
                      {estado === 'ativa' && progresso.total > 0 && (
                        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--t3)', fontFamily: 'monospace' }}>
                          {Math.round((progresso.atual / progresso.total) * 100)}%
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {fase === 'sucesso' && (
              <div style={{ padding: '0 28px 26px', textAlign: 'center' }}>
                <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.6 }}>
                  Banco de dev substituído pelo espelho de produção.
                </div>
                {avisoConfig && (
                  <div style={{
                    marginTop: 14, padding: '10px 12px', background: 'var(--s2)', border: '1px solid var(--bd)',
                    borderRadius: 8, fontSize: 11.5, color: 'var(--t3)', textAlign: 'left',
                  }}>
                    {avisoConfig}
                  </div>
                )}
              </div>
            )}

            {fase === 'erro' && (
              <div style={{ padding: '0 28px 26px' }}>
                <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.6, textAlign: 'center' }}>
                  {erro}
                </div>
                <div style={{
                  marginTop: 14, display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 12px', background: 'rgba(52,199,89,.08)', border: '1px solid rgba(52,199,89,.25)',
                  borderRadius: 8, color: 'var(--green)', fontSize: 11.5,
                }}>
                  <ShieldCheck size={14} style={{ flexShrink: 0 }} />
                  O banco de dev NÃO foi alterado. A transação foi revertida automaticamente.
                </div>
              </div>
            )}

            {!emProgresso && (
              <div style={{
                display: 'flex', justifyContent: 'center', padding: '4px 28px 26px',
                borderTop: '1px solid var(--bd)', paddingTop: 18,
              }}>
                <button className="btn btn-primary" onClick={fechar} style={{ minWidth: 140 }}>
                  <X size={13} /> Fechar
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>,
    document.body
  )
}
