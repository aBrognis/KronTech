import { useState } from 'react'
import { Search } from 'lucide-react'
import {
  FormGrid, Secao, CampoTexto, CampoSelect, CampoCodigo,
} from '../../components/cadastroPadrao/TelaCadastroPadrao'
import InputData from '../../components/InputData'
import SeletorEntidade from '../../components/SeletorEntidade'
import { notificar } from '../../components/Notificacao'
import { TIPOS_PESSOA, STATUS, PAPEIS, TIPO_ENDERECO, TIPO_VINCULO } from './utils'
import { aplicarCepNoPrincipal } from './enderecoHelpers'

export default function AbaDadosGerais({ form, setForm, isRO, apoio }) {
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const pj = form.tipo_pessoa === 'pj'

  async function buscarCnpj() {
    const digits = (form.cnpj || '').replace(/\D/g, '')
    if (digits.length !== 14) { notificar.aviso('Informe um CNPJ com 14 dígitos.'); return }
    setBuscandoCnpj(true)
    try {
      const res = await window.api.entidade.buscarCnpj(digits)
      if (!res.ok) { notificar.erro(res.erro); return }
      const d = res.data
      setForm((f) => {
        // aplica o endereco vindo do CNPJ no endereco "Principal" da grade
        const enderecos = aplicarCepNoPrincipal(f.enderecos, {
          cep: d.cep || '', logradouro: d.logradouro || '', numero: d.numero || '',
          complemento: d.complemento || '', bairro: d.bairro || '',
          cidade: d.municipio ? `${d.municipio}${d.uf ? ' - ' + d.uf : ''}` : '', uf: d.uf || '',
        })
        return {
          ...f,
          nome: d.razao_social || f.nome,
          apelido: d.nome_fantasia || f.apelido,
          inscricao_estadual: d.inscricao_estadual || f.inscricao_estadual,
          telefone: d.ddd_telefone_1 || f.telefone, celular: d.ddd_telefone_2 || f.celular,
          email: d.email || f.email,
          situacao_cadastral: (d.descricao_situacao_cadastral || '').slice(0, 120) || f.situacao_cadastral,
          cnae: (d.cnae_fiscal_codigo
            ? `${d.cnae_fiscal_codigo}${d.cnae_fiscal_descricao ? ' - ' + d.cnae_fiscal_descricao : ''}`
            : d.cnae_fiscal_descricao || f.cnae).slice(0, 120),
          porte: (d.porte || f.porte || '').slice(0, 80),
          enderecos,
        }
      })
      if (d.avisoIe) notificar.aviso(d.avisoIe)
      else if (d.naoContribuinte) notificar.info('Empresa não contribuinte de ICMS (sem Inscrição Estadual).')
    } finally {
      setBuscandoCnpj(false)
    }
  }

  function togglePapel(p) {
    setForm((f) => ({
      ...f,
      papeis: f.papeis.includes(p) ? f.papeis.filter((x) => x !== p) : [...f.papeis, p],
    }))
  }

  return (
    <FormGrid>
      <Secao titulo="Identificação" cols="90px minmax(0, 2fr) minmax(0, 1.5fr) 150px">
        <CampoCodigo valor={form.codigo} />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="nome" label="Nome / Razão Social" upper placeholder="EMPRESA EXEMPLO LTDA" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="apelido" label="Apelido / Nome Fantasia" upper />
        <CampoSelect form={form} setForm={setForm} isRO={isRO} campo="tipo_pessoa" label="Tipo" opcoes={TIPOS_PESSOA} />
      </Secao>

      <Secao titulo="Documentos" cols="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) 150px">
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">{pj ? 'CNPJ' : 'CPF'}</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input className="form-input" value={form.cnpj} disabled={isRO}
              onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
              placeholder={pj ? '00.000.000/0000-00' : '000.000.000-00'} />
            {pj && !isRO && (
              <button className="btn btn-ghost" style={{ flexShrink: 0, height: 34, padding: '0 10px' }}
                onClick={buscarCnpj} disabled={buscandoCnpj} title="Buscar dados do CNPJ">
                <Search size={13} /> {buscandoCnpj ? '...' : 'Buscar'}
              </button>
            )}
          </div>
        </div>
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="inscricao_estadual" label="Inscrição Estadual" upper />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="inscricao_municipal" label="Inscrição Municipal" upper />
        <CampoSelect form={form} setForm={setForm} isRO={isRO} campo="status" label="Status"
          opcoes={STATUS.map((s) => ({ valor: s.valor, label: s.label }))} />
      </Secao>

      <Secao titulo="Papéis">
        <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '10px 24px' }}>
          {PAPEIS.map((p) => {
            const on = form.papeis.includes(p.valor)
            return (
              <label key={p.valor}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5,
                  cursor: isRO ? 'default' : 'pointer', userSelect: 'none',
                  color: on ? 'var(--t1)' : 'var(--t2)', fontWeight: on ? 600 : 400,
                }}>
                <input type="checkbox" checked={on} disabled={isRO}
                  onChange={() => togglePapel(p.valor)}
                  style={{ width: 15, height: 15, cursor: isRO ? 'default' : 'pointer' }} />
                {p.label}
              </label>
            )
          })}
        </div>
      </Secao>

      <Secao titulo="Contato" cols="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.5fr) minmax(0, 1.5fr)">
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="telefone" label="Telefone" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="celular" label="Celular" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="email" label="E-mail" placeholder="contato@empresa.com.br" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="site" label="Site" placeholder="https://" />
      </Secao>

      <Secao titulo="Outros" cols="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)">
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">{pj ? 'Data de fundação' : 'Data de nascimento'}</label>
          <InputData value={pj ? form.data_fundacao : form.data_nascimento} disabled={isRO}
            onChange={(v) => setForm((f) => ({ ...f, [pj ? 'data_fundacao' : 'data_nascimento']: v }))} />
        </div>
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="porte" label="Porte" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="grupo_economico" label="Grupo econômico" upper />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="tags" label="Tags" placeholder="vírgula" />
        <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
          <label className="form-label">Observações</label>
          <textarea className="form-textarea" rows={2} value={form.observacoes} disabled={isRO}
            onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} />
        </div>
      </Secao>

      <Secao titulo="Vínculos com outras entidades" largura="full" cols="1fr">
        <div>
          {!isRO && (
            <button className="btn btn-ghost" style={{ height: 28, fontSize: 11, marginBottom: 8 }}
              onClick={() => setForm((f) => ({ ...f, vinculos: [...(f.vinculos || []), { tipo: 'matriz', entidade_rel_id: '', rel_nome: '', observacao: '' }] }))}>
              + Adicionar vínculo
            </button>
          )}
          {(form.vinculos || []).length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>Nenhum vínculo (matriz/filial, grupo econômico, representante...).</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(form.vinculos || []).map((v, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '190px 1fr 1fr 32px', gap: 10, alignItems: 'end' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Tipo</label>
                    <select className="form-select" value={v.tipo} disabled={isRO}
                      onChange={(e) => setForm((f) => ({ ...f, vinculos: f.vinculos.map((x, j) => j === i ? { ...x, tipo: e.target.value } : x) }))}>
                      {TIPO_VINCULO.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
                    </select>
                  </div>
                  <SeletorEntidade label="Entidade" value={v.rel_nome} disabled={isRO}
                    onClear={() => setForm((f) => ({ ...f, vinculos: f.vinculos.map((x, j) => j === i ? { ...x, entidade_rel_id: '', rel_nome: '' } : x) }))}
                    onSelect={(r) => setForm((f) => ({ ...f, vinculos: f.vinculos.map((x, j) => j === i ? { ...x, entidade_rel_id: String(r.id), rel_nome: r.nome } : x) }))}
                  />
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Observação</label>
                    <input className="form-input" value={v.observacao || ''} disabled={isRO}
                      onChange={(e) => setForm((f) => ({ ...f, vinculos: f.vinculos.map((x, j) => j === i ? { ...x, observacao: e.target.value } : x) }))} />
                  </div>
                  {!isRO && (
                    <button className="btn btn-ghost" style={{ height: 34, width: 32, padding: 0, color: 'var(--red)' }}
                      onClick={() => setForm((f) => ({ ...f, vinculos: f.vinculos.filter((_, j) => j !== i) }))}>×</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Secao>
    </FormGrid>
  )
}
