import { Link } from 'lucide-react'

export function InputPasta({ campo, val, isRO, saving, inputStyle, setField, nomeTabela, pastasSugest, setPastasSugest }) {
  const listId = `datalist_${campo.nome_campo}`
  const sugest = pastasSugest[campo.nome_campo] || []
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <input
        className="form-input"
        list={listId}
        value={val}
        onChange={e => {
          setField(campo.nome_campo, e.target.value)
          // Recarrega sugestões ao digitar se ainda não carregado
          if (!pastasSugest[campo.nome_campo]) {
            window.api.formBuilder.valoresDistintos(nomeTabela, campo.nome_campo)
              .then(res => res.ok && setPastasSugest(p => ({ ...p, [campo.nome_campo]: res.data })))
              .catch(() => {})
          }
        }}
        disabled={isRO || saving}
        placeholder={campo.valor_padrao || 'ex: Contratos'}
        style={{ height: '100%', width: '100%', ...inputStyle }}
      />
      <datalist id={listId}>
        {sugest.map((s, i) => <option key={i} value={s} />)}
      </datalist>
    </div>
  )
}

export function InputDataHora({ campo, val, isRO, saving, inputStyle, setField }) {
  return (
    <input className="form-input" value={val}
      onChange={e => setField(campo.nome_campo, e.target.value)}
      disabled={isRO || saving}
      type="datetime-local"
      style={{ height: '100%', ...inputStyle }} />
  )
}

export function InputHora({ campo, val, isRO, saving, inputStyle, setField }) {
  return (
    <input className="form-input" value={val}
      onChange={e => setField(campo.nome_campo, e.target.value)}
      disabled={isRO || saving}
      type="time"
      style={{ height: '100%', ...inputStyle }} />
  )
}

export function InputUrl({ campo, val, isRO, saving, inputStyle, setField }) {
  return (
    <div style={{ display: 'flex', gap: 4, height: '100%' }}>
      <input className="form-input" value={val}
        onChange={e => setField(campo.nome_campo, e.target.value)}
        disabled={isRO || saving}
        placeholder="https://"
        type="url"
        style={{ flex: 1, height: '100%', ...inputStyle }} />
      {val && (
        <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 8px', height: '100%' }}
          onClick={() => window.api?.shell?.openExternal?.(val)}
          title="Abrir link">
          <Link size={13} />
        </button>
      )}
    </div>
  )
}

export function InputLogin({ campo, val, isRO, saving, inputStyle, setField }) {
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <input className="form-input" value={val}
        onChange={e => setField(campo.nome_campo, e.target.value)}
        disabled={isRO || saving}
        placeholder="usuario.login"
        type="text"
        autoComplete="username"
        style={{ height: '100%', paddingLeft: 32, ...inputStyle }} />
      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--t3)', pointerEvents: 'none' }}>👤</span>
    </div>
  )
}

export function InputSenha({ campo, val, form, isRO, saving, setRedefinirCampo, setRedefinirNova, setRedefinirConf, setRedefinirErro, setRedefinirOpen }) {
  const registroId = form._id
  return (
    <div style={{ display: 'flex', gap: 4, height: '100%' }}>
      <div className="form-input" style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', color: 'var(--t3)', letterSpacing: 3, fontSize: 16 }}>
        {val ? '••••••••' : <span style={{ fontSize: 11, letterSpacing: 0, fontStyle: 'italic' }}>Sem senha definida</span>}
      </div>
      <button className="btn btn-ghost" disabled={isRO || saving || !registroId}
        style={{ flexShrink: 0, padding: '0 10px', height: '100%', fontSize: 11, whiteSpace: 'nowrap' }}
        onClick={() => { setRedefinirCampo(campo.nome_campo); setRedefinirNova(''); setRedefinirConf(''); setRedefinirErro(''); setRedefinirOpen(true) }}>
        Redefinir
      </button>
    </div>
  )
}

export function InputPadrao({ campo, val, isRO, saving, inputStyle, setField }) {
  return (
    <input className="form-input" value={val}
      onChange={e => setField(campo.nome_campo, e.target.value)}
      disabled={isRO || saving}
      placeholder={campo.valor_padrao || ''}
      type={campo.tipo === 'data' ? 'date' : ['numero','moeda'].includes(campo.tipo) ? 'number' : campo.tipo === 'email' ? 'email' : 'text'}
      style={{ height: '100%', ...inputStyle }} />
  )
}
