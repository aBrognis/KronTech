import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { HelpCircle } from 'lucide-react'

// ── Conteudo de ajuda por campo, variando por provedor ───────────────────
// Usuario final nao sabe o que e "Host IMAP" nem como gerar senha de app.
// Cada entrada e uma funcao (provedor) => JSX, pra adaptar o texto.

const PASSO_SENHA_APP = {
  gmail: (
    <>
      <b>Como gerar a senha de app do Gmail:</b>
      <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        <li>Acesse <b>myaccount.google.com</b> e entre em <b>Segurança</b>.</li>
        <li>Ative a <b>Verificação em duas etapas</b> (obrigatória para gerar senha de app).</li>
        <li>Ainda em Segurança, procure <b>Senhas de app</b> (ou acesse <b>myaccount.google.com/apppasswords</b>).</li>
        <li>Dê um nome (ex: "KronTech") e clique em <b>Criar</b>.</li>
        <li>Copie a senha de 16 letras que aparece e cole no campo <b>Senha de app</b>. Ela é usada no lugar da sua senha normal.</li>
      </ol>
    </>
  ),
  outlook: (
    <>
      <b>Outlook / Microsoft 365:</b>
      <p style={{ margin: '4px 0 0' }}>
        Desde abril de 2026 a Microsoft desativou o login por senha de app em contas pessoais
        e corporativas. A conexão IMAP com senha de app <b>não funciona mais</b> — é preciso
        login por OAuth, ainda não disponível aqui. Use uma conta Gmail ou um servidor IMAP
        próprio por enquanto.
      </p>
    </>
  ),
  imap_generico: (
    <>
      <b>Servidor IMAP próprio (hospedagem, cPanel, Zimbra, etc):</b>
      <p style={{ margin: '4px 0 0' }}>
        Geralmente é a <b>mesma senha</b> que você usa para entrar no webmail. Se o provedor
        exigir "senha de aplicativo" ou "senha específica", gere no painel de e-mail dele.
        Em caso de dúvida, peça os <b>dados IMAP/SMTP</b> ao suporte da hospedagem.
      </p>
    </>
  ),
}

export const AJUDA = {
  nome: () => (
    <p style={{ margin: 0 }}>
      Um apelido para você identificar a conta na lista (ex: "Trabalho", "Pessoal").
      Não precisa ser o seu nome real nem aparece para quem recebe seus e-mails.
    </p>
  ),

  email: () => (
    <p style={{ margin: 0 }}>
      O endereço de e-mail completo desta conta (ex: <b>voce@gmail.com</b>).
      É o endereço que aparece como remetente nas mensagens que você enviar.
    </p>
  ),

  provedor: () => (
    <>
      <p style={{ margin: 0 }}>Escolha o serviço do seu e-mail:</p>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        <li><b>Gmail</b> — endereços @gmail.com ou Google Workspace. Preenche os servidores automaticamente.</li>
        <li><b>Outlook (M365)</b> — @outlook.com, @hotmail.com, @live.com ou Microsoft 365.</li>
        <li><b>IMAP genérico</b> — qualquer outro (e-mail da sua empresa/hospedagem). Você informa os servidores manualmente.</li>
      </ul>
    </>
  ),

  usuarioLogin: () => (
    <p style={{ margin: 0 }}>
      Normalmente é o <b>mesmo endereço de e-mail</b> do campo acima. Alguns servidores de
      empresa usam só o nome de usuário (sem o <code>@dominio</code>) — nesse caso, informe
      como o suporte indicar.
    </p>
  ),

  senhaApp: (provedor) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ margin: 0 }}>
        <b>Não é a sua senha normal.</b> Provedores modernos exigem uma "senha de app": um
        código gerado só para programas de e-mail, que pode ser revogado sem trocar a senha
        principal.
      </p>
      {PASSO_SENHA_APP[provedor] || PASSO_SENHA_APP.imap_generico}
    </div>
  ),

  replyTo: () => (
    <p style={{ margin: 0 }}>
      <b>Opcional.</b> Se preenchido, as respostas aos seus e-mails vão para este endereço
      em vez do endereço da conta. Útil quando você envia de um e-mail mas quer receber as
      respostas em outro. Deixe em branco se não souber.
    </p>
  ),

  imapHost: (provedor) => (
    <>
      <p style={{ margin: 0 }}>
        O <b>servidor de entrada</b> (IMAP) — de onde o app baixa os e-mails recebidos.
      </p>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        <li><b>Gmail:</b> <code>imap.gmail.com</code></li>
        <li><b>Outlook:</b> <code>outlook.office365.com</code></li>
        <li><b>Outro:</b> pergunte ao suporte da hospedagem — costuma ser <code>imap.seudominio.com</code> ou <code>mail.seudominio.com</code>.</li>
      </ul>
      {provedor !== 'imap_generico' && (
        <p style={{ margin: '4px 0 0', color: 'var(--t3)' }}>Preenchido automaticamente para o {provedor === 'gmail' ? 'Gmail' : 'Outlook'}.</p>
      )}
    </>
  ),

  imapPorta: () => (
    <>
      <p style={{ margin: 0 }}>A porta do servidor de entrada. Quase sempre:</p>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        <li><b>993</b> com segurança <b>TLS</b> (recomendado, padrão).</li>
        <li><b>143</b> com <b>STARTTLS</b> (servidores antigos).</li>
      </ul>
    </>
  ),

  imapSeguranca: () => (
    <>
      <p style={{ margin: 0 }}>Como a conexão de entrada é criptografada:</p>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        <li><b>TLS</b> — porta 993. Use esta na dúvida.</li>
        <li><b>STARTTLS</b> — porta 143. Só se o provedor pedir.</li>
        <li><b>Nenhuma</b> — sem criptografia. Evite, inseguro.</li>
      </ul>
    </>
  ),

  smtpHost: (provedor) => (
    <>
      <p style={{ margin: 0 }}>
        O <b>servidor de saída</b> (SMTP) — por onde o app envia os e-mails que você escreve.
      </p>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        <li><b>Gmail:</b> <code>smtp.gmail.com</code>, porta <b>465</b> (TLS).</li>
        <li><b>Outlook:</b> <code>smtp.office365.com</code>, porta <b>587</b> (STARTTLS).</li>
        <li><b>Outro:</b> geralmente <code>smtp.seudominio.com</code> ou <code>mail.seudominio.com</code>.</li>
      </ul>
      {provedor !== 'imap_generico' && (
        <p style={{ margin: '4px 0 0', color: 'var(--t3)' }}>Preenchido automaticamente para o {provedor === 'gmail' ? 'Gmail' : 'Outlook'}.</p>
      )}
    </>
  ),

  smtpPorta: () => (
    <>
      <p style={{ margin: 0 }}>A porta do servidor de saída:</p>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        <li><b>465</b> com <b>TLS</b> (Gmail, muitos provedores).</li>
        <li><b>587</b> com <b>STARTTLS</b> (Outlook, padrão moderno).</li>
      </ul>
    </>
  ),

  smtpSeguranca: () => (
    <>
      <p style={{ margin: 0 }}>Criptografia da conexão de saída:</p>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        <li><b>TLS</b> — normalmente porta 465.</li>
        <li><b>STARTTLS</b> — normalmente porta 587.</li>
        <li><b>Nenhuma</b> — evite.</li>
      </ul>
    </>
  ),

  sincronizarDesde: () => (
    <p style={{ margin: 0 }}>
      A partir de que data o app deve baixar os e-mails desta conta. Uma data recente deixa
      a primeira sincronização mais rápida; uma data antiga traz o histórico completo, mas
      pode demorar bastante na primeira vez.
    </p>
  ),
}

