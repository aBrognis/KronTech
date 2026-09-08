import TelaCadastroPadrao, {
  FormGrid, Secao, CampoTexto, CampoNumero, CampoSelect, CampoCheck, CampoTextarea, CampoCodigo,
} from '../components/cadastroPadrao/TelaCadastroPadrao'
import GridFilho from '../components/cadastroPadrao/GridFilho'

const EMPTY = {
  id: null, codigo: '', descricao: '', tipo: 'prazo',
  base_prazo: 'emissao', dias_uteis: false, empurrar_dia_util: true, dia_fixo_mes: '',
  multa_percentual: 0, juros_mes_percentual: 0, desconto_percentual: 0, desconto_ate_dias: 0,
  acrescimo_parcelamento_percentual: 0, valor_minimo: 0, max_parcelas: '',
  papel_permitido: '', forma_padrao: '', observacoes: '', ativo: true,
  parcelas: [{ dias: 0, percentual: 100 }], formas: [],
}

const TIPOS = [{ valor: 'avista', label: 'À vista' }, { valor: 'prazo', label: 'A prazo' }]
const BASES = [
  { valor: 'emissao', label: 'Data de emissão' },
  { valor: 'entrega', label: 'Data de entrega' },
  { valor: 'aceite', label: 'Data de aceite' },
]
const PAPEIS = [
  { valor: '', label: 'Todos' },
  { valor: 'cliente', label: 'Somente clientes' },
  { valor: 'fornecedor', label: 'Somente fornecedores' },
]
const FORMAS = [
  { valor: 'boleto', label: 'Boleto' }, { valor: 'pix', label: 'PIX' },
  { valor: 'cartao', label: 'Cartão' }, { valor: 'transferencia', label: 'Transferência' },
  { valor: 'dinheiro', label: 'Dinheiro' }, { valor: 'cheque', label: 'Cheque' },
]
const somaPct = (parcelas) => (parcelas || []).reduce((s, p) => s + (Number(p.percentual) || 0), 0)

function ChipsFormas({ ctx }) {
  const { form, setForm, isRO } = ctx
  return (
    <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {FORMAS.map((f) => {
        const marcada = form.formas.includes(f.valor)
        return (
          <button key={f.valor} type="button" disabled={isRO}
            onClick={() => setForm((prev) => ({
              ...prev,
              formas: marcada ? prev.formas.filter((x) => x !== f.valor) : [...prev.formas, f.valor],
            }))}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: isRO ? 'default' : 'pointer',
              border: `1px solid ${marcada ? 'var(--or)' : 'var(--bd)'}`,
              background: marcada ? 'var(--or3)' : 'transparent',
              color: marcada ? 'var(--or)' : 'var(--t2)', fontWeight: marcada ? 700 : 500,
            }}>
            {f.label}
          </button>
        )
      })}
    </div>
  )
}

