import { useState, useRef, useEffect } from 'react'
import { MapPin } from 'lucide-react'

// Campo de texto com autocomplete de municipios do Brasil (IBGE).
// Ao digitar "gas" sugere "GASPAR - SC"; ao escolher, grava "Gaspar - SC".
// O valor e string livre (compativel com o que ja era digitado a mao) —
// so ganha a lista de sugestoes.
export default function InputCidade({ value, onChange, disabled, placeholder = 'EX: GASPAR - SC', upper = true }) {
  const emitir = (v) => onChange(upper ? String(v).toUpperCase() : v)
  const [sugestoes, setSugestoes] = useState([])
  const [aberto, setAberto] = useState(false)
  const [idx, setIdx] = useState(-1)
  const wrapRef = useRef(null)
  const buscaRef = useRef(0)

  useEffect(() => {
    function fora(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setAberto(false) }
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [])

  async function buscar(termo) {
    const t = String(termo || '').trim()
    // se ja tem " - UF" no fim, o usuario provavelmente ja escolheu; nao busca
    if (t.length < 2 || /\s-\s[A-Z]{2}$/.test(t)) { setSugestoes([]); setAberto(false); return }
    const meu = ++buscaRef.current
    const res = await window.api.municipio.buscar(t)
    if (meu !== buscaRef.current) return
    const lista = res?.ok ? res.data || [] : []
    setSugestoes(lista)
    setIdx(-1)
    setAberto(lista.length > 0)
  }

  function escolher(m) {
    emitir(m.nome_uf)
    setAberto(false)
    setSugestoes([])
  }

  function onKeyDown(e) {
    if (!aberto || !sugestoes.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, sugestoes.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); escolher(sugestoes[idx]) }
    else if (e.key === 'Escape') { setAberto(false) }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        className="form-input"
        value={value || ''}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => { emitir(e.target.value); buscar(e.target.value) }}
        onFocus={(e) => { if (e.target.value) buscar(e.target.value) }}
        onKeyDown={onKeyDown}
      />
      {aberto && sugestoes.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 50,
          background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8,
          boxShadow: 'var(--sh-md)', maxHeight: 240, overflowY: 'auto', padding: 4,
        }}>
          {sugestoes.map((m, i) => (
            <button
              key={m.codigo_ibge}
              type="button"
              onMouseEnter={() => setIdx(i)}
              onClick={() => escolher(m)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                border: 'none', background: i === idx ? 'var(--s2)' : 'transparent',
                padding: '7px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, color: 'var(--t1)',
              }}>
              <MapPin size={12} color="var(--t3)" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{m.nome}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)' }}>{m.uf}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
