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
  async rewrites() {
    return [
      {
        source: "/api/shelby/:path*",
        destination: "https://api.shelbynet.shelby.xyz/shelby/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
