import { useState } from 'react'
import { DownloadCloud } from 'lucide-react'
import TelaCadastroPadrao, {
  FormGrid, Secao, CampoTexto, CampoSelect, CampoCheck, CampoTextarea, CampoCodigo,
} from '../components/cadastroPadrao/TelaCadastroPadrao'
import GridFilho from '../components/cadastroPadrao/GridFilho'
import { notificar } from '../components/Notificacao'

const EMPTY = {
  id: null, codigo: '', compe: '', ispb: '', nome: '', nome_curto: '', tipo: 'multiplo',
  site: '', telefone_sac: '', pais: 'Brasil', situacao_bacen: 'ativo', observacoes: '',
  ativo: true, agencias: [], convenios: [],
}

const TIPOS = [
  { valor: 'multiplo', label: 'Banco múltiplo' },
  { valor: 'comercial', label: 'Banco comercial' },
  { valor: 'cooperativa', label: 'Cooperativa de crédito' },
  { valor: 'digital', label: 'Banco digital' },
  { valor: 'fintech', label: 'Fintech / IP' },
  { valor: 'desenvolvimento', label: 'Banco de desenvolvimento' },
]
const SITUACOES = [
  { valor: 'ativo', label: 'Ativo' },
  { valor: 'em_liquidacao', label: 'Em liquidação' },
  { valor: 'extinto', label: 'Extinto' },
]
const CNAB = [{ valor: '240', label: 'CNAB 240' }, { valor: '400', label: 'CNAB 400' }]
const ACEITE = [{ valor: 'N', label: 'Não' }, { valor: 'A', label: 'Sim' }]
const rotuloTipo = (t) => TIPOS.find((x) => x.valor === t)?.label || t

// Filtros da aba Acesso, abrangente (docs CLAUDE.md §4).
const COLUNAS_FILTRO = [
  { chave: 'codigo', label: 'Código', tipo: 'texto' },
  { chave: 'compe', label: 'Compe', tipo: 'texto' },
  { chave: 'ispb', label: 'ISPB', tipo: 'texto' },
  { chave: 'nome', label: 'Nome', tipo: 'texto' },
  { chave: 'nome_curto', label: 'Nome curto', tipo: 'texto' },
  { chave: 'tipo', label: 'Tipo', tipo: 'exato', opcoes: TIPOS },
  { chave: 'situacao_bacen', label: 'Situação no BACEN', tipo: 'exato', opcoes: SITUACOES },
  { chave: 'pais', label: 'País', tipo: 'texto' },
  { chave: 'telefone_sac', label: 'Telefone / SAC', tipo: 'texto' },
  { chave: 'ativo', label: 'Ativo', tipo: 'booleano' },
  { chave: 'criado_em', label: 'Cadastrado em', tipo: 'data' },
]

