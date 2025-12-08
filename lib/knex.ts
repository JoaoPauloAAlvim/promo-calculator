import knex from "knex";

const connection =
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.DB_SSL === "true" || process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
      };

export const db = knex({
  client: "pg",
  connection,
  pool: { min: 1, max: 10 },
});
