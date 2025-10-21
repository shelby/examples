import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";

export const aptosClient = new Aptos(
  new AptosConfig({
    network: Network.SHELBYNET,
    clientConfig: {
      API_KEY: process.env.NEXT_PUBLIC_APTOS_API_KEY,
    },
  }),
);

export const getAptosClient = () => {
  return aptosClient;
};

const shelbyClient = new ShelbyClient({
  network: Network.SHELBYNET,
  apiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY,
});

export const getShelbyClient = () => {
  return shelbyClient;
};
