// Widget "Mapa do Brasil" — SVG puro (sem lib de mapa), zoom/pan via viewBox,
// drill-down estado → município. Contrato de dados PRÓPRIO (uf/municipio/
// valor/status/cliente_nome), diferente do genérico labels/valKeys usado
// pelos demais 24 tipos — ver SQL_GUIDE['mapa_br'] pro formato esperado.
import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { cssVar } from '../echartsHelpers'
import { fmtNum } from '../format'
import { NoData } from '../echartsHelpers'

// Servidos como arquivos estáticos (public/geo/), não como módulos JS —
// import() dinâmico com 27 alvos possíveis faria o Vite tentar bundlar
// todos os JSONs de município (dezenas de MB) como módulos analisáveis.
// Caminho relativo (não `/geo/...`) porque o build empacotado carrega via
// file://, onde uma URL absoluta resolveria a partir da raiz do disco.
const GEO_BASE = new URL('geo/', document.baseURI || window.location.href).href
const brasilUfCache = fetch(GEO_BASE + 'brasil-uf.json').then(r => r.json())

// codarea (IBGE, 2 dígitos) <-> sigla da UF — usado pra casar a malha
// geográfica (indexada por codarea) com os dados do SQL (indexados por uf).
const UF_POR_CODAREA = {
  '12':'AC','27':'AL','16':'AP','13':'AM','29':'BA','23':'CE','53':'DF','32':'ES',
  '52':'GO','21':'MA','51':'MT','50':'MS','31':'MG','15':'PA','25':'PB','41':'PR',
  '26':'PE','22':'PI','33':'RJ','24':'RN','43':'RS','11':'RO','14':'RR','42':'SC',
  '35':'SP','28':'SE','17':'TO',
}
const CODAREA_POR_UF = Object.fromEntries(Object.entries(UF_POR_CODAREA).map(([k,v]) => [v,k]))

// Nome completo do estado por sigla — usado no tooltip/hover da visão
// nacional pra mostrar "Santa Catarina (SC)" em vez de só "SC".
const NOME_ESTADO_POR_UF = {
  AC:'Acre', AL:'Alagoas', AP:'Amapá', AM:'Amazonas', BA:'Bahia', CE:'Ceará',
  DF:'Distrito Federal', ES:'Espírito Santo', GO:'Goiás', MA:'Maranhão',
  MT:'Mato Grosso', MS:'Mato Grosso do Sul', MG:'Minas Gerais', PA:'Pará',
  PB:'Paraíba', PR:'Paraná', PE:'Pernambuco', PI:'Piauí', RJ:'Rio de Janeiro',
  RN:'Rio Grande do Norte', RS:'Rio Grande do Sul', RO:'Rondônia', RR:'Roraima',
  SC:'Santa Catarina', SP:'São Paulo', SE:'Sergipe', TO:'Tocantins',
}

// Cache de módulos de município já importados nesta sessão do app — evita
// re-fetch do chunk ao reabrir o drill-down do mesmo estado.
const municipiosCache = new Map()
function carregarMunicipios(sigla) {
  if (municipiosCache.has(sigla)) return municipiosCache.get(sigla)
  const p = fetch(`${GEO_BASE}municipios/${sigla}.json`).then(r => r.json())
  municipiosCache.set(sigla, p)
  return p
}

// Projeção equirretangular simples: converte lon/lat pra coordenadas de tela
// dentro do bounding box calculado, com padding.
function computeBounds(features) {
  let minLon=Infinity, maxLon=-Infinity, minLat=Infinity, maxLat=-Infinity
  const visit = ring => ring.forEach(([lon,lat]) => {
    if (lon<minLon) minLon=lon; if (lon>maxLon) maxLon=lon
    if (lat<minLat) minLat=lat; if (lat>maxLat) maxLat=lat
  })
  features.forEach(f => {
    const g = f.geometry
    if (g.type === 'Polygon') g.coordinates.forEach(visit)
    else if (g.type === 'MultiPolygon') g.coordinates.forEach(poly => poly.forEach(visit))
  })
  return { minLon, maxLon, minLat, maxLat }
}

