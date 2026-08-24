import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Loader2, CheckCircle2, XCircle, X, Rocket } from 'lucide-react'

const TITULOS_FASE = {
  lendo_versao:      'Lendo versão atual',
  buildando:         'Compilando o app',
  empacotando:       'Gerando instalador',
  instalador_pronto: 'Instalador gerado!',
  erro:              'Erro ao gerar instalador',
}

// Fase 3 do plano "Lançar Versão": só gera o instalador local (build +
// package), sem tocar git nem publicar no GitHub — isso entra na Fase 4.
// Mesmo padrão visual de ImportarBancoModal.jsx (sem <ModalProgresso>
// compartilhado no projeto).
export default function LancarVersaoModal({ open, onClose }) {
  const [fase, setFase]           = useState('confirmacao') // confirmacao | progresso | sucesso | erro
  const [progresso, setProgresso] = useState({ fase: '', linha: '' })
  const [resultado, setResultado] = useState(null)
  const [erro, setErro]           = useState('')

  if (!open) return null

  function resetar() {
    setFase('confirmacao')
    setProgresso({ fase: '', linha: '' })
    setResultado(null)
    setErro('')
  }

  function fechar() {
    resetar()
    onClose()
  }

  async function iniciarGeracao() {
    setFase('progresso')
    const unsub = window.api.lancarVersao.onProgresso(p => setProgresso(p))
    try {
      const res = await window.api.lancarVersao.gerarInstalador()
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

        {fase === 'confirmacao' && (
          <>
            <div style={{ padding: '20px 24px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Rocket size={20} color="var(--or)" />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Gerar instalador</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.7 }}>
                Compila o app e gera o instalador (<code>.exe</code>) localmente, em <code>dist/</code>.
                Esta etapa ainda não versiona nem publica nada — só builda.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '18px 24px' }}>
              <button className="btn btn-ghost" onClick={fechar}>Cancelar</button>
              <button className="btn btn-primary" onClick={iniciarGeracao}>
                Gerar instalador
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
                  {fase === 'sucesso' ? TITULOS_FASE.instalador_pronto
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
                Versão <strong>{resultado.novaVersao}</strong> compilada com sucesso.
                <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8, fontSize: 11, fontFamily: 'monospace', color: 'var(--t3)', overflowX: 'auto' }}>
                  {resultado.exePath}
                </div>
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
