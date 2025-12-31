import knex from "knex";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definida");
}

const useSSL =
  process.env.DB_SSL === "true" || process.env.NODE_ENV === "production";

declare global {
  var __knex: ReturnType<typeof knex> | undefined;
}

export const db =
  global.__knex ??
  knex({
    client: "pg",
    connection: {
      connectionString,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 0,
      max: 3, 
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 30000,
    },
  });

if (process.env.NODE_ENV !== "production") {
  global.__knex = db;
}
