import { useState } from 'react'
import {
  Type, Layers, Hash, CheckSquare, Calendar, FolderOpen, Activity, Monitor,
  Compass, Database, Clipboard, Wrench, ChevronDown, ChevronRight, Copy,
} from 'lucide-react'
import { copiarTexto } from '../../lib/funcoes/index.js'

export default function SecaoBiblioteca({ telas }) {
  const GRUPOS = [
    {
      id: 'strings', icon: Type, cor: '#a78bfa', titulo: 'Textos & Strings',
      desc: 'Formatar, transformar e manipular textos',
      itens: [
        { fn: 'capitalizar(texto)',              desc: '"joão silva" → "João Silva"' },
        { fn: 'removerAcentos(texto)',           desc: '"ação" → "acao"' },
        { fn: 'slugify(texto)',                  desc: '"Olá Mundo!" → "ola-mundo"' },
        { fn: 'truncar(texto, limite)',          desc: '"texto longo..." (com reticências)' },
        { fn: 'contarPalavras(texto)',           desc: 'número de palavras' },
        { fn: 'inverter(texto)',                 desc: '"abc" → "cba"' },
        { fn: 'repetir(texto, n)',               desc: '"ab" × 3 → "ababab"' },
        { fn: 'removerEspacos(texto)',           desc: 'remove TODOS os espaços' },
        { fn: 'contarOcorrencias(texto, busca)', desc: 'quantas vezes "busca" aparece' },
        { fn: 'substituir(texto, de, para)',     desc: 'troca todas as ocorrências' },
        { fn: 'extrairNumeros(texto)',           desc: '"R$ 1.500" → 1500' },
        { fn: 'extrairTexto(texto)',             desc: 'remove números e símbolos' },
        { fn: 'mascararTexto(valor, mascara)',   desc: '"##.###.###/####-##" (CNPJ)' },
        { fn: 'formatarTelefone(tel)',           desc: '"11999999999" → "(11) 99999-9999"' },
        { fn: 'formatarCEP(cep)',               desc: '"01310100" → "01310-100"' },
        { fn: 'iniciais(nome, qtd)',             desc: '"João Silva" → "JS"' },
        { fn: 'primeiroNome(nomeCompleto)',      desc: '"João Silva" → "João"' },
        { fn: 'ultimoNome(nomeCompleto)',        desc: '"João Silva" → "Silva"' },
        { fn: 'isPalindromo(texto)',             desc: '"arara" → true' },
        { fn: 'base64Codificar(texto)',          desc: 'encode base64' },
        { fn: 'base64Decodificar(texto)',        desc: 'decode base64' },
        { fn: 'gerarSlugUnico(texto)',           desc: '"produto-ab3x" (slug com ID)' },
      ],
    },
    {
      id: 'arrays', icon: Layers, cor: '#34d399', titulo: 'Listas & Arrays',
      desc: 'Agrupar, filtrar, ordenar e calcular listas',
      itens: [
        { fn: 'agruparPor(lista, campo)',       desc: '{ categoria: [...itens] }' },
        { fn: 'ordenarPor(lista, campo, dir)',  desc: 'asc ou desc por qualquer campo' },
        { fn: 'unico(lista, campo)',            desc: 'remove duplicatas' },
        { fn: 'somar(lista, campo)',            desc: 'soma os valores de um campo' },
        { fn: 'media(lista, campo)',            desc: 'média dos valores' },
        { fn: 'maximo(lista, campo)',           desc: 'maior valor' },
        { fn: 'minimo(lista, campo)',           desc: 'menor valor' },
        { fn: 'filtrarPor(lista, campo, val)', desc: 'filtra por texto (contém)' },
        { fn: 'paginar(lista, pag, porPag)',    desc: '{ dados, total, paginas }' },
        { fn: 'embaralhar(lista)',              desc: 'ordem aleatória' },
        { fn: 'chunks(lista, tamanho)',         desc: 'divide em grupos de N' },
        { fn: 'aplanar(lista, prof)',           desc: '[[1,2],[3]] → [1,2,3]' },
        { fn: 'interseccao(a, b)',              desc: 'elementos em comum' },
        { fn: 'diferenca(a, b)',               desc: 'elementos só em A' },
        { fn: 'uniao(a, b)',                   desc: 'todos sem repetição' },
        { fn: 'contarPor(lista, campo)',        desc: '{ valor: quantidade }' },
        { fn: 'primeiros(lista, n)',            desc: 'primeiros N elementos' },
        { fn: 'ultimos(lista, n)',              desc: 'últimos N elementos' },
        { fn: 'sortearUm(lista)',              desc: 'item aleatório da lista' },
      ],
    },
    {
      id: 'math', icon: Hash, cor: '#facc15', titulo: 'Matemática',
      desc: 'Cálculos, porcentagens, conversões',
      itens: [
        { fn: 'arredondar(valor, casas)',       desc: 'arredonda para N decimais' },
        { fn: 'porcentagem(parte, total)',      desc: '25 de 200 → 12.5%' },
        { fn: 'aplicarPorcentagem(valor, pct)', desc: '10% de 500 → 50' },
        { fn: 'desconto(preco, pct)',           desc: '15% off em R$100 → R$85' },
        { fn: 'acrescimo(preco, pct)',          desc: '10% em R$100 → R$110' },
        { fn: 'clamp(valor, min, max)',         desc: 'limita valor entre min e max' },
        { fn: 'aleatorio(min, max)',            desc: 'inteiro aleatório no intervalo' },
        { fn: 'aleatorioDecimal(min, max)',     desc: 'decimal aleatório' },
        { fn: 'mediaArray(valores)',            desc: 'média de array de números' },
        { fn: 'fibonacci(n)',                  desc: 'N-ésimo número de Fibonacci' },
        { fn: 'fatorial(n)',                   desc: '5! → 120' },
        { fn: 'mdc(a, b)',                     desc: 'máximo divisor comum' },
        { fn: 'mmc(a, b)',                     desc: 'mínimo múltiplo comum' },
        { fn: 'ehPrimo(n)',                    desc: 'true / false' },
        { fn: 'converterUnidade(v, de, para)', desc: 'km→m, kg→g, c→f, l→ml...' },
        { fn: 'raiz(valor, indice)',            desc: 'raiz quadrada, cúbica...' },
        { fn: 'potencia(base, exp)',            desc: '2^10 → 1024' },
        { fn: 'logaritmo(valor, base)',         desc: 'log de qualquer base' },
        { fn: 'formatarNumero(v, casas)',       desc: '1500.5 → "1.500,50"' },
      ],
    },
    {
      id: 'validacao', icon: CheckSquare, cor: '#f472b6', titulo: 'Validação',
      desc: 'CPF, CNPJ, email, telefone, senha e mais',
      itens: [
        { fn: 'validarCPF(cpf)',            desc: 'verifica dígitos verificadores reais' },
        { fn: 'validarCNPJ(cnpj)',          desc: 'verifica dígitos verificadores reais' },
        { fn: 'validarEmail(email)',        desc: 'true / false' },
        { fn: 'validarTelefone(tel)',       desc: '10 ou 11 dígitos' },
        { fn: 'validarCEP(cep)',           desc: 'formato 00000-000' },
        { fn: 'validarURL(url)',           desc: 'URL válida → true' },
        { fn: 'validarData(data)',         desc: 'data válida → true' },
        { fn: 'validarSenha(s, opcoes)',   desc: '{ ok, motivo } — min, maiuscula, número, especial' },
        { fn: 'forcaSenha(senha)',         desc: '"Fraca" / "Média" / "Forte"' },
        { fn: 'validarCartaoCredito(n)',   desc: 'algoritmo de Luhn' },
        { fn: 'validarPlacaBr(placa)',     desc: 'padrão ABC1234 e ABC1D23 (Mercosul)' },
        { fn: 'validarHorario(hora)',      desc: 'formato HH:MM' },
        { fn: 'isMaiorDeIdade(dataNasc)', desc: 'true se ≥ 18 anos' },
      ],
    },
    {
      id: 'datas', icon: Calendar, cor: '#60a5fa', titulo: 'Data & Hora',
      desc: 'Calcular, formatar e comparar datas',
      itens: [
        { fn: 'hoje()',                          desc: '"2025-06-06" (formato ISO)' },
        { fn: 'hojeFormatado()',                 desc: '"06/06/2025"' },
        { fn: 'horaAtual()',                     desc: '"14:30"' },
        { fn: 'agora()',                         desc: 'ISO string completo com hora' },
        { fn: 'adicionarDias(data, n)',          desc: '"2025-06-06" + 7 → "2025-06-13"' },
        { fn: 'adicionarMeses(data, n)',         desc: 'adiciona N meses' },
        { fn: 'adicionarAnos(data, n)',          desc: 'adiciona N anos' },
        { fn: 'diasEntreDatas(inicio, fim)',     desc: 'número de dias' },
        { fn: 'calcularIdade(dataNasc)',         desc: 'idade em anos' },
        { fn: 'diaDaSemana(data)',              desc: '"segunda-feira"' },
        { fn: 'mesExtenso(data)',               desc: '"junho"' },
        { fn: 'ehFimDeSemana(data)',            desc: 'true / false' },
        { fn: 'ehDiaUtil(data)',                desc: 'true / false' },
        { fn: 'inicioDoMes(data)',              desc: 'primeiro dia do mês' },
        { fn: 'fimDoMes(data)',                 desc: 'último dia do mês' },
        { fn: 'diasNoMes(data)',               desc: '28, 29, 30 ou 31' },
        { fn: 'trimestre(data)',               desc: '1, 2, 3 ou 4' },
        { fn: 'semanaDoAno(data)',             desc: 'semana 1–52' },
        { fn: 'formatarRelativo(data)',         desc: '"há 2 dias" / "em 3 horas"' },
        { fn: 'formatarDataPorExtenso(data)',   desc: '"6 de junho de 2025"' },
        { fn: 'proximoDiaUtil(data)',           desc: 'pula fins de semana' },
      ],
    },
    {
      id: 'storage', icon: FolderOpen, cor: '#fb923c', titulo: 'Storage Local',
      desc: 'Salvar dados no dispositivo sem banco',
      itens: [
        { fn: 'salvarLocal(chave, valor)',          desc: 'persiste até o usuário limpar' },
        { fn: 'lerLocal(chave, fallback)',          desc: 'lê valor salvo ou retorna fallback' },
        { fn: 'removerLocal(chave)',               desc: 'remove uma chave' },
        { fn: 'limparLocal()',                     desc: 'apaga TODOS os dados do KronTech' },
        { fn: 'listarLocal()',                     desc: '[{ chave, valor }] — lista tudo salvo' },
        { fn: 'incrementarLocal(chave, por)',       desc: 'incrementa contador salvo' },
        { fn: 'salvarLocalComExpiracao(k,v,ttl)',  desc: 'expira após N milissegundos' },
        { fn: 'lerLocalComExpiracao(chave)',        desc: 'retorna null se expirado' },
        { fn: 'salvarSessao(chave, valor)',         desc: 'apaga ao fechar o app' },
        { fn: 'lerSessao(chave, fallback)',         desc: 'lê dado de sessão' },
      ],
    },
    {
      id: 'cores', icon: Activity, cor: '#f472b6', titulo: 'Cores',
      desc: 'Converter, misturar e gerar paletas',
      itens: [
        { fn: 'hexParaRgb(hex)',           desc: '{ r: 255, g: 107, b: 43 }' },
        { fn: 'rgbParaHex(r, g, b)',       desc: '"#ff6b2b"' },
        { fn: 'clarear(hex, pct)',         desc: 'clareia N% a cor' },
        { fn: 'escurecer(hex, pct)',       desc: 'escurece N% a cor' },
        { fn: 'corContrastante(hex)',      desc: 'retorna #000 ou #fff (legibilidade)' },
        { fn: 'hexParaRgbString(hex, a)',  desc: '"rgba(255, 107, 43, 0.5)"' },
        { fn: 'misturarCores(hex1, hex2)', desc: 'mistura duas cores com peso' },
        { fn: 'gerarPaleta(hex, qtd)',     desc: 'gera N variações da cor' },
        { fn: 'corAleatoria()',           desc: '"#a3f2c1" — hex aleatório' },
        { fn: 'hexValido(hex)',           desc: 'true / false' },
      ],
    },
    {
      id: 'ui', icon: Monitor, cor: '#a78bfa', titulo: 'Interface',
      desc: 'Alertas, loading, formulários',
      itens: [
        { fn: "mostrarAlerta(msg, tipo)",    desc: 'toast no centro da tela (sucesso/erro/aviso/info)' },
        { fn: 'confirmar(msg)',              desc: 'caixa nativa → true / false' },
        { fn: 'mostrarCarregando(bool)',     desc: 'overlay de loading' },
        { fn: 'preencherCampo(nome,valor)',  desc: 'preenche <input name=...>' },
        { fn: 'lerCampo(nome)',              desc: 'lê valor do campo' },
        { fn: 'limparFormulario(id)',        desc: 'zera todos os campos do form' },
        { fn: 'desabilitarBotao(id)',        desc: 'desabilita botão por ID' },
        { fn: 'habilitarBotao(id)',          desc: 'reabilita botão por ID' },
      ],
    },
    {
      id: 'nav', icon: Compass, cor: '#fb923c', titulo: 'Navegação',
      desc: 'Navegar entre telas e modais',
      itens: [
        { fn: "abrirTela('dashboard')",   desc: 'navega para rota interna' },
        { fn: "abrirTela('fb__tabela')",  desc: 'abre tela dinâmica criada no Designer' },
        { fn: 'voltarTela()',             desc: 'volta para a tela anterior' },
        { fn: 'abrirModal(id)',           desc: 'exibe div modal pelo ID' },
        { fn: 'fecharModal(id)',          desc: 'fecha modal pelo ID' },
        { fn: 'abrirEmNovaAba(url)',      desc: 'abre URL externa na janela padrão' },
      ],
    },
    {
      id: 'db', icon: Database, cor: '#facc15', titulo: 'Banco de Dados',
      desc: 'Consultar e gravar via PostgreSQL',
      itens: [
        { fn: 'executarSQL(sql)',           desc: '{ ok, rows, rowCount, command, ms }' },
        { fn: 'buscar(tabela, {filtros})',  desc: 'SELECT * com WHERE automático' },
        { fn: 'inserir(tabela, dados)',     desc: 'INSERT RETURNING * → registro criado' },
        { fn: 'atualizar(tabela,dados,f)', desc: 'UPDATE RETURNING *' },
        { fn: 'deletar(tabela, filtros)',   desc: 'DELETE com filtros obrigatórios' },
      ],
    },
    {
      id: 'arq', icon: FolderOpen, cor: '#f472b6', titulo: 'Arquivo & Export',
      desc: 'Download, CSV, PDF',
      itens: [
        { fn: 'exportarCSV(dados, nome)',  desc: 'CSV com BOM UTF-8, abre no Excel' },
        { fn: 'baixarArquivo(url, nome)', desc: 'inicia download de qualquer URL' },
        { fn: 'exportarPDF(id, nome)',    desc: 'imprime elemento #id como PDF' },
        { fn: 'copiarTexto(texto)',        desc: 'copia para área de transferência' },
      ],
    },
    {
      id: 'clip', icon: Clipboard, cor: '#60a5fa', titulo: 'Clipboard',
      desc: 'Copiar textos e elementos',
      itens: [
        { fn: 'copiarTexto(texto)',        desc: 'copia texto puro para clipboard' },
        { fn: 'copiarElemento(id)',        desc: 'copia conteúdo de elemento pelo ID' },
        { fn: 'copiarCampo(nome)',         desc: 'copia valor de <input name=...>' },
        { fn: 'mostrarBotaoCopiar(id)',    desc: 'injeta botão 📋 ao lado do elemento' },
      ],
    },
    {
      id: 'util', icon: Wrench, cor: '#34d399', titulo: 'Utilitários Gerais',
      desc: 'Formatação, IDs, tempo e misc',
      itens: [
        { fn: 'formatarMoeda(v)',     desc: 'R$ 1.234,56' },
        { fn: 'formatarCPF(v)',       desc: '000.000.000-00' },
        { fn: 'formatarCNPJ(v)',      desc: '00.000.000/0000-00' },
        { fn: 'formatarData(v,fmt)',  desc: "dd/MM/yyyy · use HH:mm para hora" },
        { fn: 'gerarID()',            desc: 'string única aleatória em base36' },
        { fn: 'debounce(fn, ms)',     desc: 'atrasa execução em X ms' },
        { fn: 'sleep(ms)',            desc: 'await sleep(1000) — pausa assíncrona' },
      ],
    },
  ]

  const [abertos, setAbertos] = useState({})
  const toggle = id => setAbertos(p => ({ ...p, [id]: !p[id] }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, color: 'var(--t2)', background: 'var(--or4)', border: '1px solid rgba(255,107,43,.18)', borderRadius: 9, padding: '8px 12px', lineHeight: 1.5 }}>
        <b>Importação:</b>{' '}
        <code style={{ fontFamily: 'monospace', fontSize: 10, background: 'var(--s3)', padding: '1px 6px', borderRadius: 4, color: 'var(--or)' }}>
          {'import { nomeDaFuncao } from \'../lib/funcoes/index.js\''}
        </code>
      </div>
      {GRUPOS.map(g => (
        <div key={g.id} style={{ background: 'var(--s1)', border: `1.5px solid ${abertos[g.id] ? g.cor + '55' : 'var(--bd)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color .15s' }}>
          <div onClick={() => toggle(g.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--s2)', border: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <g.icon size={14} color={g.cor} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{g.titulo}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>{g.desc}</div>
            </div>
            <span style={{ fontSize: 9, background: 'var(--s3)', padding: '2px 7px', borderRadius: 20, color: 'var(--t3)' }}>{g.itens.length} funções</span>
            {abertos[g.id] ? <ChevronDown size={12} color="var(--t3)" /> : <ChevronRight size={12} color="var(--t3)" />}
          </div>
          {abertos[g.id] && (
            <div style={{ borderTop: '1px solid var(--bd)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {g.itens.map(it => (
                <div key={it.fn} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <code style={{ fontSize: 11, fontFamily: 'monospace', color: g.cor, fontWeight: 600, flexShrink: 0 }}>{it.fn}</code>
                  <span style={{ fontSize: 10, color: 'var(--t2)' }}>{it.desc}</span>
                  <button title="Copiar" onClick={() => copiarTexto(it.fn.split('(')[0])} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', opacity: .6, padding: 0 }}>
                    <Copy size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
