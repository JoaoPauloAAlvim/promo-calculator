require("dotenv/config");

const DEV_URL = (process.env.DATABASE_URL  || process.env.DATABASE_URL_TEST || "").trim();
const PROD_URL = (process.env.DATABASE_URL || "").trim();

module.exports = {
  development: {
    client: "pg",
    connection: {
      connectionString: DEV_URL,
      ssl: { rejectUnauthorized: false },
    },
    migrations: { directory: "./migrations" },
  },

  production: {
    client: "pg",
    connection: {
      connectionString: PROD_URL,
      ssl: { rejectUnauthorized: false },
    },
    migrations: { directory: "./migrations" },
  },
};