function project(lon, lat, bounds, W, H, pad) {
  const { minLon, maxLon, minLat, maxLat } = bounds
  const spanLon = Math.max(maxLon - minLon, 1e-6)
  const spanLat = Math.max(maxLat - minLat, 1e-6)
  // Corrige distorção por latitude (mercator simplificado) e preserva proporção.
  const scaleX = (W - pad*2) / spanLon
  const scaleY = (H - pad*2) / spanLat
  const scale = Math.min(scaleX, scaleY)
  const offX = pad + ((W - pad*2) - spanLon*scale)/2
  const offY = pad + ((H - pad*2) - spanLat*scale)/2
  const x = offX + (lon - minLon) * scale
  const y = offY + (maxLat - lat) * scale
  return [x, y]
}

function ringToPath(ring, bounds, W, H, pad) {
  return ring.map(([lon,lat], i) => {
    const [x,y] = project(lon, lat, bounds, W, H, pad)
    return (i===0?'M':'L') + x.toFixed(1) + ',' + y.toFixed(1)
  }).join(' ') + 'Z'
}

function geometryToPath(geometry, bounds, W, H, pad) {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(r => ringToPath(r, bounds, W, H, pad)).join(' ')
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map(poly => poly.map(r => ringToPath(r, bounds, W, H, pad)).join(' ')).join(' ')
  }
  return ''
}

// Agrega os rows do SQL por chave (uf ou uf+municipio), somando valor e
// coletando status/cliente_nome pro tooltip.
function aggregateRows(rows, keyFn) {
  const map = new Map()
  rows.forEach(r => {
    const key = keyFn(r)
    if (!key) return
    if (!map.has(key)) map.set(key, { valor: 0, itens: [] })
    const acc = map.get(key)
    acc.valor += Number(r.valor) || 0
    acc.itens.push({ status: r.status ?? null, cliente_nome: r.cliente_nome ?? null, valor: Number(r.valor) || 0 })
  })
  return map
}

