import {
  AccountAddress,
  Aptos,
  AptosConfig,
  Network,
} from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useShelbyClient } from "@shelby-protocol/react";
import {
  createDefaultErasureCodingProvider,
  DEFAULT_CHUNKSET_SIZE_BYTES,
  expectedTotalChunksets,
  generateCommitments,
  ShelbyBlobClient,
} from "@shelby-protocol/sdk/browser";
import type React from "react";
import { useEffect, useId, useState } from "react";

type DigitalAssetItem = {
  token_data_id: string;
  current_token_data?: {
    token_name?: string | null;
    token_uri?: string | null;
    current_collection?: { collection_name?: string | null };
  };
};

const SHELBY_BLOB_API_BASE = "https://api.shelbynet.shelby.xyz/shelby/v1/blobs";
const SHELBY_EXPLORER_BASE = "https://explorer.shelby.xyz/shelbynet/blobs";
const EXPLORER_TXN = (hash: string) =>
  `https://explorer.aptoslabs.com/txn/${hash}?network=shelbynet`;
const EXPLORER_ACCOUNT_NFTS = (addr: string) =>
  `https://explorer.aptoslabs.com/account/${addr}/nfts?network=shelbynet`;
const EXPLORER_OBJECT = (addr: string) =>
  `https://explorer.aptoslabs.com/object/${addr}?network=shelbynet`;

type UploadedItem = {
  id: string;
  name: string;
  blobName: string;
  storageOwner: string;
  previewDataUrl?: string;
  mimeType: string;
  uploadTxHash?: string;
  uploadedAt: string;
};

