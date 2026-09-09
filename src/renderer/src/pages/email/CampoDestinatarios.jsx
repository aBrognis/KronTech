import { useState, useRef, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

// Campo de destinatarios de e-mail estilo Gmail/Thunderbird:
//  - digita e aperta Enter / virgula / ponto-e-virgula / Tab (ou sai do campo)
//    -> o texto vira um "chip"
//  - Backspace com o input vazio remove o ultimo chip
//  - colar "a@x.com, b@y.com" vira varios chips de uma vez
//  - chip fica vermelho se o e-mail for invalido
//  - enquanto digita, sugere contatos (historico de e-mail + contatos de
//    Entidade) via window.api.email.sugerirContatos
//
// value: string "a@x.com, b@y.com" (mesmo formato que o backend ja espera)
// onChange(novaString)

export const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function paraLista(str) {
  return String(str || '')
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

// Devolve os endereços claramente malformados de uma string "a@x, b, c@y".
export function emailsInvalidos(str) {
  return paraLista(str).filter((e) => !RE_EMAIL.test(e))
}

export default function CampoDestinatarios({ value, onChange, placeholder, autoFocus }) {
  const chips = paraLista(value)
  const [rascunho, setRascunho] = useState('')
  const [sugestoes, setSugestoes] = useState([])
  const [aberto, setAberto] = useState(false)
  const [idx, setIdx] = useState(-1)
  const inputRef = useRef(null)
  const boxRef = useRef(null)
  const debounce = useRef(null)

  const setChips = useCallback(
    (lista) => onChange([...new Set(lista.map((e) => e.trim()).filter(Boolean))].join(', ')),
    [onChange]
  )

  function adicionar(texto) {
    const novos = paraLista(texto)
    if (!novos.length) return
    setChips([...chips, ...novos])
    setRascunho('')
    setSugestoes([])
    setAberto(false)
  }

  function commitRascunho() {
    if (rascunho.trim()) adicionar(rascunho)
  }

  function removerChip(i) {
    setChips(chips.filter((_, j) => j !== i))
    inputRef.current?.focus()
  }

  // ── autocomplete ──
  useEffect(() => {
    clearTimeout(debounce.current)
    const t = rascunho.trim()
    if (t.length < 1) { setSugestoes([]); setAberto(false); return }
    debounce.current = setTimeout(async () => {
      const r = await window.api.email.sugerirContatos(t, 8)
      const lista = (r.ok ? r.data : []).filter((s) => !chips.includes(s.email))
      setSugestoes(lista)
      setAberto(lista.length > 0)
      setIdx(-1)
    }, 160)
    return () => clearTimeout(debounce.current)
  }, [rascunho]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function fora(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setAberto(false)
        commitRascunho()
      }
    }
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }) // sem deps: precisa do rascunho/chips atuais no commit

  function onKeyDown(e) {
    if (aberto && sugestoes.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, sugestoes.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); adicionar(sugestoes[idx].email); return }
    }
    if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab') {
      if (rascunho.trim()) {
        e.preventDefault()
        adicionar(rascunho)
      }
    } else if (e.key === 'Backspace' && !rascunho && chips.length) {
      e.preventDefault()
      removerChip(chips.length - 1)
    }
  }

  function onPaste(e) {
    const txt = e.clipboardData.getData('text')
    if (/[,;\n]/.test(txt)) {
      e.preventDefault()
      adicionar(txt.replace(/\n/g, ','))
    }
  }

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <div
        className="form-input"
        onClick={() => inputRef.current?.focus()}
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center',
          minHeight: 34, height: 'auto', padding: '4px 6px', cursor: 'text',
        }}
      >
        {chips.map((email, i) => {
          const ok = RE_EMAIL.test(email)
          return (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 6px', borderRadius: 5, fontSize: 11.5, lineHeight: 1.4,
              background: ok ? 'var(--s2)' : 'rgba(248,113,113,.12)',
              border: `1px solid ${ok ? 'var(--bd)' : 'rgba(239,68,68,.5)'}`,
              color: ok ? 'var(--t1)' : 'var(--red)',
            }}>
              {email}
              <button type="button" onClick={(ev) => { ev.stopPropagation(); removerChip(i) }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, color: 'inherit' }}>
                <X size={11} />
              </button>
            </span>
          )
        })}
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={rascunho}
          onChange={(e) => setRascunho(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => { /* commit no clique-fora e no fechar */ }}
          placeholder={chips.length ? '' : (placeholder || 'digite e aperte Enter')}
          style={{
            flex: 1, minWidth: 120, border: 'none', outline: 'none',
            background: 'transparent', color: 'var(--t1)', fontSize: 12.5, padding: '2px 2px',
          }}
        />
      </div>

      {aberto && sugestoes.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 60,
          marginTop: 2, maxHeight: 240, overflowY: 'auto',
          background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8,
          boxShadow: 'var(--sh-lg)',
        }}>
          {sugestoes.map((s, i) => (
            <div key={s.email}
              onMouseDown={(e) => { e.preventDefault(); adicionar(s.email) }}
              onMouseEnter={() => setIdx(i)}
              style={{
                padding: '6px 10px', cursor: 'pointer', fontSize: 12,
                background: i === idx ? 'var(--or3)' : 'transparent',
                borderBottom: '1px solid var(--bd)',
              }}>
              <div style={{ color: 'var(--t1)', fontWeight: s.nome ? 600 : 400 }}>
                {s.nome || s.email}
              </div>
              {s.nome && <div style={{ color: 'var(--t3)', fontSize: 11 }}>{s.email}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
