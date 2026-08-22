import { ipcMain } from 'electron'
import { getConfig, saveConfig, saveSectionConfig, getConfigForFrontend, INI_PATH } from './config'

import { query, queryOne, getPool } from './db'
import { wrap, importLog, importCancelFlags, categoriaByExt, scanDir, hashCamposSenha } from './handlers/_shared'
import { registerJanelaHandlers } from './handlers/janela'
import { registerSqlHandlers } from './handlers/sql'
import { registerAgendaHandlers } from './handlers/agenda'
import { registerDashboardHandlers } from './handlers/dashboard'
import { registerDashboardDemoHandlers } from './handlers/dashboardDemo'
import { registerClipboardHandlers } from './handlers/clipboard'
import { registerEntidadeHandlers } from './handlers/entidade'
import { registerAuthHandlers } from './handlers/auth'
import { registerConfigHandlers } from './handlers/config'
import { registerUpdateHandlers } from './handlers/update'
import { registerArquivosHandlers } from './handlers/arquivos'
import { registerFormBuilderHandlers } from './handlers/formBuilder'
import { registerFuncoesHandlers } from './handlers/funcoes'
import { registerPesquisaHandlers } from './handlers/pesquisa'
import { registerViagensHandlers } from './handlers/viagens'
import { registerImportarBancoHandlers } from './handlers/importarBanco'
import { registerTokenImportacaoHandlers } from './handlers/tokenImportacao'
import { registerCryptoHandlers } from './handlers/crypto'
import { registerCofreSenhasHandlers } from './handlers/cofreSenhas'
import { registerCofreSenhaHistoricoHandlers } from './handlers/cofreSenhaHistorico'
import { registerCofreSenhaAcessoHandlers } from './handlers/cofreSenhaAcesso'

export function registerHandlers() {
  registerJanelaHandlers({ ipcMain, wrap })
  registerSqlHandlers({ ipcMain, wrap, query, queryOne, getPool })
  registerAgendaHandlers({ ipcMain, wrap, query, queryOne })
  registerDashboardHandlers({ ipcMain, wrap, query, queryOne })
  registerDashboardDemoHandlers({ ipcMain, wrap, query })
  registerClipboardHandlers({ ipcMain, wrap })
  registerEntidadeHandlers({ ipcMain })
  registerAuthHandlers({ ipcMain, query, queryOne })
  registerConfigHandlers({ ipcMain, wrap, getConfigForFrontend, saveConfig, saveSectionConfig, INI_PATH })
  registerUpdateHandlers({ ipcMain, wrap })
  registerArquivosHandlers({ ipcMain, wrap, query, queryOne, getConfig, importLog, importCancelFlags, categoriaByExt, scanDir })
  registerFormBuilderHandlers({ ipcMain, wrap, query, hashCamposSenha, importLog, importCancelFlags, categoriaByExt, scanDir })
  registerFuncoesHandlers({ ipcMain, wrap, query, queryOne })
  registerPesquisaHandlers({ ipcMain, wrap, query, queryOne })
  registerViagensHandlers({ ipcMain, wrap, query, queryOne })
  registerImportarBancoHandlers({ ipcMain, wrap })
  registerTokenImportacaoHandlers({ ipcMain, wrap, query })
  registerCryptoHandlers({ ipcMain })
  registerCofreSenhasHandlers({ ipcMain, wrap, query, queryOne })
  registerCofreSenhaHistoricoHandlers({ ipcMain, wrap, query })
  registerCofreSenhaAcessoHandlers({ ipcMain, wrap, query })
}
