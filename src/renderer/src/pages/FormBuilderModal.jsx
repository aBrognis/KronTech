import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Plus, Trash2, Eye, Settings, Save, AlertCircle, Info, Layout, CircleDot, ExternalLink, Minus, ChevronLeft, ChevronDown, Star, Clock, Copy, Search } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import FormDesigner, { autoPos, CANVAS_W } from '../components/FormDesigner'

function lucideName(str) {
  return str.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
}
function IconPreview({ name, size = 18 }) {
  const Icon = LucideIcons[lucideName(name || '')]
  if (!Icon) return <span style={{ fontSize: 10, color: 'var(--t3)', fontStyle: 'italic' }}>?</span>
  return <Icon size={size} />
}

const TIPOS = [
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
]

const TIPOS_COM_OPCOES = ['select', 'radio', 'flags']

const FUNCOES_BOTAO = [
  { valor: 'copiarTexto',      label: 'Copiar texto / campo',  paramLabel: 'Texto fixo ou {nome_campo} para referenciar um campo' },
  { valor: 'mostrarAlerta',    label: 'Mostrar alerta',        paramLabel: 'Mensagem exibida no alerta' },
  { valor: 'abrirTela',        label: 'Navegar para tela',     paramLabel: "Rota: 'dashboard', 'agenda', 'scripts', 'fb__minha_tabela'..." },
  { valor: 'abrirEmNovaAba',   label: 'Abrir link externo',    paramLabel: 'URL completa (https://...)' },
  { valor: 'limparFormulario', label: 'Limpar formulário',     paramLabel: 'ID do formulário — deixe vazio para limpar o atual' },
  { valor: 'exportarPDF',      label: 'Exportar como PDF',     paramLabel: 'ID do elemento HTML a imprimir' },
]

const COR_PALETTE = [
  '#4ADE80', '#60A5FA', '#F87171', '#FBD24C', '#A78BFA',
  '#FB923C', '#34D399', '#F472B6', '#94A3B8', '#E879F9',
]

const LARGURAS = [
  { valor: 25,  label: '25%'  }, { valor: 33,  label: '33%'  },
  { valor: 50,  label: '50%'  }, { valor: 66,  label: '66%'  },
  { valor: 75,  label: '75%'  }, { valor: 100, label: '100%' },
]

function campoVazio(campos) {
  const novoTipo = 'texto'
  const pos = autoPos(campos, novoTipo)
  return {
    _key: Math.random().toString(36).slice(2),
    nomeCampo: '', label: '', tipo: novoTipo,
    tamanho: 100, obrigatorio: false, sequencial: false,
    campoBusca: false, valorPadrao: '', largura: 50,
    opcoes: null,
    ...pos,
  }
}

function botaoVazio(campos) {
  const pos = autoPos(campos, 'botao')
  return {
    _key: Math.random().toString(36).slice(2),
    nomeCampo: '', label: 'Ação', tipo: 'botao',
    tamanho: 0, obrigatorio: false, sequencial: false,
    campoBusca: false, valorPadrao: JSON.stringify({ fn: 'copiarTexto', param: '', variant: 'ghost' }),
    largura: 25, opcoes: null,
    ...pos,
  }
}

function divisorVazio(campos) {
  const pos = autoPos(campos, 'divisor')
  return {
    _key: Math.random().toString(36).slice(2),
    nomeCampo: '', label: '', tipo: 'divisor',
    tamanho: 0, obrigatorio: false, sequencial: false,
    campoBusca: false, valorPadrao: '', largura: 100,
    opcoes: null,
    ...pos,
  }
}

function favoritoVazio(campos) {
  const pos = autoPos(campos, 'favorito')
  return {
    _key: Math.random().toString(36).slice(2),
    nomeCampo: '_fav', label: 'Favorito', tipo: 'favorito',
    tamanho: 0, obrigatorio: false, sequencial: false,
    campoBusca: false, valorPadrao: '', largura: 50,
    opcoes: null, copiavel: false,
    ...pos, w_px: 220, h_px: 44,
  }
}

function timestampsVazio(campos) {
  const pos = autoPos(campos, 'timestamps')
  return {
    _key: Math.random().toString(36).slice(2),
    nomeCampo: '_ts', label: 'Datas', tipo: 'timestamps',
    tamanho: 0, obrigatorio: false, sequencial: false,
    campoBusca: false, valorPadrao: '', largura: 100,
    opcoes: null, copiavel: false,
    ...pos, w_px: CANVAS_W, h_px: 60,
  }
}

function copiarVazio(campos) {
  const pos = autoPos(campos, 'copiar')
  const primeiroCampo = campos.find(c => ['texto', 'texto_longo'].includes(c.tipo) && c.nomeCampo)?.nomeCampo || ''
  return {
    _key: Math.random().toString(36).slice(2),
    nomeCampo: '_cpy', label: 'Copiar', tipo: 'copiar',
    tamanho: 0, obrigatorio: false, sequencial: false,
    campoBusca: false, valorPadrao: primeiroCampo,
    largura: 25, opcoes: null, copiavel: false,
    ...pos, w_px: 140, h_px: 40,
  }
}

function lookupVazio(campos) {
  const pos = autoPos(campos, 'lookup')
  return {
    _key: Math.random().toString(36).slice(2),
    nomeCampo: '', label: '', tipo: 'lookup',
    tamanho: 0, obrigatorio: false, sequencial: false,
    campoBusca: false, valorPadrao: '', largura: 50,
    opcoes: { lookupTabela: '', lookupExibir: '', lookupCodigo: '', lookupModo: 'select' },
    ...pos,
  }
}

function pastaVazio(campos) {
  const pos = autoPos(campos, 'pasta')
  return { _key: Math.random().toString(36).slice(2), nomeCampo: '', label: 'Pasta', tipo: 'pasta', tamanho: 200, obrigatorio: false, sequencial: false, campoBusca: true, valorPadrao: '', largura: 50, opcoes: null, ...pos, w_px: 280, h_px: 48 }
}
function arquivoVazio(campos) {
  const pos = autoPos(campos, 'arquivo')
  return { _key: Math.random().toString(36).slice(2), nomeCampo: '', label: 'Arquivo', tipo: 'arquivo', tamanho: 0, obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '', largura: 100, opcoes: null, ...pos, w_px: 400, h_px: 60 }
}
function imagemVazio(campos) {
  const pos = autoPos(campos, 'imagem')
  return { _key: Math.random().toString(36).slice(2), nomeCampo: '', label: 'Imagem', tipo: 'imagem', tamanho: 0, obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '', largura: 100, opcoes: null, ...pos, w_px: 280, h_px: 180 }
}
function avaliacaoVazio(campos) {
  const pos = autoPos(campos, 'avaliacao')
  return { _key: Math.random().toString(36).slice(2), nomeCampo: '', label: 'Avaliação', tipo: 'avaliacao', tamanho: 0, obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '0', largura: 50, opcoes: { max: 5 }, ...pos, w_px: 200, h_px: 48 }
}
function progressoVazio(campos) {
  const pos = autoPos(campos, 'progresso')
  return { _key: Math.random().toString(36).slice(2), nomeCampo: '', label: 'Progresso', tipo: 'progresso', tamanho: 0, obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '0', largura: 100, opcoes: null, ...pos, w_px: 400, h_px: 52 }
}
function corVazio(campos) {
  const pos = autoPos(campos, 'cor')
  return { _key: Math.random().toString(36).slice(2), nomeCampo: '', label: 'Cor', tipo: 'cor', tamanho: 0, obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '#FF6B2B', largura: 25, opcoes: null, ...pos, w_px: 160, h_px: 48 }
}
function urlVazio(campos) {
  const pos = autoPos(campos, 'url')
  return { _key: Math.random().toString(36).slice(2), nomeCampo: '', label: 'URL', tipo: 'url', tamanho: 0, obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '', largura: 100, opcoes: null, ...pos, w_px: 400, h_px: 48 }
}
function calculoVazio(campos) {
  const pos = autoPos(campos, 'calculo')
  return { _key: Math.random().toString(36).slice(2), nomeCampo: '', label: 'Cálculo', tipo: 'calculo', tamanho: 0, obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '', largura: 50, opcoes: { formula: '' }, ...pos, w_px: 280, h_px: 48 }
}

function opcoesVazias() {
  return [
    { label: 'Opção 1', valor: 'opcao_1', cor: COR_PALETTE[0] },
    { label: 'Opção 2', valor: 'opcao_2', cor: COR_PALETTE[1] },
  ]
}

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

function TipoCampoInfo({ tipo }) {
  const info = TIPOS.find(t => t.valor === tipo)
  if (!info) return null
  return (
    <div style={{ marginTop: 4, padding: '7px 10px', background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8, boxShadow: 'var(--sh-sm)', fontSize: 11, lineHeight: 1.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontWeight: 700, color: 'var(--t1)' }}>{info.label}</span>
        <code style={{ fontFamily: 'monospace', fontSize: 10, background: 'var(--s3)', padding: '1px 6px', borderRadius: 4, color: 'var(--or)' }}>{info.pg}</code>
      </div>
      <div style={{ color: 'var(--t2)', marginBottom: 2 }}>{info.desc}</div>
      <div style={{ color: 'var(--t3)', fontSize: 10 }}><span style={{ fontWeight: 600 }}>Ex: </span>{info.ex}</div>
    </div>
  )
}

