import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@shelby-protocol/ui"],
  typedRoutes: true,
  images: {
    remotePatterns: [new URL("https://api.devnet.shelby.xyz/shelby/**")],
  },
};

export default nextConfig;
