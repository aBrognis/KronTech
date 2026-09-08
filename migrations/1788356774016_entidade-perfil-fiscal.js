/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Perfil fiscal do destinatario na entidade_001 — usado na emissao de NF-e
// (indIEDest, indFinal) e na amarracao de entrada de notas. Ja pensado para a
// Reforma Tributaria (o par natureza_operacao + entidade decide a tributacao).

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumns('entidade_001', {
    // indFinal da NF-e: 0 = normal (revenda/industrializacao), 1 = consumidor final
    consumidor_final: { type: 'varchar(10)', default: 'ambos' }, // sim | nao | ambos
    // indIEDest da NF-e: 1 = contribuinte ICMS, 2 = isento inscrito, 9 = nao contribuinte
    indicador_ie: { type: 'varchar(20)', default: 'nao_contribuinte' }, // contribuinte | isento | nao_contribuinte
    // finalidade padrao da mercadoria quando esta entidade e o DESTINO (entrada de notas)
    finalidade_padrao: { type: 'varchar(20)' }, // revenda | industrializacao | uso_consumo | ativo_imobilizado
    // regime do destinatario (util p/ CBS/IBS credito na transicao) — espelha o regime_tributario
    // quando conhecido; mantido separado p/ nao conflitar com o cadastro geral
    suframa: { type: 'varchar(12)' }, // inscricao SUFRAMA (ZFM / ALC)
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropColumns('entidade_001', ['consumidor_final', 'indicador_ie', 'finalidade_padrao', 'suframa']);
};
