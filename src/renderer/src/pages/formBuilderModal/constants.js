export const TIPOS = [
  { valor: 'texto',        label: 'Texto',            pg: 'VARCHAR(n)',    desc: 'Texto curto com tamanho máximo.',                    ex: 'Nome, CPF, Código'        },
  { valor: 'numero',       label: 'Número',           pg: 'NUMERIC(15,4)', desc: 'Número decimal com até 4 casas.',                    ex: '10, 3.14, -5'             },
  { valor: 'moeda',        label: 'Moeda (R$)',       pg: 'NUMERIC(15,2)', desc: 'Valor monetário com 2 casas decimais.',              ex: '1250.00, 0.99'            },
  { valor: 'data',         label: 'Data',             pg: 'DATE',          desc: 'Apenas data, sem hora.',                             ex: '2024-06-04'               },
  { valor: 'booleano',     label: 'Sim / Não',        pg: 'BOOLEAN',       desc: 'Checkbox verdadeiro ou falso.',                      ex: '✓ Ativo, ✗ Inativo'       },
  { valor: 'texto_longo',  label: 'Texto Longo',      pg: 'TEXT',          desc: 'Texto ilimitado, campo maior.',                      ex: 'Observações, histórico'   },
  { valor: 'select',       label: 'Lista (select)',   pg: 'VARCHAR(100)',  desc: 'Dropdown com opções configuráveis.',                  ex: 'Ativo / Inativo / Outro'  },
  { valor: 'radio',        label: 'Radio colorido',   pg: 'VARCHAR(100)',  desc: 'Botões de escolha com cor por opção. Ideal para status.', ex: 'Ativo, Inativo, Pendente' },
  { valor: 'tags',         label: 'Tags',             pg: 'TEXT',          desc: 'Múltiplos valores separados por vírgula.',           ex: 'urgente, financeiro'      },
  { valor: 'codigo_auto',  label: 'Código automático',pg: 'VARCHAR(50)',   desc: 'Código gerado automaticamente (ex: 001, 002...).',    ex: '001, 002, 003'            },
  { valor: 'email',        label: 'E-mail',           pg: 'VARCHAR(150)',  desc: 'E-mail com validação de formato.',                   ex: 'contato@empresa.com'      },
  { valor: 'telefone',     label: 'Telefone',         pg: 'VARCHAR(30)',   desc: 'Número de telefone ou celular.',                     ex: '(11) 99999-9999'          },
  { valor: 'cpf',          label: 'CPF',              pg: 'VARCHAR(14)',   desc: 'CPF com máscara e validação dos dígitos verificadores.', ex: '000.000.000-00'          },
  { valor: 'cnpj',         label: 'CNPJ',             pg: 'VARCHAR(18)',   desc: 'CNPJ com máscara, validação e busca automática na Receita Federal.', ex: '00.000.000/0000-00' },
  { valor: 'cep',          label: 'CEP',              pg: 'VARCHAR(9)',    desc: 'CEP com máscara e busca automática de endereço via ViaCEP.', ex: '00000-000'              },
  { valor: 'documento',    label: 'CPF / CNPJ',       pg: 'VARCHAR(18)',   desc: 'Campo unificado: toggle Física (CPF) / Jurídica (CNPJ). Adapta máscara, validação e busca automaticamente.', ex: '000.000.000-00 ou 00.000.000/0000-00' },
  { valor: 'flags',        label: 'Flags',            pg: 'VARCHAR(50)',   desc: 'Checkboxes múltiplos. Cada opção tem um código curto; o valor salvo é a concatenação dos selecionados (ex: CFT).', ex: 'C, F, T → CFT' },
  { valor: 'lookup',       label: 'Lookup (outra tabela)', pg: 'INTEGER',  desc: 'Referência a um registro de outra tela (FK).', ex: 'Banco, Cliente, Produto'  },
  { valor: 'sub_grid',     label: 'Grade de Itens (Sub-tabela)', pg: null, desc: 'Lista editável de linhas relacionadas, guardada em uma tabela filha própria (parcelas, itens de pedido, etc).', ex: 'Parcelas de um título' },
  // ── Componentes especiais ──────────────────────────────────────────────────
  { valor: 'pasta',        label: 'Pasta (autocomplete)', pg: 'VARCHAR(200)', desc: 'Texto com sugestão automática dos valores já cadastrados nessa coluna. Ideal para categorias/pastas.', ex: 'Contratos, Financeiro' },
  { valor: 'arquivo',      label: 'Arquivo',          pg: 'TEXT',          desc: 'Upload de arquivo qualquer (PDF, DOCX, XLSX...). Salva o caminho no banco.', ex: 'Contrato.pdf, Planilha.xlsx' },
  { valor: 'imagem',       label: 'Imagem',           pg: 'TEXT',          desc: 'Upload de imagem com preview inline (PNG, JPG, GIF, WEBP).', ex: 'foto_perfil.jpg' },
  { valor: 'avaliacao',    label: 'Avaliação ★',      pg: 'SMALLINT',      desc: 'Estrelas de 1 a 5. Ideal para NPS, satisfação, qualidade.', ex: '★★★★☆' },
  { valor: 'progresso',    label: 'Progresso %',      pg: 'SMALLINT',      desc: 'Barra de progresso de 0 a 100%. Ótimo para tarefas, etapas.', ex: '0%, 50%, 100%' },
  { valor: 'cor',          label: 'Cor',              pg: 'VARCHAR(7)',     desc: 'Seletor de cor HEX. Salva o valor como #RRGGBB.', ex: '#FF6B2B, #4ADE80' },
  { valor: 'url',          label: 'URL / Link',       pg: 'TEXT',          desc: 'Campo de endereço web com botão de abrir no navegador.', ex: 'https://empresa.com.br' },
  { valor: 'data_hora',    label: 'Data e Hora',      pg: 'TIMESTAMP',     desc: 'Data + horário completo.',                           ex: '2024-06-04 14:30' },
  { valor: 'hora',         label: 'Hora',             pg: 'TIME',          desc: 'Apenas o horário, sem data.',                        ex: '08:00, 14:30' },
  { valor: 'percentual',   label: 'Percentual',       pg: 'NUMERIC(6,2)',  desc: 'Número com símbolo % automático. De 0 a 100.',        ex: '12.5%, 100%' },
  { valor: 'calculo',      label: 'Cálculo',          pg: 'NUMERIC(15,2)', desc: 'Campo calculado a partir de outros campos. Configure a fórmula nas opções.', ex: '{preco} * {quantidade}' },
  // ── Autenticação ──────────────────────────────────────────────────────────
  { valor: 'login',        label: 'Login (usuário)',   pg: 'VARCHAR(100)',  desc: 'Campo de login/usuário usado na autenticação do sistema.', ex: 'admin, joao.silva' },
  { valor: 'senha',        label: 'Senha (hash)',      pg: 'TEXT',          desc: 'Campo de senha com hash bcrypt. Exibe botão "Redefinir senha" no lugar do valor.', ex: '••••••••' },
  { valor: 'senha_cofre',  label: 'Senha (cofre)',     pg: 'TEXT',          desc: 'Senha reversível, criptografada (AES). Pode ser visualizada com o olho, gerada automaticamente e mostra indicador de força. Ideal para cofres de senha de sistemas externos.', ex: 'K7#mP9$qLx2v' },
]

