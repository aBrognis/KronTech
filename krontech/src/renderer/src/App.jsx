import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard   from './pages/Dashboard'
import OrdemServico from './pages/OrdemServico'
import Scripts     from './pages/Scripts'
import Solucoes    from './pages/Solucoes'
import Placeholder from './pages/Placeholder'
import './App.css'

// Config das páginas
const PAGES = {
  dashboard:  { title: 'Dashboard',          sub: 'VISÃO GERAL DO DIA',              btnPri: '+ Nova OS',       btnSec: '' },
  os:         { title: 'Ordens de Serviço',  sub: 'SUPORTE · ACOMPANHAMENTO',        btnPri: '+ Nova OS',       btnSec: 'Filtros avançados' },
  projetos:   { title: 'Projetos / Clientes',sub: 'GESTÃO · PROJETOS',              btnPri: '+ Novo Projeto',  btnSec: '+ Cliente' },
  financeiro: { title: 'Financeiro',         sub: 'GESTÃO · FLUXO DE CAIXA',        btnPri: '+ Lançamento',    btnSec: 'Exportar' },
  agenda:     { title: 'Agenda',             sub: 'GESTÃO · COMPROMISSOS',           btnPri: '+ Compromisso',   btnSec: '' },
  scripts:    { title: 'Base de Scripts',    sub: 'FERRAMENTAS · CONHECIMENTO',      btnPri: '+ Novo Script',   btnSec: 'Importar' },
  solucoes:   { title: 'Soluções',           sub: 'FERRAMENTAS · PROBLEMAS RESOLVIDOS', btnPri: '+ Nova Solução', btnSec: '' },
  sql:        { title: 'Editor SQL',         sub: 'FERRAMENTAS · POSTGRESQL',        btnPri: '▶ Executar',      btnSec: 'Nova conexão' },
  relatorios: { title: 'Relatórios',         sub: 'FERRAMENTAS · PDF',               btnPri: '+ Template',      btnSec: 'Gerar PDF' },
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const cfg = PAGES[page]

  function renderPage() {
    switch (page) {
      case 'dashboard':  return <Dashboard />
      case 'os':         return <OrdemServico />
      case 'scripts':    return <Scripts />
      case 'solucoes':   return <Solucoes />
      case 'projetos':   return <Placeholder icon="📁" title="Projetos / Clientes"  desc="Gerencie clientes, projetos e etapas com checklist de progresso." btn="+ Novo Projeto" />
      case 'financeiro': return <Placeholder icon="💰" title="Financeiro"           desc="Honorários a receber, despesas e fluxo de caixa mensal."       btn="+ Lançamento" />
      case 'agenda':     return <Placeholder icon="📅" title="Agenda"               desc="Tarefas, reuniões, prazos e treinamentos com categorias."       btn="+ Compromisso" />
      case 'sql':        return <Placeholder icon="🗄️" title="Editor SQL"           desc="Monaco Editor integrado com execução direta no PostgreSQL."    btn="Conectar banco" />
      case 'relatorios': return <Placeholder icon="📄" title="Relatórios"           desc="Templates HTML editáveis com geração de PDF via Puppeteer."    btn="+ Novo Template" />
      default:           return <Dashboard />
    }
  }

  return (
    <div className="app">
      <Sidebar activePage={page} onNavigate={setPage} />

      <div className="main">
        {/* Topbar */}
        <header className="topbar">
          <div className="tb-left">
            <h1 className="tb-title">{cfg.title}</h1>
            <span className="tb-sub">{cfg.sub}</span>
          </div>
          <div className="tb-right">
            <span className="tb-dot" />
            {cfg.btnSec && (
              <button className="btn btn-ghost">{cfg.btnSec}</button>
            )}
            <button className="btn btn-primary">{cfg.btnPri}</button>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="content" key={page}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
