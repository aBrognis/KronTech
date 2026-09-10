import { useState, useEffect } from 'react'
import { KeyRound, AlertTriangle, History, ShieldCheck, Ban, ShieldOff, CheckCircle2 } from 'lucide-react'
import {
  FormGrid, Secao, CampoTexto, CampoSelect, CampoCodigo, CampoTextarea, CampoCheck,
} from '../../components/cadastroPadrao/TelaCadastroPadrao'
import InputData from '../../components/InputData'
import SeletorBusca from '../../components/SeletorBusca'
import { notificar } from '../../components/Notificacao'
import { fmtDataHoraBR, fmtDataBR } from '../../lib/utils/data.js'
import { PERFIS, perfilMeta, TEMAS, IDIOMAS } from './utils'

const CAMPOS_GESTOR = [
  { nome_campo: 'nome', label: 'Nome' },
  { nome_campo: 'cargo', label: 'Cargo' },
]

// Campo de texto com autocomplete dos valores ja usados naquela coluna
// (setor/cargo/centro de custo) — mantem consistencia sem virar cadastro.
function CampoDatalist({ form, setForm, isRO, campo, label, placeholder }) {
  const listId = `usr-dl-${campo}`
  const [opcoes, setOpcoes] = useState([])
  useEffect(() => {
    window.api.usuario.valoresCampo(campo).then((r) => { if (r.ok) setOpcoes(r.data || []) })
  }, [campo])
  return (
    <div className="form-group" style={{ margin: 0 }}>
      <label className="form-label">{label}</label>
      <input className="form-input" list={listId} value={form[campo] || ''} disabled={isRO}
        onChange={(e) => setForm((f) => ({ ...f, [campo]: e.target.value }))}
        placeholder={placeholder} />
      <datalist id={listId}>
        {opcoes.map((v) => <option key={v} value={v} />)}
      </datalist>
    </div>
  )
}

