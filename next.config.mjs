/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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
