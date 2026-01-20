const crypto = require("node:crypto");
const knexLib = require("knex");

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("base64");
}

async function main() {
  const DATABASE_URL = (process.env.DATABASE_URL || "").trim();
  const NEW_EMAIL = (process.env.NEW_OWNER_EMAIL || "").trim().toLowerCase();
  const NEW_PASS = (process.env.NEW_OWNER_PASSWORD || "").trim();

  if (!DATABASE_URL) throw new Error("DATABASE_URL não definido.");
  if (!NEW_EMAIL || !NEW_EMAIL.includes("@")) throw new Error("NEW_OWNER_EMAIL inválido.");
  if (!NEW_PASS || NEW_PASS.length < 6) throw new Error("NEW_OWNER_PASSWORD inválido (mín. 6).");

  const db = knexLib({
    client: "pg",
    connection: DATABASE_URL,
    ssl: DATABASE_URL.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const owner = await db("users").where({ role: "OWNER" }).first();
    if (!owner) throw new Error("Nenhum OWNER encontrado na tabela users.");

    const salt = crypto.randomBytes(16);
    const hash = hashPassword(NEW_PASS, salt);

    await db("users").where({ id: owner.id }).update({
      email: NEW_EMAIL,
      password_salt: salt.toString("base64"),
      password_hash: hash,
      is_active: true,
      updated_at: db.fn.now(),
    });

    console.log("OWNER resetado com sucesso:", { id: owner.id, email: NEW_EMAIL });
  } finally {
    await db.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