export default function CondicoesPagamento({ newTrigger }) {
  return (
    <TelaCadastroPadrao
      newTrigger={newTrigger}
      tituloSingular="condição de pagamento"
      buscaPlaceholder="descrição..."
      config={{
        api: window.api.condicaoPagamento,
        emptyForm: EMPTY,
        paraForm: (d) => ({
          ...EMPTY, ...d,
          descricao: d.descricao || '', tipo: d.tipo || 'prazo',
          base_prazo: d.base_prazo || 'emissao',
          dias_uteis: !!d.dias_uteis, empurrar_dia_util: d.empurrar_dia_util !== false,
          dia_fixo_mes: d.dia_fixo_mes ?? '',
          max_parcelas: d.max_parcelas ?? '',
          papel_permitido: d.papel_permitido || '', forma_padrao: d.forma_padrao || '',
          observacoes: d.observacoes || '', ativo: d.ativo !== false,
          parcelas: Array.isArray(d.parcelas) && d.parcelas.length ? d.parcelas.map((p) => ({ dias: p.dias, percentual: p.percentual })) : [{ dias: 0, percentual: 100 }],
          formas: Array.isArray(d.formas) ? d.formas : [],
        }),
        paraPayload: (f) => ({
          descricao: f.descricao, tipo: f.tipo, base_prazo: f.base_prazo,
          dias_uteis: f.dias_uteis, empurrar_dia_util: f.empurrar_dia_util,
          dia_fixo_mes: f.dia_fixo_mes === '' ? null : Number(f.dia_fixo_mes),
          multa_percentual: Number(f.multa_percentual) || 0,
          juros_mes_percentual: Number(f.juros_mes_percentual) || 0,
          desconto_percentual: Number(f.desconto_percentual) || 0,
          desconto_ate_dias: Number(f.desconto_ate_dias) || 0,
          acrescimo_parcelamento_percentual: Number(f.acrescimo_parcelamento_percentual) || 0,
          valor_minimo: Number(f.valor_minimo) || 0,
          max_parcelas: f.max_parcelas === '' ? null : Number(f.max_parcelas),
          papel_permitido: f.papel_permitido || null, forma_padrao: f.forma_padrao || null,
          observacoes: f.observacoes, ativo: f.ativo,
          parcelas: f.tipo === 'avista' ? [{ dias: 0, percentual: 100 }] : f.parcelas,
          formas: f.formas,
        }),
        validar: (f) => {
          if (!f.descricao.trim()) return 'Informe a descrição.'
          if (f.tipo === 'prazo') {
            if (!f.parcelas.length) return 'Adicione ao menos uma parcela.'
            const soma = somaPct(f.parcelas)
            if (Math.abs(soma - 100) > 0.01) return `A soma dos percentuais das parcelas deve ser 100% (está ${soma}%).`
          }
          return null
        },
      }}
      colunas={[
        { chave: 'codigo', label: 'Código', largura: 70 },
        { chave: 'descricao', label: 'Descrição' },
        { chave: 'tipo', label: 'Tipo', largura: 80, render: (r) => (r.tipo === 'avista' ? 'À vista' : 'A prazo') },
        { chave: 'qtd_parcelas', label: 'Parcelas', largura: 80, align: 'center', render: (r) => r.qtd_parcelas ?? 1 },
        { chave: 'formas', label: 'Formas', largura: 200, render: (r) => (Array.isArray(r.formas) ? r.formas : []).map((f) => FORMAS.find((x) => x.valor === f)?.label || f).join(', ') || '-' },
        { chave: 'ativo', label: 'Situação', largura: 100,
          render: (r) => <span className={`badge ${r.ativo ? 'badge-green' : 'badge-yellow'}`}>{r.ativo ? 'Ativo' : 'Inativo'}</span> },
      ]}
      statusEmMassa={{
        valores: [{ valor: true, label: 'Ativar' }, { valor: false, label: 'Inativar' }],
        aplicar: (ids, ativo) => window.api.condicaoPagamento.mudarAtivoLote({ ids, ativo }),
      }}
      renderForm={(ctx) => {
        const { form, setForm, isRO } = ctx
        return (
              <FormGrid>
                <Secao titulo="Identificação" cols="90px 1fr">
                  <CampoCodigo valor={form.codigo} />
                  <CampoTexto {...ctx} campo="descricao" label="Descrição" upper placeholder="30/60/90 DIAS" />
                  <CampoSelect {...ctx} campo="tipo" label="Tipo" opcoes={TIPOS} span="full" />
                  <CampoSelect {...ctx} campo="papel_permitido" label="Disponível para" opcoes={PAPEIS} span="full" />
                  <CampoSelect {...ctx} campo="forma_padrao" label="Forma padrão" opcoes={[{ valor: '', label: '(nenhuma)' }, ...FORMAS]} span="full" />
                </Secao>

                {form.tipo === 'prazo' && (
                  <Secao titulo="Cálculo do vencimento">
                    <CampoSelect {...ctx} campo="base_prazo" label="Contar prazo a partir de" opcoes={BASES} span="full" />
                    <CampoNumero {...ctx} campo="dia_fixo_mes" label="Fixar dia do mês" min="1" max="31" placeholder="—" span="full" />
                    <CampoCheck {...ctx} campo="dias_uteis" label="Contar em dias úteis" span="full" />
                    <CampoCheck {...ctx} campo="empurrar_dia_util" label="Empurrar p/ próximo dia útil" span="full" />
                  </Secao>
                )}

                <Secao titulo="Financeiro" largura="full" cols="repeat(4, minmax(0, 1fr))">
                  <CampoNumero {...ctx} campo="multa_percentual" label="Multa por atraso" sufixo="%" step="0.01" />
                  <CampoNumero {...ctx} campo="juros_mes_percentual" label="Juros ao mês" sufixo="%" step="0.01" />
                  <CampoNumero {...ctx} campo="acrescimo_parcelamento_percentual" label="Acréscimo p/ parcelar" sufixo="%" step="0.01" />
                  <CampoNumero {...ctx} campo="valor_minimo" label="Valor mínimo do pedido" sufixo="R$" step="0.01" />
                  <CampoNumero {...ctx} campo="desconto_percentual" label="Desconto antecipação" sufixo="%" step="0.01" />
                  <CampoNumero {...ctx} campo="desconto_ate_dias" label="Até quantos dias antes" sufixo="dias" />
                  <CampoNumero {...ctx} campo="max_parcelas" label="Máx. de parcelas" min="1" placeholder="sem limite" />
                </Secao>

                {form.tipo === 'prazo' && (
                  <Secao titulo="Parcelas (a soma dos percentuais deve ser 100%)" largura="full" cols="1fr">
                    <div>
                      <GridFilho
                        itens={form.parcelas} isRO={isRO} min={1}
                        onChange={(parcelas) => setForm((f) => ({ ...f, parcelas }))}
                        rotuloAdd="Adicionar parcela"
                        novoItem={() => ({ dias: 30, percentual: 0 })}
                        colunas={[
                          { chave: 'dias', label: 'Dias após a base', tipo: 'numero', largura: 180, align: 'right' },
                          { chave: 'percentual', label: '% do total', tipo: 'moeda', largura: 160, align: 'right' },
                        ]}
                      />
                      <div style={{ marginTop: 8, fontSize: 12, color: Math.abs(somaPct(form.parcelas) - 100) < 0.01 ? 'var(--green)' : 'var(--red)' }}>
                        Soma: <strong>{somaPct(form.parcelas)}%</strong> {Math.abs(somaPct(form.parcelas) - 100) < 0.01 ? '(ok)' : '(precisa ser 100%)'}
                      </div>
                    </div>
                  </Secao>
                )}

                <Secao titulo="Formas de pagamento aceitas" largura="full" cols="1fr">
                  <ChipsFormas ctx={ctx} />
                </Secao>

                <Secao titulo="Complemento" largura="full">
                  <CampoTextarea {...ctx} campo="observacoes" label="Observações" rows={2} />
                  <CampoCheck {...ctx} campo="ativo" label="Condição ativa" />
                </Secao>
              </FormGrid>
        )
      }}
    />
  )
}
