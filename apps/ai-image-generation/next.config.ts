import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@shelby-protocol/ui"],
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.shelbynet.shelby.xyz",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
