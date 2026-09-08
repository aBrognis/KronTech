/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

// entidade_001.papeis vinha de duas eras:
//  - FormBuilder antigo: letras coladas em MAIUSCULA (C, F, P, T -> "CFP")
//  - tela ERP nova: palavras minusculas separadas por virgula ("cliente,fornecedor")
// E o norm() do service fazia toUpperCase() + duplicava ("CFP,CLIENTE,CLIENTE").
// Resultado: ao reabrir a entidade, nenhum papel aparecia marcado (o front
// compara com 'cliente' minusculo).
//
// Esta migration normaliza TODOS os registros para o formato novo:
//   1. quebra a string em tokens por virgula
//   2. token que ja e palavra conhecida -> minusculo
//   3. token de letras coladas (CFP) -> expande cada letra pelo mapa
//   4. deduplica, junta com virgula
// O toUpperCase() de papeis foi removido do service na mesma versao.

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  // funcao SQL temporaria: normaliza um valor de papeis
  pgm.sql(`
    CREATE OR REPLACE FUNCTION _norm_papeis(bruto text) RETURNS text AS $$
    DECLARE
      tok       text;
      letra     text;
      resultado text[] := ARRAY[]::text[];
      p         text;
    BEGIN
      IF bruto IS NULL OR btrim(bruto) = '' THEN RETURN ''; END IF;
      FOREACH tok IN ARRAY string_to_array(bruto, ',') LOOP
        tok := btrim(tok);
        CONTINUE WHEN tok = '';
        IF lower(tok) IN ('cliente','fornecedor','transportadora','funcionario','representante') THEN
          resultado := resultado || lower(tok);
        ELSIF tok ~ '^[A-Za-z]{1,6}$' AND tok = upper(tok) THEN
          FOREACH letra IN ARRAY regexp_split_to_array(tok, '') LOOP
            p := CASE letra
                   WHEN 'C' THEN 'cliente'
                   WHEN 'F' THEN 'fornecedor'
                   WHEN 'T' THEN 'transportadora'
                   WHEN 'P' THEN 'representante'
                   WHEN 'R' THEN 'representante'
                   ELSE NULL
                 END;
            IF p IS NOT NULL THEN resultado := resultado || p; END IF;
          END LOOP;
        END IF;
      END LOOP;
      -- dedup preservando ordem
      SELECT string_agg(x, ',') INTO tok
        FROM (SELECT DISTINCT x, min(ord) AS o
                FROM unnest(resultado) WITH ORDINALITY AS t(x, ord)
               GROUP BY x ORDER BY o) s;
      RETURN COALESCE(tok, '');
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    UPDATE entidade_001
       SET papeis = _norm_papeis(papeis)
     WHERE papeis IS NOT NULL AND papeis <> ''
       AND papeis IS DISTINCT FROM _norm_papeis(papeis);
  `);

  pgm.sql(`DROP FUNCTION _norm_papeis(text);`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = () => {
  // sem reversao — o formato antigo era ambiguo e ja estava corrompido
};
