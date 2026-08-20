import { Plus } from 'lucide-react'
import { TIPOS, TIPOS_COM_OPCOES, COR_PALETTE } from '../constants.js'
import { TipoCampoInfo, Sec, Row, ColorField } from '../_shared.jsx'
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
            <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Coluna Tabela *</label>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
          {[['X', 'x_pos', 0, 2000], ['Y', 'y_pos', 0, 2000], ['Larg.', 'w_px', 20, 2000], ['Alt.', 'h_px', 16, 400]].map(([lbl2, key, min, max]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--t3)' }}>{lbl2}</span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>Largura % lista</span>
            {numInput('largura', campo.largura, 10, 100, 64)}<span style={{ fontSize: 10, color: 'var(--t3)' }}>%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>Tamanho BD</span>
            {numInput('tamanho', campo.tamanho, 1, 5000, 64)}<span style={{ fontSize: 10, color: 'var(--t3)' }}>ch</span>
          </div>
        </div>
      </Sec>

      {/* ESTILO — LABEL */}
      <Sec title="Estilo do label">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>Fonte</span>
            {numInput('fontSize', campo.fontSize, 7, 48, 64)}<span style={{ fontSize: 10, color: 'var(--t3)' }}>px</span>
          </div>
          {chk('semNegrito', 'Sem negrito', campo.semNegrito)}
          <ColorField label="Cor" value={campo.labelCor} pickerFallback="#888888" disabled={salvando} onChange={v => upC('labelCor', v)} />
        </div>
      </Sec>

      {/* ESTILO — CONTEÚDO */}
      <Sec title="Estilo do conteúdo">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>Fonte</span>
            {numInput('inputFontSize', campo.inputFontSize, 7, 48, 64)}<span style={{ fontSize: 10, color: 'var(--t3)' }}>px</span>
          </div>
          {chk('inputNegrito', 'Negrito', campo.inputNegrito)}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>Alinhar</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {[['left','←'],['center','↔'],['right','→']].map(([v, ico]) => (
                <button key={v} className={`btn ${(campo.inputAlign || 'left') === v ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ height: 24, width: 28, fontSize: 12, padding: 0 }} disabled={salvando}
                  onClick={() => upC('inputAlign', v)}>{ico}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ColorField label="Cor texto" value={campo.inputCor} pickerFallback="#000000" disabled={salvando} onChange={v => upC('inputCor', v)} />
          <ColorField label="Cor fundo" value={campo.inputBg} pickerFallback="#ffffff" disabled={salvando} onChange={v => upC('inputBg', v)} />
        </div>
      </Sec>

      {/* ESTILO — BORDA */}
      <Sec title="Borda">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>Raio</span>
            {numInput('borderRadius', campo.borderRadius, 0, 40, 64)}<span style={{ fontSize: 10, color: 'var(--t3)' }}>px</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>Espessura</span>
            {numInput('borderWidth', campo.borderWidth, 0, 10, 64)}<span style={{ fontSize: 10, color: 'var(--t3)' }}>px</span>
          </div>
          <ColorField label="Cor" value={campo.borderColor} pickerFallback="#cccccc" disabled={salvando} onChange={v => upC('borderColor', v)} />
        </div>
      </Sec>

    </div>
  )
}
