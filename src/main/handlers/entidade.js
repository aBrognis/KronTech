import { getDecryptedCnpjaToken } from '../config'
import { dialog, BrowserWindow } from 'electron'
import * as entidadeService from '../services/entidadeService'

// Deixa em CAIXA ALTA todos os campos de texto do retorno de CNPJ, MENOS
// e-mail e site/URL (que sao case-sensitive na pratica). Campos de
// controle (flags booleanas, avisos) tambem ficam de fora.
const CAMPOS_MINUSCULOS = new Set(['email', 'site', 'url', 'avisoIe'])
function caixaAltaCampos(data) {
  const out = {}
  for (const [k, v] of Object.entries(data)) {
    out[k] = (typeof v === 'string' && !CAMPOS_MINUSCULOS.has(k)) ? v.toUpperCase() : v
  }
  return out
}

export function registerEntidadeHandlers({ ipcMain, wrap }) {

  // ── CRUD da tela de Entidade ─────────────────────────────────────────
  // ctx: quem fez a acao, pra auditoria. Vem do renderer no payload.
  const ctxDe = (d) => ({ usuarioId: d?._usuarioId || null, usuarioNome: d?._usuarioNome || null })
  ipcMain.handle('entidade:listar', wrap((_e, f) => entidadeService.listar(f || {})))
  ipcMain.handle('entidade:obter', wrap((_e, id) => entidadeService.obter(id)))
  ipcMain.handle('entidade:criar', wrap((_e, d) => entidadeService.criar(d, ctxDe(d))))
  ipcMain.handle('entidade:atualizar', wrap((_e, d) => entidadeService.atualizar(d, ctxDe(d))))
  ipcMain.handle('entidade:excluir', wrap((_e, id) => entidadeService.excluir(id)))
  ipcMain.handle('entidade:mudarStatusLote', wrap((_e, { ids, status, ctx }) => entidadeService.mudarStatusLote(ids, status, ctx || {})))
  ipcMain.handle('entidade:buscarLookup', wrap((_e, f) => entidadeService.buscarLookup(f || {})))
  ipcMain.handle('entidade:removerAnexo', wrap((_e, id) => entidadeService.removerAnexo(id)))
  ipcMain.handle('entidade:registrarInteracao', wrap((_e, { entidadeId, dados, ctx }) => entidadeService.registrarInteracao(entidadeId, dados, ctx || {})))
  ipcMain.handle('entidade:removerInteracao', wrap((_e, id) => entidadeService.removerInteracao(id)))
  ipcMain.handle('entidade:alterarLimite', wrap((_e, { entidadeId, limite_novo, motivo, ctx }) => entidadeService.alterarLimite(entidadeId, { limite_novo, motivo }, ctx || {})))
  ipcMain.handle('entidade:documentosVencendo', wrap((_e, f) => entidadeService.documentosVencendo(f || {})))
  ipcMain.handle('entidade:adicionarAnexo', wrap(async (e, { entidadeId, categoria, observacoes }) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const r = await dialog.showOpenDialog(win, {
      title: 'Selecionar anexo da entidade',
      properties: ['openFile'],
      filters: [{ name: 'Documentos', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx'] }],
    })
    if (r.canceled || !r.filePaths?.[0]) return { cancelado: true }
    return entidadeService.adicionarAnexo(entidadeId, { origemPath: r.filePaths[0], categoria, observacoes })
  }))

  // ── Consulta CNPJ ────────────────────────────────────────────────────
  // Ordem:
  //  1. CNPJá (cnpja.com) — se tem token: traz TUDO + Inscricao Estadual
  //     (SINTEGRA). E a unica fonte com IE.
  //  2. BrasilAPI — sem IE, mas sem limite agressivo.
  //  3. publica.cnpj.ws — sem IE, ultimo recurso.
  // `data.inscricao_estadual` vem preenchido so pela CNPJá; `data.ieObtida`
  // diz se a IE foi realmente consultada (pra UI avisar quando nao).
  ipcMain.handle('entidade:buscarCnpj', async (_e, cnpj) => {
    const digits = String(cnpj ?? '').replace(/\D/g, '')
    if (digits.length !== 14) return { ok: false, erro: 'CNPJ deve ter 14 dígitos.' }

    const token = getDecryptedCnpjaToken()

    // ── CNPJá: /office/{cnpj}?registrations=BR (todas as UFs) ──────────
    async function tryCnpja() {
      if (!token) throw new Error('sem token CNPJá')
      const res = await fetch(`https://api.cnpja.com/office/${digits}?registrations=BR`, {
        headers: { Authorization: token },
      })
      if (res.status === 429) throw new Error('Limite de consultas da CNPJá atingido. Tente em alguns minutos.')
      if (res.status === 401 || res.status === 403) throw new Error('Token da CNPJá inválido. Verifique em Configurações.')
      if (!res.ok) throw new Error(res.status === 404 ? 'CNPJ não encontrado.' : `CNPJá: erro ${res.status}`)
      const d = await res.json()

      // Escolhe a IE: prioriza a do MESMO estado do estabelecimento e
      // habilitada; senao a primeira habilitada; senao a primeira.
      const ufEstab = d.address?.state || ''
      const regs = Array.isArray(d.registrations) ? d.registrations : []
      const ativa = regs.filter(r => r.enabled)
      const escolhida =
        ativa.find(r => r.state === ufEstab) ||
        ativa[0] ||
        regs[0] ||
        null
      const inscricaoEstadual = escolhida ? String(escolhida.number || '').trim() : ''
      // Cliente sem IE (nao contribuinte): regs vazio ou nenhuma habilitada.
      const ieObtida = true // a consulta de IE FOI feita
      const naoContribuinte = !inscricaoEstadual

      const tel1 = d.phones?.[0]
      const tel2 = d.phones?.[1]
      return {
        razao_social:                 d.company?.name || d.name,
        nome_fantasia:                d.alias || '',
        logradouro:                   d.address?.street || '',
        numero:                       d.address?.number || '',
        complemento:                  (d.address?.details || '').trim(),
        bairro:                       d.address?.district || '',
        municipio:                    d.address?.city || '',
        uf:                           d.address?.state || '',
        cep:                          String(d.address?.zip || '').replace(/\D/g, ''),
        ddd_telefone_1:               tel1 ? `(${tel1.area}) ${tel1.number}` : '',
        ddd_telefone_2:               tel2 ? `(${tel2.area}) ${tel2.number}` : '',
        email:                        d.emails?.[0]?.address || '',
        descricao_situacao_cadastral: d.status?.text || '',
        cnae_fiscal_codigo:           d.mainActivity?.id ? String(d.mainActivity.id) : '',
        cnae_fiscal_descricao:        d.mainActivity?.text || '',
        natureza_juridica:            d.company?.nature?.text || '',
        porte:                        d.company?.size?.text || '',
        inscricao_estadual:           inscricaoEstadual,
        ieObtida,
        naoContribuinte,
      }
    }

    // ── BrasilAPI (sem IE) ───────────────────────────────────────────
    async function tryBrasilApi() {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
      if (!res.ok) throw new Error(res.status === 404 ? 'CNPJ não encontrado.' : `Erro ${res.status}`)
      const d = await res.json()
      return {
        razao_social:                 d.razao_social,
        nome_fantasia:                d.nome_fantasia,
        logradouro:                   d.logradouro,
        numero:                       d.numero,
        complemento:                  (d.complemento || '').trim(),
        bairro:                       d.bairro,
        municipio:                    d.municipio,
        uf:                           d.uf,
        cep:                          (d.cep || '').replace(/\D/g, ''),
        ddd_telefone_1:               d.ddd_telefone_1 || '',
        ddd_telefone_2:               d.ddd_telefone_2 || '',
        email:                        d.email,
        descricao_situacao_cadastral: d.descricao_situacao_cadastral,
        cnae_fiscal_descricao:        d.cnae_fiscal_descricao,
        natureza_juridica:            d.natureza_juridica,
        porte:                        d.porte,
        inscricao_estadual:           '',
        ieObtida:                     false,
        naoContribuinte:              false,
      }
    }

    // ── publica.cnpj.ws (sem IE) ─────────────────────────────────────
    async function tryPublicaCnpjWs() {
      const res = await fetch(`https://publica.cnpj.ws/cnpj/${digits}`)
      if (!res.ok) throw new Error(res.status === 404 ? 'CNPJ não encontrado.' : `Erro ${res.status}`)
      const d = await res.json()
      const est = d.estabelecimento || {}
      return {
        razao_social:                 d.razao_social,
        nome_fantasia:                est.nome_fantasia,
        logradouro:                   est.logradouro,
        numero:                       est.numero,
        complemento:                  (est.complemento || '').trim(),
        bairro:                       est.bairro,
        municipio:                    est.cidade?.nome,
        uf:                           est.estado?.sigla,
        cep:                          (est.cep || '').replace(/\D/g, ''),
        ddd_telefone_1:               est.ddd1 && est.telefone1 ? `(${est.ddd1}) ${est.telefone1}` : '',
        ddd_telefone_2:               est.ddd2 && est.telefone2 ? `(${est.ddd2}) ${est.telefone2}` : '',
        email:                        est.email,
        descricao_situacao_cadastral: est.situacao_cadastral,
        cnae_fiscal_descricao:        est.atividade_principal?.descricao,
        natureza_juridica:            d.natureza_juridica?.descricao || d.natureza_juridica,
        porte:                        d.porte?.descricao || d.porte,
        inscricao_estadual:           '',
        ieObtida:                     false,
        naoContribuinte:              false,
      }
    }

    // CNPJá primeiro (unica com IE). Se falhar/sem token, cai nas publicas
    // — nesse caso a IE nao vem e a UI avisa.
    try {
      const data = await tryCnpja()
      return { ok: true, data: caixaAltaCampos(data) }
    } catch (errCnpja) {
      try {
        const data = await tryBrasilApi().catch(() => tryPublicaCnpjWs())
        // Se a CNPJá tinha token mas falhou por outro motivo, propaga o
        // aviso pra UI mostrar (sem quebrar o preenchimento do resto).
        const semToken = /sem token/i.test(errCnpja.message || '')
        data.avisoIe = semToken
          ? 'Token da CNPJá não configurado — Inscrição Estadual não foi buscada.'
          : `Inscrição Estadual não obtida (${errCnpja.message}). Preencha manualmente.`
        return { ok: true, data: caixaAltaCampos(data) }
      } catch (e2) {
        return { ok: false, erro: e2.message || 'Sem conexão ou serviço indisponível.' }
      }
    }
  })

  ipcMain.handle('entidade:buscarCep', async (_e, cep) => {
    const digits = String(cep ?? '').replace(/\D/g, '')
    if (digits.length !== 8) return { ok: false, erro: 'CEP deve ter 8 dígitos.' }
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      if (!res.ok) return { ok: false, erro: `Erro ${res.status}` }
      const data = await res.json()
      if (data.erro) return { ok: false, erro: 'CEP não encontrado.' }
      return { ok: true, data: caixaAltaCampos(data) }
    } catch (e) {
      return { ok: false, erro: 'Sem conexão ou serviço indisponível.' }
    }
  })
}