// Label do formulario ja com o "?" de ajuda logo apos o texto.
// O texto pode quebrar linha normalmente; o "?" fica colado na ultima
// palavra (nao vai sozinho pra proxima linha).
export function LabelAjuda({ campo, provedor, children }) {
  return (
    <label className="form-label" style={{ display: 'block', lineHeight: 1.3 }}>
      {children}
      {' '}
      <CampoAjuda campo={campo} provedor={provedor} />
    </label>
  )
}

// Botao "?" com popover de ajuda. O popover e renderizado num PORTAL no
// body e posicionado por coordenadas do botao — nao e clipado pelo
// overflow do modal e nunca sai da tela.
export function CampoAjuda({ campo, provedor }) {
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState(null) // { top, left }
  const btnRef = useRef(null)
  const popRef = useRef(null)

  const POP_W = 300

  useLayoutEffect(() => {
    if (!aberto || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const margem = 8
    let left = r.left
    // Nao deixa passar da borda direita da janela.
    if (left + POP_W > window.innerWidth - margem) left = window.innerWidth - margem - POP_W
    if (left < margem) left = margem
    setPos({ top: r.bottom + 6, left })
  }, [aberto])

  useEffect(() => {
    if (!aberto) return
    const fora = e => {
      if (btnRef.current?.contains(e.target)) return
      if (popRef.current?.contains(e.target)) return
      setAberto(false)
    }
    const esc = e => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc) }
  }, [aberto])

  const conteudo = AJUDA[campo]
  if (!conteudo) return null

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setAberto(v => !v)}
        title="Ajuda"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 14, height: 14, padding: 0, borderRadius: '50%', flexShrink: 0,
          border: 'none', background: 'transparent', cursor: 'pointer',
          color: aberto ? 'var(--or)' : 'var(--t3)', verticalAlign: 'middle',
        }}
      >
        <HelpCircle size={12} />
      </button>
      {aberto && pos && createPortal(
        <div
          ref={popRef}
          style={{
            position: 'fixed', top: pos.top, left: pos.left,
            zIndex: 3000, width: POP_W, maxWidth: 'calc(100vw - 16px)',
            background: 'var(--s1)', border: '1px solid var(--bd2)', borderRadius: 10,
            boxShadow: 'var(--sh-lg)', padding: '12px 14px',
            fontSize: 12, lineHeight: 1.55, color: 'var(--t1)', fontWeight: 400,
            textTransform: 'none', letterSpacing: 0, textAlign: 'left', whiteSpace: 'normal',
          }}
        >
          {conteudo(provedor)}
        </div>,
        document.body,
      )}
    </>
  )
}
