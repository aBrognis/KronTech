import { useState, useEffect, useRef } from 'react'
import { Palette, User, Save, RotateCcw, Pencil, Check, X, LayoutDashboard, Bell, Search, DatabaseZap, FolderOpen, Loader2, ChevronDown, KeyRound, Copy as CopyIcon } from 'lucide-react'
import { notificar } from '../components/Notificacao'
import ImportarBancoModal from '../components/ImportarBancoModal'

const CORES = [
  { nome: 'KronTech',  hex: '#D95218' },
  { nome: 'Âmbar',    hex: '#F59E0B' },
  { nome: 'Lima',     hex: '#84CC16' },
  { nome: 'Verde',    hex: '#10B981' },
  { nome: 'Ciano',    hex: '#06B6D4' },
  { nome: 'Azul',     hex: '#3B82F6' },
  { nome: 'Índigo',   hex: '#6366F1' },
  { nome: 'Roxo',     hex: '#8B5CF6' },
  { nome: 'Rosa',     hex: '#EC4899' },
  { nome: 'Vermelho', hex: '#EF4444' },
]

const VAZIO = {
  cor: '#D95218', nomeSistema: 'KronTech',
  nomeUsuario: 'Anderson', cargoUsuario: 'Administrador',
}

export function aplicarCorSistema(hex) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const L = (n, a) => Math.min(255, n + a)
  const D = (n, a) => Math.max(0,   n - a)
  const r2 = Math.round(r * .87), g2 = Math.round(g * .87), b2 = Math.round(b * .87)

  let el = document.getElementById('kron-color-override')
  if (!el) {
    el = document.createElement('style')
    el.id = 'kron-color-override'
    document.head.appendChild(el)
  }
  el.textContent = `
    :root, html.light {
      --or:  ${hex} !important;
      --or2: rgb(${r2},${g2},${b2}) !important;
      --or3: rgba(${r},${g},${b},.12) !important;
      --or4: rgba(${r},${g},${b},.06) !important;
    }
    .btn-primary {
      background: linear-gradient(180deg,
        rgb(${L(r,18)},${L(g,18)},${L(b,18)}) 0%,
        ${hex} 55%,
        rgb(${r2},${g2},${b2}) 100%) !important;
      box-shadow:
        0 1px 0 rgba(255,255,255,.18) inset,
        0 -1px 0 rgba(0,0,0,.12) inset,
        0 2px 6px rgba(${r},${g},${b},.4),
        0 1px 2px rgba(0,0,0,.2) !important;
    }
    .btn-primary:hover {
      background: linear-gradient(180deg,
        rgb(${L(r,28)},${L(g,28)},${L(b,28)}) 0%,
        rgb(${L(r,14)},${L(g,14)},${L(b,14)}) 55%,
        rgb(${L(r,4)},${L(g,4)},${L(b,4)}) 100%) !important;
      box-shadow:
        0 1px 0 rgba(255,255,255,.18) inset,
        0 -1px 0 rgba(0,0,0,.12) inset,
        0 0 22px rgba(${r},${g},${b},.55),
        0 4px 16px rgba(${r},${g},${b},.35),
        0 2px 4px rgba(0,0,0,.2) !important;
    }
    .btn-primary:active {
      background: linear-gradient(180deg,
        rgb(${D(r,18)},${D(g,18)},${D(b,18)}) 0%,
        rgb(${D(r,28)},${D(g,28)},${D(b,28)}) 100%) !important;
    }
    .form-input:focus,
    .form-select:focus,
    .form-textarea:focus,
    .search-input:focus {
      box-shadow: 0 0 0 3.5px rgba(${r},${g},${b},.14), var(--sh-xs) !important;
    }
    .btn-outline {
      color: var(--or) !important;
      border-color: rgba(${r},${g},${b},.3) !important;
    }
    .btn-outline:hover {
      background: rgba(${r},${g},${b},.07) !important;
      border-color: rgba(${r},${g},${b},.5) !important;
      box-shadow: 0 4px 12px rgba(${r},${g},${b},.15) !important;
    }
    .sb-av {
      box-shadow: 0 0 12px rgba(${r},${g},${b},.4) !important;
    }
    .sb::before {
      background: radial-gradient(ellipse at 50% 0%, rgba(${r},${g},${b},.1) 0%, transparent 70%) !important;
    }
    html.light .sb::before {
      background: radial-gradient(ellipse at 50% 0%, rgba(${r},${g},${b},.07) 0%, transparent 70%) !important;
    }
    .sb-logo-icon {
      filter: drop-shadow(0 0 10px rgba(${r},${g},${b},.35)) !important;
    }
    .sb-logo-icon:hover {
      filter: drop-shadow(0 0 16px rgba(${r},${g},${b},.6)) !important;
    }
    .ni.active {
      background: linear-gradient(90deg,
        rgba(${r},${g},${b},.11) 0%,
        rgba(${r},${g},${b},.03) 60%,
        transparent 100%) !important;
    }
    .ni.active::before {
      background: linear-gradient(180deg,
        rgb(${L(r,25)},${L(g,25)},${L(b,25)}),
        ${hex},
        rgb(${r2},${g2},${b2})) !important;
      box-shadow: 2px 0 10px rgba(${r},${g},${b},.5) !important;
    }
    .ni.active .ni-icon {
      filter: drop-shadow(0 0 6px rgba(${r},${g},${b},.7)) !important;
    }
    .tab-item.active {
      background: linear-gradient(180deg, rgba(${r},${g},${b},.11) 0%, rgba(${r},${g},${b},.03) 60%, transparent 100%) !important;
      border-color: rgba(${r},${g},${b},.2) !important;
    }
    .tab-item.active::after {
      background: linear-gradient(90deg, rgb(${L(r,20)},${L(g,20)},${L(b,20)}), ${hex}, rgb(${D(r,10)},${D(g,10)},${D(b,10)})) !important;
    }
    .tab-item.active .tab-icon {
      filter: drop-shadow(0 0 4px rgba(${r},${g},${b},.5)) !important;
    }
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 12px rgba(${r},${g},${b},0.3); }
      50%       { box-shadow: 0 0 24px rgba(${r},${g},${b},0.5), 0 0 48px rgba(${r},${g},${b},0.15); }
    }
  `
}

