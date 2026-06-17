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
  agenda: {
    getByMonth: (d)  => ipcRenderer.invoke('agenda:getByMonth', d),
    create:     (d)  => ipcRenderer.invoke('agenda:create', d),
    update:     (d)  => ipcRenderer.invoke('agenda:update', d),
    delete:     (id) => ipcRenderer.invoke('agenda:delete', id),
  },
  dash: {
    getAll:       ()        => ipcRenderer.invoke('dash:getAll'),
    create:       (d)       => ipcRenderer.invoke('dash:create', d),
    update:       (d)       => ipcRenderer.invoke('dash:update', d),
    updateLayout: (layouts) => ipcRenderer.invoke('dash:updateLayout', layouts),
    delete:       (id)      => ipcRenderer.invoke('dash:delete', id),
  },
  arquivos: {
    getAll:     ()    => ipcRenderer.invoke('arquivos:getAll'),
    getPastas:  ()    => ipcRenderer.invoke('arquivos:getPastas'),
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
    excluirTela:       (id)            => ipcRenderer.invoke('fb:excluirTela', id),
    inativarTela:      (id)            => ipcRenderer.invoke('fb:inativarTela', id),
    reativarTela:      (id)            => ipcRenderer.invoke('fb:reativarTela', id),
    listarRegistros:   (tbl, opts)     => ipcRenderer.invoke('fb:listarRegistros', tbl, opts),
    getAllRegistros:    (tbl)           => ipcRenderer.invoke('fb:getAllRegistros', tbl),
    inserirRegistro:   (tbl, dados)    => ipcRenderer.invoke('fb:inserirRegistro', tbl, dados),
    atualizarRegistro: (tbl, id, d, hasTs) => ipcRenderer.invoke('fb:atualizarRegistro', tbl, id, d, hasTs),
    reordenarTelas:    (items)          => ipcRenderer.invoke('fb:reordenarTelas', items),
    inativarRegistro:  (tbl, id, hasTs) => ipcRenderer.invoke('fb:inativarRegistro', tbl, id, hasTs),
    excluirRegistro:   (tbl, id)        => ipcRenderer.invoke('fb:excluirRegistro', tbl, id),
    proximoCodigo:     (tbl, campo, padrao, seqChars) => ipcRenderer.invoke('fb:proximoCodigo', tbl, campo, padrao, seqChars),
    toggleFavorito:      (tbl, id, hasTs)          => ipcRenderer.invoke('fb:toggleFavorito', tbl, id, hasTs),
    listarOpcoesLookup:  (tbl, exibir, codigo)     => ipcRenderer.invoke('fb:listarOpcoesLookup', tbl, exibir, codigo),
    listarColunasTabela: (tbl)                      => ipcRenderer.invoke('fb:listarColunasTabela', tbl),
    valoresDistintos:    (tbl, coluna)              => ipcRenderer.invoke('fb:valoresDistintos', tbl, coluna),
    importarPasta:       (opts)                     => ipcRenderer.invoke('fb:importarPasta', opts),
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
    selecionarPasta: ()                       => ipcRenderer.invoke('config:selecionarPasta'),
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
}

contextBridge.exposeInMainWorld('electron', electronAPI)
contextBridge.exposeInMainWorld('api', api)
