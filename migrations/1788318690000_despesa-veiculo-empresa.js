/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Quando o meio de transporte da despesa e "Carro da empresa", o consultor
// informa qual carro (numero de frota) e a placa. Sai na planilha exportada.

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumns('despesa_001', {
    veiculo_numero: { type: 'varchar(20)' },
    veiculo_placa: { type: 'varchar(10)' },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropColumns('despesa_001', ['veiculo_numero', 'veiculo_placa']);
};
