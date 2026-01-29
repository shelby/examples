"use client";

import { FileUpload } from "./components/file-upload";
import { Header } from "./components/header";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg1 text-foreground">
      <Header />

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6">
        <section className="space-y-3">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            Solana File Upload
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Upload files to Shelby
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted">
            Connect your Solana wallet and upload files to decentralized
            storage. Files are stored on Shelby Protocol.
          </p>
        </section>

        <FileUpload />
      </main>
    </div>
  );
}
