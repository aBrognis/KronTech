import { FormGrid, Secao } from '../../components/cadastroPadrao/TelaCadastroPadrao'
import GridFilho from '../../components/cadastroPadrao/GridFilho'
import { TIPO_MEIO } from './utils'

export default function AbaContatos({ form, setForm, isRO }) {
  return (
    <FormGrid>
      <Secao titulo="Pessoas de contato" largura="full" cols="1fr">
        <div>
          <GridFilho
            itens={form.contatos} isRO={isRO}
            onChange={(contatos) => setForm((f) => ({ ...f, contatos }))}
            rotuloAdd="Adicionar contato"
            novoItem={() => ({ nome: '', cargo: '', setor: '', telefone: '', celular: '', email: '', principal: false, ativo: true })}
            colunas={[
              { chave: 'principal', label: 'Princ.', largura: 55, tipo: 'check', align: 'center' },
              { chave: 'nome', label: 'Nome', upper: true },
              { chave: 'cargo', label: 'Cargo', largura: 150, upper: true },
              { chave: 'setor', label: 'Setor', largura: 140, upper: true },
              { chave: 'telefone', label: 'Telefone', largura: 130 },
              { chave: 'celular', label: 'Celular', largura: 130 },
              { chave: 'email', label: 'E-mail', largura: 220 },
            ]}
          />
        </div>
      </Secao>

      <Secao titulo="Outros meios de contato da entidade" largura="full" cols="1fr">
        <div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>
            Telefones, e-mails e WhatsApp adicionais que não pertencem a uma pessoa específica.
          </div>
          <GridFilho
            itens={(form.meios || []).filter((m) => !m.contato_id)}
            isRO={isRO}
            onChange={(novos) => setForm((f) => ({
              ...f,
              // preserva os meios ligados a contatos, substitui os "da entidade"
              meios: [...(f.meios || []).filter((m) => m.contato_id), ...novos],
            }))}
            rotuloAdd="Adicionar meio"
            novoItem={() => ({ tipo: 'telefone', valor: '', ramal: '', observacao: '', principal: false })}
            colunas={[
              { chave: 'principal', label: 'Princ.', largura: 55, tipo: 'check', align: 'center' },
              { chave: 'tipo', label: 'Tipo', largura: 120, tipo: 'select', opcoes: TIPO_MEIO },
              { chave: 'valor', label: 'Número / E-mail' },
              { chave: 'ramal', label: 'Ramal', largura: 80 },
              { chave: 'observacao', label: 'Observação', largura: 200 },
            ]}
          />
        </div>
      </Secao>
    </FormGrid>
  )
}
