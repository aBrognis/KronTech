import {
  FormGrid, Secao, CampoTexto, CampoSelect, CampoCodigo, CampoTextarea,
} from '../../components/cadastroPadrao/TelaCadastroPadrao'
import { STATUS } from './utils'

export default function AbaDados({ form, setForm, isRO }) {
  return (
    <FormGrid>
      <Secao titulo="Identificação" cols="90px minmax(0, 2fr) 160px">
        <CampoCodigo valor={form.codigo} />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="nome" label="Nome Completo" upper placeholder="MARIA DA SILVA" />
        <CampoSelect form={form} setForm={setForm} isRO={isRO} campo="status" label="Status"
          opcoes={STATUS.map((s) => ({ valor: s.valor, label: s.label }))} />
      </Secao>

      <Secao titulo="Contato" cols="minmax(0, 1.5fr) minmax(0, 1fr)">
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="email" label="E-mail" placeholder="usuario@empresa.com.br" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="telefone" label="Telefone / Ramal" />
      </Secao>

      <Secao titulo="Organização" cols="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.5fr)">
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="setor" label="Setor / Área" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="cargo" label="Cargo" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="foto" label="Foto (caminho do arquivo)" placeholder="C:\...\foto.png" />
      </Secao>

      <Secao titulo="Observações" largura="full">
        <CampoTextarea form={form} setForm={setForm} isRO={isRO} campo="observacoes" label="" rows={3}
          placeholder="Notas internas sobre este usuário..." />
      </Secao>
    </FormGrid>
  )
}
