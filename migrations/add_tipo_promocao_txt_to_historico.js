exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn("historico", "tipo_promocao_txt");

  if (!hasColumn) {
    await knex.schema.alterTable("historico", (t) => {
      t.text("tipo_promocao_txt");
    });
  }

  await knex.schema.raw(`
    create index if not exists historico_tipo_promocao_txt_idx
    on historico (tipo_promocao_txt);
  `);
};

exports.down = async function (knex) {
  await knex.schema.raw(`drop index if exists historico_tipo_promocao_txt_idx`);
  
  const hasColumn = await knex.schema.hasColumn("historico", "tipo_promocao_txt");
  if (hasColumn) {
    await knex.schema.alterTable("historico", (t) => {
      t.dropColumn("tipo_promocao_txt");
    });
  }
};