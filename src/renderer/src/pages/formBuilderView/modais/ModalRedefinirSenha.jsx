import { X, Eye, EyeOff, Check } from 'lucide-react'

export default function ModalRedefinirSenha({
  tela, formId,
  nova, setNova, conf, setConf, erro, setErro, saving, setSaving, mostrar, setMostrar,
  onFechar, onSucesso,
}) {
  const match = nova.length > 0 && conf.length > 0 && nova === conf
  const mismatch = conf.length > 0 && nova !== conf
  const tipoInput = mostrar ? 'text' : 'password'

  async function confirmar() {
    if (!nova) { setErro('Digite a nova senha.'); return }
    if (nova.length < 4) { setErro('Mínimo 4 caracteres.'); return }
    if (nova !== conf) { setErro('As senhas não coincidem.'); return }
    setSaving(true)
    try {
      const r = await window.api.auth.redefinirSenha({ tabelaUsuario: tela.nome_tabela, campoCodigo: 'id', id: formId, novaSenha: nova })
      if (r.ok) onSucesso()
      else setErro(r.erro || 'Erro ao redefinir senha.')
    } catch (e) { setErro(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onFechar() }}>
      <div style={{ width: 400, background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'var(--s2)', borderBottom: '1px solid var(--bd)' }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)' }}>🔑 Redefinir Senha</span>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 2 }}><X size={15} /></button>
        </div>
        <div style={{ padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Nova senha */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nova senha</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={tipoInput} value={nova} autoFocus
                onChange={e => { setNova(e.target.value); setErro('') }}
                placeholder="••••••••" style={{ height: 36, paddingRight: 36 }} />
              <button type="button" onClick={() => setMostrar(v => !v)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 2 }}>
                {mostrar ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          {/* Confirmar senha */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Confirmar senha</label>
              {match && <span style={{ fontSize: 10, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}><Check size={11} /> Senhas iguais</span>}
              {mismatch && <span style={{ fontSize: 10, color: '#f87171', fontWeight: 600 }}>✗ Não coincidem</span>}
            </div>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={tipoInput} value={conf}
                onChange={e => { setConf(e.target.value); setErro('') }}
                placeholder="••••••••"
                style={{ height: 36, paddingRight: 36, borderColor: match ? '#4ade80' : mismatch ? '#f87171' : undefined, transition: 'border-color .2s' }} />
              <button type="button" onClick={() => setMostrar(v => !v)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: 2 }}>
                {mostrar ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          {erro && <div style={{ fontSize: 11, color: '#f87171', background: 'rgba(248,113,113,.1)', borderRadius: 6, padding: '6px 10px' }}>{erro}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px' }}>
          <button className="btn btn-primary" disabled={saving} onClick={confirmar}>
            {saving ? 'Salvando...' : '✓ Confirmar'}
          </button>
          <button className="btn btn-ghost" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}
