import { Trash2 } from 'lucide-react'
import { TIPOS_DESIGNER, FUNCOES_BOTAO, COR_PAL } from './constants.js'

// ── Compact field editor used inside the designer side panel ──────────────────
export default function FieldPropPanel({ campo, updateProp, campos }) {
  const up = (obj) => updateProp(campo._key, obj)
  const lbl = (text) => <div style={{ fontSize:9, fontWeight:600, color:'var(--t3)', textTransform:'uppercase', letterSpacing:.5, marginBottom:3 }}>{text}</div>
  const inp = (key, val, extra = {}) => <input className="form-input" value={val ?? ''} placeholder={extra.placeholder || ''} disabled={extra.disabled} onChange={e => up({ [key]: e.target.value })} style={{ height:28, fontSize:11, width:'100%', ...(extra.style||{}) }}/>
  const chk = (key, label, val) => (
    <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, cursor:'pointer', userSelect:'none', color:'var(--t2)' }}>
      <input type="checkbox" checked={!!val} onChange={e => up({ [key]: e.target.checked })} style={{ accentColor:'var(--or)', flexShrink:0 }}/>{label}
    </label>
  )
  const numInp = (key, val, min, max) => <input type="number" className="form-input" min={min} max={max} value={val ?? ''} onChange={e => up({ [key]: e.target.value === '' ? null : Number(e.target.value) })} style={{ height:26, fontSize:11, width:'100%', padding:'0 6px' }}/>

  if (campo.tipo === 'favorito' || campo.tipo === 'timestamps') {
    return <div style={{ fontSize:11, color:'var(--t3)', fontStyle:'italic' }}>{campo.tipo === 'favorito' ? 'Campo de favorito, sem configuração.' : 'Gera criado_em e atualizado_em automaticamente.'}</div>
  }

  const tiposComOpcoes = ['select','radio','flags']
  const opcoes = Array.isArray(campo.opcoes) ? campo.opcoes : []
  const allCampos = campos || []

  // ── Divisor ──
  if (campo.tipo === 'divisor') {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <div>{lbl('Título (opcional)')}{inp('label', campo.label, { placeholder:'Ex: Endereço' })}</div>
        <div>
          {lbl('Orientação')}
          <div style={{ display:'flex', gap:4 }}>
            {[{label:'― Horizontal',val:'horizontal'},{label:'| Vertical',val:'vertical'}].map(({label,val}) => (
              <button key={val} className={`btn ${(campo.valorPadrao||'horizontal')===val?'btn-primary':'btn-ghost'}`} style={{ flex:1, height:26, fontSize:10 }} onClick={() => up({ valorPadrao:val })}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Copiar ──
  if (campo.tipo === 'copiar') {
    const camposTexto = allCampos.filter(c => c._key !== campo._key && ['texto','texto_longo'].includes(c.tipo) && c.nomeCampo)
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <div>{lbl('Texto do botão')}{inp('label', campo.label, { placeholder:'Copiar' })}</div>
        <div>
          {lbl('Campo a copiar')}
          <select className="form-select" value={campo.valorPadrao || ''} onChange={e => up({ valorPadrao: e.target.value })} style={{ height:28, fontSize:11, width:'100%' }}>
            <option value="">Selecione</option>
            {camposTexto.map(c => <option key={c._key} value={c.nomeCampo}>{c.label || c.nomeCampo}</option>)}
          </select>
        </div>
      </div>
    )
  }

  // ── Botão ──
  if (campo.tipo === 'botao') {
    let cfg = {}; try { cfg = JSON.parse(campo.valorPadrao||'{}') } catch {}
    const fn = cfg.fn || 'copiarTexto', param = cfg.param || '', variant = cfg.variant || 'ghost'
    const updateCfg = (u) => up({ valorPadrao: JSON.stringify({...cfg,...u}) })
    const semParam = ['limparFormulario','exportarPDF','voltarTela'].includes(fn)
    const fnCampoRef = ['abrirArquivo','previewArquivo','copiarArquivoLocal','copiarArquivoClipboard','buscarCNPJ','buscarCEP']
    const tiposFiltro = { abrirArquivo:'arquivo', previewArquivo:'arquivo', copiarArquivoLocal:'arquivo', copiarArquivoClipboard:'arquivo', buscarCNPJ:'cnpj', buscarCEP:'cep' }
    const camposPorTipo = fnCampoRef.includes(fn) ? allCampos.filter(c => c._key !== campo._key && c.tipo === tiposFiltro[fn] && c.nomeCampo) : []
    const camposRef = allCampos.filter(c => c._key !== campo._key && !['divisor','botao'].includes(c.tipo) && c.nomeCampo)
    const grupos = [
      { id:'geral', label:'Geral' }, { id:'arquivo', label:'Arquivo' },
      { id:'registro', label:'Registro' }, { id:'consulta', label:'Consultas externas' },
    ]
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <div>{lbl('Texto do botão')}{inp('label', campo.label, { placeholder:'Ex: Salvar, Abrir...' })}</div>
        <div>
          {lbl('Ação')}
          <select className="form-select" value={fn} onChange={e => updateCfg({ fn: e.target.value, param:'' })} style={{ height:28, fontSize:11, width:'100%' }}>
            {grupos.map(g => {
              const fns = FUNCOES_BOTAO.filter(f => f.grupo === g.id)
              if (!fns.length) return null
              return <optgroup key={g.id} label={g.label}>{fns.map(f => <option key={f.valor} value={f.valor}>{f.label}</option>)}</optgroup>
            })}
          </select>
        </div>
        {fnCampoRef.includes(fn) && (
          <div>
            {lbl(`Campo ${tiposFiltro[fn]}`)}
            {camposPorTipo.length
              ? <select className="form-select" value={param} onChange={e => updateCfg({ param: e.target.value })} style={{ height:28, fontSize:11, width:'100%' }}>
                  <option value="">Selecione</option>
                  {camposPorTipo.map(c => <option key={c._key} value={c.nomeCampo}>{c.label || c.nomeCampo}</option>)}
                </select>
              : <div style={{ fontSize:10, color:'#fb923c', padding:'4px 0' }}>Adicione um campo do tipo "{tiposFiltro[fn]}" primeiro.</div>
            }
          </div>
        )}
        {fn === 'copiarTexto' && (
          <div>
            {lbl('Campo')}
            {camposRef.length
              ? <select className="form-select" value={param} onChange={e => updateCfg({ param: e.target.value })} style={{ height:28, fontSize:11, width:'100%' }}>
                  <option value="">Selecione</option>
                  {camposRef.map(c => <option key={c._key} value={`{${c.nomeCampo}}`}>{c.label || c.nomeCampo}</option>)}
                </select>
              : <input className="form-input" value={param} onChange={e => updateCfg({ param: e.target.value })} placeholder="Texto fixo ou {campo}" style={{ height:28, fontSize:11, width:'100%' }}/>
            }
          </div>
        )}
        {['mostrarAlerta','mostrarSucesso','mostrarErro','mostrarAviso','abrirTela','abrirEmNovaAba','excluirRegistro'].includes(fn) && (
          <div>
            {lbl(fn === 'abrirTela' ? 'Tela destino' : fn === 'abrirEmNovaAba' ? 'URL' : fn === 'excluirRegistro' ? 'Confirmação' : 'Mensagem')}
            <input className="form-input" value={param} onChange={e => updateCfg({ param: e.target.value })}
              placeholder={fn === 'abrirEmNovaAba' ? 'https://...' : fn === 'abrirTela' ? 'dashboard · fb__tabela' : fn === 'excluirRegistro' ? 'Confirma exclusão?' : 'Mensagem'}
              style={{ height:28, fontSize:11, width:'100%' }}/>
          </div>
        )}
        {!semParam && !fnCampoRef.includes(fn) && fn !== 'copiarTexto' && !['mostrarAlerta','mostrarSucesso','mostrarErro','mostrarAviso','abrirTela','abrirEmNovaAba','excluirRegistro'].includes(fn) && (
          <div>
            {lbl('Parâmetro')}
            <input className="form-input" value={param} onChange={e => updateCfg({ param: e.target.value })} style={{ height:28, fontSize:11, width:'100%' }}/>
          </div>
        )}
        <div>
          {lbl('Estilo')}
          <select className="form-select" value={variant} onChange={e => updateCfg({ variant: e.target.value })} style={{ height:28, fontSize:11, width:'100%' }}>
            <option value="primary">Laranja</option>
            <option value="ghost">Cinza</option>
            <option value="danger">Vermelho</option>
          </select>
        </div>
      </div>
    )
  }

  // ── Campos normais ──
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

      {/* Identificação */}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <div>{lbl('Label')}{inp('label', campo.label, { placeholder:'Label do campo' })}</div>
        <div>{lbl('Nome no banco')}{inp('nomeCampo', campo.nomeCampo, { placeholder:'nome_campo', style:{ fontFamily:'monospace', fontSize:10 } })}</div>
        <div>
          {lbl('Tipo')}
          <select className="form-select" value={campo.tipo} onChange={e => up({ tipo: e.target.value })} style={{ height:28, fontSize:11, width:'100%' }}>
            {TIPOS_DESIGNER.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
          </select>
        </div>
        <div>
          {lbl('Valor padrão')}
          {tiposComOpcoes.includes(campo.tipo) && opcoes.length > 0
            ? <select className="form-select" value={campo.valorPadrao || ''} onChange={e => up({ valorPadrao: e.target.value })} style={{ height:28, fontSize:11, width:'100%' }}>
                <option value="">Nenhum</option>
                {opcoes.map((op,i) => <option key={i} value={op.valor}>{op.label}</option>)}
              </select>
            : inp('valorPadrao', campo.valorPadrao, { placeholder:'opcional' })
          }
        </div>
        {!['booleano'].includes(campo.tipo) && (
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {chk('obrigatorio', 'Obrigatório', campo.obrigatorio)}
            {chk('campoBusca', 'Campo de busca', campo.campoBusca)}
            {chk('sequencial', 'Sequencial', campo.sequencial)}
          </div>
        )}
      </div>

      {/* Configuração do tipo */}
      {(campo.tipo === 'codigo_auto' || campo.tipo === 'documento' || campo.tipo === 'calculo' || campo.tipo === 'avaliacao' || campo.tipo === 'radio' || campo.tipo === 'flags' || tiposComOpcoes.includes(campo.tipo)) && (
        <div style={{ display:'flex', flexDirection:'column', gap:6, borderTop:'1px solid var(--bd)', paddingTop:8 }}>
          {lbl('Config. do tipo')}

          {campo.tipo === 'codigo_auto' && (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <div>
                {lbl('Dígitos do sequencial')}
                <input type="number" className="form-input" min={1} max={10} value={campo.opcoes?.seqChars ?? 3}
                  onChange={e => up({ opcoes: { ...(campo.opcoes||{}), seqChars: e.target.value === '' ? 3 : Number(e.target.value) } })}
                  style={{ height:28, fontSize:11, width:'100%' }}/>
                <div style={{ fontSize:9, color:'var(--t3)', marginTop:3 }}>
                  Preview: {String(1).padStart(campo.opcoes?.seqChars ?? 3, '0')}
                </div>
              </div>
              <div>
                {lbl('Prefixo (opcional)')}
                <input className="form-input" value={campo.opcoes?.prefix || ''} placeholder="Ex: CLI- , OS-"
                  onChange={e => up({ opcoes: { ...(campo.opcoes||{}), prefix: e.target.value } })}
                  style={{ height:28, fontSize:11, width:'100%', fontFamily:'monospace' }}/>
              </div>
            </div>
          )}

          {campo.tipo === 'documento' && (
            <div>
              {lbl('Campo radio PF/PJ')}
              <input className="form-input" value={campo.opcoes?.tipoRef || ''} placeholder="tipo_pessoa"
                onChange={e => up({ opcoes: { ...(campo.opcoes||{}), tipoRef: e.target.value.trim() } })}
                style={{ height:28, fontSize:11, width:'100%', fontFamily:'monospace' }}/>
            </div>
          )}

          {campo.tipo === 'calculo' && (
            <div>
              {lbl('Fórmula')}
              <input className="form-input" value={campo.opcoes?.formula || ''} placeholder="{preco} * {qtd}"
                onChange={e => up({ opcoes: { ...(campo.opcoes||{}), formula: e.target.value } })}
                style={{ height:28, fontSize:11, width:'100%', fontFamily:'monospace' }}/>
            </div>
          )}

          {campo.tipo === 'avaliacao' && (
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ flex:1 }}>
                {lbl('Máx. estrelas')}
                <input type="number" className="form-input" min={1} max={10} value={campo.opcoes?.max || 5}
                  onChange={e => up({ opcoes: { ...(campo.opcoes||{}), max: e.target.value === '' ? 5 : Number(e.target.value) } })}
                  style={{ height:26, fontSize:11, width:'100%', padding:'0 6px' }}/>
              </div>
              <span style={{ color:'#FBD24C', fontSize:12, paddingTop:14 }}>{Array.from({ length: campo.opcoes?.max || 5 }, () => '★').join('')}</span>
            </div>
          )}

          {(campo.tipo === 'radio' || campo.tipo === 'flags') && (
            <div>
              {lbl('Layout')}
              <div style={{ display:'flex', gap:4 }}>
                {[{label:'→ Linha',val:'linha'},{label:'↓ Coluna',val:'coluna'}].map(({label,val}) => (
                  <button key={val} className={`btn ${(campo.opcoesLayout||'linha')===val?'btn-primary':'btn-ghost'}`} style={{ flex:1, height:26, fontSize:10 }} onClick={() => up({ opcoesLayout:val })}>{label}</button>
                ))}
              </div>
            </div>
          )}

          {tiposComOpcoes.includes(campo.tipo) && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                {lbl(campo.tipo === 'flags' ? 'Flags' : 'Opções')}
                <button className="btn btn-ghost" style={{ height:20, fontSize:10, padding:'0 6px' }}
                  onClick={() => {
                    const n = opcoes.length + 1
                    const nova = campo.tipo === 'flags'
                      ? { label:`Flag ${n}`, valor:'' }
                      : { label:`Opção ${n}`, valor:`opcao_${n}`, cor: COR_PAL[opcoes.length % COR_PAL.length] }
                    up({ opcoes: [...opcoes, nova] })
                  }}>+ Add</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {opcoes.map((op, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
                    {campo.tipo !== 'flags' && (
                      <input type="color" value={op.cor || '#6366F1'} onChange={e => { const o=[...opcoes]; o[i]={...o[i],cor:e.target.value}; up({opcoes:o}) }}
                        style={{ width:22, height:22, borderRadius:4, border:'1px solid var(--bd)', padding:1, cursor:'pointer', flexShrink:0 }}/>
                    )}
                    <input className="form-input" value={op.label} placeholder="Label" onChange={e => { const o=[...opcoes]; o[i]={...o[i],label:e.target.value}; up({opcoes:o}) }}
                      style={{ flex:1, height:26, fontSize:11, minWidth:0 }}/>
                    <input className="form-input" value={op.valor} placeholder="valor" onChange={e => { const o=[...opcoes]; o[i]={...o[i],valor:e.target.value}; up({opcoes:o}) }}
                      style={{ width:60, height:26, fontSize:10, fontFamily:'monospace', flexShrink:0 }}/>
                    <button onClick={() => up({ opcoes: opcoes.filter((_,j)=>j!==i) })}
                      style={{ border:'none', background:'none', cursor:'pointer', color:'var(--t3)', padding:2, flexShrink:0, display:'flex', alignItems:'center' }}>
                      <Trash2 size={11}/>
                    </button>
                  </div>
                ))}
                {opcoes.length === 0 && <div style={{ fontSize:10, color:'var(--t3)', fontStyle:'italic' }}>Nenhuma opção ainda.</div>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tamanho BD / Largura lista */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, borderTop:'1px solid var(--bd)', paddingTop:8 }}>
        <div>
          {lbl('Largura % lista')}
          <div style={{ display:'flex', alignItems:'center', gap:3 }}>
            {numInp('largura', campo.largura, 10, 100)}
            <span style={{ fontSize:10, color:'var(--t3)' }}>%</span>
          </div>
        </div>
        <div>
          {lbl('Tamanho BD')}
          <div style={{ display:'flex', alignItems:'center', gap:3 }}>
            {numInp('tamanho', campo.tamanho, 1, 5000)}
            <span style={{ fontSize:10, color:'var(--t3)' }}>ch</span>
          </div>
        </div>
      </div>

      {/* Estilo */}
      <div style={{ borderTop:'1px solid var(--bd)', paddingTop:8, display:'flex', flexDirection:'column', gap:8 }}>
        {lbl('Estilo')}

        {/* Label */}
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:.5, borderBottom:'1px solid var(--bd)', paddingBottom:3 }}>Label</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            <div>
              <div style={{ fontSize:9, color:'var(--t3)', marginBottom:2 }}>Fonte (px)</div>
              {numInp('fontSize', campo.fontSize, 7, 48)}
            </div>
            <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
              {chk('semNegrito', 'Sem negrito', campo.semNegrito)}
            </div>
          </div>
          <div>
            <div style={{ fontSize:9, color:'var(--t3)', marginBottom:2 }}>Cor</div>
            <div style={{ display:'flex', gap:3 }}>
              <input type="color" value={campo.labelCor||'#888888'} onChange={e => up({ labelCor: e.target.value })} style={{ width:26, height:26, borderRadius:4, border:'1px solid var(--bd)', padding:1, cursor:'pointer', flexShrink:0 }}/>
              <input className="form-input" value={campo.labelCor||''} onChange={e => up({ labelCor: e.target.value })} placeholder="padrão" style={{ flex:1, height:26, fontSize:10, minWidth:0 }}/>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:.5, borderBottom:'1px solid var(--bd)', paddingBottom:3 }}>Conteúdo</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            <div>
              <div style={{ fontSize:9, color:'var(--t3)', marginBottom:2 }}>Fonte (px)</div>
              {numInp('inputFontSize', campo.inputFontSize, 7, 48)}
            </div>
            <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
              {chk('inputNegrito', 'Negrito', campo.inputNegrito)}
            </div>
          </div>
          <div>
            <div style={{ fontSize:9, color:'var(--t3)', marginBottom:2 }}>Alinhamento</div>
            <div style={{ display:'flex', gap:3 }}>
              {[['left','←'],['center','↔'],['right','→']].map(([v,ico]) => (
                <button key={v} className={`btn ${(campo.inputAlign||'left')===v?'btn-primary':'btn-ghost'}`}
                  style={{ flex:1, height:26, fontSize:12, padding:0 }} onClick={() => up({ inputAlign:v })}>{ico}</button>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            <div>
              <div style={{ fontSize:9, color:'var(--t3)', marginBottom:2 }}>Cor texto</div>
              <div style={{ display:'flex', gap:3 }}>
                <input type="color" value={campo.inputCor||'#000000'} onChange={e => up({ inputCor: e.target.value })} style={{ width:26, height:26, borderRadius:4, border:'1px solid var(--bd)', padding:1, cursor:'pointer', flexShrink:0 }}/>
                <input className="form-input" value={campo.inputCor||''} onChange={e => up({ inputCor: e.target.value })} placeholder="padrão" style={{ flex:1, height:26, fontSize:10, minWidth:0 }}/>
              </div>
            </div>
            <div>
              <div style={{ fontSize:9, color:'var(--t3)', marginBottom:2 }}>Cor fundo</div>
              <div style={{ display:'flex', gap:3 }}>
                <input type="color" value={campo.inputBg||'#ffffff'} onChange={e => up({ inputBg: e.target.value })} style={{ width:26, height:26, borderRadius:4, border:'1px solid var(--bd)', padding:1, cursor:'pointer', flexShrink:0 }}/>
                <input className="form-input" value={campo.inputBg||''} onChange={e => up({ inputBg: e.target.value })} placeholder="padrão" style={{ flex:1, height:26, fontSize:10, minWidth:0 }}/>
              </div>
            </div>
          </div>
        </div>

        {/* Borda */}
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:.5, borderBottom:'1px solid var(--bd)', paddingBottom:3 }}>Borda</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            <div>
              <div style={{ fontSize:9, color:'var(--t3)', marginBottom:2 }}>Raio (px)</div>
              {numInp('borderRadius', campo.borderRadius, 0, 40)}
            </div>
            <div>
              <div style={{ fontSize:9, color:'var(--t3)', marginBottom:2 }}>Espessura (px)</div>
              {numInp('borderWidth', campo.borderWidth, 0, 10)}
            </div>
          </div>
          <div>
            <div style={{ fontSize:9, color:'var(--t3)', marginBottom:2 }}>Cor</div>
            <div style={{ display:'flex', gap:3 }}>
              <input type="color" value={campo.borderColor||'#cccccc'} onChange={e => up({ borderColor: e.target.value })} style={{ width:26, height:26, borderRadius:4, border:'1px solid var(--bd)', padding:1, cursor:'pointer', flexShrink:0 }}/>
              <input className="form-input" value={campo.borderColor||''} onChange={e => up({ borderColor: e.target.value })} placeholder="padrão" style={{ flex:1, height:26, fontSize:10, minWidth:0 }}/>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
