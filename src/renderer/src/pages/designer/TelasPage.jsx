import { useState, useEffect, useCallback } from 'react'
import {
  LayoutGrid, Plus, Search, Edit2, Trash2, Power, PowerOff,
  Database, RefreshCw, FolderOpen,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import FormBuilderModal from '../FormBuilderModal'

function TilaIcon({ nome, size = 15, cor = 'var(--or)' }) {
  const key  = (nome || 'layout').split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  const Icon = LucideIcons[key] || LayoutGrid
  return <Icon size={size} color={cor} />
}

function notifyTelasUpdated() {
  window.dispatchEvent(new CustomEvent('krontech:telas-updated'))
}

export default function TelasPage() {
  const [telas,        setTelas]        = useState([])
  const [modulos,      setModulos]      = useState([])
  const [busca,        setBusca]        = useState('')
  const [carregando,   setCarregando]   = useState(false)
  const [modalAberto,  setModalAberto]  = useState(false)
  const [telaEditando, setTelaEditando] = useState(null)
  const [erro,         setErro]         = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true); setErro(null)
    try {
      const [t, m] = await Promise.all([
        window.api.formBuilder.listarTelas(),
        window.api.formBuilder.listarModulos(),
      ])
      setTelas(t); setModulos(m)
    } catch (e) { setErro(e.message) }
    finally     { setCarregando(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const telasFiltradas = telas.filter(t =>
    t.nome_tela.toLowerCase().includes(busca.toLowerCase()) ||
    t.nome_tabela.toLowerCase().includes(busca.toLowerCase()) ||
    (t.modulo_nome || '').toLowerCase().includes(busca.toLowerCase())
  )

  async function handleToggleAtivo(tela) {
    const acao = tela.ativo ? 'Inativar' : 'Reativar'
    if (!confirm(`${acao} a tela "${tela.nome_tela}"?`)) return
    try {
      if (tela.ativo) await window.api.formBuilder.inativarTela(tela.id)
      else            await window.api.formBuilder.reativarTela(tela.id)
      await carregar()
      notifyTelasUpdated()
    } catch (e) { alert('Erro: ' + e.message) }
  }

  async function handleExcluir(tela) {
    if (!confirm(`ATENÇÃO: Isso vai EXCLUIR a tabela "${tela.nome_tabela}" e TODOS os dados.\n\nDeseja continuar?`)) return
    try {
      await window.api.formBuilder.excluirTela(tela.id)
      await carregar()
      notifyTelasUpdated()
    } catch (e) { alert('Erro: ' + e.message) }
  }

  async function abrirEditar(tela) {
    try {
      const completa = await window.api.formBuilder.buscarTela(tela.id)
      setTelaEditando(completa); setModalAberto(true)
    } catch (e) { alert('Erro ao carregar tela: ' + e.message) }
  }

  async function handleSalvar() {
    setModalAberto(false); setTelaEditando(null)
    await carregar()
    notifyTelasUpdated()
  }

  if (modalAberto) return (
    <FormBuilderModal
      inline
      tela={telaEditando}
      modulos={modulos}
      onSalvar={handleSalvar}
      onFechar={() => { setModalAberto(false); setTelaEditando(null) }}
    />
  )

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflow: 'auto' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--s2)', border: '1px solid var(--bd)',
          borderRadius: 10, padding: '0 12px',
          flex: 1, maxWidth: 400, height: 36,
          boxShadow: 'var(--sh-xs)',
        }}>
          <Search size={13} color="var(--t3)" style={{ flexShrink: 0 }} />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, tabela ou módulo..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: 'var(--t1)', width: '100%', fontFamily: 'var(--fb)' }}
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 0, display: 'flex', alignItems: 'center' }}
            >
              <svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
              </svg>
            </button>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--t3)', flexShrink: 0 }}>
          {telasFiltradas.length} tela{telasFiltradas.length !== 1 ? 's' : ''}
        </span>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost" onClick={carregar} title="Atualizar">
          <RefreshCw size={13} style={{ animation: carregando ? 'spin 1s linear infinite' : 'none' }} />
        </button>
        <button className="btn btn-primary" onClick={() => { setTelaEditando(null); setModalAberto(true) }}>
          <Plus size={13} /> Nova Tela
        </button>
      </div>

      {/* Erro */}
      {erro && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)',
          color: 'var(--red)', borderRadius: 9, padding: '10px 14px', fontSize: 12,
        }}>
          <span>{erro}</span>
          <button onClick={() => setErro(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}>✕</button>
        </div>
      )}

      {/* Conteúdo */}
      {carregando ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)', fontSize: 13 }}>Carregando...</div>
      ) : telasFiltradas.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '70px 20px', color: 'var(--t3)', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'var(--s1)', border: '1px solid var(--bd)',
            boxShadow: 'var(--sh-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Database size={30} strokeWidth={1.1} color="var(--t3)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', letterSpacing: -0.3 }}>
              {busca ? 'Nenhum resultado' : 'Nenhuma tela criada'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.6, maxWidth: 280 }}>
              {busca
                ? `Nenhuma tela corresponde a "${busca}".`
                : 'Crie telas de cadastro personalizadas sem escrever código. Campos, tipos e módulos configurados visualmente.'}
            </div>
          </div>
          {!busca && (
            <button className="btn btn-primary" style={{ height: 36, padding: '0 20px', fontSize: 13 }}
              onClick={() => { setTelaEditando(null); setModalAberto(true) }}>
              <Plus size={14} /> Nova Tela
            </button>
          )}
          {busca && (
            <button className="btn btn-ghost" style={{ height: 32, fontSize: 12 }} onClick={() => setBusca('')}>
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {telasFiltradas.map(tela => (
            <div key={tela.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: 'var(--s1)', border: '1.5px solid var(--bd)',
              borderRadius: 12, padding: '12px 16px',
              boxShadow: 'var(--sh-xs)',
              opacity: tela.ativo ? 1 : 0.55,
              transition: 'box-shadow .15s',
            }}>
              {/* Ícone */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: tela.sistema ? 'rgba(96,165,250,.1)' : 'var(--or3)',
                border: `1px solid ${tela.sistema ? 'rgba(96,165,250,.2)' : 'rgba(255,107,43,.15)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TilaIcon nome={tela.icone} size={18} cor={tela.sistema ? 'var(--blue)' : 'var(--or)'} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tela.nome_tela}
                  </span>
                  {!tela.ativo && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'var(--s3)', color: 'var(--t3)', flexShrink: 0 }}>
                      INATIVA
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--t3)', flexWrap: 'wrap' }}>
                  <code style={{ fontFamily: 'monospace', fontSize: 10, background: 'var(--s3)', padding: '1px 6px', borderRadius: 4, color: 'var(--t2)' }}>
                    {tela.nome_tabela}
                  </code>
                  {tela.modulo_nome && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <FolderOpen size={11} /> {tela.modulo_nome}
                    </span>
                  )}
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                    background: tela.sistema ? 'rgba(96,165,250,.1)' : 'var(--or3)',
                    color: tela.sistema ? 'var(--blue)' : 'var(--or)',
                  }}>
                    {tela.sistema ? 'SISTEMA' : 'USUÁRIO'}
                  </span>
                </div>
              </div>

              {/* Ações */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  className="btn btn-ghost"
                  style={{ height: 32, padding: '0 12px', gap: 5, fontSize: 12 }}
                  onClick={() => abrirEditar(tela)}
                  title="Editar tela no Designer"
                >
                  <Edit2 size={13} /> Editar
                </button>
                {!tela.sistema && (
                  <>
                    <button
                      className="btn btn-ghost"
                      style={{ height: 32, padding: '0 10px', color: tela.ativo ? 'var(--t3)' : 'var(--green)' }}
                      onClick={() => handleToggleAtivo(tela)}
                      title={tela.ativo ? 'Inativar tela' : 'Reativar tela'}
                    >
                      {tela.ativo ? <PowerOff size={13} /> : <Power size={13} />}
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ height: 32, padding: '0 10px' }}
                      onClick={() => handleExcluir(tela)}
                      title="Excluir tela e tabela"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          <div style={{ fontSize: 10, color: 'var(--t3)', padding: '4px 2px' }}>
            {telasFiltradas.length} tela{telasFiltradas.length !== 1 ? 's' : ''} · {telasFiltradas.filter(t => t.ativo).length} ativa{telasFiltradas.filter(t => t.ativo).length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

    </div>
  )
}
