/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // no client, não precisamos de fs
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
      };
    }

    // ignorar drivers/dialetos opcionais do knex
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      oracledb: false,
      "pg-native": false,
      mysql2: false,
      mysql: false,
      "better-sqlite3": false,
      sqlite3: false,
      tedious: false,
      "pg-query-stream": false, // <– adiciona este
    };

    // ignorar warning chato de migrations/import-file
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
