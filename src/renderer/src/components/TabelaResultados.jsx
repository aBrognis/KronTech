import { useState, useMemo, useRef, useEffect } from 'react'
import { Columns3, Check } from 'lucide-react'

// Tabela da aba Acesso das telas nativas. O SQL da listagem traz TUDO
// (docs CLAUDE.md §4); esta tabela deixa o usuario escolher quais colunas
// ver, com a preferencia salva por tela em localStorage.
//
// props:
//   colunas: [{ chave, label, largura?, align?, padrao?, sticky?, render?(reg) }]
//     padrao: true  -> vem marcada na primeira vez (default: primeiras 6)
//     sticky: true  -> sempre visivel, nao entra no seletor (ex: codigo, nome)
//   registros: linhas da pagina atual
//   idKey: 'id'
//   prefKey: string unica por tela (ex: 'entidade') -> localStorage
//   selecao: { has(id), toggle(id), todos, toggleTodos }  (opcional)
//   onLinhaDuploClique(reg)  onLinhaMenu(e, id)  (opcional)
//   vazio: texto quando nao ha registros
export default function TabelaResultados({
  colunas, registros = [], idKey = 'id', prefKey,
  selecao, onLinhaDuploClique, onLinhaMenu,
  vazio = 'Nenhum registro encontrado',
}) {
  const sticky = colunas.filter((c) => c.sticky)
  const opcionais = colunas.filter((c) => !c.sticky)

  const chaveLS = `krontech.cols.${prefKey || 'tabela'}`
  const [visiveis, setVisiveis] = useState(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(chaveLS) || 'null')
      if (Array.isArray(salvo)) return new Set(salvo)
    } catch { /* ignore */ }
    // default: sticky + as marcadas como padrao (ou as 6 primeiras opcionais)
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

  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef(null)
  useEffect(() => {
    if (!menuAberto) return
    const fora = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAberto(false) }
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [menuAberto])

  const toggleCol = (chave) => setVisiveis((prev) => {
    const s = new Set(prev)
    s.has(chave) ? s.delete(chave) : s.add(chave)
    return s
  })

  const nColunas = colsMostradas.length + (selecao ? 1 : 0)

  return (
    <div style={{ border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden', background: 'var(--s1)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* barra: seletor de colunas */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '6px 10px', borderBottom: '1px solid var(--bd)', position: 'relative' }}>
        <button className="btn btn-ghost" style={{ height: 26, fontSize: 11, padding: '0 10px' }}
          onClick={() => setMenuAberto((a) => !a)}>
          <Columns3 size={13} /> Colunas ({colsMostradas.length})
        </button>
        {menuAberto && (
          <div ref={menuRef} style={{
            position: 'absolute', top: '100%', right: 10, zIndex: 40, marginTop: 4,
            minWidth: 220, maxHeight: 360, overflowY: 'auto',
            background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8, boxShadow: 'var(--sh-lg)',
            padding: '6px 0',
          }}>
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

      <div style={{ overflow: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              {selecao && (
                <Th style={{ width: 40, textAlign: 'center' }}>
                  <input type="checkbox" checked={selecao.todos} onChange={selecao.toggleTodos} style={{ cursor: 'pointer' }} />
                </Th>
              )}
              {colsMostradas.map((c) => (
                <Th key={c.chave} style={{ width: c.largura, textAlign: c.align || 'left' }}>{c.label}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {registros.map((r) => {
              const id = r[idKey]
              const marcado = selecao?.has(id)
              return (
                <tr key={id}
                  onDoubleClick={() => onLinhaDuploClique?.(r)}
                  onContextMenu={(e) => onLinhaMenu?.(e, id)}
                  style={{ cursor: onLinhaDuploClique ? 'pointer' : 'default', background: marcado ? 'var(--or4, var(--s2))' : 'transparent' }}
                  onMouseEnter={(e) => { if (!marcado) e.currentTarget.style.background = 'var(--s2)' }}
                  onMouseLeave={(e) => { if (!marcado) e.currentTarget.style.background = 'transparent' }}>
                  {selecao && (
                    <Td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={!!marcado} onChange={() => selecao.toggle(id)} style={{ cursor: 'pointer' }} />
                    </Td>
                  )}
                  {colsMostradas.map((c) => (
                    <Td key={c.chave} style={{ textAlign: c.align || 'left' }}>
                      {c.render ? c.render(r) : (r[c.chave] ?? '-')}
                    </Td>
                  ))}
                </tr>
              )
            })}
            {registros.length === 0 && (
              <tr><td colSpan={nColunas} style={{ textAlign: 'center', padding: 32, color: 'var(--t3)', fontSize: 11, fontStyle: 'italic' }}>{vazio}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children, style }) {
  return <th style={{ padding: '7px 12px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1.2, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)', background: 'var(--s1)', textAlign: 'left', whiteSpace: 'nowrap', ...style }}>{children}</th>
}
function Td({ children, style, onClick }) {
  return <td onClick={onClick} style={{ padding: '9px 12px', color: 'var(--t2)', borderBottom: '1px solid var(--bd)', fontSize: 12.5, whiteSpace: 'nowrap', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', ...style }}>{children}</td>
}
