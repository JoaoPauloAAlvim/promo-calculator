/** @type {import('next').NextConfig} */
/** @type {import('next').NextConfig} */
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // evita tentar resolver 'fs' no client, já ajuda com libs de backend
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
      };
    }

    // ignora especificamente o warning do knex/migrations/import-file
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /knex[\\/]lib[\\/]migrations[\\/]util[\\/]import-file/,
      },
    ];

    return config;
  },
  
  webpack: (config, { isServer, webpack }) => {
    // 1) Ignorar drivers opcionais do Knex que você não usa
    const ignoreModules = [
      "oracledb",
      "pg-query-stream",
      "sqlite3",
      "mysql",
      "mysql2",
      "better-sqlite3",
      "tedious",
      "ioredis",
    ];

    if (isServer) {
      config.externals.push(...ignoreModules);
    }

    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
    };

    ignoreModules.forEach((mod) => {
      config.resolve.fallback[mod] = false;
    });

    // 2) Ignorar módulo de migrações do Knex (remove o "Critical dependency")
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /knex[\/\\]lib[\/\\]migrations/,
      })
    );

    return config;
  },
};

export default nextConfig;
