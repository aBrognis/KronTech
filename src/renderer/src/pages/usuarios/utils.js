export const STATUS = [
  { valor: 'ativo', label: 'Ativo', classe: 'badge-green' },
  { valor: 'inativo', label: 'Inativo', classe: 'badge-yellow' },
  { valor: 'bloqueado', label: 'Bloqueado', classe: 'badge-orange' },
]
export const statusMeta = (s) => STATUS.find((x) => x.valor === s) || STATUS[0]

export const PERFIS = [
  { valor: 'admin', label: 'Administrador', classe: 'badge-orange' },
  { valor: 'gerente', label: 'Gerente', classe: 'badge-purple' },
  { valor: 'supervisor', label: 'Supervisor', classe: 'badge-blue' },
  { valor: 'operador', label: 'Operador', classe: 'badge-green' },
  { valor: 'consulta', label: 'Consulta', classe: 'badge-yellow' },
]
export const perfilMeta = (p) => PERFIS.find((x) => x.valor === p) || PERFIS[3]

export const TEMAS = [
  { valor: '', label: '(padrão do sistema)' },
  { valor: 'claro', label: 'Claro' },
  { valor: 'escuro', label: 'Escuro' },
  { valor: 'auto', label: 'Automático' },
]
export const IDIOMAS = [
  { valor: 'pt-BR', label: 'Português (Brasil)' },
  { valor: 'en-US', label: 'English (US)' },
  { valor: 'es', label: 'Español' },
]

export const EMPTY_FORM = {
  id: null, codigo: '',
  // identificacao — `ativo` e o campo principal (checkbox); `status` espelha
  // ('ativo' | 'inativo'), e 'bloqueado' so vem pela acao de bloquear.
  nome: '', apelido: '', documento: '', matricula: '', foto: '',
  ativo: true, status: 'ativo',
  // acesso
  login: '', senha: '', perfil: 'operador',
  dt_expiracao: '', forcar_troca_senha: false, dois_fatores: false,
  // contato
  email: '', telefone: '', ramal: '', whatsapp: '',
  // RH
  setor: '', cargo: '', centro_custo: '',
  admissao: '', desligamento: '', gestor_id: '', gestor_nome: '',
  // preferencias / complemento
  tema: '', idioma: 'pt-BR', observacoes: '', favorito: false,
  // somente leitura (vindos do backend)
  tem_senha: false, dt_ultimo_acesso: null, senha_alterada_em: null,
  tentativas_login: 0, bloqueado_ate: null, historicoSenha: [],
}

const d10 = (v) => (v ? String(v).slice(0, 10) : '')

export function paraForm(d) {
  return {
    id: d.id,
    codigo: d.codigo || '',
    nome: d.nome || '',
    apelido: d.apelido || '',
    documento: d.documento || '',
    matricula: d.matricula || '',
    status: d.status || 'ativo',
    ativo: d.ativo !== false,
    foto: d.foto || '',
    login: d.login || '',
    senha: '',
    perfil: d.perfil || 'operador',
    dt_expiracao: d10(d.dt_expiracao),
    forcar_troca_senha: !!d.forcar_troca_senha,
    dois_fatores: !!d.dois_fatores,
    email: d.email || '',
    telefone: d.telefone || '',
    ramal: d.ramal || '',
    whatsapp: d.whatsapp || '',
    setor: d.setor || '',
    cargo: d.cargo || '',
    centro_custo: d.centro_custo || '',
    admissao: d10(d.admissao),
    desligamento: d10(d.desligamento),
    gestor_id: d.gestor_id ? String(d.gestor_id) : '',
    gestor_nome: d.gestor_nome || '',
    tema: d.tema || '',
    idioma: d.idioma || 'pt-BR',
    observacoes: d.observacoes || '',
    favorito: !!d.favorito,
    tem_senha: !!d.tem_senha,
    dt_ultimo_acesso: d.dt_ultimo_acesso || null,
    senha_alterada_em: d.senha_alterada_em || null,
    tentativas_login: d.tentativas_login || 0,
    bloqueado_ate: d.bloqueado_ate || null,
    historicoSenha: Array.isArray(d.historicoSenha) ? d.historicoSenha : [],
  }
}

export function paraPayload(f) {
  const p = {
    nome: f.nome, apelido: f.apelido, documento: f.documento, matricula: f.matricula,
    // manda o checkbox; o service deriva o `status` a partir dele
    // (bloqueado so muda pela acao dedicada).
    ativo: !!f.ativo, status: f.status,
    foto: f.foto,
    login: f.login, perfil: f.perfil,
    dt_expiracao: f.dt_expiracao || null,
    forcar_troca_senha: !!f.forcar_troca_senha,
    dois_fatores: !!f.dois_fatores,
    email: f.email, telefone: f.telefone, ramal: f.ramal, whatsapp: f.whatsapp,
    setor: f.setor, cargo: f.cargo, centro_custo: f.centro_custo,
    admissao: f.admissao || null,
    desligamento: f.desligamento || null,
    gestor_id: f.gestor_id || null,
    tema: f.tema, idioma: f.idioma,
    observacoes: f.observacoes, favorito: !!f.favorito,
  }
  if (f.senha && f.senha.trim()) p.senha = f.senha
  return p
}
