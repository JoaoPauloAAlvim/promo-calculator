/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // no client, não precisamos de fs (usado por libs de backend)
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
      };
    }

    // dizer ao webpack para NÃO tentar resolver drivers opcionais do knex
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      oracledb: false,
      "pg-native": false,
      mysql2: false,
      mysql: false,
      "better-sqlite3": false,
      sqlite3: false,
      tedious: false,
    };

    // ignorar o warning de migrations/import-file do knex
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /knex[\\/]lib[\\/]migrations[\\/]util[\\/]import-file/,
      },
    ];

    return config;
  },
};

export default nextConfig;
