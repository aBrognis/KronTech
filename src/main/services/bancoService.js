import { query, queryOne } from '../db'

// CRUD de Bancos + grids-filho (agencias, convenios de cobranca).
// Padrao: pai + diff dos filhos (insere novos, atualiza alterados, remove
// os que sumiram da lista enviada pelo renderer).

const COLS_BANCO = ['compe', 'ispb', 'nome', 'nome_curto', 'tipo', 'site', 'telefone_sac', 'pais', 'situacao_bacen', 'observacoes', 'ativo']
const COLS_AGENCIA = ['numero', 'digito', 'nome', 'telefone', 'cep', 'logradouro', 'numero_end', 'bairro', 'cidade', 'uf', 'ativo']
const COLS_CONVENIO = [
  'descricao', 'agencia', 'agencia_digito', 'conta', 'conta_digito', 'numero_convenio',
  'carteira', 'variacao_carteira', 'cnab', 'nosso_numero_inicial', 'nosso_numero_atual',
  'aceite', 'especie_documento', 'multa_percentual', 'multa_apos_dias', 'juros_mes_percentual',
  'dias_protesto', 'dias_baixa', 'instrucao1', 'instrucao2', 'ativo',
]

function up(v) { return typeof v === 'string' ? v.trim().toUpperCase() : v }

export async function listar({ busca } = {}) {
  const cond = ['ativo IS DISTINCT FROM false']
  const params = []
  if (busca && String(busca).trim()) {
    params.push(`%${busca.trim()}%`)
    cond.push(`(nome ILIKE $1 OR nome_curto ILIKE $1 OR compe ILIKE $1 OR codigo ILIKE $1)`)
  }
  return query(
    `SELECT b.*,
       (SELECT count(*) FROM banco_agencia_001 a WHERE a.banco_id = b.id)  AS qtd_agencias,
       (SELECT count(*) FROM banco_convenio_001 c WHERE c.banco_id = b.id)  AS qtd_convenios
     FROM banco_001 b
     WHERE ${cond.join(' AND ')}
     ORDER BY nome ASC LIMIT 1000`,
    params
  )
}

export async function obter(id) {
  const banco = await queryOne('SELECT * FROM banco_001 WHERE id = $1', [id])
  if (!banco) return null
  const agencias = await query('SELECT * FROM banco_agencia_001 WHERE banco_id = $1 ORDER BY numero', [id])
  const convenios = await query('SELECT * FROM banco_convenio_001 WHERE banco_id = $1 ORDER BY descricao', [id])
  return { ...banco, agencias, convenios }
}

async function upsertFilhos(tabela, fk, bancoId, colunas, lista) {
  const enviados = Array.isArray(lista) ? lista : []
  const idsEnviados = enviados.filter(x => x.id).map(x => x.id)
  // remove os que sumiram
  if (idsEnviados.length) {
    await query(`DELETE FROM ${tabela} WHERE ${fk} = $1 AND id <> ALL($2::int[])`, [bancoId, idsEnviados])
  } else {
    await query(`DELETE FROM ${tabela} WHERE ${fk} = $1`, [bancoId])
  }
  for (const item of enviados) {
    const cols = colunas.filter(c => item[c] !== undefined)
    if (item.id) {
      if (!cols.length) continue
      const sets = cols.map((c, i) => `${c} = $${i + 3}`)
      await query(
        `UPDATE ${tabela} SET ${sets.join(', ')}, alterado_em = NOW() WHERE id = $1 AND ${fk} = $2`,
        [item.id, bancoId, ...cols.map(c => item[c])]
      )
    } else {
      const ph = cols.map((_, i) => `$${i + 2}`)
      await query(
        `INSERT INTO ${tabela} (${fk}, ${cols.join(', ')}) VALUES ($1, ${ph.join(', ')})`,
        [bancoId, ...cols.map(c => item[c])]
      )
    }
  }
}

