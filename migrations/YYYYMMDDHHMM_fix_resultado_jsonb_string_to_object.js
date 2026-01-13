exports.up = async function (knex) {
  await knex.raw(`
    UPDATE historico
    SET resultado = (resultado #>> '{}')::jsonb
    WHERE jsonb_typeof(resultado) = 'string';
  `);
};

exports.down = async function (knex) {
};
