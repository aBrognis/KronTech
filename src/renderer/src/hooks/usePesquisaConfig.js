import { useState, useEffect } from 'react'

// Carrega a configuração de uma pesquisa (kr_pesquisas) uma vez, para
// alimentar as props campos/colunasExibidas/campoInicial/mostrarFavorito
// de um SeletorBusca — o SQL/colunas passam a ser editáveis via tela
// "Monta Pesquisa" no Designer em vez de hardcoded no componente.
export default function usePesquisaConfig(codigo) {
  const [config, setConfig] = useState(null)

  useEffect(() => {
    let ativo = true
    window.api.pesquisa.obter(codigo).then(res => {
      if (ativo && res.ok) setConfig(res.data)
    })
    return () => { ativo = false }
  }, [codigo])

  async function onBuscar(campo, modo, busca, ordenar, direcao) {
    const res = await window.api.pesquisa.executar(codigo, { campo, modo, busca, ordenar, direcao })
    if (!res.ok) throw new Error(res.erro)
    return res.data
  }

  return {
    campos: config?.colunas_exibidas || [],
    colunasExibidas: config?.colunas_exibidas || [],
    campoInicial: config?.campo_busca || '',
    mostrarFavorito: !!config?.mostrar_favorito,
    titulo: config?.nome || '',
    tabela: config?.tabela || '',
    onBuscar,
  }
}
