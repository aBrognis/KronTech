import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Save, Pencil, FolderPlus } from 'lucide-react'

// Paleta curada em vez de seletor de cor livre — evita combinações
// ilegíveis (texto claro sobre cor clara etc.) e mantém consistência
// visual entre etiquetas, mesmo padrão de chips do Notion/Gmail.
const PALETA = [
  '#f87171', '#fb923c', '#fbbf24', '#4ade80', '#34d399',
  '#22d3ee', '#60a5fa', '#818cf8', '#c084fc', '#f472b6', '#94a3b8',
]

// Monta árvore a partir da lista plana (parent_id) — profundidade livre.
function montarArvore(etiquetas, parentId = null) {
  return etiquetas
    .filter(e => e.parent_id === parentId)
    .map(e => ({ ...e, filhos: montarArvore(etiquetas, e.id) }))
}

// IDs da subárvore de uma etiqueta (incluindo ela mesma) — usado pra
// impedir escolher a si mesma ou um descendente como pai (ciclo).
function idsDaSubarvore(etiquetas, raizId) {
  const ids = new Set([raizId])
  let cresceu = true
  while (cresceu) {
    cresceu = false
    for (const e of etiquetas) {
      if (e.parent_id != null && ids.has(e.parent_id) && !ids.has(e.id)) {
        ids.add(e.id)
        cresceu = true
      }
    }
  }
  return ids
}

export default function EtiquetaFormModal({ onFechar, onAlterado }) {
  const [etiquetas, setEtiquetas] = useState([])
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState(PALETA[0])
  const [parentId, setParentId] = useState(null)
  const [editandoId, setEditandoId] = useState(null)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    const res = await window.api.email.listarEtiquetas()
    setEtiquetas(res.ok ? res.data || [] : [])
  }

  useEffect(() => { carregar() }, [])

  function editar(etq) {
    setEditandoId(etq.id)
    setNome(etq.nome)
    setCor(etq.cor)
    setParentId(etq.parent_id)
    setErro(null)
  }

  function novaSubetiqueta(paiId) {
    limparForm()
    setParentId(paiId)
  }

  function limparForm() {
    setEditandoId(null)
    setNome('')
    setCor(PALETA[0])
    setParentId(null)
    setErro(null)
  }

  async function salvar() {
    if (!nome.trim()) { setErro('Digite um nome para a etiqueta.'); return }
    setSalvando(true)
    setErro(null)
    try {
      const res = editandoId
        ? await window.api.email.atualizarEtiqueta(editandoId, { nome: nome.trim(), cor, parentId })
        : await window.api.email.criarEtiqueta({ nome: nome.trim(), cor, parentId })
      if (!res.ok) { setErro(res.erro); return }
      limparForm()
      await carregar()
      onAlterado?.()
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(etq) {
    setErro(null)
    const res = await window.api.email.excluirEtiqueta(etq.id)
    if (!res.ok) { setErro(res.erro); return }
    if (editandoId === etq.id) limparForm()
    await carregar()
    onAlterado?.()
  }

  // Ao editar, o próprio nó e seus descendentes ficam fora das opções de
  // pai (evita ciclo: uma pasta não pode virar filha da sua subpasta).
  const idsBloqueados = editandoId ? idsDaSubarvore(etiquetas, editandoId) : new Set()
  const opcoesPai = etiquetas.filter(e => !idsBloqueados.has(e.id))
  const arvore = montarArvore(etiquetas)

  function renderNo(no, nivel) {
    return (
      <div key={no.id}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', paddingLeft: 10 + nivel * 18, borderRadius: 8, background: 'var(--s2)', marginBottom: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: no.cor, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 12.5, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{no.nome}</span>
          <button className="btn btn-ghost" style={{ height: 24, width: 24, padding: 0 }} onClick={() => novaSubetiqueta(no.id)} title="Nova subetiqueta">
            <FolderPlus size={12} />
          </button>
          <button className="btn btn-ghost" style={{ height: 24, width: 24, padding: 0 }} onClick={() => editar(no)} title="Editar">
            <Pencil size={12} />
          </button>
          <button className="btn btn-ghost" style={{ height: 24, width: 24, padding: 0, color: 'var(--red)' }} onClick={() => excluir(no)} title="Excluir">
            <Trash2 size={12} />
          </button>
        </div>
        {no.filhos.map(f => renderNo(f, nivel + 1))}
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}>
      <div style={{ width: 440, maxHeight: '85vh', overflowY: 'auto', background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Gerenciar etiquetas</span>
          <button className="btn btn-ghost" style={{ height: 28, width: 28, padding: 0 }} onClick={onFechar}><X size={14} /></button>
        </div>

        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {erro && (
            <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(239,68,68,.4)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--red)' }}>
              {erro}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {arvore.map(no => renderNo(no, 0))}
            {!etiquetas.length && (
              <div style={{ padding: '14px 0', textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>Nenhuma etiqueta criada.</div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{editandoId ? 'Editar etiqueta' : 'Nova etiqueta'}</label>
              <input className="form-input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Negociação" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Etiqueta-pai</label>
              <select className="form-select" value={parentId ?? ''} onChange={e => setParentId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Nenhuma (etiqueta raiz)</option>
                {opcoesPai.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PALETA.map(c => (
                <button
                  key={c}
                  onClick={() => setCor(c)}
                  style={{
                    width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: cor === c ? '2px solid var(--t1)' : '2px solid transparent', padding: 0,
                  }}
                  title={c}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {(editandoId || parentId) && <button className="btn btn-ghost" onClick={limparForm}>Cancelar</button>}
              <button className="btn btn-primary" onClick={salvar} disabled={salvando}>
                {editandoId ? <Save size={13} /> : <Plus size={13} />} {editandoId ? 'Salvar' : 'Criar etiqueta'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
