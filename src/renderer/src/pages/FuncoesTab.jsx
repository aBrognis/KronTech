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
    <div className="page-with-footer">

      <div className="page-tabs" style={{ overflowX: 'auto' }}>
        {SECOES.map(s => (
          <button
            key={s.id}
            className={`page-tab${secao === s.id ? ' active' : ''}`}
            onClick={() => setSecao(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Header da seção */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
        {secao === 'fluxos'        && <SecaoFluxos telas={telas} />}
        {secao === 'minhasfuncoes' && <SecaoMinhasFuncoes />}
        {secao === 'biblioteca'    && <SecaoBiblioteca telas={telas} />}
      </div>
    </div>
  )
}
