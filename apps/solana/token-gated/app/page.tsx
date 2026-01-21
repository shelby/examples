"use client";

import { FileUpload } from "./components/file-upload";
import { Header } from "./components/header";
import { PurchaseCard } from "./components/purchase-card";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg1 text-foreground">
      <Header />

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6">
        <section className="space-y-3">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            Token-gated files on Shelby
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Upload and buy encrypted files
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted">
            Upload encrypted files to sell, or purchase access to existing files
            with SOL. All files are encrypted end-to-end.
          </p>
        </section>

        <FileUpload />

        <section id="files" className="space-y-4">
          <p className="text-lg font-semibold">Files for sale</p>
          <PurchaseCard />
        </section>
      </main>
    </div>
  );
}
