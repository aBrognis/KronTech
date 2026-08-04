import { useState } from 'react'

// Encapsula os handlers de arquivo/pasta da aba Cadastro: abrir, copiar
// (local/clipboard), importar pasta em lote, preencher campos satélites
// e configurar a pasta padrão de import.
export function useFormBuilderArquivos({ tela, nomeTabela, form, setForm, setErro, pagina, busca, carregar, setAllItems, setPastaConfig }) {
  const [copiado, setCopiado] = useState(null)
  const [importando, setImportando] = useState(false)
  const [importProg, setImportProg] = useState(null)

  async function handleAbrirArquivo(meta) {
    const r = await window.api.arquivos.abrir(meta.path)
    if (!r.ok) setErro(r.erro || 'Não foi possível abrir o arquivo.')
  }

  async function handleCopiarLocal(meta) {
    const r = await window.api.arquivos.copiarLocal(meta.path, meta.nome)
    if (!r.ok) { setErro(r.erro || 'Não foi possível copiar.'); return }
    setCopiado('local')
    setTimeout(() => setCopiado(null), 2500)
    if (confirm(`Arquivo copiado para:\n${r.destino}\n\nAbrir a pasta?`)) {
      const pasta = r.destino.substring(0, r.destino.lastIndexOf('\\'))
      await window.api.arquivos.abrirPasta(pasta)
    }
  }

  async function handleCopiarClipboard(meta) {
    const r = await window.api.arquivos.copiarClipboard(meta.path)
    if (!r.ok) { setErro(r.erro || 'Não foi possível copiar.'); return }
    setCopiado('clip')
    setTimeout(() => setCopiado(null), 2000)
  }

  async function handleImportarPasta() {
    setImportando(true)
    setImportProg({ fase: 'escaneando', atual: 0, total: 0, arquivo: 'Iniciando...', inseridos: 0, ignorados: 0 })

    let unsubFn = null
    function finalizar(prog) {
      if (unsubFn) { unsubFn(); unsubFn = null }
      setImportando(false)
      if (prog?.fase === 'concluido') { carregar(tela, pagina, busca, null); setAllItems([]) }
      if (prog?.erro) setErro(prog.erro)
    }

    unsubFn = window.api.arquivos.onProgresso(prog => {
      setImportProg(prog)
      if (['concluido', 'cancelado', 'erro'].includes(prog.fase)) finalizar(prog)
    })

    try {
      const camposAtivos = tela?.campos?.filter(c => c.ativo) || []
      const campoArq = camposAtivos.find(c => c.tipo === 'arquivo')
      const hasTs    = tela?.col_timestamps !== false

      if (!campoArq) { finalizar({ fase: 'erro', erro: 'Nenhum campo do tipo arquivo nesta tela.' }); return }

      const pref = campoArq.nome_campo
      const mapeamento = { arquivo: pref }
      if (camposAtivos.find(c => c.nome_campo === pref + '_nome'))    mapeamento.nome    = pref + '_nome'
      if (camposAtivos.find(c => c.nome_campo === pref + '_ext'))     mapeamento.ext     = pref + '_ext'
      if (camposAtivos.find(c => c.nome_campo === pref + '_tamanho')) mapeamento.tamanho = pref + '_tamanho'
      if (camposAtivos.find(c => c.nome_campo === pref + '_path'))    mapeamento.path    = pref + '_path'
      // campo "nome" genérico — recebe o basename sem extensão como título
      // sempre mapeado independente de arquivo_nome existir (são colunas separadas)
      if (camposAtivos.find(c => c.nome_campo === 'nome' && c.tipo === 'texto'))
        mapeamento.nomeGenerico = 'nome'
      const campoPasta = camposAtivos.find(c => c.tipo === 'pasta')
      if (campoPasta) mapeamento.pasta = campoPasta.nome_campo
      const campoCod = camposAtivos.find(c => c.tipo === 'codigo_auto' || c.sequencial)
      const seqChars = campoCod?.opcoes?.seqChars || 3
      if (campoCod) mapeamento.codigo = campoCod.nome_campo

      if (typeof window.api.formBuilder.importarPasta !== 'function') {
        finalizar({ fase: 'erro', erro: 'Função não disponível — reinicie o aplicativo.' })
        return
      }
      const res = await window.api.formBuilder.importarPasta({ tbl: nomeTabela, mapeamento, hasTs, seqChars })
      if (!res?.ok || res?.cancelado) finalizar(res?.cancelado ? { fase: 'cancelado' } : { fase: 'erro', erro: res?.erro })
    } catch (e) {
      finalizar({ fase: 'erro', erro: e.message })
    }
  }

  // Preenche campos satélites de arquivo: {nome}_nome, {nome}_ext, {nome}_tamanho, {nome}_path
  function setArquivoComSatellites(nomeCampo, meta) {
    setForm(f => {
      const up = { ...f }
      if (meta) {
        up[nomeCampo] = JSON.stringify({ path: meta.path, nome: meta.nome, ext: meta.ext, tamanho: meta.tamanho })
        // preenche campos satélites se existirem na tela
        if (tela?.campos.find(c => c.nome_campo === nomeCampo + '_nome'))     up[nomeCampo + '_nome']     = meta.nome
        if (tela?.campos.find(c => c.nome_campo === nomeCampo + '_ext'))      up[nomeCampo + '_ext']      = meta.ext || ''
        if (tela?.campos.find(c => c.nome_campo === nomeCampo + '_tamanho'))  up[nomeCampo + '_tamanho']  = meta.tamanho || 0
        if (tela?.campos.find(c => c.nome_campo === nomeCampo + '_path'))     up[nomeCampo + '_path']     = meta.path
      } else {
        up[nomeCampo] = ''
        if (tela?.campos.find(c => c.nome_campo === nomeCampo + '_nome'))     up[nomeCampo + '_nome']     = ''
        if (tela?.campos.find(c => c.nome_campo === nomeCampo + '_ext'))      up[nomeCampo + '_ext']      = ''
        if (tela?.campos.find(c => c.nome_campo === nomeCampo + '_tamanho'))  up[nomeCampo + '_tamanho']  = 0
        if (tela?.campos.find(c => c.nome_campo === nomeCampo + '_path'))     up[nomeCampo + '_path']     = ''
      }
      return up
    })
  }

  async function handleConfigurarPasta() {
    const res = await window.api.config.selecionarPasta()
    if (res.ok && res.data) setPastaConfig(res.data)
  }

  return {
    copiado, importando, importProg, setImportando,
    handleAbrirArquivo, handleCopiarLocal, handleCopiarClipboard,
    handleImportarPasta, setArquivoComSatellites, handleConfigurarPasta,
  }
}