export async function criar(dados) {
  const d = { ...dados, nome: up(dados.nome), nome_curto: up(dados.nome_curto) }
  const cols = COLS_BANCO.filter(c => d[c] !== undefined)
  const ph = cols.map((_, i) => `$${i + 1}`)
  const row = await queryOne(
    `INSERT INTO banco_001 (${cols.join(', ')}, codigo)
     VALUES (${ph.join(', ')}, LPAD(nextval('banco_001_codigo_seq')::text, 4, '0'))
     RETURNING *`,
    cols.map(c => d[c])
  )
  await upsertFilhos('banco_agencia_001', 'banco_id', row.id, COLS_AGENCIA, d.agencias)
  await upsertFilhos('banco_convenio_001', 'banco_id', row.id, COLS_CONVENIO, d.convenios)
  return obter(row.id)
}

export async function atualizar({ id, ...dados }) {
  const d = { ...dados, nome: up(dados.nome), nome_curto: up(dados.nome_curto) }
  const cols = COLS_BANCO.filter(c => d[c] !== undefined)
  if (cols.length) {
    const sets = cols.map((c, i) => `${c} = $${i + 2}`)
    await query(`UPDATE banco_001 SET ${sets.join(', ')}, alterado_em = NOW() WHERE id = $1`, [id, ...cols.map(c => d[c])])
  }
  await upsertFilhos('banco_agencia_001', 'banco_id', id, COLS_AGENCIA, d.agencias)
  await upsertFilhos('banco_convenio_001', 'banco_id', id, COLS_CONVENIO, d.convenios)
  return obter(id)
}

export async function excluir(id) {
  await query('DELETE FROM banco_001 WHERE id = $1', [id]) // CASCADE nos filhos
  return { id }
}

export async function mudarAtivoLote(ids, ativo) {
  if (!Array.isArray(ids) || !ids.length) return { atualizadas: 0 }
  const rows = await query('UPDATE banco_001 SET ativo = $2, alterado_em = NOW() WHERE id = ANY($1::int[]) RETURNING id', [ids, ativo])
  return { atualizadas: rows.length }
}

