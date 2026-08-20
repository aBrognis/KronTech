import { ChevronDown, Info, Plus } from 'lucide-react'
import { TIPOS, TIPOS_COM_OPCOES, COR_PALETTE, TIPO_META } from '../constants.js'
import { TipoCampoInfo } from '../_shared.jsx'
import OpcoesList from '../OpcoesList.jsx'
import { DelBtn } from './CampoCardSimples.jsx'

// Card genérico usado por todos os tipos de campo que não têm accordion
// próprio (divisor, copiar, favorito/timestamps, botao, lookup), cobre
// texto/número/opções/documento/cálculo/avaliação e as opções comuns de
// layout (label, largura, tamanho no BD, obrigatório, etc).
export function CampoCardPadrao({ campo, idx, setCampos, atualizarCampo, isExp, toggleExpand, tipInfoIdx, setTipInfoIdx, salvando, editando }) {
  const meta = TIPO_META[campo.tipo] || { short: '?', color: '#94A3B8' }
  return (
    <div key={campo._key}
      style={{ background: isExp ? 'var(--s2)' : 'var(--s1)', border: `1px solid ${isExp ? 'var(--or)' : 'var(--bd)'}`, borderLeft: `3px solid ${isExp ? 'var(--or)' : meta.color}`, borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--sh-xs)', transition: 'border-color .15s, background .15s' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 10px', cursor: 'pointer' }}
        onClick={() => toggleExpand(campo._key)}>
        <span style={{ fontSize: 9, fontWeight: 700, background: meta.color + '22', color: meta.color, padding: '3px 6px', borderRadius: 5, flexShrink: 0, minWidth: 30, textAlign: 'center', border: `1px solid ${meta.color}44`, lineHeight: 1 }}>{meta.short}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: campo.label ? 'var(--t1)' : 'var(--t3)', fontStyle: campo.label ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {campo.label || 'Sem label'}
        </span>
        <code style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--t3)', background: 'var(--s3)', padding: '2px 6px', borderRadius: 3, flexShrink: 0 }}>{campo.nomeCampo || 'sem_nome'}</code>
        {campo.obrigatorio && <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 5px', background: 'rgba(248,113,113,.12)', color: 'var(--red)', borderRadius: 3, flexShrink: 0 }}>OBR</span>}
        <ChevronDown size={12} color="var(--t3)" style={{ transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
        <DelBtn campo={campo} idx={idx} setCampos={setCampos} tipInfoIdx={tipInfoIdx} setTipInfoIdx={setTipInfoIdx} salvando={salvando} />
      </div>
      {/* Body expandido */}
      {isExp && (
        <div style={{ padding: '12px 12px 14px', borderTop: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div className="form-group">
              <label className="form-label">Label *</label>
              <input className="form-input" style={{ height: 32 }} value={campo.label}
                onChange={e => atualizarCampo(campo._key, 'label', e.target.value)} placeholder="Ex: Razão Social" disabled={salvando} />
            </div>
            <div className="form-group">
              <label className="form-label">Coluna Tabela *</label>
              <input className="form-input" style={{ height: 32, fontFamily: 'monospace', fontSize: 11 }} value={campo.nomeCampo}
                onChange={e => atualizarCampo(campo._key, 'nomeCampo', e.target.value)} placeholder="razao_social" disabled={salvando} />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className="form-label" style={{ margin: 0 }}>Tipo</label>
                <button type="button" onClick={() => setTipInfoIdx(tipInfoIdx === idx ? null : idx)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: tipInfoIdx === idx ? 'var(--or)' : 'var(--t3)', display: 'flex', padding: 0 }}>
                  <Info size={11} />
                </button>
              </div>
              <select className="form-select" style={{ height: 32 }} value={campo.tipo}
                onChange={e => { atualizarCampo(campo._key, 'tipo', e.target.value); setTipInfoIdx(idx) }} disabled={salvando}>
                {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
              </select>
            </div>
          </div>
          {tipInfoIdx === idx && <TipoCampoInfo tipo={campo.tipo} />}
          {campo.tipo === 'documento' && (
            <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8 }}>Vínculo Física / Jurídica</span>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 10 }}>Nome do campo radio (F/J)</label>
                <input className="form-input" style={{ height: 28, fontSize: 11, fontFamily: 'monospace' }}
                  value={(campo.opcoes?.tipoRef) || ''}
                  onChange={e => atualizarCampo(campo._key, 'opcoes', { ...(campo.opcoes||{}), tipoRef: e.target.value.trim() })}
                  placeholder="ex: tipo_pessoa" disabled={salvando} />
              </div>
              <span style={{ fontSize: 9.5, color: 'var(--t3)', lineHeight: 1.5 }}>
                Crie um campo <b>Radio</b> com opções <b>F</b> (Física) e <b>J</b> (Jurídica) e informe seu nome aqui. O documento adaptará a máscara e validação automaticamente.
              </span>
            </div>
          )}
          {campo.tipo === 'calculo' && (
            <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8 }}>Fórmula</span>
              <input className="form-input" style={{ height: 32, fontFamily: 'monospace', fontSize: 12 }}
                value={campo.opcoes?.formula || ''}
                onChange={e => atualizarCampo(campo._key, 'opcoes', { ...(campo.opcoes || {}), formula: e.target.value })}
                placeholder="{preco} * {quantidade}" disabled={salvando} />
              <span style={{ fontSize: 9.5, color: 'var(--t3)', lineHeight: 1.5 }}>
                Use <code style={{ fontFamily: 'monospace', background: 'var(--s3)', padding: '0 4px', borderRadius: 3 }}>{'{nome_campo}'}</code> para referenciar outros campos. Suporta <code style={{ fontFamily: 'monospace', background: 'var(--s3)', padding: '0 4px', borderRadius: 3 }}>+  -  *  /  (  )</code> e funções JS como <code style={{ fontFamily: 'monospace', background: 'var(--s3)', padding: '0 4px', borderRadius: 3 }}>Math.round()</code>.
              </span>
              <span style={{ fontSize: 9.5, color: 'var(--t3)' }}>
                O campo não é gravado no banco, é calculado em tempo real no formulário.
              </span>
            </div>
          )}
          {campo.tipo === 'avaliacao' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap' }}>Máximo de estrelas:</span>
              <input type="number" className="form-input" min={1} max={10}
                value={campo.opcoes?.max || 5}
                onChange={e => atualizarCampo(campo._key, 'opcoes', { ...(campo.opcoes || {}), max: Math.max(1, Math.min(10, Number(e.target.value) || 5)) })}
                disabled={salvando}
                style={{ width: 56, height: 28, fontSize: 12, padding: '0 8px' }} />
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                {Array.from({ length: campo.opcoes?.max || 5 }, () => '★').join('')}
              </span>
            </div>
          )}
          {TIPOS_COM_OPCOES.includes(campo.tipo) && (
            <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8, padding: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8 }}>
                  {campo.tipo === 'flags' ? 'Flags (Label + Código)' : 'Opções'}
                </span>
                <button type="button" className="btn btn-ghost" style={{ height: 22, fontSize: 10, padding: '0 8px' }}
                  onClick={() => {
                    const ops = campo.opcoes||[]
                    const n = ops.length + 1
                    const nova = campo.tipo === 'flags'
                      ? { label: `Flag ${n}`, valor: '' }
                      : { label: `Opção ${n}`, valor: `opcao_${n}`, cor: COR_PALETTE[ops.length % COR_PALETTE.length] }
                    atualizarCampo(campo._key, 'opcoes', [...ops, nova])
                  }}
                  disabled={salvando}><Plus size={10} /> {campo.tipo === 'flags' ? 'Flag' : 'Opção'}</button>
              </div>
              <OpcoesList
                opcoes={campo.opcoes || []}
                tipo={campo.tipo}
                salvando={salvando}
                onChange={ops => atualizarCampo(campo._key, 'opcoes', ops)}
              />
            </div>
          )}
          {/* Valor padrão + opções do campo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

            {/* Valor padrão */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Valor Padrão</label>
              {TIPOS_COM_OPCOES.includes(campo.tipo) && Array.isArray(campo.opcoes) && campo.opcoes.length > 0 ? (
                <select className="form-select" style={{ height: 30 }} value={campo.valorPadrao || ''}
                  onChange={e => atualizarCampo(campo._key, 'valorPadrao', e.target.value)} disabled={salvando}>
                  <option value="">Nenhum</option>
                  {campo.opcoes.map((op, i) => <option key={i} value={op.valor}>{op.label}</option>)}
                </select>
              ) : (
                <input className="form-input" style={{ height: 30 }} value={campo.valorPadrao}
                  onChange={e => atualizarCampo(campo._key, 'valorPadrao', e.target.value)}
                  placeholder={TIPOS.find(t => t.valor === campo.tipo)?.ex?.split(',')[0] || 'opcional'} disabled={salvando} />
              )}
            </div>

            {/* Grade de opções compacta */}
            <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>

              {/* Linha única com tudo */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', alignItems: 'center' }}>

                {/* Checkboxes comportamento */}
                {[
                  { key: 'obrigatorio', label: 'Obrigatório',    dis: false },
                  { key: 'campoBusca',  label: 'Campo de busca', dis: false },
                  { key: 'sequencial',  label: 'Sequencial',     dis: !!editando },
                ].map(({ key, label, dis }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: dis ? 'not-allowed' : 'pointer', userSelect: 'none', color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={!!campo[key]}
                      onChange={e => atualizarCampo(campo._key, key, e.target.checked)}
                      disabled={salvando || dis} style={{ accentColor: 'var(--or)', flexShrink: 0 }} />
                    {label}
                  </label>
                ))}

                <div style={{ width: 1, height: 14, background: 'var(--bd2)', flexShrink: 0 }} />

                {/* Label */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer', userSelect: 'none', color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={!!campo.semNegrito}
                    onChange={e => atualizarCampo(campo._key, 'semNegrito', e.target.checked)}
                    disabled={salvando} style={{ accentColor: 'var(--or)', flexShrink: 0 }} />
                  Label s/ negrito
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                  Label px:
                  <input type="number" className="form-input" min={8} max={32}
                    value={campo.fontSize || ''}
                    onChange={e => atualizarCampo(campo._key, 'fontSize', e.target.value ? Number(e.target.value) : null)}
                    placeholder="auto" disabled={salvando}
                    style={{ width: 44, height: 22, fontSize: 10, padding: '0 4px' }} />
                </div>

                <div style={{ width: 1, height: 14, background: 'var(--bd2)', flexShrink: 0 }} />

                {/* Conteúdo */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer', userSelect: 'none', color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={!!campo.inputNegrito}
                    onChange={e => atualizarCampo(campo._key, 'inputNegrito', e.target.checked)}
                    disabled={salvando} style={{ accentColor: 'var(--or)', flexShrink: 0 }} />
                  Conteúdo negrito
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                  Conteúdo px:
                  <input type="number" className="form-input" min={8} max={32}
                    value={campo.inputFontSize || ''}
                    onChange={e => atualizarCampo(campo._key, 'inputFontSize', e.target.value ? Number(e.target.value) : null)}
                    placeholder="auto" disabled={salvando}
                    style={{ width: 44, height: 22, fontSize: 10, padding: '0 4px' }} />
                </div>

                <div style={{ width: 1, height: 14, background: 'var(--bd2)', flexShrink: 0 }} />

                {/* Métricas */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                  Largura:
                  <input type="number" className="form-input" min={10} max={100}
                    value={campo.largura || 50}
                    onChange={e => atualizarCampo(campo._key, 'largura', Math.max(10, Math.min(100, Number(e.target.value) || 50)))}
                    disabled={salvando}
                    style={{ width: 44, height: 22, fontSize: 10, padding: '0 4px' }} />
                  %
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                  BD:
                  <input type="number" className="form-input" min={1} max={5000}
                    value={campo.tamanho || 100}
                    onChange={e => atualizarCampo(campo._key, 'tamanho', Math.max(1, Number(e.target.value) || 100))}
                    disabled={salvando}
                    style={{ width: 54, height: 22, fontSize: 10, padding: '0 4px' }} />
                  chars
                </div>

              </div>

              {/* Sequencial: linha extra só quando ativo */}
              {campo.sequencial && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--t2)' }}>
                  <span>Dígitos do código sequencial:</span>
                  <input type="number" className="form-input" min={1} max={20}
                    value={(campo.opcoes?.seqChars) || 3}
                    onChange={e => atualizarCampo(campo._key, 'opcoes', { ...(campo.opcoes || {}), seqChars: Math.max(1, Math.min(20, Number(e.target.value) || 3)) })}
                    disabled={salvando} style={{ width: 48, height: 22, fontSize: 10, padding: '0 4px' }} />
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
