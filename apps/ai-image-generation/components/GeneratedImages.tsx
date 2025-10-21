"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import type { BlobMetadata } from "@shelby-protocol/sdk/node";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@shelby-protocol/ui/components/card";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getShelbyClient } from "@/utils/client";

const extractFileName = (blobName: string): string => {
  return blobName.substring(66);
};

export const GeneratedImages = ({
  refreshTrigger,
}: {
  refreshTrigger: number;
}) => {
  const { account } = useWallet();
  const [images, setImages] = useState<BlobMetadata[]>([]);
  const [loading, setLoading] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshTrigger is intentionally used to trigger re-fetch
  useEffect(() => {
    if (!account) {
      setImages([]);
      return;
    }

    const fetchBlobs = async () => {
      setLoading(true);
      try {
        const allBlobs = await getShelbyClient().coordination.getAccountBlobs({
          account: account.address,
        });

        // Filter to only show PNG images
        const pngBlobs = allBlobs.filter((blob) =>
          extractFileName(blob.name).endsWith(".png"),
        );

        setImages(pngBlobs);
      } catch (error) {
        console.error("Failed to fetch blobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlobs();
  }, [account, refreshTrigger]);

  if (!account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Your Generated Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Connect your wallet to view your generated images
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Your Generated Images
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-8">
            Loading your images...
          </p>
        ) : images.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No images generated yet. Create your first AI image above!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={`${
                      process.env.NEXT_PUBLIC_SHELBY_API_URL
                    }/v1/blobs/${item.owner.toString()}/${extractFileName(
                      item.name,
                    )}`}
                    alt={item.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      borderRadius: "4px",
                    }}
                    width={100}
                    height={100}
                    onError={(e) => {
                      console.error("Image failed to load:", e);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium line-clamp-2">
                    <a
                      href={`https://explorer.shelby.xyz/shelbynet/account/${item.owner.toString()}/blobs?name=${encodeURIComponent(
                        extractFileName(item.name),
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      {extractFileName(item.name)}
                    </a>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
