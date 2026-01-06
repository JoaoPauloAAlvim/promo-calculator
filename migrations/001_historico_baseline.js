exports.up = async function (knex) {
  await knex.schema.createTable("historico", (t) => {
    t.bigIncrements("id").primary();
    t.timestamp("dataHora", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.jsonb("resultado").notNullable();

    t.text("produto_nome_txt");
    t.text("marca_txt");
    t.text("categoria_txt");
    t.text("comprador_txt");
    t.date("data_inicio_promocao");
    t.date("data_fim_promocao");
    t.text("situacao_analise");
  });

  await knex.schema.raw(`CREATE INDEX IF NOT EXISTS historico_datahora_idx ON historico ("dataHora")`);
  await knex.schema.raw(`CREATE INDEX IF NOT EXISTS historico_marca_idx ON historico (marca_txt)`);
  await knex.schema.raw(`CREATE INDEX IF NOT EXISTS historico_categoria_idx ON historico (categoria_txt)`);
  await knex.schema.raw(`CREATE INDEX IF NOT EXISTS historico_comprador_idx ON historico (comprador_txt)`);
  await knex.schema.raw(`CREATE INDEX IF NOT EXISTS historico_situacao_idx ON historico (situacao_analise)`);
  await knex.schema.raw(`CREATE INDEX IF NOT EXISTS historico_periodo_idx ON historico (data_inicio_promocao, data_fim_promocao)`);

  await knex.schema.raw(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
  await knex.schema.raw(
    `CREATE INDEX IF NOT EXISTS historico_produto_trgm_idx ON historico USING gin (produto_nome_txt gin_trgm_ops)`
  );
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("historico");
};
