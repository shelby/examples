import { useCallback, useState } from "react";

interface UseGenerateImageReturn {
  generateImage: (prompt: string) => Promise<Buffer>;
  isGenerating: boolean;
  error: string | null;
}

export const useGenerateImage = (): UseGenerateImageReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(async (prompt: string): Promise<Buffer> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Image generation failed");
      }

      // Get the image as a buffer
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Image generation failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateImage,
    isGenerating,
    error,
  };
};
