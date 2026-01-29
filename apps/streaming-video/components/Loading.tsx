"use client";

import { Loader2 } from "lucide-react";

export function LoadingSpinner({ text = "Processing..." }: { text?: string }) {
    return (
        <div className="absolute inset-0 flex flex-col gap-3 items-center justify-center bg-black/80 backdrop-blur-sm z-50 text-white rounded-2xl">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="font-medium animate-pulse">{text}</p>
        </div>
    );
}