export const TIPOS_COM_OPCOES = ['select', 'radio', 'flags']

export const FUNCOES_BOTAO = [
  // ── Texto e navegação ─────────────────────────────────────────────────────
  { valor: 'copiarTexto',           label: 'Copiar texto / campo',       paramLabel: 'Texto fixo ou {nome_campo} para referenciar um campo',      grupo: 'geral' },
  { valor: 'mostrarAlerta',         label: 'Mostrar alerta (info)',       paramLabel: 'Mensagem exibida no alerta',                                 grupo: 'geral' },
  { valor: 'mostrarSucesso',        label: 'Mostrar alerta (sucesso)',    paramLabel: 'Mensagem exibida no alerta',                                 grupo: 'geral' },
  { valor: 'mostrarErro',           label: 'Mostrar alerta (erro)',       paramLabel: 'Mensagem exibida no alerta',                                 grupo: 'geral' },
  { valor: 'mostrarAviso',          label: 'Mostrar alerta (aviso)',      paramLabel: 'Mensagem exibida no alerta',                                 grupo: 'geral' },
  { valor: 'abrirTela',             label: 'Navegar para tela',           paramLabel: "Rota: 'dashboard', 'agenda', 'fb__minha_tabela'...",         grupo: 'geral' },
  { valor: 'voltarTela',            label: 'Voltar para tela anterior',   paramLabel: '',                                                           grupo: 'geral' },
  { valor: 'abrirEmNovaAba',        label: 'Abrir link externo',          paramLabel: 'URL completa (https://...)',                                 grupo: 'geral' },
  { valor: 'limparFormulario',      label: 'Limpar formulário',           paramLabel: 'Deixe vazio para limpar o formulário atual',                 grupo: 'geral' },
  { valor: 'exportarPDF',           label: 'Exportar como PDF',           paramLabel: 'Deixe vazio para exportar o formulário atual',               grupo: 'geral' },
  // ── Arquivo ───────────────────────────────────────────────────────────────
  { valor: 'abrirArquivo',          label: 'Abrir arquivo',               paramLabel: 'Nome do campo arquivo (ex: arquivo)',                        grupo: 'arquivo' },
  { valor: 'previewArquivo',        label: 'Preview de arquivo',          paramLabel: 'Nome do campo arquivo (ex: arquivo)',                        grupo: 'arquivo' },
  { valor: 'copiarArquivoLocal',    label: 'Copiar arquivo para temp',    paramLabel: 'Nome do campo arquivo (ex: arquivo)',                        grupo: 'arquivo' },
  { valor: 'copiarArquivoClipboard',label: 'Copiar arquivo (clipboard)',  paramLabel: 'Nome do campo arquivo (ex: arquivo)',                        grupo: 'arquivo' },
  // ── Registro ──────────────────────────────────────────────────────────────
  { valor: 'excluirRegistro',       label: 'Excluir registro atual',      paramLabel: 'Mensagem de confirmação (deixe vazio para padrão)',          grupo: 'registro' },
  // ── Consultas externas ────────────────────────────────────────────────────
  { valor: 'buscarCNPJ',            label: 'Buscar dados do CNPJ',        paramLabel: 'Nome do campo CNPJ (ex: cnpj)',                              grupo: 'consulta' },
  { valor: 'buscarCEP',             label: 'Buscar endereço pelo CEP',    paramLabel: 'Nome do campo CEP (ex: cep)',                                grupo: 'consulta' },
]

