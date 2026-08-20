import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Loader2, CheckCircle2, XCircle, X, KeyRound, Clipboard } from 'lucide-react'

const TITULOS_FASE = {
  conectando_producao: 'Conectando ao banco de produção',
  descobrindo_schema:  'Mapeando tabelas e dependências',
  exportando_producao: 'Exportando dados de produção',
  backup_dev:          'Fazendo backup de segurança do dev',
  restaurando_dev:     'Restaurando dados no ambiente dev',
  aplicando_config:    'Aplicando configurações e ordenação de telas',
  finalizando:         'Finalizando',
  concluido:           'Importação concluída!',
  erro:                'Erro na importação',
}

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
                <AlertTriangle size={20} color="var(--red)" />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Importar banco de produção</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.7 }}>
                Esta ação vai <strong style={{ color: 'var(--red)' }}>APAGAR e SUBSTITUIR</strong> todo
                o banco de dev atual pelos dados de produção. <strong>Não pode ser desfeita.</strong>
                <br /><br />
                Um backup de segurança do dev atual será feito automaticamente antes de começar.
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
              <button className="btn btn-danger" disabled={!token.trim()} onClick={iniciarImportacao}>
                Importar com este token
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
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>
                  {fase === 'sucesso' ? TITULOS_FASE.concluido
                    : fase === 'erro' ? TITULOS_FASE.erro
                    : (TITULOS_FASE[progresso.fase] || 'Processando...')}
                </div>
                {emProgresso && progresso.tabela && (
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{progresso.tabela}</div>
                )}
              </div>
            </div>

            {emProgresso && progresso.total > 0 && (
              <div>
                <div style={{ height: 8, background: 'var(--s3)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, (progresso.atual / progresso.total) * 100)}%`,
                    background: 'var(--or)', borderRadius: 99, transition: 'width .2s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: 'var(--t3)' }}>
                  <span>{progresso.atual} de {progresso.total}</span>
                  <span>{Math.round((progresso.atual / progresso.total) * 100)}%</span>
                </div>
              </div>
            )}

            {fase === 'sucesso' && (
              <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.6 }}>
                Banco de dev substituído pelo espelho de produção com sucesso.
                {avisoConfig && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8, fontSize: 11.5, color: 'var(--t3)' }}>
                    {avisoConfig}
                  </div>
                )}
              </div>
            )}

            {fase === 'erro' && (
              <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.6 }}>
                {erro}
                <div style={{ marginTop: 8, color: 'var(--green)', fontSize: 11.5 }}>
                  O banco de dev NÃO foi alterado. A transação foi revertida automaticamente.
                </div>
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
