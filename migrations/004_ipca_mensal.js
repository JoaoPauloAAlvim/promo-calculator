exports.up = async function (knex) {
  const exists = await knex.schema.hasTable("ipca_mensal");
  if (!exists) {
    await knex.schema.createTable("ipca_mensal", (t) => {
      t.date("mes").primary();
      t.decimal("indice", 18, 6).notNullable();

      t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
      t.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("ipca_mensal");
};
