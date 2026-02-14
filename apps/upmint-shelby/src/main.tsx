import { Network } from "@aptos-labs/ts-sdk";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { ShelbyClientProvider } from "@shelby-protocol/react";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Buffer } from "buffer";
import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import { App } from "./shelby-app";

declare global {
  interface Window {
    Buffer?: typeof Buffer;
  }
}
window.Buffer = window.Buffer ?? Buffer;

const queryClient = new QueryClient();
const isDev = typeof window !== "undefined" && import.meta.env.DEV;
const origin = typeof window !== "undefined" ? window.location.origin : "";
const shelbyRpcBase = isDev ? `${origin}/shelby-rpc` : undefined;
const aptosFullnode = isDev ? `${origin}/shelby-aptos` : undefined;
const shelbyClient = new ShelbyClient({
  network: Network.SHELBYNET,
  ...(shelbyRpcBase && { rpc: { baseUrl: shelbyRpcBase } }),
  ...(aptosFullnode && { aptos: { fullnode: aptosFullnode } }),
});

ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
  <React.StrictMode>
    <AptosWalletAdapterProvider>
      <QueryClientProvider client={queryClient}>
        <ShelbyClientProvider client={shelbyClient}>
          <App />
        </ShelbyClientProvider>
      </QueryClientProvider>
    </AptosWalletAdapterProvider>
  </React.StrictMode>,
);
