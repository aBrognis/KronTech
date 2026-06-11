import '../App.css'

const metricas = [
  { icon: '📋', label: 'OS Abertas',    val: '12',       trend: '↑ 3',        up: true,  cor: 'rgba(255,107,43,.1)',  iconCor: '#FF6B2B' },
  { icon: '⏱',  label: 'Em Andamento', val: '5',        trend: '→ 0',        up: null,  cor: 'rgba(96,165,250,.1)',  iconCor: '#60A5FA' },
  { icon: '💰', label: 'A Receber',     val: 'R$ 8.400', trend: '↑ R$1.2k',  up: true,  cor: 'rgba(74,222,128,.1)',  iconCor: '#4ADE80' },
  { icon: '📉', label: 'Despesas Mês',  val: 'R$ 1.850', trend: '↓ R$200',   up: false, cor: 'rgba(248,113,113,.1)', iconCor: '#F87171' },
]

const barras = [
  { mes: 'JAN', ab: 40, ok: 55 },
  { mes: 'FEV', ab: 55, ok: 70 },
  { mes: 'MAR', ab: 30, ok: 80 },
  { mes: 'ABR', ab: 70, ok: 50 },
  { mes: 'MAI', ab: 45, ok: 60 },
  { mes: 'JUN', ab: 95, ok: 38 },
]

const eventos = [
  { hora: '09:00', titulo: 'Reunião EASE', desc: 'Validação financeiro', cat: 'Reunião', cor: '#60A5FA', corBg: 'rgba(96,165,250,.1)' },
  { hora: '17:00', titulo: 'Entrega relatório PCP', desc: 'Prazo de projeto', cat: 'Prazo', cor: '#FF6B2B', corBg: 'rgba(255,107,43,.06)' },
]

export default function Dashboard() {
  return (
    <>
      {/* Métricas */}
      <div className="grid-4">
        {metricas.map(m => (
          <div key={m.label} className="sect" style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: m.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{m.icon}</div>
              <span style={{
                fontSize: 9, padding: '2px 7px', borderRadius: 99, fontWeight: 600,
                background: m.up === true ? 'rgba(74,222,128,.1)' : m.up === false ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.05)',
                color: m.up === true ? '#4ADE80' : m.up === false ? '#F87171' : '#555'
              }}>{m.trend}</span>
            </div>
            <div style={{ fontFamily: 'var(--ft)', fontSize: m.val.startsWith('R') ? 17 : 22, fontWeight: 800, color: 'var(--t1)' }}>{m.val}</div>
            <div style={{ fontSize: 10, color: 'var(--t2)', marginTop: 4 }}>{m.label}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--or), transparent)', opacity: 0 }} />
          </div>
        ))}
      </div>

      {/* Gráfico + Agenda + Alertas */}
      <div className="grid-2">
        {/* Gráfico */}
        <div className="sect">
          <div className="sect-head">
            <span className="sect-title">OS por Mês</span>
            <div style={{ display: 'flex', gap: 10 }}>
              {[['var(--or)', 'Abertas'], ['var(--s3)', 'Concluídas']].map(([cor, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--t2)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: cor, border: cor === 'var(--s3)' ? '1px solid var(--bd2)' : 'none' }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: 90, display: 'flex', alignItems: 'flex-end', gap: 4, paddingTop: 6 }}>
            {barras.map(b => (
              <div key={b.mes} style={{ flex: 1, display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                <div style={{ flex: 1, height: `${b.ab}%`, borderRadius: '3px 3px 0 0', background: 'linear-gradient(180deg, var(--or), var(--or2))' }} />
                <div style={{ flex: 1, height: `${b.ok}%`, borderRadius: '3px 3px 0 0', background: 'var(--s3)', border: '1px solid var(--bd2)' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {barras.map(b => (
              <div key={b.mes} style={{ flex: 1, textAlign: 'center', fontSize: 8, color: 'var(--t3)' }}>{b.mes}</div>
            ))}
          </div>
        </div>

        {/* Coluna direita */}
        <div className="grid-col">
          {/* Agenda do dia */}
          <div className="sect" style={{ flex: 1 }}>
            <div className="sect-head">
              <span className="sect-title">Hoje</span>
              <button className="sect-link">ver tudo →</button>
            </div>
            {eventos.map(e => (
              <div key={e.titulo} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--bd)', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--ft)', fontSize: 11, fontWeight: 700, color: 'var(--t2)', width: 36, flexShrink: 0 }}>{e.hora}</span>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: e.cor, marginTop: 4, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--t1)', fontWeight: 500 }}>{e.titulo}</div>
                  <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2 }}>{e.desc}</div>
                  <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 3, marginTop: 4, display: 'inline-block', background: e.corBg, color: e.cor }}>{e.cat}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Alertas */}
          <div className="sect">
            <div className="sect-head"><span className="sect-title">Alertas</span></div>
            <div className="alert alert-danger">⚠ OS-0003 com prazo vencido</div>
            <div className="alert alert-warn">💰 R$ 2.400 vence amanhã</div>
          </div>
        </div>
      </div>
    </>
  )
}
