"use client";

import { useState, useRef } from "react";
import { Button } from "@shelby-protocol/ui/components/button";
import { Input } from "@shelby-protocol/ui/components/input";
import { Check, Loader2, UploadCloud } from "lucide-react";
import { useUploadVideo } from "@/hooks/useUploadVideo";
import { useVideoStorage } from "@/hooks/useVideoStorage";
import { toast } from "sonner";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export const VideoUploader = ({ onSuccess }: { onSuccess?: () => void }) => {
    const [file, setFile] = useState<File | null>(null);
    const [price, setPrice] = useState("0.1");
    const [description, setDescription] = useState("");
    const [uploadedBlobName, setUploadedBlobName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { uploadVideo, isUploading } = useUploadVideo();
    const { addVideo } = useVideoStorage(); // No trigger needed here
    const { account } = useWallet();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadedBlobName(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a video file first.");
            return;
        }

        try {
            const result = await uploadVideo(file);
            if (result && result.blobName) {
                setUploadedBlobName(result.blobName);

                if (account?.address) {
                    addVideo(result.blobName, description || "Uploaded Video", price, account.address.toString());
                }

                if (onSuccess) {
                    onSuccess();
                }

                // Reset form
                setFile(null);
                setDescription("");
                if (fileInputRef.current) fileInputRef.current.value = "";
                toast.success("Video uploaded successfully!");
            }
        } catch (e) {
            // Error handling is inside default useUploadVideo hook mostly, but if it throws:
            console.error(e);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <UploadCloud className="w-6 h-6 text-blue-400" />
                Upload New Video
            </h2>

            <div className="space-y-6">
                <div
                    className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="video/*"
                        className="hidden"
                    />
                    {file ? (
                        <div className="text-green-400 font-medium animate-in fade-in zoom-in-95">
                            Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </div>
                    ) : (
                        <div className="text-gray-400 group-hover:text-blue-400 transition-colors">
                            <UploadCloud className="w-12 h-12 mx-auto mb-3 opacity-50 group-hover:scale-110 transition-transform" />
                            <p>Click to select a video file (MP4, WebM)</p>
                        </div>
                    )}
                </div>

                {uploadedBlobName && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-4 animate-in fade-in hover:bg-green-500/15 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                            <Check className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-green-400 font-medium text-sm">Video Uploaded Successfully!</p>
                            <p className="text-xs text-green-500/60 truncate mt-0.5">Ready to stream on ShelbyNet</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUploadedBlobName(null)}
                            className="text-xs font-normal text-green-400 hover:text-green-300 hover:bg-green-500/20"
                        >
                            Upload Another
                        </Button>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Price (APT)</label>
                        <Input
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Description</label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Short description..."
                            className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                        />
                    </div>
                </div>

                <Button
                    onClick={handleUpload}
                    disabled={isUploading || !file}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg shadow-lg shadow-blue-900/20 transition-all hover:shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Uploading to Shelby...
                        </>
                    ) : (
                        "Upload Video"
                    )}
                </Button>
            </div>
        </div>
    );
};
