import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable WebAssembly support for Shelby SDK
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;
