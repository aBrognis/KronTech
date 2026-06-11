import { useEffect, useRef, useState } from 'react'

/* ── CSS injetado (porta exata do HTML standalone) ───────────────────────── */
const CSS = `
.lp-left canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.lp-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.016) 1px,transparent 1px);background-size:44px 44px}
html.light .lp-grid{background-image:linear-gradient(rgba(0,0,0,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.02) 1px,transparent 1px)}
.lp-vignette{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 90% 90% at 50% 50%,transparent 30%,rgba(0,0,0,.55) 100%)}
html.light .lp-vignette{background:radial-gradient(ellipse 90% 90% at 50% 50%,transparent 30%,rgba(180,180,180,.12) 100%)}
.lp-glow-c{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 65% 60% at 50% 50%,rgba(255,107,43,.03) 0%,transparent 70%)}
html.light .lp-glow-c{background:radial-gradient(ellipse 65% 60% at 50% 50%,rgba(232,90,26,.04) 0%,transparent 70%)}
.lp-scan{position:absolute;inset:0;pointer-events:none;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.008) 0,rgba(255,255,255,.008) 1px,transparent 1px,transparent 3px)}
html.light .lp-scan{background-image:repeating-linear-gradient(0deg,rgba(0,0,0,.01) 0,rgba(0,0,0,.01) 1px,transparent 1px,transparent 3px)}
.lp-edge-r{position:absolute;top:0;right:0;bottom:0;width:1px;pointer-events:none;background:linear-gradient(180deg,transparent,rgba(255,107,43,.18) 30%,rgba(255,107,43,.18) 70%,transparent)}
html.light .lp-edge-r{background:linear-gradient(180deg,transparent,rgba(232,90,26,.14) 30%,rgba(232,90,26,.14) 70%,transparent)}
.lp-tag-item{padding:3.5px 9px;border-radius:20px;border:.5px solid rgba(255,107,43,.13);background:rgba(255,107,43,.07);color:rgba(255,107,43,.42);font-size:8px;letter-spacing:2px;font-weight:600}
html.light .lp-tag-item{border-color:rgba(232,90,26,.14);background:rgba(232,90,26,.06);color:rgba(200,75,20,.5)}
.lp-win-btn{width:30px;height:30px;border-radius:8px;border:1px solid var(--lp-input-bd,#222);background:transparent;color:var(--lp-t3,#303030);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .22s;outline:none}
.lp-win-btn:hover{background:var(--lp-input-bg,rgba(255,255,255,.04));color:var(--lp-t1,#f0f0f0)}
.lp-win-btn.danger:hover{background:rgba(248,113,113,.1);color:#F87171;border-color:rgba(248,113,113,.35)}
.lp-badge-dot{width:5px;height:5px;border-radius:50%;background:#D95218;box-shadow:0 0 10px #D95218,0 0 4px #D95218;animation:lp-pulse 2.4s ease-in-out infinite}
@keyframes lp-pulse{0%,100%{opacity:.35}50%{opacity:1}}
.lp-input{width:100%;height:46px;padding:0 14px;border-radius:10px;outline:none;font-size:13.5px;font-family:inherit;transition:border-color .22s,background .22s,box-shadow .22s;box-sizing:border-box}
.lp-input::placeholder{opacity:.45}
.lp-input:focus{border-color:#D95218 !important;background:rgba(217,82,24,.05) !important;box-shadow:0 0 0 3px rgba(217,82,24,.28),0 2px 8px rgba(0,0,0,.12) !important}
.lp-input-icon{position:absolute;right:13px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:0;display:flex;transition:color .22s}
.lp-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(217,82,24,.45) 50%,transparent)}
.lp-btn{margin-top:6px;height:48px;border-radius:12px;border:none;color:#fff;font-size:14px;font-weight:700;letter-spacing:.2px;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;position:relative;overflow:hidden;transition:transform .22s,box-shadow .22s}
.lp-btn:hover:not(:disabled){transform:translateY(-2px)}
.lp-btn:active:not(:disabled){transform:translateY(0)}
.lp-btn:disabled{cursor:not-allowed}
.lp-btn-shine{position:absolute;inset:0;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.12) 50%,transparent 70%);opacity:0;transition:opacity .2s;pointer-events:none}
.lp-btn:hover .lp-btn-shine{opacity:1}
.lp-check{width:17px;height:17px;border-radius:5px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .22s;cursor:pointer}
.lp-check.on{box-shadow:0 0 8px rgba(255,107,43,.45)}
.lp-corner-dec{position:absolute;pointer-events:none;opacity:.18}
.lp-corner-dec.tl{top:16px;left:16px}
.lp-corner-dec.bl{bottom:16px;left:16px;transform:scaleY(-1)}
.lp-corner-dec.br{bottom:16px;right:16px;transform:scale(-1)}
.lp-error-box{padding:11px 14px;border-radius:10px;font-size:12px;line-height:1.4;animation:lp-slideUp .28s ease}
@keyframes lp-slideUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
.lp-spinner{width:15px;height:15px;flex-shrink:0;animation:lp-spin .7s linear infinite}
@keyframes lp-spin{to{transform:rotate(360deg)}}
.kr-r3{transform-origin:50px 50px;animation:kr-rR 22s linear infinite}
.kr-r1{transform-origin:50px 50px;animation:kr-rR 32s linear infinite}
.kr-r2{transform-origin:50px 50px;animation:kr-rL 46s linear infinite}
.kr-kt{animation:kr-br 4s ease-in-out infinite}
.kr-orb{animation:kr-op 3s ease-in-out infinite}
@keyframes kr-rR{to{transform:rotate(360deg)}}
@keyframes kr-rL{to{transform:rotate(-360deg)}}
@keyframes kr-br{0%,100%{opacity:.72}50%{opacity:1}}
@keyframes kr-op{0%,100%{opacity:.35}50%{opacity:1}}
`

