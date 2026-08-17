import { CircleDot, ChevronDown } from 'lucide-react'
import { FUNCOES_BOTAO } from '../constants.js'
import { DelBtn } from './CampoCardSimples.jsx'

export function CampoCardBotao({ campo, idx, campos, setCampos, atualizarCampo, isExp, toggleExpand, tipInfoIdx, setTipInfoIdx, salvando }) {
  let cfg = {}
  try { cfg = JSON.parse(campo.valorPadrao || '{}') } catch {}
  const fn = cfg.fn || 'copiarTexto', param = cfg.param || '', variant = cfg.variant || 'ghost'
  const camposRef = campos.filter(c => c._key !== campo._key && !['divisor','botao'].includes(c.tipo) && c.nomeCampo)
  function updateCfg(u) { atualizarCampo(campo._key, 'valorPadrao', JSON.stringify({ ...cfg, ...u })) }
  function trocarFn(novaFn) { updateCfg({ fn: novaFn, param: novaFn === 'copiarTexto' && camposRef.length ? `{${camposRef[0].nomeCampo}}` : '' }) }
  const fnDef = FUNCOES_BOTAO.find(f => f.valor === fn)
  const fnLabel = fnDef?.label || fn
  const lbl = { fontSize: 9, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }
  // Funções que referenciam um campo da tela (arquivo, cnpj, cep)
  const fnCampoRef = ['abrirArquivo','previewArquivo','copiarArquivoLocal','copiarArquivoClipboard','buscarCNPJ','buscarCEP']
  const tiposFiltro = { abrirArquivo: 'arquivo', previewArquivo: 'arquivo', copiarArquivoLocal: 'arquivo', copiarArquivoClipboard: 'arquivo', buscarCNPJ: 'cnpj', buscarCEP: 'cep' }
  const camposPorTipo = fnCampoRef.includes(fn)
    ? campos.filter(c => c._key !== campo._key && c.tipo === tiposFiltro[fn] && c.nomeCampo)
    : []
  const grupos = [
    { id: 'geral',    label: 'Geral' },
    { id: 'arquivo',  label: 'Arquivo' },
    { id: 'registro', label: 'Registro' },
    { id: 'consulta', label: 'Consultas externas' },
  ]
  return (
    <div key={campo._key}
      style={{ background: 'rgba(255,107,43,.04)', border: '1px solid rgba(255,107,43,.2)', borderLeft: '3px solid var(--or)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 10px', cursor: 'pointer' }}
        onClick={() => toggleExpand(campo._key)}>
        <CircleDot size={13} color="var(--or)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{campo.label || 'Botão'}</span>
        <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>{fnLabel}</span>
        <ChevronDown size={12} color="var(--t3)" style={{ transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
        <DelBtn campo={campo} idx={idx} setCampos={setCampos} tipInfoIdx={tipInfoIdx} setTipInfoIdx={setTipInfoIdx} salvando={salvando} />
      </div>
      {isExp && (
        <div style={{ padding: '10px 12px 12px', borderTop: '1px solid rgba(255,107,43,.15)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ width: 120 }}>
            <label style={lbl}>Texto</label>
            <input className="form-input" style={{ height: 28, fontSize: 11 }} value={campo.label}
              onChange={e => atualizarCampo(campo._key, 'label', e.target.value)} placeholder="Copiar, Abrir..." disabled={salvando} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={lbl}>Ação</label>
            <select className="form-select" style={{ height: 28, fontSize: 11 }} value={fn} onChange={e => trocarFn(e.target.value)} disabled={salvando}>
              {grupos.map(g => {
                const fns = FUNCOES_BOTAO.filter(f => f.grupo === g.id)
                if (!fns.length) return null
                return <optgroup key={g.id} label={g.label}>
                  {fns.map(f => <option key={f.valor} value={f.valor}>{f.label}</option>)}
                </optgroup>
              })}
            </select>
          </div>
          {/* Campo de referência (arquivo, cnpj, cep) */}
          {fnCampoRef.includes(fn) && (
            <div style={{ flex: 1, minWidth: 130 }}>
              <label style={lbl}>Campo {tiposFiltro[fn]}</label>
              {camposPorTipo.length
                ? <select className="form-select" style={{ height: 28, fontSize: 11 }} value={param} onChange={e => updateCfg({ param: e.target.value })} disabled={salvando}>
                    <option value="">Selecione</option>
                    {camposPorTipo.map(c => <option key={c._key} value={c.nomeCampo}>{c.label||c.nomeCampo}</option>)}
                  </select>
                : <div style={{ fontSize: 10, color: 'var(--red,#ef4444)', padding: '6px 4px' }}>
                    Adicione um campo do tipo "{tiposFiltro[fn]}" na tela primeiro.
                  </div>
              }
            </div>
          )}
          {/* Campo de texto para copiar */}
          {fn === 'copiarTexto' && (
            <div style={{ flex: 1, minWidth: 130 }}>
              <label style={lbl}>Campo</label>
              {camposRef.length
                ? <select className="form-select" style={{ height: 28, fontSize: 11 }} value={param} onChange={e => updateCfg({ param: e.target.value })} disabled={salvando}>
                    <option value="">Selecione</option>
                    {camposRef.map(c => <option key={c._key} value={`{${c.nomeCampo}}`}>{c.label||c.nomeCampo}</option>)}
                  </select>
                : <input className="form-input" style={{ height: 28, fontSize: 11 }} value={param} onChange={e => updateCfg({ param: e.target.value })} placeholder="Texto fixo ou {campo}" disabled={salvando} />
              }
            </div>
          )}
          {/* Parâmetro de texto livre */}
          {['mostrarAlerta','mostrarSucesso','mostrarErro','mostrarAviso','abrirTela','abrirEmNovaAba','excluirRegistro'].includes(fn) && (
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={lbl}>
                {fn === 'abrirTela' ? 'Tela destino' : fn === 'abrirEmNovaAba' ? 'URL' : fn === 'excluirRegistro' ? 'Confirmação' : 'Mensagem'}
              </label>
              <input className="form-input" style={{ height: 28, fontSize: 11 }} value={param}
                onChange={e => updateCfg({ param: e.target.value })}
                placeholder={fn === 'abrirEmNovaAba' ? 'https://...' : fn === 'abrirTela' ? 'dashboard · fb__tabela' : fn === 'excluirRegistro' ? 'Confirma exclusão?' : 'Mensagem'}
                disabled={salvando} />
            </div>
          )}
          <div style={{ width: 80 }}>
            <label style={lbl}>Estilo</label>
            <select className="form-select" style={{ height: 28, fontSize: 11 }} value={variant} onChange={e => updateCfg({ variant: e.target.value })} disabled={salvando}>
              <option value="primary">Laranja</option>
              <option value="ghost">Cinza</option>
              <option value="danger">Vermelho</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
