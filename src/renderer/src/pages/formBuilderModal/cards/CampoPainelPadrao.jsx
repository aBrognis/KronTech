import { Plus } from 'lucide-react'
import { TIPOS, TIPOS_COM_OPCOES, COR_PALETTE } from '../constants.js'
import { TipoCampoInfo, Sec, Row } from '../_shared.jsx'
import OpcoesList from '../OpcoesList.jsx'

// Painel do designer para o campo genérico (mesma cobertura do
// CampoCardPadrao, mas em layout de sidebar com seções Sec/Row).
export function CampoPainelPadrao({ campo, campos, atualizarCampo, salvando, editando, tipInfoIdx, setTipInfoIdx }) {
  const upC = (k, v) => atualizarCampo(campo._key, k, v)
  const numInput = (key, val, min, max, w = 56) => (
    <input type="number" className="form-input" min={min} max={max}
      value={val ?? ''} disabled={salvando}
      onChange={e => upC(key, e.target.value === '' ? null : Number(e.target.value))}
      onBlur={e => {
        if (e.target.value === '') return
        const n = Number(e.target.value)
        const clamped = Math.max(min, Math.min(max, n))
        if (clamped !== n) upC(key, clamped)
      }}
      style={{ width: w, height: 26, fontSize: 11, padding: '0 6px' }} />
  )
  const chk = (key, label, val, dis) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, cursor: dis ? 'not-allowed' : 'pointer', color: 'var(--t2)', userSelect: 'none' }}>
      <input type="checkbox" checked={!!val} onChange={e => upC(key, e.target.checked)} disabled={salvando || dis} style={{ accentColor: 'var(--or)' }} />
      {label}
    </label>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', fontSize: 11 }}>

      {/* ESSENCIAIS */}
      <div style={{ padding: '14px 14px 10px', display: 'flex', flexDirection: 'column', gap: 10, borderBottom: '1px solid var(--bd)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Label *</label>
            <input className="form-input" value={campo.label} onChange={e => upC('label', e.target.value)}
              placeholder="Ex: Razao Social" disabled={salvando} style={{ width: '100%', height: 30, fontSize: 12 }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Nome banco *</label>
            <input className="form-input" value={campo.nomeCampo} onChange={e => upC('nomeCampo', e.target.value)}
              placeholder="razao_social" disabled={salvando} style={{ width: '100%', height: 30, fontSize: 11, fontFamily: 'monospace' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Tipo</label>
            <select className="form-select" value={campo.tipo}
              onChange={e => { upC('tipo', e.target.value); setTipInfoIdx(campos.findIndex(c => c._key === campo._key)) }}
              disabled={salvando} style={{ width: '100%', height: 30, fontSize: 11 }}>
              {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Valor padrão</label>
            {TIPOS_COM_OPCOES.includes(campo.tipo) && Array.isArray(campo.opcoes) && campo.opcoes.length > 0
              ? <select className="form-select" value={campo.valorPadrao || ''} onChange={e => upC('valorPadrao', e.target.value)} disabled={salvando} style={{ width: '100%', height: 30, fontSize: 11 }}>
                  <option value="">Nenhum</option>
                  {campo.opcoes.map((op, i) => <option key={i} value={op.valor}>{op.label}</option>)}
                </select>
              : <input className="form-input" value={campo.valorPadrao} onChange={e => upC('valorPadrao', e.target.value)}
                  placeholder="opcional" disabled={salvando} style={{ width: '100%', height: 30, fontSize: 11 }} />}
          </div>
        </div>
        {tipInfoIdx === campos.findIndex(c => c._key === campo._key) && <TipoCampoInfo tipo={campo.tipo} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {chk('obrigatorio', 'Obrigatório', campo.obrigatorio)}
          {chk('campoBusca',  'Campo de busca', campo.campoBusca)}
          {chk('sequencial',  'Sequencial', campo.sequencial, !!editando)}
        </div>
      </div>

      {/* CONFIGS POR TIPO */}
      {(campo.tipo === 'documento' || campo.tipo === 'calculo' || campo.tipo === 'avaliacao' || TIPOS_COM_OPCOES.includes(campo.tipo)) && (
        <Sec title="Configuração do tipo">
          {campo.tipo === 'documento' && (
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Campo tipo PF/PJ</label>
              <input className="form-input" style={{ fontFamily: 'monospace', fontSize: 11, width: '100%', height: 28 }}
                value={campo.opcoes?.tipoRef || ''} onChange={e => upC('opcoes', { ...(campo.opcoes || {}), tipoRef: e.target.value.trim() })}
                placeholder="tipo_pessoa" disabled={salvando} />
              <span style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4, display: 'block' }}>Campo Radio com opções F/J que controla a máscara.</span>
            </div>
          )}
          {campo.tipo === 'calculo' && (
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Fórmula</label>
              <input className="form-input" style={{ fontFamily: 'monospace', fontSize: 11, width: '100%', height: 28 }}
                value={campo.opcoes?.formula || ''} onChange={e => upC('opcoes', { ...(campo.opcoes || {}), formula: e.target.value })}
                placeholder="{preco} * {qtd}" disabled={salvando} />
              <span style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4, display: 'block' }}>Use {'{nome_campo}'} para referenciar campos.</span>
            </div>
          )}
          {campo.tipo === 'avaliacao' && (
            <Row label="Máx. estrelas">
              {numInput('opcoes', campo.opcoes?.max || 5, 1, 10, 60)}
              <span style={{ color: '#FBD24C' }}>{Array.from({ length: campo.opcoes?.max || 5 }, () => '★').join('')}</span>
            </Row>
          )}
          {(campo.tipo === 'radio' || campo.tipo === 'flags') && (
            <Row label="Layout">
              {['linha', 'coluna'].map(v => (
                <button key={v} type="button"
                  className={`btn btn-${(campo.opcoesLayout || 'linha') === v ? 'primary' : 'ghost'}`}
                  style={{ fontSize: 11, padding: '2px 10px', height: 26 }}
                  onClick={() => upC('opcoesLayout', v)} disabled={salvando}>
                  {v === 'linha' ? '→ Linha' : '↓ Coluna'}
                </button>
              ))}
            </Row>
          )}
          {TIPOS_COM_OPCOES.includes(campo.tipo) && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)' }}>{campo.tipo === 'flags' ? 'Flags' : 'Opções'}</span>
                <button type="button" className="btn btn-ghost" style={{ height: 22, fontSize: 10, padding: '0 8px' }}
                  onClick={() => {
                    const ops = campo.opcoes || []
                    const n = ops.length + 1
                    const nova = campo.tipo === 'flags' ? { label: `Flag ${n}`, valor: '' } : { label: `Opção ${n}`, valor: `opcao_${n}`, cor: COR_PALETTE[ops.length % COR_PALETTE.length] }
                    upC('opcoes', [...ops, nova])
                  }} disabled={salvando}><Plus size={10} /> Adicionar</button>
              </div>
              <OpcoesList opcoes={campo.opcoes || []} tipo={campo.tipo} salvando={salvando} onChange={ops => upC('opcoes', ops)} />
            </>
          )}
        </Sec>
      )}

      {/* POSICAO & TAMANHO */}
      <Sec title="Posição &amp; Tamanho">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
          {[['X', 'x_pos', 0, 2000], ['Y', 'y_pos', 0, 2000], ['Larg.', 'w_px', 20, 2000], ['Alt.', 'h_px', 16, 400]].map(([lbl2, key, min, max]) => (
            <div key={key}>
              <div style={{ fontSize: 9, color: 'var(--t3)', marginBottom: 2 }}>{lbl2}</div>
              <input type="number" className="form-input" min={min} max={max}
                value={campo[key] ?? ''} disabled={salvando}
                onChange={e => upC(key, e.target.value === '' ? null : Number(e.target.value))}
                onBlur={e => {
                  if (e.target.value === '') return
                  const n = Number(e.target.value)
                  const clamped = Math.max(min, Math.min(max, n))
                  if (clamped !== n) upC(key, clamped)
                }}
                style={{ width: '100%', height: 28, fontSize: 11 }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Row label="Largura % lista">
            {numInput('largura', campo.largura, 10, 100, 56)}
            <span style={{ fontSize: 10, color: 'var(--t3)' }}>%</span>
          </Row>
          <Row label="Tamanho BD">
            {numInput('tamanho', campo.tamanho, 1, 5000, 56)}
            <span style={{ fontSize: 10, color: 'var(--t3)' }}>ch</span>
          </Row>
        </div>
      </Sec>

      {/* ESTILO */}
      <Sec title="Estilo">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .6, borderBottom: '1px solid var(--bd)', paddingBottom: 4, marginBottom: 2 }}>Label</div>
            <Row label="Fonte">{numInput('fontSize', campo.fontSize, 7, 48, 50)}<span style={{ fontSize: 10, color: 'var(--t3)' }}>px</span></Row>
            <Row label="Negrito">{chk('semNegrito', 'Sem negrito', campo.semNegrito)}</Row>
            <div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 4 }}>Cor</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="color" value={campo.labelCor || '#888888'} disabled={salvando}
                  onChange={e => upC('labelCor', e.target.value)}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--bd)', padding: 2, cursor: 'pointer', flexShrink: 0 }} />
                <input className="form-input" value={campo.labelCor || ''} onChange={e => upC('labelCor', e.target.value)}
                  placeholder="padrão" disabled={salvando} style={{ flex: 1, height: 28, fontSize: 11, fontFamily: 'monospace' }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .6, borderBottom: '1px solid var(--bd)', paddingBottom: 4, marginBottom: 2 }}>Conteúdo</div>
            <Row label="Fonte">{numInput('inputFontSize', campo.inputFontSize, 7, 48, 50)}<span style={{ fontSize: 10, color: 'var(--t3)' }}>px</span></Row>
            <Row label="Negrito">{chk('inputNegrito', 'Negrito', campo.inputNegrito)}</Row>
            <Row label="Alinhamento">
              <div style={{ display: 'flex', gap: 2 }}>
                {[['left','←'],['center','↔'],['right','→']].map(([v, ico]) => (
                  <button key={v} className={`btn ${(campo.inputAlign || 'left') === v ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ height: 24, width: 28, fontSize: 12, padding: 0 }} disabled={salvando}
                    onClick={() => upC('inputAlign', v)}>{ico}</button>
                ))}
              </div>
            </Row>
            <div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 4 }}>Cor texto</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="color" value={campo.inputCor || '#000000'} disabled={salvando}
                  onChange={e => upC('inputCor', e.target.value)}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--bd)', padding: 2, cursor: 'pointer', flexShrink: 0 }} />
                <input className="form-input" value={campo.inputCor || ''} onChange={e => upC('inputCor', e.target.value)}
                  placeholder="padrão" disabled={salvando} style={{ flex: 1, height: 28, fontSize: 11, fontFamily: 'monospace' }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 4 }}>Cor fundo</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="color" value={campo.inputBg || '#ffffff'} disabled={salvando}
                  onChange={e => upC('inputBg', e.target.value)}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--bd)', padding: 2, cursor: 'pointer', flexShrink: 0 }} />
                <input className="form-input" value={campo.inputBg || ''} onChange={e => upC('inputBg', e.target.value)}
                  placeholder="padrão" disabled={salvando} style={{ flex: 1, height: 28, fontSize: 11, fontFamily: 'monospace' }} />
              </div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 10, marginTop: 2 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 8 }}>Borda</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Row label="Raio">{numInput('borderRadius', campo.borderRadius, 0, 40, 50)}<span style={{ fontSize: 10, color: 'var(--t3)' }}>px</span></Row>
            <Row label="Espessura">{numInput('borderWidth', campo.borderWidth, 0, 10, 50)}<span style={{ fontSize: 10, color: 'var(--t3)' }}>px</span></Row>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 4 }}>Cor</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="color" value={campo.borderColor || '#cccccc'} disabled={salvando}
                onChange={e => upC('borderColor', e.target.value)}
                style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--bd)', padding: 2, cursor: 'pointer', flexShrink: 0 }} />
              <input className="form-input" value={campo.borderColor || ''} onChange={e => upC('borderColor', e.target.value)}
                placeholder="padrão" disabled={salvando} style={{ flex: 1, height: 28, fontSize: 11, fontFamily: 'monospace' }} />
            </div>
          </div>
        </div>
      </Sec>

    </div>
  )
}