// Lista oficial resumida da Febraban (COMPE) — usada pelo botao "Importar".
// Insere so os que ainda nao existem (por compe).
const FEBRABAN = [
  ['246', 'BANCO ABC BRASIL S.A.'], ['025', 'BANCO ALFA S.A.'], ['641', 'BANCO ALVORADA S.A.'],
  ['029', 'BANCO ITAÚ CONSIGNADO S.A.'], ['000', 'BANCO BANKPAR S.A.'], ['740', 'BANCO BARCLAYS S.A.'],
  ['107', 'BANCO BOCOM BBM S.A.'], ['063', 'BANCO BRADESCARD S.A.'], ['036', 'BANCO BRADESCO BBI S.A.'],
  ['122', 'BANCO BRADESCO BERJ S.A.'], ['204', 'BANCO BRADESCO CARTÕES S.A.'], ['394', 'BANCO BRADESCO FINANCIAMENTOS S.A.'],
  ['218', 'BANCO BS2 S.A.'], ['208', 'BANCO BTG PACTUAL S.A.'], ['336', 'BANCO C6 S.A.'],
  ['473', 'BANCO CAIXA GERAL - BRASIL S.A.'], ['412', 'BANCO CAPITAL S.A.'], ['040', 'BANCO CARGILL S.A.'],
  ['745', 'BANCO CITIBANK S.A.'], ['241', 'BANCO CLÁSSICO S.A.'], ['756', 'BANCO COOPERATIVO SICOOB S.A.'],
  ['748', 'BANCO COOPERATIVO SICREDI S.A.'], ['222', 'BANCO CRÉDIT AGRICOLE BRASIL S.A.'], ['505', 'BANCO CREDIT SUISSE (BRASIL) S.A.'],
  ['003', 'BANCO DA AMAZÔNIA S.A.'], ['083', 'BANCO DA CHINA BRASIL S.A.'], ['707', 'BANCO DAYCOVAL S.A.'],
  ['300', 'BANCO DE LA NACION ARGENTINA'], ['001', 'BANCO DO BRASIL S.A.'], ['047', 'BANCO DO ESTADO DE SERGIPE S.A.'],
  ['037', 'BANCO DO ESTADO DO PARÁ S.A.'], ['041', 'BANCO DO ESTADO DO RIO GRANDE DO SUL S.A.'], ['004', 'BANCO DO NORDESTE DO BRASIL S.A.'],
  ['196', 'BANCO FAIR CORRETORA DE CÂMBIO S.A.'], ['265', 'BANCO FATOR S.A.'], ['224', 'BANCO FIBRA S.A.'],
  ['626', 'BANCO FICSA S.A.'], ['094', 'BANCO FINAXIS S.A.'], ['612', 'BANCO GUANABARA S.A.'],
  ['012', 'BANCO INBURSA S.A.'], ['604', 'BANCO INDUSTRIAL DO BRASIL S.A.'], ['653', 'BANCO INDUSVAL S.A.'],
  ['077', 'BANCO INTER S.A.'], ['redecard', 'BANCO INTERMEDIUM S.A.'], ['249', 'BANCO INVESTCRED UNIBANCO S.A.'],
  ['184', 'BANCO ITAÚ BBA S.A.'], ['479', 'BANCO ITAUBANK S.A.'], ['341', 'BANCO ITAÚ UNIBANCO S.A.'],
  ['488', 'BANCO J. P. MORGAN S.A.'], ['399', 'BANCO KREDILIG S.A.'], ['600', 'BANCO LUSO BRASILEIRO S.A.'],
  ['243', 'BANCO MÁXIMA S.A.'], ['720', 'BANCO MAXINVEST S.A.'], ['389', 'BANCO MERCANTIL DO BRASIL S.A.'],
  ['370', 'BANCO MIZUHO DO BRASIL S.A.'], ['746', 'BANCO MODAL S.A.'], ['066', 'BANCO MORGAN STANLEY S.A.'],
  ['456', 'BANCO MUFG BRASIL S.A.'], ['007', 'BANCO NACIONAL DE DESENVOLVIMENTO ECONÔMICO E SOCIAL'], ['169', 'BANCO OLÉ BONSUCESSO CONSIGNADO S.A.'],
  ['079', 'BANCO ORIGINAL DO AGRONEGÓCIO S.A.'], ['212', 'BANCO ORIGINAL S.A.'], ['712', 'BANCO OURINVEST S.A.'],
  ['623', 'BANCO PAN S.A.'], ['611', 'BANCO PAULISTA S.A.'], ['643', 'BANCO PINE S.A.'],
  ['747', 'BANCO RABOBANK INTERNATIONAL BRASIL S.A.'], ['633', 'BANCO RENDIMENTO S.A.'], ['741', 'BANCO RIBEIRÃO PRETO S.A.'],
  ['120', 'BANCO RODOBENS S.A.'], ['422', 'BANCO SAFRA S.A.'], ['033', 'BANCO SANTANDER (BRASIL) S.A.'],
  ['743', 'BANCO SEMEAR S.A.'], ['366', 'BANCO SOCIÉTÉ GÉNÉRALE BRASIL S.A.'], ['637', 'BANCO SOFISA S.A.'],
  ['464', 'BANCO SUMITOMO MITSUI BRASILEIRO S.A.'], ['082', 'BANCO TOPÁZIO S.A.'], ['634', 'BANCO TRIÂNGULO S.A.'],
  ['655', 'BANCO VOTORANTIM S.A.'], ['610', 'BANCO VR S.A.'], ['119', 'BANCO WESTERN UNION DO BRASIL S.A.'],
  ['124', 'BANCO WOORI BANK DO BRASIL S.A.'], ['348', 'BANCO XP S.A.'], ['104', 'CAIXA ECONÔMICA FEDERAL'],
  ['237', 'BANCO BRADESCO S.A.'], ['260', 'NU PAGAMENTOS S.A.'], ['290', 'PAGSEGURO INTERNET S.A.'],
  ['323', 'MERCADO PAGO'], ['380', 'PICPAY SERVICOS S.A.'], ['070', 'BRB - BANCO DE BRASÍLIA S.A.'],
]

export async function importarFebraban() {
  let inseridos = 0
  for (const [compe, nome] of FEBRABAN) {
    if (!/^\d{3}$/.test(compe)) continue
    const existe = await queryOne('SELECT id FROM banco_001 WHERE compe = $1', [compe])
    if (existe) continue
    await query(
      `INSERT INTO banco_001 (codigo, compe, nome, tipo)
       VALUES (LPAD(nextval('banco_001_codigo_seq')::text, 4, '0'), $1, $2, 'multiplo')`,
      [compe, nome]
    )
    inseridos++
  }
  return { inseridos }
}
