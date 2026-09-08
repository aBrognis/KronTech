import AbaFinanceiro from './AbaFinanceiro'
import AbaCredito from './AbaCredito'

// Aba unica "Financeiro" — junta dados bancarios/pagamento/PIX (AbaFinanceiro)
// com limite de credito, score de risco e historico (AbaCredito).
export default function AbaFinanceiroCredito(props) {
  return (
    <>
      <AbaFinanceiro {...props} />
      <AbaCredito {...props} />
    </>
  )
}
