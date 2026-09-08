// ============================================================================
// EXEMPLO DE REFERENCIA — nao e uma tela ativa, e o molde.
//
// Mostra como fica uma tela de apoio NATIVA do KronTech usando o
// <TelaCadastroPadrao>. Uma tela real (Bancos, Naturezas, Condicoes de
// Pagamento, CNAE) e basicamente isto: ~50 linhas.
//
// Pra virar tela real:
//   1. copie este arquivo pra src/renderer/src/pages/bancos/index.jsx
//   2. ajuste `config.api` pro handler real (window.api.bancos)
//   3. ajuste colunas / renderForm / emptyForm
//   4. registre a rota em App.jsx + item no MENU_BASE (Sidebar.jsx)
//   5. backend: handler + service + migration da tabela banco_001
// ============================================================================

import TelaCadastroPadrao, {
  CampoTexto, CampoSelect, CampoCheck, LinhaCampos,
} from '../../components/cadastroPadrao/TelaCadastroPadrao'

// A tabela: banco_001 (codigo, nome, compe, ispb, site, ativo)
const EMPTY_FORM = { id: null, codigo: '', nome: '', compe: '', ispb: '', site: '', ativo: true }

export default function TelaBancos({ newTrigger }) {
  return (
    <TelaCadastroPadrao
      newTrigger={newTrigger}
      tituloSingular="banco"
      buscaPlaceholder="nome, código Compe..."
      config={{
        api: window.api.bancos, // { listar, obter, criar, atualizar, excluir }
        emptyForm: EMPTY_FORM,
        // registro do banco -> form (aqui e quase identidade)
        paraForm: (d) => ({
          id: d.id, codigo: d.codigo || '', nome: d.nome || '',
          compe: d.compe || '', ispb: d.ispb || '', site: d.site || '',
          ativo: d.ativo !== false,
        }),
        // form -> payload (o backend cuida de codigo sequencial no insert)
        paraPayload: (f) => ({
          nome: f.nome.trim(), compe: f.compe.trim(),
          ispb: f.ispb.trim(), site: f.site.trim(), ativo: f.ativo,
        }),
        validar: (f) => {
          if (!f.nome.trim()) return 'Informe o nome do banco.'
          if (f.compe && !/^\d{3}$/.test(f.compe.trim())) return 'Código Compe deve ter 3 dígitos.'
          return null
        },
      }}
      colunas={[
        { chave: 'codigo', label: 'Código', largura: 80 },
        { chave: 'compe', label: 'Compe', largura: 80 },
        { chave: 'nome', label: 'Nome' },
        { chave: 'ativo', label: 'Situação', largura: 100,
          render: (r) => <span className={`badge ${r.ativo ? 'badge-green' : 'badge-yellow'}`}>{r.ativo ? 'Ativo' : 'Inativo'}</span> },
      ]}
      // habilita "Sel" + botao direito -> Ativar / Inativar
      statusEmMassa={{
        valores: [{ valor: true, label: 'Ativar' }, { valor: false, label: 'Inativar' }],
        aplicar: (ids, valor) => window.api.bancos.mudarAtivoLote({ ids, ativo: valor }),
      }}
      renderForm={({ form, setForm, isRO }) => (
        <>
          <LinhaCampos cols="auto 120px 1fr">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Código</label>
              <div className="form-input" style={{ width: 80, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1.5, color: form.codigo ? 'var(--or)' : 'var(--t3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {form.codigo || ''}
              </div>
            </div>
            <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="compe" label="Compe" maxLength={3} placeholder="341" />
            <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="nome" label="Nome do banco" placeholder="Itaú Unibanco" />
          </LinhaCampos>
          <LinhaCampos>
            <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="ispb" label="ISPB" maxLength={8} placeholder="60701190" />
            <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="site" label="Site" placeholder="https://www.itau.com.br" />
          </LinhaCampos>
          <CampoCheck form={form} setForm={setForm} isRO={isRO} campo="ativo" label="Banco ativo" />
        </>
      )}
    />
  )
}
