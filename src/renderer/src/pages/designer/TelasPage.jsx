import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Edit2, Trash2, Power, PowerOff,
  Database, X, FolderOpen,
} from 'lucide-react'
import FormBuilderModal from '../FormBuilderModal'
import { notificar } from '../../components/Notificacao'
import TilaIcon from './TilaIcon.jsx'

function notifyTelasUpdated() {
  window.dispatchEvent(new CustomEvent('krontech:telas-updated'))
}

// Sem controle de acesso por usuário/perfil — tela de configuração pura,
// mesmo padrão já adotado em ModulosPage.jsx (sem abas Acesso/Cadastro
// fabricadas artificialmente).
export default function TelasPage() {
  const [telas,        setTelas]        = useState([])
  const [modulos,      setModulos]      = useState([])
  const [carregando,   setCarregando]   = useState(false)
  const [modalAberto,  setModalAberto]  = useState(false)
  const [telaEditando, setTelaEditando] = useState(null)
  const [erro,         setErro]         = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true); setErro(null)
    try {
      const [resTelas, resModulos] = await Promise.all([
        window.api.formBuilder.listarTelas(),
        window.api.formBuilder.listarModulos(),
      ])
      if (!resTelas.ok) throw new Error(resTelas.erro)
      if (!resModulos.ok) throw new Error(resModulos.erro)
      setTelas(resTelas.data); setModulos(resModulos.data)
    } catch (e) { setErro(e.message) }
    finally     { setCarregando(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function handleToggleAtivo(tela) {
    const acao = tela.ativo ? 'Inativar' : 'Reativar'
    if (!(await notificar.confirmar(`${acao} a tela "${tela.nome_tela}"?`, { titulo: `${acao} tela`, confirmarLabel: acao }))) return
    try {
      const res = tela.ativo
        ? await window.api.formBuilder.inativarTela(tela.id)
        : await window.api.formBuilder.reativarTela(tela.id)
      if (!res.ok) throw new Error(res.erro)
      await carregar()
      notifyTelasUpdated()
    } catch (e) { notificar.erro('Erro: ' + e.message) }
  }

  async function handleExcluir(tela) {
    if (!(await notificar.confirmar(`ATENÇÃO: Isso vai EXCLUIR a tabela "${tela.nome_tabela}" e TODOS os dados.\n\nDeseja continuar?`, { titulo: 'Excluir tela', confirmarLabel: 'Excluir', perigo: true }))) return
    try {
      const res = await window.api.formBuilder.excluirTela(tela.id)
      if (!res.ok) throw new Error(res.erro)
      await carregar()
      notifyTelasUpdated()
    } catch (e) { notificar.erro('Erro: ' + e.message) }
  }

  async function abrirEditar(tela) {
    try {
      const res = await window.api.formBuilder.buscarTela(tela.id)
      if (!res.ok) throw new Error(res.erro)
      setTelaEditando(res.data); setModalAberto(true)
    } catch (e) { notificar.erro('Erro ao carregar tela: ' + e.message) }
  }

  async function handleSalvar() {
    setModalAberto(false); setTelaEditando(null)
    await carregar()
    notifyTelasUpdated()
  }

  if (modalAberto) return (
    <FormBuilderModal
      tela={telaEditando}
      modulos={modulos}
      onSalvar={handleSalvar}
      onFechar={() => { setModalAberto(false); setTelaEditando(null) }}
    />
  )

  return (
    <div className="page-with-footer">

      <div className="page-tabs">
        <span className="page-tab active" style={{ cursor: 'default' }}>Telas</span>
        <span className="page-tab-info" style={{ textTransform: 'uppercase', letterSpacing: .4, maxWidth: 'none' }}>
          {telas.length} tela{telas.length !== 1 ? 's' : ''} cadastrada{telas.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="page-content">

        {/* Incluir tela */}
        <div style={{
          background: 'var(--s2)', border: '1px solid var(--bd)',
          borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <div style={{ flex: 1, fontSize: 12, color: 'var(--t3)' }}>
            Crie telas de cadastro personalizadas sem escrever código.
          </div>
          <button className="btn btn-primary" style={{ height: 38, flexShrink: 0 }}
            onClick={() => { setTelaEditando(null); setModalAberto(true) }}>
            <Plus size={13} /> Incluir
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
            <button onClick={() => setErro(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', display: 'flex' }}><X size={13} /></button>
          </div>
        )}

        {/* Conteúdo */}
        {carregando ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skel" style={{ height: 44, borderRadius: 7 }} />)}
          </div>
        ) : telas.length === 0 ? (
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
                Nenhuma tela criada
              </div>
              <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.6, maxWidth: 280 }}>
                Use o botão acima para criar sua primeira tela.
              </div>
            </div>
          </div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {telas.map(tela => (
                <div key={tela.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'var(--s1)', border: '1.5px solid var(--bd)',
                  borderRadius: 12, padding: '12px 16px',
                  boxShadow: 'var(--sh-xs)',
                  opacity: tela.ativo ? 1 : 0.55,
                  transition: 'box-shadow .15s',
                }}>
                  {/* Ícone — a cor já carrega a distinção sistema/usuário, sem duplicar em badge */}
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
                      {!tela.ativo && <span className="badge badge-yellow">INATIVA</span>}
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
                    </div>
                  </div>

                  {/* Ações — sempre as mesmas 3 posições, desabilitadas (não ocultas) em telas de sistema */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      className="btn btn-ghost"
                      style={{ height: 32, padding: '0 12px', gap: 5, fontSize: 12 }}
                      onClick={() => abrirEditar(tela)}
                      title="Editar tela no Designer"
                    >
                      <Edit2 size={13} /> Editar
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ height: 32, padding: '0 10px', color: tela.ativo ? 'var(--t3)' : 'var(--green)' }}
                      onClick={() => handleToggleAtivo(tela)}
                      disabled={tela.sistema}
                      title={tela.sistema ? 'Telas de sistema não podem ser inativadas' : tela.ativo ? 'Inativar tela' : 'Reativar tela'}
                    >
                      {tela.ativo ? <PowerOff size={13} /> : <Power size={13} />}
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ height: 32, padding: '0 10px' }}
                      onClick={() => handleExcluir(tela)}
                      disabled={tela.sistema}
                      title={tela.sistema ? 'Telas de sistema não podem ser excluídas' : 'Excluir tela e tabela'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
        )}

      </div>
    </div>
  )
}
