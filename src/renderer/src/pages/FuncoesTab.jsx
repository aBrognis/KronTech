import { useState, useEffect } from 'react'
import { Zap, Terminal, Globe, Calendar, Bell, BarChart2, GitBranch, Code, BookOpen, HelpCircle } from 'lucide-react'
import SecaoManual from './funcoesTab/SecaoManual.jsx'
import SecaoAutomacoes from './funcoesTab/SecaoAutomacoes.jsx'
import SecaoScripts from './funcoesTab/SecaoScripts.jsx'
import SecaoIntegracoes from './funcoesTab/SecaoIntegracoes.jsx'
import SecaoAgendamentos from './funcoesTab/SecaoAgendamentos.jsx'
import SecaoNotificacoes from './funcoesTab/SecaoNotificacoes.jsx'
import SecaoRelatorios from './funcoesTab/SecaoRelatorios.jsx'
import SecaoFluxos from './funcoesTab/SecaoFluxos.jsx'
import SecaoMinhasFuncoes from './funcoesTab/SecaoMinhasFuncoes.jsx'
import SecaoBiblioteca from './funcoesTab/SecaoBiblioteca.jsx'

const SECOES = [
  { id: 'manual',        Icon: HelpCircle, label: 'Manual de Uso',  cor: 'var(--or)',     desc: 'Como usar cada módulo'          },
  { id: 'automacoes',    Icon: Zap,        label: 'Automações',     cor: 'var(--or)',     desc: 'Regras visuais if→then'         },
  { id: 'scripts',       Icon: Terminal,   label: 'Scripts SQL',    cor: 'var(--blue)',   desc: 'Editor + salvar + executar'     },
  { id: 'integracoes',   Icon: Globe,      label: 'Integrações',    cor: 'var(--green)',  desc: 'APIs REST e webhooks externos'  },
  { id: 'agendamentos',  Icon: Calendar,   label: 'Agendamentos',   cor: 'var(--yellow)', desc: 'Execução automática por tempo'  },
  { id: 'notificacoes',  Icon: Bell,       label: 'Notificações',   cor: 'var(--purple)', desc: 'Toast, desktop, webhook'        },
  { id: 'relatorios',    Icon: BarChart2,  label: 'Relatórios',     cor: 'var(--green)',  desc: 'Queries salvas + export CSV'    },
  { id: 'fluxos',        Icon: GitBranch,  label: 'Fluxos',         cor: 'var(--purple)', desc: 'Workflows de etapas encadeadas' },
  { id: 'minhasfuncoes', Icon: Code,       label: 'Minhas Funções', cor: 'var(--or)',     desc: 'Crie funções JS infinitas'      },
  { id: 'biblioteca',    Icon: BookOpen,   label: 'Biblioteca',     cor: 'var(--t2)',     desc: 'Funções built-in reutilizáveis' },
]

export default function FuncoesTab({ telas = [] }) {
  const [secao, setSecao] = useState('manual')
  const [scripts, setScripts] = useState([])

  useEffect(() => { window.api.funcoes.listarScripts().then(res => res.ok && setScripts(res.data.map(s => ({ id: s.id, nome: s.nome })))) }, [secao])

  const sec = SECOES.find(s => s.id === secao)

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0, gap: 0 }}>

      {/* ── Nav lateral ────────────────────────────────────────────────────── */}
      <div style={{ width: 196, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 8px', borderRight: '1px solid var(--bd)', overflowY: 'auto' }}>
        {SECOES.map((s, i) => {
          const ativo = secao === s.id
          const isDivider = i === 1 || i === 8
          return (
            <div key={s.id}>
              {isDivider && <div style={{ height: 1, background: 'var(--bd)', margin: '4px 4px' }} />}
              <button onClick={() => setSecao(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 11px', borderRadius: 9, cursor: 'pointer',
                background: ativo ? 'var(--or4)' : 'transparent',
                border: `1.5px solid ${ativo ? 'rgba(255,107,43,.25)' : 'transparent'}`,
                textAlign: 'left', width: '100%', transition: 'var(--tr)',
              }}>
                <s.Icon size={15} color={ativo ? 'var(--or)' : s.cor} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: ativo ? 700 : 500, color: ativo ? 'var(--or)' : 'var(--t1)', lineHeight: 1.2 }}>{s.label}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--t3)', lineHeight: 1.2, marginTop: 1 }}>{s.desc}</div>
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Conteúdo da seção ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        {/* Header da seção */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--s2)', border: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {sec && <sec.Icon size={17} color={sec.cor} />}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', letterSpacing: -0.3 }}>{sec?.label}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>{sec?.desc}</div>
          </div>
        </div>

        {secao === 'manual'        && <SecaoManual />}
        {secao === 'automacoes'    && <SecaoAutomacoes telas={telas} />}
        {secao === 'scripts'       && <SecaoScripts />}
        {secao === 'integracoes'   && <SecaoIntegracoes />}
        {secao === 'agendamentos'  && <SecaoAgendamentos scripts={scripts} />}
        {secao === 'notificacoes'  && <SecaoNotificacoes />}
        {secao === 'relatorios'    && <SecaoRelatorios />}
        {secao === 'fluxos'        && <SecaoFluxos />}
        {secao === 'minhasfuncoes' && <SecaoMinhasFuncoes />}
        {secao === 'biblioteca'    && <SecaoBiblioteca telas={telas} />}
      </div>
    </div>
  )
}
