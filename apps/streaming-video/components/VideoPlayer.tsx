"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ReactPlayer to avoid SSR hydration issues
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface VideoPlayerProps {
  url: string;
  isLocked: boolean;
  onUnlock: () => void;
  poster?: string;
  loadingText?: string;
  title?: string;
  description?: string;
  price?: string;
}

export const VideoPlayer = ({ url, isLocked, onUnlock, poster, loadingText, title, description, price }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Auto-play logic when unlocked
    if (!isLocked) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [isLocked]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl group">
      {isLocked && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6 text-center">
          {loadingText ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-blue-200 font-medium text-lg">{loadingText}</p>
            </div>
          ) : (
            <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-2">{title || "Premium Content"}</h3>
              {description && <p className="text-gray-400 text-sm mb-6 line-clamp-2">{description}</p>}

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                <p className="text-blue-300 text-sm font-semibold uppercase tracking-wider mb-1">Unlock Price</p>
                <p className="text-3xl font-bold text-white">{price || "0.1"} APT</p>
              </div>

              <button
                onClick={onUnlock}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="text-xl">🔓</span> Unlock Now
              </button>
            </div>
          )}
        </div>
      )}

      <div className={`w-full h-full ${isLocked ? "pointer-events-none filter blur-sm" : ""}`}>
        <ReactPlayer
          url={url}
          width="100%"
          height="100%"
          controls={!isLocked}
          playing={isPlaying}
          light={poster} // Show poster as preview image
          onReady={() => console.log("VideoPlayer: Ready to play", url)}
          onStart={() => console.log("VideoPlayer: Started playing")}
          onError={(e) => console.error("VideoPlayer: Error playing video", e, url)}
          playIcon={
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          }
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload', // Disable download button
                crossOrigin: 'anonymous'
              },
              forceVideo: true // Force usage of video tag if extension is missing
            }
          }}
        />
      </div>
    </div>
  );
};
