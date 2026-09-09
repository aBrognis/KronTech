export const STATUS = [
  { valor: 'ativo', label: 'Ativo', classe: 'badge-green' },
  { valor: 'inativo', label: 'Inativo', classe: 'badge-yellow' },
  { valor: 'bloqueado', label: 'Bloqueado', classe: 'badge-orange' },
]

export const statusMeta = (s) => STATUS.find((x) => x.valor === s) || STATUS[0]

// Permissoes por modulo — mesmas opcoes do template antigo do FormBuilder.
// Guardadas como string de letras separadas por virgula (ex: "V,I,E").
// Ainda NAO sao aplicadas pelo sistema (sem motor de controle de acesso);
// ficam registradas aqui pra quando o motor entrar.
export const GRUPOS_PERMISSAO = [
  {
    campo: 'perm_cadastros', label: 'Cadastros',
    opcoes: [
      { valor: 'V', label: 'Visualizar' },
      { valor: 'I', label: 'Incluir' },
      { valor: 'E', label: 'Editar' },
      { valor: 'X', label: 'Excluir' },
    ],
  },
  {
    campo: 'perm_financeiro', label: 'Financeiro',
    opcoes: [
      { valor: 'V', label: 'Visualizar' },
      { valor: 'I', label: 'Incluir' },
      { valor: 'E', label: 'Editar' },
      { valor: 'X', label: 'Excluir' },
    ],
  },
  {
    campo: 'perm_relatorios', label: 'Relatórios',
    opcoes: [
      { valor: 'V', label: 'Visualizar' },
      { valor: 'E', label: 'Exportar' },
      { valor: 'P', label: 'Imprimir' },
    ],
  },
  {
    campo: 'perm_config', label: 'Configurações',
    opcoes: [
      { valor: 'C', label: 'Acessar configurações' },
      { valor: 'U', label: 'Gerenciar usuários' },
      { valor: 'B', label: 'Backup / Restauração' },
    ],
  },
]

export const EMPTY_FORM = {
  id: null, codigo: '',
  nome: '', status: 'ativo', foto: '',
  login: '', email: '', senha: '',
  telefone: '', setor: '', cargo: '',
  perm_cadastros: '', perm_financeiro: '', perm_relatorios: '', perm_config: '',
  observacoes: '', favorito: false,
  tem_senha: false,
}

export function paraForm(d) {
  return {
    id: d.id,
    codigo: d.codigo || '',
    nome: d.nome || '',
    status: d.status || 'ativo',
    foto: d.foto || '',
    login: d.login || '',
    email: d.email || '',
    senha: '', // nunca vem do backend; so preenchido no cadastro novo
    telefone: d.telefone || '',
    setor: d.setor || '',
    cargo: d.cargo || '',
    perm_cadastros: d.perm_cadastros || '',
    perm_financeiro: d.perm_financeiro || '',
    perm_relatorios: d.perm_relatorios || '',
    perm_config: d.perm_config || '',
    observacoes: d.observacoes || '',
    favorito: !!d.favorito,
    tem_senha: !!d.tem_senha,
  }
}

export function paraPayload(f) {
  const p = {
    nome: f.nome,
    status: f.status,
    foto: f.foto,
    login: f.login,
    email: f.email,
    telefone: f.telefone,
    setor: f.setor,
    cargo: f.cargo,
    perm_cadastros: f.perm_cadastros,
    perm_financeiro: f.perm_financeiro,
    perm_relatorios: f.perm_relatorios,
    perm_config: f.perm_config,
    observacoes: f.observacoes,
    favorito: !!f.favorito,
  }
  // senha so vai quando o usuario digitou (cadastro novo).
  if (f.senha && f.senha.trim()) p.senha = f.senha
  return p
}
