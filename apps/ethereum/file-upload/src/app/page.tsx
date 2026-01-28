import { FileUploader } from "@/components/FileUploader";
import { Header } from "@/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
              Shelby File Storage
            </h1>
            <p className="text-slate-400 text-lg">
              Upload files to decentralized storage using your Ethereum wallet
            </p>
          </div>
          <FileUploader />
        </div>
      </main>
    </div>
  );
}
