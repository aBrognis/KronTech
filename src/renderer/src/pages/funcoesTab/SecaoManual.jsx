import { useState } from 'react'
import {
  Lightbulb, CheckSquare, Clock, ChevronDown, ChevronRight, Terminal, BarChart2,
  Globe, Bell, Code, Zap, Calendar, GitBranch, BookOpen, CheckCircle,
} from 'lucide-react'

function Tip({ children }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(255,107,43,.06)', border: '1px solid rgba(255,107,43,.18)', borderRadius: 9, padding: '9px 12px', marginTop: 6 }}>
      <Lightbulb size={13} color="var(--or)" style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.5 }}>{children}</span>
    </div>
  )
}

function Ok({ children }) {
  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 5 }}>
      <CheckSquare size={12} color="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>{children}</span>
    </div>
  )
}

function Nope({ children }) {
  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 5 }}>
      <Clock size={12} color="var(--yellow)" style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>{children}</span>
    </div>
  )
}

function ManualCard({ titulo, cor, Icon, status, children }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div style={{ background: 'var(--s1)', border: `1.5px solid ${aberto ? cor + '55' : 'var(--bd)'}`, borderRadius: 12, overflow: 'hidden' }}>
      <div onClick={() => setAberto(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: cor + '18', border: `1px solid ${cor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} color={cor} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{titulo}</div>
          {status && (
            <div style={{ fontSize: 10, marginTop: 2 }}>
              <span style={{ color: status === 'ok' ? 'var(--green)' : 'var(--yellow)', fontWeight: 600 }}>
                {status === 'ok' ? '✓ Funciona agora, sem configuração extra' : '⏳ Precisa de configuração adicional'}
              </span>
            </div>
          )}
        </div>
        {aberto ? <ChevronDown size={14} color="var(--t3)" /> : <ChevronRight size={14} color="var(--t3)" />}
      </div>
      {aberto && (
        <div style={{ borderTop: '1px solid var(--bd)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Codigo({ children }) {
  return (
    <code style={{ display: 'block', fontFamily: 'monospace', fontSize: 11.5, background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '8px 12px', color: 'var(--or)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {children}
    </code>
  )
}

export default function SecaoManual() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Intro */}
      <div style={{ background: 'linear-gradient(135deg, var(--or4), transparent)', border: '1.5px solid rgba(255,107,43,.2)', borderRadius: 14, padding: '16px 18px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>Central de Automações · Manual de Uso</div>
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Esta central permite automatizar e estender o KronTech sem depender de programadores para cada tarefa.
          Abaixo você encontra uma explicação prática de cada módulo: o que ele faz, como usar e um exemplo real.
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, display: 'flex', gap: 5, alignItems: 'center' }}>
            <CheckSquare size={12} color="var(--green)" /> <span style={{ color: 'var(--green)', fontWeight: 600 }}>Funciona agora</span>
          </div>
          <div style={{ fontSize: 11, display: 'flex', gap: 5, alignItems: 'center' }}>
            <Clock size={12} color="var(--yellow)" /> <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>Em desenvolvimento / precisa de configuração extra</span>
          </div>
        </div>
      </div>

      {/* Scripts SQL */}
      <ManualCard titulo="Scripts SQL" cor="var(--blue)" Icon={Terminal} status="ok">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Scripts SQL são consultas que você escreve e salva para usar sempre que precisar. Funciona diretamente no banco de dados PostgreSQL do KronTech.
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8, marginTop: 4 }}>Como usar:</div>
        <Ok>Clique em <b>Novo Script</b>, dê um nome e escreva o SQL</Ok>
        <Ok>Pressione <b>F5</b> ou clique em <b>Executar</b> para rodar</Ok>
        <Ok>O resultado aparece em uma tabela abaixo do editor</Ok>
        <Ok>Clique em <b>Exportar CSV</b> para baixar os dados no Excel</Ok>
        <Tip>
          Exemplo prático: você quer ver todos os clientes cadastrados no mês atual.{'\n'}
          Escreva: <b>SELECT * FROM clientes WHERE DATE_TRUNC('month', criado_em) = DATE_TRUNC('month', NOW())</b>
          {'\n'}Salve como "Clientes do mês" e execute sempre que precisar.
        </Tip>
        <Codigo>{`-- Exemplo: buscar os 10 registros mais recentes
SELECT * FROM sua_tabela
ORDER BY criado_em DESC
LIMIT 10`}</Codigo>
      </ManualCard>

      {/* Relatórios */}
      <ManualCard titulo="Relatórios" cor="var(--green)" Icon={BarChart2} status="ok">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Relatórios são scripts SQL organizados por categoria, com execução com um clique e export CSV. Ideais para relatórios gerenciais que o usuário consulta frequentemente.
        </div>
        <Ok>Crie o relatório com a query SQL desejada e uma categoria (Ex: "Financeiro", "RH")</Ok>
        <Ok>Clique em <b>Executar</b> no card para ver os dados imediatamente</Ok>
        <Ok>Clique em <b>CSV</b> para exportar para Excel</Ok>
        <Tip>
          Diferença de Scripts: Scripts SQL são para uso técnico (testar, ajustar, debugar). Relatórios são para uso do dia a dia por qualquer usuário.
        </Tip>
      </ManualCard>

      {/* Integrações */}
      <ManualCard titulo="Integrações" cor="var(--green)" Icon={Globe} status="ok">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Integrações conectam o KronTech a serviços externos via HTTP/REST. Você configura a URL, método, autenticação e corpo da requisição, e pode testar com um clique.
        </div>
        <Ok>Cadastre a API com nome, URL, método (GET/POST/...) e autenticação</Ok>
        <Ok>Clique em <b>Testar</b> para fazer a chamada de verdade e ver a resposta</Ok>
        <Ok>A resposta aparece logo abaixo do card em formato JSON</Ok>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8, marginTop: 6, marginBottom: 4 }}>Exemplo prático: Consultar CEP</div>
        <Ok>URL: <code style={{ background: 'var(--s2)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>https://viacep.com.br/ws/01310100/json/</code></Ok>
        <Ok>Método: GET, sem autenticação</Ok>
        <Ok>Clique Testar: retorna logradouro, bairro, cidade automaticamente</Ok>
        <Tip>
          Para integrar com o Slack, WhatsApp Business, n8n, Zapier ou qualquer sistema que tenha webhook: configure como Integração e acione manualmente ou via Fluxo.
        </Tip>
      </ManualCard>

      {/* Notificações */}
      <ManualCard titulo="Notificações" cor="var(--purple)" Icon={Bell} status="ok">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Templates de notificação reutilizáveis. Você cria o template uma vez e aciona quando quiser, pelo botão Testar, ou futuramente por automações e fluxos.
        </div>
        <Ok><b>Toast (na tela)</b>: aparece no centro da tela por alguns segundos. Tipos: sucesso (verde), erro (vermelho), aviso (amarelo), info (laranja)</Ok>
        <Ok><b>Desktop</b>: notificação do sistema operacional, aparece mesmo com o KronTech minimizado</Ok>
        <Ok><b>Webhook</b>: envia um POST HTTP para qualquer URL quando acionada (Slack, Teams, etc.)</Ok>
        <Tip>
          Você pode usar variáveis nas mensagens como <b>{'{nome_campo}'}</b>: quando o motor de automações for ativado, elas serão substituídas pelo valor real do campo.
        </Tip>
      </ManualCard>

      {/* Minhas Funções */}
      <ManualCard titulo="Minhas Funções" cor="var(--or)" Icon={Code} status="ok">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Crie funções JavaScript reutilizáveis para cálculos, formatações e lógicas personalizadas. Você testa ali mesmo na tela, sem precisar abrir nenhum editor externo.
        </div>
        <Ok>Defina o nome (sem espaços), os parâmetros de entrada e o código JavaScript</Ok>
        <Ok>Use <b>return</b> para retornar o resultado</Ok>
        <Ok>Preencha os campos de teste e clique em <b>Testar</b> para ver o resultado</Ok>
        <Ok>Clique em <b>Ver Exemplos</b> para carregar funções prontas como calcularDesconto, calcularIdade, gerarSenha</Ok>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8, marginTop: 6, marginBottom: 4 }}>Exemplo: calcular desconto</div>
        <Codigo>{`// Parâmetros: preco, desconto
const fator = 1 - (desconto / 100)
return (preco * fator).toFixed(2)

// Teste: preco=100, desconto=15 → resultado: 85.00`}</Codigo>
        <Tip>
          As funções criadas aqui ficam salvas no sistema. No futuro, poderão ser chamadas diretamente nas automações e fluxos com o nome da função.
        </Tip>
      </ManualCard>

      {/* Automações */}
      <ManualCard titulo="Automações" cor="var(--or)" Icon={Zap} status="pending">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Automações são regras visuais do tipo <b>"quando X acontecer → faça Y"</b>. Você configura o gatilho (evento), condições opcionais e as ações a executar.
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8, marginTop: 4, marginBottom: 4 }}>Como funciona na teoria:</div>
        <Ok><b>Gatilho</b>: define quando a automação roda: ao abrir tela, ao salvar, quando um campo muda, ao excluir</Ok>
        <Ok><b>Condições</b> (opcionais): filtram quando executar, ex: só se campo_tipo for igual a "PJ"</Ok>
        <Ok><b>Ações</b>: o que acontece: mostrar alerta, preencher campo, ocultar campo, navegar para outra tela, executar SQL, chamar API</Ok>
        <div style={{ background: 'rgba(251,210,76,.08)', border: '1px solid rgba(251,210,76,.25)', borderRadius: 9, padding: '10px 12px', marginTop: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--yellow)', marginBottom: 4 }}>⏳ Status atual:</div>
          <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.6 }}>
            As automações já são <b>salvas e configuradas</b> aqui, mas ainda não estão conectadas ao motor de execução das telas. O próximo passo do desenvolvimento é criar o mecanismo que lê essas regras e as aplica quando os eventos acontecem nas telas criadas no Designer.
            <br /><br />
            <b>O que fazer agora:</b> Configure suas automações aqui. Quando o motor for integrado, elas já vão funcionar automaticamente nas telas corretas.
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8, marginTop: 6, marginBottom: 4 }}>Exemplo real (quando pronto):</div>
        <Ok>Gatilho: <b>Quando campo "tipo_pessoa" muda</b></Ok>
        <Ok>Condição: tipo_pessoa <b>é igual a</b> "PJ"</Ok>
        <Ok>Ação 1: <b>Ocultar campo</b> "cpf"</Ok>
        <Ok>Ação 2: <b>Mostrar campo</b> "cnpj"</Ok>
      </ManualCard>

      {/* Agendamentos */}
      <ManualCard titulo="Agendamentos" cor="var(--yellow)" Icon={Calendar} status="pending">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Permite executar scripts SQL ou integrações automaticamente em intervalos definidos: a cada hora, diariamente, semanalmente ou por expressão cron personalizada.
        </div>
        <Ok>Vincule um <b>Script SQL</b> salvo (ex: "Backup diário") ou uma <b>Integração</b> (ex: "Enviar relatório Slack")</Ok>
        <Ok>Escolha o intervalo: 5min, 1h, 1 dia, 1 semana, ou cron personalizado</Ok>
        <div style={{ background: 'rgba(251,210,76,.08)', border: '1px solid rgba(251,210,76,.25)', borderRadius: 9, padding: '10px 12px', marginTop: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--yellow)', marginBottom: 4 }}>⏳ Status atual:</div>
          <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.6 }}>
            A configuração já funciona, mas o timer de background ainda não foi implementado. O KronTech precisará de um processo em segundo plano que verifica os agendamentos e os executa no momento certo.
          </div>
        </div>
        <Tip>
          Expressão cron, exemplos: <b>0 8 * * 1-5</b> = toda semana de seg a sex às 8h. <b>0 0 1 * *</b> = primeiro dia de cada mês à meia-noite.
        </Tip>
      </ManualCard>

      {/* Fluxos */}
      <ManualCard titulo="Fluxos" cor="var(--purple)" Icon={GitBranch} status="pending">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Fluxos são sequências de etapas encadeadas: condição → SQL → API → notificação → espera. São como mini-programas visuais que você monta sem código.
        </div>
        <Ok><b>Gatilho</b>: define o início: botão manual, ao salvar, agendado, webhook</Ok>
        <Ok><b>Condição</b>: ramifica o fluxo, se verdadeiro segue, se falso para ou desvia</Ok>
        <Ok><b>SQL</b>: executa um script no banco e passa o resultado para a próxima etapa</Ok>
        <Ok><b>API</b>: chama uma integração externa e pode usar o resultado</Ok>
        <Ok><b>Notificar</b>: dispara um template de notificação</Ok>
        <Ok><b>Esperar</b>: pausa por X segundos antes de continuar</Ok>
        <div style={{ background: 'rgba(251,210,76,.08)', border: '1px solid rgba(251,210,76,.25)', borderRadius: 9, padding: '10px 12px', marginTop: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--yellow)', marginBottom: 4 }}>⏳ Status atual:</div>
          <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.6 }}>
            A interface de configuração está pronta. O mecanismo de execução das etapas em sequência está em desenvolvimento.
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8, marginTop: 6, marginBottom: 4 }}>Exemplo de fluxo completo (quando pronto):</div>
        <Ok>1. Gatilho: botão "Fechar Pedido" clicado</Ok>
        <Ok>2. SQL: atualiza status do pedido para "fechado"</Ok>
        <Ok>3. API: envia os dados para o sistema de faturamento</Ok>
        <Ok>4. Notificar: toast "Pedido fechado e enviado para faturamento!"</Ok>
      </ManualCard>

      {/* Biblioteca */}
      <ManualCard titulo="Biblioteca de Funções" cor="var(--t2)" Icon={BookOpen} status="ok">
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
          Referência de todas as funções JavaScript já prontas que você pode importar e usar em scripts, automações e funções personalizadas.
        </div>
        <Ok><b>Utilitários:</b> formatarMoeda, formatarCPF, formatarCNPJ, validarEmail, formatarData, gerarID</Ok>
        <Ok><b>Interface:</b> mostrarAlerta, mostrarCarregando, preencherCampo, lerCampo, limparFormulario</Ok>
        <Ok><b>Navegação:</b> abrirTela, voltarTela, abrirModal, fecharModal</Ok>
        <Ok><b>Banco de Dados:</b> executarSQL, buscar, inserir, atualizar, deletar</Ok>
        <Ok><b>Arquivo:</b> exportarCSV, baixarArquivo, exportarPDF, copiarTexto</Ok>
        <Tip>
          Para usar em um script personalizado: <code style={{ background: 'var(--s2)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 10 }}>import {"{ formatarMoeda }"} from '../lib/funcoes/index.js'</code>
        </Tip>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8, marginTop: 6, marginBottom: 4 }}>Exemplo: formatar valor monetário</div>
        <Codigo>{`import { formatarMoeda } from '../lib/funcoes/index.js'

const preco = 1500.5
console.log(formatarMoeda(preco)) // → "R$ 1.500,50"`}</Codigo>
      </ManualCard>

      {/* Próximos passos */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 12, padding: '14px 16px', marginTop: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Roteiro de desenvolvimento</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { done: true,  label: 'Scripts SQL: editor, salvar, executar, exportar CSV' },
            { done: true,  label: 'Integrações HTTP: configurar, testar com resposta em tempo real' },
            { done: true,  label: 'Relatórios: queries salvas por categoria com export' },
            { done: true,  label: 'Notificações: toast, desktop e webhook configuráveis' },
            { done: true,  label: 'Minhas Funções: criar e testar funções JS personalizadas' },
            { done: false, label: 'Motor de Automações: conectar regras às telas do Designer' },
            { done: false, label: 'Timer de Agendamentos: executar em background por intervalo/cron' },
            { done: false, label: 'Engine de Fluxos: executar etapas em sequência com resultado entre elas' },
            { done: false, label: 'Vinculação tela ↔ automação: cada tela escolhe quais automações a afetam' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
              {item.done
                ? <CheckCircle size={13} color="var(--green)" />
                : <Clock size={13} color="var(--yellow)" />}
              <span style={{ color: item.done ? 'var(--t1)' : 'var(--t3)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
