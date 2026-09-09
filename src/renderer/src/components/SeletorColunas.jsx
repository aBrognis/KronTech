import { useState, useMemo, useRef, useEffect } from 'react'
import { Columns3, Check } from 'lucide-react'

// Seletor de colunas visíveis da aba Acesso, compartilhado por
// TabelaResultados (telas nativas) e AbaAcesso do FormBuilder. A preferência
// fica salva por tela em localStorage.
//
// useSeletorColunas(colunas, prefKey):
//   colunas: [{ chave, label, sticky?, padrao? }]
//     sticky: sempre visível, não entra no seletor
//     padrao: marcada na primeira vez (default: as 6 primeiras opcionais)
//   -> { colsMostradas, visiveis, setVisiveis, toggleCol, opcionais }
export function useSeletorColunas(colunas, prefKey) {
  const sticky = useMemo(() => colunas.filter((c) => c.sticky), [colunas])
  const opcionais = useMemo(() => colunas.filter((c) => !c.sticky), [colunas])

  const chaveLS = `krontech.cols.${prefKey || 'tabela'}`
  const [visiveis, setVisiveis] = useState(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(chaveLS) || 'null')
      if (Array.isArray(salvo)) return new Set(salvo)
    } catch { /* ignore */ }
    const padrao = opcionais.filter((c) => c.padrao)
    const base = padrao.length ? padrao : opcionais.slice(0, 6)
    return new Set(base.map((c) => c.chave))
  })

  useEffect(() => {
    try { localStorage.setItem(chaveLS, JSON.stringify([...visiveis])) } catch { /* ignore */ }
  }, [visiveis, chaveLS])

  const colsMostradas = useMemo(
    () => [...sticky, ...opcionais.filter((c) => visiveis.has(c.chave))],
    [sticky, opcionais, visiveis]
  )

  const toggleCol = (chave) => setVisiveis((prev) => {
    const s = new Set(prev)
    s.has(chave) ? s.delete(chave) : s.add(chave)
    return s
  })

  return { colsMostradas, visiveis, setVisiveis, toggleCol, opcionais }
}

// Botão "Colunas (N)" + dropdown com Marcar/Desmarcar todas. Recebe o
// retorno do hook.
export function BotaoSeletorColunas({ colsMostradas, visiveis, setVisiveis, toggleCol, opcionais, alinhar = 'right' }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!aberto) return
    const fora = (e) => { if (ref.current && !ref.current.contains(e.target)) setAberto(false) }
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [aberto])

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button className="btn btn-ghost" style={{ height: 30, fontSize: 11, padding: '0 10px' }}
        onClick={() => setAberto((a) => !a)}>
        <Columns3 size={13} /> Colunas ({colsMostradas.length})
      </button>
      {aberto && (
        <div ref={ref} style={{
          position: 'absolute', top: '100%', [alinhar]: 0, zIndex: 40, marginTop: 4,
          minWidth: 240, maxHeight: 380, overflowY: 'auto',
          background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8, boxShadow: 'var(--sh-lg)',
          padding: '4px 0',
        }}>
          <div style={{ display: 'flex', gap: 6, padding: '4px 12px 6px', borderBottom: '1px solid var(--bd)' }}>
            <button className="btn btn-ghost" style={{ height: 22, fontSize: 10.5, padding: '0 8px', flex: 1 }}
              onClick={() => setVisiveis(new Set(opcionais.map((c) => c.chave)))}>
              Marcar todas
            </button>
            <button className="btn btn-ghost" style={{ height: 22, fontSize: 10.5, padding: '0 8px', flex: 1 }}
              onClick={() => setVisiveis(new Set())}>
              Desmarcar todas
            </button>
          </div>
          {opcionais.map((c) => (
            <label key={c.chave} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px',
              fontSize: 12, cursor: 'pointer', color: 'var(--t1)',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ width: 13, display: 'inline-flex' }}>
                {visiveis.has(c.chave) && <Check size={13} color="var(--or)" />}
              </span>
              <input type="checkbox" checked={visiveis.has(c.chave)} onChange={() => toggleCol(c.chave)} style={{ display: 'none' }} />
              {c.label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