export const COR_PALETTE = [
  '#4ADE80', '#60A5FA', '#F87171', '#FBD24C', '#A78BFA',
  '#FB923C', '#34D399', '#F472B6', '#94A3B8', '#E879F9',
]

export const LARGURAS = [
  { valor: 25,  label: '25%'  }, { valor: 33,  label: '33%'  },
  { valor: 50,  label: '50%'  }, { valor: 66,  label: '66%'  },
  { valor: 75,  label: '75%'  }, { valor: 100, label: '100%' },
]

// ── tipo meta (badge colorido) ────────────────────────────────────────────
export const TIPO_META = {
  texto:       { short: 'TXT', color: '#60A5FA' },
  numero:      { short: 'NUM', color: '#A78BFA' },
  moeda:       { short: 'R$',  color: '#4ADE80' },
  data:        { short: 'DAT', color: '#34D399' },
  booleano:    { short: 'S/N', color: '#94A3B8' },
  texto_longo: { short: 'TLG', color: '#818CF8' },
  select:      { short: 'SEL', color: '#FB923C' },
  radio:       { short: 'RAD', color: '#FB923C' },
  tags:        { short: 'TAG', color: '#F472B6' },
  codigo_auto: { short: 'COD', color: '#A78BFA' },
  email:       { short: '@',   color: '#60A5FA' },
  telefone:    { short: 'TEL', color: '#34D399' },
  lookup:      { short: 'LNK', color: '#818CF8' },
  sub_grid:    { short: 'GRD', color: '#FBD24C' },
  cpf:         { short: 'CPF', color: '#34D399' },
  cnpj:        { short: 'CNPJ',color: '#34D399' },
  cep:         { short: 'CEP', color: '#34D399' },
  documento:   { short: 'DOC', color: '#34D399' },
  flags:       { short: 'FLG', color: '#F472B6' },
  pasta:       { short: 'PST', color: '#34D399' },
  arquivo:     { short: 'ARQ', color: '#60A5FA' },
  imagem:      { short: 'IMG', color: '#F472B6' },
  avaliacao:   { short: '★',   color: '#FBD24C' },
  progresso:   { short: '%',   color: '#4ADE80' },
  cor:         { short: 'COR', color: '#E879F9' },
  url:         { short: 'URL', color: '#60A5FA' },
  data_hora:   { short: 'D+H', color: '#34D399' },
  hora:        { short: 'HOR', color: '#34D399' },
  percentual:  { short: 'PCT', color: '#A78BFA' },
  calculo:     { short: 'FX',  color: '#FB923C' },
  login:       { short: 'LGN', color: '#60A5FA' },
  senha:       { short: 'SNH', color: '#F87171' },
  senha_cofre: { short: 'COF', color: '#F87171' },
}