export const App: React.FC = () => {
  const collectionNameId = useId();
  const [uploads, setUploads] = useState<UploadedItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessTx, setUploadSuccessTx] = useState<string | null>(null);
  const [mintingId, setMintingId] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [lastMintTxHash, setLastMintTxHash] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [collectionCreateTx, setCollectionCreateTx] = useState<string | null>(
    null,
  );
  const [collectionAlreadyExists, setCollectionAlreadyExists] = useState(false);
  const [myNfts, setMyNfts] = useState<
    Array<{
      token_data_id: string;
      token_name?: string | null;
      token_uri?: string | null;
      collection_name?: string | null;
    }>
  >([]);
  const [nftsLoading, setNftsLoading] = useState(false);

  const {
    account,
    connect,
    disconnect,
    connected,
    wallets,
    network,
    signAndSubmitTransaction,
  } = useWallet();
  const shelbyClient = useShelbyClient();
  const walletConnected = connected && account?.address;

  useEffect(() => {
    if (!connected || !network) return;
    const info = network as { name?: string };
    const name = String(info?.name ?? "").toLowerCase();
    if (name === "mainnet" || name === "testnet") {
      alert(`Switch your wallet to ShelbyNet for Shelby.\nCurrent: ${name}`);
    }
  }, [connected, network]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: lastMintTxHash triggers refetch after mint
  useEffect(() => {
    if (!walletConnected || !account?.address) {
      setMyNfts([]);
      return;
    }
    setNftsLoading(true);
    const aptos = new Aptos(new AptosConfig({ network: Network.SHELBYNET }));
    aptos
      .getOwnedDigitalAssets({
        ownerAddress: String(account.address),
        options: { limit: 100 },
      })
      .then((list) => {
        setMyNfts(
          (list as DigitalAssetItem[]).map((o) => ({
            token_data_id: o.token_data_id,
            token_name: o.current_token_data?.token_name,
            token_uri: o.current_token_data?.token_uri,
            collection_name:
              o.current_token_data?.current_collection?.collection_name,
          })),
        );
      })
      .catch(() => setMyNfts([]))
      .finally(() => setNftsLoading(false));
  }, [walletConnected, account?.address, lastMintTxHash]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !walletConnected || !account?.address) return;

    setUploadError(null);
    setUploadSuccessTx(null);
    setIsUploading(true);
    const accountAddress = String(account.address);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop() || "bin";
        const baseName =
          file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_") || "file";
        const blobName = `${baseName}_${Date.now()}_${i}.${ext}`;
        const data = new Uint8Array(await file.arrayBuffer());
        const expirationMicros =
          Date.now() * 1000 + 365 * 24 * 60 * 60 * 1_000_000;
        const blobs = [{ blobName, blobData: data }];

        const provider = await createDefaultErasureCodingProvider();
        const commitments = await Promise.all(
          blobs.map((b) => generateCommitments(provider, b.blobData)),
        );

        const pending = await signAndSubmitTransaction({
          data: ShelbyBlobClient.createBatchRegisterBlobsPayload({
            account: AccountAddress.from(accountAddress),
            expirationMicros,
            blobs: blobs.map((blob, idx) => ({
              blobName: blob.blobName,
              blobSize: blob.blobData.length,
              blobMerkleRoot: commitments[idx].blob_merkle_root,
              numChunksets: expectedTotalChunksets(
                blob.blobData.length,
                DEFAULT_CHUNKSET_SIZE_BYTES,
              ),
            })),
          }),
        });

        try {
          await shelbyClient.coordination.aptos.waitForTransaction({
            transactionHash: pending.hash,
          });
        } catch (waitErr) {
          console.warn("waitForTransaction:", waitErr);
        }

        for (const blob of blobs) {
          await shelbyClient.rpc.putBlob({
            account: accountAddress,
            blobName: blob.blobName,
            blobData: blob.blobData,
          });
        }

        let previewDataUrl: string | undefined;
        if (file.type.startsWith("image/")) {
          previewDataUrl = await new Promise<string>((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.onerror = rej;
            r.readAsDataURL(file);
          });
        }

        const item: UploadedItem = {
          id: `${blobName}-${Date.now()}`,
          name: baseName,
          blobName,
          storageOwner: accountAddress,
          previewDataUrl,
          mimeType: file.type,
          uploadTxHash: pending.hash,
          uploadedAt: new Date().toISOString(),
        };
        setUploads((prev) => [item, ...prev]);
        setUploadSuccessTx(pending.hash);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Upload error";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleCreateCollection = async () => {
    const collName = collectionName.trim();
    if (!collName || !walletConnected || !signAndSubmitTransaction) return;
    setMintError(null);
    setCollectionAlreadyExists(false);
    setCreatingCollection(true);
    try {
      const imageUri = "https://shelby.xyz";
      const createRes = await signAndSubmitTransaction({
        data: {
          function: "0x4::aptos_token::create_collection",
          functionArguments: [
            `${collName} - NFT collection stored on the Shelby network`,
            "999999",
            collName,
            imageUri,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            "0",
            "1",
          ],
        },
      });
      await shelbyClient.coordination.aptos
        .waitForTransaction({ transactionHash: createRes.hash })
        .catch(() => {});
      setMintError(null);
      setCollectionAlreadyExists(false);
      setCollectionCreateTx(createRes.hash);
    } catch (err: unknown) {
      const raw =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message?: string }).message)
            : "";
      const msg = String(raw).toLowerCase();
      const alreadyExists =
        msg.includes("collection_already_exists") ||
        msg.includes("object already exists") ||
        msg.includes("already exists at");
      if (alreadyExists) {
        setMintError(null);
        setCollectionCreateTx(null); // clear stale "Collection created" from previous run
        setCollectionAlreadyExists(true);
      } else {
        setMintError(
          err instanceof Error ? err.message : "Collection creation error",
        );
      }
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleMint = async (item: UploadedItem) => {
    if (!walletConnected || !signAndSubmitTransaction) return;
    if (!item.mimeType.startsWith("image/")) {
      setMintError("Image file required for NFT minting.");
      return;
    }
    const collName = collectionName.trim();
    if (!collName) {
      setMintError("Enter collection name first for NFT minting.");
      return;
    }

    setMintError(null);
    setLastMintTxHash(null);
    setMintingId(item.id);

    try {
      const imageUri = `${SHELBY_BLOB_API_BASE}/${item.storageOwner}/${encodeURIComponent(item.blobName)}`;
      const tokenName = item.blobName.replace(/\.[^/.]+$/, "");

      const mintTxn = await signAndSubmitTransaction({
        data: {
          function: "0x4::aptos_token::mint",
          functionArguments: [
            collName,
            `${collName}: ${item.name}`,
            tokenName,
            imageUri,
            [],
            [],
            [],
          ],
        },
      });

      await shelbyClient.coordination.aptos.waitForTransaction({
        transactionHash: mintTxn.hash,
      });

      setLastMintTxHash(mintTxn.hash);
      setUploads((prev) => prev.filter((u) => u.id !== item.id));
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "";
      const msg = String(errMsg).toLowerCase();
      // Only treat as missing-collection when Aptos reports the collection object is missing
      const noCollection =
        msg.includes("object does not exist") ||
        msg.includes("collection_does_not_exist") ||
        /collection.*(?:does not exist|not found)/.test(msg);
      setMintError(
        noCollection
          ? 'Collection not found. Click "Create Collection" first.'
          : errMsg || "Mint error",
      );
    } finally {
      setMintingId(null);
    }
  };

  const shelbyExplorerUrl = (item: UploadedItem) =>
    `${SHELBY_EXPLORER_BASE}/${item.storageOwner}?blobName=${encodeURIComponent(item.blobName)}`;

  return (
    <div className="page">
      <header className="header">
        <div className="header-top">
          <div>
            <h1>Shelby</h1>
            <p>Upload files to the Shelby network, mint as NFT if you wish.</p>
          </div>
          {walletConnected && (
            <div className="wallet-actions">
              <button
                type="button"
                className="wallet-address-btn"
                onClick={() => disconnect()}
                title="Disconnect"
              >
                {account
                  ? `${String(account.address).slice(0, 6)}...${String(account.address).slice(-4)}`
                  : ""}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="layout">
        {!walletConnected ? (
          <section className="card connect-card">
            <h2>Upload to Shelby</h2>
            <p>To get started, connect to ShelbyNet with your Petra wallet.</p>
            {wallets.some((w) => w.name === "Petra") ? (
              <button
                type="button"
                className="cta-button"
                onClick={() => {
                  const petra = wallets.find((w) => w.name === "Petra");
                  if (petra) connect(petra.name);
                }}
              >
                Connect with Petra
              </button>
            ) : (
              <p className="hint">
                Petra wallet not found. Install the browser extension.
              </p>
            )}
          </section>
        ) : (
          <>
            <section className="card upload-card">
              <h2>Upload to Shelby</h2>
              <p>
                Select files to upload to the Shelby network. They will appear
                in Uploads and you can mint as NFT if you wish.
              </p>
              <label className="upload-zone">
                <input
                  type="file"
                  multiple
                  onChange={handleUpload}
                  disabled={isUploading}
                  className="file-input-hidden"
                />
                <span className="upload-zone-text">
                  {isUploading ? "Uploading..." : "Select or drag files"}
                </span>
              </label>
              {uploadError && <p className="error">{uploadError}</p>}
              {uploadSuccessTx && (
                <p className="success">
                  Upload successful.{" "}
                  <a
                    href={EXPLORER_TXN(uploadSuccessTx)}
                    target="_blank"
                    rel="noreferrer"
                    className="explorer-link"
                  >
                    View on Explorer →
                  </a>
                </p>
              )}
            </section>

            <section className="card gallery-card">
              <h2>Uploads</h2>
              {uploads.length === 0 ? (
                <p className="empty-hint">No uploads yet. Upload from above.</p>
              ) : (
                <>
                  <div className="form-row" style={{ marginBottom: "1rem" }}>
                    <label htmlFor={collectionNameId}>
                      Collection name for NFT minting
                    </label>
                    <input
                      id={collectionNameId}
                      type="text"
                      placeholder="e.g. My Art Collection"
                      value={collectionName}
                      onChange={(e) => setCollectionName(e.target.value)}
                      className="form-row input"
                      style={{
                        padding: "0.6rem 0.8rem",
                        borderRadius: "0.6rem",
                        border: "1px solid rgba(148, 163, 184, 0.3)",
                        background: "rgba(15, 12, 22, 0.6)",
                        color: "#e8e6ed",
                        fontSize: "0.95rem",
                        maxWidth: "320px",
                      }}
                    />
                    <button
                      type="button"
                      className="cta-button"
                      onClick={handleCreateCollection}
                      disabled={creatingCollection || !collectionName.trim()}
                      style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}
                    >
                      {creatingCollection ? "Creating..." : "Create Collection"}
                    </button>
                    <p
                      className="hint"
                      style={{ marginTop: "0.25rem", marginBottom: 0 }}
                    >
                      First click the button above to create the collection,
                      then mint each image. Collection details may appear empty
                      in Petra; you can view your NFTs on{" "}
                      <a
                        href={
                          walletConnected && account
                            ? EXPLORER_ACCOUNT_NFTS(String(account.address))
                            : "#"
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="explorer-link"
                        style={{ display: "inline" }}
                      >
                        Aptos Explorer
                      </a>
                      .
                    </p>
                  </div>
                  <div className="nft-grid">
                    {uploads.map((item) => (
                      <div key={item.id} className="nft-card">
                        <div className="nft-card-image">
                          {item.previewDataUrl ? (
                            <img src={item.previewDataUrl} alt={item.name} />
                          ) : (
                            <div className="nft-card-placeholder">
                              📄 {item.name}
                            </div>
                          )}
                        </div>
                        <div className="nft-card-info">
                          <span className="nft-card-name">{item.name}</span>
                          <a
                            href={shelbyExplorerUrl(item)}
                            target="_blank"
                            rel="noreferrer"
                            className="nft-explorer-link"
                          >
                            Shelby Explorer →
                          </a>
                          {item.uploadTxHash && (
                            <a
                              href={EXPLORER_TXN(item.uploadTxHash)}
                              target="_blank"
                              rel="noreferrer"
                              className="nft-explorer-link"
                            >
                              Upload transaction →
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          className="nft-mint-btn"
                          onClick={() => handleMint(item)}
                          disabled={
                            mintingId !== null ||
                            !item.mimeType.startsWith("image/") ||
                            !collectionName.trim()
                          }
                        >
                          {mintingId === item.id ? "Minting..." : "Mint NFT"}
                        </button>
                        {!item.mimeType.startsWith("image/") && (
                          <span className="mint-hint">
                            Only images can be minted as NFT
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="card gallery-card">
              <h2>My NFTs</h2>
              <p className="hint" style={{ marginBottom: "1rem" }}>
                Your minted NFTs. If they appear empty in Petra, view them here
                or on{" "}
                <a
                  href={
                    walletConnected && account
                      ? EXPLORER_ACCOUNT_NFTS(String(account.address))
                      : "#"
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="explorer-link"
                >
                  Aptos Explorer
                </a>
                .
              </p>
              {nftsLoading ? (
                <p className="empty-hint">Loading...</p>
              ) : myNfts.length === 0 ? (
                <p className="empty-hint">No minted NFTs yet.</p>
              ) : (
                (() => {
                  const byCollection = myNfts.reduce<
                    Record<string, typeof myNfts>
                  >((acc, nft) => {
                    const key =
                      nft.collection_name?.trim() || "(No collection)";
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(nft);
                    return acc;
                  }, {});
                  const sortedCollections = Object.keys(byCollection).sort();
                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.5rem",
                      }}
                    >
                      {sortedCollections.map((collName) => (
                        <div key={collName}>
                          <h3
                            style={{
                              fontSize: "0.95rem",
                              color: "#a78bfa",
                              marginBottom: "0.75rem",
                            }}
                          >
                            {collName} ({byCollection[collName].length})
                          </h3>
                          <div className="nft-grid">
                            {byCollection[collName].map((nft) => (
                              <div key={nft.token_data_id} className="nft-card">
                                <div className="nft-card-image">
                                  {nft.token_uri ? (
                                    <img
                                      src={nft.token_uri}
                                      alt={nft.token_name || "NFT"}
                                      onError={(e) => {
                                        (
                                          e.target as HTMLImageElement
                                        ).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <div className="nft-card-placeholder">
                                      🖼️ {nft.token_name || "NFT"}
                                    </div>
                                  )}
                                </div>
                                <div className="nft-card-info">
                                  <span className="nft-card-name">
                                    {nft.token_name || "NFT"}
                                  </span>
                                  <a
                                    href={EXPLORER_OBJECT(nft.token_data_id)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="nft-explorer-link"
                                  >
                                    View on Explorer →
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </section>

            {(mintError ||
              lastMintTxHash ||
              collectionCreateTx ||
              collectionAlreadyExists) && (
              <section className="card message-card">
                {mintError && <p className="error">{mintError}</p>}
                {collectionAlreadyExists && (
                  <p className="success" style={{ marginBottom: "0.5rem" }}>
                    Collection already exists. You can mint NFTs now.
                  </p>
                )}
                {collectionCreateTx && (
                  <p className="success" style={{ marginBottom: "0.5rem" }}>
                    Collection created.{" "}
                    <a
                      href={EXPLORER_TXN(collectionCreateTx)}
                      target="_blank"
                      rel="noreferrer"
                      className="explorer-link"
                    >
                      View on Explorer →
                    </a>
                  </p>
                )}
                {lastMintTxHash && (
                  <div>
                    <p className="success">NFT minted successfully!</p>
                    <a
                      href={EXPLORER_TXN(lastMintTxHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="explorer-link"
                    >
                      View mint transaction on Explorer →
                    </a>
                    <p
                      className="hint"
                      style={{ marginTop: "0.75rem", marginBottom: 0 }}
                    >
                      Collection content may appear empty when clicked in Petra.
                      View your NFTs on{" "}
                      <a
                        href={
                          walletConnected && account
                            ? EXPLORER_ACCOUNT_NFTS(String(account.address))
                            : "#"
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="explorer-link"
                      >
                        Aptos Explorer →
                      </a>
                    </p>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};
