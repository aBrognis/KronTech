import { useState } from 'react'
import { Search, Plus, Trash2 } from 'lucide-react'
import { FormGrid, Secao } from '../../components/cadastroPadrao/TelaCadastroPadrao'
import InputCidade from '../../components/InputCidade.jsx'
import { notificar } from '../../components/Notificacao'
import { TIPO_ENDERECO } from './utils'
import { completarTiposPadrao, TIPOS_PADRAO } from './enderecoHelpers'

const tipoLabel = (t) => TIPO_ENDERECO.find((x) => x.valor === t)?.label || t

export default function AbaEnderecos({ form, setForm, isRO }) {
  const [buscando, setBuscando] = useState(-1)

  // garante os tipos padrao ao abrir (entidades antigas)
  const enderecos = form.enderecos && form.enderecos.length ? form.enderecos : completarTiposPadrao(form.enderecos)
  if (form.enderecos !== enderecos && !isRO && (!form.enderecos || form.enderecos.length < enderecos.length)) {
    // sincroniza de volta sem loop (so quando de fato completou)
    setTimeout(() => setForm((f) => (f.enderecos && f.enderecos.length >= enderecos.length ? f : { ...f, enderecos })), 0)
  }

  const setLinha = (i, patch) => setForm((f) => ({ ...f, enderecos: (f.enderecos || []).map((e, j) => (j === i ? { ...e, ...patch } : e)) }))
  // aplica os dados do CEP em TODAS as linhas (usuario ajusta as que diferem)
  const setTodos = (patch) => setForm((f) => ({ ...f, enderecos: (f.enderecos || []).map((e) => ({ ...e, ...patch })) }))
  const addLinha = () => setForm((f) => ({ ...f, enderecos: [...(f.enderecos || []), { tipo: 'entrega', descricao: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', principal: false, ativo: true }] }))
  const removeLinha = (i) => {
    const e = enderecos[i]
    if (TIPOS_PADRAO.includes(e.tipo) && enderecos.filter((x) => x.tipo === e.tipo).length === 1) {
      notificar.aviso('Este é um endereço padrão. Deixe em branco em vez de remover.')
      return
    }
    setForm((f) => ({ ...f, enderecos: (f.enderecos || []).filter((_, j) => j !== i) }))
  }

  async function buscarCep(i) {
    const digits = (enderecos[i].cep || '').replace(/\D/g, '')
    if (digits.length !== 8) { notificar.aviso('CEP deve ter 8 dígitos.'); return }
    setBuscando(i)
    try {
      const res = await window.api.entidade.buscarCep(digits)
      if (!res.ok) { notificar.erro(res.erro); return }
      const d = res.data
      const cidade = d.localidade ? `${d.localidade}${d.uf ? ' - ' + d.uf : ''}` : ''
      // preenche TODAS as linhas com os dados do CEP; manutencao individual depois
      setTodos({
        cep: (enderecos[i].cep || '').replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2'),
        logradouro: d.logradouro || '',
        bairro: d.bairro || '',
        complemento: d.complemento || '',
        cidade,
        uf: d.uf || '',
      })
    } finally {
      setBuscando(-1)
    }
  }

  return (
    <FormGrid>
      {enderecos.map((e, i) => (
        <Secao key={i} titulo={`${tipoLabel(e.tipo)}${e.principal ? ' (principal)' : ''}`} largura="full"
          cols="150px 130px minmax(0, 2fr) 90px">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Tipo</label>
            <select className="form-select" value={e.tipo} disabled={isRO || TIPOS_PADRAO.includes(e.tipo)}
              onChange={(ev) => setLinha(i, { tipo: ev.target.value })}>
              {TIPO_ENDERECO.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">CEP</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input className="form-input" value={e.cep || ''} disabled={isRO}
                onChange={(ev) => setLinha(i, { cep: ev.target.value })} placeholder="00000-000" />
              {!isRO && (
                <button className="btn btn-ghost" style={{ flexShrink: 0, height: 34, padding: '0 8px' }}
                  onClick={() => buscarCep(i)} disabled={buscando === i} title="Buscar CEP">
                  <Search size={13} />
                </button>
              )}
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Descrição</label>
            <input className="form-input" value={e.descricao || ''} disabled={isRO}
              onChange={(ev) => setLinha(i, { descricao: ev.target.value.toUpperCase() })} placeholder="Ex: Matriz, CD São Paulo" />
          </div>
          <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'end' }}>
            {!isRO && !TIPOS_PADRAO.includes(e.tipo) && (
              <button className="btn btn-ghost" style={{ height: 34, color: 'var(--red)', width: '100%' }}
                onClick={() => removeLinha(i)}><Trash2 size={13} /></button>
            )}
          </div>

          <div className="form-group" style={{ margin: 0, gridColumn: '1 / 3' }}>
            <label className="form-label">Logradouro</label>
            <input className="form-input" value={e.logradouro || ''} disabled={isRO}
              onChange={(ev) => setLinha(i, { logradouro: ev.target.value.toUpperCase() })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Nº</label>
            <input className="form-input" value={e.numero || ''} disabled={isRO}
              onChange={(ev) => setLinha(i, { numero: ev.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Complemento</label>
            <input className="form-input" value={e.complemento || ''} disabled={isRO}
              onChange={(ev) => setLinha(i, { complemento: ev.target.value.toUpperCase() })} />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Bairro</label>
            <input className="form-input" value={e.bairro || ''} disabled={isRO}
              onChange={(ev) => setLinha(i, { bairro: ev.target.value.toUpperCase() })} />
          </div>
          <div className="form-group" style={{ margin: 0, gridColumn: '2 / 4' }}>
            <label className="form-label">Cidade</label>
            <InputCidade value={e.cidade || ''} disabled={isRO}
              onChange={(v) => {
                const uf = (String(v).match(/-\s*([A-Z]{2})\s*$/) || [])[1] || e.uf
                setLinha(i, { cidade: v, uf })
              }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t1)', alignSelf: 'end', paddingBottom: 8 }}>
            <input type="checkbox" checked={!!e.principal} disabled={isRO}
              onChange={(ev) => setForm((f) => ({
                ...f,
                enderecos: (f.enderecos || []).map((x, j) => ({ ...x, principal: j === i ? ev.target.checked : (ev.target.checked ? false : x.principal) })),
              }))} />
            Principal
          </label>
        </Secao>
      ))}

      {!isRO && (
        <div style={{ gridColumn: '1 / -1' }}>
          <button className="btn btn-ghost" style={{ height: 30, fontSize: 11.5 }} onClick={addLinha}>
            <Plus size={13} /> Adicionar outro endereço
          </button>
        </div>
      )}
    </FormGrid>
  )
}
