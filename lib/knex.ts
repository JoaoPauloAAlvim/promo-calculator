import knex from "knex";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

const useSSL =
  process.env.DB_SSL === "true" || process.env.NODE_ENV === "production";

declare global {
  var __knex: ReturnType<typeof knex> | undefined;
}

const connection = hasDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL!,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    };

export const db =
  global.__knex ??
  knex({
    client: "pg",
    connection,
    pool: {
      min: 0,
      max: 3,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 30000,
    },
  });

if (process.env.NODE_ENV !== "production") global.__knex = db;
