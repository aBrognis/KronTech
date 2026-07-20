import {
  Type, Hash, DollarSign, Calendar, ToggleLeft,
  AlignLeft, List, Mail, Phone, CircleDot, Tag, Barcode, Minus,
  Copy, Star, Clock, MousePointerClick,
  CreditCard, Building2, MapPin, CheckSquare,
  Paperclip, ImageIcon, Percent, Palette, Link, Timer, Calculator, CalendarClock, Gauge,
} from 'lucide-react'

export const CANVAS_W    = 780
export const CANVAS_H_MIN = 480
export const SNAP        = 8
export const GUIDE_T = 12

export const TIPO_ICONS = {
  texto:       Type,    numero:      Hash,
  moeda:       DollarSign, data:    Calendar,
  booleano:    ToggleLeft, texto_longo: AlignLeft,
  select:      List,    radio:       CircleDot,
  tags:        Tag,     codigo_auto: Barcode,
  email:       Mail,    telefone:    Phone,
  divisor:     Minus,   botao:       MousePointerClick,
  favorito:    Star,    timestamps:  Clock,    copiar: Copy,
  cpf:         CreditCard, cnpj:    Building2, cep: MapPin,
  documento:   CreditCard, flags:   CheckSquare,
  arquivo:     Paperclip,  imagem:  ImageIcon,
  avaliacao:   Star,       progresso: Gauge,
  cor:         Palette,    url:     Link,
  data_hora:   CalendarClock, hora: Timer,
  percentual:  Percent,   calculo:  Calculator,
}

export const TIPO_H_DEFAULT = { texto_longo: 120, booleano: 44, radio: 52, divisor: 24, timestamps: 80, favorito: 44, copiar: 44, imagem: 180, avaliacao: 48, progresso: 52, calculo: 48, cor: 48, url: 48 }

export const TIPOS_PANEL = [
  { valor: 'texto',       label: 'Texto',      Icon: Type              },
  { valor: 'numero',      label: 'Número',     Icon: Hash              },
  { valor: 'moeda',       label: 'Moeda',      Icon: DollarSign        },
  { valor: 'data',        label: 'Data',       Icon: Calendar          },
  { valor: 'booleano',    label: 'Sim/Não',    Icon: ToggleLeft        },
  { valor: 'texto_longo', label: 'T.Longo',    Icon: AlignLeft         },
  { valor: 'select',      label: 'Select',     Icon: List              },
  { valor: 'radio',       label: 'Radio',      Icon: CircleDot         },
  { valor: 'email',       label: 'E-mail',     Icon: Mail              },
  { valor: 'telefone',    label: 'Tel.',        Icon: Phone             },
  { valor: 'codigo_auto', label: 'Cód.Auto',   Icon: Barcode           },
  { valor: 'tags',        label: 'Tags',       Icon: Tag               },
  { valor: 'divisor',     label: 'Divisor',    Icon: Minus             },
  { valor: 'botao',       label: 'Botão',      Icon: MousePointerClick },
  { valor: 'favorito',    label: 'Favorito',   Icon: Star              },
  { valor: 'timestamps',  label: 'Datas',      Icon: Clock             },
  { valor: 'copiar',      label: 'Copiar',     Icon: Copy              },
  { valor: 'cpf',         label: 'CPF',        Icon: CreditCard        },
  { valor: 'cnpj',        label: 'CNPJ',       Icon: Building2         },
  { valor: 'cep',         label: 'CEP',        Icon: MapPin            },
  { valor: 'documento',   label: 'CPF/CNPJ',   Icon: CreditCard        },
  { valor: 'flags',       label: 'Flags',      Icon: CheckSquare       },
  { valor: 'arquivo',     label: 'Arquivo',    Icon: Paperclip         },
  { valor: 'imagem',      label: 'Imagem',     Icon: ImageIcon         },
  { valor: 'avaliacao',   label: 'Avaliação',  Icon: Star              },
  { valor: 'progresso',   label: 'Progresso',  Icon: Gauge             },
  { valor: 'cor',         label: 'Cor',        Icon: Palette           },
  { valor: 'url',         label: 'URL',        Icon: Link              },
  { valor: 'data_hora',   label: 'Data+Hora',  Icon: CalendarClock     },
  { valor: 'hora',        label: 'Hora',       Icon: Timer             },
  { valor: 'percentual',  label: 'Percentual', Icon: Percent           },
  { valor: 'calculo',     label: 'Cálculo',    Icon: Calculator        },
]

