"use client";

import { useState, useRef } from "react";
import { Header } from "@/components/Header";
import { VideoPlayer } from "@/components/VideoPlayer";
import { VideoUploader } from "@/components/VideoUploader";
import { LoadingSpinner } from "@/components/Loading";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "sonner";
import { PlayCircle, Upload, ListVideo, User, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useVideoStorage, VideoMetadata } from "@/hooks/useVideoStorage";

export default function Home() {
  const { signAndSubmitTransaction, account } = useWallet();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Navigation State
  const [mainTab, setMainTab] = useState<"watch" | "upload">("watch");
  const [filterTab, setFilterTab] = useState<"all" | "my">("all");

  // App State
  const [isLocked, setIsLocked] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [activeVideo, setActiveVideo] = useState<VideoMetadata | null>(null);

  // Refresh Mechanism
  const [refreshKey, setRefreshKey] = useState(0);
  const { videos, removeVideo } = useVideoStorage(refreshKey);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const filteredVideos = filterTab === 'all'
    ? videos
    : videos.filter(v => account?.address && v.owner === account.address.toString());

  // Carousel Logic
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8; // Scroll 80% screen width
      container.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getPlayUrl = (video: VideoMetadata) => {
    // If video has a direct URL, use it
    if (video.url) {
      return video.url;
    }
    // If blobName is already a full URL, use it directly
    if (video.blobName.startsWith('http')) {
      return video.blobName;
    }
    // Otherwise, construct Shelby API URL
    const owner = video.owner || "0x1";
    return `https://api.shelbynet.shelby.xyz/shelby/v1/blobs/${owner}/${video.blobName}`;
  };

  const getVideoTitle = (blobName: string) => {
    // Remove timestamp suffix (last segment after final hyphen) and format
    const nameWithoutTimestamp = blobName.replace(/-\d+$/, '');
    return nameWithoutTimestamp.replace(/_/g, ' ');
  };

  const handleUnlock = async () => {
    if (!account) {
      toast.error("Please connect your wallet first!");
      return;
    }

    if (!activeVideo?.owner) {
      toast.error("Video owner information is missing. Cannot process payment.");
      return;
    }

    try {
      setIsLoading(true);
      setLoadingText("Processing Payment on Aptos...");

      // Use string-based calculation to avoid floating point precision errors
      const priceFloat = parseFloat(activeVideo.price || "0");
      if (isNaN(priceFloat) || priceFloat <= 0) {
        toast.error("Invalid video price.");
        setIsLoading(false);
        return;
      }
      const amountInOctas = Math.round(priceFloat * 100000000);

      const transactionResponse = await signAndSubmitTransaction({
        data: {
          function: "0x1::coin::transfer",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [activeVideo.owner, amountInOctas],
        },
      });

      console.log("Transaction Hash:", transactionResponse.hash);

      // NOTE: This is a demo implementation. In production, you should:
      // 1. Wait for transaction confirmation on-chain
      // 2. Verify the payment was successful and went to the correct address
      // 3. Only unlock content after verification
      // Current implementation unlocks immediately after transaction submission

      setIsLocked(false);
      toast.success("Content Unlocked! Transaction submitted: " + transactionResponse.hash.slice(0, 10) + "...");

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Payment failed. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingText(""); // Clear loading text to prevent stale state
    }
  };

  const handleSelectVideo = (video: VideoMetadata) => {
    setActiveVideo(video);
    setIsLocked(true);
    setLoadingText(""); // Clear any stale loading text
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans">
      <Header />
      {isLoading && <LoadingSpinner text={loadingText} />}

      <main className="w-[90%] mx-auto py-8">

        {/* Main Navigation Tabs */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => { setMainTab("watch"); setActiveVideo(null); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wider transition-all duration-300 ${mainTab === "watch"
              ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
          >
            <PlayCircle className="w-5 h-5" />
            Watch Content
          </button>
          <button
            onClick={() => setMainTab("upload")}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wider transition-all duration-300 ${mainTab === "upload"
              ? "bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.5)]"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
          >
            <Upload className="w-5 h-5" />
            Creator Studio
          </button>
        </div>

        {/* Content Area */}
        {mainTab === "watch" ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {activeVideo ? (
              /* Player Mode */
              <div className="max-w-4xl mx-auto">
                <button
                  onClick={() => setActiveVideo(null)}
                  className="mb-4 text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                >
                  ← Back to Library
                </button>
                <div className="bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                  <VideoPlayer
                    url={getPlayUrl(activeVideo)}
                    isLocked={isLocked}
                    onUnlock={handleUnlock}
                    loadingText={loadingText}
                    title={getVideoTitle(activeVideo.blobName)}
                    description={activeVideo.description}
                    price={activeVideo.price}
                  />
                </div>
              </div>
            ) : (
              /* Gallery Mode - Carousel Layout */
              <>
                {/* Sub-Filters for Gallery */}
                <div className="flex items-center gap-4 border-b border-gray-800 pb-4 mb-6">
                  <button
                    onClick={() => setFilterTab("all")}
                    className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${filterTab === 'all' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300'
                      }`}
                  >
                    <ListVideo className="w-4 h-4" /> All Videos
                  </button>
                  <button
                    onClick={() => setFilterTab("my")}
                    className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${filterTab === 'my' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300'
                      }`}
                  >
                    <User className="w-4 h-4" /> My Videos
                  </button>
                </div>

                {/* Carousel Container */}
                <div className="relative group/carousel">

                  {/* Left Arrow */}
                  {filteredVideos.length > 5 && (
                    <button
                      onClick={() => scroll('left')}
                      className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/80 text-white rounded-full border border-white/20 shadow-xl hover:bg-white hover:text-black transition-all opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  )}

                  {/* Scrollable Row */}
                  <div
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto gap-4 scroll-smooth no-scrollbar pb-8 pt-2 px-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {filteredVideos.map((vid, idx) => {
                      const isOwner = account?.address && vid.owner === account.address.toString();

                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectVideo(vid)}
                          className="
                            shrink-0 
                            w-full sm:w-[calc(50%-8px)] md:w-[calc(33.33%-11px)] lg:w-[calc(25%-12px)] xl:w-[calc(20%-13px)]
                            group aspect-square bg-black border border-white/10 hover:border-blue-500/50 rounded-2xl overflow-hidden cursor-pointer flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1
                          "
                        >
                          {/* Top 20%: Actions & Price */}
                          <div className="h-[20%] w-full px-4 flex items-center justify-between bg-gradient-to-b from-gray-900 to-black">
                            <div>
                              {isOwner && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Delete this video?")) {
                                      removeVideo(vid.blobName);
                                      handleRefresh();
                                      toast.success("Deleted");
                                    }
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <div className="bg-white/10 border border-white/5 text-blue-300 text-[10px] font-bold px-2 py-1 rounded-md">
                              {vid.price} APT
                            </div>
                          </div>

                          {/* Middle 60%: Video Thumbnail */}
                          <div className="h-[60%] w-full relative bg-gray-900 group-hover:bg-gray-800 transition-colors overflow-hidden">
                            <video
                              src={getPlayUrl(vid) + "#t=5.0"}
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                              muted
                              playsInline
                              preload="metadata"
                              onMouseOver={e => e.currentTarget.play().catch(() => { })}
                              onMouseOut={e => e.currentTarget.pause()}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                              <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center shadow-xl border border-white/20">
                                <PlayCircle className="w-6 h-6" />
                              </div>
                            </div>
                          </div>

                          {/* Bottom 20%: Info */}
                          <div className="h-[20%] w-full px-4 flex flex-col justify-center bg-gradient-to-t from-gray-900 to-black border-t border-white/5">
                            <h3 className="text-gray-200 font-bold truncate text-sm leading-tight group-hover:text-blue-400 transition-colors">
                              {getVideoTitle(vid.blobName)}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              <span className="font-mono truncate">
                                {vid.owner ? `${vid.owner.slice(0, 4)}...${vid.owner.slice(-4)}` : 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Arrow */}
                  {filteredVideos.length > 5 && (
                    <button
                      onClick={() => scroll('right')}
                      className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/80 text-white rounded-full border border-white/20 shadow-xl hover:bg-white hover:text-black transition-all opacity-0 group-hover/carousel:opacity-100"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}
                </div>

                {filteredVideos.length === 0 && (
                  <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl bg-white/5">
                    <p className="text-xl text-gray-400 mb-2">No videos found here</p>
                    {filterTab === 'my' ? (
                      <p className="text-gray-500">You haven't uploaded any videos yet.</p>
                    ) : (
                      <p className="text-gray-500">Be the first to upload content!</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <VideoUploader onSuccess={handleRefresh} />
          </div>
        )}

      </main>
    </div>
  );
}
