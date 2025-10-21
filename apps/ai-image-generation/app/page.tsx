"use client";

import { useState } from "react";
import { GeneratedImages } from "@/components/GeneratedImages";
import { Header } from "@/components/Header";
import { ImageGenerator } from "@/components/ImageGenerator";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleImageGenerated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen p-5">
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">AI Image Generation</h1>
            <p className="text-lg text-muted-foreground">
              Generate images using AI and store them on the Shelby protocol
            </p>
          </div>

          <ImageGenerator onImageGenerated={handleImageGenerated} />
          <GeneratedImages refreshTrigger={refreshTrigger} />
        </div>
      </main>
    </div>
  );
}
