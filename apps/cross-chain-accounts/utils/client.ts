import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";

export const aptosClient = new Aptos(
  new AptosConfig({
    network: Network.DEVNET,
    clientConfig: {
      API_KEY: process.env.NEXT_PUBLIC_APTOS_API_KEY,
    },
  }),
);

export const getAptosClient = () => {
  return aptosClient;
};

const shelbyClient = new ShelbyClient({
  aptos: getAptosClient(),
  shelby: { baseUrl: "https://api.devnet.shelby.xyz/shelby" },
});

export const getShelbyClient = () => {
  return shelbyClient;
};
