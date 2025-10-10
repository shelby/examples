import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@shelby-protocol/ui/components/button";
import { XChainWalletSelector } from "@shelby-protocol/ui/components/x-chain-wallet-selector";

export const Header = () => {
  const { connected, account } = useWallet();

  const onMintShelbyUsd = () => {
    if (!account) {
      return;
    }
    window.open(
      `https://docs.shelby.xyz/apis/faucet/shelbyusd?address=${account.address}`,
      "_blank",
    );
  };

  return (
    <header className="flex justify-between items-center py-5 border-b border-gray-200 dark:border-gray-700 mb-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Shelby Examples
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <Button disabled={!connected} onClick={() => onMintShelbyUsd()}>
          Mint shelbyUSD
        </Button>
        <XChainWalletSelector
          size="sm"
          className="bg-pink-600 hover:bg-pink-700 text-white border-pink-500 hover:border-pink-400"
        />
      </div>
    </header>
  );
};
