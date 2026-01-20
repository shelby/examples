"use client";

import { memo, useEffect, useState } from "react";
import Confetti from "react-confetti";

const CONFETTI_COLORS = [
  "oklch(0.55 0.25 340)", // accent-1: bright pink
  "oklch(0.45 0.25 300)", // accent-5: purple/magenta
  "oklch(0.55 0.20 195)", // accent-9: cyan
  "oklch(0.45 0.24 313.20)", // accent-3: purple-pink
  "oklch(0.34 0.22 270.63)", // accent-7: deep purple
];

interface HowItWorksProps {
  isWalletConnected: boolean;
  hasStorageAccount: boolean;
  isFunded: boolean;
  hasUploadedBlob: boolean;
}

const steps = [
  {
    title: "Connect Wallet",
    description: "Connect your Solana wallet (Phantom, Solflare)",
  },
  {
    title: "Create Storage Account",
    description: "Generate a keypair and derive a Shelby storage account",
  },
  {
    title: "Fund Account",
    description: "Add ShelbyUSD (upload fees) and APT (transaction fees)",
  },
  {
    title: "Upload Blobs",
    description: "Upload files to Shelby decentralized storage",
  },
];

export const HowItWorks = memo(function HowItWorks({
  isWalletConnected,
  hasStorageAccount,
  isFunded,
  hasUploadedBlob,
}: HowItWorksProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);

  const completedSteps = [
    isWalletConnected,
    hasStorageAccount,
    isFunded,
    hasUploadedBlob,
  ];

  const allComplete = completedSteps.every(Boolean);

  // Handle window resize for confetti
  useEffect(() => {
    const updateSize = () => {
      // Use the larger of document height or 3x viewport to ensure confetti falls far enough
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight,
        window.innerHeight * 3,
      );
      setWindowSize({
        width: window.innerWidth,
        height: docHeight,
      });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Trigger confetti when all steps complete
  useEffect(() => {
    if (allComplete && !confettiTriggered) {
      // Recalculate size when triggering to get accurate document height
      // Use the larger of document height or 3x viewport to ensure confetti falls far enough
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight,
        window.innerHeight * 3,
      );
      setWindowSize({
        width: window.innerWidth,
        height: docHeight,
      });
      setShowConfetti(true);
      setConfettiTriggered(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [allComplete, confettiTriggered]);

  // Reset confetti trigger when steps reset
  useEffect(() => {
    if (!allComplete) {
      setConfettiTriggered(false);
    }
  }, [allComplete]);

  return (
    <>
      {showConfetti && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            overflow: "visible",
            zIndex: 9999,
          }}
        >
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={200}
            colors={CONFETTI_COLORS}
            style={{ position: "absolute", top: 0, left: 0 }}
          />
        </div>
      )}
      <div className="glass-neon rounded-xl p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((step, index) => {
            const isComplete = completedSteps[index];
            // Current step is the first incomplete step
            const currentStepIndex = completedSteps.findIndex((c) => !c);
            const isCurrent = index === currentStepIndex;

            // Determine circle styles based on state (neon colors)
            let circleClasses: string;
            if (isComplete) {
              circleClasses =
                "bg-[oklch(0.70_0.30_340_/_0.2)] text-[oklch(0.70_0.30_340)] ring-2 ring-[oklch(0.70_0.30_340_/_0.5)]";
            } else if (isCurrent) {
              circleClasses =
                "bg-[oklch(0.75_0.20_195_/_0.1)] text-[oklch(0.75_0.20_195)] ring-2 ring-[oklch(0.75_0.20_195)]";
            } else {
              circleClasses = "bg-muted/50 text-muted-foreground";
            }

            // Determine text styles based on state
            let titleClasses: string;
            let descriptionClasses: string;
            if (isComplete || isCurrent) {
              titleClasses = "text-foreground";
              descriptionClasses = "text-muted-foreground";
            } else {
              titleClasses = "text-text-disabled";
              descriptionClasses = "text-text-disabled/70";
            }

            return (
              <div key={step.title} className="text-center p-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 font-semibold transition-all duration-300 ${circleClasses}`}
                >
                  {isComplete ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-labelledby={`step-complete-${index}`}
                    >
                      <title id={`step-complete-${index}`}>Step complete</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <h3
                  className={`font-medium text-sm transition-colors duration-300 ${titleClasses}`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-xs mt-1 transition-colors duration-300 ${descriptionClasses}`}
                >
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
});
