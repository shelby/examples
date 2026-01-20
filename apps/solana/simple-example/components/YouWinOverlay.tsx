"use client";

import { useEffect, useState } from "react";

interface YouWinOverlayProps {
  show: boolean;
  onComplete?: () => void;
}

export function YouWinOverlay({ show, onComplete }: YouWinOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showText, setShowText] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setShowText(false);
      setIsFadingOut(false);

      // Show text after backdrop fades in (300ms)
      const textTimer = setTimeout(() => {
        setShowText(true);
      }, 300);

      // Start fade out after 2.5 seconds
      const fadeOutTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 2500);

      // Complete and hide after 3 seconds total
      const completeTimer = setTimeout(() => {
        setIsVisible(false);
        setShowText(false);
        setIsFadingOut(false);
        onComplete?.();
      }, 3000);

      return () => {
        clearTimeout(textTimer);
        clearTimeout(fadeOutTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 pointer-events-none ${
        isFadingOut ? "you-win-overlay-fade-out" : "you-win-overlay-fade-in"
      }`}
    >
      {showText && (
        <h1
          className={`you-win-text you-win-glow text-8xl md:text-9xl font-black tracking-tight select-none ${
            isFadingOut ? "you-win-text-fade-out" : "you-win-text-fade-in"
          }`}
        >
          YOU WIN
        </h1>
      )}
    </div>
  );
}
