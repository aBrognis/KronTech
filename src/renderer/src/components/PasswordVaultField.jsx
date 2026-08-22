import { useState, useEffect } from 'react'
import { Eye, EyeOff, RefreshCw, Copy, Check, Settings2, Save, Star } from 'lucide-react'

const MAXLEN = 200

const CLASSES = {
  maiuscula: { label: 'Letras maiúsculas (A-Z)', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  minuscula: { label: 'Letras minúsculas (a-z)',  chars: 'abcdefghijklmnopqrstuvwxyz' },
  numero:    { label: 'Números (0-9)',            chars: '0123456789' },
  simbolo:   { label: 'Símbolos (!@#$%)',         chars: '!@#$%&*+-=?' },
}
const AMBIGUOS = /[Il1O0]/

function gerarSenha({ tamanho, classes, evitarAmbiguos }) {
  const ativas = Object.keys(CLASSES).filter(k => classes[k])
  if (!ativas.length) return ''
  let alfabeto = ativas.map(k => CLASSES[k].chars).join('')
  if (evitarAmbiguos) alfabeto = alfabeto.replace(AMBIGUOS, '')
  if (!alfabeto) return ''
  const arr = new Uint32Array(tamanho)
  crypto.getRandomValues(arr)
  return Array.from(arr, n => alfabeto[n % alfabeto.length]).join('')
}

// Estimativa leve de força — sem depender de libs pesadas tipo zxcvbn.
// Combina comprimento + variedade de classes de caractere + penalidade por
// padrões óbvios (repetição, sequência). Suficiente pra um indicador visual,
// não é uma auditoria criptográfica de verdade. Espelhada no backend
// (src/main/handlers/cofreSenhas.js) pra gravar o nível junto com a senha.
export function calcularForcaSenha(senha) {
  if (!senha) return { score: 0, barraPct: 0, label: '', cor: 'var(--bd2)' }
  let pontos = 0
  pontos += Math.min(senha.length, 32) * 2.2 // até 32 chars — sem teto artificial pra tokens longos
  if (/[a-z]/.test(senha)) pontos += 6
  if (/[A-Z]/.test(senha)) pontos += 6
  if (/[0-9]/.test(senha)) pontos += 6
  if (/[^a-zA-Z0-9]/.test(senha)) pontos += 6 // símbolo é um extra, não um requisito pra força máxima
  if (/(.)\1{2,}/.test(senha)) pontos -= 15 // repetição tipo "aaa"
  if (/012|123|234|345|456|567|678|789|abc|bcd|cde/i.test(senha)) pontos -= 10 // sequência
  if (senha.length < 8) pontos -= 20
  pontos = Math.max(0, Math.min(100, pontos))

  // barraPct é a largura visual da barra — degraus fixos por faixa, não o
  // score bruto (que raramente chega perto de 100 mesmo numa senha ótima,
  // já que o teto de comprimento pontuado é 32 chars) — sem isso, mesmo uma
  // senha "Muito forte" aparentava barra incompleta.
  if (pontos < 35)  return { score: pontos, barraPct: 25,  label: 'Fraca',       cor: '#f87171' }
  if (pontos < 65)  return { score: pontos, barraPct: 50,  label: 'Média',       cor: '#fbbf24' }
  if (pontos < 85)  return { score: pontos, barraPct: 75,  label: 'Forte',       cor: '#4ade80' }
  return                   { score: pontos, barraPct: 100, label: 'Muito forte', cor: '#22c55e' }
}

// Campo de senha reversível: mostrar/ocultar, copiar, gerador configurável
// (comprimento + classes de caractere) e barra de força — usado tanto pelo
// campo "senha_cofre" do FormBuilder quanto pela tela nativa Cofre de Senhas.
export default function PasswordVaultField({ value, onChange, disabled, placeholder = 'Senha', semGerador = false, multilinha = false, onVisualizar, onCopiar }) {
  const [visivel, setVisivel]         = useState(false)
  const [copiado, setCopiado]         = useState(false)
  const [showGerador, setShowGerador] = useState(false)
  const [tamanho, setTamanho]         = useState(20)
  const [classes, setClasses]         = useState({ maiuscula: true, minuscula: true, numero: true, simbolo: true })
  const [evitarAmbiguos, setEvitarAmbiguos] = useState(false)

  const [perfis, setPerfis]                 = useState([])
  const [perfilSelecionado, setPerfilSelecionado] = useState('')
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)
  const [nomeNovoPerfil, setNomeNovoPerfil] = useState('')

  useEffect(() => {
    if (semGerador || !window.api?.cofreSenhaGerador) return
    window.api.cofreSenhaGerador.listarPerfis().then(res => {
      if (!res.ok) return
      const lista = res.data || []
      setPerfis(lista)
      const padrao = lista.find(p => p.padrao)
      if (padrao) aplicarPerfil(padrao)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function aplicarPerfil(p) {
    setTamanho(p.tamanho)
    setClasses({ maiuscula: p.usa_maiuscula, minuscula: p.usa_minuscula, numero: p.usa_numero, simbolo: p.usa_simbolo })
    setEvitarAmbiguos(p.evitar_ambiguos)
    setPerfilSelecionado(String(p.id))
  }

  async function salvarPerfilAtual() {
    if (!nomeNovoPerfil.trim()) return
    const res = await window.api.cofreSenhaGerador.salvarPerfil({
      nome: nomeNovoPerfil.trim(), tamanho, usa_maiuscula: classes.maiuscula, usa_minuscula: classes.minuscula,
      usa_numero: classes.numero, usa_simbolo: classes.simbolo, evitar_ambiguos: evitarAmbiguos, padrao: perfis.length === 0,
    })
    if (res.ok) {
      const listar = await window.api.cofreSenhaGerador.listarPerfis()
      if (listar.ok) setPerfis(listar.data || [])
      setPerfilSelecionado(String(res.data.id))
      setNomeNovoPerfil('')
      setSalvandoPerfil(false)
    }
  }

  const forca = calcularForcaSenha(value)

  function handleGerar() {
    const nova = gerarSenha({ tamanho, classes, evitarAmbiguos })
    if (nova) { onChange(nova); setVisivel(true) }
  }

  async function handleCopiar() {
    if (!value) return
    try {
      await window.api.clipboard.write(value)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
      onCopiar?.()
    } catch (e) { console.error('copiar senha:', e) }
  }

  function toggleVisivel() {
    setVisivel(v => {
      if (!v) onVisualizar?.()
      return !v
    })
  }

  const nenhumaClasseAtiva = !Object.values(classes).some(Boolean)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          {multilinha ? (
            <textarea
              className="form-textarea"
              value={visivel ? value : value ? '•'.repeat(Math.min(value.length, 60)) : ''}
              onChange={e => { if (visivel) onChange(e.target.value.slice(0, MAXLEN * 4)) }}
              readOnly={!visivel}
              disabled={disabled}
              placeholder={placeholder}
              rows={3}
              style={{ width: '100%', paddingRight: 32, fontFamily: visivel ? 'monospace' : undefined, resize: 'vertical' }}
            />
          ) : (
            <input
              className="form-input"
              type={visivel ? 'text' : 'password'}
              value={value}
              onChange={e => onChange(e.target.value.slice(0, MAXLEN))}
              disabled={disabled}
              placeholder={placeholder}
              autoComplete="new-password"
              maxLength={MAXLEN}
              style={{ height: 36, width: '100%', paddingRight: 32, fontFamily: visivel ? 'monospace' : undefined, letterSpacing: visivel ? undefined : 2 }}
            />
          )}
          <button type="button" onClick={toggleVisivel} disabled={!value}
            style={{ position: 'absolute', right: 6, top: multilinha ? 10 : '50%', transform: multilinha ? 'none' : 'translateY(-50%)', background: 'none', border: 'none', cursor: value ? 'pointer' : 'default', color: 'var(--t3)', display: 'flex', padding: 2, opacity: value ? 1 : .4 }}
            title={visivel ? 'Ocultar' : 'Mostrar'}>
            {visivel ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {!disabled && !semGerador && (
          <button type="button" className="btn btn-ghost"
            onClick={() => setShowGerador(v => !v)} title="Configurar gerador de senha"
            style={{ flexShrink: 0, padding: '0 9px', height: 36, color: showGerador ? 'var(--or)' : undefined }}>
            <Settings2 size={14} />
          </button>
        )}
        {!disabled && !semGerador && (
          <button type="button" className="btn btn-ghost"
            onClick={handleGerar} title="Gerar senha" style={{ flexShrink: 0, padding: '0 9px', height: 36 }}>
            <RefreshCw size={14} />
          </button>
        )}
        <button type="button" className="btn btn-ghost" disabled={!value}
          onClick={handleCopiar} title="Copiar" style={{ flexShrink: 0, padding: '0 9px', height: 36, color: copiado ? 'var(--green)' : undefined }}>
          {copiado ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {value && !semGerador && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, height: 4, background: 'var(--s3)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${forca.barraPct}%`, background: forca.cor, borderRadius: 99, transition: 'width .2s ease, background .2s ease' }} />
          </div>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: forca.cor, flexShrink: 0, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: .3 }}>
            {forca.label}
          </span>
        </div>
      )}

      {showGerador && !semGerador && (
        <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .6 }}>Gerador de senha</span>

            {perfis.length > 0 && (
              <select className="form-select" style={{ height: 30, fontSize: 11.5 }} value={perfilSelecionado}
                onChange={e => { const p = perfis.find(x => String(x.id) === e.target.value); if (p) aplicarPerfil(p) }}>
                <option value="">Perfil personalizado</option>
                {perfis.map(p => <option key={p.id} value={p.id}>{p.nome}{p.padrao ? ' (padrão)' : ''}</option>)}
              </select>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--t2)' }}>Comprimento</span>
                <input type="number" min={8} max={64} value={tamanho}
                  onChange={e => setTamanho(Math.max(8, Math.min(64, Number(e.target.value) || 8)))}
                  style={{ width: 52, height: 26, fontSize: 12, fontWeight: 700, textAlign: 'center', fontVariantNumeric: 'tabular-nums', background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 6, color: 'var(--t1)' }} />
              </div>
              <input type="range" min={8} max={64} value={tamanho}
                onChange={e => setTamanho(Number(e.target.value))}
                style={{ width: '100%' }} />
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 6 }}>Caracteres incluídos</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(CLASSES).map(([key, { label, chars }]) => {
                  const ativa = classes[key]
                  return (
                    <button key={key} type="button" onClick={() => setClasses(c => ({ ...c, [key]: !c[key] }))}
                      title={label}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                        border: `1px solid ${ativa ? 'var(--or)' : 'var(--bd)'}`,
                        background: ativa ? 'var(--or3)' : 'var(--s1)',
                        color: ativa ? 'var(--or)' : 'var(--t3)',
                        fontSize: 11, fontWeight: 600,
                      }}>
                      <code style={{ fontFamily: 'monospace', fontSize: 10.5 }}>{chars.slice(0, 3)}</code>
                      {label.split(' (')[0]}
                    </button>
                  )
                })}
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11.5, color: 'var(--t2)' }}>
              <input type="checkbox" checked={evitarAmbiguos}
                onChange={e => setEvitarAmbiguos(e.target.checked)} />
              Evitar caracteres ambíguos (I, l, 1, O, 0)
            </label>

            {nenhumaClasseAtiva && (
              <div style={{ fontSize: 10.5, color: 'var(--red)' }}>Selecione ao menos um tipo de caractere.</div>
            )}
            <button type="button" className="btn btn-primary" disabled={nenhumaClasseAtiva}
              onClick={handleGerar} style={{ height: 32, fontSize: 11.5, gap: 6 }}>
              <RefreshCw size={12} /> Gerar senha
            </button>

            {window.api?.cofreSenhaGerador && (
              salvandoPerfil ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="form-input" style={{ height: 28, fontSize: 11, flex: 1 }}
                    value={nomeNovoPerfil} onChange={e => setNomeNovoPerfil(e.target.value)}
                    placeholder="Nome do perfil" autoFocus />
                  <button type="button" className="btn btn-primary" disabled={!nomeNovoPerfil.trim()}
                    onClick={salvarPerfilAtual} style={{ height: 28, fontSize: 11, padding: '0 8px' }}>
                    <Save size={11} />
                  </button>
                </div>
              ) : (
                <button type="button" className="btn btn-ghost"
                  onClick={() => setSalvandoPerfil(true)} style={{ height: 26, fontSize: 10.5, gap: 5 }}>
                  <Star size={11} /> Salvar como perfil...
                </button>
              )
            )}
        </div>
      )}
    </div>
  )
}
