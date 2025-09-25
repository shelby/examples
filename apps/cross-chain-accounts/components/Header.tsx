import { XChainWalletSelector } from "@shelby-protocol/ui/components/x-chain-wallet-selector";

export const Header = () => {
  return (
    <header className="flex justify-between items-center py-5 border-b border-gray-200 dark:border-gray-700 mb-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Shelby Examples
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <XChainWalletSelector
          size="sm"
          className="bg-pink-600 hover:bg-pink-700 text-white border-pink-500 hover:border-pink-400"
        />
      </div>
    </header>
  );
};
