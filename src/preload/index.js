import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  win: {
    minimize:    () => ipcRenderer.invoke('win:minimize'),
    maximize:    () => ipcRenderer.invoke('win:maximize'),
    close:       () => ipcRenderer.invoke('win:close'),
    isMaximized: () => ipcRenderer.invoke('win:isMaximized'),
  },
  sql: {
    execute:    (query)          => ipcRenderer.invoke('sql:execute', query),
    getTables:  ()               => ipcRenderer.invoke('sql:getTables'),
    getColumns: (table)          => ipcRenderer.invoke('sql:getColumns', table),
    getIndexes: (table)          => ipcRenderer.invoke('sql:getIndexes', table),
    openFile:   ()               => ipcRenderer.invoke('sql:openFile'),
    saveFile:   (path, content)  => ipcRenderer.invoke('sql:saveFile', { path, content }),
  },
  form: {
    query: (sql, params) => ipcRenderer.invoke('form:query', { sql, params }),
    exec:  (sql, params) => ipcRenderer.invoke('form:exec',  { sql, params }),
  },
  agenda: {
    getByMonth:        (d)  => ipcRenderer.invoke('agenda:getByMonth', d),
    getByRange:        (d)  => ipcRenderer.invoke('agenda:getByRange', d),
    create:            (d)  => ipcRenderer.invoke('agenda:create', d),
    update:            (d)  => ipcRenderer.invoke('agenda:update', d),
    delete:            (id) => ipcRenderer.invoke('agenda:delete', id),
    deleteSerieFutura: (id) => ipcRenderer.invoke('agenda:deleteSerieFutura', id),
    listarCategorias:  ()   => ipcRenderer.invoke('agenda:listarCategorias'),
    criarCategoria:    (d)  => ipcRenderer.invoke('agenda:criarCategoria', d),
    atualizarCategoria:(d)  => ipcRenderer.invoke('agenda:atualizarCategoria', d),
    excluirCategoria:  (id) => ipcRenderer.invoke('agenda:excluirCategoria', id),
    pesquisarCategorias:(opts) => ipcRenderer.invoke('agenda:pesquisarCategorias', opts),
    listarStatus:      ()   => ipcRenderer.invoke('agenda:listarStatus'),
    criarStatus:       (d)  => ipcRenderer.invoke('agenda:criarStatus', d),
    atualizarStatus:   (d)  => ipcRenderer.invoke('agenda:atualizarStatus', d),
    excluirStatus:     (id) => ipcRenderer.invoke('agenda:excluirStatus', id),
    pesquisarStatus:   (opts) => ipcRenderer.invoke('agenda:pesquisarStatus', opts),
    confirmarStatus:   (d)  => ipcRenderer.invoke('agenda:confirmarStatus', d),
    onStatusAtualizado: (cb) => {
      const fn = (_, data) => cb(data)
      ipcRenderer.on('agenda:statusAtualizado', fn)
      return () => ipcRenderer.removeListener('agenda:statusAtualizado', fn)
    },
  },
  dash: {
    getAll:       ()        => ipcRenderer.invoke('dash:getAll'),
    create:       (d)       => ipcRenderer.invoke('dash:create', d),
    update:       (d)       => ipcRenderer.invoke('dash:update', d),
    autoLayout:   ()        => ipcRenderer.invoke('dash:autoLayout'),
    updateLayout: (layouts) => ipcRenderer.invoke('dash:updateLayout', layouts),
    delete:       (id)      => ipcRenderer.invoke('dash:delete', id),
    seedDemo:     ()        => ipcRenderer.invoke('dash:seedDemo'),
    clearDemo:    ()        => ipcRenderer.invoke('dash:clearDemo'),
  },
  arquivos: {
    getAll:     ()    => ipcRenderer.invoke('arquivos:getAll'),
    getPastas:  ()    => ipcRenderer.invoke('arquivos:getPastas'),
    listarFiltrado: (opts) => ipcRenderer.invoke('arquivos:listarFiltrado', opts),
    selecionar: ()    => ipcRenderer.invoke('arquivos:selecionar'),
    create:     (d)   => ipcRenderer.invoke('arquivos:create', d),
    update:     (d)   => ipcRenderer.invoke('arquivos:update', d),
    delete:     (id)  => ipcRenderer.invoke('arquivos:delete', id),
    abrir:      (p)   => ipcRenderer.invoke('arquivos:abrir', p),
    toggleFav:  (id)  => ipcRenderer.invoke('arquivos:toggleFav', id),
    lerTexto:    (p)                  => ipcRenderer.invoke('arquivos:lerTexto', p),
    copiarLocal:     (caminhoOrigem, nomeArquivo) => ipcRenderer.invoke('arquivos:copiarLocal', { caminhoOrigem, nomeArquivo }),
    abrirPasta:      (pasta)        => ipcRenderer.invoke('arquivos:abrirPasta', pasta),
    copiarClipboard: (caminho)      => ipcRenderer.invoke('arquivos:copiarClipboard', caminho),
    selecionarECopiar: (opts)     => ipcRenderer.invoke('arquivos:selecionarECopiar', opts),
    lerBase64:         (path)     => ipcRenderer.invoke('arquivos:lerBase64', path),
    importarPasta:  ()            => ipcRenderer.invoke('arquivos:importarPasta'),
    cancelarImport: ()            => ipcRenderer.invoke('arquivos:cancelarImport'),
    onProgresso:    (cb) => {
      const fn = (_, data) => cb(data)
      ipcRenderer.on('arquivos:progresso', fn)
      return () => ipcRenderer.removeListener('arquivos:progresso', fn)
    },
  },
  formBuilder: {
    listarModulos:     ()              => ipcRenderer.invoke('fb:listarModulos'),
    criarModulo:       (payload)       => ipcRenderer.invoke('fb:criarModulo', payload),
    editarModulo:      (id, payload)   => ipcRenderer.invoke('fb:editarModulo', id, payload),
    excluirModulo:     (id)            => ipcRenderer.invoke('fb:excluirModulo', id),
    listarTelas:       (ativas)        => ipcRenderer.invoke('fb:listarTelas', ativas),
    buscarTela:        (id)            => ipcRenderer.invoke('fb:buscarTela', id),
    getTelaPorSlug:    (slug)          => ipcRenderer.invoke('fb:getTelaPorSlug', slug),
    criarTela:         (payload)       => ipcRenderer.invoke('fb:criarTela', payload),
    editarTela:        (id, payload)   => ipcRenderer.invoke('fb:editarTela', id, payload),
    atualizarMetaTela: (id, payload)   => ipcRenderer.invoke('fb:atualizarMetaTela', id, payload),
    excluirTela:       (id)            => ipcRenderer.invoke('fb:excluirTela', id),
    inativarTela:      (id)            => ipcRenderer.invoke('fb:inativarTela', id),
    reativarTela:      (id)            => ipcRenderer.invoke('fb:reativarTela', id),
    listarRegistros:   (tbl, opts)     => ipcRenderer.invoke('fb:listarRegistros', tbl, opts),
    listarRegistrosFiltrado: (tbl, opts) => ipcRenderer.invoke('fb:listarRegistrosFiltrado', tbl, opts),
    getAllRegistros:    (tbl)           => ipcRenderer.invoke('fb:getAllRegistros', tbl),
    pesquisarRegistros: (tbl, opts)     => ipcRenderer.invoke('fb:pesquisarRegistros', tbl, opts),
    inserirRegistro:   (tbl, dados)    => ipcRenderer.invoke('fb:inserirRegistro', tbl, dados),
    atualizarRegistro: (tbl, id, d, hasTs) => ipcRenderer.invoke('fb:atualizarRegistro', tbl, id, d, hasTs),
    reordenarTelas:    (items)          => ipcRenderer.invoke('fb:reordenarTelas', items),
    inativarRegistro:  (tbl, id, hasTs) => ipcRenderer.invoke('fb:inativarRegistro', tbl, id, hasTs),
    excluirRegistro:   (tbl, id)        => ipcRenderer.invoke('fb:excluirRegistro', tbl, id),
    proximoCodigo:     (tbl, campo, padrao, seqChars) => ipcRenderer.invoke('fb:proximoCodigo', tbl, campo, padrao, seqChars),
    toggleFavorito:      (tbl, id, hasTs)          => ipcRenderer.invoke('fb:toggleFavorito', tbl, id, hasTs),
    listarOpcoesLookup:  (tbl, exibir, codigo, filtro) => ipcRenderer.invoke('fb:listarOpcoesLookup', tbl, exibir, codigo, filtro),
    listarColunasTabela: (tbl)                      => ipcRenderer.invoke('fb:listarColunasTabela', tbl),
    valoresDistintos:    (tbl, coluna)              => ipcRenderer.invoke('fb:valoresDistintos', tbl, coluna),
    importarPasta:       (opts)                     => ipcRenderer.invoke('fb:importarPasta', opts),
    inserirRegistroComSubGrids:   (tbl, dados, subGrids)         => ipcRenderer.invoke('fb:inserirRegistroComSubGrids', tbl, dados, subGrids),
    atualizarRegistroComSubGrids: (tbl, id, dados, subGrids, hasTs) => ipcRenderer.invoke('fb:atualizarRegistroComSubGrids', tbl, id, dados, subGrids, hasTs),
    listarSubGrid:                (subGridTabela, parentColuna, parentId) => ipcRenderer.invoke('fb:listarSubGrid', subGridTabela, parentColuna, parentId),
    inserirComSubGridHook:   (hookNome, tbl, dados, nomeCampoSubGrid, linhas) => ipcRenderer.invoke('fb:inserirComSubGridHook', hookNome, tbl, dados, nomeCampoSubGrid, linhas),
    atualizarComSubGridHook: (hookNome, tbl, id, dados, nomeCampoSubGrid, linhas, hasTs) => ipcRenderer.invoke('fb:atualizarComSubGridHook', hookNome, tbl, id, dados, nomeCampoSubGrid, linhas, hasTs),
  },
  designer: {
    open: () => ipcRenderer.invoke('designer:open'),
  },
  entidade: {
    buscarCnpj: (cnpj) => ipcRenderer.invoke('entidade:buscarCnpj', cnpj),
    buscarCep:  (cep)  => ipcRenderer.invoke('entidade:buscarCep',  cep),
  },
  clipboard: {
    write: (texto) => ipcRenderer.invoke('clipboard:write', texto),
    read:  ()      => ipcRenderer.invoke('clipboard:read'),
  },
  config: {
    get:             ()                       => ipcRenderer.invoke('config:get'),
    set:             (section, key, value)    => ipcRenderer.invoke('config:set', { section, key, value }),
    setSection:      (section, kvs)           => ipcRenderer.invoke('config:setSection', { section, kvs }),
    getIniPath:      ()                       => ipcRenderer.invoke('config:getIniPath'),
    selecionarPasta: (opts)                   => ipcRenderer.invoke('config:selecionarPasta', opts),
    selecionarArquivoIni: ()                  => ipcRenderer.invoke('config:selecionarArquivoIni'),
    onPersonalizacaoAlterada: (cb) => {
      const fn = (_, data) => cb(data)
      ipcRenderer.on('config:personalizacaoAlterada', fn)
      return () => ipcRenderer.removeListener('config:personalizacaoAlterada', fn)
    },
  },
  update: {
    check:         ()  => ipcRenderer.invoke('update:check'),
    download:      ()  => ipcRenderer.invoke('update:download'),
    install:       ()  => ipcRenderer.invoke('update:install'),
    version:       ()  => ipcRenderer.invoke('update:version'),
    getLastState:  ()  => ipcRenderer.invoke('update:getLastState'),
    onStatus: (cb) => {
      const channels = [
        'update:checking', 'update:available', 'update:not-available',
        'update:progress',  'update:downloaded', 'update:error',
      ]
      const pairs = channels.map(ch => {
        const fn = (_, data) => cb(ch.replace('update:', ''), data)
        ipcRenderer.on(ch, fn)
        return [ch, fn]
      })
      return () => pairs.forEach(([ch, fn]) => ipcRenderer.removeListener(ch, fn))
    },
  },
  auth: {
    login:          (usuario, senha)  => ipcRenderer.invoke('auth:login', usuario, senha),
    redefinirSenha: (opts)            => ipcRenderer.invoke('auth:redefinirSenha', opts),
  },
  funcoes: {
    listarScripts:      ()  => ipcRenderer.invoke('funcoes:listarScripts'),
    criarScript:        (d) => ipcRenderer.invoke('funcoes:criarScript', d),
    atualizarScript:    (d) => ipcRenderer.invoke('funcoes:atualizarScript', d),
    excluirScript:      (id) => ipcRenderer.invoke('funcoes:excluirScript', id),
    executarScript:     (id) => ipcRenderer.invoke('funcoes:executarScript', id),
    listarIntegracoes:  ()  => ipcRenderer.invoke('funcoes:listarIntegracoes'),
    criarIntegracao:    (d) => ipcRenderer.invoke('funcoes:criarIntegracao', d),
    atualizarIntegracao:(d) => ipcRenderer.invoke('funcoes:atualizarIntegracao', d),
    excluirIntegracao:  (id) => ipcRenderer.invoke('funcoes:excluirIntegracao', id),
    testarIntegracao:   (id, contexto) => ipcRenderer.invoke('funcoes:testarIntegracao', id, contexto),
    listarNotificacoes: ()  => ipcRenderer.invoke('funcoes:listarNotificacoes'),
    criarNotificacao:   (d) => ipcRenderer.invoke('funcoes:criarNotificacao', d),
    atualizarNotificacao:(d) => ipcRenderer.invoke('funcoes:atualizarNotificacao', d),
    excluirNotificacao: (id) => ipcRenderer.invoke('funcoes:excluirNotificacao', id),
    testarNotificacao:  (id, contexto) => ipcRenderer.invoke('funcoes:testarNotificacao', id, contexto),
    listarAgendamentos:   ()  => ipcRenderer.invoke('funcoes:listarAgendamentos'),
    criarAgendamento:     (d) => ipcRenderer.invoke('funcoes:criarAgendamento', d),
    atualizarAgendamento: (d) => ipcRenderer.invoke('funcoes:atualizarAgendamento', d),
    excluirAgendamento:   (id) => ipcRenderer.invoke('funcoes:excluirAgendamento', id),
    executarAgendamentoAgora: (id) => ipcRenderer.invoke('funcoes:executarAgendamentoAgora', id),
    listarAutomacoes:   ()  => ipcRenderer.invoke('funcoes:listarAutomacoes'),
    criarAutomacao:     (d) => ipcRenderer.invoke('funcoes:criarAutomacao', d),
    atualizarAutomacao: (d) => ipcRenderer.invoke('funcoes:atualizarAutomacao', d),
    excluirAutomacao:   (id) => ipcRenderer.invoke('funcoes:excluirAutomacao', id),
    listarFluxos:      ()  => ipcRenderer.invoke('funcoes:listarFluxos'),
    criarFluxo:        (d) => ipcRenderer.invoke('funcoes:criarFluxo', d),
    atualizarFluxo:    (d) => ipcRenderer.invoke('funcoes:atualizarFluxo', d),
    excluirFluxo:      (id) => ipcRenderer.invoke('funcoes:excluirFluxo', id),
    onToast: (cb) => {
      const fn = (_, data) => cb(data)
      ipcRenderer.on('funcoes:toast', fn)
      return () => ipcRenderer.removeListener('funcoes:toast', fn)
    },
  },
  automacao: {
    disparar: (payload) => ipcRenderer.invoke('automacao:disparar', payload),
  },
  fluxo: {
    executar: (id, dadosIniciais) => ipcRenderer.invoke('fluxo:executar', id, dadosIniciais),
  },
  pesquisa: {
    listar:    ()             => ipcRenderer.invoke('pesquisa:listar'),
    obter:     (codigo)       => ipcRenderer.invoke('pesquisa:obter', codigo),
    salvar:    (dados)        => ipcRenderer.invoke('pesquisa:salvar', dados),
    excluir:   (id)           => ipcRenderer.invoke('pesquisa:excluir', id),
    testarSql: (sql)          => ipcRenderer.invoke('pesquisa:testarSql', sql),
    executar:  (codigo, opts) => ipcRenderer.invoke('pesquisa:executar', codigo, opts),
  },
  importarBanco: {
    isDev:    ()      => ipcRenderer.invoke('importarBanco:isDev'),
    executar: (token) => ipcRenderer.invoke('importarBanco:executar', token),
    testarConexaoProducao: () => ipcRenderer.invoke('importarBanco:testarConexaoProducao'),
    testarConexaoDev:      () => ipcRenderer.invoke('importarBanco:testarConexaoDev'),
    onProgresso: (cb) => {
      const fn = (_, data) => cb(data)
      ipcRenderer.on('importarBanco:progresso', fn)
      return () => ipcRenderer.removeListener('importarBanco:progresso', fn)
    },
  },
  tokenImportacao: {
    gerar: () => ipcRenderer.invoke('tokenImportacao:gerar'),
  },
  viagens: {
    listar:            (filtros) => ipcRenderer.invoke('viagens:listar', filtros),
    obter:             (id)      => ipcRenderer.invoke('viagens:obter', id),
    criar:             (dados)   => ipcRenderer.invoke('viagens:criar', dados),
    atualizar:         (dados)   => ipcRenderer.invoke('viagens:atualizar', dados),
    excluir:           (id)      => ipcRenderer.invoke('viagens:excluir', id),
    mudarStatus:       (payload) => ipcRenderer.invoke('viagens:mudarStatus', payload),
    listarConsultores: ()        => ipcRenderer.invoke('viagens:listarConsultores'),
    exportarExcel:     (id)      => ipcRenderer.invoke('viagens:exportarExcel', id),
    exportarExcelLote: (ids)     => ipcRenderer.invoke('viagens:exportarExcelLote', ids),
  },
}

contextBridge.exposeInMainWorld('electron', electronAPI)
contextBridge.exposeInMainWorld('api', api)
