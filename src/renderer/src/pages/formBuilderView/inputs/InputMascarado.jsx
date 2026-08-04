import { CheckCircle2, XCircle, Loader2, Building2, MapPin, Globe } from 'lucide-react'
import { maskCPF, maskCNPJ, maskCEP } from '../../../lib/utils/masks.js'
import { validarCPF, validarCNPJ } from '../../../lib/utils/validators.js'

// Campos de documento com máscara + validação + busca externa (CNPJ/CEP via
// useAutoFillCnpjCep). Todos fecham sobre docLoading/docErro do mesmo hook.

export function InputCPF({ campo, val, isRO, saving, setField }) {
  const cpfVal = String(val || '')
  const cpfOk  = cpfVal.replace(/\D/g, '').length === 11 ? validarCPF(cpfVal) : null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: '100%' }}>
      <input className="form-input" value={cpfVal}
        onChange={e => setField(campo.nome_campo, maskCPF(e.target.value))}
        disabled={isRO || saving}
        placeholder="000.000.000-00"
        maxLength={14}
        style={{ height: '100%', flex: 1 }} />
      {cpfVal.replace(/\D/g, '').length === 11 && (
        cpfOk
          ? <CheckCircle2 size={16} style={{ color: 'var(--green, #22c55e)', flexShrink: 0 }} />
          : <XCircle      size={16} style={{ color: 'var(--red,   #ef4444)', flexShrink: 0 }} />
      )}
    </div>
  )
}

export function InputCNPJ({ campo, val, isRO, saving, compact, inputStyle, setField, docLoading, docErro, buscarCNPJ }) {
  const cnpjVal  = String(val || '')
  const cnpjDig  = cnpjVal.replace(/\D/g, '')
  const cnpjOk   = cnpjDig.length === 14 ? validarCNPJ(cnpjVal) : null
  const isLoading = docLoading[campo.nome_campo]
  const errMsg    = docErro[campo.nome_campo]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minHeight: 0 }}>
        <input className="form-input" value={cnpjVal}
          onChange={e => setField(campo.nome_campo, maskCNPJ(e.target.value))}
          disabled={isRO || saving}
          placeholder="00.000.000/0000-00"
          maxLength={18}
          style={{ flex: 1, height: '100%', ...inputStyle }} />
        {cnpjDig.length === 14 && (
          cnpjOk
            ? <CheckCircle2 size={16} style={{ color: 'var(--green, #22c55e)', flexShrink: 0 }} />
            : <XCircle      size={16} style={{ color: 'var(--red,   #ef4444)', flexShrink: 0 }} />
        )}
        <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 8px', gap: 4, fontSize: 12, whiteSpace: 'nowrap', height: '100%' }}
          onClick={() => buscarCNPJ(campo, cnpjVal)} disabled={saving || isLoading || isRO} title={campo.label || 'Buscar CNPJ'}>
          {isLoading
            ? <Loader2   size={13} style={{ animation: 'spin 1s linear infinite' }} />
            : <Building2 size={13} />}
          {!compact && (campo.label || 'Buscar')}
        </button>
      </div>
      {errMsg && <span style={{ fontSize: 11, color: 'var(--red, #ef4444)', flexShrink: 0 }}>{errMsg}</span>}
    </div>
  )
}

export function InputCEP({ campo, val, isRO, saving, compact, inputStyle, setField, docLoading, docErro, buscarCEP }) {
  const cepVal    = String(val || '')
  const cepDig    = cepVal.replace(/\D/g, '')
  const isLoading = docLoading[campo.nome_campo]
  const errMsg    = docErro[campo.nome_campo]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minHeight: 0 }}>
        <input className="form-input" value={cepVal}
          onChange={e => setField(campo.nome_campo, maskCEP(e.target.value))}
          onBlur={() => buscarCEP(campo)}
          disabled={isRO || saving}
          placeholder="00000-000"
          maxLength={9}
          style={{ flex: 1, height: '100%', ...inputStyle }} />
        <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 8px', gap: 4, fontSize: 12, whiteSpace: 'nowrap', height: '100%' }}
          onClick={() => buscarCEP(campo)} disabled={saving || isLoading || isRO || cepDig.length < 8} title={campo.label || 'Buscar CEP'}>
          {isLoading
            ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            : <MapPin  size={13} />}
          {!compact && (campo.label || 'Buscar')}
        </button>
      </div>
      {errMsg && <span style={{ fontSize: 11, color: 'var(--red, #ef4444)', flexShrink: 0 }}>{errMsg}</span>}
    </div>
  )
}

export function InputDocumento({ campo, val, form, isRO, saving, inputStyle, setField, docLoading, docErro, buscarCNPJ }) {
  const docVal    = String(val || '')
  const docDig    = docVal.replace(/\D/g, '')
  const tipoKey   = campo.opcoes?.tipoRef || `__doc_tipo_${campo.nome_campo}`
  const tipoRadio = String(form[tipoKey] || '').toUpperCase()
  // Se radio definido, usa ele; senão detecta pelo número de dígitos já digitados
  // Quando campo vazio e sem radio, mantém ambíguo (aceita ambos)
  const tipoDoc   = tipoRadio === 'J' ? 'J'
                  : tipoRadio === 'F' ? 'F'
                  : (docDig.length > 11 ? 'J' : docDig.length === 11 ? 'F' : null)
  const isFisica  = tipoDoc === 'F'
  const isJuridica = tipoDoc === 'J'
  const isLoading = docLoading[campo.nome_campo]
  const errMsg    = docErro[campo.nome_campo]

  const docOk = isFisica  ? (docDig.length === 11 ? validarCPF(docVal)  : null)
              : isJuridica ? (docDig.length === 14 ? validarCNPJ(docVal) : null)
              : null

  function handleDocChange(e) {
    const raw = e.target.value.replace(/\D/g, '')
    // Aplica máscara conforme tamanho: até 11 dígitos → CPF, mais → CNPJ
    const masked = raw.length > 11 ? maskCNPJ(e.target.value) : maskCPF(e.target.value)
    setField(campo.nome_campo, masked)
    // Sincroniza o campo radio se existir e ainda estiver vazio
    if (tipoKey && !tipoRadio) {
      if (raw.length === 11) setField(tipoKey, 'F')
      else if (raw.length === 14) setField(tipoKey, 'J')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%' }}>
      {/* Input + validação + botão consultar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minHeight: 0 }}>
        <input className="form-input" value={docVal}
          onChange={handleDocChange}
          disabled={isRO || saving}
          placeholder={isFisica ? '000.000.000-00' : isJuridica ? '00.000.000/0000-00' : 'CPF ou CNPJ'}
          maxLength={isFisica ? 14 : 18}
          style={{ flex: 1, height: '100%', ...inputStyle }} />
        {docOk !== null && (
          docOk
            ? <CheckCircle2 size={16} style={{ color: 'var(--green, #22c55e)', flexShrink: 0 }} />
            : <XCircle      size={16} style={{ color: 'var(--red,   #ef4444)', flexShrink: 0 }} />
        )}
        {isJuridica && (
          <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 9px', height: '100%' }}
            onClick={() => buscarCNPJ(campo, docVal)} disabled={saving || isLoading || isRO} title="Consultar CNPJ na Receita Federal">
            {isLoading
              ? <Loader2    size={15} style={{ animation: 'spin 1s linear infinite' }} />
              : <Globe size={15} />}
          </button>
        )}
      </div>
      {errMsg && <span style={{ fontSize: 11, color: 'var(--red, #ef4444)', flexShrink: 0 }}>{errMsg}</span>}
    </div>
  )
}