function OpcoesList({ opcoes, tipo, salvando, onChange }) {
  const [dragging, setDragging] = useState(null) // índice sendo arrastado
  const [overAt,   setOverAt]   = useState(null) // índice sob o cursor
  const listRef = useRef(null)
  const rowH    = 35 // altura estimada de cada linha (gap=5 + height=30)

  function handleMouseDown(e, idx) {
    if (e.button !== 0) return
    e.preventDefault()
    setDragging(idx)
    setOverAt(idx)

    const startY = e.clientY

    function onMouseMove(ev) {
      const delta = ev.clientY - startY
      const newIdx = Math.max(0, Math.min(opcoes.length - 1, idx + Math.round(delta / rowH)))
      setOverAt(newIdx)
    }

    function onMouseUp() {
      setDragging(prev => {
        setOverAt(over => {
          if (prev !== null && over !== null && prev !== over) {
            const novo = [...opcoes]
            const [moved] = novo.splice(prev, 1)
            novo.splice(over, 0, moved)
            onChange(novo)
          }
          return null
        })
        return null
      })
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // Reconstrói a ordem visual durante o drag
  const displayOps = (() => {
    if (dragging === null || overAt === null || dragging === overAt) return opcoes.map((op, i) => ({ op, i }))
    const arr = opcoes.map((op, i) => ({ op, i }))
    const [moved] = arr.splice(dragging, 1)
    arr.splice(overAt, 0, moved)
    return arr
  })()

  return (
    <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {displayOps.map(({ op, i: oi }, displayIdx) => {
        const isDragging = dragging === oi
        return (
          <div key={oi}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 30,
              opacity: isDragging ? 0.4 : 1,
              background: overAt === displayIdx && dragging !== null && dragging !== displayIdx ? 'var(--s3)' : 'transparent',
              borderRadius: 6,
              transition: 'background .1s',
            }}>
            <span
              onMouseDown={e => handleMouseDown(e, oi)}
              style={{ color: 'var(--t3)', fontSize: 14, cursor: 'grab', flexShrink: 0, lineHeight: 1, userSelect: 'none', padding: '0 2px' }}
              title="Arrastar para reordenar">⠿</span>
            {tipo !== 'flags' && (
              <input type="color" value={op.cor || '#888888'}
                onChange={e => { const ops = [...opcoes]; ops[oi] = { ...ops[oi], cor: e.target.value }; onChange(ops) }}
                style={{ width: 26, height: 26, border: 'none', borderRadius: 5, cursor: 'pointer', padding: 2, background: 'none' }} />
            )}
            <input className="form-input" style={{ height: 28, flex: 1, fontSize: 11 }} value={op.label} placeholder="Label"
              onChange={e => {
                const ops = [...opcoes]
                if (tipo === 'flags') ops[oi] = { ...ops[oi], label: e.target.value }
                else ops[oi] = { ...ops[oi], label: e.target.value, valor: slugify(e.target.value) || ops[oi].valor }
                onChange(ops)
              }}
              disabled={salvando} />
            <input className="form-input"
              style={{ height: 28, width: tipo === 'flags' ? 44 : 90, fontSize: tipo === 'flags' ? 13 : 10, fontFamily: 'monospace', textAlign: 'center', fontWeight: tipo === 'flags' ? 700 : 400, textTransform: tipo === 'flags' ? 'uppercase' : 'none' }}
              value={op.valor}
              placeholder={tipo === 'flags' ? 'C' : 'valor'}
              maxLength={tipo === 'flags' ? 1 : undefined}
              onChange={e => {
                const ops = [...opcoes]
                ops[oi] = { ...ops[oi], valor: tipo === 'flags' ? e.target.value.toUpperCase().slice(0, 1) : slugify(e.target.value) }
                onChange(ops)
              }}
              disabled={salvando} />
            <button className="btn btn-danger" style={{ height: 26, width: 26, padding: 0, flexShrink: 0 }}
              onClick={() => onChange(opcoes.filter((_, i) => i !== oi))}
              disabled={salvando}><Trash2 size={10} /></button>
          </div>
        )
      })}
    </div>
  )
}

// ── Templates prontos ────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'gestor_arquivos',
    label: 'Gestor de Arquivos',
    icone: 'paperclip',
    descricao: 'Tela completa para gerenciar arquivos com upload, satélites, pasta e importação em massa.',
    nomeTela: 'Gestor de Arquivos',
    canvasW: 900,
    canvasH: 620,
    campos: [
      { _key: 'k1',  nomeCampo: 'codigo',           label: 'Código',          tipo: 'codigo_auto', tamanho: 20,  obrigatorio: false, sequencial: true,  campoBusca: false, valorPadrao: '001', largura: 25,  opcoes: { seqChars: 3 }, x_pos: 14,  y_pos: 14,  w_px: 120, h_px: 60 },
      { _key: 'k2',  nomeCampo: 'nome',              label: 'Nome',            tipo: 'texto',       tamanho: 200, obrigatorio: true,  sequencial: false, campoBusca: true,  valorPadrao: '',    largura: 75,  opcoes: null,            x_pos: 148, y_pos: 14,  w_px: 492, h_px: 60 },
      { _key: 'k3',  nomeCampo: 'categoria',         label: 'Categoria',       tipo: 'select',      tamanho: 100, obrigatorio: false, sequencial: false, campoBusca: true,  valorPadrao: '',    largura: 33,  opcoes: [
        { label: 'Contrato',      valor: 'contrato',      cor: '#60A5FA' },
        { label: 'Manual',        valor: 'manual',        cor: '#34D399' },
        { label: 'Financeiro',    valor: 'financeiro',    cor: '#4ADE80' },
        { label: 'Relatório',     valor: 'relatorio',     cor: '#A78BFA' },
        { label: 'Apresentação',  valor: 'apresentacao',  cor: '#FB923C' },
        { label: 'Imagem',        valor: 'imagem',        cor: '#F472B6' },
        { label: 'Script',        valor: 'script',        cor: '#94A3B8' },
        { label: 'Outro',         valor: 'outro',         cor: '#E2E8F0' },
      ], x_pos: 656, y_pos: 14,  w_px: 230, h_px: 60 },
      { _key: 'k4',  nomeCampo: 'pasta',             label: 'Pasta',           tipo: 'pasta',       tamanho: 200, obrigatorio: false, sequencial: false, campoBusca: true,  valorPadrao: '',    largura: 50,  opcoes: null,            x_pos: 14,  y_pos: 90,  w_px: 360, h_px: 60 },
      { _key: 'k5',  nomeCampo: 'tags',              label: 'Tags',            tipo: 'tags',        tamanho: 300, obrigatorio: false, sequencial: false, campoBusca: true,  valorPadrao: '',    largura: 50,  opcoes: null,            x_pos: 388, y_pos: 90,  w_px: 498, h_px: 60 },
      { _key: 'k6',  nomeCampo: 'div1',              label: 'Arquivo',         tipo: 'divisor',     tamanho: 0,   obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: 'horizontal', largura: 100, opcoes: null, x_pos: 14,  y_pos: 165, w_px: 872, h_px: 20 },
      { _key: 'k7',  nomeCampo: 'arquivo',           label: 'Arquivo',         tipo: 'arquivo',     tamanho: 0,   obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '',    largura: 100, opcoes: null,            x_pos: 14,  y_pos: 198, w_px: 872, h_px: 100 },
      { _key: 'k8',  nomeCampo: 'arquivo_nome',      label: 'Nome do Arquivo', tipo: 'texto',       tamanho: 300, obrigatorio: false, sequencial: false, campoBusca: true,  valorPadrao: '',    largura: 50,  opcoes: null,            x_pos: 14,  y_pos: 314, w_px: 380, h_px: 60 },
      { _key: 'k9',  nomeCampo: 'arquivo_ext',       label: 'Extensão',        tipo: 'texto',       tamanho: 10,  obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '',    largura: 25,  opcoes: null,            x_pos: 408, y_pos: 314, w_px: 120, h_px: 60 },
      { _key: 'k10', nomeCampo: 'arquivo_tamanho',   label: 'Tamanho',         tipo: 'numero',      tamanho: 0,   obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '',    largura: 25,  opcoes: null,            x_pos: 542, y_pos: 314, w_px: 160, h_px: 60 },
      { _key: 'k11', nomeCampo: 'div2',              label: 'Observações',     tipo: 'divisor',     tamanho: 0,   obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: 'horizontal', largura: 100, opcoes: null, x_pos: 14,  y_pos: 390, w_px: 872, h_px: 20 },
      { _key: 'k12', nomeCampo: 'descricao',         label: 'Descrição',       tipo: 'texto_longo', tamanho: 0,   obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '',    largura: 100, opcoes: null,            x_pos: 14,  y_pos: 424, w_px: 872, h_px: 120 },
      { _key: 'k13', nomeCampo: '_fav',              label: 'Favorito',        tipo: 'favorito',    tamanho: 0,   obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '',    largura: 50,  opcoes: null,            x_pos: 14,  y_pos: 560, w_px: 220, h_px: 44 },
      { _key: 'k14', nomeCampo: '_ts',               label: 'Datas',           tipo: 'timestamps',  tamanho: 0,   obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '',    largura: 100, opcoes: null,            x_pos: 470, y_pos: 558, w_px: 416, h_px: 60 },
    ],
  },
]

