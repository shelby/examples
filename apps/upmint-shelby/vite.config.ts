import { defineConfig } from "vite";

// Proxy Shelby indexer/RPC requests via Vite dev server to bypass
// browser CORS. The browser talks to localhost:5173, Vite forwards to Shelby.

export default defineConfig({
  server: {
    proxy: {
      "/shelby-indexer": {
        target:
          "https://api.shelbynet.aptoslabs.com/nocode/v1/public/cmforrguw0042s601fn71f9l2/v1/graphql",
        changeOrigin: true,
        secure: true,
        rewrite: () => "",
      },
      "/shelby-rpc": {
        target: "https://api.shelbynet.shelby.xyz",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/shelby-rpc/, "/shelby"),
      },
      "/shelby-aptos": {
        target: "https://api.shelbynet.shelby.xyz",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/shelby-aptos/, "/v1"),
      },
    },
  },
});
