// Bloco de campos com titulo + linha divisoria — padrao visual de secao
// dos formularios do KronTech.
//
// O titulo NAO tem fundo: e so o texto, e a linha comeca depois dele ate a
// borda. Herda a cor de fundo do sistema (claro/escuro) porque nada e
// pintado atras. Use dentro de um <FormBlocos> (grid de 2 colunas) ou
// solto num container flex-column.
//
//   <FormBlocos>
//     <SecaoForm titulo="Identificação">
//       <div className="form-group">...</div>
//       <div className="form-group">...</div>
//     </SecaoForm>
//     <SecaoForm titulo="Endereço" largura="full" cols="repeat(3,1fr)">
//       ...
//     </SecaoForm>
//   </FormBlocos>

// Container do formulario: flex column com o MESMO gap (10px) das telas
// manuais. Cada <SecaoForm> ocupa a largura toda; a distribuicao dos
// campos e feita pelo `cols` interno de cada secao.
export function FormBlocos({ children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
      {children}
    </div>
  )
}

// Espacamento vertical do divisor. Nas telas manuais o SecaoHeader e irmao
// dos form-groups num flex container com gap:10 — entao entre a linha e o
// 1o campo ha (margin-bottom do header) + (gap do container) = 8 + 10 = 18.
// O SecaoForm (telas novas) tem o header e os campos no MESMO div, sem esse
// gap extra — por isso o header dele leva margin-bottom 18 direto, pra dar
// o mesmo respiro.
export const DIV_TOPO = 14      // acima da linha
export const DIV_BASE_HEADER = 8   // abaixo da linha no SecaoHeader (some +10 do container)
export const DIV_BASE_FORM = 18    // abaixo da linha no SecaoForm (sem container extra)
export const DIV_MARGIN = `${DIV_TOPO}px 0 ${DIV_BASE_HEADER}px`

const rotuloStyle = { fontSize: 9.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap' }

// So o cabecalho da secao (titulo + linha), sem grid de campos. Pra telas
// que ja tem o layout de campos proprio (Arquivos, Cofre, Despesas,
// Documentos). Fica como irmao dos form-groups num flex container.
export function SecaoHeader({ titulo, style, semTopo }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: semTopo ? `0 0 ${DIV_BASE_HEADER}px` : DIV_MARGIN, ...style }}>
      <span style={rotuloStyle}>{titulo}</span>
      <span style={{ flex: 1, height: 1, background: 'var(--bd2)' }} />
    </div>
  )
}

export default function SecaoForm({ titulo, children, largura, cols, style }) {
  // largura mantida por compatibilidade; hoje toda secao ocupa a largura toda.
  return (
    <div style={{ ...style }}>
      {titulo != null && titulo !== '' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: `${DIV_TOPO}px 0 ${DIV_BASE_FORM}px` }}>
          <span style={rotuloStyle}>{titulo}</span>
          <span style={{ flex: 1, height: 1, background: 'var(--bd2)' }} />
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: cols || 'repeat(2, minmax(0, 1fr))', gap: '10px 14px', alignItems: 'start' }}>
        {children}
      </div>
    </div>
  )
}
