import { useState, useRef } from 'react'
import { CANVAS_W } from '../../components/FormDesigner'
import { TIPOS_COM_OPCOES } from './constants.js'
import { opcoesVazias, slugify } from './camposDefaults.js'

// Encapsula o array `campos` do FormBuilderModal e suas mutações diretas:
// adicionar campo (via factory), atualizar propriedade, e reordenar por
// drag&drop na lista de campos. Não inclui handleSalvar/aplicarTemplate
// nem renderPreviewCampo; essas funções dependem de vários outros states
// do componente (nomeTela, tela, onSalvar, etc.) e não têm fronteira clara
// com o estado de campos isoladamente.
export function useFormBuilderCampos(telaInicial, editando) {
  const [campos, setCampos] = useState(
    telaInicial?.campos?.length
      ? telaInicial.campos.map(c => ({
          id: c.id, _key: String(c.id),
          nomeCampo: c.nome_campo, label: c.label, tipo: c.tipo,
          tamanho: c.tamanho, obrigatorio: c.obrigatorio, sequencial: c.sequencial,
          campoBusca: c.campo_busca, valorPadrao: c.valor_padrao || '', largura: c.largura,
          x_pos: c.x_pos || 0, y_pos: c.y_pos || 0,
          w_px:  c.w_px  || 280, h_px: c.h_px  || 60,
          opcoes: c.opcoes || null, semNegrito: c.sem_negrito || false, fontSize: c.font_size || null,
          inputNegrito: c.input_negrito || false, inputFontSize: c.input_font_size || null,
          labelCor: c.label_cor || null, inputAlign: c.input_align || null,
          inputCor: c.input_cor || null, inputBg: c.input_bg || null,
          borderRadius: c.border_radius ?? null, borderWidth: c.border_width ?? null, borderColor: c.border_color || null,
          opcoesLayout: c.opcoes_layout || null,
        }))
      : []
  )

  const dragIdx = useRef(null)

  function addCampo(factory, onAdded) {
    const novo = factory(campos)
    setCampos(p => [...p, novo])
    onAdded?.(novo._key)
    return novo
  }

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
        const hDefault = { texto_longo: 120, booleano: 44, radio: 56, tags: 56, codigo_auto: 56, imagem: 180, avaliacao: 56, progresso: 56, calculo: 56, cor: 56, url: 56 }
        up.h_px = hDefault[value] || 56
        up.w_px = value === 'texto_longo' ? CANVAS_W : (c.w_px || 280)
        if (TIPOS_COM_OPCOES.includes(value) && !c.opcoes) up.opcoes = opcoesVazias()
        if (!TIPOS_COM_OPCOES.includes(value)) up.opcoes = null
      }
      if (field === 'opcoes' && Array.isArray(value) && (c.tipo === 'flags' || c.tipo === 'radio')) {
        // header(28) + padding(20) + per-item(26) * n + bottom-padding(8)
        up.h_px = Math.max(56, 28 + 20 + value.length * 26 + 8)
      }
      return up
    }))
  }

  return { campos, setCampos, addCampo, atualizarCampo, onDragStart, onDragOver, onDragEnd }
}
