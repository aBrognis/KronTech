import AbaAnexos from './AbaAnexos'
import AbaHistorico from './AbaHistorico'

// Aba unica "Documentos" — anexos da entidade (AbaAnexos) + documentos com
// validade e trilha de auditoria (AbaHistorico).
export default function AbaDocumentos(props) {
  return (
    <>
      <AbaAnexos {...props} />
      <AbaHistorico {...props} />
    </>
  )
}
