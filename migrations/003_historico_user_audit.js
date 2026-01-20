exports.up = async function (knex) {
  const hasCreatedBy = await knex.schema.hasColumn("historico", "created_by");
  const hasUpdatedBy = await knex.schema.hasColumn("historico", "updated_by");

  if (!hasCreatedBy || !hasUpdatedBy) {
    await knex.schema.alterTable("historico", (t) => {
      if (!hasCreatedBy) t.bigInteger("created_by");
      if (!hasUpdatedBy) t.bigInteger("updated_by");
    });
  }

  await knex.schema.raw(`CREATE INDEX IF NOT EXISTS historico_created_by_idx ON historico (created_by)`);
  await knex.schema.raw(`CREATE INDEX IF NOT EXISTS historico_updated_by_idx ON historico (updated_by)`);

  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'historico_created_by_fk'
      ) THEN
        ALTER TABLE historico
        ADD CONSTRAINT historico_created_by_fk
        FOREIGN KEY (created_by) REFERENCES users(id);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'historico_updated_by_fk'
      ) THEN
        ALTER TABLE historico
        ADD CONSTRAINT historico_updated_by_fk
        FOREIGN KEY (updated_by) REFERENCES users(id);
      END IF;
    END $$;
  `);
};

exports.down = async function (knex) {
  await knex.schema.raw(`DROP INDEX IF EXISTS historico_created_by_idx`);
  await knex.schema.raw(`DROP INDEX IF EXISTS historico_updated_by_idx`);

  await knex.schema.raw(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'historico_created_by_fk') THEN
        ALTER TABLE historico DROP CONSTRAINT historico_created_by_fk;
      END IF;
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'historico_updated_by_fk') THEN
        ALTER TABLE historico DROP CONSTRAINT historico_updated_by_fk;
      END IF;
    END $$;
  `);

  const hasCreatedBy = await knex.schema.hasColumn("historico", "created_by");
  const hasUpdatedBy = await knex.schema.hasColumn("historico", "updated_by");

  if (hasCreatedBy || hasUpdatedBy) {
    await knex.schema.alterTable("historico", (t) => {
      if (hasCreatedBy) t.dropColumn("created_by");
      if (hasUpdatedBy) t.dropColumn("updated_by");
    });
  }
};
