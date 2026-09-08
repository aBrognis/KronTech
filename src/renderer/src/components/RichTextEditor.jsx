import { useRef, useEffect } from 'react'
import { Bold, Italic, Underline, Link2, Image as ImageIcon, List, ListOrdered, RemoveFormatting } from 'lucide-react'

// Editor WYSIWYG mínimo via contentEditable + document.execCommand — sem
// dependência externa. execCommand é deprecated na spec mas segue
// implementado e estável em todos os engines Chromium (Electron é
// Chromium), é a via mais direta pra negrito/itálico/link/imagem sem trazer
// uma lib de editor inteira pro projeto.
function inserirImagemComoDataUri(exec) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => exec('insertImage', reader.result)
    reader.readAsDataURL(file)
  }
  input.click()
}

function inserirLink(exec) {
  const url = window.prompt('URL do link:', 'https://')
  if (url) exec('createLink', url)
}

export default function RichTextEditor({ value, onChange, minHeight = 220, placeholder, readOnly = false }) {
  const ref = useRef(null)
  const valorExternoRef = useRef(value)

  // Só reescreve o DOM quando o valor muda de fora (troca de mensagem,
  // inserir assinatura) — nunca a cada onChange, senão o cursor pula pro
  // início a cada tecla digitada.
  useEffect(() => {
    if (ref.current && value !== valorExternoRef.current && value !== ref.current.innerHTML) {
      ref.current.innerHTML = value || ''
    }
    valorExternoRef.current = value
  }, [value])

  function exec(comando, arg) {
    ref.current?.focus()
    document.execCommand(comando, false, arg)
    onChange(ref.current?.innerHTML || '')
  }

  function handleInput() {
    valorExternoRef.current = ref.current.innerHTML
    onChange(ref.current.innerHTML)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: Math.min(minHeight, 160), border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden' }}>
      {!readOnly && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '6px 8px', borderBottom: '1px solid var(--bd)', background: 'var(--s2)' }}>
          <BotaoFormato Icon={Bold} title="Negrito" onClick={() => exec('bold')} />
          <BotaoFormato Icon={Italic} title="Itálico" onClick={() => exec('italic')} />
          <BotaoFormato Icon={Underline} title="Sublinhado" onClick={() => exec('underline')} />
          <div style={{ width: 1, height: 18, background: 'var(--bd)', margin: '0 4px' }} />
          <BotaoFormato Icon={Link2} title="Inserir link" onClick={() => inserirLink(exec)} />
          <BotaoFormato Icon={ImageIcon} title="Inserir imagem" onClick={() => inserirImagemComoDataUri(exec)} />
          <div style={{ width: 1, height: 18, background: 'var(--bd)', margin: '0 4px' }} />
          <BotaoFormato Icon={List} title="Lista" onClick={() => exec('insertUnorderedList')} />
          <BotaoFormato Icon={ListOrdered} title="Lista numerada" onClick={() => exec('insertOrderedList')} />
          <div style={{ width: 1, height: 18, background: 'var(--bd)', margin: '0 4px' }} />
          <BotaoFormato Icon={RemoveFormatting} title="Limpar formatação" onClick={() => exec('removeFormat')} />
        </div>
      )}
      <div
        ref={ref}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="rich-text-editor-area"
        style={{
          flex: 1, minHeight: 0, padding: '10px 12px', fontSize: 13, lineHeight: 1.5, color: 'var(--t1)',
          overflowY: 'auto', outline: 'none', background: readOnly ? 'var(--s2)' : 'var(--s1)',
        }}
      />
    </div>
  )
}

function BotaoFormato({ Icon, title, onClick }) {
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      title={title}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: 'none', borderRadius: 6, background: 'transparent', cursor: 'pointer', color: 'var(--t2)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--s3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Icon size={14} />
    </button>
  )
}
