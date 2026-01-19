const crypto = require("node:crypto");

function hashPassword(password, saltBuf) {
  const hash = crypto.scryptSync(password, saltBuf, 64);
  return hash.toString("base64");
}

exports.up = async function (knex) {
  const exists = await knex.schema.hasTable("users");
  if (!exists) {
    await knex.schema.createTable("users", (t) => {
      t.bigIncrements("id").primary();
      t.text("email").notNullable().unique();
      t.text("nome").notNullable().defaultTo("");
      t.text("role").notNullable().defaultTo("USER");
      t.text("password_salt").notNullable();
      t.text("password_hash").notNullable();
      t.boolean("is_active").notNullable().defaultTo(true);
      t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
      t.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });

    await knex.schema.raw(`CREATE INDEX IF NOT EXISTS users_role_idx ON users (role)`);
    await knex.schema.raw(`CREATE INDEX IF NOT EXISTS users_active_idx ON users (is_active)`);
  }

  const authEmail = (process.env.AUTH_EMAIL || "").trim().toLowerCase();
  const authPassword = (process.env.AUTH_PASSWORD || "").trim();

  if (authEmail && authPassword) {
    const owner = await knex("users").where({ email: authEmail, role: "OWNER" }).first();
    if (!owner) {
      const salt = crypto.randomBytes(16);
      const hash = hashPassword(authPassword, salt);

      await knex("users").insert({
        email: authEmail,
        nome: "OWNER",
        role: "OWNER",
        password_salt: salt.toString("base64"),
        password_hash: hash,
        is_active: true,
      });
    }
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("users");
};
