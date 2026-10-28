import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  win: {
    minimize:    () => ipcRenderer.invoke('win:minimize'),
    maximize:    () => ipcRenderer.invoke('win:maximize'),
    close:       () => ipcRenderer.invoke('win:close'),
    isMaximized: () => ipcRenderer.invoke('win:isMaximized'),
  },
  sistema: {
    abrirLink: (url) => ipcRenderer.invoke('sistema:abrirLink', url),
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
    salvarComo:      (caminhoOrigem, nomeSugerido) => ipcRenderer.invoke('arquivos:salvarComo', { caminhoOrigem, nomeSugerido }),
    salvarVarios:    (itens) => ipcRenderer.invoke('arquivos:salvarVarios', { itens }),
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
    listar:          (f)  => ipcRenderer.invoke('entidade:listar', f),
    obter:           (id) => ipcRenderer.invoke('entidade:obter', id),
    criar:           (d)  => ipcRenderer.invoke('entidade:criar', d),
    atualizar:       (d)  => ipcRenderer.invoke('entidade:atualizar', d),
    excluir:         (id) => ipcRenderer.invoke('entidade:excluir', id),
    mudarStatusLote: (p)  => ipcRenderer.invoke('entidade:mudarStatusLote', p),
    buscarLookup:    (f)  => ipcRenderer.invoke('entidade:buscarLookup', f),
    adicionarAnexo:  (p)  => ipcRenderer.invoke('entidade:adicionarAnexo', p),
    removerAnexo:    (id) => ipcRenderer.invoke('entidade:removerAnexo', id),
    registrarInteracao: (p) => ipcRenderer.invoke('entidade:registrarInteracao', p),
    removerInteracao:   (id) => ipcRenderer.invoke('entidade:removerInteracao', id),
    alterarLimite:      (p) => ipcRenderer.invoke('entidade:alterarLimite', p),
    documentosVencendo: (f) => ipcRenderer.invoke('entidade:documentosVencendo', f),
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
    selecionarLogoDocumentos: ()              => ipcRenderer.invoke('config:selecionarLogoDocumentos'),
    salvarGithubToken: (token)                => ipcRenderer.invoke('config:salvarGithubToken', token),
    salvarAnthropicApiKey: (key)              => ipcRenderer.invoke('config:salvarAnthropicApiKey', key),
    salvarCnpjaToken: (token)                 => ipcRenderer.invoke('config:salvarCnpjaToken', token),
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
  crypto: {
    encrypt: (texto)        => ipcRenderer.invoke('crypto:encrypt', texto),
    decrypt: (textoCifrado) => ipcRenderer.invoke('crypto:decrypt', textoCifrado),
  },
  cofreSenhas: {
    listar:           (filtros) => ipcRenderer.invoke('cofreSenhas:listar', filtros),
    obter:             (id)      => ipcRenderer.invoke('cofreSenhas:obter', id),
    criar:             (d)       => ipcRenderer.invoke('cofreSenhas:criar', d),
    atualizar:         (d)       => ipcRenderer.invoke('cofreSenhas:atualizar', d),
    excluir:           (id)      => ipcRenderer.invoke('cofreSenhas:excluir', id),
    toggleFavorito:    (id)      => ipcRenderer.invoke('cofreSenhas:toggleFavorito', id),
    listarCategorias: ()        => ipcRenderer.invoke('cofreSenhas:listarCategorias'),
    verificarReuso:    (opts)    => ipcRenderer.invoke('cofreSenhas:verificarReuso', opts),
    totpCodigoAtual:   (id)      => ipcRenderer.invoke('cofreSenhas:totpCodigoAtual', id),
    totpQrCode:        (id)      => ipcRenderer.invoke('cofreSenhas:totpQrCode', id),
  },
  cofreSenhaHistorico: {
    listar: (credencialId) => ipcRenderer.invoke('cofreSenhaHistorico:listar', credencialId),
  },
  cofreSenhaAcesso: {
    registrar: (opts)         => ipcRenderer.invoke('cofreSenhaAcesso:registrar', opts),
    listar:    (credencialId) => ipcRenderer.invoke('cofreSenhaAcesso:listar', credencialId),
  },
  cofreSenhaAnexos: {
    listar:    (credencialId) => ipcRenderer.invoke('cofreSenhaAnexos:listar', credencialId),
    adicionar: (opts)         => ipcRenderer.invoke('cofreSenhaAnexos:adicionar', opts),
    remover:   (id)           => ipcRenderer.invoke('cofreSenhaAnexos:remover', id),
  },
  cofreSenhaGerador: {
    listarPerfis: ()    => ipcRenderer.invoke('cofreSenhaGerador:listarPerfis'),
    salvarPerfil: (d)   => ipcRenderer.invoke('cofreSenhaGerador:salvarPerfil', d),
    excluirPerfil: (id) => ipcRenderer.invoke('cofreSenhaGerador:excluirPerfil', id),
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
  lancarVersao: {
    lerNotasPendentes: () => ipcRenderer.invoke('lancarVersao:lerNotasPendentes'),
    gerarInstalador: () => ipcRenderer.invoke('lancarVersao:gerarInstalador'),
    executar: (token, notas) => ipcRenderer.invoke('lancarVersao:executar', token, notas),
    onProgresso: (cb) => {
      const fn = (_, data) => cb(data)
      ipcRenderer.on('lancarVersao:progresso', fn)
      return () => ipcRenderer.removeListener('lancarVersao:progresso', fn)
    },
  },
  tokenImportacao: {
    gerar: (escopo) => ipcRenderer.invoke('tokenImportacao:gerar', escopo),
  },
  documentoGerado: {
    listarTipos: () => ipcRenderer.invoke('documentoGerado:listarTipos'),
    listar: (filtros) => ipcRenderer.invoke('documentoGerado:listar', filtros),
    obter: (id) => ipcRenderer.invoke('documentoGerado:obter', id),
    excluir: (id) => ipcRenderer.invoke('documentoGerado:excluir', id),
    gerar: (dados) => ipcRenderer.invoke('documentoGerado:gerar', dados),
    selecionarImagens: () => ipcRenderer.invoke('documentoGerado:selecionarImagens'),
    persistirImagens: (payload) => ipcRenderer.invoke('documentoGerado:persistirImagens', payload),
    confirmar: (dados) => ipcRenderer.invoke('documentoGerado:confirmar', dados),
    salvarRevisao: (id, dados) => ipcRenderer.invoke('documentoGerado:salvarRevisao', id, dados),
    listarHistorico: (id) => ipcRenderer.invoke('documentoGerado:listarHistorico', id),
    mudarStatus: (id, status) => ipcRenderer.invoke('documentoGerado:mudarStatus', id, status),
    mudarStatusLote: (payload) => ipcRenderer.invoke('documentoGerado:mudarStatusLote', payload),
    anexosParaEmail: (payload) => ipcRenderer.invoke('documentoGerado:anexosParaEmail', payload),
    exportarPdf: (id) => ipcRenderer.invoke('documentoGerado:exportarPdf', id),
    exportarPdfLote: (ids) => ipcRenderer.invoke('documentoGerado:exportarPdfLote', ids),
    onProgresso: (cb) => {
      const fn = (_, data) => cb(data)
      ipcRenderer.on('documentoGerado:progresso', fn)
      return () => ipcRenderer.removeListener('documentoGerado:progresso', fn)
    },
    onProgressoPdf: (cb) => {
      const fn = (_, data) => cb(data)
      ipcRenderer.on('documentoGerado:progressoPdf', fn)
      return () => ipcRenderer.removeListener('documentoGerado:progressoPdf', fn)
    },
  },
  promptIa: {
    listar:    ()           => ipcRenderer.invoke('promptIa:listar'),
    atualizar: (id, dados)  => ipcRenderer.invoke('promptIa:atualizar', id, dados),
    criar:     (dados)      => ipcRenderer.invoke('promptIa:criar', dados),
    editar:    (id, dados)  => ipcRenderer.invoke('promptIa:editar', id, dados),
    excluir:   (id)         => ipcRenderer.invoke('promptIa:excluir', id),
  },
  // Cadastros de apoio da Entidade / faturamento.
  ...Object.fromEntries(['naturezaJuridica', 'condicaoPagamento', 'banco'].map((r) => [r, {
    listar:         (f)  => ipcRenderer.invoke(`${r}:listar`, f),
    obter:          (id) => ipcRenderer.invoke(`${r}:obter`, id),
    criar:          (d)  => ipcRenderer.invoke(`${r}:criar`, d),
    atualizar:      (d)  => ipcRenderer.invoke(`${r}:atualizar`, d),
    excluir:        (id) => ipcRenderer.invoke(`${r}:excluir`, id),
    mudarAtivoLote: (p)  => ipcRenderer.invoke(`${r}:mudarAtivoLote`, p),
  }])),
  bancoImportarFebraban: () => ipcRenderer.invoke('banco:importarFebraban'),
  municipio: {
    buscar: (termo) => ipcRenderer.invoke('municipio:buscar', termo),
  },
  parametros: {
    listar:            (filtros)    => ipcRenderer.invoke('parametros:listar', filtros),
    listarCategorias:  ()           => ipcRenderer.invoke('parametros:listarCategorias'),
    obter:             (chave)      => ipcRenderer.invoke('parametros:obter', chave),
    atualizar:         (id, dados)  => ipcRenderer.invoke('parametros:atualizar', id, dados),
  },
  whatsapp: {
    abrir:            (sessaoUsuario) => ipcRenderer.invoke('whatsapp:abrir', sessaoUsuario),
    atualizarBounds:  (bounds)        => ipcRenderer.invoke('whatsapp:atualizarBounds', bounds),
    esconder:         ()              => ipcRenderer.invoke('whatsapp:esconder'),
    mostrar:          ()              => ipcRenderer.invoke('whatsapp:mostrar'),
    fecharSessao:     (sessaoUsuario) => ipcRenderer.invoke('whatsapp:fecharSessao', sessaoUsuario),
  },
  iaProvedor: {
    listar:           ()          => ipcRenderer.invoke('iaProvedor:listar'),
    modelosSugeridos: ()          => ipcRenderer.invoke('iaProvedor:modelosSugeridos'),
    criar:            (dados)     => ipcRenderer.invoke('iaProvedor:criar', dados),
    editar:           (id, dados) => ipcRenderer.invoke('iaProvedor:editar', id, dados),
    excluir:          (id)        => ipcRenderer.invoke('iaProvedor:excluir', id),
  },
  emailIa: {
    gerarCorpo: (payload) => ipcRenderer.invoke('emailIa:gerarCorpo', payload),
  },
  email: {
    iniciarSync:       ()             => ipcRenderer.invoke('email:iniciarSync'),
    pararSync:         ()             => ipcRenderer.invoke('email:pararSync'),
    listarContas:      ()             => ipcRenderer.invoke('email:listarContas'),
    obterConta:         (id)          => ipcRenderer.invoke('email:obterConta', id),
    criarConta:         (dados)       => ipcRenderer.invoke('email:criarConta', dados),
    atualizarConta:     (id, dados)   => ipcRenderer.invoke('email:atualizarConta', id, dados),
    excluirConta:       (id)          => ipcRenderer.invoke('email:excluirConta', id),
    testarConexao:      (dados)       => ipcRenderer.invoke('email:testarConexao', dados),
    testarConexaoConta: (id)          => ipcRenderer.invoke('email:testarConexaoConta', id),
    atualizarAssinatura: (id, dados)  => ipcRenderer.invoke('email:atualizarAssinatura', id, dados),
    reordenarContas:     (idsNaOrdem) => ipcRenderer.invoke('email:reordenarContas', idsNaOrdem),
    oauthLoginOutlook:   (opts)       => ipcRenderer.invoke('email:oauthLoginOutlook', opts || {}),
    aplicarLoginOutlook: (id, dados)  => ipcRenderer.invoke('email:aplicarLoginOutlook', id, dados),
    obterOutlookClientId: ()          => ipcRenderer.invoke('email:obterOutlookClientId'),
    salvarOutlookClientId: (clientId) => ipcRenderer.invoke('email:salvarOutlookClientId', clientId),
    listarMensagens:    (filtros)     => ipcRenderer.invoke('email:listarMensagens', filtros),
    contarMensagens:    (filtros)     => ipcRenderer.invoke('email:contarMensagens', filtros),
    reenviarFilaSaida:  (mensagemId)  => ipcRenderer.invoke('email:reenviarFilaSaida', mensagemId || null),
    descartarDaFila:    (mensagemId)  => ipcRenderer.invoke('email:descartarDaFila', mensagemId),
    editarDaFila:       (mensagemId)  => ipcRenderer.invoke('email:editarDaFila', mensagemId),
    contarNaoLidas:     (contaId)     => ipcRenderer.invoke('email:contarNaoLidas', contaId),
    contarNaoLidasPorPasta: (contaId) => ipcRenderer.invoke('email:contarNaoLidasPorPasta', contaId),
    obterMensagem:      (id)          => ipcRenderer.invoke('email:obterMensagem', id),
    marcarLida:         (id, lida)    => ipcRenderer.invoke('email:marcarLida', id, lida),
    marcarLidaLote:     (ids, lida)   => ipcRenderer.invoke('email:marcarLidaLote', ids, lida),
    listarMensagensAgrupadas: (filtros) => ipcRenderer.invoke('email:listarMensagensAgrupadas', filtros),
    contarThreads:            (filtros) => ipcRenderer.invoke('email:contarThreads', filtros),
    listarMensagensDaThread:  (grupo)   => ipcRenderer.invoke('email:listarMensagensDaThread', grupo),
    sinalizar:          (id, sinalizada)   => ipcRenderer.invoke('email:sinalizar', id, sinalizada),
    sinalizarLote:      (ids, sinalizada)  => ipcRenderer.invoke('email:sinalizarLote', ids, sinalizada),
    listarRascunhos:    (contaId)          => ipcRenderer.invoke('email:listarRascunhos', contaId),
    salvarRascunho:     (dados)            => ipcRenderer.invoke('email:salvarRascunho', dados),
    excluirRascunho:    (id)               => ipcRenderer.invoke('email:excluirRascunho', id),
    sugerirContatos:    (termo, limite)    => ipcRenderer.invoke('email:sugerirContatos', termo, limite),
    listarEtiquetas:          ()               => ipcRenderer.invoke('email:listarEtiquetas'),
    criarEtiqueta:            (dados)          => ipcRenderer.invoke('email:criarEtiqueta', dados),
    atualizarEtiqueta:        (id, dados)      => ipcRenderer.invoke('email:atualizarEtiqueta', id, dados),
    excluirEtiqueta:          (id)             => ipcRenderer.invoke('email:excluirEtiqueta', id),
    etiquetasPorMensagens:    (ids)            => ipcRenderer.invoke('email:etiquetasPorMensagens', ids),
    aplicarEtiquetaLote:      (ids, etiquetaId) => ipcRenderer.invoke('email:aplicarEtiquetaLote', ids, etiquetaId),
    removerEtiquetaLote:      (ids, etiquetaId) => ipcRenderer.invoke('email:removerEtiquetaLote', ids, etiquetaId),
    sincronizarAgora:   (contaId)     => ipcRenderer.invoke('email:sincronizarAgora', contaId),
    ressincronizarDesde: (contaId, novaData) => ipcRenderer.invoke('email:ressincronizarDesde', contaId, novaData),
    listarPastas:       (contaId)       => ipcRenderer.invoke('email:listarPastas', contaId),
    descobrirPastasAgora: (contaId)     => ipcRenderer.invoke('email:descobrirPastasAgora', contaId),
    arquivarLote:       (ids)           => ipcRenderer.invoke('email:arquivarLote', ids),
    moverParaInboxLote: (ids)           => ipcRenderer.invoke('email:moverParaInboxLote', ids),
    excluirLote:        (ids)           => ipcRenderer.invoke('email:excluirLote', ids),
    excluirPermanenteLote: (ids)        => ipcRenderer.invoke('email:excluirPermanenteLote', ids),
    esvaziarLixeira:    (contaId)       => ipcRenderer.invoke('email:esvaziarLixeira', contaId || null),
    enviar:             (dados)       => ipcRenderer.invoke('email:enviar', dados),
    selecionarAnexos:   ()            => ipcRenderer.invoke('email:selecionarAnexos'),
    onNovaMensagem: (cb) => {
      const fn = (_, data) => cb(data)
      ipcRenderer.on('email:novaMensagem', fn)
      return () => ipcRenderer.removeListener('email:novaMensagem', fn)
    },
    onFilaSaida: (cb) => {
      const fn = (_, data) => cb(data)
      ipcRenderer.on('email:filaSaida', fn)
      return () => ipcRenderer.removeListener('email:filaSaida', fn)
    },
    onProgressoSync: (cb) => {
      const fn = (_, data) => cb(data)
      ipcRenderer.on('email:progressoSync', fn)
      return () => ipcRenderer.removeListener('email:progressoSync', fn)
    },
  },
  viagens: {
    listar:            (filtros) => ipcRenderer.invoke('viagens:listar', filtros),
    obter:             (id)      => ipcRenderer.invoke('viagens:obter', id),
    criar:             (dados)   => ipcRenderer.invoke('viagens:criar', dados),
    atualizar:         (dados)   => ipcRenderer.invoke('viagens:atualizar', dados),
    excluir:           (id)      => ipcRenderer.invoke('viagens:excluir', id),
    mudarStatus:       (payload) => ipcRenderer.invoke('viagens:mudarStatus', payload),
    mudarStatusLote:   (payload) => ipcRenderer.invoke('viagens:mudarStatusLote', payload),
    anexosParaEmail:   (payload) => ipcRenderer.invoke('viagens:anexosParaEmail', payload),
    listarConsultores: ()        => ipcRenderer.invoke('viagens:listarConsultores'),
    exportarExcel:     (id)      => ipcRenderer.invoke('viagens:exportarExcel', id),
    exportarExcelLote: (ids)     => ipcRenderer.invoke('viagens:exportarExcelLote', ids),
  },
}

contextBridge.exposeInMainWorld('electron', electronAPI)
contextBridge.exposeInMainWorld('api', api)