const DARK_C  = ['#FF6B2B','#444','#383838','#2e2e2e','#555','#333','#404040']
const LIGHT_C = ['#E85A1A','#CC7744','#AAA','#999','#BBBBBB','#888']
const TAGS    = ['AGENDA','ARQUIVOS','SQL','FORMULÁRIOS','DASHBOARD','RELATÓRIOS']
const FF      = "'Segoe UI Variable','Segoe UI',system-ui,sans-serif"

/* ── Particle engine ─────────────────────────────────────────────────────── */
function startParticles(canvas, getColors, count = 92) {
  const ctx   = canvas.getContext('2d')
  const TYPES = ['card','dot','cross','dash','dot','card']

  function resize() {
    canvas.width  = canvas.offsetWidth  || (window.innerWidth - 440)
    canvas.height = canvas.offsetHeight || window.innerHeight
  }
  resize()
  const ro = new ResizeObserver(resize)
  if (canvas.parentElement) ro.observe(canvas.parentElement)

  class P {
    constructor(init) { this.reset(init) }
    reset(init) {
      this.x=Math.random()*canvas.width; this.y=init?Math.random()*canvas.height:canvas.height+30
      this.vx=(Math.random()-.5)*.48; this.vy=-(Math.random()*.58+.1)
      this.a=0; this.ta=Math.random()*.52+.05
      const c=getColors(); this.col=c[Math.floor(Math.random()*c.length)]
      this.type=TYPES[Math.floor(Math.random()*TYPES.length)]
      this.w=Math.random()*28+10; this.h=Math.random()*14+6
      this.r=Math.random()*2.2+.5; this.len=Math.random()*20+5
      this.ang=(Math.random()-.5)*.7; this.sp=(Math.random()-.5)*.008
      this.lf=0; this.ml=Math.random()*420+180
    }
    update() {
      this.x+=this.vx; this.y+=this.vy; this.ang+=this.sp; this.lf++
      if(Math.random()<.003){const c=getColors();this.col=c[Math.floor(Math.random()*c.length)]}
      const h=this.ml*.12,e=this.ml*.8
      if      (this.lf<h) this.a=this.ta*(this.lf/h)
      else if (this.lf>e) this.a=this.ta*(1-(this.lf-e)/(this.ml-e))
      else                this.a=this.ta
      if(this.lf>=this.ml) this.reset(false)
    }
    draw() {
      ctx.save(); ctx.globalAlpha=Math.max(0,this.a)
      ctx.strokeStyle=this.col; ctx.fillStyle=this.col
      if(this.type==='card'){
        ctx.translate(this.x,this.y); ctx.rotate(this.ang); ctx.lineWidth=.7
        ctx.beginPath(); ctx.roundRect(-this.w/2,-this.h/2,this.w,this.h,2.5); ctx.stroke()
        ctx.globalAlpha*=.22; ctx.beginPath(); ctx.moveTo(-this.w/2+4,0); ctx.lineTo(this.w/2-4,0); ctx.stroke()
        ctx.globalAlpha=Math.max(0,this.a*.45); ctx.beginPath(); ctx.arc(-this.w/2+3,-this.h/2+3,.9,0,Math.PI*2); ctx.fill()
      } else if(this.type==='dot'){
        ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill()
      } else if(this.type==='cross'){
        ctx.translate(this.x,this.y); ctx.rotate(this.ang); ctx.lineWidth=.55
        const s=this.len/2
        ctx.beginPath(); ctx.moveTo(-s,0); ctx.lineTo(s,0); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0,-s*.6); ctx.lineTo(0,s*.6); ctx.stroke()
      } else {
        ctx.translate(this.x,this.y); ctx.rotate(this.ang); ctx.lineWidth=.55
        ctx.beginPath(); ctx.moveTo(-this.len/2,0); ctx.lineTo(this.len/2,0); ctx.stroke()
      }
      ctx.restore()
    }
  }

  const ps = Array.from({length:count}, ()=>new P(true))
  let raf
  function loop(){ ctx.clearRect(0,0,canvas.width,canvas.height); ps.forEach(p=>{p.update();p.draw()}); raf=requestAnimationFrame(loop) }
  loop()
  return () => { cancelAnimationFrame(raf); ro.disconnect() }
}

