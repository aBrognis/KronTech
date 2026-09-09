import { useState } from 'react'
import { KeyRound, AlertTriangle } from 'lucide-react'
import { FormGrid, Secao, CampoTexto } from '../../components/cadastroPadrao/TelaCadastroPadrao'
import { notificar } from '../../components/Notificacao'

export default function AbaAcessoCredenciais({ form, setForm, isRO }) {
  const novo = !form.id
  const [redefOpen, setRedefOpen] = useState(false)
  const [nova, setNova] = useState('')
  const [conf, setConf] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function redefinir() {
    if (nova.length < 4) { notificar.aviso('A senha deve ter ao menos 4 caracteres.'); return }
    if (nova !== conf) { notificar.aviso('As senhas não coincidem.'); return }
    setSalvando(true)
    try {
      const res = await window.api.usuario.redefinirSenha({ id: form.id, novaSenha: nova })
      if (!res.ok) { notificar.erro(res.erro || 'Falha ao redefinir.'); return }
      notificar.sucesso('Senha redefinida.')
      setForm((f) => ({ ...f, tem_senha: true }))
      setRedefOpen(false); setNova(''); setConf('')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <FormGrid>
      <Secao titulo="Credenciais de acesso" cols="minmax(0, 1fr) minmax(0, 1fr)">
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="login" label="Login / Usuário" placeholder="maria.silva" />

        {novo ? (
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Senha</label>
            <input className="form-input" type="password" value={form.senha} disabled={isRO}
              onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
              placeholder="mínimo 4 caracteres" />
          </div>
        ) : (
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Senha</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 34 }}>
              <span style={{ fontSize: 12, color: form.tem_senha ? 'var(--t2)' : 'var(--red)' }}>
                {form.tem_senha ? 'Senha definida' : 'Sem senha'}
              </span>
              {!isRO && (
                <button type="button" className="btn btn-ghost" style={{ height: 30, fontSize: 11 }}
                  onClick={() => setRedefOpen(true)}>
                  <KeyRound size={12} /> Redefinir senha
                </button>
              )}
            </div>
          </div>
        )}
      </Secao>

      {!novo && !form.tem_senha && (
        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(248,113,113,.1)', border: '1px solid rgba(239,68,68,.35)', fontSize: 12, color: 'var(--red)' }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          Este usuário não tem senha definida e não consegue entrar no sistema. Use "Redefinir senha".
        </div>
      )}

      {redefOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setRedefOpen(false) }}>
          <div style={{ width: 380, background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--bd)', fontWeight: 700, fontSize: 14, color: 'var(--t1)' }}>
              Redefinir senha de {form.nome || form.login}
            </div>
            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Nova senha</label>
                <input className="form-input" type="password" value={nova} autoFocus
                  onChange={(e) => setNova(e.target.value)} placeholder="mínimo 4 caracteres" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Confirmar senha</label>
                <input className="form-input" type="password" value={conf}
                  onChange={(e) => setConf(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '12px 22px 18px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setRedefOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={redefinir} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Redefinir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FormGrid>
  )
}
