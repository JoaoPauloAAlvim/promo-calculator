require("dotenv/config");

const DEV_URL = (process.env.DATABASE_URL_TEST || process.env.DATABASE_URL || "").trim();
const PROD_URL = (process.env.DATABASE_URL || "").trim();

function sslFor(url) {
  if (!url) return false;

  const isNeon = url.includes(".neon.tech");

  const hasSslModeRequire = /sslmode=require/i.test(url);

  return (isNeon || hasSslModeRequire) ? { rejectUnauthorized: false } : false;
}

module.exports = {
  development: {
    client: "pg",
    connection: {
      connectionString: DEV_URL,
      ssl: sslFor(DEV_URL),
    },
    migrations: { directory: "./migrations" },
  },

  production: {
    client: "pg",
    connection: {
      connectionString: PROD_URL,
      ssl: sslFor(PROD_URL),
    },
    migrations: { directory: "./migrations" },
  },
};
