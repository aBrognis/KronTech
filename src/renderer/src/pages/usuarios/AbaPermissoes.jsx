import { Info } from 'lucide-react'
import { FormGrid, Secao } from '../../components/cadastroPadrao/TelaCadastroPadrao'
import { GRUPOS_PERMISSAO } from './utils'

// Cada grupo grava uma string de letras separadas por virgula (ex: "V,I,E")
// no campo perm_* correspondente. Ordem preservada pela ordem das opcoes.
function toggle(str, valor, opcoes) {
  const atual = new Set(String(str || '').split(',').map((s) => s.trim()).filter(Boolean))
  atual.has(valor) ? atual.delete(valor) : atual.add(valor)
  return opcoes.filter((o) => atual.has(o.valor)).map((o) => o.valor).join(',')
}

export default function AbaPermissoes({ form, setForm, isRO }) {
  return (
    <FormGrid>
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'var(--s2)', border: '1px solid var(--bd)', fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>
        <Info size={14} style={{ flexShrink: 0, marginTop: 1, color: 'var(--t3)' }} />
        As permissões por módulo ainda não são aplicadas pelo sistema. Ficam registradas aqui para quando o controle de acesso entrar.
      </div>

      {GRUPOS_PERMISSAO.map((g) => {
        const marcados = new Set(String(form[g.campo] || '').split(',').map((s) => s.trim()).filter(Boolean))
        return (
          <Secao key={g.campo} titulo={g.label}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '10px 24px' }}>
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
          </Secao>
        )
      })}
    </FormGrid>
  )
}
