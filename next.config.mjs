/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Evita tentar resolver 'fs' no client (libs de backend como knex)
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
      };
    }

    // Ignora especificamente o warning do util/import-file das migrações do knex
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
