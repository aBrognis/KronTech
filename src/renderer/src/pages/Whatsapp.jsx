import { useEffect, useRef } from 'react'
import { MessageCircle, SlidersHorizontal } from 'lucide-react'
import { useParametro } from '../lib/useParametros'

// WhatsApp embutido: não é uma integração que troca dados com o WhatsApp,
// é literalmente o WhatsApp Web (web.whatsapp.com) aberto dentro do app via
// BrowserView (main/handlers/whatsapp.js), sobreposto à área deste <div>.
// Sessão isolada por usuário (QR code escaneado 1x, fica logado depois,
// igual ao navegador) - nenhuma mensagem é guardada no Postgres.
//
// A view é posicionada por cima deste componente via coordenadas mandadas
// ao main (whatsapp:atualizarBounds). Um ResizeObserver no próprio <div> já
// cobre resize da janela, recolher/expandir a sidebar etc. - o layout CSS
// recalcula o tamanho do <div> e o observer dispara sozinho, sem precisar
// de um listener de resize dedicado na BrowserWindow do main.
//
// O KronTech mantém TODAS as abas abertas montadas ao mesmo tempo (só
// display:none/flex na ativa, ver App.jsx `tab-content-area`) - este
// componente NUNCA desmonta ao trocar de aba, só quando a aba é fechada de
// verdade. Por isso o esconder/mostrar da view não depende de
// mount/unmount: quando a aba fica display:none, este <div> encolhe pra
// 0x0, o ResizeObserver dispara, e a view BrowserView some (bounds 0)
// sozinha - sem chamar whatsapp:esconder a cada troca de aba.
export default function Whatsapp({ sessao }) {
  const areaRef = useRef(null)
  const { valor: habilitado, carregando } = useParametro('whatsapp.habilitado')

  useEffect(() => {
    if (!habilitado) return
    let vivo = true
    // wrap() no main sempre resolve (nunca rejeita) - erro vem no payload
    // {ok:false}, nao precisa de .catch aqui.
    window.api.whatsapp.abrir(sessao)

    const el = areaRef.current
    if (!el) return

    function medir() {
      if (!vivo || !el) return
      const r = el.getBoundingClientRect()
      window.api.whatsapp.atualizarBounds({ x: r.left, y: r.top, width: r.width, height: r.height })
    }
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    medir()

    return () => {
      vivo = false
      ro.disconnect()
      window.api.whatsapp.esconder()
    }
  }, [habilitado])

  if (carregando) return null

  if (!habilitado) {
    return (
      <div className="page-with-footer">
        <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--t3)', maxWidth: 360 }}>
            <MessageCircle size={32} strokeWidth={1.5} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 6 }}>Função desligada</div>
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              O WhatsApp integrado está desativado. Ative o parâmetro
              <strong style={{ color: 'var(--t1)' }}> Habilitar WhatsApp no sistema</strong> para usar.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, fontSize: 11.5, color: 'var(--t3)' }}>
              <SlidersHorizontal size={12} /> Menu Ferramentas → Parâmetros → WhatsApp
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-with-footer">
      <div className="page-content" style={{ padding: 0, display: 'flex' }}>
        <div ref={areaRef} style={{ flex: 1, minHeight: 0 }} />
      </div>
    </div>
  )
}
