import {
  FormGrid, Secao, CampoTexto, CampoNumero, CampoSelect,
} from '../../components/cadastroPadrao/TelaCadastroPadrao'
import { PIX_TIPOS } from './utils'

export default function AbaFinanceiro({ form, setForm, isRO, apoio }) {
  const optCondicoes = [{ valor: '', label: '(nenhuma)' }, ...apoio.condicoes.map((c) => ({ valor: c.id, label: `${c.codigo} · ${c.descricao}` }))]
  const optBancos = [{ valor: '', label: '(nenhum)' }, ...apoio.bancos.map((b) => ({ valor: b.id, label: `${b.compe || b.codigo} · ${b.nome_curto || b.nome}` }))]

  return (
    <FormGrid>
      <Secao titulo="Pagamento" cols="minmax(0, 2fr) minmax(0, 1fr)">
        <CampoSelect form={form} setForm={setForm} isRO={isRO} campo="condicao_pagamento_id" label="Condição de pagamento padrão" opcoes={optCondicoes} />
        <CampoNumero form={form} setForm={setForm} isRO={isRO} campo="dia_vencimento" label="Dia de vencimento" min="1" max="31" placeholder="—" />
      </Secao>

      <Secao titulo="Dados bancários" cols="minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)">
        <CampoSelect form={form} setForm={setForm} isRO={isRO} campo="banco_id" label="Banco" opcoes={optBancos} />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="agencia" label="Agência" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="conta_corrente" label="Conta corrente" />
      </Secao>

      <Secao titulo="PIX" cols="minmax(0, 1fr) minmax(0, 3fr)">
        <CampoSelect form={form} setForm={setForm} isRO={isRO} campo="pix_tipo" label="Tipo de chave" opcoes={PIX_TIPOS} />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="pix_chave" label="Chave PIX" />
      </Secao>
    </FormGrid>
  )
}
