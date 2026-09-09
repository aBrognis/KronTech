import {
  FormGrid, Secao, CampoTexto, CampoSelect, CampoCodigo, CampoTextarea,
} from '../../components/cadastroPadrao/TelaCadastroPadrao'
import InputData from '../../components/InputData'
import SeletorBusca from '../../components/SeletorBusca'
import { STATUS } from './utils'

const CAMPOS_GESTOR = [
  { nome_campo: 'nome', label: 'Nome' },
  { nome_campo: 'cargo', label: 'Cargo' },
]

export default function AbaDados({ form, setForm, isRO }) {
  async function buscarGestores(campo, modo, busca) {
    const res = await window.api.usuario.listarParaGestor(form.id || 0)
    let lista = res.ok ? res.data : []
    if (busca) {
      const b = busca.toLowerCase()
      lista = lista.filter((c) =>
        modo === 'igual' ? (c[campo] || '').toLowerCase() === b
          : modo === 'iniciando' ? (c[campo] || '').toLowerCase().startsWith(b)
          : (c[campo] || '').toLowerCase().includes(b))
    }
    return { registros: lista, total: lista.length }
  }

  return (
    <FormGrid>
      <Secao titulo="Identificação" cols="90px minmax(0, 1.6fr) minmax(0, 1fr) 150px">
        <CampoCodigo valor={form.codigo} />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="nome" label="Nome Completo" upper placeholder="MARIA DA SILVA SANTOS" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="apelido" label="Como quer ser chamado(a)" placeholder="Maria" />
        <CampoSelect form={form} setForm={setForm} isRO={isRO} campo="status" label="Status"
          opcoes={STATUS.map((s) => ({ valor: s.valor, label: s.label }))} />
      </Secao>

      <Secao titulo="Documentos e matrícula" cols="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr)">
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="documento" label="CPF" placeholder="000.000.000-00" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="matricula" label="Matrícula" placeholder="Ex: 001042" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="foto" label="Foto (caminho do arquivo)" placeholder="C:\...\foto.png" />
      </Secao>

      <Secao titulo="Contato" cols="minmax(0, 1.6fr) minmax(0, 1fr) 110px minmax(0, 1fr)">
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="email" label="E-mail" placeholder="usuario@empresa.com.br" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="telefone" label="Telefone" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="ramal" label="Ramal" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="whatsapp" label="WhatsApp" />
      </Secao>

      <Secao titulo="Alocação e RH" cols="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)">
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="setor" label="Setor / Área" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="cargo" label="Cargo" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="centro_custo" label="Centro de custo" />
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Admissão</label>
          <InputData value={form.admissao} disabled={isRO}
            onChange={(v) => setForm((f) => ({ ...f, admissao: v }))} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Desligamento</label>
          <InputData value={form.desligamento} disabled={isRO}
            onChange={(v) => setForm((f) => ({ ...f, desligamento: v }))} />
        </div>
        <SeletorBusca
          label="Gestor imediato"
          placeholder="Nenhum"
          valorExibido={form.gestor_nome}
          disabled={isRO}
          onLimpar={() => setForm((f) => ({ ...f, gestor_id: '', gestor_nome: '' }))}
          titulo="Pesquisa Padrão · usuários"
          campos={CAMPOS_GESTOR}
          colunasExibidas={CAMPOS_GESTOR}
          campoInicial="nome"
          onBuscar={buscarGestores}
          onSelecionar={(r) => setForm((f) => ({ ...f, gestor_id: String(r.id), gestor_nome: r.nome }))}
        />
      </Secao>

      <Secao titulo="Observações" largura="full">
        <CampoTextarea form={form} setForm={setForm} isRO={isRO} campo="observacoes" label="" rows={3}
          placeholder="Notas internas sobre este usuário..." />
      </Secao>
    </FormGrid>
  )
}