export default function FormularioUsuario({ form, setForm, isRO, onSituacaoMudou }) {
  const novo = !form.id
  const bloqueado = form.status === 'bloqueado'

  const [redefOpen, setRedefOpen] = useState(false)
  const [nova, setNova] = useState('')
  const [conf, setConf] = useState('')
  const [forcar, setForcar] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function buscarGestores(campo, modo, busca) {
    const res = await window.api.usuario.listarParaGestor(form.id || 0)
    let lista = res.ok ? res.data : []
    if (busca) {
      const b = busca.toLowerCase()
      lista = lista.filter((c) =>
        modo === 'igual' ? (c[campo] || '').toLowerCase() === b
          : modo === 'iniciando' ? (c[campo] || '').toLowerCase().startsWith(b)
          : (c[campo] || '').toLowerCase().includes(b))
    }
    return { registros: lista, total: lista.length }
  }

  async function mudarSituacao(situacao) {
    const res = await window.api.usuario.definirSituacao({ id: form.id, situacao })
    if (!res.ok) { notificar.erro(res.erro || 'Falha ao alterar a situação.'); return }
    setForm((f) => ({ ...f, status: situacao, ativo: situacao === 'ativo' }))
    onSituacaoMudou?.()
  }

  async function redefinir() {
    if (nova.length < 4) { notificar.aviso('A senha deve ter ao menos 4 caracteres.'); return }
    if (nova !== conf) { notificar.aviso('As senhas não coincidem.'); return }
    setSalvando(true)
    try {
      const res = await window.api.usuario.redefinirSenha({ id: form.id, novaSenha: nova, forcarTroca: forcar })
      if (!res.ok) { notificar.erro(res.erro || 'Falha ao redefinir.'); return }
      notificar.sucesso('Senha redefinida.')
      setForm((f) => ({ ...f, tem_senha: true, senha_alterada_em: new Date().toISOString(), forcar_troca_senha: forcar }))
      setRedefOpen(false); setNova(''); setConf(''); setForcar(false)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <FormGrid>
      {/* ─────────────── Identificação ─────────────── */}
      <Secao titulo="Identificação" cols="90px minmax(0, 1.8fr) minmax(0, 1.2fr) 150px">
        <CampoCodigo valor={form.codigo} />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="nome" label="Nome Completo" upper placeholder="MARIA DA SILVA SANTOS" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="apelido" label="Como quer ser chamado(a)" placeholder="Maria" />
        <CampoCheck form={form} setForm={setForm} isRO={isRO || bloqueado} campo="ativo" label="Usuário ativo" />
      </Secao>

      {!novo && bloqueado && (
        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(251,146,60,.12)', border: '1px solid rgba(251,146,60,.4)', fontSize: 12.5, color: 'var(--or)' }}>
          <Ban size={16} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>Acesso <strong>bloqueado</strong>. O usuário não consegue entrar até ser desbloqueado.</span>
          {!isRO && (
            <button type="button" className="btn btn-ghost" style={{ height: 28, fontSize: 11 }}
              onClick={() => mudarSituacao('ativo')}>
              <CheckCircle2 size={12} /> Desbloquear
            </button>
          )}
        </div>
      )}

      <Secao titulo="Documentos e matrícula" cols="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr)">
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="documento" label="CPF" placeholder="000.000.000-00" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="matricula" label="Matrícula" placeholder="Ex: 001042" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="foto" label="Foto (caminho do arquivo)" placeholder="C:\...\foto.png" />
      </Secao>

      {/* ─────────────── Contato ─────────────── */}
      <Secao titulo="Contato" cols="minmax(0, 1.6fr) minmax(0, 1fr) 110px minmax(0, 1fr)">
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="email" label="E-mail" placeholder="usuario@empresa.com.br" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="telefone" label="Telefone" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="ramal" label="Ramal" />
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="whatsapp" label="WhatsApp" />
      </Secao>

      {/* ─────────────── RH ─────────────── */}
      <Secao titulo="Alocação e RH" cols="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)">
        <CampoDatalist form={form} setForm={setForm} isRO={isRO} campo="setor" label="Setor / Área" placeholder="Ex: Financeiro" />
        <CampoDatalist form={form} setForm={setForm} isRO={isRO} campo="cargo" label="Cargo" placeholder="Ex: Analista" />
        <CampoDatalist form={form} setForm={setForm} isRO={isRO} campo="centro_custo" label="Centro de custo" placeholder="Ex: ADM-001" />
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Admissão</label>
          <InputData value={form.admissao} disabled={isRO}
            onChange={(v) => setForm((f) => ({ ...f, admissao: v }))} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Desligamento</label>
          <InputData value={form.desligamento} disabled={isRO}
            onChange={(v) => setForm((f) => ({ ...f, desligamento: v }))} />
        </div>
        <SeletorBusca
          label="Gestor imediato"
          placeholder="Nenhum"
          valorExibido={form.gestor_nome}
          disabled={isRO}
          onLimpar={() => setForm((f) => ({ ...f, gestor_id: '', gestor_nome: '' }))}
          titulo="Pesquisa Padrão · usuários"
          campos={CAMPOS_GESTOR}
          colunasExibidas={CAMPOS_GESTOR}
          campoInicial="nome"
          onBuscar={buscarGestores}
          onSelecionar={(r) => setForm((f) => ({ ...f, gestor_id: String(r.id), gestor_nome: r.nome }))}
        />
      </Secao>

      {/* ─────────────── Acesso ─────────────── */}
      <Secao titulo="Acesso ao sistema" cols="minmax(0, 1fr) minmax(0, 1fr) 160px">
        <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="login" label="Login / Usuário" placeholder="maria.silva" />

        {novo ? (
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Senha</label>
            <input className="form-input" type="password" value={form.senha} disabled={isRO}
              onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
              placeholder="mínimo 4 caracteres" />
          </div>
        ) : (
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Senha</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 34 }}>
              <span style={{ fontSize: 12, color: form.tem_senha ? 'var(--t2)' : 'var(--red)' }}>
                {form.tem_senha
                  ? (form.senha_alterada_em ? `Alterada em ${fmtDataBR(form.senha_alterada_em)}` : 'Senha definida')
                  : 'Sem senha'}
              </span>
              {!isRO && (
                <button type="button" className="btn btn-ghost" style={{ height: 30, fontSize: 11 }}
                  onClick={() => setRedefOpen(true)}>
                  <KeyRound size={12} /> Redefinir senha
                </button>
              )}
            </div>
          </div>
        )}

        <CampoSelect form={form} setForm={setForm} isRO={isRO} campo="perfil" label="Perfil de acesso"
          opcoes={PERFIS.map((p) => ({ valor: p.valor, label: p.label }))} />
      </Secao>

      {!novo && !form.tem_senha && (
        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(248,113,113,.1)', border: '1px solid rgba(239,68,68,.35)', fontSize: 12, color: 'var(--red)' }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          Este usuário não tem senha definida e não consegue entrar no sistema. Use "Redefinir senha".
        </div>
      )}

      {/* ─────────────── Segurança ─────────────── */}
      <Secao titulo="Segurança" cols="minmax(0, 1.3fr) minmax(0, 1.3fr) 150px">
        <CampoCheck form={form} setForm={setForm} isRO={isRO} campo="forcar_troca_senha" label="Forçar troca de senha no próximo login" />
        <CampoCheck form={form} setForm={setForm} isRO={isRO} campo="dois_fatores" label="Exigir autenticação em dois fatores" />
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Acesso expira em</label>
          <InputData value={form.dt_expiracao} disabled={isRO}
            onChange={(v) => setForm((f) => ({ ...f, dt_expiracao: v }))} />
        </div>
        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 16, fontSize: 11.5, color: 'var(--t3)', flexWrap: 'wrap' }}>
          <span>Último acesso: <strong style={{ color: 'var(--t2)' }}>{form.dt_ultimo_acesso ? fmtDataHoraBR(form.dt_ultimo_acesso) : 'nunca acessou'}</strong></span>
          {!novo && (form.tentativas_login > 0) && (
            <span>Tentativas de login falhas: <strong style={{ color: 'var(--t2)' }}>{form.tentativas_login}</strong></span>
          )}
          {!novo && !isRO && !bloqueado && (
            <button type="button" className="btn btn-ghost" style={{ height: 26, fontSize: 10.5, color: 'var(--or)', marginLeft: 'auto' }}
              onClick={() => mudarSituacao('bloqueado')}>
              <ShieldOff size={12} /> Bloquear acesso
            </button>
          )}
        </div>
      </Secao>

      {/* ─────────────── Preferências ─────────────── */}
      <Secao titulo="Preferências" cols="minmax(0, 1fr) minmax(0, 1fr)">
        <CampoSelect form={form} setForm={setForm} isRO={isRO} campo="tema" label="Tema da interface" opcoes={TEMAS} />
        <CampoSelect form={form} setForm={setForm} isRO={isRO} campo="idioma" label="Idioma" opcoes={IDIOMAS} />
      </Secao>

      {/* ─────────────── Observações ─────────────── */}
      <Secao titulo="Observações" largura="full">
        <CampoTextarea form={form} setForm={setForm} isRO={isRO} campo="observacoes" label="" rows={3}
          placeholder="Notas internas sobre este usuário..." />
      </Secao>

      {/* ─────────────── Histórico de senhas ─────────────── */}
      {!novo && form.historicoSenha?.length > 0 && (
        <Secao titulo="Histórico de senhas" largura="full" cols="1fr">
          <div style={{ gridColumn: '1 / -1', border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--s1)' }}>
                  <th style={{ padding: '7px 12px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)' }}>Trocada em</th>
                  <th style={{ padding: '7px 12px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', borderBottom: '1px solid var(--bd)' }}>Por</th>
                </tr>
              </thead>
              <tbody>
                {form.historicoSenha.map((h) => (
                  <tr key={h.id} style={{ borderTop: '1px solid var(--bd)' }}>
                    <td style={{ padding: '7px 12px', color: 'var(--t2)' }}>
                      <History size={11} style={{ verticalAlign: -1, marginRight: 5, color: 'var(--t3)' }} />
                      {fmtDataHoraBR(h.trocada_em)}
                    </td>
                    <td style={{ padding: '7px 12px', color: 'var(--t2)' }}>{h.trocada_por || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Secao>
      )}

      {redefOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setRedefOpen(false) }}>
          <div style={{ width: 400, background: 'var(--s1)', borderRadius: 14, boxShadow: 'var(--sh-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--bd)', fontWeight: 700, fontSize: 14, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} /> Redefinir senha de {form.nome || form.login}
            </div>
            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Nova senha</label>
                <input className="form-input" type="password" value={nova} autoFocus
                  onChange={(e) => setNova(e.target.value)} placeholder="mínimo 4 caracteres" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Confirmar senha</label>
                <input className="form-input" type="password" value={conf}
                  onChange={(e) => setConf(e.target.value)} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--t2)', cursor: 'pointer' }}>
                <input type="checkbox" checked={forcar} onChange={(e) => setForcar(e.target.checked)} />
                Exigir que o usuário troque a senha no próximo login
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '12px 22px 18px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setRedefOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={redefinir} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Redefinir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FormGrid>
  )
}
