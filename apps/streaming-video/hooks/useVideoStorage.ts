import { useState, useEffect } from 'react';

export interface VideoMetadata {
    blobName: string;
    description: string;
    price: string;
    timestamp: number;
    owner?: string;
}

const DEFAULT_VIDEOS: VideoMetadata[] = [
    {
        blobName: "demo_vid_01",
        description: "Shelby Protocol Introduction - The future of decentralized streaming",
        price: "0.1",
        timestamp: Date.now(),
        owner: "0x1"
    },
    {
        blobName: "nature_4k",
        description: "Relaxing Nature Sounds & 4K Scenery",
        price: "0.5",
        timestamp: Date.now() - 100000,
        owner: "0x1"
    }
];

export const useVideoStorage = (trigger?: number) => {
    const [videos, setVideos] = useState<VideoMetadata[]>([]);

    useEffect(() => {
        loadVideos();
    }, [trigger]); // Re-load when trigger changes, or on mount

    const loadVideos = () => {
        try {
            const stored = localStorage.getItem('shelby_videos_v2');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setVideos(parsed);
                } else {
                    // Invalid format, reset
                    setVideos(DEFAULT_VIDEOS);
                }
            } else {
                setVideos(DEFAULT_VIDEOS);
                localStorage.setItem('shelby_videos_v2', JSON.stringify(DEFAULT_VIDEOS));
            }
        } catch (e) {
            console.error("Storage error:", e);
            setVideos(DEFAULT_VIDEOS);
        }
    };

    const addVideo = (blobName: string, description: string, price: string, owner: string) => {
        const newVideo: VideoMetadata = {
            blobName,
            description,
            price,
            owner,
            timestamp: Date.now()
        };

        // Always read fresh state from localStorage to ensure consistency
        const currentStored = localStorage.getItem('shelby_videos_v2');
        let currentVideos = currentStored ? JSON.parse(currentStored) : DEFAULT_VIDEOS;
        if (!Array.isArray(currentVideos)) currentVideos = DEFAULT_VIDEOS;

        const updatedVideos = [newVideo, ...currentVideos];
        setVideos(updatedVideos);
        localStorage.setItem('shelby_videos_v2', JSON.stringify(updatedVideos));
    };

    const removeVideo = (blobName: string) => {
        const currentStored = localStorage.getItem('shelby_videos_v2');
        let currentVideos: VideoMetadata[] = currentStored ? JSON.parse(currentStored) : videos;
        if (!Array.isArray(currentVideos)) currentVideos = DEFAULT_VIDEOS;

        const updatedVideos = currentVideos.filter(v => v.blobName !== blobName);
        setVideos(updatedVideos);
        localStorage.setItem('shelby_videos_v2', JSON.stringify(updatedVideos));
    };

    return { videos, addVideo, removeVideo };
};
