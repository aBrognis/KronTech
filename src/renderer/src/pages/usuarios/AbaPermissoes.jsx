import { Info } from 'lucide-react'
import { FormGrid, Secao, CampoSelect } from '../../components/cadastroPadrao/TelaCadastroPadrao'
import { GRUPOS_PERMISSAO, TEMAS, IDIOMAS } from './utils'

function toggle(str, valor, opcoes) {
  const atual = new Set(String(str || '').split(',').map((s) => s.trim()).filter(Boolean))
  atual.has(valor) ? atual.delete(valor) : atual.add(valor)
  return opcoes.filter((o) => atual.has(o.valor)).map((o) => o.valor).join(',')
}

function marcarTodas(g, on) {
  return on ? g.opcoes.map((o) => o.valor).join(',') : ''
}

export default function AbaPermissoes({ form, setForm, isRO }) {
  return (
    <FormGrid>
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'var(--s2)', border: '1px solid var(--bd)', fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>
        <Info size={14} style={{ flexShrink: 0, marginTop: 1, color: 'var(--t3)' }} />
        As permissões por módulo ainda não são aplicadas pelo sistema. Ficam registradas aqui para quando o controle de acesso entrar. O perfil (aba Acesso) é o que orienta o nível de acesso.
      </div>

      <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {GRUPOS_PERMISSAO.map((g) => {
          const marcados = new Set(String(form[g.campo] || '').split(',').map((s) => s.trim()).filter(Boolean))
          const todas = marcados.size === g.opcoes.length
          return (
            <div key={g.campo} style={{ border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--s1)', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{g.label}</span>
                {!isRO && (
                  <button type="button" className="btn btn-ghost" style={{ height: 20, fontSize: 10, padding: '0 6px' }}
                    onClick={() => setForm((f) => ({ ...f, [g.campo]: marcarTodas(g, !todas) }))}>
                    {todas ? 'Limpar' : 'Marcar tudo'}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {g.opcoes.map((o) => {
                  const on = marcados.has(o.valor)
                  return (
                    <label key={o.valor}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5,
                        cursor: isRO ? 'default' : 'pointer', userSelect: 'none',
                        color: on ? 'var(--t1)' : 'var(--t2)', fontWeight: on ? 600 : 400,
                      }}>
                      <input type="checkbox" checked={on} disabled={isRO}
                        onChange={() => setForm((f) => ({ ...f, [g.campo]: toggle(f[g.campo], o.valor, g.opcoes) }))}
                        style={{ width: 15, height: 15, cursor: isRO ? 'default' : 'pointer' }} />
                      {o.label}
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <Secao titulo="Preferências do usuário" cols="minmax(0, 1fr) minmax(0, 1fr)">
        <CampoSelect form={form} setForm={setForm} isRO={isRO} campo="tema" label="Tema da interface" opcoes={TEMAS} />
        <CampoSelect form={form} setForm={setForm} isRO={isRO} campo="idioma" label="Idioma" opcoes={IDIOMAS} />
      </Secao>
    </FormGrid>
  )
}
