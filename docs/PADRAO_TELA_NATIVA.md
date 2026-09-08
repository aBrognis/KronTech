# Padrao: tela nativa React dedicada (cadastro simples)

> Complementa `docs/PADRAO_TELAS.md`. Aquele documento diz "cadastro simples
> = use o FormBuilder". Este cobre o caso em que a tela **precisa vir nativa
> no codigo** (o cliente final nao vai montar tela nenhuma), mas ainda e um
> cadastro simples que nao justifica uma pagina inteira escrita a mao.
>
> Solucao: um molde unico. Frontend `<TelaCadastroPadrao>`, backend
> `criarCadastroPadrao()`. Uma tela nova = ~50 linhas de config, e sai
> visualmente/funcionalmente IDENTICA as telas do FormBuilder.

## Quando usar este padrao

Cadastro de UMA tabela, campos de texto/select/checkbox, com codigo
sequencial. Exemplos: Bancos, Naturezas Juridicas, Condicoes de Pagamento,
CNAE, Categorias, Unidades de Medida.

**Nao use** para telas com abas, grid-filho com CRUD, consulta a API
externa, layout proprio -> essas sao pagina React dedicada de verdade
(ex: Entidade, Viagens).

## Arquivos do molde

| Camada | Arquivo | O que faz |
|---|---|---|
| Front | `src/renderer/src/components/cadastroPadrao/TelaCadastroPadrao.jsx` | Shell: abas Acesso/Cadastro, tabela paginada, FormToolbar, selecao em massa, menu de contexto. Exporta helpers de campo (`CampoTexto`, `CampoSelect`, `CampoCheck`, `LinhaCampos`). |
| Front | `src/renderer/src/components/cadastroPadrao/useCadastroPadrao.js` | Hook com toda a logica CRUD (listar/navegar/gravar/excluir/selecionar). |
| Front | `src/renderer/src/components/cadastroPadrao/_EXEMPLO_TelaBancos.jsx` | Referencia viva. Copie e adapte. Nao e tela ativa. |
| Back | `src/main/services/cadastroPadraoFactory.js` | `criarCadastroPadrao(config)` -> objeto {listar,obter,criar,atualizar,excluir,mudarAtivoLote}. `registrarHandlersCadastro()` -> os 6 ipcMain.handle. |

## Passo a passo pra criar "Naturezas Juridicas"

### 1. Migration da tabela

```js
// migrations/<ts>_criar-natureza-juridica.js
export const up = (pgm) => {
  pgm.createTable('natureza_juridica_001', {
    id: 'id',
    codigo: { type: 'varchar(10)', default: '' },
    descricao: { type: 'varchar(150)', notNull: true },
    codigo_receita: { type: 'varchar(10)' },        // ex "206-2"
    ativo: { type: 'boolean', notNull: true, default: true },
    criado_em: { type: 'timestamp', default: pgm.func('now()') },
    alterado_em: { type: 'timestamp', default: pgm.func('now()') },
  });
  pgm.sql(`CREATE SEQUENCE IF NOT EXISTS natureza_juridica_001_codigo_seq START 1`);
  // seed opcional com a lista oficial aqui
};
export const down = (pgm) => {
  pgm.dropTable('natureza_juridica_001');
  pgm.sql(`DROP SEQUENCE IF EXISTS natureza_juridica_001_codigo_seq`);
};
```

### 2. Backend: service + handler

```js
// src/main/handlers/naturezaJuridica.js
import { criarCadastroPadrao, registrarHandlersCadastro } from '../services/cadastroPadraoFactory'

const crud = criarCadastroPadrao({
  tabela: 'natureza_juridica_001',
  colunas: ['descricao', 'codigo_receita'],
  colunasBusca: ['descricao', 'codigo_receita'],
  ordem: 'descricao ASC',
  normalizar: (d) => ({
    ...d,
    descricao: d.descricao?.trim().toUpperCase(),
    codigo_receita: d.codigo_receita?.trim(),
  }),
})

export function registerNaturezaJuridicaHandlers({ ipcMain, wrap }) {
  registrarHandlersCadastro(ipcMain, wrap, 'naturezaJuridica', crud)
}
```

Registrar em `src/main/ipcHandlers.js` (junto dos outros `register*Handlers`).

### 3. Preload

