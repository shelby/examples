"use client";

import { motion, type Transition } from "motion/react";
import useMeasure from "react-use-measure";

interface ExpandingContainerProps {
  children: React.ReactNode;
  className?: string;
  initialHeight?: number;
  transition?: Transition;
  debounce?: number;
}

export function ExpandingContainer({
  children,
  className,
  initialHeight,
  transition = { duration: 0.4, ease: [0.19, 1, 0.22, 1] },
  debounce,
}: ExpandingContainerProps) {
  const [contentRef, { height }] = useMeasure({ offsetSize: true, debounce });

  return (
    <motion.div
      className={"overflow-hidden"}
      initial={{ height: initialHeight ?? "auto" }}
      animate={{ height }}
      transition={transition}
    >
      <div ref={contentRef} className={className}>
        {children}
      </div>
    </motion.div>
  );
}
