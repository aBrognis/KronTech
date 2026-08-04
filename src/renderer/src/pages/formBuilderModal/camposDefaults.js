import { autoPos, CANVAS_W } from '../../components/FormDesigner'
import { COR_PALETTE } from './constants.js'

export function campoVazio(campos) {
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

export function botaoVazio(campos) {
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

export function divisorVazio(campos) {
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

export function favoritoVazio(campos) {
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

export function timestampsVazio(campos) {
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

export function copiarVazio(campos) {
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

export function lookupVazio(campos) {
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

export function pastaVazio(campos) {
  const pos = autoPos(campos, 'pasta')
  return { _key: Math.random().toString(36).slice(2), nomeCampo: '', label: 'Pasta', tipo: 'pasta', tamanho: 200, obrigatorio: false, sequencial: false, campoBusca: true, valorPadrao: '', largura: 50, opcoes: null, ...pos, w_px: 280, h_px: 48 }
}
export function arquivoVazio(campos) {
  const pos = autoPos(campos, 'arquivo')
  return { _key: Math.random().toString(36).slice(2), nomeCampo: '', label: 'Arquivo', tipo: 'arquivo', tamanho: 0, obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '', largura: 100, opcoes: null, ...pos, w_px: 400, h_px: 60 }
}
export function imagemVazio(campos) {
  const pos = autoPos(campos, 'imagem')
  return { _key: Math.random().toString(36).slice(2), nomeCampo: '', label: 'Imagem', tipo: 'imagem', tamanho: 0, obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '', largura: 100, opcoes: null, ...pos, w_px: 280, h_px: 180 }
}
export function avaliacaoVazio(campos) {
  const pos = autoPos(campos, 'avaliacao')
  return { _key: Math.random().toString(36).slice(2), nomeCampo: '', label: 'Avaliação', tipo: 'avaliacao', tamanho: 0, obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '0', largura: 50, opcoes: { max: 5 }, ...pos, w_px: 200, h_px: 48 }
}
export function progressoVazio(campos) {
  const pos = autoPos(campos, 'progresso')
  return { _key: Math.random().toString(36).slice(2), nomeCampo: '', label: 'Progresso', tipo: 'progresso', tamanho: 0, obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '0', largura: 100, opcoes: null, ...pos, w_px: 400, h_px: 52 }
}
export function corVazio(campos) {
  const pos = autoPos(campos, 'cor')
  return { _key: Math.random().toString(36).slice(2), nomeCampo: '', label: 'Cor', tipo: 'cor', tamanho: 0, obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '#FF6B2B', largura: 25, opcoes: null, ...pos, w_px: 160, h_px: 48 }
}
export function urlVazio(campos) {
  const pos = autoPos(campos, 'url')
  return { _key: Math.random().toString(36).slice(2), nomeCampo: '', label: 'URL', tipo: 'url', tamanho: 0, obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '', largura: 100, opcoes: null, ...pos, w_px: 400, h_px: 48 }
}
export function calculoVazio(campos) {
  const pos = autoPos(campos, 'calculo')
  return { _key: Math.random().toString(36).slice(2), nomeCampo: '', label: 'Cálculo', tipo: 'calculo', tamanho: 0, obrigatorio: false, sequencial: false, campoBusca: false, valorPadrao: '', largura: 50, opcoes: { formula: '' }, ...pos, w_px: 280, h_px: 48 }
}

export function opcoesVazias() {
  return [
    { label: 'Opção 1', valor: 'opcao_1', cor: COR_PALETTE[0] },
    { label: 'Opção 2', valor: 'opcao_2', cor: COR_PALETTE[1] },
  ]
}

export function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}
