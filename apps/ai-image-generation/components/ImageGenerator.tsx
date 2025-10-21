"use client";

import {
  type AccountAddress,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { Button } from "@shelby-protocol/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@shelby-protocol/ui/components/card";
import { Input } from "@shelby-protocol/ui/components/input";
import { toast } from "@shelby-protocol/ui/components/sonner";
import { useState } from "react";
import { useGenerateImage } from "@/hooks/useGenerateImage";
import { useUploadImageToShelby } from "@/hooks/useUploadImageToShelby";

interface GeneratedImage {
  ok: boolean;
  prompt: string;
  engine: string;
  blob: {
    url: string;
    account: AccountAddress;
    blobName: string;
  };
  metadata?: {
    url: string;
    account: AccountAddress;
    blobName: string;
  };
}

interface ImageGeneratorProps {
  onImageGenerated?: (image: GeneratedImage) => void;
}

export const ImageGenerator = ({ onImageGenerated }: ImageGeneratorProps) => {
  const { account, connected } = useWallet();
  const [prompt, setPrompt] = useState("");

  const { generateImage, isGenerating } = useGenerateImage();
  const { uploadImageToShelby, uploadMetadataToShelby, isUploading } =
    useUploadImageToShelby();

  const isProcessing = isGenerating || isUploading;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (!connected || !account) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      // Step 1: Generate the image using AI
      toast.loading("Generating image...");
      const imageBuffer = await generateImage(prompt);

      const blobName = `${prompt.slice(0, 50)}_${Math.random()
        .toString(36)
        .slice(2)}`;

      // Step 2: Upload to Shelby using connected wallet
      toast.loading("Uploading image to Shelby...");
      const uploadedImage = await uploadImageToShelby(imageBuffer, blobName);

      toast.loading("Uploading metadata to Shelby...");
      const metadata = {
        prompt,
        engine: "openai",
        model: "dall-e-3",
        createdAt: new Date().toISOString(),
        creator: uploadedImage.account.toString(),
        image: uploadedImage,
      };
      const uploadedMetadata = await uploadMetadataToShelby(metadata, blobName);

      const result: GeneratedImage = {
        ok: true,
        prompt,
        engine: "openai",
        blob: uploadedImage,
        metadata: uploadedMetadata,
      };

      onImageGenerated?.(result);
      toast.success("Image generated and uploaded successfully!");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate image",
      );
    } finally {
      toast.dismiss();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          AI Image Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !isProcessing && handleGenerate()
            }
            disabled={isProcessing}
          />
          <Button
            onClick={handleGenerate}
            disabled={isProcessing || !prompt.trim() || !connected}
          >
            {isProcessing
              ? isGenerating
                ? "Generating..."
                : "Uploading..."
              : "Generate & Upload"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
