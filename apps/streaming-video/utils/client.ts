import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";

let aptosClient: Aptos | undefined;
let shelbyClient: ShelbyClient | undefined;

export const getAptosClient = () => {
  if (!aptosClient) {
    aptosClient = new Aptos(
      new AptosConfig({
        network: Network.CUSTOM,
        fullnode: typeof window !== "undefined" ? "/api/shelby" : "https://api.shelbynet.shelby.xyz/v1",
        clientConfig: {
          API_KEY: process.env.NEXT_PUBLIC_APTOS_API_KEY,
        },
      }),
    );
  }
  return aptosClient;
};

export const getShelbyClient = () => {
  if (!shelbyClient) {
    shelbyClient = new ShelbyClient({
      network: Network.SHELBYNET,
      // Only use API key if it exists, otherwise rely on public access for reads
      apiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY || "",
    });
  }
  return shelbyClient;
};