export const TIPOS_DESIGNER = [
  { valor: 'texto',       label: 'Texto' },
  { valor: 'numero',      label: 'Número' },
  { valor: 'moeda',       label: 'Moeda (R$)' },
  { valor: 'data',        label: 'Data' },
  { valor: 'booleano',    label: 'Sim / Não' },
  { valor: 'texto_longo', label: 'Texto Longo' },
  { valor: 'select',      label: 'Lista (select)' },
  { valor: 'radio',       label: 'Radio colorido' },
  { valor: 'tags',        label: 'Tags' },
  { valor: 'codigo_auto', label: 'Código automático' },
  { valor: 'email',       label: 'E-mail' },
  { valor: 'telefone',    label: 'Telefone' },
  { valor: 'lookup',      label: 'Lookup' },
  { valor: 'cpf',         label: 'CPF' },
  { valor: 'cnpj',        label: 'CNPJ (busca automática)' },
  { valor: 'cep',         label: 'CEP (busca automática)' },
  { valor: 'documento',   label: 'CPF / CNPJ (Física ou Jurídica)' },
  { valor: 'flags',       label: 'Flags (checkboxes com código)' },
  { valor: 'arquivo',     label: 'Arquivo (upload)' },
  { valor: 'imagem',      label: 'Imagem (upload)' },
  { valor: 'avaliacao',   label: 'Avaliação (estrelas)' },
  { valor: 'progresso',   label: 'Barra de Progresso' },
  { valor: 'cor',         label: 'Seletor de Cor' },
  { valor: 'url',         label: 'URL / Link' },
  { valor: 'data_hora',   label: 'Data e Hora' },
  { valor: 'hora',        label: 'Hora' },
  { valor: 'percentual',  label: 'Percentual (%)' },
  { valor: 'calculo',     label: 'Campo Calculado' },
]

export const FUNCOES_BOTAO = [
  { valor: 'copiarTexto',            label: 'Copiar texto / campo'      },
  { valor: 'mostrarAlerta',          label: 'Mostrar alerta (info)'     },
  { valor: 'mostrarSucesso',         label: 'Mostrar alerta (sucesso)'  },
  { valor: 'mostrarErro',            label: 'Mostrar alerta (erro)'     },
  { valor: 'mostrarAviso',           label: 'Mostrar alerta (aviso)'    },
  { valor: 'abrirTela',              label: 'Navegar para tela'         },
  { valor: 'voltarTela',             label: 'Voltar para tela anterior' },
  { valor: 'abrirEmNovaAba',         label: 'Abrir link externo'        },
  { valor: 'limparFormulario',       label: 'Limpar formulário'         },
  { valor: 'exportarPDF',            label: 'Exportar como PDF'         },
  { valor: 'abrirArquivo',           label: 'Abrir arquivo'             },
  { valor: 'previewArquivo',         label: 'Preview de arquivo'        },
  { valor: 'copiarArquivoLocal',     label: 'Copiar arquivo para temp'  },
  { valor: 'copiarArquivoClipboard', label: 'Copiar arquivo (clipboard)'},
  { valor: 'excluirRegistro',        label: 'Excluir registro atual'    },
  { valor: 'buscarCNPJ',             label: 'Buscar CNPJ'               },
  { valor: 'buscarCEP',              label: 'Buscar CEP'                },
]

export function autoPos(campos, tipo, opcoes) {
  const maxY = campos.reduce((m, c) => Math.max(m, (c.y_pos || 0) + (c.h_px || 60)), 0)
  let h = TIPO_H_DEFAULT[tipo] || 60
  if ((tipo === 'flags' || tipo === 'radio') && Array.isArray(opcoes) && opcoes.length > 0) {
    // header(28) + padding(16) + per-item(22) * n
    h = 28 + 16 + opcoes.length * 22
  }
  return {
    x_pos: 0,
    y_pos: maxY > 0 ? maxY + SNAP : 0,
    w_px:  (tipo === 'texto_longo' || tipo === 'divisor') ? CANVAS_W : 280,
    h_px:  h,
  }
}

export const COR_PAL = ['#6366F1','#8B5CF6','#EC4899','#EF4444','#F97316','#EAB308','#22C55E','#14B8A6','#3B82F6','#94A3B8']
