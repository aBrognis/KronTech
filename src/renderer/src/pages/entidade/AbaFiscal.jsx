import {
  FormGrid, Secao, CampoTexto, CampoSelect, CampoCheck,
} from '../../components/cadastroPadrao/TelaCadastroPadrao'
import { REGIMES } from './utils'

export default function AbaFiscal({ form, setForm, isRO, apoio }) {
  const optNaturezas = [
    { valor: '', label: '(não definida)' },
    ...apoio.naturezas.map((n) => ({ valor: n.id, label: `${n.codigo_receita || n.codigo} · ${n.descricao}` })),
  ]

  function aplicarNatureza(id) {
    setForm((f) => ({ ...f, natureza_juridica_id: id }))
    const nat = apoio.naturezas.find((n) => String(n.id) === String(id))
    if (nat) {
      setForm((f) => ({
        ...f,
        natureza_juridica_id: id,
        regime_tributario: f.regime_tributario || nat.regime_sugerido || '',
        contribuinte_icms: nat.contribuinte_icms_padrao,
      }))
    }
  }

  return (
    <FormGrid>
      <Secao titulo="Enquadramento" cols="minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)">
        <CampoSelect form={form} setForm={setForm} isRO={isRO} campo="natureza_juridica_id" label="Natureza jurídica"
          opcoes={optNaturezas} onChange={aplicarNatureza} />
        <CampoSelect form={form} setForm={setForm} isRO={isRO} campo="regime_tributario" label="Regime tributário" opcoes={REGIMES} />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="cnae" label="CNAE principal" placeholder="0000-0/00" />
      </Secao>

      <Secao titulo="Situação">
        <CampoCheck form={form} setForm={setForm} isRO={isRO} campo="contribuinte_icms" label="Contribuinte de ICMS" />
        <CampoCheck form={form} setForm={setForm} isRO={isRO} campo="optante_simples" label="Optante pelo Simples Nacional" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="situacao_cadastral" label="Situação cadastral (Receita)" span="full" />
      </Secao>

      <Secao titulo="Retenções na fonte (quando esta entidade presta serviço)" largura="full" cols="repeat(5, minmax(0, 1fr))">
        <CampoCheck form={form} setForm={setForm} isRO={isRO} campo="retem_iss" label="ISS" />
        <CampoCheck form={form} setForm={setForm} isRO={isRO} campo="retem_irrf" label="IRRF" />
        <CampoCheck form={form} setForm={setForm} isRO={isRO} campo="retem_csll" label="CSLL" />
        <CampoCheck form={form} setForm={setForm} isRO={isRO} campo="retem_pis" label="PIS" />
        <CampoCheck form={form} setForm={setForm} isRO={isRO} campo="retem_cofins" label="COFINS" />
      </Secao>
    </FormGrid>
  )
}
