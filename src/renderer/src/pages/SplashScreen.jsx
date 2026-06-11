import { useEffect, useRef, useState } from 'react'

const CSS = `
.sp-vignette{position:absolute;inset:0;pointer-events:none}
.sp-glow-c{position:absolute;inset:0;pointer-events:none}
.sp-scanlines-d{position:absolute;inset:0;pointer-events:none;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.007) 0,rgba(255,255,255,.007) 1px,transparent 1px,transparent 3px)}
.sp-hline{position:absolute;left:0;right:0;top:50%;height:1px;pointer-events:none}
.sp-corner{position:absolute;pointer-events:none;opacity:.22}
.sp-corner.tl{top:20px;left:20px}
.sp-corner.tr{top:20px;right:20px;transform:scaleX(-1)}
.sp-corner.bl{bottom:20px;left:20px;transform:scaleY(-1)}
.sp-corner.br{bottom:20px;right:20px;transform:scale(-1)}
.sp-shimmer{position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.18) 50%,transparent 100%);background-size:200% 100%;animation:sp-shimmer 2.2s linear infinite}
@keyframes sp-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.sp-dot-pulse{width:5px;height:5px;border-radius:50%;flex-shrink:0;margin-right:8px;transition:background .4s,box-shadow .4s}
.sp-dot-pulse.active{animation:sp-pulse 1.4s ease-in-out infinite}
@keyframes sp-pulse{0%,100%{opacity:.35}50%{opacity:1}}
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

const STEPS = [
  { pct: 8,   msg: 'Iniciando módulos do sistema...' },
  { pct: 22,  msg: 'Carregando configurações...'      },
  { pct: 38,  msg: 'Conectando ao banco de dados...' },
  { pct: 54,  msg: 'Sincronizando ambiente...'        },
  { pct: 70,  msg: 'Otimizando fluxo de trabalho...' },
  { pct: 86,  msg: 'Validando sessão...'              },
  { pct: 100, msg: 'Inicialização concluída.'         },
]

const DARK_C  = ['#FF6B2B','#444','#383838','#2e2e2e','#555','#333','#404040']
const LIGHT_C = ['#E85A1A','#CC7744','#AAA','#999','#BBBBBB','#888']

export default function SplashScreen({ onDone }) {
  const canvasRef = useRef(null)
  const fillRef   = useRef(null)
  const msgRef    = useRef(null)
  const pctRef    = useRef(null)
  const dotRef    = useRef(null)

  // lê tema salvo imediatamente — sem flash
  const savedTheme = localStorage.getItem('kt-theme') || 'dark'
  const [isDark] = useState(savedTheme === 'dark')

  const [logoIn,  setLogoIn]  = useState(false)
  const [wordIn,  setWordIn]  = useState(false)
  const [progIn,  setProgIn]  = useState(false)
  const [verIn,   setVerIn]   = useState(false)
  const [fading,  setFading]  = useState(false)

  // tokens por tema
  const tk = isDark ? {
    bg:         '#080808',
    vignette:   'radial-gradient(ellipse 100% 100% at 50% 50%,transparent 30%,rgba(0,0,0,.65) 100%)',
    glow:       'radial-gradient(ellipse 55% 45% at 50% 50%,rgba(255,107,43,.04) 0%,transparent 70%)',
    hline:      'linear-gradient(90deg,transparent,rgba(255,107,43,.07) 25%,rgba(255,107,43,.07) 75%,transparent)',
    accent:     '#FF6B2B',
    nameColor:  '#ffffff',
    tagColor:   '#6a6a6a',   // legível no escuro
    subColor:   '#484848',   // legível no escuro
    trackBg:    '#181818',
    fillGrad:   'linear-gradient(90deg,#C94D13,#FF6B2B,#FF9055)',
    fillSh:     '0 0 14px rgba(255,107,43,.7),0 0 5px rgba(255,107,43,.4)',
    msgColor:   '#5a5a5a',   // legível no escuro
    msgDone:    '#FF6B2B',
    pctColor:   '#3a3a3a',   // legível no escuro
    verColor:   '#363636',   // legível no escuro
    dotBg:      '#FF6B2B',
    dotSh:      '0 0 8px #FF6B2B',
    cornerClr:  '#FF6B2B',
    COLORS:     DARK_C,
  } : {
    bg:         '#F0F1F5',
    vignette:   'radial-gradient(ellipse 100% 100% at 50% 50%,transparent 30%,rgba(180,180,190,.35) 100%)',
    glow:       'radial-gradient(ellipse 55% 45% at 50% 50%,rgba(232,90,26,.07) 0%,transparent 70%)',
    hline:      'linear-gradient(90deg,transparent,rgba(232,90,26,.08) 25%,rgba(232,90,26,.08) 75%,transparent)',
    accent:     '#E85A1A',
    nameColor:  '#0e0f14',
    tagColor:   '#7a7c8a',   // legível no claro
    subColor:   '#9a9caa',   // legível no claro
    trackBg:    '#d8d9e0',
    fillGrad:   'linear-gradient(90deg,#B84510,#E85A1A,#FF7A3A)',
    fillSh:     '0 0 12px rgba(232,90,26,.5)',
    msgColor:   '#5a5c70',   // legível no claro
    msgDone:    '#E85A1A',
    pctColor:   '#7a7c8a',   // legível no claro
    verColor:   '#9a9caa',   // legível no claro
    dotBg:      '#E85A1A',
    dotSh:      '0 0 8px #E85A1A',
    cornerClr:  '#E85A1A',
    COLORS:     LIGHT_C,
  }

  /* injetar CSS */
  useEffect(() => {
    if (document.getElementById('sp-css')) return
    const s = document.createElement('style')
    s.id = 'sp-css'; s.textContent = CSS
    document.head.appendChild(s)
  }, [])

  /* partículas */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const TYPES = ['card','dot','cross','dash','dot','card']
    const COLORS = tk.COLORS

    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    class P {
      constructor(init) { this.reset(init) }
      reset(init) {
        this.x=Math.random()*canvas.width; this.y=init?Math.random()*canvas.height:canvas.height+30
        this.vx=(Math.random()-.5)*.48; this.vy=-(Math.random()*.58+.1)
        this.a=0; this.ta=Math.random()*.52+.05
        this.col=COLORS[Math.floor(Math.random()*COLORS.length)]
        this.type=TYPES[Math.floor(Math.random()*TYPES.length)]
        this.w=Math.random()*28+10; this.h=Math.random()*14+6
        this.r=Math.random()*2.2+.5; this.len=Math.random()*20+5
        this.ang=(Math.random()-.5)*.7; this.sp=(Math.random()-.5)*.008
        this.lf=0; this.ml=Math.random()*420+180
      }
      update() {
        this.x+=this.vx; this.y+=this.vy; this.ang+=this.sp; this.lf++
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

    const ps = Array.from({length:90}, ()=>new P(true))
    let raf
    function loop(){ ctx.clearRect(0,0,canvas.width,canvas.height); ps.forEach(p=>{p.update();p.draw()}); raf=requestAnimationFrame(loop) }
    loop()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* entrada sequencial + progresso */
  useEffect(() => {
    const t1 = setTimeout(() => setLogoIn(true), 180)
    const t2 = setTimeout(() => setWordIn(true), 620)
    const t3 = setTimeout(() => { setProgIn(true); setVerIn(true) }, 880)
    const t4 = setTimeout(() => runProgress(), 1100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function runProgress() {
    let stepIdx=0, curPct=0
    function advance() {
      if (stepIdx>=STEPS.length) return
      if (msgRef.current) msgRef.current.textContent = STEPS[stepIdx].msg
      const target = STEPS[stepIdx].pct
      const tick = () => {
        if (curPct>=target) {
          if (stepIdx<STEPS.length-1) {
            stepIdx++
            setTimeout(advance, stepIdx===STEPS.length-1 ? 160 : 480)
          } else {
            if (dotRef.current) { dotRef.current.classList.remove('active'); dotRef.current.style.boxShadow='none' }
            if (msgRef.current) msgRef.current.style.color = tk.msgDone
            setTimeout(()=>{ setFading(true); setTimeout(onDone, 780) }, 480)
          }
          return
        }
        curPct=Math.min(curPct+1.3, target)
        const r=Math.round(curPct)
        if (fillRef.current) fillRef.current.style.width=r+'%'
        if (pctRef.current)  pctRef.current.textContent=r+'%'
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
    advance()
  }

  const FF = "'Segoe UI Variable','Segoe UI',system-ui,sans-serif"

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background: tk.bg,
      display:'flex', alignItems:'center', justifyContent:'center',
      overflow:'hidden', fontFamily:FF,
      opacity: fading?0:1,
      transform: fading?'scale(1.03)':'none',
      transition:'opacity .8s cubic-bezier(.4,0,.2,1),transform .8s cubic-bezier(.4,0,.2,1)',
    }}>
      <canvas ref={canvasRef} style={{position:'absolute',inset:0,pointerEvents:'none'}}/>

      {/* ruído */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:isDark?.03:.02,pointerEvents:'none'}}>
        <filter id="sp-n1"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
        <rect width="100%" height="100%" filter="url(#sp-n1)"/>
      </svg>

      <div className="sp-vignette"  style={{background:tk.vignette}}/>
      <div className="sp-glow-c"    style={{background:tk.glow}}/>
      {isDark && <div className="sp-scanlines-d"/>}
      <div className="sp-hline"     style={{background:tk.hline}}/>

      {/* cantos */}
      {['tl','tr','bl','br'].map(p=>(
        <div key={p} className={`sp-corner ${p}`}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M1 9L1 1L9 1" fill="none" stroke={tk.cornerClr} strokeWidth="1"/></svg>
        </div>
      ))}

      {/* centro */}
      <div style={{position:'relative',zIndex:2,display:'flex',flexDirection:'column',alignItems:'center'}}>

        {/* logo */}
        <div style={{
          opacity:logoIn?1:0, transform:logoIn?'none':'scale(.82) translateY(14px)',
          transition:'opacity .75s cubic-bezier(.4,0,.2,1),transform .75s cubic-bezier(.4,0,.2,1)',
        }}>
          <SplashLogo isDark={isDark} accent={tk.accent}/>
        </div>

        {/* wordmark */}
        <div style={{
          marginTop:30, textAlign:'center',
          opacity:wordIn?1:0, transform:wordIn?'none':'translateY(10px)',
          transition:'opacity .6s ease,transform .6s ease',
        }}>
          <div style={{fontSize:38,letterSpacing:'-1.2px',lineHeight:1,color:tk.nameColor}}>
            <b style={{fontWeight:800}}>Kron</b>
            <i style={{color:tk.accent,fontWeight:200,fontStyle:'italic'}}>Tech</i>
          </div>
          <div style={{marginTop:8,fontSize:'8.5px',letterSpacing:'5px',color:tk.tagColor,fontWeight:500}}>
            GESTÃO · TEMPO · TECNOLOGIA
          </div>
          <div style={{marginTop:9,fontSize:12,color:tk.subColor,fontStyle:'italic',fontWeight:300,letterSpacing:'.2px'}}>
            Ordem no caos do dia a dia.
          </div>
        </div>

        {/* barra de progresso */}
        <div style={{
          marginTop:58, width:260,
          opacity:progIn?1:0, transform:progIn?'none':'translateY(8px)',
          transition:'opacity .5s ease,transform .5s ease',
        }}>
          <div style={{position:'relative',height:2,background:tk.trackBg,borderRadius:2,overflow:'hidden'}}>
            <div ref={fillRef} style={{
              position:'absolute',inset:'0 auto 0 0',height:'100%',width:'0%',
              background:tk.fillGrad,
              boxShadow:tk.fillSh,
              borderRadius:2, transition:'width .04s linear',
            }}/>
            <div className="sp-shimmer"/>
          </div>
          <div style={{marginTop:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',flex:1}}>
              <div
                ref={dotRef}
                className="sp-dot-pulse active"
                style={{background:tk.dotBg, boxShadow:tk.dotSh}}
              />
              <span ref={msgRef} style={{fontSize:10,color:tk.msgColor,letterSpacing:'.3px',transition:'color .4s'}}>
                Aguardando...
              </span>
            </div>
            <span ref={pctRef} style={{fontSize:10,color:tk.pctColor,fontFamily:'monospace',fontVariantNumeric:'tabular-nums'}}>
              0%
            </span>
          </div>
        </div>

        {/* versão */}
        <div style={{
          marginTop:54, fontSize:'8.5px', letterSpacing:'2px', color:tk.verColor,
          opacity:verIn?1:0, transition:'opacity .5s ease',
          display:'flex', gap:8, alignItems:'center',
        }}>
          <span>v{__APP_VERSION__}</span>
          <span style={{opacity:.4}}>·</span>
          <span>{__BUILD_DATE__}</span>
          <span style={{opacity:.4}}>·</span>
          <span>{__BUILD_TIME__}</span>
        </div>
      </div>
    </div>
  )
}

function SplashLogo({ isDark, accent }) {
  const kC  = isDark ? '#FFFFFF' : '#111111'
  const dF0 = isDark ? '#222'    : '#e8e8e8'
  const dF1 = isDark ? '#0e0e0e' : '#d0d0d0'
  const r1  = isDark ? '#2e2e2e' : '#CCCCCC'
  const r3  = isDark ? '#1c1c1c' : '#DDDDDD'
  const div = isDark ? '#252525' : '#AAAAAA'
  const tk2 = isDark ? '#2a2a2a' : '#AAAAAA'

  return (
    <svg width="140" height="140" viewBox="0 0 100 100" overflow="visible">
      <defs>
        <radialGradient id="sp-dg2" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor={dF0}/>
          <stop offset="100%" stopColor={dF1}/>
        </radialGradient>
        <filter id="sp-gf2" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle className="kr-r3" cx="50" cy="50" r="47" fill="none" stroke={r3} strokeWidth=".5" strokeDasharray="2 10"/>
      <circle className="kr-r1" cx="50" cy="50" r="40" fill="none" stroke={r1} strokeWidth=".8" strokeDasharray="4 7"/>
      <circle className="kr-r2" cx="50" cy="50" r="32" fill="none" stroke={accent} strokeWidth=".5" strokeDasharray="2 8" opacity=".36"/>
      <circle cx="50" cy="50" r="24" fill="url(#sp-dg2)" stroke={accent} strokeWidth=".85"/>
      <ellipse cx="43" cy="42" rx="7" ry="3.5" fill={isDark?'rgba(255,255,255,.03)':'rgba(255,255,255,.5)'} transform="rotate(-30 43 42)"/>
      <g className="kr-kt" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#sp-gf2)">
        <line x1="37" y1="36" x2="37" y2="64" stroke={kC} strokeWidth="1.6"/>
        <line x1="37" y1="50" x2="49" y2="36" stroke={kC} strokeWidth="1.6"/>
        <line x1="37" y1="50" x2="50" y2="64" stroke={kC} strokeWidth="1.6"/>
        <line x1="55" y1="36" x2="68" y2="36" stroke={accent} strokeWidth="1.6"/>
        <line x1="61.5" y1="36" x2="61.5" y2="64" stroke={accent} strokeWidth="1.6"/>
      </g>
      <line x1="52" y1="38" x2="52" y2="62" stroke={div} strokeWidth=".7"/>
      <line x1="50" y1="10" x2="50" y2="12" stroke={tk2} strokeWidth=".8"/>
      <line x1="87.3" y1="25" x2="85.6" y2="26" stroke={tk2} strokeWidth=".8"/>
      <line x1="87.3" y1="75" x2="85.6" y2="74" stroke={tk2} strokeWidth=".8"/>
      <line x1="50" y1="90" x2="50" y2="88" stroke={tk2} strokeWidth=".8"/>
      <line x1="12.7" y1="75" x2="14.4" y2="74" stroke={tk2} strokeWidth=".8"/>
      <line x1="12.7" y1="25" x2="14.4" y2="26" stroke={tk2} strokeWidth=".8"/>
      <circle className="kr-orb" cx="50" cy="3"  r="2.7" fill={accent}              style={{animationDelay:'0s'}}/>
      <circle className="kr-orb" cx="97" cy="50" r="2.2" fill={isDark?'#555':'#999'} style={{animationDelay:'1s'}}/>
      <circle className="kr-orb" cx="50" cy="97" r="2.7" fill={accent}              style={{animationDelay:'2s'}}/>
      <circle className="kr-orb" cx="3"  cy="50" r="2.2" fill={isDark?'#444':'#bbb'} style={{animationDelay:'1.5s'}}/>
    </svg>
  )
}