```js
// src/preload/index.js  -> dentro do objeto api
naturezaJuridica: {
  listar:         (f)  => ipcRenderer.invoke('naturezaJuridica:listar', f),
  obter:          (id) => ipcRenderer.invoke('naturezaJuridica:obter', id),
  criar:          (d)  => ipcRenderer.invoke('naturezaJuridica:criar', d),
  atualizar:      (d)  => ipcRenderer.invoke('naturezaJuridica:atualizar', d),
  excluir:        (id) => ipcRenderer.invoke('naturezaJuridica:excluir', id),
  mudarAtivoLote: (p)  => ipcRenderer.invoke('naturezaJuridica:mudarAtivoLote', p),
},
```

### 4. Tela

```jsx
// src/renderer/src/pages/naturezaJuridica/index.jsx
import TelaCadastroPadrao, { CampoTexto, LinhaCampos } from '../../components/cadastroPadrao/TelaCadastroPadrao'

const EMPTY = { id: null, codigo: '', descricao: '', codigo_receita: '', ativo: true }

export default function NaturezaJuridica({ newTrigger }) {
  return (
    <TelaCadastroPadrao
      newTrigger={newTrigger}
      tituloSingular="natureza jurídica"
      buscaPlaceholder="descrição, código Receita..."
      config={{
        api: window.api.naturezaJuridica,
        emptyForm: EMPTY,
        paraForm: (d) => ({ id: d.id, codigo: d.codigo || '', descricao: d.descricao || '', codigo_receita: d.codigo_receita || '', ativo: d.ativo !== false }),
        paraPayload: (f) => ({ descricao: f.descricao, codigo_receita: f.codigo_receita, ativo: f.ativo }),
        validar: (f) => (!f.descricao.trim() ? 'Informe a descrição.' : null),
      }}
      colunas={[
        { chave: 'codigo', label: 'Código', largura: 80 },
        { chave: 'codigo_receita', label: 'Cód. Receita', largura: 110 },
        { chave: 'descricao', label: 'Descrição' },
        { chave: 'ativo', label: 'Situação', largura: 100, render: (r) => <span className={`badge ${r.ativo ? 'badge-green' : 'badge-yellow'}`}>{r.ativo ? 'Ativo' : 'Inativo'}</span> },
      ]}
      statusEmMassa={{
        valores: [{ valor: true, label: 'Ativar' }, { valor: false, label: 'Inativar' }],
        aplicar: (ids, ativo) => window.api.naturezaJuridica.mudarAtivoLote({ ids, ativo }),
      }}
      renderForm={({ form, setForm, isRO }) => (
        <>
          <LinhaCampos cols="auto 130px 1fr">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Código</label>
              <div className="form-input" style={{ width: 80, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1.5, color: form.codigo ? 'var(--or)' : 'var(--t3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{form.codigo || ''}</div>
            </div>
            <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="codigo_receita" label="Cód. Receita" maxLength={10} placeholder="206-2" />
            <CampoTexto form={form} setForm={setForm} isRO={isRO} campo="descricao" label="Descrição" upper placeholder="SOCIEDADE EMPRESÁRIA LIMITADA" />
          </LinhaCampos>
        </>
      )}
    />
  )
}
```

### 5. Rota + menu

- `src/renderer/src/components/Sidebar.jsx` -> `MENU_BASE`: adicionar item `{ id: 'natureza-juridica', label: 'Naturezas Jurídicas', Icon: <icone> }` no grupo Cadastros.
- `src/renderer/src/App.jsx` -> `PAGE_META['natureza-juridica']` + no `renderPage` rotear pra `<NaturezaJuridica />`.

Pronto. A tela ganha Acesso+Cadastro+lupa+paginacao+selecao em massa,
identica as do FormBuilder, e o cliente so usa.

## Telas de apoio planejadas (para a tela de Entidade)

| Tela | Tabela | Colunas alem de codigo/ativo | Seed oficial |
|---|---|---|---|
| Naturezas Juridicas | `natureza_juridica_001` | descricao, codigo_receita | lista Receita Federal (~90 itens) |
| Condicoes de Pagamento | `condicao_pagamento_001` | descricao, dias (jsonb: [30,60,90]), tipo (avista/prazo) | 5-6 padrao |
| Bancos | `banco_001` | nome, compe, ispb, site | lista Febraban (~200 itens) |
| CNAE | `cnae_001` | codigo_cnae, descricao, secao, divisao | tabela IBGE (~1.300 itens) — so consulta, sem incluir/alterar (`somenteLeitura`) |

CNAE e grande e imutavel -> a tela dele passa `statusEmMassa={null}` e o
FormToolbar so mostra Consultar (sem Incluir/Alterar/Excluir). Ajuste
futuro no molde: prop `somenteLeitura`.
