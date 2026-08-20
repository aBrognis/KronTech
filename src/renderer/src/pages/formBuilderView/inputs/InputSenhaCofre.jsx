import PasswordVaultField, { calcularForcaSenha } from '../../../components/PasswordVaultField.jsx'

export function InputSenhaCofre({ campo, val, tela, isRO, saving, setField }) {
  const nomeCampoNivel = campo.nome_campo + '_nivel'
  const temCampoNivel  = !!tela?.campos?.find(c => c.nome_campo === nomeCampoNivel)

  function atualizar(novoVal) {
    setField(campo.nome_campo, novoVal)
    if (temCampoNivel) setField(nomeCampoNivel, calcularForcaSenha(novoVal).label)
  }

  return (
    <PasswordVaultField
      value={val}
      onChange={atualizar}
      disabled={isRO || saving}
      placeholder={campo.valor_padrao || 'Senha'}
    />
  )
}