function TemplateModal({ onSelecionar, onFechar }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, width: 600, maxWidth: '92vw', boxShadow: 'var(--sh-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--bd)', background: 'var(--s2)' }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)' }}>Escolher Template</span>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex' }}><X size={16} /></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TEMPLATES.map(t => (
            <div key={t.id}
              onClick={() => onSelecionar(t)}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', background: 'var(--s2)', border: '1.5px solid var(--bd)', borderRadius: 12, cursor: 'pointer', transition: 'border-color .15s, background .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--or)'; e.currentTarget.style.background = 'rgba(255,107,43,.04)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.background = 'var(--s2)' }}>
              <div style={{ width: 40, height: 40, flexShrink: 0, background: 'rgba(255,107,43,.1)', border: '1.5px solid rgba(255,107,43,.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                📎
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)', marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.5 }}>{t.descricao}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {t.campos.filter(c => !['divisor','timestamps','favorito'].includes(c.tipo)).map(c => (
                    <span key={c._key} style={{ fontSize: 9.5, fontFamily: 'monospace', background: 'var(--s3)', border: '1px solid var(--bd)', borderRadius: 4, padding: '1px 6px', color: 'var(--t2)' }}>
                      {c.nomeCampo}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--or)', fontWeight: 600, flexShrink: 0, alignSelf: 'center' }}>Usar →</div>
            </div>
          ))}
          <div style={{ padding: '10px 14px', background: 'var(--s2)', border: '1.5px dashed var(--bd)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--t3)', fontSize: 12 }}>
            <Plus size={14} /> Mais templates em breve...
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FormBuilderModal({ tela, modulos, onSalvar, onFechar, inline = false }) {
  const editando = !!tela

  const [aba,           setAba]           = useState('campos')
  const [salvando,      setSalvando]      = useState(false)
  const [erro,          setErro]          = useState(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [tipInfoIdx,    setTipInfoIdx]    = useState(null)
  const [dragHandleIdx, setDragHandleIdx] = useState(null)
  const [expandedKeys,  setExpandedKeys]  = useState(new Set())
  const [telasList,     setTelasList]     = useState([])
  const [lookupColMap,  setLookupColMap]  = useState({}) // { nomeTabela: [col1, col2, ...] }

  // Estado do designer — persiste ao trocar de aba
  const [dsLivePreview,  setDsLivePreview]  = useState(false)
  const [dsShowGrid,     setDsShowGrid]     = useState(true)
  const [dsShowRulers,   setDsShowRulers]   = useState(false)
  const [dsSnapSz,       setDsSnapSz]       = useState(8)
  const [canvasMargins,  setCanvasMargins]  = useState({ top: 0, bottom: 0, left: 0, right: 0 })

  useEffect(() => {
    window.api.formBuilder.listarTelas(true)
      .then(ts => setTelasList(ts.filter(t => !t.sistema)))
      .catch(() => {})
  }, [])

  async function carregarColunasLookup(nomeTabela) {
    if (!nomeTabela || lookupColMap[nomeTabela]) return
    try {
      const cols = await window.api.formBuilder.listarColunasTabela(nomeTabela)
      setLookupColMap(prev => ({ ...prev, [nomeTabela]: cols }))
    } catch {}
  }

  function toggleExpand(key) {
    setExpandedKeys(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }
  function addCampo(factory) {
    const novo = factory(campos)
    setCampos(p => [...p, novo])
    setExpandedKeys(prev => new Set([...prev, novo._key]))
  }

  const [nomeTela,   setNomeTela]   = useState(tela?.nome_tela   || '')
  const [nomeTabela, setNomeTabela] = useState(tela?.nome_tabela || '')
  const [descricao,  setDescricao]  = useState(tela?.descricao   || '')
  const [icone,      setIcone]      = useState(tela?.icone       || 'layout')
  const [moduloId,   setModuloId]   = useState(tela?.modulo_id   || '')
  const [ordemMenu,  setOrdemMenu]  = useState(tela?.ordem_menu  || 99)
  const [canvasW,       setCanvasW]       = useState(tela?.canvas_w       || 780)
  const [canvasH,       setCanvasH]       = useState(tela?.canvas_h       || 480)
  const [campos, setCampos] = useState(
    tela?.campos?.length
      ? tela.campos.map(c => ({
          id: c.id, _key: String(c.id),
          nomeCampo: c.nome_campo, label: c.label, tipo: c.tipo,
          tamanho: c.tamanho, obrigatorio: c.obrigatorio, sequencial: c.sequencial,
          campoBusca: c.campo_busca, valorPadrao: c.valor_padrao || '', largura: c.largura,
          x_pos: c.x_pos || 0, y_pos: c.y_pos || 0,
          w_px:  c.w_px  || 280, h_px: c.h_px  || 60,
          opcoes: c.opcoes || null, semNegrito: c.sem_negrito || false, fontSize: c.font_size || null,
          inputNegrito: c.input_negrito || false, inputFontSize: c.input_font_size || null,
        }))
      : []
  )

  const dragIdx = useRef(null)

  function onDragStart(e, idx) {
    dragIdx.current = idx
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
  }

  function onDragOver(e, idx) {
    e.preventDefault()
    const from = dragIdx.current
    if (from === null || from === idx) return
    dragIdx.current = idx
    setCampos(prev => {
      const arr = [...prev]
      const [moved] = arr.splice(from, 1)
      arr.splice(idx, 0, moved)
      return arr
    })
  }

  function onDragEnd() { dragIdx.current = null }

  function atualizarCampo(key, field, value) {
    setCampos(prev => prev.map(c => {
      if (c._key !== key) return c
      const up = { ...c, [field]: value }
      if (field === 'label' && !editando && !c._nomeManual) up.nomeCampo = slugify(value)
      if (field === 'nomeCampo') { up._nomeManual = true; up.nomeCampo = slugify(value) }
      if (field === 'tipo') {
        const hDefault = { texto_longo: 120, booleano: 44, radio: 52, tags: 60, codigo_auto: 60, imagem: 180, avaliacao: 48, progresso: 52, calculo: 48, cor: 48, url: 48 }
        up.h_px = hDefault[value] || 60
        up.w_px = value === 'texto_longo' ? CANVAS_W : (c.w_px || 280)
        if (TIPOS_COM_OPCOES.includes(value) && !c.opcoes) up.opcoes = opcoesVazias()
        if (!TIPOS_COM_OPCOES.includes(value)) up.opcoes = null
      }
      return up
    }))
  }

  const handleDesignerChange = useCallback((updater) => {
    setCampos(updater)
  }, [])

  function renderPreviewCampo(campo, fill) {
    const ops = Array.isArray(campo.opcoes) ? campo.opcoes : []
    const SKIP_LABEL = ['booleano', 'botao', 'favorito', 'timestamps']
    const NO_WRAPPER = ['botao', 'favorito', 'timestamps', 'copiar', 'divisor']

    function fieldInner() {
      if (campo.tipo === 'divisor') {
        const isVert = campo.valorPadrao === 'vertical'
        return (
          <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 16 }}>
            {isVert
              ? <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, transform: 'translateX(-50%)', background: 'var(--bd2)' }} />
              : <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, transform: 'translateY(-50%)', background: 'var(--bd2)' }} />
            }
            {campo.label && <span style={{ position: 'absolute', top: isVert ? 4 : '50%', left: isVert ? '50%' : 6, transform: isVert ? 'translateX(-50%)' : 'translateY(-50%)', fontSize: 9, fontWeight: 700, color: 'var(--t3)', background: 'var(--s1)', padding: '0 4px', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{campo.label}</span>}
          </div>
        )
      }
      if (campo.tipo === 'botao') {
        let cfg = {}
        try { cfg = JSON.parse(campo.valorPadrao || '{}') } catch {}
        return <button className={`btn btn-${cfg.variant || 'ghost'}`} disabled style={{ width: '100%', height: fill ? '100%' : 36, fontSize: 12 }}>{campo.label || 'Botão'}</button>
      }
      if (campo.tipo === 'favorito') return (
        <label className="fav-check" style={{ height: fill ? '100%' : 'auto', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
          <input type="checkbox" disabled style={{ accentColor: 'var(--or)' }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            Marcar como favorito <Star size={13} />
          </span>
        </label>
      )
      if (campo.tipo === 'timestamps') return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, height: fill ? '100%' : 'auto', alignContent: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Criado em</label>
            <div className="form-input" style={{ fontSize: 11, display: 'flex', alignItems: 'center', height: 32 }}>—</div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Atualizado em</label>
            <div className="form-input" style={{ fontSize: 11, display: 'flex', alignItems: 'center', height: 32 }}>—</div>
          </div>
        </div>
      )
      if (campo.tipo === 'copiar') return (
        <button disabled className="btn btn-ghost" style={{ width: '100%', height: fill ? '100%' : 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11 }}>
          <Copy size={11} /> {campo.label || 'Copiar'}
        </button>
      )
      if (campo.tipo === 'booleano') return (
        <label className="fav-check" style={{ height: fill ? '100%' : 'auto', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
          <input type="checkbox" disabled style={{ accentColor: 'var(--or)' }} />
          <span style={{ fontSize: 12 }}>{campo.label}</span>
        </label>
      )
      if (campo.tipo === 'texto_longo') return (
        <textarea className="form-textarea" disabled placeholder={campo.valorPadrao || 'Texto longo...'}
          style={{ width: '100%', height: fill ? '100%' : 80, minHeight: 'unset', resize: 'none', boxSizing: 'border-box', fontSize: 12 }} />
      )
      if (campo.tipo === 'select') return (
        <select className="form-select" disabled style={{ width: '100%', height: fill ? '100%' : 37, fontSize: 12 }}>
          <option>— selecione —</option>
          {ops.map((o, i) => <option key={i}>{o.label}</option>)}
        </select>
      )
      if (campo.tipo === 'radio') return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: fill ? '100%' : 37, padding: '0 12px', background: 'var(--s1)', border: '1.5px solid var(--bd)', borderRadius: 10, flexWrap: 'wrap', boxSizing: 'border-box', width: '100%' }}>
          {ops.length ? ops.map((o, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: o.cor || 'var(--t2)', fontWeight: 600, userSelect: 'none' }}>
              <input type="radio" disabled style={{ accentColor: o.cor || 'var(--or)', width: 13, height: 13 }} /> {o.label}
            </label>
          )) : <span style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>Sem opções</span>}
        </div>
      )
      if (campo.tipo === 'tags') return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: fill ? '100%' : 37, padding: '0 8px', background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8, fontSize: 11, flexWrap: 'wrap', overflow: 'hidden' }}>
          {campo.valorPadrao
            ? campo.valorPadrao.split(',').map((t, i) => <span key={i} style={{ background: 'var(--s3)', borderRadius: 4, padding: '1px 6px', color: 'var(--t2)' }}>{t.trim()}</span>)
            : <span style={{ color: 'var(--t3)' }}>tag1, tag2...</span>}
        </div>
      )
      if (campo.tipo === 'codigo_auto') return (
        <div className="form-input" style={{ display: 'flex', alignItems: 'center', height: fill ? '100%' : 37, fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--or)', letterSpacing: 2 }}>001</div>
      )
      if (campo.tipo === 'lookup') {
        const cfg = (campo.opcoes && !Array.isArray(campo.opcoes)) ? campo.opcoes : {}
        return (
          <div style={{ display: 'flex', gap: 4, height: fill ? '100%' : 37 }}>
            <div className="form-input" style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--t3)', fontStyle: 'italic' }}>
              {cfg.lookupTabela ? `← ${cfg.lookupTabela}` : '— nenhum —'}
            </div>
            <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 8px', height: '100%' }} disabled><Search size={13} /></button>
          </div>
        )
      }
      if (campo.tipo === 'data') return (
        <input className="form-input" type="date" disabled style={{ width: '100%', height: fill ? '100%' : 37 }} />
      )
      if (campo.tipo === 'cpf') return (
        <input className="form-input" disabled placeholder="000.000.000-00" style={{ width: '100%', height: fill ? '100%' : 37 }} />
      )
      if (campo.tipo === 'cnpj') return (
        <div style={{ display: 'flex', gap: 4, height: fill ? '100%' : 37 }}>
          <input className="form-input" disabled placeholder="00.000.000/0000-00" style={{ flex: 1, height: '100%' }} />
          <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 8px', height: '100%', fontSize: 11 }} disabled>Buscar</button>
        </div>
      )
      if (campo.tipo === 'cep') return (
        <div style={{ display: 'flex', gap: 4, height: fill ? '100%' : 37 }}>
          <input className="form-input" disabled placeholder="00000-000" style={{ flex: 1, height: '100%' }} />
          <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '0 8px', height: '100%', fontSize: 11 }} disabled>Buscar</button>
        </div>
      )
      if (campo.tipo === 'documento') return (
        <div style={{ display: 'flex', gap: 4, height: fill ? '100%' : 37 }}>
          <input className="form-input" disabled placeholder="000.000.000-00" style={{ flex: 1, height: '100%' }} />
          <button className="btn btn-ghost" style={{ padding: '0 9px', height: '100%' }} disabled title="Consultar"><Search size={14} /></button>
        </div>
      )
      if (campo.tipo === 'flags') return (
        <div className="form-input" style={{ display: 'flex', flexDirection: 'column', gap: 4, height: 'auto', padding: '6px 10px', minHeight: 38 }}>
          {ops.length ? ops.map((op, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--t2)' }}>
              <div style={{ width: 14, height: 14, border: '1.5px solid var(--bd2)', borderRadius: 2, flexShrink: 0 }} />
              {op.label}
              {op.valor && <span style={{ fontSize: 9, fontFamily: 'monospace', opacity: .5 }}>[{op.valor}]</span>}
            </div>
          )) : <span style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>Sem flags</span>}
        </div>
      )
      if (campo.tipo === 'pasta') return (
        <div style={{ position: 'relative', height: fill ? '100%' : 37 }}>
          <input className="form-input" disabled placeholder={campo.valorPadrao || 'Contratos, Financeiro...'} style={{ width: '100%', height: '100%' }} />
          <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 9, color: 'var(--t3)', pointerEvents: 'none' }}>▾ sugestões</span>
        </div>
      )
      if (campo.tipo === 'arquivo') return (
        <div style={{ display:'flex', alignItems:'center', gap:8, height: fill ? '100%' : 37, padding:'0 10px', background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:8, fontSize:11, color:'var(--t3)' }}>
          <span style={{ fontSize:16 }}>📎</span>
          <span style={{ flex:1, fontStyle:'italic' }}>Nenhum arquivo selecionado</span>
          <span style={{ background:'var(--s3)', border:'1px solid var(--bd)', borderRadius:5, padding:'2px 8px', fontSize:10, color:'var(--t2)', cursor:'not-allowed' }}>Escolher</span>
        </div>
      )
      if (campo.tipo === 'imagem') return (
        <div style={{ width:'100%', height: fill ? '100%' : 120, background:'var(--s2)', border:'2px dashed var(--bd)', borderRadius:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, color:'var(--t3)', fontSize:11 }}>
          <span style={{ fontSize:28 }}>🖼️</span>
          <span>Clique para selecionar imagem</span>
          <span style={{ fontSize:9, color:'var(--t3)' }}>PNG, JPG, WEBP, GIF</span>
        </div>
      )
      if (campo.tipo === 'avaliacao') {
        const max = campo.opcoes?.max || 5
        return (
          <div style={{ display:'flex', alignItems:'center', gap:4, height: fill ? '100%' : 37, padding:'0 4px' }}>
            {Array.from({ length: max }, (_, i) => (
              <span key={i} style={{ fontSize:22, color: i < 3 ? '#FBD24C' : 'var(--bd2)', cursor:'not-allowed' }}>★</span>
            ))}
            <span style={{ fontSize:10, color:'var(--t3)', marginLeft:4 }}>3/{max}</span>
          </div>
        )
      }
      if (campo.tipo === 'progresso') return (
        <div style={{ display:'flex', flexDirection:'column', gap:6, width:'100%', justifyContent:'center', height: fill ? '100%' : 52 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--t2)' }}>
            <span>{campo.label || 'Progresso'}</span><span style={{ fontWeight:700, color:'var(--or)' }}>0%</span>
          </div>
          <div style={{ height:8, background:'var(--s3)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ width:'0%', height:'100%', background:'linear-gradient(90deg, var(--or),#FF9055)', borderRadius:4 }}/>
          </div>
        </div>
      )
      if (campo.tipo === 'cor') return (
        <div style={{ display:'flex', alignItems:'center', gap:8, height: fill ? '100%' : 37 }}>
          <div style={{ width:32, height:32, borderRadius:6, background: campo.valorPadrao || '#FF6B2B', border:'2px solid var(--bd)', flexShrink:0 }}/>
          <input className="form-input" disabled value={campo.valorPadrao || '#FF6B2B'} style={{ flex:1, height:32, fontFamily:'monospace' }}/>
        </div>
      )
      if (campo.tipo === 'url') return (
        <div style={{ display:'flex', gap:4, height: fill ? '100%' : 37 }}>
          <input className="form-input" disabled placeholder="https://..." style={{ flex:1, height:'100%' }}/>
          <button className="btn btn-ghost" style={{ flexShrink:0, padding:'0 8px', height:'100%' }} disabled title="Abrir link"><ExternalLink size={13}/></button>
        </div>
      )
      if (campo.tipo === 'data_hora') return (
        <input className="form-input" type="datetime-local" disabled style={{ width:'100%', height: fill ? '100%' : 37 }}/>
      )
      if (campo.tipo === 'hora') return (
        <input className="form-input" type="time" disabled style={{ width:'100%', height: fill ? '100%' : 37 }}/>
      )
      if (campo.tipo === 'percentual') return (
        <div style={{ display:'flex', alignItems:'center', gap:4, height: fill ? '100%' : 37 }}>
          <input className="form-input" type="number" disabled placeholder="0" style={{ flex:1, height:'100%' }}/>
          <span style={{ fontSize:14, fontWeight:700, color:'var(--t2)', paddingRight:8 }}>%</span>
        </div>
      )
      if (campo.tipo === 'calculo') return (
        <div style={{ display:'flex', alignItems:'center', gap:6, height: fill ? '100%' : 37, padding:'0 10px', background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:8 }}>
          <span style={{ fontSize:12 }}>𝑓𝑥</span>
          <span style={{ fontSize:12, color:'var(--t3)', fontStyle:'italic', fontFamily:'monospace' }}>{campo.opcoes?.formula || 'fórmula não configurada'}</span>
          <span style={{ marginLeft:'auto', fontWeight:700, color:'var(--or)', fontFamily:'monospace' }}>0,00</span>
        </div>
      )
      return (
        <input className="form-input" disabled
          placeholder={campo.valorPadrao || TIPOS.find(t => t.valor === campo.tipo)?.ex?.split(',')[0] || ''}
          style={{ width: '100%', height: fill ? '100%' : 37 }} />
      )
    }

    if (NO_WRAPPER.includes(campo.tipo)) return fieldInner()
    return (
      <div className="form-group" style={{ width: '100%', height: fill ? '100%' : 'auto', padding: '0 2px', boxSizing: 'border-box', marginBottom: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {!SKIP_LABEL.includes(campo.tipo) && (
          <label className="form-label" style={{ fontWeight: campo.semNegrito ? 400 : undefined, textTransform: campo.semNegrito ? 'none' : undefined }}>
            {campo.label || campo.nomeCampo || '—'}
            {campo.obrigatorio && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
          </label>
        )}
        <div style={{ flex: fill ? 1 : 'none', minHeight: 0 }}>{fieldInner()}</div>
      </div>
    )
  }

  async function handleSalvar() {
    setErro(null)
    if (!nomeTela.trim())   return setErro('Informe o nome da tela.')
    if (!nomeTabela.trim()) return setErro('Informe o nome da tabela.')
    const TIPOS_AUTO = ['divisor', 'botao', 'favorito', 'timestamps', 'copiar']
    const camposReais = campos.filter(c => !TIPOS_AUTO.includes(c.tipo))
    if (!camposReais.length) return setErro('Adicione pelo menos um campo de dados.')
    for (const c of camposReais) {
      if (!c.label.trim())     return setErro('Há campos sem label definido.')
      if (!c.nomeCampo.trim()) return setErro(`Campo "${c.label}" sem nome de coluna.`)
    }
    const payload = {
      nomeTela, nomeTabela, descricao, icone,
      moduloId: moduloId || null, ordemMenu: ordemMenu || 99,
      canvasW: canvasW || 780, canvasH: canvasH || 480,
      colFavorito:   campos.some(c => c.tipo === 'favorito')   || (tela?.col_favorito   === true),
      colTimestamps: campos.some(c => c.tipo === 'timestamps') || (tela?.col_timestamps === true),
      campos: campos.map((c, i) => ({ ...c, ordem: i + 1 })),
    }
    setSalvando(true)
    try {
      if (editando) await window.api.formBuilder.editarTela(tela.id, payload)
      else          await window.api.formBuilder.criarTela(payload)
      onSalvar()
    } catch(e) { setErro(e.message) }
    finally    { setSalvando(false) }
  }

  function aplicarTemplate(tmpl) {
    setNomeTela(tmpl.nomeTela)
    setNomeTabela(slugify(tmpl.nomeTela) + '_001')
    setIcone(tmpl.icone || 'paperclip')
    setCanvasW(tmpl.canvasW || 900)
    setCanvasH(tmpl.canvasH || 620)
    setCampos(tmpl.campos.map(c => ({ ...c, _key: Math.random().toString(36).slice(2) })))
    setExpandedKeys(new Set())
    setShowTemplates(false)
    setAba('designer')
  }

  const secHead = { fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }

  const abas = [
    { id: 'campos',   Icon: Settings, label: 'Campos'   },
    { id: 'designer', Icon: Layout,   label: 'Design'   },
    { id: 'preview',  Icon: Eye,      label: 'Preview'  },
  ]

  // ── tipo meta (badge colorido) ────────────────────────────────────────────
  const TIPO_META = {
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
  }

  // ── Campo card ────────────────────────────────────────────────────────────
  function renderCampoCard(campo, idx) {
    const isExp = expandedKeys.has(campo._key)

    const dragWrap = {}
    const del = () => (
      <button className="btn btn-danger" style={{ height: 28, width: 28, padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={e => { e.stopPropagation(); setCampos(p => p.filter(c => c._key !== campo._key)); if (tipInfoIdx === idx) setTipInfoIdx(null) }}
        disabled={salvando}>
        <Trash2 size={13} />
      </button>
    )

    // ── DIVISOR ────────────────────────────────────────────────────────────
    if (campo.tipo === 'divisor') {
      const isVert = (campo.valorPadrao || 'horizontal') === 'vertical'
      return (
        <div key={campo._key}
          style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 10px', background: 'var(--s2)', border: '1px solid var(--bd)', borderLeft: '3px solid var(--bd2)', borderRadius: 8 }}>
          <Minus size={12} color="var(--t3)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--t3)', flexShrink: 0 }}>Divisor</span>
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            {[{ label: 'Horizontal', val: 'horizontal' }, { label: 'Vertical', val: 'vertical' }].map(({ label, val }) => {
              const active = (campo.valorPadrao || 'horizontal') === val
              return (
                <button key={val} className={`btn ${active ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ height: 22, fontSize: 10, padding: '0 8px' }}
                  onClick={() => { if (active) return; setCampos(prev => prev.map(c => { if (c._key !== campo._key) return c; const w = c.w_px||CANVAS_W, h = c.h_px||24; return { ...c, valorPadrao: val, w_px: val==='vertical'?24:Math.max(h,120), h_px: val==='vertical'?Math.max(w,120):24 } })) }}
                  disabled={salvando}>{label}</button>
              )
            })}
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
          <input className="form-input" style={{ height: 26, width: 160, fontSize: 11 }}
            value={campo.label} onChange={e => atualizarCampo(campo._key, 'label', e.target.value)}
            placeholder="Título (opcional)" disabled={salvando} />
          {del()}
        </div>
      )
    }

    // ── COPIAR ────────────────────────────────────────────────────────────
    if (campo.tipo === 'copiar') {
      const camposTexto = campos.filter(c => c._key !== campo._key && ['texto', 'texto_longo'].includes(c.tipo) && c.nomeCampo)
      return (
        <div key={campo._key}
          style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 10px', background: 'rgba(96,165,250,.05)', border: '1px solid rgba(96,165,250,.2)', borderLeft: '3px solid #60A5FA', borderRadius: 8 }}>
          <Copy size={13} color="#60A5FA" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>Campo</span>
          <select className="form-select" style={{ height: 26, fontSize: 11, flex: 1, minWidth: 0 }}
            value={campo.valorPadrao||''} onChange={e => atualizarCampo(campo._key, 'valorPadrao', e.target.value)} disabled={salvando}>
            <option value="">— selecione —</option>
            {camposTexto.map(c => <option key={c._key} value={c.nomeCampo}>{c.label||c.nomeCampo}</option>)}
          </select>
          <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>Texto</span>
          <input className="form-input" style={{ height: 26, fontSize: 11, width: 100 }}
            value={campo.label} onChange={e => atualizarCampo(campo._key, 'label', e.target.value)}
            placeholder="Copiar" disabled={salvando} />
          {del()}
        </div>
      )
    }

    // ── FAVORITO / TIMESTAMPS ─────────────────────────────────────────────
    if (campo.tipo === 'favorito' || campo.tipo === 'timestamps') {
      const isFav = campo.tipo === 'favorito'
      const Icon  = isFav ? Star : Clock
      const color = isFav ? 'var(--or)' : '#60A5FA'
      return (
        <div key={campo._key}
          style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 10px', background: isFav ? 'rgba(255,107,43,.04)' : 'rgba(96,165,250,.05)', border: `1px solid ${isFav ? 'rgba(255,107,43,.2)' : 'rgba(96,165,250,.2)'}`, borderLeft: `3px solid ${color}`, borderRadius: 8 }}>
          <Icon size={13} color={color} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{isFav ? 'Favorito' : 'Timestamps'}</span>
          <span style={{ fontSize: 10, color: 'var(--t3)' }}>— {isFav ? 'estrela de favorito' : 'criado em · atualizado em'}</span>
          <div style={{ flex: 1 }} />
          {del()}
        </div>
      )
    }

    // ── BOTÃO (accordion) ─────────────────────────────────────────────────
    if (campo.tipo === 'botao') {
      let cfg = {}
      try { cfg = JSON.parse(campo.valorPadrao || '{}') } catch {}
      const fn = cfg.fn || 'copiarTexto', param = cfg.param || '', variant = cfg.variant || 'ghost'
      const camposRef = campos.filter(c => c._key !== campo._key && !['divisor','botao'].includes(c.tipo) && c.nomeCampo)
      function updateCfg(u) { atualizarCampo(campo._key, 'valorPadrao', JSON.stringify({ ...cfg, ...u })) }
      function trocarFn(novaFn) { updateCfg({ fn: novaFn, param: novaFn === 'copiarTexto' && camposRef.length ? `{${camposRef[0].nomeCampo}}` : '' }) }
      const semParam = ['limparFormulario','exportarPDF'].includes(fn)
      const fnLabel = FUNCOES_BOTAO.find(f => f.valor === fn)?.label || fn
      const lbl = { fontSize: 9, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }
      return (
        <div key={campo._key}
          style={{ background: 'rgba(255,107,43,.04)', border: '1px solid rgba(255,107,43,.2)', borderLeft: '3px solid var(--or)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 10px', cursor: 'pointer' }}
            onClick={() => toggleExpand(campo._key)}>
            <CircleDot size={13} color="var(--or)" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{campo.label || 'Botão'}</span>
            <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>— {fnLabel}</span>
            <ChevronDown size={12} color="var(--t3)" style={{ transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
            {del()}
          </div>
          {isExp && (
            <div style={{ padding: '10px 12px 12px', borderTop: '1px solid rgba(255,107,43,.15)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ width: 120 }}>
                <label style={lbl}>Texto</label>
                <input className="form-input" style={{ height: 28, fontSize: 11 }} value={campo.label}
                  onChange={e => atualizarCampo(campo._key, 'label', e.target.value)} placeholder="Copiar, Abrir..." disabled={salvando} />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={lbl}>Ação</label>
                <select className="form-select" style={{ height: 28, fontSize: 11 }} value={fn} onChange={e => trocarFn(e.target.value)} disabled={salvando}>
                  {FUNCOES_BOTAO.map(f => <option key={f.valor} value={f.valor}>{f.label}</option>)}
                </select>
              </div>
              {fn === 'copiarTexto' && (
                <div style={{ flex: 1, minWidth: 130 }}>
                  <label style={lbl}>Campo</label>
                  {camposRef.length
                    ? <select className="form-select" style={{ height: 28, fontSize: 11 }} value={param} onChange={e => updateCfg({ param: e.target.value })} disabled={salvando}>
                        <option value="">— campo —</option>
                        {camposRef.map(c => <option key={c._key} value={`{${c.nomeCampo}}`}>{c.label||c.nomeCampo}</option>)}
                      </select>
                    : <input className="form-input" style={{ height: 28, fontSize: 11 }} value={param} onChange={e => updateCfg({ param: e.target.value })} placeholder="Adicione campos" disabled={salvando} />
                  }
                </div>
              )}
              {['mostrarAlerta','abrirTela','abrirEmNovaAba'].includes(fn) && !semParam && (
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label style={lbl}>{fn==='mostrarAlerta'?'Mensagem':fn==='abrirTela'?'Tela destino':'URL'}</label>
                  <input className="form-input" style={{ height: 28, fontSize: 11 }} value={param}
                    onChange={e => updateCfg({ param: e.target.value })}
                    placeholder={fn==='abrirEmNovaAba'?'https://...':fn==='abrirTela'?'dashboard · fb__tabela':'Mensagem'} disabled={salvando} />
                </div>
              )}
              <div style={{ width: 80 }}>
                <label style={lbl}>Estilo</label>
                <select className="form-select" style={{ height: 28, fontSize: 11 }} value={variant} onChange={e => updateCfg({ variant: e.target.value })} disabled={salvando}>
                  <option value="primary">Laranja</option>
                  <option value="ghost">Cinza</option>
                  <option value="danger">Vermelho</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )
    }

    // ── LOOKUP (accordion) ────────────────────────────────────────────────
    if (campo.tipo === 'lookup') {
      const meta = TIPO_META.lookup
      const cfg = (campo.opcoes && !Array.isArray(campo.opcoes)) ? campo.opcoes : { lookupTabela: '', lookupExibir: '', lookupCodigo: '', lookupModo: 'select' }
      const cols = lookupColMap[cfg.lookupTabela] || []
      const dbName = campo.nomeCampo ? campo.nomeCampo.replace(/_id$/, '') + '_id' : '—'
      const lbl = { fontSize: 9, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }
      function setLkp(updates) {
        setCampos(prev => prev.map(c => c._key !== campo._key ? c : { ...c, opcoes: { ...cfg, ...updates } }))
      }
      const aviso = cfg.lookupTabela && !cfg.lookupExibir
      return (
        <div key={campo._key}
          style={{ background: isExp ? 'var(--s2)' : 'var(--s1)', border: `1px solid ${aviso ? '#fb923c' : isExp ? meta.color : 'var(--bd)'}`, borderLeft: `3px solid ${aviso ? '#fb923c' : meta.color}`, borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--sh-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 10px', cursor: 'pointer' }}
            onClick={() => toggleExpand(campo._key)}>
            <span style={{ fontSize: 9, fontWeight: 700, background: meta.color + '22', color: meta.color, padding: '3px 6px', borderRadius: 5, flexShrink: 0, minWidth: 30, textAlign: 'center', border: `1px solid ${meta.color}44`, lineHeight: 1 }}>{meta.short}</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: campo.label ? 'var(--t1)' : 'var(--t3)', fontStyle: campo.label ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {campo.label || 'Lookup'}
            </span>
            <code style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--t3)', background: 'var(--s3)', padding: '2px 6px', borderRadius: 3, flexShrink: 0 }}>{dbName}</code>
            {cfg.lookupTabela
              ? <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>→ {cfg.lookupTabela}</span>
              : <span style={{ fontSize: 9, color: '#fb923c', flexShrink: 0 }}>não configurado</span>}
            <ChevronDown size={12} color="var(--t3)" style={{ transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
            {del()}
          </div>
          {isExp && (
            <div style={{ padding: '12px', borderTop: `1px solid ${meta.color}33`, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="form-group">
                  <label className="form-label">Label *</label>
                  <input className="form-input" style={{ height: 32 }} value={campo.label}
                    onChange={e => atualizarCampo(campo._key, 'label', e.target.value)} placeholder="Ex: Banco" disabled={salvando} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nome no Banco (sem _id) *</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input className="form-input" style={{ height: 32, flex: 1, fontFamily: 'monospace', fontSize: 11 }} value={campo.nomeCampo.replace(/_id$/, '')}
                      onChange={e => atualizarCampo(campo._key, 'nomeCampo', e.target.value.replace(/_id$/, ''))}
                      placeholder="banco" disabled={salvando} />
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--t3)', flexShrink: 0 }}>_id</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div className="form-group">
                  <label className="form-label">Tabela de origem *</label>
                  <select className="form-select" style={{ height: 32 }} value={cfg.lookupTabela} disabled={salvando}
                    onChange={e => { const t = e.target.value; setLkp({ lookupTabela: t, lookupExibir: '', lookupCodigo: '' }); carregarColunasLookup(t) }}>
                    <option value="">— selecione —</option>
                    {telasList.map(t => <option key={t.id} value={t.nome_tabela}>{t.nome_tela}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Campo a exibir *</label>
                  <select className="form-select" style={{ height: 32 }} value={cfg.lookupExibir} disabled={salvando || !cfg.lookupTabela}
                    onChange={e => setLkp({ lookupExibir: e.target.value })}>
                    <option value="">— selecione a tabela primeiro —</option>
                    {cols.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Campo de código (prefixo)</label>
                  <select className="form-select" style={{ height: 32 }} value={cfg.lookupCodigo || ''} disabled={salvando || !cfg.lookupTabela}
                    onChange={e => setLkp({ lookupCodigo: e.target.value || '' })}>
                    <option value="">— nenhum —</option>
                    {cols.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={lbl}>Modo de exibição</span>
                {[{ val: 'select', label: 'Select simples' }, { val: 'modal', label: 'Modal de pesquisa' }].map(m => (
                  <label key={m.val} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, cursor: 'pointer', userSelect: 'none' }}>
                    <input type="radio" name={`lkp_modo_${campo._key}`} value={m.val} checked={cfg.lookupModo === m.val}
                      onChange={() => setLkp({ lookupModo: m.val })} disabled={salvando}
                      style={{ accentColor: meta.color, cursor: 'pointer' }} />
                    {m.label}
                  </label>
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, cursor: 'pointer', userSelect: 'none', marginLeft: 16 }}>
                  <input type="checkbox" checked={!!campo.obrigatorio} onChange={e => atualizarCampo(campo._key, 'obrigatorio', e.target.checked)} disabled={salvando} style={{ accentColor: 'var(--or)' }} />
                  Obrigatório
                </label>
              </div>
              {aviso && <div style={{ fontSize: 11, color: '#fb923c', padding: '6px 10px', background: 'rgba(251,146,60,.08)', borderRadius: 6, border: '1px solid rgba(251,146,60,.25)' }}>
                ⚠ Configure a tabela e o campo a exibir antes de salvar.
              </div>}
            </div>
          )}
        </div>
      )
    }

    // ── CAMPO NORMAL (accordion) ──────────────────────────────────────────
    const meta = TIPO_META[campo.tipo] || { short: '?', color: '#94A3B8' }
    return (
      <div key={campo._key}
        style={{ background: isExp ? 'var(--s2)' : 'var(--s1)', border: `1px solid ${isExp ? 'var(--or)' : 'var(--bd)'}`, borderLeft: `3px solid ${isExp ? 'var(--or)' : meta.color}`, borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--sh-xs)', transition: 'border-color .15s, background .15s' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 10px', cursor: 'pointer' }}
          onClick={() => toggleExpand(campo._key)}>
          <span style={{ fontSize: 9, fontWeight: 700, background: meta.color + '22', color: meta.color, padding: '3px 6px', borderRadius: 5, flexShrink: 0, minWidth: 30, textAlign: 'center', border: `1px solid ${meta.color}44`, lineHeight: 1 }}>{meta.short}</span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: campo.label ? 'var(--t1)' : 'var(--t3)', fontStyle: campo.label ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {campo.label || 'Sem label'}
          </span>
          <code style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--t3)', background: 'var(--s3)', padding: '2px 6px', borderRadius: 3, flexShrink: 0 }}>{campo.nomeCampo || '—'}</code>
          {campo.obrigatorio && <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 5px', background: 'rgba(248,113,113,.12)', color: 'var(--red)', borderRadius: 3, flexShrink: 0 }}>OBR</span>}
          <ChevronDown size={12} color="var(--t3)" style={{ transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
          {del()}
        </div>
        {/* Body expandido */}
        {isExp && (
          <div style={{ padding: '12px 12px 14px', borderTop: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div className="form-group">
                <label className="form-label">Label *</label>
                <input className="form-input" style={{ height: 32 }} value={campo.label}
                  onChange={e => atualizarCampo(campo._key, 'label', e.target.value)} placeholder="Ex: Razão Social" disabled={salvando} />
              </div>
              <div className="form-group">
                <label className="form-label">Nome no Banco *</label>
                <input className="form-input" style={{ height: 32, fontFamily: 'monospace', fontSize: 11 }} value={campo.nomeCampo}
                  onChange={e => atualizarCampo(campo._key, 'nomeCampo', e.target.value)} placeholder="razao_social" disabled={salvando} />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label className="form-label" style={{ margin: 0 }}>Tipo</label>
                  <button type="button" onClick={() => setTipInfoIdx(tipInfoIdx === idx ? null : idx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: tipInfoIdx === idx ? 'var(--or)' : 'var(--t3)', display: 'flex', padding: 0 }}>
                    <Info size={11} />
                  </button>
                </div>
                <select className="form-select" style={{ height: 32 }} value={campo.tipo}
                  onChange={e => { atualizarCampo(campo._key, 'tipo', e.target.value); setTipInfoIdx(idx) }} disabled={salvando}>
                  {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
                </select>
              </div>
            </div>
            {tipInfoIdx === idx && <TipoCampoInfo tipo={campo.tipo} />}
            {campo.tipo === 'documento' && (
              <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8 }}>Vínculo Física / Jurídica</span>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 10 }}>Nome do campo radio (F/J)</label>
                  <input className="form-input" style={{ height: 28, fontSize: 11, fontFamily: 'monospace' }}
                    value={(campo.opcoes?.tipoRef) || ''}
                    onChange={e => atualizarCampo(campo._key, 'opcoes', { ...(campo.opcoes||{}), tipoRef: e.target.value.trim() })}
                    placeholder="ex: tipo_pessoa" disabled={salvando} />
                </div>
                <span style={{ fontSize: 9.5, color: 'var(--t3)', lineHeight: 1.5 }}>
                  Crie um campo <b>Radio</b> com opções <b>F</b> (Física) e <b>J</b> (Jurídica) e informe seu nome aqui. O documento adaptará a máscara e validação automaticamente.
                </span>
              </div>
            )}
            {campo.tipo === 'calculo' && (
              <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8 }}>Fórmula</span>
                <input className="form-input" style={{ height: 32, fontFamily: 'monospace', fontSize: 12 }}
                  value={campo.opcoes?.formula || ''}
                  onChange={e => atualizarCampo(campo._key, 'opcoes', { ...(campo.opcoes || {}), formula: e.target.value })}
                  placeholder="{preco} * {quantidade}" disabled={salvando} />
                <span style={{ fontSize: 9.5, color: 'var(--t3)', lineHeight: 1.5 }}>
                  Use <code style={{ fontFamily: 'monospace', background: 'var(--s3)', padding: '0 4px', borderRadius: 3 }}>{'{nome_campo}'}</code> para referenciar outros campos. Suporta <code style={{ fontFamily: 'monospace', background: 'var(--s3)', padding: '0 4px', borderRadius: 3 }}>+  -  *  /  (  )</code> e funções JS como <code style={{ fontFamily: 'monospace', background: 'var(--s3)', padding: '0 4px', borderRadius: 3 }}>Math.round()</code>.
                </span>
                <span style={{ fontSize: 9.5, color: 'var(--t3)' }}>
                  O campo não é gravado no banco — é calculado em tempo real no formulário.
                </span>
              </div>
            )}
            {campo.tipo === 'avaliacao' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap' }}>Máximo de estrelas:</span>
                <input type="number" className="form-input" min={1} max={10}
                  value={campo.opcoes?.max || 5}
                  onChange={e => atualizarCampo(campo._key, 'opcoes', { ...(campo.opcoes || {}), max: Math.max(1, Math.min(10, Number(e.target.value) || 5)) })}
                  disabled={salvando}
                  style={{ width: 56, height: 28, fontSize: 12, padding: '0 8px' }} />
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                  {Array.from({ length: campo.opcoes?.max || 5 }, () => '★').join('')}
                </span>
              </div>
            )}
            {TIPOS_COM_OPCOES.includes(campo.tipo) && (
              <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8, padding: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8 }}>
                    {campo.tipo === 'flags' ? 'Flags (Label + Código)' : 'Opções'}
                  </span>
                  <button type="button" className="btn btn-ghost" style={{ height: 22, fontSize: 10, padding: '0 8px' }}
                    onClick={() => {
                      const ops = campo.opcoes||[]
                      const n = ops.length + 1
                      const nova = campo.tipo === 'flags'
                        ? { label: `Flag ${n}`, valor: '' }
                        : { label: `Opção ${n}`, valor: `opcao_${n}`, cor: COR_PALETTE[ops.length % COR_PALETTE.length] }
                      atualizarCampo(campo._key, 'opcoes', [...ops, nova])
                    }}
                    disabled={salvando}><Plus size={10} /> {campo.tipo === 'flags' ? 'Flag' : 'Opção'}</button>
                </div>
                <OpcoesList
                  opcoes={campo.opcoes || []}
                  tipo={campo.tipo}
                  salvando={salvando}
                  onChange={ops => atualizarCampo(campo._key, 'opcoes', ops)}
                />
              </div>
            )}
            {/* ── Valor padrão + opções do campo ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Valor padrão */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Valor Padrão</label>
                {TIPOS_COM_OPCOES.includes(campo.tipo) && Array.isArray(campo.opcoes) && campo.opcoes.length > 0 ? (
                  <select className="form-select" style={{ height: 30 }} value={campo.valorPadrao || ''}
                    onChange={e => atualizarCampo(campo._key, 'valorPadrao', e.target.value)} disabled={salvando}>
                    <option value="">— nenhum —</option>
                    {campo.opcoes.map((op, i) => <option key={i} value={op.valor}>{op.label}</option>)}
                  </select>
                ) : (
                  <input className="form-input" style={{ height: 30 }} value={campo.valorPadrao}
                    onChange={e => atualizarCampo(campo._key, 'valorPadrao', e.target.value)}
                    placeholder={TIPOS.find(t => t.valor === campo.tipo)?.ex?.split(',')[0] || 'opcional'} disabled={salvando} />
                )}
              </div>

              {/* Grade de opções compacta */}
              <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>

                {/* Linha única com tudo */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', alignItems: 'center' }}>

                  {/* Checkboxes comportamento */}
                  {[
                    { key: 'obrigatorio', label: 'Obrigatório',    dis: false },
                    { key: 'campoBusca',  label: 'Campo de busca', dis: false },
                    { key: 'sequencial',  label: 'Sequencial',     dis: !!editando },
                  ].map(({ key, label, dis }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: dis ? 'not-allowed' : 'pointer', userSelect: 'none', color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                      <input type="checkbox" checked={!!campo[key]}
                        onChange={e => atualizarCampo(campo._key, key, e.target.checked)}
                        disabled={salvando || dis} style={{ accentColor: 'var(--or)', flexShrink: 0 }} />
                      {label}
                    </label>
                  ))}

                  <div style={{ width: 1, height: 14, background: 'var(--bd2)', flexShrink: 0 }} />

                  {/* Label */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer', userSelect: 'none', color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={!!campo.semNegrito}
                      onChange={e => atualizarCampo(campo._key, 'semNegrito', e.target.checked)}
                      disabled={salvando} style={{ accentColor: 'var(--or)', flexShrink: 0 }} />
                    Label s/ negrito
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                    Label px:
                    <input type="number" className="form-input" min={8} max={32}
                      value={campo.fontSize || ''}
                      onChange={e => atualizarCampo(campo._key, 'fontSize', e.target.value ? Number(e.target.value) : null)}
                      placeholder="—" disabled={salvando}
                      style={{ width: 44, height: 22, fontSize: 10, padding: '0 4px' }} />
                  </div>

                  <div style={{ width: 1, height: 14, background: 'var(--bd2)', flexShrink: 0 }} />

                  {/* Conteúdo */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer', userSelect: 'none', color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={!!campo.inputNegrito}
                      onChange={e => atualizarCampo(campo._key, 'inputNegrito', e.target.checked)}
                      disabled={salvando} style={{ accentColor: 'var(--or)', flexShrink: 0 }} />
                    Conteúdo negrito
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                    Conteúdo px:
                    <input type="number" className="form-input" min={8} max={32}
                      value={campo.inputFontSize || ''}
                      onChange={e => atualizarCampo(campo._key, 'inputFontSize', e.target.value ? Number(e.target.value) : null)}
                      placeholder="—" disabled={salvando}
                      style={{ width: 44, height: 22, fontSize: 10, padding: '0 4px' }} />
                  </div>

                  <div style={{ width: 1, height: 14, background: 'var(--bd2)', flexShrink: 0 }} />

                  {/* Métricas */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                    Largura:
                    <input type="number" className="form-input" min={10} max={100}
                      value={campo.largura || 50}
                      onChange={e => atualizarCampo(campo._key, 'largura', Math.max(10, Math.min(100, Number(e.target.value) || 50)))}
                      disabled={salvando}
                      style={{ width: 44, height: 22, fontSize: 10, padding: '0 4px' }} />
                    %
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                    BD:
                    <input type="number" className="form-input" min={1} max={5000}
                      value={campo.tamanho || 100}
                      onChange={e => atualizarCampo(campo._key, 'tamanho', Math.max(1, Number(e.target.value) || 100))}
                      disabled={salvando}
                      style={{ width: 54, height: 22, fontSize: 10, padding: '0 4px' }} />
                    chars
                  </div>

                </div>

                {/* Sequencial — linha extra só quando ativo */}
                {campo.sequencial && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--t2)' }}>
                    <span>Dígitos do código sequencial:</span>
                    <input type="number" className="form-input" min={1} max={20}
                      value={(campo.opcoes?.seqChars) || 3}
                      onChange={e => atualizarCampo(campo._key, 'opcoes', { ...(campo.opcoes || {}), seqChars: Math.max(1, Math.min(20, Number(e.target.value) || 3)) })}
                      disabled={salvando} style={{ width: 48, height: 22, fontSize: 10, padding: '0 4px' }} />
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Renderiza o painel de preview ─────────────────────────────────────────
  function renderPreview(compact = false) {
    const temLayout = campos.some(c => c.x_pos > 0 || c.y_pos > 0 || c.w_px !== 280)
    const alturaCanvas = temLayout
      ? Math.max(480, ...campos.map(c => (c.y_pos || 0) + (c.h_px || 60) + 40))
      : 'auto'

    if (compact) {
      // Preview escalado para a coluna direita
      if (temLayout) {
        const scale = 248 / CANVAS_W
        const scaledH = (typeof alturaCanvas === 'number' ? alturaCanvas : 480) * scale
        return (
          <>
            <div style={{ ...secHead, marginBottom: 8 }}>{nomeTela || 'Sem nome'}</div>
            <div style={{ border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden', height: scaledH }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: CANVAS_W, height: scaledH / scale, position: 'relative', background: 'var(--s1)' }}>
                {campos.map(campo => {
                  const x = campo.x_pos || 0, y = campo.y_pos || 0, w = campo.w_px || 280, h = campo.h_px || 60
                  return (
                    <div key={campo._key} style={{ position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box' }}>
                      {renderPreviewCampo(campo, true)}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )
      }
      return (
        <>
          <div style={{ ...secHead, marginBottom: 8 }}>{nomeTela || 'Sem nome'}</div>
          <div style={{ border: '1px solid var(--bd)', borderRadius: 8, padding: 12, background: 'var(--s1)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {campos.map(campo => (
              <div key={campo._key} style={{ width: `calc(${campo.largura}% - 5px)`, minWidth: 80, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>
                  {campo.label || campo.nomeCampo}{campo.obrigatorio && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
                </label>
                {renderPreviewCampo(campo, false)}
              </div>
            ))}
            {campos.length === 0 && <span style={{ color: 'var(--t3)', fontSize: 11 }}>Adicione campos para visualizar.</span>}
          </div>
        </>
      )
    }

    // Preview normal (aba preview do modal)
    return (
      <div>
        <div style={{ ...secHead, marginBottom: 10 }}>{nomeTela || 'Sem nome'} — Preview do Formulário</div>
        {temLayout ? (
          <div style={{ overflow: 'auto', border: '1px solid var(--bd)', borderRadius: 12 }}>
            <div style={{ position: 'relative', width: CANVAS_W, height: alturaCanvas, background: 'var(--s1)' }}>
              {campos.map(campo => {
                const x = campo.x_pos || 0, y = campo.y_pos || 0, w = campo.w_px || 280, h = campo.h_px || 60
                return (
                  <div key={campo._key} style={{ position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box' }}>
                    {renderPreviewCampo(campo, true)}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--bd)', borderRadius: 12, padding: 20, background: 'var(--s1)', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {campos.map(campo => (
              <div key={campo._key} style={{ width: `calc(${campo.largura}% - 8px)`, minWidth: 120, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', letterSpacing: .5, textTransform: 'uppercase' }}>
                  {campo.label || campo.nomeCampo || 'Campo'}{campo.obrigatorio && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
                </label>
                {renderPreviewCampo(campo, false)}
                <span style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'monospace' }}>
                  {campo.nomeCampo || '?'} · {TIPOS.find(t => t.valor === campo.tipo)?.pg}
                </span>
              </div>
            ))}
            {campos.length === 0 && <span style={{ color: 'var(--t3)', fontSize: 12 }}>Adicione campos para visualizar.</span>}
          </div>
        )}
      </div>
    )
  }

  // ── Seção de identificação (reutilizada nos dois modos) ───────────────────
  function renderIdentificacao(compact = false) {
    const h = compact ? 34 : undefined
    return (
      <div>
        <div style={secHead}>Identificação</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: compact ? 10 : 12, marginBottom: compact ? 10 : 12 }}>
          <div className="form-group">
            <label className="form-label">Nome da Tela *</label>
            <input className="form-input" style={h ? { height: h } : {}} value={nomeTela}
              onChange={e => { setNomeTela(e.target.value); if (!editando) setNomeTabela(slugify(e.target.value) ? slugify(e.target.value) + '_001' : '') }}
              placeholder="Ex: Cadastro de Fornecedores" disabled={salvando} />
          </div>
          <div className="form-group">
            <label className="form-label">Nome no Banco (tabela) *</label>
            <input className="form-input" style={{ ...(h ? { height: h } : {}), fontFamily: 'monospace', fontSize: 12, opacity: editando ? .6 : 1 }} value={nomeTabela}
              onChange={e => !editando && setNomeTabela(slugify(e.target.value))}
              placeholder="cad_fornecedores_001" disabled={editando || salvando} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr 60px' : '1fr 1fr 80px', gap: compact ? 10 : 12 }}>
          <div className="form-group">
            <label className="form-label">Módulo</label>
            <select className="form-select" style={h ? { height: h } : {}} value={moduloId} onChange={e => setModuloId(e.target.value)} disabled={salvando}>
              <option value="">— Nenhum —</option>
              {modulos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
          {!compact && (
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className="form-label" style={{ margin: 0 }}>Ícone (Lucide)</label>
                <a href="https://lucide.dev/icons/" target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--or)', textDecoration: 'none', opacity: .8 }}>
                  <ExternalLink size={10} /> ver todos
                </a>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 37, height: 37, flexShrink: 0, background: 'var(--s2)', border: '1.5px solid var(--bd)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: icone && LucideIcons[lucideName(icone)] ? 'var(--or)' : 'var(--t3)', boxShadow: 'var(--sh-xs)' }}>
                  <IconPreview name={icone} size={17} />
                </div>
                <input className="form-input" value={icone} onChange={e => setIcone(e.target.value)}
                  placeholder="terminal, database, users..." disabled={salvando} style={{ flex: 1 }} />
              </div>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Ordem</label>
            <input className="form-input" style={h ? { height: h } : {}} type="number" value={ordemMenu} onChange={e => setOrdemMenu(Number(e.target.value))} min={1} disabled={salvando} />
          </div>
        </div>
        {compact && (
          <div className="form-group" style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <label className="form-label" style={{ margin: 0 }}>Ícone (Lucide)</label>
              <a href="https://lucide.dev/icons/" target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--or)', textDecoration: 'none', opacity: .8 }}>
                <ExternalLink size={10} /> ver todos
              </a>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 34, height: 34, flexShrink: 0, background: 'var(--s2)', border: '1.5px solid var(--bd)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: icone && LucideIcons[lucideName(icone)] ? 'var(--or)' : 'var(--t3)' }}>
                <IconPreview name={icone} size={15} />
              </div>
              <input className="form-input" value={icone} onChange={e => setIcone(e.target.value)}
                placeholder="terminal, database, users..." disabled={salvando} style={{ flex: 1, height: 34 }} />
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── MODO INLINE (abas, sem backdrop) ────────────────────────────────────
  if (inline) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--s1)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--bd)', flexShrink: 0, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onFechar}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 12, padding: '4px 10px', borderRadius: 8, transition: 'var(--tr)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--t1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
          >
            <ChevronLeft size={15} /> Voltar
          </button>
          <div style={{ width: 1, height: 18, background: 'var(--bd)', flexShrink: 0 }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>
            {editando ? `Editar — ${tela.nome_tela}` : 'Nova Tela'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!editando && (
            <button className="btn btn-ghost" onClick={() => setShowTemplates(true)} style={{ height: 32, gap: 5, fontSize: 12 }}>
              <Layout size={13} /> Templates
            </button>
          )}
          {erro && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--red)' }}>
              <AlertCircle size={13} /> {erro}
            </div>
          )}
          <button className="btn btn-ghost" onClick={onFechar} disabled={salvando} style={{ height: 32 }}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSalvar} disabled={salvando} style={{ height: 32 }}>
            <Save size={13} /> {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Criar Tela'}
          </button>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--bd)', padding: '0 22px', flexShrink: 0 }}>
        {abas.map(({ id, Icon, label }) => (
          <button key={id} onClick={() => setAba(id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
            borderBottom: `2px solid ${aba === id ? 'var(--or)' : 'transparent'}`,
            padding: '9px 4px', marginRight: 20, fontSize: 12,
            color: aba === id ? 'var(--or)' : 'var(--t3)',
            cursor: 'pointer', fontWeight: aba === id ? 600 : 400, marginBottom: -1,
          }}>
            <Icon size={13} /> {label}
          </button>
        ))}
        {aba === 'designer' && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--t3)', alignSelf: 'center', paddingRight: 4 }}>
            Arraste campos • Resize pelo canto inferior direito • Clique para selecionar
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ overflowY: aba === 'designer' ? 'hidden' : 'auto', flex: 1, padding: aba === 'designer' ? 14 : '18px 22px', display: 'flex', flexDirection: 'column', gap: aba === 'designer' ? 0 : 20, minHeight: 0 }}>

        {aba === 'campos' && (
          <>
            {renderIdentificacao(false)}
            <div>
              {/* ── Toolbar de adicionar campos ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ ...secHead, marginBottom: 0 }}>Campos do Formulário</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Campos comuns */}
                  <button className="btn btn-primary" style={{ height: 30, fontSize: 11, gap: 5 }}
                    onClick={() => addCampo(campoVazio)} disabled={salvando}>
                    <Plus size={12} /> Campo
                  </button>
                  <div style={{ width: 1, height: 18, background: 'var(--bd)', margin: '0 2px' }} />
                  {/* Especiais */}
                  <button className="btn btn-ghost" style={{ height: 30, fontSize: 11, opacity: campos.some(c => c.tipo === 'favorito') ? .4 : 1 }}
                    onClick={() => setCampos(p => [...p, favoritoVazio(p)])} disabled={salvando || campos.some(c => c.tipo === 'favorito')} title="Marcar como favorito">
                    <Star size={12} /> Favorito
                  </button>
                  <button className="btn btn-ghost" style={{ height: 30, fontSize: 11, opacity: campos.some(c => c.tipo === 'timestamps') ? .4 : 1 }}
                    onClick={() => setCampos(p => [...p, timestampsVazio(p)])} disabled={salvando || campos.some(c => c.tipo === 'timestamps')} title="Criado em / Atualizado em">
                    <Clock size={12} /> Datas
                  </button>
                  <button className="btn btn-ghost" style={{ height: 30, fontSize: 11 }}
                    onClick={() => addCampo(lookupVazio)} disabled={salvando} title="Referência a outra tabela">
                    <ExternalLink size={12} /> Lookup
                  </button>
                  <button className="btn btn-ghost" style={{ height: 30, fontSize: 11 }}
                    onClick={() => addCampo(botaoVazio)} disabled={salvando} title="Botão de ação">
                    <CircleDot size={12} /> Botão
                  </button>
                  <button className="btn btn-ghost" style={{ height: 30, fontSize: 11 }}
                    onClick={() => setCampos(p => [...p, copiarVazio(p)])} disabled={salvando} title="Botão copiar texto">
                    <Copy size={12} /> Copiar
                  </button>
                  <button className="btn btn-ghost" style={{ height: 30, fontSize: 11 }}
                    onClick={() => setCampos(p => [...p, divisorVazio(p)])} disabled={salvando} title="Linha divisória">
                    <Minus size={12} /> Divisor
                  </button>
                  <div style={{ width: 1, height: 18, background: 'var(--bd)', margin: '0 2px' }} />
                  {/* Componentes especiais */}
                  <button className="btn btn-ghost" style={{ height: 30, fontSize: 11 }}
                    onClick={() => addCampo(pastaVazio)} disabled={salvando} title="Campo com autocomplete de valores existentes">
                    📁 Pasta
                  </button>
                  <button className="btn btn-ghost" style={{ height: 30, fontSize: 11 }}
                    onClick={() => addCampo(arquivoVazio)} disabled={salvando} title="Upload de arquivo">
                    📎 Arquivo
                  </button>
                  <button className="btn btn-ghost" style={{ height: 30, fontSize: 11 }}
                    onClick={() => addCampo(imagemVazio)} disabled={salvando} title="Upload de imagem com preview">
                    🖼️ Imagem
                  </button>
                  <button className="btn btn-ghost" style={{ height: 30, fontSize: 11 }}
                    onClick={() => addCampo(avaliacaoVazio)} disabled={salvando} title="Avaliação em estrelas">
                    ★ Avaliação
                  </button>
                  <button className="btn btn-ghost" style={{ height: 30, fontSize: 11 }}
                    onClick={() => addCampo(progressoVazio)} disabled={salvando} title="Barra de progresso">
                    ▓ Progresso
                  </button>
                  <button className="btn btn-ghost" style={{ height: 30, fontSize: 11 }}
                    onClick={() => addCampo(corVazio)} disabled={salvando} title="Seletor de cor HEX">
                    🎨 Cor
                  </button>
                  <button className="btn btn-ghost" style={{ height: 30, fontSize: 11 }}
                    onClick={() => addCampo(urlVazio)} disabled={salvando} title="URL com botão de abrir">
                    <ExternalLink size={12} /> URL
                  </button>
                  <button className="btn btn-ghost" style={{ height: 30, fontSize: 11 }}
                    onClick={() => addCampo(calculoVazio)} disabled={salvando} title="Campo calculado por fórmula">
                    𝑓𝑥 Cálculo
                  </button>
                </div>
              </div>

              {/* ── Hint ── */}
              <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'var(--s2)', borderRadius: 6, border: '1px solid var(--bd)' }}>
                Use a aba <strong style={{ color: 'var(--or)' }}>Designer</strong> para posicionar e dimensionar os campos visualmente
                <span style={{ marginLeft: 'auto', fontFamily: 'monospace', color: 'var(--t3)' }}>
                  id · ativo{campos.some(c => c.tipo === 'timestamps') ? ' · criado_em · alterado_em' : ''}{campos.some(c => c.tipo === 'favorito') ? ' · favorito' : ''}
                </span>
              </div>

              {/* ── Lista de campos ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {campos.map((campo, idx) => renderCampoCard(campo, idx))}
                {campos.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 32px', color: 'var(--t3)', fontSize: 12, background: 'var(--s2)', borderRadius: 10, border: '2px dashed var(--bd)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Plus size={22} style={{ opacity: .3 }} />
                    Nenhum campo adicionado ainda.
                    <span style={{ fontSize: 11 }}>Clique em <strong style={{ color: 'var(--or)' }}>+ Campo</strong> para começar.</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {aba === 'designer' && (
          <FormDesigner
            campos={campos}
            onChange={handleDesignerChange}
            canvasConfigW={canvasW}
            canvasConfigH={canvasH}
            onCanvasConfig={(w, h) => { setCanvasW(w); setCanvasH(h) }}
            livePreview={dsLivePreview}   onLivePreview={setDsLivePreview}
            showGrid={dsShowGrid}         onShowGrid={setDsShowGrid}
            showRulers={dsShowRulers}     onShowRulers={setDsShowRulers}
            snapSz={dsSnapSz}             onSnapSz={setDsSnapSz}
            canvasMargins={canvasMargins} onCanvasMargins={setCanvasMargins}
          />
        )}

        {aba === 'preview' && renderPreview(false)}

      </div>
      {showTemplates && <TemplateModal onSelecionar={aplicarTemplate} onFechar={() => setShowTemplates(false)} />}
    </div>
  )

  // ── MODO MODAL (existente) ────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={{
        background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16,
        width: aba === 'designer' ? '96vw' : '100%',
        maxWidth: aba === 'designer' ? 1200 : 900,
        height: aba === 'designer' ? '90vh' : 'auto',
        maxHeight: aba === 'designer' ? '90vh' : '92vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--sh-lg)',
        transition: 'max-width .2s, width .2s',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderBottom: '1px solid var(--bd)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>
              {editando ? `Editar: ${tela.nome_tela}` : 'Nova Tela'}
            </div>
            {!editando && (
              <button className="btn btn-ghost" onClick={() => setShowTemplates(true)} style={{ height: 30, gap: 5, fontSize: 11 }}>
                <Layout size={12} /> Templates
              </button>
            )}
          </div>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex' }}><X size={18} /></button>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--bd)', padding: '0 22px', flexShrink: 0 }}>
          {abas.map(({ id, Icon, label }) => (
            <button key={id} onClick={() => setAba(id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
              borderBottom: `2px solid ${aba === id ? 'var(--or)' : 'transparent'}`,
              padding: '9px 4px', marginRight: 20, fontSize: 12,
              color: aba === id ? 'var(--or)' : 'var(--t3)',
              cursor: 'pointer', fontWeight: aba === id ? 600 : 400, marginBottom: -1,
            }}>
              <Icon size={13} /> {label}
            </button>
          ))}
          {aba === 'designer' && (
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--t3)', alignSelf: 'center', paddingRight: 4 }}>
              Arraste campos • Resize pelo canto inferior direito • Clique para selecionar
            </span>
          )}
        </div>

        {/* Body */}
        <div style={{ overflowY: aba === 'designer' ? 'hidden' : 'auto', flex: 1, padding: aba === 'designer' ? 14 : '18px 22px', display: 'flex', flexDirection: 'column', gap: aba === 'designer' ? 0 : 20, minHeight: 0 }}>

          {/* ── ABA: CAMPOS ── */}
          {aba === 'campos' && (
            <>
              {renderIdentificacao(false)}

              {/* Lista de campos */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={secHead}>Campos do Formulário</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }} disabled={salvando || campos.some(c => c.tipo === 'favorito')}
                      onClick={() => setCampos(p => [...p, favoritoVazio(p)])}>
                      <Star size={12} /> Favorito
                    </button>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }} disabled={salvando || campos.some(c => c.tipo === 'timestamps')}
                      onClick={() => setCampos(p => [...p, timestampsVazio(p)])}>
                      <Clock size={12} /> Datas
                    </button>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }}
                      onClick={() => setCampos(p => [...p, divisorVazio(p)])} disabled={salvando}>
                      <Minus size={12} /> Divisor
                    </button>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }}
                      onClick={() => addCampo(botaoVazio)} disabled={salvando}>
                      <CircleDot size={12} /> Botão
                    </button>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }}
                      onClick={() => addCampo(lookupVazio)} disabled={salvando}>
                      <ExternalLink size={12} /> Lookup
                    </button>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }}
                      onClick={() => addCampo(campoVazio)} disabled={salvando}>
                      <Plus size={12} /> Campo
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 8 }}>
                  Use a aba <strong style={{ color: 'var(--or)' }}>Designer</strong> para posicionar e dimensionar os campos visualmente
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {campos.map((campo, idx) => renderCampoCard(campo, idx))}
                  {campos.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)', fontSize: 12, background: 'var(--s2)', borderRadius: 10, border: '1px dashed var(--bd)' }}>
                      Nenhum campo adicionado. Clique em <strong>+ Adicionar Campo</strong>.
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 8, padding: '12px 14px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bd)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Elementos especiais</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }} disabled={salvando || campos.some(c => c.tipo === 'favorito')}
                      onClick={() => setCampos(p => [...p, favoritoVazio(p)])}>
                      <Star size={12} /> Favorito
                    </button>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 11 }} disabled={salvando || campos.some(c => c.tipo === 'timestamps')}
                      onClick={() => setCampos(p => [...p, timestampsVazio(p)])}>
                      <Clock size={12} /> Datas
                    </button>
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'monospace' }}>
                    Sempre incluídas: <span style={{ color: 'var(--t2)' }}>
                      id · ativo{campos.some(c => c.tipo === 'timestamps') ? ' · criado_em · alterado_em' : ''}{campos.some(c => c.tipo === 'favorito') ? ' · favorito' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── ABA: DESIGNER ── */}
          {aba === 'designer' && (
            <FormDesigner
              campos={campos}
              onChange={handleDesignerChange}
              canvasConfigW={canvasW}
              canvasConfigH={canvasH}
              onCanvasConfig={(w, h) => { setCanvasW(w); setCanvasH(h) }}
            />
          )}

          {/* ── ABA: PREVIEW ── */}
          {aba === 'preview' && renderPreview(false)}

        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 22px', borderTop: '1px solid var(--bd)', flexShrink: 0, background: 'var(--s1)', gap: 12 }}>
          <div>
            {erro && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--red)' }}><AlertCircle size={13} /> {erro}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onFechar} disabled={salvando}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSalvar} disabled={salvando}>
              <Save size={13} /> {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Criar Tela'}
            </button>
          </div>
        </div>

      </div>
      {showTemplates && <TemplateModal onSelecionar={aplicarTemplate} onFechar={() => setShowTemplates(false)} />}
    </div>
  )
}
