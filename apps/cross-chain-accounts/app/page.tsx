"use client";

import { useState } from "react";
import { AccountBlobs } from "@/components/AccountBlobs";
import { FileUpload } from "@/components/FileUpload";
import { Header } from "@/components/Header";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen p-5">
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto space-y-6">
          <FileUpload onUploadSuccess={handleUploadSuccess} />
          <AccountBlobs refreshTrigger={refreshTrigger} />
        </div>
      </main>
    </div>
  );
}
