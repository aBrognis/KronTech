// OrdemServico.jsx
import '../App.css'
import { useState } from 'react'

const OS_LIST = [
  { num: 'OS-0001', titulo: 'Configuração regra fiscal ICMS',  cliente: 'EASE Confecções', pri: 'Urgente', status: 'Em Andamento', prazo: '02/06/26', vencida: true },
  { num: 'OS-0002', titulo: 'Relatório de produção FR3',        cliente: 'EASE Confecções', pri: 'Alta',    status: 'Aberta',       prazo: '10/06/26', vencida: false },
  { num: 'OS-0003', titulo: 'Treinamento módulo financeiro',    cliente: 'EASE Confecções', pri: 'Normal',  status: 'Aguardando',   prazo: '15/06/26', vencida: false },
  { num: 'OS-0004', titulo: 'Trigger inativação de clientes',   cliente: 'EASE Confecções', pri: 'Normal',  status: 'Concluída',    prazo: '01/06/26', vencida: false },
]

const STATUS_BADGE = {
  'Aberta':       'badge badge-orange',
  'Em Andamento': 'badge badge-blue',
  'Aguardando':   'badge badge-yellow',
  'Concluída':    'badge badge-green',
}

const PRI_CLASS = {
  'Urgente': 'pri pri-urgente',
  'Alta':    'pri pri-alta',
  'Normal':  'pri pri-normal',
}

const FILTROS = ['Todas (12)', 'Abertas', 'Em Andamento', 'Aguardando', 'Concluídas']

export function OrdemServico() {
  const [filtro, setFiltro] = useState('Todas (12)')
  return (
    <>
      <div className="filters">
        {FILTROS.map(f => (
          <button key={f} className={`filter-btn${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)}>{f}</button>
        ))}
      </div>
      <div className="sect" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Nº', 'Título', 'Cliente', 'Prioridade', 'Status', 'Prazo'].map((h, i) => (
                <th key={h} style={{ fontSize: 9, letterSpacing: '1.5px', color: 'var(--t3)', textTransform: 'uppercase', padding: i === 0 ? '0 10px 10px 16px' : '0 10px 10px', textAlign: 'left', borderBottom: '1px solid var(--bd)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {OS_LIST.map(os => (
              <tr key={os.num} style={{ cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.querySelectorAll('td').forEach(td => td.style.background = 'rgba(255,255,255,.02)')}
                onMouseLeave={e => e.currentTarget.querySelectorAll('td').forEach(td => td.style.background = '')}
              >
                <td style={{ padding: '10px 10px 10px 16px', borderBottom: '1px solid var(--bd)', fontFamily: 'var(--ft)', fontWeight: 700, color: 'var(--or)', fontSize: 11 }}>{os.num}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--bd)', fontSize: 11, color: 'var(--t1)' }}>{os.titulo}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--bd)', fontSize: 10, color: 'var(--t3)' }}>{os.cliente}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--bd)' }}><span className={PRI_CLASS[os.pri]}>{os.pri}</span></td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--bd)' }}><span className={STATUS_BADGE[os.status]}>{os.status}</span></td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--bd)', fontSize: 10, color: os.vencida ? 'var(--red)' : 'var(--t2)' }}>{os.prazo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default OrdemServico
