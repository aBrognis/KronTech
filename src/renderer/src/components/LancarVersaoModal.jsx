import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Loader2, CheckCircle2, XCircle, X, Rocket, KeyRound, Clipboard, ExternalLink } from 'lucide-react'

const TITULOS_FASE = {
  lendo_versao:      'Lendo versão atual',
  buildando:         'Compilando o app',
  empacotando:       'Gerando instalador',
  instalador_pronto: 'Instalador gerado',
  versionando:       'Versionando (git commit + push)',
  publicando:        'Publicando release no GitHub',
  concluido:         'Versão lançada com sucesso!',
  erro:              'Erro ao lançar versão',
}

// Mesmo padrão visual de ImportarBancoModal.jsx (sem <ModalProgresso>
// compartilhado no projeto). Fluxo: token -> confirmação (mostra a versão
// que vai ser lançada) -> progresso -> sucesso/erro. A ação é pública e
// irreversível (publica uma release real no GitHub), por isso a
// confirmação extra além do token.
export default function LancarVersaoModal({ open, onClose }) {
  const [fase, setFase]           = useState('token') // token | confirmacao | progresso | sucesso | erro
  const [token, setToken]         = useState('')
  const [progresso, setProgresso] = useState({ fase: '', linha: '' })
  const [resultado, setResultado] = useState(null)
  const [erro, setErro]           = useState('')

  if (!open) return null

  function resetar() {
    setFase('token')
    setToken('')
    setProgresso({ fase: '', linha: '' })
    setResultado(null)
    setErro('')
  }

  function fechar() {
    resetar()
    onClose()
  }

  async function iniciarLancamento() {
    setFase('progresso')
    const unsub = window.api.lancarVersao.onProgresso(p => setProgresso(p))
    try {
      const res = await window.api.lancarVersao.executar(token)
      if (!res.ok) {
        setErro(res.erro)
        setFase('erro')
      } else {
        setResultado(res)
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

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => podeFechar && e.target === e.currentTarget && fechar()}
    >
      <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,.4)', width: 480, maxWidth: '94vw', display: 'flex', flexDirection: 'column' }}>

        {fase === 'token' && (
          <>
            <div style={{ padding: '20px 24px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Rocket size={20} color="var(--or)" />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Lançar versão</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.7 }}>
                Compila o app, gera o instalador, versiona (git commit + push) e publica
                a release no GitHub. <strong style={{ color: 'var(--red)' }}>Publicação pública, não pode ser desfeita.</strong>
              </div>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                    placeholder="Cole o token gerado em Configurações no ambiente de produção"
                    autoFocus
                    autoComplete="off"
                    style={{ flex: 1, fontFamily: 'monospace' }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    title="Colar da área de transferência"
                    onClick={async () => {
                      const res = await window.api.clipboard.read()
                      const texto = res?.ok ? res.data : res
                      if (texto) setToken(String(texto).trim())
                    }}
                    style={{ flexShrink: 0 }}
                  >
                    <Clipboard size={14} /> Colar
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '18px 24px' }}>
              <button className="btn btn-ghost" onClick={fechar}>Cancelar</button>
              <button className="btn btn-primary" disabled={!token.trim()} onClick={() => setFase('confirmacao')}>
                Continuar
              </button>
            </div>
          </>
        )}

        {fase === 'confirmacao' && (
          <>
            <div style={{ padding: '20px 24px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <AlertTriangle size={20} color="var(--red)" />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Confirmar lançamento</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.7 }}>
                A versão será calculada automaticamente (patch + 1 sobre a versão atual) e publicada
                como release pública no GitHub assim que build e empacotamento terminarem com sucesso.
                <br /><br />
                Esta ação não pode ser desfeita.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '18px 24px' }}>
              <button className="btn btn-ghost" onClick={() => setFase('token')}>Voltar</button>
              <button className="btn btn-danger" onClick={iniciarLancamento}>
                Confirmar e Lançar
              </button>
            </div>
          </>
        )}

        {(fase === 'progresso' || fase === 'sucesso' || fase === 'erro') && (
          <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {fase === 'sucesso'
                ? <CheckCircle2 size={22} color="var(--green)" />
                : fase === 'erro'
                  ? <XCircle size={22} color="var(--red)" />
                  : <Loader2 size={22} color="var(--or)" style={{ animation: 'spin 1s linear infinite' }} />
              }
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>
                  {fase === 'sucesso' ? TITULOS_FASE.concluido
                    : fase === 'erro' ? TITULOS_FASE.erro
                    : (TITULOS_FASE[progresso.fase] || 'Processando...')}
                </div>
                {emProgresso && progresso.linha && (
                  <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 3, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {progresso.linha}
                  </div>
                )}
              </div>
            </div>

            {fase === 'sucesso' && resultado && (
              <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.6 }}>
                Versão <strong>{resultado.novaVersao}</strong> publicada com sucesso.
                {resultado.releaseUrl && (
                  <div style={{ marginTop: 10 }}>
                    <a href={resultado.releaseUrl} target="_blank" rel="noreferrer"
                      onClick={e => { e.preventDefault(); window.api?.shell?.openExternal?.(resultado.releaseUrl) }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--or)', fontSize: 12 }}>
                      <ExternalLink size={12} /> Ver release no GitHub
                    </a>
                  </div>
                )}
              </div>
            )}

            {fase === 'erro' && (
              <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.6 }}>
                {erro}
              </div>
            )}

            {!emProgresso && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={fechar}>
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
