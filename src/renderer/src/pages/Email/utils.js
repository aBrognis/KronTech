// .badge-red não existe no sistema (só orange/blue/yellow/green/purple) —
// "erro" usa estilo inline com var(--red), mesmo padrão de .pri-urgente.
export const STATUS_SYNC_META = {
  nunca_sincronizada: { label: 'Nunca sincronizada', classe: 'badge-orange' },
  ok:                 { label: 'Sincronizada',        classe: 'badge-green'  },
  erro:               { label: 'Erro',                classe: null, corInline: true },
}

export const PROVEDORES = [
  { id: 'gmail',         label: 'Gmail',         imapHost: 'imap.gmail.com',      imapPorta: 993, smtpHost: 'smtp.gmail.com',      smtpPorta: 465 },
  { id: 'outlook',       label: 'Outlook (M365)', imapHost: 'outlook.office365.com', imapPorta: 993, smtpHost: 'smtp.office365.com', smtpPorta: 587 },
  { id: 'imap_generico', label: 'IMAP genérico',  imapHost: '', imapPorta: 993, smtpHost: '', smtpPorta: 465 },
]

export function fmtDataHora(data) {
  if (!data) return ''
  const d = new Date(data)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d)
}

// Data completa com dia da semana, para o cabecalho do leitor
// (ex: "seg, 26 de ago de 2026, 10:26").
export function fmtDataLonga(data) {
  if (!data) return ''
  const d = new Date(data)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d)
}

export function fmtDataCurta(data) {
  if (!data) return ''
  const d = new Date(data)
  if (Number.isNaN(d.getTime())) return ''
  const hoje = new Date()
  const mesmoDia = d.toDateString() === hoje.toDateString()
  if (mesmoDia) return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(d)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(d)
}

// Pega só letras de verdade (ignora "-", ".", etc que apareciam como
// segunda inicial em nomes tipo "Eduardo - Aloisio Martins" → virava "E-",
// ou no e-mail "a.brognis3@gmail.com" → virava "A."). Cai pro e-mail
// alfanumérico quando não há nome, e por fim "?" só se não sobrar nada.
export function iniciais(nome, email) {
  const base = (nome || email || '').trim()
  const letras = base.match(/[A-Za-zÀ-ÿ]+/g) || []
  if (letras.length >= 2) return (letras[0][0] + letras[1][0]).toUpperCase()
  if (letras.length === 1) return letras[0].slice(0, 2).toUpperCase()
  return '?'
}

export function nomeOuEmail(nome, email) {
  return nome?.trim() || email || ''
}

// Paleta curada (não cores aleatórias saturadas demais) — cada remetente
// sempre cai na mesma cor via hash simples do e-mail, dando identidade
// visual consistente aos avatares sem depender de imagem de perfil real.
export const PALETA_AVATAR = [
  '#D95218', '#2563EB', '#059669', '#7C3AED', '#DB2777',
  '#CA8A04', '#0891B2', '#DC2626', '#4F46E5', '#16A34A',
]

export function corAvatar(nome, email) {
  const base = (email || nome || '').toLowerCase().trim()
  let hash = 0
  for (let i = 0; i < base.length; i++) hash = (hash * 31 + base.charCodeAt(i)) >>> 0
  return PALETA_AVATAR[hash % PALETA_AVATAR.length]
}

// Converte um hex #RRGGBB da paleta em rgba com alfa, para o fundo "tint"
// suave dos avatares de remetente (iniciais ficam na cor cheia por cima).
export function corAvatarTint(hex, alpha = 0.16) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '')
  if (!m) return 'var(--s3)'
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Achata a árvore de etiquetas (lista plana com parent_id) em uma lista
// ordenada com nível de profundidade — reaproveitada pela navegação lateral
// e pelos dois dropdowns de "aplicar etiqueta" (lista e leitor). Os
// dropdowns sempre mostram tudo; a navegação lateral passa `recolhidos`
// (Set de IDs) pra podar a descida em nós que o usuário recolheu, evitando
// que uma árvore grande empurre o resto do menu pra baixo.
export function achatarEtiquetasEmArvore(etiquetas, parentId = null, nivel = 0, recolhidos = null) {
  const filhos = etiquetas.filter(e => e.parent_id === parentId)
  return filhos.flatMap(e => {
    const temFilhos = etiquetas.some(x => x.parent_id === e.id)
    const recolhida = recolhidos?.has(e.id)
    return [
      { ...e, nivel, temFilhos },
      ...(recolhida ? [] : achatarEtiquetasEmArvore(etiquetas, e.id, nivel + 1, recolhidos)),
    ]
  })
}
