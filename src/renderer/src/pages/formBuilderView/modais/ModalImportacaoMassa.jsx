import { CheckCircle2, XCircle, Loader2, X } from 'lucide-react'

export default function ModalImportacaoMassa({ progresso, onCancelar, onFechar }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14, boxShadow: 'var(--sh-lg)', width: 520, maxWidth: '94vw', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {progresso.fase === 'concluido'
            ? <CheckCircle2 size={22} color="var(--green, #22c55e)" />
            : (progresso.fase === 'cancelado' || progresso.fase === 'erro')
              ? <XCircle size={22} color="var(--red, #ef4444)" />
              : <Loader2 size={22} color="var(--or)" style={{ animation: 'spin 1s linear infinite' }} />}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>
              {progresso.fase === 'escaneando' && 'Escaneando arquivos...'}
              {progresso.fase === 'importando' && 'Importando arquivos...'}
              {progresso.fase === 'concluido'  && 'Importação concluída!'}
              {progresso.fase === 'cancelado'  && 'Importação cancelada'}
              {progresso.fase === 'erro'       && 'Erro na importação'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
              {progresso.total > 0 ? `${progresso.total.toLocaleString('pt-BR')} arquivos encontrados` : 'Aguarde...'}
            </div>
          </div>
        </div>
        {progresso.total > 0 && (
          <div>
            <div style={{ height: 8, background: 'var(--s3)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (progresso.atual / progresso.total) * 100)}%`,
                background: progresso.fase === 'concluido' ? 'var(--green, #22c55e)' : progresso.fase === 'cancelado' ? 'var(--red, #ef4444)' : 'var(--or)',
                borderRadius: 99, transition: 'width .2s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: 'var(--t3)' }}>
              <span>{progresso.atual.toLocaleString('pt-BR')} de {progresso.total.toLocaleString('pt-BR')}</span>
              <span>{Math.round((progresso.atual / progresso.total) * 100)}%</span>
            </div>
          </div>
        )}
        {progresso.arquivo && progresso.fase === 'importando' && (
          <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {progresso.arquivo}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Inseridos', val: progresso.inseridos, cor: 'var(--green, #22c55e)' },
            { label: 'Ignorados', val: progresso.ignorados, cor: 'var(--t3)'             },
          ].map(({ label, val, cor }) => (
            <div key={label} style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: cor, fontVariantNumeric: 'tabular-nums' }}>{(val || 0).toLocaleString('pt-BR')}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: .8 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {(progresso.fase === 'importando' || progresso.fase === 'escaneando') && (
            <button className="btn btn-danger" onClick={onCancelar}>
              <X size={13} /> Cancelar
            </button>
          )}
          {(progresso.fase === 'concluido' || progresso.fase === 'cancelado' || progresso.fase === 'erro') && (
            <button className="btn btn-primary" onClick={onFechar}>
              <CheckCircle2 size={13} /> Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
