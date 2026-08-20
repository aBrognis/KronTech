import { useState } from 'react'
import { Search, X } from 'lucide-react'
import PesquisaPadraoModal from './PesquisaPadraoModal'

// Campo de seleção via modal de Pesquisa Padrão: mostra o valor escolhido
// num input somente-leitura e abre a busca ao clicar na lupa. Usado onde a
// lista de opções pode crescer demais para um <select> simples.
export default function SeletorBusca({
  label, placeholder = 'Selecionar...', valorExibido, onLimpar, disabled = false,
  titulo, campos, colunasExibidas, campoInicial, mostrarFavorito, onBuscar, onSelecionar, renderCelula,
  height, // opcional: altura do input+lupa, pra bater com outros campos do mesmo painel (ex: filtros com height:32)
}) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="form-group" style={{ margin: 0 }}>
      {label && <label className="form-label">{label}</label>}
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            className="form-input"
            readOnly
            disabled={disabled}
            value={valorExibido || ''}
            placeholder={placeholder}
            style={{ cursor: 'default', paddingRight: valorExibido && onLimpar && !disabled ? 26 : undefined, ...(height ? { height } : null) }}
          />
          {valorExibido && onLimpar && !disabled && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onLimpar() }}
              title="Limpar"
              style={{
                position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 2,
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => setAberto(true)}
            title="Pesquisar..."
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: height || 36, flexShrink: 0, borderRadius: 8, border: '1px solid var(--bd)',
              background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer',
            }}
          >
            <Search size={14} />
          </button>
        )}
      </div>

      {aberto && (
        <PesquisaPadraoModal
          titulo={titulo}
          campos={campos}
          colunasExibidas={colunasExibidas}
          campoInicial={campoInicial}
          mostrarFavorito={mostrarFavorito}
          onBuscar={onBuscar}
          onSelecionar={r => { onSelecionar(r); setAberto(false) }}
          onFechar={() => setAberto(false)}
          renderCelula={renderCelula}
        />
      )}
    </div>
  )
}
