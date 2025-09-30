import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";

export const SHELBY_API_URL = process.env.NEXT_PUBLIC_SHELBY_API_URL;

export const aptosClient = new Aptos(
  new AptosConfig({
    network: Network.CUSTOM,
    fullnode: process.env.NEXT_PUBLIC_SHELBY_FULLNODE_URL,
    clientConfig: {
      API_KEY: process.env.NEXT_PUBLIC_SHELBY_API_KEY,
    },
  })
);

export const getAptosClient = () => {
  return aptosClient;
};

const shelbyClient = new ShelbyClient({
  aptos: getAptosClient(),
  shelby: { baseUrl: SHELBY_API_URL },
});

export const getShelbyClient = () => {
  return shelbyClient;
};
