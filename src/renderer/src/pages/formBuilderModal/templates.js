export const TEMPLATES = [
  // ── Documentos e Arquivos ──────────────────────────────────────────────────
  {
    id: 'gestor_arquivos',
    label: 'Gestor de Arquivos', categoria: 'Documentos',
    descricao: 'Espelho exato da tela nativa de Arquivos (arq_001), layout idêntico com painel lateral de informações.',
    nomeTela: 'Gestor de Arquivos', nomeTabela: 'arquivo_001', icone: 'paperclip', canvasW: 1200, canvasH: 426,
    campos: [
      // Coluna principal (esquerda): x_pos 14..986, largura útil 972px
      // Linha 1: Código(100) + gap(14) + Categoria(400) + gap(14) + Pasta(444) = 958... ajuste: Código(110)+gap(14)+Categoria(400)+gap(14)+Pasta(448)=986 → termina 14+972=986
      { _key:'a1', nomeCampo:'codigo',          label:'Código',           tipo:'codigo_auto', tamanho:10,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:10,  opcoes:{seqChars:3},    x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'a2', nomeCampo:'categoria',       label:'Categoria',        tipo:'pasta',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:40,  opcoes:null,            x_pos:138, y_pos:14,  w_px:400, h_px:56 },
      { _key:'a3', nomeCampo:'pasta',           label:'Pasta Virtual',    tipo:'pasta',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:50,  opcoes:null,            x_pos:552, y_pos:14,  w_px:434, h_px:56 },
      { _key:'a4', nomeCampo:'nome',            label:'Nome',             tipo:'texto',       tamanho:300, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:100, opcoes:null,            x_pos:14,  y_pos:78,  w_px:972, h_px:56 },
      { _key:'a5', nomeCampo:'arquivo',         label:'Arquivo',          tipo:'arquivo',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,            x_pos:14,  y_pos:142, w_px:972, h_px:90 },
      { _key:'a6', nomeCampo:'tags',            label:'Tags (vírgula)',   tipo:'tags',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:100, opcoes:null,            x_pos:14,  y_pos:240, w_px:972, h_px:56 },
      { _key:'a7', nomeCampo:'_fav',            label:'Favorito',         tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,            x_pos:14,  y_pos:304, w_px:220, h_px:44 },
      // Coluna lateral (direita): x_pos 1000..1186
      { _key:'a8',  nomeCampo:'div_lat',        label:'', tipo:'divisor', tamanho:0, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'vertical', largura:0, opcoes:null,       x_pos:1000, y_pos:14,  w_px:14,  h_px:398 },
      { _key:'a9',  nomeCampo:'descricao',      label:'Descrição / Observações', tipo:'texto_longo', tamanho:0, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'', largura:100, opcoes:null,          x_pos:1028, y_pos:14,  w_px:158, h_px:160 },
      { _key:'a10', nomeCampo:'div_info',       label:'Informações do Arquivo',  tipo:'divisor', tamanho:0, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null,    x_pos:1028, y_pos:182, w_px:158, h_px:20 },
      { _key:'a11', nomeCampo:'arquivo_nome',   label:'Nome original',    tipo:'texto',       tamanho:500, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:100, opcoes:null,            x_pos:1028, y_pos:210, w_px:158, h_px:36 },
      { _key:'a12', nomeCampo:'arquivo_ext',    label:'Extensão',         tipo:'texto',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,            x_pos:1028, y_pos:254, w_px:158, h_px:36 },
      { _key:'a13', nomeCampo:'arquivo_tamanho',label:'Tamanho',          tipo:'numero',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,            x_pos:1028, y_pos:298, w_px:158, h_px:36 },
      { _key:'a14', nomeCampo:'_ts',            label:'Datas',            tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,            x_pos:1028, y_pos:342, w_px:158, h_px:56 },
    ],
  },

  // ── Cadastros ──────────────────────────────────────────────────────────────
  {
    id: 'cadastro_entidade',
    emoji: '🏢', label: 'Cadastro de Entidade', categoria: 'Cadastros',
    descricao: 'Template único para pessoas, clientes, fornecedores e terceiros: PF/PJ, CPF/CNPJ, endereço, contatos, papéis e foto.',
    nomeTela: 'Cadastro de Entidade', icone: 'users', canvasW: 1200, canvasH: 722,
    campos: [
      // Linha 1: Código(110)+14+Nome(620)+14+Apelido(428)=1172 → last=14+1158+28=1186✓ → 14+110=124, 138+620=758, 772+428=1200→1186✓
      { _key:'en1',  nomeCampo:'codigo',       label:'Código',                  tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:10,  opcoes:{seqChars:5},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'en2',  nomeCampo:'nome',         label:'Nome / Razão Social',     tipo:'texto',       tamanho:300, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:60,  opcoes:null,           x_pos:138, y_pos:14,  w_px:620, h_px:56 },
      { _key:'en3',  nomeCampo:'apelido',      label:'Apelido / Nome Fantasia', tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:30,  opcoes:null,           x_pos:772, y_pos:14,  w_px:414, h_px:56 },
      // Linha 2: PF/PJ(200)+14+CPF/CNPJ(340)+14+IE/RG(240)+14+Status(350)=1158→+14=1172✓ last=620+350=970+216=1186✓
      { _key:'en4',  nomeCampo:'tipo_pessoa',  label:'PF / PJ',                 tipo:'radio',       tamanho:1,   obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:20,  opcoes:[
        {label:'Física',valor:'F',cor:'#60A5FA'},{label:'Jurídica',valor:'J',cor:'#34D399'},
      ], x_pos:14,  y_pos:78,  w_px:200, h_px:56 },
      { _key:'en5',  nomeCampo:'documento',    label:'CPF / CNPJ',              tipo:'documento',   tamanho:18,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:30,  opcoes:{tipoRef:'tipo_pessoa'}, x_pos:228, y_pos:78, w_px:340, h_px:56 },
      { _key:'en6',  nomeCampo:'ie_rg',        label:'IE / RG',                 tipo:'texto',       tamanho:30,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:20,  opcoes:null,           x_pos:582, y_pos:78,  w_px:240, h_px:56 },
      { _key:'en7',  nomeCampo:'status',       label:'Status',                  tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'ativo', largura:30, opcoes:[
        {label:'Ativo',valor:'ativo',cor:'#4ADE80'},{label:'Inativo',valor:'inativo',cor:'#94A3B8'},{label:'Bloqueado',valor:'bloqueado',cor:'#F87171'},{label:'Prospecto',valor:'prospecto',cor:'#60A5FA'},
      ], x_pos:836, y_pos:78,  w_px:350, h_px:56 },
      // Linha 3: Papéis full width
      { _key:'en8',  nomeCampo:'papeis',       label:'Papéis',                  tipo:'flags',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:[
        {label:'Cliente',valor:'C'},{label:'Fornecedor',valor:'F'},{label:'Colaborador',valor:'O'},{label:'Parceiro',valor:'P'},
      ], x_pos:14,  y_pos:142, w_px:1172, h_px:56 },
      // Divisor Contato
      { _key:'en9',  nomeCampo:'div_contato',  label:'Contato',                 tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14, y_pos:206, w_px:1172, h_px:20 },
      // Linha 4: Telefone(270)+14+Celular(270)+14+Email(430)+14+Site(160)=1158→+14=1172✓ last=946+160=1106... recalc: 270+14+270+14+430+14+160=1172✓ last_x=14+270+14+270+14+430+14=1006, 1006+160=1166≠1186 → adjust: Site=180: 270+14+270+14+430+14+180=1192≠1172 → 3 campos: Tel(270)+Cel(270)+Email(464)+Site(150): 270+14+270+14+464+14+150=1196≠ → Tel(260)+Cel(260)+Email(450)+Site(188)=1158+14=1172: last=14+260+14+260+14+450+14=1026, 1026+188=1214≠1186 → last x_pos=14+260+14+260+14+450+14=1026, 1026+160=1186: Tel(260)+gap+Cel(260)+gap+Email(450)+gap+Site=1172→Site=1172-260-14-260-14-450-14=160: last_x=14+260+14+260+14+450+14=1026, 1026+160=1186✓
      { _key:'en10', nomeCampo:'telefone',     label:'Telefone',                tipo:'telefone',    tamanho:30,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:25,  opcoes:null,           x_pos:14,  y_pos:234, w_px:260, h_px:56 },
      { _key:'en11', nomeCampo:'celular',      label:'Celular',                 tipo:'telefone',    tamanho:30,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:25,  opcoes:null,           x_pos:288, y_pos:234, w_px:260, h_px:56 },
      { _key:'en12', nomeCampo:'email',        label:'E-mail',                  tipo:'email',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:40,  opcoes:null,           x_pos:562, y_pos:234, w_px:450, h_px:56 },
      { _key:'en13', nomeCampo:'site',         label:'Site',                    tipo:'url',         tamanho:300, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:20,  opcoes:null,           x_pos:1026, y_pos:234, w_px:160, h_px:56 },
      // Divisor Endereço
      { _key:'en14', nomeCampo:'div_end',      label:'Endereço',                tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14, y_pos:298, w_px:1172, h_px:20 },
      // Linha 5: CEP(160)+14+Logradouro(560)+14+Nº(120)+14+Complemento(290)=1158→+14=1172: last=14+160+14+560+14+120+14=896, 896+290=1186✓
      { _key:'en15', nomeCampo:'cep',          label:'CEP',                     tipo:'cep',         tamanho:9,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:15,  opcoes:null,           x_pos:14,  y_pos:326, w_px:160, h_px:56 },
      { _key:'en16', nomeCampo:'logradouro',   label:'Logradouro',              tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:188, y_pos:326, w_px:560, h_px:56 },
      { _key:'en17', nomeCampo:'numero',       label:'Nº',                      tipo:'texto',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:10,  opcoes:null,           x_pos:762, y_pos:326, w_px:120, h_px:56 },
      { _key:'en18', nomeCampo:'complemento',  label:'Complemento',             tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:20,  opcoes:null,           x_pos:896, y_pos:326, w_px:290, h_px:56 },
      // Linha 6: Bairro(310)+14+Cidade(500)+14+UF(80)=904→+14+14=932≠1172 → Bairro(340)+14+Cidade(640)+14+UF(160)=1154→+18=no → Bairro(320)+14+Cidade(660)+14+UF(178)=1172→last=14+320+14+660+14=1022, 1022+178=1200≠1186 → Bairro(300)+14+Cidade(620)+14+UF(224)=1158+14=1172: last=14+300+14+620+14=962, 962+224=1186✓
      { _key:'en19', nomeCampo:'bairro',       label:'Bairro',                  tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:25,  opcoes:null,           x_pos:14,  y_pos:390, w_px:300, h_px:56 },
      { _key:'en20', nomeCampo:'cidade',       label:'Cidade',                  tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:33,  opcoes:null,           x_pos:328, y_pos:390, w_px:620, h_px:56 },
      { _key:'en21', nomeCampo:'uf',           label:'UF',                      tipo:'texto',       tamanho:2,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:10,  opcoes:null,           x_pos:962, y_pos:390, w_px:224, h_px:56 },
      // Divisor Outros
      { _key:'en22', nomeCampo:'div_obs',      label:'Outros',                  tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14, y_pos:454, w_px:1172, h_px:20 },
      // Linha 7: Foto(200) + Tags+Obs a direita
      { _key:'en23', nomeCampo:'foto',         label:'Foto / Logo',             tipo:'imagem',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:20,  opcoes:null,           x_pos:14,  y_pos:482, w_px:200, h_px:160 },
      { _key:'en24', nomeCampo:'tags',         label:'Tags',                    tipo:'tags',        tamanho:300, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:50,  opcoes:null,           x_pos:228, y_pos:482, w_px:958, h_px:56 },
      { _key:'en25', nomeCampo:'observacoes',  label:'Observações',             tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:228, y_pos:546, w_px:958, h_px:90 },
      // Linha 8: Fav + Timestamps
      { _key:'en26', nomeCampo:'_fav',         label:'Favorito',                tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:650, w_px:220, h_px:44 },
      { _key:'en27', nomeCampo:'_ts',          label:'Datas',                   tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:650, w_px:938, h_px:56 },
    ],
  },

  {
    id: 'cadastro_produtos',
    emoji: '📦', label: 'Cadastro de Produtos', categoria: 'Cadastros',
    descricao: 'Código, nome, categoria, preço de custo e venda com cálculo de margem, estoque, foto e status.',
    nomeTela: 'Cadastro de Produtos', icone: 'package', canvasW: 1200, canvasH: 570,
    campos: [
      // Linha 1: Código(110)+14+Nome(848)+14+Ativo(200)=1172: last=14+110+14+848+14=1000, 1000+200=1200≠1186 → Ativo(186): last=1000+186=1186✓
      { _key:'pr1',  nomeCampo:'codigo',       label:'Código',        tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:10,  opcoes:{seqChars:3},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'pr2',  nomeCampo:'nome',          label:'Nome',          tipo:'texto',       tamanho:200, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:75,  opcoes:null,           x_pos:138, y_pos:14,  w_px:848, h_px:56 },
      { _key:'pr3',  nomeCampo:'ativo',         label:'Ativo',         tipo:'booleano',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'true',largura:10,  opcoes:null,           x_pos:1000, y_pos:14,  w_px:186, h_px:56 },
      // Linha 2: Categoria(380)+14+Unidade(260)+14+Estoque(240)+14+Estoque Mín(250)=1158→+14=1172: last=14+380+14+260+14+240+14=936, 936+250=1186✓
      { _key:'pr4',  nomeCampo:'categoria',     label:'Categoria',     tipo:'pasta',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:33,  opcoes:null,           x_pos:14,  y_pos:78,  w_px:380, h_px:56 },
      { _key:'pr5',  nomeCampo:'unidade',       label:'Unidade',       tipo:'select',      tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'un',  largura:25,  opcoes:[
        {label:'Unidade',valor:'un',cor:'#60A5FA'},{label:'Kg',valor:'kg',cor:'#34D399'},{label:'Litro',valor:'lt',cor:'#A78BFA'},
        {label:'Metro',valor:'mt',cor:'#FB923C'},{label:'Caixa',valor:'cx',cor:'#F472B6'},{label:'Par',valor:'pr',cor:'#FBD24C'},
      ], x_pos:408, y_pos:78,  w_px:260, h_px:56 },
      { _key:'pr6',  nomeCampo:'estoque',       label:'Estoque',       tipo:'numero',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'0',   largura:25,  opcoes:null,           x_pos:682, y_pos:78,  w_px:240, h_px:56 },
      { _key:'pr7',  nomeCampo:'estoque_min',   label:'Estoque Mín.',  tipo:'numero',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'0',   largura:25,  opcoes:null,           x_pos:936, y_pos:78,  w_px:250, h_px:56 },
      { _key:'pr8',  nomeCampo:'div1',          label:'Preços',        tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14,  y_pos:142, w_px:1172, h_px:20 },
      // Linha 3: CustoP(380)+14+VendaP(380)+14+Margem(380)=1154→+18≠ → 3 iguais=(1172-28)/3=381.3→ Custo(381)+14+Venda(381)+14+Margem(382): last=14+381+14+381+14=804, 804+382=1186✓
      { _key:'pr9',  nomeCampo:'preco_custo',   label:'Preço de Custo',tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:33,  opcoes:null,           x_pos:14,  y_pos:170, w_px:381, h_px:56 },
      { _key:'pr10', nomeCampo:'preco_venda',   label:'Preço de Venda',tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:33,  opcoes:null,           x_pos:409, y_pos:170, w_px:381, h_px:56 },
      { _key:'pr11', nomeCampo:'margem',        label:'Margem %',      tipo:'calculo',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:33,  opcoes:{formula:'({preco_venda} - {preco_custo}) / {preco_custo} * 100'}, x_pos:804, y_pos:170, w_px:382, h_px:56 },
      // Linha 4: Foto(220)+14+Descrição(938)=1152≠ → Foto(220)+14+Desc(938)=1172: last=14+220+14=248, 248+938=1186✓
      { _key:'pr12', nomeCampo:'foto',          label:'Foto',          tipo:'imagem',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:20,  opcoes:null,           x_pos:14,  y_pos:234, w_px:220, h_px:180 },
      { _key:'pr13', nomeCampo:'descricao',     label:'Descrição',     tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:80,  opcoes:null,           x_pos:248, y_pos:234, w_px:938, h_px:180 },
      { _key:'pr14', nomeCampo:'tags',          label:'Tags',          tipo:'tags',        tamanho:300, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:422, w_px:1172, h_px:56 },
      { _key:'pr15', nomeCampo:'_fav',          label:'Favorito',      tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:486, w_px:220, h_px:44 },
      { _key:'pr16', nomeCampo:'_ts',           label:'Datas',         tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:486, w_px:938, h_px:56 },
    ],
  },

  // ── Operacional ────────────────────────────────────────────────────────────
  {
    id: 'controle_tarefas',
    emoji: '✅', label: 'Controle de Tarefas', categoria: 'Operacional',
    descricao: 'Título, responsável, prioridade com radio colorido, prazo, progresso visual e checklist de flags.',
    nomeTela: 'Controle de Tarefas', icone: 'check-circle-2', canvasW: 1200, canvasH: 580,
    campos: [
      // Linha 1: Código(110)+14+Título(1062)=1172→last=138+1062=1200≠1186 → Título(1048): last=138+1048=1186✓
      { _key:'t1',  nomeCampo:'codigo',       label:'Código',        tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:10,  opcoes:{seqChars:4},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'t2',  nomeCampo:'titulo',       label:'Título',        tipo:'texto',       tamanho:300, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:90,  opcoes:null,           x_pos:138, y_pos:14,  w_px:1048, h_px:56 },
      // Linha 2: Responsável(380)+14+Prazo(260)+14+Prioridade(500)=1154→+18≠ → Resp(380)+Prazo(260)+Prio(518)=1158+14=1172: last=14+380+14+260+14=682, 682+518=1200≠1186 → last x=14+380+14+260+14=682, 682+504=1186→ Prio=504: 380+14+260+14+504=1172✓
      { _key:'t3',  nomeCampo:'responsavel',  label:'Responsável',   tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:33,  opcoes:null,           x_pos:14,  y_pos:78,  w_px:380, h_px:56 },
      { _key:'t4',  nomeCampo:'prazo',        label:'Prazo',         tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:408, y_pos:78,  w_px:260, h_px:56 },
      { _key:'t5',  nomeCampo:'prioridade',   label:'Prioridade',    tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'media',largura:45, opcoes:[
        {label:'Baixa',valor:'baixa',cor:'#4ADE80'},{label:'Média',valor:'media',cor:'#FBD24C'},{label:'Alta',valor:'alta',cor:'#FB923C'},{label:'Urgente',valor:'urgente',cor:'#F87171'},
      ], x_pos:682, y_pos:78,  w_px:504, h_px:56 },
      { _key:'t6',  nomeCampo:'status',       label:'Status',        tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'pendente',largura:100, opcoes:[
        {label:'Pendente',valor:'pendente',cor:'#94A3B8'},{label:'Em andamento',valor:'andamento',cor:'#60A5FA'},{label:'Aguardando',valor:'aguardando',cor:'#FBD24C'},{label:'Concluída',valor:'concluida',cor:'#4ADE80'},
      ], x_pos:14,  y_pos:142, w_px:1172, h_px:56 },
      { _key:'t7',  nomeCampo:'progresso',    label:'Progresso',     tipo:'progresso',   tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'0',   largura:100, opcoes:null,           x_pos:14,  y_pos:206, w_px:1172, h_px:56 },
      // Linha checklist(579)+14+tags(579)=1158→+14=1172: last=14+579+14=607, 607+579=1186✓
      { _key:'t8',  nomeCampo:'checklist',    label:'Checklist',     tipo:'flags',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:[
        {label:'Iniciado',valor:'I'},{label:'Revisado',valor:'R'},{label:'Aprovado',valor:'A'},{label:'Entregue',valor:'E'},
      ], x_pos:14,  y_pos:270, w_px:579, h_px:56 },
      { _key:'t9',  nomeCampo:'tags',         label:'Tags',          tipo:'tags',        tamanho:300, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:50,  opcoes:null,           x_pos:607, y_pos:270, w_px:579, h_px:56 },
      { _key:'t10', nomeCampo:'descricao',    label:'Descrição',     tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:334, w_px:1172, h_px:90 },
      { _key:'t11', nomeCampo:'_fav',         label:'Favorito',      tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:432, w_px:220, h_px:44 },
      { _key:'t12', nomeCampo:'_ts',          label:'Datas',         tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:432, w_px:938, h_px:56 },
    ],
  },

  {
    id: 'ordem_servico',
    emoji: '🔧', label: 'Ordem de Serviço', categoria: 'Operacional',
    descricao: 'OS completa com cliente, equipamento, defeito, técnico, datas, status e valor total calculado.',
    nomeTela: 'Ordem de Serviço', icone: 'wrench', canvasW: 1200, canvasH: 572,
    campos: [
      // Linha 1: NúmOS(150)+14+Status(1008)=1172→last=178+1008=1186✓
      { _key:'os1',  nomeCampo:'numero',       label:'Número OS',     tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:13,  opcoes:{seqChars:5},   x_pos:14,  y_pos:14,  w_px:150, h_px:56 },
      { _key:'os2',  nomeCampo:'status',       label:'Status',        tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'aberta',largura:87, opcoes:[
        {label:'Aberta',valor:'aberta',cor:'#60A5FA'},{label:'Em execução',valor:'execucao',cor:'#FBD24C'},{label:'Aguardando peça',valor:'aguardando',cor:'#FB923C'},{label:'Concluída',valor:'concluida',cor:'#4ADE80'},{label:'Cancelada',valor:'cancelada',cor:'#F87171'},
      ], x_pos:178, y_pos:14,  w_px:1008, h_px:56 },
      // Linha 2: Cliente(580)+14+Telefone(280)+14+Técnico(294)=1172→last=14+580+14+280+14=902, 902+294=1196≠1186 → Cliente(580)+Tel(274)+Tec(284)=1138+34=no → Cliente(574)+Tel(280)+Tec(284)=1138+34=no → C(560)+T(280)+Tec(298)=1138+34=1172: last=14+560+14+280+14=882, 882+298=1180≠1186 → C(560)+T(280)+Tec(304)=1144+28=1172: last=14+560+14+280+14=882, 882+304=1186✓
      { _key:'os3',  nomeCampo:'cliente',      label:'Cliente',       tipo:'texto',       tamanho:200, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:47,  opcoes:null,           x_pos:14,  y_pos:78,  w_px:560, h_px:56 },
      { _key:'os4',  nomeCampo:'telefone',     label:'Telefone',      tipo:'telefone',    tamanho:30,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24,  opcoes:null,           x_pos:588, y_pos:78,  w_px:280, h_px:56 },
      { _key:'os5',  nomeCampo:'tecnico',      label:'Técnico',       tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:25,  opcoes:null,           x_pos:882, y_pos:78,  w_px:304, h_px:56 },
      { _key:'os6',  nomeCampo:'div1',         label:'Equipamento',   tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14,  y_pos:142, w_px:1172, h_px:20 },
      // Linha 3: Equip(580)+14+Marca(280)+14+Série(284)=1158+14=1172: last=882+284=1166≠1186 → Equip(580)+Marca(280)+Série(298)=1158+28=1186? no → E(574)+M(280)+S(304)=1158+14+14=1186: last=14+574+14+280+14=896, 896+304=1200≠ → E(560)+M(280)+S(298)=1138, 1138+28+2*14=1166≠ → recalc: 3 gaps=2, so c1+c2+c3=1172-2*14=1144: E(580)+M(280)+S(284)=1144✓: last=14+580+14+280+14=902, 902+284=1186✓
      { _key:'os7',  nomeCampo:'equipamento',  label:'Equipamento',   tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:170, w_px:580, h_px:56 },
      { _key:'os8',  nomeCampo:'marca',        label:'Marca/Modelo',  tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:25,  opcoes:null,           x_pos:608, y_pos:170, w_px:280, h_px:56 },
      { _key:'os9',  nomeCampo:'serie',        label:'Nº de Série',   tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:25,  opcoes:null,           x_pos:902, y_pos:170, w_px:284, h_px:56 },
      // Linha 4: Defeito+Serviço side by side: (1172-14)/2=579 each: last=14+579+14=607, 607+579=1186✓
      { _key:'os10', nomeCampo:'defeito',      label:'Defeito Relatado',tipo:'texto_longo',tamanho:0,  obrigatorio:true,  sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:234, w_px:579, h_px:90 },
      { _key:'os11', nomeCampo:'servico',      label:'Serviço Executado',tipo:'texto_longo',tamanho:0, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:607, y_pos:234, w_px:579, h_px:90 },
      { _key:'os12', nomeCampo:'div2',         label:'Valores',       tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14,  y_pos:332, w_px:1172, h_px:20 },
      // Linha 5: Entrada(260)+14+Previsão(260)+14+VlPeças(290)+14+VlServiço(310)=1134+42=1176≠ → 4 gaps: c1+c2+c3+c4=1172-3*14=1130: 260+260+280+330=1130✓: last=14+260+14+260+14+280+14=856, 856+330=1186✓
      { _key:'os13', nomeCampo:'dt_entrada',   label:'Entrada',       tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:14,  y_pos:360, w_px:260, h_px:56 },
      { _key:'os14', nomeCampo:'dt_entrega',   label:'Previsão Entrega',tipo:'data',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:288, y_pos:360, w_px:260, h_px:56 },
      { _key:'os15', nomeCampo:'vl_pecas',     label:'Valor Peças',   tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24,  opcoes:null,           x_pos:562, y_pos:360, w_px:280, h_px:56 },
      { _key:'os16', nomeCampo:'vl_servico',   label:'Valor Serviço', tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:28,  opcoes:null,           x_pos:856, y_pos:360, w_px:330, h_px:56 },
      // Linha 6: Total(380)+14+Garantia(310)=704→+14=718≠ → Total(380)+Garantia(500)=880→ we have more space: Total(500)+Garantia(658)=1158+14=1172: last=14+500+14=528, 528+658=1186✓
      { _key:'os17', nomeCampo:'vl_total',     label:'Total',         tipo:'calculo',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:42,  opcoes:{formula:'{vl_pecas} + {vl_servico}'}, x_pos:14, y_pos:424, w_px:500, h_px:56 },
      { _key:'os18', nomeCampo:'garantia',     label:'Garantia',      tipo:'select',      tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:55,  opcoes:[
        {label:'Sem garantia',valor:'0',cor:'#94A3B8'},{label:'30 dias',valor:'30',cor:'#60A5FA'},{label:'90 dias',valor:'90',cor:'#34D399'},{label:'6 meses',valor:'180',cor:'#4ADE80'},{label:'1 ano',valor:'365',cor:'#A78BFA'},
      ], x_pos:528, y_pos:424, w_px:658, h_px:56 },
      { _key:'os19', nomeCampo:'_fav',         label:'Favorito',      tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:488, w_px:220, h_px:44 },
      { _key:'os20', nomeCampo:'_ts',          label:'Datas',         tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:488, w_px:938, h_px:56 },
    ],
  },

  {
    id: 'controle_financeiro',
    emoji: '💰', label: 'Controle Financeiro', categoria: 'Operacional',
    descricao: 'Lançamentos de receitas e despesas com categoria, conta, data de vencimento e pagamento, valor e status.',
    nomeTela: 'Controle Financeiro', icone: 'dollar-sign', canvasW: 1200, canvasH: 476,
    campos: [
      // Linha 1: Código(120)+14+Descrição(1038)=1152→+14=1166≠ → Cód(120)+Desc(1052)=1172→last=148+1052=1200≠1186 → Cód(130)+Desc(1042)=1172→last=158+1042=1200≠ → Cód(120)+Desc(1038)=1158→+14=1172, last=148+1038=1186✓
      { _key:'f1',  nomeCampo:'codigo',        label:'Código',        tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:10,  opcoes:{seqChars:5},   x_pos:14,  y_pos:14,  w_px:120, h_px:56 },
      { _key:'f2',  nomeCampo:'descricao',     label:'Descrição',     tipo:'texto',       tamanho:300, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:90,  opcoes:null,           x_pos:148, y_pos:14,  w_px:1038, h_px:56 },
      // Linha 2: Tipo(250)+14+Categoria(380)+14+Conta(280)+14+Valor(220)=1144→+28=no → T(250)+Cat(380)+Conta(270)+Valor(230)=1130+3*14=1172: last=14+250+14+380+14+270+14=956, 956+230=1186✓ ✓
      { _key:'f3',  nomeCampo:'tipo',          label:'Tipo',          tipo:'radio',       tamanho:10,  obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'despesa',largura:22, opcoes:[
        {label:'Receita',valor:'receita',cor:'#4ADE80'},{label:'Despesa',valor:'despesa',cor:'#F87171'},
      ], x_pos:14,  y_pos:78,  w_px:250, h_px:56 },
      { _key:'f4',  nomeCampo:'categoria',     label:'Categoria',     tipo:'pasta',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:33,  opcoes:null,           x_pos:278, y_pos:78,  w_px:380, h_px:56 },
      { _key:'f5',  nomeCampo:'conta',         label:'Conta',         tipo:'select',      tamanho:50,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:24,  opcoes:[
        {label:'Caixa',valor:'caixa',cor:'#FBD24C'},{label:'Banco',valor:'banco',cor:'#60A5FA'},{label:'Cartão',valor:'cartao',cor:'#A78BFA'},{label:'PIX',valor:'pix',cor:'#34D399'},
      ], x_pos:672, y_pos:78,  w_px:270, h_px:56 },
      { _key:'f6',  nomeCampo:'valor',         label:'Valor',         tipo:'moeda',       tamanho:0,   obrigatorio:true,  sequencial:false, campoBusca:false, valorPadrao:'',    largura:20,  opcoes:null,           x_pos:956, y_pos:78,  w_px:230, h_px:56 },
      // Linha 3: Vencimento(260)+14+Pagamento(260)+14+Status(624)=1158→+14=1172: last=14+260+14+260+14=562, 562+624=1186✓
      { _key:'f7',  nomeCampo:'dt_vencimento', label:'Vencimento',    tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:14,  y_pos:142, w_px:260, h_px:56 },
      { _key:'f8',  nomeCampo:'dt_pagamento',  label:'Pagamento',     tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:288, y_pos:142, w_px:260, h_px:56 },
      { _key:'f9',  nomeCampo:'status',        label:'Status',        tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'pendente',largura:54, opcoes:[
        {label:'Pendente',valor:'pendente',cor:'#94A3B8'},{label:'Pago',valor:'pago',cor:'#4ADE80'},{label:'Atrasado',valor:'atrasado',cor:'#F87171'},{label:'Cancelado',valor:'cancelado',cor:'#FB923C'},
      ], x_pos:562, y_pos:142, w_px:624, h_px:56 },
      // Linha 4: Recorrente(220)+14+Comprovante(938)=1172→last=248+938=1186✓
      { _key:'f10', nomeCampo:'recorrente',    label:'Recorrente',    tipo:'booleano',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'false',largura:19,  opcoes:null,           x_pos:14,  y_pos:206, w_px:220, h_px:56 },
      { _key:'f11', nomeCampo:'comprovante',   label:'Comprovante',   tipo:'arquivo',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:80,  opcoes:null,           x_pos:248, y_pos:206, w_px:938, h_px:90 },
      { _key:'f12', nomeCampo:'observacoes',   label:'Observações',   tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:304, w_px:1172, h_px:80 },
      { _key:'f13', nomeCampo:'_fav',          label:'Favorito',      tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:392, w_px:220, h_px:44 },
      { _key:'f14', nomeCampo:'_ts',           label:'Datas',         tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:392, w_px:938, h_px:56 },
    ],
  },

  // ── Avaliação e Qualidade ──────────────────────────────────────────────────
  {
    id: 'avaliacao_fornecedores',
    emoji: '⭐', label: 'Avaliação de Fornecedores', categoria: 'Qualidade',
    descricao: 'Fornecedor, critérios de avaliação em estrelas, nota geral calculada, prazo de entrega e flags de qualidade.',
    nomeTela: 'Avaliação de Fornecedores', icone: 'star', canvasW: 1200, canvasH: 600,
    campos: [
      // Linha 1: Código(110)+14+Fornecedor(802)+14+Data(256)=1172→last=14+110+14+802+14=954, 954+256=1210≠1186 → Data(232): last=14+110+14+802+14=954, 954+232=1186✓
      { _key:'av1',  nomeCampo:'codigo',        label:'Código',         tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:10,  opcoes:{seqChars:3},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'av2',  nomeCampo:'fornecedor',    label:'Fornecedor',     tipo:'texto',       tamanho:200, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:68,  opcoes:null,           x_pos:138, y_pos:14,  w_px:802, h_px:56 },
      { _key:'av3',  nomeCampo:'dt_avaliacao',  label:'Data',           tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:20,  opcoes:null,           x_pos:954, y_pos:14,  w_px:232, h_px:56 },
      { _key:'av4',  nomeCampo:'div1',          label:'Critérios',      tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14,  y_pos:78,  w_px:1172, h_px:20 },
      // Linha 2: Qualidade(579)+14+Prazo(579)=1172→last=607+579=1186✓
      { _key:'av5',  nomeCampo:'qualidade',     label:'Qualidade',      tipo:'avaliacao',   tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'0',   largura:50,  opcoes:{max:5},        x_pos:14,  y_pos:106, w_px:579, h_px:56 },
      { _key:'av6',  nomeCampo:'prazo',         label:'Prazo de Entrega',tipo:'avaliacao',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'0',   largura:50,  opcoes:{max:5},        x_pos:607, y_pos:106, w_px:579, h_px:56 },
      { _key:'av7',  nomeCampo:'atendimento',   label:'Atendimento',    tipo:'avaliacao',   tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'0',   largura:50,  opcoes:{max:5},        x_pos:14,  y_pos:170, w_px:579, h_px:56 },
      { _key:'av8',  nomeCampo:'preco',         label:'Preço',          tipo:'avaliacao',   tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'0',   largura:50,  opcoes:{max:5},        x_pos:607, y_pos:170, w_px:579, h_px:56 },
      // Linha 3: NotaGeral(579)+14+Recomenda(579)=1172→last=607+579=1186✓
      { _key:'av9',  nomeCampo:'nota_geral',    label:'Nota Geral',     tipo:'calculo',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:{formula:'({qualidade} + {prazo} + {atendimento} + {preco}) / 4'}, x_pos:14, y_pos:234, w_px:579, h_px:56 },
      { _key:'av10', nomeCampo:'recomenda',     label:'Recomenda?',     tipo:'radio',       tamanho:10,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:[
        {label:'Sim',valor:'sim',cor:'#4ADE80'},{label:'Não',valor:'nao',cor:'#F87171'},{label:'Talvez',valor:'talvez',cor:'#FBD24C'},
      ], x_pos:607, y_pos:234, w_px:579, h_px:56 },
      { _key:'av11', nomeCampo:'flags',         label:'Checklist de Qualidade', tipo:'flags', tamanho:10, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:[
        {label:'Entrega no prazo',valor:'P'},{label:'Nota fiscal correta',valor:'N'},{label:'Produto conforme',valor:'C'},{label:'Fácil negociação',valor:'F'},
      ], x_pos:14,  y_pos:298, w_px:1172, h_px:56 },
      { _key:'av12', nomeCampo:'observacoes',   label:'Observações',    tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:362, w_px:1172, h_px:90 },
      { _key:'av13', nomeCampo:'_ts',           label:'Datas',          tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:460, w_px:938, h_px:56 },
    ],
  },

  // ── Galeria / Mídia ────────────────────────────────────────────────────────
  {
    id: 'galeria_imagens',
    emoji: '🖼️', label: 'Galeria de Imagens', categoria: 'Mídia',
    descricao: 'Título, imagem com preview inline, categoria, tags, cor de destaque, avaliação e descrição.',
    nomeTela: 'Galeria de Imagens', icone: 'image', canvasW: 1200, canvasH: 570,
    campos: [
      // Linha 1: Código(110)+14+Título(1062)=1172→last=138+1062=1200≠1186 → Título(1048): last=138+1048=1186✓
      { _key:'gi1', nomeCampo:'codigo',      label:'Código',       tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:10,  opcoes:{seqChars:3},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'gi2', nomeCampo:'titulo',      label:'Título',       tipo:'texto',       tamanho:200, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:90,  opcoes:null,           x_pos:138, y_pos:14,  w_px:1048, h_px:56 },
      // Imagem(400) lado a lado com campos à direita: x_pos imagem=14, campos da direita x_pos=428
      // direita largura=1186-428=758
      { _key:'gi3', nomeCampo:'imagem',      label:'Imagem',       tipo:'imagem',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:33,  opcoes:null,           x_pos:14,  y_pos:78,  w_px:400, h_px:310 },
      { _key:'gi4', nomeCampo:'categoria',   label:'Categoria',    tipo:'pasta',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:64,  opcoes:null,           x_pos:428, y_pos:78,  w_px:758, h_px:56 },
      { _key:'gi5', nomeCampo:'tags',        label:'Tags',         tipo:'tags',        tamanho:300, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:64,  opcoes:null,           x_pos:428, y_pos:142, w_px:758, h_px:56 },
      // Cor(360)+14+Avaliação(384)=758→last=428+360+14=802, 802+384=1186✓
      { _key:'gi6', nomeCampo:'cor',         label:'Cor de destaque',tipo:'cor',       tamanho:7,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'#3B82F6',largura:47,opcoes:null,         x_pos:428, y_pos:206, w_px:360, h_px:56 },
      { _key:'gi7', nomeCampo:'avaliacao',   label:'Avaliação',    tipo:'avaliacao',   tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'0',   largura:50,  opcoes:{max:5},        x_pos:802, y_pos:206, w_px:384, h_px:56 },
      { _key:'gi8', nomeCampo:'url_origem',  label:'URL de Origem',tipo:'url',         tamanho:500, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:64,  opcoes:null,           x_pos:428, y_pos:270, w_px:758, h_px:56 },
      { _key:'gi9', nomeCampo:'descricao',   label:'Descrição',    tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:396, w_px:1172, h_px:90 },
      { _key:'gi10',nomeCampo:'_fav',        label:'Favorito',     tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:494, w_px:220, h_px:44 },
      { _key:'gi11',nomeCampo:'_ts',         label:'Datas',        tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:494, w_px:938, h_px:56 },
    ],
  },

  // ── Links e Referências ────────────────────────────────────────────────────
  {
    id: 'base_conhecimento',
    emoji: '📚', label: 'Base de Conhecimento', categoria: 'Referências',
    descricao: 'Links e artigos organizados por categoria e tags, com avaliação de utilidade e cor de destaque.',
    nomeTela: 'Base de Conhecimento', icone: 'book-open', canvasW: 1200, canvasH: 512,
    campos: [
      { _key:'bc1', nomeCampo:'codigo',      label:'Código',        tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:10,  opcoes:{seqChars:3},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'bc2', nomeCampo:'titulo',      label:'Título',        tipo:'texto',       tamanho:300, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:90,  opcoes:null,           x_pos:138, y_pos:14,  w_px:1048, h_px:56 },
      { _key:'bc3', nomeCampo:'url',         label:'URL / Link',    tipo:'url',         tamanho:500, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:78,  w_px:1172, h_px:56 },
      // Linha 3: Categoria(380)+14+Tags(778)=1172→last=14+380+14=408, 408+778=1186✓
      { _key:'bc4', nomeCampo:'categoria',   label:'Categoria',     tipo:'pasta',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32,  opcoes:null,           x_pos:14,  y_pos:142, w_px:380, h_px:56 },
      { _key:'bc5', nomeCampo:'tags',        label:'Tags',          tipo:'tags',        tamanho:300, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:66,  opcoes:null,           x_pos:408, y_pos:142, w_px:778, h_px:56 },
      // Linha 4: Utilidade(380)+14+Cor(260)+14+Lido(500)=1154→+18≠ → Util(380)+Cor(260)+Lido(518)=1158+14=1172: last=14+380+14+260+14=682, 682+504=1186→ Lido=504: 380+14+260+14+504=1172: last=682+504=1186✓
      { _key:'bc6', nomeCampo:'avaliacao',   label:'Utilidade',     tipo:'avaliacao',   tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'0',   largura:32,  opcoes:{max:5},        x_pos:14,  y_pos:206, w_px:380, h_px:56 },
      { _key:'bc7', nomeCampo:'cor',         label:'Cor',           tipo:'cor',         tamanho:7,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'#3B82F6',largura:22,opcoes:null,         x_pos:408, y_pos:206, w_px:260, h_px:56 },
      { _key:'bc8', nomeCampo:'lido',        label:'Lido',          tipo:'booleano',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'false',largura:43,  opcoes:null,           x_pos:682, y_pos:206, w_px:504, h_px:56 },
      { _key:'bc9', nomeCampo:'resumo',      label:'Resumo',        tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:270, w_px:1172, h_px:150 },
      { _key:'bc10',nomeCampo:'_fav',        label:'Favorito',      tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:428, w_px:220, h_px:44 },
      { _key:'bc11',nomeCampo:'_ts',         label:'Datas',         tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:428, w_px:938, h_px:56 },
    ],
  },

  // ── TI / Suporte ──────────────────────────────────────────────────────────
  {
    id: 'inventario_equipamentos',
    emoji: '🖥️', label: 'Inventário de Equipamentos', categoria: 'TI / Suporte',
    descricao: 'Patrimônio, tipo, marca/modelo, número de série, usuário responsável, localização, status e garantia.',
    nomeTela: 'Inventário de Equipamentos', nomeTabela: 'equipamento_001', icone: 'monitor', canvasW: 1200, canvasH: 578,
    campos: [
      // Linha 1: Patrimônio(130)+14+Identificação(752)+14+Status(290)=1172→last=14+130+14+752+14=924, 924+262=1186→ Status(262): 130+14+752+14+262=1172✓ last=924+262=1186✓
      { _key:'eq1',  nomeCampo:'patrimonio',     label:'Patrimônio',      tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:11,  opcoes:{seqChars:4},   x_pos:14,  y_pos:14,  w_px:130, h_px:56 },
      { _key:'eq2',  nomeCampo:'nome',           label:'Identificação',   tipo:'texto',       tamanho:200, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:64,  opcoes:null,           x_pos:158, y_pos:14,  w_px:752, h_px:56 },
      { _key:'eq3',  nomeCampo:'status',         label:'Status',          tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'ativo',largura:22, opcoes:[
        {label:'Ativo',valor:'ativo',cor:'#4ADE80'},{label:'Em manutenção',valor:'manutencao',cor:'#FBD24C'},{label:'Inativo',valor:'inativo',cor:'#94A3B8'},{label:'Descartado',valor:'descartado',cor:'#F87171'},
      ], x_pos:924, y_pos:14, w_px:262, h_px:56 },
      // Linha 2: Tipo(380)+14+Marca(260)+14+Modelo(260)+14+Série(230)=1144+28=1172: last=14+380+14+260+14+260+14=956, 956+230=1186✓
      { _key:'eq4',  nomeCampo:'tipo',           label:'Tipo',            tipo:'select',      tamanho:50,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32,  opcoes:[
        {label:'Desktop',valor:'desktop',cor:'#60A5FA'},{label:'Notebook',valor:'notebook',cor:'#A78BFA'},{label:'Monitor',valor:'monitor',cor:'#34D399'},
        {label:'Impressora',valor:'impressora',cor:'#FB923C'},{label:'Servidor',valor:'servidor',cor:'#F87171'},{label:'Roteador/Switch',valor:'rede',cor:'#FBD24C'},
        {label:'Celular/Tablet',valor:'mobile',cor:'#F472B6'},{label:'Periférico',valor:'periferico',cor:'#94A3B8'},
      ], x_pos:14,  y_pos:78,  w_px:380, h_px:56 },
      { _key:'eq5',  nomeCampo:'marca',          label:'Marca',           tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:22,  opcoes:null,           x_pos:408, y_pos:78,  w_px:260, h_px:56 },
      { _key:'eq6',  nomeCampo:'modelo',         label:'Modelo',          tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:22,  opcoes:null,           x_pos:682, y_pos:78,  w_px:260, h_px:56 },
      { _key:'eq7',  nomeCampo:'serie',          label:'Nº de Série',     tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:20,  opcoes:null,           x_pos:956, y_pos:78,  w_px:230, h_px:56 },
      { _key:'eq8',  nomeCampo:'div1',           label:'Localização',     tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14,  y_pos:142, w_px:1172, h_px:20 },
      // Linha 3: Usuário(580)+14+Setor(340)+14+Localização(224)=1158→+14=1172: last=14+580+14+340+14=962, 962+224=1186✓
      { _key:'eq9',  nomeCampo:'usuario',        label:'Usuário',         tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:49,  opcoes:null,           x_pos:14,  y_pos:170, w_px:580, h_px:56 },
      { _key:'eq10', nomeCampo:'setor',          label:'Setor',           tipo:'pasta',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:29,  opcoes:null,           x_pos:608, y_pos:170, w_px:340, h_px:56 },
      { _key:'eq11', nomeCampo:'localizacao',    label:'Localização',     tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:19,  opcoes:null,           x_pos:962, y_pos:170, w_px:224, h_px:56 },
      { _key:'eq12', nomeCampo:'div2',           label:'Garantia',        tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14,  y_pos:234, w_px:1172, h_px:20 },
      // Linha 4: DataCompra(260)+14+Garantia(260)+14+VlCompra(300)+14+NF(310)=1144→+28=1172: last=14+260+14+260+14+300+14=876, 876+310=1186✓
      { _key:'eq13', nomeCampo:'dt_compra',      label:'Data Compra',     tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:14,  y_pos:262, w_px:260, h_px:56 },
      { _key:'eq14', nomeCampo:'dt_garantia',    label:'Garantia até',    tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:288, y_pos:262, w_px:260, h_px:56 },
      { _key:'eq15', nomeCampo:'vl_compra',      label:'Valor Compra',    tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:25,  opcoes:null,           x_pos:562, y_pos:262, w_px:300, h_px:56 },
      { _key:'eq16', nomeCampo:'nf',             label:'Nota Fiscal',     tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:26,  opcoes:null,           x_pos:876, y_pos:262, w_px:310, h_px:56 },
      // Linha 5: Foto(220)+14+Observações(938)=1172→last=248+938=1186✓
      { _key:'eq17', nomeCampo:'foto',           label:'Foto',            tipo:'imagem',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:19,  opcoes:null,           x_pos:14,  y_pos:326, w_px:220, h_px:160 },
      { _key:'eq18', nomeCampo:'observacoes',    label:'Observações',     tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:79,  opcoes:null,           x_pos:248, y_pos:326, w_px:938, h_px:100 },
      { _key:'eq19', nomeCampo:'tags',           label:'Tags',            tipo:'tags',        tamanho:300, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:79,  opcoes:null,           x_pos:248, y_pos:434, w_px:938, h_px:56 },
      { _key:'eq20', nomeCampo:'_fav',           label:'Favorito',        tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:498, w_px:220, h_px:44 },
      { _key:'eq21', nomeCampo:'_ts',            label:'Datas',           tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:498, w_px:938, h_px:56 },
    ],
  },

  {
    id: 'controle_licencas',
    emoji: '🔑', label: 'Controle de Licenças', categoria: 'TI / Suporte',
    descricao: 'Software, tipo de licença, chave de ativação, quantidade de assentos, validade e custo.',
    nomeTela: 'Controle de Licenças', nomeTabela: 'licenca_001', icone: 'key', canvasW: 1200, canvasH: 516,
    campos: [
      // Linha 1: Código(110)+14+Software(720)+14+Versão(200)+14+Status(100): 110+14+720+14+200+14+100=1172: last=14+110+14+720+14+200+14=1086, 1086+100=1186✓
      { _key:'lc1',  nomeCampo:'codigo',         label:'Código',          tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:9,   opcoes:{seqChars:3},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'lc2',  nomeCampo:'software',       label:'Software',        tipo:'texto',       tamanho:200, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:61,  opcoes:null,           x_pos:138, y_pos:14,  w_px:720, h_px:56 },
      { _key:'lc3',  nomeCampo:'versao',         label:'Versão',          tipo:'texto',       tamanho:50,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:17,  opcoes:null,           x_pos:872, y_pos:14,  w_px:200, h_px:56 },
      { _key:'lc4',  nomeCampo:'status',         label:'Status',          tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'ativa',largura:9,  opcoes:[
        {label:'Ativa',valor:'ativa',cor:'#4ADE80'},{label:'Expirada',valor:'expirada',cor:'#F87171'},{label:'Suspensa',valor:'suspensa',cor:'#FBD24C'},{label:'Cancelada',valor:'cancelada',cor:'#94A3B8'},
      ], x_pos:1086, y_pos:14,  w_px:100, h_px:56 },
      // Linha 2: TipoLic(380)+14+Fabricante(380)+14+Assentos(180)+14+EmUso(180)=1148→+24=no → TipoLic(380)+Fab(380)+Ass(190)+EmUso(188)=1138+34=1172: 3 gaps: last=14+380+14+380+14+190+14=1006, 1006+188=1194≠1186 → TipoLic(380)+Fab(374)+Ass(190)+EmUso(184)=1128+44=no → recalc: 4 fields, 3 gaps: c1+c2+c3+c4=1172-3*14=1130: 380+380+180+190=1130: last=14+380+14+380+14+180+14=996, 996+190=1186✓
      { _key:'lc5',  nomeCampo:'tipo_licenca',   label:'Tipo de Licença', tipo:'select',      tamanho:50,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32,  opcoes:[
        {label:'Perpétua',valor:'perpetua',cor:'#60A5FA'},{label:'Assinatura anual',valor:'anual',cor:'#34D399'},{label:'Assinatura mensal',valor:'mensal',cor:'#A78BFA'},
        {label:'Por usuário',valor:'usuario',cor:'#FB923C'},{label:'Por dispositivo',valor:'dispositivo',cor:'#FBD24C'},{label:'Open Source',valor:'oss',cor:'#94A3B8'},
      ], x_pos:14,  y_pos:78,  w_px:380, h_px:56 },
      { _key:'lc6',  nomeCampo:'fabricante',     label:'Fabricante',      tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32,  opcoes:null,           x_pos:408, y_pos:78,  w_px:380, h_px:56 },
      { _key:'lc7',  nomeCampo:'assentos',       label:'Assentos',        tipo:'numero',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'1',   largura:15,  opcoes:null,           x_pos:802, y_pos:78,  w_px:180, h_px:56 },
      { _key:'lc8',  nomeCampo:'em_uso',         label:'Em uso',          tipo:'numero',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'0',   largura:16,  opcoes:null,           x_pos:996, y_pos:78,  w_px:190, h_px:56 },
      // Linha 3: Chave(900)+14+CopiarChave(258)=1172→last=928+258=1186✓
      { _key:'lc9',  nomeCampo:'chave',          label:'Chave de Ativação',tipo:'texto',      tamanho:500, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:76,  opcoes:null,           x_pos:14,  y_pos:142, w_px:900, h_px:56 },
      { _key:'lc10', nomeCampo:'cpy_chave',      label:'Copiar Chave',    tipo:'copiar',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'chave',largura:22, opcoes:null,           x_pos:928, y_pos:142, w_px:258, h_px:56 },
      // Linha 4: DataCompra(260)+14+Vencimento(260)+14+CustoAnual(300)+14+Portal(310)=1144→+28=1172: last=14+260+14+260+14+300+14=876, 876+310=1186✓
      { _key:'lc11', nomeCampo:'dt_compra',      label:'Data Compra',     tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:14,  y_pos:206, w_px:260, h_px:56 },
      { _key:'lc12', nomeCampo:'dt_vencimento',  label:'Vencimento',      tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:288, y_pos:206, w_px:260, h_px:56 },
      { _key:'lc13', nomeCampo:'vl_anual',       label:'Custo Anual',     tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:25,  opcoes:null,           x_pos:562, y_pos:206, w_px:300, h_px:56 },
      { _key:'lc14', nomeCampo:'url_portal',     label:'Portal / Download',tipo:'url',        tamanho:500, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:26,  opcoes:null,           x_pos:876, y_pos:206, w_px:310, h_px:56 },
      // Linha 5: Responsável(580)+Observações(578)=1158→+14=1172: last=608+578=1186✓
      { _key:'lc15', nomeCampo:'responsavel',    label:'Responsável',     tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:49,  opcoes:null,           x_pos:14,  y_pos:270, w_px:580, h_px:56 },
      { _key:'lc16', nomeCampo:'observacoes',    label:'Observações',     tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:334, w_px:1172, h_px:90 },
      { _key:'lc17', nomeCampo:'_fav',           label:'Favorito',        tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:432, w_px:220, h_px:44 },
      { _key:'lc18', nomeCampo:'_ts',            label:'Datas',           tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:432, w_px:938, h_px:56 },
    ],
  },

  {
    id: 'chamados_suporte',
    emoji: '🎫', label: 'Chamados de Suporte', categoria: 'TI / Suporte',
    descricao: 'Ticket de helpdesk com solicitante, tipo, prioridade, SLA, técnico responsável, resolução e histórico.',
    nomeTela: 'Chamados de Suporte', nomeTabela: 'chamado_001', icone: 'ticket', canvasW: 1200, canvasH: 588,
    campos: [
      // Linha 1: Ticket(120)+14+Assunto(766)+14+Status(272)=1172→last=14+120+14+766+14=928, 928+272=1200≠1186 → Status(258): last=928+258=1186✓ → Ticket(120)+Assunto(766)+Status(272)=1158+14=1172: check: 14+120=134, 134+14=148, 148+766=914, 914+14=928, 928+258=1186✓
      { _key:'ch1',  nomeCampo:'numero',         label:'Ticket',          tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:10,  opcoes:{seqChars:5},   x_pos:14,  y_pos:14,  w_px:120, h_px:56 },
      { _key:'ch2',  nomeCampo:'titulo',         label:'Assunto',         tipo:'texto',       tamanho:300, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:65,  opcoes:null,           x_pos:148, y_pos:14,  w_px:766, h_px:56 },
      { _key:'ch3',  nomeCampo:'status',         label:'Status',          tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'aberto',largura:22, opcoes:[
        {label:'Aberto',valor:'aberto',cor:'#60A5FA'},{label:'Em andamento',valor:'andamento',cor:'#FBD24C'},{label:'Aguardando usuário',valor:'aguardando',cor:'#FB923C'},{label:'Resolvido',valor:'resolvido',cor:'#4ADE80'},{label:'Fechado',valor:'fechado',cor:'#94A3B8'},
      ], x_pos:928, y_pos:14,  w_px:258, h_px:56 },
      // Linha 2: Solicitante(360)+14+Setor(280)+14+Técnico(280)+14+Prioridade(210)=1144→+28=1172: last=14+360+14+280+14+280+14=976, 976+210=1186✓
      { _key:'ch4',  nomeCampo:'solicitante',    label:'Solicitante',     tipo:'texto',       tamanho:200, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:30,  opcoes:null,           x_pos:14,  y_pos:78,  w_px:360, h_px:56 },
      { _key:'ch5',  nomeCampo:'setor',          label:'Setor',           tipo:'pasta',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:24,  opcoes:null,           x_pos:388, y_pos:78,  w_px:280, h_px:56 },
      { _key:'ch6',  nomeCampo:'tecnico',        label:'Técnico',         tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:24,  opcoes:null,           x_pos:682, y_pos:78,  w_px:280, h_px:56 },
      { _key:'ch7',  nomeCampo:'prioridade',     label:'Prioridade',      tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'media',largura:18, opcoes:[
        {label:'Baixa',valor:'baixa',cor:'#4ADE80'},{label:'Média',valor:'media',cor:'#FBD24C'},{label:'Alta',valor:'alta',cor:'#FB923C'},{label:'Crítica',valor:'critica',cor:'#F87171'},
      ], x_pos:976, y_pos:78,  w_px:210, h_px:56 },
      // Linha 3: Categoria(380)+14+Abertura(260)+14+PrazoSLA(260)+14+Resolvido(230)=1144→+28=1172: last=14+380+14+260+14+260+14=956, 956+230=1186✓
      { _key:'ch8',  nomeCampo:'categoria',      label:'Categoria',       tipo:'select',      tamanho:50,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32,  opcoes:[
        {label:'Hardware',valor:'hardware',cor:'#60A5FA'},{label:'Software',valor:'software',cor:'#A78BFA'},{label:'Rede/Internet',valor:'rede',cor:'#34D399'},
        {label:'Acesso/Senha',valor:'acesso',cor:'#FB923C'},{label:'E-mail',valor:'email',cor:'#FBD24C'},{label:'Outros',valor:'outros',cor:'#94A3B8'},
      ], x_pos:14,  y_pos:142, w_px:380, h_px:56 },
      { _key:'ch9',  nomeCampo:'dt_abertura',    label:'Abertura',        tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:408, y_pos:142, w_px:260, h_px:56 },
      { _key:'ch10', nomeCampo:'dt_prazo',       label:'Prazo SLA',       tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:682, y_pos:142, w_px:260, h_px:56 },
      { _key:'ch11', nomeCampo:'dt_resolucao',   label:'Resolvido em',    tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:20,  opcoes:null,           x_pos:956, y_pos:142, w_px:230, h_px:56 },
      { _key:'ch12', nomeCampo:'div1',           label:'Descrição',       tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14,  y_pos:206, w_px:1172, h_px:20 },
      // Desc+Resolução side by side (1172-14)/2=579 each: last=607+579=1186✓
      { _key:'ch13', nomeCampo:'descricao',      label:'Descrição do Problema',tipo:'texto_longo',tamanho:0,obrigatorio:true,sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:234, w_px:579, h_px:100 },
      { _key:'ch14', nomeCampo:'resolucao',      label:'Resolução',       tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:607, y_pos:234, w_px:579, h_px:100 },
      { _key:'ch15', nomeCampo:'anexo',          label:'Anexo',           tipo:'arquivo',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:342, w_px:1172, h_px:90 },
      // Avaliação full width, não precisa partir com outra coisa
      { _key:'ch16', nomeCampo:'avaliacao',      label:'Avaliação do Atendimento',tipo:'avaliacao',tamanho:0,obrigatorio:false,sequencial:false,campoBusca:false, valorPadrao:'0',   largura:50,  opcoes:{max:5},        x_pos:14,  y_pos:440, w_px:1172, h_px:56 },
      { _key:'ch17', nomeCampo:'_fav',           label:'Favorito',        tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:504, w_px:220, h_px:44 },
      { _key:'ch18', nomeCampo:'_ts',            label:'Datas',           tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:504, w_px:938, h_px:56 },
    ],
  },

  // ── RH ────────────────────────────────────────────────────────────────────
  {
    id: 'cadastro_colaboradores',
    emoji: '👥', label: 'Cadastro de Colaboradores', categoria: 'RH',
    descricao: 'Ficha completa do colaborador: dados pessoais, cargo, setor, contatos, documentos e status.',
    nomeTela: 'Cadastro de Colaboradores', nomeTabela: 'colaborador_001', icone: 'users-2', canvasW: 1200, canvasH: 646,
    campos: [
      // Linha 1: Matrícula(130)+14+Nome(796)+14+Foto(232): 130+14+796+14+232=1186→ Foto start=14+130+14+796+14=968, 968+232=1200≠1186 → Nome(782): 14+130+14+782=940, 940+14=954, Foto=1186-954=232: check 130+14+782+14+232=1172✓ last=954+232=1186✓
      { _key:'co1',  nomeCampo:'matricula',      label:'Matrícula',       tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:11,  opcoes:{seqChars:4},   x_pos:14,  y_pos:14,  w_px:130, h_px:56 },
      { _key:'co2',  nomeCampo:'nome',           label:'Nome Completo',   tipo:'texto',       tamanho:200, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:66,  opcoes:null,           x_pos:158, y_pos:14,  w_px:782, h_px:56 },
      { _key:'co3',  nomeCampo:'foto',           label:'Foto',            tipo:'imagem',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:20,  opcoes:null,           x_pos:954, y_pos:14,  w_px:232, h_px:150 },
      // Linha 2: Cargo(430)+14+Setor(430)=874→+14=888≠ → Cargo(579)+14+Setor(367)=960: last=607+367=974≠ → Cargo(579)+Setor(379)=958+14: last=607+379=986≠1186 → just 2 fields: Cargo(579)+gap+Setor(579)=1172: last=607+579=1186✓
      { _key:'co4',  nomeCampo:'cargo',          label:'Cargo',           tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:49,  opcoes:null,           x_pos:14,  y_pos:78,  w_px:579, h_px:56 },
      { _key:'co5',  nomeCampo:'setor',          label:'Setor',           tipo:'pasta',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:49,  opcoes:null,           x_pos:607, y_pos:78,  w_px:579, h_px:56 },
      // Status full width (respeitando foto à direita: foto ocupa y14 a y164, status y164+)
      { _key:'co6',  nomeCampo:'status',         label:'Status',          tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'ativo',largura:100, opcoes:[
        {label:'Ativo',valor:'ativo',cor:'#4ADE80'},{label:'Férias',valor:'ferias',cor:'#60A5FA'},{label:'Afastado',valor:'afastado',cor:'#FBD24C'},{label:'Desligado',valor:'desligado',cor:'#F87171'},
      ], x_pos:14,  y_pos:172, w_px:1172, h_px:56 },
      // Linha 4: Admissão(260)+14+Nascimento(260)+14+CPF(300)+14+PIS(310)=1144→+28=1172: last=14+260+14+260+14+300+14=876, 876+310=1186✓
      { _key:'co7',  nomeCampo:'dt_admissao',    label:'Admissão',        tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:14,  y_pos:236, w_px:260, h_px:56 },
      { _key:'co8',  nomeCampo:'dt_nascimento',  label:'Nascimento',      tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:288, y_pos:236, w_px:260, h_px:56 },
      { _key:'co9',  nomeCampo:'cpf',            label:'CPF',             tipo:'documento',   tamanho:14,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:25,  opcoes:{tipoRef:null},  x_pos:562, y_pos:236, w_px:300, h_px:56 },
      { _key:'co10', nomeCampo:'pis',            label:'PIS/PASEP',       tipo:'texto',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:26,  opcoes:null,           x_pos:876, y_pos:236, w_px:310, h_px:56 },
      { _key:'co11', nomeCampo:'div1',           label:'Contato',         tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14,  y_pos:300, w_px:1172, h_px:20 },
      // Contato: Telefone(300)+14+Email(638)+14+Ramal(206)=1158→+14=1172: last=14+300+14+638+14=980, 980+206=1186✓
      { _key:'co12', nomeCampo:'telefone',       label:'Telefone',        tipo:'telefone',    tamanho:30,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:25,  opcoes:null,           x_pos:14,  y_pos:328, w_px:300, h_px:56 },
      { _key:'co13', nomeCampo:'email',          label:'E-mail corporativo',tipo:'email',     tamanho:150, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:54,  opcoes:null,           x_pos:328, y_pos:328, w_px:638, h_px:56 },
      { _key:'co14', nomeCampo:'ramal',          label:'Ramal',           tipo:'texto',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:17,  opcoes:null,           x_pos:980, y_pos:328, w_px:206, h_px:56 },
      { _key:'co15', nomeCampo:'div2',           label:'Endereço',        tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14,  y_pos:392, w_px:1172, h_px:20 },
      // CEP(160)+14+Logradouro(640)+14+Cidade(354)=1168→+18≠ → CEP(160)+Logradouro(626)+Cidade(372)=1158+14=1172: last=14+160+14+626+14=828, 828+372=1200≠1186 → CEP(160)+Logradouro(612)+Cidade(386)=1158, +14=1172: last=14+160+14+612+14=814, 814+358=1172≠ → 3 fields: c1+c2+c3=1172-2*14=1144: CEP(160)+Log(640)+Cid(344)=1144: last=14+160+14+640+14=842, 842+344=1186✓
      { _key:'co16', nomeCampo:'cep',            label:'CEP',             tipo:'cep',         tamanho:9,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:14,  opcoes:null,           x_pos:14,  y_pos:420, w_px:160, h_px:56 },
      { _key:'co17', nomeCampo:'logradouro',     label:'Logradouro',      tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:54,  opcoes:null,           x_pos:188, y_pos:420, w_px:640, h_px:56 },
      { _key:'co18', nomeCampo:'cidade',         label:'Cidade',          tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:29,  opcoes:null,           x_pos:842, y_pos:420, w_px:344, h_px:56 },
      { _key:'co19', nomeCampo:'observacoes',    label:'Observações',     tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:484, w_px:1172, h_px:80 },
      { _key:'co20', nomeCampo:'_fav',           label:'Favorito',        tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:572, w_px:220, h_px:44 },
      { _key:'co21', nomeCampo:'_ts',            label:'Datas',           tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:572, w_px:938, h_px:56 },
    ],
  },

  {
    id: 'registro_treinamentos',
    emoji: '🎓', label: 'Registro de Treinamentos', categoria: 'RH',
    descricao: 'Treinamentos internos e externos com colaborador, carga horária, certificado em arquivo e avaliação.',
    nomeTela: 'Registro de Treinamentos', nomeTabela: 'treinamento_001', icone: 'graduation-cap', canvasW: 1200, canvasH: 540,
    campos: [
      // Linha 1: Código(110)+14+Treinamento(1062)=1172→last=138+1062=1200≠1186 → Treinamento(1048): last=138+1048=1186✓
      { _key:'tr1',  nomeCampo:'codigo',         label:'Código',          tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:9,   opcoes:{seqChars:3},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'tr2',  nomeCampo:'titulo',         label:'Treinamento',     tipo:'texto',       tamanho:300, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:89,  opcoes:null,           x_pos:138, y_pos:14,  w_px:1048, h_px:56 },
      // Linha 2: Colaborador(580)+14+Setor(294)+14+Modalidade(270)=1158→+14=1172: last=14+580+14+294+14=916, 916+270=1186✓
      { _key:'tr3',  nomeCampo:'colaborador',    label:'Colaborador',     tipo:'texto',       tamanho:200, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:49,  opcoes:null,           x_pos:14,  y_pos:78,  w_px:580, h_px:56 },
      { _key:'tr4',  nomeCampo:'setor',          label:'Setor',           tipo:'pasta',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:25,  opcoes:null,           x_pos:608, y_pos:78,  w_px:294, h_px:56 },
      { _key:'tr5',  nomeCampo:'tipo',           label:'Modalidade',      tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'interno',largura:23, opcoes:[
        {label:'Interno',valor:'interno',cor:'#60A5FA'},{label:'Externo',valor:'externo',cor:'#A78BFA'},{label:'Online',valor:'online',cor:'#34D399'},
      ], x_pos:916, y_pos:78,  w_px:270, h_px:56 },
      // Linha 3: Início(260)+14+Término(260)+14+CargaH(220)+14+Status(400)=1154→+18≠ → I(260)+T(260)+CH(220)+Status(418)=1158+14=1172: last=14+260+14+260+14+220+14=796, 796+390=1186→ Status=390: 260+260+220+390=1130+42=1172✓ wait: 3 gaps → c1+c2+c3+c4=1172-3*14=1130: 260+260+220+390=1130✓ last=14+260+14+260+14+220+14=796, 796+390=1186✓
      { _key:'tr6',  nomeCampo:'dt_inicio',      label:'Início',          tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:14,  y_pos:142, w_px:260, h_px:56 },
      { _key:'tr7',  nomeCampo:'dt_fim',         label:'Término',         tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:288, y_pos:142, w_px:260, h_px:56 },
      { _key:'tr8',  nomeCampo:'carga_horaria',  label:'Carga Horária (h)',tipo:'numero',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:19,  opcoes:null,           x_pos:562, y_pos:142, w_px:220, h_px:56 },
      { _key:'tr9',  nomeCampo:'status',         label:'Status',          tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'agendado',largura:33, opcoes:[
        {label:'Agendado',valor:'agendado',cor:'#60A5FA'},{label:'Em andamento',valor:'andamento',cor:'#FBD24C'},{label:'Concluído',valor:'concluido',cor:'#4ADE80'},{label:'Cancelado',valor:'cancelado',cor:'#F87171'},
      ], x_pos:796, y_pos:142, w_px:390, h_px:56 },
      // Avaliação(579)+14+Aprovado(579)=1172→last=607+579=1186✓
      { _key:'tr10', nomeCampo:'avaliacao',      label:'Avaliação',       tipo:'avaliacao',   tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'0',   largura:49,  opcoes:{max:5},        x_pos:14,  y_pos:206, w_px:579, h_px:56 },
      { _key:'tr11', nomeCampo:'aprovado',       label:'Aprovado?',       tipo:'radio',       tamanho:10,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49,  opcoes:[
        {label:'Sim',valor:'sim',cor:'#4ADE80'},{label:'Não',valor:'nao',cor:'#F87171'},
      ], x_pos:607, y_pos:206, w_px:579, h_px:56 },
      { _key:'tr12', nomeCampo:'certificado',    label:'Certificado',     tipo:'arquivo',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:270, w_px:1172, h_px:90 },
      { _key:'tr13', nomeCampo:'observacoes',    label:'Observações',     tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:368, w_px:1172, h_px:80 },
      { _key:'tr14', nomeCampo:'_fav',           label:'Favorito',        tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:456, w_px:220, h_px:44 },
      { _key:'tr15', nomeCampo:'_ts',            label:'Datas',           tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:456, w_px:938, h_px:56 },
    ],
  },

  // ── Jurídico / Contratos ───────────────────────────────────────────────────
  {
    id: 'controle_contratos',
    emoji: '📋', label: 'Controle de Contratos', categoria: 'Jurídico',
    descricao: 'Contrato com partes, objeto, vigência, valor, arquivo do contrato e alertas de vencimento.',
    nomeTela: 'Controle de Contratos', nomeTabela: 'contrato_001', icone: 'file-text', canvasW: 1200, canvasH: 620,
    campos: [
      // Linha 1: NContrato(150)+14+Objeto(858)+14+Status(146)=1172→last=14+150+14+858+14=1050, 1050+146=1196≠1186 → Status(132): last=1050+132=1182≠ → Objeto(844): last=14+150+14+844+14=1036, 1036+136=1172 → Status(150): 150+14+844+14+150=1172: last=14+150+14+844+14=1036, 1036+150=1186✓
      { _key:'ct1',  nomeCampo:'numero',         label:'Nº Contrato',     tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:13,  opcoes:{seqChars:4},   x_pos:14,  y_pos:14,  w_px:150, h_px:56 },
      { _key:'ct2',  nomeCampo:'objeto',         label:'Objeto / Título', tipo:'texto',       tamanho:300, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:72,  opcoes:null,           x_pos:178, y_pos:14,  w_px:844, h_px:56 },
      { _key:'ct3',  nomeCampo:'status',         label:'Status',          tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'vigente',largura:13, opcoes:[
        {label:'Vigente',valor:'vigente',cor:'#4ADE80'},{label:'Em renovação',valor:'renovacao',cor:'#FBD24C'},{label:'Vencido',valor:'vencido',cor:'#F87171'},{label:'Rescindido',valor:'rescindido',cor:'#94A3B8'},
      ], x_pos:1036, y_pos:14,  w_px:150, h_px:56 },
      // Linha 2: Tipo(380)+14+Contratante(380)+14+Contratado(380)=1154→+18≠ → 3 iguais: (1172-2*14)/3=381.3 → Tipo(381)+Contratante(381)+Contratado(382)=1144+28=1172: last=14+381+14+381+14=804, 804+382=1186✓
      { _key:'ct4',  nomeCampo:'tipo',           label:'Tipo',            tipo:'select',      tamanho:50,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32,  opcoes:[
        {label:'Prestação de serviço',valor:'servico',cor:'#60A5FA'},{label:'Fornecimento',valor:'fornecimento',cor:'#34D399'},{label:'Locação',valor:'locacao',cor:'#A78BFA'},
        {label:'Parceria',valor:'parceria',cor:'#FB923C'},{label:'Confidencialidade',valor:'nda',cor:'#FBD24C'},{label:'Outro',valor:'outro',cor:'#94A3B8'},
      ], x_pos:14,  y_pos:78,  w_px:381, h_px:56 },
      { _key:'ct5',  nomeCampo:'parte_a',        label:'Contratante',     tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32,  opcoes:null,           x_pos:409, y_pos:78,  w_px:381, h_px:56 },
      { _key:'ct6',  nomeCampo:'parte_b',        label:'Contratado',      tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32,  opcoes:null,           x_pos:804, y_pos:78,  w_px:382, h_px:56 },
      // Linha 3: InicioVig(260)+14+FimVig(260)+14+VlMensal(300)+14+VlTotal(310)=1144→+28=1172: last=14+260+14+260+14+300+14=876, 876+310=1186✓
      { _key:'ct7',  nomeCampo:'dt_inicio',      label:'Início da Vigência',tipo:'data',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:14,  y_pos:142, w_px:260, h_px:56 },
      { _key:'ct8',  nomeCampo:'dt_fim',         label:'Fim da Vigência', tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:288, y_pos:142, w_px:260, h_px:56 },
      { _key:'ct9',  nomeCampo:'vl_mensal',      label:'Valor Mensal',    tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:25,  opcoes:null,           x_pos:562, y_pos:142, w_px:300, h_px:56 },
      { _key:'ct10', nomeCampo:'vl_total',       label:'Valor Total',     tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:26,  opcoes:null,           x_pos:876, y_pos:142, w_px:310, h_px:56 },
      // Linha 4: RenovAuto(220)+14+AvisarDias(220)+14+Responsável(700)=1154→+18≠ → RA(220)+AD(220)+Resp(718)=1158+14=1172: last=14+220+14+220+14=482, 482+704=1186→ Resp=704: 220+14+220+14+704=1172✓ last=482+704=1186✓
      { _key:'ct11', nomeCampo:'renovacao_auto', label:'Renovação Automática',tipo:'booleano',tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'false',largura:19,  opcoes:null,           x_pos:14,  y_pos:206, w_px:220, h_px:56 },
      { _key:'ct12', nomeCampo:'aviso_dias',     label:'Avisar antes (dias)',tipo:'numero',   tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'30',   largura:19,  opcoes:null,           x_pos:248, y_pos:206, w_px:220, h_px:56 },
      { _key:'ct13', nomeCampo:'responsavel',    label:'Responsável',     tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:60,  opcoes:null,           x_pos:482, y_pos:206, w_px:704, h_px:56 },
      { _key:'ct14', nomeCampo:'div1',           label:'Documento',       tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14,  y_pos:270, w_px:1172, h_px:20 },
      { _key:'ct15', nomeCampo:'contrato',       label:'Arquivo do Contrato',tipo:'arquivo',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:298, w_px:1172, h_px:90 },
      { _key:'ct16', nomeCampo:'observacoes',    label:'Observações',     tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:396, w_px:1172, h_px:80 },
      { _key:'ct17', nomeCampo:'tags',           label:'Tags',            tipo:'tags',        tamanho:300, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:484, w_px:1172, h_px:56 },
      { _key:'ct18', nomeCampo:'_fav',           label:'Favorito',        tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:548, w_px:220, h_px:44 },
      { _key:'ct19', nomeCampo:'_ts',            label:'Datas',           tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:548, w_px:938, h_px:56 },
    ],
  },

  // ── Agenda / Relacionamento ────────────────────────────────────────────────
  {
    id: 'agenda_contatos',
    emoji: '📇', label: 'Agenda de Contatos', categoria: 'Cadastros',
    descricao: 'Agenda leve de contatos com telefone, e-mail, empresa, grupo e link para redes sociais.',
    nomeTela: 'Agenda de Contatos', nomeTabela: 'contato_001', icone: 'contact', canvasW: 1200, canvasH: 580,
    campos: [
      // Linha 1: Nome(920)+14+Foto(238): last=948+238=1186✓, foto ocupa y14 a y144
      { _key:'ag1',  nomeCampo:'nome',           label:'Nome',            tipo:'texto',       tamanho:200, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:79,  opcoes:null,           x_pos:14,  y_pos:14,  w_px:920, h_px:56 },
      { _key:'ag2',  nomeCampo:'foto',           label:'Foto',            tipo:'imagem',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:20,  opcoes:null,           x_pos:948, y_pos:14,  w_px:238, h_px:140 },
      // Linha 2: Empresa(579)+14+Cargo(579)=1172→last=607+579=1186✓
      { _key:'ag3',  nomeCampo:'empresa',        label:'Empresa',         tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:49,  opcoes:null,           x_pos:14,  y_pos:78,  w_px:579, h_px:56 },
      { _key:'ag4',  nomeCampo:'cargo',          label:'Cargo',           tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49,  opcoes:null,           x_pos:607, y_pos:78,  w_px:579, h_px:56 },
      // Linha 3: Grupo(380)+14+Celular(380)+14+TelAlt(380)=1154→+18≠ → 3 iguais=(1172-28)/3=381.3→ Grupo(381)+Cel(381)+TelAlt(382)=1144+28=1172: last=14+381+14+381+14=804, 804+382=1186✓
      { _key:'ag5',  nomeCampo:'grupo',          label:'Grupo',           tipo:'pasta',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32,  opcoes:null,           x_pos:14,  y_pos:162, w_px:381, h_px:56 },
      { _key:'ag6',  nomeCampo:'telefone',       label:'Celular / Tel.',  tipo:'telefone',    tamanho:30,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:32,  opcoes:null,           x_pos:409, y_pos:162, w_px:381, h_px:56 },
      { _key:'ag7',  nomeCampo:'telefone2',      label:'Tel. alternativo',tipo:'telefone',    tamanho:30,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:32,  opcoes:null,           x_pos:804, y_pos:162, w_px:382, h_px:56 },
      // Linha 4: Email(579)+14+Email2(579)=1172→last=607+579=1186✓
      { _key:'ag8',  nomeCampo:'email',          label:'E-mail',          tipo:'email',       tamanho:150, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:49,  opcoes:null,           x_pos:14,  y_pos:226, w_px:579, h_px:56 },
      { _key:'ag9',  nomeCampo:'email2',         label:'E-mail 2',        tipo:'email',       tamanho:150, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49,  opcoes:null,           x_pos:607, y_pos:226, w_px:579, h_px:56 },
      // Linha 5: LinkedIn(579)+14+Aniversário(579)=1172→last=607+579=1186✓
      { _key:'ag10', nomeCampo:'linkedin',       label:'LinkedIn',        tipo:'url',         tamanho:300, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49,  opcoes:null,           x_pos:14,  y_pos:290, w_px:579, h_px:56 },
      { _key:'ag11', nomeCampo:'aniversario',    label:'Aniversário',     tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49,  opcoes:null,           x_pos:607, y_pos:290, w_px:579, h_px:56 },
      { _key:'ag12', nomeCampo:'observacoes',    label:'Observações',     tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:354, w_px:1172, h_px:90 },
      { _key:'ag13', nomeCampo:'tags',           label:'Tags',            tipo:'tags',        tamanho:300, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:452, w_px:1172, h_px:56 },
      { _key:'ag14', nomeCampo:'_fav',           label:'Favorito',        tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:516, w_px:220, h_px:44 },
      { _key:'ag15', nomeCampo:'_ts',            label:'Datas',           tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:516, w_px:938, h_px:56 },
    ],
  },

  // ── Controle de Acesso / Senhas ────────────────────────────────────────────
  // Campo "senha_cofre" já embute mostrar/ocultar, copiar, gerar senha forte
  // e barra de força — não precisa de campos "Copiar Senha" nem "Nível
  // Segurança" separados como no template antigo, que duplicavam essas ações.
  {
    id: 'cofre_senhas',
    emoji: '🔐', label: 'Cofre de Senhas', categoria: 'Segurança',
    descricao: 'Sistema, usuário, senha (cofre criptografado com gerador e força), URL de acesso, categoria e validade.',
    nomeTela: 'Cofre de Senhas', icone: 'lock', canvasW: 1200, canvasH: 510,
    campos: [
      // Linha 1: Código(110)+14+Sistema(802)+14+Categoria(232)=1172→last=954+232=1186✓
      { _key:'cs1', nomeCampo:'codigo',      label:'Código',        tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:9,   opcoes:{seqChars:3},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'cs2', nomeCampo:'sistema',     label:'Sistema',       tipo:'texto',       tamanho:200, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:68,  opcoes:null,           x_pos:138, y_pos:14,  w_px:802, h_px:56 },
      { _key:'cs3', nomeCampo:'categoria',   label:'Categoria',     tipo:'pasta',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:20,  opcoes:null,           x_pos:954, y_pos:14,  w_px:232, h_px:56 },
      { _key:'cs4', nomeCampo:'url',         label:'URL de Acesso', tipo:'url',         tamanho:500, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:78,  w_px:1172, h_px:56 },
      // Linha 3: Usuário(579)+14+Senha(579)=1172→last=607+579=1186✓. Senha
      // mais alta (72px) pra caber a barra de força embaixo do input.
      { _key:'cs5', nomeCampo:'usuario',     label:'Usuário / E-mail',tipo:'texto',     tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:49,  opcoes:null,           x_pos:14,  y_pos:142, w_px:579, h_px:72 },
      { _key:'cs6', nomeCampo:'senha',       label:'Senha',         tipo:'senha_cofre', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49,  opcoes:null,           x_pos:607, y_pos:142, w_px:579, h_px:72 },
      // Linha 4: Validade(260)+14+Nível(260)=534. "senha_nivel" é campo
      // satélite do "senha" (sufixo _nivel) — preenchido automaticamente
      // pelo senha_cofre a cada mudança na senha, nunca editado à mão.
      { _key:'cs9', nomeCampo:'dt_validade', label:'Válido até',    tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:14,  y_pos:230, w_px:260, h_px:56 },
      { _key:'cs10',nomeCampo:'senha_nivel', label:'Nível de Segurança', tipo:'texto', tamanho:20, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22,  opcoes:null,           x_pos:288, y_pos:230, w_px:260, h_px:56 },
      { _key:'cs11',nomeCampo:'observacoes', label:'Observações',   tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:294, w_px:1172, h_px:80 },
      { _key:'cs12',nomeCampo:'tags',        label:'Tags',          tipo:'tags',        tamanho:300, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:382, w_px:1172, h_px:56 },
      { _key:'cs13',nomeCampo:'_fav',        label:'Favorito',      tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50,  opcoes:null,           x_pos:14,  y_pos:446, w_px:220, h_px:44 },
    ],
  },

  // ── Usuários e Acessos ─────────────────────────────────────────────────────
  {
    id: 'cadastro_usuarios',
    emoji: '👤', label: 'Cadastro de Usuários', categoria: 'Usuários',
    descricao: 'Ficha completa de usuário do sistema: login, perfil de acesso, permissões por módulo, setor, status e foto.',
    nomeTela: 'Cadastro de Usuários', nomeTabela: 'usuario_001', icone: 'user-circle', canvasW: 1200, canvasH: 724,
    campos: [
      // Linha 1: Código(110)+14+Nome(752)+14+Status(282)=1158→+14=1172: last=14+110+14+752+14=904, 904+282=1186✓
      { _key:'us1',  nomeCampo:'codigo',         label:'Código',            tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:9,  opcoes:{seqChars:4},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'us2',  nomeCampo:'nome',           label:'Nome Completo',     tipo:'texto',       tamanho:200, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:64, opcoes:null,           x_pos:138, y_pos:14,  w_px:752, h_px:56 },
      { _key:'us3',  nomeCampo:'status',         label:'Status',            tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'ativo', largura:24, opcoes:[
        {label:'Ativo',valor:'ativo',cor:'#4ADE80'},{label:'Inativo',valor:'inativo',cor:'#F87171'},{label:'Bloqueado',valor:'bloqueado',cor:'#FB923C'},
      ], x_pos:904, y_pos:14, w_px:282, h_px:56 },
      // Foto(200) + campos direita (x=228): 1186-228=958
      { _key:'us4',  nomeCampo:'foto',           label:'Foto',              tipo:'imagem',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:17, opcoes:null,           x_pos:14,  y_pos:78,  w_px:200, h_px:160 },
      // Login(460)+14+Email(484)=958→last=228+460+14=702, 702+484=1186✓
      { _key:'us5',  nomeCampo:'login',          label:'Login / Usuário',   tipo:'login',       tamanho:100, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:39, opcoes:null,           x_pos:228, y_pos:78,  w_px:460, h_px:56 },
      { _key:'us6',  nomeCampo:'email',          label:'E-mail',            tipo:'email',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:41, opcoes:null,           x_pos:702, y_pos:78,  w_px:484, h_px:56 },
      // Senha(460)+14+Telefone(484)=958: last=228+460+14=702, 702+484=1186✓
      { _key:'us5b', nomeCampo:'senha',          label:'Senha',             tipo:'senha',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:39, opcoes:null,           x_pos:228, y_pos:142, w_px:460, h_px:56 },
      { _key:'us7',  nomeCampo:'telefone',       label:'Telefone / Ramal',  tipo:'telefone',    tamanho:30,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:41, opcoes:null,           x_pos:702, y_pos:142, w_px:484, h_px:56 },
      // Setor(460)+14+Cargo(484)=958: last=228+460+14=702, 702+484=1186✓
      { _key:'us8',  nomeCampo:'setor',          label:'Setor / Área',      tipo:'pasta',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:39, opcoes:null,           x_pos:228, y_pos:206, w_px:460, h_px:56 },
      { _key:'us9',  nomeCampo:'cargo',          label:'Cargo',             tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:41, opcoes:null,           x_pos:702, y_pos:206, w_px:484, h_px:56 },
      { _key:'us10', nomeCampo:'div_acesso',     label:'Perfil de Acesso',  tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14, y_pos:282, w_px:1172, h_px:20 },
      // Perfil(380)+14+Expira(300)+14+UltimoAcesso(464)=1158→+14=1172: last=14+380+14+300+14=722, 722+464=1186✓
      { _key:'us11', nomeCampo:'perfil',         label:'Perfil',            tipo:'select',      tamanho:50,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32, opcoes:[
        {label:'Administrador',valor:'admin',cor:'#F87171'},{label:'Gerente',valor:'gerente',cor:'#FB923C'},{label:'Supervisor',valor:'supervisor',cor:'#FBD24C'},
        {label:'Operador',valor:'operador',cor:'#60A5FA'},{label:'Consulta',valor:'consulta',cor:'#94A3B8'},
      ], x_pos:14,  y_pos:310, w_px:380, h_px:56 },
      { _key:'us13', nomeCampo:'dt_expiracao',   label:'Expira em',         tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:25, opcoes:null,           x_pos:408, y_pos:310, w_px:300, h_px:56 },
      { _key:'us14', nomeCampo:'dt_ultimo_acesso',label:'Último acesso',    tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:39, opcoes:null,           x_pos:722, y_pos:310, w_px:464, h_px:56 },
      { _key:'us15', nomeCampo:'div_perm',       label:'Permissões por Módulo', tipo:'divisor', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14, y_pos:374, w_px:1172, h_px:20 },
      // Flags 2x2: (1172-14)/2=579 each
      { _key:'us16', nomeCampo:'perm_cadastros', label:'Cadastros',         tipo:'flags',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49, opcoes:[
        {label:'Visualizar',valor:'V'},{label:'Incluir',valor:'I'},{label:'Editar',valor:'E'},{label:'Excluir',valor:'X'},
      ], x_pos:14,  y_pos:402, w_px:579, h_px:56 },
      { _key:'us17', nomeCampo:'perm_financeiro',label:'Financeiro',        tipo:'flags',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49, opcoes:[
        {label:'Visualizar',valor:'V'},{label:'Incluir',valor:'I'},{label:'Editar',valor:'E'},{label:'Excluir',valor:'X'},
      ], x_pos:607, y_pos:402, w_px:579, h_px:56 },
      { _key:'us18', nomeCampo:'perm_relatorios',label:'Relatórios',        tipo:'flags',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49, opcoes:[
        {label:'Visualizar',valor:'V'},{label:'Exportar',valor:'E'},{label:'Imprimir',valor:'P'},
      ], x_pos:14,  y_pos:466, w_px:579, h_px:56 },
      { _key:'us19', nomeCampo:'perm_config',    label:'Configurações',     tipo:'flags',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49, opcoes:[
        {label:'Acessar configurações',valor:'C'},{label:'Gerenciar usuários',valor:'U'},{label:'Backup/Restore',valor:'B'},
      ], x_pos:607, y_pos:466, w_px:579, h_px:56 },
      { _key:'us20', nomeCampo:'observacoes',    label:'Observações',       tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:530, w_px:1172, h_px:80 },
      { _key:'us21', nomeCampo:'_fav',           label:'Favorito',          tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50, opcoes:null,            x_pos:14,  y_pos:624, w_px:220, h_px:44 },
      { _key:'us22', nomeCampo:'_ts',            label:'Datas',             tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:624, w_px:938, h_px:56 },
    ],
  },

  {
    id: 'controle_perfis_acesso',
    emoji: '🔓', label: 'Perfis de Acesso', categoria: 'Usuários',
    descricao: 'Cadastro de perfis/grupos de acesso com descrição de permissões e usuários vinculados.',
    nomeTela: 'Perfis de Acesso', nomeTabela: 'perfil_acesso_001', icone: 'shield', canvasW: 1200, canvasH: 518,
    campos: [
      // Linha 1: Código(110)+14+NomePerfil(750)+14+Ativo(174)+14+Nível(96)=1158→+14=1172: wait, 4 fields 3 gaps: 110+750+174+96=1130+42=1172: last=14+110+14+750+14+174+14=1090, 1090+96=1186✓
      { _key:'pa1', nomeCampo:'codigo',          label:'Código',            tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:9,  opcoes:{seqChars:3},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'pa2', nomeCampo:'nome_perfil',     label:'Nome do Perfil',    tipo:'texto',       tamanho:100, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:64, opcoes:null,           x_pos:138, y_pos:14,  w_px:750, h_px:56 },
      { _key:'pa3', nomeCampo:'ativo',           label:'Ativo',             tipo:'booleano',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'true', largura:15, opcoes:null,           x_pos:902, y_pos:14,  w_px:174, h_px:56 },
      // Linha 2: Nível(380)+14+Descrição(778)=1172→last=408+778=1186✓
      { _key:'pa4', nomeCampo:'nivel',           label:'Nível',             tipo:'select',      tamanho:30,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32, opcoes:[
        {label:'Administrador',valor:'admin',cor:'#F87171'},{label:'Gerente',valor:'gerente',cor:'#FB923C'},{label:'Supervisor',valor:'supervisor',cor:'#FBD24C'},
        {label:'Operador',valor:'operador',cor:'#60A5FA'},{label:'Consulta',valor:'consulta',cor:'#94A3B8'},
      ], x_pos:14,  y_pos:78,  w_px:380, h_px:56 },
      { _key:'pa5', nomeCampo:'descricao',       label:'Descrição',         tipo:'texto',       tamanho:300, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:66, opcoes:null,           x_pos:408, y_pos:78,  w_px:778, h_px:56 },
      { _key:'pa6', nomeCampo:'div1',            label:'Permissões por Módulo', tipo:'divisor', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14, y_pos:142, w_px:1172, h_px:20 },
      // Flags 2x2: (1172-14)/2=579
      { _key:'pa7', nomeCampo:'perm_modulo_1',   label:'Cadastros',         tipo:'flags',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49, opcoes:[
        {label:'Ver',valor:'V'},{label:'Incluir',valor:'I'},{label:'Editar',valor:'E'},{label:'Excluir',valor:'X'},
      ], x_pos:14,  y_pos:170, w_px:579, h_px:56 },
      { _key:'pa8', nomeCampo:'perm_modulo_2',   label:'Financeiro',        tipo:'flags',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49, opcoes:[
        {label:'Ver',valor:'V'},{label:'Incluir',valor:'I'},{label:'Editar',valor:'E'},{label:'Excluir',valor:'X'},
      ], x_pos:607, y_pos:170, w_px:579, h_px:56 },
      { _key:'pa9', nomeCampo:'perm_modulo_3',   label:'Estoque / Produtos', tipo:'flags',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49, opcoes:[
        {label:'Ver',valor:'V'},{label:'Incluir',valor:'I'},{label:'Editar',valor:'E'},{label:'Excluir',valor:'X'},
      ], x_pos:14,  y_pos:234, w_px:579, h_px:56 },
      { _key:'pa10',nomeCampo:'perm_modulo_4',   label:'Relatórios',        tipo:'flags',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49, opcoes:[
        {label:'Visualizar',valor:'V'},{label:'Exportar',valor:'E'},{label:'Imprimir',valor:'P'},
      ], x_pos:607, y_pos:234, w_px:579, h_px:56 },
      { _key:'pa11',nomeCampo:'observacoes',     label:'Observações',       tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:298, w_px:1172, h_px:80 },
      { _key:'pa12',nomeCampo:'_fav',            label:'Favorito',          tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50, opcoes:null,            x_pos:14,  y_pos:386, w_px:220, h_px:44 },
      { _key:'pa13',nomeCampo:'_ts',             label:'Datas',             tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:386, w_px:938, h_px:56 },
    ],
  },

  // ── Estoque Avançado ───────────────────────────────────────────────────────
  {
    id: 'gestao_estoque',
    emoji: '📦', label: 'Gestão de Estoque', categoria: 'Estoque',
    descricao: 'Controle completo de estoque: SKU, categoria, unidade, quantidades mínima/atual/máxima, custo, fornecedor e localização.',
    nomeTela: 'Gestão de Estoque', nomeTabela: 'estoque_001', icone: 'package', canvasW: 1200, canvasH: 714,
    campos: [
      // Linha 1: SKU(160)+14+Descrição(772)+14+Foto(212)=1158→+14=1172: last=14+160+14+772+14=974, 974+212=1186✓
      { _key:'es1',  nomeCampo:'sku',           label:'SKU / Código',      tipo:'codigo_auto', tamanho:30,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:14, opcoes:{seqChars:6},   x_pos:14,  y_pos:14,  w_px:160, h_px:56 },
      { _key:'es2',  nomeCampo:'descricao',     label:'Descrição',         tipo:'texto',       tamanho:300, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:66, opcoes:null,           x_pos:188, y_pos:14,  w_px:772, h_px:56 },
      { _key:'es3',  nomeCampo:'foto',          label:'Foto',              tipo:'imagem',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:18, opcoes:null,           x_pos:974, y_pos:14,  w_px:212, h_px:190 },
      // Linha 2 (dentro da imagem): Categoria(380)+14+Subcategoria(370)+14+Unidade(166)=1144→+28=1172→ e 374+14=388: Categoria(380)+Sub(380)+Unidade(168)=928+2*14=956≠. Use: Cat(380)+14+Sub(374)+14+Und(170)=938+28=966≠. Fit to 3-col w/ gaps: 380+374+170=924+28=952≠ 1172-14-974+14=212.
      // Colunas à esquerda da foto: 14..974 (960px). Linha 2: Cat(300)+14+Sub(280)+14+Unidade(166)+14+Status(172)=932→+42=974. last=14+300+14+280+14+166+14=802, 802+172=974✓ (end 974=foto start)
      { _key:'es4',  nomeCampo:'categoria',     label:'Categoria',         tipo:'pasta',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:25, opcoes:null,           x_pos:14,  y_pos:78,  w_px:300, h_px:56 },
      { _key:'es5',  nomeCampo:'subcategoria',  label:'Subcategoria',      tipo:'pasta',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:24, opcoes:null,           x_pos:328, y_pos:78,  w_px:280, h_px:56 },
      { _key:'es6',  nomeCampo:'unidade',       label:'Unidade',           tipo:'select',      tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'un',  largura:14, opcoes:[
        {label:'Un',valor:'un',cor:'#60A5FA'},{label:'Kg',valor:'kg',cor:'#4ADE80'},{label:'L',valor:'l',cor:'#A78BFA'},
        {label:'M',valor:'m',cor:'#FBD24C'},{label:'M²',valor:'m2',cor:'#FB923C'},{label:'Cx',valor:'cx',cor:'#34D399'},
      ], x_pos:622, y_pos:78,  w_px:166, h_px:56 },
      { _key:'es7',  nomeCampo:'status',        label:'Status',            tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'ativo', largura:14, opcoes:[
        {label:'Ativo',valor:'ativo',cor:'#4ADE80'},{label:'Inativo',valor:'inativo',cor:'#94A3B8'},{label:'Descont.',valor:'desc',cor:'#F87171'},
      ], x_pos:802, y_pos:78,  w_px:172, h_px:56 },
      // Linha 3 (inside imagem): Linha 2 tem y78 e h56, next y=78+56+8=142. QtyAtual+Min+Max+Localiz usando 960px: Q(220)+14+Min(220)+14+Max(220)+14+Loc(258)=932→+42=974.  last=14+220+14+220+14+220+14=730, 730+230=960→Loc=230: 220+220+220+230=890+3*14=932≠. Use Loc=258:220+220+220+258=918+42=960✓ last=14+220+14+220+14+220+14=730, 730+230=960, use 230: 220*3+230=890+42=932≠. Simpler: 4-col in 960px usable: (960-3*14)/4=222.75. Use 222+222+222+280=946+42=988≠. Use 230+230+230+256=946+42=988≠. Let last stretch: 220+220+220+256=916+42=958≠960. 221+221+221+255=918+42=960✓ last=14+221+14+221+14+221+14=733, 733+227=960. 221+221+221+227=890+42=932≠. Abandon 4-col here, use the full 1172 row below imagem:
      { _key:'es8',  nomeCampo:'div_qtd',       label:'Quantidades',       tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14, y_pos:218, w_px:1172, h_px:20 },
      // 4 iguais: (1172-3*14)/4 = (1172-42)/4 = 1130/4 = 282.5 → use 283+283+283+281=1130+42=1172: last=14+283+14+283+14+283+14=919, 919+281=1200≠1186. Try (1172-42)/4=282.5 → 282+282+282+284=1130+42=1172: last=14+282+14+282+14+282+14=918, 918+268=1186✓ → last w=268: 282+282+282+268=1114≠1130. Fix: sum must be 1172-3*14=1130. So a+b+c+d=1130. Use 283+283+283+281=1130. last=14+283+14+283+14+283+14=919, 919+281=1200≠. Gaps: 14+w1+14+w2+14+w3+14+w4=14*4+sum. last_end=14*4+sum=56+1130=1186? No: x_pos of 4th= 14+w1+14+w2+14+w3+14=14+283+14+283+14+283+14=919, last_end=919+281=1200. Wrong. Formula: last_end=x_last+w_last, x_last=14+(w1+14)+(w2+14)+(w3+14)=14+3*14+w1+w2+w3=56+w1+w2+w3. For last_end=1186: x_last+w_last=1186, w_last=1186-x_last=1186-56-849=281 where w1+w2+w3=849=3*283. x_last=56+849=905→905+281=1186✓ Use 283+283+283+281=1130: but w1+w2+w3=849≠283*3=849✓. So 283+283+283+281 sums to 1130 and last ends at 905+281=1186✓
      { _key:'es9',  nomeCampo:'qtd_atual',     label:'Qtd. Atual',        tipo:'numero',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'0',   largura:24, opcoes:null,           x_pos:14,  y_pos:246, w_px:283, h_px:56 },
      { _key:'es10', nomeCampo:'qtd_minima',    label:'Estoque Mínimo',    tipo:'numero',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'0',   largura:24, opcoes:null,           x_pos:311, y_pos:246, w_px:283, h_px:56 },
      { _key:'es11', nomeCampo:'qtd_maxima',    label:'Estoque Máximo',    tipo:'numero',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'0',   largura:24, opcoes:null,           x_pos:608, y_pos:246, w_px:283, h_px:56 },
      { _key:'es12', nomeCampo:'localizacao',   label:'Localização',       tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:24, opcoes:null,           x_pos:905, y_pos:246, w_px:281, h_px:56 },
      { _key:'es13', nomeCampo:'div_preco',     label:'Preços',            tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14, y_pos:310, w_px:1172, h_px:20 },
      // Custo(283)+14+PrecoVenda(283)+14+Margem(184)+14+Fornecedor(380)=1144+42=1186→ but sum=1144≠1130. Use Custo(270)+14+PrecoVenda(270)+14+Margem(180)+14+Fornecedor(400)=1120+42=1162≠. 4-col: Custo(283)+PrecoVenda(283)+Margem(181)+Forn(383)=1130+42=1172: last=56+283+283+181=56+747=803→803+383=1186✓ 283+283+181+383=1130✓
      { _key:'es14', nomeCampo:'custo',         label:'Custo Unitário',    tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:14,  y_pos:338, w_px:283, h_px:56 },
      { _key:'es15', nomeCampo:'preco_venda',   label:'Preço de Venda',    tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:311, y_pos:338, w_px:283, h_px:56 },
      { _key:'es16', nomeCampo:'margem',        label:'Margem (%)',        tipo:'numero',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:15, opcoes:null,           x_pos:608, y_pos:338, w_px:181, h_px:56 },
      { _key:'es17', nomeCampo:'fornecedor',    label:'Fornecedor',        tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:33, opcoes:null,           x_pos:803, y_pos:338, w_px:383, h_px:56 },
      { _key:'es18', nomeCampo:'tags',          label:'Tags',              tipo:'tags',        tamanho:300, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:402, w_px:1172, h_px:56 },
      { _key:'es19', nomeCampo:'observacoes',   label:'Observações',       tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:466, w_px:1172, h_px:80 },
      { _key:'es20', nomeCampo:'arquivo',       label:'Ficha Técnica',     tipo:'arquivo',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:554, w_px:1172, h_px:80 },
      { _key:'es21', nomeCampo:'_fav',          label:'Favorito',          tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50, opcoes:null,            x_pos:14,  y_pos:642, w_px:220, h_px:44 },
      { _key:'es22', nomeCampo:'_ts',           label:'Datas',             tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:642, w_px:938, h_px:56 },
    ],
  },

  // ── Vendas ─────────────────────────────────────────────────────────────────
  {
    id: 'pedido_venda',
    emoji: '🛒', label: 'Pedido de Venda', categoria: 'Vendas',
    descricao: 'Pedido de venda com cliente, vendedor, produtos, condição de pagamento, status e prazo de entrega.',
    nomeTela: 'Pedido de Venda', nomeTabela: 'pedido_venda_001', icone: 'shopping-cart', canvasW: 1200, canvasH: 626,
    campos: [
      // Linha 1: PedidoN(160)+14+Cliente(752)+14+Status(246)=1172→last=14+160+14+752+14=954, 954+246=1200≠1186. Status(232): last=954+232=1186✓ 160+752+232=1144+2*14=1172✓
      { _key:'pv1',  nomeCampo:'numero',        label:'Pedido Nº',         tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:14, opcoes:{seqChars:6},   x_pos:14,  y_pos:14,  w_px:160, h_px:56 },
      { _key:'pv2',  nomeCampo:'cliente',       label:'Cliente',           tipo:'texto',       tamanho:300, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:64, opcoes:null,           x_pos:188, y_pos:14,  w_px:752, h_px:56 },
      { _key:'pv3',  nomeCampo:'status',        label:'Status',            tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'rascunho', largura:20, opcoes:[
        {label:'Rascunho',valor:'rascunho',cor:'#94A3B8'},{label:'Confirmado',valor:'confirmado',cor:'#60A5FA'},{label:'Em prod.',valor:'producao',cor:'#FBD24C'},
        {label:'Enviado',valor:'enviado',cor:'#FB923C'},{label:'Entregue',valor:'entregue',cor:'#4ADE80'},{label:'Cancelado',valor:'cancelado',cor:'#F87171'},
      ], x_pos:954, y_pos:14,  w_px:232, h_px:56 },
      // Linha 2: Vendedor(380)+14+DtPedido(280)+14+DtEntrega(280)+14+Canal(190)=1130→+42=1172: last=56+380+280+280=56+940=996, 996+190=1186✓ 380+280+280+190=1130✓ Wait: x_pos: Vendedor=14, DtPedido=14+380+14=408, DtEntrega=408+280+14=702, Canal=702+280+14=996→last_end=996+190=1186✓
      { _key:'pv4',  nomeCampo:'vendedor',      label:'Vendedor',          tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32, opcoes:null,           x_pos:14,  y_pos:78,  w_px:380, h_px:56 },
      { _key:'pv5',  nomeCampo:'dt_pedido',     label:'Data Pedido',       tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:408, y_pos:78,  w_px:280, h_px:56 },
      { _key:'pv6',  nomeCampo:'dt_entrega',    label:'Prazo Entrega',     tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:702, y_pos:78,  w_px:280, h_px:56 },
      { _key:'pv7',  nomeCampo:'canal',         label:'Canal',             tipo:'select',      tamanho:50,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:16, opcoes:[
        {label:'Loja física',valor:'fisica',cor:'#60A5FA'},{label:'Site/E-commerce',valor:'ecommerce',cor:'#A78BFA'},{label:'WhatsApp',valor:'whatsapp',cor:'#4ADE80'},
        {label:'Marketplace',valor:'marketplace',cor:'#FBD24C'},{label:'Telefone',valor:'telefone',cor:'#FB923C'},
      ], x_pos:996, y_pos:78,  w_px:190, h_px:56 },
      { _key:'pv8',  nomeCampo:'div_pgto',      label:'Pagamento',         tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14, y_pos:142, w_px:1172, h_px:20 },
      // Linha pgto: FormaPgto(340)+14+Parcelas(140)+14+Subtotal(220)+14+Desconto(220)+14+Frete(210)=1130→+60=1190≠. 5-col: 340+140+220+200+200=1100+60=1160≠. Try FormaPgto(340)+14+Parcelas(140)+14+Subtotal(230)+14+Desconto(230)+14+Frete(190)=1130→+56=1186? No, 5 cols have 4 gaps: +4*14=56. 340+140+230+230+190=1130+56=1186→ last_x=14+340+14+140+14+230+14+230+14=1010, 1010+190=1200≠. last_x needs to give last_end=1186. last_x=1186-190=996. x5=14+w1+14+w2+14+w3+14+w4+14=70+w1+w2+w3+w4. 70+w1+w2+w3+w4=996→w1+w2+w3+w4=926. And all 5 sum=926+w5. Want last_end=1186→w5=1186-996=190. 926+190=1116≠1130. Adjust: want sum=1130. last_x=14+(w1+14)*4=14+4*14+w1+w2+w3+w4=70+w1+w2+w3+w4. For last_end=1186: 70+w1+w2+w3+w4+w5=70+1130=1200≠1186. Formula: last_end = 14 + sum_all + (N-1)*14 = 14 + 1130 + 56 = 1200 ≠ 1186. WRONG. Correct: last_end = x_1 + (N-1)*14 + sum_all = 14 + 4*14 + 1130 = 14+56+1130=1200. This means for 5 fields, last_end is always 1200 if sum=1130 and x_1=14. So sum must be 1130-(1200-1186)=1116. Use FormaPgto(330)+14+Parcelas(130)+14+Subtotal(220)+14+Desconto(210)+14+Frete(208)=1098→+56=1154≠. Better: N cols, sum=1172-14*(N-1), last_end=1186. For N=5: sum=1172-56=1116. FormaPgto(330)+Parcelas(130)+Subtotal(220)+Desconto(220)+Frete(216)=1116✓ last_x=14+330+14+130+14+220+14+220+14=1030, last_end=1030+216=1246≠. I keep getting confused. Let me be precise: x_i = 14 + sum(w_1..w_{i-1}) + 14*(i-1). For i=5: x_5 = 14 + (w1+w2+w3+w4) + 4*14 = 14 + (w1+w2+w3+w4) + 56. last_end = x_5 + w_5 = 14 + (sum-w5) + 56 + w5 = 14 + sum + 56 = 70 + sum. For last_end=1186: sum=1116. Use FormaPgto(340)+Parcelas(130)+Subtotal(220)+Desconto(216)+Frete(210)=1116. x5=14+(340+130+220+216)+56=14+906+56=976, last=976+210=1186✓
      { _key:'pv9',  nomeCampo:'forma_pgto',    label:'Forma de Pagamento',tipo:'select',      tamanho:50,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:29, opcoes:[
        {label:'Dinheiro',valor:'dinheiro',cor:'#4ADE80'},{label:'Cartão débito',valor:'debito',cor:'#60A5FA'},{label:'Cartão crédito',valor:'credito',cor:'#A78BFA'},
        {label:'PIX',valor:'pix',cor:'#34D399'},{label:'Boleto',valor:'boleto',cor:'#FBD24C'},{label:'Transferência',valor:'ted',cor:'#FB923C'},
      ], x_pos:14,  y_pos:170, w_px:340, h_px:56 },
      { _key:'pv10', nomeCampo:'parcelas',      label:'Parcelas',          tipo:'numero',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'1',   largura:11, opcoes:null,           x_pos:368, y_pos:170, w_px:130, h_px:56 },
      { _key:'pv11', nomeCampo:'vl_produtos',   label:'Subtotal',          tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:19, opcoes:null,           x_pos:512, y_pos:170, w_px:220, h_px:56 },
      { _key:'pv12', nomeCampo:'vl_desconto',   label:'Desconto',          tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:18, opcoes:null,           x_pos:746, y_pos:170, w_px:216, h_px:56 },
      { _key:'pv13', nomeCampo:'vl_frete',      label:'Frete',             tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:18, opcoes:null,           x_pos:976, y_pos:170, w_px:210, h_px:56 },
      // Linha: TOTAL(300) full-width left-aligned
      { _key:'pv14', nomeCampo:'vl_total',      label:'TOTAL',             tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:25, opcoes:null,           x_pos:14,  y_pos:234, w_px:300, h_px:56 },
      { _key:'pv15', nomeCampo:'div_end',       label:'Entrega',           tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14, y_pos:298, w_px:1172, h_px:20 },
      // EndEntrega(772)+14+Cidade(386)=1172→last=14+772+14=800, 800+386=1186✓
      { _key:'pv16', nomeCampo:'end_entrega',   label:'Endereço de Entrega',tipo:'texto',      tamanho:300, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:66, opcoes:null,           x_pos:14,  y_pos:326, w_px:772, h_px:56 },
      { _key:'pv17', nomeCampo:'cidade_entrega',label:'Cidade',            tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:33, opcoes:null,           x_pos:800, y_pos:326, w_px:386, h_px:56 },
      // Rastreio(579)+14+Transportadora(579)=1172→last=607+579=1186✓
      { _key:'pv18', nomeCampo:'cod_rastreio',  label:'Código de Rastreio',tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49, opcoes:null,           x_pos:14,  y_pos:390, w_px:579, h_px:56 },
      { _key:'pv19', nomeCampo:'transportadora',label:'Transportadora',    tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49, opcoes:null,           x_pos:607, y_pos:390, w_px:579, h_px:56 },
      { _key:'pv20', nomeCampo:'observacoes',   label:'Observações',       tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:454, w_px:1172, h_px:80 },
      { _key:'pv21', nomeCampo:'_fav',          label:'Favorito',          tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50, opcoes:null,            x_pos:14,  y_pos:542, w_px:220, h_px:44 },
      { _key:'pv22', nomeCampo:'_ts',           label:'Datas',             tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:542, w_px:938, h_px:56 },
    ],
  },

  // ── Projetos ───────────────────────────────────────────────────────────────
  {
    id: 'gestao_projetos',
    emoji: '🗂️', label: 'Gestão de Projetos', categoria: 'Projetos',
    descricao: 'Projeto completo com cliente, equipe, datas, orçamento, progresso e marcos de entrega.',
    nomeTela: 'Gestão de Projetos', nomeTabela: 'projeto_001', icone: 'folder-kanban', canvasW: 1200, canvasH: 730,
    campos: [
      // Linha 1: Código(120)+14+Nome(778)+14+Status(246)=1172→last=14+120+14+778+14=940, 940+246=1186✓
      { _key:'pj1',  nomeCampo:'codigo',        label:'Código',            tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:10, opcoes:{seqChars:4},   x_pos:14,  y_pos:14,  w_px:120, h_px:56 },
      { _key:'pj2',  nomeCampo:'nome',          label:'Nome do Projeto',   tipo:'texto',       tamanho:300, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:66, opcoes:null,           x_pos:148, y_pos:14,  w_px:778, h_px:56 },
      { _key:'pj3',  nomeCampo:'status',        label:'Status',            tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'planejamento', largura:21, opcoes:[
        {label:'Planej.',valor:'planejamento',cor:'#94A3B8'},{label:'Em andamento',valor:'andamento',cor:'#60A5FA'},{label:'Em espera',valor:'espera',cor:'#FBD24C'},
        {label:'Concluído',valor:'concluido',cor:'#4ADE80'},{label:'Cancelado',valor:'cancelado',cor:'#F87171'},
      ], x_pos:940, y_pos:14,  w_px:246, h_px:56 },
      // Linha 2: Cliente(380)+14+Responsavel(380)+14+Categoria(384)=1172→last=14+380+14+380+14=802, 802+384=1186✓
      { _key:'pj4',  nomeCampo:'cliente',       label:'Cliente',           tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32, opcoes:null,           x_pos:14,  y_pos:78,  w_px:380, h_px:56 },
      { _key:'pj5',  nomeCampo:'responsavel',   label:'Gerente do Projeto',tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32, opcoes:null,           x_pos:408, y_pos:78,  w_px:380, h_px:56 },
      { _key:'pj6',  nomeCampo:'categoria',     label:'Categoria',         tipo:'pasta',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32, opcoes:null,           x_pos:802, y_pos:78,  w_px:384, h_px:56 },
      // Linha 3: Prioridade(579)+14+Progresso(579)=1172→last=607+579=1186✓
      { _key:'pj7',  nomeCampo:'prioridade',    label:'Prioridade',        tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'media', largura:49, opcoes:[
        {label:'Baixa',valor:'baixa',cor:'#4ADE80'},{label:'Média',valor:'media',cor:'#FBD24C'},{label:'Alta',valor:'alta',cor:'#FB923C'},{label:'Crítica',valor:'critica',cor:'#F87171'},
      ], x_pos:14,  y_pos:142, w_px:579, h_px:56 },
      { _key:'pj8',  nomeCampo:'progresso',     label:'Progresso (%)',     tipo:'progresso',   tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'0',   largura:49, opcoes:null,           x_pos:607, y_pos:142, w_px:579, h_px:56 },
      // Linha 4: Início(283)+14+Previsão(283)+14+Conclusão(283)+14+Orçamento(281)=1172→last=14+283+14+283+14+283+14=905, 905+281=1186✓
      { _key:'pj9',  nomeCampo:'dt_inicio',     label:'Início',            tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:14,  y_pos:206, w_px:283, h_px:56 },
      { _key:'pj10', nomeCampo:'dt_fim',        label:'Previsão Término',  tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:311, y_pos:206, w_px:283, h_px:56 },
      { _key:'pj11', nomeCampo:'dt_conclusao',  label:'Conclusão Real',    tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:608, y_pos:206, w_px:283, h_px:56 },
      { _key:'pj12', nomeCampo:'orcamento',     label:'Orçamento',         tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:905, y_pos:206, w_px:281, h_px:56 },
      { _key:'pj13', nomeCampo:'equipe',        label:'Equipe',            tipo:'tags',        tamanho:300, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:270, w_px:1172, h_px:56 },
      { _key:'pj14', nomeCampo:'div_desc',      label:'Descrição e Escopo',tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14, y_pos:334, w_px:1172, h_px:20 },
      // Descrição(579)+14+Escopo(579)=1172→last=607+579=1186✓
      { _key:'pj15', nomeCampo:'descricao',     label:'Descrição',         tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49, opcoes:null,           x_pos:14,  y_pos:362, w_px:579, h_px:120 },
      { _key:'pj16', nomeCampo:'escopo',        label:'Escopo / Entregas', tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49, opcoes:null,           x_pos:607, y_pos:362, w_px:579, h_px:120 },
      { _key:'pj17', nomeCampo:'arquivo',       label:'Arquivo do Projeto',tipo:'arquivo',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:490, w_px:1172, h_px:90 },
      { _key:'pj18', nomeCampo:'tags',          label:'Tags',              tipo:'tags',        tamanho:300, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:588, w_px:1172, h_px:56 },
      { _key:'pj19', nomeCampo:'_fav',          label:'Favorito',          tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50, opcoes:null,            x_pos:14,  y_pos:652, w_px:220, h_px:44 },
      { _key:'pj20', nomeCampo:'_ts',           label:'Datas',             tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:652, w_px:938, h_px:56 },
    ],
  },

  // ── Agenda de Compromissos ─────────────────────────────────────────────────
  {
    id: 'agenda_compromissos',
    emoji: '📅', label: 'Agenda de Compromissos', categoria: 'Agenda',
    descricao: 'Compromissos e reuniões com participantes, local, duração, tipo, lembretes e pauta.',
    nomeTela: 'Agenda de Compromissos', nomeTabela: 'compromisso_001', icone: 'calendar-check', canvasW: 1200, canvasH: 558,
    campos: [
      // Linha 1: Código(110)+14+Título(800)+14+Tipo(248)=1172→last=14+110+14+800+14=952, 952+248=1200≠1186→ Tipo(234): last=952+234=1186✓ 110+800+234=1144+2*14=1172✓
      { _key:'ac1',  nomeCampo:'codigo',        label:'Código',            tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:9,  opcoes:{seqChars:4},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'ac2',  nomeCampo:'titulo',        label:'Assunto / Título',  tipo:'texto',       tamanho:300, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:68, opcoes:null,           x_pos:138, y_pos:14,  w_px:800, h_px:56 },
      { _key:'ac3',  nomeCampo:'tipo',          label:'Tipo',              tipo:'select',      tamanho:50,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:20, opcoes:[
        {label:'Reunião',valor:'reuniao',cor:'#60A5FA'},{label:'Ligação',valor:'ligacao',cor:'#4ADE80'},{label:'Apresentação',valor:'apresentacao',cor:'#A78BFA'},
        {label:'Visita',valor:'visita',cor:'#FBD24C'},{label:'Prazo',valor:'prazo',cor:'#F87171'},{label:'Outro',valor:'outro',cor:'#94A3B8'},
      ], x_pos:952, y_pos:14,  w_px:234, h_px:56 },
      // Linha 2: Status(700)+14+Prioridade(458)=1172→last=14+700+14=728, 728+458=1186✓
      { _key:'ac4',  nomeCampo:'status',        label:'Status',            tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'agendado', largura:60, opcoes:[
        {label:'Agendado',valor:'agendado',cor:'#60A5FA'},{label:'Confirmado',valor:'confirmado',cor:'#4ADE80'},{label:'Realizado',valor:'realizado',cor:'#94A3B8'},{label:'Cancelado',valor:'cancelado',cor:'#F87171'},
      ], x_pos:14,  y_pos:78,  w_px:700, h_px:56 },
      { _key:'ac5',  nomeCampo:'prioridade',    label:'Prioridade',        tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'normal', largura:38, opcoes:[
        {label:'Baixa',valor:'baixa',cor:'#4ADE80'},{label:'Normal',valor:'normal',cor:'#60A5FA'},{label:'Alta',valor:'alta',cor:'#F87171'},
      ], x_pos:728, y_pos:78,  w_px:458, h_px:56 },
      // Linha 3: DtInicio(280)+14+DtFim(280)+14+Duração(180)+14+Local(390)=1158→+14=1172: last=14+280+14+280+14+180+14=796, 796+390=1186✓ 280+280+180+390=1130+3*14=1172✓
      { _key:'ac6',  nomeCampo:'dt_inicio',     label:'Data/Hora Início',  tipo:'data_hora',   tamanho:0,   obrigatorio:true,  sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:14,  y_pos:142, w_px:280, h_px:56 },
      { _key:'ac7',  nomeCampo:'dt_fim',        label:'Data/Hora Fim',     tipo:'data_hora',   tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:308, y_pos:142, w_px:280, h_px:56 },
      { _key:'ac8',  nomeCampo:'duracao',       label:'Duração (min)',     tipo:'numero',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'60',  largura:15, opcoes:null,           x_pos:602, y_pos:142, w_px:180, h_px:56 },
      { _key:'ac9',  nomeCampo:'local',         label:'Local / Link',      tipo:'texto',       tamanho:300, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:33, opcoes:null,           x_pos:796, y_pos:142, w_px:390, h_px:56 },
      { _key:'ac10', nomeCampo:'participantes', label:'Participantes',     tipo:'tags',        tamanho:500, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:206, w_px:1172, h_px:56 },
      { _key:'ac11', nomeCampo:'div_pauta',     label:'Pauta e Resultado', tipo:'divisor',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'horizontal', largura:100, opcoes:null, x_pos:14, y_pos:270, w_px:1172, h_px:20 },
      // Pauta(579)+14+Resultado(579)=1172→last=607+579=1186✓
      { _key:'ac12', nomeCampo:'pauta',         label:'Pauta / Descrição', tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49, opcoes:null,           x_pos:14,  y_pos:298, w_px:579, h_px:120 },
      { _key:'ac13', nomeCampo:'resultado',     label:'Resultado / Ata',   tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49, opcoes:null,           x_pos:607, y_pos:298, w_px:579, h_px:120 },
      // Lembrete(280)+14+Recorrente(280)+14+Tags(580)=1172→last=14+280+14+280+14=602, 602+580=1182≠1186→ Tags(584): 280+280+584=1144+2*14=1172, last=602+584=1186✓
      { _key:'ac14', nomeCampo:'lembrete',      label:'Lembrete (min antes)',tipo:'numero',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'15',  largura:24, opcoes:null,           x_pos:14,  y_pos:426, w_px:280, h_px:56 },
      { _key:'ac15', nomeCampo:'recorrente',    label:'Recorrente',        tipo:'booleano',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'false', largura:24, opcoes:null,          x_pos:308, y_pos:426, w_px:280, h_px:56 },
      { _key:'ac16', nomeCampo:'tags',          label:'Tags',              tipo:'tags',        tamanho:300, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:49, opcoes:null,           x_pos:602, y_pos:426, w_px:584, h_px:56 },
      { _key:'ac17', nomeCampo:'_fav',          label:'Favorito',          tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50, opcoes:null,            x_pos:14,  y_pos:490, w_px:220, h_px:44 },
      { _key:'ac18', nomeCampo:'_ts',           label:'Datas',             tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:490, w_px:938, h_px:56 },
    ],
  },

  // ── Manutenção / Ativos ────────────────────────────────────────────────────
  {
    id: 'manutencao_ativos',
    emoji: '🔧', label: 'Manutenção de Ativos', categoria: 'Manutenção',
    descricao: 'Registro de manutenções preventivas e corretivas em equipamentos com técnico, custo, peças e próxima revisão.',
    nomeTela: 'Manutenção de Ativos', nomeTabela: 'manutencao_001', icone: 'wrench', canvasW: 1200, canvasH: 584,
    campos: [
      // Linha 1: OSNº(110)+14+Ativo(766)+14+Tipo(272)=1172→last=14+110+14+766+14=918, 918+268=1186→ Tipo(268): 110+766+268=1144+2*14=1172✓
      { _key:'ma1',  nomeCampo:'numero',        label:'OS Nº',             tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:9,  opcoes:{seqChars:5},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'ma2',  nomeCampo:'ativo',         label:'Ativo / Equipamento',tipo:'texto',      tamanho:300, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:65, opcoes:null,           x_pos:138, y_pos:14,  w_px:766, h_px:56 },
      { _key:'ma3',  nomeCampo:'tipo',          label:'Tipo',              tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'corretiva', largura:23, opcoes:[
        {label:'Corretiva',valor:'corretiva',cor:'#F87171'},{label:'Preventiva',valor:'preventiva',cor:'#4ADE80'},{label:'Preditiva',valor:'preditiva',cor:'#60A5FA'},
      ], x_pos:918, y_pos:14,  w_px:268, h_px:56 },
      { _key:'ma4',  nomeCampo:'status',        label:'Status',            tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'aberta', largura:100, opcoes:[
        {label:'Aberta',valor:'aberta',cor:'#60A5FA'},{label:'Em andamento',valor:'andamento',cor:'#FBD24C'},{label:'Aguard. peça',valor:'aguardando',cor:'#FB923C'},{label:'Concluída',valor:'concluida',cor:'#4ADE80'},
      ], x_pos:14,  y_pos:78,  w_px:1172, h_px:56 },
      // Linha 3: Técnico(380)+14+Abertura(260)+14+Conclusão(260)+14+ProxRevisão(240)=1154→+18≠. 4 campos, 3 gaps: sum=1172-42=1130: 380+260+260+230=1130✓ last=14+380+14+260+14+260+14=956, 956+230=1186✓
      { _key:'ma5',  nomeCampo:'tecnico',       label:'Técnico',           tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32, opcoes:null,           x_pos:14,  y_pos:142, w_px:380, h_px:56 },
      { _key:'ma6',  nomeCampo:'dt_abertura',   label:'Abertura',          tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22, opcoes:null,           x_pos:408, y_pos:142, w_px:260, h_px:56 },
      { _key:'ma7',  nomeCampo:'dt_conclusao',  label:'Conclusão',         tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22, opcoes:null,           x_pos:682, y_pos:142, w_px:260, h_px:56 },
      { _key:'ma8',  nomeCampo:'dt_proxima',    label:'Próxima Revisão',   tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:20, opcoes:null,           x_pos:956, y_pos:142, w_px:230, h_px:56 },
      // Descrição(579)+14+Solução(579)=1172→last=607+579=1186✓
      { _key:'ma9',  nomeCampo:'descricao',     label:'Descrição do Problema',tipo:'texto_longo',tamanho:0, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',   largura:49, opcoes:null,           x_pos:14,  y_pos:206, w_px:579, h_px:100 },
      { _key:'ma10', nomeCampo:'solucao',       label:'Solução Aplicada',  tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49, opcoes:null,           x_pos:607, y_pos:206, w_px:579, h_px:100 },
      // Peças(700)+14+Custo(220)+14+Horas(224)=1158→+14=1172: last=14+700+14+220+14=962, 962+224=1186✓ 700+220+224=1144+2*14=1172✓
      { _key:'ma11', nomeCampo:'pecas',         label:'Peças / Materiais', tipo:'texto',       tamanho:500, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:60, opcoes:null,           x_pos:14,  y_pos:314, w_px:700, h_px:56 },
      { _key:'ma12', nomeCampo:'custo',         label:'Custo Total',       tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:19, opcoes:null,           x_pos:728, y_pos:314, w_px:220, h_px:56 },
      { _key:'ma13', nomeCampo:'horas',         label:'Horas',             tipo:'numero',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:19, opcoes:null,           x_pos:962, y_pos:314, w_px:224, h_px:56 },
      // Foto(220)+14+Anexo(938)=1172→last=248+938=1186✓
      { _key:'ma14', nomeCampo:'foto',          label:'Foto do Defeito',   tipo:'imagem',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:19, opcoes:null,           x_pos:14,  y_pos:378, w_px:220, h_px:120 },
      { _key:'ma15', nomeCampo:'anexo',         label:'Relatório / Laudo', tipo:'arquivo',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:80, opcoes:null,           x_pos:248, y_pos:378, w_px:938, h_px:90 },
      { _key:'ma16', nomeCampo:'_fav',          label:'Favorito',          tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50, opcoes:null,            x_pos:14,  y_pos:506, w_px:220, h_px:44 },
      { _key:'ma17', nomeCampo:'_ts',           label:'Datas',             tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:506, w_px:938, h_px:56 },
    ],
  },

  // ── Veículos ───────────────────────────────────────────────────────────────
  {
    id: 'cadastro_veiculos',
    emoji: '🚗', label: 'Cadastro de Veículos', categoria: 'Cadastros',
    descricao: 'Ficha completa do veículo: placa, modelo, marca, combustível, hodômetro, seguro e foto.',
    nomeTela: 'Cadastro de Veículos', icone: 'car', canvasW: 1200, canvasH: 630,
    campos: [
      // Linha 1: Código(110)+14+Placa(260)+14+Modelo(400)+14+Marca(368)=1172→last=14+110+14+260+14+400+14=826, 826+360=1186→ Marca=360: 110+260+400+360=1130+3*14=1172✓
      { _key:'ve1',  nomeCampo:'codigo',        label:'Código',            tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:9,  opcoes:{seqChars:4},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'ve2',  nomeCampo:'placa',         label:'Placa',             tipo:'texto',       tamanho:10,  obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:22, opcoes:null,           x_pos:138, y_pos:14,  w_px:260, h_px:56 },
      { _key:'ve3',  nomeCampo:'modelo',        label:'Modelo',            tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:34, opcoes:null,           x_pos:412, y_pos:14,  w_px:400, h_px:56 },
      { _key:'ve4',  nomeCampo:'marca',         label:'Marca',             tipo:'texto',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:30, opcoes:null,           x_pos:826, y_pos:14,  w_px:360, h_px:56 },
      // Linha 2: Ano(180)+14+Cor(220)+14+Combustível(380)+14+Status(360)=1154→+18≠. sum=1172-42=1130: 180+220+380+350=1130✓ last=14+180+14+220+14+380+14=836, 836+350=1186✓
      { _key:'ve5',  nomeCampo:'ano',           label:'Ano',               tipo:'numero',      tamanho:4,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:15, opcoes:null,           x_pos:14,  y_pos:78,  w_px:180, h_px:56 },
      { _key:'ve6',  nomeCampo:'cor',           label:'Cor',               tipo:'cor',         tamanho:7,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'#CCCCCC', largura:19, opcoes:null,      x_pos:208, y_pos:78,  w_px:220, h_px:56 },
      { _key:'ve7',  nomeCampo:'combustivel',   label:'Combustível',       tipo:'select',      tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:32, opcoes:[
        {label:'Gasolina',valor:'gasolina',cor:'#FB923C'},{label:'Etanol',valor:'etanol',cor:'#4ADE80'},{label:'Diesel',valor:'diesel',cor:'#60A5FA'},
        {label:'Elétrico',valor:'eletrico',cor:'#A78BFA'},{label:'Flex',valor:'flex',cor:'#FBD24C'},
      ], x_pos:442, y_pos:78,  w_px:380, h_px:56 },
      { _key:'ve8',  nomeCampo:'status',        label:'Status',            tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'ativo', largura:30, opcoes:[
        {label:'Ativo',valor:'ativo',cor:'#4ADE80'},{label:'Inativo',valor:'inativo',cor:'#94A3B8'},{label:'Manutenção',valor:'manutencao',cor:'#FBD24C'},
      ], x_pos:836, y_pos:78,  w_px:350, h_px:56 },
      // Linha 3: Hodômetro(380)+14+DtCompra(280)+14+VlCompra(380)+14+Proprietário(290)=1364→ recalc sum=1130: 300+260+300+270=1130✓ last=14+300+14+260+14+300+14=916, 916+270=1186✓
      { _key:'ve9',  nomeCampo:'hodometro',     label:'Hodômetro (km)',    tipo:'numero',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'0',   largura:25, opcoes:null,           x_pos:14,  y_pos:142, w_px:300, h_px:56 },
      { _key:'ve10', nomeCampo:'dt_compra',     label:'Dt. Compra',        tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:22, opcoes:null,           x_pos:328, y_pos:142, w_px:260, h_px:56 },
      { _key:'ve11', nomeCampo:'vl_compra',     label:'Vl. Compra',        tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:25, opcoes:null,           x_pos:602, y_pos:142, w_px:300, h_px:56 },
      { _key:'ve12', nomeCampo:'proprietario',  label:'Proprietário',      tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:23, opcoes:null,           x_pos:916, y_pos:142, w_px:270, h_px:56 },
      // Linha 4: Seguradora(579)+14+VenctoSeguro(579)=1172→last=607+579=1186✓
      { _key:'ve13', nomeCampo:'seguradora',    label:'Seguradora',        tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49, opcoes:null,           x_pos:14,  y_pos:206, w_px:579, h_px:56 },
      { _key:'ve14', nomeCampo:'vencto_seguro', label:'Vencto. Seguro',    tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:49, opcoes:null,           x_pos:607, y_pos:206, w_px:579, h_px:56 },
      // Foto(220)+14+Observações(938)=1172→last=248+938=1186✓
      { _key:'ve15', nomeCampo:'foto',          label:'Foto',              tipo:'imagem',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:19, opcoes:null,           x_pos:14,  y_pos:270, w_px:220, h_px:160 },
      { _key:'ve16', nomeCampo:'observacoes',   label:'Observações',       tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:79, opcoes:null,           x_pos:248, y_pos:270, w_px:938, h_px:100 },
      { _key:'ve17', nomeCampo:'tags',          label:'Tags',              tipo:'tags',        tamanho:300, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:79, opcoes:null,           x_pos:248, y_pos:378, w_px:938, h_px:56 },
      { _key:'ve18', nomeCampo:'_fav',          label:'Favorito',          tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50, opcoes:null,           x_pos:14,  y_pos:442, w_px:220, h_px:44 },
      { _key:'ve19', nomeCampo:'_ts',           label:'Datas',             tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:442, w_px:938, h_px:56 },
    ],
  },

  // ── Controle de Manutenções ────────────────────────────────────────────────
  {
    id: 'controle_manutencoes',
    emoji: '🔩', label: 'Controle de Manutenções', categoria: 'Operacional',
    descricao: 'OS de manutenção com veículo, tipo, status, datas, oficina, peças, mão de obra e total calculado.',
    nomeTela: 'Controle de Manutenções', icone: 'wrench', canvasW: 1200, canvasH: 630,
    campos: [
      // Linha 1: Código(110)+14+Título(780)+14+Status(264)=1168→ Status(278): 110+780+278=1168→ Status(282): 110+14+780+14+282=1200≠. 3 campos sum=1144: 110+780+254=1144→last=14+110+14+780+14=932, 932+254=1186✓ 110+780+254=1144+2*14=1172✓
      { _key:'cm1',  nomeCampo:'codigo',        label:'Código',            tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:9,  opcoes:{seqChars:4},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'cm2',  nomeCampo:'titulo',        label:'Título',            tipo:'texto',       tamanho:300, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:66, opcoes:null,           x_pos:138, y_pos:14,  w_px:780, h_px:56 },
      { _key:'cm3',  nomeCampo:'status',        label:'Status',            tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'agendada', largura:22, opcoes:[
        {label:'Agendada',valor:'agendada',cor:'#60A5FA'},{label:'Em andamento',valor:'em_andamento',cor:'#FBD24C'},{label:'Concluída',valor:'concluida',cor:'#4ADE80'},{label:'Cancelada',valor:'cancelada',cor:'#F87171'},
      ], x_pos:932, y_pos:14,  w_px:254, h_px:56 },
      // Linha 2: Veículo(579)+14+Tipo(579)=1172→last=607+579=1186✓
      { _key:'cm4',  nomeCampo:'veiculo',       label:'Veículo',           tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:49, opcoes:null,           x_pos:14,  y_pos:78,  w_px:579, h_px:56 },
      { _key:'cm5',  nomeCampo:'tipo',          label:'Tipo',              tipo:'select',      tamanho:50,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:49, opcoes:[
        {label:'Preventiva',valor:'preventiva',cor:'#4ADE80'},{label:'Corretiva',valor:'corretiva',cor:'#F87171'},{label:'Revisão',valor:'revisao',cor:'#60A5FA'},
      ], x_pos:607, y_pos:78,  w_px:579, h_px:56 },
      // Linha 3: DtEntrada(283)+14+DtPrevisao(283)+14+DtSaida(283)+14+Km(281)=1172→last=14+283+14+283+14+283+14=905, 905+281=1186✓
      { _key:'cm6',  nomeCampo:'dt_entrada',    label:'Dt. Entrada',       tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:14,  y_pos:142, w_px:283, h_px:56 },
      { _key:'cm7',  nomeCampo:'dt_previsao',   label:'Dt. Previsão',      tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:311, y_pos:142, w_px:283, h_px:56 },
      { _key:'cm8',  nomeCampo:'dt_saida',      label:'Dt. Saída',         tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:608, y_pos:142, w_px:283, h_px:56 },
      { _key:'cm9',  nomeCampo:'km',            label:'Km',                tipo:'numero',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:905, y_pos:142, w_px:281, h_px:56 },
      // Linha 4: Oficina(579)+14+Técnico(579)=1172→last=607+579=1186✓
      { _key:'cm10', nomeCampo:'oficina',       label:'Oficina',           tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:49, opcoes:null,           x_pos:14,  y_pos:206, w_px:579, h_px:56 },
      { _key:'cm11', nomeCampo:'tecnico',       label:'Técnico',           tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:49, opcoes:null,           x_pos:607, y_pos:206, w_px:579, h_px:56 },
      // Descrição problema(579)+14+Serviço realizado(579)=1172→last=607+579=1186✓
      { _key:'cm12', nomeCampo:'descricao_problema', label:'Descrição do Problema', tipo:'texto_longo', tamanho:0, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'', largura:49, opcoes:null, x_pos:14, y_pos:270, w_px:579, h_px:90 },
      { _key:'cm13', nomeCampo:'servico_realizado',  label:'Serviço Realizado',     tipo:'texto_longo', tamanho:0, obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'', largura:49, opcoes:null, x_pos:607, y_pos:270, w_px:579, h_px:90 },
      // Linha: VlPeças(380)+14+VlMaoObra(380)+14+VlTotal(384)=1172→last=14+380+14+380+14=802, 802+384=1186✓
      { _key:'cm14', nomeCampo:'vl_pecas',      label:'Vl. Peças',         tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:32, opcoes:null,           x_pos:14,  y_pos:368, w_px:380, h_px:56 },
      { _key:'cm15', nomeCampo:'vl_mao_obra',   label:'Vl. Mão de Obra',   tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:32, opcoes:null,           x_pos:408, y_pos:368, w_px:380, h_px:56 },
      { _key:'cm16', nomeCampo:'vl_total',      label:'Total',             tipo:'calculo',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:32, opcoes:{formula:'{vl_pecas} + {vl_mao_obra}'}, x_pos:802, y_pos:368, w_px:384, h_px:56 },
      { _key:'cm17', nomeCampo:'anexo',         label:'Anexo',             tipo:'arquivo',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:432, w_px:1172, h_px:90 },
      { _key:'cm18', nomeCampo:'_fav',          label:'Favorito',          tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50, opcoes:null,           x_pos:14,  y_pos:530, w_px:220, h_px:44 },
      { _key:'cm19', nomeCampo:'_ts',           label:'Datas',             tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:530, w_px:938, h_px:56 },
    ],
  },

  // ── Catálogo de Serviços ───────────────────────────────────────────────────
  {
    id: 'catalogo_servicos',
    emoji: '🛠️', label: 'Catálogo de Serviços', categoria: 'Cadastros',
    descricao: 'Serviços disponíveis com categoria, unidade, preço, duração estimada, foto e status.',
    nomeTela: 'Catálogo de Serviços', icone: 'clipboard-list', canvasW: 1200, canvasH: 506,
    campos: [
      // Linha 1: Código(110)+14+Nome(800)+14+Status(258)=1182→ Status(244): 110+800+244=1154→ sum=1144: 110+800+234=1144→last=14+110+14+800+14=952, 952+234=1186✓
      { _key:'sv1',  nomeCampo:'codigo',        label:'Código',            tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:9,  opcoes:{seqChars:4},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'sv2',  nomeCampo:'nome',          label:'Nome',              tipo:'texto',       tamanho:200, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:68, opcoes:null,           x_pos:138, y_pos:14,  w_px:800, h_px:56 },
      { _key:'sv3',  nomeCampo:'status',        label:'Status',            tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'ativo', largura:20, opcoes:[
        {label:'Ativo',valor:'ativo',cor:'#4ADE80'},{label:'Inativo',valor:'inativo',cor:'#94A3B8'},
      ], x_pos:952, y_pos:14,  w_px:234, h_px:56 },
      // Linha 2: Categoria(380)+14+Unidade(300)+14+Preço(280)+14+Duração(180)=1174→ sum=1144: 380+300+280+184=1144→last=14+380+14+300+14+280+14=1016, 1016+184→ 1144-380-300-280=184→last_x=14+380+14+300+14+280+14=1016, 1016+184=1200≠1186. Recalc: last_x=14+(380+14)+(300+14)+(280+14)=14+394+314+294=1016→ for last_end=1186: w4=1186-1016=170: sum=380+300+280+170=1130+3*14=1172✓ last=1016+170=1186✓
      { _key:'sv4',  nomeCampo:'categoria',     label:'Categoria',         tipo:'pasta',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32, opcoes:null,           x_pos:14,  y_pos:78,  w_px:380, h_px:56 },
      { _key:'sv5',  nomeCampo:'unidade',       label:'Unidade',           tipo:'select',      tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:26, opcoes:[
        {label:'Hora',valor:'hora',cor:'#60A5FA'},{label:'Dia',valor:'dia',cor:'#A78BFA'},{label:'Unidade',valor:'unidade',cor:'#34D399'},
        {label:'Metro',valor:'metro',cor:'#FBD24C'},{label:'Km',valor:'km',cor:'#FB923C'},
      ], x_pos:408, y_pos:78,  w_px:300, h_px:56 },
      { _key:'sv6',  nomeCampo:'preco',         label:'Preço',             tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:722, y_pos:78,  w_px:280, h_px:56 },
      { _key:'sv7',  nomeCampo:'duracao',       label:'Duração (min)',     tipo:'numero',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:14, opcoes:null,           x_pos:1016, y_pos:78, w_px:170, h_px:56 },
      // Foto(220)+14+Descrição(938)=1172→last=248+938=1186✓
      { _key:'sv8',  nomeCampo:'foto',          label:'Foto',              tipo:'imagem',      tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:19, opcoes:null,           x_pos:14,  y_pos:142, w_px:220, h_px:160 },
      { _key:'sv9',  nomeCampo:'descricao',     label:'Descrição',         tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:79, opcoes:null,           x_pos:248, y_pos:142, w_px:938, h_px:100 },
      { _key:'sv10', nomeCampo:'tags',          label:'Tags',              tipo:'tags',        tamanho:300, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:79, opcoes:null,           x_pos:248, y_pos:250, w_px:938, h_px:56 },
      { _key:'sv11', nomeCampo:'_fav',          label:'Favorito',          tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50, opcoes:null,           x_pos:14,  y_pos:314, w_px:220, h_px:44 },
      { _key:'sv12', nomeCampo:'_ts',           label:'Datas',             tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:314, w_px:938, h_px:56 },
    ],
  },

  // ── Controle de Projetos ───────────────────────────────────────────────────
  {
    id: 'controle_projetos',
    emoji: '📊', label: 'Controle de Projetos', categoria: 'Operacional',
    descricao: 'Projetos com cliente, responsável, status, prioridade, progresso, datas e orçamento.',
    nomeTela: 'Controle de Projetos', icone: 'kanban', canvasW: 1200, canvasH: 600,
    campos: [
      // Linha 1: Código(110)+14+Título(802)+14+Responsável(240)=1180→ sum=1144: 110+800+234=1144→last=14+110+14+800+14=952, 952+234=1186✓
      { _key:'cp1',  nomeCampo:'codigo',        label:'Código',            tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:9,  opcoes:{seqChars:4},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'cp2',  nomeCampo:'titulo',        label:'Título',            tipo:'texto',       tamanho:300, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:68, opcoes:null,           x_pos:138, y_pos:14,  w_px:800, h_px:56 },
      { _key:'cp3',  nomeCampo:'responsavel',   label:'Responsável',       tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:20, opcoes:null,           x_pos:952, y_pos:14,  w_px:234, h_px:56 },
      // Linha 2: Cliente(579)+14+Status(579)=1172→last=607+579=1186✓
      { _key:'cp4',  nomeCampo:'cliente',       label:'Cliente',           tipo:'texto',       tamanho:200, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:49, opcoes:null,           x_pos:14,  y_pos:78,  w_px:579, h_px:56 },
      { _key:'cp5',  nomeCampo:'status',        label:'Status',            tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'planejamento', largura:49, opcoes:[
        {label:'Planejamento',valor:'planejamento',cor:'#94A3B8'},{label:'Em andamento',valor:'em_andamento',cor:'#60A5FA'},{label:'Pausado',valor:'pausado',cor:'#FBD24C'},
        {label:'Concluído',valor:'concluido',cor:'#4ADE80'},{label:'Cancelado',valor:'cancelado',cor:'#F87171'},
      ], x_pos:607, y_pos:78,  w_px:579, h_px:56 },
      // Linha 3: Prioridade(579)+14+Progresso(579)=1172→last=607+579=1186✓
      { _key:'cp6',  nomeCampo:'prioridade',    label:'Prioridade',        tipo:'radio',       tamanho:20,  obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'media', largura:49, opcoes:[
        {label:'Baixa',valor:'baixa',cor:'#4ADE80'},{label:'Média',valor:'media',cor:'#FBD24C'},{label:'Alta',valor:'alta',cor:'#F87171'},
      ], x_pos:14,  y_pos:142, w_px:579, h_px:56 },
      { _key:'cp7',  nomeCampo:'progresso',     label:'Progresso (%)',     tipo:'progresso',   tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'0',   largura:49, opcoes:null,           x_pos:607, y_pos:142, w_px:579, h_px:56 },
      // Linha 4: DtInicio(283)+14+DtPrevisao(283)+14+DtConclusao(283)+14+Orcamento(281)=1172→last=14+283+14+283+14+283+14=905, 905+281=1186✓
      { _key:'cp8',  nomeCampo:'dt_inicio',     label:'Dt. Início',        tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:14,  y_pos:206, w_px:283, h_px:56 },
      { _key:'cp9',  nomeCampo:'dt_previsao',   label:'Dt. Previsão',      tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:311, y_pos:206, w_px:283, h_px:56 },
      { _key:'cp10', nomeCampo:'dt_conclusao',  label:'Dt. Conclusão',     tipo:'data',        tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:608, y_pos:206, w_px:283, h_px:56 },
      { _key:'cp11', nomeCampo:'orcamento',     label:'Orçamento',         tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:24, opcoes:null,           x_pos:905, y_pos:206, w_px:281, h_px:56 },
      { _key:'cp12', nomeCampo:'descricao',     label:'Descrição',         tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:270, w_px:1172, h_px:90 },
      { _key:'cp13', nomeCampo:'tags',          label:'Tags',              tipo:'tags',        tamanho:300, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:368, w_px:1172, h_px:56 },
      { _key:'cp14', nomeCampo:'_fav',          label:'Favorito',          tipo:'favorito',    tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:50, opcoes:null,           x_pos:14,  y_pos:432, w_px:220, h_px:44 },
      { _key:'cp15', nomeCampo:'_ts',           label:'Datas',             tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:248, y_pos:432, w_px:938, h_px:56 },
    ],
  },

  // ── Livro Caixa ───────────────────────────────────────────────────────────
  {
    id: 'livro_caixa',
    emoji: '📒', label: 'Livro Caixa', categoria: 'Operacional',
    descricao: 'Registro de entradas e saídas com saldo anterior, forma de pagamento e saldo atual calculado.',
    nomeTela: 'Livro Caixa', icone: 'book', canvasW: 1200, canvasH: 496,
    campos: [
      // Linha 1: Código(110)+14+Data(260)+14+Descrição(802)=1186→ sum=1144: 110+260+774=1144→last=14+110+14+260+14=412, 412+774=1186✓
      { _key:'lx1',  nomeCampo:'codigo',        label:'Código',            tipo:'codigo_auto', tamanho:20,  obrigatorio:false, sequencial:true,  campoBusca:false, valorPadrao:'001', largura:9,  opcoes:{seqChars:5},   x_pos:14,  y_pos:14,  w_px:110, h_px:56 },
      { _key:'lx2',  nomeCampo:'data',          label:'Data',              tipo:'data',        tamanho:0,   obrigatorio:true,  sequencial:false, campoBusca:false, valorPadrao:'',    largura:22, opcoes:null,           x_pos:138, y_pos:14,  w_px:260, h_px:56 },
      { _key:'lx3',  nomeCampo:'descricao',     label:'Descrição',         tipo:'texto',       tamanho:300, obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'',    largura:65, opcoes:null,           x_pos:412, y_pos:14,  w_px:774, h_px:56 },
      // Linha 2: Tipo(300)+14+Categoria(380)+14+FormaPagamento(472)=1172→last=14+300+14+380+14=722, 722+464=1186→ FormaPgto=464: 300+380+464=1144+2*14=1172✓
      { _key:'lx4',  nomeCampo:'tipo',          label:'Tipo',              tipo:'radio',       tamanho:10,  obrigatorio:true,  sequencial:false, campoBusca:true,  valorPadrao:'saida', largura:26, opcoes:[
        {label:'Entrada',valor:'entrada',cor:'#4ADE80'},{label:'Saída',valor:'saida',cor:'#F87171'},
      ], x_pos:14,  y_pos:78,  w_px:300, h_px:56 },
      { _key:'lx5',  nomeCampo:'categoria',     label:'Categoria',         tipo:'pasta',       tamanho:100, obrigatorio:false, sequencial:false, campoBusca:true,  valorPadrao:'',    largura:32, opcoes:null,           x_pos:328, y_pos:78,  w_px:380, h_px:56 },
      { _key:'lx6',  nomeCampo:'forma_pagamento', label:'Forma de Pagamento', tipo:'select',  tamanho:50,  obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:40, opcoes:[
        {label:'Dinheiro',valor:'dinheiro',cor:'#4ADE80'},{label:'PIX',valor:'pix',cor:'#34D399'},{label:'TED',valor:'ted',cor:'#60A5FA'},
        {label:'DOC',valor:'doc',cor:'#A78BFA'},{label:'Cartão débito',valor:'cartao_debito',cor:'#FBD24C'},{label:'Cartão crédito',valor:'cartao_credito',cor:'#FB923C'},{label:'Cheque',valor:'cheque',cor:'#94A3B8'},
      ], x_pos:722, y_pos:78,  w_px:464, h_px:56 },
      // Linha 3: Valor(380)+14+SaldoAnterior(380)+14+SaldoAtual(384)=1172→last=14+380+14+380+14=802, 802+384=1186✓
      { _key:'lx7',  nomeCampo:'valor',         label:'Valor (negativo p/ saída)', tipo:'moeda', tamanho:0, obrigatorio:true,  sequencial:false, campoBusca:false, valorPadrao:'',    largura:32, opcoes:null,           x_pos:14,  y_pos:142, w_px:380, h_px:56 },
      { _key:'lx8',  nomeCampo:'saldo_anterior',label:'Saldo Anterior',    tipo:'moeda',       tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:32, opcoes:null,           x_pos:408, y_pos:142, w_px:380, h_px:56 },
      { _key:'lx9',  nomeCampo:'saldo_atual',   label:'Saldo Atual',       tipo:'calculo',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:32, opcoes:{formula:'{saldo_anterior} + {valor}'}, x_pos:802, y_pos:142, w_px:384, h_px:56 },
      { _key:'lx10', nomeCampo:'comprovante',   label:'Comprovante',       tipo:'arquivo',     tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:206, w_px:1172, h_px:90 },
      { _key:'lx11', nomeCampo:'observacoes',   label:'Observações',       tipo:'texto_longo', tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:304, w_px:1172, h_px:80 },
      { _key:'lx12', nomeCampo:'_ts',           label:'Datas',             tipo:'timestamps',  tamanho:0,   obrigatorio:false, sequencial:false, campoBusca:false, valorPadrao:'',    largura:100, opcoes:null,           x_pos:14,  y_pos:392, w_px:1172, h_px:56 },
    ],
  },
]
