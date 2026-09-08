/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// Liga cada tipo de documento (documento_tipo_001) a um prompt editavel de
// prompt_ia_001 (via codigo). O prompt_sistema hardcoded na tabela deixa de
// ser usado quando prompt_ia_id esta preenchido; fica so como fallback.
// Tambem cria o tipo "Documento geral" (usa o mesmo layout/schema da
// Analise de Aderencia).

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumn('documento_tipo_001', {
    // Aponta pro prompt de IA (por codigo, resolvido em runtime). Fica
    // como texto e nao FK pra nao acoplar as tabelas — o codigo e a
    // referencia estavel.
    prompt_ia_codigo: { type: 'varchar(60)' },
  });

  // Liga os tipos existentes aos codigos de prompt que o usuario vai
  // cadastrar em Configuracoes > Prompts de IA.
  pgm.sql(`
    UPDATE documento_tipo_001 SET prompt_ia_codigo = 'documento_analise_aderencia' WHERE codigo = 'analise_aderencia';
    UPDATE documento_tipo_001 SET prompt_ia_codigo = 'documento_ata_treinamento'   WHERE codigo = 'ata_treinamento';
  `);

  // Novo tipo: Documento geral. Reusa o layout 'analise_aderencia'.
  pgm.sql(`
    INSERT INTO documento_tipo_001 (codigo, nome, layout_renderer, prompt_sistema, prompt_ia_codigo)
    VALUES ('documento_geral', 'Documento geral', 'analise_aderencia',
            'Reformule o texto bruto em um documento formal, mantendo tom tecnico e sem inventar informacao.',
            'documento_geral')
    ON CONFLICT (codigo) DO NOTHING;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.sql(`DELETE FROM documento_tipo_001 WHERE codigo = 'documento_geral'`);
  pgm.dropColumn('documento_tipo_001', 'prompt_ia_codigo');
};