/* ── LoginPage ───────────────────────────────────────────────────────────── */
export default function LoginPage({ onLogin }) {
  const canvasRef  = useRef(null)
  const colorsRef  = useRef(DARK_C)
  const tagsRef    = useRef(null)

  const [isDark,   setIsDark]   = useState(() => (localStorage.getItem('kt-theme')||'dark')==='dark')
  const [usuario,  setUsuario]  = useState('')
  const [senha,    setSenha]    = useState('')
  const [showPass, setShowPass] = useState(false)
  const [lembrar,  setLembrar]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [mounted,  setMounted]  = useState(false)
  const [leftIn,   setLeftIn]   = useState(false)
  const [rightIn,  setRightIn]  = useState(false)
  const [tagsBuilt,setTagsBuilt]= useState(false)

  /* injetar CSS */
  useEffect(() => {
    if (document.getElementById('lp-css')) return
    const s = document.createElement('style')
    s.id = 'lp-css'; s.textContent = CSS
    document.head.appendChild(s)
  }, [])

  /* tema inicial */
  useEffect(() => {
    if (isDark) document.documentElement.classList.remove('light')
    else        document.documentElement.classList.add('light')
  }, [isDark])

  /* entrada */
  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true),  40)
    const t2 = setTimeout(() => setLeftIn(true),  120)
    const t3 = setTimeout(() => setRightIn(true), 200)
    const saved = localStorage.getItem('kt-lembrar-usuario')
    if (saved) { setUsuario(saved); setLembrar(true) }
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  /* partículas */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    colorsRef.current = isDark ? DARK_C : LIGHT_C
    return startParticles(canvas, () => colorsRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* atualizar cor das partículas ao trocar tema */
  useEffect(() => { colorsRef.current = isDark ? DARK_C : LIGHT_C }, [isDark])

  /* tags staggered */
  useEffect(() => {
    if (!tagsBuilt || !tagsRef.current) return
    const wrap = tagsRef.current
    wrap.innerHTML = ''
    TAGS.forEach((t, i) => {
      const el = document.createElement('span')
      el.className = 'lp-tag-item'
      el.textContent = t
      el.style.cssText = `opacity:0;transform:translateY(5px);transition:opacity .35s ease ${.08+i*.06}s,transform .35s ease ${.08+i*.06}s;display:inline-block`
      wrap.appendChild(el)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.opacity = '1'; el.style.transform = 'none'
      }))
    })
  }, [tagsBuilt])

  useEffect(() => { if (leftIn) setTimeout(() => setTagsBuilt(true), 200) }, [leftIn])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('kt-theme', next ? 'dark' : 'light')
    if (next) document.documentElement.classList.remove('light')
    else      document.documentElement.classList.add('light')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!usuario.trim()) { setError('Informe o usuário.'); return }
    if (!senha)          { setError('Informe a senha.');   return }
    setLoading(true)
    try {
      if (lembrar) localStorage.setItem('kt-lembrar-usuario', usuario.trim())
      else         localStorage.removeItem('kt-lembrar-usuario')
      await new Promise(r => setTimeout(r, 1100))
      onLogin?.({ usuario: usuario.trim() })
    } catch {
      setError('Falha na autenticação. Verifique suas credenciais.')
      setLoading(false)
    }
  }

  /* tokens dark/light */
  const dk = {
    bg:'#080808', leftBg:'#0d0d0d', rightBg:'#141414', border:'#1f1f1f',
    cardBg:'rgba(16,16,16,.9)', cardBd:'rgba(255,107,43,.14)',
    inputBg:'rgba(255,255,255,.04)', inputBd:'#222',
    t1:'#f0f0f0', t2:'#707070', t3:'#303030', accent:'#FF6B2B',
    rightGlow:'radial-gradient(ellipse 90% 100% at 50% 0%,rgba(255,107,43,.025) 0%,transparent 70%)',
    btnBg:'linear-gradient(135deg,#B84510 0%,#E85A1A 55%,#FF7A3A 100%)',
    btnSh:'0 6px 28px rgba(192,72,18,.4),0 2px 8px rgba(192,72,18,.2)',
    btnShH:'0 10px 36px rgba(192,72,18,.55),0 3px 12px rgba(192,72,18,.3)',
    cardSh:'0 32px 80px rgba(0,0,0,.55),0 8px 24px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04)',
    divLine:'#1f1f1f', checkBd:'#2a2a2a',
    errBg:'rgba(248,113,113,.07)', errBd:'rgba(248,113,113,.2)', errC:'#F87171',
  }
  const lk = {
    bg:'#ECEDF2', leftBg:'#F8F8FB', rightBg:'#FFFFFF', border:'#DDDDE8',
    cardBg:'rgba(255,255,255,.88)', cardBd:'rgba(232,90,26,.16)',
    inputBg:'rgba(0,0,0,.03)', inputBd:'#DDDDE8',
    t1:'#0e0f14', t2:'#5a5c72', t3:'#a8aac0', accent:'#E85A1A',
    rightGlow:'radial-gradient(ellipse 90% 100% at 50% 0%,rgba(232,90,26,.04) 0%,transparent 70%)',
    btnBg:'linear-gradient(135deg,#B84510 0%,#E85A1A 55%,#FF7A3A 100%)',
    btnSh:'0 6px 28px rgba(232,90,26,.35),0 2px 8px rgba(232,90,26,.18)',
    btnShH:'0 10px 36px rgba(232,90,26,.5),0 3px 12px rgba(232,90,26,.25)',
    cardSh:'0 32px 80px rgba(0,0,0,.07),0 8px 24px rgba(0,0,0,.04),inset 0 1px 0 rgba(255,255,255,.96)',
    divLine:'#DDDDE8', checkBd:'#C8C9D6',
    errBg:'rgba(220,38,38,.05)', errBd:'rgba(220,38,38,.18)', errC:'#DC2626',
  }
  const tk = isDark ? dk : lk

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9000,
      display:'flex', overflow:'hidden',
      background: tk.bg, fontFamily: FF,
      opacity: mounted ? 1 : 0,
      transition: 'opacity .4s ease',
    }}>

      {/* ══ PAINEL ESQUERDO ══ */}
      <div className="lp-left" style={{flex:1, position:'relative', overflow:'hidden', background:tk.leftBg, display:'flex', alignItems:'center', justifyContent:'center'}}>
        <canvas ref={canvasRef}/>
        <div className="lp-grid"/>
        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:isDark?.025:.018,pointerEvents:'none'}}>
          <filter id="lp-n2"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
          <rect width="100%" height="100%" filter="url(#lp-n2)"/>
        </svg>
        <div className="lp-vignette"/>
        <div className="lp-glow-c"/>
        <div className="lp-scan"/>
        <div className="lp-edge-r"/>

        {/* conteúdo */}
        <div style={{
          position:'relative', zIndex:2, display:'flex', flexDirection:'column', alignItems:'center',
          opacity: leftIn?1:0, transform: leftIn?'none':'translateY(14px)',
          transition:'opacity .75s ease .15s, transform .75s ease .15s',
        }}>
          <LoginLogo isDark={isDark}/>

          <div style={{marginTop:26,textAlign:'center'}}>
            <div style={{fontSize:29,letterSpacing:'-1px',lineHeight:1,color:tk.t1}}>
              <b style={{fontWeight:800}}>Kron</b>
              <i style={{color:tk.accent,fontWeight:200,fontStyle:'italic'}}>Tech</i>
            </div>
            <div style={{marginTop:7,fontSize:'8px',letterSpacing:'5px',color:tk.t3,fontWeight:500}}>GESTÃO · TEMPO · TECNOLOGIA</div>
            <div style={{marginTop:8,fontSize:'11.5px',color:tk.t2,fontStyle:'italic',fontWeight:300}}>Ordem no caos do dia a dia.</div>
          </div>

          <div style={{marginTop:30,width:38,height:1,background:`linear-gradient(90deg,transparent,${tk.accent},transparent)`,opacity:.4}}/>

          <div ref={tagsRef} style={{marginTop:22,display:'flex',gap:7,flexWrap:'wrap',justifyContent:'center',maxWidth:300}}/>

          <div style={{marginTop:34,display:'flex',gap:28}}>
            {[['∞','PRODUTIVIDADE'],['01','CONTROLE'],['24/7','DISPONÍVEL']].map(([v,l]) => (
              <div key={l} style={{textAlign:'center'}}>
                <div style={{fontSize:13,fontWeight:800,color:tk.accent,letterSpacing:'-.5px',opacity:.7}}>{v}</div>
                <div style={{fontSize:'7.5px',letterSpacing:'2px',color:isDark?'#4a4a4a':'#9a9cb0',marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* decorações */}
        <div style={{position:'absolute',bottom:18,left:20,fontSize:'8.5px',letterSpacing:'1.5px',color:tk.t3,display:'flex',gap:6,alignItems:'center'}}>
          <span>v{__APP_VERSION__}</span>
          <span style={{opacity:.4}}>·</span>
          <span>{__BUILD_DATE__}</span>
          <span style={{opacity:.4}}>·</span>
          <span>{__BUILD_TIME__}</span>
        </div>
        {['tl','bl'].map(p => (
          <div key={p} className={`lp-corner-dec ${p}`}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M1 9L1 1L9 1" fill="none" stroke={tk.accent} strokeWidth="1"/></svg>
          </div>
        ))}
      </div>

      {/* ══ PAINEL DIREITO ══ */}
      <div style={{
        width:440, flexShrink:0, position:'relative',
        background:tk.rightBg, borderLeft:`1px solid ${tk.border}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        opacity: rightIn?1:0, transform: rightIn?'none':'translateX(22px)',
        transition:'opacity .65s ease .12s, transform .65s ease .12s',
      }}>
        {/* glow topo */}
        <div style={{position:'absolute',top:0,left:0,right:0,height:200,pointerEvents:'none',background:tk.rightGlow}}/>

        {/* botões janela */}
        <div style={{position:'absolute',top:14,right:14,display:'flex',gap:5,zIndex:10}}>
          <button className="lp-win-btn" title={isDark?'Modo claro':'Modo escuro'} onClick={toggleTheme} style={{color:tk.t3}}>
            {isDark
              ? <SunIcon/>
              : <MoonIcon/>}
          </button>
          <button className="lp-win-btn danger" title="Fechar" onClick={() => window.api?.win?.close?.()} style={{color:tk.t3}}>
            <CloseIcon/>
          </button>
        </div>

        {/* card glassmorphism */}
        <div className="lp-card" style={{
          width:360, background:tk.cardBg,
          border:`1px solid ${tk.cardBd}`,
          borderTop:`1px solid ${isDark?'rgba(255,107,43,.22)':'rgba(232,90,26,.28)'}`,
          borderRadius:18, padding:'38px 34px 32px',
          backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)',
          boxShadow:tk.cardSh, position:'relative', overflow:'hidden',
        }}>

          {/* badge */}
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <div className="lp-badge-dot"/>
            <span style={{fontSize:'9.5px',letterSpacing:'3px',color:tk.t3,fontWeight:600}}>ACESSO AO SISTEMA</span>
          </div>
          <div style={{fontSize:24,fontWeight:800,color:tk.t1,letterSpacing:'-.5px',lineHeight:1.15}}>Bem-vindo de volta</div>
          <div style={{marginTop:5,fontSize:'12.5px',color:tk.t2,lineHeight:1.5}}>
            Entre com suas credenciais para<br/>acessar o KronTech.
          </div>

          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14,marginTop:28}}>

            {/* usuário */}
            <div>
              <label style={{display:'block',fontSize:'10.50px',letterSpacing:'1px',color:tk.t3,fontWeight:600,marginBottom:7}}>USUÁRIO</label>
              <input
                className="lp-input"
                type="text" value={usuario} placeholder="SEU.USUÁRIO" autoComplete="username"
                onChange={e => setUsuario(e.target.value)}
                style={{background:tk.inputBg, border:`1px solid ${tk.inputBd}`, color:tk.t1, boxShadow:`0 1px 3px rgba(0,0,0,${isDark?.2:.05})`}}
              />
            </div>

            {/* senha */}
            <div>
              <label style={{display:'block',fontSize:'10.5px',letterSpacing:'1px',color:tk.t3,fontWeight:600,marginBottom:7}}>SENHA</label>
              <div style={{position:'relative'}}>
                <input
                  className="lp-input"
                  type={showPass?'text':'password'} value={senha} placeholder="••••••••" autoComplete="current-password"
                  onChange={e => setSenha(e.target.value)}
                  style={{background:tk.inputBg, border:`1px solid ${tk.inputBd}`, color:tk.t1, paddingRight:46, boxShadow:`0 1px 3px rgba(0,0,0,${isDark?.2:.05})`}}
                />
                <button type="button" className="lp-input-icon" onClick={() => setShowPass(v => !v)} style={{color:tk.t3}}>
                  {showPass ? <EyeOffIcon/> : <EyeIcon/>}
                </button>
              </div>
            </div>

            {/* lembrar + esqueci */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:2}}>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',userSelect:'none'}}>
                <div
                  className={`lp-check${lembrar?' on':''}`}
                  onClick={() => setLembrar(v => !v)}
                  style={{
                    border:`1.5px solid ${lembrar?tk.accent:tk.checkBd}`,
                    background: lembrar ? tk.accent : 'transparent',
                  }}
                >
                  {lembrar && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.8 7L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={{fontSize:12,color:tk.t2}}>Lembrar acesso</span>
              </label>
              <button type="button" style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:tk.t2,padding:0,transition:'color .22s'}}
                onMouseEnter={e=>e.currentTarget.style.color=tk.accent}
                onMouseLeave={e=>e.currentTarget.style.color=tk.t2}
              >
                Esqueci minha senha
              </button>
            </div>

            {/* erro */}
            {error && (
              <div className="lp-error-box" style={{background:tk.errBg, border:`1px solid ${tk.errBd}`, color:tk.errC}}>
                {error}
              </div>
            )}

            {/* botão */}
            <BtnSubmit loading={loading} isDark={isDark} tk={tk}/>
          </form>

          {/* divisor */}
          <div style={{marginTop:26,display:'flex',alignItems:'center',gap:10}}>
            <div style={{flex:1,height:1,background:tk.divLine}}/>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <MiniLogo isDark={isDark}/>
              <span style={{fontSize:'9px',color:tk.t3,letterSpacing:'2px',fontWeight:600}}>KRONTECH</span>
            </div>
            <div style={{flex:1,height:1,background:tk.divLine}}/>
          </div>
        </div>

        <div className="lp-corner-dec br">
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M1 9L1 1L9 1" fill="none" stroke={tk.accent} strokeWidth="1"/></svg>
        </div>
        <div style={{position:'absolute',bottom:16,left:0,right:0,textAlign:'center',fontSize:'8.5px',color:tk.t3,letterSpacing:'2px'}}>
          GESTÃO · TEMPO · TECNOLOGIA
        </div>
      </div>
    </div>
  )
}

/* ── Botão submit com hover state ────────────────────────────────────────── */
function BtnSubmit({ loading, isDark, tk }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="submit" disabled={loading}
      className="lp-btn"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: loading ? (isDark?'#1c1c1c':'#F2F2F6') : tk.btnBg,
        color: loading ? tk.t3 : '#fff',
        boxShadow: loading ? 'none' : (hov ? tk.btnShH : tk.btnSh),
      }}
    >
      <div className="lp-btn-shine"/>
      {loading
        ? <><Spinner/> <span>Autenticando...</span></>
        : <><span>Entrar</span><ArrowIcon/></>
      }
    </button>
  )
}

/* ── Logos e ícones ──────────────────────────────────────────────────────── */
function LoginLogo({ isDark, size = 104 }) {
  const kC = isDark ? '#FFF' : '#111'
  const tC = isDark ? '#FF6B2B' : '#E85A1A'
  const dF = isDark ? '#222' : '#EDEDEE'
  const r1 = isDark ? '#333' : '#DCDCDC'
  const r3 = isDark ? '#222' : '#CCCCCC'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" overflow="visible">
      <defs>
        <radialGradient id="lp-dg2" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor={dF}/>
          <stop offset="100%" stopColor={isDark?'#0e0e0e':'#e8e8e8'}/>
        </radialGradient>
        <filter id="lp-gf2" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle className="kr-r3" cx="50" cy="50" r="47" fill="none" stroke={r3} strokeWidth=".5" strokeDasharray="2 10"/>
      <circle className="kr-r1" cx="50" cy="50" r="40" fill="none" stroke={r1} strokeWidth=".8" strokeDasharray="4 7"/>
      <circle className="kr-r2" cx="50" cy="50" r="32" fill="none" stroke={tC} strokeWidth=".5" strokeDasharray="2 8" opacity=".36"/>
      <circle cx="50" cy="50" r="24" fill="url(#lp-dg2)" stroke={tC} strokeWidth=".85"/>
      <ellipse cx="43" cy="42" rx="7" ry="3.5" fill={isDark?'rgba(255,255,255,.03)':'rgba(255,255,255,.5)'} transform="rotate(-30 43 42)"/>
      <g className="kr-kt" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#lp-gf2)">
        <line x1="37" y1="36" x2="37" y2="64" stroke={kC} strokeWidth="1.6"/>
        <line x1="37" y1="50" x2="49" y2="36" stroke={kC} strokeWidth="1.6"/>
        <line x1="37" y1="50" x2="50" y2="64" stroke={kC} strokeWidth="1.6"/>
        <line x1="55" y1="36" x2="68" y2="36" stroke={tC} strokeWidth="1.6"/>
        <line x1="61.5" y1="36" x2="61.5" y2="64" stroke={tC} strokeWidth="1.6"/>
      </g>
      <line x1="52" y1="38" x2="52" y2="62" stroke={isDark?'#252525':'#cccccc'} strokeWidth=".7"/>
      <line x1="50" y1="10" x2="50" y2="12" stroke={isDark?'#2a2a2a':'#cccccc'} strokeWidth=".8"/>
      <line x1="87.3" y1="25" x2="85.6" y2="26" stroke={isDark?'#2a2a2a':'#cccccc'} strokeWidth=".8"/>
      <line x1="87.3" y1="75" x2="85.6" y2="74" stroke={isDark?'#2a2a2a':'#cccccc'} strokeWidth=".8"/>
      <line x1="50" y1="90" x2="50" y2="88" stroke={isDark?'#2a2a2a':'#cccccc'} strokeWidth=".8"/>
      <line x1="12.7" y1="75" x2="14.4" y2="74" stroke={isDark?'#2a2a2a':'#cccccc'} strokeWidth=".8"/>
      <line x1="12.7" y1="25" x2="14.4" y2="26" stroke={isDark?'#2a2a2a':'#cccccc'} strokeWidth=".8"/>
      <circle className="kr-orb" cx="50" cy="3"  r="2.6" fill={tC}                   style={{animationDelay:'0s'}}/>
      <circle className="kr-orb" cx="97" cy="50" r="2.2" fill={isDark?'#555':'#999'} style={{animationDelay:'1s'}}/>
      <circle className="kr-orb" cx="50" cy="97" r="2.6" fill={tC}                   style={{animationDelay:'2s'}}/>
      <circle className="kr-orb" cx="3"  cy="50" r="2.2" fill={isDark?'#444':'#bbb'} style={{animationDelay:'1.5s'}}/>
    </svg>
  )
}

function MiniLogo({ isDark }) {
  const accent = isDark ? '#FF6B2B' : '#E85A1A'
  const kC     = isDark ? '#aaaaaa' : '#555555'
  const discF  = isDark ? '#1e1e1e' : '#e8e8e8'
  return (
    <svg width="14" height="14" viewBox="0 0 100 100" fill="none" overflow="visible">
      <circle cx="50" cy="50" r="40" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4 8" opacity="0.3"
        style={{transformOrigin:'50px 50px',animation:'kr-rR 32s linear infinite'}}/>
      <circle cx="50" cy="50" r="24" fill={discF} stroke={accent} strokeWidth="1.8"/>
      <g strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="37" y1="36" x2="37" y2="64" stroke={kC}    strokeWidth="3.5"/>
        <line x1="37" y1="50" x2="49" y2="36" stroke={kC}    strokeWidth="3.5"/>
        <line x1="37" y1="50" x2="50" y2="64" stroke={kC}    strokeWidth="3.5"/>
        <line x1="55" y1="36" x2="68" y2="36" stroke={accent} strokeWidth="3.5"/>
        <line x1="61.5" y1="36" x2="61.5" y2="64" stroke={accent} strokeWidth="3.5"/>
      </g>
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="lp-spinner" viewBox="0 0 15 15">
      <circle cx="7.5" cy="7.5" r="6" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.5"/>
      <circle cx="7.5" cy="7.5" r="6" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="1.5" strokeDasharray="12 26" strokeLinecap="round"/>
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )
}
function EyeOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}
function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}
