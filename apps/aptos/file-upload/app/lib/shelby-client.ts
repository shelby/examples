"use client";

import { Network } from "@aptos-labs/ts-sdk";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";

/**
 * Shared Shelby client for all storage interactions.
 */
export const shelbyClient = new ShelbyClient({
  network: Network.TESTNET,
  apiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY || "",
});
