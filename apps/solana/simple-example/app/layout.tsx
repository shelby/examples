import { Toaster } from "@shelby-protocol/ui/components";
import localFont from "next/font/local";
import { WalletProvider } from "@/components/WalletProvider";
import "./globals.css";
import type { Metadata } from "next";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Shelby Solana Kit Simple Example",
  description: "Upload blobs to Shelby using your Solana wallet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen`}
      >
        {/* Animated background blobs */}
        <div className="blob-container" aria-hidden="true">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          <div className="blob blob-4" />
          <div className="blob blob-5" />
          <div className="blob blob-6" />
          <div className="blob blob-7" />
          <div className="blob blob-8" />
          <div className="blob blob-9" />
          <div className="blob blob-10" />
          <div className="blob blob-11" />
          <div className="blob blob-12" />
          <div className="blob blob-13" />
          <div className="blob blob-14" />
          <div className="blob blob-15" />
        </div>

        <WalletProvider>
          {children}
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  );
}
