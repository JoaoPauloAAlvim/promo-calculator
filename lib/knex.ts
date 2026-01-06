import knex from "knex";

const isProd = process.env.NODE_ENV === "production";

const DATABASE_URL_EFFECTIVE = isProd
  ? process.env.DATABASE_URL
  : (process.env.DATABASE_URL_TEST || process.env.DATABASE_URL);

if (!DATABASE_URL_EFFECTIVE) {
  throw new Error(
    isProd
      ? "DATABASE_URL não configurada em produção."
      : "Configure DATABASE_URL_TEST (ou DATABASE_URL) para usar o banco de teste no dev."
  );
}

const useSSL = true;

declare global {
  var __knex: ReturnType<typeof knex> | undefined;
}

export const db =
  global.__knex ??
  knex({
    client: "pg",
    connection: {
      connectionString: DATABASE_URL_EFFECTIVE,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 0,
      max: 3,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 30000,
    },
  });

if (!isProd) global.__knex = db;
