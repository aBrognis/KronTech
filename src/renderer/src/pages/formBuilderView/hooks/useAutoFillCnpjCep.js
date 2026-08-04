import { useState } from 'react'
import { maskCEPStr } from '../../../lib/utils/masks.js'
import { validarCNPJ } from '../../../lib/utils/validators.js'

// Encapsula a busca automática de dados de CNPJ/CEP (API entidade) e o
// preenchimento dos campos do form correspondentes.
export function useAutoFillCnpjCep({ form, setForm }) {
  const [docLoading, setDocLoading] = useState({}) // { nome_campo: true/false }
  const [docErro,    setDocErro]    = useState({}) // { nome_campo: 'mensagem' }

  // Mapeamento direto: nome_campo → valor extraído da API
  function buildCnpjUpdates(data, formKeys) {
    const set = new Set(formKeys)
    const up = {}
    const try_ = (campo, val) => { if (set.has(campo) && val != null && val !== '') up[campo] = String(val) }
    // nome principal (razão social)
    try_('nome',         data.razao_social)
    try_('razao_social', data.razao_social)
    // nome fantasia / apelido
    try_('apelido',      data.nome_fantasia || data.razao_social)
    try_('nome_fantasia',data.nome_fantasia || data.razao_social)
    // endereço
    try_('logradouro',   data.logradouro)
    try_('numero',       data.numero)
    try_('complemento',  data.complemento)
    try_('bairro',       data.bairro)
    try_('municipio',    data.municipio)
    try_('cidade',       data.municipio)
    try_('uf',           data.uf)
    try_('cep',          maskCEPStr(data.cep || ''))
    // contato
    try_('telefone',     data.ddd_telefone_1)
    try_('fone',         data.ddd_telefone_1)
    try_('celular',      data.ddd_telefone_2)
    try_('email',        data.email)
    // outros
    try_('situacao',     data.descricao_situacao_cadastral)
    try_('cnae',         data.cnae_fiscal_descricao)
    try_('natureza',     data.natureza_juridica)
    try_('natureza_juridica', data.natureza_juridica)
    try_('porte',        data.porte)
    // ie/rg limpa ao buscar PJ
    try_('ie_rg',        '')
    try_('ie',           '')
    return up
  }

  function buildCepUpdates(data, formKeys) {
    const set = new Set(formKeys)
    const up = {}
    const try_ = (campo, val) => { if (set.has(campo) && val != null && val !== '') up[campo] = String(val) }
    try_('logradouro',  data.logradouro)
    try_('endereco',    data.logradouro)
    try_('rua',         data.logradouro)
    try_('complemento', data.complemento)
    try_('bairro',      data.bairro)
    try_('municipio',   data.localidade)
    try_('cidade',      data.localidade)
    try_('uf',          data.uf)
    try_('ibge',        data.ibge)
    try_('ddd',         data.ddd)
    return up
  }

  function autoFill(data, buildFn) {
    setForm(f => ({ ...f, ...buildFn(data, Object.keys(f)) }))
  }

  async function buscarCNPJ(campo, valOverride) {
    const val = valOverride ?? form[campo.nome_campo] ?? ''
    const digits = val.replace(/\D/g,'')
    if (digits.length !== 14) return
    if (!validarCNPJ(val)) {
      setDocErro(e => ({ ...e, [campo.nome_campo]: 'CNPJ inválido.' }))
      return
    }
    setDocErro(e => ({ ...e, [campo.nome_campo]: null }))
    setDocLoading(l => ({ ...l, [campo.nome_campo]: true }))
    try {
      const res = await window.api.entidade.buscarCnpj(digits)
      if (!res.ok) { setDocErro(e => ({ ...e, [campo.nome_campo]: res.erro })); return }
      setForm(f => ({ ...f, ...buildCnpjUpdates(res.data, Object.keys(f)) }))
    } finally {
      setDocLoading(l => ({ ...l, [campo.nome_campo]: false }))
    }
  }

  async function buscarCEP(campo) {
    const val = form[campo.nome_campo] || ''
    const digits = val.replace(/\D/g,'')
    if (digits.length !== 8) return
    setDocErro(e => ({ ...e, [campo.nome_campo]: null }))
    setDocLoading(l => ({ ...l, [campo.nome_campo]: true }))
    try {
      const res = await window.api.entidade.buscarCep(digits)
      if (!res.ok) { setDocErro(e => ({ ...e, [campo.nome_campo]: res.erro })); return }
      autoFill(res.data, buildCepUpdates)
    } finally {
      setDocLoading(l => ({ ...l, [campo.nome_campo]: false }))
    }
  }

  return { docLoading, docErro, setDocErro, buscarCNPJ, buscarCEP }
}
