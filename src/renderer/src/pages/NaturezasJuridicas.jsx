import TelaCadastroPadrao, {
  FormGrid, Secao, CampoTexto, CampoSelect, CampoCheck, CampoTextarea, CampoCodigo,
} from '../components/cadastroPadrao/TelaCadastroPadrao'

const EMPTY = {
  id: null, codigo: '', codigo_receita: '', descricao: '', grupo: 'empresarial',
  tipo_pessoa: 'pj', exige_ie: true, contribuinte_icms_padrao: true,
  regime_sugerido: '', base_legal: '', observacoes: '', ativo: true,
}

const GRUPOS = [
  { valor: 'empresarial', label: 'Empresarial' },
  { valor: 'simples', label: 'Simples / Individual' },
  { valor: 'sem_fins', label: 'Sem fins lucrativos' },
  { valor: 'publico', label: 'Administração pública' },
  { valor: 'rural', label: 'Rural' },
]
const TIPOS_PESSOA = [
  { valor: 'pj', label: 'Pessoa Jurídica' },
  { valor: 'pf', label: 'Pessoa Física' },
  { valor: 'ambos', label: 'Ambos' },
]
const REGIMES = [
  { valor: '', label: '(não sugerir)' },
  { valor: 'mei', label: 'MEI' },
  { valor: 'simples', label: 'Simples Nacional' },
  { valor: 'presumido', label: 'Lucro Presumido' },
  { valor: 'real', label: 'Lucro Real' },
]
const rotuloGrupo = (g) => GRUPOS.find((x) => x.valor === g)?.label || g || '-'

// Filtros da aba Acesso — abrangente (docs CLAUDE.md §4): toda coluna
// consultavel da tabela vira um filtro tipado.
const COLUNAS_FILTRO = [
  { chave: 'codigo', label: 'Código', tipo: 'texto' },
  { chave: 'codigo_receita', label: 'Cód. Receita', tipo: 'texto' },
  { chave: 'descricao', label: 'Descrição', tipo: 'texto' },
  { chave: 'grupo', label: 'Grupo', tipo: 'exato', opcoes: GRUPOS },
  { chave: 'tipo_pessoa', label: 'Tipo de pessoa', tipo: 'exato', opcoes: TIPOS_PESSOA },
  { chave: 'regime_sugerido', label: 'Regime sugerido', tipo: 'exato', opcoes: REGIMES.filter((r) => r.valor) },
  { chave: 'exige_ie', label: 'Exige IE', tipo: 'booleano' },
  { chave: 'contribuinte_icms_padrao', label: 'Contribuinte ICMS', tipo: 'booleano' },
  { chave: 'ativo', label: 'Ativo', tipo: 'booleano' },
  { chave: 'criado_em', label: 'Criado em', tipo: 'data' },
]

export default function NaturezasJuridicas({ newTrigger }) {
  return (
    <TelaCadastroPadrao
      newTrigger={newTrigger}
      tituloSingular="natureza jurídica"
      buscaPlaceholder="descrição, código Receita..."
      colunasFiltro={COLUNAS_FILTRO}
      config={{
        api: window.api.naturezaJuridica,
        emptyForm: EMPTY,
        paraForm: (d) => ({
          id: d.id, codigo: d.codigo || '', codigo_receita: d.codigo_receita || '',
          descricao: d.descricao || '', grupo: d.grupo || 'empresarial',
          tipo_pessoa: d.tipo_pessoa || 'pj',
          exige_ie: d.exige_ie !== false,
          contribuinte_icms_padrao: d.contribuinte_icms_padrao !== false,
          regime_sugerido: d.regime_sugerido || '',
          base_legal: d.base_legal || '', observacoes: d.observacoes || '',
          ativo: d.ativo !== false,
        }),
        paraPayload: (f) => ({
          codigo_receita: f.codigo_receita, descricao: f.descricao, grupo: f.grupo,
          tipo_pessoa: f.tipo_pessoa, exige_ie: f.exige_ie,
          contribuinte_icms_padrao: f.contribuinte_icms_padrao,
          regime_sugerido: f.regime_sugerido || null,
          base_legal: f.base_legal, observacoes: f.observacoes, ativo: f.ativo,
        }),
        validar: (f) => (!f.descricao.trim() ? 'Informe a descrição.' : null),
      }}
      colunas={[
        { chave: 'codigo', label: 'Código', largura: 70 },
        { chave: 'codigo_receita', label: 'Cód. Receita', largura: 100 },
        { chave: 'descricao', label: 'Descrição' },
        { chave: 'grupo', label: 'Grupo', largura: 150, render: (r) => rotuloGrupo(r.grupo) },
        { chave: 'exige_ie', label: 'Exige IE', largura: 90, align: 'center', render: (r) => (r.exige_ie ? 'Sim' : 'Não') },
        { chave: 'ativo', label: 'Situação', largura: 100,
          render: (r) => <span className={`badge ${r.ativo ? 'badge-green' : 'badge-yellow'}`}>{r.ativo ? 'Ativo' : 'Inativo'}</span> },
      ]}
      statusEmMassa={{
        valores: [{ valor: true, label: 'Ativar' }, { valor: false, label: 'Inativar' }],
        aplicar: (ids, ativo) => window.api.naturezaJuridica.mudarAtivoLote({ ids, ativo }),
      }}
      renderForm={(ctx) => (
        <FormGrid>
          <Secao titulo="Identificação" largura="full" cols="90px 110px minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)">
            <CampoCodigo valor={ctx.form.codigo} />
            <CampoTexto {...ctx} campo="codigo_receita" label="Cód. Receita" maxLength={10} placeholder="206-2" />
            <CampoTexto {...ctx} campo="descricao" label="Descrição" upper placeholder="SOCIEDADE EMPRESÁRIA LIMITADA" />
            <CampoSelect {...ctx} campo="grupo" label="Grupo" opcoes={GRUPOS} />
            <CampoSelect {...ctx} campo="tipo_pessoa" label="Tipo de pessoa" opcoes={TIPOS_PESSOA} />
          </Secao>

          <Secao titulo="Fiscal — pré-preenche a Entidade" cols="minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr)">
            <CampoSelect {...ctx} campo="regime_sugerido" label="Regime tributário sugerido" opcoes={REGIMES} />
            <CampoCheck {...ctx} campo="exige_ie" label="Exige Inscrição Estadual" />
            <CampoCheck {...ctx} campo="contribuinte_icms_padrao" label="Contribuinte de ICMS" />
          </Secao>

          <Secao titulo="Complemento" cols="minmax(0, 2fr) minmax(0, 1fr)">
            <CampoTexto {...ctx} campo="base_legal" label="Base legal" placeholder="Ex: Art. 1.052 do Código Civil" />
            <CampoCheck {...ctx} campo="ativo" label="Registro ativo" />
          </Secao>

          <Secao titulo="Observações" largura="full">
            <CampoTextarea {...ctx} campo="observacoes" label="" rows={3} placeholder="Notas de uso desta natureza jurídica..." />
          </Secao>
        </FormGrid>
      )}
    />
  )
}
