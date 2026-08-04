import { FUNCOES_BOTAO } from '../constants.js'

export function CampoPainelBotao({ campo, campos, atualizarCampo, salvando }) {
  let cfg = {}
  try { cfg = JSON.parse(campo.valorPadrao || '{}') } catch {}
  const fn = cfg.fn || 'copiarTexto', param = cfg.param || '', variant = cfg.variant || 'ghost'
  const camposRef = campos.filter(c => c._key !== campo._key && !['divisor','botao'].includes(c.tipo) && c.nomeCampo)
  function updateCfg(u) { atualizarCampo(campo._key, 'valorPadrao', JSON.stringify({ ...cfg, ...u })) }
  function trocarFn(novaFn) { updateCfg({ fn: novaFn, param: '' }) }
  const fnDef = FUNCOES_BOTAO.find(f => f.valor === fn)
  const semParam = ['limparFormulario','exportarPDF','voltarTela'].includes(fn)
  const fnCampoRef = ['abrirArquivo','previewArquivo','copiarArquivoLocal','copiarArquivoClipboard','buscarCNPJ','buscarCEP']
  const tiposFiltro = { abrirArquivo: 'arquivo', previewArquivo: 'arquivo', copiarArquivoLocal: 'arquivo', copiarArquivoClipboard: 'arquivo', buscarCNPJ: 'cnpj', buscarCEP: 'cep' }
  const camposPorTipo = fnCampoRef.includes(fn) ? campos.filter(c => c._key !== campo._key && c.tipo === tiposFiltro[fn] && c.nomeCampo) : []
  const grupos = [
    { id: 'geral',    label: '— Geral' },
    { id: 'arquivo',  label: '— Arquivo' },
    { id: 'registro', label: '— Registro' },
    { id: 'consulta', label: '— Consultas externas' },
  ]
  return (
    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="form-group">
        <label className="form-label">Texto do botão</label>
        <input className="form-input" value={campo.label} onChange={e => atualizarCampo(campo._key, 'label', e.target.value)} placeholder="Ex: Salvar, Abrir..." disabled={salvando} />
      </div>
      <div className="form-group">
        <label className="form-label">Ação</label>
        <select className="form-select" value={fn} onChange={e => trocarFn(e.target.value)} disabled={salvando}>
          {grupos.map(g => {
            const fns = FUNCOES_BOTAO.filter(f => f.grupo === g.id)
            if (!fns.length) return null
            return <optgroup key={g.id} label={g.label}>{fns.map(f => <option key={f.valor} value={f.valor}>{f.label}</option>)}</optgroup>
          })}
        </select>
        {fnDef?.paramLabel && !semParam && <span style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4, display: 'block' }}>{fnDef.paramLabel}</span>}
      </div>
      {fnCampoRef.includes(fn) && (
        <div className="form-group">
          <label className="form-label">Campo {tiposFiltro[fn]}</label>
          {camposPorTipo.length
            ? <select className="form-select" value={param} onChange={e => updateCfg({ param: e.target.value })} disabled={salvando}>
                <option value="">— selecione —</option>
                {camposPorTipo.map(c => <option key={c._key} value={c.nomeCampo}>{c.label || c.nomeCampo}</option>)}
              </select>
            : <div style={{ fontSize: 11, color: '#fb923c', padding: '6px 0' }}>Adicione um campo do tipo "{tiposFiltro[fn]}" primeiro.</div>
          }
        </div>
      )}
      {fn === 'copiarTexto' && (
        <div className="form-group">
          <label className="form-label">Campo</label>
          {camposRef.length
            ? <select className="form-select" value={param} onChange={e => updateCfg({ param: e.target.value })} disabled={salvando}>
                <option value="">— campo —</option>
                {camposRef.map(c => <option key={c._key} value={`{${c.nomeCampo}}`}>{c.label || c.nomeCampo}</option>)}
              </select>
            : <input className="form-input" value={param} onChange={e => updateCfg({ param: e.target.value })} placeholder="Texto fixo ou {campo}" disabled={salvando} />
          }
        </div>
      )}
      {['mostrarAlerta','mostrarSucesso','mostrarErro','mostrarAviso','abrirTela','abrirEmNovaAba','excluirRegistro'].includes(fn) && (
        <div className="form-group">
          <label className="form-label">{fn === 'abrirTela' ? 'Tela destino' : fn === 'abrirEmNovaAba' ? 'URL' : fn === 'excluirRegistro' ? 'Confirmação' : 'Mensagem'}</label>
          <input className="form-input" value={param} onChange={e => updateCfg({ param: e.target.value })}
            placeholder={fn === 'abrirEmNovaAba' ? 'https://...' : fn === 'abrirTela' ? 'dashboard · fb__tabela' : fn === 'excluirRegistro' ? 'Confirma exclusão?' : 'Mensagem'}
            disabled={salvando} />
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Estilo</label>
        <select className="form-select" value={variant} onChange={e => updateCfg({ variant: e.target.value })} disabled={salvando}>
          <option value="primary">Laranja</option>
          <option value="ghost">Cinza</option>
          <option value="danger">Vermelho</option>
        </select>
      </div>
    </div>
  )
}
