import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Fix para @react-pdf/renderer en webpack
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
        encoding: false,
      };
    }
    return config;
  },
  // Config vacío para Turbopack - permite usar configuración por defecto
  // y silencia el warning de webpack config sin turbopack config
  turbopack: {},
};

export default nextConfig;
