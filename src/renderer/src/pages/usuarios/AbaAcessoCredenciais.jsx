import { useState } from 'react'
import { KeyRound, AlertTriangle, History, ShieldCheck } from 'lucide-react'
import { FormGrid, Secao, CampoTexto, CampoSelect, CampoCheck } from '../../components/cadastroPadrao/TelaCadastroPadrao'
import InputData from '../../components/InputData'
import { notificar } from '../../components/Notificacao'
import { fmtDataHoraBR, fmtDataBR } from '../../lib/utils/data.js'
import { PERFIS, perfilMeta } from './utils'

export default function AbaAcessoCredenciais({ form, setForm, isRO }) {
  const novo = !form.id
  const [redefOpen, setRedefOpen] = useState(false)
  const [nova, setNova] = useState('')
  const [conf, setConf] = useState('')
  const [forcar, setForcar] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function redefinir() {
    if (nova.length < 4) { notificar.aviso('A senha deve ter ao menos 4 caracteres.'); return }
    if (nova !== conf) { notificar.aviso('As senhas não coincidem.'); return }
    setSalvando(true)
    try {
      const res = await window.api.usuario.redefinirSenha({ id: form.id, novaSenha: nova, forcarTroca: forcar })
      if (!res.ok) { notificar.erro(res.erro || 'Falha ao redefinir.'); return }
      notificar.sucesso('Senha redefinida.')
      setForm((f) => ({ ...f, tem_senha: true, senha_alterada_em: new Date().toISOString(), forcar_troca_senha: forcar }))
      setRedefOpen(false); setNova(''); setConf(''); setForcar(false)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <FormGrid>
      <Secao titulo="Perfil de acesso" cols="minmax(0, 1fr) 160px minmax(0, 1fr)">
        <CampoSelect form={form} setForm={setForm} isRO={isRO} campo="perfil" label="Perfil"
          opcoes={PERFIS.map((p) => ({ valor: p.valor, label: p.label }))} />
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Acesso expira em</label>
          <InputData value={form.dt_expiracao} disabled={isRO}
            onChange={(v) => setForm((f) => ({ ...f, dt_expiracao: v }))} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Perfil atual</label>
          <div style={{ height: 34, display: 'flex', alignItems: 'center' }}>
            <span className={`badge ${perfilMeta(form.perfil).classe}`}>{perfilMeta(form.perfil).label}</span>
          </div>
        </div>
      </Secao>

      <Secao titulo="Credenciais" cols="minmax(0, 1fr) minmax(0, 1fr)">
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
                {form.tem_senha
                  ? (form.senha_alterada_em ? `Alterada em ${fmtDataBR(form.senha_alterada_em)}` : 'Senha definida')
                  : 'Sem senha'}
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

      <Secao titulo="Segurança" cols="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)">
        <CampoCheck form={form} setForm={setForm} isRO={isRO} campo="forcar_troca_senha" label="Forçar troca de senha no próximo login" />
        <CampoCheck form={form} setForm={setForm} isRO={isRO} campo="dois_fatores" label="Exigir autenticação em dois fatores" />
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Último acesso</label>
          <div style={{ height: 34, display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--t2)' }}>
            {form.dt_ultimo_acesso ? fmtDataHoraBR(form.dt_ultimo_acesso) : 'Nunca acessou'}
          </div>
        </div>
        {!novo && (form.tentativas_login > 0 || form.bloqueado_ate) && (
          <div style={{ gridColumn: '1 / -1', fontSize: 11.5, color: 'var(--t3)' }}>
            Tentativas de login falhas desde o último acesso: <strong>{form.tentativas_login || 0}</strong>
            {form.bloqueado_ate && new Date(form.bloqueado_ate) > new Date() && (
              <span style={{ color: 'var(--red)' }}> · bloqueado até {fmtDataHoraBR(form.bloqueado_ate)}</span>
            )}
          </div>
        )}
      </Secao>

      {!novo && !form.tem_senha && (
        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(248,113,113,.1)', border: '1px solid rgba(239,68,68,.35)', fontSize: 12, color: 'var(--red)' }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          Este usuário não tem senha definida e não consegue entrar no sistema. Use "Redefinir senha".
        </div>
      )}

      {!novo && form.historicoSenha?.length > 0 && (
        <Secao titulo="Histórico de senhas" largura="full" cols="1fr">
          <div style={{ gridColumn: '1 / -1', border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--s1)' }}>
                  <th style={{ padding: '7px 12px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)' }}>Trocada em</th>
                  <th style={{ padding: '7px 12px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)' }}>Por</th>
                </tr>
              </thead>
              <tbody>
                {form.historicoSenha.map((h) => (
                  <tr key={h.id} style={{ borderTop: '1px solid var(--bd)' }}>
                    <td style={{ padding: '7px 12px', color: 'var(--t2)' }}>
                      <History size={11} style={{ verticalAlign: -1, marginRight: 5, color: 'var(--t3)' }} />
                      {fmtDataHoraBR(h.trocada_em)}
                    </td>
                    <td style={{ padding: '7px 12px', color: 'var(--t2)' }}>{h.trocada_por || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Secao>
      )}

      {redefOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setRedefOpen(false) }}>
          <div style={{ width: 400, background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--bd)', fontWeight: 700, fontSize: 14, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} /> Redefinir senha de {form.nome || form.login}
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--t2)', cursor: 'pointer' }}>
                <input type="checkbox" checked={forcar} onChange={(e) => setForcar(e.target.checked)} />
                Exigir que o usuário troque a senha no próximo login
              </label>
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
