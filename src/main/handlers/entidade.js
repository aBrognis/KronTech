export function registerEntidadeHandlers({ ipcMain }) {

  // ── Entidade — consulta CNPJ e CEP ───────────────────────────────────────
  ipcMain.handle('entidade:buscarCnpj', async (_e, cnpj) => {
    const digits = String(cnpj ?? '').replace(/\D/g, '')
    if (digits.length !== 14) return { ok: false, erro: 'CNPJ deve ter 14 dígitos.' }

    // Tenta BrasilAPI primeiro (sem limite agressivo de requisições)
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
      }
    }

    // Fallback: publica.cnpj.ws
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
      }
    }

    try {
      const data = await tryBrasilApi().catch(() => tryPublicaCnpjWs())
      return { ok: true, data }
    } catch (e) {
      return { ok: false, erro: e.message || 'Sem conexão ou serviço indisponível.' }
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
      return { ok: true, data }
    } catch (e) {
      return { ok: false, erro: 'Sem conexão ou serviço indisponível.' }
    }
  })
}