function normUf(v) { return String(v ?? '').trim().toUpperCase() }
// Remove acentos + normaliza espaços/caixa pra casar nomes digitados
// livremente no SQL (ex.: "Criciuma") com o nome oficial IBGE ("Criciúma").
function normMun(v) {
  return String(v ?? '').trim().toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
}
// Nomes exatos dos status conhecidos de despesa_001 (viagens/utils.js),
// com acentuação correta — "nao_enviado" -> "Não enviado", não um
// title-case genérico que erraria a acentuação.
const NOME_STATUS = {
  rascunho: 'Rascunho',
  nao_enviado: 'Não enviado',
  enviado: 'Enviado',
  reembolsado: 'Reembolsado',
}
function formatarStatus(v) {
  const chave = String(v ?? '').trim().toLowerCase()
  if (NOME_STATUS[chave]) return NOME_STATUS[chave]
  // Fallback pra status não mapeados (ex. query customizada com status
  // fora do padrão do app): só capitaliza/troca underscore, sem
  // acentuação garantida.
  const s = chave.replace(/_/g, ' ')
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function mapa_br({ widget, rows, fields, color, fillHeight, formato }) {
  const isLight = document.documentElement.classList.contains('light')
  const [brasilUf, setBrasilUf] = useState(null)
  const [ufAtiva, setUfAtiva] = useState(null) // null = visão nacional, 'SC' = drill-down
  const [municipiosGeo, setMunicipiosGeo] = useState(null)
  const [carregandoMun, setCarregandoMun] = useState(false)
  const [tooltip, setTooltip] = useState(null) // { x, y, title, lines }
  const [vb, setVb] = useState(null) // { x, y, w, h } — viewBox atual
  const svgRef = useRef(null)
  const dragRef = useRef({ dragging:false, lastX:0, lastY:0, dist:0 })

  useEffect(() => { brasilUfCache.then(setBrasilUf).catch(() => setBrasilUf({ features: [] })) }, [])

  // O mapa é SVG puro lendo cores via cssVar() (resolvidas na hora do
  // render, não reativas) — diferente dos gráficos ECharts, que só
  // redesenham quando os dados mudam, então trocar claro/escuro não
  // disparava um re-render daqui, e a cor só atualizava no próximo
  // auto-refresh (quando rows/fields mudam de referência). Observa a
  // classe do <html> diretamente e força um re-render na hora da troca.
  const [, forceThemeRerender] = useState(0)
  useEffect(() => {
    const obs = new MutationObserver(() => forceThemeRerender(n => n + 1))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const hasUf = fields?.includes('uf')
  const hasMunicipio = fields?.includes('municipio')

  const dataByUf = useMemo(() => {
    if (!hasUf) return new Map()
    return aggregateRows(rows, r => { const u = normUf(r.uf); return CODAREA_POR_UF[u] ? u : null })
  }, [rows, hasUf])

  const dataByMunicipioNaUf = useMemo(() => {
    if (!hasUf || !hasMunicipio || !ufAtiva) return new Map()
    return aggregateRows(
      rows.filter(r => normUf(r.uf) === ufAtiva),
      r => normMun(r.municipio),
    )
  }, [rows, hasUf, hasMunicipio, ufAtiva])

  const naoIdentificados = useMemo(() => {
    if (!hasUf) return 0
    return rows.filter(r => !CODAREA_POR_UF[normUf(r.uf)]).length
  }, [rows, hasUf])

  const maxValorUf = useMemo(() => Math.max(1, ...[...dataByUf.values()].map(d => d.valor)), [dataByUf])
  const maxValorMun = useMemo(() => Math.max(1, ...[...dataByMunicipioNaUf.values()].map(d => d.valor)), [dataByMunicipioNaUf])

  // Painel lateral: lista de locais com dado, ordenados do maior pro menor
  // valor — visão nacional agrupa por UF, drill-down agrupa por município.
  // Nome de exibição do município vem do próprio SQL (título já digitado
  // pelo usuário), não da malha — evita duplicar lógica de "title case".
  const nomeOriginalPorChaveMun = useMemo(() => {
    const m = new Map()
    rows.forEach(r => {
      if (normUf(r.uf) === ufAtiva && r.municipio) m.set(normMun(r.municipio), String(r.municipio).trim())
    })
    return m
  }, [rows, ufAtiva])

  const listaLateral = useMemo(() => {
    if (ufAtiva) {
      return [...dataByMunicipioNaUf.entries()]
        .map(([chave, info]) => ({ nome: nomeOriginalPorChaveMun.get(chave) || chave, info }))
        .sort((a,b) => b.info.valor - a.info.valor)
    }
    return [...dataByUf.entries()]
      .map(([sigla, info]) => ({ nome: sigla, info }))
      .sort((a,b) => b.info.valor - a.info.valor)
  }, [dataByUf, dataByMunicipioNaUf, ufAtiva, nomeOriginalPorChaveMun])

  const W = 640, H = 560, PAD = 16

  const featuresNacional = brasilUf?.features ?? []
  const boundsNacional = useMemo(() => computeBounds(featuresNacional), [featuresNacional])

  const boundsEstado = useMemo(() => {
    if (!municipiosGeo) return null
    return computeBounds(municipiosGeo.features)
  }, [municipiosGeo])

  // Path SVG (string) de cada feature é o cálculo caro daqui (O(pontos) —
  // ~20 mil pontos no total pro mapa nacional, mais nos municípios).
  // Sem memoização, isso recalculava a CADA render do componente — inclusive
  // por hover/tooltip, ou pelo Dashboard inteiro re-renderizando a cada tick
  // de auto-refresh de QUALQUER OUTRO widget na tela — travando a UI.
  // Só depende de features+bounds (nunca dos dados do SQL/cor/hover), então
  // fica isolado num useMemo próprio e só recalcula quando o mapa em si
  // muda (carregamento inicial ou troca de UF).
  const pathsNacional = useMemo(() => {
    if (!boundsNacional) return new Map()
    const m = new Map()
    for (const f of featuresNacional) m.set(f.properties.codarea, geometryToPath(f.geometry, boundsNacional, W, H, PAD))
    return m
  }, [featuresNacional, boundsNacional])

  const pathsEstado = useMemo(() => {
    if (!municipiosGeo || !boundsEstado) return new Map()
    const m = new Map()
    for (const f of municipiosGeo.features) m.set(f.properties.codarea, geometryToPath(f.geometry, boundsEstado, W, H, PAD))
    return m
  }, [municipiosGeo, boundsEstado])

  const viewBox = vb ? `${vb.x} ${vb.y} ${vb.w} ${vb.h}` : `0 0 ${W} ${H}`

  const resetView = useCallback(() => setVb(null), [])

  async function abrirEstado(sigla) {
    setUfAtiva(sigla)
    setMunicipiosGeo(null)
    resetView()
    setCarregandoMun(true)
    try {
      const geo = await carregarMunicipios(sigla)
      setMunicipiosGeo(geo)
    } catch {
      setMunicipiosGeo({ features: [] })
    } finally {
      setCarregandoMun(false)
    }
  }

  function fecharDrill() {
    setUfAtiva(null)
    setMunicipiosGeo(null)
    resetView()
  }

  // Handler nativo (não o onWheel sintético do React) com { passive:false }
  // explícito. Mesmo com preventDefault/stopPropagation, o scroll da
  // página continuava "vazando" — o container de scroll do Dashboard
  // (.dash-grid-area) e o próprio Windows/Electron processam o wheel de
  // formas que nem sempre respeitam stopPropagation do React. Solução
  // definitiva: só ativa o zoom do mapa quando o usuário segura Ctrl —
  // sem Ctrl, o evento nem é interceptado, o scroll da página funciona
  // normal; com Ctrl, dá zoom OU (fallback abaixo) intercepta mesmo sem
  // Ctrl mas nunca deixa a página rolar enquanto o cursor estiver sobre
  // o mapa, porque aqui dentro scroll de página nunca é o que se quer.
  // Wheel (zoom) e mousedown (início do pan) precisam de listener NATIVO
  // com capture:true no <svg> real — mas o componente tem um early-return
  // ("Carregando mapa…") enquanto brasilUf ainda não chegou do fetch, então
  // o <svg> só é criado num render POSTERIOR ao mount. Um useEffect com
  // deps [] roda só no mount, quando svgRef.current ainda é null (o early
  // return nem desenhou o svg ainda) — os listeners nunca chegavam a ser
  // anexados de verdade. Fix: callback ref (roda toda vez que o elemento
  // DOM é criado/destruído, não só no mount do componente) attachando os
  // listeners no exato momento em que o <svg> passa a existir.
  const attachSvgListeners = useCallback((svg) => {
    // Callback ref roda com `null` quando o elemento anterior é
    // desmontado/trocado — limpa os listeners dele antes de seguir.
    if (svgRef.current && svgRef.current.__ktCleanup) svgRef.current.__ktCleanup()
    svgRef.current = svg
    if (!svg) return

    function handleWheel(e) {
      e.preventDefault()
      e.stopPropagation()
      const rect = svg.getBoundingClientRect()
      const cx = ((e.clientX - rect.left) / rect.width) * W
      const cy = ((e.clientY - rect.top) / rect.height) * H
      setVb(prev => {
        const cur = prev || { x:0, y:0, w:W, h:H }
        const factor = e.deltaY > 0 ? 1.15 : 0.87
        let newW = Math.min(W, Math.max(W*0.08, cur.w * factor))
        let newH = newW * (H/W)
        const px = (cx - cur.x) / cur.w
        const py = (cy - cur.y) / cur.h
        let newX = cx - px * newW
        let newY = cy - py * newH
        newX = Math.min(Math.max(newX, -newW*0.3), W - newW*0.7)
        newY = Math.min(Math.max(newY, -newH*0.3), H - newH*0.7)
        return { x:newX, y:newY, w:newW, h:newH }
      })
    }
    function onDown(e) {
      e.preventDefault()
      e.stopPropagation()
      dragRef.current = { dragging:true, lastX:e.clientX, lastY:e.clientY, dist:0 }
    }
    // capture:true — roda antes de qualquer listener nativo em elementos
    // ancestrais (scroll da página, drag do react-grid-layout) que possam
    // disputar o mesmo evento.
    svg.addEventListener('wheel', handleWheel, { passive:false, capture:true })
    svg.addEventListener('mousedown', onDown, { capture:true })
    svg.__ktCleanup = () => {
      svg.removeEventListener('wheel', handleWheel, { capture:true })
      svg.removeEventListener('mousedown', onDown, { capture:true })
    }
  }, [])

  useEffect(() => {
    function onMove(e) {
      if (!dragRef.current.dragging) return
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const dx = (e.clientX - dragRef.current.lastX) * (W/rect.width)
      const dy = (e.clientY - dragRef.current.lastY) * (H/rect.height)
      dragRef.current.dist += Math.hypot(e.clientX-dragRef.current.lastX, e.clientY-dragRef.current.lastY)
      dragRef.current.lastX = e.clientX
      dragRef.current.lastY = e.clientY
      setVb(prev => {
        const cur = prev || { x:0, y:0, w:W, h:H }
        return { ...cur, x: cur.x - dx, y: cur.y - dy }
      })
    }
    function onUp() { dragRef.current.dragging = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])
  function wasRealClick() {
    return dragRef.current.dist < 4
  }

  // Largura/altura estimadas do balão do tooltip — usadas só pra decidir
  // de que lado do cursor ele abre, evitando cortar quando a cidade está
  // perto da borda do card (ex.: Florianópolis, litoral leste de SC).
  const TOOLTIP_W = 190, TOOLTIP_H = 90

  function showTooltip(evt, title, info) {
    const rect = svgRef.current?.getBoundingClientRect()
    const cw = rect?.width ?? W, ch = rect?.height ?? H
    const rawX = evt.clientX - (rect?.left ?? 0)
    const rawY = evt.clientY - (rect?.top ?? 0)
    // Se abrir à direita/abaixo do cursor estourar o container, abre à
    // esquerda/acima em vez disso.
    const abrirEsquerda = rawX + 10 + TOOLTIP_W > cw
    const abrirAcima    = rawY + 10 + TOOLTIP_H > ch
    const x = abrirEsquerda ? rawX - 10 - TOOLTIP_W : rawX + 10
    const y = abrirAcima    ? rawY - 10 - TOOLTIP_H : rawY + 10
    const lines = []
    if (info) {
      const porStatus = new Map()
      info.itens.forEach(it => {
        const k = it.status ? formatarStatus(it.status) : (it.cliente_nome || 'Valor')
        porStatus.set(k, (porStatus.get(k)||0) + it.valor)
      })
      porStatus.forEach((v,k) => lines.push(`${k}: ${fmtNum(v, formato)}`))
      lines.push(`Total: ${fmtNum(info.valor, formato)}`)
    } else {
      lines.push('Sem despesas registradas')
    }
    setTooltip({ x, y, title, lines })
  }
  function hideTooltip() { setTooltip(null) }

  if (!hasUf) {
    return <NoData />
  }

  if (!brasilUf) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', fontSize:11, color:'var(--t3)' }}>Carregando mapa…</div>
  }

  const modoEstado = !!ufAtiva

  return (
    <div style={{ display:'flex', flexDirection:'column', width:'100%', height: fillHeight ? '100%' : 340, overflow:'hidden' }}>
    <div style={{ display:'flex', flex:1, minHeight:0, overflow:'hidden' }}>
    <div style={{ position:'relative', flex:1, minWidth:0, overflow:'hidden' }}>
      <div className="dash-num" style={{ position:'absolute', top:10, left:10, zIndex:3, display:'flex', alignItems:'center', gap:8, fontSize:12.5, color:'var(--t3)' }}>
        {modoEstado ? (
          <button
            onClick={fecharDrill}
            style={{ background:'none', border:'none', padding:0, cursor:'pointer',
              color, fontSize:12.5, fontFamily:'inherit', fontWeight:800, letterSpacing:'.02em' }}
          >
            BRASIL / {ufAtiva}
          </button>
        ) : (
          <span style={{ color, fontWeight:800, letterSpacing:'.02em' }}>BRASIL</span>
        )}
        <span className="dash-hud-live" style={{ width:5, height:5 }} />
      </div>
      {naoIdentificados > 0 && !modoEstado && (
        <div style={{ position:'absolute', bottom:8, left:8, zIndex:3, fontSize:9.5, color:'var(--t3)',
          background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:6, padding:'3px 8px' }}>
          {naoIdentificados} linha{naoIdentificados!==1?'s':''} sem UF identificada
        </div>
      )}

      <svg
        ref={attachSvgListeners}
        viewBox={viewBox}
        width="100%" height="100%"
        style={{ display:'block', cursor: dragRef.current.dragging ? 'grabbing' : 'grab' }}
      >
        {!modoEstado && featuresNacional.map((f, idx) => {
          const sigla = UF_POR_CODAREA[f.properties.codarea]
          const info = dataByUf.get(sigla)
          // Item 2 (valores literais): opacidade escalada 0.4–1.0 proporcional
          // ao valor entre os estados com dado — não todos na mesma
          // intensidade. drop-shadow fixo de 8px na accent.
          const intensidade = info ? 0.4 + 0.6 * (info.valor / maxValorUf) : 0
          const d = pathsNacional.get(f.properties.codarea)
          return (
            <path
              key={f.properties.codarea}
              className={info ? 'dash-hud-map-active dash-hud-map-acender' : undefined}
              d={d}
              fill={info ? color : 'transparent'}
              fillOpacity={info ? intensidade : 1}
              stroke={info ? color : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)')}
              strokeOpacity={1}
              strokeWidth={0.8}
              style={{
                cursor:'pointer', transition:'fill-opacity .15s, stroke-opacity .15s, filter .15s',
                filter: info ? `drop-shadow(0 0 8px ${color})` : 'none',
                // Entrada "acendendo": estados com dado aparecem em sequência
                // (delay escalonado pelo índice), não todos de uma vez.
                animationDelay: info ? `${(idx % 12) * 100}ms` : undefined,
              }}
              onMouseMove={e => showTooltip(e, `${NOME_ESTADO_POR_UF[sigla] || sigla} (${sigla})`, info)}
              onMouseLeave={hideTooltip}
              onClick={() => { if (wasRealClick()) abrirEstado(sigla) }}
            />
          )
        })}

        {modoEstado && municipiosGeo && boundsEstado && municipiosGeo.features.map((f, idx) => {
          // Casa a feição (nome oficial IBGE, embutido no asset) com o dado
          // do SQL por nome normalizado (sem acento/caixa) — o "municipio"
          // digitado livremente no SQL não precisa bater byte-a-byte.
          const nomeOficial = f.properties.nome
          const info = nomeOficial ? dataByMunicipioNaUf.get(normMun(nomeOficial)) : null
          const intensidade = info ? 0.4 + 0.6 * (info.valor / maxValorMun) : 0
          const d = pathsEstado.get(f.properties.codarea)
          return (
            <path
              key={f.properties.codarea}
              className={info ? 'dash-hud-map-active dash-hud-map-acender' : undefined}
              d={d}
              fill={info ? color : 'transparent'}
              fillOpacity={info ? intensidade : 1}
              stroke={info ? color : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)')}
              strokeOpacity={1}
              strokeWidth={0.6}
              style={{
                transition:'fill-opacity .15s, stroke-opacity .15s, filter .15s',
                filter: info ? `drop-shadow(0 0 8px ${color})` : 'none',
                animationDelay: info ? `${(idx % 12) * 100}ms` : undefined,
              }}
              onMouseMove={e => showTooltip(e, nomeOficial || '(sem nome)', info)}
              onMouseLeave={hideTooltip}
            />
          )
        })}
      </svg>

      {carregandoMun && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--t3)' }}>
          Carregando municípios de {ufAtiva}…
        </div>
      )}

      {tooltip && (
        <div style={{
          position:'absolute', left:tooltip.x, top:tooltip.y, zIndex:4, pointerEvents:'none',
          minWidth:160, maxWidth:220,
          background:'var(--s2)', border:'1px solid var(--bd2)',
          borderRadius:10, padding:'10px 13px',
          boxShadow:'0 8px 24px rgba(0,0,0,.35)',
        }}>
          <div className="dash-num" style={{ fontWeight:700, marginBottom:6, color:'var(--t1)', fontSize:11.5 }}>{tooltip.title}</div>
          {tooltip.lines.map((l,i) => <div key={i} className="dash-num" style={{ color:'var(--t3)', fontSize:10, padding:'2px 0' }}>{l}</div>)}
        </div>
      )}
    </div>

    {listaLateral.length > 0 && (
      <div style={{ width:190, flexShrink:0, borderLeft:'1px solid var(--bd)', overflowY:'auto', padding:'14px' }}>
        <div className="dash-num" style={{ fontSize:9.5, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--t3)', marginBottom:10 }}>
          {modoEstado ? `${ufAtiva} · MUNICÍPIOS` : 'DESTINOS COM DESPESA'}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          {listaLateral.map(({ nome, info }) => (
            <div key={nome}
              style={{
                padding:'10px 11px', borderRadius:9,
                background:'var(--s2)', border:'1px solid transparent',
                cursor: !modoEstado ? 'pointer' : 'default', transition:'background .15s, border-color .15s',
              }}
              onClick={() => { if (!modoEstado) abrirEstado(nome) }}
              onMouseEnter={e => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.borderColor = `${color}55` }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--s2)'; e.currentTarget.style.borderColor = 'transparent' }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0, boxShadow:`0 0 6px ${color}` }} />
                <span style={{ fontSize:11, fontWeight:600, color:'var(--t1)', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nome}</span>
                <span className="dash-num" style={{ fontSize:11, color, fontWeight:700 }}>{fmtNum(info.valor, formato)}</span>
              </div>
              {info.itens[0]?.cliente_nome && (
                <div className="dash-num" style={{ fontSize:8.5, color:'var(--t3)', marginTop:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{info.itens[0].cliente_nome}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
    </div>

    {listaLateral.length > 0 && (
      <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'6px 0', borderTop:'1px solid var(--bd)' }}>
        <span style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }} />
        <span style={{ fontSize:9.5, color:'var(--t3)', letterSpacing:'.03em' }}>
          {ufAtiva ? 'Cidades' : 'Estados'} com lançamentos
        </span>
      </div>
    )}
    </div>
  )
}