const VAZIO_BANCO_PROD = { host: '', port: '5432', database: '', usuario: '', senha: '', iniPath: '' }
const VAZIO_BANCO_DEV  = { host: '', port: '5432', database: '', usuario: '', senha: '' }

export default function Configuracoes() {
  const pickerRef  = useRef(null)
  const [editando, setEditando] = useState(false)
  const [saved,    setSaved]    = useState(VAZIO)
  const [form,     setForm]     = useState(VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [salvo,    setSalvo]    = useState(false)

  const [isDev, setIsDev] = useState(false)
  const [editandoBancoProd, setEditandoBancoProd] = useState(false)
  const [savedBancoProd, setSavedBancoProd] = useState(VAZIO_BANCO_PROD)
  const [bancoProd, setBancoProd] = useState(VAZIO_BANCO_PROD)
  const [salvandoBancoProd, setSalvandoBancoProd] = useState(false)
  const [salvoBancoProd, setSalvoBancoProd] = useState(false)
  const [testandoConexao, setTestandoConexao] = useState(false)
  const [resultadoTeste, setResultadoTeste] = useState(null) // { ok, mensagem }
  const [importBancoOpen, setImportBancoOpen] = useState(false)

  const [editandoBancoDev, setEditandoBancoDev] = useState(false)
  const [savedBancoDev, setSavedBancoDev] = useState(VAZIO_BANCO_DEV)
  const [bancoDev, setBancoDev] = useState(VAZIO_BANCO_DEV)
  const [salvandoBancoDev, setSalvandoBancoDev] = useState(false)
  const [salvoBancoDev, setSalvoBancoDev] = useState(false)
  const [testandoConexaoDev, setTestandoConexaoDev] = useState(false)
  const [resultadoTesteDev, setResultadoTesteDev] = useState(null)

  const [gerandoToken, setGerandoToken] = useState(false)
  const [tokenGerado, setTokenGerado]   = useState(null) // { token, expira_em }
  const [tokenCopiado, setTokenCopiado] = useState(false)

  useEffect(() => {
    window.api.config.get().then(res => {
      const p = (res.ok ? res.data?.Personalizacao : null) || {}
      const corSalva = p.cor_primaria === '#FF6B2B' ? '#D95218' : (p.cor_primaria || VAZIO.cor)
      const loaded = {
        cor:          corSalva,
        nomeSistema:  p.nome_sistema || VAZIO.nomeSistema,
        nomeUsuario:  p.nome_usuario || VAZIO.nomeUsuario,
        cargoUsuario: p.cargo_usuario || VAZIO.cargoUsuario,
      }
      setSaved(loaded)
      setForm(loaded)

      const bp = (res.ok ? res.data?.BancoProducao : null) || {}
      const bpLoaded = {
        host:     bp.host || '',
        port:     bp.port || '5432',
        database: bp.database || '',
        usuario:  bp.usuario || '',
        senha:    '', // nunca reexibida em claro
        iniPath:  bp.iniPath || '',
      }
      setSavedBancoProd(bpLoaded)
      setBancoProd(bpLoaded)

      const b = (res.ok ? res.data?.Banco : null) || {}
      const bLoaded = {
        host:     b.host || '',
        port:     b.port || '5432',
        database: b.database || '',
        usuario:  b.usuario || '',
        senha:    '', // nunca reexibida em claro
      }
      setSavedBancoDev(bLoaded)
      setBancoDev(bLoaded)
    }).catch(() => {})
    window.api.importarBanco?.isDev().then(res => res.ok && setIsDev(res.data)).catch(() => {})
  }, [])

  function setBP(key, val) {
    setBancoProd(f => ({ ...f, [key]: val }))
    setResultadoTeste(null)
  }

  async function selecionarPastaIniProducao() {
    const res = await window.api.config.selecionarArquivoIni()
    if (res.ok && res.data) setBP('iniPath', res.data)
  }

  function cancelarBancoProd() {
    setBancoProd({ ...savedBancoProd, senha: '' })
    setEditandoBancoProd(false)
    setResultadoTeste(null)
  }

  async function salvarBancoProducao() {
    setSalvandoBancoProd(true)
    try {
      // Só envia campos preenchidos — evita que clicar "Salvar" logo após só
      // trocar a pasta do .ini (ou só um campo) apague os demais já salvos
      // com string vazia. Senha segue a mesma regra (nunca reexibida em
      // claro, só sobrescreve se o usuário digitou algo novo).
      const payload = {}
      if (bancoProd.host)     payload.host     = bancoProd.host
      if (bancoProd.port)     payload.port     = bancoProd.port
      if (bancoProd.database) payload.database = bancoProd.database
      if (bancoProd.usuario)  payload.usuario  = bancoProd.usuario
      if (bancoProd.senha)    payload.senha    = bancoProd.senha
      if (bancoProd.iniPath)  payload.iniPath  = bancoProd.iniPath
      await window.api.config.setSection('BancoProducao', payload)
      const novoSaved = { ...bancoProd, senha: '' }
      setSavedBancoProd(novoSaved)
      setBancoProd(novoSaved)
      setEditandoBancoProd(false)
      setSalvoBancoProd(true)
      setTimeout(() => setSalvoBancoProd(false), 2500)
    } catch (e) {
      notificar.erro('Erro ao salvar: ' + e.message)
    } finally {
      setSalvandoBancoProd(false)
    }
  }

  async function testarConexaoBancoProducao() {
    setTestandoConexao(true)
    setResultadoTeste(null)
    try {
      // Testa contra o que está salvo — pede pra salvar primeiro se houve edição.
      await salvarBancoProducao()
      const res = await window.api.importarBanco.testarConexaoProducao()
      setResultadoTeste(res.ok ? { ok: true, mensagem: 'Conexão bem-sucedida.' } : { ok: false, mensagem: res.erro })
    } catch (e) {
      setResultadoTeste({ ok: false, mensagem: e.message })
    } finally {
      setTestandoConexao(false)
    }
  }

  function setBD(key, val) {
    setBancoDev(f => ({ ...f, [key]: val }))
    setResultadoTesteDev(null)
  }

  function cancelarBancoDev() {
    setBancoDev({ ...savedBancoDev, senha: '' })
    setEditandoBancoDev(false)
    setResultadoTesteDev(null)
  }

  async function salvarBancoDev() {
    setSalvandoBancoDev(true)
    try {
      // Mesma regra de BancoProducao: só envia campos preenchidos, pra não
      // sobrescrever com vazio um valor já salvo (ex.: senha, que nunca é
      // reexibida em claro).
      const payload = {}
      if (bancoDev.host)     payload.host     = bancoDev.host
      if (bancoDev.port)     payload.port     = bancoDev.port
      if (bancoDev.database) payload.database = bancoDev.database
      if (bancoDev.usuario)  payload.usuario  = bancoDev.usuario
      if (bancoDev.senha)    payload.senha    = bancoDev.senha
      await window.api.config.setSection('Banco', payload)
      const novoSaved = { ...bancoDev, senha: '' }
      setSavedBancoDev(novoSaved)
      setBancoDev(novoSaved)
      setEditandoBancoDev(false)
      setSalvoBancoDev(true)
      setTimeout(() => setSalvoBancoDev(false), 2500)
    } catch (e) {
      notificar.erro('Erro ao salvar: ' + e.message)
    } finally {
      setSalvandoBancoDev(false)
    }
  }

  async function testarConexaoBancoDev() {
    setTestandoConexaoDev(true)
    setResultadoTesteDev(null)
    try {
      await salvarBancoDev()
      const res = await window.api.importarBanco.testarConexaoDev()
      setResultadoTesteDev(res.ok ? { ok: true, mensagem: 'Conexão bem-sucedida.' } : { ok: false, mensagem: res.erro })
    } catch (e) {
      setResultadoTesteDev({ ok: false, mensagem: e.message })
    } finally {
      setTestandoConexaoDev(false)
    }
  }

  async function gerarTokenImportacao() {
    setGerandoToken(true)
    setTokenGerado(null)
    setTokenCopiado(false)
    try {
      const res = await window.api.tokenImportacao.gerar()
      if (res.ok) setTokenGerado(res.data)
      else notificar.erro('Erro ao gerar token: ' + res.erro)
    } catch (e) {
      notificar.erro('Erro ao gerar token: ' + e.message)
    } finally {
      setGerandoToken(false)
    }
  }

  function copiarToken() {
    if (!tokenGerado) return
    window.api.clipboard.write(tokenGerado.token)
    setTokenCopiado(true)
    setTimeout(() => setTokenCopiado(false), 2000)
  }

  // A cor só é aplicada ao sistema inteiro (sidebar, abas, badges) ao salvar
  // ou cancelar; enquanto em edição, só a pré-visualização à direita reflete
  // a escolha, para não mudar o app inteiro no meio de uma alteração ainda
  // não confirmada.
  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleCor(hex) {
    set('cor', hex)
  }

  function cancelar() {
    setForm({ ...saved })
    setEditando(false)
  }

  function reverter() {
    setForm({ ...VAZIO })
  }

  async function salvar() {
    setSalvando(true)
    try {
      await window.api.config.setSection('Personalizacao', {
        cor_primaria:  form.cor,
        nome_sistema:  form.nomeSistema,
        nome_usuario:  form.nomeUsuario,
        cargo_usuario: form.cargoUsuario,
      })
      setSaved({ ...form })
      setEditando(false)
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2500)
      aplicarCorSistema(form.cor)
      window.dispatchEvent(new CustomEvent('krontech:config-changed', {
        detail: { cor: form.cor, nomeSistema: form.nomeSistema, nomeUsuario: form.nomeUsuario, cargoUsuario: form.cargoUsuario }
      }))
    } catch (e) {
      notificar.erro('Erro ao salvar: ' + e.message)
    } finally {
      setSalvando(false)
    }
  }

  const nomeCorAtual = CORES.find(c => c.hex.toLowerCase() === form.cor.toLowerCase())?.nome

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>

      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0, alignItems: 'flex-start' }}>

        {/* ─ COLUNA ESQUERDA: controles ─ */}
        <div style={{ flex: '1 1 460px', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Aparência */}
          <SecCard icon={<Palette size={14} />} title="Aparência" subtitle="Cor de destaque usada em botões, ícones e realces">
            {!editando ? (
              <div className="form-input" style={{
                display: 'flex', alignItems: 'center', gap: 10,
                height: 'auto', padding: '10px 12px', cursor: 'default',
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: form.cor,
                  boxShadow: `0 0 0 1px rgba(0,0,0,.15)`,
                }} />
                <span style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 500 }}>
                  {nomeCorAtual ?? 'Personalizada'}
                </span>
                <code style={{
                  fontSize: 11, color: 'var(--t3)', fontFamily: 'monospace',
                  letterSpacing: 1, marginLeft: 2,
                }}>
                  {form.cor.toUpperCase()}
                </code>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8,
                }}>
                  {CORES.map(s => {
                    const sel = form.cor.toLowerCase() === s.hex.toLowerCase()
                    return (
                      <button
                        key={s.hex}
                        title={s.nome}
                        onClick={() => handleCor(s.hex)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                          padding: '10px 6px', borderRadius: 9, cursor: 'pointer',
                          background: sel ? `${s.hex}14` : 'var(--s1)',
                          border: `1.5px solid ${sel ? s.hex : 'var(--bd)'}`,
                        }}
                      >
                        <span style={{
                          width: 22, height: 22, borderRadius: 6,
                          background: s.hex, flexShrink: 0,
                          boxShadow: sel ? `0 0 0 3px ${s.hex}30` : 'none',
                        }} />
                        <span style={{ fontSize: 9.5, color: sel ? s.hex : 'var(--t3)', fontWeight: sel ? 700 : 500 }}>{s.nome}</span>
                      </button>
                    )
                  })}
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--s1)', border: '1.5px solid var(--bd)',
                  borderRadius: 10, padding: '9px 12px',
                }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      onClick={() => pickerRef.current?.click()}
                      title="Escolher cor personalizada"
                      style={{
                        width: 26, height: 26, borderRadius: 7, border: 'none',
                        background: form.cor, cursor: 'pointer',
                        boxShadow: `0 0 0 2px var(--s1), 0 0 0 3.5px ${form.cor}`,
                        flexShrink: 0,
                      }}
                    />
                    <input
                      ref={pickerRef}
                      type="color"
                      value={form.cor}
                      onChange={e => handleCor(e.target.value)}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                      tabIndex={-1}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--t2)' }}>Cor personalizada</span>
                  <code style={{
                    fontSize: 11, color: 'var(--t3)', fontFamily: 'monospace',
                    letterSpacing: 1, marginLeft: 'auto',
                  }}>
                    {form.cor.toUpperCase()}
                  </code>
                </div>
              </div>
            )}
          </SecCard>

          {/* Identidade */}
          <SecCard icon={<User size={14} />} title="Identidade" subtitle="Nome exibido no app">
            <Campo label="Nome do sistema" value={form.nomeSistema} onChange={v => set('nomeSistema', v)} placeholder="KronTech" disabled={!editando} />
          </SecCard>

          {/* Token de Importação — só em PRODUÇÃO (oposto dos cards de banco,
              que são dev-only). Gera a autorização de uso único que alguém
              precisa colar no modal "Importar Banco" rodando em dev — sem
              esse token válido, a importação não roda. */}
          {!isDev && (
            <SecCard icon={<KeyRound size={14} />} title="Token de Importação" subtitle="Autoriza 'Importar Banco' em ambiente de dev" collapsible>
              <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 14, lineHeight: 1.6 }}>
                Gere um token aqui e cole no modal "Importar Banco" do ambiente de desenvolvimento. Vale por 10 minutos e só pode ser usado uma vez, mesmo se a importação falhar.
              </div>

              {tokenGerado ? (
                <div className="form-group">
                  <label className="form-label">Token gerado</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="form-input" style={{
                      flex: 1, display: 'flex', alignItems: 'center',
                      height: 'auto', padding: '10px 12px', cursor: 'default', minWidth: 0,
                    }}>
                      <code style={{
                        fontSize: 12, fontFamily: 'monospace', color: 'var(--t1)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {tokenGerado.token}
                      </code>
                    </div>
                    <button className="btn btn-ghost" onClick={copiarToken} style={{ height: 38, flexShrink: 0 }}>
                      {tokenCopiado ? <Check size={13} /> : <CopyIcon size={13} />}
                      {tokenCopiado ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>
                    Expira às {new Date(tokenGerado.expira_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: tokenGerado ? 14 : 0 }}>
                <button className="btn btn-primary" onClick={gerarTokenImportacao} disabled={gerandoToken}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                  {gerandoToken ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <KeyRound size={12} />}
                  {gerandoToken ? 'Gerando...' : tokenGerado ? 'Gerar novo token' : 'Gerar token'}
                </button>
              </div>
            </SecCard>
          )}

          {/* Banco de Desenvolvimento — só em dev, mesma conexão que o app usa
              o tempo todo. Existe pra reconfigurar a senha aqui, sem precisar
              editar o .ini na mão, quando a senha do Postgres muda no servidor. */}
          {isDev && (
            <SecCard icon={<DatabaseZap size={14} />} title="Banco de Desenvolvimento" badge="Ativa agora" collapsible>
              <div style={{
                fontSize: 11.5, color: 'var(--t3)', marginBottom: 12, lineHeight: 1.5,
              }}>
                É esta conexão que a tela que você está vendo agora usa pra ler e salvar tudo: dados, telas, configurações. Se a senha do Postgres mudar, atualize aqui.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                  <Campo label="Host" value={bancoDev.host} onChange={v => setBD('host', v)} placeholder="localhost" disabled={!editandoBancoDev} />
                  <Campo label="Porta" value={bancoDev.port} onChange={v => setBD('port', v)} placeholder="5432" disabled={!editandoBancoDev} />
                </div>
                <Campo label="Banco de dados" value={bancoDev.database} onChange={v => setBD('database', v)} placeholder="krontech_dev" disabled={!editandoBancoDev} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Campo label="Usuário" value={bancoDev.usuario} onChange={v => setBD('usuario', v)} placeholder="postgres" disabled={!editandoBancoDev} />
                  <Campo label="Senha" type="password" value={bancoDev.senha} onChange={v => setBD('senha', v)} placeholder="••••••••" disabled={!editandoBancoDev} />
                </div>

                {resultadoTesteDev && (
                  <div style={{ fontSize: 11.5, color: resultadoTesteDev.ok ? 'var(--green)' : 'var(--red)' }}>
                    {resultadoTesteDev.mensagem}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  {!editandoBancoDev ? (
                    <button className="btn btn-primary" onClick={() => setEditandoBancoDev(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                      <Pencil size={12} /> Alterar
                    </button>
                  ) : (
                    <>
                      <button className="btn btn-ghost" onClick={cancelarBancoDev} disabled={salvandoBancoDev || testandoConexaoDev}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                        <X size={12} /> Cancelar
                      </button>
                      <button className="btn btn-ghost" onClick={testarConexaoBancoDev} disabled={testandoConexaoDev || salvandoBancoDev}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                        {testandoConexaoDev ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <DatabaseZap size={12} />}
                        {testandoConexaoDev ? 'Testando...' : 'Testar conexão'}
                      </button>
                      <button className="btn btn-primary" onClick={salvarBancoDev} disabled={salvandoBancoDev || testandoConexaoDev}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                        {salvoBancoDev ? <><Check size={12} /> Salvo!</> : <><Save size={12} /> {salvandoBancoDev ? 'Salvando...' : 'Salvar'}</>}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </SecCard>
          )}

          {/* Banco de Produção — só em dev, usado pela função "Importar Banco" do menu lateral */}
          {isDev && (
            <SecCard icon={<DatabaseZap size={14} />} title="Banco de Produção" muted collapsible>
              <div style={{
                fontSize: 11.5, color: 'var(--t3)', marginBottom: 12, lineHeight: 1.5,
              }}>
                Esta tela não usa esta conexão pra nada. É só uma credencial guardada para o botão <strong>Importar Banco</strong>, abaixo, que copia os dados de produção por cima do banco de desenvolvimento (acima).
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                  <Campo label="Host" value={bancoProd.host} onChange={v => setBP('host', v)} placeholder="192.168.0.10" disabled={!editandoBancoProd} />
                  <Campo label="Porta" value={bancoProd.port} onChange={v => setBP('port', v)} placeholder="5432" disabled={!editandoBancoProd} />
                </div>
                <Campo label="Banco de dados" value={bancoProd.database} onChange={v => setBP('database', v)} placeholder="krontech" disabled={!editandoBancoProd} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Campo label="Usuário" value={bancoProd.usuario} onChange={v => setBP('usuario', v)} placeholder="postgres" disabled={!editandoBancoProd} />
                  <Campo label="Senha" type="password" value={bancoProd.senha} onChange={v => setBP('senha', v)} placeholder="••••••••" disabled={!editandoBancoProd} />
                </div>

                <div className="form-group">
                  <label className="form-label">Arquivo krontech.ini de produção</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" value={bancoProd.iniPath} readOnly placeholder="Nenhum arquivo selecionado" style={{ flex: 1 }} disabled={!editandoBancoProd} />
                    <button className="btn btn-ghost" onClick={selecionarPastaIniProducao} disabled={!editandoBancoProd} style={{ height: 38, flexShrink: 0 }}>
                      <FolderOpen size={13} /> Selecionar
                    </button>
                  </div>
                </div>

                {resultadoTeste && (
                  <div style={{ fontSize: 11.5, color: resultadoTeste.ok ? 'var(--green)' : 'var(--red)' }}>
                    {resultadoTeste.mensagem}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  {!editandoBancoProd ? (
                    <>
                      <button className="btn btn-danger" onClick={() => setImportBancoOpen(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                        <DatabaseZap size={12} /> Importar Banco
                      </button>
                      <button className="btn btn-primary" onClick={() => setEditandoBancoProd(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                        <Pencil size={12} /> Alterar
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-ghost" onClick={cancelarBancoProd} disabled={salvandoBancoProd || testandoConexao}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                        <X size={12} /> Cancelar
                      </button>
                      <button className="btn btn-ghost" onClick={testarConexaoBancoProducao} disabled={testandoConexao || salvandoBancoProd}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                        {testandoConexao ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <DatabaseZap size={12} />}
                        {testandoConexao ? 'Testando...' : 'Testar conexão'}
                      </button>
                      <button className="btn btn-primary" onClick={salvarBancoProducao} disabled={salvandoBancoProd || testandoConexao}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 14px', height: 32 }}>
                        {salvoBancoProd ? <><Check size={12} /> Salvo!</> : <><Save size={12} /> {salvandoBancoProd ? 'Salvando...' : 'Salvar'}</>}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </SecCard>
          )}

          {/* Ações */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {!editando ? (
              <button
                className="btn btn-primary"
                onClick={() => setEditando(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 16px', height: 34 }}
              >
                <Pencil size={13} strokeWidth={2} />
                Alterar
              </button>
            ) : (
              <>
                <button
                  className="btn btn-ghost"
                  onClick={cancelar}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 16px', height: 34 }}
                >
                  <X size={13} strokeWidth={2} />
                  Cancelar
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={reverter}
                  title="Restaura os valores padrão de fábrica"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 16px', height: 34 }}
                >
                  <RotateCcw size={13} strokeWidth={2} />
                  Reverter ao padrão
                </button>
                <button
                  className="btn btn-primary"
                  onClick={salvar}
                  disabled={salvando}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '0 20px', height: 34 }}
                >
                  {salvo
                    ? <><Check size={13} strokeWidth={2.5} /> Salvo!</>
                    : <><Save  size={13} strokeWidth={2}   /> {salvando ? 'Salvando…' : 'Salvar'}</>
                  }
                </button>
              </>
            )}
          </div>
        </div>

        {/* ─ COLUNA DIREITA: preview ao vivo ─ */}
        <div style={{ flex: '1 1 420px', minWidth: 340, alignSelf: 'stretch', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            background: 'var(--s1)', border: '1px solid var(--bd)',
            borderRadius: 12, overflow: 'hidden',
            display: 'flex', flexDirection: 'column', flex: 1, minHeight: 440,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 14px', borderBottom: '1px solid var(--bd)',
              background: 'var(--s1)', flexShrink: 0,
            }}>
              <LayoutDashboard size={13} color="var(--or)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Pré-visualização</span>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>como o app fica com essas cores</span>
            </div>

            <div style={{ flex: 1, padding: 16, display: 'flex', gap: 12, minHeight: 0 }}>

              {/* Mini sidebar */}
              <div style={{
                width: 118, flexShrink: 0, background: 'var(--s2)', border: '1px solid var(--bd)',
                borderRadius: 10, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 2px' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 5, background: form.cor, flexShrink: 0,
                    boxShadow: `0 0 8px ${form.cor}60`,
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {form.nomeSistema || 'KronTech'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 6px', borderRadius: 6,
                    background: `${form.cor}1c`, borderLeft: `2px solid ${form.cor}`,
                  }}>
                    <LayoutDashboard size={9} color={form.cor} />
                    <div style={{ height: 6, flex: 1, borderRadius: 3, background: `${form.cor}55` }} />
                  </div>
                  {[0.55, 0.7, 0.4].map((w, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 6px' }}>
                      <div style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--s3)', flexShrink: 0 }} />
                      <div style={{ height: 6, width: `${w * 100}%`, borderRadius: 3, background: 'var(--s3)' }} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 4px', borderRadius: 7, background: 'var(--s3)' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: form.cor, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, fontWeight: 700, color: '#fff',
                  }}>US</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Usuário</div>
                    <div style={{ fontSize: 7.5, color: 'var(--t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Sessão ativa</div>
                  </div>
                </div>
              </div>

              {/* Mini conteúdo */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                {/* topbar */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                  background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, background: 'var(--s3)', borderRadius: 6, padding: '3px 7px' }}>
                    <Search size={9} color="var(--t3)" />
                    <div style={{ height: 5, width: '40%', borderRadius: 3, background: 'var(--bd2)' }} />
                  </div>
                  <Bell size={11} color="var(--t3)" />
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: form.cor, flexShrink: 0,
                  }} />
                </div>

                {/* cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[0, 1].map(i => (
                    <div key={i} style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ height: 6, width: '55%', borderRadius: 3, background: 'var(--bd2)' }} />
                      <div style={{ height: 14, width: '70%', borderRadius: 3, background: i === 0 ? form.cor : 'var(--t2)' }} />
                    </div>
                  ))}
                </div>

                {/* preview de componentes reais */}
                <div style={{
                  marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--s2)', border: '1px solid var(--bd)',
                }}>
                  <span style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Componentes
                  </span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button style={{
                      padding: '5px 12px', borderRadius: 6, border: 'none',
                      background: form.cor, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'default',
                    }}>Botão</button>
                    <button style={{
                      padding: '5px 12px', borderRadius: 6, border: `1.5px solid ${form.cor}`,
                      background: 'transparent', color: form.cor, fontSize: 11, cursor: 'default',
                    }}>Outline</button>
                    <span style={{
                      padding: '3px 9px', borderRadius: 20,
                      background: `${form.cor}20`, color: form.cor, fontSize: 10, fontWeight: 600,
                    }}>Badge</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 26, height: 14, borderRadius: 20, background: form.cor, position: 'relative' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, right: 2 }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <ImportarBancoModal open={importBancoOpen} onClose={() => setImportBancoOpen(false)} />
    </div>
  )
}

function SecCard({ icon, title, subtitle, badge, muted, collapsible, children }) {
  const [aberto, setAberto] = useState(!collapsible)
  const Header = collapsible ? 'button' : 'div'

  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--bd)',
      borderRadius: 12, overflow: 'hidden',
      opacity: muted ? .82 : 1,
    }}>
      <Header
        onClick={collapsible ? () => setAberto(a => !a) : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '11px 16px', borderBottom: aberto ? '1px solid var(--bd)' : 'none',
          background: 'none', border: 'none', borderBottomWidth: aberto ? 1 : 0,
          borderBottomStyle: 'solid', borderBottomColor: 'var(--bd)',
          cursor: collapsible ? 'pointer' : 'default', textAlign: 'left', font: 'inherit',
        }}
      >
        <span style={{ color: muted ? 'var(--t3)' : 'var(--or)', display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>
          {title}
        </span>
        {badge && (
          <span style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: .4, textTransform: 'uppercase',
            color: 'var(--green)', background: 'rgba(52,199,89,.12)',
            border: '1px solid rgba(52,199,89,.3)', borderRadius: 99, padding: '2px 8px',
          }}>
            {badge}
          </span>
        )}
        {subtitle && <span style={{ fontSize: 11, color: 'var(--t3)' }}>{subtitle}</span>}
        {collapsible && (
          <ChevronDown size={14} style={{
            marginLeft: 'auto', color: 'var(--t3)', flexShrink: 0,
            transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease',
          }} />
        )}
      </Header>
      {aberto && (
        <div style={{ padding: '14px 16px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Campo({ label, value, onChange, placeholder, disabled, type = 'text' }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={type === 'password' ? 'new-password' : 'off'}
      />
    </div>
  )
}
