"use client";

import {
  AboutAptosConnect,
  type AboutAptosConnectEducationScreen,
  type AdapterNotDetectedWallet,
  type AdapterWallet,
  APTOS_CONNECT_ACCOUNT_URL,
  AptosPrivacyPolicy,
  groupAndSortWallets,
  isAptosConnectWallet,
  isInstallRequired,
  truncateAddress,
  useWallet,
  WalletItem,
  type WalletSortingOptions,
} from "@aptos-labs/wallet-adapter-react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconClipboard,
  IconLogout,
  IconPerson,
} from "@intentui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { cn } from "@shelby-protocol/ui/lib/utils";
import { ChevronDown } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "./button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { ExpandingContainer } from "./expanding-container";

export interface XChainWalletSelectorProps {
  walletSortingOptions?: WalletSortingOptions;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function XChainWalletSelector({
  walletSortingOptions = {},
  className,
  size = "default",
}: XChainWalletSelectorProps) {
  const { account, connected, disconnect, wallet } = useWallet();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const closeDialog = useCallback(() => setIsDialogOpen(false), []);

  const copyAddress = useCallback(async () => {
    if (!account?.address) return;
    try {
      await navigator.clipboard.writeText(account.address.toString());
      toast.success("Copied wallet address to clipboard.");
    } catch {
      toast.error("Failed to copy wallet address.");
    }
  }, [account?.address]);

  return connected && account ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className={cn("text-center uppercase font-repro-mono", className)}
        >
          {account?.ansName ||
            truncateAddress(account?.address?.toString()) ||
            "Unknown"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={copyAddress} className="gap-2">
          <IconClipboard className="h-4 w-4" /> Copy address
        </DropdownMenuItem>
        {wallet && isAptosConnectWallet(wallet) && (
          <DropdownMenuItem asChild>
            <a
              href={APTOS_CONNECT_ACCOUNT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-2"
            >
              <IconPerson className="h-4 w-4" /> Account
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={disconnect} className="gap-2">
          <IconLogout className="h-4 w-4" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size={size}
          className={cn("text-center uppercase font-repro-mono", className)}
        >
          Connect Wallet
        </Button>
      </DialogTrigger>
      <ConnectWalletDialog
        close={closeDialog}
        {...(walletSortingOptions ?? {})}
      />
    </Dialog>
  );
}

interface ConnectWalletDialogProps extends WalletSortingOptions {
  close: () => void;
}

function ConnectWalletDialog({
  close,
  ...walletSortingOptions
}: ConnectWalletDialogProps) {
  const { wallets = [], notDetectedWallets = [] } = useWallet();

  const { aptosConnectWallets, availableWallets, installableWallets } =
    groupAndSortWallets(
      [...wallets, ...notDetectedWallets],
      walletSortingOptions,
    );

  const hasAptosConnectWallets = !!aptosConnectWallets.length;

  const { evmWallets, solanaWallets, aptosWallets } = availableWallets.reduce<{
    evmWallets: AdapterWallet[];
    solanaWallets: AdapterWallet[];
    aptosWallets: AdapterWallet[];
  }>(
    (acc, wallet) => {
      if (wallet.name.includes("Ethereum")) {
        acc.evmWallets.push(wallet);
      } else if (wallet.name.includes("Solana")) {
        acc.solanaWallets.push(wallet);
      } else {
        acc.aptosWallets.push(wallet);
      }
      return acc;
    },
    { evmWallets: [], solanaWallets: [], aptosWallets: [] },
  );

  const {
    evmInstallableWallets,
    solanaInstallableWallets,
    aptosInstallableWallets,
  } = installableWallets.reduce<{
    evmInstallableWallets: AdapterNotDetectedWallet[];
    solanaInstallableWallets: AdapterNotDetectedWallet[];
    aptosInstallableWallets: AdapterNotDetectedWallet[];
  }>(
    (acc, wallet) => {
      if (wallet.name.includes("Ethereum")) {
        acc.evmInstallableWallets.push(wallet);
      } else if (wallet.name.includes("Solana")) {
        acc.solanaInstallableWallets.push(wallet);
      } else {
        acc.aptosInstallableWallets.push(wallet);
      }
      return acc;
    },
    {
      evmInstallableWallets: [],
      solanaInstallableWallets: [],
      aptosInstallableWallets: [],
    },
  );

  return (
    <DialogContent className="max-h-screen overflow-auto !max-w-sm">
      <AboutAptosConnect renderEducationScreen={renderEducationScreen}>
        <DialogHeader>
          <DialogTitle className="flex flex-col text-center leading-snug">
            {hasAptosConnectWallets ? (
              <>
                <span>Log in or sign up</span>
                <span>with Social + Aptos Connect</span>
              </>
            ) : (
              "Connect Wallet"
            )}
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>

        {hasAptosConnectWallets && (
          <div className="flex flex-col gap-2 pt-3">
            {aptosConnectWallets.map((wallet) => (
              <AptosConnectWalletRow
                key={wallet.name}
                wallet={wallet}
                onConnect={close}
              />
            ))}
            <p className="flex gap-1 justify-center items-center text-muted-foreground text-sm">
              Learn more about{" "}
              <AboutAptosConnect.Trigger className="flex gap-1 py-3 items-center text-foreground">
                Aptos Connect <IconArrowRight className="size-4" />
              </AboutAptosConnect.Trigger>
            </p>
            <AptosPrivacyPolicy className="flex flex-col items-center py-1">
              <p className="text-xs leading-5">
                <AptosPrivacyPolicy.Disclaimer />{" "}
                <AptosPrivacyPolicy.Link className="text-muted-foreground underline underline-offset-4" />
                <span className="text-muted-foreground">.</span>
              </p>
              <AptosPrivacyPolicy.PoweredBy className="flex gap-1.5 items-center text-xs leading-5 text-muted-foreground" />
            </AptosPrivacyPolicy>
            <div className="flex items-center gap-3 pt-4 text-muted-foreground">
              <div className="h-px w-full bg-secondary" />
              Or
              <div className="h-px w-full bg-secondary" />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-3">
          {/* Handle Aptos wallets */}
          <ExpandingContainer>
            <Tabs defaultValue="aptos">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="aptos">Aptos</TabsTrigger>
                <TabsTrigger value="solana">Solana</TabsTrigger>
                <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
              </TabsList>
              <TabsContent value="aptos">
                {aptosWallets.map((wallet) => (
                  <WalletRow
                    key={wallet.name}
                    wallet={wallet}
                    onConnect={close}
                  />
                ))}
                {!!aptosInstallableWallets.length && (
                  <Collapsible className="flex flex-col gap-3 pt-3">
                    <CollapsibleTrigger asChild>
                      <Button size="sm" variant="ghost" className="gap-2">
                        More wallets <ChevronDown />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex flex-col gap-3">
                      {aptosInstallableWallets.map((wallet) => (
                        <WalletRow
                          key={wallet.name}
                          wallet={wallet}
                          onConnect={close}
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </TabsContent>
              {/* Handle Solana wallets */}
              <TabsContent value="solana">
                {solanaWallets.map((wallet) => (
                  <WalletRow
                    key={wallet.name}
                    wallet={wallet}
                    onConnect={close}
                  />
                ))}
                {!!solanaInstallableWallets.length && (
                  <Collapsible className="flex flex-col gap-3 pt-3">
                    <CollapsibleTrigger asChild>
                      <Button size="sm" variant="ghost" className="gap-2">
                        More wallets <ChevronDown />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex flex-col gap-3">
                      {solanaInstallableWallets.map((wallet) => (
                        <WalletRow
                          key={wallet.name}
                          wallet={wallet}
                          onConnect={close}
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </TabsContent>
              {/* Handle Ethereum wallets */}
              <TabsContent value="ethereum">
                {evmWallets.map((wallet) => (
                  <WalletRow
                    key={wallet.name}
                    wallet={wallet}
                    onConnect={close}
                  />
                ))}
                {!!evmInstallableWallets.length && (
                  <Collapsible className="flex flex-col gap-3 pt-3">
                    <CollapsibleTrigger asChild>
                      <Button size="sm" variant="ghost" className="gap-2">
                        More wallets <ChevronDown />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex flex-col gap-3">
                      {evmInstallableWallets.map((wallet) => (
                        <WalletRow
                          key={wallet.name}
                          wallet={wallet}
                          onConnect={close}
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </TabsContent>
            </Tabs>
          </ExpandingContainer>
        </div>
      </AboutAptosConnect>
    </DialogContent>
  );
}

interface WalletRowProps {
  wallet: AdapterWallet | AdapterNotDetectedWallet;
  onConnect?: () => void;
}

function WalletRow({ wallet, onConnect }: WalletRowProps) {
  return (
    <WalletItem
      wallet={wallet}
      onConnect={onConnect}
      className="flex items-center justify-between px-4 py-3 gap-4 border rounded-sm"
    >
      <div className="flex items-center gap-4">
        <WalletItem.Icon className="h-6 w-6" />
        <WalletItem.Name className="text-base font-normal" />
      </div>
      {isInstallRequired(wallet) ? (
        <Button size="sm" variant="ghost" asChild>
          <WalletItem.InstallLink />
        </Button>
      ) : (
        <WalletItem.ConnectButton asChild>
          <Button size="sm" variant="secondary">
            Connect
          </Button>
        </WalletItem.ConnectButton>
      )}
    </WalletItem>
  );
}

function AptosConnectWalletRow({ wallet, onConnect }: WalletRowProps) {
  return (
    <WalletItem wallet={wallet} onConnect={onConnect}>
      <WalletItem.ConnectButton asChild>
        <Button size="lg" variant="secondary" className="w-full gap-4">
          <WalletItem.Icon className="h-5 w-5" />
          <WalletItem.Name className="text-base font-normal" />
        </Button>
      </WalletItem.ConnectButton>
    </WalletItem>
  );
}

function renderEducationScreen(screen: AboutAptosConnectEducationScreen) {
  return (
    <>
      <DialogHeader className="grid grid-cols-[1fr_4fr_1fr] items-center space-y-0">
        <Button variant="ghost" size="icon" onClick={screen.cancel}>
          <IconArrowLeft />
        </Button>
        <DialogTitle className="leading-snug text-base text-center">
          About Aptos Connect
        </DialogTitle>
      </DialogHeader>

      <div className="flex h-[162px] pb-3 items-end justify-center">
        <screen.Graphic />
      </div>
      <div className="flex flex-col gap-2 text-center pb-4">
        <screen.Title className="text-xl" />
        <screen.Description className="text-sm text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a]:text-foreground" />
      </div>

      <div className="grid grid-cols-3 items-center">
        <Button
          size="sm"
          variant="ghost"
          onClick={screen.back}
          className="justify-self-start"
        >
          Back
        </Button>
        <div className="flex items-center gap-2 place-self-center">
          {screen.screenIndicators.map((ScreenIndicator, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: ignore
            <ScreenIndicator key={i} className="py-4">
              <div className="h-0.5 w-6 transition-colors bg-muted [[data-active]>&]:bg-foreground" />
            </ScreenIndicator>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={screen.next}
          className="gap-2 justify-self-end"
        >
          {screen.screenIndex === screen.totalScreens - 1 ? "Finish" : "Next"}
          <IconArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
