"use client";

export interface PlatformBadgeProps {
    platform: string;
    color?: string;
}

const platformColors: Record<string, string> = {
    youtube: "#FF0000",
    tiktok: "#010101",
    instagram: "#E1306C",
    facebook: "#1877F2",
    twitter: "#1DA1F2",
    capcut: "#00E5FF",
    spotify: "#1DB954",
    pinterest: "#E60023",
    douyin: "#FE2C55",
    bilibili: "#00A1D6",
    snackvideo: "#FFFC00",
    terabox: "#2B7CE9",
    scribd: "#1A7BBA",
    mediafire: "#326CE5",
    applemusic: "#FA243C",
    soundcloud: "#FF5500",
    threads: "#000000",
};

export default function PlatformDetector({ platform, color }: PlatformBadgeProps) {
    const bg = color || platformColors[platform.toLowerCase()] || "#6b7280";
    return (
        <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white uppercase tracking-wider shadow-sm"
            style={{ backgroundColor: bg }}
        >
            {platform}
        </span>
    );
}
