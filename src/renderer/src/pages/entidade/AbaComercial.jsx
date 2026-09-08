import { FormGrid, Secao, CampoTexto, CampoNumero, CampoSelect } from '../../components/cadastroPadrao/TelaCadastroPadrao'
import SeletorEntidade from '../../components/SeletorEntidade'
import { FRETE } from './utils'

// helpers pra editar o objeto 1:1 form.comercial
const useCom = (form, setForm) => {
  const com = form.comercial || {}
  const set = (patch) => setForm((f) => ({ ...f, comercial: { ...(f.comercial || {}), ...patch } }))
  return [com, set]
}

export default function AbaComercial({ form, setForm, isRO }) {
  const [com, set] = useCom(form, setForm)
  // adaptador pros helpers de campo, que esperam form/setForm/campo
  const c = {
    form: com, isRO,
    setForm: (updater) => set(typeof updater === 'function' ? updater(com) : updater),
  }

  return (
    <FormGrid>
      <Secao titulo="Responsáveis" cols="1fr 1fr">
        <SeletorEntidade
          label="Vendedor responsável"
          papel="funcionario"
          value={com.vendedor_nome}
          disabled={isRO}
          onClear={() => set({ vendedor_id: '', vendedor_nome: '' })}
          onSelect={(r) => set({ vendedor_id: String(r.id), vendedor_nome: r.nome })}
        />
        <SeletorEntidade
          label="Comprador responsável"
          papel="funcionario"
          value={com.comprador_nome}
          disabled={isRO}
          onClear={() => set({ comprador_id: '', comprador_nome: '' })}
          onSelect={(r) => set({ comprador_id: String(r.id), comprador_nome: r.nome })}
        />
      </Secao>

      <Secao titulo="Condições comerciais" cols="minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr)">
        <CampoTexto {...c} campo="tabela_preco" label="Tabela de preço" upper />
        <CampoNumero {...c} campo="desconto_maximo_perc" label="Desconto máximo" sufixo="%" step="0.01" />
        <CampoNumero {...c} campo="pedido_minimo" label="Pedido mínimo" sufixo="R$" step="0.01" />
      </Secao>

      <Secao titulo="Entrega" cols="minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr)">
        <SeletorEntidade
          label="Transportadora padrão"
          papel="transportadora"
          value={com.transportadora_nome}
          disabled={isRO}
          onClear={() => set({ transportadora_id: '', transportadora_nome: '' })}
          onSelect={(r) => set({ transportadora_id: String(r.id), transportadora_nome: r.nome })}
        />
        <CampoSelect {...c} campo="frete_padrao" label="Frete padrão" opcoes={FRETE} />
        <CampoNumero {...c} campo="prazo_entrega_dias" label="Prazo de entrega" sufixo="dias" />
      </Secao>

      <Secao titulo="Área de atuação" cols="1fr 1fr">
        <CampoTexto {...c} campo="regiao" label="Região" upper />
        <CampoTexto {...c} campo="rota_entrega" label="Rota de entrega" upper />
      </Secao>

      <Secao titulo="Observações" largura="full" cols="1fr">
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Observação comercial</label>
          <textarea className="form-textarea" rows={2} value={com.observacao_comercial || ''} disabled={isRO}
            onChange={(e) => set({ observacao_comercial: e.target.value })} />
        </div>
      </Secao>
    </FormGrid>
  )
}
