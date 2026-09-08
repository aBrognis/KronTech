import { useState, useEffect } from 'react'
import { X, Save, Loader2, CheckCircle2, AlertTriangle, RefreshCw, PenLine, KeyRound, LogIn } from 'lucide-react'
import InputData from '../../components/InputData'
import RichTextEditor from '../../components/RichTextEditor'
import { PROVEDORES, PALETA_AVATAR, corAvatar, iniciais } from './utils'
import { LabelAjuda } from './ajudaConta'

const VAZIO = {
  nome: '', email: '', provedor: 'gmail', usuarioLogin: '', senhaApp: '',
  imapHost: 'imap.gmail.com', imapPorta: 993, imapSeguranca: 'tls',
  smtpHost: 'smtp.gmail.com', smtpPorta: 465, smtpSeguranca: 'tls',
  sincronizarDesde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  ativa: true, replyTo: '', avatarCor: '',
}

export default function ContaFormModal({ conta, onFechar, onSalvo }) {
  const [form, setForm] = useState(VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [testando, setTestando] = useState(false)
  const [resultadoTeste, setResultadoTeste] = useState(null) // { ok, erro }
  const [confirmarSalvarSemTeste, setConfirmarSalvarSemTeste] = useState(false)
  const [erro, setErro] = useState(null)
  const [ressincronizando, setRessincronizando] = useState(false)
  const [resultadoRessinc, setResultadoRessinc] = useState(null) // { novas } | { erro }
  const [assinaturaHtml, setAssinaturaHtml] = useState('')
  const [assinaturaAtiva, setAssinaturaAtiva] = useState(true)
  const [salvandoAssinatura, setSalvandoAssinatura] = useState(false)
  const [assinaturaSalva, setAssinaturaSalva] = useState(false)

  // OAuth Outlook: refreshToken so existe no cliente entre o login e o
  // salvamento (conta nova); em conta existente ja logada, oauthLogado
  // reflete o que veio do banco. clientIdGlobal e o fallback do .ini.
  const [oauthRefreshToken, setOauthRefreshToken] = useState(null)
  const [oauthLogado, setOauthLogado] = useState(false)
  const [oauthEmProgresso, setOauthEmProgresso] = useState(false)
  const [oauthErro, setOauthErro] = useState(null)
  const [clientIdGlobal, setClientIdGlobal] = useState('')

  const isOutlook = form.provedor === 'outlook'

  useEffect(() => {
    window.api.email.obterOutlookClientId()
      .then(r => setClientIdGlobal(r?.data?.clientId || r?.clientId || ''))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (conta) {
      setForm({
        nome: conta.nome, email: conta.email, provedor: conta.provedor, usuarioLogin: conta.usuario_login,
        senhaApp: '', // nunca reexibida em claro
        imapHost: conta.imap_host, imapPorta: conta.imap_porta, imapSeguranca: conta.imap_seguranca,
        smtpHost: conta.smtp_host, smtpPorta: conta.smtp_porta, smtpSeguranca: conta.smtp_seguranca,
        sincronizarDesde: conta.sincronizar_desde?.slice(0, 10) || VAZIO.sincronizarDesde,
        ativa: conta.ativa, replyTo: conta.reply_to || '', avatarCor: conta.avatar_cor || '',
      })
      setAssinaturaHtml(conta.assinatura_html || '')
      setAssinaturaAtiva(conta.assinatura_ativa !== false)
      setOauthLogado(conta.auth_tipo === 'oauth_outlook' && !!conta.oauth_refresh_token_cifrado)
      setOauthRefreshToken(null)
      setOauthErro(null)
    } else {
      setForm(VAZIO)
      setAssinaturaHtml('')
      setAssinaturaAtiva(true)
      setOauthLogado(false)
      setOauthRefreshToken(null)
      setOauthErro(null)
    }
  }, [conta])

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    setResultadoTeste(null)
  }

  function aoTrocarProvedor(id) {
    const p = PROVEDORES.find(x => x.id === id)
    // Ao trocar PARA um provedor sem host predefinido (IMAP genérico), os
    // campos são limpos — mantê-los com o host do provedor anterior seria
    // enganoso (ex: mostrar imap.gmail.com pra uma conta que não é Gmail).
    setForm(f => ({
      ...f, provedor: id,
      imapHost: p.imapHost, imapPorta: p.imapHost ? p.imapPorta : '',
      smtpHost: p.smtpHost, smtpPorta: p.smtpHost ? p.smtpPorta : '',
    }))
    setResultadoTeste(null)
    // Sair do Outlook zera qualquer login pendente; entrar zera o resto.
    setOauthErro(null)
    if (id !== 'outlook') { setOauthRefreshToken(null); if (!conta) setOauthLogado(false) }
  }

  // Abre a janela de login da Microsoft. Guarda o refresh_token no estado
  // (conta nova, vai no payload do salvar) ou aplica direto na conta
  // existente (edicao). Usa o e-mail preenchido como login_hint.
  async function entrarComMicrosoft() {
    setOauthEmProgresso(true)
    setOauthErro(null)
    try {
      const res = await window.api.email.oauthLoginOutlook({
        clientId: (clientIdGlobal || '').trim() || undefined,
        loginHint: form.email.trim() || undefined,
      })
      if (!res.ok) { setOauthErro(res.erro || 'Falha no login com a Microsoft.'); return }
      const rt = res.data.refreshToken
      if (conta) {
        const ap = await window.api.email.aplicarLoginOutlook(conta.id, { refreshToken: rt, clientId: (clientIdGlobal || '').trim() || undefined })
        if (!ap.ok) { setOauthErro(ap.erro || 'Não foi possível salvar o login.'); return }
        setOauthLogado(true)
        setOauthRefreshToken(null)
        setResultadoTeste(null)
      } else {
        setOauthRefreshToken(rt)
        setOauthLogado(true)
      }
    } finally {
      setOauthEmProgresso(false)
    }
  }

  async function testarConexao() {
    // Editando uma conta sem digitar senha nova: testa com a senha já
    // salva, decifrada só no backend (nunca chega ao frontend). Só exige
    // redigitar a senha quando é conta nova ou quando o usuário está
    // trocando a senha de propósito.
    // Outlook: so testa depois de logado; sempre pela conta salva (o
    // access token vem do refresh token no backend).
    if (isOutlook) {
      if (!conta) {
        setErro('Salve a conta primeiro e depois teste a conexão do Outlook.')
        return
      }
      if (!oauthLogado) {
        setErro('Entre com a Microsoft antes de testar.')
        return
      }
      setTestando(true)
      setErro(null)
      try {
        const res = await window.api.email.testarConexaoConta(conta.id)
        setResultadoTeste(res.ok ? { ok: true } : { ok: false, erro: res.erro })
      } finally {
        setTestando(false)
      }
      return
    }

    if (conta && !form.senhaApp) {
      setTestando(true)
      setErro(null)
      try {
        const res = await window.api.email.testarConexaoConta(conta.id)
        setResultadoTeste(res.ok ? { ok: true } : { ok: false, erro: res.erro })
      } finally {
        setTestando(false)
      }
      return
    }

    if (!form.usuarioLogin || !form.senhaApp) {
      setErro('Preencha usuário e senha de app antes de testar.')
      return
    }
    setTestando(true)
    setErro(null)
    try {
      const res = await window.api.email.testarConexao({
        imapHost: form.imapHost, imapPorta: Number(form.imapPorta), imapSeguranca: form.imapSeguranca,
        smtpHost: form.smtpHost, smtpPorta: Number(form.smtpPorta), smtpSeguranca: form.smtpSeguranca,
        usuarioLogin: form.usuarioLogin, senhaApp: form.senhaApp,
      })
      setResultadoTeste(res.ok ? { ok: true } : { ok: false, erro: res.erro })
    } finally {
      setTestando(false)
    }
  }

  // Ação explícita — mudar a data e salvar não refaz o backfill sozinho
  // (a sincronização normal, após a primeira, só busca UIDs novos por
  // performance). Aqui o usuário pede na hora pra reprocessar desde a data
  // escolhida; idempotente, e-mails já baixados não duplicam.
  async function ressincronizar() {
    if (!conta) return
    setRessincronizando(true)
    setResultadoRessinc(null)
    try {
      const res = await window.api.email.ressincronizarDesde(conta.id, form.sincronizarDesde)
      setResultadoRessinc(res.ok ? { novas: res.data.novas } : { erro: res.erro })
    } finally {
      setRessincronizando(false)
    }
  }

  async function salvarAssinatura() {
    if (!conta) return
    setSalvandoAssinatura(true)
    setAssinaturaSalva(false)
    try {
      const res = await window.api.email.atualizarAssinatura(conta.id, { assinaturaHtml, assinaturaAtiva })
      if (res.ok) { setAssinaturaSalva(true); setTimeout(() => setAssinaturaSalva(false), 2500) }
      else setErro(res.erro)
    } finally {
      setSalvandoAssinatura(false)
    }
  }

  async function salvar() {
    if (!form.nome.trim() || !form.email.trim() || !form.usuarioLogin.trim()) {
      setErro('Preencha nome, e-mail e usuário de login.')
      return
    }
    // Outlook novo: exige login OAuth (nao tem senha de app). Outlook em
    // edicao ja logado nao precisa refazer.
    if (isOutlook) {
      if (!conta && !oauthRefreshToken) {
        setErro('Entre com a Microsoft antes de salvar a conta do Outlook.')
        return
      }
    } else if (!conta && !form.senhaApp.trim()) {
      setErro('Preencha a senha de app.')
      return
    }
    // Exigir teste bem-sucedido só em contas novas — editar uma conta já
    // validada (ex: só trocar o nome/data de sincronização, sem mexer em
    // credenciais) não deveria forçar testar de novo. Outlook novo nao tem
    // como testar antes de existir (o teste usa a conta salva), entao pula.
    if (!conta && !isOutlook && !resultadoTeste?.ok && !confirmarSalvarSemTeste) {
      setErro('Teste a conexão antes de salvar, ou marque "Salvar mesmo assim".')
      return
    }
    setErro(null)
    setSalvando(true)
    try {
      const payload = {
        nome: form.nome.trim(), email: form.email.trim(), provedor: form.provedor,
        usuarioLogin: form.usuarioLogin.trim(), senhaApp: isOutlook ? undefined : (form.senhaApp.trim() || undefined),
        imapHost: form.imapHost, imapPorta: Number(form.imapPorta), imapSeguranca: form.imapSeguranca,
        smtpHost: form.smtpHost, smtpPorta: Number(form.smtpPorta), smtpSeguranca: form.smtpSeguranca,
        sincronizarDesde: form.sincronizarDesde, ativa: form.ativa, replyTo: form.replyTo.trim() || undefined,
        avatarCor: form.avatarCor || undefined,
        ...(isOutlook ? {
          authTipo: 'oauth_outlook',
          oauthRefreshToken: oauthRefreshToken || undefined,
          oauthClientId: (clientIdGlobal || '').trim() || undefined,
        } : {}),
      }
      const res = conta
        ? await window.api.email.atualizarConta(conta.id, payload)
        : await window.api.email.criarConta(payload)
      if (!res.ok) { setErro(res.erro); return }
      onSalvo()
    } finally {
      setSalvando(false)
    }
  }

  const corPreview = form.avatarCor || corAvatar(form.nome, form.email)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}>
      <div style={{ width: 980, maxHeight: '92vh', overflowY: 'auto', background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)' }}>
        <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{conta ? 'Editar conta de e-mail' : 'Nova conta de e-mail'}</span>
          <button className="btn btn-ghost" style={{ height: 28, width: 28, padding: 0 }} onClick={onFechar}><X size={14} /></button>
        </div>

        <div style={{ padding: '14px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {erro && (
            <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(239,68,68,.4)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--red)' }}>
              {erro}
            </div>
          )}

          {isOutlook && (
            <div style={{
              background: oauthLogado ? 'rgba(74,222,128,.08)' : 'rgba(96,165,250,.08)',
              border: `1px solid ${oauthLogado ? 'rgba(74,222,128,.35)' : 'rgba(96,165,250,.35)'}`,
              borderRadius: 8, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.5 }}>
                Contas Microsoft (Outlook, Office 365) usam login seguro (OAuth). Não é senha de app: uma janela da Microsoft vai abrir para você entrar, inclusive com verificação em duas etapas.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  style={{ height: 32, fontSize: 12 }}
                  onClick={entrarComMicrosoft}
                  disabled={oauthEmProgresso}
                >
                  {oauthEmProgresso
                    ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    : <LogIn size={13} />}
                  {oauthEmProgresso ? 'Aguardando login...' : oauthLogado ? 'Entrar de novo' : 'Entrar com a Microsoft'}
                </button>
                {oauthLogado && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--green)' }}>
                    <CheckCircle2 size={13} /> Login Microsoft ativo{conta ? ' e salvo' : ' (será salvo com a conta)'}.
                  </span>
                )}
                {!clientIdGlobal && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--yellow)' }}>
                    <AlertTriangle size={12} /> Configure o Client ID do Azure em Configurações antes de entrar.
                  </span>
                )}
              </div>
              {oauthErro && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--red)' }}>
                  <AlertTriangle size={13} /> {oauthErro}
                </span>
              )}
            </div>
          )}

          {/* Seção 1 — Identidade da conta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="form-label" style={{ margin: 0 }}>Identidade</span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <span style={{
                width: 34, height: 34, borderRadius: '30%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12.5, fontWeight: 700, color: corPreview, background: 'transparent', flexShrink: 0,
              }}>
                {iniciais(form.nome, form.email)}
              </span>
              <div className="form-group" style={{ margin: 0, flex: '1 1 0' }}>
                <LabelAjuda campo="nome" provedor={form.provedor}>Nome (apelido)</LabelAjuda>
                <input className="form-input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Trabalho" />
              </div>
              <div className="form-group" style={{ margin: 0, flex: '1.4 1 0' }}>
                <LabelAjuda campo="email" provedor={form.provedor}>E-mail</LabelAjuda>
                <input className="form-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="voce@exemplo.com" disabled={!!conta} />
              </div>
              <div className="form-group" style={{ margin: 0, flex: '0.8 1 0' }}>
                <LabelAjuda campo="provedor" provedor={form.provedor}>Provedor</LabelAjuda>
                <select className="form-select" value={form.provedor} onChange={e => aoTrocarProvedor(e.target.value)}>
                  {PROVEDORES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'nowrap', alignItems: 'center', height: 32, flexShrink: 0 }}>
                <button
                  type="button"
                  title="Automática (por identidade)"
                  onClick={() => set('avatarCor', '')}
                  style={{
                    width: 18, height: 18, borderRadius: '30%', flexShrink: 0, cursor: 'pointer',
                    background: 'repeating-linear-gradient(45deg, var(--s3), var(--s3) 3px, var(--s2) 3px, var(--s2) 6px)',
                    border: !form.avatarCor ? '2px solid var(--or)' : '2px solid transparent',
                  }}
                />
                {PALETA_AVATAR.map(cor => (
                  <button
                    key={cor}
                    type="button"
                    onClick={() => set('avatarCor', cor)}
                    style={{
                      width: 18, height: 18, borderRadius: '30%', background: cor, flexShrink: 0, cursor: 'pointer',
                      border: form.avatarCor === cor ? '2px solid var(--t1)' : '2px solid transparent',
                    }}
                  />
                ))}
                <label
                  title="Cor personalizada (RGB)"
                  style={{
                    position: 'relative', width: 18, height: 18, borderRadius: '30%', flexShrink: 0, cursor: 'pointer',
                    background: form.avatarCor && !PALETA_AVATAR.includes(form.avatarCor) ? form.avatarCor
                      : 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                    border: form.avatarCor && !PALETA_AVATAR.includes(form.avatarCor) ? '2px solid var(--t1)' : '2px solid transparent',
                    display: 'inline-block',
                  }}
                >
                  <input
                    type="color"
                    value={form.avatarCor && /^#[0-9a-fA-F]{6}$/.test(form.avatarCor) ? form.avatarCor : '#d95218'}
                    onChange={e => set('avatarCor', e.target.value)}
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', border: 0, padding: 0 }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Seção 2 — Configurações de conexão (login, senha, servidores, sincronização) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--bd)', paddingTop: 10 }}>
            <span className="form-label" style={{ margin: 0 }}>Configurações de conexão</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                <LabelAjuda campo="usuarioLogin" provedor={form.provedor}>Usuário de login</LabelAjuda>
                <input className="form-input" value={form.usuarioLogin} onChange={e => set('usuarioLogin', e.target.value)} placeholder="voce@exemplo.com" />
              </div>
              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                {isOutlook ? (
                  <>
                    <span className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <KeyRound size={12} /> Autenticação
                    </span>
                    <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--t3)', background: 'var(--s2)', cursor: 'default' }}>
                      {oauthLogado
                        ? <><CheckCircle2 size={13} style={{ color: 'var(--green)' }} /> Login Microsoft</>
                        : 'Entre com a Microsoft acima'}
                    </div>
                  </>
                ) : (
                  <>
                    <LabelAjuda campo="senhaApp" provedor={form.provedor}>Senha de app</LabelAjuda>
                    <input className="form-input" type="password" value={form.senhaApp} onChange={e => set('senhaApp', e.target.value)}
                      placeholder={conta ? 'Deixe em branco para manter' : '••••••••••••••••'} autoComplete="new-password" />
                  </>
                )}
              </div>
              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                <LabelAjuda campo="replyTo" provedor={form.provedor}>Responder para (Reply-To)</LabelAjuda>
                <input className="form-input" value={form.replyTo} onChange={e => set('replyTo', e.target.value)} placeholder="Opcional" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                <LabelAjuda campo="imapHost" provedor={form.provedor}>Host IMAP</LabelAjuda>
                <input className="form-input" value={form.imapHost} onChange={e => set('imapHost', e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0, width: 74 }}>
                <LabelAjuda campo="imapPorta" provedor={form.provedor}>Porta</LabelAjuda>
                <input className="form-input" value={form.imapPorta} onChange={e => set('imapPorta', e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0, width: 120 }}>
                <LabelAjuda campo="imapSeguranca" provedor={form.provedor}>Segurança IMAP</LabelAjuda>
                <select className="form-select" value={form.imapSeguranca} onChange={e => set('imapSeguranca', e.target.value)}>
                  <option value="tls">TLS</option>
                  <option value="starttls">STARTTLS</option>
                  <option value="nenhuma">Nenhuma</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                <LabelAjuda campo="smtpHost" provedor={form.provedor}>Host SMTP</LabelAjuda>
                <input className="form-input" value={form.smtpHost} onChange={e => set('smtpHost', e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0, width: 74 }}>
                <LabelAjuda campo="smtpPorta" provedor={form.provedor}>Porta</LabelAjuda>
                <input className="form-input" value={form.smtpPorta} onChange={e => set('smtpPorta', e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0, width: 120 }}>
                <LabelAjuda campo="smtpSeguranca" provedor={form.provedor}>Segurança SMTP</LabelAjuda>
                <select className="form-select" value={form.smtpSeguranca} onChange={e => set('smtpSeguranca', e.target.value)}>
                  <option value="tls">TLS</option>
                  <option value="starttls">STARTTLS</option>
                  <option value="nenhuma">Nenhuma</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0, width: 200 }}>
                <LabelAjuda campo="sincronizarDesde" provedor={form.provedor}>Sincronizar a partir de</LabelAjuda>
                <InputData value={form.sincronizarDesde} onChange={v => set('sincronizarDesde', v)} />
              </div>
              {conta && (
                <button className="btn btn-ghost" style={{ height: 38, fontSize: 11.5, whiteSpace: 'nowrap', flexShrink: 0, boxSizing: 'border-box' }} onClick={ressincronizar} disabled={ressincronizando}>
                  {ressincronizando ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
                  {ressincronizando ? 'Ressincronizando...' : 'Ressincronizar desde essa data'}
                </button>
              )}
              {resultadoRessinc && (
                <span style={{ fontSize: 11.5, color: resultadoRessinc.erro ? 'var(--red)' : 'var(--green)' }}>
                  {resultadoRessinc.erro ? resultadoRessinc.erro : `${resultadoRessinc.novas} mensagem(ns) nova(s) encontrada(s).`}
                </span>
              )}
            </div>
          </div>

          {/* Seção 3 — Assinatura (só em edição, exige conta existente) */}
          {conta && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--bd)', paddingTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PenLine size={13} /> Assinatura
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--t2)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={assinaturaAtiva} onChange={e => setAssinaturaAtiva(e.target.checked)} />
                  Inserir automaticamente ao compor
                </label>
              </div>
              <RichTextEditor value={assinaturaHtml} onChange={setAssinaturaHtml} minHeight={64} placeholder="Nome, cargo, telefone, logo..." />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="btn btn-ghost" style={{ height: 28, fontSize: 11.5 }} onClick={salvarAssinatura} disabled={salvandoAssinatura}>
                  {salvandoAssinatura ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />}
                  {salvandoAssinatura ? 'Salvando...' : 'Salvar assinatura'}
                </button>
                {assinaturaSalva && <span style={{ fontSize: 11.5, color: 'var(--green)' }}>Assinatura salva.</span>}
              </div>
            </div>
          )}

          {resultadoTeste && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, fontSize: 12,
              background: resultadoTeste.ok ? 'rgba(74,222,128,.1)' : 'rgba(248,113,113,.1)',
              border: `1px solid ${resultadoTeste.ok ? 'rgba(74,222,128,.4)' : 'rgba(239,68,68,.4)'}`,
              color: resultadoTeste.ok ? 'var(--green)' : 'var(--red)',
            }}>
              {resultadoTeste.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              {resultadoTeste.ok ? 'Conexão testada com sucesso.' : resultadoTeste.erro}
            </div>
          )}

          {resultadoTeste?.ok === false && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--t2)', cursor: 'pointer' }}>
              <input type="checkbox" checked={confirmarSalvarSemTeste} onChange={e => setConfirmarSalvarSemTeste(e.target.checked)} />
              Salvar mesmo assim
            </label>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '10px 22px 16px', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={testarConexao} disabled={testando || salvando}>
            {testando ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {testando ? 'Testando...' : 'Testar conexão'}
          </button>
          <button className="btn btn-ghost" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={salvando}>
            <Save size={13} /> {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