export default function Bancos({ newTrigger }) {
  const [recarregar, setRecarregar] = useState(0)

  async function importar() {
    const r = await window.api.bancoImportarFebraban()
    if (r.ok) {
      notificar.sucesso(`${r.data.inseridos} banco(s) importado(s) da lista Febraban.`)
      setRecarregar((n) => n + 1)
    } else {
      notificar.erro(r.erro || 'Falha ao importar.')
    }
  }

  return (
    <TelaCadastroPadrao
      key={recarregar}
      newTrigger={newTrigger}
      tituloSingular="banco"
      buscaPlaceholder="nome, código Compe..."
      colunasFiltro={COLUNAS_FILTRO}
      config={{
        api: window.api.banco,
        emptyForm: EMPTY,
        paraForm: (d) => ({
          ...EMPTY, ...d,
          nome: d.nome || '', nome_curto: d.nome_curto || '', compe: d.compe || '',
          ispb: d.ispb || '', site: d.site || '', telefone_sac: d.telefone_sac || '',
          tipo: d.tipo || 'multiplo', situacao_bacen: d.situacao_bacen || 'ativo',
          pais: d.pais || 'Brasil', observacoes: d.observacoes || '',
          ativo: d.ativo !== false,
          agencias: Array.isArray(d.agencias) ? d.agencias : [],
          convenios: Array.isArray(d.convenios) ? d.convenios : [],
        }),
        paraPayload: (f) => ({
          compe: f.compe.trim(), ispb: f.ispb.trim(), nome: f.nome.trim(),
          nome_curto: f.nome_curto.trim(), tipo: f.tipo, site: f.site.trim(),
          telefone_sac: f.telefone_sac.trim(), pais: f.pais.trim(),
          situacao_bacen: f.situacao_bacen, observacoes: f.observacoes, ativo: f.ativo,
          agencias: f.agencias, convenios: f.convenios,
        }),
        validar: (f) => {
          if (!f.nome.trim()) return 'Informe o nome do banco.'
          if (f.compe && !/^\d{3}$/.test(f.compe.trim())) return 'Código Compe deve ter 3 dígitos.'
          return null
        },
      }}
      colunas={[
        { chave: 'codigo', label: 'Código', largura: 70 },
        { chave: 'compe', label: 'Compe', largura: 70 },
        { chave: 'nome', label: 'Nome' },
        { chave: 'tipo', label: 'Tipo', largura: 150, render: (r) => rotuloTipo(r.tipo) },
        { chave: 'qtd_agencias', label: 'Agências', largura: 80, align: 'center', render: (r) => r.qtd_agencias || 0 },
        { chave: 'qtd_convenios', label: 'Convênios', largura: 90, align: 'center', render: (r) => r.qtd_convenios || 0 },
        { chave: 'ativo', label: 'Situação', largura: 100,
          render: (r) => <span className={`badge ${r.ativo ? 'badge-green' : 'badge-yellow'}`}>{r.ativo ? 'Ativo' : 'Inativo'}</span> },
      ]}
      statusEmMassa={{
        valores: [{ valor: true, label: 'Ativar' }, { valor: false, label: 'Inativar' }],
        aplicar: (ids, ativo) => window.api.banco.mudarAtivoLote({ ids, ativo }),
      }}
      renderForm={(ctx) => (
        <FormGrid>
          <Secao titulo="Identificação" cols="90px 90px 1fr">
            <CampoCodigo valor={ctx.form.codigo} />
            <CampoTexto {...ctx} campo="compe" label="Compe" maxLength={3} placeholder="341" />
            <CampoTexto {...ctx} campo="ispb" label="ISPB" maxLength={8} placeholder="60701190" />
            <CampoTexto {...ctx} campo="nome" label="Nome (longo)" upper span="full" placeholder="BANCO ITAÚ UNIBANCO S.A." />
            <CampoTexto {...ctx} campo="nome_curto" label="Nome curto" span="full" placeholder="Itaú" />
            <CampoSelect {...ctx} campo="tipo" label="Tipo" opcoes={TIPOS} span="full" />
            <CampoSelect {...ctx} campo="situacao_bacen" label="Situação no BACEN" opcoes={SITUACOES} span="full" />
          </Secao>

          <Secao titulo="Contato">
            <CampoTexto {...ctx} campo="site" label="Site" span="full" placeholder="https://www.itau.com.br" />
            <CampoTexto {...ctx} campo="telefone_sac" label="Telefone / SAC" placeholder="4004-4828" />
            <CampoTexto {...ctx} campo="pais" label="País" />
            <CampoCheck {...ctx} campo="ativo" label="Banco ativo" span="full" />
          </Secao>

          <Secao titulo="Agências" largura="full" cols="1fr">
            <div>
              <GridFilho
                itens={ctx.form.agencias} isRO={ctx.isRO}
                onChange={(agencias) => ctx.setForm((f) => ({ ...f, agencias }))}
                rotuloAdd="Adicionar agência"
                colunas={[
                  { chave: 'numero', label: 'Nº', largura: 80 },
                  { chave: 'digito', label: 'DV', largura: 50, maxLength: 2 },
                  { chave: 'nome', label: 'Nome', upper: true },
                  { chave: 'cidade', label: 'Cidade', largura: 150, upper: true },
                  { chave: 'uf', label: 'UF', largura: 50, maxLength: 2, upper: true },
                  { chave: 'telefone', label: 'Telefone', largura: 130 },
                ]}
              />
            </div>
          </Secao>

          <Secao titulo="Convênios de cobrança (dados da conta da empresa para emitir boleto)" largura="full" cols="1fr">
            <div>
              <GridFilho
                itens={ctx.form.convenios} isRO={ctx.isRO}
                onChange={(convenios) => ctx.setForm((f) => ({ ...f, convenios }))}
                rotuloAdd="Adicionar convênio"
                colunas={[
                  { chave: 'descricao', label: 'Descrição', upper: true },
                  { chave: 'agencia', label: 'Agência', largura: 90 },
                  { chave: 'conta', label: 'Conta', largura: 110 },
                  { chave: 'numero_convenio', label: 'Convênio', largura: 110 },
                  { chave: 'carteira', label: 'Carteira', largura: 80 },
                  { chave: 'cnab', label: 'CNAB', largura: 100, tipo: 'select', opcoes: CNAB },
                  { chave: 'aceite', label: 'Aceite', largura: 90, tipo: 'select', opcoes: ACEITE },
                  { chave: 'multa_percentual', label: 'Multa %', largura: 80, tipo: 'moeda', align: 'right' },
                  { chave: 'juros_mes_percentual', label: 'Juros %/mês', largura: 100, tipo: 'moeda', align: 'right' },
                ]}
              />
            </div>
          </Secao>

          <Secao titulo="Complemento" largura="full">
            <CampoTextarea {...ctx} campo="observacoes" label="Observações" rows={2} />
            {!ctx.isRO && (
              <div style={{ gridColumn: '1 / -1' }}>
                <button className="btn btn-ghost" style={{ height: 30, fontSize: 11.5 }} onClick={importar}>
                  <DownloadCloud size={13} /> Importar lista Febraban
                </button>
              </div>
            )}
          </Secao>
        </FormGrid>
      )}
    />
  )
}
