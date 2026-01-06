require("dotenv").config({ path: ".env.local" });

const isProd = process.env.NODE_ENV === "production";

const connectionString =
  isProd
    ? process.env.DATABASE_URL
    : (process.env.DATABASE_URL_TEST || process.env.DATABASE_URL);

if (!connectionString) {
  throw new Error(
    isProd
      ? "DATABASE_URL não configurada."
      : "DATABASE_URL_TEST (ou DATABASE_URL) não configurada para dev/test."
  );
}

module.exports = {
  client: "pg",
  connection: {
    connectionString,
    ssl: { rejectUnauthorized: false },
  },
  migrations: { directory: "./migrations" },
};
